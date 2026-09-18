# Quiz — Parallel Computing — Module 4: Shared-Memory Programming with OpenMP

**Subject:** Parallel Computing  
**Module:** Module 4 — Shared-Memory Programming with OpenMP  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A team of 4 threads at a barrier waits for:

- **A.** The master only
- **B.** 3 of 4
- **C.** All 4
- **D.** Any 1

**Answer:** C
**Explanation:** Full team.

### Q02  ·  Easy
**Question:** OpenMP parallelism is specified mainly by:

- **A.** Pragmas (and a runtime library)
- **B.** CUDA grids only
- **C.** DFA products
- **D.** MPI derived types only

**Answer:** A
**Explanation:** Compiler directives.

### Q03  ·  Easy
**Question:** Which option best describes **OpenMP**?

- **A.** A CUDA kernel language.
- **B.** A pragma-based shared-memory API: compiler+runtime spawn threads on a node.
- **C.** An MPI process launcher for Ethernet.
- **D.** A DFA tool.

**Answer:** B
**Explanation:** OpenMP: A pragma-based shared-memory API: compiler+runtime spawn threads on a node.

### Q04  ·  Easy
**Question:** Which option best describes **Trapezoidal (OpenMP)**?

- **A.** Each thread writes the same global sum without protection.
- **B.** One thread per trapezoid on a cluster without shared memory.
- **C.** Parallelise the sum of trapezoids with a reduction on the accumulator.
- **D.** Use MPI_Reduce only.

**Answer:** C
**Explanation:** Trapezoidal (OpenMP): Parallelise the sum of trapezoids with a reduction on the accumulator.

### Q05  ·  Easy
**Question:** Which option best describes **critical**?

- **A.** A barrier that does not exclude.
- **B.** A named/unnamed lock so only one thread executes the block at a time.
- **C.** An atomic on any structured block of any size always faster.
- **D.** A SIMD vector add.

**Answer:** B
**Explanation:** critical: A named/unnamed lock so only one thread executes the block at a time.

### Q06  ·  Easy
**Question:** Which option best describes **firstprivate**?

- **A.** Shared among threads.
- **B.** Uninitialised private.
- **C.** Private copies are initialised from the incoming value.
- **D.** A barrier.

**Answer:** C
**Explanation:** firstprivate: Private copies are initialised from the incoming value.

### Q07  ·  Easy
**Question:** Which option best describes **guided schedule**?

- **A.** MPI scatter.
- **B.** Chunks start large and shrink; a compromise between static and dynamic.
- **C.** Always size 1.
- **D.** False sharing by definition.

**Answer:** B
**Explanation:** guided schedule: Chunks start large and shrink; a compromise between static and dynamic.

### Q08  ·  Easy
**Question:** Which option best describes **nowait**?

- **A.** Creates threads.
- **B.** Forces an extra barrier.
- **C.** Is a reduction.
- **D.** Skips the implicit barrier at the end of a worksharing construct.

**Answer:** D
**Explanation:** nowait: Skips the implicit barrier at the end of a worksharing construct.

### Q09  ·  Easy
**Question:** Which sequence correctly describes **OpenMP trapezoidal**?

- **A.** One critical around the entire for including the loop index
- **B.** Set n,a,b → parallel for reduction(+:integral) over i=1..n-1 → add ends h/2 → done
- **C.** Shared integral += without reduction
- **D.** MPI_Bcast each trapezoid

**Answer:** B
**Explanation:** Correct sequence for OpenMP trapezoidal: Set n,a,b → parallel for reduction(+:integral) over i=1..n-1 → add ends h/2 → done

### Q10  ·  Easy
**Question:** Which sequence correctly describes **schedule choice**?

- **A.** Schedule is ignored by OpenMP
- **B.** Always dynamic,1 for dense SAXPY
- **C.** Always static,1 for adaptive FEM
- **D.** Uniform cheap iters → static; irregular → dynamic/guided; tune chunk with a timer

