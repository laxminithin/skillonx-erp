# Quiz — Computer Networks-I — Unit 6: Multiple Access & Ethernet

**Subject:** Computer Networks-I  
**Module:** Unit 6 — Multiple Access & Ethernet  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** IEEE 802.3 is:

- **A.** Wi-Fi MAC
- **B.** IPv4
- **C.** Ethernet
- **D.** Bluetooth

**Answer:** C
**Explanation:** 802.3 = Ethernet.

### Q02  ·  Easy
**Question:** Pure ALOHA maximum throughput is about:

- **A.** 18.4%
- **B.** 36.8%
- **C.** 100%
- **D.** 50%

**Answer:** A
**Explanation:** 1/(2e) ≈ 18.4%.

### Q03  ·  Easy
**Question:** Slotted ALOHA maximum throughput is about:

- **A.** 36.8%
- **B.** 18.4%
- **C.** 100%
- **D.** 9%

**Answer:** A
**Explanation:** 1/e ≈ 36.8%.

### Q04  ·  Easy
**Question:** Which option best describes **1-persistent CSMA**?

- **A.** Wait a random time without sensing when idle.
- **B.** Never transmit.
- **C.** Transmit with probability p<1 when idle.
- **D.** If the medium is idle, transmit with probability 1; if busy, keep sensing until idle.

**Answer:** D
**Explanation:** 1-persistent CSMA: If the medium is idle, transmit with probability 1; if busy, keep sensing until idle.

### Q05  ·  Easy
**Question:** Which option best describes **ALOHA**?

- **A.** A reserved TDM slot per station always.
- **B.** Token passing only.
- **C.** A random-access scheme: stations transmit when they have data and retransmit after collision (pure or slotted).
- **D.** Central polling only.

**Answer:** C
**Explanation:** ALOHA: A random-access scheme: stations transmit when they have data and retransmit after collision (pure or slotted).

### Q06  ·  Easy
**Question:** Which option best describes **CSMA**?

- **A.** Carrier Sense Multiple Access: listen before transmit to reduce collisions.
- **B.** Hamming SEC.
- **C.** Transmit without sensing, as in pure ALOHA only.
- **D.** Centralised FDMA only.

**Answer:** A
**Explanation:** CSMA: Carrier Sense Multiple Access: listen before transmit to reduce collisions.

### Q07  ·  Easy
**Question:** Which option best describes **Collision domain**?

- **A.** A VLAN name only.
- **B.** A unique IP /32.
- **C.** A network region where simultaneous transmissions collide (shared hub/coax).
- **D.** An AS number.

**Answer:** C
**Explanation:** Collision domain: A network region where simultaneous transmissions collide (shared hub/coax).

### Q08  ·  Easy
**Question:** Which option best describes **Ethernet**?

- **A.** Bluetooth piconets only.
- **B.** IPv6 neighbour discovery only.
- **C.** IEEE 802.3 LAN family originally using CSMA/CD on shared media, now mostly switched full-duplex.
- **D.** A token-bus-only standard.

**Answer:** C
**Explanation:** Ethernet: IEEE 802.3 LAN family originally using CSMA/CD on shared media, now mostly switched full-duplex.

### Q09  ·  Easy
**Question:** Which option best describes **FDMA**?

- **A.** Time slots only.
- **B.** Frequency Division Multiple Access: stations share spectrum by frequency bands.
- **C.** Ethernet jam signals.
- **D.** Orthogonal codes only.

**Answer:** B
**Explanation:** FDMA: Frequency Division Multiple Access: stations share spectrum by frequency bands.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **CSMA/CA (simplified DCF)**?

- **A.** Jam the medium on collision detect like 10BASE5
- **B.** GBN rewind of IP
- **C.** DIFS idle → backoff → send → wait ACK; collision inferred by missing ACK; optional RTS/CTS
- **D.** CRC-only without MAC

