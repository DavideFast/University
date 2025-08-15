echo Installazione delle dipendenze
cp usr/src/linux-headers-6.8.0-45-generic/tools/bpf/resolve_btfids/libbpf/include/bpf /usr/include
sudo apt-get update
sudo apt install libbpf-dev
sudo apt install clang

echo Download from DavideFast GitHub Account the Latency Analyzer kit
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/tcp_user.bpf.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/tcp.bpf.c
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/vmlinux.h
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/termina.sh
wget https://raw.githubusercontent.com/DavideFast/University/refs/heads/main/Latency%20analizer/user_space_program.c

echo Compile downloaded files 
sudo gcc -o user_space_program user_space_program.c -lbpf
sudo clang -target bpf -g -O2 -Wall -v -c tcp_user.bpf.c -o tcp_user.bpf.o
sudo clang -target bpf -g -O2 -Wall -v -c tcp.bpf.c -o tcp.bpf.o

echo Avvio del programma
sudo ./user_space_program