**Answer:** D
**Explanation:** Correct sequence for schedule choice: Uniform cheap iters → static; irregular → dynamic/guided; tune chunk with a timer

### Q11  ·  Easy
**Question:** omp critical is:

- **A.** A Bcast
- **B.** A CUDA kernel
- **C.** A worksharing loop
- **D.** Mutual exclusion for a block

**Answer:** D
**Explanation:** A lock.

### Q12  ·  Easy
**Question:** reduction(+:sum) means:

- **A.** Safe per-thread partial sums then combine
- **B.** An MPI_Bcast of sum
- **C.** sum is private and discarded
- **D.** A data race

**Answer:** A
**Explanation:** The reduction clause.

### Q13  ·  Intermediate
**Question:** Adaptive quadrature where some i are 100× costlier. Schedule?

- **A.** dynamic or guided (not coarse static)
- **B.** static, n chunks on 1 thread
- **C.** CUDA occupancy
- **D.** MPI_Barrier

**Answer:** A
**Explanation:** Load balance.

### Q14  ·  Intermediate
**Question:** Default sharing of a local variable declared outside a parallel region is typically:

- **A.** shared
- **B.** private
- **C.** firstprivate
- **D.** reduction

**Answer:** A
**Explanation:** Unless default(none) or a clause.

### Q15  ·  Intermediate
**Question:** Global double sum += f(i) inside omp for without reduction/atomic/critical. Bug?

- **A.** Data race on sum
- **B.** A syntax error only if n<8
- **C.** Warp divergence
- **D.** MPI deadlock

**Answer:** A
**Explanation:** Unprotected shared update.

### Q16  ·  Intermediate
**Question:** Master prints the result before the implicit barrier of a parallel for that fills an array (separate regions). Bug?

- **A.** Race: print can precede the work if not in the same region / missing barrier
- **B.** False sharing of stdout only
- **C.** A CUDA copy
- **D.** Always safe

**Answer:** A
**Explanation:** Join before I/O.

### Q17  ·  Intermediate
**Question:** Recursive Fibonacci with tasks: missing taskwait/depend. Risk?

- **A.** False MPI scatter
- **B.** Occupancy 100%
- **C.** Parent reads before children finish
- **D.** A DFA loop

**Answer:** C
**Explanation:** Need synchronisation on tasks.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **barrier** and **nowait**?

- **A.** barrier synchronises the team; nowait removes an implicit barrier.
- **B.** barrier skips worksharing.
- **C.** They are the same clause.
- **D.** nowait is a lock.

**Answer:** A
**Explanation:** barrier synchronises the team; nowait removes an implicit barrier.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **critical** and **atomic**?

- **A.** They are barriers.
- **B.** critical: general lock on a block. atomic: one rmw location, lower overhead.
- **C.** critical is always faster than atomic for ++.
- **D.** atomic wraps any block.

**Answer:** B
**Explanation:** critical: general lock on a block. atomic: one rmw location, lower overhead.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **parallel** and **parallel for**?

- **A.** They are identical.
- **B.** parallel for does not spawn threads.
- **C.** parallel distributes loop iterations by itself without for.
- **D.** parallel spawns a team; parallel for also workshares a for-loop.

**Answer:** D
**Explanation:** parallel spawns a team; parallel for also workshares a for-loop.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **static** and **dynamic**?

- **A.** They are CUDA schedules.
- **B.** static cannot do equal chunks.
- **C.** static: predetermined assignment, low overhead, can imbalance. dynamic: runtime, more overhead, better irregular.
- **D.** dynamic is always worse.

**Answer:** C
**Explanation:** static: predetermined assignment, low overhead, can imbalance. dynamic: runtime, more overhead, better irregular.

### Q22  ·  Intermediate
**Question:** Which is the best default for a balanced dense loop?

