# Quiz — Operating Systems — Module 4: Memory Is an Illusion

**Subject:** Operating Systems  
**Module:** Module 4 — Memory Is an Illusion  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A page fault occurs when:

- **A.** The referenced page is not currently mapped as present
- **B.** The quantum expires
- **C.** A semaphore is 0
- **D.** SCAN hits the edge

**Answer:** A
**Explanation:** Valid/present bit is clear (or protection fault).

### Q02  ·  Easy
**Question:** Demand paging loads a page:

- **A.** Only at shutdown
- **B.** When it is referenced and not resident
- **C.** When the disk is idle only
- **D.** Always at compile time

**Answer:** B
**Explanation:** Lazy loading via faults.

### Q03  ·  Easy
**Question:** The MMU’s job is to:

- **A.** Translate virtual addresses and enforce protection
- **B.** Format directories
- **C.** Run Banker
- **D.** Schedule the CPU quantum

**Answer:** A
**Explanation:** Memory management unit.

### Q04  ·  Easy
**Question:** Which option best describes **Contiguous allocation**?

- **A.** Paging with scattered frames.
- **B.** TLB-only mapping.
- **C.** Segmentation without bases.
- **D.** A process occupies one contiguous chunk of physical memory (base+limit or partitions).

**Answer:** D
**Explanation:** Contiguous allocation: A process occupies one contiguous chunk of physical memory (base+limit or partitions).

### Q05  ·  Easy
**Question:** Which option best describes **Demand paging**?

- **A.** Disable the valid bit forever.
- **B.** Bring a page into a frame only when it is first used (page fault), not all pages at load.
- **C.** Pre-page the whole library set mandatorily.
- **D.** Load every page of the executable at exec time always.

**Answer:** B
**Explanation:** Demand paging: Bring a page into a frame only when it is first used (page fault), not all pages at load.

### Q06  ·  Easy
**Question:** Which option best describes **LRU replacement**?

- **A.** Evict the page whose last use is farthest in the past.
- **B.** Evict a random page always.
- **C.** Evict the oldest loaded page ignoring uses.
- **D.** Evict the next page in the program counter.

**Answer:** A
**Explanation:** LRU replacement: Evict the page whose last use is farthest in the past.

### Q07  ·  Easy
**Question:** Which option best describes **MMU**?

- **A.** Hardware that translates virtual addresses to physical using tables (and TLB), enforcing protection.
- **B.** A Java compiler.
- **C.** The ready queue.
- **D.** The disk SCAN engine.

**Answer:** A
**Explanation:** MMU: Hardware that translates virtual addresses to physical using tables (and TLB), enforcing protection.

### Q08  ·  Easy
**Question:** Which option best describes **Paging**?

- **A.** Contiguous physical placement always.
- **B.** Variable-size segments only.
- **C.** Fixed-size pages mapped to frames; address = page number + offset.
- **D.** A file allocation method only.

**Answer:** C
**Explanation:** Paging: Fixed-size pages mapped to frames; address = page number + offset.

### Q09  ·  Easy
**Question:** Which option best describes **Working set**?

- **A.** The entire virtual address space.
- **B.** The set of pages referenced in the most recent Δ references (locality window).
- **C.** The disk queue.
- **D.** The TLB size only.

**Answer:** B
**Explanation:** Working set: The set of pages referenced in the most recent Δ references (locality window).

### Q10  ·  Easy
**Question:** Which sequence correctly describes **LRU on a reference**?

- **A.** evict the future-farthest page
- **B.** never update recency on a hit
- **C.** evict the first-loaded page ignoring uses
- **D.** if page in memory, update last-used time; else fault, evict the min last-used, load, set last-used now

**Answer:** D
**Explanation:** Correct sequence for LRU on a reference: if page in memory, update last-used time; else fault, evict the min last-used, load, set last-used now

### Q11  ·  Easy
**Question:** Which sequence correctly describes **address translation (paging + TLB)**?

