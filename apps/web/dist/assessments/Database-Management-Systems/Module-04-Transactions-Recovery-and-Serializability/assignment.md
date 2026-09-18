# Assignment — Database Management Systems — Module 4 — Transactions, Recovery and Serializability

**Subject:** Database Management Systems  
**Module:** Module 4 — Transactions, Recovery and Serializability  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 319 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain ACID with a VVIET fee-payment example.

**Expected Key Points:**
- Atomicity: debit and receipt together.
- Consistency: wallet ≥ 0 and receipt matches fee table.
- Isolation: two clerks cannot both spend the same balance.
- Durability: after COMMIT, a power fail must not lose the payment (log).
- Partial debit without receipt violates atomicity.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Draw/describe the transaction state diagram including commit and abort.

**Expected Key Points:**
- Active (executing).
- Partially committed (after last statement, before durable commit).
- Failed (error detected).
- Aborted (undone).
- From abort the system may restart a new transaction.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define schedule, serial schedule and serializable schedule.

**Expected Key Points:**
- A schedule interleaves operations of transactions.
- Serial: no interleaving.
- Serializable: equivalent (conflict or view) to some serial schedule, so isolation matches an approved one-at-a-time order even if physically concurrent.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four concurrent-execution problems (lost update, dirty read, incorrect summary, unrepeatable read) with one line each.

**Expected Key Points:**
- Lost update: two RMW overwrite.
- Dirty read: read uncommitted.
- Incorrect summary: aggregate while updates in flight.
- Unrepeatable read: same row changes after a committed writer.
- Phantoms are predicate-level newcomers.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is WAL? Why force the log before data pages?

**Expected Key Points:**
- Write-ahead logging writes describing changes to stable log first.
- If a data page reached disk without a log, crash recovery could neither undo nor redo correctly.
- Commit forces at least the commit record; no-force may delay data pages.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish undo and redo using before-images and after-images.

**Expected Key Points:**
- Before-image restores old values (undo losers).
- After-image reapplies new values (redo winners).
- A log record often stores both.
- Policy (steal/no-steal, force/no-force) decides which is necessary.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a checkpoint? What is recorded?

**Expected Key Points:**
- A checkpoint flushes dirty pages (fuzzy checkpoints differ) and writes a list of active transaction IDs and log positions.
- Recovery analysis starts there instead of from the beginning of time.
- It is not a commit of user transactions.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare conflict serializability and view serializability. Which test is used in practice and why?

**Expected Key Points:**
- Conflict: swap non-conflicting ops; test by acyclic precedence graph (polynomial).
- View: same reads-from and final writes as a serial schedule (NP-complete in general).
- Every conflict-serializable schedule is view-serializable; the converse fails with blind writes.
- Practice uses conflict tests / 2PL.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain steal/no-steal and force/no-force. Which pair does a typical DBMS use, and what recovery is needed?

**Expected Key Points:**
- Steal: loser pages may reach disk ⇒ need undo.
- No-force: winner pages may not reach disk at commit ⇒ need redo.
- Typical: steal + no-force + WAL (ARIES-like).
- No-steal + force needs almost no recovery but hurts performance.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** Given S: R1(A) W2(A) W1(A) R2(B) W2(B) C1 C2. Draw the conflict graph, test serializability, and name any dirty-read/lost-update issues.

**Expected Key Points:**
- Conflicts: R1(A)–W2(A) ⇒ T1→T2; W2(A)–W1(A) ⇒ T2→T1; cycle ⇒ not conflict serializable.
- W1 overwrites W2 or vice versa depending on order—lost/dirty mix: T1 writes A after T2 wrote A without a read of T2’s value necessarily.
- Also W2(A) may be a dirty write relative to T1’s later W.
- State clearly: cycle is enough to reject CS.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO1
**Question:** Marks entry: T_ia updates IA, T_see updates SEE for the same USN. Propose a commit order policy so a printed transcript cannot include uncommitted IA.

**Expected Key Points:**
- Use recoverable/cascadeless execution: T_see (or the print transaction) must read only committed IA (locks or MVCC snapshots).
- Isolation at least READ COMMITTED; transcript job SERIALIZABLE or repeatable snapshot.
- WAL commit of IA before the print transaction’s read.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ and SERIALIZABLE in terms of dirty, non-repeatable and phantom reads.

**Expected Key Points:**
- RU: dirty allowed.
- RC: no dirty; non-repeatable and phantoms possible.
- RR: no dirty, no non-repeatable row updates; phantoms may remain (engine-dependent).
- SERIALIZABLE: none of the three in the SQL-standard intention.
- Mention MVCC snapshot isolation ≠ full serializable (write skew).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a cascadeless schedule? Why prefer it to merely recoverable?

**Expected Key Points:**
- Cascadeless: only read committed data, so abort of a writer does not force abort of readers.
- Recoverable allows dirty reads if the reader waits to commit until the writer commits—still cascading aborts.
- Cascadeless simplifies recovery and user experience.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO4
**Question:** Simulate on paper a log with two transactions, a checkpoint, a crash, and show analysis/redo/undo sets.

**Expected Key Points:**
- Example: CKPT {T1,T2}; T1 commit; T2 W(B); crash.
- Analysis: T1 winner, T2 loser.
- Redo from CKPT redo-start: apply T1 (and T2’s writes physically then undo T2, in ARIES repeating history).
- Undo T2 using CLR-style thinking at VTU level: restore before-images of T2.
- List log sequence.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO1
**Question:** Design a recovery story for the campus ERP: what is logged on UPDATE of FEE, when is the log forced, and how a crash mid-transaction is handled.

