# RECOMMENDATION

This program has been developed in a Ubuntu Server LTS 24.04.1 LTS version Operative System. Different versions couldn't work.<br/>
If LRO is enabled, XDP won't work, disable it with the following command: 
> *sudo ethtool -K eth0 lro off* <br/>

In Ubuntu 25 may be problem with system function of stdlib.h library in *ingress/egress_tcp_methodx.bpf.c* files.

# USEFUL COMMANDS

## Show eBPF object

List all object of certain category (it will show id, name and other information): <br/>
> sudo bpftool prog list <br/>
> sudo bpftool net list <br/>
> sudo pbftool map list <br/>

If you need to show a particular object:
> sudo bpftool prog show id <number>
> sudo bpftool prog show name <name>
Same things are possible with maps.

## Loading programs in kernel

> sudo bpftool prog load <name.bpf.o>

## Attach programs to newtork interface
If the program is XDP
> sudo bpftool net attach

If the program is TC first we need to create the qdisc:
> sudo tc qdisc add dev lo clsact
Then is possible to attach the program
> sudo tc filter add dev lo ingress bpf direct-action obj flat.o sec tc
> sudo tc filter add dev lo egress bpf direct-action obj flat.o sec tc