- **A.** use offset as the frame number
- **B.** split VA into p,d → TLB lookup → on miss walk page table → form frame+d → access memory (then maybe cache)
- **C.** translate in the compiler only
- **D.** skip the TLB on every hit

**Answer:** B
**Explanation:** Correct sequence for address translation (paging + TLB): split VA into p,d → TLB lookup → on miss walk page table → form frame+d → access memory (then maybe cache)

### Q12  ·  Intermediate
**Question:** A process starts and immediately faults on the first instruction fetch. Demand paging is:

- **A.** Loading pages only when referenced; the first fetch is a fault
- **B.** Contiguous allocation
- **C.** A TLB hit by definition
- **D.** Illegal; all pages must be in RAM first

**Answer:** A
**Explanation:** Valid bit is clear until the page is brought in.

### Q13  ·  Intermediate
**Question:** CPU utilisation drops while the disk light stays on and the ready queue is short. Suspect:

- **A.** FCFS convoy on a long CPU job only
- **B.** A mutex deadlock among philosophers
- **C.** Bootstrap loop
- **D.** Thrashing (too much paging)

**Answer:** D
**Explanation:** Time is spent in the page-fault handler/disk, not user code.

### Q14  ·  Intermediate
**Question:** Internal fragmentation in paging is caused by:

- **A.** The last page of a process not being full
- **B.** Deadlock
- **C.** TLB size
- **D.** Holes between partitions

**Answer:** A
**Explanation:** Average about half a page wasted per process (roughly).

### Q15  ·  Intermediate
**Question:** TLB is flushed on every process switch (no ASIDs). Cost:

- **A.** Fewer page faults always
- **B.** Belady on LRU
- **C.** More TLB misses after each context switch
- **D.** No MMU walks ever

**Answer:** C
**Explanation:** Cold TLB; each translation misses until refilled.

### Q16  ·  Intermediate
**Question:** Thrashing is best reduced by:

- **A.** Giving processes enough frames for their working sets / lowering multiprogramming
- **B.** Disabling the TLB
- **C.** Using Optimal in production
- **D.** Switching to FCFS CPU always

**Answer:** A
**Explanation:** Fit working sets in RAM.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **FIFO** and **LRU**?

- **A.** FIFO is a stack algorithm.
- **B.** They always fault on the same references.
- **C.** FIFO uses load time; LRU uses last-reference time. LRU tracks locality better; FIFO may Belady.
- **D.** LRU uses a simple queue of load order.

**Answer:** C
**Explanation:** FIFO uses load time; LRU uses last-reference time. LRU tracks locality better; FIFO may Belady.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **demand paging** and **prepaging**?

- **A.** Prepaging never wastes I/O.
- **B.** They both require no valid-bit.
- **C.** Demand brings a page on fault; prepaging brings predicted extra pages to cut future faults.
- **D.** Demand paging loads the whole process first.

**Answer:** C
**Explanation:** Demand brings a page on fault; prepaging brings predicted extra pages to cut future faults.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **logical address** and **physical address**?

- **A.** The program issues physical addresses.
- **B.** The disk controller translates logical code addresses.
- **C.** The CPU produces logical addresses; RAM uses physical after MMU translation.
- **D.** They are always equal in paged systems.

**Answer:** C
**Explanation:** The CPU produces logical addresses; RAM uses physical after MMU translation.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **paging** and **contiguous allocation**?

- **A.** Paging maps pages to any free frames; contiguous needs one hole large enough.
- **B.** Contiguous never needs a base register.
- **C.** They both have only internal fragmentation.
- **D.** Paging cannot protect processes.

**Answer:** A
**Explanation:** Paging maps pages to any free frames; contiguous needs one hole large enough.

### Q21  ·  Intermediate
**Question:** Which option best describes **Belady’s anomaly**?

- **A.** LRU always faults more with more frames.
- **B.** More frames can cause more page faults for some algorithms (notably FIFO) on some strings.
- **C.** A deadlock cycle.
- **D.** Optimal exhibits it frequently.

