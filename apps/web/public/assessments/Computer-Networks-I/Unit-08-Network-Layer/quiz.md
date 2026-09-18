# Quiz — Computer Networks-I — Unit 8: Network Layer

**Subject:** Computer Networks-I  
**Module:** Unit 8 — Network Layer  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Default classful mask of 172.16.0.0 is:

- **A.** /16
- **B.** /8
- **C.** /24
- **D.** /12 (that is the RFC1918 private block, not classful default of Class B)

**Answer:** A
**Explanation:** Class B default /16. 172.16.0.0/12 is the private range inside Class B.

### Q02  ·  Easy
**Question:** IPv4 addresses are:

- **A.** 32 bits
- **B.** 128 bits
- **C.** 48 bits
- **D.** 16 bits

**Answer:** A
**Explanation:** Four octets.

### Q03  ·  Easy
**Question:** RFC1918 includes:

- **A.** 8.8.8.0/24
- **B.** 224.0.0.0/4
- **C.** 192.168.0.0/16
- **D.** 1.0.0.0/8

**Answer:** C
**Explanation:** 10/8, 172.16/12, 192.168/16.

### Q04  ·  Easy
**Question:** Which option best describes **ARP**?

- **A.** Maps port 80 to HTTP only without IP.
- **B.** Maps MAC to SSID.
- **C.** Address Resolution Protocol: maps an IPv4 address to a local MAC address.
- **D.** Maps IPv6 to DNS exclusively (that is different).

**Answer:** C
**Explanation:** ARP: Address Resolution Protocol: maps an IPv4 address to a local MAC address.

### Q05  ·  Easy
**Question:** Which option best describes **Class C**?

- **A.** Unicast classful range 192.0.0.0–223.255.255.0 with default mask /24.
- **B.** Class D multicast.
- **C.** Default /8.
- **D.** Default /16.

**Answer:** A
**Explanation:** Class C: Unicast classful range 192.0.0.0–223.255.255.0 with default mask /24.

### Q06  ·  Easy
**Question:** Which option best describes **IPv4 address**?

- **A.** A 48-bit Ethernet MAC.
- **B.** A 16-bit TCP port.
- **C.** A 32-bit logical address identifying an interface, usually written in dotted decimal.
- **D.** A 128-bit IPv6 address.

**Answer:** C
**Explanation:** IPv4 address: A 32-bit logical address identifying an interface, usually written in dotted decimal.

### Q07  ·  Easy
**Question:** Which option best describes **IPv6 address**?

- **A.** A 32-bit dotted-decimal address.
- **B.** A 128-bit logical address, written as eight hex groups, with ‘::’ compression.
- **C.** A 16-bit port.
- **D.** A 48-bit MAC.

**Answer:** B
**Explanation:** IPv6 address: A 128-bit logical address, written as eight hex groups, with ‘::’ compression.

### Q08  ·  Easy
**Question:** Which option best describes **Internetworking**?

- **A.** Bluetooth piconet only.
- **B.** A single hub LAN.
- **C.** Connecting networks so packets can travel from a source network to a destination network via routers.
- **D.** Repeating bits inside one collision domain only.

**Answer:** C
**Explanation:** Internetworking: Connecting networks so packets can travel from a source network to a destination network via routers.

### Q09  ·  Easy
**Question:** Which option best describes **Subnet mask**?

- **A.** The TCP window.
- **B.** The IPv6 flow label only.
- **C.** A 48-bit MAC filter.
- **D.** A 32-bit mask that splits an IPv4 address into network/prefix and host parts.

**Answer:** D
**Explanation:** Subnet mask: A 32-bit mask that splits an IPv4 address into network/prefix and host parts.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **IPv4 forwarding (simplified)**?

- **A.** Increment TTL forever → hub flood by IP class only
- **B.** Fragment IPv6 at every core hop always
- **C.** NAT every packet to 127.0.0.1
- **D.** Receive → decrement TTL → if 0 drop → longest-prefix match → rewrite MAC via ARP → send

