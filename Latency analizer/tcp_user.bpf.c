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

    // Ensure TCP header is within packet bounds
    if ((void *)(tcp + 1) > dataa_end) {
        return XDP_PASS;
    }

    // Define the number of bytes you want to capture from the TCP header
    const int tcp_header_bytes = 32;

    // Ensure that the desired number of bytes does not exceed packet bounds
    if ((void *)tcp + tcp_header_bytes > dataa_end) {
        return XDP_PASS;
    }

    // Reserve space in the ring buffer
    void *ringbuf_space = bpf_ringbuf_reserve(&rb, tcp_header_bytes, 0);
    if (!ringbuf_space) {
        return XDP_PASS;  // If reservation fails, skip processing
    }

    // Copy the TCP header bytes into the ring buffer
    // Using a loop to ensure compliance with eBPF verifier
    for (int i = 0; i < tcp_header_bytes; i++) {
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

  //bpf_printk("Il pacchetto dice %X", ringbuf_space);
    //bpf_printk("L'indirizzo IP è %pI4", ip->daddr);
    /*int mittente = tcp -> source;
    bpf_printk("Il numero di sequenza è %d", mittente);
    bpf_printk("Il mittente è %s", fields[0]);
    bpf_printk("Sequenza n°: %s", fields[4]);
    bpf_printk("STEP FINALE");*/
    // Submit the data to the ring buffer
    bpf_ringbuf_submit(ringbuf_space, 0);

    // Optional: Print a debug message
    //bpf_printk("Captured TCP header (%d bytes)", tcp_header_bytes);

    return XDP_PASS;
}

char __license[] SEC("license") = "GPL";
