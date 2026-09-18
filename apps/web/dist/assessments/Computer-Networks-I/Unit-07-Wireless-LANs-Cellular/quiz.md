# Quiz — Computer Networks-I — Unit 7: Wireless LANs & Cellular

**Subject:** Computer Networks-I  
**Module:** Unit 7 — Wireless LANs & Cellular  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** 802.11 DCF is based on:

- **A.** CSMA/CA
- **B.** CSMA/CD
- **C.** Token ring
- **D.** Pure ALOHA only

**Answer:** A
**Explanation:** Distributed 802.11 uses CA, not CD.

### Q02  ·  Easy
**Question:** A hub operates primarily at OSI layer:

- **A.** 1 (physical)
- **B.** 2 (switch)
- **C.** 3 (router)
- **D.** 4 (TCP)

**Answer:** A
**Explanation:** Repeaters/hubs are physical-layer.

### Q03  ·  Easy
**Question:** Classic Bluetooth uses which ISM band?

- **A.** 5 GHz UNII only
- **B.** 1310 nm fibre
- **C.** 2.4 GHz
- **D.** 900 MHz AMPS only

**Answer:** C
**Explanation:** Bluetooth FHSS is 2.4 GHz ISM.

### Q04  ·  Easy
**Question:** Which option best describes **Access point**?

- **A.** The 802.11 station that bridges a BSS to the distribution system (often Ethernet).
- **B.** A T1 CSU.
- **C.** A Bluetooth slave only.
- **D.** An IPv6-only core router with no radio.

**Answer:** A
**Explanation:** Access point: The 802.11 station that bridges a BSS to the distribution system (often Ethernet).

### Q05  ·  Easy
**Question:** Which option best describes **Cellular reuse**?

- **A.** ALOHA G=0.5 as spectrum plan.
- **B.** Using one global frequency for all cells without reuse.
- **C.** Reusing the same frequency channels in cells separated by enough distance, organised in clusters of size N.
- **D.** WDM on fibre as the only cellular tool.

**Answer:** C
**Explanation:** Cellular reuse: Reusing the same frequency channels in cells separated by enough distance, organised in clusters of size N.

### Q06  ·  Easy
**Question:** Which option best describes **DIFS**?

- **A.** CRC remainder.
- **B.** Bluetooth hop interval only.
- **C.** The gap used immediately before an ACK (that is SIFS).
- **D.** DCF Interframe Space: the idle time a station must sense before a new contention for data.

**Answer:** D
**Explanation:** DIFS: DCF Interframe Space: the idle time a station must sense before a new contention for data.

### Q07  ·  Easy
**Question:** Which option best describes **Hidden terminal**?

- **A.** A station that always hears everyone.
- **B.** A station that cannot hear another sender but collides at the receiver.
- **C.** A wired hub.
- **D.** An AP with no clients.

**Answer:** B
**Explanation:** Hidden terminal: A station that cannot hear another sender but collides at the receiver.

### Q08  ·  Easy
**Question:** Which option best describes **Hub**?

- **A.** An application gateway.
- **B.** A network-layer router.
- **C.** A physical-layer multiport repeater: shared collision domain, no MAC learning.
- **D.** A data-link switch that learns MACs.

**Answer:** C
**Explanation:** Hub: A physical-layer multiport repeater: shared collision domain, no MAC learning.

### Q09  ·  Easy
**Question:** Which option best describes **IEEE 802.11**?

- **A.** The Ethernet 802.3 CSMA/CD copper standard only.
- **B.** IPv4 CIDR.
- **C.** The WLAN standard family defining MAC (DCF/PCF) and various PHYs (a/b/g/n/…).
- **D.** Bluetooth only.

**Answer:** C
**Explanation:** IEEE 802.11: The WLAN standard family defining MAC (DCF/PCF) and various PHYs (a/b/g/n/…).

### Q10  ·  Easy
**Question:** Which sequence correctly describes **802.11 DCF data+ACK (no RTS)**?

- **A.** Jam like Ethernet CD then token
- **B.** ALOHA send without IFS
- **C.** SIFS first for new data from idle always skipping DIFS
- **D.** Sense DIFS idle → backoff → send DATA → SIFS → ACK

**Answer:** D
**Explanation:** Correct sequence for 802.11 DCF data+ACK (no RTS): Sense DIFS idle → backoff → send DATA → SIFS → ACK