**Answer:** D
**Explanation:** Correct sequence for IPv4 forwarding (simplified): Receive → decrement TTL → if 0 drop → longest-prefix match → rewrite MAC via ARP → send

### Q11  ·  Easy
**Question:** Which sequence correctly describes **NAT of an outbound TCP session**?

- **A.** Replace MAC only
- **B.** Delete the IP header
- **C.** Replace private src IP/port with public mapping → forward → on reply restore private dst using the table
- **D.** Assign Class E

**Answer:** C
**Explanation:** Correct sequence for NAT of an outbound TCP session: Replace private src IP/port with public mapping → forward → on reply restore private dst using the table

### Q12  ·  Intermediate
**Question:** Address 224.0.0.5 is used by OSPF. The class is:

- **A.** Class C private
- **B.** Class A unicast
- **C.** Class D multicast
- **D.** Class E experimental unicast

**Answer:** C
**Explanation:** 224–239 is Class D.

### Q13  ·  Intermediate
**Question:** CIDR prefix 10.0.0.0/12 has how many addresses?

- **A.** 254
- **B.** 16
- **C.** 2^(32−12)=2^20 = 1,048,576
- **D.** 2^12

**Answer:** C
**Explanation:** 20 host/network bits in the remaining field yield 2^20 addresses.

### Q14  ·  Intermediate
**Question:** Campus uses 172.16.0.0/16 internally and one public IP. The edge device performing many-to-one mapping is:

- **A.** NAPT/PAT (NAT with ports)
- **B.** An 802.11 AP with no IP
- **C.** A hub
- **D.** A bit-stuffer

**Answer:** A
**Explanation:** Port-level NAT shares one public address.

### Q15  ·  Intermediate
**Question:** Host 10.10.10.10 cannot be pinged from the public Internet without help. Why?

- **A.** 10.x is IPv6-only
- **B.** 10.x cannot exist on Ethernet
- **C.** It is RFC1918 private; it needs NAT or a tunnel
- **D.** 10.0.0.0/8 is Class D multicast

**Answer:** C
**Explanation:** 10.0.0.0/8 is private.

### Q16  ·  Intermediate
**Question:** IPv6 base header size is:

- **A.** 20 bytes
- **B.** 40 bytes
- **C.** 8 bytes
- **D.** 60 bytes always with IHL

**Answer:** B
**Explanation:** Fixed 40-byte IPv6 header.

### Q17  ·  Intermediate
**Question:** IPv6 header has no checksum. Error detection of the payload is left to:

- **A.** ALOHA
- **B.** IPv4 header checksum still present in IPv6
- **C.** Hamming SEC in every router
- **D.** Link CRC and transport checksums (TCP/UDP/ICMPv6)

**Answer:** D
**Explanation:** IPv6 omitted the header checksum on purpose.

### Q18  ·  Intermediate
**Question:** Longest prefix match chooses:

- **A.** The most specific matching route
- **B.** The Class A route always
- **C.** A random next hop
- **D.** The MAC with lowest OUI

**Answer:** A
**Explanation:** e.g. /24 beats /16 for the same dest.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **IHL** and **IPv6 next header**?

- **A.** IHL is hop limit.
- **B.** IPv6 uses IHL in the base header.
- **C.** IHL sizes the IPv4 header in 32-bit words; IPv6 uses a next-header chain instead of options in the base header.
- **D.** They are MAC addresses.

**Answer:** C
**Explanation:** IHL sizes the IPv4 header in 32-bit words; IPv6 uses a next-header chain instead of options in the base header.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **IPv4 fragmentation** and **IPv6 fragmentation**?

- **A.** IPv4 allows router fragmentation; IPv6 fragments only at the source via extension headers after Path-MTU discovery.
- **B.** IPv6 routers fragment like IPv4.
- **C.** They are both TDM.
- **D.** IPv4 never fragments.

**Answer:** A
**Explanation:** IPv4 allows router fragmentation; IPv6 fragments only at the source via extension headers after Path-MTU discovery.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **classful addressing** and **CIDR**?

