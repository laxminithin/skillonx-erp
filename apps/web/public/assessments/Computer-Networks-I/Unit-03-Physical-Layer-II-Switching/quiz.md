# Quiz — Computer Networks-I — Unit 3: Physical Layer-II & Switching

**Subject:** Computer Networks-I  
**Module:** Unit 3 — Physical Layer-II & Switching  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** FDM shares a link by:

- **A.** Frequency bands (often with guard bands)
- **B.** Only time slots
- **C.** Only CRC remainders
- **D.** Only MAC addresses

**Answer:** A
**Explanation:** FDM is frequency sharing.

### Q02  ·  Easy
**Question:** T1 rate is:

- **A.** 1.544 Mbps
- **B.** 2.048 Mbps
- **C.** 64 kbps
- **D.** 10 Mbps

**Answer:** A
**Explanation:** 24×64 kbps + 8 kbps framing = 1.544 Mbps.

### Q03  ·  Easy
**Question:** WDM is best described as:

- **A.** T1 framing
- **B.** IPv6 anycast
- **C.** Optical FDM on fibre wavelengths
- **D.** Token passing

**Answer:** C
**Explanation:** Different lambdas are optical FDM.

### Q04  ·  Easy
**Question:** Which option best describes **DSSS**?

- **A.** FDM of AM radio.
- **B.** Stop-and-wait ACKs.
- **C.** Hopping among channels without chipping.
- **D.** Direct Sequence Spread Spectrum: each bit is multiplied by a high-rate chip (PN) code, spreading the spectrum.

**Answer:** D
**Explanation:** DSSS: Direct Sequence Spread Spectrum: each bit is multiplied by a high-rate chip (PN) code, spreading the spectrum.

### Q05  ·  Easy
**Question:** Which option best describes **FDM**?

- **A.** Giving each source the whole spectrum in alternating time slots only.
- **B.** Hopping a PN code without bands.
- **C.** Frequency Division Multiplexing: several analog channels share a link by occupying different frequency bands.
- **D.** Store-and-forward of packets.

**Answer:** C
**Explanation:** FDM: Frequency Division Multiplexing: several analog channels share a link by occupying different frequency bands.

### Q06  ·  Easy
**Question:** Which option best describes **Guard band**?

- **A.** A Hamming parity bit.
- **B.** A VC identifier.
- **C.** Unused frequency gap between FDM channels to reduce interference.
- **D.** A TDM time slot carrying payload.

**Answer:** C
**Explanation:** Guard band: Unused frequency gap between FDM channels to reduce interference.

### Q07  ·  Easy
**Question:** Which option best describes **Message switching**?

- **A.** Bit stuffing in HDLC.
- **B.** Live circuit reservation of a phone call.
- **C.** Whole messages are stored and forwarded (older than packet switching), not cut into packets.
- **D.** QAM constellation mapping.

**Answer:** C
**Explanation:** Message switching: Whole messages are stored and forwarded (older than packet switching), not cut into packets.

### Q08  ·  Easy
**Question:** Which option best describes **Synchronous TDM**?

- **A.** A TDM scheme that allocates slots by position even if a source is idle (empty slot).
- **B.** Circuit-free datagram routing only.
- **C.** A scheme that skips idle sources and uses addresses in each slot (statistical).
- **D.** Pure ALOHA.

**Answer:** A
**Explanation:** Synchronous TDM: A TDM scheme that allocates slots by position even if a source is idle (empty slot).

### Q09  ·  Easy
**Question:** Which option best describes **Virtual-circuit packet switching**?

- **A.** Each packet is routed with no connection state.
- **B.** A path is set up so all packets of a connection follow it, identified by a VC number.
- **C.** Pure ALOHA.
- **D.** A dedicated analog FDM channel for the call’s lifetime without packets.

**Answer:** B
**Explanation:** Virtual-circuit packet switching: A path is set up so all packets of a connection follow it, identified by a VC number.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **circuit-switched call**?

