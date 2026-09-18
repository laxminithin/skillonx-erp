# Assignment — Big Data Analytics — Module 3 — MongoDB for Big Data

**Subject:** Big Data Analytics  
**Module:** Module 3 — MongoDB for Big Data  
**Questions:** 40  
**Mix:** 11 Easy · 18 Intermediate · 11 Difficult  
**Bank total:** 318 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain document, collection and BSON with a student example.

**Expected Key Points:**
- Collection students holds BSON docs with _id, name, dept, marks[].
- BSON is binary JSON with types like ObjectId, Date.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write MQL to insert a student, find by USN, update cgpa, and delete dropped students.

**Expected Key Points:**
- insertOne; find({usn:...}); updateOne({usn}, {$set:{cgpa}}); deleteMany({status:'dropped'}).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is _id / ObjectId?

**Expected Key Points:**
- Unique document key.
- ObjectId is 12-byte generated id (time + random + counter).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  COMPARE_JUSTIFY  ·  CO4
**Question:** Embedding vs referencing for student↔courses. When to embed?

**Expected Key Points:**
- Embed when data is accessed together, bounded, and not shared heavily.
- Reference when many-to-many, unbounded arrays, or independent lifecycle.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO3
**Question:** Design a student ERP document model: personal data, semester marks, address. Justify.

**Expected Key Points:**
- One student doc with address object and marks[] of {sem, subject, grade} if history is bounded; or marks collection if unbounded.
- Index usn, dept.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Write a pipeline: average CGPA by department for students with cgpa ≥ 6, sorted descending.

**Expected Key Points:**
- $match {cgpa:{$gte:6}} → $group {_id:'$dept', avg:{$avg:'$cgpa'}} → $sort {avg:-1}.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Propose indexes for queries by usn, by (dept, cgpa), and text search on name. Warn about write cost.

**Expected Key Points:**
- Unique usn; compound {dept:1, cgpa:-1}; text index on name.
- Each index slows writes and uses RAM/disk.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain primary, secondary, arbiter, election and writeConcern majority.

**Expected Key Points:**
- Primary writes; secondaries replicate oplog; arbiter votes; election on primary loss; majority ack avoids rollback of acknowledged writes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** 8 TB attendance events, query pattern by student_id and by day. Choose a shard key and discuss hotspots.

**Expected Key Points:**
- Avoid pure timestamp.
- Consider {student_id, day} or hashed student_id plus time in compound if queries allow.
- Watch jumbo chunks and scatter-gather.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A team stores a growing array of 200,000 attendance events inside one student document. Critique.

**Expected Key Points:**
- 16 MB document limit, rewrite amplification, unbounded arrays.
- Use a time-series/events collection referenced by usn.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List six aggregation stages and one purpose each.

**Expected Key Points:**
- $match filter, $project shape, $group agg, $sort, $limit, $lookup join-like, $unwind arrays, $out write.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a replica set oplog?

**Expected Key Points:**
- Capped collection of ordered write operations used to replicate to secondaries.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO3
**Question:** Exam results must not be lost after a primary crash. Specify topology and writeConcern.

**Expected Key Points:**
- PSS (3 data) or PSA with care; w:majority; journaling; backups; avoid w:1 for results.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** mongos, config servers, shards — roles in a cluster.

**Expected Key Points:**
- mongos routes; config servers hold cluster metadata/chunks; each shard is typically a replica set holding a data slice.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Specify a 6-query acceptance test for the ERP collection (filters, projection, update, agg, index hint, explain).

**Expected Key Points:**
- Include find projection, range, update array, $group, explain() winning plan IXSCAN, and a negative test for missing index COLLSCAN.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** When would you still pick SQL over MongoDB for the campus finance ledger?

**Expected Key Points:**
- Strong multi-row ACID, mature reporting SQL, auditors, normalised money constraints — RDBMS still wins; Mongo for flexible student profiles and logs.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain schema flexibility with a hostel field added mid-year.

**Expected Key Points:**
- New documents include hostel_id; old ones omit it; queries use $exists; no ALTER TABLE required, but app must handle missing fields.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Covered queries and projection. Give an example.

**Expected Key Points:**
- Index {dept:1, usn:1}; query {dept:'CSE'} projecting {usn:1,_id:0} can be covered if _id suppressed and fields indexed.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** 3-node replica, 4 shards. How many mongod data-bearing processes if each shard is a 3-member RS (no arbiters)?

**Expected Key Points:**
- 4×3=12 data-bearing mongod, plus config RS (typically 3) and mongos routers.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Model RFID tap events for 20,000 students, 10 taps/day, 5 years. Estimate docs and argue collection design.

**Expected Key Points:**
- 20k×10×365×5 ≈ 365 million events.
- Separate capped/time-series collection {usn, ts, gate}; shard on {usn, ts} or hashed usn; TTL for raw, aggregates retained.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 MongoDB for Big Data).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast MongoDB and for in the context of MongoDB for Big Data. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Big Data Analytics scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of MongoDB as used in MongoDB for Big Data. Include one precise example.

**Model answer:** MongoDB is a foundational construct in MongoDB for Big Data. Example should name entities/operations and relate to for. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on MongoDB and for. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with MongoDB for Big Data theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Big to a realistic campus/industry scenario relevant to MongoDB for Big Data. State assumptions.

**Model answer:** Describe scenario, map concepts (MongoDB, for), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on for and its role within MongoDB for Big Data.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to MongoDB if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Data within MongoDB for Big Data; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies MongoDB while building a solution involving Data. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using MongoDB for Big Data principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Big in Big Data Analytics.

**Model answer:** Provide four definitions: include MongoDB, for, and two adjacent terms from MongoDB for Big Data. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in MongoDB for Big Data that integrates MongoDB, for, and Big.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A30  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on for in MongoDB for Big Data.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to MongoDB.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both MongoDB and MongoDB for. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving MongoDB and Big: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from MongoDB for Big Data, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A33  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Big under constraints typical of Big Data Analytics.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Data depends on earlier ideas such as MongoDB in MongoDB for Big Data.

**Model answer:** Dependency chain with one counterexample showing what fails if MongoDB is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where MongoDB for measurably improves an outcome in Big Data Analytics.

**Model answer:** Context, intervention using MongoDB for, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving for in MongoDB for Big Data. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A37  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with MongoDB in MongoDB for Big Data: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Big Data Analytics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A38  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Big for MongoDB for Big Data.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Big.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around for in MongoDB for Big Data. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about MongoDB in MongoDB for Big Data, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

