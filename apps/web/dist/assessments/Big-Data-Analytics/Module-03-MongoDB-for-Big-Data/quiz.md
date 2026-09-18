# Quiz — Big Data Analytics — Module 3: MongoDB for Big Data

**Subject:** Big Data Analytics  
**Module:** Module 3 — MongoDB for Big Data  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Default primary key field is:

- **A.** _id
- **B.** _block
- **C.** _fsimage
- **D.** _yarn

**Answer:** A
**Explanation:** _id is required/unique.

### Q02  ·  Easy
**Question:** JSON arrays in a student document are:

- **A.** Converted to HDFS blocks
- **B.** YARN queues
- **C.** Valid BSON arrays of values or subdocuments
- **D.** Illegal

**Answer:** C
**Explanation:** Arrays are first-class.

### Q03  ·  Easy
**Question:** MongoDB stores data primarily as:

- **A.** BSON documents in collections
- **B.** CSS files
- **C.** Excel sheets
- **D.** HDFS 128 MB blocks only

**Answer:** A
**Explanation:** Document model.

### Q04  ·  Easy
**Question:** Which command inserts one document?

- **A.** yarn jar
- **B.** hdfs dfs -put
- **C.** db.students.insertOne({...})
- **D.** pig -x local

**Answer:** C
**Explanation:** insertOne.

### Q05  ·  Easy
**Question:** Which option best describes **CRUD**?

- **A.** HDFS balancer stages.
- **B.** Create, Read, Update, Delete operations on documents.
- **C.** TCP handshake steps.
- **D.** YARN preemption modes.

**Answer:** B
**Explanation:** CRUD: Create, Read, Update, Delete operations on documents.

### Q06  ·  Easy
**Question:** Which option best describes **Document**?

- **A.** A BSON record of field–value pairs, MongoDB’s unit of storage.
- **B.** An HDFS block.
- **C.** A YARN container.
- **D.** A Hadoop fsimage.

**Answer:** A
**Explanation:** Document: A BSON record of field–value pairs, MongoDB’s unit of storage.

### Q07  ·  Easy
**Question:** Which option best describes **Index**?

- **A.** A Spark DAG.
- **B.** A B-tree (or special) structure that speeds queries on fields.
- **C.** An HDFS checksum.
- **D.** A full collection scan always.

**Answer:** B
**Explanation:** Index: A B-tree (or special) structure that speeds queries on fields.

### Q08  ·  Easy
**Question:** Which option best describes **Replica set**?

- **A.** A CSS cluster.
- **B.** A group of mongod nodes providing replication and failover.
- **C.** HDFS DataNodes without Mongo.
- **D.** A RAID-0 stripe only.

**Answer:** B
**Explanation:** Replica set: A group of mongod nodes providing replication and failover.

### Q09  ·  Easy
**Question:** Which option best describes **Shard**?

- **A.** A CSS grid.
- **B.** A horizontal partition of a collection’s data across replica sets.
- **C.** A vertical SQL view.
- **D.** An HDFS fsimage.

**Answer:** B
**Explanation:** Shard: A horizontal partition of a collection’s data across replica sets.

### Q10  ·  Easy
**Question:** Which option best describes **_id**?

- **A.** A Hive partition key always.
- **B.** An HDFS block id only.
- **C.** A YARN application id.
- **D.** The primary key field of a document; unique in a collection.

**Answer:** D
**Explanation:** _id: The primary key field of a document; unique in a collection.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **insert path (replica set)**?

- **A.** NameNode allocates HDFS blocks
- **B.** Write only to a random secondary always
- **C.** Write to primary → journal/oplog → replicate to secondaries → acknowledge per writeConcern
- **D.** Hive compiles Tez first

**Answer:** C
**Explanation:** Correct sequence for insert path (replica set): Write to primary → journal/oplog → replicate to secondaries → acknowledge per writeConcern

### Q12  ·  Easy
**Question:** Which sequence correctly describes **shard routing**?

- **A.** NameNode routes BSON
- **B.** Every query always hits every shard with no key
- **C.** Pig Latin parser shards
- **D.** mongos hashes/ranges shard key → target shard replica set → primary

**Answer:** D
**Explanation:** Correct sequence for shard routing: mongos hashes/ranges shard key → target shard replica set → primary