- **A.** Teardown → then send data → then setup
- **B.** Hop PN chips → then FDM guard → then IP NAT
- **C.** Store each bit at every hop without reservation as the only mode
- **D.** Setup (reserve path) → data transfer on the circuit → teardown

**Answer:** D
**Explanation:** Correct sequence for circuit-switched call: Setup (reserve path) → data transfer on the circuit → teardown

### Q11  ·  Easy
**Question:** Which sequence correctly describes **virtual-circuit lifetime**?

- **A.** Independent routing of every packet with no state
- **B.** FDM colour assignment only
- **C.** Call setup (assign VC ids) → data packets on that path → teardown (release ids)
- **D.** Manchester mid-bit edges as addresses

**Answer:** C
**Explanation:** Correct sequence for virtual-circuit lifetime: Call setup (assign VC ids) → data packets on that path → teardown (release ids)

### Q12  ·  Intermediate
**Question:** A CATV plant carries many analog TV channels on one coax at once. The multiplexer is:

- **A.** Pure ALOHA
- **B.** IPv4 CIDR
- **C.** FDM
- **D.** Synchronous TDM of 8-bit PCM only

**Answer:** C
**Explanation:** Simultaneous frequency bands are FDM.

### Q13  ·  Intermediate
**Question:** A fibre carries 40 lasers of different colours. This is:

- **A.** WDM
- **B.** CRC-32
- **C.** AMI line coding
- **D.** Token ring

**Answer:** A
**Explanation:** Optical wavelength multiplexing is WDM.

### Q14  ·  Intermediate
**Question:** FHSS spreading is achieved by:

- **A.** Hopping the carrier among PN-selected frequencies
- **B.** Multiplying only by a baseband AMI pulse
- **C.** HDLC S-frames
- **D.** IPv4 checksum wrapping

**Answer:** A
**Explanation:** FHSS = frequency hopping.

### Q15  ·  Intermediate
**Question:** IP packets of one email take different router paths and may reorder. This is:

- **A.** FDM guard-band switching
- **B.** A reserved telephone circuit
- **C.** A single VC that cannot split
- **D.** Datagram packet switching

**Answer:** D
**Explanation:** Independent per-packet routing is datagram mode.

### Q16  ·  Intermediate
**Question:** In datagram switching, packets of one message:

- **A.** Always follow a reserved analog circuit
- **B.** May take different paths and arrive out of order
- **C.** Must use FDM guard bands as addresses
- **D.** Cannot be stored-and-forwarded

**Answer:** B
**Explanation:** Independent routing allows reordering.

### Q17  ·  Intermediate
**Question:** Statistical TDM differs from synchronous TDM because it:

- **A.** Is identical to FDM
- **B.** Uses WDM colours on copper pairs
- **C.** Assigns slots dynamically and needs addressing in frames
- **D.** Always wastes idle slots by law

**Answer:** C
**Explanation:** Statistical TDM is demand-driven with headers.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **FDM** and **TDM**?

- **A.** FDM shares spectrum in frequency; TDM shares it in time slots.
- **B.** FDM assigns time slots only.
- **C.** TDM assigns frequency bands.
- **D.** They are identical to Hamming codes.

**Answer:** A
**Explanation:** FDM shares spectrum in frequency; TDM shares it in time slots.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **FHSS** and **DSSS**?

- **A.** They are the same code.
- **B.** FHSS is T1 framing.
- **C.** FHSS hops the carrier; DSSS spreads each bit with a chip code.
- **D.** DSSS hops frequencies without chips.

**Answer:** C
**Explanation:** FHSS hops the carrier; DSSS spreads each bit with a chip code.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **datagram** and **virtual circuit**?

- **A.** Datagrams have no per-flow path state; VCs set up a labelled path all packets follow.
- **B.** VCs route every packet independently.
- **C.** Both are FDM.
- **D.** Datagrams use a single VC number end-to-end.

