# Quiz — Database Management Systems — Module 4: Transactions, Recovery and Serializability

**Subject:** Database Management Systems  
**Module:** Module 4 — Transactions, Recovery and Serializability  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A transaction in the failed state will next typically be:

- **A.** Committed
- **B.** Partially committed forever
- **C.** Serialized as a checkpoint
- **D.** Aborted (undone) and terminated

**Answer:** D
**Explanation:** Failed → abort path.

### Q02  ·  Easy
**Question:** ACID stands for:

- **A.** Access, Catalog, Integrity, Domain
- **B.** Atomicity, Consistency, Isolation, Durability
- **C.** Algebra, Cursors, Indexes, Disks
- **D.** Abort, Commit, Insert, Delete

**Answer:** B
**Explanation:** Standard transaction properties.

### Q03  ·  Easy
**Question:** Durability is implemented primarily by:

- **A.** Stable storage of log/data for committed work
- **B.** Isolation level READ UNCOMMITTED
- **C.** Avoiding primary keys
- **D.** Nested queries

**Answer:** A
**Explanation:** Committed effects must survive crashes.

### Q04  ·  Easy
**Question:** Which option best describes **Checkpoint**?

- **A.** A BCNF test.
- **B.** A point where the system records a consistent snapshot of active transactions and flushes relevant state so recovery can start from there.
- **C.** Deleting the log.
- **D.** Committing all users forcibly without records.

**Answer:** B
**Explanation:** Checkpoint: A point where the system records a consistent snapshot of active transactions and flushes relevant state so recovery can start from there.

### Q05  ·  Easy
**Question:** Which option best describes **Conflict serializability**?

- **A.** Durability.
- **B.** A schedule is conflict serializable if its conflict graph (precedence graph) is acyclic; equivalent to a serial order via swapping non-conflicting operations.
- **C.** A property of a single SQL statement.
- **D.** The same as view serializability always in both directions of implication.

**Answer:** B
**Explanation:** Conflict serializability: A schedule is conflict serializable if its conflict graph (precedence graph) is acyclic; equivalent to a serial order via swapping non-conflicting operations.

### Q06  ·  Easy
**Question:** Which option best describes **Isolation**?

- **A.** Concurrent transactions do not see each other’s uncommitted changes; the effect matches some approved concurrency policy.
- **B.** Durability after POWER-OFF.
- **C.** Atomic install of a new DBMS version.
- **D.** A CHECK constraint.

**Answer:** A
**Explanation:** Isolation: Concurrent transactions do not see each other’s uncommitted changes; the effect matches some approved concurrency policy.

### Q07  ·  Easy
**Question:** Which option best describes **Lost update**?

- **A.** A checkpoint.
- **B.** A successful serial execution of the two writes in order.
- **C.** Two transactions read the same value and write back, so one update is overwritten without being accounted for.
- **D.** A foreign-key reject.

**Answer:** C
**Explanation:** Lost update: Two transactions read the same value and write back, so one update is overwritten without being accounted for.

### Q08  ·  Easy
**Question:** Which option best describes **Transaction**?

- **A.** A view definition.
- **B.** A single SQL token.
- **C.** A logical unit of work: a sequence of reads/writes that must succeed or fail as a whole from the user’s view.
- **D.** A disk cylinder.

**Answer:** C
**Explanation:** Transaction: A logical unit of work: a sequence of reads/writes that must succeed or fail as a whole from the user’s view.

### Q09  ·  Easy
**Question:** Which option best describes **WAL (Write-Ahead Logging)**?

- **A.** Only SELECT is logged.
- **B.** Data pages are written before any log.
- **C.** Logging is optional if RAM is large.
- **D.** Log records describing updates must be forced to stable storage before the corresponding dirty data pages are flushed.

**Answer:** D
**Explanation:** WAL (Write-Ahead Logging): Log records describing updates must be forced to stable storage before the corresponding dirty data pages are flushed.

### Q10  ·  Easy
**Question:** Which phenomenon can occur at READ COMMITTED but not at REPEATABLE READ (row level)?

- **A.** Non-repeatable read of the same row
- **B.** Reading the catalog
- **C.** Dirty read
- **D.** WAL redo

**Answer:** A
**Explanation:** RC does not keep long-term shared locks on rows in the classic lock mapping.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **commit with WAL (no-force)**?