- **A.** Classful uses A/B/C default masks; CIDR allows any prefix length and supernetting.
- **B.** Classful allows /20 as a class.
- **C.** CIDR forbids /20.
- **D.** They are identical to NAT.

**Answer:** A
**Explanation:** Classful uses A/B/C default masks; CIDR allows any prefix length and supernetting.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **public IPv4** and **private IPv4**?

- **A.** Private addresses are announced to all default-free routers.
- **B.** They differ only in MAC OUI.
- **C.** Public addresses are globally unique and routed; private RFC1918 addresses need NAT (or a VPN) to reach the Internet.
- **D.** Public addresses are 10.0.0.0/8 only.

**Answer:** C
**Explanation:** Public addresses are globally unique and routed; private RFC1918 addresses need NAT (or a VPN) to reach the Internet.

### Q23  ·  Intermediate
**Question:** Which option best describes **CIDR**?

- **A.** NAT of private addresses only.
- **B.** Using only Class A, B, C default masks.
- **C.** Classless Inter-Domain Routing: prefixes of arbitrary length (not bound to /8,/16,/24 classes).
- **D.** IPv6 SLAAC only.

**Answer:** C
**Explanation:** CIDR: Classless Inter-Domain Routing: prefixes of arbitrary length (not bound to /8,/16,/24 classes).

### Q24  ·  Intermediate
**Question:** Which option best describes **Class A**?

- **A.** Default mask /24.
- **B.** Unicast classful range 1.0.0.0–126.0.0.0 with default mask /8 (0.0.0.0/8 and 127.0.0.0/8 special).
- **C.** Reserved 240.0.0.0/4 as Class A.
- **D.** Multicast 224.0.0.0/4.

**Answer:** B
**Explanation:** Class A: Unicast classful range 1.0.0.0–126.0.0.0 with default mask /8 (0.0.0.0/8 and 127.0.0.0/8 special).

### Q25  ·  Intermediate
**Question:** Which option best describes **Class B**?

- **A.** Unicast classful range 128.0.0.0–191.255.0.0 with default mask /16.
- **B.** Multicast only.
- **C.** Default /24.
- **D.** Default /8.

**Answer:** A
**Explanation:** Class B: Unicast classful range 128.0.0.0–191.255.0.0 with default mask /16.

### Q26  ·  Intermediate
**Question:** Which option best describes **Class D**?

- **A.** Unicast /8.
- **B.** Private 10.0.0.0/8.
- **C.** Loopback 127.0.0.0/8.
- **D.** Multicast addresses 224.0.0.0–239.255.255.255 (224.0.0.0/4).

**Answer:** D
**Explanation:** Class D: Multicast addresses 224.0.0.0–239.255.255.255 (224.0.0.0/4).

### Q27  ·  Intermediate
**Question:** Which option best describes **Fragmentation**?

- **A.** Ethernet CSMA jam.
- **B.** TDM slot packing.
- **C.** Hamming SEC.
- **D.** IPv4 routers may fragment datagrams for a smaller MTU; IPv6 routers do not fragment (source uses Path MTU).

**Answer:** D
**Explanation:** Fragmentation: IPv4 routers may fragment datagrams for a smaller MTU; IPv6 routers do not fragment (source uses Path MTU).

### Q28  ·  Intermediate
**Question:** Which option best describes **IPv4 header**?

- **A.** An Ethernet preamble.
- **B.** A variable-length header, minimum 20 bytes, with IHL, TTL, protocol, checksum, src/dst, optional options.
- **C.** A TCP header only.
- **D.** A fixed 40-byte header with hop limit and no checksum.

**Answer:** B
**Explanation:** IPv4 header: A variable-length header, minimum 20 bytes, with IHL, TTL, protocol, checksum, src/dst, optional options.

### Q29  ·  Intermediate
**Question:** Which option best describes **IPv6 header**?

