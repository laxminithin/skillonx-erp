# Quiz — Computer Networks-I — Unit 1: Introduction & Network Models

**Subject:** Computer Networks-I  
**Module:** Unit 1 — Introduction & Network Models  
**Questions:** 67  
**Mix:** 11 Easy · 33 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** How many layers does the OSI reference model have?

- **A.** 5
- **B.** 11
- **C.** 7
- **D.** 4

**Answer:** C
**Explanation:** OSI: physical through application, seven layers.

### Q02  ·  Easy
**Question:** UDP and TCP port numbers are examples of:

- **A.** Physical addresses
- **B.** WDM lambdas
- **C.** Port (service) addresses
- **D.** IPv4 network masks

**Answer:** C
**Explanation:** Ports identify processes at the transport layer.

### Q03  ·  Easy
**Question:** Which TCP/IP layer roughly maps to OSI network?

- **A.** Application only
- **B.** Internet (IP) layer
- **C.** Physical pinout only
- **D.** Presentation only

**Answer:** B
**Explanation:** IP provides logical addressing and routing.

### Q04  ·  Easy
**Question:** Which option best describes **Data communication**?

- **A.** Storing files on a local disk with no transfer.
- **B.** Compiling a C program.
- **C.** Exchange of data between two devices through a transmission medium, judged by delivery, accuracy, timeliness and jitter.
- **D.** Formatting a hard disk.

**Answer:** C
**Explanation:** Data communication: Exchange of data between two devices through a transmission medium, judged by delivery, accuracy, timeliness and jitter.

### Q05  ·  Easy
**Question:** Which option best describes **Internet**?

- **A.** One Bluetooth piconet.
- **B.** A campus PBX with no packet switching.
- **C.** A single Ethernet collision domain only.
- **D.** A global internetwork of networks that communicate using TCP/IP.

**Answer:** D
**Explanation:** Internet: A global internetwork of networks that communicate using TCP/IP.

### Q06  ·  Easy
**Question:** Which option best describes **Logical address**?

- **A.** The TCP destination port only.
- **B.** The Ethernet MAC burned into the NIC only.
- **C.** The network-layer identifier of a host, such as an IPv4 or IPv6 address.
- **D.** The CRC remainder of a frame.

**Answer:** C
**Explanation:** Logical address: The network-layer identifier of a host, such as an IPv4 or IPv6 address.

### Q07  ·  Easy
**Question:** Which option best describes **Physical layer**?

- **A.** The layer that assigns port numbers to processes.
- **B.** The layer that moves bits as signals over a medium and defines mechanical/electrical specs.
- **C.** The layer that computes shortest IP paths.
- **D.** The layer that encrypts HTTP cookies.

**Answer:** B
**Explanation:** Physical layer: The layer that moves bits as signals over a medium and defines mechanical/electrical specs.

### Q08  ·  Easy
**Question:** Which option best describes **Timeliness**?

- **A.** The requirement that data arrive within an acceptable delay, especially for audio and video.
- **B.** Choosing an IP checksum polynomial.
- **C.** Archiving tapes after ten years only.
- **D.** Printing the NIC MAC on paper.

**Answer:** A
**Explanation:** Timeliness: The requirement that data arrive within an acceptable delay, especially for audio and video.

### Q09  ·  Easy
**Question:** Which option best describes **Transport layer**?

- **A.** The layer that specifies coaxial impedance.
- **B.** The layer that floods spanning-tree BPDUs only.
- **C.** The layer that provides process-to-process delivery, often with reliability and port addressing.
- **D.** The layer that modulates ASK on copper.

**Answer:** C
**Explanation:** Transport layer: The layer that provides process-to-process delivery, often with reliability and port addressing.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **OSI layers from bottom to top**?

- **A.** Application → Physical → TCP → Hub → User
- **B.** Network → Physical → Presentation → Token → RJ45
- **C.** Physical → Data-link → Network → Transport → Session → Presentation → Application
- **D.** Session → CRC → ASK → ARP → DNS only

**Answer:** C
**Explanation:** Correct sequence for OSI layers from bottom to top: Physical → Data-link → Network → Transport → Session → Presentation → Application

### Q11  ·  Easy
**Question:** Which sequence correctly describes **receiver decapsulation**?

- **A.** Signal → frame → packet → segment → data
- **B.** Packet → skip MAC → application bits as voltage only
- **C.** Presentation → physical → destroy ports
- **D.** CRC remainder → IGP metric → RJ45 colour

