# Quiz — Operating Systems — Module 2: The Battle for the CPU

**Subject:** Operating Systems  
**Module:** Module 2 — The Battle for the CPU  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** FCFS is:

- **A.** Non-preemptive (runs the CPU burst to completion once selected)
- **B.** Preemptive every 1 ms by definition
- **C.** The same as SRTF
- **D.** A page algorithm

**Answer:** A
**Explanation:** No timer preemption in classic FCFS CPU scheduling.

### Q02  ·  Easy
**Question:** The PCB is used to:

- **A.** Save process state across switches and scheduling
- **B.** Hold Java bytecode only
- **C.** Replace the interrupt vector
- **D.** Store the file allocation table of the disk

**Answer:** A
**Explanation:** PCB is the kernel’s per-process record.

### Q03  ·  Easy
**Question:** Which option best describes **Device queue**?

- **A.** The runqueue of RUNNABLE threads.
- **B.** The page table.
- **C.** The interrupt vector.
- **D.** The queue of processes waiting for a particular I/O device.

**Answer:** D
**Explanation:** Device queue: The queue of processes waiting for a particular I/O device.

### Q04  ·  Easy
**Question:** Which option best describes **IPC**?

- **A.** Bootstrap firmware.
- **B.** A CPU scheduling quantum.
- **C.** Mechanisms for processes to exchange data and synchronise (shared memory, message passing).
- **D.** A page-replacement policy.

**Answer:** C
**Explanation:** IPC: Mechanisms for processes to exchange data and synchronise (shared memory, message passing).

### Q05  ·  Easy
**Question:** Which option best describes **MLFQ**?

- **A.** A single FCFS queue.
- **B.** Multilevel feedback queue: processes move between queues based on behaviour (often CPU vs I/O).
- **C.** Priority without feedback.
- **D.** SJF with exact future knowledge only.

**Answer:** B
**Explanation:** MLFQ: Multilevel feedback queue: processes move between queues based on behaviour (often CPU vs I/O).

### Q06  ·  Easy
**Question:** Which option best describes **Process**?

- **A.** A program in execution: code, data, heap, stack, registers and OS bookkeeping.
- **B.** A Java interface.
- **C.** A disk block.
- **D.** A stored .exe file on disk only.

**Answer:** A
**Explanation:** Process: A program in execution: code, data, heap, stack, registers and OS bookkeeping.

### Q07  ·  Easy
**Question:** Which option best describes **SRTF**?

- **A.** Preemptive SJF: if a new burst is shorter than the remaining time, preempt.
- **B.** Priority on user IDs.
- **C.** Non-preemptive FCFS.
- **D.** Multilevel without preemption.

**Answer:** A
**Explanation:** SRTF: Preemptive SJF: if a new burst is shorter than the remaining time, preempt.

### Q08  ·  Easy
**Question:** Which option best describes **Thread**?

- **A.** A process that cannot share code.
- **B.** A unit of CPU scheduling within a process, sharing the address space with sibling threads.
- **C.** A disk scheduler.
- **D.** A separate address space by definition.

**Answer:** B
**Explanation:** Thread: A unit of CPU scheduling within a process, sharing the address space with sibling threads.

### Q09  ·  Easy
**Question:** Which policy is designed specifically for time sharing?

- **A.** Non-preemptive SJF
- **B.** Round robin
- **C.** SCAN
- **D.** FCFS

**Answer:** B
**Explanation:** RR uses a quantum to share the CPU.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **RR tick**?

- **A.** preempt into the device queue
- **B.** start bootstrap
- **C.** always finish the whole burst ignoring q
- **D.** run until quantum expires or burst ends → if still ready, append to ready queue → dispatch head

**Answer:** D
**Explanation:** Correct sequence for RR tick: run until quantum expires or burst ends → if still ready, append to ready queue → dispatch head

### Q11  ·  Easy
**Question:** Which sequence correctly describes **process state transitions (CPU/I/O)**?

- **A.** wait → running without becoming ready
- **B.** new → ready → running → (timer) ready, or running → wait (I/O) → ready, or running → terminated
- **C.** new → wait for CPU without ready
- **D.** terminated → ready automatically