- **A.** A 20-byte header with IHL and header checksum.
- **B.** HDLC flags.
- **C.** 802.11 Duration.
- **D.** A fixed 40-byte base header: version, traffic class, flow label, payload length, next header, hop limit, 128-bit addresses.

**Answer:** D
**Explanation:** IPv6 header: A fixed 40-byte base header: version, traffic class, flow label, payload length, next header, hop limit, 128-bit addresses.

### Q30  ·  Intermediate
**Question:** Which option best describes **NAT**?

- **A.** CRC of frames.
- **B.** Network Address Translation: maps private (RFC1918) addresses to public ones, often with port mapping (NAPT).
- **C.** Assigning MAC addresses.
- **D.** IPv6-only SLAAC without IPv4.

**Answer:** B
**Explanation:** NAT: Network Address Translation: maps private (RFC1918) addresses to public ones, often with port mapping (NAPT).

### Q31  ·  Intermediate
**Question:** Which option best describes **Private address**?

- **A.** 1.1.1.1.
- **B.** 224.0.0.1 as a unicast private host.
- **C.** 8.8.8.8.
- **D.** RFC1918 space: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, not globally routed.

**Answer:** D
**Explanation:** Private address: RFC1918 space: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, not globally routed.

### Q32  ·  Intermediate
**Question:** Which option best describes **TTL / hop limit**?

- **A.** A field decremented by each router to discard looping packets (IPv4 TTL, IPv6 hop limit).
- **B.** The CRC remainder.
- **C.** The TCP port.
- **D.** The MAC OUI.

**Answer:** A
**Explanation:** TTL / hop limit: A field decremented by each router to discard looping packets (IPv4 TTL, IPv6 hop limit).

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **IPv6 packet walk (no fragment at router)**?

- **A.** Host PMTU as needed → 40-byte base header + next-header chain → routers decrement hop limit and forward
- **B.** Each router IHL-options fragment like IPv4
- **C.** Insert IPv4 checksum at every hop
- **D.** Convert to HDLC I-frames as routing

**Answer:** A
**Explanation:** Correct sequence for IPv6 packet walk (no fragment at router): Host PMTU as needed → 40-byte base header + next-header chain → routers decrement hop limit and forward

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **subnetting a /24 into /26**?

- **A.** Borrow 0 bits → still one /8
- **B.** Use Class D
- **C.** Borrow 2 bits → 4 subnets of 64 addresses (62 hosts) each, masks 255.255.255.192
- **D.** Assign 128-bit IPv6 as IPv4

**Answer:** C
**Explanation:** Correct sequence for subnetting a /24 into /26: Borrow 2 bits → 4 subnets of 64 addresses (62 hosts) each, masks 255.255.255.192

### Q35  ·  Intermediate
**Question:** Which statement about **Class B** is FALSE?

- **A.** Class B is correctly understood as: unicast classful range 128.0.0.0–191.255.0.0 with default mask /16.
- **B.** In this module, Class B is a core idea students must distinguish from nearby terms.
- **C.** Class B default mask is 255.0.0.0.
- **D.** A useful way to remember Class B is that it is not the same as “Default /8”.

**Answer:** C
**Explanation:** The false claim is: Class B default mask is 255.0.0.0.. Class B actually means: Unicast classful range 128.0.0.0–191.255.0.0 with default mask /16.

### Q36  ·  Intermediate
**Question:** Which statement about **Class D** is FALSE?

- **A.** Class D is correctly understood as: multicast addresses 224.0.0.0–239.255.255.255 (224.0.0.0/4).
- **B.** A useful way to remember Class D is that it is not the same as “Unicast /8”.
- **C.** Class D is for unicast hosts with mask /32 only.
- **D.** In this module, Class D is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Class D is for unicast hosts with mask /32 only.. Class D actually means: Multicast addresses 224.0.0.0–239.255.255.255 (224.0.0.0/4).

### Q37  ·  Intermediate
**Question:** Which statement about **Fragmentation** is FALSE?

