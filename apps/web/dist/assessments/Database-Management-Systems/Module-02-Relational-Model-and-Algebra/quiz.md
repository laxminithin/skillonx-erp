# Quiz — Database Management Systems — Module 2: Relational Model and Algebra

**Subject:** Database Management Systems  
**Module:** Module 2 — Relational Model and Algebra  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A candidate key must be:

- **A.** Unique and irreducible (minimal)
- **B.** Any superkey including extras
- **C.** Allowed to be null in part
- **D.** Stored only as a view name

**Answer:** A
**Explanation:** Minimality distinguishes candidate from superkey.

### Q02  ·  Easy
**Question:** Intersection R ∩ S is algebraically equal to:

- **A.** R − (R − S)
- **B.** R ∪ S
- **C.** R × S
- **D.** R ÷ S

**Answer:** A
**Explanation:** Standard identity.

### Q03  ·  Easy
**Question:** Two relations are union-compatible if they have:

- **A.** The same cardinality always
- **B.** The same degree and pairwise compatible domains on corresponding attributes
- **C.** The same number of foreign keys only
- **D.** Identical physical page layouts

**Answer:** B
**Explanation:** Heading compatibility, not row count.

### Q04  ·  Easy
**Question:** Which operator can decrease cardinality but never changes degree?

- **A.** Project (π) in general
- **B.** Cartesian product
- **C.** Natural join in general
- **D.** Select (σ)

**Answer:** D
**Explanation:** Select is degree-preserving.

### Q05  ·  Easy
**Question:** Which option best describes **Cartesian product**?

- **A.** An intersection.
- **B.** All pairings of tuples from R and S, degree = deg(R)+deg(S), cardinality = |R|×|S|.
- **C.** A projection that drops keys.
- **D.** A union of two tables.

**Answer:** B
**Explanation:** Cartesian product: All pairings of tuples from R and S, degree = deg(R)+deg(S), cardinality = |R|×|S|.

### Q06  ·  Easy
**Question:** Which option best describes **Degree**?

- **A.** The number of attributes (columns) of a relation.
- **B.** The number of tuples.
- **C.** The number of foreign keys only.
- **D.** The RAID stripe width.

**Answer:** A
**Explanation:** Degree: The number of attributes (columns) of a relation.

### Q07  ·  Easy
**Question:** Which option best describes **Project (π)**?

- **A.** A foreign-key check.
- **B.** Unary operator that returns distinct tuples on a chosen attribute subset (eliminating duplicate results in set algebra).
- **C.** An operator that only filters rows and never changes degree.
- **D.** Cartesian product.

**Answer:** B
**Explanation:** Project (π): Unary operator that returns distinct tuples on a chosen attribute subset (eliminating duplicate results in set algebra).

### Q08  ·  Easy
**Question:** Which option best describes **Referential integrity**?

- **A.** Domains must be integers.
- **B.** Every attribute must reference some key.
- **C.** Child rows may point to missing parents indefinitely.
- **D.** A foreign-key value is either null (if allowed) or matches a candidate key in the referenced relation.

**Answer:** D
**Explanation:** Referential integrity: A foreign-key value is either null (if allowed) or matches a candidate key in the referenced relation.

### Q09  ·  Easy
**Question:** Which option best describes **Relation**?

- **A.** A single scalar integer.
- **B.** A bag that must keep insertion order as identity.
- **C.** A set of tuples over the same attributes; order of rows is insignificant and duplicate tuples are not part of the pure model.
- **D.** A nested XML tree with no heading.

**Answer:** C
**Explanation:** Relation: A set of tuples over the same attributes; order of rows is insignificant and duplicate tuples are not part of the pure model.

### Q10  ·  Easy
**Question:** Which option best describes **Rename (ρ)**?

- **A.** Logging WAL records.
- **B.** An operator that deletes tuples.
- **C.** Operator that changes a relation or attribute name without changing values, enabling self-joins.
- **D.** A constraint check.

**Answer:** C
**Explanation:** Rename (ρ): Operator that changes a relation or attribute name without changing values, enabling self-joins.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **ER mapping of a binary relationship**?

