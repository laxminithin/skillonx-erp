# Quiz — Computer Networks-I — Unit 5: Data Link Control

**Subject:** Computer Networks-I  
**Module:** Unit 5 — Data Link Control  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** HDLC flag is:

- **A.** 01111110
- **B.** 10101010
- **C.** 00000000
- **D.** 11111111

**Answer:** A
**Explanation:** Standard HDLC/PPP-like flag.

### Q02  ·  Easy
**Question:** PPP uses which of the following to bring the link up?

- **A.** OSPF
- **B.** Hamming (7,4) only
- **C.** LCP
- **D.** CSMA/CA

**Answer:** C
**Explanation:** LCP establishes the PPP link.

### Q03  ·  Easy
**Question:** Stop-and-Wait utilisation (ACK negligible) is:

- **A.** 1/(1+2a) with a=Tp/Tt
- **B.** 1/(2e)
- **C.** 2 B log2(L)
- **D.** W/(2^n)

**Answer:** A
**Explanation:** One frame per RTT+Tt.

### Q04  ·  Easy
**Question:** Which option best describes **Flow control**?

- **A.** Limiting the sender so it does not overflow the receiver’s buffers.
- **B.** FHSS hopping.
- **C.** Detecting CRC errors only.
- **D.** Assigning MAC addresses.

**Answer:** A
**Explanation:** Flow control: Limiting the sender so it does not overflow the receiver’s buffers.

### Q05  ·  Easy
**Question:** Which option best describes **Framing**?

- **A.** Routing IP datagrams across ASes.
- **B.** QAM constellation binding.
- **C.** Packaging bits into identifiable frames with delimiters so the receiver can find start and end.
- **D.** FDM guard-band allocation.

**Answer:** C
**Explanation:** Framing: Packaging bits into identifiable frames with delimiters so the receiver can find start and end.

### Q06  ·  Easy
**Question:** Which option best describes **Go-Back-N**?

- **A.** No sequence numbers.
- **B.** Circuit switching setup.
- **C.** Only the lost frame is retransmitted and later frames are kept at the receiver.
- **D.** The sender may have up to W unacked frames; an error causes retransmission from the lost frame onward.

**Answer:** D
**Explanation:** Go-Back-N: The sender may have up to W unacked frames; an error causes retransmission from the lost frame onward.

### Q07  ·  Easy
**Question:** Which option best describes **LCP**?

- **A.** PCM sampling.
- **B.** Bluetooth inquiry.
- **C.** Link Control Protocol in PPP: establishes, configures, tests and terminates the data-link.
- **D.** IP routing inside OSPF.

**Answer:** C
**Explanation:** LCP: Link Control Protocol in PPP: establishes, configures, tests and terminates the data-link.

### Q08  ·  Easy
**Question:** Which option best describes **Piggybacking**?

- **A.** Stuffing bits after five 1s.
- **B.** Carrying an ACK on a data frame in the reverse direction to save control frames.
- **C.** WDM colours.
- **D.** CRC remainder 0.

**Answer:** B
**Explanation:** Piggybacking: Carrying an ACK on a data frame in the reverse direction to save control frames.

### Q09  ·  Easy
**Question:** Which option best describes **Timeout**?

- **A.** An FDM guard band.
- **B.** A Hamming parity position.
- **C.** A timer that triggers retransmission if an ACK is not received in time.
- **D.** A WDM colour.

**Answer:** C
**Explanation:** Timeout: A timer that triggers retransmission if an ACK is not received in time.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **Selective Repeat on error**?

- **A.** Discard all later good frames and rewind the whole pipe always
- **B.** Stop after one frame forever
- **C.** Receiver buffers good out-of-order frames → sender retransmits only the gap → then slide window
- **D.** Remove CRC

**Answer:** C
**Explanation:** Correct sequence for Selective Repeat on error: Receiver buffers good out-of-order frames → sender retransmits only the gap → then slide window

### Q11  ·  Easy
**Question:** Which sequence correctly describes **Stop-and-Wait ARQ**?

- **A.** Send entire file unacked → then one ACK
- **B.** Bit-stuff then skip ACKs
- **C.** GBN window 127 as the only mode
- **D.** Send frame 0 → wait ACK0 → send frame 1 → wait ACK1 → … (retransmit on timeout)

**Answer:** D
**Explanation:** Correct sequence for Stop-and-Wait ARQ: Send frame 0 → wait ACK0 → send frame 1 → wait ACK1 → … (retransmit on timeout)

