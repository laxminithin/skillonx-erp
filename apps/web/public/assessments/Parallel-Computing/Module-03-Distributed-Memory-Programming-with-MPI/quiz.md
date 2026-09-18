# Quiz — Parallel Computing — Module 3: Distributed-Memory Programming with MPI

**Subject:** Parallel Computing  
**Module:** Module 3 — Distributed-Memory Programming with MPI  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** MPI_Comm_rank returns:

- **A.** This process’s ID in the communicator
- **B.** OpenMP thread count
- **C.** Warp size
- **D.** The CUDA SM number

**Answer:** A
**Explanation:** Rank.

### Q02  ·  Easy
**Question:** MPI_Finalize should be called:

- **A.** Only on rank 0
- **B.** Inside every Recv
- **C.** Once per process after MPI work
- **D.** Before MPI_Init

**Answer:** C
**Explanation:** Symmetric with Init.

### Q03  ·  Easy
**Question:** MPI_Scatter is closest to:

- **A.** Broadcast of the whole array
- **B.** A barrier
- **C.** Summing an array
- **D.** Distributing chunks of an array from a root

**Answer:** D
**Explanation:** Inverse of gather.

### Q04  ·  Easy
**Question:** Which is a collective?

- **A.** MPI_Bcast
- **B.** MPI_Recv
- **C.** MPI_Isend
- **D.** MPI_Send

**Answer:** A
**Explanation:** All ranks participate.

### Q05  ·  Easy
**Question:** Which option best describes **Derived datatype**?

- **A.** An OpenMP reduction identifier.
- **B.** A C union that MPI cannot see.
- **C.** A CUDA texture.
- **D.** An MPI type describing non-contiguous layouts (vectors, structs) so one send moves a halo/row.

**Answer:** D
**Explanation:** Derived datatype: An MPI type describing non-contiguous layouts (vectors, structs) so one send moves a halo/row.

### Q06  ·  Easy
**Question:** Which option best describes **MPI**?

- **A.** A CUDA block scheduler.
- **B.** A standard message-passing API: processes (ranks) in a communicator exchange messages.
- **C.** An OpenMP pragma.
- **D.** A DFA minimiser.

**Answer:** B
**Explanation:** MPI: A standard message-passing API: processes (ranks) in a communicator exchange messages.

### Q07  ·  Easy
**Question:** Which option best describes **MPI_Allreduce**?

- **A.** Bcast of rank 0’s unreduced value.
- **B.** Reduce whose result is available on every rank.
- **C.** Gather of strings only.
- **D.** Reduce to root only.

**Answer:** B
**Explanation:** MPI_Allreduce: Reduce whose result is available on every rank.

### Q08  ·  Easy
**Question:** Which option best describes **MPI_Send**?

- **A.** A non-blocking wait-free store to shared memory.
- **B.** A CUDA memcpy always.
- **C.** A blocking send of a buffer to a destination rank with a tag (semantics depend on buffering).
- **D.** An OpenMP barrier.

**Answer:** C
**Explanation:** MPI_Send: A blocking send of a buffer to a destination rank with a tag (semantics depend on buffering).

### Q09  ·  Easy
**Question:** Which option best describes **Parallel sorting (MPI)**?

- **A.** OpenMP merge on one heap only.
- **B.** Distribute keys, local sort, then exchange (odd-even, sample sort, bitonic-style) across ranks.
- **C.** A single rank qsort while others idle, called ‘parallel’.
- **D.** GPU occupancy sort.

**Answer:** B
**Explanation:** Parallel sorting (MPI): Distribute keys, local sort, then exchange (odd-even, sample sort, bitonic-style) across ranks.

### Q10  ·  Easy
**Question:** Which option best describes **Trapezoidal rule (MPI)**?

- **A.** Only rank 0 runs; others sleep.
- **B.** Each rank integrates the whole [a,b] and ignores others.
- **C.** Partition [a,b] among ranks, each sums local trapezoids, then reduce the integral.
- **D.** A CUDA __shared__ only.

**Answer:** C
**Explanation:** Trapezoidal rule (MPI): Partition [a,b] among ranks, each sums local trapezoids, then reduce the integral.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **MPI program skeleton**?

