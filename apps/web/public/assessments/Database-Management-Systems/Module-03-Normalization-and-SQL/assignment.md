# Assignment — Database Management Systems — Module 3 — Normalization and SQL

**Subject:** Database Management Systems  
**Module:** Module 3 — Normalization and SQL  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 319 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain insertion, update and deletion anomalies with a single unnormalized CAMPUS table of student+course+faculty.

**Expected Key Points:**
- If StudentName, CourseName and FacultyPhone sit in one enrolment row: changing a phone needs many updates (update anomaly); a new course cannot be stored without a dummy student (insertion); deleting the last student may lose the course (deletion).
- Normalization separates facts.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define functional dependency and give three FDs for ENROLS(USN, CourseId, Grade, StudentName).

**Expected Key Points:**
- X→Y: equal X implies equal Y.
- USN,CourseId → Grade; USN → StudentName; USN,CourseId → StudentName.
- StudentName depending only on USN is a partial/transitive issue if the key is (USN, CourseId).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** State 1NF, 2NF and 3NF in one paragraph each with a yes/no test.

**Expected Key Points:**
- 1NF: atomic values.
- 2NF: 1NF + no non-prime partially dependent on a composite key.
- 3NF: 2NF + no non-prime transitively dependent on a key (or: for each FD, LHS superkey or RHS prime).
- Test with FDs, not with ‘number of tables’.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Write a CREATE TABLE for COURSE with PK, a CHECK on credits 1–5, and NOT NULL title.

**Expected Key Points:**
- CREATE TABLE course (code VARCHAR(10) PRIMARY KEY, title VARCHAR(100) NOT NULL, credits INT NOT NULL CHECK (credits BETWEEN 1 AND 5)); Mention that CHECK is enforced per row.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Differentiate WHERE and HAVING with a query that prints departments whose average CGPA exceeds 8.

**Expected Key Points:**
- WHERE dept IS NOT NULL filters students first.
- GROUP BY dept.
- HAVING AVG(cgpa)>8 filters groups.
- You cannot put AVG in WHERE without a subquery.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four SQL constraint types and what each prevents.

**Expected Key Points:**
- NOT NULL; UNIQUE/PRIMARY KEY (duplicates/null PK); FOREIGN KEY (orphans); CHECK (miniworld predicates).
- DEFAULT is a value, not a predicate.
- UNIQUE allows multiple nulls in some products—mention the product caveat.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a view? Give two reasons the exam cell would use one.

**Expected Key Points:**
- A named query.
- Reasons: hide SEE marks from clerks (authorization); present ‘eligible students’ without schema change (logical independence / external schema).
- Updatability is limited; WITH CHECK OPTION if inserts are allowed.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** R(A,B,C,D), F={A→B, B→C, AC→D}. Compute A+, AB+, AC+. Is AC a superkey? Identify a candidate key.

**Expected Key Points:**
- A+ = ABC (A→B→C, not D).
- AC+ = ABCD (AC→D and A→B).
- Yes, AC is a superkey.
- AC is a candidate key if neither A nor C is a superkey: C+ = C, A+ ≠ ABCD, so AC is a candidate key.
- (If other keys exist, list them.)
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare 3NF and BCNF. Give a small relation that is 3NF but not BCNF.

**Expected Key Points:**
- Classic: R(Student, Subject, Teacher) with {Student,Subject}→Teacher and Teacher→Subject.
- Keys: {Student,Subject} and {Student,Teacher}.
- Teacher→Subject has non-superkey LHS but Subject is prime ⇒ 3NF not BCNF.
- Explain the anomaly (one teacher, two subjects).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO5
**Question:** Normalize STAFF(EmpId, Name, DeptId, DeptName, Phone, ProjectId, ProjectName) assuming EmpId→Name,DeptId,Phone; DeptId→DeptName; ProjectId→ProjectName; EmpId,ProjectId is needed for assignment. Produce 3NF relations.

**Expected Key Points:**
- STAFF(EmpId, Name, DeptId, Phone); DEPT(DeptId, DeptName); PROJECT(ProjectId, ProjectName); WORKS_ON(EmpId, ProjectId).
- Keys as named.
- EmpId→DeptName was transitive; project name was an M:N mix.
- State FDs used.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain lossless-join and the test using FDs for a two-way decomposition.

