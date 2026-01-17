sudo clang -target bpf -g -O2 -Wall -v -c ingress_tcp_method3.bpf.c -o ingress_tcp_method3.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c egress_tcp_method3.bpf.c -o egress_tcp_method3.bpf.o
sudo gcc -o user_space_program_method3 user_space_program_method3.c -lbpf