**Answer:** C
**Explanation:** Correct sequence for CSMA/CA (simplified DCF): DIFS idle → backoff → send → wait ACK; collision inferred by missing ACK; optional RTS/CTS

### Q11  ·  Easy
**Question:** Which sequence correctly describes **pure ALOHA send**?

- **A.** Wait for token always
- **B.** Reserve a TDM slot from birth
- **C.** Sense forever and never send
- **D.** If data ready → transmit immediately → if collision/no ACK, random backoff → retry

**Answer:** D
**Explanation:** Correct sequence for pure ALOHA send: If data ready → transmit immediately → if collision/no ACK, random backoff → retry

### Q12  ·  Intermediate
**Question:** BEB in Ethernet means:

- **A.** Baud-equalised baseband
- **B.** Binary exponential backoff after collision
- **C.** Byte even parity
- **D.** Burst error block

**Answer:** B
**Explanation:** K random slots from 0…2^k−1, k up to 10.

### Q13  ·  Intermediate
**Question:** IS-95/cdmaOne lets users share a band with codes. This is:

- **A.** WDM on copper
- **B.** Token ring
- **C.** CDMA
- **D.** Stop-and-Wait

**Answer:** C
**Explanation:** Code-division sharing is CDMA.

### Q14  ·  Intermediate
**Question:** Minimum Ethernet frame (without preamble) is:

- **A.** 64 bytes
- **B.** 1518 bytes only
- **C.** 512 bytes always
- **D.** 46 bytes total including MAC headers

**Answer:** A
**Explanation:** 64 bytes including dest/src/type/FCS; 46-byte min payload with padding.

### Q15  ·  Intermediate
**Question:** Replacing that hub with a switch (full-duplex) means:

- **A.** ALOHA G must be 10
- **B.** CSMA/CD still required on every packet
- **C.** MACs become 16 bits
- **D.** Each link is its own collision domain (typically none if full-duplex)

**Answer:** D
**Explanation:** Switched full-duplex Ethernet does not collide.

### Q16  ·  Intermediate
**Question:** Stations send whenever a packet is ready and collide often. The protocol is:

- **A.** TDMA with reserved slots
- **B.** Polling by a primary
- **C.** Pure ALOHA
- **D.** Token passing

**Answer:** C
**Explanation:** Unslotted random send is pure ALOHA.

### Q17  ·  Intermediate
**Question:** The vulnerable period of pure ALOHA is:

- **A.** Zero
- **B.** One bit
- **C.** Two frame times
- **D.** One slot

**Answer:** C
**Explanation:** A frame can collide with one starting up to T before or after.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **10 Mbps Ethernet** and **Fast Ethernet**?

- **A.** 10 Mbps Ethernet cannot use CSMA/CD.
- **B.** Fast Ethernet uses 16-bit MACs.
- **C.** Same 802.3 framing; Fast Ethernet is 100 Mbps with different PHYs (e.g. 4B/5B+MLT-3).
- **D.** They have unrelated frame formats.

**Answer:** C
**Explanation:** Same 802.3 framing; Fast Ethernet is 100 Mbps with different PHYs (e.g. 4B/5B+MLT-3).

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **CSMA/CD** and **CSMA/CA**?

- **A.** CA is Ethernet jamming.
- **B.** They are identical.
- **C.** CD detects and aborts collisions (wired Ethernet); CA avoids them (WLANs) because CD is hard on radio.
- **D.** CD is 802.11 DCF.

**Answer:** C
**Explanation:** CD detects and aborts collisions (wired Ethernet); CA avoids them (WLANs) because CD is hard on radio.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **FDMA** and **TDMA**?

- **A.** FDMA splits frequency; TDMA splits time.
- **B.** TDMA splits frequency.
- **C.** They are CSMA jam signals.
- **D.** FDMA splits only codes.

**Answer:** A
**Explanation:** FDMA splits frequency; TDMA splits time.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **pure ALOHA** and **slotted ALOHA**?

