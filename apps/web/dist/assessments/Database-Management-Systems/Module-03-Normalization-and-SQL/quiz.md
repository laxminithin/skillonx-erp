# Quiz — Database Management Systems — Module 3: Normalization and SQL

**Subject:** Database Management Systems  
**Module:** Module 3 — Normalization and SQL  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A table is in 1NF if:

- **A.** It has at least three keys
- **B.** All attribute values are atomic (no repeating groups)
- **C.** Every FD has a superkey left-hand side
- **D.** There are no transitive FDs

**Answer:** B
**Explanation:** 1NF is about atomic domains.

### Q02  ·  Easy
**Question:** FOREIGN KEY (dept_id) REFERENCES department(id) ON DELETE CASCADE means:

- **A.** Deleting a department deletes referencing staff rows
- **B.** Deleting staff deletes the department
- **C.** Deletes are always rejected
- **D.** CASCADE applies only to SELECT

**Answer:** A
**Explanation:** Child rows follow parent deletion.

### Q03  ·  Easy
**Question:** Given FDs {A→B, B→C}, which is a transitive dependency?

- **A.** C → A always
- **B.** B → B only
- **C.** A → A only
- **D.** A → C (via B) with B not a key in typical examples

**Answer:** D
**Explanation:** Transitive: A→B and B→C imply A→C.

### Q04  ·  Easy
**Question:** SELECT DISTINCT dept FROM staff; is closest to which algebra operator?

- **A.** Projection
- **B.** Division
- **C.** Selection only
- **D.** Rename of a key

**Answer:** A
**Explanation:** DISTINCT projection.

### Q05  ·  Easy
**Question:** Which option best describes **3NF**?

- **A.** No FDs exist.
- **B.** 2NF and no non-prime attribute is transitively dependent on a candidate key (equivalently: for every FD X→A, X is a superkey or A is prime).
- **C.** Every determinant is a candidate key.
- **D.** 1NF only.

**Answer:** B
**Explanation:** 3NF: 2NF and no non-prime attribute is transitively dependent on a candidate key (equivalently: for every FD X→A, X is a superkey or A is prime).

### Q06  ·  Easy
**Question:** Which option best describes **Armstrong’s axioms**?

- **A.** CAP theorem proofs.
- **B.** SQL syntax rules.
- **C.** Lock compatibility rules.
- **D.** Sound and complete inference rules (reflexivity, augmentation, transitivity) for FDs.

**Answer:** D
**Explanation:** Armstrong’s axioms: Sound and complete inference rules (reflexivity, augmentation, transitivity) for FDs.

### Q07  ·  Easy
**Question:** Which option best describes **Dependency preservation**?

- **A.** SQL cannot express FDs.
- **B.** Each FD in F can be enforced within some individual decomposed relation (no cross-relation FDs left unchecked).
- **C.** Only BCNF matters, never FDs.
- **D.** All FDs are discarded.

**Answer:** B
**Explanation:** Dependency preservation: Each FD in F can be enforced within some individual decomposed relation (no cross-relation FDs left unchecked).

### Q08  ·  Easy
**Question:** Which option best describes **Functional dependency**?

- **A.** X → Y means any two tuples that agree on X must agree on Y.
- **B.** X → Y means Y determines X.
- **C.** An FD is a foreign key only.
- **D.** FDs exist only in BCNF.

**Answer:** A
**Explanation:** Functional dependency: X → Y means any two tuples that agree on X must agree on Y.

### Q09  ·  Easy
**Question:** Which option best describes **Update anomaly**?

- **A.** A failed inner join that is still 3NF.
- **B.** A disk sector error.
- **C.** A modification that becomes inconsistent because the same fact is stored in multiple rows.
- **D.** A missing GRANT.

**Answer:** C
**Explanation:** Update anomaly: A modification that becomes inconsistent because the same fact is stored in multiple rows.

### Q10  ·  Easy
**Question:** Which option best describes **View**?

- **A.** A deadlock cycle.
- **B.** A heap file of indexes only.
- **C.** A named virtual (or materialized) table defined by a query; used for security, simplicity and logical independence.
- **D.** A WAL record.

**Answer:** C
**Explanation:** View: A named virtual (or materialized) table defined by a query; used for security, simplicity and logical independence.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **SQL SELECT logical processing**?