### Q13  ·  Intermediate
**Question:** A campus MongoDB must survive one server death without losing writes that were majority-acked. Use:

- **A.** A single mongod with no backup
- **B.** A replica set (odd voting members)
- **C.** Pig
- **D.** HDFS Secondary NameNode

**Answer:** B
**Explanation:** Replica sets provide failover.

### Q14  ·  Intermediate
**Question:** A replica set arbiter:

- **A.** Stores all documents twice
- **B.** Is the WiredTiger cache
- **C.** Votes in elections but does not hold data
- **D.** Replaces mongos

**Answer:** C
**Explanation:** Arbiters are voting-only.

### Q15  ·  Intermediate
**Question:** Choosing student_id as shard key when all traffic is ‘latest 100 inserts’ may cause:

- **A.** Perfect write balance always
- **B.** Automatic SQL joins
- **C.** A hot shard / jumbo growing chunk on one side
- **D.** HDFS rack loss

**Answer:** C
**Explanation:** Monotonic keys can hotspot.

### Q16  ·  Intermediate
**Question:** Covered query means:

- **A.** The collection is compressed to zero
- **B.** mongos is skipped
- **C.** The index can answer without fetching the full document
- **D.** Oplog is empty

**Answer:** C
**Explanation:** Projection subset of indexed fields.

### Q17  ·  Intermediate
**Question:** Query: students in CSE with cgpa > 8.5 should use:

- **A.** HDFS balancer
- **B.** A collection scan only by law
- **C.** An index supporting department and/or cgpa
- **D.** Spark UI

**Answer:** C
**Explanation:** Secondary indexes accelerate filters.

### Q18  ·  Intermediate
**Question:** Student ERP stores a student with an array of semester marks inside one document. This model is:

- **A.** HDFS block placement
- **B.** Mandatory 3NF only
- **C.** Embedding
- **D.** YARN locality

**Answer:** C
**Explanation:** Nested marks are embedding.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **MongoDB** and **RDBMS**?

- **A.** SQL cannot do transactions in any product.
- **B.** They both require MapReduce for every read.
- **C.** MongoDB cannot index.
- **D.** MongoDB is document-oriented and schema-flexible; RDBMS is table/SQL with rigid schema.

**Answer:** D
**Explanation:** MongoDB is document-oriented and schema-flexible; RDBMS is table/SQL with rigid schema.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **embedding** and **referencing**?

- **A.** Embedding keeps related data in one document; referencing stores _id links and needs extra reads.
- **B.** Embedding is illegal.
- **C.** Referencing is automatic SQL JOIN.
- **D.** They are HDFS replica policies.

**Answer:** A
**Explanation:** Embedding keeps related data in one document; referencing stores _id links and needs extra reads.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **primary** and **secondary**?

- **A.** Secondaries take all writes.
- **B.** They swap every query.
- **C.** Primary takes writes; secondaries replicate and may serve reads.
- **D.** Primary has no data.

**Answer:** C
**Explanation:** Primary takes writes; secondaries replicate and may serve reads.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **single-field index** and **compound index**?

- **A.** Single-field indexes need shard keys always.
- **B.** Compound indexes ignore order.
- **C.** Compound indexes cover ordered field prefixes; single-field indexes one path.
- **D.** They are replica tags.

**Answer:** C
**Explanation:** Compound indexes cover ordered field prefixes; single-field indexes one path.

### Q23  ·  Intermediate
**Question:** Which option best describes **Aggregation pipeline**?

- **A.** HDFS pipeline writes only.
- **B.** A sequence of stages ($match, $group, $project, …) transforming documents.
- **C.** TCP congestion stages.
- **D.** BIOS POST.

**Answer:** B
**Explanation:** Aggregation pipeline: A sequence of stages ($match, $group, $project, …) transforming documents.

### Q24  ·  Intermediate
**Question:** Which option best describes **BSON**?

- **A.** A Hadoop codec for sequence files.
- **B.** A RAID layout.
- **C.** A CSS colour format.
- **D.** Binary JSON encoding used by MongoDB, with extra types such as ObjectId and Date.

**Answer:** D
**Explanation:** BSON: Binary JSON encoding used by MongoDB, with extra types such as ObjectId and Date.