**Answer:** A
**Explanation:** Correct sequence for receiver decapsulation: Signal → frame → packet → segment → data

### Q12  ·  Intermediate
**Question:** A 48-bit NIC identifier is a:

- **A.** Port address
- **B.** Protocol number in IP
- **C.** Physical address
- **D.** Logical /32 IPv6-only address

**Answer:** C
**Explanation:** Ethernet MACs are link-layer physical addresses.

### Q13  ·  Intermediate
**Question:** A VoIP call is delivered intact but syllables bunch and stretch. Which quality metric failed?

- **A.** Jitter
- **B.** RJ45 pinout
- **C.** Delivery only
- **D.** MAC uniqueness

**Answer:** A
**Explanation:** Delay variation, not mere loss of the bits, is jitter.

### Q14  ·  Intermediate
**Question:** A switch forwards a frame using the destination NIC identifier. Which address is it using?

- **A.** AS number
- **B.** IPv4 logical address
- **C.** TCP port
- **D.** Physical (MAC) address

**Answer:** D
**Explanation:** Switches are data-link devices and use MAC addresses.

### Q15  ·  Intermediate
**Question:** Host A sends to host B on another campus. Which address must change at each hop while the logical address stays the same?

- **A.** The IPv4 destination address of B
- **B.** The DNS name of B
- **C.** The well-known HTTP port on B
- **D.** The physical (MAC) address

**Answer:** D
**Explanation:** Hop-by-hop MACs change; the IP destination is end-to-end.

### Q16  ·  Intermediate
**Question:** Two hosts agree on PDU format, timing and error handling before they can talk. They are defining a:

- **A.** Slide theme
- **B.** Random bit scramble
- **C.** Protocol
- **D.** Hub collision recipe only

**Answer:** C
**Explanation:** Those rules are a protocol.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **OSI model** and **TCP/IP model**?

- **A.** TCP/IP has exactly the same seven named layers as OSI.
- **B.** They differ only in the colour of textbooks.
- **C.** OSI is a 7-layer reference model; TCP/IP is a 4-layer implemented suite used on the Internet.
- **D.** OSI is the only suite hosts actually run on the public Internet.

**Answer:** C
**Explanation:** OSI is a 7-layer reference model; TCP/IP is a 4-layer implemented suite used on the Internet.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **connection-oriented** and **connectionless service**?

- **A.** Connection-oriented UDP stores no sockets.
- **B.** They are physical-layer line codes.
- **C.** Connection-oriented service sets up state before data; connectionless sends datagrams independently.
- **D.** Connectionless TCP always handshakes first.

**Answer:** C
**Explanation:** Connection-oriented service sets up state before data; connectionless sends datagrams independently.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **jitter** and **delay**?

- **A.** Delay is defined only for optical fibre colour.
- **B.** Jitter is always equal to propagation delay.
- **C.** Delay is the time to traverse the path; jitter is the variation of that delay.
- **D.** They are identical OSI layer names.

**Answer:** C
**Explanation:** Delay is the time to traverse the path; jitter is the variation of that delay.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **logical address** and **port address**?

- **A.** A logical address names the host; a port address names the process on that host.
- **B.** Ports replace IP addresses in IPv4 headers.
- **C.** Both are used only inside Ethernet preambles.
- **D.** Logical addresses are 16-bit TCP ports.

**Answer:** A
**Explanation:** A logical address names the host; a port address names the process on that host.

### Q21  ·  Intermediate
**Question:** Which device typically uses logical addresses to forward data?

- **A.** Passive splitter
- **B.** Repeater
- **C.** Router
- **D.** Ethernet hub

**Answer:** C
**Explanation:** Routers forward on IP (logical) addresses.

### Q22  ·  Intermediate
**Question:** Which is not a fundamental characteristic of data communication in Forouzan’s treatment?

- **A.** Cable jacket colour
- **B.** Accuracy
- **C.** Timeliness
- **D.** Delivery

**Answer:** A
**Explanation:** The four are delivery, accuracy, timeliness and jitter.

### Q23  ·  Intermediate
**Question:** Which option best describes **Accuracy**?

- **A.** The requirement that data arrive unaltered, or that alterations are detectable/correctable.
- **B.** Deleting sequence numbers.
- **C.** Using the longest possible route.
- **D.** Maximising jitter on purpose.