### Q12  ·  Intermediate
**Question:** A satellite link has a = 50. Stop-and-Wait is painfully slow. A better ARQ is:

- **A.** Removing sequence numbers
- **B.** Switching to analog FDM only
- **C.** Go-Back-N or Selective Repeat with a large window
- **D.** Shrinking the window to 1 forever

**Answer:** C
**Explanation:** Pipelining fills the long pipe (BDP).

### Q13  ·  Intermediate
**Question:** Bandwidth is scarce and reverse traffic exists. HDLC can save ACK frames by:

- **A.** Piggybacking N(R) on I-frames
- **B.** Using only U-frames for files
- **C.** Deleting flags
- **D.** Removing CRC

**Answer:** A
**Explanation:** Piggybacking carries ACKs on data.

### Q14  ·  Intermediate
**Question:** Bit stuffing is needed because:

- **A.** Payload might otherwise contain the flag pattern
- **B.** CRC cannot run on flags
- **C.** IP checksum needs five 1s
- **D.** Nyquist forbids 1s

**Answer:** A
**Explanation:** Transparency of the flag.

### Q15  ·  Intermediate
**Question:** GBN maximum window for n-bit sequence numbers is:

- **A.** 2^(n−1)
- **B.** 1 always
- **C.** 2^n − 1
- **D.** 2^n

**Answer:** C
**Explanation:** Ambiguity avoidance for cumulative ACK.

### Q16  ·  Intermediate
**Question:** Payload contains the pattern 01111110. HDLC still finds the true flag because:

- **A.** Nyquist sampling
- **B.** Character DLE stuffing of Ethernet
- **C.** IPv4 checksum
- **D.** Bit stuffing broke the pattern in the payload

**Answer:** D
**Explanation:** Stuffed 0s prevent false flags.

### Q17  ·  Intermediate
**Question:** SR maximum window for n-bit sequence numbers is:

- **A.** 2^n − 1
- **B.** 2^(n−1)
- **C.** n
- **D.** 2^n

**Answer:** B
**Explanation:** Sender and receiver windows each ≤ half the sequence space.

### Q18  ·  Intermediate
**Question:** Sender times out though the frame arrived (ACK lost). Stop-and-Wait must:

- **A.** Switch to FDM
- **B.** Assume success and skip seq numbers
- **C.** Retransmit; receiver drops the duplicate using seq no
- **D.** Enlarge Hamming dmin

**Answer:** C
**Explanation:** Duplicate detection needs alternating sequence numbers.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **Go-Back-N** and **Selective Repeat**?

- **A.** SR resends the entire window always.
- **B.** They both have window 1 only.
- **C.** GBN discards out-of-order frames at receiver and resends a stretch; SR stores them and resends only gaps.
- **D.** GBN never uses sequence numbers.

**Answer:** C
**Explanation:** GBN discards out-of-order frames at receiver and resends a stretch; SR stores them and resends only gaps.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **HDLC** and **PPP**?

- **A.** HDLC is bit-oriented with I/S/U frames; PPP is typically byte-oriented with LCP/NCP for IP links.
- **B.** PPP is token ring.
- **C.** They are both Nyquist theorems.
- **D.** HDLC is IPv6.

**Answer:** A
**Explanation:** HDLC is bit-oriented with I/S/U frames; PPP is typically byte-oriented with LCP/NCP for IP links.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **I-frame** and **S-frame**?

- **A.** I-frames cannot carry data.
- **B.** S-frames carry user files.
- **C.** HDLC I-frames carry data (and may piggyback ACK); S-frames are supervisory (RR, REJ, etc.).
- **D.** U-frames are the only frames that exist.

**Answer:** C
**Explanation:** HDLC I-frames carry data (and may piggyback ACK); S-frames are supervisory (RR, REJ, etc.).

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **character stuffing** and **bit stuffing**?

- **A.** Character stuffing is byte-oriented (escape bytes); bit stuffing is bit-oriented (0 after five 1s).
- **B.** Bit stuffing inserts DLE bytes.
- **C.** They are the same algorithm.
- **D.** Character stuffing uses flag 01111110 only.

**Answer:** A
**Explanation:** Character stuffing is byte-oriented (escape bytes); bit stuffing is bit-oriented (0 after five 1s).

### Q23  ·  Intermediate
**Question:** Which option best describes **Bit stuffing**?

