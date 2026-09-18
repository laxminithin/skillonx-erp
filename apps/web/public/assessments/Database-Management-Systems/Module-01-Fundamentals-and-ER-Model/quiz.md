# Quiz — Database Management Systems — Module 1: Fundamentals and ER Model

**Subject:** Database Management Systems  
**Module:** Module 1 — Fundamentals and ER Model  
**Questions:** 74  
**Mix:** 13 Easy · 36 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A candidate key is:

- **A.** The internal RID of a heap tuple
- **B.** A minimal superkey (no proper subset is a superkey)
- **C.** Any attribute that can be null
- **D.** Any superkey, including non-minimal ones

**Answer:** B
**Explanation:** Candidate keys are minimal unique identifiers.

### Q02  ·  Easy
**Question:** Data abstraction in a DBMS is supported primarily by:

- **A.** Storing one file per user
- **B.** Hard-coding byte offsets in every app
- **C.** Banning views
- **D.** Hiding implementation behind catalog-defined structures and operations

**Answer:** D
**Explanation:** Independence and a catalog enable abstraction.

### Q03  ·  Easy
**Question:** The DBMS catalog stores:

- **A.** Metadata describing structure and constraints
- **B.** Only RAID firmware
- **C.** Only user passwords in plaintext
- **D.** Only compiled PHP

**Answer:** A
**Explanation:** The catalog is the self-describing core of the DBMS approach.

### Q04  ·  Easy
**Question:** Which is NOT a typical implicit property of a database?

- **A.** It represents a miniworld
- **B.** It is a random assortment of unrelated facts with no purpose
- **C.** It is a coherent collection of related data
- **D.** It is designed for intended users and applications

**Answer:** B
**Explanation:** A database is coherent and purposeful, not a random dump.

### Q05  ·  Easy
**Question:** Which option best describes **DBA**?

- **A.** The administrator who authorizes access, coordinates design, monitors performance and defines recovery procedures.
- **B.** A student who can only SELECT from one view.
- **C.** The disk vendor’s salesperson.
- **D.** A compiler that parses SQL.

**Answer:** A
**Explanation:** DBA: The administrator who authorizes access, coordinates design, monitors performance and defines recovery procedures.

### Q06  ·  Easy
**Question:** Which option best describes **Database**?

- **A.** A printed circular with no recorded facts.
- **B.** A random dump of unrelated files on a USB stick.
- **C.** A logically coherent collection of related data that represents a miniworld and is stored for a purpose.
- **D.** Any Excel cell that is currently selected.

**Answer:** C
**Explanation:** Database: A logically coherent collection of related data that represents a miniworld and is stored for a purpose.

### Q07  ·  Easy
**Question:** Which option best describes **Internal schema**?

- **A.** SQL view text only.
- **B.** The physical storage description: files, indexes, clustering and access paths.
- **C.** The ER diagram drawn on the whiteboard.
- **D.** A student’s login screen.

**Answer:** B
**Explanation:** Internal schema: The physical storage description: files, indexes, clustering and access paths.

### Q08  ·  Easy
**Question:** Which option best describes **Program-data independence**?

- **A.** Application programs are insulated from storage-structure changes because structure lives in the catalog.
- **B.** Every schema change forces a rewrite of all C file-I/O programs.
- **C.** Records must be addressed by byte offset in every query.
- **D.** The DBMS forbids adding a new attribute.

**Answer:** A
**Explanation:** Program-data independence: Application programs are insulated from storage-structure changes because structure lives in the catalog.

### Q09  ·  Easy
**Question:** Which option best describes **Relationship type**?

- **A.** A view definition only.
- **B.** An association among entity types, shown as a diamond, with cardinality and participation constraints.
- **C.** A disk block checksum.
- **D.** A primary key stored twice.

**Answer:** B
**Explanation:** Relationship type: An association among entity types, shown as a diamond, with cardinality and participation constraints.

### Q10  ·  Easy
**Question:** Which option best describes **Specialization**?

- **A.** Storing subclasses only as separate databases with no inheritance.
- **B.** Merging two unrelated entity types into one rectangle.
- **C.** Defining subclasses of a superclass that inherit attributes and may add their own (IS-A).
- **D.** Deleting the superclass after creating subclasses.

**Answer:** C
**Explanation:** Specialization: Defining subclasses of a superclass that inherit attributes and may add their own (IS-A).

### Q11  ·  Easy
**Question:** Which option best describes **Three-schema architecture**?

