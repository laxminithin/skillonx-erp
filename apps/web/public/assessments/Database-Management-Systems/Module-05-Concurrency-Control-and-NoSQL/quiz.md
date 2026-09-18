# Quiz — Database Management Systems — Module 5: Concurrency Control and NoSQL

**Subject:** Database Management Systems  
**Module:** Module 5 — Concurrency Control and NoSQL  
**Questions:** 74  
**Mix:** 13 Easy · 36 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** MVCC readers typically:

- **A.** Use only table locks
- **B.** Read a committed snapshot without blocking writers on the same items (in common implementations)
- **C.** Disable WAL
- **D.** Take X locks on every read

**Answer:** B
**Explanation:** Versions separate readers and writers.

### Q02  ·  Easy
**Question:** Two-phase locking guarantees:

- **A.** Conflict serializability (if 2PL is followed; deadlocks may still abort some T)
- **B.** CAP availability
- **C.** 1NF
- **D.** Freedom from deadlock

**Answer:** A
**Explanation:** 2PL ⇒ conflict serializable; deadlock is separate.

### Q03  ·  Easy
**Question:** Which is a document-oriented store?

- **A.** WAL
- **B.** A pure 3NF-only engine with no nested fields
- **C.** 2PL lock table
- **D.** MongoDB (BSON documents)

**Answer:** D
**Explanation:** MongoDB is the usual textbook example.

### Q04  ·  Easy
**Question:** Which lock mode is compatible with another shared lock on the same item?

- **A.** Exclusive (X)
- **B.** Shared (S)
- **C.** IX with a conflicting X on the same row without IS
- **D.** A table X versus a row S with no intention protocol

**Answer:** B
**Explanation:** S is compatible with S.

### Q05  ·  Easy
**Question:** Which option best describes **Document store**?

- **A.** A WAL viewer.
- **B.** A B+ tree of fixed 3NF tables only.
- **C.** A database of JSON/BSON-like documents, often keyed by _id, with flexible fields per document (for example, MongoDB).
- **D.** A graph of only edges, no properties.

**Answer:** C
**Explanation:** Document store: A database of JSON/BSON-like documents, often keyed by _id, with flexible fields per document (for example, MongoDB).

### Q06  ·  Easy
**Question:** Which option best describes **Graph database**?

- **A.** A store optimized for nodes and relationships as first-class objects (for example, Neo4j), queried by traversal.
- **B.** A key-value blob with no edges.
- **C.** SQL UNION only.
- **D.** A deadlock detector.

**Answer:** A
**Explanation:** Graph database: A store optimized for nodes and relationships as first-class objects (for example, Neo4j), queried by traversal.

### Q07  ·  Easy
**Question:** Which option best describes **Intention locks**?

- **A.** Timestamp bits.
- **B.** Locks on ancestors (IS/IX/SIX) that signal intent to lock finer grains, so table-level X can conflict correctly.
- **C.** A type of WAL record.
- **D.** Locks used only in NoSQL key-value stores.

**Answer:** B
**Explanation:** Intention locks: Locks on ancestors (IS/IX/SIX) that signal intent to lock finer grains, so table-level X can conflict correctly.

### Q08  ·  Easy
**Question:** Which option best describes **MVCC**?

- **A.** A column-family compaction only.
- **B.** Multi-version concurrency: readers see a snapshot version; writers create new versions, reducing read-write blocking.
- **C.** Storing only one version and using only X locks for reads.
- **D.** A CAP partition.

**Answer:** B
**Explanation:** MVCC: Multi-version concurrency: readers see a snapshot version; writers create new versions, reducing read-write blocking.

### Q09  ·  Easy
**Question:** Which option best describes **Shared lock (S)**?

- **A.** A checkpoint record.
- **B.** A lock that allows dirty writes by everyone.
- **C.** A read lock: multiple transactions may hold S on an item; none may hold X at the same time.
- **D.** An exclusive write lock by another name.

**Answer:** C
**Explanation:** Shared lock (S): A read lock: multiple transactions may hold S on an item; none may hold X at the same time.

### Q10  ·  Easy
**Question:** Which option best describes **Strict 2PL**?

- **A.** 2PL plus holding all exclusive locks until commit/abort (often all locks until commit).
- **B.** Releasing X locks as soon as the write is done, before commit.
- **C.** Locking only the catalog.
- **D.** Timestamp order without locks.

**Answer:** A
**Explanation:** Strict 2PL: 2PL plus holding all exclusive locks until commit/abort (often all locks until commit).

### Q11  ·  Easy
**Question:** Which option best describes **Wound-wait**?