- **A.** Put both keys only in the 1-side for M:N
- **B.** Classify 1:1 / 1:N / M:N → place FK or create relation → include relationship attributes → declare PK/FK
- **C.** Drop relationship attributes
- **D.** Always create three relations for 1:N

**Answer:** B
**Explanation:** Correct sequence for ER mapping of a binary relationship: Classify 1:1 / 1:N / M:N → place FK or create relation → include relationship attributes → declare PK/FK

### Q12  ·  Easy
**Question:** Which sequence correctly describes **relational algebra query pattern**?

- **A.** Project away keys first → then try to join on missing attributes
- **B.** Start from stored relations → restrict (σ) → combine (⋈/×/∪/−) → project (π) → rename if needed
- **C.** Union incompatible headings → then select
- **D.** Insert tuples before writing any expression

**Answer:** B
**Explanation:** Correct sequence for relational algebra query pattern: Start from stored relations → restrict (σ) → combine (⋈/×/∪/−) → project (π) → rename if needed

### Q13  ·  Intermediate
**Question:** Deleting a COURSE tuple that still has SECTION children, under ON DELETE RESTRICT, results in:

- **A.** Rejection of the delete
- **B.** A successful union
- **C.** Silent orphan rows
- **D.** Automatic drop of the SECTION schema

**Answer:** A
**Explanation:** RESTRICT refuses the parent delete.

### Q14  ·  Intermediate
**Question:** If R and S share no attribute names, R ⋈ S is equivalent to:

- **A.** R − S
- **B.** R × S
- **C.** R ÷ S
- **D.** R ∪ S

**Answer:** B
**Explanation:** Natural join with empty common set is the product.

### Q15  ·  Intermediate
**Question:** Inserting a SECTION row with CourseCode that does not exist in COURSE is blocked as:

- **A.** A domain violation only on the time-of-day clock
- **B.** A successful Cartesian product
- **C.** An entity-integrity success
- **D.** A referential integrity (foreign-key) violation

**Answer:** D
**Explanation:** The FK must match a COURSE key.

### Q16  ·  Intermediate
**Question:** Mapping a 1:N relationship DEPT–EMP with no relationship attributes yields:

- **A.** A new relation with only a surrogate and no FKs
- **B.** DeptId as a foreign key in EMPLOYEE
- **C.** A union of headings
- **D.** Two copies of DEPT for each employee

**Answer:** B
**Explanation:** FK lives on the N-side.

### Q17  ·  Intermediate
**Question:** Names of students taking CS101: algebra uses

- **A.** π_Name(STUDENT ⋈ σ_CourseId='CS101'(ENROLS))
- **B.** Union of STUDENT and COURSE headings that differ
- **C.** Difference of two unary keys only
- **D.** Rename of the DBMS catalog

**Answer:** A
**Explanation:** Restrict enrolments, join to student, project Name.

### Q18  ·  Intermediate
**Question:** The rename operator is essential for:

- **A.** Creating domains
- **B.** Joining a relation with itself (for example, prerequisite course pairs)
- **C.** WAL logging
- **D.** Enforcing entity integrity

**Answer:** B
**Explanation:** Self-join needs distinct names.

### Q19  ·  Intermediate
**Question:** Updating COURSE.Code from CS101 to CS102 while SECTION still points to CS101, with no cascade, causes:

- **A.** A referential-integrity problem on existing children (reject or require cascade/restrict policy)
- **B.** A legal union
- **C.** Automatic deletion of the catalog
- **D.** Physical data independence failure only

**Answer:** A
**Explanation:** Dangling FKs are not allowed.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **entity integrity** and **referential integrity**?

- **A.** Both only constrain domains of dates.
- **B.** Entity integrity concerns nulls/uniqueness of a relation’s own primary key; referential integrity concerns foreign keys matching parents.
- **C.** They are two names for CHECK constraints on age.
- **D.** Referential integrity is about a relation’s own PK nulls.

**Answer:** B
**Explanation:** Entity integrity concerns nulls/uniqueness of a relation’s own primary key; referential integrity concerns foreign keys matching parents.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **foreign key** and **primary key**?

- **A.** An FK is stored only in the catalog, never as columns.
- **B.** A PK uniquely identifies tuples in its relation; an FK references a PK/CK elsewhere (or the same relation).
- **C.** PKs may duplicate freely.
- **D.** FKs must be unique always.