### Q25  ·  Intermediate
**Question:** Which option best describes **Collection**?

- **A.** A mandatory 3NF table.
- **B.** A Spark executor.
- **C.** A group of documents, analogous to a table but schema-flexible.
- **D.** A NameNode rack.

**Answer:** C
**Explanation:** Collection: A group of documents, analogous to a table but schema-flexible.

### Q26  ·  Intermediate
**Question:** Which option best describes **Embedded document**?

- **A.** A nested object stored inside a parent document.
- **B.** A foreign-server HTTP call.
- **C.** An HDFS symlink.
- **D.** A YARN queue.

**Answer:** A
**Explanation:** Embedded document: A nested object stored inside a parent document.

### Q27  ·  Intermediate
**Question:** Which option best describes **MQL**?

- **A.** Pig Latin only.
- **B.** MongoDB Query Language — document queries, not SQL tables.
- **C.** SPARQL only.
- **D.** HiveQL only.

**Answer:** B
**Explanation:** MQL: MongoDB Query Language — document queries, not SQL tables.

### Q28  ·  Intermediate
**Question:** Which option best describes **ObjectId**?

- **A.** A 12-byte unique identifier typically used as default _id.
- **B.** A 128-bit IPv6 address.
- **C.** An MD5 of the whole database.
- **D.** A Java package name.

**Answer:** A
**Explanation:** ObjectId: A 12-byte unique identifier typically used as default _id.

### Q29  ·  Intermediate
**Question:** Which option best describes **Primary**?

- **A.** A Pig grunt shell.
- **B.** The replica-set member that accepts writes.
- **C.** Any hidden arbiter that stores all data.
- **D.** The Hadoop NameNode.

**Answer:** B
**Explanation:** Primary: The replica-set member that accepts writes.

### Q30  ·  Intermediate
**Question:** Which option best describes **Reference**?

- **A.** An HDFS rack name.
- **B.** Storing an _id that points to a document in another collection.
- **C.** A Spark stage id.
- **D.** A CSS class name.

**Answer:** B
**Explanation:** Reference: Storing an _id that points to a document in another collection.

### Q31  ·  Intermediate
**Question:** Which option best describes **Schema flexibility**?

- **A.** Documents in one collection may have different fields.
- **B.** Fields cannot be added later.
- **C.** Every document must match a CREATE TABLE.
- **D.** Types cannot vary.

**Answer:** A
**Explanation:** Schema flexibility: Documents in one collection may have different fields.

### Q32  ·  Intermediate
**Question:** Which option best describes **Secondary**?

- **A.** Hive metastore.
- **B.** A NameNode.
- **C.** The only node that takes writes.
- **D.** A replica-set member that replicates the oplog and can serve reads if allowed.

**Answer:** D
**Explanation:** Secondary: A replica-set member that replicates the oplog and can serve reads if allowed.

### Q33  ·  Intermediate
**Question:** Which option best describes **Shard key**?

- **A.** The _id of the config CSS.
- **B.** A YARN queue name.
- **C.** The MongoDB root password.
- **D.** The field(s) that determine which shard stores a document.

**Answer:** D
**Explanation:** Shard key: The field(s) that determine which shard stores a document.

### Q34  ·  Intermediate
**Question:** Which option best describes **WiredTiger**?

- **A.** The Hadoop NameNode.
- **B.** A CSS engine.
- **C.** Hive SerDe.
- **D.** MongoDB’s default storage engine with document-level concurrency and compression.

**Answer:** D
**Explanation:** WiredTiger: MongoDB’s default storage engine with document-level concurrency and compression.

### Q35  ·  Intermediate
**Question:** Which query finds CSE students with cgpa ≥ 8?

- **A.** db.students.find({dept:'CSE', cgpa:{$gte:8}})
- **B.** SELECT * FROM HDFS
- **C.** pig {CSE}
- **D.** YARN --cgpa 8

**Answer:** A
**Explanation:** MQL filter with $gte.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **aggregation**?

- **A.** $group before any $match always by law
- **B.** Shuffle HDFS blocks into mongod
- **C.** Format WiredTiger then drop DB
- **D.** $match to filter → $group/$project/etc. → return cursor

