# Quiz — Operating Systems — Module 3: When Processes Collide

**Subject:** Operating Systems  
**Module:** Module 3 — When Processes Collide  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A race condition occurs when:

- **A.** Concurrent updates of shared data are not serialised
- **B.** Disk SCAN reverses
- **C.** The timer fires
- **D.** A process finishes

**Answer:** A
**Explanation:** Interleaving breaks intended atomicity.

### Q02  ·  Easy
**Question:** The bounded-buffer problem involves:

- **A.** Only disk LOOK
- **B.** Producers and consumers sharing a finite queue
- **C.** Bootstrap
- **D.** Only CPU scheduling

**Answer:** B
**Explanation:** Classic semaphore showcase.

### Q03  ·  Easy
**Question:** Which option best describes **Counting semaphore**?

- **A.** A binary lock only.
- **B.** A semaphore that can range over a range of integers, e.g. to count resource instances or buffer slots.
- **C.** A page frame.
- **D.** A mutex that is always 0.

**Answer:** B
**Explanation:** Counting semaphore: A semaphore that can range over a range of integers, e.g. to count resource instances or buffer slots.

### Q04  ·  Easy
**Question:** Which option best describes **Deadlock**?

- **A.** A priority inversion that always resolves.
- **B.** A set of processes each waiting for a resource held by another in the set, so none can proceed.
- **C.** A context switch.
- **D.** A page fault.

**Answer:** B
**Explanation:** Deadlock: A set of processes each waiting for a resource held by another in the set, so none can proceed.

### Q05  ·  Easy
**Question:** Which option best describes **Mutex lock**?

- **A.** A page table.
- **B.** A scheduling queue discipline.
- **C.** A kernel/user lock with acquire/release providing mutual exclusion (busy-wait or blocking).
- **D.** An interrupt vector.

**Answer:** C
**Explanation:** Mutex lock: A kernel/user lock with acquire/release providing mutual exclusion (busy-wait or blocking).

### Q06  ·  Easy
**Question:** Which option best describes **Progress (CS problem)**?

- **A.** Everyone must enter in PID order.
- **B.** A disk SCAN property.
- **C.** A deadlock-free Banker only.
- **D.** If no process is in the CS and some want in, selection cannot be postponed indefinitely by processes in remainder.

**Answer:** D
**Explanation:** Progress (CS problem): If no process is in the CS and some want in, selection cannot be postponed indefinitely by processes in remainder.

### Q07  ·  Easy
**Question:** Which option best describes **Race condition**?

- **A.** Outcome depends on the unpredictable interleaving of concurrent accesses to shared data.
- **B.** A page-fault rate.
- **C.** A bootstrap failure.
- **D.** A disk scheduling anomaly.

**Answer:** A
**Explanation:** Race condition: Outcome depends on the unpredictable interleaving of concurrent accesses to shared data.

### Q08  ·  Easy
**Question:** Which option best describes **Readers–writers**?

- **A.** A sync problem: many readers or one writer; writers need exclusive access to the shared object.
- **B.** SJF among readers only.
- **C.** A disk SCAN variant.
- **D.** A bootstrap lock.

**Answer:** A
**Explanation:** Readers–writers: A sync problem: many readers or one writer; writers need exclusive access to the shared object.

### Q09  ·  Easy
**Question:** Which sequence correctly describes **bounded-buffer produce**?

- **A.** insert without mutex
- **B.** signal(empty) after insert
- **C.** wait(full) first as a producer
- **D.** wait(empty) → wait(mutex) → insert → signal(mutex) → signal(full)

**Answer:** D
**Explanation:** Correct sequence for bounded-buffer produce: wait(empty) → wait(mutex) → insert → signal(mutex) → signal(full)

### Q10  ·  Easy
**Question:** Which sequence correctly describes **entering a critical section with a mutex**?

- **A.** CS → then acquire
- **B.** acquire lock → CS → release lock
- **C.** busy-wait on a non-atomic flag without a protocol
- **D.** release then acquire then CS forever without pairing

**Answer:** B
**Explanation:** Correct sequence for entering a critical section with a mutex: acquire lock → CS → release lock

### Q11  ·  Easy
**Question:** wait(S) on a semaphore S when S is 0 typically:

- **A.** Blocks the caller until a signal
- **B.** Busy-returns immediately with S=1
- **C.** Creates a new process
- **D.** Runs Banker

