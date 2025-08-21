# RECOMMENDATION

This program has been developed in a Ubuntu Server LTS 24.04.1 LTS version Operative System. Different versions couldn't work.
If LRO is enabled, XDP won't work, disable it with the following command: sudo ethtool -K eth0 lro off
In Ubuntu 25 may be problem with system function of stdlib.h library in ingress/egress_tcp_methodx.bpf.c files.

# USEFUL COMMANDS

## Show items

List all object of certain category (it will show id, name and other information): <br/>
> sudo bpftool prog list <br/>
> sudo bpftool net list <br/>
> sudo pbftool map list <br/>

Se si ricerca un oggetto in particolare:
> sudo bpftool prog show id <number> 

## Loading programs in kernel

> sudo bpftool prog load <name.bpf.o> 


