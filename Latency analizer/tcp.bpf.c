#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <bpf/bpf_tracing.h>
#include <endian.h>
#include <math.h>


#define TC_ACT_OK 0
#define TC_ACT_SHOT 2
#define ETH_P_IP 0x0800


///@tchook {"ifindex":1, "attach_point":"BPF_TC_EGRESS"}
///@tcopts {"handle":1,"priority":1 }

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 26);  // 16 MB buffer
} ringbuffer SEC(".maps");



struct {
	__uint(type,BPF_MAP_TYPE_HASH);
	__uint(max_entries,1024);
	__type(key, __u32);
        __type(value, __u32);
        __uint(pinning,LIBBPF_PIN_BY_NAME);
} number_ack_map SEC (".maps");


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



SEC ("tc")

int egress_filter(struct __sk_buff *ctx){
	
	void *data_end = (void*)(__u64) ctx -> data_end;
        void *data = (void*) (__u64)ctx->data;
	int inizio = ctx-> data;
	int fine = ctx->data_end;
	int lunghezza = fine-inizio;
	bpf_printk("La lunghezza è &d",&lunghezza);
	struct ethhdr *eth;
        struct iphdr *ip;
	struct tcphdr *tcp;
	eth = data;
        ip = (struct iphdr *)(eth + 1);
	if(!is_tcp(eth,data_end)){
		bpf_printk("Non è tcp");
		return TC_ACT_OK;
	}

	int ip_hdr_len = ip->ihl * 4;

	if (ip_hdr_len < sizeof(struct iphdr)) {
		bpf_printk("Ip header fuori range");
        	return TC_ACT_SHOT;
    	}

	tcp = (struct tcphdr *)((unsigned char*)ip + ip_hdr_len);

	// Calculate IP header length
   	if (ip_hdr_len < sizeof(struct iphdr)) {
		bpf_printk("Ip header fuori range 2");
        	return TC_ACT_SHOT;
    	}
    	// Ensure IP header is within packet bounds
    	if ((void *)ip + ip_hdr_len > data_end) {
		bpf_printk("Pacchetto ip troppo lungo");
        	return TC_ACT_SHOT;
	}


	// Define the number of bytes you want to capture from the TCP header
        int offset = tcp->doff;
	const int tcp_header_bytes = 20;

        // Ensure that the desired number of bytes does not exceed packet bounds
        if ((void *)tcp + tcp_header_bytes > data_end) {
	     bpf_printk("Pacchetto tcp troppo lungo <-------------------------------------------");
             return TC_ACT_SHOT;
        }
	// Reserve space in the ring buffer
        void *ringbuf_space = bpf_ringbuf_reserve(&ringbuffer, tcp_header_bytes, 0);
        if (!ringbuf_space) {
	    bpf_printk("Problemi con il ring buffer");
            return TC_ACT_SHOT;  // If reservation fails, skip processing
        }

        // Copy the TCP header bytes into the ring buffer
        // Using a loop to ensure compliance with eBPF verifier
        for (int i = 0; i < tcp_header_bytes; i++) {
             unsigned char byte = *((unsigned char *)tcp + i);
             ((unsigned char *)ringbuf_space)[i] = byte;
        }

	int key = ip->daddr;
	int ack = bpf_ntohl(tcp -> ack_seq);
	//long *value = bpf_map_lookup_elem(&number_sequence, &key);
        bpf_map_update_elem(&number_ack_map,&key,&ack,BPF_ANY);
	bpf_ringbuf_submit(ringbuf_space,0);

	//bpf_printk("Funziona");

	return TC_ACT_OK;


}

char __license[] SEC("license") = "GPL";
