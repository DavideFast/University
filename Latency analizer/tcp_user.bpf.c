#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <math.h>
#include <endian.h>
#define ETH_P_IP 0x0800


// Define the ring buffer map
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 26);  // 16 MB buffer
} rb SEC(".maps");

struct inner_map{
   __uint(type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,__u32);
   __type(value, unsigned long);
} inner_map SEC (".maps");

struct tcp_header_reader{
    __u8 kind;
 };

struct __attribute__((__packed__))__ tcp_header_timestamps{ //Il packed serve per evitare che la struttura venga formattata ed evitare che non salvi i file
    __u8 kind;
    __u8 length;
    __u32 tval;
    __u32 tser;
};

struct latency_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,__u32);
   __type(value, unsigned long);
} latency_map SEC (".maps");

struct number_sequence_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,__u32);
   __type(value,__u32);
} number_sequence_map SEC (".maps");

struct number_ack_map{
   __uint(type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,__u32);
   __type(value,__u32);
} number_ack_map SEC (".maps");

struct dimension_packet_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,__u32);
   __type(value,int);
} dimension_packet_map SEC (".maps");

int be32_to_int(__u8 value){
	return (value << 24);
}

// Helper function to check if the packet is TCP
static bool is_tcp(struct ethhdr *eth, void *data_end){
    // bpf_printk("Il pacchetto contiene...");
    // Ensure Ethernet header is within bounds
    if ((void *)(eth + 1) > data_end)
        return false;

    // Only handle IPv4 packets
    if (bpf_ntohs(eth->h_proto) != ETH_P_IP){
        return false;
    }
    else
	bpf_printk("Non è un pacchetto IPv4");

    struct iphdr *ip = (struct iphdr *)(eth + 1);

    // Ensure IP header is within bounds
    if ((void *)(ip + 1) > data_end)
        return false;

    // Check if the protocol is TCP
    if (ip->protocol != IPPROTO_TCP){
        bpf_printk("Questo non è un pacchetto tcp");
	return false;
    }
    else
	bpf_printk("Questo è un pacchetto tcp");

    return true;
}

SEC("xdp")
int xdp_pass(struct xdp_md *ctx)
{
    // Pointers to packet data
    void *dataa = (void *)(long)ctx->data;
    void *dataa_end = (void *)(long)ctx->data_end;
    int inizio = ctx -> data;
    bpf_printk("L'inizio del pacchetto si colloca a %d",inizio);
    int fine = ctx -> data_end;
    int lengthPacket;
    lengthPacket = fine - inizio;
    bpf_printk("La lunghezza del pacchetto è %d", &lengthPacket);

    // Parse Ethernet header
    struct ethhdr *eth = dataa;

    // Check if the packet is a TCP packet
    if (!is_tcp(eth, dataa_end)) {
        return XDP_PASS;
    }

    bpf_printk("Il pacchetto ip inizia a %d", eth + 1);

    // Cast to IP header
    struct iphdr *ip = (struct iphdr *)(eth + 1);

    // Calculate IP header length
    int ip_hdr_len = ip->ihl * 4;
    if (ip_hdr_len < sizeof(struct iphdr)) {
        return XDP_PASS;
    }

    // Ensure IP header is within packet bounds
    if ((void *)ip + ip_hdr_len > dataa_end) {
        return XDP_PASS;
    }

    // Parse TCP header
    struct tcphdr *tcp = (struct tcphdr *)((unsigned char *)ip + ip_hdr_len);

    bpf_printk("Il pacchetto tcp inizia a %d", (unsigned char *)ip + ip_hdr_len);
    

    // Ensure TCP header is within packet bounds
    if ((void *)(tcp + 1) > dataa_end) {
        return XDP_PASS;
    }

    // Define the number of bytes you want to capture from the TCP header
    int offset = tcp -> doff;
    const int tcp_header_bytes = offset * 4;

    int prova=0;
    int count =0;
    bool lock = false;
    struct tcp_header_reader *appoggio;

    while(prova!=8 && count<8 && (void *)((unsigned char *)tcp + 20 + count)<dataa_end){
        appoggio = (struct tcp_header_reader *)((unsigned char *)tcp + 20 + count);
        prova = appoggio -> kind;
        if(prova == 8)
            lock = true;
        count = count + 1;
    }

    if(lock){
        count = count - 1;
        struct tcp_header_timestamps *options = (struct tcp_header_timestamps *)((unsigned char *)tcp + 20 + count);
        bpf_printk("Kind: %d", options -> kind);
        bpf_printk("Length %d", options -> length);
        bpf_printk("Tval: %u", bpf_ntohl(options -> tval));
        bpf_printk("Tsecr: %u", bpf_ntohl(options -> tsecr));
        bpf_printk("IP: %pI4", &ip -> saddr);
        bpf_printk("Seq: %u", bpf_ntohl(tcp -> seq));
        bpf_printk("Ack: %u", bpf_ntohl(tcp -> ack));
        bpf_printk("_________________________________");
    }


    // Ensure that the desired number of bytes does not exceed packet bounds
    if ((void *)tcp + tcp_header_bytes > dataa_end) {
        return XDP_PASS;
    }

    // Reserve space in the ring buffer
    void *ringbuf_space = bpf_ringbuf_reserve(&rb, 20, 0); //Al posto di 20 ci va messo se non funziona tcp_header_bytes con valore 32
    if (!ringbuf_space) {
        return XDP_PASS;  // If reservation fails, skip processing
    }

    // Copy the TCP header bytes into the ring buffer
    // Using a loop to ensure compliance with eBPF verifier
    for (int i = 0; i < 20; i++) {
        unsigned char byte = *((unsigned char *)tcp + i);
	((unsigned char *)ringbuf_space)[i] = byte;
    }

    int key = ip->saddr;
    int keyd = ip->daddr;
    int seq = bpf_ntohl(tcp -> seq);
    int ack_seq = bpf_ntohl(tcp -> ack_seq);
    long current_time = bpf_ktime_get_ns();
    long *value = bpf_map_lookup_elem(&inner_map, &key);
    long *value_destination = bpf_map_lookup_elem(&inner_map,&keyd);
    long init = 0;
    bpf_printk("Risultato lookup %d",value);
    bpf_printk("Risultato lookup %d", &value);
    bpf_printk("Indirizzo destinatario %pI4",&keyd);
    if(value){
        long latency = current_time - *value;
	bpf_map_update_elem(&inner_map,&key,&current_time,BPF_ANY);
        bpf_map_update_elem(&latency_map,&key,&latency,BPF_ANY);
        bpf_map_update_elem(&number_sequence_map,&key,&seq,BPF_ANY);
        bpf_map_update_elem(&number_ack_map,&key,&ack_seq,BPF_ANY);
        bpf_map_update_elem(&dimension_packet_map, &key, &lengthPacket, BPF_ANY);
    }else{
        bpf_map_update_elem(&inner_map,&key,&current_time,BPF_ANY);
        bpf_map_update_elem(&latency_map,&key,&init,BPF_ANY);
        bpf_map_update_elem(&number_sequence_map,&key,&seq,BPF_ANY);
        bpf_map_update_elem(&number_ack_map,&key,&ack_seq,BPF_ANY);
        bpf_map_update_elem(&dimension_packet_map,&key, &lengthPacket, BPF_ANY);
    }

    bpf_ringbuf_submit(ringbuf_space, 0);
    bpf_printk("La fine del pacchetto si colloca a %d", ctx -> data_end);

    return XDP_PASS;
}

char __license[] SEC("license") = "GPL";