- **A.** Pure allows send-anytime (max ≈18.4%); slotted aligns to slots (max ≈36.8%).
- **B.** Slotted has vulnerable period 2T.
- **C.** Pure has higher max throughput.
- **D.** They have identical S(G).

**Answer:** A
**Explanation:** Pure allows send-anytime (max ≈18.4%); slotted aligns to slots (max ≈36.8%).

### Q22  ·  Intermediate
**Question:** Which option best describes **CDMA**?

- **A.** Only FDM bands.
- **B.** Only token rings.
- **C.** Only Stop-and-Wait.
- **D.** Code Division Multiple Access: stations transmit together using orthogonal/PN codes.

**Answer:** D
**Explanation:** CDMA: Code Division Multiple Access: stations transmit together using orthogonal/PN codes.

### Q23  ·  Intermediate
**Question:** Which option best describes **CSMA/CA**?

- **A.** TDM trunking only.
- **B.** Ethernet half-duplex collision detection jamming.
- **C.** CSMA with Collision Avoidance: reduce collision probability (IFS, backoff, optional RTS/CTS); used in WLANs.
- **D.** CRC-only links.

**Answer:** C
**Explanation:** CSMA/CA: CSMA with Collision Avoidance: reduce collision probability (IFS, backoff, optional RTS/CTS); used in WLANs.

### Q24  ·  Intermediate
**Question:** Which option best describes **CSMA/CD**?

- **A.** CSMA with Collision Avoidance used on 802.11 without CD.
- **B.** Token passing.
- **C.** Pure ALOHA.
- **D.** CSMA with Collision Detection: abort a colliding transmission and jam, then backoff.

**Answer:** D
**Explanation:** CSMA/CD: CSMA with Collision Detection: abort a colliding transmission and jam, then backoff.

### Q25  ·  Intermediate
**Question:** Which option best describes **Controlled access**?

- **A.** Unslotted ALOHA only.
- **B.** Blind transmit anytime.
- **C.** Pure ALOHA.
- **D.** Medium access via reservation, polling or token passing rather than random contention.

**Answer:** D
**Explanation:** Controlled access: Medium access via reservation, polling or token passing rather than random contention.

### Q26  ·  Intermediate
**Question:** Which option best describes **Fast Ethernet**?

- **A.** IEEE 802.3u 100 Mbps Ethernet, keeping 802.3 frame format (100BASE-TX, etc.).
- **B.** 10 Gbps only.
- **C.** 802.11n only.
- **D.** Original 10 Mbps thicknet only.

**Answer:** A
**Explanation:** Fast Ethernet: IEEE 802.3u 100 Mbps Ethernet, keeping 802.3 frame format (100BASE-TX, etc.).

### Q27  ·  Intermediate
**Question:** Which option best describes **Gigabit Ethernet**?

- **A.** Always CSMA/CD with 64-byte slot at 1 km copper half-duplex without extension.
- **B.** T1 1.544 Mbps.
- **C.** Token ring 16 Mbps.
- **D.** IEEE 802.3z/ab 1000 Mbps Ethernet; half-duplex used carrier extension/bursting, full-duplex is typical.

**Answer:** D
**Explanation:** Gigabit Ethernet: IEEE 802.3z/ab 1000 Mbps Ethernet; half-duplex used carrier extension/bursting, full-duplex is typical.

### Q28  ·  Intermediate
**Question:** Which option best describes **Pure ALOHA**?

- **A.** Stations may send only at slot starts; S = G e^{−G}.
- **B.** Stations send at arbitrary times; vulnerable period is 2 frame times; S = G e^{−2G}.
- **C.** FDMA channels only.
- **D.** CSMA/CD with carrier sense mandatory.

**Answer:** B
**Explanation:** Pure ALOHA: Stations send at arbitrary times; vulnerable period is 2 frame times; S = G e^{−2G}.

### Q29  ·  Intermediate
**Question:** Which option best describes **Slotted ALOHA**?