**Answer:** B
**Explanation:** A PK uniquely identifies tuples in its relation; an FK references a PK/CK elsewhere (or the same relation).

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **natural join** and **theta join**?

- **A.** They differ only in SQL keyword colour.
- **B.** Natural join uses equality on all common names; theta join uses an arbitrary predicate and keeps both columns.
- **C.** Theta join always drops join columns.
- **D.** Natural join never uses equality.

**Answer:** B
**Explanation:** Natural join uses equality on all common names; theta join uses an arbitrary predicate and keeps both columns.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **select** and **project**?

- **A.** Select filters rows by a condition; project picks columns and, in set algebra, distinct tuples.
- **B.** Project only filters rows.
- **C.** Select always changes degree.
- **D.** They are identical unary operators.

**Answer:** A
**Explanation:** Select filters rows by a condition; project picks columns and, in set algebra, distinct tuples.

### Q24  ·  Intermediate
**Question:** Which SQL-oriented statement matches entity integrity?

- **A.** FOREIGN KEY may point anywhere
- **B.** PRIMARY KEY columns are UNIQUE and NOT NULL
- **C.** Duplicate PKs are stored then hashed
- **D.** NULL is required in every key

**Answer:** B
**Explanation:** Entity integrity = no null PK, uniqueness.

### Q25  ·  Intermediate
**Question:** Which option best describes **Attribute domain**?

- **A.** The SQL JOIN keyword.
- **B.** The set of allowed atomic values for an attribute, possibly including a null mark under a policy.
- **C.** The physical page number of a tuple.
- **D.** The DBA’s email.

**Answer:** B
**Explanation:** Attribute domain: The set of allowed atomic values for an attribute, possibly including a null mark under a policy.

### Q26  ·  Intermediate
**Question:** Which option best describes **Cardinality**?

- **A.** The isolation level.
- **B.** The size of a domain in bits.
- **C.** The number of attributes.
- **D.** The number of tuples (rows) currently in a relation body.

**Answer:** D
**Explanation:** Cardinality: The number of tuples (rows) currently in a relation body.

### Q27  ·  Intermediate
**Question:** Which option best describes **Division**?

- **A.** A rename operator.
- **B.** A synonym for set difference.
- **C.** R ÷ S returns T such that t concatenated with every s in S appears in R (schema: attributes in R not in S).
- **D.** A foreign-key insert.

**Answer:** C
**Explanation:** Division: R ÷ S returns T such that t concatenated with every s in S appears in R (schema: attributes in R not in S).

### Q28  ·  Intermediate
**Question:** Which option best describes **ER-to-relational mapping**?

- **A.** Replacing all keys with file names.
- **B.** A systematic translation of entity types, relationships and constraints into relations, keys and foreign keys.
- **C.** Storing the ER PNG in a BLOB and stopping.
- **D.** Deleting weak entities.

**Answer:** B
**Explanation:** ER-to-relational mapping: A systematic translation of entity types, relationships and constraints into relations, keys and foreign keys.

### Q29  ·  Intermediate
**Question:** Which option best describes **Entity integrity**?

- **A.** No primary-key attribute may be null; each tuple is identifiable.
- **B.** Duplicate primary keys are required.
- **C.** Foreign keys may never exist.
- **D.** Primary keys must be composite.

**Answer:** A
**Explanation:** Entity integrity: No primary-key attribute may be null; each tuple is identifiable.

### Q30  ·  Intermediate
**Question:** Which option best describes **Foreign key**?

- **A.** An attribute set in a referring relation that must match a candidate key of a referenced relation (or be null if allowed).
- **B.** The degree of a join.
- **C.** Any unique index.
- **D.** A derived attribute.

**Answer:** A
**Explanation:** Foreign key: An attribute set in a referring relation that must match a candidate key of a referenced relation (or be null if allowed).

### Q31  ·  Intermediate
**Question:** Which option best describes **Key constraint**?

- **A.** Joins are illegal.
- **B.** Every domain must be unique across the database.
- **C.** Views cannot be named.
- **D.** Uniqueness of candidate/primary keys: no two tuples share the same key value.