**Answer:** D
**Explanation:** Correct sequence for aggregation: $match to filter → $group/$project/etc. → return cursor

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **failover**?

- **A.** HDFS SNN becomes mongod
- **B.** Client formats disks
- **C.** Primary missing heartbeats → election among eligible secondaries → new primary
- **D.** Secondaries all take writes with no election

**Answer:** C
**Explanation:** Correct sequence for failover: Primary missing heartbeats → election among eligible secondaries → new primary

### Q38  ·  Intermediate
**Question:** Which statement about **Aggregation pipeline** is FALSE?

- **A.** A useful way to remember Aggregation pipeline is that it is not the same as “HDFS pipeline writes only”.
- **B.** Aggregation cannot group or average.
- **C.** In this module, Aggregation pipeline is a core idea students must distinguish from nearby terms.
- **D.** Aggregation pipeline is correctly understood as: a sequence of stages ($match, $group, $project, …) transforming documents.

**Answer:** B
**Explanation:** The false claim is: Aggregation cannot group or average.. Aggregation pipeline actually means: A sequence of stages ($match, $group, $project, …) transforming documents.

### Q39  ·  Intermediate
**Question:** Which statement about **BSON** is FALSE?

- **A.** BSON is correctly understood as: binary JSON encoding used by MongoDB, with extra types such as ObjectId and Date.
- **B.** A useful way to remember BSON is that it is not the same as “A Hadoop codec for sequence files”.
- **C.** In this module, BSON is a core idea students must distinguish from nearby terms.
- **D.** BSON is plain UTF-8 JSON text on disk.

**Answer:** D
**Explanation:** The false claim is: BSON is plain UTF-8 JSON text on disk.. BSON actually means: Binary JSON encoding used by MongoDB, with extra types such as ObjectId and Date.

### Q40  ·  Intermediate
**Question:** Which statement about **CRUD** is FALSE?

- **A.** In this module, CRUD is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember CRUD is that it is not the same as “HDFS balancer stages”.
- **C.** CRUD is correctly understood as: create, Read, Update, Delete operations on documents.
- **D.** CRUD is a MapReduce combiner.

**Answer:** D
**Explanation:** The false claim is: CRUD is a MapReduce combiner.. CRUD actually means: Create, Read, Update, Delete operations on documents.

### Q41  ·  Intermediate
**Question:** Which statement about **Document** is FALSE?

- **A.** In this module, Document is a core idea students must distinguish from nearby terms.
- **B.** Document is correctly understood as: a BSON record of field–value pairs, MongoDB’s unit of storage.
- **C.** A useful way to remember Document is that it is not the same as “A Hadoop fsimage”.
- **D.** A document is a 128 MB HDFS block.

**Answer:** D
**Explanation:** The false claim is: A document is a 128 MB HDFS block.. Document actually means: A BSON record of field–value pairs, MongoDB’s unit of storage.

### Q42  ·  Intermediate
**Question:** Which statement about **ObjectId** is FALSE?

- **A.** A useful way to remember ObjectId is that it is not the same as “A 128-bit IPv6 address”.
- **B.** ObjectId is a user password hash.
- **C.** In this module, ObjectId is a core idea students must distinguish from nearby terms.
- **D.** ObjectId is correctly understood as: a 12-byte unique identifier typically used as default _id.

**Answer:** B
**Explanation:** The false claim is: ObjectId is a user password hash.. ObjectId actually means: A 12-byte unique identifier typically used as default _id.

### Q43  ·  Intermediate
**Question:** Which statement about **Primary** is FALSE?

- **A.** In this module, Primary is a core idea students must distinguish from nearby terms.
- **B.** Primary is correctly understood as: the replica-set member that accepts writes.
- **C.** A useful way to remember Primary is that it is not the same as “Any hidden arbiter that stores all data”.
- **D.** All secondaries accept arbitrary writes in a replica set by default.

**Answer:** D
**Explanation:** The false claim is: All secondaries accept arbitrary writes in a replica set by default.. Primary actually means: The replica-set member that accepts writes.

### Q44  ·  Intermediate
**Question:** Which statement about **Reference** is FALSE?