- **A.** Flush data pages first → then log → then commit
- **B.** Write undo/redo log records → force log to stable storage → commit record → acknowledge commit (data pages later)
- **C.** Ack commit from RAM without a log
- **D.** Undo committed work immediately

**Answer:** B
**Explanation:** Correct sequence for commit with WAL (no-force): Write undo/redo log records → force log to stable storage → commit record → acknowledge commit (data pages later)

### Q12  ·  Easy
**Question:** Which sequence correctly describes **testing conflict serializability**?

- **A.** Reject all concurrent schedules
- **B.** List conflicting operation pairs (RW, WR, WW on same item) → draw precedence edges Ti→Tj → accept iff DAG; topological order is a serial equivalent
- **C.** Count log records
- **D.** Accept any interleaved schedule

**Answer:** B
**Explanation:** Correct sequence for testing conflict serializability: List conflicting operation pairs (RW, WR, WW on same item) → draw precedence edges Ti→Tj → accept iff DAG; topological order is a serial equivalent

### Q13  ·  Intermediate
**Question:** A recoverable schedule requires that:

- **A.** Dirty reads are mandatory
- **B.** A transaction commits only after all transactions it read from have committed
- **C.** Checkpoints are forbidden
- **D.** Losers are redone

**Answer:** B
**Explanation:** Avoid committing based on data that later aborts (cascadeless is stricter).

### Q14  ·  Intermediate
**Question:** Exam cell prints a hall ticket using uncommitted enrolment that later aborts. This is:

- **A.** A dirty read
- **B.** Redo of a winner
- **C.** A serializable outcome
- **D.** Physical data independence

**Answer:** A
**Explanation:** Uncommitted data was observed.

### Q15  ·  Intermediate
**Question:** Fee payment debits wallet and inserts a receipt; crash after debit, before receipt. Atomicity requires:

- **A.** Durability of the partial debit only
- **B.** The DBA ignoring WAL
- **C.** Leaving the debit without a receipt as success
- **D.** Recovery undoes the debit (or completes both via redo of a prepared commit)

**Answer:** D
**Explanation:** All-or-nothing of the payment transaction.

### Q16  ·  Intermediate
**Question:** If the precedence graph of a schedule is acyclic, the schedule is:

- **A.** Conflict serializable
- **B.** Unrecoverable always
- **C.** Not serializable
- **D.** View serializable only if a cycle exists

**Answer:** A
**Explanation:** Acyclic ⇒ conflict serializable.

### Q17  ·  Intermediate
**Question:** Schedule: W1(A) W2(A) W1(B) C1 C2. Conflict graph has T1→T2 on A and no reverse. Serial order?

- **A.** T1 then T2
- **B.** T2 then T1
- **C.** Not conflict serializable
- **D.** View equivalent to neither

**Answer:** A
**Explanation:** T1’s W(A) precedes T2’s W(A).

### Q18  ·  Intermediate
**Question:** Steal + no-force buffer policy implies recovery must support:

- **A.** Neither undo nor redo
- **B.** Undo of losers whose pages were stolen, and redo of winners not forced
- **C.** No WAL
- **D.** Only force at every write

**Answer:** B
**Explanation:** Typical ARIES-style combination.

### Q19  ·  Intermediate
**Question:** The purpose of a checkpoint in recovery is:

- **A.** To replace serializability theory
- **B.** To bound how far back analysis/redo must go
- **C.** To disable WAL
- **D.** To delete all loser transactions’ keys

**Answer:** B
**Explanation:** Recovery starts from recent checkpoints.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **READ UNCOMMITTED** and **SERIALIZABLE**?

- **A.** They differ only in timeout values.
- **B.** READ UNCOMMITTED allows dirty reads; SERIALIZABLE disallows dirty, non-repeatable and phantom phenomena (in the SQL standard’s intent).
- **C.** READ UNCOMMITTED is the strictest.
- **D.** SERIALIZABLE allows dirty reads.

**Answer:** B
**Explanation:** READ UNCOMMITTED allows dirty reads; SERIALIZABLE disallows dirty, non-repeatable and phantom phenomena (in the SQL standard’s intent).

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **atomicity** and **durability**?

- **A.** Atomicity is all-or-nothing of one transaction; durability is survival of committed work after a crash.
- **B.** They are the same ACID letter.
- **C.** Durability is about isolation.
- **D.** Atomicity is only about disk brand.