- **A.** A network of three printers.
- **B.** A single flat file used by every program.
- **C.** Three copies of the same Excel sheet.
- **D.** ANSI/SPARC split into internal, conceptual and external levels with mappings between them.

**Answer:** D
**Explanation:** Three-schema architecture: ANSI/SPARC split into internal, conceptual and external levels with mappings between them.

### Q12  ·  Easy
**Question:** Which sequence correctly describes **DBMS versus files (characteristic stack)**?

- **A.** One CSV per office with no sharing
- **B.** Self-describing catalog → program-data independence → multiple views → multiuser transactions
- **C.** Hard-coded offsets → duplicate files → single user → no catalog
- **D.** Print reports → throw away schema → lock the building

**Answer:** B
**Explanation:** Correct sequence for DBMS versus files (characteristic stack): Self-describing catalog → program-data independence → multiple views → multiuser transactions

### Q13  ·  Easy
**Question:** Which sequence correctly describes **database design flow**?

- **A.** Implementation → then invent miniworld → ignore constraints
- **B.** Requirements → conceptual ER/EER → logical (relational) schema → physical design → implementation and maintenance
- **C.** Buy disks → write PHP → never catalog metadata
- **D.** Physical indexes → skip requirements → print ER last

**Answer:** B
**Explanation:** Correct sequence for database design flow: Requirements → conceptual ER/EER → logical (relational) schema → physical design → implementation and maintenance

### Q14  ·  Intermediate
**Question:** Actors on the scene of a database system include:

- **A.** Only the compiler vendor
- **B.** Only the disk manufacturer
- **C.** Database administrators, designers, end users and system analysts/application programmers
- **D.** Only the network switch

**Answer:** C
**Explanation:** Elmasri/Navathe-style actors around the DBMS.

### Q15  ·  Intermediate
**Question:** Cardinality ratio 1:N from DEPARTMENT to EMPLOYEE means:

- **A.** Each employee belongs to at most one department; a department may have many employees
- **B.** The relationship cannot have attributes
- **C.** Each employee belongs to many departments and each department to many employees
- **D.** Each department has exactly one employee

**Answer:** A
**Explanation:** Classic 1:N from dept to emp.

### Q16  ·  Intermediate
**Question:** DBA moves STUDENT from a heap file to a clustered index. Student portal SQL should keep working because of:

- **A.** Physical data independence
- **B.** Rewriting every PHP file by hand
- **C.** Removing the catalog
- **D.** Loss of the conceptual schema

**Answer:** A
**Explanation:** Internal changes should not alter conceptual/external interfaces.

### Q17  ·  Intermediate
**Question:** In a disjoint, total specialization of PERSON into STAFF and STUDENT:

- **A.** Every person is in exactly one subclass
- **B.** Some persons may be in neither subclass
- **C.** Subclasses cannot inherit attributes
- **D.** A person may be in both subclasses

**Answer:** A
**Explanation:** Disjoint + total ⇒ partition of the superclass.

### Q18  ·  Intermediate
**Question:** LIBRARY_COPY has CopyId unique only within ISBN. LIBRARY_COPY is:

- **A.** An internal schema mapping
- **B.** A weak entity identified by BOOK plus CopyId
- **C.** A subclass of DBA
- **D.** A strong entity with key CopyId alone

**Answer:** B
**Explanation:** CopyId is a partial key; ISBN is the owner key.

### Q19  ·  Intermediate
**Question:** Logical data independence is harder to achieve than physical independence mainly because:

- **A.** SQL cannot name tables
- **B.** Applications are tightly coupled to conceptual structures and constraints
- **C.** External views cannot be defined
- **D.** Disk vendors forbid indexes

**Answer:** B
**Explanation:** Changing the conceptual schema often forces view/program repair.

### Q20  ·  Intermediate
**Question:** STAFF and STUDENT both have Name and InstituteEmail factored into PERSON. This design step is:

- **A.** Physical indexing
- **B.** Generalization to a PERSON superclass
- **C.** Creating a weak entity named EMAIL
- **D.** Aggregation of a relationship

**Answer:** B
**Explanation:** Shared attributes pulled into a superclass is generalization.

### Q21  ·  Intermediate
**Question:** VVIET exam cell and accounts both kept separate student files that drifted out of sync. The DBMS characteristic that directly addresses this is:

- **A.** Controlled redundancy and shared data under a catalog
- **B.** Printing more paper registers
- **C.** Storing metadata only in application source
- **D.** Hiding the conceptual schema from the DBA

**Answer:** A
**Explanation:** A shared database with metadata reduces inconsistent copies.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **conceptual schema** and **internal schema**?

