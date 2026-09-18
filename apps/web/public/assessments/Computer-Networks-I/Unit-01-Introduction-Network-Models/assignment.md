# Assignment — Computer Networks-I — Unit 1 — Introduction & Network Models

**Subject:** Computer Networks-I  
**Module:** Unit 1 — Introduction & Network Models  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define data communication. Explain delivery, accuracy, timeliness and jitter with one example each.

**Expected Key Points:**
- Data communication is transfer of data through a medium.
- Delivery: email reaches the mailbox.
- Accuracy: a file is bit-for-bit correct.
- Timeliness: live lecture audio within ~150 ms.
- Jitter: VoIP delay varying from 40–200 ms causing chop.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a protocol? List four elements a protocol must specify.

**Expected Key Points:**
- A protocol is an agreed set of rules.
- It specifies syntax (format), semantics (meaning), timing (when/how fast) and error/recovery behaviour (and often addressing).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List the seven OSI layers in order (bottom to top) and give one function of each.

**Expected Key Points:**
- Physical: bits as signals.
- Data-link: framing/MAC/hop error detect.
- Network: routing/logical addressing.
- Transport: process delivery.
- Session: dialogue/checkpoints.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish LAN, WAN and internetwork (Internet) with one example each.

**Expected Key Points:**
- LAN: VVIET campus Ethernet.
- WAN: leased link across cities.
- Internet: global TCP/IP interconnection of many networks.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare the OSI and TCP/IP models. Why does the Internet run TCP/IP rather than full OSI stacks?

**Expected Key Points:**
- OSI: 7-layer reference, late and complex.
- TCP/IP: 4-layer implemented suite (app, transport, internet, host-to-network) with working protocols (IP, TCP, UDP).
- The Internet standardised on deployed TCP/IP, using OSI mainly as a teaching/reference model.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare physical, logical and port addressing. Show the three addresses used when a PC fetches a web page.

**Expected Key Points:**
- Physical: 48-bit MAC of next hop.
- Logical: IPv4/IPv6 of the server.
- Port: 80 or 443 on the server (ephemeral port on the client).
- MACs change each hop; IP and ports are end-to-end (NAT aside).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain encapsulation and decapsulation with the PDUs: data, segment, packet, frame, bits.

**Expected Key Points:**
- Sender: app data → transport header (segment) → IP header (packet) → frame header/trailer → bits.
- Receiver reverses the headers hop by hop / end to end.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why switches are said to be data-link devices while routers are network-layer devices.

**Expected Key Points:**
- Switches learn/forward on MAC addresses within a LAN.
- Routers parse IP, decrement TTL/hop limit and forward between networks using routing tables.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** A 2 Mbps link is 400 km long; propagation speed is 2×10^8 m/s. Find (i) transmission delay of a 1000-byte packet (ii) propagation delay (iii) bandwidth-delay product in bits.

**Expected Key Points:**
- (i) Tt = 8000 / 2×10^6 = 4 ms.
- (ii) Tp = 4×10^5 / 2×10^8 = 2 ms.
- (iii) BDP = 2×10^6 × 0.002 = 4000 bits.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** A packet of 1500 bytes traverses 3 store-and-forward routers (4 links). Each link is 10 Mbps with 2 ms propagation and 0.1 ms processing (ignore queueing). Compute end-to-end delay.

**Expected Key Points:**
- 4 transmissions: 4 × (12000/10×10^6) = 4 × 1.2 ms = 4.8 ms.
- 4 propagations: 8 ms.
- 3 processing: 0.3 ms.
- Total = 13.1 ms.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** A campus CCTV stream is delivered but freezes every few seconds while file downloads succeed. Diagnose using delivery, accuracy, timeliness and jitter, and name the layers most involved.

**Expected Key Points:**
- Downloads tolerate delay; video needs bounded delay and low jitter.
- Suspect queueing/jitter at network/transport (buffering, no QoS) or loss recovered too late.
- Physical/data-link may still be accurate.
- Propose buffering, priority queues, or a better transport.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Map a web request from a student PC to a server onto OSI layers. For each layer name one protocol or address used.