- **A.** ORDER BY then FROM
- **B.** FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT list → DISTINCT → ORDER BY
- **C.** HAVING before WHERE on raw rows only
- **D.** SELECT list before FROM

**Answer:** B
**Explanation:** Correct sequence for SQL SELECT logical processing: FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT list → DISTINCT → ORDER BY

### Q12  ·  Easy
**Question:** Which sequence correctly describes **testing if X is a superkey**?

- **A.** Check only that X is one column
- **B.** Compute X+ under F → if X+ contains all attributes of R, X is a superkey
- **C.** Join R to itself on Y
- **D.** Count nulls in X

**Answer:** B
**Explanation:** Correct sequence for testing if X is a superkey: Compute X+ under F → if X+ contains all attributes of R, X is a superkey

### Q13  ·  Intermediate
**Question:** A correlated subquery in WHERE EXISTS typically:

- **A.** Never reads the outer row
- **B.** References a column of the outer query
- **C.** Creates a new base table
- **D.** Is the same as a UNION

**Answer:** B
**Explanation:** Correlation ties inner to outer.

### Q14  ·  Intermediate
**Question:** A report needs all departments and their staff, including empty departments. Join type:

- **A.** LEFT OUTER JOIN from DEPARTMENT to STAFF
- **B.** INNER JOIN only
- **C.** CROSS JOIN as the only option
- **D.** UNION ALL of keys without nulls

**Answer:** A
**Explanation:** Keep unmatched departments.

### Q15  ·  Intermediate
**Question:** Deleting the last enrolled student also loses the only copy of CourseName. This is:

- **A.** A deletion anomaly
- **B.** BCNF by definition
- **C.** ON DELETE RESTRICT working
- **D.** A nested query

**Answer:** A
**Explanation:** Course existence should not depend on enrolment rows.

### Q16  ·  Intermediate
**Question:** ENROLS has PRIMARY KEY(USN, CourseId). Inserting a second grade row for the same pair fails due to:

- **A.** A missing JOIN
- **B.** A key / uniqueness constraint
- **C.** A correlated subquery
- **D.** 1NF atomicity of Grade

**Answer:** B
**Explanation:** Composite PK forbids duplicate enrolment.

### Q17  ·  Intermediate
**Question:** R is in 3NF but not BCNF when:

- **A.** Repeating groups remain
- **B.** A non-trivial FD X→A holds, X is not a superkey, but A is prime
- **C.** No FDs hold and 1NF fails
- **D.** A partial FD of a non-prime on part of a key remains

**Answer:** B
**Explanation:** Classic 3NF–BCNF gap.

### Q18  ·  Intermediate
**Question:** STAFF(EmpId, DeptId, DeptName, Phone) with EmpId key and DeptId→DeptName. Changing a department name needs many row edits. This is:

- **A.** A missing GRANT
- **B.** A lossless-join failure of a BCNF schema
- **C.** A 1NF repeating-group problem only
- **D.** An update anomaly from a transitive FD

**Answer:** D
**Explanation:** DeptName should live in DEPARTMENT.

### Q19  ·  Intermediate
**Question:** WITH CHECK OPTION on a view means:

- **A.** The view cannot be queried
- **B.** Inserts/updates through the view must satisfy the view predicate
- **C.** FKs are disabled
- **D.** The view is materialized on disk always

**Answer:** B
**Explanation:** Prevents tuples that would disappear from the view.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **2NF** and **3NF**?

- **A.** 2NF removes partial FDs of non-primes on key parts; 3NF also removes transitive FDs of non-primes.
- **B.** 3NF is weaker than 1NF.
- **C.** 2NF requires every determinant to be a key.
- **D.** They differ only in the number of tables, not FDs.

**Answer:** A
**Explanation:** 2NF removes partial FDs of non-primes on key parts; 3NF also removes transitive FDs of non-primes.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **INNER JOIN** and **LEFT OUTER JOIN**?

- **A.** Left outer drops left orphans.
- **B.** Inner keeps matches only; left outer keeps all left rows, filling right columns with null when unmatched.
- **C.** They return the same bag on every schema.
- **D.** Inner always pads nulls.

**Answer:** B
**Explanation:** Inner keeps matches only; left outer keeps all left rows, filling right columns with null when unmatched.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **correlated subquery** and **uncorrelated subquery**?

- **A.** They always have identical plans.
- **B.** A correlated subquery references outer-query columns and re-executes per outer row; an uncorrelated one can run once.
- **C.** Correlated subqueries cannot appear in WHERE.
- **D.** Uncorrelated subqueries are illegal.