**Answer:** A
**Explanation:** Accuracy: The requirement that data arrive unaltered, or that alterations are detectable/correctable.

### Q24  ·  Intermediate
**Question:** Which option best describes **Data-link layer**?

- **A.** The layer that translates Unicode.
- **B.** The layer that frames bits, controls access to the medium and often detects errors hop-by-hop.
- **C.** The layer that opens a remote login session.
- **D.** The layer that routes packets across autonomous systems.

**Answer:** B
**Explanation:** Data-link layer: The layer that frames bits, controls access to the medium and often detects errors hop-by-hop.

### Q25  ·  Intermediate
**Question:** Which option best describes **Delivery**?

- **A.** Encrypting the payload only.
- **B.** The requirement that data must reach the intended destination.
- **C.** Measuring SNR of a silent channel.
- **D.** Choosing a font for the packet.

**Answer:** B
**Explanation:** Delivery: The requirement that data must reach the intended destination.

### Q26  ·  Intermediate
**Question:** Which option best describes **Jitter**?

- **A.** The average end-to-end delay itself.
- **B.** The bit error rate of a cable.
- **C.** The IPv4 header length.
- **D.** Variation in packet delay that distorts streamed audio or video.

**Answer:** D
**Explanation:** Jitter: Variation in packet delay that distorts streamed audio or video.

### Q27  ·  Intermediate
**Question:** Which option best describes **Network layer**?

- **A.** The layer that defines RJ45 pinouts.
- **B.** The layer that runs only CRC on a frame.
- **C.** The layer that converts ASCII to EBCDIC.
- **D.** The layer responsible for host-to-host packet delivery, logical addressing and routing.

**Answer:** D
**Explanation:** Network layer: The layer responsible for host-to-host packet delivery, logical addressing and routing.

### Q28  ·  Intermediate
**Question:** Which option best describes **Network**?

- **A.** One unconnected laptop.
- **B.** A single isolated USB stick.
- **C.** A set of devices connected by media that can share data and resources.
- **D.** A printed circuit diagram only.

**Answer:** C
**Explanation:** Network: A set of devices connected by media that can share data and resources.

### Q29  ·  Intermediate
**Question:** Which option best describes **OSI model**?

- **A.** Only the TCP and IP headers.
- **B.** A cabling colour code.
- **C.** A three-layer model of hub, switch and printer.
- **D.** A seven-layer reference model: physical, data-link, network, transport, session, presentation, application.

**Answer:** D
**Explanation:** OSI model: A seven-layer reference model: physical, data-link, network, transport, session, presentation, application.

### Q30  ·  Intermediate
**Question:** Which option best describes **Physical address**?

- **A.** A 32-bit IPv4 address.
- **B.** An autonomous-system number.
- **C.** A 16-bit TCP port.
- **D.** The link-layer identifier of a node, typically a 48-bit MAC on Ethernet.

**Answer:** D
**Explanation:** Physical address: The link-layer identifier of a node, typically a 48-bit MAC on Ethernet.

### Q31  ·  Intermediate
**Question:** Which option best describes **Port address**?

- **A.** A transport-layer identifier that distinguishes processes on a host, e.g. TCP port 80.
- **B.** The IPv4 dotted-decimal host id only.
- **C.** The 48-bit NIC burned-in address.
- **D.** The VLAN tag EtherType exclusively.

**Answer:** A
**Explanation:** Port address: A transport-layer identifier that distinguishes processes on a host, e.g. TCP port 80.

### Q32  ·  Intermediate
**Question:** Which option best describes **Protocol**?

- **A.** The colour of an RJ45 boot.
- **B.** A set of rules that governs format, meaning, timing and error handling of exchanged messages.
- **C.** A random scramble of bits with no agreement.
- **D.** A hardware vendor logo.

**Answer:** B
**Explanation:** Protocol: A set of rules that governs format, meaning, timing and error handling of exchanged messages.

### Q33  ·  Intermediate
**Question:** Which option best describes **TCP/IP model**?

- **A.** A practical suite whose layers are typically host-to-network, internet, transport and application.
- **B.** A seven-layer ISO standard identical to OSI in names and PDUs.
- **C.** A token-ring MAC exclusively.
- **D.** A physical-only signalling method.

**Answer:** A
**Explanation:** TCP/IP model: A practical suite whose layers are typically host-to-network, internet, transport and application.

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **TCP/IP layers top to bottom (common 4-layer view)**?