- **A.** Inserting a 0 after five consecutive 1s so a flag 01111110 cannot appear in HDLC data.
- **B.** IPv6 extension headers.
- **C.** Nyquist sampling.
- **D.** Inserting an ASCII DLE character.

**Answer:** A
**Explanation:** Bit stuffing: Inserting a 0 after five consecutive 1s so a flag 01111110 cannot appear in HDLC data.

### Q24  ·  Intermediate
**Question:** Which option best describes **Character stuffing**?

- **A.** Inserting 0 after five 1s in bit-oriented HDLC.
- **B.** Inserting an extra escape byte when the flag/escape pattern appears in byte-oriented payload.
- **C.** Token passing.
- **D.** CRC polynomial division.

**Answer:** B
**Explanation:** Character stuffing: Inserting an extra escape byte when the flag/escape pattern appears in byte-oriented payload.

### Q25  ·  Intermediate
**Question:** Which option best describes **Error control**?

- **A.** Only line coding AMI.
- **B.** Only FDM.
- **C.** Only NAT.
- **D.** Detection of lost/corrupted frames and recovery, typically by ARQ.

**Answer:** D
**Explanation:** Error control: Detection of lost/corrupted frames and recovery, typically by ARQ.

### Q26  ·  Intermediate
**Question:** Which option best describes **HDLC**?

- **A.** IPv4 CIDR.
- **B.** High-Level Data Link Control: a bit-oriented protocol with flag 01111110 and frame types I, S, U.
- **C.** IEEE 802.11 DCF only.
- **D.** A purely character-oriented BISYNC-only protocol with no flags.

**Answer:** B
**Explanation:** HDLC: High-Level Data Link Control: a bit-oriented protocol with flag 01111110 and frame types I, S, U.

### Q27  ·  Intermediate
**Question:** Which option best describes **NCP**?

- **A.** Network Control Protocol(s) in PPP that configure the network-layer protocol (e.g. IPCP for IPv4).
- **B.** HDLC bit stuffing only.
- **C.** Nyquist L levels.
- **D.** CRC-32 of Ethernet.

**Answer:** A
**Explanation:** NCP: Network Control Protocol(s) in PPP that configure the network-layer protocol (e.g. IPCP for IPv4).

### Q28  ·  Intermediate
**Question:** Which option best describes **PPP**?

- **A.** A LAN CSMA/CD protocol.
- **B.** A Hamming SEC code.
- **C.** A cellular handoff algorithm.
- **D.** Point-to-Point Protocol: a byte-oriented (typically) data-link protocol for point-to-point links, with LCP/NCP.

**Answer:** D
**Explanation:** PPP: Point-to-Point Protocol: a byte-oriented (typically) data-link protocol for point-to-point links, with LCP/NCP.

### Q29  ·  Intermediate
**Question:** Which option best describes **Selective Repeat**?

- **A.** Pure ALOHA.
- **B.** Only damaged/lost frames are retransmitted; the receiver buffers out-of-order good frames.
- **C.** All frames after an error are discarded and resent, including good ones.
- **D.** No receiver window.

**Answer:** B
**Explanation:** Selective Repeat: Only damaged/lost frames are retransmitted; the receiver buffers out-of-order good frames.

### Q30  ·  Intermediate
**Question:** Which option best describes **Sequence number**?

- **A.** The analog carrier frequency.
- **B.** The RJ45 pin number.
- **C.** The fibre wavelength only.
- **D.** An identifier in a frame so sender and receiver can detect duplicates, losses and order.

**Answer:** D
**Explanation:** Sequence number: An identifier in a frame so sender and receiver can detect duplicates, losses and order.

### Q31  ·  Intermediate
**Question:** Which option best describes **Sliding window**?

- **A.** An FDM guard.
- **B.** A Hamming syndrome.
- **C.** A Shannon capacity formula.
- **D.** A protocol abstraction of a sequence-number window of frames allowed in flight.

**Answer:** D
**Explanation:** Sliding window: A protocol abstraction of a sequence-number window of frames allowed in flight.

### Q32  ·  Intermediate
**Question:** Which option best describes **Stop-and-Wait ARQ**?

- **A.** Selective repeat of only erred frames with a large window always.
- **B.** Pipelining N frames without waiting.
- **C.** The sender transmits one frame and waits for ACK (or timeout/NAK) before the next.
- **D.** Token-ring priority.