- **A.** Internal is what users query by name.
- **B.** Conceptual describes community data and constraints; internal describes files, indexes and devices.
- **C.** They are two names for the same ER printout.
- **D.** Conceptual stores page slots.

**Answer:** B
**Explanation:** Conceptual describes community data and constraints; internal describes files, indexes and devices.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **file processing** and **DBMS approach**?

- **A.** They differ only in the brand of hard disk.
- **B.** File systems embed structure in programs and duplicate data; a DBMS uses a catalog, sharing and independence.
- **C.** File systems always provide ACID transactions.
- **D.** A DBMS cannot store metadata.

**Answer:** B
**Explanation:** File systems embed structure in programs and duplicate data; a DBMS uses a catalog, sharing and independence.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **simple attribute** and **composite attribute**?

- **A.** A simple attribute is atomic; a composite attribute has meaningful components (for example, Address).
- **B.** The difference is only font size on the diagram.
- **C.** Composite attributes cannot be mapped to relations.
- **D.** Simple attributes are always multi-valued.

**Answer:** A
**Explanation:** A simple attribute is atomic; a composite attribute has meaningful components (for example, Address).

### Q25  ·  Intermediate
**Question:** What is the most important distinction between **specialization** and **generalization**?

- **A.** They are physical indexing methods.
- **B.** Specialization proceeds top-down from a superclass; generalization proceeds bottom-up to a superclass.
- **C.** Specialization deletes inherited attributes.
- **D.** They are opposite of aggregation only.

**Answer:** B
**Explanation:** Specialization proceeds top-down from a superclass; generalization proceeds bottom-up to a superclass.

### Q26  ·  Intermediate
**Question:** Which option best describes **Aggregation**?

- **A.** Storing ER diagrams as JPEG only.
- **B.** Treating a relationship as a higher-level entity so it can participate in other relationships.
- **C.** Replacing all relationships with attributes.
- **D.** Deleting weak entities.

**Answer:** B
**Explanation:** Aggregation: Treating a relationship as a higher-level entity so it can participate in other relationships.

### Q27  ·  Intermediate
**Question:** Which option best describes **Attribute**?

- **A.** A table that stores other tables.
- **B.** A property that describes an entity or relationship; it may be simple, composite, multi-valued or derived.
- **C.** A three-schema mapping.
- **D.** A lock manager daemon.

**Answer:** B
**Explanation:** Attribute: A property that describes an entity or relationship; it may be simple, composite, multi-valued or derived.

### Q28  ·  Intermediate
**Question:** Which option best describes **Conceptual schema**?

- **A.** A CSS theme for the ERP.
- **B.** One clerk’s printed report layout.
- **C.** The B+ tree page format on disk.
- **D.** A community-wide description of entities, relationships and constraints, independent of a single user view or disk layout.

**Answer:** D
**Explanation:** Conceptual schema: A community-wide description of entities, relationships and constraints, independent of a single user view or disk layout.

### Q29  ·  Intermediate
**Question:** Which option best describes **DBMS**?

- **A.** A word processor used to type student names.
- **B.** General-purpose software that defines, constructs, manipulates and shares a database, with a catalog of metadata.
- **C.** A single C program that hard-codes one file layout.
- **D.** A BIOS utility that formats a disk.

**Answer:** B
**Explanation:** DBMS: General-purpose software that defines, constructs, manipulates and shares a database, with a catalog of metadata.

### Q30  ·  Intermediate
**Question:** Which option best describes **Entity type**?

- **A.** A foreign-key arrow only.
- **B.** A set of real-world objects with the same attributes, represented as a rectangle in an ER diagram.
- **C.** A single stored integer.
- **D.** A RAID controller.

**Answer:** B
**Explanation:** Entity type: A set of real-world objects with the same attributes, represented as a rectangle in an ER diagram.

### Q31  ·  Intermediate
**Question:** Which option best describes **External schema**?

- **A.** A user- or application-specific view, often a subset or derived presentation of the conceptual schema.
- **B.** The only stored copy of all enterprise data.
- **C.** The DBMS source code.
- **D.** The raw disk cylinder map.

**Answer:** A
**Explanation:** External schema: A user- or application-specific view, often a subset or derived presentation of the conceptual schema.

### Q32  ·  Intermediate
**Question:** Which option best describes **Generalization**?

- **A.** Identifying a common superclass from similar entity types by factoring shared attributes.
- **B.** Replacing keys with file names.
- **C.** Splitting one entity into unrelated files with duplicated keys.
- **D.** Forcing every subclass to lose inherited attributes.

