sudo clang -target bpf -g -O2 -Wall -v -c ingress_tcp_method2.bpf.c -o ingress_tcp_method2.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c egress_tcp_method2.bpf.c -o egress_tcp_method2.bpf.o
sudo gcc -o user_space_program_method2 user_space_program_method2.c -lbpf