- **A.** Time is slotted; a station sends only at the beginning of a slot; S = G e^{−G}.
- **B.** WDM.
- **C.** Token ring.
- **D.** Send anytime; vulnerable period 2T.

**Answer:** A
**Explanation:** Slotted ALOHA: Time is slotted; a station sends only at the beginning of a slot; S = G e^{−G}.

### Q30  ·  Intermediate
**Question:** Which option best describes **TDMA**?

- **A.** CDMA chips only.
- **B.** Time Division Multiple Access: stations share by assigned time slots.
- **C.** Manchester-only radio.
- **D.** Random ALOHA only.

**Answer:** B
**Explanation:** TDMA: Time Division Multiple Access: stations share by assigned time slots.

### Q31  ·  Intermediate
**Question:** Which option best describes **p-persistent CSMA**?

- **A.** Token passing.
- **B.** In slotted CSMA, transmit with probability p if idle; otherwise wait a slot and repeat.
- **C.** Always send immediately with probability 1.
- **D.** Never sense the carrier.

**Answer:** B
**Explanation:** p-persistent CSMA: In slotted CSMA, transmit with probability p if idle; otherwise wait a slot and repeat.

### Q32  ·  Intermediate
**Question:** Which sequence correctly describes **CSMA/CD (half-duplex Ethernet)**?

- **A.** Never sense → ALOHA only
- **B.** RTS/CTS then radio ACK as on 802.3 copper always
- **C.** Sense idle → send → if collision, jam → backoff (BEB) → retry; else finish frame
- **D.** Token then FHSS

**Answer:** C
**Explanation:** Correct sequence for CSMA/CD (half-duplex Ethernet): Sense idle → send → if collision, jam → backoff (BEB) → retry; else finish frame

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **token passing**?

- **A.** Hold token → send frame(s) under a limit → pass token to next station
- **B.** Transmit at any time without token
- **C.** CSMA jam then token
- **D.** ALOHA G=0.5 as token

**Answer:** A
**Explanation:** Correct sequence for token passing: Hold token → send frame(s) under a limit → pass token to next station

### Q34  ·  Intermediate
**Question:** Which statement about **1-persistent CSMA** is FALSE?

- **A.** In this module, 1-persistent CSMA is a core idea students must distinguish from nearby terms.
- **B.** 1-persistent CSMA always waits a slot even if the medium is idle.
- **C.** 1-persistent CSMA is correctly understood as: if the medium is idle, transmit with probability 1; if busy, keep sensing until idle.
- **D.** A useful way to remember 1-persistent CSMA is that it is not the same as “Transmit with probability p<1 when idle”.

**Answer:** B
**Explanation:** The false claim is: 1-persistent CSMA always waits a slot even if the medium is idle.. 1-persistent CSMA actually means: If the medium is idle, transmit with probability 1; if busy, keep sensing until idle.

### Q35  ·  Intermediate
**Question:** Which statement about **ALOHA** is FALSE?

- **A.** ALOHA never allows collisions by construction.
- **B.** In this module, ALOHA is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember ALOHA is that it is not the same as “A reserved TDM slot per station always”.
- **D.** ALOHA is correctly understood as: a random-access scheme: stations transmit when they have data and retransmit after collision (pure or slotted).

**Answer:** A
**Explanation:** The false claim is: ALOHA never allows collisions by construction.. ALOHA actually means: A random-access scheme: stations transmit when they have data and retransmit after collision (pure or slotted).

### Q36  ·  Intermediate
**Question:** Which statement about **CSMA/CD** is FALSE?

- **A.** CSMA/CD is correctly understood as: cSMA with Collision Detection: abort a colliding transmission and jam, then backoff.
- **B.** A useful way to remember CSMA/CD is that it is not the same as “CSMA with Collision Avoidance used on 802.11 without CD”.
- **C.** CSMA/CD is the Wi-Fi DCF method that never detects collisions.
- **D.** In this module, CSMA/CD is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: CSMA/CD is the Wi-Fi DCF method that never detects collisions.. CSMA/CD actually means: CSMA with Collision Detection: abort a colliding transmission and jam, then backoff.

