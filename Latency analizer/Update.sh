sudo clang -target bpf -g -O2 -Wall -v -c ingress_tcp.bpf.c -o ingress_tcp.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c egress_tcp.bpf.c -o egress_tcp.bpf.o
sudo gcc -o user_space_program user_space_program.c -lbpf