- **A.** A view serializability test.
- **B.** The same rule as wait-die with names swapped only in documentation, not in behaviour.
- **C.** A NoSQL CAP proof.
- **D.** If Ti is older and wants a lock held by younger Tj, Ti wounds (aborts) Tj; if Ti is younger, it waits.

**Answer:** D
**Explanation:** Wound-wait: If Ti is older and wants a lock held by younger Tj, Ti wounds (aborts) Tj; if Ti is younger, it waits.

### Q12  ·  Easy
**Question:** Which sequence correctly describes **OCC phases**?

- **A.** Validate before reading any data always as the only order
- **B.** Read/compute on snapshot or local copies → validate against committed writers → write/commit or abort-retry
- **C.** Lock X on all tables at start → skip validation
- **D.** Write to disk first → then read

**Answer:** B
**Explanation:** Correct sequence for OCC phases: Read/compute on snapshot or local copies → validate against committed writers → write/commit or abort-retry

### Q13  ·  Easy
**Question:** Which sequence correctly describes **strict 2PL lock protocol**?

- **A.** Unlock everything at START
- **B.** Acquire S/X as needed in growing phase → execute ops → commit/abort → release all locks (X held till end)
- **C.** Acquire locks only in shrinking phase
- **D.** Release X right after each write, then acquire more locks

**Answer:** B
**Explanation:** Correct sequence for strict 2PL lock protocol: Acquire S/X as needed in growing phase → execute ops → commit/abort → release all locks (X held till end)

### Q14  ·  Intermediate
**Question:** CAP ‘P’ means the system continues as a distributed system when:

- **A.** A lock times out on one node only without a split
- **B.** A disk is slow
- **C.** The network partitions (messages are lost between groups)
- **D.** SQL CHECK fails

**Answer:** C
**Explanation:** Partition tolerance is about network splits.

### Q15  ·  Intermediate
**Question:** Intention lock IX on a table means:

- **A.** The transaction intends to X-lock some rows/pages in that table
- **B.** Deadlock is impossible
- **C.** No row locks will be taken
- **D.** The whole table is X-locked already

**Answer:** A
**Explanation:** IX is a warning on the ancestor.

### Q16  ·  Intermediate
**Question:** LMS stores heterogeneous assignment JSON (quiz vs file upload). A natural model is:

- **A.** Exclusive locks as storage
- **B.** A document store with flexible schemas per type
- **C.** CAP partitions as a data model
- **D.** A single 3NF cell with repeating groups violating 1NF as the only SQL option

**Answer:** B
**Explanation:** Documents fit variable shape.

### Q17  ·  Intermediate
**Question:** Library system: T_borrow waits for T_reserve, T_reserve waits for T_borrow. The wait-for graph shows:

- **A.** Deadlock; need abort, timeout, or prevention
- **B.** MVCC snapshot by itself
- **C.** A document _id collision
- **D.** A serializable 2PL success

**Answer:** A
**Explanation:** Cycle ⇒ deadlock.

### Q18  ·  Intermediate
**Question:** RFID tap ingest is write-heavy with rare conflicts. OCC may fit because:

- **A.** OCC requires deadlock cycles
- **B.** Validation at commit is cheap when conflicts are rare
- **C.** OCC is 2PL
- **D.** OCC never aborts even if everyone writes the same key

**Answer:** B
**Explanation:** Optimistic shines under low conflict.

### Q19  ·  Intermediate
**Question:** Strict 2PL is used mainly to ensure:

- **A.** That NoSQL is unused
- **B.** Cascadeless (no dirty reads of uncommitted writes) recoverability behaviour
- **C.** That phantoms are required
- **D.** That timestamps are unique

**Answer:** B
**Explanation:** X locks until commit prevent reading uncommitted writes.

### Q20  ·  Intermediate
**Question:** Two faculty update different students’ IA in the same MARKS table under row-level locks. They should:

- **A.** Proceed concurrently (different rows, compatible)
- **B.** Block as if a table X lock were mandatory
- **C.** Abort due to 2PL shrinking
- **D.** Deadlock always

**Answer:** A
**Explanation:** Row granularity allows concurrency.

### Q21  ·  Intermediate
**Question:** Wait-die prevention: a younger transaction requesting a lock held by an older one will:

- **A.** Abort (die) and typically restart with the same timestamp
- **B.** Wound the older
- **C.** Upgrade to table lock
- **D.** Wait

**Answer:** A
**Explanation:** Young dies; old waits.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **2PL** and **timestamp ordering**?

- **A.** They are identical wait-die rules.
- **B.** 2PL uses locks and may deadlock; TSO uses timestamps and aborts out-of-order operations, avoiding wait-for cycles of locks.
- **C.** TSO is a lock mode.
- **D.** 2PL never waits.