### Q11  ·  Easy
**Question:** Which sequence correctly describes **Bluetooth piconet formation (conceptual)**?

- **A.** CSMA/CD jam on coax
- **B.** IPv4 DHCP Discover as Bluetooth hops
- **C.** Inquiry/page → master assigns active-member addresses → FHSS slotted exchange
- **D.** Hamming SEC then WDM

**Answer:** C
**Explanation:** Correct sequence for Bluetooth piconet formation (conceptual): Inquiry/page → master assigns active-member addresses → FHSS slotted exchange

### Q12  ·  Intermediate
**Question:** A gateway in Forouzan’s connecting-devices discussion typically:

- **A.** Interconnects different protocol stacks (often up to application)
- **B.** Repeats analog voltages only
- **C.** Is a Bluetooth slave
- **D.** Is always a hub

**Answer:** A
**Explanation:** Gateways may translate protocols at higher layers.

### Q13  ·  Intermediate
**Question:** AMPS-era analog mobile voice is which generation?

- **A.** 4G LTE
- **B.** 2G GSM
- **C.** 1G
- **D.** 3G UMTS

**Answer:** C
**Explanation:** 1G analog cellular.

### Q14  ·  Intermediate
**Question:** NAV implements:

- **A.** IPv4 longest-prefix match
- **B.** Virtual carrier sensing from Duration fields
- **C.** Nyquist bit rate
- **D.** CRC-32 of Ethernet

**Answer:** B
**Explanation:** Stations defer until NAV expires.

### Q15  ·  Intermediate
**Question:** STA A cannot hear STA C, but both reach AP B. A and C are:

- **A.** Hidden terminals
- **B.** IPv4 NAT peers
- **C.** Exposed terminals only
- **D.** Ethernet hubs

**Answer:** A
**Explanation:** Classic hidden-terminal pair via the AP.

### Q16  ·  Intermediate
**Question:** Student PCs on one switch cannot reach another building’s subnet. You need a:

- **A.** Bluetooth master
- **B.** Hub
- **C.** Repeater only
- **D.** Router (or layer-3 switch routing)

**Answer:** D
**Explanation:** Inter-subnet forwarding is routing.

### Q17  ·  Intermediate
**Question:** The 802.11 ACK is sent after:

- **A.** EIFS only as the first choice for success
- **B.** A Bluetooth slot of 625 μs always
- **C.** SIFS
- **D.** DIFS only

**Answer:** C
**Explanation:** Control/ACK uses SIFS, shorter than DIFS.

### Q18  ·  Intermediate
**Question:** Two laptops associate to the same campus AP. They form (with the AP):

- **A.** A Bluetooth scatternet
- **B.** A Class A WAN
- **C.** A BSS (infrastructure)
- **D.** An ESS by themselves without DS

**Answer:** C
**Explanation:** One AP plus stations is a BSS.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **1G cellular** and **2G cellular**?

- **A.** 1G is LTE.
- **B.** 2G is analog FM only.
- **C.** 1G (AMPS-like) is analog voice; 2G (GSM/cdmaOne) is digital voice/SMS with better capacity/security.
- **D.** They are 802.11n.

**Answer:** C
**Explanation:** 1G (AMPS-like) is analog voice; 2G (GSM/cdmaOne) is digital voice/SMS with better capacity/security.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **802.11 DCF** and **Ethernet CSMA/CD**?

- **A.** DCF uses CA, IFS and ACKs on radio; Ethernet CD jams on a wired shared medium.
- **B.** Ethernet uses SIFS/DIFS.
- **C.** DCF jams the air like 10BASE5.
- **D.** They are identical MACs.

**Answer:** A
**Explanation:** DCF uses CA, IFS and ACKs on radio; Ethernet CD jams on a wired shared medium.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **hidden terminal** and **exposed terminal**?

- **A.** They are the same problem.
- **B.** Hidden terminals never collide.
- **C.** Hidden: cannot hear sender, collides at receiver. Exposed: hears a sender and defers though its own receiver is clear.
- **D.** Exposed terminals always collide.

**Answer:** C
**Explanation:** Hidden: cannot hear sender, collides at receiver. Exposed: hears a sender and defers though its own receiver is clear.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **switch** and **router**?

- **A.** A switch uses MAC within a LAN; a router uses IP between networks and breaks broadcasts.
- **B.** A router is a hub.
- **C.** They are the same OSI layer.
- **D.** A switch decrements TTL.