- **A.** IPv6 core routers always fragment packets like IPv4.
- **B.** A useful way to remember Fragmentation is that it is not the same as “Ethernet CSMA jam”.
- **C.** Fragmentation is correctly understood as: iPv4 routers may fragment datagrams for a smaller MTU; IPv6 routers do not fragment (source uses Path MTU).
- **D.** In this module, Fragmentation is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: IPv6 core routers always fragment packets like IPv4.. Fragmentation actually means: IPv4 routers may fragment datagrams for a smaller MTU; IPv6 routers do not fragment (source uses Path MTU).

### Q38  ·  Intermediate
**Question:** Which statement about **IPv4 address** is FALSE?

- **A.** IPv4 addresses are 48 bits long.
- **B.** In this module, IPv4 address is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember IPv4 address is that it is not the same as “A 48-bit Ethernet MAC”.
- **D.** IPv4 address is correctly understood as: a 32-bit logical address identifying an interface, usually written in dotted decimal.

**Answer:** A
**Explanation:** The false claim is: IPv4 addresses are 48 bits long.. IPv4 address actually means: A 32-bit logical address identifying an interface, usually written in dotted decimal.

### Q39  ·  Intermediate
**Question:** Which statement about **IPv4 header** is FALSE?

- **A.** IPv4 header is correctly understood as: a variable-length header, minimum 20 bytes, with IHL, TTL, protocol, checksum, src/dst, optional options.
- **B.** A useful way to remember IPv4 header is that it is not the same as “A fixed 40-byte header with hop limit and no checksum”.
- **C.** The IPv4 header is always exactly 40 bytes with no checksum.
- **D.** In this module, IPv4 header is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: The IPv4 header is always exactly 40 bytes with no checksum.. IPv4 header actually means: A variable-length header, minimum 20 bytes, with IHL, TTL, protocol, checksum, src/dst, optional options.

### Q40  ·  Intermediate
**Question:** Which statement about **Internetworking** is FALSE?

- **A.** A useful way to remember Internetworking is that it is not the same as “Repeating bits inside one collision domain only”.
- **B.** Internetworking is achieved by hubs without logical addresses.
- **C.** In this module, Internetworking is a core idea students must distinguish from nearby terms.
- **D.** Internetworking is correctly understood as: connecting networks so packets can travel from a source network to a destination network via routers.

**Answer:** B
**Explanation:** The false claim is: Internetworking is achieved by hubs without logical addresses.. Internetworking actually means: Connecting networks so packets can travel from a source network to a destination network via routers.

### Q41  ·  Intermediate
**Question:** Which statement about **Private address** is FALSE?

- **A.** 192.0.2.1 is the only RFC1918 block.
- **B.** In this module, Private address is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Private address is that it is not the same as “8.8.8.8”.
- **D.** Private address is correctly understood as: rFC1918 space: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, not globally routed.

**Answer:** A
**Explanation:** The false claim is: 192.0.2.1 is the only RFC1918 block.. Private address actually means: RFC1918 space: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, not globally routed.

### Q42  ·  Intermediate
**Question:** Which statement about **Subnet mask** is FALSE?

- **A.** In this module, Subnet mask is a core idea students must distinguish from nearby terms.
- **B.** A subnet mask is always 255.255.255.255 for every LAN.
- **C.** Subnet mask is correctly understood as: a 32-bit mask that splits an IPv4 address into network/prefix and host parts.
- **D.** A useful way to remember Subnet mask is that it is not the same as “A 48-bit MAC filter”.

**Answer:** B
**Explanation:** The false claim is: A subnet mask is always 255.255.255.255 for every LAN.. Subnet mask actually means: A 32-bit mask that splits an IPv4 address into network/prefix and host parts.

### Q43  ·  Difficult
**Question:** 172.16.45.14/20 network and broadcast?

- **A.** 172.16.45.0 and 172.16.45.255
- **B.** 172.16.45.14 and 172.16.45.14
- **C.** 172.16.0.0 and 172.16.255.255
- **D.** 172.16.32.0 and 172.16.47.255