**Expected Key Points:**
- Presentation: TLS syntax.
- Session: implicit in TCP.
- Transport: TCP ports.
- Network: IPv4 dst.
- Data-link: Ethernet MAC to default gateway.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define a network and an Internet. Give one VVIET-scale example of each.

**Expected Key Points:**
- A network is a set of linked devices (dept LAN).
- An Internet is a network of networks using TCP/IP (the public Internet connecting the campus edge router).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a standards body? Relate IETF, ISO and IEEE to TCP/IP, OSI and Ethernet.

**Expected Key Points:**
- ISO: OSI reference model.
- IETF: RFCs for TCP/IP.
- IEEE: 802.3 Ethernet and 802.11 WLAN MAC/PHY standards.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain unicast, multicast and broadcast with one IPv4/Ethernet example each.

**Expected Key Points:**
- Unicast: one-to-one (host 10.0.0.5, unicast MAC).
- Multicast: one-to-group (224.0.0.1, 01-00-5E-… MAC).
- Broadcast: one-to-all in domain (255.255.255.255 or FF:FF:FF:FF:FF:FF).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare connection-oriented and connectionless delivery. Map TCP and UDP to the choice and give one campus application for each.

**Expected Key Points:**
- CO: setup, state, in-order (TCP — file transfer, HTTP).
- CL: independent datagrams (UDP — DNS, some VoIP).
- TCP recovers loss; UDP leaves it to the app.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor claims ‘our hub routes the Internet at layer 7’. Critique using the OSI model.

**Expected Key Points:**
- A hub is a physical-layer multiport repeater: it regenerates bits, has no MAC table, no IP routing and no HTTP processing.
- Routing is network layer; ‘layer 7 switch’ is a different, application-aware device.
- The claim confuses devices and layers.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define jitter and state why it matters more for streaming than for a one-shot file copy.

**Expected Key Points:**
- Jitter is delay variation.
- Playback needs a smooth clock; a file copy only needs eventual completeness, so buffering can hide jitter.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the difference between a reference model and a protocol suite, using OSI and TCP/IP.

**Expected Key Points:**
- A reference model names layers and services (OSI).
- A suite specifies actual protocols and PDUs (TCP/IP).
- Teaching uses both; implementation on the Internet is TCP/IP.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write a 200-word note: ‘Addresses exist at more than one layer.’ Illustrate with a student downloading a PDF.

**Expected Key Points:**
- Trace MAC of gateway, IPv4 of the server, TCP ports, and optionally URL/hostname at application.
- Explain why each is needed, what changes per hop, and how ARP/ND binds logical to physical on a LAN.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 01 Introduction Network Models).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Introduction and Network in the context of Introduction & Network Models. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Introduction as used in Introduction & Network Models. Include one precise example.

**Model answer:** Introduction is a foundational construct in Introduction & Network Models. Example should name entities/operations and relate to Network. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Introduction and Network. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Introduction & Network Models theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Models to a realistic campus/industry scenario relevant to Introduction & Network Models. State assumptions.

**Model answer:** Describe scenario, map concepts (Introduction, Network), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Network and its role within Introduction & Network Models.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Introduction if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Introduction Network within Introduction & Network Models; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Introduction while building a solution involving Introduction Network. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Introduction & Network Models principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Models in Computer Networks I.

**Model answer:** Provide four definitions: include Introduction, Network, and two adjacent terms from Introduction & Network Models. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Introduction & Network Models that integrates Introduction, Network, and Models.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Network in Introduction & Network Models.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Introduction.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Introduction and Network Models. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Introduction and Models: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Introduction & Network Models, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Models under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Introduction Network depends on earlier ideas such as Introduction in Introduction & Network Models.

**Model answer:** Dependency chain with one counterexample showing what fails if Introduction is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Network Models measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using Network Models, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Network in Introduction & Network Models. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Introduction in Introduction & Network Models: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Models for Introduction & Network Models.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Models.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Network in Introduction & Network Models. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Introduction in Introduction & Network Models, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