**Answer:** A
**Explanation:** Datagrams have no per-flow path state; VCs set up a labelled path all packets follow.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **setup delay** and **store-and-forward delay**?

- **A.** Setup delay is Shannon capacity.
- **B.** They are the same number always.
- **C.** Setup delay is paid once per call/VC; store-and-forward delay is paid per packet at each hop.
- **D.** Store-and-forward is FDM guard time only.

**Answer:** C
**Explanation:** Setup delay is paid once per call/VC; store-and-forward delay is paid per packet at each hop.

### Q22  ·  Intermediate
**Question:** Which option best describes **Chipping rate**?

- **A.** The TDM frame alignment bit rate only.
- **B.** The VC setup timeout.
- **C.** The number of FDM guard bands.
- **D.** In DSSS, the rate of the PN chips, much higher than the bit rate, that spreads the bandwidth.

**Answer:** D
**Explanation:** Chipping rate: In DSSS, the rate of the PN chips, much higher than the bit rate, that spreads the bandwidth.

### Q23  ·  Intermediate
**Question:** Which option best describes **Circuit switching**?

- **A.** CRC checking only.
- **B.** A dedicated end-to-end circuit is reserved for the whole conversation (setup, data, teardown).
- **C.** Store-and-forward of independent datagrams with no reserved path.
- **D.** CSMA/CD contention.

**Answer:** B
**Explanation:** Circuit switching: A dedicated end-to-end circuit is reserved for the whole conversation (setup, data, teardown).

### Q24  ·  Intermediate
**Question:** Which option best describes **Datagram packet switching**?

- **A.** A physical circuit with time slots for the call.
- **B.** WDM lambda locking.
- **C.** A reserved virtual path with the same VC identifier on every packet.
- **D.** Each packet is independently routed; packets of a message may follow different paths.

**Answer:** D
**Explanation:** Datagram packet switching: Each packet is independently routed; packets of a message may follow different paths.

### Q25  ·  Intermediate
**Question:** Which option best describes **FHSS**?

- **A.** DSSS multiplying by a chip code without hops.
- **B.** A single narrow carrier that never hops.
- **C.** Frequency Hopping Spread Spectrum: the carrier hops among frequencies according to a PN sequence.
- **D.** T1 framing bits.

**Answer:** C
**Explanation:** FHSS: Frequency Hopping Spread Spectrum: the carrier hops among frequencies according to a PN sequence.

### Q26  ·  Intermediate
**Question:** Which option best describes **Hopping period**?

- **A.** In FHSS, how long the signal dwells on one frequency before hopping.
- **B.** The IPv4 TTL.
- **C.** PCM quantization step.
- **D.** The Ethernet IFG only.

**Answer:** A
**Explanation:** Hopping period: In FHSS, how long the signal dwells on one frequency before hopping.

### Q27  ·  Intermediate
**Question:** Which option best describes **Setup phase**?

- **A.** CRC remainder computation only.
- **B.** In circuit or VC switching, the phase that reserves resources before data transfer.
- **C.** DHCP Discover only.
- **D.** The phase after teardown.

**Answer:** B
**Explanation:** Setup phase: In circuit or VC switching, the phase that reserves resources before data transfer.

### Q28  ·  Intermediate
**Question:** Which option best describes **Statistical TDM**?

- **A.** Fixed slot per source even when silent.
- **B.** FDM guard bands only.
- **C.** WDM lambdas only.
- **D.** TDM that allocates slots only to sources that have data, with headers identifying them.

**Answer:** D
**Explanation:** Statistical TDM: TDM that allocates slots only to sources that have data, with headers identifying them.

### Q29  ·  Intermediate
**Question:** Which option best describes **Store-and-forward**?

- **A.** Cutting through bits without buffering the packet.
- **B.** Circuit-only TDM slot lock without packets.
- **C.** FDM guard-band reservation.
- **D.** A switch fully receives a packet, then forwards it on the next link.

**Answer:** D
**Explanation:** Store-and-forward: A switch fully receives a packet, then forwards it on the next link.