**Answer:** A
**Explanation:** Generalization: Identifying a common superclass from similar entity types by factoring shared attributes.

### Q33  ·  Intermediate
**Question:** Which option best describes **Logical data independence**?

- **A.** Physical indexes being the only schema.
- **B.** Rewriting every student-portal query after adding one view.
- **C.** Changing disk page size without touching the conceptual schema.
- **D.** The ability to change the conceptual schema without rewriting external views and application programs.

**Answer:** D
**Explanation:** Logical data independence: The ability to change the conceptual schema without rewriting external views and application programs.

### Q34  ·  Intermediate
**Question:** Which option best describes **Metadata**?

- **A.** A backup tape of CCTV video.
- **B.** Data about the database structure, types and constraints, stored in the DBMS catalog.
- **C.** The password of the DBA laptop.
- **D.** The actual marks of one student.

**Answer:** B
**Explanation:** Metadata: Data about the database structure, types and constraints, stored in the DBMS catalog.

### Q35  ·  Intermediate
**Question:** Which option best describes **Physical data independence**?

- **A.** The ability to change internal storage (indexes, files, devices) without changing the conceptual schema.
- **B.** Dropping a user view without a catalog.
- **C.** Renaming an entity type in the ER diagram only.
- **D.** Forcing all applications to know block addresses.

**Answer:** A
**Explanation:** Physical data independence: The ability to change internal storage (indexes, files, devices) without changing the conceptual schema.

### Q36  ·  Intermediate
**Question:** Which option best describes **Primary key**?

- **A.** A chosen candidate key whose values uniquely identify each entity instance and are not null.
- **B.** Any randomly selected attribute, even if duplicates exist.
- **C.** The internal page ID of a heap file.
- **D.** A derived attribute computed at query time only.

**Answer:** A
**Explanation:** Primary key: A chosen candidate key whose values uniquely identify each entity instance and are not null.

### Q37  ·  Intermediate
**Question:** Which option best describes **Weak entity**?

- **A.** An entity that is always in 3NF.
- **B.** A strong entity with a surrogate integer key.
- **C.** An entity type that has no key of its own and depends on an identifying owner via an identifying relationship.
- **D.** A view that joins two tables.

**Answer:** C
**Explanation:** Weak entity: An entity type that has no key of its own and depends on an identifying owner via an identifying relationship.

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **ANSI/SPARC mapping path**?

- **A.** Internal pages → skip conceptual → user SQL on cylinders
- **B.** External view ↔ conceptual schema ↔ internal schema ↔ stored database
- **C.** External views store all bytes twice then delete conceptual
- **D.** Catalog is optional if users know block IDs

**Answer:** B
**Explanation:** Correct sequence for ANSI/SPARC mapping path: External view ↔ conceptual schema ↔ internal schema ↔ stored database

### Q39  ·  Intermediate
**Question:** Which sequence correctly describes **identifying a weak entity**?

- **A.** Remove the owner and keep the partial key as a global key
- **B.** Map it as a subclass of the DBA
- **C.** Give it a surrogate and call it weak anyway
- **D.** Confirm no complete own key → name identifying owner → name identifying relationship → declare partial key

**Answer:** D
**Explanation:** Correct sequence for identifying a weak entity: Confirm no complete own key → name identifying owner → name identifying relationship → declare partial key

### Q40  ·  Intermediate
**Question:** Which statement about **DBA** is FALSE?

- **A.** DBA is correctly understood as: the administrator who authorizes access, coordinates design, monitors performance and defines recovery procedures.
- **B.** The DBA never deals with security, backup or schema change.
- **C.** In this module, DBA is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember DBA is that it is not the same as “A student who can only SELECT from one view”.

**Answer:** B
**Explanation:** The false claim is: The DBA never deals with security, backup or schema change.. DBA actually means: The administrator who authorizes access, coordinates design, monitors performance and defines recovery procedures.

### Q41  ·  Intermediate
**Question:** Which statement about **Database** is FALSE?

- **A.** In this module, Database is a core idea students must distinguish from nearby terms.
- **B.** Database is correctly understood as: a logically coherent collection of related data that represents a miniworld and is stored for a purpose.
- **C.** A database is any folder of files, even if the items have no shared meaning.
- **D.** A useful way to remember Database is that it is not the same as “A random dump of unrelated files on a USB stick”.

**Answer:** C
**Explanation:** The false claim is: A database is any folder of files, even if the items have no shared meaning.. Database actually means: A logically coherent collection of related data that represents a miniworld and is stored for a purpose.