**Answer:** A
**Explanation:** A switch uses MAC within a LAN; a router uses IP between networks and breaks broadcasts.

### Q23  ·  Intermediate
**Question:** Which option best describes **BSS**?

- **A.** An IPv4 /8 class A network always.
- **B.** Basic Service Set: a group of 802.11 stations that communicate (with or without an AP).
- **C.** A GSM MSC.
- **D.** A Bluetooth scatternet only.

**Answer:** B
**Explanation:** BSS: Basic Service Set: a group of 802.11 stations that communicate (with or without an AP).

### Q24  ·  Intermediate
**Question:** Which option best describes **Bluetooth**?

- **A.** GSM circuit voice only.
- **B.** A short-range WPAN technology using 2.4 GHz FHSS, piconets and a master/slave model.
- **C.** IPv4 class E.
- **D.** IEEE 802.3 Gigabit Ethernet.

**Answer:** B
**Explanation:** Bluetooth: A short-range WPAN technology using 2.4 GHz FHSS, piconets and a master/slave model.

### Q25  ·  Intermediate
**Question:** Which option best describes **DCF**?

- **A.** Ethernet CSMA/CD jamming.
- **B.** Central PCF polls as the only 802.11 mode.
- **C.** Token passing on fibre.
- **D.** Distributed Coordination Function: 802.11 contention MAC using CSMA/CA, SIFS/DIFS and backoff.

**Answer:** D
**Explanation:** DCF: Distributed Coordination Function: 802.11 contention MAC using CSMA/CA, SIFS/DIFS and backoff.

### Q26  ·  Intermediate
**Question:** Which option best describes **ESS**?

- **A.** Extended Service Set: multiple BSSs interconnected via a distribution system, appearing as one WLAN.
- **B.** A piconet of 8 Bluetooth devices only.
- **C.** One Ethernet hub collision domain only.
- **D.** A single ad-hoc IBSS with no DS.

**Answer:** A
**Explanation:** ESS: Extended Service Set: multiple BSSs interconnected via a distribution system, appearing as one WLAN.

### Q27  ·  Intermediate
**Question:** Which option best describes **NAV**?

- **A.** A Hamming syndrome.
- **B.** Network Allocation Vector: a virtual-carrier-sense timer set from Duration in overheard frames.
- **C.** A physical RSSI-only sensor without duration.
- **D.** An IPv4 TTL.

**Answer:** B
**Explanation:** NAV: Network Allocation Vector: a virtual-carrier-sense timer set from Duration in overheard frames.

### Q28  ·  Intermediate
**Question:** Which option best describes **Piconet**?

- **A.** An 802.11 ESS spanning a campus.
- **B.** A Class A IPv4 network.
- **C.** A CDMA cell cluster of 7.
- **D.** A Bluetooth network with one master and up to seven active slaves.

**Answer:** D
**Explanation:** Piconet: A Bluetooth network with one master and up to seven active slaves.

### Q29  ·  Intermediate
**Question:** Which option best describes **RTS/CTS**?

- **A.** PPP LCP.
- **B.** AMI encoding.
- **C.** Ethernet jam after CD.
- **D.** Optional 802.11 handshake to reserve the medium and mitigate hidden terminals.

**Answer:** D
**Explanation:** RTS/CTS: Optional 802.11 handshake to reserve the medium and mitigate hidden terminals.

### Q30  ·  Intermediate
**Question:** Which option best describes **Router**?

- **A.** A layer-1 repeater.
- **B.** A hub.
- **C.** An 802.11-only AP with no IP.
- **D.** A network-layer device that forwards packets between networks using logical addresses.

**Answer:** D
**Explanation:** Router: A network-layer device that forwards packets between networks using logical addresses.

### Q31  ·  Intermediate
**Question:** Which option best describes **SIFS**?

- **A.** A GSM frame 4.615 ms always.
- **B.** The longest 802.11 wait, longer than DIFS.
- **C.** Short Interframe Space: the short idle gap before ACK/CTS/next fragment, highest priority among IFS.
- **D.** An IPv4 checksum.

**Answer:** C
**Explanation:** SIFS: Short Interframe Space: the short idle gap before ACK/CTS/next fragment, highest priority among IFS.

### Q32  ·  Intermediate
**Question:** Which option best describes **Switch**?