- **A.** OpenMP parallel then MPI_Init inside each thread unsafely by default
- **B.** MPI_Init → Comm_rank/size → work/messages/collectives → MPI_Finalize
- **C.** Finalize then Init
- **D.** Skip Init on rank 0

**Answer:** B
**Explanation:** Correct sequence for MPI program skeleton: MPI_Init → Comm_rank/size → work/messages/collectives → MPI_Finalize

### Q12  ·  Easy
**Question:** Which sequence correctly describes **deadlock-free pairwise exchange**?

- **A.** Reduce the neighbour’s address
- **B.** Blocking Send both ways first
- **C.** Barrier instead of data
- **D.** Post Irecv from neighbour → Isend to neighbour → Waitall (or MPI_Sendrecv)

**Answer:** D
**Explanation:** Correct sequence for deadlock-free pairwise exchange: Post Irecv from neighbour → Isend to neighbour → Waitall (or MPI_Sendrecv)

### Q13  ·  Intermediate
**Question:** A derived datatype is committed so that:

- **A.** OpenMP reductions work
- **B.** Ranks change ID
- **C.** Warps vote
- **D.** Sends can describe layout without user packing each time

**Answer:** D
**Explanation:** MPI_Type_commit.

### Q14  ·  Intermediate
**Question:** A standard fix for Send/Send deadlock is:

- **A.** MPI_Sendrecv or non-blocking + Wait
- **B.** Adding more Barriers after each Send only
- **C.** Switching to SISD
- **D.** Using Scatter instead of data

**Answer:** A
**Explanation:** Break or overlap the handshake.

### Q15  ·  Intermediate
**Question:** After local sort, collect the full ordered array at rank 0. Collective?

- **A.** Bcast of one key
- **B.** Reduce MIN of ranks
- **C.** MPI_Gather (then a merge if needed — or Gatherv)
- **D.** Scatter

**Answer:** C
**Explanation:** Gather pieces; merging depends on algorithm.

### Q16  ·  Intermediate
**Question:** Compute π via trapezoids of 4/(1+x^2). After local sums you should:

- **A.** MPI_Reduce SUM to root (or Allreduce)
- **B.** Each rank prints π and exits
- **C.** Barrier without combining
- **D.** Scatter the scalar π

**Answer:** A
**Explanation:** Need a global sum.

### Q17  ·  Intermediate
**Question:** In the trapezoidal MPI program, a,b,n should be:

- **A.** Computed differently on each rank without communication
- **B.** Broadcast from a rank that reads them
- **C.** Scattered as a reduction
- **D.** Barriers

**Answer:** B
**Explanation:** Same interval for all.

### Q18  ·  Intermediate
**Question:** MPI_Allreduce vs Reduce+Bcast:

- **A.** Allreduce is the fused primitive; Reduce+Bcast is a slower equivalent pattern
- **B.** Allreduce delivers only to root
- **C.** Bcast reduces
- **D.** They compute different sums

**Answer:** A
**Explanation:** Same result, better implementation.

### Q19  ·  Intermediate
**Question:** Rank 0 Send to 1 then Recv from 1; rank 1 Send to 0 then Recv from 0. Risk?

- **A.** Deadlock (if Sends block)
- **B.** CUDA warp vote
- **C.** OpenMP race
- **D.** Guaranteed Allreduce

**Answer:** A
**Explanation:** Classic cyclic blocking.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **MPI_Bcast** and **MPI_Scatter**?

- **A.** Bcast sends chunk i to rank i.
- **B.** Bcast: identical data to all. Scatter: disjoint chunks.
- **C.** Scatter copies the whole array to all.
- **D.** They are the same.

**Answer:** B
**Explanation:** Bcast: identical data to all. Scatter: disjoint chunks.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **MPI_COMM_WORLD** and **a user communicator**?

- **A.** World is all launched ranks; user groups restrict collectives/sends.
- **B.** World has one rank always.
- **C.** They use different MPI standards.
- **D.** User communicators cannot Send.

**Answer:** A
**Explanation:** World is all launched ranks; user groups restrict collectives/sends.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **MPI_Send** and **MPI_Isend**?

- **A.** Isend allows immediate buffer reuse.
- **B.** Send is a collective.
- **C.** They have identical completion rules.
- **D.** Send may block until safe; Isend returns after initiating, buffer unsafe until Wait.