**Answer:** B
**Explanation:** A correlated subquery references outer-query columns and re-executes per outer row; an uncorrelated one can run once.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **lossless join** and **dependency preservation**?

- **A.** Lossless means FDs are lost.
- **B.** Lossless join reconstructs data; dependency preservation lets each FD be checked locally.
- **C.** They are the same property.
- **D.** BCNF always gives both.

**Answer:** B
**Explanation:** Lossless join reconstructs data; dependency preservation lets each FD be checked locally.

### Q24  ·  Intermediate
**Question:** Which SQL clause filters groups?

- **A.** HAVING
- **B.** VALUES
- **C.** WHERE only
- **D.** FROM only

**Answer:** A
**Explanation:** HAVING is post-aggregation.

### Q25  ·  Intermediate
**Question:** Which option best describes **1NF**?

- **A.** No transitive FDs.
- **B.** Every FD is a key.
- **C.** Every determinant is a candidate key.
- **D.** Every attribute value is atomic; no repeating groups or nested relations in a cell.

**Answer:** D
**Explanation:** 1NF: Every attribute value is atomic; no repeating groups or nested relations in a cell.

### Q26  ·  Intermediate
**Question:** Which option best describes **2NF**?

- **A.** 1NF and every non-prime attribute is fully dependent on each candidate key (no partial dependency on a key part).
- **B.** 1NF plus no transitive FDs only.
- **C.** A table with no FDs.
- **D.** BCNF by another name.

**Answer:** A
**Explanation:** 2NF: 1NF and every non-prime attribute is fully dependent on each candidate key (no partial dependency on a key part).

### Q27  ·  Intermediate
**Question:** Which option best describes **Attribute closure X+**?

- **A.** The set of attributes functionally determined by X using a given set F of FDs.
- **B.** All attributes not in X.
- **C.** The set of superkeys of the database.
- **D.** The SQL GROUP BY list.

**Answer:** A
**Explanation:** Attribute closure X+: The set of attributes functionally determined by X using a given set F of FDs.

### Q28  ·  Intermediate
**Question:** Which option best describes **BCNF**?

- **A.** 1NF with atomic dates only.
- **B.** For every non-trivial FD X → A, X is a superkey (every determinant is a candidate key).
- **C.** 3NF plus allowing leftover partial FDs.
- **D.** A normal form about lossless XML.

**Answer:** B
**Explanation:** BCNF: For every non-trivial FD X → A, X is a superkey (every determinant is a candidate key).

### Q29  ·  Intermediate
**Question:** Which option best describes **CHECK constraint**?

- **A.** An isolation level.
- **B.** A predicate that every tuple must satisfy, enforced on insert/update.
- **C.** A comment in SQL.
- **D.** A view name.

**Answer:** B
**Explanation:** CHECK constraint: A predicate that every tuple must satisfy, enforced on insert/update.

### Q30  ·  Intermediate
**Question:** Which option best describes **CREATE TABLE**?

- **A.** DDL that names a relation, attributes, types and constraints (PK, FK, UNIQUE, CHECK, NOT NULL).
- **B.** A DML command that inserts rows.
- **C.** A GRANT only.
- **D.** A view refresh.

**Answer:** A
**Explanation:** CREATE TABLE: DDL that names a relation, attributes, types and constraints (PK, FK, UNIQUE, CHECK, NOT NULL).

### Q31  ·  Intermediate
**Question:** Which option best describes **Deletion anomaly**?

- **A.** Dropping an unused index.
- **B.** Loss of a still-needed fact when a row is deleted because facts were mixed in one table.
- **C.** A failed CHECK on age.
- **D.** ON DELETE RESTRICT working as designed.

**Answer:** B
**Explanation:** Deletion anomaly: Loss of a still-needed fact when a row is deleted because facts were mixed in one table.

### Q32  ·  Intermediate
**Question:** Which option best describes **INNER JOIN**?

- **A.** Returns combined rows only when the join predicate matches.
- **B.** Is identical to UNION.
- **C.** Keeps all left rows with null pads always.
- **D.** Deletes unmatched parents.

**Answer:** A
**Explanation:** INNER JOIN: Returns combined rows only when the join predicate matches.

### Q33  ·  Intermediate
**Question:** Which option best describes **Insertion anomaly**?