**Answer:** C
**Explanation:** Stop-and-Wait ARQ: The sender transmits one frame and waits for ACK (or timeout/NAK) before the next.

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **Go-Back-N on error**?

- **A.** Retransmit only the lost frame and keep later frames at a bufferless receiver as delivered
- **B.** Never use sequence numbers
- **C.** Send up to W frames → on NAK/timeout resend from the lost sequence onward
- **D.** Switch to FDM

**Answer:** C
**Explanation:** Correct sequence for Go-Back-N on error: Send up to W frames → on NAK/timeout resend from the lost sequence onward

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **HDLC frame delimiting**?

- **A.** Start flag 01111110 → stuffed payload+CRC → end flag 01111110
- **B.** Byte count only with no flag ever
- **C.** IP TTL as a flag
- **D.** Manchester mid-bit as HDLC flag

**Answer:** A
**Explanation:** Correct sequence for HDLC frame delimiting: Start flag 01111110 → stuffed payload+CRC → end flag 01111110

### Q35  ·  Intermediate
**Question:** Which statement about **Bit stuffing** is FALSE?

- **A.** Bit stuffing is correctly understood as: inserting a 0 after five consecutive 1s so a flag 01111110 cannot appear in HDLC data.
- **B.** In this module, Bit stuffing is a core idea students must distinguish from nearby terms.
- **C.** Bit stuffing inserts a 1 after every five 0s.
- **D.** A useful way to remember Bit stuffing is that it is not the same as “Inserting an ASCII DLE character”.

**Answer:** C
**Explanation:** The false claim is: Bit stuffing inserts a 1 after every five 0s.. Bit stuffing actually means: Inserting a 0 after five consecutive 1s so a flag 01111110 cannot appear in HDLC data.

### Q36  ·  Intermediate
**Question:** Which statement about **Error control** is FALSE?

- **A.** Error control is correctly understood as: detection of lost/corrupted frames and recovery, typically by ARQ.
- **B.** A useful way to remember Error control is that it is not the same as “Only line coding AMI”.
- **C.** Error control never uses acknowledgements or retransmissions.
- **D.** In this module, Error control is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Error control never uses acknowledgements or retransmissions.. Error control actually means: Detection of lost/corrupted frames and recovery, typically by ARQ.

### Q37  ·  Intermediate
**Question:** Which statement about **Framing** is FALSE?

- **A.** Framing is performed only by the network layer using IPv4 TTL.
- **B.** In this module, Framing is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Framing is that it is not the same as “Routing IP datagrams across ASes”.
- **D.** Framing is correctly understood as: packaging bits into identifiable frames with delimiters so the receiver can find start and end.

**Answer:** A
**Explanation:** The false claim is: Framing is performed only by the network layer using IPv4 TTL.. Framing actually means: Packaging bits into identifiable frames with delimiters so the receiver can find start and end.

### Q38  ·  Intermediate
**Question:** Which statement about **Go-Back-N** is FALSE?

- **A.** In this module, Go-Back-N is a core idea students must distinguish from nearby terms.
- **B.** Go-Back-N never retransmits more than the single lost frame.
- **C.** Go-Back-N is correctly understood as: the sender may have up to W unacked frames; an error causes retransmission from the lost frame onward.
- **D.** A useful way to remember Go-Back-N is that it is not the same as “Only the lost frame is retransmitted and later frames are kept at the receiver”.

**Answer:** B
**Explanation:** The false claim is: Go-Back-N never retransmits more than the single lost frame.. Go-Back-N actually means: The sender may have up to W unacked frames; an error causes retransmission from the lost frame onward.

### Q39  ·  Intermediate
**Question:** Which statement about **HDLC** is FALSE?

- **A.** HDLC is correctly understood as: high-Level Data Link Control: a bit-oriented protocol with flag 01111110 and frame types I, S, U.
- **B.** A useful way to remember HDLC is that it is not the same as “A purely character-oriented BISYNC-only protocol with no flags”.
- **C.** HDLC is an application-layer file format.
- **D.** In this module, HDLC is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: HDLC is an application-layer file format.. HDLC actually means: High-Level Data Link Control: a bit-oriented protocol with flag 01111110 and frame types I, S, U.

### Q40  ·  Intermediate
**Question:** Which statement about **LCP** is FALSE?