**Answer:** D
**Explanation:** Key constraint: Uniqueness of candidate/primary keys: no two tuples share the same key value.

### Q32  ·  Intermediate
**Question:** Which option best describes **Natural join**?

- **A.** Join on all common attributes with equality, projecting away duplicate join columns.
- **B.** Always a Cartesian product with no matching.
- **C.** Division by a singleton.
- **D.** Union of headings without matching values.

**Answer:** A
**Explanation:** Natural join: Join on all common attributes with equality, projecting away duplicate join columns.

### Q33  ·  Intermediate
**Question:** Which option best describes **Select (σ)**?

- **A.** Unary operator that returns tuples satisfying a predicate, without changing degree.
- **B.** An operator that always adds columns.
- **C.** Renaming a relation.
- **D.** Set union of two headings.

**Answer:** A
**Explanation:** Select (σ): Unary operator that returns tuples satisfying a predicate, without changing degree.

### Q34  ·  Intermediate
**Question:** Which option best describes **Set difference**?

- **A.** The Cartesian product R × S.
- **B.** Tuples in R that are not in S; R and S must be union-compatible.
- **C.** Selecting on a predicate.
- **D.** A natural join.

**Answer:** B
**Explanation:** Set difference: Tuples in R that are not in S; R and S must be union-compatible.

### Q35  ·  Intermediate
**Question:** Which option best describes **Tuple**?

- **A.** A B+ tree internal node.
- **B.** An ordered mapping from relation attributes to values from their domains (a row).
- **C.** A view definition.
- **D.** A schema-level constraint only.

**Answer:** B
**Explanation:** Tuple: An ordered mapping from relation attributes to values from their domains (a row).

### Q36  ·  Intermediate
**Question:** Which option best describes **Union**?

- **A.** Division by a quotient schema.
- **B.** Set operator combining tuples from two union-compatible relations, without duplicates in set algebra.
- **C.** A θ-join on unequal headings.
- **D.** A rename of one attribute.

**Answer:** B
**Explanation:** Union: Set operator combining tuples from two union-compatible relations, without duplicates in set algebra.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **checking an update against constraints**?

- **A.** Always accept then repair at year end
- **B.** Skip FKs if the UI looks valid
- **C.** Identify operation → test domain → test key/entity integrity → test referential actions → accept or reject
- **D.** Test only RAID checksums

**Answer:** C
**Explanation:** Correct sequence for checking an update against constraints: Identify operation → test domain → test key/entity integrity → test referential actions → accept or reject

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **natural join evaluation (logical)**?

- **A.** Stack union-compatible rows
- **B.** Match on common attribute names → keep equalities → concatenate remaining attributes once
- **C.** Multiply degrees without matching
- **D.** Drop all keys always

**Answer:** B
**Explanation:** Correct sequence for natural join evaluation (logical): Match on common attribute names → keep equalities → concatenate remaining attributes once

### Q39  ·  Intermediate
**Question:** Which statement about **Cardinality** is FALSE?

- **A.** In this module, Cardinality is a core idea students must distinguish from nearby terms.
- **B.** Cardinality is the count of columns.
- **C.** A useful way to remember Cardinality is that it is not the same as “The number of attributes”.
- **D.** Cardinality is correctly understood as: the number of tuples (rows) currently in a relation body.

**Answer:** B
**Explanation:** The false claim is: Cardinality is the count of columns.. Cardinality actually means: The number of tuples (rows) currently in a relation body.

### Q40  ·  Intermediate
**Question:** Which statement about **Cartesian product** is FALSE?

- **A.** Cartesian product is correctly understood as: all pairings of tuples from R and S, degree = deg(R)+deg(S), cardinality = |R|×|S|.
- **B.** In this module, Cartesian product is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Cartesian product is that it is not the same as “A union of two tables”.
- **D.** Cartesian product keeps degree unchanged and never multiplies cardinalities.

**Answer:** D
**Explanation:** The false claim is: Cartesian product keeps degree unchanged and never multiplies cardinalities.. Cartesian product actually means: All pairings of tuples from R and S, degree = deg(R)+deg(S), cardinality = |R|×|S|.

### Q41  ·  Intermediate
**Question:** Which statement about **Division** is FALSE?