- **A.** A successful CREATE TABLE.
- **B.** Inability to record a fact until an unrelated fact is also present (for example, a course without a student).
- **C.** Inserting a tuple that satisfies all keys.
- **D.** A view with CHECK OPTION.

**Answer:** B
**Explanation:** Insertion anomaly: Inability to record a fact until an unrelated fact is also present (for example, a course without a student).

### Q34  ·  Intermediate
**Question:** Which option best describes **Lossless-join decomposition**?

- **A.** A decomposition that always loses tuples.
- **B.** Decomposing R so the natural join of parts reconstructs R exactly (no spurious tuples).
- **C.** A view WITH CHECK OPTION.
- **D.** Union of projections that need not join back.

**Answer:** B
**Explanation:** Lossless-join decomposition: Decomposing R so the natural join of parts reconstructs R exactly (no spurious tuples).

### Q35  ·  Intermediate
**Question:** Which option best describes **Nested query**?

- **A.** A lock timeout.
- **B.** A stored procedure in PL/SQL only.
- **C.** A SELECT used inside another SQL statement, in WHERE/HAVING/FROM (derived table) or as a scalar subquery.
- **D.** An ER aggregation.

**Answer:** C
**Explanation:** Nested query: A SELECT used inside another SQL statement, in WHERE/HAVING/FROM (derived table) or as a scalar subquery.

### Q36  ·  Intermediate
**Question:** Which option best describes **Trivial FD**?

- **A.** A multi-valued dependency that is not implied.
- **B.** A join dependency.
- **C.** An FD that never holds.
- **D.** An FD X → Y where Y ⊆ X.

**Answer:** D
**Explanation:** Trivial FD: An FD X → Y where Y ⊆ X.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **enforcing a CHECK and FK on INSERT**?

- **A.** Insert first, check at shutdown
- **B.** Parse row → type/domain → NOT NULL/CHECK → primary/unique keys → foreign keys → commit row
- **C.** Only check ORDER BY
- **D.** Skip FK if CHECK passed

**Answer:** B
**Explanation:** Correct sequence for enforcing a CHECK and FK on INSERT: Parse row → type/domain → NOT NULL/CHECK → primary/unique keys → foreign keys → commit row

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **normalizing toward 3NF (synthesis idea)**?

- **A.** Always split every attribute into its own table first
- **B.** Drop all FDs then CREATE INDEX
- **C.** Find canonical cover → create a relation per FD group → add a key relation if needed → test lossless
- **D.** Put all attributes in one table and add more repeating groups

**Answer:** C
**Explanation:** Correct sequence for normalizing toward 3NF (synthesis idea): Find canonical cover → create a relation per FD group → add a key relation if needed → test lossless

### Q39  ·  Intermediate
**Question:** Which statement about **2NF** is FALSE?

- **A.** A useful way to remember 2NF is that it is not the same as “1NF plus no transitive FDs only”.
- **B.** 2NF is violated only by transitive dependencies, not by partial ones.
- **C.** 2NF is correctly understood as: 1NF and every non-prime attribute is fully dependent on each candidate key (no partial dependency on a key part).
- **D.** In this module, 2NF is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: 2NF is violated only by transitive dependencies, not by partial ones.. 2NF actually means: 1NF and every non-prime attribute is fully dependent on each candidate key (no partial dependency on a key part).

### Q40  ·  Intermediate
**Question:** Which statement about **Armstrong’s axioms** is FALSE?

- **A.** In this module, Armstrong’s axioms is a core idea students must distinguish from nearby terms.
- **B.** Armstrong’s axioms apply only to multi-valued dependencies, not FDs.
- **C.** A useful way to remember Armstrong’s axioms is that it is not the same as “SQL syntax rules”.
- **D.** Armstrong’s axioms is correctly understood as: sound and complete inference rules (reflexivity, augmentation, transitivity) for FDs.

**Answer:** B
**Explanation:** The false claim is: Armstrong’s axioms apply only to multi-valued dependencies, not FDs.. Armstrong’s axioms actually means: Sound and complete inference rules (reflexivity, augmentation, transitivity) for FDs.

### Q41  ·  Intermediate
**Question:** Which statement about **BCNF** is FALSE?