- **A.** A useful way to remember LCP is that it is not the same as “IP routing inside OSPF”.
- **B.** LCP assigns IPv6 global addresses as its only job.
- **C.** In this module, LCP is a core idea students must distinguish from nearby terms.
- **D.** LCP is correctly understood as: link Control Protocol in PPP: establishes, configures, tests and terminates the data-link.

**Answer:** B
**Explanation:** The false claim is: LCP assigns IPv6 global addresses as its only job.. LCP actually means: Link Control Protocol in PPP: establishes, configures, tests and terminates the data-link.

### Q41  ·  Intermediate
**Question:** Which statement about **Sequence number** is FALSE?

- **A.** Sequence numbers are illegal in GBN and SR.
- **B.** A useful way to remember Sequence number is that it is not the same as “The analog carrier frequency”.
- **C.** Sequence number is correctly understood as: an identifier in a frame so sender and receiver can detect duplicates, losses and order.
- **D.** In this module, Sequence number is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Sequence numbers are illegal in GBN and SR.. Sequence number actually means: An identifier in a frame so sender and receiver can detect duplicates, losses and order.

### Q42  ·  Intermediate
**Question:** Which statement about **Sliding window** is FALSE?

- **A.** A sliding window has size 0 by definition in GBN.
- **B.** In this module, Sliding window is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Sliding window is that it is not the same as “A Shannon capacity formula”.
- **D.** Sliding window is correctly understood as: a protocol abstraction of a sequence-number window of frames allowed in flight.

**Answer:** A
**Explanation:** The false claim is: A sliding window has size 0 by definition in GBN.. Sliding window actually means: A protocol abstraction of a sequence-number window of frames allowed in flight.

### Q43  ·  Difficult
**Question:** A home DSL/PPPoE session must negotiate IP. Which PPP component configures IPv4?

- **A.** NCP/IPCP
- **B.** Only HDLC U-frames with no NCP
- **C.** Hamming SEC
- **D.** CSMA/CD

**Answer:** A
**Explanation:** IPCP is the IPv4 NCP.

### Q44  ·  Difficult
**Question:** Bit stuffing: data 01111110. After HDLC stuffing (0 after five 1s), the bits are:

- **A.** 01111110
- **B.** 11111111
- **C.** 0111110010
- **D.** 011111010

**Answer:** D
**Explanation:** After five 1s insert 0: 011111010.

### Q45  ·  Difficult
**Question:** Frame 1000 bits, R=1 Mbps, distance 200 km, v=2×10^8 m/s. Find a = Tp/Tt.

- **A.** 0.1
- **B.** 200
- **C.** 1
- **D.** 10

**Answer:** C
**Explanation:** Tt=1 ms; Tp=200e3/2e8=1 ms; a=1.

### Q46  ·  Difficult
**Question:** GBN with n = 4 sequence bits. Maximum window size?

- **A.** 15
- **B.** 8
- **C.** 16
- **D.** 4

**Answer:** A
**Explanation:** Wmax = 2^n − 1 = 15 to avoid ambiguity.

### Q47  ·  Difficult
**Question:** If a=4 and GBN W=7, utilisation is about:

- **A.** 7/(1+8)=7/9 ≈ 77.8%
- **B.** 100% always
- **C.** 18.4%
- **D.** 1/(1+8)=11%

**Answer:** A
**Explanation:** U = min(1, W/(1+2a)) = 7/9.

### Q48  ·  Difficult
**Question:** PPP LCP fails to agree options. What happens to the user IP session?

- **A.** Ethernet CSMA/CD takes over the serial line
- **B.** IP still routes over a raw coax with no framing
- **C.** The link does not come up; NCP/IP never configures
- **D.** Hamming code replaces PPP

**Answer:** C
**Explanation:** LCP must succeed before NCPs.

### Q49  ·  Difficult
**Question:** Receiver has tiny buffers and cannot store out-of-order frames. Which ARQ fits?

- **A.** Selective Repeat with a huge reassembly buffer
- **B.** Go-Back-N (or Stop-and-Wait)
- **C.** QAM-16
- **D.** Pure ALOHA

**Answer:** B
**Explanation:** GBN receiver only wants the next in-order frame.

### Q50  ·  Difficult
**Question:** SAW: a = 10. Efficiency?

- **A.** 100%
- **B.** ≈ 4.76%
- **C.** 50%
- **D.** 18.4%

**Answer:** B
**Explanation:** U = 1/(1+20) = 1/21 ≈ 4.76%.