**Answer:** B
**Explanation:** Correct sequence for process state transitions (CPU/I/O): new → ready → running → (timer) ready, or running → wait (I/O) → ready, or running → terminated

### Q12  ·  Intermediate
**Question:** A 1-hour CPU job arrives just before many 1-second jobs under FCFS. Students complain of delay. Name the effect:

- **A.** Convoy effect
- **B.** Priority inversion only
- **C.** Thrashing
- **D.** Belady’s anomaly

**Answer:** A
**Explanation:** Short jobs wait behind a long non-preemptive job.

### Q13  ·  Intermediate
**Question:** A new job with burst 2 ms arrives while a 20 ms job has 15 ms left, under SRTF. The scheduler should:

- **A.** Ignore it until the 20 ms job finishes
- **B.** Put it on a device queue
- **C.** Boost the long job’s priority
- **D.** Preempt and run the 2 ms job

**Answer:** D
**Explanation:** Remaining 15 > 2, so preempt.

### Q14  ·  Intermediate
**Question:** A very small RR quantum causes:

- **A.** Zero overhead
- **B.** FCFS behaviour
- **C.** More context switches and lower efficiency
- **D.** SJF behaviour

**Answer:** C
**Explanation:** Overhead dominates when q approaches switch cost.

### Q15  ·  Intermediate
**Question:** Context-switch time is 2 ms and the RR quantum is 2 ms. This policy is a poor idea because:

- **A.** SJF forbids timers
- **B.** Too much time is wasted switching relative to useful work
- **C.** RR cannot preempt
- **D.** FCFS would switch more often

**Answer:** B
**Explanation:** Utilisation ≈ q/(q+cs) = 50% even before other overhead.

### Q16  ·  Intermediate
**Question:** Producer and consumer on a multicore box need high throughput of large buffers. IPC choice after setup:

- **A.** Copying every byte via messages only
- **B.** FCFS disk SCAN
- **C.** Shared memory (plus sync)
- **D.** Busy bootstrap

**Answer:** C
**Explanation:** Shared memory avoids kernel copies on the data path.

### Q17  ·  Intermediate
**Question:** SJF is optimal among non-preemptive policies for average waiting time if:

- **A.** Next burst lengths are known (or well predicted)
- **B.** I/O never occurs
- **C.** The quantum is 1
- **D.** All jobs are the same length

**Answer:** A
**Explanation:** Shortest next burst first minimises mean wait.

### Q18  ·  Intermediate
**Question:** Threads of the same process typically do NOT share:

- **A.** Their private stacks and registers
- **B.** Open file tables of the process (usually)
- **C.** Code (text) pages
- **D.** The heap and global data

**Answer:** A
**Explanation:** Each thread has its own stack and register set.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **SJF** and **SRTF**?

- **A.** SJF waits for the current process to finish; SRTF preempts when a shorter job arrives.
- **B.** SJF always preempts.
- **C.** They produce the same Gantt chart whenever arrivals overlap.
- **D.** SRTF is non-preemptive.

**Answer:** A
**Explanation:** SJF waits for the current process to finish; SRTF preempts when a shorter job arrives.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **context switch** and **mode switch**?

- **A.** They are always the same cost.
- **B.** A mode switch always changes CR3/page tables.
- **C.** Mode switch (syscall/interrupt) may stay in the same process; context switch changes the running process/thread.
- **D.** Context switch never saves registers.

**Answer:** C
**Explanation:** Mode switch (syscall/interrupt) may stay in the same process; context switch changes the running process/thread.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **process** and **thread**?

- **A.** Processes cannot have more than one thread.
- **B.** Context switch of threads always switches page tables.
- **C.** A process has its own address space; threads of a process share code/data/heap but have separate stacks/PCs.
- **D.** Threads never share memory.

**Answer:** C
**Explanation:** A process has its own address space; threads of a process share code/data/heap but have separate stacks/PCs.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **shared memory** and **message passing**?

- **A.** Shared memory cannot share pages.
- **B.** They are the same IPC primitive.
- **C.** Shared memory is fast after setup but needs sync; message passing is easier isolation, more copying.
- **D.** Message passing needs no kernel.