- **A.** BCNF permits a non-superkey determinant as long as the dependent is prime.
- **B.** A useful way to remember BCNF is that it is not the same as “3NF plus allowing leftover partial FDs”.
- **C.** BCNF is correctly understood as: for every non-trivial FD X → A, X is a superkey (every determinant is a candidate key).
- **D.** In this module, BCNF is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: BCNF permits a non-superkey determinant as long as the dependent is prime.. BCNF actually means: For every non-trivial FD X → A, X is a superkey (every determinant is a candidate key).

### Q42  ·  Intermediate
**Question:** Which statement about **Deletion anomaly** is FALSE?

- **A.** Deletion anomaly is correctly understood as: loss of a still-needed fact when a row is deleted because facts were mixed in one table.
- **B.** A useful way to remember Deletion anomaly is that it is not the same as “ON DELETE RESTRICT working as designed”.
- **C.** Deletion anomalies never happen in 1NF tables even if they mix course and student facts.
- **D.** In this module, Deletion anomaly is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Deletion anomalies never happen in 1NF tables even if they mix course and student facts.. Deletion anomaly actually means: Loss of a still-needed fact when a row is deleted because facts were mixed in one table.

### Q43  ·  Intermediate
**Question:** Which statement about **Dependency preservation** is FALSE?

- **A.** Dependency preservation is correctly understood as: each FD in F can be enforced within some individual decomposed relation (no cross-relation FDs left unchecked).
- **B.** In this module, Dependency preservation is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Dependency preservation is that it is not the same as “All FDs are discarded”.
- **D.** A BCNF decomposition is always dependency-preserving.

**Answer:** D
**Explanation:** The false claim is: A BCNF decomposition is always dependency-preserving.. Dependency preservation actually means: Each FD in F can be enforced within some individual decomposed relation (no cross-relation FDs left unchecked).

### Q44  ·  Intermediate
**Question:** Which statement about **INNER JOIN** is FALSE?

- **A.** INNER JOIN keeps unmatched rows from both sides with nulls.
- **B.** In this module, INNER JOIN is a core idea students must distinguish from nearby terms.
- **C.** INNER JOIN is correctly understood as: returns combined rows only when the join predicate matches.
- **D.** A useful way to remember INNER JOIN is that it is not the same as “Keeps all left rows with null pads always”.

**Answer:** A
**Explanation:** The false claim is: INNER JOIN keeps unmatched rows from both sides with nulls.. INNER JOIN actually means: Returns combined rows only when the join predicate matches.

### Q45  ·  Intermediate
**Question:** Which statement about **Nested query** is FALSE?

- **A.** Nested query is correctly understood as: a SELECT used inside another SQL statement, in WHERE/HAVING/FROM (derived table) or as a scalar subquery.
- **B.** In this module, Nested query is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Nested query is that it is not the same as “A stored procedure in PL/SQL only”.
- **D.** Nested queries are illegal in standard SQL SELECT.

**Answer:** D
**Explanation:** The false claim is: Nested queries are illegal in standard SQL SELECT.. Nested query actually means: A SELECT used inside another SQL statement, in WHERE/HAVING/FROM (derived table) or as a scalar subquery.

### Q46  ·  Intermediate
**Question:** Which statement about **Trivial FD** is FALSE?

- **A.** In this module, Trivial FD is a core idea students must distinguish from nearby terms.
- **B.** Trivial FDs are illegal and must be removed from every cover.
- **C.** A useful way to remember Trivial FD is that it is not the same as “An FD that never holds”.
- **D.** Trivial FD is correctly understood as: an FD X → Y where Y ⊆ X.

**Answer:** B
**Explanation:** The false claim is: Trivial FDs are illegal and must be removed from every cover.. Trivial FD actually means: An FD X → Y where Y ⊆ X.

### Q47  ·  Intermediate
**Question:** Which statement about **Update anomaly** is FALSE?

- **A.** In this module, Update anomaly is a core idea students must distinguish from nearby terms.
- **B.** Update anomaly is correctly understood as: a modification that becomes inconsistent because the same fact is stored in multiple rows.
- **C.** Update anomalies cannot occur if a table is unnormalized with repeating groups.
- **D.** A useful way to remember Update anomaly is that it is not the same as “A disk sector error”.

**Answer:** C
**Explanation:** The false claim is: Update anomalies cannot occur if a table is unnormalized with repeating groups.. Update anomaly actually means: A modification that becomes inconsistent because the same fact is stored in multiple rows.

### Q48  ·  Difficult
**Question:** A BCNF decomposition may fail to be dependency-preserving. The practical implication is:

- **A.** The join of projections cannot equal R
- **B.** Some FDs require a join (or extra constraint) to check, not a single-relation constraint
- **C.** 1NF is lost
- **D.** SQL cannot use PRIMARY KEY

**Answer:** B
**Explanation:** Lossless BCNF vs preserving FDs is a known trade-off.

### Q49  ·  Difficult
**Question:** CREATE VIEW cse_students AS SELECT ... FROM student WHERE dept='CSE'; Privilege granted only on the view. This supports:

- **A.** Timestamp ordering
- **B.** Authorization and a tailored external schema
- **C.** WAL undo
- **D.** Physical clustering only

**Answer:** B
**Explanation:** Views implement external schemas and security.

### Q50  ·  Difficult
**Question:** Cannot insert a new COURSE until a student enrols, because CourseName sits only in ENROLS. This is:

- **A.** Entity integrity on COURSE
- **B.** A view CHECK OPTION success
- **C.** A successful 3NF design
- **D.** An insertion anomaly

**Answer:** D
**Explanation:** Independent facts mixed in one table.

### Q51  ·  Difficult
**Question:** Decompose R(A,B,C) with A→B into R1(A,B) and R2(A,C). Is the join lossless (test: common attributes a key of one part)?

- **A.** Only if B→A
- **B.** Yes, because A is key of R1
- **C.** Never for 3 attributes
- **D.** No, because C is not in R1

**Answer:** B
**Explanation:** R1 ∩ R2 = A, and A → AB (key of R1).

### Q52  ·  Difficult
**Question:** Faculty write SELECT * FROM marks WHERE usn IN (SELECT usn FROM student WHERE dept='CSE'). The inner query is:

- **A.** A CREATE TABLE
- **B.** An uncorrelated nested query (unless it references outer columns)
- **C.** A deadlock detector
- **D.** A specialization constraint

**Answer:** B
**Explanation:** Inner does not reference outer marks columns.

### Q53  ·  Difficult
**Question:** Heath’s theorem: if R(X,Y,Z) and X→Y, then R = π_{XY}(R) ⋈ π_{XZ}(R). This justifies:

- **A.** A dependency-losing split always
- **B.** A lossless decomposition along that FD
- **C.** That Z→X
- **D.** That R is not in 1NF

**Answer:** B
**Explanation:** The FD supplies the join key.

### Q54  ·  Difficult
**Question:** Keys of R(A,B,C) with F = {AB→C, C→A}. Which is a candidate key?

- **A.** B alone
- **B.** A alone
- **C.** BC
- **D.** C alone

**Answer:** C
**Explanation:** C→A so BC→ABC; AB is also a key; B or C alone is not. BC is a candidate key (and AB is too).

### Q55  ·  Difficult
**Question:** R(A,B,C) with FDs A→B, B→C. Compute (A)+.

- **A.** {A,B,C}
- **B.** {B,C}
- **C.** {A}
- **D.** {A,B}

**Answer:** A
**Explanation:** A determines B, then C by transitivity.

### Q56  ·  Difficult
**Question:** Relation with 4 attributes ABCD, F = {A→B, B→C, C→D}. Is A a superkey?

- **A.** Only if D→A
- **B.** Only in 1NF
- **C.** Yes, A+ = ABCD
- **D.** No, A+ = A only

**Answer:** C
**Explanation:** Closure of A is all attributes.

### Q57  ·  Difficult
**Question:** SELECT COUNT(*) FROM T; T has 10 rows including 2 duplicates on all columns (bag). Result?

- **A.** 2
- **B.** 12
- **C.** 10
- **D.** 8

**Answer:** C
**Explanation:** COUNT(*) counts bag cardinality, not distinct tuples.

### Q58  ·  Difficult
**Question:** Table MARKS(USN, Course, IA1, IA2, SEE). 200 students × 5 courses, one row each. If unnormalized as one row per student with 5 repeating course groups, how many base rows exist after a correct 1NF design?

- **A.** 200
- **B.** 205
- **C.** 5
- **D.** 1000

**Answer:** D
**Explanation:** One tuple per student-course: 200×5=1000.

### Q59  ·  Difficult
**Question:** VVIET needs students who scored more than the average SEE in CS101. SQL shape is:

- **A.** CREATE INDEX only
- **B.** UNION of STUDENT and COURSE
- **C.** DROP VIEW
- **D.** A nested (or HAVING) comparison against AVG(SEE) for that course