### Q42  ·  Intermediate
**Question:** Which statement about **Entity type** is FALSE?

- **A.** An entity type cannot have instances; only attributes can.
- **B.** A useful way to remember Entity type is that it is not the same as “A single stored integer”.
- **C.** Entity type is correctly understood as: a set of real-world objects with the same attributes, represented as a rectangle in an ER diagram.
- **D.** In this module, Entity type is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: An entity type cannot have instances; only attributes can.. Entity type actually means: A set of real-world objects with the same attributes, represented as a rectangle in an ER diagram.

### Q43  ·  Intermediate
**Question:** Which statement about **External schema** is FALSE?

- **A.** A useful way to remember External schema is that it is not the same as “The only stored copy of all enterprise data”.
- **B.** An external schema must physically duplicate every table it shows.
- **C.** External schema is correctly understood as: a user- or application-specific view, often a subset or derived presentation of the conceptual schema.
- **D.** In this module, External schema is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: An external schema must physically duplicate every table it shows.. External schema actually means: A user- or application-specific view, often a subset or derived presentation of the conceptual schema.

### Q44  ·  Intermediate
**Question:** Which statement about **Generalization** is FALSE?

- **A.** Generalization is the same as aggregation of a relationship into an entity.
- **B.** In this module, Generalization is a core idea students must distinguish from nearby terms.
- **C.** Generalization is correctly understood as: identifying a common superclass from similar entity types by factoring shared attributes.
- **D.** A useful way to remember Generalization is that it is not the same as “Splitting one entity into unrelated files with duplicated keys”.

**Answer:** A
**Explanation:** The false claim is: Generalization is the same as aggregation of a relationship into an entity.. Generalization actually means: Identifying a common superclass from similar entity types by factoring shared attributes.

### Q45  ·  Intermediate
**Question:** Which statement about **Logical data independence** is FALSE?

- **A.** In this module, Logical data independence is a core idea students must distinguish from nearby terms.
- **B.** Logical data independence is the same as changing RAID stripe size.
- **C.** A useful way to remember Logical data independence is that it is not the same as “Changing disk page size without touching the conceptual schema”.
- **D.** Logical data independence is correctly understood as: the ability to change the conceptual schema without rewriting external views and application programs.

**Answer:** B
**Explanation:** The false claim is: Logical data independence is the same as changing RAID stripe size.. Logical data independence actually means: The ability to change the conceptual schema without rewriting external views and application programs.

### Q46  ·  Intermediate
**Question:** Which statement about **Metadata** is FALSE?

- **A.** Metadata is correctly understood as: data about the database structure, types and constraints, stored in the DBMS catalog.
- **B.** A useful way to remember Metadata is that it is not the same as “The actual marks of one student”.
- **C.** Metadata lives only inside each application’s source code in a true DBMS.
- **D.** In this module, Metadata is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Metadata lives only inside each application’s source code in a true DBMS.. Metadata actually means: Data about the database structure, types and constraints, stored in the DBMS catalog.

### Q47  ·  Intermediate
**Question:** Which statement about **Relationship type** is FALSE?

- **A.** Relationship type is correctly understood as: an association among entity types, shown as a diamond, with cardinality and participation constraints.
- **B.** In this module, Relationship type is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Relationship type is that it is not the same as “A primary key stored twice”.
- **D.** A relationship type cannot have its own attributes (for example, date of offering).

**Answer:** D
**Explanation:** The false claim is: A relationship type cannot have its own attributes (for example, date of offering).. Relationship type actually means: An association among entity types, shown as a diamond, with cardinality and participation constraints.

### Q48  ·  Intermediate
**Question:** Which statement about **Three-schema architecture** is FALSE?

- **A.** In this module, Three-schema architecture is a core idea students must distinguish from nearby terms.
- **B.** ANSI/SPARC stores three identical physical files and no mappings.
- **C.** A useful way to remember Three-schema architecture is that it is not the same as “A single flat file used by every program”.
- **D.** Three-schema architecture is correctly understood as: aNSI/SPARC split into internal, conceptual and external levels with mappings between them.

**Answer:** B
**Explanation:** The false claim is: ANSI/SPARC stores three identical physical files and no mappings.. Three-schema architecture actually means: ANSI/SPARC split into internal, conceptual and external levels with mappings between them.

### Q49  ·  Intermediate
**Question:** Which statement about **Weak entity** is FALSE?