- **A.** guided,1 always on SAXPY
- **B.** dynamic,1 always
- **C.** a critical around the loop
- **D.** static (large chunks)

**Answer:** D
**Explanation:** Low overhead.

### Q23  ·  Intermediate
**Question:** Which option best describes **#pragma omp for / parallel for**?

- **A.** Launches a GPU kernel by itself always.
- **B.** Distributes loop iterations among the team (worksharing).
- **C.** Sorts the loop.
- **D.** Broadcasts MPI ranks.

**Answer:** B
**Explanation:** #pragma omp for / parallel for: Distributes loop iterations among the team (worksharing).

### Q24  ·  Intermediate
**Question:** Which option best describes **#pragma omp parallel**?

- **A.** An MPI_Init.
- **B.** Creates a team of threads that execute the structured block.
- **C.** A CUDA grid launch.
- **D.** A barrier only, no threads.

**Answer:** B
**Explanation:** #pragma omp parallel: Creates a team of threads that execute the structured block.

### Q25  ·  Intermediate
**Question:** Which option best describes **OpenMP task**?

- **A.** A CUDA warp.
- **B.** An MPI rank.
- **C.** A static iteration always.
- **D.** A unit of work that the runtime can steal; useful for recursion/irregular graphs.

**Answer:** D
**Explanation:** OpenMP task: A unit of work that the runtime can steal; useful for recursion/irregular graphs.

### Q26  ·  Intermediate
**Question:** Which option best describes **atomic**?

- **A.** A team-wide barrier.
- **B.** A parallel region.
- **C.** A hardware-friendly update of one memory location (e.g. +=).
- **D.** A collapse clause.

**Answer:** C
**Explanation:** atomic: A hardware-friendly update of one memory location (e.g. +=).

### Q27  ·  Intermediate
**Question:** Which option best describes **barrier**?

- **A.** Team waits until all threads arrive (implicit at the end of many worksharing constructs).
- **B.** nowait.
- **C.** MPI_Send.
- **D.** A reduction op.

**Answer:** A
**Explanation:** barrier: Team waits until all threads arrive (implicit at the end of many worksharing constructs).

### Q28  ·  Intermediate
**Question:** Which option best describes **dynamic schedule**?

- **A.** Threads grab the next chunk at runtime; good for irregular work.
- **B.** Compile-time equal blocks only.
- **C.** A barrier.
- **D.** Always chunk size n.

**Answer:** A
**Explanation:** dynamic schedule: Threads grab the next chunk at runtime; good for irregular work.

### Q29  ·  Intermediate
**Question:** Which option best describes **false sharing (OpenMP)**?

- **A.** Threads updating adjacent array elements in one cache line contend via coherence.
- **B.** A correct reduction.
- **C.** A CUDA constant cache hit.
- **D.** MPI deadlock.

**Answer:** A
**Explanation:** false sharing (OpenMP): Threads updating adjacent array elements in one cache line contend via coherence.

### Q30  ·  Intermediate
**Question:** Which option best describes **lastprivate**?

- **A.** The value from the last loop iteration (in serial order) is copied back to the original.
- **B.** Uninitialised.
- **C.** The first iteration’s value.
- **D.** A reduction min.

**Answer:** A
**Explanation:** lastprivate: The value from the last loop iteration (in serial order) is copied back to the original.

### Q31  ·  Intermediate
**Question:** Which option best describes **private clause**?

- **A.** It is firstprivate always.
- **B.** Each thread has an uninitialised own copy; host copy is distinct.
- **C.** All threads share one object.
- **D.** It is a reduction.

**Answer:** B
**Explanation:** private clause: Each thread has an uninitialised own copy; host copy is distinct.

### Q32  ·  Intermediate
**Question:** Which option best describes **reduction**?

- **A.** A user must always write a critical around every +. 
- **B.** A CUDA warp vote.
- **C.** The runtime gives private accumulators then combines with +, *, min, … safely.
- **D.** An MPI_Bcast.