### Q30  ·  Intermediate
**Question:** Which option best describes **TDM**?

- **A.** Assigning each source a permanent frequency band only.
- **B.** Time Division Multiplexing: sources share a link by taking turns in time slots.
- **C.** CSMA random backoff.
- **D.** WDM colours on fibre as the only mechanism.

**Answer:** B
**Explanation:** TDM: Time Division Multiplexing: sources share a link by taking turns in time slots.

### Q31  ·  Intermediate
**Question:** Which option best describes **WDM**?

- **A.** Wavelength Division Multiplexing: optical FDM using different light wavelengths on fibre.
- **B.** IPv4 NAT.
- **C.** Token passing.
- **D.** Electrical TDM of PCM voice only.

**Answer:** A
**Explanation:** WDM: Wavelength Division Multiplexing: optical FDM using different light wavelengths on fibre.

### Q32  ·  Intermediate
**Question:** Which sequence correctly describes **T1 frame assembly (conceptual)**?

- **A.** Sample 24 voices → 8-bit PCM each → pack 192 data bits + 1 framing bit → 8000 frames/s
- **B.** FDM 24 analog bands on coax as T1
- **C.** Hop 24 frequencies per sample
- **D.** IP-route each PCM bit separately

**Answer:** A
**Explanation:** Correct sequence for T1 frame assembly (conceptual): Sample 24 voices → 8-bit PCM each → pack 192 data bits + 1 framing bit → 8000 frames/s

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **datagram forwarding of a 3-packet message**?

- **A.** Setup VC → lock TDM slot for hours → analog FDM
- **B.** One circuit for all bits with no headers
- **C.** Each packet independently: receive fully → lookup dest → forward (paths may differ)
- **D.** Always wait for the entire email before the first bit may leave hop 1 as a phone circuit

**Answer:** C
**Explanation:** Correct sequence for datagram forwarding of a 3-packet message: Each packet independently: receive fully → lookup dest → forward (paths may differ)

### Q34  ·  Intermediate
**Question:** Which statement about **Chipping rate** is FALSE?

- **A.** Chipping rate is always equal to the information bit rate.
- **B.** A useful way to remember Chipping rate is that it is not the same as “The TDM frame alignment bit rate only”.
- **C.** Chipping rate is correctly understood as: in DSSS, the rate of the PN chips, much higher than the bit rate, that spreads the bandwidth.
- **D.** In this module, Chipping rate is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Chipping rate is always equal to the information bit rate.. Chipping rate actually means: In DSSS, the rate of the PN chips, much higher than the bit rate, that spreads the bandwidth.

### Q35  ·  Intermediate
**Question:** Which statement about **DSSS** is FALSE?

- **A.** In this module, DSSS is a core idea students must distinguish from nearby terms.
- **B.** DSSS is identical to FHSS hopping.
- **C.** DSSS is correctly understood as: direct Sequence Spread Spectrum: each bit is multiplied by a high-rate chip (PN) code, spreading the spectrum.
- **D.** A useful way to remember DSSS is that it is not the same as “Hopping among channels without chipping”.

**Answer:** B
**Explanation:** The false claim is: DSSS is identical to FHSS hopping.. DSSS actually means: Direct Sequence Spread Spectrum: each bit is multiplied by a high-rate chip (PN) code, spreading the spectrum.

### Q36  ·  Intermediate
**Question:** Which statement about **Datagram packet switching** is FALSE?

- **A.** Datagram switching uses a pre-setup VC number that cannot change.
- **B.** In this module, Datagram packet switching is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Datagram packet switching is that it is not the same as “A reserved virtual path with the same VC identifier on every packet”.
- **D.** Datagram packet switching is correctly understood as: each packet is independently routed; packets of a message may follow different paths.

**Answer:** A
**Explanation:** The false claim is: Datagram switching uses a pre-setup VC number that cannot change.. Datagram packet switching actually means: Each packet is independently routed; packets of a message may follow different paths.