- **A.** Weak entity is correctly understood as: an entity type that has no key of its own and depends on an identifying owner via an identifying relationship.
- **B.** In this module, Weak entity is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Weak entity is that it is not the same as “A strong entity with a surrogate integer key”.
- **D.** A weak entity always has a complete primary key without using the owner’s key.

**Answer:** D
**Explanation:** The false claim is: A weak entity always has a complete primary key without using the owner’s key.. Weak entity actually means: An entity type that has no key of its own and depends on an identifying owner via an identifying relationship.

### Q50  ·  Difficult
**Question:** A 1:N relationship SECTION—OFFERS—COURSE: each course has at most 4 sections and there are 50 courses, all participating. Maximum number of SECTION entities?

- **A.** 50
- **B.** 200
- **C.** 4
- **D.** 54

**Answer:** B
**Explanation:** 50 courses × 4 sections = 200.

### Q51  ·  Difficult
**Question:** A composite attribute Address has Street, City, PIN. Mapping to a relation (no nested types) adds how many stored columns for Address?

- **A.** 0
- **B.** 4
- **C.** 1
- **D.** 3

**Answer:** D
**Explanation:** Each component becomes its own column.

### Q52  ·  Difficult
**Question:** A relationship WORKS_ON between EMPLOYEE and PROJECT has Hours. After treating WORKS_ON as an aggregated entity, GRADED_BY can relate it to SUPERVISOR because:

- **A.** SUPERVISOR must be a multi-valued attribute of PROJECT
- **B.** Aggregation allows a relationship to participate in another relationship
- **C.** ER forbids attributes on relationships
- **D.** Hours becomes a weak entity owner

**Answer:** B
**Explanation:** That is the purpose of aggregation.

### Q53  ·  Difficult
**Question:** A weak entity DEPENDENT has partial key Name and owner EMPLOYEE with key EmpId. How many attributes form DEPENDENT’s primary key after mapping?

- **A.** 3
- **B.** 1
- **C.** 2
- **D.** 0

**Answer:** C
**Explanation:** Owner key EmpId plus partial key Name.

### Q54  ·  Difficult
**Question:** Adding BirthDate to STUDENT in the catalog without recompiling file-offset C programs illustrates:

- **A.** Loss of the three-schema architecture
- **B.** That DBMS cannot evolve schemas
- **C.** Program-data independence via metadata
- **D.** That metadata is unused

**Answer:** C
**Explanation:** Structure is in the catalog, not baked into programs.

### Q55  ·  Difficult
**Question:** An entity type STUDENT has attributes {USN, Name, Phone, Email} and USN is the only key. How many distinct superkeys exist?

- **A.** 4
- **B.** 16
- **C.** 8
- **D.** 1

**Answer:** C
**Explanation:** Any superkey is USN plus a subset of the other 3 attributes: 2^3 = 8.

### Q56  ·  Difficult
**Question:** Binary relationship R between E1 (80 entities) and E2 (30 entities) is 1:1 with total participation of E2. Minimum |R|?

- **A.** 110
- **B.** 80
- **C.** 1
- **D.** 30

**Answer:** D
**Explanation:** Every E2 instance appears exactly once, so at least 30 relationship instances.

### Q57  ·  Difficult
**Question:** COURSE_OFFERING is a relationship between COURSE, STAFF and SEMESTER, and it itself is graded. The ER construct to model ‘offering is graded’ is:

- **A.** Making COURSE a weak entity of STAFF
- **B.** Aggregation of the ternary (or n-ary) relationship
- **C.** Storing grades only as a derived attribute of STAFF
- **D.** Deleting SEMESTER

**Answer:** B
**Explanation:** Aggregation lets a relationship participate in another.

### Q58  ·  Difficult
**Question:** EER: PERSON specializes into disjoint STAFF and STUDENT. 400 PERSON instances, 150 STAFF. If completeness is total, how many STUDENT instances?

- **A.** 150
- **B.** 550
- **C.** 400
- **D.** 250

**Answer:** D
**Explanation:** Total + disjoint ⇒ 400 − 150 = 250 students.

### Q59  ·  Difficult
**Question:** Every SECTION must belong to exactly one DEPARTMENT, and some departments may have no sections this term. Participation of SECTION is:

- **A.** The same as a multi-valued attribute
- **B.** Total (mandatory) on the SECTION side
- **C.** Partial on the SECTION side
- **D.** Illegal in ER

**Answer:** B
**Explanation:** Every section must participate; departments need not.

### Q60  ·  Difficult
**Question:** The hostel office needs only RoomNo and OccupantUSN, not full academic history. This is best provided as:

- **A.** A change to the internal page layout
- **B.** A new DBMS product
- **C.** Deleting the conceptual schema
- **D.** An external schema / view

**Answer:** D
**Explanation:** User-specific subsets are external views.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **logical independence** and **physical independence**?

- **A.** Logical independence shields programs from conceptual-schema change; physical independence shields them from storage change.
- **B.** Logical independence is about disk cylinders.
- **C.** Both only concern RAID firmware.
- **D.** They are identical ANSI levels.

**Answer:** A
**Explanation:** Logical independence shields programs from conceptual-schema change; physical independence shields them from storage change.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **stored attribute** and **derived attribute**?

- **A.** Derived attributes are illegal in ER.
- **B.** Derived attributes must be keys.
- **C.** A stored attribute is kept explicitly; a derived attribute is computed (for example, Age from BirthDate).
- **D.** Stored attributes cannot be queried.

**Answer:** C
**Explanation:** A stored attribute is kept explicitly; a derived attribute is computed (for example, Age from BirthDate).

### Q63  ·  Difficult
**Question:** What is the most important distinction between **strong entity** and **weak entity**?

- **A.** The difference is only rectangle colour.
- **B.** Strong entities cannot have relationships.
- **C.** Weak entities cannot have attributes.
- **D.** A strong entity has its own key; a weak entity is identified via an owner plus a partial key.

**Answer:** D
**Explanation:** A strong entity has its own key; a weak entity is identified via an owner plus a partial key.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **total participation** and **partial participation**?

- **A.** Total means every entity instance must appear in the relationship; partial allows some not to.
- **B.** Partial forbids any relationship instance.
- **C.** Total means a 1:1 cardinality only.
- **D.** Participation is the same as a primary key.

**Answer:** A
**Explanation:** Total means every entity instance must appear in the relationship; partial allows some not to.

### Q65  ·  Difficult
**Question:** Which mapping from EER to relations is correct for overlapping specialization?

- **A.** Store subclasses only as multi-valued attributes
- **B.** A superclass relation plus subclass relations that may both contain the same superclass key
- **C.** Exactly one subclass row for each superclass row
- **D.** Delete the superclass relation always

**Answer:** B
**Explanation:** Overlap allows membership in multiple subclasses.

### Q66  ·  Difficult
**Question:** Which statement about **Aggregation** is FALSE?

- **A.** Aggregation is identical to specialization of a superclass into disjoint subclasses.
- **B.** In this module, Aggregation is a core idea students must distinguish from nearby terms.
- **C.** Aggregation is correctly understood as: treating a relationship as a higher-level entity so it can participate in other relationships.
- **D.** A useful way to remember Aggregation is that it is not the same as “Replacing all relationships with attributes”.

**Answer:** A
**Explanation:** The false claim is: Aggregation is identical to specialization of a superclass into disjoint subclasses.. Aggregation actually means: Treating a relationship as a higher-level entity so it can participate in other relationships.

### Q67  ·  Difficult
**Question:** Which statement about **Attribute** is FALSE?

- **A.** In this module, Attribute is a core idea students must distinguish from nearby terms.
- **B.** An attribute is identical to a relationship type.
- **C.** A useful way to remember Attribute is that it is not the same as “A table that stores other tables”.
- **D.** Attribute is correctly understood as: a property that describes an entity or relationship; it may be simple, composite, multi-valued or derived.

**Answer:** B
**Explanation:** The false claim is: An attribute is identical to a relationship type.. Attribute actually means: A property that describes an entity or relationship; it may be simple, composite, multi-valued or derived.

### Q68  ·  Difficult
**Question:** Which statement about **Conceptual schema** is FALSE?

- **A.** A useful way to remember Conceptual schema is that it is not the same as “One clerk’s printed report layout”.
- **B.** The conceptual schema is only the byte offsets of records on a particular disk.
- **C.** Conceptual schema is correctly understood as: a community-wide description of entities, relationships and constraints, independent of a single user view or disk layout.
- **D.** In this module, Conceptual schema is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The conceptual schema is only the byte offsets of records on a particular disk.. Conceptual schema actually means: A community-wide description of entities, relationships and constraints, independent of a single user view or disk layout.

### Q69  ·  Difficult
**Question:** Which statement about **DBMS** is FALSE?

- **A.** A DBMS stores only application source code, never data or metadata.
- **B.** DBMS is correctly understood as: general-purpose software that defines, constructs, manipulates and shares a database, with a catalog of metadata.
- **C.** In this module, DBMS is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember DBMS is that it is not the same as “A single C program that hard-codes one file layout”.