- **A.** A data-link device that forwards frames using MAC addresses and creates separate collision domains.
- **B.** A physical repeater only.
- **C.** A NAT box only.
- **D.** An IP router that decrements TTL as its MAC function.

**Answer:** A
**Explanation:** Switch: A data-link device that forwards frames using MAC addresses and creates separate collision domains.

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **RTS/CTS four-way**?

- **A.** DATA only then Ethernet jam
- **B.** CTS first from hidden node without RTS
- **C.** DIFS/backoff → RTS → SIFS → CTS → SIFS → DATA → SIFS → ACK
- **D.** Token then PPP LCP

**Answer:** C
**Explanation:** Correct sequence for RTS/CTS four-way: DIFS/backoff → RTS → SIFS → CTS → SIFS → DATA → SIFS → ACK

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **cellular handoff (simplified)**?

- **A.** Measure neighbour pilots → decide HO → signal via BS/MSC → retune to new channel → continue call
- **B.** Keep old frequency in all cells without reuse
- **C.** Switch Ethernet collision domain
- **D.** Bit-stuff HDLC flags

**Answer:** A
**Explanation:** Correct sequence for cellular handoff (simplified): Measure neighbour pilots → decide HO → signal via BS/MSC → retune to new channel → continue call

### Q35  ·  Intermediate
**Question:** Which statement about **Bluetooth** is FALSE?

- **A.** Bluetooth is correctly understood as: a short-range WPAN technology using 2.4 GHz FHSS, piconets and a master/slave model.
- **B.** A useful way to remember Bluetooth is that it is not the same as “IEEE 802.3 Gigabit Ethernet”.
- **C.** Bluetooth is a 5 GHz 802.11ac AP.
- **D.** In this module, Bluetooth is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Bluetooth is a 5 GHz 802.11ac AP.. Bluetooth actually means: A short-range WPAN technology using 2.4 GHz FHSS, piconets and a master/slave model.

### Q36  ·  Intermediate
**Question:** Which statement about **DCF** is FALSE?

- **A.** DCF is correctly understood as: distributed Coordination Function: 802.11 contention MAC using CSMA/CA, SIFS/DIFS and backoff.
- **B.** A useful way to remember DCF is that it is not the same as “Ethernet CSMA/CD jamming”.
- **C.** DCF is circuit-switched GSM.
- **D.** In this module, DCF is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: DCF is circuit-switched GSM.. DCF actually means: Distributed Coordination Function: 802.11 contention MAC using CSMA/CA, SIFS/DIFS and backoff.

### Q37  ·  Intermediate
**Question:** Which statement about **DIFS** is FALSE?

- **A.** In this module, DIFS is a core idea students must distinguish from nearby terms.
- **B.** DIFS is shorter than SIFS.
- **C.** DIFS is correctly understood as: dCF Interframe Space: the idle time a station must sense before a new contention for data.
- **D.** A useful way to remember DIFS is that it is not the same as “The gap used immediately before an ACK (that is SIFS)”.

**Answer:** B
**Explanation:** The false claim is: DIFS is shorter than SIFS.. DIFS actually means: DCF Interframe Space: the idle time a station must sense before a new contention for data.

### Q38  ·  Intermediate
**Question:** Which statement about **ESS** is FALSE?

- **A.** ESS is correctly understood as: extended Service Set: multiple BSSs interconnected via a distribution system, appearing as one WLAN.
- **B.** In this module, ESS is a core idea students must distinguish from nearby terms.
- **C.** An ESS is exactly one isolated ad-hoc radio with no APs.
- **D.** A useful way to remember ESS is that it is not the same as “A single ad-hoc IBSS with no DS”.

**Answer:** C
**Explanation:** The false claim is: An ESS is exactly one isolated ad-hoc radio with no APs.. ESS actually means: Extended Service Set: multiple BSSs interconnected via a distribution system, appearing as one WLAN.

### Q39  ·  Intermediate
**Question:** Which statement about **Hub** is FALSE?

- **A.** A useful way to remember Hub is that it is not the same as “A data-link switch that learns MACs”.
- **B.** A hub routes on IPv6 addresses.
- **C.** In this module, Hub is a core idea students must distinguish from nearby terms.
- **D.** Hub is correctly understood as: a physical-layer multiport repeater: shared collision domain, no MAC learning.

**Answer:** B
**Explanation:** The false claim is: A hub routes on IPv6 addresses.. Hub actually means: A physical-layer multiport repeater: shared collision domain, no MAC learning.