- **A.** Application → Transport → Internet → Host-to-network
- **B.** Physical → HTTP → Session → Token-ring only
- **C.** Internet → Presentation → Coax → Port 0
- **D.** Transport → RJ45 → MPEG → Hub

**Answer:** A
**Explanation:** Correct sequence for TCP/IP layers top to bottom (common 4-layer view): Application → Transport → Internet → Host-to-network

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **sender encapsulation**?

- **A.** Data → segment/datagram → packet → frame → bits/signal
- **B.** Bits → HTTP cookie → optical lambda as the first step always
- **C.** Frame → destroy IP header → application only
- **D.** Signal → skip layers → presentation encryption of RJ45

**Answer:** A
**Explanation:** Correct sequence for sender encapsulation: Data → segment/datagram → packet → frame → bits/signal

### Q36  ·  Intermediate
**Question:** Which statement about **Accuracy** is FALSE?

- **A.** Accuracy is correctly understood as: the requirement that data arrive unaltered, or that alterations are detectable/correctable.
- **B.** In this module, Accuracy is a core idea students must distinguish from nearby terms.
- **C.** Accuracy means the receiver may freely rewrite the payload.
- **D.** A useful way to remember Accuracy is that it is not the same as “Maximising jitter on purpose”.

**Answer:** C
**Explanation:** The false claim is: Accuracy means the receiver may freely rewrite the payload.. Accuracy actually means: The requirement that data arrive unaltered, or that alterations are detectable/correctable.

### Q37  ·  Intermediate
**Question:** Which statement about **Data communication** is FALSE?

- **A.** Data communication is complete even if the message never reaches the destination.
- **B.** In this module, Data communication is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Data communication is that it is not the same as “Storing files on a local disk with no transfer”.
- **D.** Data communication is correctly understood as: exchange of data between two devices through a transmission medium, judged by delivery, accuracy, timeliness and jitter.

**Answer:** A
**Explanation:** The false claim is: Data communication is complete even if the message never reaches the destination.. Data communication actually means: Exchange of data between two devices through a transmission medium, judged by delivery, accuracy, timeliness and jitter.

### Q38  ·  Intermediate
**Question:** Which statement about **Data-link layer** is FALSE?

- **A.** Data-link layer is correctly understood as: the layer that frames bits, controls access to the medium and often detects errors hop-by-hop.
- **B.** A useful way to remember Data-link layer is that it is not the same as “The layer that routes packets across autonomous systems”.
- **C.** The data-link layer assigns public IPv4 addresses to hosts.
- **D.** In this module, Data-link layer is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: The data-link layer assigns public IPv4 addresses to hosts.. Data-link layer actually means: The layer that frames bits, controls access to the medium and often detects errors hop-by-hop.

### Q39  ·  Intermediate
**Question:** Which statement about **Internet** is FALSE?

- **A.** In this module, Internet is a core idea students must distinguish from nearby terms.
- **B.** The Internet is a single LAN with one hub.
- **C.** Internet is correctly understood as: a global internetwork of networks that communicate using TCP/IP.
- **D.** A useful way to remember Internet is that it is not the same as “A single Ethernet collision domain only”.

**Answer:** B
**Explanation:** The false claim is: The Internet is a single LAN with one hub.. Internet actually means: A global internetwork of networks that communicate using TCP/IP.

### Q40  ·  Intermediate
**Question:** Which statement about **Jitter** is FALSE?

- **A.** Jitter is correctly understood as: variation in packet delay that distorts streamed audio or video.
- **B.** A useful way to remember Jitter is that it is not the same as “The average end-to-end delay itself”.
- **C.** Jitter is identical to constant propagation delay.
- **D.** In this module, Jitter is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Jitter is identical to constant propagation delay.. Jitter actually means: Variation in packet delay that distorts streamed audio or video.

### Q41  ·  Intermediate
**Question:** Which statement about **OSI model** is FALSE?

- **A.** OSI has four layers: physical, network, HTTP and user.
- **B.** In this module, OSI model is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember OSI model is that it is not the same as “A three-layer model of hub, switch and printer”.
- **D.** OSI model is correctly understood as: a seven-layer reference model: physical, data-link, network, transport, session, presentation, application.

**Answer:** A
**Explanation:** The false claim is: OSI has four layers: physical, network, HTTP and user.. OSI model actually means: A seven-layer reference model: physical, data-link, network, transport, session, presentation, application.