**Answer:** A
**Explanation:** The false claim is: A DBMS stores only application source code, never data or metadata.. DBMS actually means: General-purpose software that defines, constructs, manipulates and shares a database, with a catalog of metadata.

### Q70  ·  Difficult
**Question:** Which statement about **Internal schema** is FALSE?

- **A.** Internal schema is correctly understood as: the physical storage description: files, indexes, clustering and access paths.
- **B.** The internal schema is what end users write SELECT statements against.
- **C.** A useful way to remember Internal schema is that it is not the same as “The ER diagram drawn on the whiteboard”.
- **D.** In this module, Internal schema is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The internal schema is what end users write SELECT statements against.. Internal schema actually means: The physical storage description: files, indexes, clustering and access paths.

### Q71  ·  Difficult
**Question:** Which statement about **Physical data independence** is FALSE?

- **A.** A useful way to remember Physical data independence is that it is not the same as “Renaming an entity type in the ER diagram only”.
- **B.** Physical data independence is correctly understood as: the ability to change internal storage (indexes, files, devices) without changing the conceptual schema.
- **C.** Physical data independence means users must recode SQL when an index is added.
- **D.** In this module, Physical data independence is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Physical data independence means users must recode SQL when an index is added.. Physical data independence actually means: The ability to change internal storage (indexes, files, devices) without changing the conceptual schema.

### Q72  ·  Difficult
**Question:** Which statement about **Primary key** is FALSE?

- **A.** A useful way to remember Primary key is that it is not the same as “Any randomly selected attribute, even if duplicates exist”.
- **B.** In this module, Primary key is a core idea students must distinguish from nearby terms.
- **C.** Primary key is correctly understood as: a chosen candidate key whose values uniquely identify each entity instance and are not null.
- **D.** A primary key may contain nulls in the relational model.

**Answer:** D
**Explanation:** The false claim is: A primary key may contain nulls in the relational model.. Primary key actually means: A chosen candidate key whose values uniquely identify each entity instance and are not null.

### Q73  ·  Difficult
**Question:** Which statement about **Program-data independence** is FALSE?

- **A.** A useful way to remember Program-data independence is that it is not the same as “Every schema change forces a rewrite of all C file-I/O programs”.
- **B.** Program-data independence is correctly understood as: application programs are insulated from storage-structure changes because structure lives in the catalog.
- **C.** Program-data independence means programs embed the exact disk layout of each record.
- **D.** In this module, Program-data independence is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Program-data independence means programs embed the exact disk layout of each record.. Program-data independence actually means: Application programs are insulated from storage-structure changes because structure lives in the catalog.

### Q74  ·  Difficult
**Question:** Which statement about **Specialization** is FALSE?

- **A.** Specialization forbids inherited attributes; subclasses start with empty schemas.
- **B.** In this module, Specialization is a core idea students must distinguish from nearby terms.
- **C.** Specialization is correctly understood as: defining subclasses of a superclass that inherit attributes and may add their own (IS-A).
- **D.** A useful way to remember Specialization is that it is not the same as “Merging two unrelated entity types into one rectangle”.

**Answer:** A
**Explanation:** The false claim is: Specialization forbids inherited attributes; subclasses start with empty schemas.. Specialization actually means: Defining subclasses of a superclass that inherit attributes and may add their own (IS-A).

---

## Quick answer key

Q01–B | Q02–D | Q03–A | Q04–B | Q05–A | Q06–C | Q07–B | Q08–A | Q09–B | Q10–C | Q11–D | Q12–B | Q13–B | Q14–C | Q15–A | Q16–A | Q17–A | Q18–B | Q19–B | Q20–B | Q21–A | Q22–B | Q23–B | Q24–A | Q25–B | Q26–B | Q27–B | Q28–D | Q29–B | Q30–B | Q31–A | Q32–A | Q33–D | Q34–B | Q35–A | Q36–A | Q37–C | Q38–B | Q39–D | Q40–B | Q41–C | Q42–A | Q43–B | Q44–A | Q45–B | Q46–C | Q47–D | Q48–B | Q49–D | Q50–B | Q51–D | Q52–B | Q53–C | Q54–C | Q55–C | Q56–D | Q57–B | Q58–D | Q59–B | Q60–D | Q61–A | Q62–C | Q63–D | Q64–A | Q65–B | Q66–A | Q67–B | Q68–B | Q69–A | Q70–B | Q71–C | Q72–D | Q73–C | Q74–A