**Answer:** C
**Explanation:** reduction: The runtime gives private accumulators then combines with +, *, min, … safely.

### Q33  ·  Intermediate
**Question:** Which option best describes **shared clause**?

- **A.** Each thread gets a private copy always.
- **B.** Named variables are visible to all threads (default for file-scope and heap, and typically for locals outside parallel).
- **C.** The variable is reduction-only.
- **D.** The variable is a CUDA register.

**Answer:** B
**Explanation:** shared clause: Named variables are visible to all threads (default for file-scope and heap, and typically for locals outside parallel).

### Q34  ·  Intermediate
**Question:** Which option best describes **static schedule**?

- **A.** Iterations split into chunks assigned round-robin/up front (default chunk often n/p).
- **B.** A random permutation each time with no formula.
- **C.** Guided decreasing only.
- **D.** Runtime self-scheduled small chunks always.

**Answer:** A
**Explanation:** static schedule: Iterations split into chunks assigned round-robin/up front (default chunk often n/p).

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **race-free shared counter (best to worse)**?

- **A.** Barrier per increment only
- **B.** racy ++ → critical → ignore the answer
- **C.** Privatise + reduction → atomic → critical → (never) racy ++
- **D.** MPI_Send to self

**Answer:** C
**Explanation:** Correct sequence for race-free shared counter (best to worse): Privatise + reduction → atomic → critical → (never) racy ++

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **tasking recursion**?

- **A.** Use mpi_for
- **B.** Ignore taskwait on a shared result
- **C.** All threads recursively spawn without a team
- **D.** parallel → single spawns root task → tasks spawn children → taskwait/taskgroup before using results

**Answer:** D
**Explanation:** Correct sequence for tasking recursion: parallel → single spawns root task → tasks spawn children → taskwait/taskgroup before using results

### Q37  ·  Intermediate
**Question:** Which statement about **#pragma omp for / parallel for** is FALSE?

- **A.** In this module, #pragma omp for / parallel for is a core idea students must distinguish from nearby terms.
- **B.** omp for runs every iteration on every thread.
- **C.** #pragma omp for / parallel for is correctly understood as: distributes loop iterations among the team (worksharing).
- **D.** A useful way to remember #pragma omp for / parallel for is that it is not the same as “Broadcasts MPI ranks”.

**Answer:** B
**Explanation:** The false claim is: omp for runs every iteration on every thread.. #pragma omp for / parallel for actually means: Distributes loop iterations among the team (worksharing).

### Q38  ·  Intermediate
**Question:** Which statement about **OpenMP** is FALSE?

- **A.** In this module, OpenMP is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember OpenMP is that it is not the same as “An MPI process launcher for Ethernet”.
- **C.** OpenMP is correctly understood as: a pragma-based shared-memory API: compiler+runtime spawn threads on a node.
- **D.** OpenMP programs cannot share arrays; they must MPI_Send every int.

**Answer:** D
**Explanation:** The false claim is: OpenMP programs cannot share arrays; they must MPI_Send every int.. OpenMP actually means: A pragma-based shared-memory API: compiler+runtime spawn threads on a node.

### Q39  ·  Intermediate
**Question:** Which statement about **atomic** is FALSE?

- **A.** In this module, atomic is a core idea students must distinguish from nearby terms.
- **B.** atomic is correctly understood as: a hardware-friendly update of one memory location (e.g. +=).
- **C.** atomic can protect a 20-line structured block like critical.
- **D.** A useful way to remember atomic is that it is not the same as “A team-wide barrier”.

**Answer:** C
**Explanation:** The false claim is: atomic can protect a 20-line structured block like critical.. atomic actually means: A hardware-friendly update of one memory location (e.g. +=).

### Q40  ·  Intermediate
**Question:** Which statement about **dynamic schedule** is FALSE?