**Answer:** C
**Explanation:** Shared memory is fast after setup but needs sync; message passing is easier isolation, more copying.

### Q23  ·  Intermediate
**Question:** Which option best describes **CPU burst**?

- **A.** The bootstrap time.
- **B.** A stretch of CPU execution between I/O waits; scheduling uses burst estimates.
- **C.** The size of a file.
- **D.** A page-fault count.

**Answer:** B
**Explanation:** CPU burst: A stretch of CPU execution between I/O waits; scheduling uses burst estimates.

### Q24  ·  Intermediate
**Question:** Which option best describes **Context switch**?

- **A.** Saving one process’s CPU state and restoring another’s so the CPU can resume it later.
- **B.** A system-call number.
- **C.** Copying a file between disks.
- **D.** Compiling the kernel.

**Answer:** A
**Explanation:** Context switch: Saving one process’s CPU state and restoring another’s so the CPU can resume it later.

### Q25  ·  Intermediate
**Question:** Which option best describes **Convoy effect**?

- **A.** An advantage of SJF over nothing.
- **B.** A disk-head algorithm.
- **C.** A deadlock condition.
- **D.** Short processes stuck behind a long CPU-bound process under FCFS, inflating average wait.

**Answer:** D
**Explanation:** Convoy effect: Short processes stuck behind a long CPU-bound process under FCFS, inflating average wait.

### Q26  ·  Intermediate
**Question:** Which option best describes **Degree of multiprogramming**?

- **A.** The disk RPM.
- **B.** The number of CPU cores only.
- **C.** The number of processes in memory (competing for the CPU).
- **D.** The quantum in ms.

**Answer:** C
**Explanation:** Degree of multiprogramming: The number of processes in memory (competing for the CPU).

### Q27  ·  Intermediate
**Question:** Which option best describes **FCFS**?

- **A.** Preempting every quantum.
- **B.** First-come, first-served non-preemptive scheduling by arrival/queue order.
- **C.** Priority inversion by default.
- **D.** Always running the shortest job next.

**Answer:** B
**Explanation:** FCFS: First-come, first-served non-preemptive scheduling by arrival/queue order.

### Q28  ·  Intermediate
**Question:** Which option best describes **Message passing**?

- **A.** IPC via send/receive through the kernel (pipes, sockets, message queues).
- **B.** A context-switch optimisation only.
- **C.** Direct loads/stores to a shared page with no kernel on the path.
- **D.** The ready-queue discipline.

**Answer:** A
**Explanation:** Message passing: IPC via send/receive through the kernel (pipes, sockets, message queues).

### Q29  ·  Intermediate
**Question:** Which option best describes **PCB**?

- **A.** Process control block: PID, state, PC, registers, scheduling/memory/I/O info.
- **B.** A Java bytecode cache.
- **C.** The user password file.
- **D.** The boot sector.

**Answer:** A
**Explanation:** PCB: Process control block: PID, state, PC, registers, scheduling/memory/I/O info.

### Q30  ·  Intermediate
**Question:** Which option best describes **Priority scheduling**?

- **A.** Select the highest-priority ready process; may be preemptive or not; starvation risk.
- **B.** Random lottery only.
- **C.** Always FCFS regardless of priority numbers.
- **D.** Disk SCAN.

**Answer:** A
**Explanation:** Priority scheduling: Select the highest-priority ready process; may be preemptive or not; starvation risk.

### Q31  ·  Intermediate
**Question:** Which option best describes **Ready queue**?

- **A.** The queue of processes (or threads) waiting to be assigned a CPU.
- **B.** The queue of processes waiting for disk only.
- **C.** The job pool on disk only.
- **D.** A network socket backlog.

**Answer:** A
**Explanation:** Ready queue: The queue of processes (or threads) waiting to be assigned a CPU.

### Q32  ·  Intermediate
**Question:** Which option best describes **Round robin**?

- **A.** Non-preemptive SJF.
- **B.** Time-sharing: each ready process gets a time quantum, then is preempted to the tail.
- **C.** Priority without a quantum.
- **D.** FCFS with no timer.