**Answer:** D
**Explanation:** Third octet 45 & 240 = 32; range .32.0–.47.255.

### Q44  ·  Difficult
**Question:** A packet with TTL=1 arrives at a router that is not the destination. The router:

- **A.** Forwards it with TTL=0 successfully
- **B.** Discards it and typically sends ICMP Time Exceeded
- **C.** Stores it until TTL grows
- **D.** Converts it to IPv6

**Answer:** B
**Explanation:** TTL<1 after decrement ⇒ drop.

### Q45  ·  Difficult
**Question:** A router must send an IPv6 packet larger than the next-link MTU. It should:

- **A.** Drop it and send ICMPv6 Packet Too Big (no router fragmentation)
- **B.** Fragment like IPv4 DF=0
- **C.** Convert to Ethernet CSMA/CD
- **D.** NAT to IPv4 automatically always

**Answer:** A
**Explanation:** IPv6 routers do not fragment.

### Q46  ·  Difficult
**Question:** Address 192.168.5.93/27. Network address?

- **A.** 192.168.5.0
- **B.** 192.168.5.95
- **C.** 192.168.5.64
- **D.** 192.168.5.93

**Answer:** C
**Explanation:** Block size 32; 93 lies in 64–95; network 192.168.5.64.

### Q47  ·  Difficult
**Question:** Host 192.168.1.130/26. Is 192.168.1.192 in the same subnet?

- **A.** Yes, both are Class A
- **B.** Yes, /26 covers .0–.255
- **C.** No (host is in .128/.26; .192 is the next network)
- **D.** Yes, both are 10.0.0.0/8

**Answer:** C
**Explanation:** .128–.191 vs .192–.255.

### Q48  ·  Difficult
**Question:** How many usable host addresses in a /24 (standard class C style)?

- **A.** 256
- **B.** 255
- **C.** 254
- **D.** 24

**Answer:** C
**Explanation:** 2^8 − 2 = 254 (exclude net and broadcast).

### Q49  ·  Difficult
**Question:** IPv6 address length in bits? IPv4 header minimum size in bytes?

- **A.** 32 bits and 40 bytes
- **B.** 128 bits and 20 bytes
- **C.** 48 bits and 18 bytes
- **D.** 64 bits and 8 bytes

**Answer:** B
**Explanation:** IPv6=128; IPv4 min IHL=5 → 20 bytes.

### Q50  ·  Difficult
**Question:** Mask of a /20 prefix?

- **A.** 255.255.240.0
- **B.** 255.240.0.0
- **C.** 255.255.255.240
- **D.** 255.255.0.0

**Answer:** A
**Explanation:** /20 means 20 ones: 255.255.240.0.

### Q51  ·  Difficult
**Question:** Same /27. Broadcast address and usable hosts?

- **A.** 192.168.5.95 and 30 hosts
- **B.** 192.168.5.255 and 254 hosts
- **C.** 192.168.5.64 and 32 hosts
- **D.** 192.168.5.127 and 62 hosts

**Answer:** A
**Explanation:** Broadcast 95; 2^5 − 2 = 30.

### Q52  ·  Difficult
**Question:** What is the most important distinction between **IPv4** and **IPv6**?

- **A.** IPv4 is 32-bit with a 20-byte min header and checksum; IPv6 is 128-bit with a 40-byte base header and no header checksum.
- **B.** They use the same header layout.
- **C.** IPv4 is 128-bit.
- **D.** IPv6 is 32-bit.

**Answer:** A
**Explanation:** IPv4 is 32-bit with a 20-byte min header and checksum; IPv6 is 128-bit with a 40-byte base header and no header checksum.

### Q53  ·  Difficult
**Question:** What is the most important distinction between **NAT** and **routing**?

- **A.** Routing always rewrites source IPs to RFC1918.
- **B.** They are CRC algorithms.
- **C.** NAT is a physical repeater.
- **D.** Routing forwards between networks; NAT also rewrites addresses/ports in the packet.