- **A.** In this module, dynamic schedule is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember dynamic schedule is that it is not the same as “Compile-time equal blocks only”.
- **C.** dynamic forbids a chunk size.
- **D.** dynamic schedule is correctly understood as: threads grab the next chunk at runtime; good for irregular work.

**Answer:** C
**Explanation:** The false claim is: dynamic forbids a chunk size.. dynamic schedule actually means: Threads grab the next chunk at runtime; good for irregular work.

### Q41  ·  Intermediate
**Question:** Which statement about **false sharing (OpenMP)** is FALSE?

- **A.** false sharing (OpenMP) is correctly understood as: threads updating adjacent array elements in one cache line contend via coherence.
- **B.** False sharing is required for OpenMP reductions.
- **C.** A useful way to remember false sharing (OpenMP) is that it is not the same as “A correct reduction”.
- **D.** In this module, false sharing (OpenMP) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: False sharing is required for OpenMP reductions.. false sharing (OpenMP) actually means: Threads updating adjacent array elements in one cache line contend via coherence.

### Q42  ·  Intermediate
**Question:** Which statement about **firstprivate** is FALSE?

- **A.** A useful way to remember firstprivate is that it is not the same as “Uninitialised private”.
- **B.** In this module, firstprivate is a core idea students must distinguish from nearby terms.
- **C.** firstprivate is correctly understood as: private copies are initialised from the incoming value.
- **D.** firstprivate is the same as lastprivate.

**Answer:** D
**Explanation:** The false claim is: firstprivate is the same as lastprivate.. firstprivate actually means: Private copies are initialised from the incoming value.

### Q43  ·  Intermediate
**Question:** Which statement about **nowait** is FALSE?

- **A.** In this module, nowait is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember nowait is that it is not the same as “Forces an extra barrier”.
- **C.** nowait is correctly understood as: skips the implicit barrier at the end of a worksharing construct.
- **D.** nowait adds an MPI_Barrier.

**Answer:** D
**Explanation:** The false claim is: nowait adds an MPI_Barrier.. nowait actually means: Skips the implicit barrier at the end of a worksharing construct.

### Q44  ·  Intermediate
**Question:** Which statement about **reduction** is FALSE?

- **A.** In this module, reduction is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember reduction is that it is not the same as “A user must always write a critical around every +. ”.
- **C.** reduction races on the global sum by design.
- **D.** reduction is correctly understood as: the runtime gives private accumulators then combines with +, *, min, … safely.

**Answer:** C
**Explanation:** The false claim is: reduction races on the global sum by design.. reduction actually means: The runtime gives private accumulators then combines with +, *, min, … safely.

### Q45  ·  Intermediate
**Question:** Which statement about **shared clause** is FALSE?

- **A.** In this module, shared clause is a core idea students must distinguish from nearby terms.
- **B.** shared clause is correctly understood as: named variables are visible to all threads (default for file-scope and heap, and typically for locals outside parallel).
- **C.** shared means MPI private heaps.
- **D.** A useful way to remember shared clause is that it is not the same as “Each thread gets a private copy always”.

**Answer:** C
**Explanation:** The false claim is: shared means MPI private heaps.. shared clause actually means: Named variables are visible to all threads (default for file-scope and heap, and typically for locals outside parallel).

### Q46  ·  Intermediate
**Question:** firstprivate(x) vs private(x):

- **A.** They are identical
- **B.** firstprivate initialises from the original x
- **C.** private initialises from x
- **D.** firstprivate is shared

**Answer:** B
**Explanation:** Init vs junk.

### Q47  ·  Intermediate
**Question:** nowait on a for construct:

- **A.** Drops the implicit barrier at the end of that for
- **B.** Is a lock
- **C.** Forces MPI_Finalize
- **D.** Creates extra threads

**Answer:** A
**Explanation:** Allows overlap of later work in the same region.

### Q48  ·  Difficult
**Question:** #pragma omp parallel for schedule(static, 8) with n=100 iterations and 4 threads. Chunk size is:

- **A.** 25
- **B.** 100
- **C.** 4
- **D.** 8

**Answer:** D
**Explanation:** The chunk in static,8 is 8 iterations.

### Q49  ·  Difficult
**Question:** #pragma omp parallel then an inner for without omp for. Result?

- **A.** MPI ranks spawn
- **B.** A compile error always
- **C.** Each thread runs the whole loop (unless you workshare)
- **D.** Automatic static split

**Answer:** C
**Explanation:** Need for/worksharing.

### Q50  ·  Difficult
**Question:** A parallel region with 8 threads hits an implicit barrier. How many threads must arrive?

- **A.** 0
- **B.** 8
- **C.** 7
- **D.** 1

**Answer:** B
**Explanation:** The whole team.

### Q51  ·  Difficult
**Question:** Best OpenMP fix for that sum is:

- **A.** Make sum shared and hope
- **B.** nowait on a barrier
- **C.** reduction(+:sum)
- **D.** schedule(static) only

**Answer:** C
**Explanation:** Designed for accumulators.

### Q52  ·  Difficult
**Question:** False sharing: cache line 64 B, updates of adjacent 4-byte ints. How many such ints fit in one line?

- **A.** 4
- **B.** 8
- **C.** 16
- **D.** 64

**Answer:** C
**Explanation:** 64/4=16.

### Q53  ·  Difficult
**Question:** OpenMP tasks are preferable to omp for when:

- **A.** The work is recursive or irregular rather than a canonical loop
- **B.** You need MPI_Scatter
- **C.** The loop is a dense SAXPY
- **D.** You are on distributed memory without a DSM

**Answer:** A
**Explanation:** Task graphs.

### Q54  ·  Difficult
**Question:** Trapezoidal n=10^6, 8 threads, perfect split, each thread’s iteration count?

- **A.** 8
- **B.** 10
- **C.** 1e6
- **D.** 125000

**Answer:** D
**Explanation:** 1e6/8=125000.

### Q55  ·  Difficult
**Question:** Two threads write a[0] and a[1] as ints, slow on x86. Suspect:

- **A.** MPI tag mismatch
- **B.** False sharing of one line
- **C.** Amdahl s=0
- **D.** Missing Init

**Answer:** B
**Explanation:** Pad or privatise.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **critical** and **reduction**?

- **A.** critical cannot protect a sum.
- **B.** They spawn MPI ranks.
- **C.** reduction is the structured way to combine; critical around += works but serialises more.
- **D.** reduction is illegal for +.

**Answer:** C
**Explanation:** reduction is the structured way to combine; critical around += works but serialises more.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **dynamic** and **guided**?

- **A.** guided uses decreasing chunks to cut overhead late in the loop.
- **B.** guided is static.
- **C.** They ignore chunk.
- **D.** dynamic increases chunk size.

**Answer:** A
**Explanation:** guided uses decreasing chunks to cut overhead late in the loop.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **omp for** and **omp task**?

- **A.** for is only for MPI.
- **B.** They cannot combine.
- **C.** for: canonical loops. tasks: irregular/recursive work with depend/steal.
- **D.** tasks only work on canonical for.

**Answer:** C
**Explanation:** for: canonical loops. tasks: irregular/recursive work with depend/steal.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **shared** and **private**?

- **A.** Shared: one object. Private: per-thread copy, uninitialized.
- **B.** Shared copies the last iteration back.
- **C.** Private is default for globals.
- **D.** They both mean reduction.

**Answer:** A
**Explanation:** Shared: one object. Private: per-thread copy, uninitialized.

### Q60  ·  Difficult
**Question:** Which statement about **#pragma omp parallel** is FALSE?

- **A.** In this module, #pragma omp parallel is a core idea students must distinguish from nearby terms.
- **B.** parallel does not create threads; it only vectorises SIMD.
- **C.** A useful way to remember #pragma omp parallel is that it is not the same as “A barrier only, no threads”.
- **D.** #pragma omp parallel is correctly understood as: creates a team of threads that execute the structured block.