### Q37  ·  Intermediate
**Question:** Which statement about **Controlled access** is FALSE?

- **A.** Controlled access maximises collisions on purpose.
- **B.** In this module, Controlled access is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Controlled access is that it is not the same as “Pure ALOHA”.
- **D.** Controlled access is correctly understood as: medium access via reservation, polling or token passing rather than random contention.

**Answer:** A
**Explanation:** The false claim is: Controlled access maximises collisions on purpose.. Controlled access actually means: Medium access via reservation, polling or token passing rather than random contention.

### Q38  ·  Intermediate
**Question:** Which statement about **Ethernet** is FALSE?

- **A.** A useful way to remember Ethernet is that it is not the same as “A token-bus-only standard”.
- **B.** Ethernet cannot use MAC addresses.
- **C.** In this module, Ethernet is a core idea students must distinguish from nearby terms.
- **D.** Ethernet is correctly understood as: iEEE 802.3 LAN family originally using CSMA/CD on shared media, now mostly switched full-duplex.

**Answer:** B
**Explanation:** The false claim is: Ethernet cannot use MAC addresses.. Ethernet actually means: IEEE 802.3 LAN family originally using CSMA/CD on shared media, now mostly switched full-duplex.

### Q39  ·  Intermediate
**Question:** Which statement about **Gigabit Ethernet** is FALSE?

- **A.** Gigabit Ethernet always requires CSMA/CD even on full-duplex switches.
- **B.** A useful way to remember Gigabit Ethernet is that it is not the same as “Always CSMA/CD with 64-byte slot at 1 km copper half-duplex without extension”.
- **C.** Gigabit Ethernet is correctly understood as: iEEE 802.3z/ab 1000 Mbps Ethernet; half-duplex used carrier extension/bursting, full-duplex is typical.
- **D.** In this module, Gigabit Ethernet is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Gigabit Ethernet always requires CSMA/CD even on full-duplex switches.. Gigabit Ethernet actually means: IEEE 802.3z/ab 1000 Mbps Ethernet; half-duplex used carrier extension/bursting, full-duplex is typical.

### Q40  ·  Intermediate
**Question:** Which statement about **Slotted ALOHA** is FALSE?

- **A.** Slotted ALOHA is correctly understood as: time is slotted; a station sends only at the beginning of a slot; S = G e^{−G}.
- **B.** In this module, Slotted ALOHA is a core idea students must distinguish from nearby terms.
- **C.** Slotted ALOHA has lower maximum throughput than pure ALOHA.
- **D.** A useful way to remember Slotted ALOHA is that it is not the same as “Send anytime; vulnerable period 2T”.

**Answer:** C
**Explanation:** The false claim is: Slotted ALOHA has lower maximum throughput than pure ALOHA.. Slotted ALOHA actually means: Time is slotted; a station sends only at the beginning of a slot; S = G e^{−G}.

### Q41  ·  Intermediate
**Question:** Which statement about **TDMA** is FALSE?

- **A.** TDMA is correctly understood as: time Division Multiple Access: stations share by assigned time slots.
- **B.** A useful way to remember TDMA is that it is not the same as “Random ALOHA only”.
- **C.** TDMA is carrier sensing with jam.
- **D.** In this module, TDMA is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: TDMA is carrier sensing with jam.. TDMA actually means: Time Division Multiple Access: stations share by assigned time slots.

### Q42  ·  Intermediate
**Question:** Wi-Fi cannot reliably hear collisions at the sender while transmitting. It uses:

- **A.** CSMA/CA
- **B.** Token ring
- **C.** CSMA/CD jamming on fibre
- **D.** Pure ALOHA only in 802.11 DCF

**Answer:** A
**Explanation:** 802.11 DCF is CSMA/CA.