**Answer:** A
**Explanation:** Atomicity is all-or-nothing of one transaction; durability is survival of committed work after a crash.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **conflict serializability** and **view serializability**?

- **A.** They are identical sets of schedules.
- **B.** Conflict serializability is a sufficient, polynomially testable subset; view serializability is weaker to test and strictly more inclusive.
- **C.** View serializability implies a cyclic conflict graph always.
- **D.** Conflict tests are NP-complete while view tests are linear always.

**Answer:** B
**Explanation:** Conflict serializability is a sufficient, polynomially testable subset; view serializability is weaker to test and strictly more inclusive.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **steal** and **no-steal**?

- **A.** No-steal requires more undo of committed work.
- **B.** Steal allows flushing dirty pages of active transactions; no-steal keeps them in cache until commit.
- **C.** They describe isolation levels.
- **D.** Steal forbids WAL.

**Answer:** B
**Explanation:** Steal allows flushing dirty pages of active transactions; no-steal keeps them in cache until commit.

### Q24  ·  Intermediate
**Question:** Which option best describes **Atomicity**?

- **A.** Durability of committed data.
- **B.** All of a transaction’s updates appear, or none do, after commit/abort.
- **C.** Isolation among concurrent users only.
- **D.** The ability to add indexes.

**Answer:** B
**Explanation:** Atomicity: All of a transaction’s updates appear, or none do, after commit/abort.

### Q25  ·  Intermediate
**Question:** Which option best describes **Consistency**?

- **A.** Serializability of a particular schedule only.
- **B.** A transaction takes the database from one valid state to another, preserving declared constraints and miniworld rules.
- **C.** The number of lock modes.
- **D.** The WAL being empty.

**Answer:** B
**Explanation:** Consistency: A transaction takes the database from one valid state to another, preserving declared constraints and miniworld rules.

### Q26  ·  Intermediate
**Question:** Which option best describes **Dirty read**?

- **A.** A phantom row that is committed.
- **B.** Reading only committed data.
- **C.** Reading a value written by a transaction that has not yet committed.
- **D.** A WAL flush.

**Answer:** C
**Explanation:** Dirty read: Reading a value written by a transaction that has not yet committed.

### Q27  ·  Intermediate
**Question:** Which option best describes **Durability**?

- **A.** Aborting a committed fee payment silently.
- **B.** Volatile RAM as the only home of committed data.
- **C.** Undo of committed work after a crash as the normal case.
- **D.** Once a transaction commits, its effects survive crashes (typically via logging/stable storage).

**Answer:** D
**Explanation:** Durability: Once a transaction commits, its effects survive crashes (typically via logging/stable storage).

### Q28  ·  Intermediate
**Question:** Which option best describes **Isolation level READ COMMITTED**?

- **A.** A transaction never reads uncommitted data, but successive reads may see committed updates of others (non-repeatable reads).
- **B.** It allows dirty reads by definition.
- **C.** It always provides a serializable snapshot of the whole database.
- **D.** It is identical to REPEATABLE READ in all engines.

**Answer:** A
**Explanation:** Isolation level READ COMMITTED: A transaction never reads uncommitted data, but successive reads may see committed updates of others (non-repeatable reads).

### Q29  ·  Intermediate
**Question:** Which option best describes **Phantom read**?

- **A.** Undo of a checkpoint.
- **B.** A later read in the same transaction sees new rows matching a predicate because another transaction inserted/committed them.
- **C.** Reading a dirty uncommitted row of an existing tuple only.
- **D.** A lost update on a single row.

**Answer:** B
**Explanation:** Phantom read: A later read in the same transaction sees new rows matching a predicate because another transaction inserted/committed them.

### Q30  ·  Intermediate
**Question:** Which option best describes **Redo logging**?

- **A.** Using log records to re-apply committed (and possibly prepared) updates that might not have reached the data pages.
- **B.** Erasing committed rows.
- **C.** A synonym for deadlock wakeup.
- **D.** Only used for SELECT.

**Answer:** A
**Explanation:** Redo logging: Using log records to re-apply committed (and possibly prepared) updates that might not have reached the data pages.

### Q31  ·  Intermediate
**Question:** Which option best describes **Schedule**?

- **A.** An ER diagram.
- **B.** An interleaving (or serial sequence) of the operations of multiple transactions.
- **C.** A CREATE TABLE.
- **D.** A hash index.

**Answer:** B
**Explanation:** Schedule: An interleaving (or serial sequence) of the operations of multiple transactions.