**Answer:** D
**Explanation:** Send may block until safe; Isend returns after initiating, buffer unsafe until Wait.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **blocking Send/Recv pair** and **non-blocking + Waitall**?

- **A.** Waitall is a Bcast.
- **B.** Blocking never deadlocks.
- **C.** Blocking can deadlock on a cycle; non-blocking can post all then wait.
- **D.** Non-blocking forbids matching.

**Answer:** C
**Explanation:** Blocking can deadlock on a cycle; non-blocking can post all then wait.

### Q24  ·  Intermediate
**Question:** Which option best describes **Communicator**?

- **A.** A mutex.
- **B.** A group of processes plus a context (e.g. MPI_COMM_WORLD) for sends and collectives.
- **C.** A warp.
- **D.** A GPU stream.

**Answer:** B
**Explanation:** Communicator: A group of processes plus a context (e.g. MPI_COMM_WORLD) for sends and collectives.

### Q25  ·  Intermediate
**Question:** Which option best describes **Count and datatype**?

- **A.** Always bytes in MPI_BYTE even for doubles.
- **B.** A C sizeof only on the root.
- **C.** A warp width.
- **D.** The payload is count elements of a given MPI datatype (MPI_INT, …).

**Answer:** D
**Explanation:** Count and datatype: The payload is count elements of a given MPI datatype (MPI_INT, …).

### Q26  ·  Intermediate
**Question:** Which option best describes **Deadlock (MPI)**?

- **A.** A CUDA occupancy of 0.
- **B.** A cyclic wait, e.g. two ranks each blocking in Send to the other before Recv.
- **C.** An OpenMP reduction.
- **D.** Perfect strong scaling.

**Answer:** B
**Explanation:** Deadlock (MPI): A cyclic wait, e.g. two ranks each blocking in Send to the other before Recv.

### Q27  ·  Intermediate
**Question:** Which option best describes **MPI_Barrier**?

- **A.** Collective that blocks until all ranks in the communicator arrive.
- **B.** A send to rank 0.
- **C.** A CUDA kernel.
- **D.** An OpenMP nowait.

**Answer:** A
**Explanation:** MPI_Barrier: Collective that blocks until all ranks in the communicator arrive.

### Q28  ·  Intermediate
**Question:** Which option best describes **MPI_Bcast**?

- **A.** One root sends the same data to all ranks in the communicator.
- **B.** A scatter of different chunks.
- **C.** Each rank sends a unique slice to rank 0.
- **D.** A point-to-point tag match only between 2 and 3.

**Answer:** A
**Explanation:** MPI_Bcast: One root sends the same data to all ranks in the communicator.

### Q29  ·  Intermediate
**Question:** Which option best describes **MPI_Gather**?

- **A.** Each rank sends its piece; root concatenates them in rank order.
- **B.** Barrier.
- **C.** Allreduce SUM.
- **D.** Root sends chunks out.

**Answer:** A
**Explanation:** MPI_Gather: Each rank sends its piece; root concatenates them in rank order.

### Q30  ·  Intermediate
**Question:** Which option best describes **MPI_Isend/Irecv**?

- **A.** Non-blocking send/recv; completion via Wait/Test, used to overlap and avoid deadlock.
- **B.** A blocking Send that cannot deadlock.
- **C.** A collective barrier.
- **D.** Immediate destruction of the communicator.

**Answer:** A
**Explanation:** MPI_Isend/Irecv: Non-blocking send/recv; completion via Wait/Test, used to overlap and avoid deadlock.

### Q31  ·  Intermediate
**Question:** Which option best describes **MPI_Recv**?

- **A.** A broadcast.
- **B.** A blocking receive into a buffer from a source (or ANY) with a matching tag.
- **C.** A reduction.
- **D.** A barrier.

**Answer:** B
**Explanation:** MPI_Recv: A blocking receive into a buffer from a source (or ANY) with a matching tag.

### Q32  ·  Intermediate
**Question:** Which option best describes **MPI_Reduce**?

- **A.** A broadcast.
- **B.** Scatter.
- **C.** Combines values from all ranks with an op (SUM, MAX, …) into a root’s result.
- **D.** A barrier with no data.

