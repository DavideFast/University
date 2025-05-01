#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <math.h>
#include <endian.h>
#define ETH_P_IP 0x0800


struct connection{
	__u32 ip_source;
        __u32 ip_dest;
	__u16 port_source;
	__u16 port_dest;
};

// Define the ring buffer map
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 26);  // 16 MB buffer
} rb SEC(".maps");

struct inner_map{
   __uint(type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,unsigned char[12]);
   __type(value, unsigned long);
} inner_map SEC (".maps");

struct __attribute__((__packed__)) tcp_header_reader{
    __u8 kind;
 };

struct __attribute__((__packed__))  tcp_header_timestamps{ //Il packed serve per evitare che la struttura venga formattata ed evitare che non salvi i file
    __u8 kind;
    __u8 length;
    __u32 tval;
    __u32 tsecr;
};

struct latency_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value, unsigned long);
} latency_map SEC (".maps");

struct egress_seq_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u32);
} egress_seq_map SEC (".maps");

struct ingress_seq_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u32);
} ingress_seq_map SEC (".maps");

struct egress_ack_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u32);
} egress_ack_map SEC (".maps");

struct ingress_ack_map{
   __uint(type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u32);
   __uint(pinning, LIBBPF_PIN_BY_NAME);
} ingress_ack_map SEC (".maps");

struct egress_payload_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int);
} egress_payload_map SEC (".maps");

struct ingress_payload_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int);
} ingress_payload_map SEC (".maps");

struct tsval_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int);
} tsval_map SEC (".maps");

struct tsecr_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int);
} tsecr_map SEC (".maps");

struct timestampA_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int);
} timestampA_map SEC (".maps");

struct timestampB_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int);
} timestampB_map SEC (".maps");

// Helper function to check if the packet is TCP
static bool is_tcp(struct ethhdr *eth, void *data_end){

    // Ensure Ethernet header is within bounds
    if ((void *)(eth + 1) > data_end){
   	    bpf_printk("Fuori eth bound"); 
        return false;
    }

    // Only handle IPv4 packets
    if (bpf_ntohs(eth->h_proto) != ETH_P_IP){
	    bpf_printk("Pacchetto non IPv4");
        return false;
    }

    struct iphdr *ip = (struct iphdr *)(eth + 1);


    // Ensure IP header is within bounds
    if ((void *)(ip + 1) > data_end){
	    bpf_printk("Fuori ip bound");
        return false;
    }
    // Check if the protocol is TCP
    if (ip->protocol != IPPROTO_TCP){
        bpf_printk("Pacchetto non TCP");
	    return false;
    }
    else
	    bpf_printk("Pacchetto TCP");

    return true;
}