### Q43  ·  Difficult
**Question:** 1-persistent CSMA/CD efficiency ≈ 1/(1+6.44a). If a=0.01, η ≈ ?

- **A.** 0.184
- **B.** ≈ 0.94
- **C.** 0.368
- **D.** 0.01

**Answer:** B
**Explanation:** 1/(1+0.0644) ≈ 0.939.

### Q44  ·  Difficult
**Question:** 10 Mbps Ethernet slot time for 512-bit jam/slot. Duration?

- **A.** 51.2 μs
- **B.** 512 ms
- **C.** 5.12 μs
- **D.** 64 μs

**Answer:** A
**Explanation:** 512 / 10×10^6 = 51.2 μs.

### Q45  ·  Difficult
**Question:** A 10BASE5 coaxial LAN aborts colliding frames and sends a jam. This is:

- **A.** CSMA/CA
- **B.** CSMA/CD
- **C.** FDMA
- **D.** Token bus without sensing

**Answer:** B
**Explanation:** Classic Ethernet MAC is CSMA/CD.

### Q46  ·  Difficult
**Question:** A hub interconnects 8 PCs; two talk at once and both NICs see a collision. They are in:

- **A.** One collision domain
- **B.** Eight collision domains
- **C.** Separate AS numbers
- **D.** No collision domain because of IP

**Answer:** A
**Explanation:** A hub is a shared medium.

### Q47  ·  Difficult
**Question:** Fast Ethernet 100 Mbps, same 512-bit slot. Slot time?

- **A.** 51.2 μs
- **B.** 64 ms
- **C.** 512 μs
- **D.** 5.12 μs

**Answer:** D
**Explanation:** 512 / 100×10^6 = 5.12 μs.

### Q48  ·  Difficult
**Question:** GSM-like systems assign users frequency channels. That multiple access is:

- **A.** FDMA (often combined with TDMA)
- **B.** Pure ALOHA
- **C.** CSMA/CD
- **D.** Token passing

**Answer:** A
**Explanation:** Frequency channels are FDMA.

### Q49  ·  Difficult
**Question:** If G=1 in pure ALOHA, S equals:

- **A.** 1/e ≈ 0.368
- **B.** 0.5
- **C.** e^{−2} ≈ 0.135
- **D.** 1

**Answer:** C
**Explanation:** S=G e^{−2G}=e^{−2}≈0.135, less than the maximum at G=0.5.

### Q50  ·  Difficult
**Question:** Maximum throughput of pure ALOHA (fraction of capacity)?

- **A.** 1/e ≈ 36.8%
- **B.** 100%
- **C.** 1/(2e) ≈ 18.4%
- **D.** 50%

**Answer:** C
**Explanation:** Max of G e^{−2G} at G=0.5 is 1/(2e).

### Q51  ·  Difficult
**Question:** Maximum throughput of slotted ALOHA?

- **A.** 100%
- **B.** 12.5%
- **C.** 1/e ≈ 36.8%
- **D.** 1/(2e) ≈ 18.4%

**Answer:** C
**Explanation:** Max of G e^{−G} at G=1 is 1/e.

### Q52  ·  Difficult
**Question:** Need 100 Mbps to a desktop with Cat5e and 802.3 frames. The PHY family is:

- **A.** Bluetooth SCO
- **B.** 10BASE5 thicknet only
- **C.** Fast Ethernet (100BASE-TX)
- **D.** T1 AMI

**Answer:** C
**Explanation:** 100BASE-TX is Fast Ethernet on UTP.

### Q53  ·  Difficult
**Question:** Pure ALOHA: G = 0.5. Throughput S?

- **A.** ≈ 0.184
- **B.** 1.0
- **C.** 0.5
- **D.** 0.368

**Answer:** A
**Explanation:** S = 0.5 e^{−1} ≈ 0.184.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **CSMA** and **ALOHA**?

- **A.** CSMA senses the carrier before sending; ALOHA does not.
- **B.** They are both Hamming codes.
- **C.** CSMA forbids sensing.
- **D.** ALOHA always senses first.