**Answer:** D
**Explanation:** Routing forwards between networks; NAT also rewrites addresses/ports in the packet.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **network address** and **broadcast address of a subnet**?

- **A.** They are always equal.
- **B.** Network address has host bits 0; directed broadcast has host bits 1.
- **C.** Network address is FF:FF:FF:FF:FF:FF.
- **D.** Broadcast is the /32 of the router only.

**Answer:** B
**Explanation:** Network address has host bits 0; directed broadcast has host bits 1.

### Q55  ·  Difficult
**Question:** Which IPv4 header field has no IPv6-base equivalent because IPv6 uses extension headers?

- **A.** IHL and options/checksum (among other differences)
- **B.** Source address (IPv6 has one)
- **C.** Destination address
- **D.** Hop limit (IPv6 has hop limit)

**Answer:** A
**Explanation:** IPv6 drops IHL, header checksum, and in-header options.

### Q56  ·  Difficult
**Question:** Which statement about **ARP** is FALSE?

- **A.** A useful way to remember ARP is that it is not the same as “Maps MAC to SSID”.
- **B.** In this module, ARP is a core idea students must distinguish from nearby terms.
- **C.** ARP assigns public IPv6 /48s.
- **D.** ARP is correctly understood as: address Resolution Protocol: maps an IPv4 address to a local MAC address.

**Answer:** C
**Explanation:** The false claim is: ARP assigns public IPv6 /48s.. ARP actually means: Address Resolution Protocol: maps an IPv4 address to a local MAC address.

### Q57  ·  Difficult
**Question:** Which statement about **CIDR** is FALSE?

- **A.** A useful way to remember CIDR is that it is not the same as “Using only Class A, B, C default masks”.
- **B.** CIDR forbids masks other than /8, /16 and /24.
- **C.** In this module, CIDR is a core idea students must distinguish from nearby terms.
- **D.** CIDR is correctly understood as: classless Inter-Domain Routing: prefixes of arbitrary length (not bound to /8,/16,/24 classes).

**Answer:** B
**Explanation:** The false claim is: CIDR forbids masks other than /8, /16 and /24.. CIDR actually means: Classless Inter-Domain Routing: prefixes of arbitrary length (not bound to /8,/16,/24 classes).

### Q58  ·  Difficult
**Question:** Which statement about **Class A** is FALSE?

- **A.** In this module, Class A is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Class A is that it is not the same as “Default mask /24”.
- **C.** Class A default mask is 255.255.255.0.
- **D.** Class A is correctly understood as: unicast classful range 1.0.0.0–126.0.0.0 with default mask /8 (0.0.0.0/8 and 127.0.0.0/8 special).

**Answer:** C
**Explanation:** The false claim is: Class A default mask is 255.255.255.0.. Class A actually means: Unicast classful range 1.0.0.0–126.0.0.0 with default mask /8 (0.0.0.0/8 and 127.0.0.0/8 special).

### Q59  ·  Difficult
**Question:** Which statement about **Class C** is FALSE?

- **A.** Class C default mask is 255.255.0.0.
- **B.** In this module, Class C is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Class C is that it is not the same as “Default /8”.
- **D.** Class C is correctly understood as: unicast classful range 192.0.0.0–223.255.255.0 with default mask /24.

**Answer:** A
**Explanation:** The false claim is: Class C default mask is 255.255.0.0.. Class C actually means: Unicast classful range 192.0.0.0–223.255.255.0 with default mask /24.

### Q60  ·  Difficult
**Question:** Which statement about **IPv6 address** is FALSE?

- **A.** IPv6 address is correctly understood as: a 128-bit logical address, written as eight hex groups, with ‘::’ compression.
- **B.** IPv6 addresses are 32 bits.
- **C.** A useful way to remember IPv6 address is that it is not the same as “A 32-bit dotted-decimal address”.
- **D.** In this module, IPv6 address is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: IPv6 addresses are 32 bits.. IPv6 address actually means: A 128-bit logical address, written as eight hex groups, with ‘::’ compression.