### Q51  ·  Difficult
**Question:** Selective Repeat with n = 3 sequence bits. Maximum window size?

- **A.** 4
- **B.** 7
- **C.** 8
- **D.** 3

**Answer:** A
**Explanation:** Wmax = 2^(n−1) = 4.

### Q52  ·  Difficult
**Question:** Sequence space is 3 bits and SR window was wrongly set to 8. The problem is:

- **A.** Wraparound ambiguity between new frames and retransmissions
- **B.** CRC becomes 0 always
- **C.** Manchester fails
- **D.** FDM guards vanish

**Answer:** A
**Explanation:** SR needs W ≤ 2^(n−1).

### Q53  ·  Difficult
**Question:** Stop-and-Wait: Tt = 1 ms, Tp = 1 ms, ignore ACK length. Utilisation?

- **A.** 1
- **B.** 1/2
- **C.** 1/3
- **D.** 1/100

**Answer:** C
**Explanation:** U = 1/(1+2a), a=Tp/Tt=1 → 1/3.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **ACK** and **NAK**?

- **A.** NAK means the frame was perfect.
- **B.** ACK confirms successful receipt; NAK (if used) requests retransmission of a bad frame.
- **C.** They are stuffing rules.
- **D.** ACK always means timeout.

**Answer:** B
**Explanation:** ACK confirms successful receipt; NAK (if used) requests retransmission of a bad frame.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **Stop-and-Wait** and **Go-Back-N**?

- **A.** Stop-and-Wait window is 1; GBN pipelines up to W and rewinds on error.
- **B.** They are identical to SR.
- **C.** Stop-and-Wait uses W=2^n−1 always 127.
- **D.** GBN cannot pipeline.

**Answer:** A
**Explanation:** Stop-and-Wait window is 1; GBN pipelines up to W and rewinds on error.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **flow control** and **error control**?

- **A.** Error control is only FDM.
- **B.** Flow control is only Hamming dmin.
- **C.** They are the same CRC.
- **D.** Flow control protects receiver buffers; error control recovers from loss/corruption.

**Answer:** D
**Explanation:** Flow control protects receiver buffers; error control recovers from loss/corruption.

### Q57  ·  Difficult
**Question:** Which statement about **Character stuffing** is FALSE?

- **A.** In this module, Character stuffing is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Character stuffing is that it is not the same as “Inserting 0 after five 1s in bit-oriented HDLC”.
- **C.** Character stuffing inserts a 0-bit after five 1s.
- **D.** Character stuffing is correctly understood as: inserting an extra escape byte when the flag/escape pattern appears in byte-oriented payload.

**Answer:** C
**Explanation:** The false claim is: Character stuffing inserts a 0-bit after five 1s.. Character stuffing actually means: Inserting an extra escape byte when the flag/escape pattern appears in byte-oriented payload.

### Q58  ·  Difficult
**Question:** Which statement about **Flow control** is FALSE?

- **A.** Flow control is identical to congestion control in the whole Internet core.
- **B.** In this module, Flow control is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Flow control is that it is not the same as “Detecting CRC errors only”.
- **D.** Flow control is correctly understood as: limiting the sender so it does not overflow the receiver’s buffers.

**Answer:** A
**Explanation:** The false claim is: Flow control is identical to congestion control in the whole Internet core.. Flow control actually means: Limiting the sender so it does not overflow the receiver’s buffers.

### Q59  ·  Difficult
**Question:** Which statement about **NCP** is FALSE?

- **A.** In this module, NCP is a core idea students must distinguish from nearby terms.
- **B.** NCP is the flag 01111110.
- **C.** NCP is correctly understood as: network Control Protocol(s) in PPP that configure the network-layer protocol (e.g. IPCP for IPv4).
- **D.** A useful way to remember NCP is that it is not the same as “HDLC bit stuffing only”.

**Answer:** B
**Explanation:** The false claim is: NCP is the flag 01111110.. NCP actually means: Network Control Protocol(s) in PPP that configure the network-layer protocol (e.g. IPCP for IPv4).

### Q60  ·  Difficult
**Question:** Which statement about **PPP** is FALSE?

- **A.** In this module, PPP is a core idea students must distinguish from nearby terms.
- **B.** PPP is correctly understood as: point-to-Point Protocol: a byte-oriented (typically) data-link protocol for point-to-point links, with LCP/NCP.
- **C.** A useful way to remember PPP is that it is not the same as “A LAN CSMA/CD protocol”.
- **D.** PPP is the Ethernet CSMA/CD MAC.

