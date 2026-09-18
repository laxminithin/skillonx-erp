# Assignment — Database Management Systems — Module 1 — Fundamentals and ER Model

**Subject:** Database Management Systems  
**Module:** Module 1 — Fundamentals and ER Model  
**Questions:** 40  
**Mix:** 11 Easy · 17 Intermediate · 12 Difficult  
**Bank total:** 319 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define database and DBMS. List four characteristics of the database approach versus file processing.

**Expected Key Points:**
- A database is a coherent collection of related data representing a miniworld for intended users.
- A DBMS is software to define, construct, manipulate, share and protect that database using a catalog.
- Characteristics: self-describing metadata, program-data independence, multiple views, and multiuser transaction control.
- File processing instead embeds structure in programs and duplicates data across offices.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is metadata? Where is it stored, and why does it enable program-data independence?

**Expected Key Points:**
- Metadata describes structures, types and constraints.
- The DBMS keeps it in the catalog, not in each application.
- When BirthDate is added to STUDENT, only the catalog changes; programs that access data through the DBMS need not be rewritten for new byte offsets.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the three-schema ANSI/SPARC architecture with the role of each level.

**Expected Key Points:**
- Internal schema describes physical files and access paths.
- Conceptual schema is the community logical view of entities, relationships and constraints.
- External schemas are user/application views.
- Mappings isolate users from storage and, to a degree, from conceptual change.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define entity, attribute and relationship type with one VVIET example of each.

**Expected Key Points:**
- Entity: STUDENT (a person enrolled).
- Attribute: USN or CGPA.
- Relationship: ENROLS between STUDENT and COURSE.
- These are ER constructs, not yet SQL tables.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Distinguish superkey, candidate key and primary key.

**Expected Key Points:**
- A superkey uniquely identifies tuples; it may contain extra attributes.
- A candidate key is a minimal superkey.
- The primary key is the candidate key chosen for identification and entity integrity (no nulls).
- Alternate keys are unused candidates.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a weak entity? Give a campus example and name its owner and partial key.

**Expected Key Points:**
- A weak entity lacks a complete own key.
- Example: EXAM_ATTEMPT of a COURSE offering, partial key AttemptNo, owner COURSE_OFFERING.
- Identification uses owner key plus partial key via an identifying relationship.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List DBA responsibilities relevant to an institute ERP (at least five).

**Expected Key Points:**
- Authorizing access and roles; coordinating conceptual/logical design; choosing physical design and monitoring performance; backup/recovery policy; tuning and evolving the schema as regulations change; liaising with vendors and application teams.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare logical and physical data independence. Which is harder, and why, for the student portal?

**Expected Key Points:**
- Physical independence: change indexes/files without changing SQL written against conceptual names.
- Logical independence: change conceptual schema without breaking views/apps.
- Logical is harder because portals bind to table/column names and constraints; adding/splitting entities often forces application change.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare specialization and generalization. Illustrate with PERSON, STAFF and STUDENT.

**Expected Key Points:**
- Specialization is top-down: start with PERSON, define STAFF/STUDENT with extra attributes (payroll vs USN).
- Generalization is bottom-up: notice shared Name/Email and invent PERSON.
- Both yield IS-A inheritance; constraints (disjoint/overlap, total/partial) must be stated.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO2
**Question:** Draw (describe) an ER model for course registration: students, courses, sections, instructors, and enrolment with grade. State keys and cardinalities.

**Expected Key Points:**
- STUDENT(USN), COURSE(Code), INSTRUCTOR(EmpId), SECTION as weak of COURSE with SectionId+Semester, taught by INSTRUCTOR (N:1).
- ENROLS(STUDENT, SECTION) with Grade.
- Cardinalities: student to enrolments 1:N; section to enrolments 1:N; each section exactly one course (identifying).
- Participation of SECTION in COURSE is total.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain composite, multi-valued and derived attributes. How is each typically mapped later?

**Expected Key Points:**
- Composite Address → component columns.
- Multi-valued Phone → separate relation (USN, Phone).
- Derived Age → omit or compute in views from BirthDate.
- Do not flatten multi-valued sets into repeating columns if 1NF is required.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO4
**Question:** Exam cell stores Candidate and HallTicket. Ticket numbers are unique only within an exam date. Model this in ER and justify weak vs strong.