- **A.** Division is correctly understood as: r ÷ S returns T such that t concatenated with every s in S appears in R (schema: attributes in R not in S).
- **B.** In this module, Division is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Division is that it is not the same as “A synonym for set difference”.
- **D.** Division is the same as projection on the key of R.

**Answer:** D
**Explanation:** The false claim is: Division is the same as projection on the key of R.. Division actually means: R ÷ S returns T such that t concatenated with every s in S appears in R (schema: attributes in R not in S).

### Q42  ·  Intermediate
**Question:** Which statement about **Foreign key** is FALSE?

- **A.** A foreign key need not correspond to any key in another relation.
- **B.** In this module, Foreign key is a core idea students must distinguish from nearby terms.
- **C.** Foreign key is correctly understood as: an attribute set in a referring relation that must match a candidate key of a referenced relation (or be null if allowed).
- **D.** A useful way to remember Foreign key is that it is not the same as “Any unique index”.

**Answer:** A
**Explanation:** The false claim is: A foreign key need not correspond to any key in another relation.. Foreign key actually means: An attribute set in a referring relation that must match a candidate key of a referenced relation (or be null if allowed).

### Q43  ·  Intermediate
**Question:** Which statement about **Referential integrity** is FALSE?

- **A.** In this module, Referential integrity is a core idea students must distinguish from nearby terms.
- **B.** Referential integrity forbids matching the parent key; it only checks data types.
- **C.** A useful way to remember Referential integrity is that it is not the same as “Every attribute must reference some key”.
- **D.** Referential integrity is correctly understood as: a foreign-key value is either null (if allowed) or matches a candidate key in the referenced relation.

**Answer:** B
**Explanation:** The false claim is: Referential integrity forbids matching the parent key; it only checks data types.. Referential integrity actually means: A foreign-key value is either null (if allowed) or matches a candidate key in the referenced relation.

### Q44  ·  Intermediate
**Question:** Which statement about **Relation** is FALSE?

- **A.** In this module, Relation is a core idea students must distinguish from nearby terms.
- **B.** Relation is correctly understood as: a set of tuples over the same attributes; order of rows is insignificant and duplicate tuples are not part of the pure model.
- **C.** In the pure relational model, duplicate tuples are required and row order is part of the identity.
- **D.** A useful way to remember Relation is that it is not the same as “A bag that must keep insertion order as identity”.

**Answer:** C
**Explanation:** The false claim is: In the pure relational model, duplicate tuples are required and row order is part of the identity.. Relation actually means: A set of tuples over the same attributes; order of rows is insignificant and duplicate tuples are not part of the pure model.

### Q45  ·  Intermediate
**Question:** Which statement about **Select (σ)** is FALSE?

- **A.** A useful way to remember Select (σ) is that it is not the same as “An operator that always adds columns”.
- **B.** Select projects columns and drops rows that fail the predicate by changing the heading.
- **C.** Select (σ) is correctly understood as: unary operator that returns tuples satisfying a predicate, without changing degree.
- **D.** In this module, Select (σ) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Select projects columns and drops rows that fail the predicate by changing the heading.. Select (σ) actually means: Unary operator that returns tuples satisfying a predicate, without changing degree.

### Q46  ·  Intermediate
**Question:** Which statement about **Tuple** is FALSE?

- **A.** Tuple is correctly understood as: an ordered mapping from relation attributes to values from their domains (a row).
- **B.** A useful way to remember Tuple is that it is not the same as “A schema-level constraint only”.
- **C.** A tuple is the heading of a relation, not an instance.
- **D.** In this module, Tuple is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: A tuple is the heading of a relation, not an instance.. Tuple actually means: An ordered mapping from relation attributes to values from their domains (a row).

### Q47  ·  Intermediate
**Question:** Which statement about **Union** is FALSE?

- **A.** Union requires relations of different degree.
- **B.** A useful way to remember Union is that it is not the same as “A θ-join on unequal headings”.
- **C.** Union is correctly understood as: set operator combining tuples from two union-compatible relations, without duplicates in set algebra.
- **D.** In this module, Union is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Union requires relations of different degree.. Union actually means: Set operator combining tuples from two union-compatible relations, without duplicates in set algebra.