### Q42  ·  Intermediate
**Question:** Which statement about **Physical address** is FALSE?

- **A.** A physical address is assigned by IANA as a /24 prefix.
- **B.** A useful way to remember Physical address is that it is not the same as “A 32-bit IPv4 address”.
- **C.** Physical address is correctly understood as: the link-layer identifier of a node, typically a 48-bit MAC on Ethernet.
- **D.** In this module, Physical address is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A physical address is assigned by IANA as a /24 prefix.. Physical address actually means: The link-layer identifier of a node, typically a 48-bit MAC on Ethernet.

### Q43  ·  Intermediate
**Question:** Which statement about **Port address** is FALSE?

- **A.** A port address uniquely identifies a router worldwide the way an IP address does.
- **B.** In this module, Port address is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Port address is that it is not the same as “The 48-bit NIC burned-in address”.
- **D.** Port address is correctly understood as: a transport-layer identifier that distinguishes processes on a host, e.g. TCP port 80.

**Answer:** A
**Explanation:** The false claim is: A port address uniquely identifies a router worldwide the way an IP address does.. Port address actually means: A transport-layer identifier that distinguishes processes on a host, e.g. TCP port 80.

### Q44  ·  Intermediate
**Question:** Which statement about **Transport layer** is FALSE?

- **A.** A useful way to remember Transport layer is that it is not the same as “The layer that modulates ASK on copper”.
- **B.** The transport layer replaces MAC addresses with frequencies.
- **C.** In this module, Transport layer is a core idea students must distinguish from nearby terms.
- **D.** Transport layer is correctly understood as: the layer that provides process-to-process delivery, often with reliability and port addressing.

**Answer:** B
**Explanation:** The false claim is: The transport layer replaces MAC addresses with frequencies.. Transport layer actually means: The layer that provides process-to-process delivery, often with reliability and port addressing.

### Q45  ·  Difficult
**Question:** A 1 Mbps link has one-way delay 10 ms. What is the bandwidth-delay product in bits?

- **A.** 1,000 bits
- **B.** 1 Mbps
- **C.** 10 bits
- **D.** 10,000 bits

**Answer:** D
**Explanation:** BDP = 10^6 bits/s × 0.01 s = 10,000 bits (the pipe contents in flight).

### Q46  ·  Difficult
**Question:** A 1500-byte packet is sent on a 10 Mbps link. What is the transmission delay?

- **A.** 1.2 ms
- **B.** 10 μs
- **C.** 1500 ms
- **D.** 8 s

**Answer:** A
**Explanation:** Tt = (1500 × 8) / 10×10^6 = 1.2×10^−3 s = 1.2 ms.

### Q47  ·  Difficult
**Question:** A browser fetches https://vviet.ac.in. Which address identifies the HTTP process on the server?

- **A.** Port 443 (transport port address)
- **B.** The server’s Ethernet MAC alone
- **C.** The CRC-32 remainder
- **D.** The fibre wavelength

**Answer:** A
**Explanation:** Process identification uses a port; HTTPS uses 443.

### Q48  ·  Difficult
**Question:** A file arrives complete and correct three hours later than the live lecture needed it. Which criterion failed?

- **A.** Accuracy
- **B.** Delivery
- **C.** Timeliness
- **D.** Physical addressing

**Answer:** C
**Explanation:** It was delivered accurately but not in time.

### Q49  ·  Difficult
**Question:** A path has processing 1 ms, queueing 3 ms, transmission 2 ms and propagation 6 ms. End-to-end nodal delay?

- **A.** 6 ms
- **B.** 12 ms
- **C.** 1 ms
- **D.** 2 ms

**Answer:** B
**Explanation:** Delay = proc + queue + trans + prop = 1+3+2+6 = 12 ms.

### Q50  ·  Difficult
**Question:** A router forwards a datagram toward another network. Which layer is primarily at work?

- **A.** Network layer
- **B.** Physical pinout layer only
- **C.** Presentation ASN.1 only
- **D.** Session checkpointing only

**Answer:** A
**Explanation:** Internetwork forwarding is a network-layer job.

### Q51  ·  Difficult
**Question:** A signal travels 2000 km in fibre at 2×10^8 m/s. What is the propagation delay?

- **A.** 10 ms
- **B.** 2000 μs
- **C.** 2 ms
- **D.** 1 s