### Q61  ·  Difficult
**Question:** Which statement about **IPv6 header** is FALSE?

- **A.** In this module, IPv6 header is a core idea students must distinguish from nearby terms.
- **B.** IPv6 header is correctly understood as: a fixed 40-byte base header: version, traffic class, flow label, payload length, next header, hop limit, 128-bit addresses.
- **C.** A useful way to remember IPv6 header is that it is not the same as “A 20-byte header with IHL and header checksum”.
- **D.** IPv6 base header includes a header checksum like IPv4.

**Answer:** D
**Explanation:** The false claim is: IPv6 base header includes a header checksum like IPv4.. IPv6 header actually means: A fixed 40-byte base header: version, traffic class, flow label, payload length, next header, hop limit, 128-bit addresses.

### Q62  ·  Difficult
**Question:** Which statement about **NAT** is FALSE?

- **A.** A useful way to remember NAT is that it is not the same as “Assigning MAC addresses”.
- **B.** In this module, NAT is a core idea students must distinguish from nearby terms.
- **C.** NAT is a physical-layer line code.
- **D.** NAT is correctly understood as: network Address Translation: maps private (RFC1918) addresses to public ones, often with port mapping (NAPT).

**Answer:** C
**Explanation:** The false claim is: NAT is a physical-layer line code.. NAT actually means: Network Address Translation: maps private (RFC1918) addresses to public ones, often with port mapping (NAPT).

### Q63  ·  Difficult
**Question:** Which statement about **TTL / hop limit** is FALSE?

- **A.** In this module, TTL / hop limit is a core idea students must distinguish from nearby terms.
- **B.** TTL increases at every hop so packets loop forever on purpose.
- **C.** TTL / hop limit is correctly understood as: a field decremented by each router to discard looping packets (IPv4 TTL, IPv6 hop limit).
- **D.** A useful way to remember TTL / hop limit is that it is not the same as “The CRC remainder”.

**Answer:** B
**Explanation:** The false claim is: TTL increases at every hop so packets loop forever on purpose.. TTL / hop limit actually means: A field decremented by each router to discard looping packets (IPv4 TTL, IPv6 hop limit).

### Q64  ·  Difficult
**Question:** Why did IPv6 remove the header checksum?

- **A.** IPv6 cannot have errors
- **B.** UDP never checksums in IPv6 (false: UDP checksum is mandatory)
- **C.** Link CRC plus transport checksums make a hop-by-hop IP checksum costly and redundant; TTL/hop-limit still stops loops
- **D.** CRC is illegal on fibre

**Answer:** C
**Explanation:** Forouzan/RFCs: simplify forwarding; rely on L2 and L4.

### Q65  ·  Difficult
**Question:** You need 500 hosts in one subnet. Smallest prefix that fits (usable)?

- **A.** /23 (512−2=510)
- **B.** /24 (254 hosts)
- **C.** /32 (1 address)
- **D.** /30 (2 hosts)

**Answer:** A
**Explanation:** 2^9=512 addresses; usable 510.

---

## Quick answer key

Q01–A | Q02–A | Q03–C | Q04–C | Q05–A | Q06–C | Q07–B | Q08–C | Q09–D | Q10–D | Q11–C | Q12–C | Q13–C | Q14–A | Q15–C | Q16–B | Q17–D | Q18–A | Q19–C | Q20–A | Q21–A | Q22–C | Q23–C | Q24–B | Q25–A | Q26–D | Q27–D | Q28–B | Q29–D | Q30–B | Q31–D | Q32–A | Q33–A | Q34–C | Q35–C | Q36–C | Q37–A | Q38–A | Q39–C | Q40–B | Q41–A | Q42–B | Q43–D | Q44–B | Q45–A | Q46–C | Q47–C | Q48–C | Q49–B | Q50–A | Q51–A | Q52–A | Q53–D | Q54–B | Q55–A | Q56–C | Q57–B | Q58–C | Q59–A | Q60–B | Q61–D | Q62–C | Q63–B | Q64–C | Q65–A