**Expected Key Points:**
- R1 ⋈ R2 should equal R.
- Test: (R1 ∩ R2) → (R1 − R2) or (R1 ∩ R2) → (R2 − R1) given F.
- If the common set is a key of one piece, join is lossless.
- Counterexample: split Student,Course,Grade on Student vs Course only, producing a product of enrolments.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** Write SQL: list names of CSE students who have not enrolled in any course this semester. Use NOT EXISTS or EXCEPT.

**Expected Key Points:**
- SELECT name FROM student s WHERE dept='CSE' AND NOT EXISTS (SELECT 1 FROM enrols e WHERE e.usn=s.usn AND e.sem=current).
- Alternative: except on USN sets then join names.
- Mention NULL-safe thinking: NOT IN is dangerous if the subquery can produce NULL USNs.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO2
**Question:** A clerk’s view shows only hostel students. They INSERT a row that would belong to a day-scholar. Explain WITH CHECK OPTION.

**Expected Key Points:**
- Without CHECK OPTION the row may land in the base table and vanish from the view (confusing).
- WITH CHECK OPTION rejects tuples that fail hostel_student predicate, preserving the external schema contract.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare correlated vs uncorrelated subqueries; rewrite one VVIET query both ways (students above department average CGPA).

**Expected Key Points:**
- Uncorrelated: average computed per dept in a derived table, then join.
- Correlated: s.cgpa > (SELECT AVG(s2.cgpa) FROM student s2 WHERE s2.dept=s.dept).
- Correlation is per outer row; the derived-table form often optimizes better.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** From FDs on LIBRARY(CopyId, ISBN, Title, USN, BorrowDate, FineRate, Category) produce a 3NF schema and justify lossless preservation as far as possible.

**Expected Key Points:**
- BOOK(ISBN, Title, Category, FineRate if rate depends on category).
- COPY(CopyId, ISBN).
- LOAN(CopyId, USN, BorrowDate) or include return.
- If FineRate depends on Category, do not store it on each loan.
- Give a canonical cover, relations per FD, and add a key relation if needed.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A teammate says ‘put every table in BCNF at all costs’. Critique using dependency preservation and a 3NF synthesis alternative.

**Expected Key Points:**
- Some BCNF decompositions force checking FDs via joins (extra cost, easy to forget in SQL).
- 3NF synthesis guarantees lossless and dependency-preserving designs; remaining BCNF violations may be acceptable if they are rare and controlled by application constraints.
- Design is a trade-off, not a slogan.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO2
**Question:** Write SQL for: (1) CREATE TABLEs with FKs for STUDENT, COURSE, ENROLS; (2) students and the count of courses; (3) courses with zero enrolments (outer join).

**Expected Key Points:**
- (1) PKs and ENROLS FKs with ON DELETE RESTRICT.
- (2) SELECT usn, COUNT(course_id) FROM enrols GROUP BY usn — mention LEFT JOIN student to include zeros.
- (3) FROM course LEFT JOIN enrols ON code=course_id WHERE enrols.course_id IS NULL.
- Include sample output shape.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO3
**Question:** R(A,B,C,D,E), F={A→BC, CD→E, B→D, E→A}. Find all candidate keys. Show closures.

**Expected Key Points:**
- A+ = ABCDE (A→BC, B→D, CD→E).
- E+ = EA then same.
- CD+ : CD→E→A→BC so CD+ = ABCDE.
- B+ = BD only.
- Candidate keys include A, E, CD, and BC (BC→D so BCD then E,A).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why SQL is not pure relational algebra (bags, nulls, order). How should a VTU student still use algebra to plan queries?

**Expected Key Points:**
- SQL tables are bags unless DISTINCT; NULL breaks two-valued logic (UNKNOWN in WHERE); ORDER BY is extra-relational.
- Algebra remains the planning language: push selects, choose join order, replace division by NOT EXISTS.
- Know three-valued logic for NOT IN.
- Exam answers should not pretend SQL = algebra.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO5
**Question:** SEE marks need a running average on a dashboard and a constraint that IA total ≤ 40. Propose SQL objects (views, CHECK, possibly a trigger) and discuss 3NF placement of marks.