**Answer:** B
**Explanation:** The false claim is: parallel does not create threads; it only vectorises SIMD.. #pragma omp parallel actually means: Creates a team of threads that execute the structured block.

### Q61  ·  Difficult
**Question:** Which statement about **OpenMP task** is FALSE?

- **A.** A useful way to remember OpenMP task is that it is not the same as “A CUDA warp”.
- **B.** Tasks are illegal inside parallel regions.
- **C.** In this module, OpenMP task is a core idea students must distinguish from nearby terms.
- **D.** OpenMP task is correctly understood as: a unit of work that the runtime can steal; useful for recursion/irregular graphs.

**Answer:** B
**Explanation:** The false claim is: Tasks are illegal inside parallel regions.. OpenMP task actually means: A unit of work that the runtime can steal; useful for recursion/irregular graphs.

### Q62  ·  Difficult
**Question:** Which statement about **Trapezoidal (OpenMP)** is FALSE?

- **A.** OpenMP trapezoidal cannot use reduction; only critical around printf.
- **B.** A useful way to remember Trapezoidal (OpenMP) is that it is not the same as “Each thread writes the same global sum without protection”.
- **C.** In this module, Trapezoidal (OpenMP) is a core idea students must distinguish from nearby terms.
- **D.** Trapezoidal (OpenMP) is correctly understood as: parallelise the sum of trapezoids with a reduction on the accumulator.

**Answer:** A
**Explanation:** The false claim is: OpenMP trapezoidal cannot use reduction; only critical around printf.. Trapezoidal (OpenMP) actually means: Parallelise the sum of trapezoids with a reduction on the accumulator.

### Q63  ·  Difficult
**Question:** Which statement about **barrier** is FALSE?

- **A.** barrier is correctly understood as: team waits until all threads arrive (implicit at the end of many worksharing constructs).
- **B.** A useful way to remember barrier is that it is not the same as “A reduction op”.
- **C.** barrier lets some threads skip the rest of the region.
- **D.** In this module, barrier is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: barrier lets some threads skip the rest of the region.. barrier actually means: Team waits until all threads arrive (implicit at the end of many worksharing constructs).

### Q64  ·  Difficult
**Question:** Which statement about **critical** is FALSE?

- **A.** critical is the same as barrier.
- **B.** A useful way to remember critical is that it is not the same as “A SIMD vector add”.
- **C.** critical is correctly understood as: a named/unnamed lock so only one thread executes the block at a time.
- **D.** In this module, critical is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: critical is the same as barrier.. critical actually means: A named/unnamed lock so only one thread executes the block at a time.

### Q65  ·  Difficult
**Question:** Which statement about **guided schedule** is FALSE?

- **A.** A useful way to remember guided schedule is that it is not the same as “Always size 1”.
- **B.** guided schedule is correctly understood as: chunks start large and shrink; a compromise between static and dynamic.
- **C.** guided uses increasing chunk sizes.
- **D.** In this module, guided schedule is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: guided uses increasing chunk sizes.. guided schedule actually means: Chunks start large and shrink; a compromise between static and dynamic.

### Q66  ·  Difficult
**Question:** Which statement about **lastprivate** is FALSE?

- **A.** A useful way to remember lastprivate is that it is not the same as “The first iteration’s value”.
- **B.** lastprivate is correctly understood as: the value from the last loop iteration (in serial order) is copied back to the original.
- **C.** In this module, lastprivate is a core idea students must distinguish from nearby terms.
- **D.** lastprivate copies a random thread’s value, not the last iteration.

**Answer:** D
**Explanation:** The false claim is: lastprivate copies a random thread’s value, not the last iteration.. lastprivate actually means: The value from the last loop iteration (in serial order) is copied back to the original.

### Q67  ·  Difficult
**Question:** Which statement about **private clause** is FALSE?