**Answer:** A
**Explanation:** CSMA senses the carrier before sending; ALOHA does not.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **TDMA** and **CDMA**?

- **A.** CDMA uses only time slots.
- **B.** TDMA uses orthogonal time slots; CDMA uses codes so stations overlap in time/frequency.
- **C.** They are both pure ALOHA.
- **D.** TDMA uses PN chips as the only resource.

**Answer:** B
**Explanation:** TDMA uses orthogonal time slots; CDMA uses codes so stations overlap in time/frequency.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **random access** and **controlled access**?

- **A.** Random access uses a token always.
- **B.** They are FDM only.
- **C.** Controlled access maximises collisions.
- **D.** Random access contends (ALOHA/CSMA); controlled access uses poll/token/reservation.

**Answer:** D
**Explanation:** Random access contends (ALOHA/CSMA); controlled access uses poll/token/reservation.

### Q57  ·  Difficult
**Question:** Which statement about **CDMA** is FALSE?

- **A.** In this module, CDMA is a core idea students must distinguish from nearby terms.
- **B.** CDMA is correctly understood as: code Division Multiple Access: stations transmit together using orthogonal/PN codes.
- **C.** A useful way to remember CDMA is that it is not the same as “Only FDM bands”.
- **D.** CDMA requires that only one station ever transmit in the universe.

**Answer:** D
**Explanation:** The false claim is: CDMA requires that only one station ever transmit in the universe.. CDMA actually means: Code Division Multiple Access: stations transmit together using orthogonal/PN codes.

### Q58  ·  Difficult
**Question:** Which statement about **CSMA** is FALSE?

- **A.** CSMA forbids listening to the medium.
- **B.** In this module, CSMA is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember CSMA is that it is not the same as “Transmit without sensing, as in pure ALOHA only”.
- **D.** CSMA is correctly understood as: carrier Sense Multiple Access: listen before transmit to reduce collisions.

**Answer:** A
**Explanation:** The false claim is: CSMA forbids listening to the medium.. CSMA actually means: Carrier Sense Multiple Access: listen before transmit to reduce collisions.

### Q59  ·  Difficult
**Question:** Which statement about **CSMA/CA** is FALSE?

- **A.** A useful way to remember CSMA/CA is that it is not the same as “Ethernet half-duplex collision detection jamming”.
- **B.** CSMA/CA jams the wire like 10BASE5 Ethernet.
- **C.** In this module, CSMA/CA is a core idea students must distinguish from nearby terms.
- **D.** CSMA/CA is correctly understood as: cSMA with Collision Avoidance: reduce collision probability (IFS, backoff, optional RTS/CTS); used in WLANs.

**Answer:** B
**Explanation:** The false claim is: CSMA/CA jams the wire like 10BASE5 Ethernet.. CSMA/CA actually means: CSMA with Collision Avoidance: reduce collision probability (IFS, backoff, optional RTS/CTS); used in WLANs.

### Q60  ·  Difficult
**Question:** Which statement about **Collision domain** is FALSE?

- **A.** A useful way to remember Collision domain is that it is not the same as “A unique IP /32”.
- **B.** In this module, Collision domain is a core idea students must distinguish from nearby terms.
- **C.** A switch with one host per port still makes one giant collision domain among all ports.
- **D.** Collision domain is correctly understood as: a network region where simultaneous transmissions collide (shared hub/coax).

**Answer:** C
**Explanation:** The false claim is: A switch with one host per port still makes one giant collision domain among all ports.. Collision domain actually means: A network region where simultaneous transmissions collide (shared hub/coax).

### Q61  ·  Difficult
**Question:** Which statement about **FDMA** is FALSE?

- **A.** FDMA is correctly understood as: frequency Division Multiple Access: stations share spectrum by frequency bands.
- **B.** FDMA is identical to CSMA/CD.
- **C.** A useful way to remember FDMA is that it is not the same as “Time slots only”.
- **D.** In this module, FDMA is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: FDMA is identical to CSMA/CD.. FDMA actually means: Frequency Division Multiple Access: stations share spectrum by frequency bands.