**Answer:** B
**Explanation:** 2PL uses locks and may deadlock; TSO uses timestamps and aborts out-of-order operations, avoiding wait-for cycles of locks.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **SQL RDBMS** and **document NoSQL**?

- **A.** They differ only in GUI colour.
- **B.** RDBMS: rigid schema, rich joins, ACID by default; documents: flexible schema, denormalized aggregates, often simpler scale-out.
- **C.** SQL cannot have transactions.
- **D.** Documents forbid indexes.

**Answer:** B
**Explanation:** RDBMS: rigid schema, rich joins, ACID by default; documents: flexible schema, denormalized aggregates, often simpler scale-out.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **key-value** and **graph store**?

- **A.** Key-value: lookup by key; graph: traverse relationships as native edges.
- **B.** They are both BCNF decompositions.
- **C.** Graph APIs are only GET(key).
- **D.** Key-value stores store only nodes and typed edges.

**Answer:** A
**Explanation:** Key-value: lookup by key; graph: traverse relationships as native edges.

### Q25  ·  Intermediate
**Question:** What is the most important distinction between **pessimistic CC** and **optimistic CC**?

- **A.** OCC uses only X locks from the start.
- **B.** Pessimistic acquires locks (or equivalent) during execution; optimistic validates at commit and aborts on conflict.
- **C.** They are CAP choices.
- **D.** Pessimistic never waits.

**Answer:** B
**Explanation:** Pessimistic acquires locks (or equivalent) during execution; optimistic validates at commit and aborts on conflict.

### Q26  ·  Intermediate
**Question:** Which option best describes **CAP theorem**?

- **A.** A normal form.
- **B.** A proof that 2PL is impossible.
- **C.** In a partition, a distributed system cannot simultaneously be fully available and fully consistent; designers trade C vs A.
- **D.** An SQL JOIN type.

**Answer:** C
**Explanation:** CAP theorem: In a partition, a distributed system cannot simultaneously be fully available and fully consistent; designers trade C vs A.

### Q27  ·  Intermediate
**Question:** Which option best describes **Column-family store**?

- **A.** A 2PL variant.
- **B.** Wide-column systems (Cassandra/HBase style) storing sparse columns grouped in families, keyed by row key.
- **C.** A pure ER diagram tool.
- **D.** MVCC without storage.

**Answer:** B
**Explanation:** Column-family store: Wide-column systems (Cassandra/HBase style) storing sparse columns grouped in families, keyed by row key.

### Q28  ·  Intermediate
**Question:** Which option best describes **Deadlock**?

- **A.** A BCNF violation.
- **B.** A checkpoint.
- **C.** A serializable schedule.
- **D.** A cycle of transactions waiting for each other’s locks, so none can proceed.

**Answer:** D
**Explanation:** Deadlock: A cycle of transactions waiting for each other’s locks, so none can proceed.

### Q29  ·  Intermediate
**Question:** Which option best describes **Exclusive lock (X)**?

- **A.** A lock used only for SELECT.
- **B.** A write lock: only one transaction may hold X, and it conflicts with both S and X.
- **C.** A lock that allows concurrent writers.
- **D.** A NoSQL shard key.

**Answer:** B
**Explanation:** Exclusive lock (X): A write lock: only one transaction may hold X, and it conflicts with both S and X.

### Q30  ·  Intermediate
**Question:** Which option best describes **Key-value store**?

- **A.** A map from opaque keys to blobs/values, with get/put as the primary API (for example, Redis, Dynamo-style).
- **B.** SQL GROUP BY as the only API.
- **C.** A graph query language.
- **D.** EER specialization.

**Answer:** A
**Explanation:** Key-value store: A map from opaque keys to blobs/values, with get/put as the primary API (for example, Redis, Dynamo-style).

### Q31  ·  Intermediate
**Question:** Which option best describes **Lock granularity**?

- **A.** The number of NoSQL replicas.
- **B.** The size of lockable items (DB, table, page, row, field); coarser means fewer locks, more conflict.
- **C.** A hash function.
- **D.** The degree of a relation.

**Answer:** B
**Explanation:** Lock granularity: The size of lockable items (DB, table, page, row, field); coarser means fewer locks, more conflict.

### Q32  ·  Intermediate
**Question:** Which option best describes **NoSQL**?

- **A.** A family of non-relational stores (key-value, document, column-family, graph) often schema-flexible and scale-out.
- **B.** A synonym for BCNF.
- **C.** A lock manager.
- **D.** SQL with more CHECK constraints.

**Answer:** A
**Explanation:** NoSQL: A family of non-relational stores (key-value, document, column-family, graph) often schema-flexible and scale-out.

### Q33  ·  Intermediate
**Question:** Which option best describes **Optimistic CC / validation**?