**Answer:** A
**Explanation:** P/wait decrements or waits if the count would go negative.

### Q12  ·  Intermediate
**Question:** Banker’s algorithm is classified as:

- **A.** Detection and recovery only
- **B.** Deadlock prevention by denying mutex
- **C.** Deadlock avoidance
- **D.** Page replacement

**Answer:** C
**Explanation:** It avoids unsafe states using Max/Need.

### Q13  ·  Intermediate
**Question:** Many reader threads and rare writers; writers wait a long time. Likely cause:

- **A.** SCAN disk idle
- **B.** Reader-preference lock starving writers
- **C.** Banker safe sequence
- **D.** FCFS CPU convoy only

**Answer:** B
**Explanation:** Arriving readers keep the read count non-zero.

### Q14  ·  Intermediate
**Question:** OS uses Banker and a process asks for more than its declared Max. The OS should:

- **A.** Grant it if Available allows, skipping safety
- **B.** Convert it to RR
- **C.** Reject the request as exceeding Need
- **D.** Kill the disk scheduler

**Answer:** C
**Explanation:** Need = Max − Allocation; request must be ≤ Need.

### Q15  ·  Intermediate
**Question:** Producer does wait(full) then wait(mutex) while consumer does wait(mutex) then wait(empty) — a common bug. Risk:

- **A.** Faster throughput
- **B.** Priority inversion only
- **C.** A safe Banker state
- **D.** Deadlock (wrong semaphore order / using full when intending empty)

**Answer:** D
**Explanation:** Each may hold mutex while waiting for the other condition.

### Q16  ·  Intermediate
**Question:** Test-and-set is used to:

- **A.** Implement a spinlock acquire atomically
- **B.** Allocate cylinders
- **C.** Parse ELF
- **D.** Replace the PCB

**Answer:** A
**Explanation:** Atomic TSL/CAS closes the race on the lock flag.

### Q17  ·  Intermediate
**Question:** Two threads do count++ on a shared int without a lock. Sometimes the total is short. This is:

- **A.** A race on a non-atomic read-modify-write
- **B.** A convoy on FCFS disk
- **C.** Belady’s anomaly
- **D.** A deadlock

**Answer:** A
**Explanation:** Lost updates from interleaved increment.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **deadlock** and **starvation**?

- **A.** Deadlock: circular wait, no progress. Starvation: some process waits indefinitely while others run.
- **B.** Deadlock is solved by RR.
- **C.** They are synonyms.
- **D.** Starvation always includes a cycle in the RAG.

**Answer:** A
**Explanation:** Deadlock: circular wait, no progress. Starvation: some process waits indefinitely while others run.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **mutex** and **binary semaphore**?

- **A.** A mutex value can be 5.
- **B.** Semaphores cannot implement a critical section.
- **C.** A mutex has an owner and typically must be unlocked by the locker; a binary semaphore is just 0/1 signalling.
- **D.** They are identical in POSIX always.

**Answer:** C
**Explanation:** A mutex has an owner and typically must be unlocked by the locker; a binary semaphore is just 0/1 signalling.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **readers–writers (readers preference)** and **writers preference**?

- **A.** Writers preference starves writers.
- **B.** Both allow a writer with active readers.
- **C.** Readers preference can starve writers; writers preference (or fair) avoids writer starvation.
- **D.** They are identical.

**Answer:** C
**Explanation:** Readers preference can starve writers; writers preference (or fair) avoids writer starvation.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **safe state** and **unsafe state**?

- **A.** Safe means all resources are free.
- **B.** Banker allows unsafe grants.
- **C.** Safe: there exists an order that satisfies every Max with current Available. Unsafe may lead to deadlock.
- **D.** Unsafe means deadlock already exists.

**Answer:** C
**Explanation:** Safe: there exists an order that satisfies every Max with current Available. Unsafe may lead to deadlock.

### Q22  ·  Intermediate
**Question:** Which is NOT a Coffman condition?

- **A.** Preemption of resources is allowed (the opposite of ‘no preemption’)
- **B.** Circular wait
- **C.** Hold and wait
- **D.** Mutual exclusion

**Answer:** A
**Explanation:** No preemption is the Coffman condition; allowing preemption helps prevention.

