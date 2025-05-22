#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <bpf/bpf_tracing.h>
#include <endian.h>
#include <math.h>


#define TC_ACT_OK 0
#define TC_ACT_SHOT 2
#define ETH_P_IP 0x0800

//Struttura di sostegno per identificare una connessione
struct connection{
	__u32 ip_source;
    __u32 ip_dest;
	__u16 port_source;
	__u16 port_dest;
};

//Struttura necessaria all'estrazione del campo opzioni del pacchetto TCP
struct __attribute__((__packed__)) tcp_header_reader{
    __u8 kind;
 };

struct __attribute__((__packed__))  tcp_header_timestamps{ //Il packed serve per evitare che la struttura venga formattata ed evitare che non salvi i file
    __u8 kind;
    __u8 length;
    __u32 tval;
    __u32 tsecr;
};

// Define the ring buffer map
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 26);  // 16 MB buffer
} ringbuffer SEC(".maps");


//Mappe eBPF necessarie al funzionamento
struct inner_map{
   __uint(type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,unsigned char[12]);
   __type(value, unsigned long);
} inner_map SEC (".maps");

struct latency_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value, unsigned long);
} latency_map SEC (".maps");

struct timestampA_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u64);
} timestampA_map SEC (".maps");

struct timestampB_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u64);
} timestampB_map SEC (".maps");


