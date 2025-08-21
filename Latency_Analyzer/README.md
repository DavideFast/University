# RECOMMENDATION
> [!NOTE]
> This program has been developed in a Ubuntu Server 24.04.1 LTS version Operative System. <br/> Different versions wouldn't work.

> [!IMPORTANT]
> If LRO is enabled, XDP won't work, disable it with the following command: <br/>
> > *sudo ethtool -K eth0 lro off* <br/>

> [!IMPORTANT]
> In Ubuntu 25.X.X may be problem with system function of *stdlib.h* library in *ingress/egress_tcp_methodx.bpf.c* files.

<br/>

# USEFUL COMMANDS

 - ## Show eBPF object

  List of all objects of certain categories (it will show id, name and other information): <br/>
  > sudo bpftool prog list <br/>
  > sudo bpftool net list <br/>
  > sudo bftool map list <br/>
  > sudo tc filter show dev eth0 <ingress|egress> <br/>
  
  If you need to show a particular object:
  > sudo bpftool prog show id <number>
  > sudo bpftool prog show name <name>
  Same things are possible with maps.
  
  <br/>

 - ## Loading programs in kernel

  > sudo bpftool prog load <name>.bpf.o /sys/fs/bpf/<name>

<br/>

 - ## Attach programs to newtork interface
  If the program is XDP
  > sudo bpftool net attach xdp name <name> dev eth0
  
  If the program is TC first we need to create the qdisc:
  > sudo tc qdisc add dev eth0 clsact <br/>
  
  Then is possible to attach the program
  
  > sudo tc filter add dev eth0 ingress bpf direct-action obj <name>.bpf.o sec tc <br/>
  > sudo tc filter add dev eth0 egress bpf direct-action obj <name>.bpf.o sec tc <br/>

<br/>

 - ## Detach programs from network interface

  If TC programs:
  > sudo tc filter del dev eth0 <ingress|egress> <br/>
  > sudo tc qdisc del dev eth0 clsact <br/>
  
  If XDP programs:
  > sudo bpftool net detach xdp dev eth0 <br/>
  > sudo rm /sys/fs/bpf/<name>

<br/>

 - ## Compile
  > sudo clang -target bpf -g -O2 -Wall -v -c <name>.bpf.c -o <name>.bpf.o <br/>
  > sudo gcc -o <name> <name>.c -lbpf

<br/>

# HOW IT WORKS
 - ## Method n°1
The TC program (egress_tcp_method1.bpf.c) observe all the egress packets and get per each connection the timestamp. <br/>
The XDP program (ingress_tcp_method1.bpf.c) observe all the ingress packet and match the corrispective ACK and calculate the difference. <br/>
Then the user_space_program_method1.c program show the respective latency.

<br/>

 - ## Method n°2
The XDP program (ingress_tcp_method2.bpf.c)observe all the ingress packet and set the correspective timestamp <br/>
The TC program (egress_tcp_method2.bpf.c) observe all the egress packets and catch the ACK of the correspective ingress packet and calculate the latency. <br/>
Then the user_space_program_method2.c program show the respective latency.

<br/>

 - ## Method n°3
This method use the other two to find a value that permit to synchronize the remote and local host clock.<br/>
In this way it's not necessary to wait for packets to calculate latency, but it's possible to get from the TSVAL and TSECR of the same packet.
The user_space_program_method3 always print the latency value.


