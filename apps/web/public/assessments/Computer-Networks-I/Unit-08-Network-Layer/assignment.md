# Assignment — Computer Networks-I — Unit 8 — Network Layer

**Subject:** Computer Networks-I  
**Module:** Unit 8 — Network Layer  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain IPv4 dotted decimal. Convert 192.168.1.10 to binary (first octet fully, others may be summarised).

**Expected Key Points:**
- 192=11000000, 168=10101000, 1=00000001, 10=00001010.
- 32 bits total.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define classful A, B, C default masks and first-octet ranges.

**Expected Key Points:**
- A: 1–126, /8.
- B: 128–191, /16.
- C: 192–223, /24.
- (0 and 127 special; D 224–239; E 240–255.)
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** List RFC1918 private blocks and why NAT is used with them.

**Expected Key Points:**
- 10/8, 172.16/12, 192.168/16.
- They are not globally unique; NAT maps many internals to few public IPs, conserving IPv4.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define CIDR. Why did it replace classful routing in the default-free zone?

**Expected Key Points:**
- Arbitrary prefix lengths and route aggregation (supernetting) slow table growth versus millions of classful networks.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** For 192.168.1.130/26 give network, first/last usable, broadcast, mask, and number of hosts.

**Expected Key Points:**
- Net 192.168.1.128, usable .129–.190, bcast .191, mask 255.255.255.192, hosts 62.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Subnet 10.0.0.0/8 into /12s. How many subnets? Hosts per subnet (usable)? Give the second subnet’s network.

**Expected Key Points:**
- 4 bits borrowed → 16 subnets.
- Usable hosts 2^20 − 2 = 1,048,574.
- Subnets 10.0.0.0/12, 10.16.0.0/12, … second is 10.16.0.0/12.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare IPv4 and IPv6 headers field by field (version, addressing, QoS, TTL, checksum, fragmentation, options).

**Expected Key Points:**
- v4: IHL, TOS, total length, ID/flags/offset, TTL, protocol, checksum, 32-bit addr, options.
- v6: traffic class, flow label, payload length, next header, hop limit, 128-bit addr, extensions.
- No v6 header checksum; no router fragmentation.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain NAT and NAPT with a campus example of 500 students sharing one public IP.

**Expected Key Points:**
- Table maps (priv IP, port)↔(public IP, port).
- Inbound unsolicited packets fail unless port-forwarded.
- Breaks some end-to-end apps.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** You are given 172.16.0.0/16 and need 5 departments of 2000 hosts and 20 labs of 30 hosts. Propose a VLSM plan with masks and counts.

**Expected Key Points:**
- 2000 hosts → /21 (2046 usable).
- 5×/21 = 5×2048 addresses.
- Labs 30 hosts → /27 (30 usable).
- Check 5×2048 + 20×32 = 10240+640=10880 < 65536.
- Example: 172.16.0.0/21 … 172.16.8.0/21 … up to 172.16.32.0/21; labs from 172.16.40.0/27 onward.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Packet 4000 bytes, MTU 1500, IPv4 header 20 bytes. How many fragments and what payload sizes if identification is common? (Ignore options.)

**Expected Key Points:**
- Max payload per fragment 1480, and 1480 must be multiple of 8 → 1480 OK.
- 3980 payload → 1480+1480+1020 = 3 fragments.
- Offsets 0, 185, 370 (in 8-byte units).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO1
**Question:** A new hostel needs IPv4 private + NAT and a future IPv6 /64 per floor. Sketch addressing, DHCP/SLAAC, and what the edge router must do.

**Expected Key Points:**
- IPv4: 10.F.0.0/16 per floor or /24 per AP-VLAN, DHCP, PAT at edge.
- IPv6: provider /48, /64 per VLAN, SLAAC or DHCPv6, no NAT66 required.
- Dual-stack firewall.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a default mask? What is 255.255.255.252 used for?

**Expected Key Points:**
- Classful /8/16/24.
- /30 (255.255.255.252) is a 2-usable-host point-to-point link.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain ARP. Why is it not used as-is for IPv6?

**Expected Key Points:**
- ARP broadcasts ‘who has IP?’ for MAC.
- IPv6 uses Neighbour Discovery (NS/NA) with multicast, not broadcast ARP.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare connectionless internetworking (IP datagrams) with a VC WAN. Why did IP win?

**Expected Key Points:**
- IP: no per-flow state, robust, overlay any L2.
- VC (ATM/X.25): QoS setup complexity.
- The Internet valued connectivity over per-call circuits.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain longest-prefix matching with routes 10.0.0.0/8, 10.1.0.0/16, 10.1.2.0/24 for dest 10.1.2.5.

**Expected Key Points:**
- Matches all three; /24 is most specific → next hop of 10.1.2.0/24.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO1
**Question:** Two hostels use 192.168.0.0/24 and then merge LANs. What breaks and how do you fix it with CIDR/NAT?

**Expected Key Points:**
- Duplicate private space: ARP/IP conflicts.
- Renumber one side (e.g.
- 192.168.1.0/24) or keep them isolated with NAT in between — renumbering is cleaner.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five IPv6 address types/notations a VTU student should know.

**Expected Key Points:**
- Unicast, multicast, anycast; link-local fe80::/10; ::1 loopback; compressed zeros ::; no broadcasts.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Why is 127.0.0.1 not a Class A public network?

**Expected Key Points:**
- 127.0.0.0/8 is loopback.
- Packets to it should never leave the host; it is special-cased, not 127.0.0.0 as a routed /8.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** How many /24s are aggregated by 192.168.0.0/22? How many host addresses does /22 contain (including net/broadcast)?

**Expected Key Points:**
- 22 to 24 is 2 bits → 4 × /24.
- Addresses = 2^(32−22) = 1024 (usable 1022).
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write 200 words: ‘IPv6 is not just longer addresses.’ Cover header simplification, ND vs ARP, and no NAT as a design goal.

**Expected Key Points:**
- Mention flow label, extension headers, PMTU, multicast ND, and end-to-end restoration versus IPv4+NAT.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Unit 08 Network Layer).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Network and Layer in the context of Network Layer. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Computer Networks I scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Network as used in Network Layer. Include one precise example.

**Model answer:** Network is a foundational construct in Network Layer. Example should name entities/operations and relate to Layer. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Network and Layer. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Network Layer theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Network Layer to a realistic campus/industry scenario relevant to Network Layer. State assumptions.

**Model answer:** Describe scenario, map concepts (Network, Layer), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Layer and its role within Network Layer.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Network if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to unit within Network Layer; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Network while building a solution involving unit. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Network Layer principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Network Layer in Computer Networks I.

**Model answer:** Provide four definitions: include Network, Layer, and two adjacent terms from Network Layer. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Network Layer that integrates Network, Layer, and Network Layer.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Layer in Network Layer.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Network.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Network and module. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Network and Network Layer: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Network Layer, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Network Layer under constraints typical of Computer Networks I.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how unit depends on earlier ideas such as Network in Network Layer.

**Model answer:** Dependency chain with one counterexample showing what fails if Network is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where module measurably improves an outcome in Computer Networks I.

**Model answer:** Context, intervention using module, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Layer in Network Layer. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Network in Network Layer: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Computer Networks I.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Network Layer for Network Layer.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Network Layer.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Layer in Network Layer. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Network in Network Layer, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