**Answer:** B
**Explanation:** Belady’s anomaly: More frames can cause more page faults for some algorithms (notably FIFO) on some strings.

### Q22  ·  Intermediate
**Question:** Which option best describes **External fragmentation**?

- **A.** Free memory exists but is split into holes too small to satisfy a request.
- **B.** A TLB miss cost only.
- **C.** Internal unused space inside an allocated page/partition.
- **D.** A page-fault storm.

**Answer:** A
**Explanation:** External fragmentation: Free memory exists but is split into holes too small to satisfy a request.

### Q23  ·  Intermediate
**Question:** Which option best describes **FIFO replacement**?

- **A.** Evict the page used farthest in the future.
- **B.** Evict the page that was loaded earliest (queue order), ignoring recency of use.
- **C.** Never evict.
- **D.** Evict the least recently used page.

**Answer:** B
**Explanation:** FIFO replacement: Evict the page that was loaded earliest (queue order), ignoring recency of use.

### Q24  ·  Intermediate
**Question:** Which option best describes **Internal fragmentation**?

- **A.** A deadlock hole.
- **B.** Holes between processes.
- **C.** Wasted space inside the last page or a fixed partition because the process does not fill it.
- **D.** A disk rotational delay.

**Answer:** C
**Explanation:** Internal fragmentation: Wasted space inside the last page or a fixed partition because the process does not fill it.

### Q25  ·  Intermediate
**Question:** Which option best describes **Locality**?

- **A.** DMA only.
- **B.** Programs reference a small subset of pages for a while (temporal/spatial).
- **C.** Uniform random access to all pages always.
- **D.** Belady’s proof.

**Answer:** B
**Explanation:** Locality: Programs reference a small subset of pages for a while (temporal/spatial).

### Q26  ·  Intermediate
**Question:** Which option best describes **Logical address**?

- **A.** An address generated by the CPU (virtual); the program sees this space.
- **B.** A cylinder number.
- **C.** The RAM chip pin number.
- **D.** A syscall ID.

**Answer:** A
**Explanation:** Logical address: An address generated by the CPU (virtual); the program sees this space.

### Q27  ·  Intermediate
**Question:** Which option best describes **Optimal replacement**?

- **A.** Replace the page that will not be used for the longest time in the future (offline bound).
- **B.** Random replacement.
- **C.** The same as FIFO.
- **D.** The same as LRU always.

**Answer:** A
**Explanation:** Optimal replacement: Replace the page that will not be used for the longest time in the future (offline bound).

### Q28  ·  Intermediate
**Question:** Which option best describes **Page fault**?

- **A.** A disk SCAN reversal.
- **B.** A trap when the MMU sees an invalid/not-present page that the process legally used.
- **C.** A mutex wait.
- **D.** A scheduling quantum end.

**Answer:** B
**Explanation:** Page fault: A trap when the MMU sees an invalid/not-present page that the process legally used.

### Q29  ·  Intermediate
**Question:** Which option best describes **Page table**?

- **A.** The ready queue.
- **B.** Per-process map from page number to frame number plus bits (valid, dirty, protect).
- **C.** The interrupt vector.
- **D.** A SCAN list.

**Answer:** B
**Explanation:** Page table: Per-process map from page number to frame number plus bits (valid, dirty, protect).

### Q30  ·  Intermediate
**Question:** Which option best describes **Physical address**?

- **A.** An address seen by the memory hardware (RAM).
- **B.** A Java reference.
- **C.** A file offset only.
- **D.** The PID.

**Answer:** A
**Explanation:** Physical address: An address seen by the memory hardware (RAM).

### Q31  ·  Intermediate
**Question:** Which option best describes **TLB**?

- **A.** A cache of recent page-table translations to avoid a memory walk on every fetch.
- **B.** The PCB array.
- **C.** A disk cache of file blocks.
- **D.** A semaphore.

**Answer:** A
**Explanation:** TLB: A cache of recent page-table translations to avoid a memory walk on every fetch.

### Q32  ·  Intermediate
**Question:** Which option best describes **Thrashing**?