### Q23  ·  Intermediate
**Question:** Which option best describes **Banker’s algorithm**?

- **A.** A Type-1 hypervisor.
- **B.** A deadlock-avoidance method that grants a request only if the resulting state is safe.
- **C.** A page-replacement stack algorithm.
- **D.** FCFS among bankers.

**Answer:** B
**Explanation:** Banker’s algorithm: A deadlock-avoidance method that grants a request only if the resulting state is safe.

### Q24  ·  Intermediate
**Question:** Which option best describes **Binary semaphore**?

- **A.** A semaphore whose value is only 0 or 1, usable as a mutex (without ownership semantics).
- **B.** A pipe.
- **C.** A counting semaphore with a large max.
- **D.** A thread priority.

**Answer:** A
**Explanation:** Binary semaphore: A semaphore whose value is only 0 or 1, usable as a mutex (without ownership semantics).

### Q25  ·  Intermediate
**Question:** Which option best describes **Bounded buffer**?

- **A.** A page table.
- **B.** A finite producer–consumer buffer; empty/full (and mutex) prevent overflow/underflow.
- **C.** FCFS scheduling.
- **D.** An infinite queue that never blocks the producer.

**Answer:** B
**Explanation:** Bounded buffer: A finite producer–consumer buffer; empty/full (and mutex) prevent overflow/underflow.

### Q26  ·  Intermediate
**Question:** Which option best describes **Bounded waiting**?

- **A.** A bound exists on how many others may enter the CS after you have requested it, before you do.
- **B.** A page-replacement rule.
- **C.** Infinite starvation is allowed.
- **D.** The same as CPU RR quantum.

**Answer:** A
**Explanation:** Bounded waiting: A bound exists on how many others may enter the CS after you have requested it, before you do.

### Q27  ·  Intermediate
**Question:** Which option best describes **Coffman conditions**?

- **A.** Three CPU-burst laws.
- **B.** Disk scheduling names.
- **C.** TLB axioms.
- **D.** Four necessary conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.

**Answer:** D
**Explanation:** Coffman conditions: Four necessary conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.

### Q28  ·  Intermediate
**Question:** Which option best describes **Critical section**?

- **A.** The code fragment that accesses shared data and must not be interleaved with another’s critical section.
- **B.** A system-call number.
- **C.** The entire process including I/O waits.
- **D.** The ready queue.

**Answer:** A
**Explanation:** Critical section: The code fragment that accesses shared data and must not be interleaved with another’s critical section.

### Q29  ·  Intermediate
**Question:** Which option best describes **Dining philosophers**?

- **A.** N philosophers need two forks; naive lock order can deadlock; solutions include a waiter or asymmetric grab.
- **B.** A file-directory tree.
- **C.** A CPU scheduling convoy.
- **D.** A page-replacement example.

**Answer:** A
**Explanation:** Dining philosophers: N philosophers need two forks; naive lock order can deadlock; solutions include a waiter or asymmetric grab.

### Q30  ·  Intermediate
**Question:** Which option best describes **Monitor**?

- **A.** A binary semaphore without procedures.
- **B.** A high-level module with condition variables where only one thread executes the monitor at a time.
- **C.** A disk head.
- **D.** A kernel thread.

**Answer:** B
**Explanation:** Monitor: A high-level module with condition variables where only one thread executes the monitor at a time.

### Q31  ·  Intermediate
**Question:** Which option best describes **Mutual exclusion**?

- **A.** At most one process is inside its critical section at a time.
- **B.** All processes must enter the critical section together.
- **C.** A scheduling quantum.
- **D.** A file allocation method.

**Answer:** A
**Explanation:** Mutual exclusion: At most one process is inside its critical section at a time.

### Q32  ·  Intermediate
**Question:** Which option best describes **Peterson’s algorithm**?

- **A.** A deadlock detection graph.
- **B.** A hardware test-and-set only.
- **C.** A two-process software mutex using a turn variable and a flag array, assuming atomic loads/stores of those words.
- **D.** A disk algorithm.

**Answer:** C
**Explanation:** Peterson’s algorithm: A two-process software mutex using a turn variable and a flag array, assuming atomic loads/stores of those words.

### Q33  ·  Intermediate
**Question:** Which option best describes **RAG**?

