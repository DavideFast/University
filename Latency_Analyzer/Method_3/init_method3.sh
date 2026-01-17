echo Installazione delle dipendenze
cp usr/src/linux-headers-6.8.0-45-generic/tools/bpf/resolve_btfids/libbpf/include/bpf /usr/include
sudo apt-get update
sudo apt install libbpf-dev
sudo apt install clang
sudo apt install gcc

echo Download from DavideFast GitHub Account the Latency Analyzer kit
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency_Analyzer/Method_3/ingress_tcp_method3.bpf.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency_Analyzer/Method_3/egress_tcp_method3.bpf.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency_Analyzer/Method_3/vmlinux.h
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency_Analyzer/Method_3/close.sh
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency_Analyzer/Method_3/user_space_program_method3.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency_Analyzer/Method_3/update_method3.sh

sudo gcc -o user_space_program_method3 user_space_program_method3.c -lbpf
sudo clang -target bpf -g -O2 -Wall -v -c egress_tcp_method3.bpf.c -o egress_tcp_method3.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c ingress_tcp_method3.bpf.c -o ingress_tcp_method3.bpf.o

echo Avvio del programma
sudo ./user_space_program_method3