**Answer:** C
**Explanation:** MPI_Reduce: Combines values from all ranks with an op (SUM, MAX, …) into a root’s result.

### Q33  ·  Intermediate
**Question:** Which option best describes **MPI_Scatter**?

- **A.** Everyone gets the whole array (Bcast).
- **B.** Everyone sends to root (Gather).
- **C.** Root distributes equal (or specified) chunks so rank i gets the i-th piece.
- **D.** A reduction op.

**Answer:** C
**Explanation:** MPI_Scatter: Root distributes equal (or specified) chunks so rank i gets the i-th piece.

### Q34  ·  Intermediate
**Question:** Which option best describes **Rank**?

- **A.** An OpenMP team size.
- **B.** The integer ID of a process in a communicator, from 0 to size−1.
- **C.** A cache-line tag.
- **D.** A CUDA threadIdx.

**Answer:** B
**Explanation:** Rank: The integer ID of a process in a communicator, from 0 to size−1.

### Q35  ·  Intermediate
**Question:** Which option best describes **Tag**?

- **A.** An integer matching sends to recvs so multiple message kinds do not mix.
- **B.** A rank.
- **C.** A CUDA blockIdx.
- **D.** A communicator size.

**Answer:** A
**Explanation:** Tag: An integer matching sends to recvs so multiple message kinds do not mix.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **MPI trapezoidal**?

- **A.** Gather the endpoints without summing
- **B.** Each rank integrates [a,b] fully then Multiply
- **C.** Broadcast a,b,n → partition local [a_i,b_i] → local trapezoid sum → Reduce SUM to root → rank 0 prints
- **D.** Bcast the local sums without a root

**Answer:** C
**Explanation:** Correct sequence for MPI trapezoidal: Broadcast a,b,n → partition local [a_i,b_i] → local trapezoid sum → Reduce SUM to root → rank 0 prints

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **odd-even transposition (distributed)**?

- **A.** One rank qsort, Scatter nothing
- **B.** Allreduce the permutation
- **C.** Bcast all keys every phase only
- **D.** Local sort → for phase in 0..p-1: even/odd neighbour exchange+merge keep half → next phase

**Answer:** D
**Explanation:** Correct sequence for odd-even transposition (distributed): Local sort → for phase in 0..p-1: even/odd neighbour exchange+merge keep half → next phase

### Q38  ·  Intermediate
**Question:** Which statement about **Communicator** is FALSE?

- **A.** In this module, Communicator is a core idea students must distinguish from nearby terms.
- **B.** There is only MPI_COMM_NULL in every program.
- **C.** Communicator is correctly understood as: a group of processes plus a context (e.g. MPI_COMM_WORLD) for sends and collectives.
- **D.** A useful way to remember Communicator is that it is not the same as “A GPU stream”.

**Answer:** B
**Explanation:** The false claim is: There is only MPI_COMM_NULL in every program.. Communicator actually means: A group of processes plus a context (e.g. MPI_COMM_WORLD) for sends and collectives.

### Q39  ·  Intermediate
**Question:** Which statement about **Derived datatype** is FALSE?

- **A.** In this module, Derived datatype is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Derived datatype is that it is not the same as “A C union that MPI cannot see”.
- **C.** Derived datatype is correctly understood as: an MPI type describing non-contiguous layouts (vectors, structs) so one send moves a halo/row.
- **D.** Derived types require packing by hand into a char array always, and MPI_Type_commit is illegal.

**Answer:** D
**Explanation:** The false claim is: Derived types require packing by hand into a char array always, and MPI_Type_commit is illegal.. Derived datatype actually means: An MPI type describing non-contiguous layouts (vectors, structs) so one send moves a halo/row.

### Q40  ·  Intermediate
**Question:** Which statement about **MPI** is FALSE?

- **A.** In this module, MPI is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MPI is that it is not the same as “An OpenMP pragma”.
- **C.** MPI is correctly understood as: a standard message-passing API: processes (ranks) in a communicator exchange messages.
- **D.** MPI requires a single shared heap among all ranks.

**Answer:** D
**Explanation:** The false claim is: MPI requires a single shared heap among all ranks.. MPI actually means: A standard message-passing API: processes (ranks) in a communicator exchange messages.