- **A.** A CPU Gantt chart.
- **B.** Resource-allocation graph of processes and resources; a cycle may mean deadlock (if instances=1, it does).
- **C.** The interrupt vector.
- **D.** A page table tree.

**Answer:** B
**Explanation:** RAG: Resource-allocation graph of processes and resources; a cycle may mean deadlock (if instances=1, it does).

### Q34  ·  Intermediate
**Question:** Which option best describes **Semaphore**?

- **A.** A file name.
- **B.** An integer with atomic wait(P)/signal(V) used for exclusion or signalling.
- **C.** A PCB field storing the program counter.
- **D.** A TLB entry.

**Answer:** B
**Explanation:** Semaphore: An integer with atomic wait(P)/signal(V) used for exclusion or signalling.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **Banker request**?

- **A.** if request ≤ Need and ≤ Available → pretend allocate → safety test → commit or rollback
- **B.** always allocate if request ≤ Max ignoring Available
- **C.** skip Need check
- **D.** grant unsafe states to raise utilisation

**Answer:** A
**Explanation:** Correct sequence for Banker request: if request ≤ Need and ≤ Available → pretend allocate → safety test → commit or rollback

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **deadlock detection (wait-for graph, single instance)**?

- **A.** find a safe sequence as in Banker grant
- **B.** run SCAN
- **C.** boost priorities randomly
- **D.** build wait-for graph from RAG → find a cycle → deadlock set

**Answer:** D
**Explanation:** Correct sequence for deadlock detection (wait-for graph, single instance): build wait-for graph from RAG → find a cycle → deadlock set

### Q37  ·  Intermediate
**Question:** Which statement about **Binary semaphore** is FALSE?

- **A.** In this module, Binary semaphore is a core idea students must distinguish from nearby terms.
- **B.** Binary semaphores can take the value 50.
- **C.** Binary semaphore is correctly understood as: a semaphore whose value is only 0 or 1, usable as a mutex (without ownership semantics).
- **D.** A useful way to remember Binary semaphore is that it is not the same as “A counting semaphore with a large max”.

**Answer:** B
**Explanation:** The false claim is: Binary semaphores can take the value 50.. Binary semaphore actually means: A semaphore whose value is only 0 or 1, usable as a mutex (without ownership semantics).

### Q38  ·  Intermediate
**Question:** Which statement about **Bounded waiting** is FALSE?

- **A.** In this module, Bounded waiting is a core idea students must distinguish from nearby terms.
- **B.** Bounded waiting is automatically true of any mutex that can starve a thread forever.
- **C.** Bounded waiting is correctly understood as: a bound exists on how many others may enter the CS after you have requested it, before you do.
- **D.** A useful way to remember Bounded waiting is that it is not the same as “Infinite starvation is allowed”.

**Answer:** B
**Explanation:** The false claim is: Bounded waiting is automatically true of any mutex that can starve a thread forever.. Bounded waiting actually means: A bound exists on how many others may enter the CS after you have requested it, before you do.

### Q39  ·  Intermediate
**Question:** Which statement about **Coffman conditions** is FALSE?

- **A.** A useful way to remember Coffman conditions is that it is not the same as “Three CPU-burst laws”.
- **B.** Coffman conditions is correctly understood as: four necessary conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.
- **C.** In this module, Coffman conditions is a core idea students must distinguish from nearby terms.
- **D.** Breaking any one Coffman condition cannot prevent deadlock.

**Answer:** D
**Explanation:** The false claim is: Breaking any one Coffman condition cannot prevent deadlock.. Coffman conditions actually means: Four necessary conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.

### Q40  ·  Intermediate
**Question:** Which statement about **Monitor** is FALSE?

- **A.** Monitor is correctly understood as: a high-level module with condition variables where only one thread executes the monitor at a time.
- **B.** In this module, Monitor is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Monitor is that it is not the same as “A kernel thread”.
- **D.** Monitors allow any number of threads to run the same monitor procedure concurrently by design.

**Answer:** D
**Explanation:** The false claim is: Monitors allow any number of threads to run the same monitor procedure concurrently by design.. Monitor actually means: A high-level module with condition variables where only one thread executes the monitor at a time.

### Q41  ·  Intermediate
**Question:** Which statement about **Mutex lock** is FALSE?