**Expected Key Points:**
- Each UPDATE appends a log record (LSN, prevLSN, undo/redo images, transaction id).
- Commit writes a commit record and fsyncs the log.
- Steal may have written the fee page; undo restores the old balance if T aborted.
- If commit was forced, redo restores the new balance.
- Checkpoints every N seconds bound recovery.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor disables the log ‘for speed’ on the exam database. Critique using ACID.

**Expected Key Points:**
- Without WAL, a crash can lose committed marks (durability) or leave half-updated rows (atomicity).
- Isolation/locks without recovery still leave torn states.
- Speed is illusory compared with re-entry of SEE marks.
- Use batched commits, group commit, or SSDs—not log off.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why serializability is the correctness criterion for concurrency, and when an institute might still choose READ COMMITTED.

**Expected Key Points:**
- Serializable ≡ equivalent to some serial order, preserving invariants (no lost updates, no phantoms).
- High-read dashboards may accept RC for throughput if business can tolerate non-repeatable counts.
- Critical paths (exam seating, fees) should be serializable or carefully constrained.
- Document anomalies you accept.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** T1: W(A) W(B) C; T2: R(A) R(B) C. Interleave W1(A) R2(A) W1(B) R2(B) C1 C2. Is it conflict serializable? Recoverable? Cascadeless?

**Expected Key Points:**
- Conflicts: W1(A) before R2(A) ⇒ T1→T2; W1(B) before R2(B) ⇒ T1→T2.
- Acyclic ⇒ CS, serial T1 T2.
- Recoverable: T2 reads T1 and commits after T1 — yes.
- Cascadeless: T2 read uncommitted A and B — no.
- So CS and recoverable but not cascadeless.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO4
**Question:** At checkpoint, T4 and T5 are active. Afterward T4 commits, T5 writes and crashes. Data page of T4 was not forced; T5 page was stolen. Who is winner/loser? Undo/redo?

**Expected Key Points:**
- T4 winner: redo its updates (no-force).
- T5 loser: undo stolen page using before-image (steal).
- Analysis starts at checkpoint listing T4,T5; scan forward to classify commit.
- Repeating history would redo T5’s write then undo it—state if you assume ARIES.
- Final: A from T4 durable, T5 gone.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare immediate-update (steal) recovery with deferred-update (no-steal) recovery.

**Expected Key Points:**
- Immediate/steal: undo needed, better cache use, WAL mandatory.
- Deferred/no-steal: keep dirty pages until commit, undo of data pages unnecessary (discard), may still redo if no-force, memory pressure on long transactions.
- Most teaching systems present both; commercial cores use steal+no-force+ARIES.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Transactions Recovery and Serializability).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Test conflict serializability of a given schedule r1(X) w2(X) w1(X) using a precedence graph.

**Model answer:** Edges from conflicts; cycle ⇒ not conflict serializable. Explain each edge.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the ACID properties in one line each.

**Model answer:** Atomicity all-or-nothing; Consistency preserve integrity; Isolation concurrency illusion; Durability committed persists.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Show a schedule that is view serializable but not conflict serializable (classic pattern).

**Model answer:** Blind writes example; explain why view ok but conflict graph cycles.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare conflict vs view serializability.

**Model answer:** Conflict stricter/poly-time testable; view more general but NP-hard to test.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** What is a schedule? What is a serial schedule?

**Model answer:** Interleaving of operations across transactions. Serial: no interleaving — one after another.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: airline booking oversell under READ UNCOMMITTED. Propose isolation + constraints.

**Model answer:** Use SERIALIZABLE or careful SELECT FOR UPDATE; seat count constraint; compensating transactions.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Which isolation level prevents dirty reads but allows non-repeatable reads?

**Model answer:** READ COMMITTED (typical).

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define dirty read.

**Model answer:** Reading uncommitted data written by another transaction.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Compare ARIES recovery phases Analysis/Redo/Undo in a short brief.

**Model answer:** Analysis find dirty/active; Redo repeat history; Undo losers; CLRs.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Funds transfer: debit then system crash before credit. Which ACID property & recovery action?

**Model answer:** Atomicity; UNDO incomplete transaction on recovery.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Outline deadlock detection via waits-for graph periodically.

**Model answer:** Build graph from lock waits; find cycle; abort victim; repeat.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a waits-for graph with a cycle.

**Model answer:** Deadlock; victim selection / abort one txn.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Role of WAL (write-ahead logging).

**Model answer:** Log force before data pages; enables redo/undo correctly.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a logging strategy for a banking debit with checkpoints.

**Model answer:** Begin, update logs with undo/redo info, commit; checkpoints truncate recovery work.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use two-phase locking to show a non-serializable risk if unlock early.

**Model answer:** Releasing locks before all locks acquired can allow cycles; 2PL forbids.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Explain
**Question:** Define cascading rollback and how strict schedules avoid it.

**Model answer:** Abort forces others who read dirty data to abort. Strict: no dirty reads of uncommitted writes.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** For schedule w1(X) r2(X) w1(Y) c1 c2, discuss recoverability.

**Model answer:** T2 read dirty X; if T1 aborts must cascade. If commits ordered carefully may be recoverable — analyze.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A38  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Justify checkpoints even though logs already exist.

**Model answer:** Bound recovery redo/undo work; without checkpoints restart scans entire log history.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Give an example of a lost update without concurrency control.

**Model answer:** Two txns read balance 100, both write 100+10 → 110 not 120.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Interpret ‘repeatable read’ still allowing phantom reads.

**Model answer:** Same rows repeat but new matching rows can appear; predicates not locked fully unless serializable.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