**Expected Key Points:**
- Store atomic scores in ASSESSMENT(USN, OfferingId, Component, Marks) 3NF, not repeating IA1 IA2 columns if components grow.
- CHECK (marks >=0 AND component rules).
- View offering_totals AS SUM.
- CHECK on IA sum may need a trigger or materialized constraint because it spans rows.
- Dashboard reads the view, not the unnormalized spreadsheet.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Normalization and SQL).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Given FDs: A→B, B→C, AC→D, compute attribute closure of A.

**Model answer:** A+ = ABC (then not D unless via AC); explain steps with Armstrong axioms.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define functional dependency X → Y.

**Model answer:** For any two tuples, equal X ⇒ equal Y. Property of the miniworld / intended constraints.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Prove lossless-join for a binary decomposition using the FD chase/criterion.

**Model answer:** If FD X→Y and X is key of one subschema spanning the overlap, decomposition is lossless.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Decompose R(A,B,C,D) with key A and FDs A→BC, B→D into 3NF.

**Model answer:** Create schemas for each FD / use synthesis; e.g., (A,B,C), (B,D) if B→D and check lossless.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** State 1NF, 2NF, 3NF briefly.

**Model answer:** 1NF atomic attributes; 2NF no partial dependency on whole key; 3NF no transitive dependency on key.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: SQL NULL marks and three-valued logic bug in NOT IN subquery.

**Model answer:** NOT IN with NULLs yields unknown; prefer NOT EXISTS / anti-join patterns.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare 3NF and BCNF with an example that is 3NF but not BCNF.

**Model answer:** Classic: overlapping candidate keys causing FD where determinant not superkey.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** What is a trivial FD?

**Model answer:** Y ⊆ X for X→Y.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Lab: normalize a messy spreadsheet of campus clubs to 3NF and load with SQL DDL/DML.

**Model answer:** Identify FDs, decompose, CREATE TABLE+FKs, INSERT, sample queries; document anomalies removed.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Write SQL to find students with CGPA above dept average (nested query).

**Model answer:** WHERE cgpa > (SELECT AVG(cgpa) FROM student s2 WHERE s2.dept=s1.dept).

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A31  ·  Difficult  ·  8 marks  ·  Code
**Question:** Explain what this query does and its pitfalls: SELECT dept, COUNT(*) FROM emp WHERE salary>50000 GROUP BY dept;

**Model answer:** Counts high-salary employees per dept; excludes NULL dept unless grouped; filter before aggregate.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity/edges — 2 marks
- Clarity — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Team denormalizes for read performance. What integrity risks appear?

**Model answer:** Redundancy → update anomalies; need triggers or app discipline.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret EXPLAIN showing a full table scan on a selective WHERE. Likely fix?

**Model answer:** Missing/unusable index; rewrite function-wrapped columns; update stats.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Difference between WHERE and HAVING.

**Model answer:** WHERE filters rows before grouping; HAVING filters groups after aggregation.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design 3NF schemas for Order(orderId, customerId, customerCity, itemId, price, qty) with obvious FDs.

**Model answer:** Customer(customerId,city); Item(itemId,price); Order(orderId,customerId); OrderLine(orderId,itemId,qty).

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use WINDOW functions (conceptually) to rank students by CGPA within dept.

**Model answer:** RANK() OVER (PARTITION BY dept ORDER BY cgpa DESC).

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Explain
**Question:** Define multivalued dependency and 4NF at a high level.

**Model answer:** MVDs independent multi-valued facts; 4NF removes non-trivial MVDs not implied by keys.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 2 marks

### A38  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Describe 3NF synthesis algorithm steps.

**Model answer:** Minimal cover; one schema per FD; ensure key schema; remove contained schemas.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Write a SQL UNIQUE + NOT NULL constraint approximating a candidate key.

**Model answer:** UNIQUE(col) with NOT NULL on the columns of the key.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Interpret a decomposition that is dependency-preserving vs one that is not.

**Model answer:** Preserving: local checks imply global FDs. If not, may need costly joins to enforce FDs.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

