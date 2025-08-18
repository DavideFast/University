echo Installazione delle dipendenze
cp usr/src/linux-headers-6.8.0-45-generic/tools/bpf/resolve_btfids/libbpf/include/bpf /usr/include
sudo apt-get update
sudo apt install libbpf-dev
sudo apt install clang

echo Download from DavideFast GitHub Account the Latency Analyzer kit
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/Metodo%202/ingress_tcp_method2.bpf.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/Metodo%202/egress_tcp_method2.bpf.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/Metodo%202/vmlinux.h
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/Metodo%202/termina.sh
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/Metodo%202/user_space_program_method2.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/Metodo%202/update_method2.sh

sudo gcc -o user_space_program_method2 user_space_program_method2.c -lbpf
sudo clang -target bpf -g -O2 -Wall -v -c egress_tcp_method2.bpf.c -o egress_tcp_method2.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c ingress_tcp_method2.bpf.c -o ingress_tcp_method2.bpf.o

echo Avvio del programma
sudo ./user_space_program_method2