**Answer:** D
**Explanation:** Subquery or window computes the average.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **3NF** and **BCNF**?

- **A.** BCNF allows partial FDs.
- **B.** BCNF is stricter: every determinant is a superkey; 3NF allows X→A if A is prime even when X is not a superkey.
- **C.** They are identical definitions.
- **D.** 3NF forbids prime attributes as dependents.

**Answer:** B
**Explanation:** BCNF is stricter: every determinant is a superkey; 3NF allows X→A if A is prime even when X is not a superkey.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **INSERT** and **UPDATE**?

- **A.** INSERT adds new tuples; UPDATE modifies attribute values of existing tuples that satisfy a predicate.
- **B.** UPDATE creates new tables.
- **C.** INSERT cannot violate FKs.
- **D.** They are both DDL.

**Answer:** A
**Explanation:** INSERT adds new tuples; UPDATE modifies attribute values of existing tuples that satisfy a predicate.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **WHERE** and **HAVING**?

- **A.** WHERE filters rows before grouping; HAVING filters groups after aggregation.
- **B.** WHERE is for groups only.
- **C.** HAVING cannot use COUNT.
- **D.** They are interchangeable always.

**Answer:** A
**Explanation:** WHERE filters rows before grouping; HAVING filters groups after aggregation.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **view** and **base table**?

- **A.** A view is always updatable with no restrictions.
- **B.** Base tables cannot have keys.
- **C.** Views cannot be queried.
- **D.** A base table is stored; a view is defined by a query and may be virtual.

**Answer:** D
**Explanation:** A base table is stored; a view is defined by a query and may be virtual.

### Q64  ·  Difficult
**Question:** Which statement about **1NF** is FALSE?

- **A.** A useful way to remember 1NF is that it is not the same as “Every FD is a key”.
- **B.** 1NF allows a set of phones in one cell if the cell is called JSON.
- **C.** 1NF is correctly understood as: every attribute value is atomic; no repeating groups or nested relations in a cell.
- **D.** In this module, 1NF is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: 1NF allows a set of phones in one cell if the cell is called JSON.. 1NF actually means: Every attribute value is atomic; no repeating groups or nested relations in a cell.

### Q65  ·  Difficult
**Question:** Which statement about **3NF** is FALSE?

- **A.** 3NF is correctly understood as: 2NF and no non-prime attribute is transitively dependent on a candidate key (equivalently: for every FD X→A, X is a superkey or A is prime).
- **B.** 3NF allows a non-prime attribute determined by another non-prime without restriction.
- **C.** A useful way to remember 3NF is that it is not the same as “Every determinant is a candidate key”.
- **D.** In this module, 3NF is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: 3NF allows a non-prime attribute determined by another non-prime without restriction.. 3NF actually means: 2NF and no non-prime attribute is transitively dependent on a candidate key (equivalently: for every FD X→A, X is a superkey or A is prime).

### Q66  ·  Difficult
**Question:** Which statement about **Attribute closure X+** is FALSE?

- **A.** A useful way to remember Attribute closure X+ is that it is not the same as “The set of superkeys of the database”.
- **B.** Attribute closure X+ is correctly understood as: the set of attributes functionally determined by X using a given set F of FDs.
- **C.** X+ is computed by joining tables, not by applying Armstrong-style inference to FDs.
- **D.** In this module, Attribute closure X+ is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: X+ is computed by joining tables, not by applying Armstrong-style inference to FDs.. Attribute closure X+ actually means: The set of attributes functionally determined by X using a given set F of FDs.

### Q67  ·  Difficult
**Question:** Which statement about **CHECK constraint** is FALSE?

- **A.** CHECK constraints are advisory and never reject tuples.
- **B.** In this module, CHECK constraint is a core idea students must distinguish from nearby terms.
- **C.** CHECK constraint is correctly understood as: a predicate that every tuple must satisfy, enforced on insert/update.
- **D.** A useful way to remember CHECK constraint is that it is not the same as “A comment in SQL”.

**Answer:** A
**Explanation:** The false claim is: CHECK constraints are advisory and never reject tuples.. CHECK constraint actually means: A predicate that every tuple must satisfy, enforced on insert/update.

### Q68  ·  Difficult
**Question:** Which statement about **CREATE TABLE** is FALSE?