**Answer:** D
**Explanation:** The false claim is: PPP is the Ethernet CSMA/CD MAC.. PPP actually means: Point-to-Point Protocol: a byte-oriented (typically) data-link protocol for point-to-point links, with LCP/NCP.

### Q61  ·  Difficult
**Question:** Which statement about **Piggybacking** is FALSE?

- **A.** Piggybacking is correctly understood as: carrying an ACK on a data frame in the reverse direction to save control frames.
- **B.** Piggybacking means deleting sequence numbers.
- **C.** A useful way to remember Piggybacking is that it is not the same as “Stuffing bits after five 1s”.
- **D.** In this module, Piggybacking is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Piggybacking means deleting sequence numbers.. Piggybacking actually means: Carrying an ACK on a data frame in the reverse direction to save control frames.

### Q62  ·  Difficult
**Question:** Which statement about **Selective Repeat** is FALSE?

- **A.** A useful way to remember Selective Repeat is that it is not the same as “All frames after an error are discarded and resent, including good ones”.
- **B.** In this module, Selective Repeat is a core idea students must distinguish from nearby terms.
- **C.** Selective Repeat forbids buffering at the receiver.
- **D.** Selective Repeat is correctly understood as: only damaged/lost frames are retransmitted; the receiver buffers out-of-order good frames.

**Answer:** C
**Explanation:** The false claim is: Selective Repeat forbids buffering at the receiver.. Selective Repeat actually means: Only damaged/lost frames are retransmitted; the receiver buffers out-of-order good frames.

### Q63  ·  Difficult
**Question:** Which statement about **Stop-and-Wait ARQ** is FALSE?

- **A.** A useful way to remember Stop-and-Wait ARQ is that it is not the same as “Pipelining N frames without waiting”.
- **B.** Stop-and-Wait always keeps a window of 127 frames in flight.
- **C.** In this module, Stop-and-Wait ARQ is a core idea students must distinguish from nearby terms.
- **D.** Stop-and-Wait ARQ is correctly understood as: the sender transmits one frame and waits for ACK (or timeout/NAK) before the next.

**Answer:** B
**Explanation:** The false claim is: Stop-and-Wait always keeps a window of 127 frames in flight.. Stop-and-Wait ARQ actually means: The sender transmits one frame and waits for ACK (or timeout/NAK) before the next.

### Q64  ·  Difficult
**Question:** Which statement about **Timeout** is FALSE?

- **A.** A useful way to remember Timeout is that it is not the same as “A Hamming parity position”.
- **B.** In this module, Timeout is a core idea students must distinguish from nearby terms.
- **C.** A timeout always means the frame was delivered twice successfully.
- **D.** Timeout is correctly understood as: a timer that triggers retransmission if an ACK is not received in time.

**Answer:** C
**Explanation:** The false claim is: A timeout always means the frame was delivered twice successfully.. Timeout actually means: A timer that triggers retransmission if an ACK is not received in time.

### Q65  ·  Difficult
**Question:** Why is SR more complex than GBN?

- **A.** SR uses no sequence numbers
- **B.** SR window is always 1
- **C.** Receiver must buffer out-of-order frames and ACK them selectively; sender must buffer individually
- **D.** GBN always buffers the whole file at the receiver first

**Answer:** C
**Explanation:** Per-frame timers/buffers vs cumulative rewind.

---

## Quick answer key

Q01–A | Q02–C | Q03–A | Q04–A | Q05–C | Q06–D | Q07–C | Q08–B | Q09–C | Q10–C | Q11–D | Q12–C | Q13–A | Q14–A | Q15–C | Q16–D | Q17–B | Q18–C | Q19–C | Q20–A | Q21–C | Q22–A | Q23–A | Q24–B | Q25–D | Q26–B | Q27–A | Q28–D | Q29–B | Q30–D | Q31–D | Q32–C | Q33–C | Q34–A | Q35–C | Q36–C | Q37–A | Q38–B | Q39–C | Q40–B | Q41–A | Q42–A | Q43–A | Q44–D | Q45–C | Q46–A | Q47–A | Q48–C | Q49–B | Q50–B | Q51–A | Q52–A | Q53–C | Q54–B | Q55–A | Q56–D | Q57–C | Q58–A | Q59–B | Q60–D | Q61–B | Q62–C | Q63–B | Q64–C | Q65–C