### Q37  ·  Intermediate
**Question:** Which statement about **FDM** is FALSE?

- **A.** FDM assigns the entire bandwidth to one user at a time in slots.
- **B.** In this module, FDM is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember FDM is that it is not the same as “Giving each source the whole spectrum in alternating time slots only”.
- **D.** FDM is correctly understood as: frequency Division Multiplexing: several analog channels share a link by occupying different frequency bands.

**Answer:** A
**Explanation:** The false claim is: FDM assigns the entire bandwidth to one user at a time in slots.. FDM actually means: Frequency Division Multiplexing: several analog channels share a link by occupying different frequency bands.

### Q38  ·  Intermediate
**Question:** Which statement about **Guard band** is FALSE?

- **A.** A useful way to remember Guard band is that it is not the same as “A TDM time slot carrying payload”.
- **B.** A guard band carries full user payload by design.
- **C.** In this module, Guard band is a core idea students must distinguish from nearby terms.
- **D.** Guard band is correctly understood as: unused frequency gap between FDM channels to reduce interference.

**Answer:** B
**Explanation:** The false claim is: A guard band carries full user payload by design.. Guard band actually means: Unused frequency gap between FDM channels to reduce interference.

### Q39  ·  Intermediate
**Question:** Which statement about **Setup phase** is FALSE?

- **A.** Setup phase is correctly understood as: in circuit or VC switching, the phase that reserves resources before data transfer.
- **B.** A useful way to remember Setup phase is that it is not the same as “The phase after teardown”.
- **C.** Setup happens after the last data packet in circuit switching.
- **D.** In this module, Setup phase is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Setup happens after the last data packet in circuit switching.. Setup phase actually means: In circuit or VC switching, the phase that reserves resources before data transfer.

### Q40  ·  Intermediate
**Question:** Which statement about **Statistical TDM** is FALSE?

- **A.** Statistical TDM is correctly understood as: tDM that allocates slots only to sources that have data, with headers identifying them.
- **B.** A useful way to remember Statistical TDM is that it is not the same as “Fixed slot per source even when silent”.
- **C.** Statistical TDM forbids headers and always wastes idle slots.
- **D.** In this module, Statistical TDM is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Statistical TDM forbids headers and always wastes idle slots.. Statistical TDM actually means: TDM that allocates slots only to sources that have data, with headers identifying them.

### Q41  ·  Intermediate
**Question:** Which statement about **WDM** is FALSE?

- **A.** WDM is correctly understood as: wavelength Division Multiplexing: optical FDM using different light wavelengths on fibre.
- **B.** In this module, WDM is a core idea students must distinguish from nearby terms.
- **C.** WDM is a transport-layer ARQ.
- **D.** A useful way to remember WDM is that it is not the same as “Electrical TDM of PCM voice only”.

**Answer:** C
**Explanation:** The false claim is: WDM is a transport-layer ARQ.. WDM actually means: Wavelength Division Multiplexing: optical FDM using different light wavelengths on fibre.

### Q42  ·  Intermediate
**Question:** Wi-Fi-style Bluetooth basic rate hops 1600 times per second among 79 frequencies. The spread method is:

- **A.** T1 framing
- **B.** DSSS chipping only
- **C.** FHSS
- **D.** WDM

**Answer:** C
**Explanation:** Frequency hopping is FHSS.

### Q43  ·  Difficult
**Question:** 24 PCM voice calls share one T1. This is:

- **A.** WDM on fibre colours only
- **B.** Synchronous TDM
- **C.** Datagram IP routing
- **D.** FHSS hopping

**Answer:** B
**Explanation:** T1 is classic synchronous TDM.

### Q44  ·  Difficult
**Question:** 802.11b CCK/DSSS multiplies bits by a Barker-like chip sequence. This is:

- **A.** Circuit teardown
- **B.** FDM of AM stations
- **C.** DSSS
- **D.** HDLC polling