- **A.** High CPU utilisation with no faults.
- **B.** A convoy on FCFS CPU only.
- **C.** A mutex deadlock.
- **D.** High page-fault rate such that the CPU is busy paging, not doing useful work.

**Answer:** D
**Explanation:** Thrashing: High page-fault rate such that the CPU is busy paging, not doing useful work.

### Q33  ·  Intermediate
**Question:** Which replacement is a stack algorithm (no Belady)?

- **A.** Random (not guaranteed)
- **B.** FIFO
- **C.** LRU
- **D.** Second chance is FIFO-like

**Answer:** C
**Explanation:** LRU’s set of pages in n frames is nested as n grows.

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **page-fault handling**?

- **A.** trap → check legal VA → find frame (maybe replace) → schedule disk I/O → update table/valid bit → restart instruction
- **B.** kill every faulting process always
- **C.** handle in user mode without the OS
- **D.** ignore the valid bit

**Answer:** A
**Explanation:** Correct sequence for page-fault handling: trap → check legal VA → find frame (maybe replace) → schedule disk I/O → update table/valid bit → restart instruction

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **thrashing control (working set)**?

- **A.** add more processes when faulting
- **B.** shrink Δ to 1 for all
- **C.** disable the MMU
- **D.** track WS(Δ) → allocate that many frames → if sum WS > RAM, reduce multiprogramming (swap a process out)

**Answer:** D
**Explanation:** Correct sequence for thrashing control (working set): track WS(Δ) → allocate that many frames → if sum WS > RAM, reduce multiprogramming (swap a process out)

### Q36  ·  Intermediate
**Question:** Which statement about **Belady’s anomaly** is FALSE?

- **A.** Belady’s anomaly is correctly understood as: more frames can cause more page faults for some algorithms (notably FIFO) on some strings.
- **B.** A useful way to remember Belady’s anomaly is that it is not the same as “LRU always faults more with more frames”.
- **C.** In this module, Belady’s anomaly is a core idea students must distinguish from nearby terms.
- **D.** Stack algorithms such as LRU exhibit Belady’s anomaly.

**Answer:** D
**Explanation:** The false claim is: Stack algorithms such as LRU exhibit Belady’s anomaly.. Belady’s anomaly actually means: More frames can cause more page faults for some algorithms (notably FIFO) on some strings.

### Q37  ·  Intermediate
**Question:** Which statement about **External fragmentation** is FALSE?

- **A.** In this module, External fragmentation is a core idea students must distinguish from nearby terms.
- **B.** Compaction is useless against external fragmentation.
- **C.** External fragmentation is correctly understood as: free memory exists but is split into holes too small to satisfy a request.
- **D.** A useful way to remember External fragmentation is that it is not the same as “Internal unused space inside an allocated page/partition”.

**Answer:** B
**Explanation:** The false claim is: Compaction is useless against external fragmentation.. External fragmentation actually means: Free memory exists but is split into holes too small to satisfy a request.

### Q38  ·  Intermediate
**Question:** Which statement about **LRU replacement** is FALSE?

- **A.** A useful way to remember LRU replacement is that it is not the same as “Evict the oldest loaded page ignoring uses”.
- **B.** In this module, LRU replacement is a core idea students must distinguish from nearby terms.
- **C.** LRU replacement is correctly understood as: evict the page whose last use is farthest in the past.
- **D.** LRU evicts the page that will be used soonest in the future.

**Answer:** D
**Explanation:** The false claim is: LRU evicts the page that will be used soonest in the future.. LRU replacement actually means: Evict the page whose last use is farthest in the past.

### Q39  ·  Intermediate
**Question:** Which statement about **MMU** is FALSE?

- **A.** A useful way to remember MMU is that it is not the same as “The disk SCAN engine”.
- **B.** The MMU is a software library that user programs call to translate addresses without hardware.
- **C.** MMU is correctly understood as: hardware that translates virtual addresses to physical using tables (and TLB), enforcing protection.
- **D.** In this module, MMU is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The MMU is a software library that user programs call to translate addresses without hardware.. MMU actually means: Hardware that translates virtual addresses to physical using tables (and TLB), enforcing protection.