### Q32  ·  Intermediate
**Question:** Which option best describes **Serial schedule**?

- **A.** Any concurrent interleaved schedule.
- **B.** A schedule in which transactions execute one after another with no interleaving of operations.
- **C.** A lost-update schedule.
- **D.** A schedule with dirty reads only.

**Answer:** B
**Explanation:** Serial schedule: A schedule in which transactions execute one after another with no interleaving of operations.

### Q33  ·  Intermediate
**Question:** Which option best describes **Transaction states**?

- **A.** Typical lifecycle: active → partially committed → committed, or active → failed → aborted (and sometimes restarted).
- **B.** Lock granularity only.
- **C.** A relation’s 1NF status.
- **D.** SQL JOIN types.

**Answer:** A
**Explanation:** Transaction states: Typical lifecycle: active → partially committed → committed, or active → failed → aborted (and sometimes restarted).

### Q34  ·  Intermediate
**Question:** Which option best describes **Undo logging**?

- **A.** Increasing isolation.
- **B.** Redoing committed updates after a crash.
- **C.** Dropping the catalog.
- **D.** Using log records to restore before-images of aborted or incomplete transactions.

**Answer:** D
**Explanation:** Undo logging: Using log records to restore before-images of aborted or incomplete transactions.

### Q35  ·  Intermediate
**Question:** Which option best describes **View serializability**?

- **A.** A schedule is view-equivalent to a serial schedule (same initial reads, same write-read pairs, same final writes).
- **B.** A weaker notion that implies conflict serializability.
- **C.** A checkpoint algorithm.
- **D.** Identical to 2PL.

**Answer:** A
**Explanation:** View serializability: A schedule is view-equivalent to a serial schedule (same initial reads, same write-read pairs, same final writes).

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **ARIES-style restart (logical)**?

- **A.** Undo winners first → skip redo
- **B.** Redo losers and undo winners
- **C.** Analysis of log from last checkpoint → redo to recreate state → undo losers
- **D.** Drop all tables → reload from Excel

**Answer:** C
**Explanation:** Correct sequence for ARIES-style restart (logical): Analysis of log from last checkpoint → redo to recreate state → undo losers

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **transaction abort**?

- **A.** Flush dirty pages as committed
- **B.** Stop execution → undo writes using log → write abort → release resources → possible restart
- **C.** Redo as a winner
- **D.** Delete the log file

**Answer:** B
**Explanation:** Correct sequence for transaction abort: Stop execution → undo writes using log → write abort → release resources → possible restart

### Q38  ·  Intermediate
**Question:** Which statement about **Conflict serializability** is FALSE?

- **A.** Conflict serializability is correctly understood as: a schedule is conflict serializable if its conflict graph (precedence graph) is acyclic; equivalent to a serial order via swapping non-conflicting operations.
- **B.** In this module, Conflict serializability is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Conflict serializability is that it is not the same as “The same as view serializability always in both directions of implication”.
- **D.** A cyclic precedence graph still means conflict serializable.

**Answer:** D
**Explanation:** The false claim is: A cyclic precedence graph still means conflict serializable.. Conflict serializability actually means: A schedule is conflict serializable if its conflict graph (precedence graph) is acyclic; equivalent to a serial order via swapping non-conflicting operations.

### Q39  ·  Intermediate
**Question:** Which statement about **Consistency** is FALSE?

- **A.** Consistency is correctly understood as: a transaction takes the database from one valid state to another, preserving declared constraints and miniworld rules.
- **B.** A useful way to remember Consistency is that it is not the same as “The WAL being empty”.
- **C.** Consistency means the DBA never defines constraints.
- **D.** In this module, Consistency is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Consistency means the DBA never defines constraints.. Consistency actually means: A transaction takes the database from one valid state to another, preserving declared constraints and miniworld rules.

### Q40  ·  Intermediate
**Question:** Which statement about **Dirty read** is FALSE?

- **A.** Dirty read is correctly understood as: reading a value written by a transaction that has not yet committed.
- **B.** In this module, Dirty read is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Dirty read is that it is not the same as “Reading only committed data”.
- **D.** Dirty read is required by the strictest SERIALIZABLE isolation.

**Answer:** D
**Explanation:** The false claim is: Dirty read is required by the strictest SERIALIZABLE isolation.. Dirty read actually means: Reading a value written by a transaction that has not yet committed.