**Answer:** C
**Explanation:** Chip-code spreading is DSSS.

### Q45  ·  Difficult
**Question:** A 10,000-bit message is circuit-switched over a 1 Mbps path after 200 ms setup (ignore prop). Total time to complete data after choosing the circuit?

- **A.** 10 ms
- **B.** 1 s
- **C.** 200 ms
- **D.** 210 ms

**Answer:** D
**Explanation:** Data Tt = 10,000/10^6 = 10 ms; plus 200 ms setup → 210 ms.

### Q46  ·  Difficult
**Question:** A 40 Mbit file, 10 Mbps links, 4 store-and-forward hops, negligible prop. Circuit setup 2 s vs datagram of 10 kbit packets. Which is faster and why (approx)?

- **A.** Datagram pipelining: first packet 4×1 ms, then ~4 s more versus circuit 2 s setup + 4 s send
- **B.** They take identical time always
- **C.** Datagram cannot start until setup of 2 s plus 40 s
- **D.** Circuit is always infinitely faster

**Answer:** A
**Explanation:** Circuit: 2 + 40e6/10e6 = 6 s (+props). Datagram: pipeline so total ≈ (file/R) + (hops−1)×packet_Tt ≈ 4.003 s. Datagram wins if setup is large.

### Q47  ·  Difficult
**Question:** A phone call hears silence for a second, then a clear dedicated path. The network used:

- **A.** Circuit switching (setup then reserved path)
- **B.** Pure datagram IP with no reserved resources
- **C.** Bluetooth inquiry scan only
- **D.** CSMA/CD Ethernet talker

**Answer:** A
**Explanation:** Call setup plus reserved path is circuit switching.

### Q48  ·  Difficult
**Question:** E1: 32 timeslots of 8 bits at 8000 frames/s. Bit rate?

- **A.** 2.048 Mbps
- **B.** 256 kbps
- **C.** 1.544 Mbps
- **D.** 32 kbps

**Answer:** A
**Explanation:** 32 × 8 bits × 8000 frames/s = 2.048 Mbps.

### Q49  ·  Difficult
**Question:** Five 4 kHz analog channels are FDM’d with 200 Hz guard bands between neighbours (4 guards). Total bandwidth?

- **A.** 4 kHz
- **B.** 20 kHz
- **C.** 20.8 kHz
- **D.** 1 kHz

**Answer:** C
**Explanation:** 5×4 kHz + 4×0.2 kHz = 20.8 kHz.

### Q50  ·  Difficult
**Question:** MPLS/ATM-like labels send all packets of a flow on one pre-chosen path. This resembles:

- **A.** Virtual-circuit packet switching
- **B.** Pure analog FDM without packets
- **C.** NRZ-L only
- **D.** Manchester-only radio

**Answer:** A
**Explanation:** Labelled paths are virtual circuits.

### Q51  ·  Difficult
**Question:** Store-and-forward: 1000-bit packet, 3 hops, each link 1 Mbps, ignore prop/proc. Delay?

- **A.** 1 ms
- **B.** 3 ms
- **C.** 1000 ms
- **D.** 3 μs

**Answer:** B
**Explanation:** 3 × (1000/10^6) = 3 ms.

### Q52  ·  Difficult
**Question:** Synchronous TDM: 5 sources, each 8 kbps. Aggregate line rate ignoring overhead?

- **A.** 5 kbps
- **B.** 64 kbps
- **C.** 40 kbps
- **D.** 8 kbps

**Answer:** C
**Explanation:** 5 × 8 kbps = 40 kbps.

### Q53  ·  Difficult
**Question:** T1 line: 24 channels × 8 bits × 8000 frames/s plus 1 framing bit per frame. Bit rate?

- **A.** 1.544 Mbps
- **B.** 64 kbps
- **C.** 2.048 Mbps
- **D.** 1.536 Mbps

**Answer:** A
**Explanation:** 24×8×8000 = 1.536 Mbps, plus 8000 framing bits → 1.544 Mbps.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **TDM** and **WDM**?