### Q41  ·  Intermediate
**Question:** Which statement about **MPI_Barrier** is FALSE?

- **A.** In this module, MPI_Barrier is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MPI_Barrier is that it is not the same as “A send to rank 0”.
- **C.** Barrier is a point-to-point message with tag −1.
- **D.** MPI_Barrier is correctly understood as: collective that blocks until all ranks in the communicator arrive.

**Answer:** C
**Explanation:** The false claim is: Barrier is a point-to-point message with tag −1.. MPI_Barrier actually means: Collective that blocks until all ranks in the communicator arrive.

### Q42  ·  Intermediate
**Question:** Which statement about **MPI_Recv** is FALSE?

- **A.** In this module, MPI_Recv is a core idea students must distinguish from nearby terms.
- **B.** MPI_Recv is correctly understood as: a blocking receive into a buffer from a source (or ANY) with a matching tag.
- **C.** MPI_Recv never blocks even if no matching send exists.
- **D.** A useful way to remember MPI_Recv is that it is not the same as “A broadcast”.

**Answer:** C
**Explanation:** The false claim is: MPI_Recv never blocks even if no matching send exists.. MPI_Recv actually means: A blocking receive into a buffer from a source (or ANY) with a matching tag.

### Q43  ·  Intermediate
**Question:** Which statement about **MPI_Reduce** is FALSE?

- **A.** In this module, MPI_Reduce is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MPI_Reduce is that it is not the same as “A broadcast”.
- **C.** Reduce leaves every rank with the full result always (that is Allreduce).
- **D.** MPI_Reduce is correctly understood as: combines values from all ranks with an op (SUM, MAX, …) into a root’s result.

**Answer:** C
**Explanation:** The false claim is: Reduce leaves every rank with the full result always (that is Allreduce).. MPI_Reduce actually means: Combines values from all ranks with an op (SUM, MAX, …) into a root’s result.

### Q44  ·  Intermediate
**Question:** Which statement about **MPI_Scatter** is FALSE?

- **A.** In this module, MPI_Scatter is a core idea students must distinguish from nearby terms.
- **B.** MPI_Scatter is correctly understood as: root distributes equal (or specified) chunks so rank i gets the i-th piece.
- **C.** Scatter is identical to Bcast.
- **D.** A useful way to remember MPI_Scatter is that it is not the same as “Everyone gets the whole array (Bcast)”.

**Answer:** C
**Explanation:** The false claim is: Scatter is identical to Bcast.. MPI_Scatter actually means: Root distributes equal (or specified) chunks so rank i gets the i-th piece.

### Q45  ·  Intermediate
**Question:** Which statement about **Tag** is FALSE?

- **A.** Tag is correctly understood as: an integer matching sends to recvs so multiple message kinds do not mix.
- **B.** Tags are ignored by MPI_Recv always.
- **C.** A useful way to remember Tag is that it is not the same as “A rank”.
- **D.** In this module, Tag is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Tags are ignored by MPI_Recv always.. Tag actually means: An integer matching sends to recvs so multiple message kinds do not mix.

### Q46  ·  Intermediate
**Question:** Which statement about **Trapezoidal rule (MPI)** is FALSE?

- **A.** A useful way to remember Trapezoidal rule (MPI) is that it is not the same as “Each rank integrates the whole [a,b] and ignores others”.
- **B.** In this module, Trapezoidal rule (MPI) is a core idea students must distinguish from nearby terms.
- **C.** Trapezoidal rule (MPI) is correctly understood as: partition [a,b] among ranks, each sums local trapezoids, then reduce the integral.
- **D.** MPI trapezoidal cannot use Reduce; only print local sums.

**Answer:** D
**Explanation:** The false claim is: MPI trapezoidal cannot use Reduce; only print local sums.. Trapezoidal rule (MPI) actually means: Partition [a,b] among ranks, each sums local trapezoids, then reduce the integral.

### Q47  ·  Intermediate
**Question:** p does not divide n trapezoids. You should:

- **A.** Scatterv / give remainder ranks one extra interval
- **B.** Force n=p always in maths
- **C.** Let rank 0 do all leftovers without documenting
- **D.** Drop leftover intervals (wrong integral)