- **A.** A mutex may be released by any thread, like a semaphore used as a mutex without ownership, but classic mutexes have an owner.
- **B.** Mutex lock is correctly understood as: a kernel/user lock with acquire/release providing mutual exclusion (busy-wait or blocking).
- **C.** In this module, Mutex lock is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Mutex lock is that it is not the same as “A scheduling queue discipline”.

**Answer:** A
**Explanation:** The false claim is: A mutex may be released by any thread, like a semaphore used as a mutex without ownership, but classic mutexes have an owner.. Mutex lock actually means: A kernel/user lock with acquire/release providing mutual exclusion (busy-wait or blocking).

### Q42  ·  Intermediate
**Question:** Which statement about **Mutual exclusion** is FALSE?

- **A.** In this module, Mutual exclusion is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Mutual exclusion is that it is not the same as “All processes must enter the critical section together”.
- **C.** Mutual exclusion is correctly understood as: at most one process is inside its critical section at a time.
- **D.** Mutual exclusion is satisfied by a plain load/store of a shared counter with no lock on a multicore.

**Answer:** D
**Explanation:** The false claim is: Mutual exclusion is satisfied by a plain load/store of a shared counter with no lock on a multicore.. Mutual exclusion actually means: At most one process is inside its critical section at a time.

### Q43  ·  Intermediate
**Question:** Which statement about **RAG** is FALSE?

- **A.** RAG is correctly understood as: resource-allocation graph of processes and resources; a cycle may mean deadlock (if instances=1, it does).
- **B.** A useful way to remember RAG is that it is not the same as “A CPU Gantt chart”.
- **C.** In this module, RAG is a core idea students must distinguish from nearby terms.
- **D.** A cycle in a single-instance RAG is never a deadlock.

**Answer:** D
**Explanation:** The false claim is: A cycle in a single-instance RAG is never a deadlock.. RAG actually means: Resource-allocation graph of processes and resources; a cycle may mean deadlock (if instances=1, it does).

### Q44  ·  Intermediate
**Question:** Which statement about **Race condition** is FALSE?

- **A.** A useful way to remember Race condition is that it is not the same as “A disk scheduling anomaly”.
- **B.** Race conditions cannot occur if two threads share a variable but the CPU has two cores.
- **C.** Race condition is correctly understood as: outcome depends on the unpredictable interleaving of concurrent accesses to shared data.
- **D.** In this module, Race condition is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Race conditions cannot occur if two threads share a variable but the CPU has two cores.. Race condition actually means: Outcome depends on the unpredictable interleaving of concurrent accesses to shared data.

### Q45  ·  Intermediate
**Question:** Which statement about **Readers–writers** is FALSE?

- **A.** A useful way to remember Readers–writers is that it is not the same as “A disk SCAN variant”.
- **B.** In this module, Readers–writers is a core idea students must distinguish from nearby terms.
- **C.** Readers–writers is correctly understood as: a sync problem: many readers or one writer; writers need exclusive access to the shared object.
- **D.** Readers–writers allows a writer to proceed while readers still hold the data.

**Answer:** D
**Explanation:** The false claim is: Readers–writers allows a writer to proceed while readers still hold the data.. Readers–writers actually means: A sync problem: many readers or one writer; writers need exclusive access to the shared object.

### Q46  ·  Difficult
**Question:** A monitor Wait() is called inside the monitor. The caller:

- **A.** Runs Banker
- **B.** Busy-waits while still holding the monitor, blocking everyone
- **C.** Releases the monitor lock and waits on the condition variable
- **D.** Exits the process

**Answer:** C
**Explanation:** Condition wait must drop exclusion so a Signaller can enter.

### Q47  ·  Difficult
**Question:** A ‘safe state’ means:

- **A.** There exists a sequence of processes that can finish with the current Available plus what finishers release
- **B.** No process holds any resource
- **C.** The system is already deadlocked
- **D.** A cycle exists

**Answer:** A
**Explanation:** Safety ≠ currently deadlock-free in all futures, but a guaranteed finishing order exists.

### Q48  ·  Difficult
**Question:** Banker: Available=(3,3,2). P1 Need=(1,2,2). Can P1’s request (1,0,2) pass the Need and Available tests?

- **A.** Only if P1 is last
- **B.** No, exceeds Need
- **C.** No, exceeds Available
- **D.** Yes, (1,0,2)≤Need and ≤Available