- **A.** A useful way to remember CREATE TABLE is that it is not the same as “A DML command that inserts rows”.
- **B.** In this module, CREATE TABLE is a core idea students must distinguish from nearby terms.
- **C.** CREATE TABLE is correctly understood as: dDL that names a relation, attributes, types and constraints (PK, FK, UNIQUE, CHECK, NOT NULL).
- **D.** CREATE TABLE cannot declare a foreign key.

**Answer:** D
**Explanation:** The false claim is: CREATE TABLE cannot declare a foreign key.. CREATE TABLE actually means: DDL that names a relation, attributes, types and constraints (PK, FK, UNIQUE, CHECK, NOT NULL).

### Q69  ·  Difficult
**Question:** Which statement about **Functional dependency** is FALSE?

- **A.** A useful way to remember Functional dependency is that it is not the same as “X → Y means Y determines X”.
- **B.** Functional dependency is correctly understood as: x → Y means any two tuples that agree on X must agree on Y.
- **C.** If X → Y, then Y → X always holds.
- **D.** In this module, Functional dependency is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: If X → Y, then Y → X always holds.. Functional dependency actually means: X → Y means any two tuples that agree on X must agree on Y.

### Q70  ·  Difficult
**Question:** Which statement about **Insertion anomaly** is FALSE?

- **A.** Insertion anomalies are the same as entity integrity on a well-keyed 3NF design.
- **B.** Insertion anomaly is correctly understood as: inability to record a fact until an unrelated fact is also present (for example, a course without a student).
- **C.** In this module, Insertion anomaly is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Insertion anomaly is that it is not the same as “Inserting a tuple that satisfies all keys”.

**Answer:** A
**Explanation:** The false claim is: Insertion anomalies are the same as entity integrity on a well-keyed 3NF design.. Insertion anomaly actually means: Inability to record a fact until an unrelated fact is also present (for example, a course without a student).

### Q71  ·  Difficult
**Question:** Which statement about **Lossless-join decomposition** is FALSE?

- **A.** In this module, Lossless-join decomposition is a core idea students must distinguish from nearby terms.
- **B.** A lossless decomposition means some original tuples cannot be recovered by join.
- **C.** A useful way to remember Lossless-join decomposition is that it is not the same as “A decomposition that always loses tuples”.
- **D.** Lossless-join decomposition is correctly understood as: decomposing R so the natural join of parts reconstructs R exactly (no spurious tuples).

**Answer:** B
**Explanation:** The false claim is: A lossless decomposition means some original tuples cannot be recovered by join.. Lossless-join decomposition actually means: Decomposing R so the natural join of parts reconstructs R exactly (no spurious tuples).

### Q72  ·  Difficult
**Question:** Which statement about **View** is FALSE?

- **A.** A view always stores a full private copy of base rows and never uses a query text.
- **B.** In this module, View is a core idea students must distinguish from nearby terms.
- **C.** View is correctly understood as: a named virtual (or materialized) table defined by a query; used for security, simplicity and logical independence.
- **D.** A useful way to remember View is that it is not the same as “A heap file of indexes only”.

**Answer:** A
**Explanation:** The false claim is: A view always stores a full private copy of base rows and never uses a query text.. View actually means: A named virtual (or materialized) table defined by a query; used for security, simplicity and logical independence.

---

## Quick answer key

Q01–B | Q02–A | Q03–D | Q04–A | Q05–B | Q06–D | Q07–B | Q08–A | Q09–C | Q10–C | Q11–B | Q12–B | Q13–B | Q14–A | Q15–A | Q16–B | Q17–B | Q18–D | Q19–B | Q20–A | Q21–B | Q22–B | Q23–B | Q24–A | Q25–D | Q26–A | Q27–A | Q28–B | Q29–B | Q30–A | Q31–B | Q32–A | Q33–B | Q34–B | Q35–C | Q36–D | Q37–B | Q38–C | Q39–B | Q40–B | Q41–A | Q42–C | Q43–D | Q44–A | Q45–D | Q46–B | Q47–C | Q48–B | Q49–B | Q50–D | Q51–B | Q52–B | Q53–B | Q54–C | Q55–A | Q56–C | Q57–C | Q58–D | Q59–D | Q60–B | Q61–A | Q62–A | Q63–D | Q64–B | Q65–B | Q66–C | Q67–A | Q68–D | Q69–C | Q70–A | Q71–B | Q72–A