### Q40  ·  Intermediate
**Question:** Which statement about **Page fault** is FALSE?

- **A.** Page fault is correctly understood as: a trap when the MMU sees an invalid/not-present page that the process legally used.
- **B.** In this module, Page fault is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Page fault is that it is not the same as “A scheduling quantum end”.
- **D.** A page fault is handled entirely in user mode without the OS.

**Answer:** D
**Explanation:** The false claim is: A page fault is handled entirely in user mode without the OS.. Page fault actually means: A trap when the MMU sees an invalid/not-present page that the process legally used.

### Q41  ·  Intermediate
**Question:** Which statement about **Paging** is FALSE?

- **A.** Paging requires a process to occupy consecutive frames.
- **B.** Paging is correctly understood as: fixed-size pages mapped to frames; address = page number + offset.
- **C.** In this module, Paging is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Paging is that it is not the same as “Variable-size segments only”.

**Answer:** A
**Explanation:** The false claim is: Paging requires a process to occupy consecutive frames.. Paging actually means: Fixed-size pages mapped to frames; address = page number + offset.

### Q42  ·  Intermediate
**Question:** Which statement about **Physical address** is FALSE?

- **A.** In this module, Physical address is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Physical address is that it is not the same as “A Java reference”.
- **C.** Physical address is correctly understood as: an address seen by the memory hardware (RAM).
- **D.** The CPU issues physical addresses before the MMU in a virtual-memory machine.

**Answer:** D
**Explanation:** The false claim is: The CPU issues physical addresses before the MMU in a virtual-memory machine.. Physical address actually means: An address seen by the memory hardware (RAM).

### Q43  ·  Intermediate
**Question:** Which statement about **TLB** is FALSE?

- **A.** In this module, TLB is a core idea students must distinguish from nearby terms.
- **B.** A TLB miss is cheaper than a TLB hit because it skips translation.
- **C.** TLB is correctly understood as: a cache of recent page-table translations to avoid a memory walk on every fetch.
- **D.** A useful way to remember TLB is that it is not the same as “A disk cache of file blocks”.

**Answer:** B
**Explanation:** The false claim is: A TLB miss is cheaper than a TLB hit because it skips translation.. TLB actually means: A cache of recent page-table translations to avoid a memory walk on every fetch.

### Q44  ·  Intermediate
**Question:** Which statement about **Thrashing** is FALSE?

- **A.** A useful way to remember Thrashing is that it is not the same as “High CPU utilisation with no faults”.
- **B.** Thrashing is correctly understood as: high page-fault rate such that the CPU is busy paging, not doing useful work.
- **C.** In this module, Thrashing is a core idea students must distinguish from nearby terms.
- **D.** Thrashing is fixed by giving every process fewer frames.

**Answer:** D
**Explanation:** The false claim is: Thrashing is fixed by giving every process fewer frames.. Thrashing actually means: High page-fault rate such that the CPU is busy paging, not doing useful work.

### Q45  ·  Intermediate
**Question:** Working-set window Δ is tiny. Risk:

- **A.** Monitors deadlock
- **B.** Underestimating the locality set and faulting (possible thrash if frames are reclaimed too aggressively)
- **C.** Always zero faults
- **D.** FIFO Belady only

**Answer:** B
**Explanation:** Δ should cover the current locality.

### Q46  ·  Difficult
**Question:** 64 frames of 4 KB. Physical memory size?

- **A.** 256 KB
- **B.** 64 KB
- **C.** 4 MB
- **D.** 16 MB

**Answer:** A
**Explanation:** 64 × 4 KB = 256 KB.

### Q47  ·  Difficult
**Question:** A 3-level page table is used for a sparse 64-bit space because:

- **A.** Disk SCAN needs page tables
- **B.** It saves memory vs a giant 1-level table of all possible pages
- **C.** Optimal replacement needs three levels
- **D.** The TLB cannot cache 64-bit VAs