**Answer:** B
**Explanation:** Round robin: Time-sharing: each ready process gets a time quantum, then is preempted to the tail.

### Q33  ·  Intermediate
**Question:** Which option best describes **SJF**?

- **A.** Round-robin with q=∞ only.
- **B.** Shortest-job-first: pick the waiting process with smallest next CPU burst (non-preemptive).
- **C.** Priority with aging only.
- **D.** Always FCFS among equal bursts only, ignoring length.

**Answer:** B
**Explanation:** SJF: Shortest-job-first: pick the waiting process with smallest next CPU burst (non-preemptive).

### Q34  ·  Intermediate
**Question:** Which option best describes **Shared memory**?

- **A.** A pipe that cannot share pages.
- **B.** IPC where processes map a common region and read/write it (needs synchronisation).
- **C.** Copying every byte through the kernel as a message.
- **D.** DMA to a printer only.

**Answer:** B
**Explanation:** Shared memory: IPC where processes map a common region and read/write it (needs synchronisation).

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **context switch**?

- **A.** timer/OS event → save PCB of old → pick next → restore PCB (regs, memory maps) → resume
- **B.** overwrite PCB without saving
- **C.** only switch mode bits, never registers
- **D.** copy the entire disk into RAM

**Answer:** A
**Explanation:** Correct sequence for context switch: timer/OS event → save PCB of old → pick next → restore PCB (regs, memory maps) → resume

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **fork-like creation (Unix teaching model)**?

- **A.** replace the caller’s image first (that is exec)
- **B.** no new PCB
- **C.** child starts in kernel mode forever
- **D.** syscall → duplicate PCB/address space (COW later) → child ready → both may run

**Answer:** D
**Explanation:** Correct sequence for fork-like creation (Unix teaching model): syscall → duplicate PCB/address space (COW later) → child ready → both may run

### Q37  ·  Intermediate
**Question:** Which statement about **Context switch** is FALSE?

- **A.** In this module, Context switch is a core idea students must distinguish from nearby terms.
- **B.** A context switch does not save registers because they are shared permanently.
- **C.** Context switch is correctly understood as: saving one process’s CPU state and restoring another’s so the CPU can resume it later.
- **D.** A useful way to remember Context switch is that it is not the same as “Copying a file between disks”.

**Answer:** B
**Explanation:** The false claim is: A context switch does not save registers because they are shared permanently.. Context switch actually means: Saving one process’s CPU state and restoring another’s so the CPU can resume it later.

### Q38  ·  Intermediate
**Question:** Which statement about **Convoy effect** is FALSE?

- **A.** A useful way to remember Convoy effect is that it is not the same as “An advantage of SJF over nothing”.
- **B.** Convoy effect is correctly understood as: short processes stuck behind a long CPU-bound process under FCFS, inflating average wait.
- **C.** In this module, Convoy effect is a core idea students must distinguish from nearby terms.
- **D.** The convoy effect makes FCFS faster than SJF for mixed long/short jobs.

**Answer:** D
**Explanation:** The false claim is: The convoy effect makes FCFS faster than SJF for mixed long/short jobs.. Convoy effect actually means: Short processes stuck behind a long CPU-bound process under FCFS, inflating average wait.

### Q39  ·  Intermediate
**Question:** Which statement about **FCFS** is FALSE?

- **A.** FCFS is correctly understood as: first-come, first-served non-preemptive scheduling by arrival/queue order.
- **B.** In this module, FCFS is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember FCFS is that it is not the same as “Always running the shortest job next”.
- **D.** FCFS is preemptive and uses a time quantum.

**Answer:** D
**Explanation:** The false claim is: FCFS is preemptive and uses a time quantum.. FCFS actually means: First-come, first-served non-preemptive scheduling by arrival/queue order.

### Q40  ·  Intermediate
**Question:** Which statement about **IPC** is FALSE?

- **A.** IPC is illegal between user processes on a dual-mode machine.
- **B.** IPC is correctly understood as: mechanisms for processes to exchange data and synchronise (shared memory, message passing).
- **C.** In this module, IPC is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember IPC is that it is not the same as “A CPU scheduling quantum”.