- **A.** WAL checkpoints.
- **B.** Transactions run without locks, then validate (certify) before commit; abort if conflicts occurred.
- **C.** Pessimistic X locks on every read.
- **D.** Deadlock wait-for graphs as the only method.

**Answer:** B
**Explanation:** Optimistic CC / validation: Transactions run without locks, then validate (certify) before commit; abort if conflicts occurred.

### Q34  ·  Intermediate
**Question:** Which option best describes **Thomas’ write rule**?

- **A.** Ignore an obsolete write if a later timestamp has already written the item, instead of aborting in some TSO protocols.
- **B.** Always abort the later writer.
- **C.** A document _id rule.
- **D.** A 2PL growing phase.

**Answer:** A
**Explanation:** Thomas’ write rule: Ignore an obsolete write if a later timestamp has already written the item, instead of aborting in some TSO protocols.

### Q35  ·  Intermediate
**Question:** Which option best describes **Timestamp ordering**?

- **A.** Graph databases only.
- **B.** A lock compatibility matrix.
- **C.** WAL only.
- **D.** Each transaction has a timestamp; conflicting operations are ordered by timestamps, aborting violators rather than locking in 2PL style.

**Answer:** D
**Explanation:** Timestamp ordering: Each transaction has a timestamp; conflicting operations are ordered by timestamps, aborting violators rather than locking in 2PL style.

### Q36  ·  Intermediate
**Question:** Which option best describes **Two-phase locking (2PL)**?

- **A.** 2PL is a recovery algorithm.
- **B.** Growing phase acquires locks; shrinking phase only releases; a transaction never acquires after it has released any lock.
- **C.** 2PL is a NoSQL data model.
- **D.** Locks may be acquired after unlocks freely.

**Answer:** B
**Explanation:** Two-phase locking (2PL): Growing phase acquires locks; shrinking phase only releases; a transaction never acquires after it has released any lock.

### Q37  ·  Intermediate
**Question:** Which option best describes **Wait-die**?

- **A.** A deadlock-prevention scheme: if Ti (older) waits for Tj, wait; if Ti is younger, Ti is aborted (dies).
- **B.** A timestamp Thomas write rule.
- **C.** Younger transactions always wait; older always abort.
- **D.** An isolation level.

**Answer:** A
**Explanation:** Wait-die: A deadlock-prevention scheme: if Ti (older) waits for Tj, wait; if Ti is younger, Ti is aborted (dies).

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **CAP decision under partition**?

- **A.** Disable all replicas
- **B.** Switch to 1NF
- **C.** Keep C and A and P together without trade-off
- **D.** Detect partition → choose to refuse some requests (keep C) or serve possibly stale/divergent data (keep A) → repair after heal

**Answer:** D
**Explanation:** Correct sequence for CAP decision under partition: Detect partition → choose to refuse some requests (keep C) or serve possibly stale/divergent data (keep A) → repair after heal

### Q39  ·  Intermediate
**Question:** Which sequence correctly describes **deadlock detection**?

- **A.** Abort every waiting transaction immediately without a graph
- **B.** Build wait-for graph from lock waits → detect cycle → abort a victim → grant waiters
- **C.** Ignore cycles until shutdown
- **D.** Upgrade all S locks to X

**Answer:** B
**Explanation:** Correct sequence for deadlock detection: Build wait-for graph from lock waits → detect cycle → abort a victim → grant waiters

### Q40  ·  Intermediate
**Question:** Which statement about **CAP theorem** is FALSE?

- **A.** CAP theorem is correctly understood as: in a partition, a distributed system cannot simultaneously be fully available and fully consistent; designers trade C vs A.
- **B.** In this module, CAP theorem is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember CAP theorem is that it is not the same as “A proof that 2PL is impossible”.
- **D.** CAP says you can always have consistency, availability and partition tolerance together in an asynchronous network.

**Answer:** D
**Explanation:** The false claim is: CAP says you can always have consistency, availability and partition tolerance together in an asynchronous network.. CAP theorem actually means: In a partition, a distributed system cannot simultaneously be fully available and fully consistent; designers trade C vs A.

### Q41  ·  Intermediate
**Question:** Which statement about **Deadlock** is FALSE?

- **A.** In this module, Deadlock is a core idea students must distinguish from nearby terms.
- **B.** Deadlock is impossible under 2PL.
- **C.** A useful way to remember Deadlock is that it is not the same as “A serializable schedule”.
- **D.** Deadlock is correctly understood as: a cycle of transactions waiting for each other’s locks, so none can proceed.

**Answer:** B
**Explanation:** The false claim is: Deadlock is impossible under 2PL.. Deadlock actually means: A cycle of transactions waiting for each other’s locks, so none can proceed.

### Q42  ·  Intermediate
**Question:** Which statement about **Graph database** is FALSE?

