# Assignment — Database Management Systems — Module 2 — Relational Model and Algebra

**Subject:** Database Management Systems  
**Module:** Module 2 — Relational Model and Algebra  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 319 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define relation, tuple, degree and cardinality.

**Expected Key Points:**
- A relation has a heading (attributes with domains) and a body (set of tuples).
- A tuple assigns a value to each attribute.
- Degree is the number of attributes; cardinality is the number of tuples.
- In the pure model, tuple order is irrelevant and duplicates are not kept.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** State entity integrity and referential integrity with a STUDENT–ENROLS–COURSE example.

**Expected Key Points:**
- Entity integrity: STUDENT.USN and COURSE.Code are non-null unique keys.
- Referential integrity: ENROLS.USN must exist in STUDENT and ENROLS.CourseId in COURSE (unless a null policy is explicitly allowed, which is unusual for enrolment keys).
- Violations are rejected or handled by cascade/restrict/set null.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** List the core relational algebra operators and one sentence each.

**Expected Key Points:**
- σ select rows; π project columns; ∪ union; ∩ intersection; − difference; × product; ⋈ join; ÷ division; ρ rename.
- Derived operators are expressed using these.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** What does union-compatible mean? Why does join not need it?

**Expected Key Points:**
- Union/intersection/difference need the same degree and compatible corresponding domains so tuples can be compared as members of one set.
- Join concatenates headings; compatibility is on join attributes’ domains, not on entire headings.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define foreign key. Can it be null? Can it reference its own relation?

**Expected Key Points:**
- An FK is a set of attributes whose non-null values must match a candidate key in a referenced relation.
- Nulls may be allowed (unknown manager).
- Recursive FKs are legal (MgrId → EmpId in EMPLOYEE).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** Give four possible outcomes of an UPDATE that changes a primary key referenced by children.

**Expected Key Points:**
- RESTRICT/NO ACTION: reject.
- CASCADE: change children.
- SET NULL: children FKs become null if permitted.
- SET DEFAULT: children take a default key.
- Choose per miniworld (USN change is rare and usually restricted).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** How is a weak entity mapped to a relation?

**Expected Key Points:**
- Relation includes owner’s primary key plus the partial key; that combination is the PK.
- Owner key is also an FK with cascade delete typically, because dependents cannot exist without the owner.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare natural join, equijoin and left outer join with one campus query each.

**Expected Key Points:**
- Natural join STUDENT ⋈ ENROLS on USN.
- Equijoin names both USN columns and keeps both.
- Left outer: all students, even with no enrolment, Grade null — useful for ‘who has not registered’.
- Inner joins drop those students.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** R 30 rows 4 attrs, S 10 rows 2 attrs sharing one key in S with each R row matching one S row. Compute degree and cardinality of R ⋈ S and of R × S.

**Expected Key Points:**
- Join: degree 4+2−1=5, cardinality 30.
- Product: degree 6, cardinality 300.
- Explain that the extra non-matching column of S is concatenated; common join attribute appears once in natural join.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain division using ‘students who registered for all courses offered by CSE this semester’.

**Expected Key Points:**
- Let T(USN, CourseId) be enrolments in CSE offerings and C(CourseId) those offerings.
- T ÷ C yields USNs such that for every CSE course, a T tuple exists.
- Students missing even one course are excluded.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO1
**Question:** Map this ER to relations: STUDENT, COURSE, M:N ENROLS with Grade; FACULTY 1:N teaches COURSE. Write keys and FKs.

**Expected Key Points:**
- STUDENT(USN PK).
- COURSE(Code PK, FacultyId FK → FACULTY).
- FACULTY(EmpId PK).
- ENROLS(USN, Code, Grade) PK(USN, Code), FKs to STUDENT and COURSE.
- If a course may have many faculty, use OFFERING instead of stuffing FacultyId on COURSE.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO2
**Question:** Inserting ENROLS('1VV24CS999','CS101', 'S') fails because that USN is missing. Name the constraint and propose a user-facing fix for the ERP.

**Expected Key Points:**
- Referential integrity on ENROLS.USN.
- The portal should require a valid student record first, or use a transactional enrolment wizard.
- Do not disable the FK.
- Optionally defer checks inside one transaction that inserts STUDENT then ENROLS.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare set difference and anti-join for ‘courses with no enrolment’.

**Expected Key Points:**
- π_Code(COURSE) − π_CourseId(ENROLS) is difference of unary projections.
- Equivalent: COURSE tuples with no matching ENROLS (anti-join / NOT EXISTS).
- Difference needs union-compatible unary relations; anti-join can keep extra COURSE attributes.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Why does projection in set algebra eliminate duplicates, and how does SQL SELECT differ unless DISTINCT is used?

**Expected Key Points:**
- Relations are sets.
- π_Dept(STAFF) has one row per department.
- SQL tables are bags: SELECT Dept FROM STAFF may repeat.
- DISTINCT or GROUP BY restores set semantics.
- VTU answers should mention both.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Give algebra expressions (not SQL) for: (i) students in CSE with CGPA>8; (ii) pairs of courses that share a student; (iii) students taking every course that USN 1VV24CS001 took.

**Expected Key Points:**
- (i) π_USN,Name(σ_Dept='CSE' ∧ CGPA>8(STUDENT)).
- (ii) ρ(E1,ENROLS) ⋈_{E1.USN=E2.USN ∧ E1.Course<E2.Course} ρ(E2,ENROLS) then project course pair.
- (iii) ENROLS ÷ π_Course(σ_USN='1VV24CS001'(ENROLS)).
- State headings.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A student writes STUDENT × COURSE to mean ‘enrolment’. Critique with cardinalities.