**Answer:** D
**Explanation:** Need is 1,2,2 so 1,0,2 fits; Available 3,3,2 also fits. Safety is a further check (it is safe in the classic example).

### Q49  ·  Difficult
**Question:** Binary semaphore S=1, then wait, wait by two processes without a signal. S ends at:

- **A.** 0 then the second wait blocks (conceptually S would be −1 if counting)
- **B.** 2
- **C.** 1
- **D.** 3

**Answer:** A
**Explanation:** First wait: S=0. Second wait blocks. Counting implementation stores a negative or a wait list.

### Q50  ·  Difficult
**Question:** Bounded buffer size 5, mutex+empty+full. Initial empty, full?

- **A.** both 5
- **B.** empty=5, full=0
- **C.** both 0
- **D.** empty=0, full=5

**Answer:** B
**Explanation:** 5 free slots, 0 filled items.

### Q51  ·  Difficult
**Question:** Classic Banker snapshot (Galvin): five processes, three resource types. After the safety check, a possible safe sequence starts with:

- **A.** P2 then P0
- **B.** P0 then P2
- **C.** P4 then P2 only
- **D.** P1 then P3

**Answer:** D
**Explanation:** Need of P1 is (1,2,2)≤(3,3,2); then P3’s (0,1,1) fits. Classic safe sequence P1,P3,P4,P0,P2.

### Q52  ·  Difficult
**Question:** Five philosophers pick left fork then wait for right. They can:

- **A.** Only starve without deadlock
- **B.** Deadlock (circular wait on forks)
- **C.** Avoid Coffman mutual exclusion
- **D.** Always eat immediately

**Answer:** B
**Explanation:** All hold one fork and wait for the other.

### Q53  ·  Difficult
**Question:** Four Coffman conditions. To prevent deadlock by resource ordering you break:

- **A.** Circular wait
- **B.** No preemption
- **C.** Mutual exclusion
- **D.** Hold-and-wait only by numbering, not circular wait

**Answer:** A
**Explanation:** A global order on resource types prevents circular wait.

### Q54  ·  Difficult
**Question:** If Available becomes (0,0,0) and every process still has positive Need, the state is:

- **A.** Not currently able to run anyone; if no release path exists it is deadlock/unsafe
- **B.** A mutex
- **C.** Necessarily safe
- **D.** FCFS

**Answer:** A
**Explanation:** No process can acquire more resources; if they still need more, none can finish.

### Q55  ·  Difficult
**Question:** Peterson’s two processes both want the CS. The algorithm uses flag[i] and turn to ensure:

- **A.** Mutual exclusion, progress and bounded waiting (under its memory model assumptions)
- **B.** Only FIFO disk order
- **C.** Deadlock by design
- **D.** Starvation of both forever

**Answer:** A
**Explanation:** Classic software solution for n=2.

### Q56  ·  Difficult
**Question:** RAG: single-instance resources, a cycle P1→R1→P2→R2→P1. Conclusion:

- **A.** Banker would still grant any request
- **B.** Deadlock exists
- **C.** Only starvation, not deadlock
- **D.** Safe sequence exists including both

**Answer:** B
**Explanation:** Cycle in single-instance RAG ⇔ deadlock.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **Peterson** and **test-and-set lock**?

- **A.** Peterson needs special CPU instructions beyond atomic word access.
- **B.** TSL cannot provide exclusion.
- **C.** They both need n flags for two processes only.
- **D.** Peterson is software for two processes; TSL/CAS is a hardware atomic for general spinlocks.

**Answer:** D
**Explanation:** Peterson is software for two processes; TSL/CAS is a hardware atomic for general spinlocks.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **RAG cycle (single instance)** and **RAG cycle (multiple instances)**?

- **A.** Multiple-instance cycle always deadlocks.
- **B.** RAG cannot show deadlock.
- **C.** Single-instance cycle ⇔ deadlock. Multiple instances: a cycle is necessary but not sufficient.
- **D.** Single-instance cycle never deadlocks.

**Answer:** C
**Explanation:** Single-instance cycle ⇔ deadlock. Multiple instances: a cycle is necessary but not sufficient.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **deadlock prevention** and **deadlock avoidance**?

- **A.** Prevention breaks a Coffman condition a priori; avoidance uses extra info (Banker) to stay in safe states.
- **B.** Prevention is Banker only.
- **C.** They both require a wait-for cycle to be present first.
- **D.** Avoidance ignores Need/Max.