### Q41  ·  Intermediate
**Question:** Which statement about **Durability** is FALSE?

- **A.** In this module, Durability is a core idea students must distinguish from nearby terms.
- **B.** Durability means committed data may vanish if the OS reboots.
- **C.** A useful way to remember Durability is that it is not the same as “Undo of committed work after a crash as the normal case”.
- **D.** Durability is correctly understood as: once a transaction commits, its effects survive crashes (typically via logging/stable storage).

**Answer:** B
**Explanation:** The false claim is: Durability means committed data may vanish if the OS reboots.. Durability actually means: Once a transaction commits, its effects survive crashes (typically via logging/stable storage).

### Q42  ·  Intermediate
**Question:** Which statement about **Isolation level READ COMMITTED** is FALSE?

- **A.** READ COMMITTED permits dirty reads of uncommitted fees.
- **B.** In this module, Isolation level READ COMMITTED is a core idea students must distinguish from nearby terms.
- **C.** Isolation level READ COMMITTED is correctly understood as: a transaction never reads uncommitted data, but successive reads may see committed updates of others (non-repeatable reads).
- **D.** A useful way to remember Isolation level READ COMMITTED is that it is not the same as “It always provides a serializable snapshot of the whole database”.

**Answer:** A
**Explanation:** The false claim is: READ COMMITTED permits dirty reads of uncommitted fees.. Isolation level READ COMMITTED actually means: A transaction never reads uncommitted data, but successive reads may see committed updates of others (non-repeatable reads).

### Q43  ·  Intermediate
**Question:** Which statement about **Redo logging** is FALSE?

- **A.** A useful way to remember Redo logging is that it is not the same as “Erasing committed rows”.
- **B.** Redo is never needed if WAL is used.
- **C.** Redo logging is correctly understood as: using log records to re-apply committed (and possibly prepared) updates that might not have reached the data pages.
- **D.** In this module, Redo logging is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Redo is never needed if WAL is used.. Redo logging actually means: Using log records to re-apply committed (and possibly prepared) updates that might not have reached the data pages.

### Q44  ·  Intermediate
**Question:** Which statement about **Schedule** is FALSE?

- **A.** A schedule is the same as a single transaction’s source code.
- **B.** A useful way to remember Schedule is that it is not the same as “A CREATE TABLE”.
- **C.** Schedule is correctly understood as: an interleaving (or serial sequence) of the operations of multiple transactions.
- **D.** In this module, Schedule is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A schedule is the same as a single transaction’s source code.. Schedule actually means: An interleaving (or serial sequence) of the operations of multiple transactions.

### Q45  ·  Intermediate
**Question:** Which statement about **Transaction** is FALSE?

- **A.** In this module, Transaction is a core idea students must distinguish from nearby terms.
- **B.** Transaction is correctly understood as: a logical unit of work: a sequence of reads/writes that must succeed or fail as a whole from the user’s view.
- **C.** A transaction is only a SELECT with no writes and no ACID meaning.
- **D.** A useful way to remember Transaction is that it is not the same as “A single SQL token”.

**Answer:** C
**Explanation:** The false claim is: A transaction is only a SELECT with no writes and no ACID meaning.. Transaction actually means: A logical unit of work: a sequence of reads/writes that must succeed or fail as a whole from the user’s view.

### Q46  ·  Intermediate
**Question:** Which statement about **WAL (Write-Ahead Logging)** is FALSE?

- **A.** In this module, WAL (Write-Ahead Logging) is a core idea students must distinguish from nearby terms.
- **B.** WAL allows flushing dirty pages before the redo log records hit disk.
- **C.** A useful way to remember WAL (Write-Ahead Logging) is that it is not the same as “Data pages are written before any log”.
- **D.** WAL (Write-Ahead Logging) is correctly understood as: log records describing updates must be forced to stable storage before the corresponding dirty data pages are flushed.

**Answer:** B
**Explanation:** The false claim is: WAL allows flushing dirty pages before the redo log records hit disk.. WAL (Write-Ahead Logging) actually means: Log records describing updates must be forced to stable storage before the corresponding dirty data pages are flushed.

### Q47  ·  Intermediate
**Question:** Write-ahead logging requires:

- **A.** No log if using steal
- **B.** Log records on stable storage before dirty data pages of those updates
- **C.** Logging only SELECT
- **D.** Data pages before log always

**Answer:** B
**Explanation:** WAL rule.