**Expected Key Points:**
- Product pairs every student with every course, including those not taken.
- If 8000 students and 400 courses, 3.2 million spurious tuples.
- Enrolment is a subset captured by join through ENROLS, not by product.
- Product is a building block, not a miniworld association.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO5
**Question:** On paper, show a 4-tuple trace of σ then π then ⋈ for VVIET: filter IA marks ≥ 20, project USN, join to STUDENT names. Include an intermediate relation.

**Expected Key Points:**
- Start IA(USN, Component, Marks).
- π_USN (distinct).
- ⋈ STUDENT on USN.
- Show at least four sample rows through each step so duplicates after projection are visible before distinct.
- Comment if SQL would keep bags.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** ON DELETE CASCADE from COURSE to ENROLS vs RESTRICT. Which should VVIET exam cell use, and why? Mention a safe alternative.

**Expected Key Points:**
- CASCADE would erase historical grades when a course code is retired — usually unacceptable.
- RESTRICT (or a soft-delete / validity-date on COURSE) preserves academic history.
- If codes must change, CASCADE UPDATE of the key or a surrogate CourseId is safer than deleting facts.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain why Codd’s algebra is a closed system and how that helps query optimization. Give two rewrite examples.

**Expected Key Points:**
- Every operator returns a relation, so expressions compose.
- Optimizers replace σ(R ⋈ S) by (σ(R) ⋈ S) when the predicate refers only to R, and push projections.
- Union and join associativity allow alternative plans.
- Closure is why algebraic laws are valid rewrites, not ad-hoc scripts.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO5
**Question:** R ∩ S has 12 tuples. |R|=50, |S|=40. Find |R ∪ S|, |R − S|, |S − R|. Then, if a join key matches 12 tuples one-to-one, contrast with |R ⋈ S| under that assumption.

**Expected Key Points:**
- |R ∪ S|=50+40−12=78.
- If 12 tuples match 1-1 on a key, |R ⋈ S|=12, which is not the union size.
- Join cardinality is about matching, not set-union arithmetic.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Relational Model and Algebra).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Given Student(ID,Name,Dept) and Enroll(ID,Course,Grade), write algebra for names of students in CS enrolled in DB.

**Model answer:** π_Name (σ_Dept='CS'(Student) ⨝ σ_Course='DB'(Enroll)).

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define relation schema vs relation instance.

**Model answer:** Schema: name + attributes + domains. Instance: set of tuples at a time (no duplicates in pure model).

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Using algebra, find course IDs taken by all students in dept D (division pattern).

**Model answer:** π_Course(Enroll) ÷ π_ID(σ_Dept=D Student) with correct dividend schema.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Express antijoin: students with no enrollments.

**Model answer:** Student ▷ Enroll or π(Student) − π_ID(Student ⨝ Enroll) appropriately.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** State entity integrity and referential integrity.

**Model answer:** Entity: primary key ≠ null. Referential: FK null or matches existing PK.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: nullable FK to represent optional advisor. Discuss outer joins in reporting.

**Model answer:** LEFT OUTER JOIN students to advisor; NULLs mean unassigned; careful with predicates on nullable side.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare θ-join, equijoin, and natural join.

**Model answer:** θ-join arbitrary condition; equijoin equality; natural join equality on common names + project-out duplicates.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** What is a candidate key vs superkey?

**Model answer:** Superkey uniquely identifies; candidate key is minimal superkey.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Compare RA expressiveness vs safe relational calculus; write a short note.

**Model answer:** Codd: equivalent expressive power for safe queries; calculus declarative vs algebra procedural.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Translate a business rule ‘each project has one manager’ into relational constraints.

**Model answer:** FK Project.manager → Emp.ID; optionally UNIQUE if 1:1; NOT NULL.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A31  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Justify including ∪, −, × as primitive vs defining via others.

**Model answer:** Different complete sets exist; teaching often takes select/project/union/difference/product as basis.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Analyst uses Cartesian product without join condition. What goes wrong?

**Model answer:** Combinatorial explosion / meaningless pairs; almost always a bug.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A33  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret π_A (r) when r has duplicate A values in bags vs sets.

**Model answer:** Set algebra removes duplicates; SQL bags keep them unless DISTINCT.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Why is division useful? Give schema example Supplier–Part.

**Model answer:** Suppliers who supply all parts: SP ÷ Parts.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A35  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design schemas for Library with referential actions ON DELETE for Copy vs Loan.

**Model answer:** Deleting Book cascades/restricts Copies; Loans restrict if active; choose business policy.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use rename operator ρ to join a relation with itself for prerequisite pairs.

**Model answer:** ρ_P(prereq) ⨝ ... Course with aliases for course vs prereq ids.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Explain
**Question:** Define domain constraint with an example.

**Model answer:** Attribute values drawn from domain (e.g., Grade ∈ {S,A,B,C,F}).

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 2 marks

### A38  ·  Difficult  ·  8 marks  ·  Algorithm
**Question:** Describe how a query optimizer might reorder joins (conceptual).

**Model answer:** Search plan space; cost model with statistics; prefer small intermediate results.

**Evaluation scheme:**
- Correctness — 4 marks
- Complexity — 2 marks
- Clarity — 2 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Give an example update anomaly in an unnormalized student-course table.

**Model answer:** Repeating student address per enrollment; update one row leave others stale.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Interpret a relational expression that projects away a FK. Integrity impact?

**Model answer:** Result may be a view without the FK column; base tables still enforce integrity.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