// Helper function to check if the packet is TCP
static bool is_tcp(struct ethhdr *eth, void *data_end){
    // bpf_printk("Il pacchetto contiene...");
    // Ensure Ethernet header is within bounds
    if ((void *)(eth + 1) > data_end){
        bpf_printk("Pacchetto corrotto");
        return false;
    }

    // Only handle IPv4 packets
    if (bpf_ntohs(eth->h_proto) != ETH_P_IP){
        bpf_printk("Pacchetto non IPv4");
        return false;
    }
    else
        bpf_printk("Pacchetto IPv4");

    struct iphdr *ip = (struct iphdr *)(eth + 1);

    // Ensure IP header is within bounds
    if ((void *)(ip + 1) > data_end){
        bpf_printk("Pacchetto corrotto");
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

//################################################################################
//####                                                                        ####
//####                             INIZIO PROGRAMMA                           ####
//####                                                                        ####
//################################################################################


SEC ("tc")

int egress_filter(struct __sk_buff *ctx){

	void *data_end = (void*)(__u64) ctx -> data_end;
    	void *data = (void*) (__u64)ctx->data;
	int inizio = ctx-> data;
	int fine = ctx->data_end;
	int lunghezza = fine-inizio;
    int lengthPacket;
    lengthPacket = fine - inizio;
    	bpf_printk("Inizio pacchetto in uscita: %u", data);

    	struct ethhdr *eth;
    	struct iphdr *ip;
	struct tcphdr *tcp;

    	eth = data;
    	ip = (struct iphdr *)(eth + 1);

    if(!is_tcp(eth,data_end)){
		return TC_ACT_OK;
	}

	int ip_hdr_len = ip->ihl * 4;

    // Calculate IP header length
	if (ip_hdr_len < sizeof(struct iphdr)) {
		bpf_printk("Ip header fuori range");
        return TC_ACT_OK;
    	}

	tcp = (struct tcphdr *)((unsigned char*)ip + ip_hdr_len);

	
    // Ensure IP header is within packet bounds
    if ((void *)ip + ip_hdr_len > data_end) {
		bpf_printk("Pacchetto ip troppo lungo");
        return TC_ACT_OK;
	}

    bpf_printk("La lunghezza è %d",&lunghezza);
    
    if ((void *)(tcp + 1) > data_end) {
        bpf_printk("Pacchetto tcp troppo lungo");
        return TC_ACT_OK;
    }

	// Define the number of bytes you want to capture from the TCP header
    int offset = tcp -> doff;
    const int tcp_header_bytes = offset * 4;

    // Ensure that the desired number of bytes does not exceed packet bounds
    if ((void *)tcp + tcp_header_bytes > data_end) {
        bpf_printk("Pacchetto tcp troppo lungo");
        return TC_ACT_OK;
    }

    __u8 prova = 0;
    int count = 0;
    bool lock = false;
    struct tcp_header_reader *appoggio;

    while((prova !=8) && (count < 40) && (void *)((unsigned char *)tcp + 20 + count)<data_end){
	appoggio = (struct tcp_header_reader *)((unsigned char *)tcp +20 +count);
        prova = appoggio->kind;
        if(prova == 8){
           lock = true;
	}
        count = count + 1;
    }
    count = count - 1;

    __u32 tsval = 0;
    __u32 tsecr = 0;

    if(lock && (void *)((unsigned char *)tcp + 20 + count + 10)<=data_end){
        struct tcp_header_timestamps *options = (struct tcp_header_timestamps *)((unsigned char *)tcp + 20 + count);
        bpf_printk("Kind: %d", options -> kind);
        bpf_printk("Length: %d", options -> length);
        bpf_printk("Tval: %u", options -> tval);
        bpf_printk("Tsecr: %u", options -> tsecr);
        bpf_printk("Seq: %u", bpf_ntohl(tcp -> seq));
        bpf_printk("Ack: %u", bpf_ntohl(tcp -> ack));
        bpf_printk("IP: %pI4", &ip -> daddr);

	tsval = bpf_ntohl(options -> tval);
	tsecr = bpf_ntohl(options -> tsecr);
    }
    else{
	    bpf_printk("######################### Pacchetto non processato, motivo: %d, %d, %d", tcp_header_bytes, prova, lock);
    }

        
	// Reserve space in the ring buffer
    void *ringbuf_space = bpf_ringbuf_reserve(&ringbuffer, 20, 0);
    if (!ringbuf_space) {
	    bpf_printk("Problemi con il ring buffer");
        return TC_ACT_OK;  // If reservation fails, skip processing
    }

    // Copy the TCP header bytes into the ring buffer
    // Using a loop to ensure compliance with eBPF verifier
    for (int i = 0; i < 20; i++) {
        unsigned char byte = *((unsigned char *)tcp + i);
        ((unsigned char *)ringbuf_space)[i] = byte;
    }

	__u32 ip_destination = ip->daddr;
	__u32 ip_source = ip->saddr;
	__u16 port_destination = bpf_ntohs(tcp->dest);
	__u16 port_source = bpf_ntohs(tcp->source);

	struct connection conn;
	conn.ip_source = ip_destination;
	conn.ip_dest = ip_source;
	conn.port_source = port_destination;
	conn.port_dest = port_source;

	int seq = bpf_ntohl(tcp -> seq);
    int dimensionPacket = lengthPacket - 14 -20 -tcp_header_bytes;
    int ack_seq = bpf_ntohl(tcp -> ack_seq);

    __u64 *old_timestampA = bpf_map_lookup_elem(&timestampA_map,&conn);
    __u64 *old_timestampB = bpf_map_lookup_elem(&timestampB_map,&conn);
 
    long init = 0;
    long incremente = 1;

    if(!old_timestampA){
	    if(tcp->ack==1){
    	    __u64 new_value = bpf_ktime_get_ns() - ((__u64)tsval) ;
	        bpf_map_update_elem(&timestampA_map,&conn,&new_value,BPF_ANY);
	    }
    }
    else
    if(!old_timestampB){
        /*DO NOTHING*/
	}
    else
    if(old_timestampA && old_timestampB){
	    //Calcola latenza
	    if(tcp->ack == 1){
	        __u64 latency = (__u64)tsval + *old_timestampA - (__u64)tsecr - *old_timestampB;
	        bpf_map_update_elem(&latency_map,&conn,&latency,BPF_ANY);
        }
    }
	bpf_ringbuf_submit(ringbuf_space,0);

	//bpf_printk("Funziona");

    bpf_printk("_______________________________________________________________");

	return TC_ACT_OK;


}

char __license[] SEC("license") = "GPL";