### Q40  ·  Intermediate
**Question:** Which statement about **IEEE 802.11** is FALSE?

- **A.** 802.11 is the token-ring MAC.
- **B.** In this module, IEEE 802.11 is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember IEEE 802.11 is that it is not the same as “The Ethernet 802.3 CSMA/CD copper standard only”.
- **D.** IEEE 802.11 is correctly understood as: the WLAN standard family defining MAC (DCF/PCF) and various PHYs (a/b/g/n/…).

**Answer:** A
**Explanation:** The false claim is: 802.11 is the token-ring MAC.. IEEE 802.11 actually means: The WLAN standard family defining MAC (DCF/PCF) and various PHYs (a/b/g/n/…).

### Q41  ·  Intermediate
**Question:** Which statement about **RTS/CTS** is FALSE?

- **A.** RTS/CTS is mandatory for every 64-byte Ethernet frame.
- **B.** In this module, RTS/CTS is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember RTS/CTS is that it is not the same as “Ethernet jam after CD”.
- **D.** RTS/CTS is correctly understood as: optional 802.11 handshake to reserve the medium and mitigate hidden terminals.

**Answer:** A
**Explanation:** The false claim is: RTS/CTS is mandatory for every 64-byte Ethernet frame.. RTS/CTS actually means: Optional 802.11 handshake to reserve the medium and mitigate hidden terminals.

### Q42  ·  Intermediate
**Question:** Which statement about **Router** is FALSE?

- **A.** A router forwards only on MAC tables and never inspects IP.
- **B.** A useful way to remember Router is that it is not the same as “A layer-1 repeater”.
- **C.** Router is correctly understood as: a network-layer device that forwards packets between networks using logical addresses.
- **D.** In this module, Router is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A router forwards only on MAC tables and never inspects IP.. Router actually means: A network-layer device that forwards packets between networks using logical addresses.

### Q43  ·  Difficult
**Question:** 802.11b SIFS = 10 μs, slot = 20 μs. DIFS = SIFS + 2×slot equals:

- **A.** 10 μs
- **B.** 30 μs
- **C.** 20 μs
- **D.** 50 μs

**Answer:** D
**Explanation:** 10 + 40 = 50 μs.

### Q44  ·  Difficult
**Question:** A Bluetooth headset talks to a phone. The phone is typically the:

- **A.** Master of a piconet
- **B.** 802.11 AP
- **C.** IPv6 core PMTU daemon
- **D.** GSM MSC

**Answer:** A
**Explanation:** The phone usually masters the piconet.

### Q45  ·  Difficult
**Question:** A cell radius R=1 km, N=3. Co-channel reuse distance D = R√(3N) is:

- **A.** 1 km
- **B.** √9 = 3 km
- **C.** 3√3 km
- **D.** 9 km

**Answer:** B
**Explanation:** √(9)=3; D=3 km.

### Q46  ·  Difficult
**Question:** A ‘switch’ that still floods all ports like a dumb repeater is really acting as a:

- **A.** Hub (no MAC learning)
- **B.** Router
- **C.** Firewall gateway
- **D.** MSC

**Answer:** A
**Explanation:** No learning ⇒ hub behaviour.

### Q47  ·  Difficult
**Question:** Bluetooth basic-rate hopping: 79 channels, hop rate 1600 hops/s. Dwell time per hop?

- **A.** 1600 ms
- **B.** 1 s
- **C.** 625 μs
- **D.** 79 μs

**Answer:** C
**Explanation:** 1/1600 s = 625 μs (a Bluetooth slot).

### Q48  ·  Difficult
**Question:** Classic Bluetooth piconet: maximum active slaves plus master?

- **A.** 2
- **B.** 79
- **C.** 8 devices (1+7)
- **D.** 256

**Answer:** C
**Explanation:** One master and up to seven active slaves.

### Q49  ·  Difficult
**Question:** Cluster size N = i^2 + ij + j^2. For i=2, j=1, N is:

- **A.** 7
- **B.** 4
- **C.** 3
- **D.** 12

**Answer:** A
**Explanation:** 4+2+1 = 7, the classic 7-cell reuse.

### Q50  ·  Difficult
**Question:** GSM digital TDMA voice/SMS is commonly:

- **A.** 5G NR only
- **B.** 1G analog
- **C.** 2G
- **D.** 802.11 DCF

**Answer:** C
**Explanation:** GSM is the iconic 2G system.

