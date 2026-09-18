# Assignment — Database Management Systems — Module 5 — Concurrency Control and NoSQL

**Subject:** Database Management Systems  
**Module:** Module 5 — Concurrency Control and NoSQL  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 319 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain shared and exclusive locks and the compatibility matrix.

**Expected Key Points:**
- S-S compatible; S-X and X-X not.
- Reads share; a writer needs exclusive access.
- A transaction upgrading S to X can deadlock with another upgrader (the infamous upgrade deadlock).
- Intention modes extend this to multiple granularities.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** State the two-phase locking protocol. Why shrinking cannot acquire locks?

**Expected Key Points:**
- All acquires before any release.
- If a lock were acquired after a release, a cycle of conflicts could appear that 2PL’s proof forbids—serializability could break.
- Growing then shrinking yields an acyclic conflict graph among committed 2PL transactions.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define deadlock. Give a two-transaction campus example.

**Expected Key Points:**
- T_exam holds lock on SEATING and waits for MARKS; T_marks holds MARKS and waits for SEATING.
- Neither proceeds.
- Detection uses a wait-for cycle; prevention uses timestamps (wait-die/wound-wait) or timeouts.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four lock granularities and one advantage each.

**Expected Key Points:**
- Database: simple, terrible concurrency.
- Table: easy admin, blocks all rows.
- Page: fewer locks than row, false conflicts on neighbours.
- Row: high concurrency, more lock-manager memory.
- Field/column rare.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is MVCC? Why do readers often not block writers?

**Expected Key Points:**
- Multiple versions of a row exist, stamped by transaction/snapshot ids.
- A reader sees a snapshot valid as of its start.
- Writers create a new version.
- Trade-off: extra storage, vacuum/cleanup, and possible write-skew under snapshot isolation.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Name four NoSQL categories with one example system or use each.

**Expected Key Points:**
- Key-value: Redis sessions.
- Document: MongoDB LMS submissions.
- Column-family: Cassandra time-series Wi-Fi logs.
- Graph: Neo4j prerequisite/club networks.
- Hybrid/multi-model exists; pick the access pattern first.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State CAP theorem in one paragraph for a 3-node attendance cluster.

**Expected Key Points:**
- When a partition splits nodes, you cannot offer both linearizable consistency and uninterrupted availability.
- Choose CP: reject writes on the minority.
- Choose AP: accept writes that may conflict and merge later.
- P is not optional on real networks.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare wait-die and wound-wait. Which aborts more young transactions in a lock-heavy exam portal?

**Expected Key Points:**
- Wait-die aborts the young requester; the young restartee may die repeatedly if it stays young relative to holders—usually restart with original timestamp to avoid starvation.
- Wound-wait aborts young holders when old requesters arrive—more preemption.
- Exam portals with long T may prefer wait-die to not wound a nearly done marks commit, depending on load.
- Discuss starvation handling.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain strict 2PL vs rigorous 2PL vs basic 2PL.

**Expected Key Points:**
- Basic 2PL: unlock allowed in shrinking even for X before commit ⇒ dirty reads possible.
- Strict: hold X till commit (cascadeless).
- Rigorous: hold S and X till commit (simple, easy recovery, less concurrency for readers).
- Most teaching ERPs assume strict/rigorous.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** T1 ts=5 holds X(A). T2 ts=8 requests A under (i) wait-die (ii) wound-wait. State actions. Then T3 ts=3 requests A held by T2 after T2 waited or restarted—trace one legal story.

**Expected Key Points:**
- (i) T2 younger than T1 ⇒ T2 dies.
- (ii) T2 younger ⇒ T2 waits.
- If T2 died and restarts with ts=8 still, it may die again while T1 runs.
- If T3 (older) requests while T2 holds in wound-wait, T3 wounds T2.
- Keep timestamps consistent in the narrative.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare 2PL and timestamp ordering regarding blocking vs restart.

**Expected Key Points:**
- 2PL blocks, risking deadlock; TSO rejects late operations by abort/restart, no lock deadlock, but restart storms possible.
- Thomas’ write rule reduces some aborts.
- Hybrid systems exist.
- Isolation vs throughput depends on conflict rate.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO2
**Question:** Choose SQL vs MongoDB vs a graph DB for (a) fee ledgers, (b) LMS submissions, (c) club membership ‘friends of friends’.

**Expected Key Points:**
- (a) SQL/ACID: money and constraints.
- (b) Document: variable payload, indexes on usn/assignmentId.
- (c) Graph: multi-hop membership.
- Justify CAP: fees want C; LMS can be AP with replica lag; graphs often single-primary for consistency of traversals.
- Polyglot persistence is acceptable.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** What are intention locks? Show why a table X lock must conflict with a row S lock.

**Expected Key Points:**
- Without IS/IX on the table, the lock manager might grant table X while a row S exists, or vice versa, because they are different objects.
- IX on table plus X on row, or IS plus S on row, lets an incoming table X see the intent and wait.
- Hierarchy is required for multiple granularity.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO4
**Question:** On paper, run two transactions under strict 2PL on MARKS rows of two USNs, then a third that updates the same USN as T1. Show lock table and a deadlock-free order.

**Expected Key Points:**
- T1: S/X on USN-A, update, commit, release.
- T3 waits for X on USN-A until T1 commit.
- T2 proceeds on USN-B in parallel.
- If both T1 and T3 also touch a shared TOTALS row, show a possible deadlock and a victim abort.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design concurrency control for VVIET: OLTP marks entry vs long reporting. Mix strict 2PL/MVCC, isolation levels, and deadlock policy.