**Answer:** A
**Explanation:** Tp = 2000 km / 2×10^8 m/s = 2×10^6 m / 2×10^8 m/s = 0.01 s = 10 ms.

### Q52  ·  Difficult
**Question:** An IPv4 address is 32 bits and an Ethernet MAC is 48 bits. How many extra bits does the MAC have?

- **A.** 32
- **B.** 48
- **C.** 16
- **D.** 8

**Answer:** C
**Explanation:** 48 − 32 = 16 bits.

### Q53  ·  Difficult
**Question:** Five 1000-bit packets are sent back-to-back on a 1 Mbps link (ignore gaps). Total transmission time?

- **A.** 1 ms
- **B.** 5 ms
- **C.** 1000 ms
- **D.** 5 μs

**Answer:** B
**Explanation:** Each packet takes 1000/10^6 = 1 ms; five packets take 5 ms.

### Q54  ·  Difficult
**Question:** In encapsulation, an IP packet is the payload of:

- **A.** A data-link frame
- **B.** A physical-layer RJ45 pin
- **C.** A DNS SOA record always
- **D.** An application cookie

**Answer:** A
**Explanation:** The frame encapsulates the network-layer packet.

### Q55  ·  Difficult
**Question:** OSI places encryption and data compression typically in which layer?

- **A.** Physical
- **B.** Network routing
- **C.** Presentation
- **D.** Token-bus MAC

**Answer:** C
**Explanation:** Presentation handles syntax, encryption and compression.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **delivery** and **timeliness**?

- **A.** Timeliness ignores delay completely.
- **B.** Delivery requires arrival at the destination; timeliness requires arrival within an acceptable delay.
- **C.** They are the same jitter metric.
- **D.** Delivery forbids checksums.

**Answer:** B
**Explanation:** Delivery requires arrival at the destination; timeliness requires arrival within an acceptable delay.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **physical address** and **logical address**?

- **A.** Physical addresses are assigned by DHCP as /32s.
- **B.** They are interchangeable in every header.
- **C.** Logical addresses are always 48-bit MACs.
- **D.** A physical address identifies a node on a local link; a logical address identifies a host across networks.

**Answer:** D
**Explanation:** A physical address identifies a node on a local link; a logical address identifies a host across networks.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **unicast** and **broadcast**?

- **A.** Broadcast always uses a TCP port of 0.
- **B.** Unicast cannot use IPv4.
- **C.** Unicast sends to one destination; broadcast sends to all nodes in the domain.
- **D.** They differ only in cable category.

**Answer:** C
**Explanation:** Unicast sends to one destination; broadcast sends to all nodes in the domain.

### Q59  ·  Difficult
**Question:** Which statement about **Delivery** is FALSE?

- **A.** In this module, Delivery is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Delivery is that it is not the same as “Encrypting the payload only”.
- **C.** Delivery is satisfied if a frame is sent, even when it is never received.
- **D.** Delivery is correctly understood as: the requirement that data must reach the intended destination.

**Answer:** C
**Explanation:** The false claim is: Delivery is satisfied if a frame is sent, even when it is never received.. Delivery actually means: The requirement that data must reach the intended destination.

### Q60  ·  Difficult
**Question:** Which statement about **Logical address** is FALSE?

- **A.** A useful way to remember Logical address is that it is not the same as “The Ethernet MAC burned into the NIC only”.
- **B.** In this module, Logical address is a core idea students must distinguish from nearby terms.
- **C.** A logical address exists only at the physical layer.
- **D.** Logical address is correctly understood as: the network-layer identifier of a host, such as an IPv4 or IPv6 address.

**Answer:** C
**Explanation:** The false claim is: A logical address exists only at the physical layer.. Logical address actually means: The network-layer identifier of a host, such as an IPv4 or IPv6 address.

### Q61  ·  Difficult
**Question:** Which statement about **Network layer** is FALSE?

- **A.** In this module, Network layer is a core idea students must distinguish from nearby terms.
- **B.** Network layer is correctly understood as: the layer responsible for host-to-host packet delivery, logical addressing and routing.
- **C.** A useful way to remember Network layer is that it is not the same as “The layer that defines RJ45 pinouts”.
- **D.** The network layer is where Ethernet CSMA/CD always runs.

**Answer:** D
**Explanation:** The false claim is: The network layer is where Ethernet CSMA/CD always runs.. Network layer actually means: The layer responsible for host-to-host packet delivery, logical addressing and routing.