### Q51  ·  Difficult
**Question:** RTS/CTS mainly helps when:

- **A.** Hidden terminals would collide DATA frames
- **B.** SNR is infinite
- **C.** Using full-duplex 802.3 only
- **D.** All stations are wired hubs

**Answer:** A
**Explanation:** CTS informs hidden nodes of the reservation.

### Q52  ·  Difficult
**Question:** Reuse distance: D = R√(3N). If R=2 km and N=7, D ≈ ?

- **A.** ≈ 9.2 km
- **B.** 7 km
- **C.** 2 km
- **D.** 3 km

**Answer:** A
**Explanation:** √21 ≈ 4.58; D ≈ 2×4.58 ≈ 9.17 km.

### Q53  ·  Difficult
**Question:** Roaming across several APs with the same SSID on a wired DS is:

- **A.** An IBSS ad-hoc only
- **B.** An ESS
- **C.** A collision-free hub
- **D.** A piconet

**Answer:** B
**Explanation:** Multiple BSSs + DS = ESS.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **BSS** and **ESS**?

- **A.** A BSS is one AP (or IBSS); an ESS is multiple BSSs via a DS, one SSID roaming domain.
- **B.** They are Bluetooth piconets.
- **C.** BSS always spans a city of APs.
- **D.** ESS cannot include APs.

**Answer:** A
**Explanation:** A BSS is one AP (or IBSS); an ESS is multiple BSSs via a DS, one SSID roaming domain.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **Bluetooth piconet** and **802.11 BSS**?

- **A.** A BSS has a Bluetooth master.
- **B.** Piconet: master+≤7 slaves, FHSS WPAN. BSS: 802.11 CSMA/CA WLAN, typically an AP and many STAs.
- **C.** They use identical frames.
- **D.** A piconet is Ethernet CSMA/CD.

**Answer:** B
**Explanation:** Piconet: master+≤7 slaves, FHSS WPAN. BSS: 802.11 CSMA/CA WLAN, typically an AP and many STAs.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **hub** and **switch**?

- **A.** A hub learns MAC tables.
- **B.** They both route IP.
- **C.** A switch is layer 1 only.
- **D.** A hub repeats bits to all ports (one collision domain); a switch forwards by MAC.

**Answer:** D
**Explanation:** A hub repeats bits to all ports (one collision domain); a switch forwards by MAC.

### Q57  ·  Difficult
**Question:** Which statement about **Access point** is FALSE?

- **A.** An AP never forwards frames to wired Ethernet.
- **B.** In this module, Access point is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Access point is that it is not the same as “A Bluetooth slave only”.
- **D.** Access point is correctly understood as: the 802.11 station that bridges a BSS to the distribution system (often Ethernet).

**Answer:** A
**Explanation:** The false claim is: An AP never forwards frames to wired Ethernet.. Access point actually means: The 802.11 station that bridges a BSS to the distribution system (often Ethernet).

### Q58  ·  Difficult
**Question:** Which statement about **BSS** is FALSE?

- **A.** In this module, BSS is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember BSS is that it is not the same as “An IPv4 /8 class A network always”.
- **C.** A BSS cannot contain an access point.
- **D.** BSS is correctly understood as: basic Service Set: a group of 802.11 stations that communicate (with or without an AP).

**Answer:** C
**Explanation:** The false claim is: A BSS cannot contain an access point.. BSS actually means: Basic Service Set: a group of 802.11 stations that communicate (with or without an AP).

### Q59  ·  Difficult
**Question:** Which statement about **Cellular reuse** is FALSE?

- **A.** A useful way to remember Cellular reuse is that it is not the same as “Using one global frequency for all cells without reuse”.
- **B.** In this module, Cellular reuse is a core idea students must distinguish from nearby terms.
- **C.** Frequency reuse forbids using a channel more than once on Earth.
- **D.** Cellular reuse is correctly understood as: reusing the same frequency channels in cells separated by enough distance, organised in clusters of size N.

**Answer:** C
**Explanation:** The false claim is: Frequency reuse forbids using a channel more than once on Earth.. Cellular reuse actually means: Reusing the same frequency channels in cells separated by enough distance, organised in clusters of size N.

### Q60  ·  Difficult
**Question:** Which statement about **Hidden terminal** is FALSE?