**Answer:** A
**Explanation:** Load + correctness.

### Q48  ·  Difficult
**Question:** Allreduce SUM of rank-id on 4 ranks (0,1,2,3). Each rank’s result is:

- **A.** 6
- **B.** 3
- **C.** 4
- **D.** 0

**Answer:** A
**Explanation:** 0+1+2+3=6 on every rank.

### Q49  ·  Difficult
**Question:** Distribute a 100-vector so rank i gets 25 contiguous ints, p=4. Collective?

- **A.** Allreduce MAX
- **B.** MPI_Scatter (or Scatterv if uneven)
- **C.** Bcast
- **D.** Barrier

**Answer:** B
**Explanation:** Disjoint chunks.

### Q50  ·  Difficult
**Question:** MPI_Comm_size is 8. Legal ranks are:

- **A.** only 0
- **B.** 1 through 8
- **C.** 0 through 8
- **D.** 0 through 7

**Answer:** D
**Explanation:** Ranks are 0..size−1.

### Q51  ·  Difficult
**Question:** Odd-even transposition sort of 8 keys on 8 ranks (1 key each) needs how many odd+even phases in the worst case?

- **A.** 64
- **B.** 8
- **C.** 1
- **D.** 3

**Answer:** B
**Explanation:** p phases suffice to move a key the full diameter.

### Q52  ·  Difficult
**Question:** Rank 0 Bcasts a 1000-int array to 16 ranks. How many ranks hold the full array after a correct Bcast?

- **A.** 15
- **B.** 1000
- **C.** 16
- **D.** 1

**Answer:** C
**Explanation:** Every rank, including root, has the data.

### Q53  ·  Difficult
**Question:** Rank 3 calls Bcast with root=0 but rank 0 calls Reduce. Result?

- **A.** Automatic deadlock-free swap
- **B.** A valid datatype
- **C.** π
- **D.** Incorrect / hang / mismatch (collectives must match)

**Answer:** D
**Explanation:** All ranks must invoke the same collective consistently.

### Q54  ·  Difficult
**Question:** Safer pattern for a 2-rank swap is:

- **A.** Both Send first always
- **B.** Barrier only, no data
- **C.** Sendrecv, or Irecv/Isend then Waitall, or ordered Send/Recv by rank
- **D.** Bcast from both roots

**Answer:** C
**Explanation:** Break the cycle.

### Q55  ·  Difficult
**Question:** Sample sort’s splitters exist to:

- **A.** Partition keys so later exchanges send each key near its final rank
- **B.** Deadlock odd-even
- **C.** Replace local sort
- **D.** Compute π

**Answer:** A
**Explanation:** Global partition.

### Q56  ·  Difficult
**Question:** Send a matrix column that is not contiguous in row-major C. Prefer:

- **A.** A warp shuffle
- **B.** OpenMP atomic
- **C.** MPI_Type_vector (derived type) or pack
- **D.** MPI_Bcast of one float

**Answer:** C
**Explanation:** Strided datatype.

### Q57  ·  Difficult
**Question:** Trapezoidal on [0,1], n=10, h=?

- **A.** 1
- **B.** 0.01
- **C.** 10
- **D.** 0.1

**Answer:** D
**Explanation:** h=(b−a)/n=1/10=0.1.

### Q58  ·  Difficult
**Question:** Tree-structured Bcast among 8 ranks has how many message hops along the longest path (binomial)?

- **A.** 3
- **B.** 8
- **C.** 7
- **D.** 1

**Answer:** A
**Explanation:** log2(8)=3.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **MPI_Reduce** and **MPI_Allreduce**?

- **A.** Reduce: result on root. Allreduce: result on all ranks.
- **B.** Reduce gives every rank the answer.
- **C.** Allreduce is Bcast only.
- **D.** They ignore the op.

**Answer:** A
**Explanation:** Reduce: result on root. Allreduce: result on all ranks.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **MPI_Scatter** and **MPI_Gather**?

- **A.** Gather broadcasts.
- **B.** Scatter sums values.
- **C.** Scatter distributes from root; gather collects to root.
- **D.** Both are reductions.

**Answer:** C
**Explanation:** Scatter distributes from root; gather collects to root.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **derived datatype** and **manual pack/unpack**?

