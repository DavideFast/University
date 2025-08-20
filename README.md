This program has been developed in a Ubuntu Server LTS 24.04.1 LTS version Operative System. Different versions couldn't work.
If LRO is enabled XDP won't work, disable it with the following command: sudo ethtool -K eth0 lro off
In Ubuntu 25 may be problem with system function of stdlib.h library in ingress/egress_tcp_methodx.bpf.c files.