### Q48  ·  Difficult
**Question:** Find students who have taken every course in the GATE_PREP set. This is:

- **A.** Entity integrity
- **B.** Division of ENROLS by GATE_PREP
- **C.** A theta join on inequality of names
- **D.** Cartesian product with no projection

**Answer:** B
**Explanation:** Classic division query.

### Q49  ·  Difficult
**Question:** Inserting STUDENT with USN = NULL is blocked as:

- **A.** A rename failure
- **B.** A legal weak-entity map
- **C.** A successful outer join
- **D.** An entity-integrity violation

**Answer:** D
**Explanation:** Primary keys cannot be null.

### Q50  ·  Difficult
**Question:** List USNs of students in ‘Mysuru’ without extra columns. Algebra sketch is:

- **A.** STUDENT × STUDENT only
- **B.** STUDENT ∪ FACULTY
- **C.** STUDENT ÷ CITY
- **D.** π_USN(σ_City='Mysuru'(STUDENT))

**Answer:** D
**Explanation:** Select then project.

### Q51  ·  Difficult
**Question:** Mapping M:N ENROLS(Student, Course) with Grade yields:

- **A.** Grade stored only in STUDENT, duplicated per course
- **B.** A new relation with USN, CourseId and Grade, composite PK (USN, CourseId)
- **C.** No relation, because M:N is illegal
- **D.** Only a view with no keys

**Answer:** B
**Explanation:** M:N becomes a relationship relation.

### Q52  ·  Difficult
**Question:** Mapping a 1:1 relationship with total participation on one side is often implemented by:

- **A.** Always using an M:N intersection table with no keys
- **B.** Placing the FK on the total-participation side (or merging relations carefully)
- **C.** Using Cartesian product as storage
- **D.** Dropping one entity type

**Answer:** B
**Explanation:** FK on the side that must always reference the other reduces nulls.

### Q53  ·  Difficult
**Question:** R has 5 attributes and 20 tuples; S has 3 attributes and 10 tuples. Degree and cardinality of R × S?

- **A.** Degree 8, cardinality 200
- **B.** Degree 8, cardinality 30
- **C.** Degree 5, cardinality 20
- **D.** Degree 3, cardinality 10

**Answer:** A
**Explanation:** deg 5+3=8; |R|×|S|=200.

### Q54  ·  Difficult
**Question:** R(A,B) = {(1,x),(1,y),(2,x)}; S(B) = {(x),(y)}. R ÷ S equals:

- **A.** {(1),(2)}
- **B.** {(1)}
- **C.** {(x),(y)}
- **D.** empty relation with heading A,B

**Answer:** B
**Explanation:** Only A=1 is paired with every B in S.

### Q55  ·  Difficult
**Question:** R(A,B,C) has 12 tuples, S(C,D) has 4 tuples, every R.C matches exactly one S.C and C is unique in S. |R ⋈ S|?

- **A.** 16
- **B.** 48
- **C.** 12
- **D.** 4

**Answer:** C
**Explanation:** Many-to-one on key of S: each of 12 R tuples matches one S tuple.

### Q56  ·  Difficult
**Question:** Takes(USN, CourseId) has 800 rows; CourseId domain of interest has 8 courses. Using division, students who took all 8 courses: if 15 such students, what is |Takes ÷ Courses|?

- **A.** 8
- **B.** 6400
- **C.** 15
- **D.** 800

**Answer:** C
**Explanation:** Division returns one tuple per student who has all 8 courses.

### Q57  ·  Difficult
**Question:** Union-compatible R and S: |R|=40, |S|=25, |R ∩ S|=10. |R ∪ S|?

- **A.** 15
- **B.** 55
- **C.** 40
- **D.** 65

**Answer:** B
**Explanation:** |R|+|S|−|intersection| = 40+25−10=55.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **Cartesian product** and **natural join**?

- **A.** Product pairs every combination; natural join keeps only matches on common attributes.
- **B.** Natural join always has |R|×|S| rows.
- **C.** Product requires union compatibility.
- **D.** They always have the same degree.

**Answer:** A
**Explanation:** Product pairs every combination; natural join keeps only matches on common attributes.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **inner join** and **left outer join**?

