#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#define ETH_P_IP 0x0800



//####################################################################################################################################
//####                                                                                                                            ####
//####                                                        NECESSARY STRUCT                                                    ####
//####                                                                                                                            ####
//####################################################################################################################################


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

struct differenzialeB_map {
   __uint (type, BPF_MAP_TYPE_HASH);
   __uint(max_entries,1024);
   __type(key,struct connection);
   __type(value,int64_t);
   __uint(pinning,LIBBPF_PIN_BY_NAME);
} differenzialeB_map SEC (".maps");


//####################################################################################################################################
//####                                                                                                                            ####
//####                                                       INTERNAL FUNCTION                                                    ####
//####                                                                                                                            ####
//####################################################################################################################################

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

//####################################################################################################################################
//####                                                                                                                            ####
//####                                                           eBPF PROGRAM                                                     ####
//####                                                                                                                            ####
//####################################################################################################################################

SEC("xdp")
int ingress_tcp(struct xdp_md *ctx)
{
    // Pointers to packet data
    void *dataa = (void *)(long)ctx->data;
    void *dataa_end = (void *)(long)ctx->data_end;
    int inizio = ctx -> data;
    __u64 current_time = bpf_ktime_get_ns();
    bpf_printk("Pacchetto in INGRESSO");
    int fine = ctx -> data_end;
    int lengthPacket;
    lengthPacket = fine - inizio;
    //bpf_printk("Lunghezza pacchetto: %u", lengthPacket);

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
	    bpf_printk("IP fuori bound");
        return XDP_PASS;
    }

    // Parse TCP header
    struct tcphdr *tcp = (struct tcphdr *)((unsigned char *)ip + ip_hdr_len);
    

    // Ensure TCP header is within packet bounds
    if ((void *)(tcp + 1) > dataa_end) {
        return XDP_PASS;
    }


    // Define the number of bytes you want to capture from the TCP header
    int offset = tcp -> doff;
    const int tcp_header_bytes = offset * 4;
    if((void *)(unsigned char*)tcp+tcp_header_bytes>dataa_end)
	    return XDP_PASS;


    // Ensure that the desired number of bytes does not exceed packet bounds
    if ((void *)tcp + tcp_header_bytes > dataa_end) {
        return XDP_PASS;
    }


    __u32 ip_source = ip->saddr;
    __u32 ip_destination = ip->daddr;
    __u16 port_source = bpf_ntohs(tcp -> source);
    __u16 port_destination = bpf_ntohs(tcp -> dest);
    __u16 dimensionPayload=(long)ctx->data_end-(long)((unsigned char*)tcp+tcp_header_bytes);
    
    if((long)((unsigned char*)tcp+tcp_header_bytes)==(long)ctx->data_end){}
    else
	dimensionPayload=0;
    
    /*bpf_printk("Src Port: %u",port_source);
    bpf_printk("Dst Port: %u", port_destination);
    bpf_printk("Src IP: %pI4",&ip_source);
    bpf_printk("Dst IP: %pI4",&ip_destination);
    bpf_printk("Ack sequence Number: %u",bpf_ntohl(tcp->ack_seq));

    bpf_printk("Sequence Number: %u",bpf_ntohl(tcp->seq));
    bpf_printk("Header Ethernet: 14 bytes");
    bpf_printk("Header IP: %u bytes",ip_hdr_len);
    bpf_printk("Header TCP: %u bytes",tcp_header_bytes);
    bpf_printk("Payload: %u bytes",dimensionPayload );
    
    bpf_printk("Start address: %u",ctx->data);
    bpf_printk("Start IP address: %u",(unsigned char*)ip);
    bpf_printk("Start TCP address: %u",(unsigned char*)tcp);
    bpf_printk("End TCP address: %u", (unsigned char *)tcp+tcp_header_bytes);
    bpf_printk("End packet address: %u", ctx->data_end);*/

    __u8 prova = 0;
    int count = 0;
    bool lock = false;
    struct tcp_header_reader *appoggio;

    while((prova !=8) && (count < 40) && (void *)((unsigned char *)tcp + 20 + count)<dataa_end){
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
 
    if(lock && (void *)((unsigned char *)tcp + 20 + count + 10)<=dataa_end){
        struct tcp_header_timestamps *options = (struct tcp_header_timestamps *)((unsigned char *)tcp +20 + count);
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


    struct connection connection;
    connection.ip_source = ip_source;
    connection.ip_dest = ip_destination;
    connection.port_source = port_source;
    connection.port_dest = port_destination;

    __u32 *old_timestampA = bpf_map_lookup_elem(&timestampA_map,&connection);
    __u32 *old_timestampB = bpf_map_lookup_elem(&timestampB_map,&connection);
    int64_t *diffB = bpf_map_lookup_elem(&differenzialeB_map,&connection);

    if(!diffB && (!old_timestampA || *old_timestampA==0)){
        bpf_map_update_elem(&timestampA_map,&connection,&tsval,BPF_ANY);
        bpf_map_update_elem(&timestampB_map,&connection,&tsecr,BPF_ANY);
    }else{
        if(!diffB && old_timestampA && (tsval-*old_timestampA)>500){
            __u32 nullo = 0;
            bpf_map_update_elem(&timestampA_map,&connection,&nullo,BPF_ANY);
	    bpf_map_update_elem(&timestampB_map,&connection,&nullo,BPF_ANY);
	}
    }
    if(diffB){
        int64_t lat_egress = (tsval-*diffB) - tsecr;
	bpf_printk("%llu - %llu - %llu - %llu",tsval,tsecr,*diffB,tsval-*diffB);
	bpf_map_update_elem(&latency_egress_map,&connection, &lat_egress,BPF_ANY);
    }

    return XDP_PASS;
}

char __license[] SEC("license") = "GPL";