**Answer:** A
**Explanation:** The false claim is: IPC is illegal between user processes on a dual-mode machine.. IPC actually means: Mechanisms for processes to exchange data and synchronise (shared memory, message passing).

### Q41  ·  Intermediate
**Question:** Which statement about **Message passing** is FALSE?

- **A.** In this module, Message passing is a core idea students must distinguish from nearby terms.
- **B.** Message passing never involves the kernel.
- **C.** Message passing is correctly understood as: iPC via send/receive through the kernel (pipes, sockets, message queues).
- **D.** A useful way to remember Message passing is that it is not the same as “Direct loads/stores to a shared page with no kernel on the path”.

**Answer:** B
**Explanation:** The false claim is: Message passing never involves the kernel.. Message passing actually means: IPC via send/receive through the kernel (pipes, sockets, message queues).

### Q42  ·  Intermediate
**Question:** Which statement about **Process** is FALSE?

- **A.** A useful way to remember Process is that it is not the same as “A stored .exe file on disk only”.
- **B.** A process is identical to a program file and has no state while running.
- **C.** Process is correctly understood as: a program in execution: code, data, heap, stack, registers and OS bookkeeping.
- **D.** In this module, Process is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A process is identical to a program file and has no state while running.. Process actually means: A program in execution: code, data, heap, stack, registers and OS bookkeeping.

### Q43  ·  Intermediate
**Question:** Which statement about **Ready queue** is FALSE?

- **A.** In this module, Ready queue is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Ready queue is that it is not the same as “The queue of processes waiting for disk only”.
- **C.** Ready queue is correctly understood as: the queue of processes (or threads) waiting to be assigned a CPU.
- **D.** The ready queue holds processes that are blocked on I/O.

**Answer:** D
**Explanation:** The false claim is: The ready queue holds processes that are blocked on I/O.. Ready queue actually means: The queue of processes (or threads) waiting to be assigned a CPU.

### Q44  ·  Intermediate
**Question:** Which statement about **Round robin** is FALSE?

- **A.** Round robin is correctly understood as: time-sharing: each ready process gets a time quantum, then is preempted to the tail.
- **B.** A useful way to remember Round robin is that it is not the same as “Non-preemptive SJF”.
- **C.** In this module, Round robin is a core idea students must distinguish from nearby terms.
- **D.** RR with a very large quantum behaves like SJF, not like FCFS.

**Answer:** D
**Explanation:** The false claim is: RR with a very large quantum behaves like SJF, not like FCFS.. Round robin actually means: Time-sharing: each ready process gets a time quantum, then is preempted to the tail.

### Q45  ·  Intermediate
**Question:** Which statement about **SRTF** is FALSE?

- **A.** A useful way to remember SRTF is that it is not the same as “Non-preemptive FCFS”.
- **B.** In this module, SRTF is a core idea students must distinguish from nearby terms.
- **C.** SRTF is correctly understood as: preemptive SJF: if a new burst is shorter than the remaining time, preempt.
- **D.** SRTF never preempts a running process.

**Answer:** D
**Explanation:** The false claim is: SRTF never preempts a running process.. SRTF actually means: Preemptive SJF: if a new burst is shorter than the remaining time, preempt.

### Q46  ·  Difficult
**Question:** A process issues a disk read and cannot continue. It leaves the CPU and sits on:

- **A.** The bootloader
- **B.** The disk’s wait/device queue (blocked)
- **C.** The interrupt vector
- **D.** The ready queue as RUNNING

**Answer:** B
**Explanation:** Blocked processes are not ready.

### Q47  ·  Difficult
**Question:** Aging is added to priority scheduling in order to:

- **A.** Prevent starvation of low-priority processes
- **B.** Implement FCFS exactly
- **C.** Disable preemption
- **D.** Increase convoy effect

**Answer:** A
**Explanation:** Priority rises with waiting time.

### Q48  ·  Difficult
**Question:** I/O-bound jobs that use the CPU briefly then wait should, in an MLFQ, typically:

