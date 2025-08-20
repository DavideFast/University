sudo clang -target bpf -g -O2 -Wall -v -c ingress_tcp_method1.bpf.c -o ingress_tcp_method1.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c egress_tcp_method1.bpf.c -o egress_tcp_method1.bpf.o
sudo gcc -o user_space_program_method1 user_space_program_method1.c -lbpf