### Q48  ·  Difficult
**Question:** A report runs twice under READ COMMITTED and sees two different CGPAs for the same USN after another commit. This is:

- **A.** Undo recovery
- **B.** A non-repeatable read
- **C.** A successful REPEATABLE READ
- **D.** A dirty read

**Answer:** B
**Explanation:** Committed change appeared between reads of the same row.

### Q49  ·  Difficult
**Question:** A schedule that is view serializable but not conflict serializable typically involves:

- **A.** A cycle that still admits conflict swaps
- **B.** Blind writes (writes without reading) that create extra view-equivalent serial orders
- **C.** Only reads
- **D.** No final writes

**Answer:** B
**Explanation:** Blind writes are the usual gap.

### Q50  ·  Difficult
**Question:** Active at checkpoint: T2, T3. Log after CKPT: T2 commit, T3 still active, crash. Who is undone? Who is redone?

- **A.** Undo both
- **B.** Undo T3; redo T2 (and any earlier committed still needing redo per policy)
- **C.** Redo T3 only
- **D.** Undo T2; redo T3

**Answer:** B
**Explanation:** Loser T3 undone; winner T2 redone.

### Q51  ·  Difficult
**Question:** After COMMIT of IA marks, power fails before the buffer pool writes the page. Correct recovery uses:

- **A.** Dropping MARKS
- **B.** Undo of the committed transaction as a loser
- **C.** Restarting the transaction as failed
- **D.** Redo from the log (WAL already forced at commit)

**Answer:** D
**Explanation:** Committed ⇒ winner ⇒ redo.

### Q52  ·  Difficult
**Question:** Cascadeless schedules require:

- **A.** Dirty reads followed by commit of the reader before the writer
- **B.** A transaction may read only values written by committed transactions
- **C.** View serializability only
- **D.** No logging

**Answer:** B
**Explanation:** No reading uncommitted data ⇒ no cascading aborts.

### Q53  ·  Difficult
**Question:** Log: <T1 start> <T1, A, 5, 8> <T1 commit> CRASH before data page A flushed. After redo, A should be:

- **A.** null
- **B.** 5
- **C.** 8
- **D.** 0

**Answer:** C
**Explanation:** T1 committed: redo after-image 8.

### Q54  ·  Difficult
**Question:** Precedence graph: T1 → T2 from W1(X) R2(X), T2 → T1 from W2(Y) R1(Y). Is the schedule conflict serializable?

- **A.** Yes, serial order T2 T1
- **B.** Yes because two data items
- **C.** No (cycle)
- **D.** Yes, serial order T1 T2

**Answer:** C
**Explanation:** Cycle ⇒ not conflict serializable.

### Q55  ·  Difficult
**Question:** SQL isolation: a transaction reads count of CSE students twice; another commits an insert between. If counts differ, the phenomenon is:

- **A.** Lost update of the count column only
- **B.** A WAL failure
- **C.** Phantom (or non-repeatable predicate read)
- **D.** Dirty read of uncommitted insert

**Answer:** C
**Explanation:** New committed row appears in the predicate.

### Q56  ·  Difficult
**Question:** Strict 2PL would delay W2(A) until T1 commits if T1 holds X-lock on A. If T1 holds A from time 1–10 and T2 wants A at time 4, T2 waits how many time units (commit at 10)?

- **A.** 10
- **B.** 0
- **C.** 4
- **D.** 6

**Answer:** D
**Explanation:** Wait from 4 until 10 ⇒ 6 units.

### Q57  ·  Difficult
**Question:** T1: R(A) W(A) C1; T2: R(A) W(A) C2 interleaved as R1(A) R2(A) W1(A) W2(A) C1 C2. How many lost-update style write conflicts on A?

- **A.** One lost update (W1 overwritten by W2 without T2 seeing W1)
- **B.** Four
- **C.** Zero
- **D.** Three

**Answer:** A
**Explanation:** Both based their writes on the same original A; W2 clobbers W1.

### Q58  ·  Difficult
**Question:** Two clerks increment the same library fine using read-modify-write without locks. Risk is:

- **A.** Mandatory serializability success
- **B.** A CHECK constraint fire
- **C.** A phantom in an empty table only
- **D.** Lost update

**Answer:** D
**Explanation:** Classic lost update.

### Q59  ·  Difficult
**Question:** VVIET wants no dirty reads but can tolerate phantoms on live dashboards. A fitting standard isolation is:

- **A.** READ UNCOMMITTED
- **B.** READ COMMITTED (or snapshot variants that still allow some phantoms depending on engine)
- **C.** File copies with no DBMS
- **D.** Turning off logging

**Answer:** B
**Explanation:** RC blocks dirty reads; phantoms may remain.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **checkpoint** and **commit**?

- **A.** Commit ends one transaction durably; a checkpoint is a system-wide recovery optimization involving many transactions.
- **B.** A checkpoint commits every user.
- **C.** Commit truncates WAL always to empty.
- **D.** They are identical log records.

**Answer:** A
**Explanation:** Commit ends one transaction durably; a checkpoint is a system-wide recovery optimization involving many transactions.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **force** and **no-force**?

- **A.** They are names of join algorithms.
- **B.** No-force forbids durability.
- **C.** Force means abort.
- **D.** Force writes all of a transaction’s dirty pages at commit; no-force relies on redo later.

**Answer:** D
**Explanation:** Force writes all of a transaction’s dirty pages at commit; no-force relies on redo later.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **serial schedule** and **serializable schedule**?

- **A.** Serial has no interleaving; serializable is conflict- or view-equivalent to some serial schedule.
- **B.** Serial always has dirty reads.
- **C.** Serializable forbids concurrency.
- **D.** They mean the same word.

**Answer:** A
**Explanation:** Serial has no interleaving; serializable is conflict- or view-equivalent to some serial schedule.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **undo** and **redo**?

- **A.** Redo aborts committed work.
- **B.** Undo removes effects of losers; redo repeats effects of winners that may not have reached data pages.
- **C.** They use no log.
- **D.** Undo writes after-images only.

**Answer:** B
**Explanation:** Undo removes effects of losers; redo repeats effects of winners that may not have reached data pages.

### Q64  ·  Difficult
**Question:** Which statement about **Atomicity** is FALSE?

- **A.** Atomicity allows half of a fee-payment update to persist after a crash.
- **B.** Atomicity is correctly understood as: all of a transaction’s updates appear, or none do, after commit/abort.
- **C.** In this module, Atomicity is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Atomicity is that it is not the same as “Isolation among concurrent users only”.

**Answer:** A
**Explanation:** The false claim is: Atomicity allows half of a fee-payment update to persist after a crash.. Atomicity actually means: All of a transaction’s updates appear, or none do, after commit/abort.

### Q65  ·  Difficult
**Question:** Which statement about **Checkpoint** is FALSE?

- **A.** Checkpoint is correctly understood as: a point where the system records a consistent snapshot of active transactions and flushes relevant state so recovery can start from there.
- **B.** A checkpoint makes the entire old log useless and illegal to read, even for transactions still active at the checkpoint.
- **C.** A useful way to remember Checkpoint is that it is not the same as “Deleting the log”.
- **D.** In this module, Checkpoint is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A checkpoint makes the entire old log useless and illegal to read, even for transactions still active at the checkpoint.. Checkpoint actually means: A point where the system records a consistent snapshot of active transactions and flushes relevant state so recovery can start from there.

### Q66  ·  Difficult
**Question:** Which statement about **Isolation** is FALSE?

- **A.** A useful way to remember Isolation is that it is not the same as “Durability after POWER-OFF”.
- **B.** Isolation is correctly understood as: concurrent transactions do not see each other’s uncommitted changes; the effect matches some approved concurrency policy.
- **C.** Isolation requires that dirty reads are always legal.
- **D.** In this module, Isolation is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Isolation requires that dirty reads are always legal.. Isolation actually means: Concurrent transactions do not see each other’s uncommitted changes; the effect matches some approved concurrency policy.

### Q67  ·  Difficult
**Question:** Which statement about **Lost update** is FALSE?

- **A.** Lost update cannot happen if writes are not isolated; it is the correct serial outcome.
- **B.** In this module, Lost update is a core idea students must distinguish from nearby terms.
- **C.** Lost update is correctly understood as: two transactions read the same value and write back, so one update is overwritten without being accounted for.
- **D.** A useful way to remember Lost update is that it is not the same as “A successful serial execution of the two writes in order”.

**Answer:** A
**Explanation:** The false claim is: Lost update cannot happen if writes are not isolated; it is the correct serial outcome.. Lost update actually means: Two transactions read the same value and write back, so one update is overwritten without being accounted for.