- **A.** In this module, private clause is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember private clause is that it is not the same as “All threads share one object”.
- **C.** private clause is correctly understood as: each thread has an uninitialised own copy; host copy is distinct.
- **D.** private copies are initialised from the master automatically (that is firstprivate).

**Answer:** D
**Explanation:** The false claim is: private copies are initialised from the master automatically (that is firstprivate).. private clause actually means: Each thread has an uninitialised own copy; host copy is distinct.

### Q68  ·  Difficult
**Question:** Which statement about **static schedule** is FALSE?

- **A.** In this module, static schedule is a core idea students must distinguish from nearby terms.
- **B.** static cannot divide a contiguous block of iterations.
- **C.** static schedule is correctly understood as: iterations split into chunks assigned round-robin/up front (default chunk often n/p).
- **D.** A useful way to remember static schedule is that it is not the same as “Runtime self-scheduled small chunks always”.

**Answer:** B
**Explanation:** The false claim is: static cannot divide a contiguous block of iterations.. static schedule actually means: Iterations split into chunks assigned round-robin/up front (default chunk often n/p).

### Q69  ·  Difficult
**Question:** Why can schedule(static,1) cause false sharing on an array of ints?

- **A.** static,1 never splits
- **B.** OpenMP forbids ints
- **C.** It uses MPI
- **D.** Consecutive iterations (hence adjacent elements) go to different threads on one line

**Answer:** D
**Explanation:** Round-robin adjacent indices.

### Q70  ·  Difficult
**Question:** atomic ++ vs critical around ++ on a hot counter, 8 threads, 10^7 updates. Qualitatively the faster safe choice is:

- **A.** atomic (or better: reduction/privatise)
- **B.** unprotected shared ++
- **C.** MPI_Allreduce per ++
- **D.** one barrier per ++

**Answer:** A
**Explanation:** atomic cheaper than critical; reduction better still.

### Q71  ·  Difficult
**Question:** lastprivate(x) on a for i=0..n-1 assigning x=i. After the loop x is:

- **A.** unspecified private junk
- **B.** 0
- **C.** the thread-id
- **D.** n-1

**Answer:** D
**Explanation:** Last serial iteration.

### Q72  ·  Difficult
**Question:** n=100, 4 threads, static without chunk (typical equal split). Iterations per thread?

- **A.** 4
- **B.** 8
- **C.** 25
- **D.** 100

**Answer:** C
**Explanation:** 100/4=25.

### Q73  ·  Difficult
**Question:** schedule(dynamic, 1) on 1000 unequal iterations, 4 threads. Chunk size is:

- **A.** 1
- **B.** 250
- **C.** 1000
- **D.** 4

**Answer:** A
**Explanation:** Each grab is 1 iteration.

---

## Quick answer key

Q01–C | Q02–A | Q03–B | Q04–C | Q05–B | Q06–C | Q07–B | Q08–D | Q09–B | Q10–D | Q11–D | Q12–A | Q13–A | Q14–A | Q15–A | Q16–A | Q17–C | Q18–A | Q19–B | Q20–D | Q21–C | Q22–D | Q23–B | Q24–B | Q25–D | Q26–C | Q27–A | Q28–A | Q29–A | Q30–A | Q31–B | Q32–C | Q33–B | Q34–A | Q35–C | Q36–D | Q37–B | Q38–D | Q39–C | Q40–C | Q41–B | Q42–D | Q43–D | Q44–C | Q45–C | Q46–B | Q47–A | Q48–D | Q49–C | Q50–B | Q51–C | Q52–C | Q53–A | Q54–D | Q55–B | Q56–C | Q57–A | Q58–C | Q59–A | Q60–B | Q61–B | Q62–A | Q63–C | Q64–A | Q65–C | Q66–D | Q67–D | Q68–B | Q69–D | Q70–A | Q71–D | Q72–C | Q73–A