**Answer:** B
**Explanation:** Unused regions occupy no middle-level tables.

### Q48  ·  Difficult
**Question:** Adding RAM (more frames) makes FIFO fault more on a particular string. This is:

- **A.** Belady’s anomaly
- **B.** The convoy effect
- **C.** Thrashing
- **D.** A RAG cycle

**Answer:** A
**Explanation:** FIFO is not a stack algorithm.

### Q49  ·  Difficult
**Question:** Compiler loops over a 2-D array with the wrong index order, causing many faults. This hurts:

- **A.** Coffman mutex
- **B.** Spatial locality (and the working set size)
- **C.** Type-1 vs Type-2 hypervisors
- **D.** The interrupt vector

**Answer:** B
**Explanation:** Row vs column major access pattern.

### Q50  ·  Difficult
**Question:** Effective memory time with TLB: why is a miss often two (or more) memory accesses plus TLB?

- **A.** Must read the page table (or several levels) from RAM, then the operand
- **B.** The disk is read on every TLB miss
- **C.** The CPU retries bootstrap
- **D.** Banker walks the RAG

**Answer:** A
**Explanation:** EAT = h(c+m)+(1−h)(c+(L+1)m) for L levels.

### Q51  ·  Difficult
**Question:** FIFO on 1,2,3,4,1,2,5,1,2,3,4,5. Faults with 3 frames vs 4 frames?

- **A.** 9 and 10
- **B.** 10 and 9
- **C.** 9 and 9
- **D.** 12 and 8

**Answer:** A
**Explanation:** Belady: 3 frames → 9 faults; 4 frames → 10 faults.

### Q52  ·  Difficult
**Question:** Optimal replacement is used as a benchmark in a lecture, not in the kernel, because:

- **A.** Hardware forbids it
- **B.** It faults more than FIFO always
- **C.** It needs the future reference string
- **D.** It is the same as random

**Answer:** C
**Explanation:** The OS cannot see the future in general.

### Q53  ·  Difficult
**Question:** Page size 4 KB, 32-bit virtual addresses. Number of offset bits and number of pages?

- **A.** 12 bits, 2^20 pages
- **B.** 8 bits, 2^24 pages
- **C.** 10 bits, 2^22 pages
- **D.** 16 bits, 2^16 pages

**Answer:** A
**Explanation:** 4 KB=2^12; page number bits=20; 2^20 pages.

### Q54  ·  Difficult
**Question:** Reference 7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1 with 3 frames. FIFO page faults?

- **A.** 20
- **B.** 9
- **C.** 12
- **D.** 15

**Answer:** D
**Explanation:** Classic Galvin string: FIFO faults 15 times.

### Q55  ·  Difficult
**Question:** Same string and 3 frames. LRU page faults?

- **A.** 15
- **B.** 9
- **C.** 6
- **D.** 12

**Answer:** D
**Explanation:** LRU faults 12 times on that string.

### Q56  ·  Difficult
**Question:** Same string and 3 frames. Optimal page faults?

- **A.** 9
- **B.** 12
- **C.** 15
- **D.** 3

**Answer:** A
**Explanation:** Optimal (Belady’s MIN) faults 9 times.

### Q57  ·  Difficult
**Question:** TLB 20 ns, memory 100 ns, hit ratio 0.8, single-level page table. Effective access time?

- **A.** 120 ns
- **B.** 140 ns
- **C.** 200 ns
- **D.** 100 ns

**Answer:** B
**Explanation:** 0.8×(20+100)+0.2×(20+100+100)=96+44=140 ns.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **LRU** and **Optimal**?

- **A.** Optimal is online and cheaper than LRU.
- **B.** LRU never faults more than Optimal on the same string/frames (not always — Optimal is min).
- **C.** They are identical policies.
- **D.** LRU uses the past as a predictor; Optimal uses the future and is a lower bound on faults.

