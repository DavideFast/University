#include <bpf/bpf.h>
#include <time.h>
#include <bpf/libbpf.h>
#include <stdio.h>
#include "tcp_user.skel.h"
#include "tcp.skel.h" 

struct connection{
	__u32 ip_source;
	__u32 ip_dest;
	__u16 port_source;
	__u16 port_dest;
};

int bpf_obj_get(const char * pathname);

int main(){
	printf("###############################################\n");
	printf("####                 START                 ####\n");
	printf("###############################################\n");
	struct bpf_object *obj;
	struct bpf_object *obj2;

//Apertura del file
	obj = bpf_object__open_file("tcp_user.bpf.o",NULL);
	obj2 = bpf_object__open_file("tcp.bpf.o",NULL);
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
	prog = bpf_object__find_program_by_name(obj,"xdp_pass");
	prog2 = bpf_object__find_program_by_name(obj2,"egress_filter");
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
	     .priority = 1
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
		printf("Hook già esistente\n");

	char buf[20] = "";
	int size = 20;


	//libbpf_strerror(-14,buf,size);
	//printf("Errore: %s\n",buf);
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
	struct connection hehe;
		hehe.ip_source=837969303;
		hehe.ip_dest=2120526016;
		hehe.port_source=443;
		hehe.port_dest=41822;
		unsigned long *risultato;
	struct connection key_value;
	key=&key_value;
	struct bpf_map *ingress_map;
	unsigned long * p_buff;
	unsigned long buff;
	p_buff = &buff;
	//printf("Valore di inizializzazione: %lu\n",key_value);
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
	printf("Ip_dest: %i4\n",key_value.ip_dest);
	printf("Ip_source: %i4 \n",key_value.ip_source);
	printf("Port_source: %d\n", key_value.port_source);
	printf("Port_dest: %d\n",key_value.port_dest);
	time_t start = time(NULL);
	printf("Inserire numero di minuti di cattura\n");
	scanf("%d",&count);
	start = time(NULL);
	while(time(NULL)-start<count*60){
	     bpf_map_get_next_key(bpf_map__fd(egress_map),NULL,key);
	     printf("Latenza in   uscita: %lu nanosecondi\n",buff);
	     while(bpf_map_get_next_key(bpf_map__fd(egress_map),key,key)==0)
		  if(bpf_map__lookup_elem(egress_map,(void *)key,(size_t)12,
	          (void *)p_buff, (size_t) 8,flags)==0)
		       printf("Latenza in   uscita: %lu nanosecondi\n",buff);

             bpf_map_get_next_key(bpf_map__fd(ingress_map),NULL,key);
	     printf("Latenza in ingresso: %lu nanosecondi\n",buff);
	     while(bpf_map_get_next_key(bpf_map__fd(ingress_map),key,key)==0)
		  if(bpf_map__lookup_elem(ingress_map,(void*)key,
		  (size_t)12,(void*)p_buff,(size_t)8,flags)==0)
		       printf("Latenza in ingresso: %lu nanosecondi\n",buff);

	     printf("-----------------------------------------------\n");
	}

//Distruzione del programma eBPF
	bpf_tc_detach(&hook,&opts);
	printf("Qdisc eliminato con successo...%d\n",
		bpf_tc_hook_destroy(&hook));
	printf("################################################\n");
	printf("####                 FINISH                 ####\n");
	printf("################################################\n");
	return 0;
}