- **A.** TDM multiplexes in time (often electrical); WDM multiplexes optical wavelengths.
- **B.** They are both CSMA/CD.
- **C.** TDM is optical colours only.
- **D.** WDM is statistical TDM of PCM.

**Answer:** A
**Explanation:** TDM multiplexes in time (often electrical); WDM multiplexes optical wavelengths.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **circuit switching** and **datagram packet switching**?

- **A.** Circuits store-and-forward packets.
- **B.** There is no difference in resource use.
- **C.** Datagrams always reserve a TDM slot for hours.
- **D.** Circuit switching reserves a dedicated path; datagrams are independently routed and share links statistically.

**Answer:** D
**Explanation:** Circuit switching reserves a dedicated path; datagrams are independently routed and share links statistically.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **synchronous TDM** and **statistical TDM**?

- **A.** Statistical TDM never uses addresses.
- **B.** Synchronous TDM wastes slots of idle sources; statistical TDM shares slots using headers.
- **C.** They are WDM colours.
- **D.** Synchronous TDM is ALOHA.

**Answer:** B
**Explanation:** Synchronous TDM wastes slots of idle sources; statistical TDM shares slots using headers.

### Q57  ·  Difficult
**Question:** Which statement about **Circuit switching** is FALSE?

- **A.** A useful way to remember Circuit switching is that it is not the same as “Store-and-forward of independent datagrams with no reserved path”.
- **B.** In this module, Circuit switching is a core idea students must distinguish from nearby terms.
- **C.** Circuit switching never reserves a path and always queues packets independently.
- **D.** Circuit switching is correctly understood as: a dedicated end-to-end circuit is reserved for the whole conversation (setup, data, teardown).

**Answer:** C
**Explanation:** The false claim is: Circuit switching never reserves a path and always queues packets independently.. Circuit switching actually means: A dedicated end-to-end circuit is reserved for the whole conversation (setup, data, teardown).

### Q58  ·  Difficult
**Question:** Which statement about **FHSS** is FALSE?

- **A.** A useful way to remember FHSS is that it is not the same as “A single narrow carrier that never hops”.
- **B.** FHSS keeps the centre frequency fixed for the whole session.
- **C.** In this module, FHSS is a core idea students must distinguish from nearby terms.
- **D.** FHSS is correctly understood as: frequency Hopping Spread Spectrum: the carrier hops among frequencies according to a PN sequence.

**Answer:** B
**Explanation:** The false claim is: FHSS keeps the centre frequency fixed for the whole session.. FHSS actually means: Frequency Hopping Spread Spectrum: the carrier hops among frequencies according to a PN sequence.

### Q59  ·  Difficult
**Question:** Which statement about **Hopping period** is FALSE?

- **A.** In this module, Hopping period is a core idea students must distinguish from nearby terms.
- **B.** Hopping period is the CRC polynomial degree.
- **C.** Hopping period is correctly understood as: in FHSS, how long the signal dwells on one frequency before hopping.
- **D.** A useful way to remember Hopping period is that it is not the same as “The IPv4 TTL”.

**Answer:** B
**Explanation:** The false claim is: Hopping period is the CRC polynomial degree.. Hopping period actually means: In FHSS, how long the signal dwells on one frequency before hopping.

### Q60  ·  Difficult
**Question:** Which statement about **Message switching** is FALSE?

- **A.** A useful way to remember Message switching is that it is not the same as “Live circuit reservation of a phone call”.
- **B.** In this module, Message switching is a core idea students must distinguish from nearby terms.
- **C.** Message switching is the same as circuit switching.
- **D.** Message switching is correctly understood as: whole messages are stored and forwarded (older than packet switching), not cut into packets.

**Answer:** C
**Explanation:** The false claim is: Message switching is the same as circuit switching.. Message switching actually means: Whole messages are stored and forwarded (older than packet switching), not cut into packets.