- **A.** Disable the timer
- **B.** Fall forever to the lowest CPU queue and starve interactivity
- **C.** Stay at or return to a higher-priority interactive queue
- **D.** Never be scheduled

**Answer:** C
**Explanation:** Feedback boosts or retains interactive behaviour.

### Q49  ·  Difficult
**Question:** Interactive editor vs CPU compile farm on one core. Best simple preemptive policy for responsiveness?

- **A.** Round robin with a modest quantum
- **B.** Non-preemptive SJF only
- **C.** FCFS
- **D.** Always run the longest job

**Answer:** A
**Explanation:** RR gives the editor regular slices.

### Q50  ·  Difficult
**Question:** Jobs: bursts 10, 5, 8 ms, all t=0, RR quantum 2 ms (order P1,P2,P3). Average waiting time?

- **A.** 12 ms
- **B.** 15 ms
- **C.** 8 ms
- **D.** 5 ms

**Answer:** A
**Explanation:** Finish 23, 15, 21; waits 13, 10, 13; average 36/3 = 12 ms.

### Q51  ·  Difficult
**Question:** P1: arr 0 burst 8; P2: 1/4; P3: 2/9; P4: 3/5. Non-preemptive SJF average wait?

- **A.** 4 ms
- **B.** 7.75 ms
- **C.** 10 ms
- **D.** 6.5 ms

**Answer:** B
**Explanation:** P1 runs 0–8 (only ready). Then P2, P4, P3. Waits 0, 7, 15, 9; avg 31/4 = 7.75 ms.

### Q52  ·  Difficult
**Question:** RR quantum → ∞. The discipline becomes equivalent to:

- **A.** FCFS (among jobs that never block)
- **B.** SRTF
- **C.** SJF
- **D.** MLFQ

**Answer:** A
**Explanation:** No preemption before burst end, queue order preserved: FCFS.

### Q53  ·  Difficult
**Question:** Same four jobs, SRTF. Average waiting time?

- **A.** 6.5 ms
- **B.** 0 ms
- **C.** 7.75 ms
- **D.** 8 ms

**Answer:** A
**Explanation:** P1 preempted at 1 by P2; then P4; then P1; then P3. Waits 9, 0, 15, 2; avg 26/4 = 6.5 ms.

### Q54  ·  Difficult
**Question:** Same three jobs, RR with quantum 4 ms, arrival 0, FCFS ready-queue order. Waiting time of the 24 ms job?

- **A.** 6 ms
- **B.** 4 ms
- **C.** 0 ms
- **D.** 24 ms

**Answer:** A
**Explanation:** It runs 4 ms, then the two shorts finish (3+3), then it resumes; wait = 6 ms. Completes at 30; 30−24=6.

### Q55  ·  Difficult
**Question:** Same three jobs, non-preemptive SJF. Average waiting time?

- **A.** 17 ms
- **B.** 0 ms
- **C.** 10 ms
- **D.** 3 ms

**Answer:** D
**Explanation:** Order 3, 3, 24: waits 0, 3, 6; average 9/3 = 3 ms.

### Q56  ·  Difficult
**Question:** Three jobs arrive at t=0 with bursts 24, 3, 3 ms. FCFS (that order). Average waiting time?

- **A.** 8 ms
- **B.** 3 ms
- **C.** 24 ms
- **D.** 17 ms

**Answer:** D
**Explanation:** Waits 0, 24, 27; average 51/3 = 17 ms.

### Q57  ·  Difficult
**Question:** Two threads of a browser share cookies in memory. They are:

- **A.** DMA engines
- **B.** Threads of one process sharing an address space
- **C.** Kernel mode bits
- **D.** Two processes with separate page tables and no shared heap by default

**Answer:** B
**Explanation:** Threads share the process heap/globals.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **FCFS** and **SJF**?

- **A.** FCFS minimises average wait.
- **B.** SJF is always preemptive.
- **C.** FCFS uses arrival order; SJF uses shortest next burst and cuts average wait (convoy risk in FCFS).
- **D.** They are identical if bursts differ.