**Expected Key Points:**
- OLTP: row-level strict 2PL or MVCC+row writes, READ COMMITTED or snapshot, deadlock detection with timeout.
- Reporting: snapshot isolation / repeatable read on a replica so it does not X-lock OLTP.
- Avoid long transactions.
- Document write-skew risks if using SI for seat allocation.
- Log WAL as in Module 4.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** ‘NoSQL means no schema and no correctness.’ Critique for an institute document store of official circulars.

**Expected Key Points:**
- Schema flexibility ≠ no validation: JSON Schema, required fields, unique indexes on circular_id.
- Multi-document updates may lack ACID unless transactions (MongoDB sessions) or single-document atomicity is designed in.
- CAP: official circulars want consistent reads—prefer majority write concern.
- NoSQL is a design choice, not an excuse.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write an essay on lock granularity and intention locks, including a worked example of a table scan vs a point update.

**Expected Key Points:**
- A table-level S for full scan conflicts with IX+X of a point updater—the updater waits or the scan waits.
- Row locks would allow the update of a non-overlapping row during a scan if the scan used row S, at the cost of many locks; the scan might instead take table S.
- Intention locks make the conflict visible at the table node.
- Choose granularity from workload: analytics vs OLTP.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** Attendance cluster of 3 replicas. A partition isolates one node. Specify CP vs AP behaviour and a repair plan.

**Expected Key Points:**
- majority quorum): the singleton refuses writes; clients retry on the majority.
- AP: singleton accepts offline taps, vector clocks/version lists, merge on heal (last-write-wins risks lost taps).
- Prefer CP for official attendance; buffer client-side if needed.
- After heal: anti-entropy, conflict report for duplicate taps.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Lock requests: T1 S(A), T2 S(A), T3 X(A), T1 X(B), T2 S(B). Which are granted? Who waits? Can deadlock occur if T3 later wants B?

**Expected Key Points:**
- T1 S(A) grant, T2 S(A) grant, T3 X(A) wait (behind S).
- T1 X(B) grant if B free, T2 S(B) wait on T1’s X(B).
- If T3 waits for A and later needs B held by T1, and T1 eventually needs something T3 holds, a cycle can form.
- With only this set: T3 waits for T1 and T2 on A; T2 waits for T1 on B—no cycle yet.
- Add T1 waiting for T3 to create deadlock.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare key-value, document, column-family and graph stores on data model, query, and a VVIET workload each.

**Expected Key Points:**
- KV: get/put sessions, O(1) lookup, poor ad-hoc query.
- Document: rich secondary indexes, LMS.
- Column-family: time-series Wi-Fi, TTL, partitions by key.
- Graph: prerequisite chains, club influence.
- Joins/traversals vs single-key.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Concurrency Control and NoSQL).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare optimistic concurrency (validation) vs locking.

**Model answer:** Optimistic: read freely, validate at commit — good for low conflict. Locking: pessimistic, blocking.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define two-phase locking (growing and shrinking).

**Model answer:** Growing: acquire locks only; shrinking: release only; no acquire after first release.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: move product catalog from RDBMS to document DB. Migration pitfalls.

**Model answer:** Join-heavy reporting, transactions across docs, duplication, schema evolution, transactional checkout still relational.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare MongoDB document model vs relational normalization for blog posts/comments.

**Model answer:** Embed comments for read locality vs reference for unbounded growth; trade consistency & duplication.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** What is a phantom read? Give an example predicate.

**Model answer:** New rows appear for a SELECT WHERE predicate between reads; e.g., count of open seats.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Explain how multiversion concurrency control (MVCC) serves readers without blocking writers (concept).

**Model answer:** Readers see snapshots; writers create versions; vacuum/GC old versions.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A27  ·  Intermediate  ·  6 marks  ·  Application
**Question:** When would you choose a key-value store for session data?

**Model answer:** Simple get/put, TTL, horizontal scale, no complex joins needed.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** Name three common NoSQL categories.

**Model answer:** Key-value, document, column-family, graph (any three).

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Compare primary-secondary replication lag impacts on read-your-writes.

**Model answer:** Session stickiness / causal tokens; read from primary when needed.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Global e-commerce needs low-latency reads worldwide. Discuss replication vs consistency.

**Model answer:** Geo-replicas raise availability/latency; CAP/PACELC trade-offs; eventual vs strong consistency choices.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Outline wound-wait or wait-die deadlock prevention.

**Model answer:** Use timestamps: wound-wait younger waits / older wounds; wait-die younger dies; prevents cycles.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret an isolation anomaly under snapshot isolation (write skew) at high level.

**Model answer:** Two txns read snapshot, write disjoint rows violating constraint together; SI may allow.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** What does BASE emphasize compared to ACID?

**Model answer:** Basically Available, Soft state, Eventual consistency — favor availability/partition tolerance.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a sharding key for multi-tenant SaaS invoices.

**Model answer:** Shard by tenant_id for locality; avoid hot tenants; consider composite keys.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use timestamp ordering to explain a rejected write.

**Model answer:** Write timestamp older than read-max for item ⇒ reject to preserve order.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Explain
**Question:** Define eventual consistency with an example of shopping cart merge.

**Model answer:** Replicas converge if no new updates; concurrent carts merge by item union with care for deletes.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain a MongoDB-style find query filtering nested document fields conceptually.

**Model answer:** Match on path into embedded doc/array; indexing dotted paths; array matching semantics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Justify CAP: why a partitioned system cannot provide both linearizability and perfect availability.

**Model answer:** Partition forces choice between answering (risk stale) vs refusing (preserve consistency).

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Give one graph-DB use case poorly suited to relational joins-at-scale.

**Model answer:** Social friend-of-friend traversal deep paths.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Interpret a system choosing quorum R+W>N. What guarantee emerges?

**Model answer:** Read-write overlap ⇒ readers see latest acknowledged write under simple quorum models.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