- **A.** Derived types cannot describe a column of a matrix.
- **B.** MPI forbids Type_vector.
- **C.** Types let MPI copy strided data; pack uses an intermediate buffer.
- **D.** Pack is always faster.

**Answer:** C
**Explanation:** Types let MPI copy strided data; pack uses an intermediate buffer.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **odd-even transposition sort** and **sample sort**?

- **A.** Odd-even: neighbour swaps, simple, more rounds. Sample: pick splitters, fewer fat exchanges.
- **B.** They are SIMD reductions.
- **C.** Odd-even is a collective Bcast.
- **D.** Sample sort needs no communication.

**Answer:** A
**Explanation:** Odd-even: neighbour swaps, simple, more rounds. Sample: pick splitters, fewer fat exchanges.

### Q63  ·  Difficult
**Question:** Which statement about **Count and datatype** is FALSE?

- **A.** A useful way to remember Count and datatype is that it is not the same as “Always bytes in MPI_BYTE even for doubles”.
- **B.** count=4 MPI_INT sends 4 bits.
- **C.** In this module, Count and datatype is a core idea students must distinguish from nearby terms.
- **D.** Count and datatype is correctly understood as: the payload is count elements of a given MPI datatype (MPI_INT, …).

**Answer:** B
**Explanation:** The false claim is: count=4 MPI_INT sends 4 bits.. Count and datatype actually means: The payload is count elements of a given MPI datatype (MPI_INT, …).

### Q64  ·  Difficult
**Question:** Which statement about **Deadlock (MPI)** is FALSE?

- **A.** In this module, Deadlock (MPI) is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Deadlock (MPI) is that it is not the same as “An OpenMP reduction”.
- **C.** Deadlock (MPI) is correctly understood as: a cyclic wait, e.g. two ranks each blocking in Send to the other before Recv.
- **D.** Deadlock is impossible with blocking Send/Recv.

**Answer:** D
**Explanation:** The false claim is: Deadlock is impossible with blocking Send/Recv.. Deadlock (MPI) actually means: A cyclic wait, e.g. two ranks each blocking in Send to the other before Recv.

### Q65  ·  Difficult
**Question:** Which statement about **MPI_Allreduce** is FALSE?

- **A.** Allreduce is slower than Reduce by a proven factor of |COMM| always, and cannot use trees.
- **B.** A useful way to remember MPI_Allreduce is that it is not the same as “Reduce to root only”.
- **C.** MPI_Allreduce is correctly understood as: reduce whose result is available on every rank.
- **D.** In this module, MPI_Allreduce is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Allreduce is slower than Reduce by a proven factor of |COMM| always, and cannot use trees.. MPI_Allreduce actually means: Reduce whose result is available on every rank.

### Q66  ·  Difficult
**Question:** Which statement about **MPI_Bcast** is FALSE?

- **A.** A useful way to remember MPI_Bcast is that it is not the same as “Each rank sends a unique slice to rank 0”.
- **B.** MPI_Bcast is correctly understood as: one root sends the same data to all ranks in the communicator.
- **C.** In this module, MPI_Bcast is a core idea students must distinguish from nearby terms.
- **D.** Bcast delivers different payloads to each rank by definition.

**Answer:** D
**Explanation:** The false claim is: Bcast delivers different payloads to each rank by definition.. MPI_Bcast actually means: One root sends the same data to all ranks in the communicator.

### Q67  ·  Difficult
**Question:** Which statement about **MPI_Gather** is FALSE?

- **A.** MPI_Gather is correctly understood as: each rank sends its piece; root concatenates them in rank order.
- **B.** A useful way to remember MPI_Gather is that it is not the same as “Root sends chunks out”.
- **C.** Gather discards rank order.
- **D.** In this module, MPI_Gather is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Gather discards rank order.. MPI_Gather actually means: Each rank sends its piece; root concatenates them in rank order.

### Q68  ·  Difficult
**Question:** Which statement about **MPI_Isend/Irecv** is FALSE?

- **A.** In this module, MPI_Isend/Irecv is a core idea students must distinguish from nearby terms.
- **B.** The buffer may be reused before Wait.
- **C.** MPI_Isend/Irecv is correctly understood as: non-blocking send/recv; completion via Wait/Test, used to overlap and avoid deadlock.
- **D.** A useful way to remember MPI_Isend/Irecv is that it is not the same as “Immediate destruction of the communicator”.