### Q62  ·  Difficult
**Question:** Which statement about **Fast Ethernet** is FALSE?

- **A.** In this module, Fast Ethernet is a core idea students must distinguish from nearby terms.
- **B.** Fast Ethernet changes the minimum MAC address length to 16 bits.
- **C.** Fast Ethernet is correctly understood as: iEEE 802.3u 100 Mbps Ethernet, keeping 802.3 frame format (100BASE-TX, etc.).
- **D.** A useful way to remember Fast Ethernet is that it is not the same as “10 Gbps only”.

**Answer:** B
**Explanation:** The false claim is: Fast Ethernet changes the minimum MAC address length to 16 bits.. Fast Ethernet actually means: IEEE 802.3u 100 Mbps Ethernet, keeping 802.3 frame format (100BASE-TX, etc.).

### Q63  ·  Difficult
**Question:** Which statement about **Pure ALOHA** is FALSE?

- **A.** In this module, Pure ALOHA is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Pure ALOHA is that it is not the same as “Stations may send only at slot starts; S = G e^{−G}”.
- **C.** Pure ALOHA’s maximum throughput is 100%.
- **D.** Pure ALOHA is correctly understood as: stations send at arbitrary times; vulnerable period is 2 frame times; S = G e^{−2G}.

**Answer:** C
**Explanation:** The false claim is: Pure ALOHA’s maximum throughput is 100%.. Pure ALOHA actually means: Stations send at arbitrary times; vulnerable period is 2 frame times; S = G e^{−2G}.

### Q64  ·  Difficult
**Question:** Which statement about **p-persistent CSMA** is FALSE?

- **A.** A useful way to remember p-persistent CSMA is that it is not the same as “Always send immediately with probability 1”.
- **B.** In this module, p-persistent CSMA is a core idea students must distinguish from nearby terms.
- **C.** p-persistent CSMA is identical to pure ALOHA.
- **D.** p-persistent CSMA is correctly understood as: in slotted CSMA, transmit with probability p if idle; otherwise wait a slot and repeat.

**Answer:** C
**Explanation:** The false claim is: p-persistent CSMA is identical to pure ALOHA.. p-persistent CSMA actually means: In slotted CSMA, transmit with probability p if idle; otherwise wait a slot and repeat.

### Q65  ·  Difficult
**Question:** Why did Gigabit Ethernet add carrier extension for half-duplex?

- **A.** To keep a 512-byte-time slot so CSMA/CD still works at 1000 Mbps
- **B.** To eliminate CRC
- **C.** To replace 802.3 frames with ATM cells
- **D.** To shrink MACs to 16 bits

**Answer:** A
**Explanation:** Slot time must exceed end-to-end propagation; bit-time shrinks at 1 Gbps.

---

## Quick answer key

Q01–C | Q02–A | Q03–A | Q04–D | Q05–C | Q06–A | Q07–C | Q08–C | Q09–B | Q10–C | Q11–D | Q12–B | Q13–C | Q14–A | Q15–D | Q16–C | Q17–C | Q18–C | Q19–C | Q20–A | Q21–A | Q22–D | Q23–C | Q24–D | Q25–D | Q26–A | Q27–D | Q28–B | Q29–A | Q30–B | Q31–B | Q32–C | Q33–A | Q34–B | Q35–A | Q36–C | Q37–A | Q38–B | Q39–A | Q40–C | Q41–C | Q42–A | Q43–B | Q44–A | Q45–B | Q46–A | Q47–D | Q48–A | Q49–C | Q50–C | Q51–C | Q52–C | Q53–A | Q54–A | Q55–B | Q56–D | Q57–D | Q58–A | Q59–B | Q60–C | Q61–B | Q62–B | Q63–C | Q64–C | Q65–A
