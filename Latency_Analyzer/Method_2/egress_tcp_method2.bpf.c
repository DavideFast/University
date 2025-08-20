#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <bpf/bpf_tracing.h>


#define TC_ACT_OK 0
#define TC_ACT_SHOT 2
#define ETH_P_IP 0x0800



//################################################################################
//####                                                                        ####
//####                              NECESSARY STRUCT                          ####
//####                                                                        ####
//################################################################################


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

//Il packed serve per evitare che la struttura venga formattata ed evitare che non salvi i file
struct __attribute__((__packed__))  tcp_header_timestamps{ 
    __u8 kind;
    __u8 length;
    __u32 tval;
    __u32 tsecr;
};


//Mappe eBPF necessarie al funzionamento
struct inner_map{
   __uint(type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key, __u32);
   __type(value, __int128);
   __uint(pinning,LIBBPF_PIN_BY_NAME);
} inner_map SEC (".maps");

struct timestampA_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u32);
   __uint(pinning,LIBBPF_PIN_BY_NAME);
} timestampA_map SEC (".maps");

struct timestampB_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,__u32);
   __uint(pinning,LIBBPF_PIN_BY_NAME);
} timestampB_map SEC (".maps");

struct latency_ingress_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value, __u32);
   __uint(pinning,LIBBPF_PIN_BY_NAME);
} latency_ingress_map SEC (".maps");

struct latency_egress_map{
   __uint(type,BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key, struct connection);
   __type(value, __u32);
   __uint(pinning,LIBBPF_PIN_BY_NAME);
}latency_egress_map SEC (".maps");


//################################################################################
//####                                                                        ####
//####                            INTERNAL FUNCTION                           ####
//####                                                                        ####
//################################################################################


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
//####                                eBPF PROGRAM                            ####
//####                                                                        ####
//################################################################################


SEC ("tc")

int egress_tcp(struct __sk_buff *ctx){

	void *data_end = (void*)(__u64) ctx -> data_end;
    	void *data = (void*) (__u64)ctx->data;
	int inizio = ctx-> data;
	int fine = ctx->data_end;
	int lunghezza = fine-inizio;
	__u64 current_time = bpf_ktime_get_ns();
    	bpf_printk("Pacchetto in USCITA");
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
        /*bpf_printk("Kind: %d", options -> kind);
        bpf_printk("Length: %d", options -> length);
        bpf_printk("Tval: %lu", options -> tval);
        bpf_printk("Tsecr: %lu", options -> tsecr);
        bpf_printk("Seq: %u", bpf_ntohl(tcp -> seq));
        bpf_printk("Ack: %u", bpf_ntohl(tcp -> ack));
        bpf_printk("IP: %pI4", &ip -> daddr);*/

	tsval = bpf_ntohl(options -> tval);
	tsecr = bpf_ntohl(options -> tsecr);
    }
    else{
	    bpf_printk("Pacchetto non processato, motivo: %d, %d, %d", tcp_header_bytes, prova, lock);
    }


        __u32 ip_destination = ip->daddr;
	__u32 ip_source = ip->saddr;
	__u16 port_destination = bpf_ntohs(tcp->dest);
	__u16 port_source = bpf_ntohs(tcp->source);
	__u16 dimensionPayload = (long)ctx->data_end-(long)((unsigned char*)tcp+tcp_header_bytes);

	//bpf_printk("Lunghezza pacchetto: %u", (long)ctx->data_end - (long) ctx->data);

	if((long)((unsigned char*)tcp+tcp_header_bytes)==(long)ctx->data_end){}
	else
		dimensionPayload=0;
	
	bpf_printk("Payload: %u", dimensionPayload);

	struct connection conn;
	conn.ip_source = ip_destination;
	conn.ip_dest = ip_source;
	conn.port_source = port_destination;
	conn.port_dest = port_source;

    __u32 *old_timestampA = bpf_map_lookup_elem(&timestampA_map,&conn);
    __u32 *old_timestampB = bpf_map_lookup_elem(&timestampB_map,&conn);

    //I pacchetti in uscita servono solo per settare i timestamp A e non per calcolare i tempi di latenza
    if(old_timestampA && old_timestampB  && tsecr==*old_timestampA && tcp->ack==1 ){
	__u32 new_value = (tsval - *old_timestampB)*500;
	bpf_printk("%llu - %llu", tsval,*old_timestampB);
	__u32 nullo = 0;
	bpf_map_update_elem(&timestampA_map,&conn,&nullo,BPF_ANY);
	bpf_map_update_elem(&latency_egress_map,&conn,&new_value,BPF_ANY);
    }

    bpf_printk("_______________________________________________________________");

	return TC_ACT_OK;


}

char __license[] SEC("license") = "GPL";