**Answer:** B
**Explanation:** The false claim is: The buffer may be reused before Wait.. MPI_Isend/Irecv actually means: Non-blocking send/recv; completion via Wait/Test, used to overlap and avoid deadlock.

### Q69  ·  Difficult
**Question:** Which statement about **MPI_Send** is FALSE?

- **A.** MPI_Send always returns before the match at the receiver (never buffers, never waits).
- **B.** A useful way to remember MPI_Send is that it is not the same as “A non-blocking wait-free store to shared memory”.
- **C.** In this module, MPI_Send is a core idea students must distinguish from nearby terms.
- **D.** MPI_Send is correctly understood as: a blocking send of a buffer to a destination rank with a tag (semantics depend on buffering).

**Answer:** A
**Explanation:** The false claim is: MPI_Send always returns before the match at the receiver (never buffers, never waits).. MPI_Send actually means: A blocking send of a buffer to a destination rank with a tag (semantics depend on buffering).

### Q70  ·  Difficult
**Question:** Which statement about **Parallel sorting (MPI)** is FALSE?

- **A.** A useful way to remember Parallel sorting (MPI) is that it is not the same as “A single rank qsort while others idle, called ‘parallel’”.
- **B.** Parallel sorting (MPI) is correctly understood as: distribute keys, local sort, then exchange (odd-even, sample sort, bitonic-style) across ranks.
- **C.** MPI sorting never communicates after the initial scatter.
- **D.** In this module, Parallel sorting (MPI) is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: MPI sorting never communicates after the initial scatter.. Parallel sorting (MPI) actually means: Distribute keys, local sort, then exchange (odd-even, sample sort, bitonic-style) across ranks.

### Q71  ·  Difficult
**Question:** Which statement about **Rank** is FALSE?

- **A.** In this module, Rank is a core idea students must distinguish from nearby terms.
- **B.** Ranks start at 1 and skip 0 by the standard.
- **C.** A useful way to remember Rank is that it is not the same as “A CUDA threadIdx”.
- **D.** Rank is correctly understood as: the integer ID of a process in a communicator, from 0 to size−1.

**Answer:** B
**Explanation:** The false claim is: Ranks start at 1 and skip 0 by the standard.. Rank actually means: The integer ID of a process in a communicator, from 0 to size−1.

### Q72  ·  Difficult
**Question:** Why can standard-mode MPI_Send sometimes return before the matching Recv?

- **A.** The standard forbids buffering
- **B.** Send is non-blocking Isend
- **C.** Collectives copy on the GPU
- **D.** Eager buffering in the MPI library

**Answer:** D
**Explanation:** Implementation-dependent; still unsafe to assume.

### Q73  ·  Difficult
**Question:** n=1024 trapezoids, p=8 ranks, equal split. Subintervals per rank?

- **A.** 512
- **B.** 1024
- **C.** 128
- **D.** 8

**Answer:** C
**Explanation:** 1024/8=128.

---

## Quick answer key

Q01–A | Q02–C | Q03–D | Q04–A | Q05–D | Q06–B | Q07–B | Q08–C | Q09–B | Q10–C | Q11–B | Q12–D | Q13–D | Q14–A | Q15–C | Q16–A | Q17–B | Q18–A | Q19–A | Q20–B | Q21–A | Q22–D | Q23–C | Q24–B | Q25–D | Q26–B | Q27–A | Q28–A | Q29–A | Q30–A | Q31–B | Q32–C | Q33–C | Q34–B | Q35–A | Q36–C | Q37–D | Q38–B | Q39–D | Q40–D | Q41–C | Q42–C | Q43–C | Q44–C | Q45–B | Q46–D | Q47–A | Q48–A | Q49–B | Q50–D | Q51–B | Q52–C | Q53–D | Q54–C | Q55–A | Q56–C | Q57–D | Q58–A | Q59–A | Q60–C | Q61–C | Q62–A | Q63–B | Q64–D | Q65–A | Q66–D | Q67–C | Q68–B | Q69–A | Q70–C | Q71–B | Q72–D | Q73–C