**Answer:** A
**Explanation:** Prevention breaks a Coffman condition a priori; avoidance uses extra info (Banker) to stay in safe states.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **semaphore** and **monitor**?

- **A.** Semaphores include built-in Hoare semantics always.
- **B.** Monitors cannot wait for conditions.
- **C.** Semaphores are low-level integers; monitors package exclusion + condition waits with compiler/runtime support.
- **D.** They cannot express bounded buffer.

**Answer:** C
**Explanation:** Semaphores are low-level integers; monitors package exclusion + condition waits with compiler/runtime support.

### Q61  ·  Difficult
**Question:** Which statement about **Banker’s algorithm** is FALSE?

- **A.** Banker’s algorithm is correctly understood as: a deadlock-avoidance method that grants a request only if the resulting state is safe.
- **B.** Banker grants every request that is less than Need even if the state would be unsafe.
- **C.** In this module, Banker’s algorithm is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Banker’s algorithm is that it is not the same as “A page-replacement stack algorithm”.

**Answer:** B
**Explanation:** The false claim is: Banker grants every request that is less than Need even if the state would be unsafe.. Banker’s algorithm actually means: A deadlock-avoidance method that grants a request only if the resulting state is safe.

### Q62  ·  Difficult
**Question:** Which statement about **Bounded buffer** is FALSE?

- **A.** Bounded buffer is correctly understood as: a finite producer–consumer buffer; empty/full (and mutex) prevent overflow/underflow.
- **B.** In this module, Bounded buffer is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Bounded buffer is that it is not the same as “An infinite queue that never blocks the producer”.
- **D.** Producers may always write even when the buffer has zero free slots if they skip wait(empty).

**Answer:** D
**Explanation:** The false claim is: Producers may always write even when the buffer has zero free slots if they skip wait(empty).. Bounded buffer actually means: A finite producer–consumer buffer; empty/full (and mutex) prevent overflow/underflow.

### Q63  ·  Difficult
**Question:** Which statement about **Counting semaphore** is FALSE?

- **A.** In this module, Counting semaphore is a core idea students must distinguish from nearby terms.
- **B.** Counting semaphore is correctly understood as: a semaphore that can range over a range of integers, e.g. to count resource instances or buffer slots.
- **C.** Counting semaphores cannot represent three identical printers.
- **D.** A useful way to remember Counting semaphore is that it is not the same as “A mutex that is always 0”.

**Answer:** C
**Explanation:** The false claim is: Counting semaphores cannot represent three identical printers.. Counting semaphore actually means: A semaphore that can range over a range of integers, e.g. to count resource instances or buffer slots.

### Q64  ·  Difficult
**Question:** Which statement about **Critical section** is FALSE?

- **A.** The critical section may be executed by two processes at once if they use different CPUs.
- **B.** In this module, Critical section is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Critical section is that it is not the same as “The entire process including I/O waits”.
- **D.** Critical section is correctly understood as: the code fragment that accesses shared data and must not be interleaved with another’s critical section.

**Answer:** A
**Explanation:** The false claim is: The critical section may be executed by two processes at once if they use different CPUs.. Critical section actually means: The code fragment that accesses shared data and must not be interleaved with another’s critical section.

### Q65  ·  Difficult
**Question:** Which statement about **Deadlock** is FALSE?

- **A.** In this module, Deadlock is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Deadlock is that it is not the same as “A priority inversion that always resolves”.
- **C.** Deadlock is correctly understood as: a set of processes each waiting for a resource held by another in the set, so none can proceed.
- **D.** Deadlock is the same as starvation: every starved process is deadlocked.

**Answer:** D
**Explanation:** The false claim is: Deadlock is the same as starvation: every starved process is deadlocked.. Deadlock actually means: A set of processes each waiting for a resource held by another in the set, so none can proceed.

### Q66  ·  Difficult
**Question:** Which statement about **Dining philosophers** is FALSE?

- **A.** Dining philosophers is correctly understood as: n philosophers need two forks; naive lock order can deadlock; solutions include a waiter or asymmetric grab.
- **B.** Dining philosophers is solved by taking both forks non-atomically with no extra protocol.
- **C.** In this module, Dining philosophers is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Dining philosophers is that it is not the same as “A CPU scheduling convoy”.