SEC("xdp")
int xdp_pass(struct xdp_md *ctx)
{
    // Pointers to packet data
    void *dataa = (void *)(long)ctx->data;
    void *dataa_end = (void *)(long)ctx->data_end;
    int inizio = ctx -> data;
    long current_time = bpf_ktime_get_ns();
    bpf_printk("TIMESTAMP:______________%u___________________",current_time);
    bpf_printk("Inizio pacchetto in INGRESSO: %u",inizio);
    int fine = ctx -> data_end;
    int lengthPacket;
    lengthPacket = fine - inizio;
    bpf_printk("Lunghezza pacchetto: %u", lengthPacket);

    // Parse Ethernet header
    struct ethhdr *eth = dataa;

    // Check if the packet is a TCP packet
    if (!is_tcp(eth, dataa_end)) {
        return XDP_PASS;
    }
     
    bpf_printk("Il pacchetto IP inizia a %u", eth + 1);

    // Cast to IP header
    struct iphdr *ip = (struct iphdr *)(eth + 1);

    // Calculate IP header length
    int ip_hdr_len = ip->ihl * 4;
    if (ip_hdr_len < sizeof(struct iphdr)) {
        return XDP_PASS;
    }

    // Ensure IP header is within packet bounds
    if ((void *)ip + ip_hdr_len > dataa_end) {
	    bpf_printk("IP fuori bound");
        return XDP_PASS;
    }

    // Parse TCP header
    struct tcphdr *tcp = (struct tcphdr *)((unsigned char *)ip + ip_hdr_len);

    bpf_printk("Il pacchetto TCP inizia a %u", (unsigned char *)ip + ip_hdr_len);
    

    // Ensure TCP header is within packet bounds
    if ((void *)(tcp + 1) > dataa_end) {
        return XDP_PASS;
    }


    // Define the number of bytes you want to capture from the TCP header
    int offset = tcp -> doff;
    const int tcp_header_bytes = offset * 4;
    if((void *)(unsigned char*)tcp+tcp_header_bytes>dataa_end)
	    return XDP_PASS;
    bpf_printk("Il pacchetto TCP termina a %u", (unsigned char *)tcp + tcp_header_bytes);

    __u8 prova = 0;
    int count = 0;
    bool lock = false;
    struct tcp_header_reader *appoggio;
    //__u8 appoggio = 0;
    bpf_printk("IP: %pI4", &ip -> saddr);
    bpf_printk("Seq: %u", bpf_ntohl(tcp -> seq));
    bpf_printk("Ack: %u", bpf_ntohl(tcp -> ack));
    bpf_printk("Dimensione payload: %d",lengthPacket - 14 - 20 - tcp_header_bytes);
    while((prova !=8) && (count < 40) && (void *)((unsigned char *)tcp + 20 + count)<dataa_end){
	    appoggio = (struct tcp_header_reader *)((unsigned char *)tcp +20 +count);
	    //appoggio = *((unsigned char *)tcp + 20 + count);
        prova = appoggio->kind;
	    //prova = (__u8)*(((unsigned char *)tcp) + 20 + count);
	    //bpf_printk("Loop: %d", appoggio);
	    //bpf_printk("Attuale: %u", (void *)((unsigned char *)tcp + 20 + count));
	    //bpf_printk("Finale: %u", dataa_end);
	    //bpf_printk("Loop appoggio size: %d", sizeof(appoggio));
	    //bpf_printk("Loop prova size: %d", sizeof(prova));
        if(prova == 8){
            lock = true;
	        //bpf_printk("Eppur si muove");
	    }
        count = count + 1;
    }

    count = count - 1;


    if(lock && (void *)((unsigned char *)tcp + 20 + count + 10)<=dataa_end){
	    bpf_printk("-------------------------------------");
        struct tcp_header_timestamps *options = (struct tcp_header_timestamps *)((unsigned char *)tcp + 20 + count);	
	bpf_printk("Kind: %d", options -> kind);
        bpf_printk("Length %d", options -> length);
        bpf_printk("Tval: %u", bpf_ntohl(options->tval));
        bpf_printk("Tsecr: %u", bpf_ntohl(options->tsecr));
        bpf_printk("----------------------------------------------");
    }
    else{
	    bpf_printk("######################### Pacchetto non processato, motivo: %d, %d, %d", tcp_header_bytes, prova, lock);
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

    __u32 ip_source = ip->saddr;
    __u32 ip_destination = ip->daddr;
    __u16 port_source = bpf_ntohs(tcp -> source);
    __u16 port_destination = bpf_ntohs(tcp -> dest);
    bpf_printk("Port source: %u",port_source);
    bpf_printk("Port destination: %u", port_destination);
    struct connection connection;
    connection.ip_source = ip_source;
    connection.ip_dest = ip_destination;
    connection.port_source = port_source;
    connection.port_dest = port_destination;
    bpf_printk("IP: %u",ip_source);
    bpf_printk("ID connessione: %u", connection);

    int seq = bpf_ntohl(tcp -> seq);
    int ack_seq = bpf_ntohl(tcp -> ack_seq);
    long *value = bpf_map_lookup_elem(&inner_map, &connection);
    long *value_destination = bpf_map_lookup_elem(&inner_map,&connection);
    long init = 0;
    //bpf_printk("Risultato lookup %d",value);
    //bpf_printk("Risultato lookup %d", &value);
    //bpf_printk("Indirizzo destinatario %pI4",&keyd);
    if(value){
        long latency = current_time - *value;
	bpf_map_update_elem(&inner_map,&connection,&current_time,BPF_ANY);
        bpf_map_update_elem(&latency_map,&connection,&latency,BPF_ANY);
        bpf_map_update_elem(&ingress_seq_map,&connection,&seq,BPF_ANY);
        bpf_map_update_elem(&ingress_ack_map,&connection,&ack_seq,BPF_ANY);
        bpf_map_update_elem(&ingress_payload_map,&connection, &lengthPacket, BPF_ANY);
    }else{
        bpf_map_update_elem(&inner_map,&connection,&current_time,BPF_ANY);
        bpf_map_update_elem(&latency_map,&connection,&init,BPF_ANY);
        bpf_map_update_elem(&ingress_seq_map,&connection,&seq,BPF_ANY);
        bpf_map_update_elem(&ingress_ack_map,&connection,&ack_seq,BPF_ANY);
        bpf_map_update_elem(&ingress_payload_map,&connection, &lengthPacket, BPF_ANY);
    }

    bpf_ringbuf_submit(ringbuf_space, 0);
    bpf_printk("La fine del pacchetto si colloca a %u", ctx -> data_end);
    bpf_printk("________________________________________________________");
    return XDP_PASS;
}

char __license[] SEC("license") = "GPL";