- **A.** Graph database is correctly understood as: a store optimized for nodes and relationships as first-class objects (for example, Neo4j), queried by traversal.
- **B.** Graph databases cannot represent relationships; they only store JSON documents.
- **C.** In this module, Graph database is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Graph database is that it is not the same as “A key-value blob with no edges”.

**Answer:** B
**Explanation:** The false claim is: Graph databases cannot represent relationships; they only store JSON documents.. Graph database actually means: A store optimized for nodes and relationships as first-class objects (for example, Neo4j), queried by traversal.

### Q43  ·  Intermediate
**Question:** Which statement about **Intention locks** is FALSE?

- **A.** Intention locks is correctly understood as: locks on ancestors (IS/IX/SIX) that signal intent to lock finer grains, so table-level X can conflict correctly.
- **B.** In this module, Intention locks is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Intention locks is that it is not the same as “Locks used only in NoSQL key-value stores”.
- **D.** Without intention locks, a row lock and a table lock can be acquired independently with no conflict detection.

**Answer:** D
**Explanation:** The false claim is: Without intention locks, a row lock and a table lock can be acquired independently with no conflict detection.. Intention locks actually means: Locks on ancestors (IS/IX/SIX) that signal intent to lock finer grains, so table-level X can conflict correctly.

### Q44  ·  Intermediate
**Question:** Which statement about **Key-value store** is FALSE?

- **A.** Key-value stores require joins of many tables to fetch one value by key.
- **B.** In this module, Key-value store is a core idea students must distinguish from nearby terms.
- **C.** Key-value store is correctly understood as: a map from opaque keys to blobs/values, with get/put as the primary API (for example, Redis, Dynamo-style).
- **D.** A useful way to remember Key-value store is that it is not the same as “A graph query language”.

**Answer:** A
**Explanation:** The false claim is: Key-value stores require joins of many tables to fetch one value by key.. Key-value store actually means: A map from opaque keys to blobs/values, with get/put as the primary API (for example, Redis, Dynamo-style).

### Q45  ·  Intermediate
**Question:** Which statement about **Optimistic CC / validation** is FALSE?

- **A.** OCC never aborts and always commits after the read phase.
- **B.** A useful way to remember Optimistic CC / validation is that it is not the same as “Pessimistic X locks on every read”.
- **C.** Optimistic CC / validation is correctly understood as: transactions run without locks, then validate (certify) before commit; abort if conflicts occurred.
- **D.** In this module, Optimistic CC / validation is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: OCC never aborts and always commits after the read phase.. Optimistic CC / validation actually means: Transactions run without locks, then validate (certify) before commit; abort if conflicts occurred.

### Q46  ·  Intermediate
**Question:** Which statement about **Shared lock (S)** is FALSE?

- **A.** In this module, Shared lock (S) is a core idea students must distinguish from nearby terms.
- **B.** Shared lock (S) is correctly understood as: a read lock: multiple transactions may hold S on an item; none may hold X at the same time.
- **C.** Shared locks are compatible with exclusive locks on the same item.
- **D.** A useful way to remember Shared lock (S) is that it is not the same as “A lock that allows dirty writes by everyone”.

**Answer:** C
**Explanation:** The false claim is: Shared locks are compatible with exclusive locks on the same item.. Shared lock (S) actually means: A read lock: multiple transactions may hold S on an item; none may hold X at the same time.

### Q47  ·  Intermediate
**Question:** Which statement about **Thomas’ write rule** is FALSE?

- **A.** A useful way to remember Thomas’ write rule is that it is not the same as “Always abort the later writer”.
- **B.** Thomas’ write rule forbids ignoring any write.
- **C.** Thomas’ write rule is correctly understood as: ignore an obsolete write if a later timestamp has already written the item, instead of aborting in some TSO protocols.
- **D.** In this module, Thomas’ write rule is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Thomas’ write rule forbids ignoring any write.. Thomas’ write rule actually means: Ignore an obsolete write if a later timestamp has already written the item, instead of aborting in some TSO protocols.

### Q48  ·  Intermediate
**Question:** Which statement about **Two-phase locking (2PL)** is FALSE?

- **A.** Two-phase locking (2PL) is correctly understood as: growing phase acquires locks; shrinking phase only releases; a transaction never acquires after it has released any lock.
- **B.** A useful way to remember Two-phase locking (2PL) is that it is not the same as “Locks may be acquired after unlocks freely”.
- **C.** 2PL allows lock upgrade after the first unlock in the shrinking phase.
- **D.** In this module, Two-phase locking (2PL) is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: 2PL allows lock upgrade after the first unlock in the shrinking phase.. Two-phase locking (2PL) actually means: Growing phase acquires locks; shrinking phase only releases; a transaction never acquires after it has released any lock.