**Expected Key Points:**
- EXAM(ExamDate, Name) is strong.
- HALL_TICKET is weak with partial key TicketNo, identifying relationship ISSUED_FOR.
- If TicketNo is globally unique (barcode), it can be a strong entity.
- The miniworld rule decides, not the drawing tool.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is aggregation in ER? When is it needed instead of a relationship attribute?

**Expected Key Points:**
- When a relationship must itself participate in another relationship.
- Example: PROJECT_ASSIGNMENT(Employee, Project) aggregated so that EVALUATION relates that assignment to a Reviewer.
- A mere Hours attribute on ASSIGN cannot point to a reviewer.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO4
**Question:** Model overlapping versus disjoint specialization for CAMPUS_PERSON into HOSTEL_RESIDENT and CLUB_MEMBER. Write the constraint in words.

**Expected Key Points:**
- A student may be both a resident and a club member ⇒ overlapping.
- If instead STAFF vs STUDENT as employment roles that cannot coincide, use disjoint.
- Completeness: total if every CAMPUS_PERSON is in at least one subclass; partial if visitors exist.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design an EER schema for VVIET: departments, programmes, courses, offerings, faculty, students, prerequisites and assessment components. State keys, weak entities and at least one specialization.

**Expected Key Points:**
- DEPARTMENT(DeptId) offers PROGRAMME and COURSE.
- COURSE has Prerequisite as a recursive relationship.
- OFFERING is weak of COURSE with (Sem, Section).
- FACULTY and STUDENT specialize PERSON (disjoint, total for institute members).
- ASSESSMENT_COMPONENT weak of OFFERING with Name (IA1, SEE).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** A vendor proposes one Excel workbook per office instead of a DBMS for 8,000 students. Critique using database-approach characteristics.

**Expected Key Points:**
- Duplication of USN/Name across exam, accounts and hostel files causes inconsistency.
- No catalog ⇒ programs break on column inserts.
- No shared transactions ⇒ fee paid in accounts but exam form still blocked.
- Weak security and recovery.
- A DBMS provides metadata, views, concurrency and controlled redundancy.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** Library copies, borrowers, and reservations that wait on a specific copy. Produce an ER design including a relationship with attributes and a weak entity.

**Expected Key Points:**
- BOOK(ISBN), COPY weak of BOOK with CopyId.
- BORROWER(USN).
- LOAN relationship COPY–BORROWER with DateOut, DueDate.
- RESERVATION may attach to BOOK (any copy) or to COPY (specific).
- If reservation queues are per book, relationship RESERVES(BORROWER, BOOK) with Timestamp as attribute.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write a short essay: ‘The three-schema architecture is why a college ERP can evolve.’ Use logical vs physical independence and views.

**Expected Key Points:**
- Argue that hostel, exam and accounts see external views of one conceptual model of STUDENT.
- Storage can move to SSDs and new indexes (physical independence) without rewriting forms.
- Adding Aadhaar as an alternate key is a conceptual change: views that omit it survive (partial logical independence).
- Without mappings, every PHP page would embed record layouts and the ERP would freeze.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  RESEARCH_TASK  ·  CO1
**Question:** Using any ER tool or neat diagrams, implement (describe tables you would create) mapping of a weak entity DEPENDENT of EMPLOYEE and a 1:N relationship. List resulting relations and keys.

**Expected Key Points:**
- EMPLOYEE(EmpId PK, ...).
- DEPENDENT(EmpId, DepName, Sex, Bdate) with PK(EmpId, DepName) and FK EmpId → EMPLOYEE ON DELETE CASCADE.
- The 1:N WORKS_FOR: if N-side EMPLOYEE stores DeptId FK.
- No separate relation needed for 1:N without relationship attributes.
- State referential actions.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** PERSON 500 instances, disjoint total specialization into STAFF and STUDENT. STAFF = 120. A 1:N MANAGES from STAFF to DEPARTMENT (40 depts, each has exactly one manager). Compute |STUDENT| and the number of MANAGES instances. Explain.

**Expected Key Points:**
- Disjoint total ⇒ |STUDENT| = 500 − 120 = 380.
- Each of 40 departments has exactly one manager ⇒ |MANAGES| = 40.
- Not all staff manage; 80 staff are non-managers.
- Cardinality 1:N from manager side: one staff may manage at most one dept in this miniworld if you also require 1:1; if 1:N from STAFF to DEPT with each dept one manager, the relationship is actually 1:1.
- State the assumption clearly.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Fundamentals and ER Model).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design an ER diagram for LIBRARY with Book, Copy, Member, Loan. Mark keys and a weak entity if any.

