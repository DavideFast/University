#include <bpf/bpf.h>
#include <unistd.h>
#include <time.h>
#include <bpf/libbpf.h>
#include <stdio.h>
#include <stdlib.h>

struct connection{
	__u32 ip_source;
	__u32 ip_destination;
	__u16 port_source;
	__u16 port_dest;
};

void print_ip(uint32_t ip){
	unsigned char octet1 = (ip >>24) & 0xFF;
	unsigned char octet2 = (ip >> 16) & 0xFF;
	unsigned char octet3 = (ip >> 8) & 0xFF;
	unsigned char octet4 = ip & 0xFF;
	printf("%u.%u.%u.%u",octet4,octet3,octet2,octet1);
}



int main(){
	printf("####################################################\n");
	printf("####                    START                   ####\n");
	printf("####################################################\n");
	struct bpf_object *obj;
	struct bpf_object *obj2;

//Apertura del file
	obj = bpf_object__open_file("ingress_tcp_method1.bpf.o",NULL);
	obj2 = bpf_object__open_file("egress_tcp_method1.bpf.o",NULL);
	if(libbpf_get_error(obj))
		return 1;
	if(libbpf_get_error(obj2))
		return 1;
	if(bpf_object__load(obj))
		return 1;
	if(bpf_object__load(obj2))
		return 1;

	int prog_fd;
	int prog_fd2;
	struct bpf_program *prog;
	struct bpf_program *prog2;
	prog = bpf_object__find_program_by_name(obj,"ingress_tcp");
	prog2 = bpf_object__find_program_by_name(obj2,"egress_tcp");
	prog_fd = bpf_program__fd(prog);
	prog_fd2 = bpf_program__fd(prog2);
	if(bpf_program__attach_xdp(prog,2))
		printf("XDP attach riuscito\n");
	else
		printf("XDP attach fallito\n");
	//printf("Fd del programma egress %d\n",bpf_object__btf_fd(obj2));
	struct bpf_tc_opts opts = {
	     .flags = BPF_TC_F_REPLACE,
	     .sz = sizeof(struct bpf_tc_opts),
	     .prog_fd = prog_fd2,
	     .handle = 0,
	     .priority = 1,
	     .flags = BPF_TC_F_REPLACE,
	};
	struct bpf_tc_hook hook = {
	      .sz = sizeof(struct bpf_tc_hook),
	      .ifindex = 2,
	      .parent = 0,
	      .attach_point = BPF_TC_EGRESS,
	};


	if(bpf_tc_hook_create(&hook)==0)
		printf("QDisc creato con successo\n");
	else
		printf("Qdisc creazione fallita\n");

	char buf[20] = "";
	int size = 20;


	libbpf_strerror(-22,buf,size);
	printf("Errore: %s\n",buf);
	if(bpf_tc_attach(&hook,&opts)==0)
		printf("TC attach riuscito\n");
	else
		printf("TC attach fallito\n");

//Loading e autoattaching dei file
	struct bpf_map_info info = {};
	unsigned int len = sizeof(info);
	int egress = bpf_obj_get("/sys/fs/bpf/latency_egress_map");
	int ingress = bpf_obj_get("/sys/fs/bpf/latency_ingress_map");
	struct bpf_map *egress_map;
        struct connection *key;
	struct connection key_value;
	key=&key_value;
	struct bpf_map *ingress_map;
	__u64 * p_buff;
	__u64 buff=0;
	p_buff = &buff;
	const char *name = "latency_egress_map";
	const char *name2 = "latency_ingress_map";
	if(egress<=0){
		printf("Nessuna mappa egress trovata");
	}
	else {
		egress_map = bpf_object__find_map_by_name(obj,name);
		struct bpf_map *r = bpf_object__next_map(obj,NULL);
		if(egress_map){
		     if(bpf_map_get_next_key(bpf_map__fd(egress_map),NULL,key)==0)
			     printf("Key egress_map ottenuta\n");
		}
	}

	if(ingress<=0){
		printf("Nessuna mappa ingress trovata\n");
	}
	else {
		ingress_map = bpf_object__find_map_by_name(obj2,name2);
		if(ingress_map){
		     if(bpf_map_get_next_key(bpf_map__fd(ingress_map),NULL,key)==0)
			     printf("Key ingress_map ottenuta\n");
		}
	}

//Tempo di attesa
	int count=0;
	__u64 flags=0;
	time_t start = time(NULL);
	printf("Inserire numero di minuti di cattura\n");
	scanf("%d",&count);
	start = time(NULL);
	while(time(NULL)-start<count*60){
	     sleep(1);
	     int result = bpf_map_get_next_key(bpf_map__fd(egress_map),NULL,key);
	     if(result==0){
	     	bpf_map__lookup_elem(egress_map,(void*)key,(size_t)12,(void *)p_buff,(size_t)4,flags);
	     	printf("Latenza ");
	     	print_ip(key->ip_source);
		if(buff==500000000)
			printf(": - mS\n");
		else
	     		printf(": %llu mS\n",buff/1000000);
	     	while(bpf_map_get_next_key(bpf_map__fd(egress_map),key,key)==0)
			if(bpf_map__lookup_elem(egress_map,(void *)key,(size_t)12,
	          	(void *)p_buff, (size_t) 4,flags)==0){
		       		printf("Latenza ");
		       		print_ip(key->ip_source);
				if(buff==500000000)
					printf(": - mS\n");
				else
		       			printf(": %llu mS\n",buff/1000000);
		        }
	     }
	     printf("-------------------------------------------------------------------------\n");
	}

//Distruzione del programma eBPF
	printf("Mostra lista dei filtri TC:\n");
	system("sudo tc filter show dev enp0s3 egress");
	system("sudo tc filter del dev enp0s3 egress");
	printf("Sto eliminando il filtro TC\n");
	system("sudo tc qdisc del dev enp0s3 clsact");
	printf("Sto eliminando il qdisc clsact\n");
	system("sudo tc filter show dev enp0s3 egress");
        system("sudo sh close.sh");
	printf("Unpin delle mappe eBPF\n");
	printf("#####################################################\n");
	printf("####                    FINISH                   ####\n");
	printf("#####################################################\n");
	return 0;
}