### Q49  ·  Intermediate
**Question:** Which statement about **Wound-wait** is FALSE?

- **A.** In this module, Wound-wait is a core idea students must distinguish from nearby terms.
- **B.** Wound-wait never aborts the younger lock holder.
- **C.** A useful way to remember Wound-wait is that it is not the same as “The same rule as wait-die with names swapped only in documentation, not in behaviour”.
- **D.** Wound-wait is correctly understood as: if Ti is older and wants a lock held by younger Tj, Ti wounds (aborts) Tj; if Ti is younger, it waits.

**Answer:** B
**Explanation:** The false claim is: Wound-wait never aborts the younger lock holder.. Wound-wait actually means: If Ti is older and wants a lock held by younger Tj, Ti wounds (aborts) Tj; if Ti is younger, it waits.

### Q50  ·  Difficult
**Question:** A document collection stores 5,000 student JSON docs, replication factor 3. How many physical copies of the data set (ignoring padding)?

- **A.** 3
- **B.** 8,000
- **C.** 5,000
- **D.** 15,000 document copies

**Answer:** D
**Explanation:** 5,000 × 3 = 15,000.

### Q51  ·  Difficult
**Question:** A long analytics COUNT over attendance should not block IA entry. A good approach is:

- **A.** A table X lock for the count
- **B.** MVCC snapshot reads (or row S locks of short duration, not table X)
- **C.** READ UNCOMMITTED dirty marks as the only option required by theory
- **D.** Disable logging

**Answer:** B
**Explanation:** Readers see versions; writers proceed.

### Q52  ·  Difficult
**Question:** During a network split, the attendance cluster keeps accepting writes on both sides. This prefers:

- **A.** Linearizability on both partitions without conflict
- **B.** BCNF
- **C.** Availability over strong consistency (AP in CAP)
- **D.** 2PL global serializability without a quorum

**Answer:** C
**Explanation:** Classic CAP trade-off under partition.

### Q53  ·  Difficult
**Question:** Hostel allocation needs rich ‘who lives with whom’ queries. A natural NoSQL family is:

- **A.** Lock tables
- **B.** A graph database of students and rooms as nodes/edges
- **C.** A pure key-value blob with no scan API for relationships
- **D.** WAL files as the database

**Answer:** B
**Explanation:** Relationships are first-class in graphs.

### Q54  ·  Difficult
**Question:** Lock compatibility: T1 holds S(A). T2 requests X(A). Result?

- **A.** T1 is upgraded automatically
- **B.** Both abort at once always
- **C.** T2 waits (or is blocked)
- **D.** T2 is granted immediately

**Answer:** C
**Explanation:** S and X conflict.

### Q55  ·  Difficult
**Question:** Snapshot isolation can still allow write skew. This means:

- **A.** SI forbids all concurrent writes
- **B.** SI is not identical to full serializability for all constraints
- **C.** SI is stricter than conflict serializability always
- **D.** SI is 2PL

**Answer:** B
**Explanation:** Classic SI anomaly.

### Q56  ·  Difficult
**Question:** T1 holds X(A). T2 requests S(A). Result?

- **A.** T2 granted S concurrently
- **B.** T2 waits
- **C.** T1’s X becomes S
- **D.** Deadlock immediately without a cycle

**Answer:** B
**Explanation:** X conflicts with S.

### Q57  ·  Difficult
**Question:** T1 unlocked A then later requests B in 2PL. This violates:

- **A.** Thomas’ write rule
- **B.** 1NF
- **C.** CAP availability
- **D.** The two-phase rule (no lock after unlock)

**Answer:** D
**Explanation:** Growing then shrinking, never mixed.

### Q58  ·  Difficult
**Question:** Thomas’ write rule applied to a late write W_i(X) when ts(i) < W-timestamp(X) means:

- **A.** X is deleted
- **B.** The write is ignored (obsolete) rather than aborting Ti in that protocol variant
- **C.** The database rolls back all committed T
- **D.** Ti must take an X lock under 2PL

**Answer:** B
**Explanation:** Obsolete writes can be skipped.

### Q59  ·  Difficult
**Question:** Wait-die: T1 ts=10 (older) wants lock held by T2 ts=20. T1 will:

- **A.** Ignore timestamps
- **B.** Die (abort T1)
- **C.** Wait
- **D.** Wound T2 only if younger waits

**Answer:** C
**Explanation:** Older waits for younger in wait-die.

### Q60  ·  Difficult
**Question:** Wait-for: T1 waits for T2, T2 waits for T3, T3 waits for T1. Deadlock among how many transactions?

- **A.** 0
- **B.** 1
- **C.** 2 only
- **D.** 3