**Answer:** B
**Explanation:** The false claim is: Dining philosophers is solved by taking both forks non-atomically with no extra protocol.. Dining philosophers actually means: N philosophers need two forks; naive lock order can deadlock; solutions include a waiter or asymmetric grab.

### Q67  ·  Difficult
**Question:** Which statement about **Peterson’s algorithm** is FALSE?

- **A.** A useful way to remember Peterson’s algorithm is that it is not the same as “A hardware test-and-set only”.
- **B.** Peterson’s algorithm needs n processes and cannot work for two.
- **C.** In this module, Peterson’s algorithm is a core idea students must distinguish from nearby terms.
- **D.** Peterson’s algorithm is correctly understood as: a two-process software mutex using a turn variable and a flag array, assuming atomic loads/stores of those words.

**Answer:** B
**Explanation:** The false claim is: Peterson’s algorithm needs n processes and cannot work for two.. Peterson’s algorithm actually means: A two-process software mutex using a turn variable and a flag array, assuming atomic loads/stores of those words.

### Q68  ·  Difficult
**Question:** Which statement about **Progress (CS problem)** is FALSE?

- **A.** A useful way to remember Progress (CS problem) is that it is not the same as “Everyone must enter in PID order”.
- **B.** Progress (CS problem) is correctly understood as: if no process is in the CS and some want in, selection cannot be postponed indefinitely by processes in remainder.
- **C.** Progress allows the remainder section of a process that does not want the CS to block those who do.
- **D.** In this module, Progress (CS problem) is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Progress allows the remainder section of a process that does not want the CS to block those who do.. Progress (CS problem) actually means: If no process is in the CS and some want in, selection cannot be postponed indefinitely by processes in remainder.

### Q69  ·  Difficult
**Question:** Which statement about **Semaphore** is FALSE?

- **A.** Semaphore wait is a non-atomic read of an int in user space with no kernel.
- **B.** A useful way to remember Semaphore is that it is not the same as “A PCB field storing the program counter”.
- **C.** Semaphore is correctly understood as: an integer with atomic wait(P)/signal(V) used for exclusion or signalling.
- **D.** In this module, Semaphore is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Semaphore wait is a non-atomic read of an int in user space with no kernel.. Semaphore actually means: An integer with atomic wait(P)/signal(V) used for exclusion or signalling.

### Q70  ·  Difficult
**Question:** Why does a cycle in a multiple-instance RAG not prove deadlock?

- **A.** A process might still finish using resources it already holds if instances remain substitutable — the cycle is necessary not sufficient
- **B.** Cycles never occur with multiple instances
- **C.** Banker forbids graphs
- **D.** RAG cannot have processes as nodes

**Answer:** A
**Explanation:** Need the reduction/safety algorithm, not just cycle detection.

### Q71  ·  Difficult
**Question:** n philosophers, each needs 2 forks, n forks. Maximum who can eat at once (no sharing a fork)?

- **A.** floor(n/2)
- **B.** n
- **C.** n−1 always eating
- **D.** 1 only

**Answer:** A
**Explanation:** Adjacent pair exclusive; at most floor(n/2) eat simultaneously.

---

## Quick answer key

Q01–A | Q02–B | Q03–B | Q04–B | Q05–C | Q06–D | Q07–A | Q08–A | Q09–D | Q10–B | Q11–A | Q12–C | Q13–B | Q14–C | Q15–D | Q16–A | Q17–A | Q18–A | Q19–C | Q20–C | Q21–C | Q22–A | Q23–B | Q24–A | Q25–B | Q26–A | Q27–D | Q28–A | Q29–A | Q30–B | Q31–A | Q32–C | Q33–B | Q34–B | Q35–A | Q36–D | Q37–B | Q38–B | Q39–D | Q40–D | Q41–A | Q42–D | Q43–D | Q44–B | Q45–D | Q46–C | Q47–A | Q48–D | Q49–A | Q50–B | Q51–D | Q52–B | Q53–A | Q54–A | Q55–A | Q56–B | Q57–D | Q58–C | Q59–A | Q60–C | Q61–B | Q62–D | Q63–C | Q64–A | Q65–D | Q66–B | Q67–B | Q68–C | Q69–A | Q70–A | Q71–A