**Answer:** C
**Explanation:** FCFS uses arrival order; SJF uses shortest next burst and cuts average wait (convoy risk in FCFS).

### Q59  ·  Difficult
**Question:** What is the most important distinction between **RR** and **FCFS**?

- **A.** RR preempts on a quantum; FCFS runs until the burst ends. Large q makes RR ≈ FCFS.
- **B.** FCFS uses a quantum.
- **C.** Small q makes RR identical to SJF.
- **D.** RR is non-preemptive.

**Answer:** A
**Explanation:** RR preempts on a quantum; FCFS runs until the burst ends. Large q makes RR ≈ FCFS.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **priority** and **RR**?

- **A.** RR always starves new arrivals.
- **B.** Aging is required in RR but not in priority schemes.
- **C.** Priority picks by importance (starvation possible); RR shares time fairly among a queue.
- **D.** Priority cannot be preemptive.

**Answer:** C
**Explanation:** Priority picks by importance (starvation possible); RR shares time fairly among a queue.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **ready queue** and **wait/device queue**?

- **A.** Ready queues hold sleeping I/O waiters.
- **B.** Device queues hold the running process.
- **C.** There is only one queue in an OS.
- **D.** Ready: runnable, waiting for CPU. Wait: blocked for an event/device.

**Answer:** D
**Explanation:** Ready: runnable, waiting for CPU. Wait: blocked for an event/device.

### Q62  ·  Difficult
**Question:** Which statement about **CPU burst** is FALSE?

- **A.** CPU burst is correctly understood as: a stretch of CPU execution between I/O waits; scheduling uses burst estimates.
- **B.** CPU burst length is the same as I/O burst length by definition.
- **C.** In this module, CPU burst is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember CPU burst is that it is not the same as “The size of a file”.

**Answer:** B
**Explanation:** The false claim is: CPU burst length is the same as I/O burst length by definition.. CPU burst actually means: A stretch of CPU execution between I/O waits; scheduling uses burst estimates.

### Q63  ·  Difficult
**Question:** Which statement about **Degree of multiprogramming** is FALSE?

- **A.** A useful way to remember Degree of multiprogramming is that it is not the same as “The number of CPU cores only”.
- **B.** Degree of multiprogramming is the size of a single process’s stack.
- **C.** In this module, Degree of multiprogramming is a core idea students must distinguish from nearby terms.
- **D.** Degree of multiprogramming is correctly understood as: the number of processes in memory (competing for the CPU).

**Answer:** B
**Explanation:** The false claim is: Degree of multiprogramming is the size of a single process’s stack.. Degree of multiprogramming actually means: The number of processes in memory (competing for the CPU).

### Q64  ·  Difficult
**Question:** Which statement about **Device queue** is FALSE?

- **A.** A useful way to remember Device queue is that it is not the same as “The runqueue of RUNNABLE threads”.
- **B.** Device queue is correctly understood as: the queue of processes waiting for a particular I/O device.
- **C.** Device queues hold only READY processes.
- **D.** In this module, Device queue is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Device queues hold only READY processes.. Device queue actually means: The queue of processes waiting for a particular I/O device.

### Q65  ·  Difficult
**Question:** Which statement about **MLFQ** is FALSE?

- **A.** In this module, MLFQ is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MLFQ is that it is not the same as “A single FCFS queue”.
- **C.** MLFQ is correctly understood as: multilevel feedback queue: processes move between queues based on behaviour (often CPU vs I/O).
- **D.** MLFQ uses one queue and never moves a process.

**Answer:** D
**Explanation:** The false claim is: MLFQ uses one queue and never moves a process.. MLFQ actually means: Multilevel feedback queue: processes move between queues based on behaviour (often CPU vs I/O).

### Q66  ·  Difficult
**Question:** Which statement about **PCB** is FALSE?

- **A.** The PCB stores the contents of the entire disk image of the program.
- **B.** In this module, PCB is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember PCB is that it is not the same as “The user password file”.
- **D.** PCB is correctly understood as: process control block: PID, state, PC, registers, scheduling/memory/I/O info.