- **A.** Inner join drops unmatched rows; left outer join keeps all left tuples, padding right attributes with nulls.
- **B.** Inner join always keeps orphans.
- **C.** Outer join is illegal in the relational model discussion.
- **D.** They produce identical bodies always.

**Answer:** A
**Explanation:** Inner join drops unmatched rows; left outer join keeps all left tuples, padding right attributes with nulls.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **intersection** and **difference**?

- **A.** They are defined only for binary joins.
- **B.** Intersection is a Cartesian product.
- **C.** Difference requires a join key.
- **D.** Intersection is tuples in both R and S; difference is tuples in R not in S.

**Answer:** D
**Explanation:** Intersection is tuples in both R and S; difference is tuples in R not in S.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **union** and **join**?

- **A.** Join requires identical headings.
- **B.** Union stacks union-compatible tuples; join concatenates matching tuples from different headings.
- **C.** They are the same set operator.
- **D.** Union multiplies cardinalities like Cartesian product.

**Answer:** B
**Explanation:** Union stacks union-compatible tuples; join concatenates matching tuples from different headings.

### Q62  ·  Difficult
**Question:** Which statement about **Attribute domain** is FALSE?

- **A.** A domain is the same as a foreign key.
- **B.** Attribute domain is correctly understood as: the set of allowed atomic values for an attribute, possibly including a null mark under a policy.
- **C.** In this module, Attribute domain is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Attribute domain is that it is not the same as “The physical page number of a tuple”.

**Answer:** A
**Explanation:** The false claim is: A domain is the same as a foreign key.. Attribute domain actually means: The set of allowed atomic values for an attribute, possibly including a null mark under a policy.

### Q63  ·  Difficult
**Question:** Which statement about **Degree** is FALSE?

- **A.** A useful way to remember Degree is that it is not the same as “The number of tuples”.
- **B.** Degree is correctly understood as: the number of attributes (columns) of a relation.
- **C.** Degree means how many rows are stored.
- **D.** In this module, Degree is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Degree means how many rows are stored.. Degree actually means: The number of attributes (columns) of a relation.

### Q64  ·  Difficult
**Question:** Which statement about **ER-to-relational mapping** is FALSE?

- **A.** Mapping never creates foreign keys for relationships.
- **B.** In this module, ER-to-relational mapping is a core idea students must distinguish from nearby terms.
- **C.** ER-to-relational mapping is correctly understood as: a systematic translation of entity types, relationships and constraints into relations, keys and foreign keys.
- **D.** A useful way to remember ER-to-relational mapping is that it is not the same as “Storing the ER PNG in a BLOB and stopping”.

**Answer:** A
**Explanation:** The false claim is: Mapping never creates foreign keys for relationships.. ER-to-relational mapping actually means: A systematic translation of entity types, relationships and constraints into relations, keys and foreign keys.

### Q65  ·  Difficult
**Question:** Which statement about **Entity integrity** is FALSE?

- **A.** A useful way to remember Entity integrity is that it is not the same as “Foreign keys may never exist”.
- **B.** Entity integrity is correctly understood as: no primary-key attribute may be null; each tuple is identifiable.
- **C.** Entity integrity allows nulls in the primary key so ‘unknown students’ can be stored.
- **D.** In this module, Entity integrity is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Entity integrity allows nulls in the primary key so ‘unknown students’ can be stored.. Entity integrity actually means: No primary-key attribute may be null; each tuple is identifiable.

### Q66  ·  Difficult
**Question:** Which statement about **Key constraint** is FALSE?

- **A.** A useful way to remember Key constraint is that it is not the same as “Every domain must be unique across the database”.
- **B.** The key constraint allows two employees to share the same EmpId.
- **C.** Key constraint is correctly understood as: uniqueness of candidate/primary keys: no two tuples share the same key value.
- **D.** In this module, Key constraint is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The key constraint allows two employees to share the same EmpId.. Key constraint actually means: Uniqueness of candidate/primary keys: no two tuples share the same key value.

### Q67  ·  Difficult
**Question:** Which statement about **Natural join** is FALSE?