**Model answer:** COPY weak on BOOK with CopyNo; LOAN relates Member–Copy with dates; keys USN/MemberId, ISBN.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define data independence and distinguish logical vs physical.

**Model answer:** Logical: hide conceptual changes from apps. Physical: hide storage/index changes from conceptual schema.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design ER for hospital: Patient, Doctor, Ward, Bed, Admission, Prescription. Identify weak entities.

**Model answer:** BED weak on WARD; PRESCRIPTION line items weak on PRESCRIPTION; Admission relates Patient–Ward/Bed.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A24  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare entity type vs entity instance; relationship type vs instance.

**Model answer:** Type is schema construct; instance is occurrence at a moment. Relationship instances link entity instances.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** List four functions of a DBMS besides storing data.

**Model answer:** Concurrency control, recovery, authorization, query optimization/integrity enforcement.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case: two departments share employees (matrix org). How does ER change vs single dept?

**Model answer:** N:M EMPLOYEE–DEPARTMENT with percentage attribute; or ASSIGNMENT associative entity.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Map a university Course–Student–Instructor scenario to ER constructs including ternary if needed.

**Model answer:** ENROLLS binary Student–Course; TEACHES Instructor–Course; if section-specific, use SECTION entity.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A28  ·  Easy  ·  4 marks  ·  Explain
**Question:** What is a miniworld in database design?

**Model answer:** The portion of the real world relevant to the application being modeled.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A29  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Compare Chen ER vs crow’s foot notation; deliver a one-page mapping guide for your team.

**Model answer:** Cardinality placement differs; map 1/N/M symbols; prefer one standard per project.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A30  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Stakeholders insist on storing derived Age. Advise with schema implications.

**Model answer:** Prefer DOB + derived Age in views; stored Age risks inconsistency unless triggered maintenance.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A31  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Justify when to promote a relationship to an associative entity.

**Model answer:** When relationship has attributes, or becomes M:N needing identity, or must relate to others.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A32  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret total vs partial participation of DEPENDENT in EMPLOYEE–DEPENDENT.

**Model answer:** Total DEPENDENT: every dependent must link to employee. Employee participation often partial.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain recursive relationships with a campus OrgChart example.

**Model answer:** EMPLOYEE supervises EMPLOYEE; role names supervisor/supervisee; careful cardinality.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** For a 1:N relationship DEPARTMENT–EMPLOYEE, where does the FK go and why?

**Model answer:** FK on N-side EMPLOYEE referencing DEPARTMENT. Avoids repeating groups.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Use ER to model Event registration with waitlist capacity constraints (describe; constraints may be beyond basic ER).

**Model answer:** Entities Event, Attendee, Registration; capacity as attribute; waitlist flag; enforce in logic/DB constraints.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A36  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Draw (describe) ER for online shopping: Customer, Product, Order, OrderLine, Payment.

**Model answer:** OrderLine weak/associative between Order–Product with qty; Payment 1:1 or 1:N with Order.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Explain
**Question:** Define cardinality ratio and participation constraint.

**Model answer:** Cardinality: max counts (1:1,1:N,M:N). Participation: whether all entities must engage (total/partial).

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 2 marks

### A38  ·  Difficult  ·  8 marks  ·  Application
**Question:** Apply specialization/generalization to PERSON → STUDENT/FACULTY with overlapping or disjoint constraints.

**Model answer:** Disjoint/overlapping, total/partial specialization; schema implications for tables.

**Evaluation scheme:**
- Concept mapping — 4 marks
- Realism — 4 marks

### A39  ·  Easy  ·  4 marks  ·  Application
**Question:** Give one example where a DBMS catalog (metadata) is queried by tools.

**Model answer:** ORMs and IDEs list tables/columns from INFORMATION_SCHEMA / catalog.

**Evaluation scheme:**
- Concept mapping — 2 marks
- Realism — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Interpret an ER that models Room–KeyCard–AccessLog. Spot a likely missing constraint.

**Model answer:** Often missing time-window uniqueness, lost-card revocation, or which doors a card opens (N:M Room–Card).

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