**Answer:** D
**Explanation:** A 3-cycle.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **consistency (CAP)** and **availability (CAP)**?

- **A.** C: every read sees the latest agreed write; A: every request gets a (non-error) response, even during partition.
- **B.** They are the same letter.
- **C.** Availability is 3NF.
- **D.** CAP consistency is ACID isolation.

**Answer:** A
**Explanation:** C: every read sees the latest agreed write; A: every request gets a (non-error) response, even during partition.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **row lock** and **table lock**?

- **A.** Granularity does not affect concurrency.
- **B.** Table locks are finer than row locks.
- **C.** Row locks allow concurrent access to different rows; a table X lock serializes all access to that table.
- **D.** Row locks always deadlock more than table locks by law.

**Answer:** C
**Explanation:** Row locks allow concurrent access to different rows; a table X lock serializes all access to that table.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **shared lock** and **exclusive lock**?

- **A.** They are intention modes only.
- **B.** X is compatible with S.
- **C.** S is for writes.
- **D.** S for reads, compatible with S; X for writes, incompatible with S and X.

**Answer:** D
**Explanation:** S for reads, compatible with S; X for writes, incompatible with S and X.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **wait-die** and **wound-wait**?

- **A.** Wait-die: younger dies, older waits. Wound-wait: older aborts younger, younger waits. Both use timestamps to prevent deadlock.
- **B.** Wait-die wounds the holder.
- **C.** They are MVCC snapshot names.
- **D.** They ignore transaction age.

**Answer:** A
**Explanation:** Wait-die: younger dies, older waits. Wound-wait: older aborts younger, younger waits. Both use timestamps to prevent deadlock.

### Q65  ·  Difficult
**Question:** Which statement about **Column-family store** is FALSE?

- **A.** Column-family stores are the same as normalized 3NF SQL with mandatory JOINs for every attribute.
- **B.** In this module, Column-family store is a core idea students must distinguish from nearby terms.
- **C.** Column-family store is correctly understood as: wide-column systems (Cassandra/HBase style) storing sparse columns grouped in families, keyed by row key.
- **D.** A useful way to remember Column-family store is that it is not the same as “A pure ER diagram tool”.

**Answer:** A
**Explanation:** The false claim is: Column-family stores are the same as normalized 3NF SQL with mandatory JOINs for every attribute.. Column-family store actually means: Wide-column systems (Cassandra/HBase style) storing sparse columns grouped in families, keyed by row key.

### Q66  ·  Difficult
**Question:** Which statement about **Document store** is FALSE?

- **A.** Document stores cannot have indexes or secondary keys.
- **B.** In this module, Document store is a core idea students must distinguish from nearby terms.
- **C.** Document store is correctly understood as: a database of JSON/BSON-like documents, often keyed by _id, with flexible fields per document (for example, MongoDB).
- **D.** A useful way to remember Document store is that it is not the same as “A B+ tree of fixed 3NF tables only”.

**Answer:** A
**Explanation:** The false claim is: Document stores cannot have indexes or secondary keys.. Document store actually means: A database of JSON/BSON-like documents, often keyed by _id, with flexible fields per document (for example, MongoDB).

### Q67  ·  Difficult
**Question:** Which statement about **Exclusive lock (X)** is FALSE?

- **A.** Exclusive locks are compatible with shared locks.
- **B.** Exclusive lock (X) is correctly understood as: a write lock: only one transaction may hold X, and it conflicts with both S and X.
- **C.** In this module, Exclusive lock (X) is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Exclusive lock (X) is that it is not the same as “A lock that allows concurrent writers”.

**Answer:** A
**Explanation:** The false claim is: Exclusive locks are compatible with shared locks.. Exclusive lock (X) actually means: A write lock: only one transaction may hold X, and it conflicts with both S and X.

### Q68  ·  Difficult
**Question:** Which statement about **Lock granularity** is FALSE?

- **A.** In this module, Lock granularity is a core idea students must distinguish from nearby terms.
- **B.** Finer granularity always means fewer lock requests and more false conflicts.
- **C.** A useful way to remember Lock granularity is that it is not the same as “The number of NoSQL replicas”.
- **D.** Lock granularity is correctly understood as: the size of lockable items (DB, table, page, row, field); coarser means fewer locks, more conflict.

**Answer:** B
**Explanation:** The false claim is: Finer granularity always means fewer lock requests and more false conflicts.. Lock granularity actually means: The size of lockable items (DB, table, page, row, field); coarser means fewer locks, more conflict.

### Q69  ·  Difficult
**Question:** Which statement about **MVCC** is FALSE?