**Answer:** D
**Explanation:** LRU uses the past as a predictor; Optimal uses the future and is a lower bound on faults.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **TLB hit** and **page-table walk**?

- **A.** Hit uses the cached translation; miss walks memory (or more levels) then fills the TLB.
- **B.** Walks do not access memory.
- **C.** TLB is on the disk.
- **D.** A hit is slower.

**Answer:** A
**Explanation:** Hit uses the cached translation; miss walks memory (or more levels) then fills the TLB.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **external fragmentation** and **internal fragmentation**?

- **A.** Contiguous allocation only has internal.
- **B.** Paging only has external fragmentation.
- **C.** External: unusable holes between blocks. Internal: unused space inside an allocated piece.
- **D.** They are the same word.

**Answer:** C
**Explanation:** External: unusable holes between blocks. Internal: unused space inside an allocated piece.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **working-set model** and **thrashing**?

- **A.** Thrashing means working sets fit easily.
- **B.** They are disk algorithms.
- **C.** Working-set sizing keeps locality resident; if the sum of working sets exceeds RAM, thrashing starts.
- **D.** Working set ignores Δ.

**Answer:** C
**Explanation:** Working-set sizing keeps locality resident; if the sum of working sets exceeds RAM, thrashing starts.

### Q62  ·  Difficult
**Question:** Which statement about **Contiguous allocation** is FALSE?

- **A.** A useful way to remember Contiguous allocation is that it is not the same as “Paging with scattered frames”.
- **B.** Contiguous allocation is correctly understood as: a process occupies one contiguous chunk of physical memory (base+limit or partitions).
- **C.** Contiguous allocation never suffers external fragmentation.
- **D.** In this module, Contiguous allocation is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Contiguous allocation never suffers external fragmentation.. Contiguous allocation actually means: A process occupies one contiguous chunk of physical memory (base+limit or partitions).

### Q63  ·  Difficult
**Question:** Which statement about **Demand paging** is FALSE?

- **A.** In this module, Demand paging is a core idea students must distinguish from nearby terms.
- **B.** Demand paging is correctly understood as: bring a page into a frame only when it is first used (page fault), not all pages at load.
- **C.** Demand paging means all pages are resident before main starts.
- **D.** A useful way to remember Demand paging is that it is not the same as “Load every page of the executable at exec time always”.

**Answer:** C
**Explanation:** The false claim is: Demand paging means all pages are resident before main starts.. Demand paging actually means: Bring a page into a frame only when it is first used (page fault), not all pages at load.

### Q64  ·  Difficult
**Question:** Which statement about **FIFO replacement** is FALSE?

- **A.** FIFO replacement is correctly understood as: evict the page that was loaded earliest (queue order), ignoring recency of use.
- **B.** In this module, FIFO replacement is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember FIFO replacement is that it is not the same as “Evict the least recently used page”.
- **D.** FIFO is a stack algorithm and cannot show Belady’s anomaly.

**Answer:** D
**Explanation:** The false claim is: FIFO is a stack algorithm and cannot show Belady’s anomaly.. FIFO replacement actually means: Evict the page that was loaded earliest (queue order), ignoring recency of use.

### Q65  ·  Difficult
**Question:** Which statement about **Internal fragmentation** is FALSE?

- **A.** A useful way to remember Internal fragmentation is that it is not the same as “Holes between processes”.
- **B.** Paging has no internal fragmentation by definition.
- **C.** In this module, Internal fragmentation is a core idea students must distinguish from nearby terms.
- **D.** Internal fragmentation is correctly understood as: wasted space inside the last page or a fixed partition because the process does not fill it.

**Answer:** B
**Explanation:** The false claim is: Paging has no internal fragmentation by definition.. Internal fragmentation actually means: Wasted space inside the last page or a fixed partition because the process does not fill it.

### Q66  ·  Difficult
**Question:** Which statement about **Locality** is FALSE?

- **A.** Locality is correctly understood as: programs reference a small subset of pages for a while (temporal/spatial).
- **B.** Without locality, demand paging would still have a 0% miss rate with tiny RAM.
- **C.** In this module, Locality is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Locality is that it is not the same as “Uniform random access to all pages always”.