- **A.** Hidden terminal is correctly understood as: a station that cannot hear another sender but collides at the receiver.
- **B.** Hidden terminals cannot cause collisions.
- **C.** A useful way to remember Hidden terminal is that it is not the same as “A station that always hears everyone”.
- **D.** In this module, Hidden terminal is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Hidden terminals cannot cause collisions.. Hidden terminal actually means: A station that cannot hear another sender but collides at the receiver.

### Q61  ·  Difficult
**Question:** Which statement about **NAV** is FALSE?

- **A.** A useful way to remember NAV is that it is not the same as “A physical RSSI-only sensor without duration”.
- **B.** In this module, NAV is a core idea students must distinguish from nearby terms.
- **C.** NAV is an IP routing metric.
- **D.** NAV is correctly understood as: network Allocation Vector: a virtual-carrier-sense timer set from Duration in overheard frames.

**Answer:** C
**Explanation:** The false claim is: NAV is an IP routing metric.. NAV actually means: Network Allocation Vector: a virtual-carrier-sense timer set from Duration in overheard frames.

### Q62  ·  Difficult
**Question:** Which statement about **Piconet** is FALSE?

- **A.** In this module, Piconet is a core idea students must distinguish from nearby terms.
- **B.** Piconet is correctly understood as: a Bluetooth network with one master and up to seven active slaves.
- **C.** A useful way to remember Piconet is that it is not the same as “An 802.11 ESS spanning a campus”.
- **D.** A piconet allows 256 active slaves simultaneously in classic BR/EDR.

**Answer:** D
**Explanation:** The false claim is: A piconet allows 256 active slaves simultaneously in classic BR/EDR.. Piconet actually means: A Bluetooth network with one master and up to seven active slaves.

### Q63  ·  Difficult
**Question:** Which statement about **SIFS** is FALSE?

- **A.** A useful way to remember SIFS is that it is not the same as “The longest 802.11 wait, longer than DIFS”.
- **B.** SIFS is longer than DIFS by design.
- **C.** In this module, SIFS is a core idea students must distinguish from nearby terms.
- **D.** SIFS is correctly understood as: short Interframe Space: the short idle gap before ACK/CTS/next fragment, highest priority among IFS.

**Answer:** B
**Explanation:** The false claim is: SIFS is longer than DIFS by design.. SIFS actually means: Short Interframe Space: the short idle gap before ACK/CTS/next fragment, highest priority among IFS.

### Q64  ·  Difficult
**Question:** Which statement about **Switch** is FALSE?

- **A.** In this module, Switch is a core idea students must distinguish from nearby terms.
- **B.** A switch forwards using IPv4 longest-match as its primary job.
- **C.** Switch is correctly understood as: a data-link device that forwards frames using MAC addresses and creates separate collision domains.
- **D.** A useful way to remember Switch is that it is not the same as “A physical repeater only”.

**Answer:** B
**Explanation:** The false claim is: A switch forwards using IPv4 longest-match as its primary job.. Switch actually means: A data-link device that forwards frames using MAC addresses and creates separate collision domains.

### Q65  ·  Difficult
**Question:** Why is N=7 popular in hexagonal reuse?

- **A.** N must equal OSI’s 7 layers
- **B.** Bluetooth allows 7 APs
- **C.** i=2,j=1 gives N=7, a practical D/R and cluster that tiles the plane
- **D.** 7 is Shannon capacity

**Answer:** C
**Explanation:** N=i^2+ij+j^2; (2,1)→7.

---

## Quick answer key

Q01–A | Q02–A | Q03–C | Q04–A | Q05–C | Q06–D | Q07–B | Q08–C | Q09–C | Q10–D | Q11–C | Q12–A | Q13–C | Q14–B | Q15–A | Q16–D | Q17–C | Q18–C | Q19–C | Q20–A | Q21–C | Q22–A | Q23–B | Q24–B | Q25–D | Q26–A | Q27–B | Q28–D | Q29–D | Q30–D | Q31–C | Q32–A | Q33–C | Q34–A | Q35–C | Q36–C | Q37–B | Q38–C | Q39–B | Q40–A | Q41–A | Q42–A | Q43–D | Q44–A | Q45–B | Q46–A | Q47–C | Q48–C | Q49–A | Q50–C | Q51–A | Q52–A | Q53–B | Q54–A | Q55–B | Q56–D | Q57–A | Q58–C | Q59–C | Q60–B | Q61–C | Q62–D | Q63–B | Q64–B | Q65–C