### Q68  ·  Difficult
**Question:** Which statement about **Phantom read** is FALSE?

- **A.** Phantoms are prevented by READ UNCOMMITTED more than by SERIALIZABLE.
- **B.** In this module, Phantom read is a core idea students must distinguish from nearby terms.
- **C.** Phantom read is correctly understood as: a later read in the same transaction sees new rows matching a predicate because another transaction inserted/committed them.
- **D.** A useful way to remember Phantom read is that it is not the same as “Reading a dirty uncommitted row of an existing tuple only”.

**Answer:** A
**Explanation:** The false claim is: Phantoms are prevented by READ UNCOMMITTED more than by SERIALIZABLE.. Phantom read actually means: A later read in the same transaction sees new rows matching a predicate because another transaction inserted/committed them.

### Q69  ·  Difficult
**Question:** Which statement about **Serial schedule** is FALSE?

- **A.** In this module, Serial schedule is a core idea students must distinguish from nearby terms.
- **B.** Serial means operations of different transactions may interleave freely.
- **C.** A useful way to remember Serial schedule is that it is not the same as “Any concurrent interleaved schedule”.
- **D.** Serial schedule is correctly understood as: a schedule in which transactions execute one after another with no interleaving of operations.

**Answer:** B
**Explanation:** The false claim is: Serial means operations of different transactions may interleave freely.. Serial schedule actually means: A schedule in which transactions execute one after another with no interleaving of operations.

### Q70  ·  Difficult
**Question:** Which statement about **Transaction states** is FALSE?

- **A.** A useful way to remember Transaction states is that it is not the same as “A relation’s 1NF status”.
- **B.** Transaction states is correctly understood as: typical lifecycle: active → partially committed → committed, or active → failed → aborted (and sometimes restarted).
- **C.** A committed transaction can still move to failed without a new transaction id.
- **D.** In this module, Transaction states is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: A committed transaction can still move to failed without a new transaction id.. Transaction states actually means: Typical lifecycle: active → partially committed → committed, or active → failed → aborted (and sometimes restarted).

### Q71  ·  Difficult
**Question:** Which statement about **Undo logging** is FALSE?

- **A.** A useful way to remember Undo logging is that it is not the same as “Redoing committed updates after a crash”.
- **B.** Undo is applied to transactions that already committed and were checkpointed as done.
- **C.** Undo logging is correctly understood as: using log records to restore before-images of aborted or incomplete transactions.
- **D.** In this module, Undo logging is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Undo is applied to transactions that already committed and were checkpointed as done.. Undo logging actually means: Using log records to restore before-images of aborted or incomplete transactions.

### Q72  ·  Difficult
**Question:** Which statement about **View serializability** is FALSE?

- **A.** A useful way to remember View serializability is that it is not the same as “A weaker notion that implies conflict serializability”.
- **B.** In this module, View serializability is a core idea students must distinguish from nearby terms.
- **C.** View serializability is correctly understood as: a schedule is view-equivalent to a serial schedule (same initial reads, same write-read pairs, same final writes).
- **D.** Every view-serializable schedule is conflict serializable.

**Answer:** D
**Explanation:** The false claim is: Every view-serializable schedule is conflict serializable.. View serializability actually means: A schedule is view-equivalent to a serial schedule (same initial reads, same write-read pairs, same final writes).

---

## Quick answer key

Q01–D | Q02–B | Q03–A | Q04–B | Q05–B | Q06–A | Q07–C | Q08–C | Q09–D | Q10–A | Q11–B | Q12–B | Q13–B | Q14–A | Q15–D | Q16–A | Q17–A | Q18–B | Q19–B | Q20–B | Q21–A | Q22–B | Q23–B | Q24–B | Q25–B | Q26–C | Q27–D | Q28–A | Q29–B | Q30–A | Q31–B | Q32–B | Q33–A | Q34–D | Q35–A | Q36–C | Q37–B | Q38–D | Q39–C | Q40–D | Q41–B | Q42–A | Q43–B | Q44–A | Q45–C | Q46–B | Q47–B | Q48–B | Q49–B | Q50–B | Q51–D | Q52–B | Q53–C | Q54–C | Q55–C | Q56–D | Q57–A | Q58–D | Q59–B | Q60–A | Q61–D | Q62–A | Q63–B | Q64–A | Q65–B | Q66–C | Q67–A | Q68–A | Q69–B | Q70–C | Q71–B | Q72–D