**Answer:** B
**Explanation:** The false claim is: Without locality, demand paging would still have a 0% miss rate with tiny RAM.. Locality actually means: Programs reference a small subset of pages for a while (temporal/spatial).

### Q67  ·  Difficult
**Question:** Which statement about **Logical address** is FALSE?

- **A.** Logical addresses are the same as physical addresses in a paged system with an MMU always.
- **B.** In this module, Logical address is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Logical address is that it is not the same as “The RAM chip pin number”.
- **D.** Logical address is correctly understood as: an address generated by the CPU (virtual); the program sees this space.

**Answer:** A
**Explanation:** The false claim is: Logical addresses are the same as physical addresses in a paged system with an MMU always.. Logical address actually means: An address generated by the CPU (virtual); the program sees this space.

### Q68  ·  Difficult
**Question:** Which statement about **Optimal replacement** is FALSE?

- **A.** Optimal replacement is correctly understood as: replace the page that will not be used for the longest time in the future (offline bound).
- **B.** Optimal can be implemented in a real OS because the future reference string is known.
- **C.** In this module, Optimal replacement is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Optimal replacement is that it is not the same as “The same as FIFO”.

**Answer:** B
**Explanation:** The false claim is: Optimal can be implemented in a real OS because the future reference string is known.. Optimal replacement actually means: Replace the page that will not be used for the longest time in the future (offline bound).

### Q69  ·  Difficult
**Question:** Which statement about **Page table** is FALSE?

- **A.** The page table is stored in the TLB only and never in memory.
- **B.** A useful way to remember Page table is that it is not the same as “The interrupt vector”.
- **C.** Page table is correctly understood as: per-process map from page number to frame number plus bits (valid, dirty, protect).
- **D.** In this module, Page table is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: The page table is stored in the TLB only and never in memory.. Page table actually means: Per-process map from page number to frame number plus bits (valid, dirty, protect).

### Q70  ·  Difficult
**Question:** Which statement about **Working set** is FALSE?

- **A.** In this module, Working set is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Working set is that it is not the same as “The entire virtual address space”.
- **C.** Working set is correctly understood as: the set of pages referenced in the most recent Δ references (locality window).
- **D.** The working set is a fixed 4 pages for every process by OS law.

**Answer:** D
**Explanation:** The false claim is: The working set is a fixed 4 pages for every process by OS law.. Working set actually means: The set of pages referenced in the most recent Δ references (locality window).

### Q71  ·  Difficult
**Question:** Why is true LRU expensive in a simple OS?

- **A.** It needs a timestamp/stack update on every memory reference
- **B.** It requires the future string
- **C.** Pages cannot have dirty bits
- **D.** It cannot be approximated

**Answer:** A
**Explanation:** Hardware reference bits + clock/second-chance approximate LRU.

---

## Quick answer key

Q01–A | Q02–B | Q03–A | Q04–D | Q05–B | Q06–A | Q07–A | Q08–C | Q09–B | Q10–D | Q11–B | Q12–A | Q13–D | Q14–A | Q15–C | Q16–A | Q17–C | Q18–C | Q19–C | Q20–A | Q21–B | Q22–A | Q23–B | Q24–C | Q25–B | Q26–A | Q27–A | Q28–B | Q29–B | Q30–A | Q31–A | Q32–D | Q33–C | Q34–A | Q35–D | Q36–D | Q37–B | Q38–D | Q39–B | Q40–D | Q41–A | Q42–D | Q43–B | Q44–D | Q45–B | Q46–A | Q47–B | Q48–A | Q49–B | Q50–A | Q51–A | Q52–C | Q53–A | Q54–D | Q55–D | Q56–A | Q57–B | Q58–D | Q59–A | Q60–C | Q61–C | Q62–C | Q63–C | Q64–D | Q65–B | Q66–B | Q67–A | Q68–B | Q69–A | Q70–D | Q71–A