### Q62  ·  Difficult
**Question:** Which statement about **Network** is FALSE?

- **A.** A useful way to remember Network is that it is not the same as “A single isolated USB stick”.
- **B.** A network cannot contain switches or routers.
- **C.** In this module, Network is a core idea students must distinguish from nearby terms.
- **D.** Network is correctly understood as: a set of devices connected by media that can share data and resources.

**Answer:** B
**Explanation:** The false claim is: A network cannot contain switches or routers.. Network actually means: A set of devices connected by media that can share data and resources.

### Q63  ·  Difficult
**Question:** Which statement about **Physical layer** is FALSE?

- **A.** Physical layer is correctly understood as: the layer that moves bits as signals over a medium and defines mechanical/electrical specs.
- **B.** The physical layer decides TCP retransmission timeouts.
- **C.** A useful way to remember Physical layer is that it is not the same as “The layer that assigns port numbers to processes”.
- **D.** In this module, Physical layer is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The physical layer decides TCP retransmission timeouts.. Physical layer actually means: The layer that moves bits as signals over a medium and defines mechanical/electrical specs.

### Q64  ·  Difficult
**Question:** Which statement about **Protocol** is FALSE?

- **A.** A useful way to remember Protocol is that it is not the same as “A random scramble of bits with no agreement”.
- **B.** In this module, Protocol is a core idea students must distinguish from nearby terms.
- **C.** A protocol is optional if both hosts use electricity.
- **D.** Protocol is correctly understood as: a set of rules that governs format, meaning, timing and error handling of exchanged messages.

**Answer:** C
**Explanation:** The false claim is: A protocol is optional if both hosts use electricity.. Protocol actually means: A set of rules that governs format, meaning, timing and error handling of exchanged messages.

### Q65  ·  Difficult
**Question:** Which statement about **TCP/IP model** is FALSE?

- **A.** In this module, TCP/IP model is a core idea students must distinguish from nearby terms.
- **B.** TCP/IP forbids IP and UDP.
- **C.** TCP/IP model is correctly understood as: a practical suite whose layers are typically host-to-network, internet, transport and application.
- **D.** A useful way to remember TCP/IP model is that it is not the same as “A seven-layer ISO standard identical to OSI in names and PDUs”.

**Answer:** B
**Explanation:** The false claim is: TCP/IP forbids IP and UDP.. TCP/IP model actually means: A practical suite whose layers are typically host-to-network, internet, transport and application.

### Q66  ·  Difficult
**Question:** Which statement about **Timeliness** is FALSE?

- **A.** Timeliness is irrelevant for real-time voice.
- **B.** In this module, Timeliness is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Timeliness is that it is not the same as “Archiving tapes after ten years only”.
- **D.** Timeliness is correctly understood as: the requirement that data arrive within an acceptable delay, especially for audio and video.

**Answer:** A
**Explanation:** The false claim is: Timeliness is irrelevant for real-time voice.. Timeliness actually means: The requirement that data arrive within an acceptable delay, especially for audio and video.

### Q67  ·  Difficult
**Question:** Which statement about jitter is most accurate?

- **A.** It is variation in delay and harms isochronous streams even if mean delay is moderate
- **B.** It is identical to bit error rate
- **C.** It is TCP’s well-known port
- **D.** It is the MAC address length

**Answer:** A
**Explanation:** Jitter is delay variation, critical for audio/video.

---

## Quick answer key

Q01–C | Q02–C | Q03–B | Q04–C | Q05–D | Q06–C | Q07–B | Q08–A | Q09–C | Q10–C | Q11–A | Q12–C | Q13–A | Q14–D | Q15–D | Q16–C | Q17–C | Q18–C | Q19–C | Q20–A | Q21–C | Q22–A | Q23–A | Q24–B | Q25–B | Q26–D | Q27–D | Q28–C | Q29–D | Q30–D | Q31–A | Q32–B | Q33–A | Q34–A | Q35–A | Q36–C | Q37–A | Q38–C | Q39–B | Q40–C | Q41–A | Q42–A | Q43–A | Q44–B | Q45–D | Q46–A | Q47–A | Q48–C | Q49–B | Q50–A | Q51–A | Q52–C | Q53–B | Q54–A | Q55–C | Q56–B | Q57–D | Q58–C | Q59–C | Q60–C | Q61–D | Q62–B | Q63–B | Q64–C | Q65–B | Q66–A | Q67–A