- **A.** References automatically join like SQL with no extra query.
- **B.** A useful way to remember Reference is that it is not the same as “A CSS class name”.
- **C.** In this module, Reference is a core idea students must distinguish from nearby terms.
- **D.** Reference is correctly understood as: storing an _id that points to a document in another collection.

**Answer:** A
**Explanation:** The false claim is: References automatically join like SQL with no extra query.. Reference actually means: Storing an _id that points to a document in another collection.

### Q45  ·  Intermediate
**Question:** Which statement about **Shard** is FALSE?

- **A.** In this module, Shard is a core idea students must distinguish from nearby terms.
- **B.** Shard is correctly understood as: a horizontal partition of a collection’s data across replica sets.
- **C.** A useful way to remember Shard is that it is not the same as “A vertical SQL view”.
- **D.** Sharding copies the entire collection to every shard without a shard key.

**Answer:** D
**Explanation:** The false claim is: Sharding copies the entire collection to every shard without a shard key.. Shard actually means: A horizontal partition of a collection’s data across replica sets.

### Q46  ·  Intermediate
**Question:** Which statement about **WiredTiger** is FALSE?

- **A.** WiredTiger is correctly understood as: mongoDB’s default storage engine with document-level concurrency and compression.
- **B.** In this module, WiredTiger is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember WiredTiger is that it is not the same as “The Hadoop NameNode”.
- **D.** WiredTiger stores HDFS blocks.

**Answer:** D
**Explanation:** The false claim is: WiredTiger stores HDFS blocks.. WiredTiger actually means: MongoDB’s default storage engine with document-level concurrency and compression.

### Q47  ·  Intermediate
**Question:** document-level locking in WiredTiger means:

- **A.** Indexes are forbidden
- **B.** Two updates to different documents can proceed concurrently
- **C.** The whole database is locked for any write
- **D.** HDFS namenode locks Mongo

**Answer:** B
**Explanation:** Fine-grained concurrency.

### Q48  ·  Difficult
**Question:** A collection of 5 million 2 KB documents is about how large before indexes/padding?

- **A.** 5 MB
- **B.** ≈10 GB
- **C.** 128 MB
- **D.** 2 KB

**Answer:** B
**Explanation:** 5e6 × 2 KB = 10 GB.

### Q49  ·  Difficult
**Question:** A document that sometimes has hostel_id and sometimes does not illustrates:

- **A.** A CREATE TABLE failure
- **B.** Schema flexibility
- **C.** Illegal BSON
- **D.** A broken ObjectId

**Answer:** B
**Explanation:** Collections allow missing fields.

### Q50  ·  Difficult
**Question:** A good shard key is:

- **A.** The CSS class name
- **B.** Always the insertion timestamp alone for heavy inserts
- **C.** High cardinality, not monotonically hot, aligns with query filters
- **D.** A boolean is_active for 8 TB

**Answer:** C
**Explanation:** Avoid hotspots and low cardinality.

### Q51  ·  Difficult
**Question:** A hashed shard key with 4 shards aims to put about what fraction of documents on one shard if uniform?

- **A.** 4%
- **B.** 100%
- **C.** 0%
- **D.** ≈25%

**Answer:** D
**Explanation:** Uniform hash ≈ 1/4 each.

### Q52  ·  Difficult
**Question:** An index on a 10-byte field for 5 million docs is order-of-magnitude closest to?

- **A.** 128 MB exactly always
- **B.** 5 TB
- **C.** Tens of MB plus overhead
- **D.** 10 bytes total

**Answer:** C
**Explanation:** 5e6 × ~10–30 B plus B-tree overhead is tens of MB, not TB.

### Q53  ·  Difficult
**Question:** Average CGPA per department is computed with:

- **A.** BIOS update
- **B.** A NameNode checkpoint
- **C.** TCP slow start
- **D.** Aggregation $group

**Answer:** D
**Explanation:** $group aggregates.

### Q54  ·  Difficult
**Question:** ObjectId is how many bytes?

- **A.** 128
- **B.** 12
- **C.** 32
- **D.** 16

**Answer:** B
**Explanation:** 4-byte time + 5-byte random/machine + 3-byte counter (modern layout is 12 bytes).

### Q55  ·  Difficult
**Question:** Orders store only customer_id and look up customers in another collection. This is:

- **A.** Automatic MapReduce
- **B.** Referencing
- **C.** HDFS rack awareness
- **D.** A unique index on CSS

**Answer:** B
**Explanation:** Storing _id links is referencing.

### Q56  ·  Difficult
**Question:** Read preference secondaryPreferred is risky for:

- **A.** Heartbeats
- **B.** Index builds on hidden nodes
- **C.** Read-your-own-write consistency right after a write
- **D.** Ancient archived analytics that tolerate lag

**Answer:** C
**Explanation:** Secondaries may lag.

### Q57  ·  Difficult
**Question:** Replica set of 3 data-bearing members: how many complete copies of the data?

- **A.** 1
- **B.** 6
- **C.** 128
- **D.** 3

**Answer:** D
**Explanation:** Each data-bearing member holds a copy.

### Q58  ·  Difficult
**Question:** The students collection grew to 8 TB and a single replica set cannot hold it. Next scale lever is:

- **A.** Storing BSON on the NameNode
- **B.** Turning off indexes
- **C.** Deleting the shard key
- **D.** Sharding

**Answer:** D
**Explanation:** Shard to partition data.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **$match** and **$group**?

- **A.** $match filters documents; $group aggregates by key.
- **B.** Both delete the primary.
- **C.** $group is a write concern.
- **D.** Both always sort the oplog.

**Answer:** A
**Explanation:** $match filters documents; $group aggregates by key.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **BSON** and **JSON**?

- **A.** JSON stores ObjectId natively as 12 bytes.
- **B.** BSON is binary with extra types; JSON is text.
- **C.** They are the same on the wire always.
- **D.** BSON cannot store arrays.

**Answer:** B
**Explanation:** BSON is binary with extra types; JSON is text.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **find** and **aggregate**?

- **A.** aggregate cannot $match.
- **B.** find is a query cursor; aggregate is a multi-stage pipeline.
- **C.** find cannot use indexes.
- **D.** They are HDFS commands.

**Answer:** B
**Explanation:** find is a query cursor; aggregate is a multi-stage pipeline.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **replica set** and **shard cluster**?

- **A.** Replica sets split by shard key.
- **B.** Replica sets copy the same data for HA; sharding splits data for scale.
- **C.** They are identical.
- **D.** Sharding is only backups.

**Answer:** B
**Explanation:** Replica sets copy the same data for HA; sharding splits data for scale.

### Q63  ·  Difficult
**Question:** Which statement about **Collection** is FALSE?

- **A.** Collections require identical schemas for every document.
- **B.** Collection is correctly understood as: a group of documents, analogous to a table but schema-flexible.
- **C.** A useful way to remember Collection is that it is not the same as “A mandatory 3NF table”.
- **D.** In this module, Collection is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Collections require identical schemas for every document.. Collection actually means: A group of documents, analogous to a table but schema-flexible.

### Q64  ·  Difficult
**Question:** Which statement about **Embedded document** is FALSE?

- **A.** Embedding is forbidden in MongoDB.
- **B.** A useful way to remember Embedded document is that it is not the same as “A foreign-server HTTP call”.
- **C.** Embedded document is correctly understood as: a nested object stored inside a parent document.
- **D.** In this module, Embedded document is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Embedding is forbidden in MongoDB.. Embedded document actually means: A nested object stored inside a parent document.

### Q65  ·  Difficult
**Question:** Which statement about **Index** is FALSE?

- **A.** Index is correctly understood as: a B-tree (or special) structure that speeds queries on fields.
- **B.** Indexes always slow every query down.
- **C.** A useful way to remember Index is that it is not the same as “A full collection scan always”.
- **D.** In this module, Index is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Indexes always slow every query down.. Index actually means: A B-tree (or special) structure that speeds queries on fields.

### Q66  ·  Difficult
**Question:** Which statement about **MQL** is FALSE?

- **A.** A useful way to remember MQL is that it is not the same as “HiveQL only”.
- **B.** MQL is correctly understood as: mongoDB Query Language — document queries, not SQL tables.
- **C.** MongoDB cannot filter documents without Spark.
- **D.** In this module, MQL is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: MongoDB cannot filter documents without Spark.. MQL actually means: MongoDB Query Language — document queries, not SQL tables.