**Answer:** A
**Explanation:** The false claim is: The PCB stores the contents of the entire disk image of the program.. PCB actually means: Process control block: PID, state, PC, registers, scheduling/memory/I/O info.

### Q67  ·  Difficult
**Question:** Which statement about **Priority scheduling** is FALSE?

- **A.** Priority scheduling is correctly understood as: select the highest-priority ready process; may be preemptive or not; starvation risk.
- **B.** Priority scheduling cannot starve a low-priority process even without aging.
- **C.** In this module, Priority scheduling is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Priority scheduling is that it is not the same as “Always FCFS regardless of priority numbers”.

**Answer:** B
**Explanation:** The false claim is: Priority scheduling cannot starve a low-priority process even without aging.. Priority scheduling actually means: Select the highest-priority ready process; may be preemptive or not; starvation risk.

### Q68  ·  Difficult
**Question:** Which statement about **SJF** is FALSE?

- **A.** SJF is correctly understood as: shortest-job-first: pick the waiting process with smallest next CPU burst (non-preemptive).
- **B.** In this module, SJF is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember SJF is that it is not the same as “Always FCFS among equal bursts only, ignoring length”.
- **D.** SJF cannot minimise average waiting time among non-preemptive length-based policies.

**Answer:** D
**Explanation:** The false claim is: SJF cannot minimise average waiting time among non-preemptive length-based policies.. SJF actually means: Shortest-job-first: pick the waiting process with smallest next CPU burst (non-preemptive).

### Q69  ·  Difficult
**Question:** Which statement about **Shared memory** is FALSE?

- **A.** Shared memory requires a kernel copy of every read and write.
- **B.** A useful way to remember Shared memory is that it is not the same as “Copying every byte through the kernel as a message”.
- **C.** Shared memory is correctly understood as: iPC where processes map a common region and read/write it (needs synchronisation).
- **D.** In this module, Shared memory is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Shared memory requires a kernel copy of every read and write.. Shared memory actually means: IPC where processes map a common region and read/write it (needs synchronisation).

### Q70  ·  Difficult
**Question:** Which statement about **Thread** is FALSE?

- **A.** In this module, Thread is a core idea students must distinguish from nearby terms.
- **B.** Thread is correctly understood as: a unit of CPU scheduling within a process, sharing the address space with sibling threads.
- **C.** Threads of one process never share global variables.
- **D.** A useful way to remember Thread is that it is not the same as “A separate address space by definition”.

**Answer:** C
**Explanation:** The false claim is: Threads of one process never share global variables.. Thread actually means: A unit of CPU scheduling within a process, sharing the address space with sibling threads.

### Q71  ·  Difficult
**Question:** Why is true SJF hard to implement on a general-purpose OS?

- **A.** The next CPU burst is not known; it must be predicted (e.g. exponential average)
- **B.** Timers do not exist
- **C.** PCBs cannot store priorities
- **D.** Processes cannot wait on I/O

**Answer:** A
**Explanation:** τ_{n+1} = α t_n + (1−α) τ_n is the usual estimator.

---

## Quick answer key

Q01–A | Q02–A | Q03–D | Q04–C | Q05–B | Q06–A | Q07–A | Q08–B | Q09–B | Q10–D | Q11–B | Q12–A | Q13–D | Q14–C | Q15–B | Q16–C | Q17–A | Q18–A | Q19–A | Q20–C | Q21–C | Q22–C | Q23–B | Q24–A | Q25–D | Q26–C | Q27–B | Q28–A | Q29–A | Q30–A | Q31–A | Q32–B | Q33–B | Q34–B | Q35–A | Q36–D | Q37–B | Q38–D | Q39–D | Q40–A | Q41–B | Q42–B | Q43–D | Q44–D | Q45–D | Q46–B | Q47–A | Q48–C | Q49–A | Q50–A | Q51–B | Q52–A | Q53–A | Q54–A | Q55–D | Q56–D | Q57–B | Q58–C | Q59–A | Q60–C | Q61–D | Q62–B | Q63–B | Q64–C | Q65–D | Q66–A | Q67–B | Q68–D | Q69–A | Q70–C | Q71–A