### Q61  ·  Difficult
**Question:** Which statement about **Store-and-forward** is FALSE?

- **A.** In this module, Store-and-forward is a core idea students must distinguish from nearby terms.
- **B.** Store-and-forward is correctly understood as: a switch fully receives a packet, then forwards it on the next link.
- **C.** A useful way to remember Store-and-forward is that it is not the same as “Cutting through bits without buffering the packet”.
- **D.** Store-and-forward never buffers a complete packet.

**Answer:** D
**Explanation:** The false claim is: Store-and-forward never buffers a complete packet.. Store-and-forward actually means: A switch fully receives a packet, then forwards it on the next link.

### Q62  ·  Difficult
**Question:** Which statement about **Synchronous TDM** is FALSE?

- **A.** Synchronous TDM always statistically multiplexes and never wastes idle slots.
- **B.** In this module, Synchronous TDM is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Synchronous TDM is that it is not the same as “A scheme that skips idle sources and uses addresses in each slot (statistical)”.
- **D.** Synchronous TDM is correctly understood as: a TDM scheme that allocates slots by position even if a source is idle (empty slot).

**Answer:** A
**Explanation:** The false claim is: Synchronous TDM always statistically multiplexes and never wastes idle slots.. Synchronous TDM actually means: A TDM scheme that allocates slots by position even if a source is idle (empty slot).

### Q63  ·  Difficult
**Question:** Which statement about **TDM** is FALSE?

- **A.** In this module, TDM is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember TDM is that it is not the same as “Assigning each source a permanent frequency band only”.
- **C.** TDM gives every source a private frequency band simultaneously.
- **D.** TDM is correctly understood as: time Division Multiplexing: sources share a link by taking turns in time slots.

**Answer:** C
**Explanation:** The false claim is: TDM gives every source a private frequency band simultaneously.. TDM actually means: Time Division Multiplexing: sources share a link by taking turns in time slots.

### Q64  ·  Difficult
**Question:** Which statement about **Virtual-circuit packet switching** is FALSE?

- **A.** Virtual-circuit packet switching is correctly understood as: a path is set up so all packets of a connection follow it, identified by a VC number.
- **B.** A virtual circuit is identical to an analog leased frequency with no packet headers.
- **C.** A useful way to remember Virtual-circuit packet switching is that it is not the same as “Each packet is routed with no connection state”.
- **D.** In this module, Virtual-circuit packet switching is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A virtual circuit is identical to an analog leased frequency with no packet headers.. Virtual-circuit packet switching actually means: A path is set up so all packets of a connection follow it, identified by a VC number.

### Q65  ·  Difficult
**Question:** Why does circuit switching waste resources compared with packet switching for bursty data?

- **A.** Packet switching always reserves a DS0
- **B.** Packets cannot be bursty
- **C.** The reserved circuit is idle during silence but still dedicated
- **D.** Circuits share statistically by default

**Answer:** C
**Explanation:** Bursty sources leave reserved bandwidth unused; packets share.

---

## Quick answer key

Q01–A | Q02–A | Q03–C | Q04–D | Q05–C | Q06–C | Q07–C | Q08–A | Q09–B | Q10–D | Q11–C | Q12–C | Q13–A | Q14–A | Q15–D | Q16–B | Q17–C | Q18–A | Q19–C | Q20–A | Q21–C | Q22–D | Q23–B | Q24–D | Q25–C | Q26–A | Q27–B | Q28–D | Q29–D | Q30–B | Q31–A | Q32–A | Q33–C | Q34–A | Q35–B | Q36–A | Q37–A | Q38–B | Q39–C | Q40–C | Q41–C | Q42–C | Q43–B | Q44–C | Q45–D | Q46–A | Q47–A | Q48–A | Q49–C | Q50–A | Q51–B | Q52–C | Q53–A | Q54–A | Q55–D | Q56–B | Q57–C | Q58–B | Q59–B | Q60–C | Q61–D | Q62–A | Q63–C | Q64–B | Q65–C