### Q67  ·  Difficult
**Question:** Which statement about **Replica set** is FALSE?

- **A.** In this module, Replica set is a core idea students must distinguish from nearby terms.
- **B.** A replica set has no primary.
- **C.** Replica set is correctly understood as: a group of mongod nodes providing replication and failover.
- **D.** A useful way to remember Replica set is that it is not the same as “HDFS DataNodes without Mongo”.

**Answer:** B
**Explanation:** The false claim is: A replica set has no primary.. Replica set actually means: A group of mongod nodes providing replication and failover.

### Q68  ·  Difficult
**Question:** Which statement about **Schema flexibility** is FALSE?

- **A.** In this module, Schema flexibility is a core idea students must distinguish from nearby terms.
- **B.** MongoDB enforces a single global relational schema.
- **C.** A useful way to remember Schema flexibility is that it is not the same as “Every document must match a CREATE TABLE”.
- **D.** Schema flexibility is correctly understood as: documents in one collection may have different fields.

**Answer:** B
**Explanation:** The false claim is: MongoDB enforces a single global relational schema.. Schema flexibility actually means: Documents in one collection may have different fields.

### Q69  ·  Difficult
**Question:** Which statement about **Secondary** is FALSE?

- **A.** Secondaries never have data files.
- **B.** In this module, Secondary is a core idea students must distinguish from nearby terms.
- **C.** Secondary is correctly understood as: a replica-set member that replicates the oplog and can serve reads if allowed.
- **D.** A useful way to remember Secondary is that it is not the same as “The only node that takes writes”.

**Answer:** A
**Explanation:** The false claim is: Secondaries never have data files.. Secondary actually means: A replica-set member that replicates the oplog and can serve reads if allowed.

### Q70  ·  Difficult
**Question:** Which statement about **Shard key** is FALSE?

- **A.** In this module, Shard key is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Shard key is that it is not the same as “The MongoDB root password”.
- **C.** Shard key is optional after data is huge and never chosen.
- **D.** Shard key is correctly understood as: the field(s) that determine which shard stores a document.

**Answer:** C
**Explanation:** The false claim is: Shard key is optional after data is huge and never chosen.. Shard key actually means: The field(s) that determine which shard stores a document.

### Q71  ·  Difficult
**Question:** Which statement about **_id** is FALSE?

- **A.** A useful way to remember _id is that it is not the same as “A YARN application id”.
- **B.** In this module, _id is a core idea students must distinguish from nearby terms.
- **C.** _id is correctly understood as: the primary key field of a document; unique in a collection.
- **D.** _id may be omitted and duplicated freely.

**Answer:** D
**Explanation:** The false claim is: _id may be omitted and duplicated freely.. _id actually means: The primary key field of a document; unique in a collection.

### Q72  ·  Difficult
**Question:** writeConcern {w: 'majority'} on a 3-node replica set waits for how many data-bearing acks (typical)?

- **A.** 1
- **B.** 3 always including arbiter data
- **C.** 0
- **D.** 2

**Answer:** D
**Explanation:** Majority of 3 is 2.

---

## Quick answer key

Q01–A | Q02–C | Q03–A | Q04–C | Q05–B | Q06–A | Q07–B | Q08–B | Q09–B | Q10–D | Q11–C | Q12–D | Q13–B | Q14–C | Q15–C | Q16–C | Q17–C | Q18–C | Q19–D | Q20–A | Q21–C | Q22–C | Q23–B | Q24–D | Q25–C | Q26–A | Q27–B | Q28–A | Q29–B | Q30–B | Q31–A | Q32–D | Q33–D | Q34–D | Q35–A | Q36–D | Q37–C | Q38–B | Q39–D | Q40–D | Q41–D | Q42–B | Q43–D | Q44–A | Q45–D | Q46–D | Q47–B | Q48–B | Q49–B | Q50–C | Q51–D | Q52–C | Q53–D | Q54–B | Q55–B | Q56–C | Q57–D | Q58–D | Q59–A | Q60–B | Q61–B | Q62–B | Q63–A | Q64–A | Q65–B | Q66–C | Q67–B | Q68–B | Q69–A | Q70–C | Q71–D | Q72–D