- **A.** A useful way to remember Natural join is that it is not the same as “Always a Cartesian product with no matching”.
- **B.** In this module, Natural join is a core idea students must distinguish from nearby terms.
- **C.** Natural join is correctly understood as: join on all common attributes with equality, projecting away duplicate join columns.
- **D.** Natural join never compares common attributes; it always concatenates unmatched columns twice.

**Answer:** D
**Explanation:** The false claim is: Natural join never compares common attributes; it always concatenates unmatched columns twice.. Natural join actually means: Join on all common attributes with equality, projecting away duplicate join columns.

### Q68  ·  Difficult
**Question:** Which statement about **Project (π)** is FALSE?

- **A.** Project (π) is correctly understood as: unary operator that returns distinct tuples on a chosen attribute subset (eliminating duplicate results in set algebra).
- **B.** Project keeps duplicate identical column combinations in pure set algebra.
- **C.** A useful way to remember Project (π) is that it is not the same as “An operator that only filters rows and never changes degree”.
- **D.** In this module, Project (π) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Project keeps duplicate identical column combinations in pure set algebra.. Project (π) actually means: Unary operator that returns distinct tuples on a chosen attribute subset (eliminating duplicate results in set algebra).

### Q69  ·  Difficult
**Question:** Which statement about **Rename (ρ)** is FALSE?

- **A.** Rename is illegal because SQL cannot alias tables.
- **B.** In this module, Rename (ρ) is a core idea students must distinguish from nearby terms.
- **C.** Rename (ρ) is correctly understood as: operator that changes a relation or attribute name without changing values, enabling self-joins.
- **D.** A useful way to remember Rename (ρ) is that it is not the same as “An operator that deletes tuples”.

**Answer:** A
**Explanation:** The false claim is: Rename is illegal because SQL cannot alias tables.. Rename (ρ) actually means: Operator that changes a relation or attribute name without changing values, enabling self-joins.

### Q70  ·  Difficult
**Question:** Which statement about **Set difference** is FALSE?

- **A.** In this module, Set difference is a core idea students must distinguish from nearby terms.
- **B.** Difference is defined for any two relations even if headings differ.
- **C.** A useful way to remember Set difference is that it is not the same as “The Cartesian product R × S”.
- **D.** Set difference is correctly understood as: tuples in R that are not in S; R and S must be union-compatible.

**Answer:** B
**Explanation:** The false claim is: Difference is defined for any two relations even if headings differ.. Set difference actually means: Tuples in R that are not in S; R and S must be union-compatible.

### Q71  ·  Difficult
**Question:** |R − S| given |R|=40, |S|=25, |R ∩ S|=10?

- **A.** 15
- **B.** 50
- **C.** 25
- **D.** 30

**Answer:** D
**Explanation:** Tuples in R not in S = |R| − |intersection| = 30.

### Q72  ·  Difficult
**Question:** σ_{Age>18}(STUDENT) has 120 of 200 rows. π_{Dept}(that result) finds 6 distinct departments. Cardinality of the projection?

- **A.** 200
- **B.** 114
- **C.** 6
- **D.** 120

**Answer:** C
**Explanation:** Set projection yields distinct Dept values: 6.

---

## Quick answer key

Q01–A | Q02–A | Q03–B | Q04–D | Q05–B | Q06–A | Q07–B | Q08–D | Q09–C | Q10–C | Q11–B | Q12–B | Q13–A | Q14–B | Q15–D | Q16–B | Q17–A | Q18–B | Q19–A | Q20–B | Q21–B | Q22–B | Q23–A | Q24–B | Q25–B | Q26–D | Q27–C | Q28–B | Q29–A | Q30–A | Q31–D | Q32–A | Q33–A | Q34–B | Q35–B | Q36–B | Q37–C | Q38–B | Q39–B | Q40–D | Q41–D | Q42–A | Q43–B | Q44–C | Q45–B | Q46–C | Q47–A | Q48–B | Q49–D | Q50–D | Q51–B | Q52–B | Q53–A | Q54–B | Q55–C | Q56–C | Q57–B | Q58–A | Q59–A | Q60–D | Q61–B | Q62–A | Q63–C | Q64–A | Q65–C | Q66–B | Q67–D | Q68–B | Q69–A | Q70–B | Q71–D | Q72–C