- **A.** MVCC is correctly understood as: multi-version concurrency: readers see a snapshot version; writers create new versions, reducing read-write blocking.
- **B.** MVCC requires readers to take exclusive locks on every row they read.
- **C.** A useful way to remember MVCC is that it is not the same as “Storing only one version and using only X locks for reads”.
- **D.** In this module, MVCC is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: MVCC requires readers to take exclusive locks on every row they read.. MVCC actually means: Multi-version concurrency: readers see a snapshot version; writers create new versions, reducing read-write blocking.

### Q70  ·  Difficult
**Question:** Which statement about **NoSQL** is FALSE?

- **A.** A useful way to remember NoSQL is that it is not the same as “A synonym for BCNF”.
- **B.** In this module, NoSQL is a core idea students must distinguish from nearby terms.
- **C.** NoSQL is correctly understood as: a family of non-relational stores (key-value, document, column-family, graph) often schema-flexible and scale-out.
- **D.** NoSQL systems are required to be fully ACID on multi-shard joins always.

**Answer:** D
**Explanation:** The false claim is: NoSQL systems are required to be fully ACID on multi-shard joins always.. NoSQL actually means: A family of non-relational stores (key-value, document, column-family, graph) often schema-flexible and scale-out.

### Q71  ·  Difficult
**Question:** Which statement about **Strict 2PL** is FALSE?

- **A.** A useful way to remember Strict 2PL is that it is not the same as “Releasing X locks as soon as the write is done, before commit”.
- **B.** Strict 2PL is correctly understood as: 2PL plus holding all exclusive locks until commit/abort (often all locks until commit).
- **C.** Strict 2PL releases write locks before commit, allowing dirty reads of its writes.
- **D.** In this module, Strict 2PL is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Strict 2PL releases write locks before commit, allowing dirty reads of its writes.. Strict 2PL actually means: 2PL plus holding all exclusive locks until commit/abort (often all locks until commit).

### Q72  ·  Difficult
**Question:** Which statement about **Timestamp ordering** is FALSE?

- **A.** A useful way to remember Timestamp ordering is that it is not the same as “A lock compatibility matrix”.
- **B.** Timestamp ordering uses S/X locks as its only mechanism and never aborts.
- **C.** Timestamp ordering is correctly understood as: each transaction has a timestamp; conflicting operations are ordered by timestamps, aborting violators rather than locking in 2PL style.
- **D.** In this module, Timestamp ordering is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Timestamp ordering uses S/X locks as its only mechanism and never aborts.. Timestamp ordering actually means: Each transaction has a timestamp; conflicting operations are ordered by timestamps, aborting violators rather than locking in 2PL style.

### Q73  ·  Difficult
**Question:** Which statement about **Wait-die** is FALSE?

- **A.** A useful way to remember Wait-die is that it is not the same as “Younger transactions always wait; older always abort”.
- **B.** Wait-die is correctly understood as: a deadlock-prevention scheme: if Ti (older) waits for Tj, wait; if Ti is younger, Ti is aborted (dies).
- **C.** Wait-die lets a younger transaction wait for an older one while the older dies.
- **D.** In this module, Wait-die is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Wait-die lets a younger transaction wait for an older one while the older dies.. Wait-die actually means: A deadlock-prevention scheme: if Ti (older) waits for Tj, wait; if Ti is younger, Ti is aborted (dies).

### Q74  ·  Difficult
**Question:** Wound-wait: T1 ts=10 wants lock held by T2 ts=20. T1 will:

- **A.** Die
- **B.** Grant a compatible X to both
- **C.** Wait as younger
- **D.** Wound (abort) T2 and take the lock (after T2 abort)

**Answer:** D
**Explanation:** Older wounds younger.

---

## Quick answer key

Q01–B | Q02–A | Q03–D | Q04–B | Q05–C | Q06–A | Q07–B | Q08–B | Q09–C | Q10–A | Q11–D | Q12–B | Q13–B | Q14–C | Q15–A | Q16–B | Q17–A | Q18–B | Q19–B | Q20–A | Q21–A | Q22–B | Q23–B | Q24–A | Q25–B | Q26–C | Q27–B | Q28–D | Q29–B | Q30–A | Q31–B | Q32–A | Q33–B | Q34–A | Q35–D | Q36–B | Q37–A | Q38–D | Q39–B | Q40–D | Q41–B | Q42–B | Q43–D | Q44–A | Q45–A | Q46–C | Q47–B | Q48–C | Q49–B | Q50–D | Q51–B | Q52–C | Q53–B | Q54–C | Q55–B | Q56–B | Q57–D | Q58–B | Q59–C | Q60–D | Q61–A | Q62–C | Q63–D | Q64–A | Q65–A | Q66–A | Q67–A | Q68–B | Q69–B | Q70–D | Q71–C | Q72–B | Q73–C | Q74–D
