# Quiz — Big Data Analytics — Module 4: Hive and Pig on Hadoop

**Subject:** Big Data Analytics  
**Module:** Module 4 — Hive and Pig on Hadoop  
**Questions:** 70  
**Mix:** 11 Easy · 34 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Hive is best described as:

- **A.** SQL-on-Hadoop warehousing
- **B.** A CSS preprocessor
- **C.** A CPU scheduler
- **D.** A document database

**Answer:** A
**Explanation:** Warehouse over HDFS.

### Q02  ·  Easy
**Question:** Metastore stores:

- **A.** YARN container images only
- **B.** All video bytes
- **C.** Table schema and locations, not the big files themselves
- **D.** Spark DAGs only

**Answer:** C
**Explanation:** Catalog.

### Q03  ·  Easy
**Question:** Pig Latin is:

- **A.** A data-flow scripting language
- **B.** A replica-set protocol
- **C.** A BIOS
- **D.** An Ethernet PHY

**Answer:** A
**Explanation:** LOAD/FILTER/FOREACH…

### Q04  ·  Easy
**Question:** Which option best describes **Bucket**?

- **A.** An HDFS rack.
- **B.** Hash-based files within a partition/table for sampling and joins.
- **C.** A BIOS setting.
- **D.** A Pig tuple field named bucket.

**Answer:** B
**Explanation:** Bucket: Hash-based files within a partition/table for sampling and joins.

### Q05  ·  Easy
**Question:** Which option best describes **Hive**?

- **A.** A warehouse system that runs SQL-like HQL over Hadoop data.
- **B.** A NameNode replacement.
- **C.** A Mongo replica set.
- **D.** A CSS framework.

**Answer:** A
**Explanation:** Hive: A warehouse system that runs SQL-like HQL over Hadoop data.

### Q06  ·  Easy
**Question:** Which option best describes **Managed table**?

- **A.** A YARN queue.
- **B.** A Mongo collection.
- **C.** A table Hive must never drop.
- **D.** Hive controls the data lifecycle; dropping the table can delete HDFS data.

**Answer:** D
**Explanation:** Managed table: Hive controls the data lifecycle; dropping the table can delete HDFS data.

### Q07  ·  Easy
**Question:** Which option best describes **ORC/Parquet**?

- **A.** RFID binary tags.
- **B.** Columnar, compressed, splittable warehouse formats used with Hive.
- **C.** NameNode fsimage formats.
- **D.** CSS minifiers.

**Answer:** B
**Explanation:** ORC/Parquet: Columnar, compressed, splittable warehouse formats used with Hive.

### Q08  ·  Easy
**Question:** Which option best describes **Tuple / bag / map**?

- **A.** BSON ObjectId classes.
- **B.** Pig’s nested data model: tuple row, bag collection, map key-value.
- **C.** HDFS block types.
- **D.** YARN container types.

**Answer:** B
**Explanation:** Tuple / bag / map: Pig’s nested data model: tuple row, bag collection, map key-value.

### Q09  ·  Easy
**Question:** Which option best describes **Warehouse directory**?

- **A.** YARN’s CSS.
- **B.** HDFS location (e.g. /user/hive/warehouse) for managed table data.
- **C.** A Pig grunt history file only.
- **D.** The NameNode RAM disk for BSON.

**Answer:** B
**Explanation:** Warehouse directory: HDFS location (e.g. /user/hive/warehouse) for managed table data.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **Hive query**?

- **A.** Pig grunt starts YARN RM
- **B.** SerDe formats NameNode → then SQL on mongod
- **C.** HQL → compiler/optimizer → Tez/MR/Spark DAG → read HDFS files via SerDe → results
- **D.** DROP DataNodes first

**Answer:** C
**Explanation:** Correct sequence for Hive query: HQL → compiler/optimizer → Tez/MR/Spark DAG → read HDFS files via SerDe → results

### Q11  ·  Easy
**Question:** Which sequence correctly describes **partitioned insert**?

- **A.** Broadcast mongos
- **B.** Write into NameNode heap
- **C.** Delete SerDe
- **D.** Write files into partition directories (e.g. exam_date=2024-05-01) and update metastore

**Answer:** D
**Explanation:** Correct sequence for partitioned insert: Write files into partition directories (e.g. exam_date=2024-05-01) and update metastore

### Q12  ·  Intermediate
**Question:** Digital Campus dumps CSV on HDFS and wants SQL reports for the principal. First Hive step?

- **A.** Format NameNode
- **B.** Delete HDFS
- **C.** CREATE (external) TABLE + metastore schema over the files
- **D.** Start mongos

**Answer:** C
**Explanation:** Register schema in Hive.

### Q13  ·  Intermediate
**Question:** ORC is chosen over CSV because:

- **A.** ORC is required by TCP
- **B.** CSV cannot sit on HDFS
- **C.** Column pruning, compression, predicate pushdown
- **D.** Pig cannot LOAD CSV

**Answer:** C
**Explanation:** Columnar analytics format.

### Q14  ·  Intermediate
**Question:** Pig bag is:

- **A.** A replica set
- **B.** A collection of tuples
- **C.** An HDFS rack
- **D.** A Hive SerDe

**Answer:** B
**Explanation:** Nested data model.

### Q15  ·  Intermediate
**Question:** Queries always filter by exam_date. Model this as:

- **A.** A single unpartitioned CSV forever
- **B.** PARTITIONED BY (exam_date)
- **C.** A CSS file
- **D.** A replica set

**Answer:** B
**Explanation:** Time partitions prune.

### Q16  ·  Intermediate
**Question:** RCFile/ORC help Hive because they are:

- **A.** Row-only CSV aliases
- **B.** YARN UIs
- **C.** Columnar and compressed
- **D.** NameNode replacements

**Answer:** C
**Explanation:** Read fewer columns.

### Q17  ·  Intermediate
**Question:** Small department lookup 20 MB joined to 200 GB facts. Hive can:

- **A.** Move facts to the NameNode
- **B.** Never join
- **C.** Map-join / broadcast the small side
- **D.** Convert to BSON first

**Answer:** C
**Explanation:** Broadcast small table.

### Q18  ·  Intermediate
**Question:** WHERE exam_date='2024-05-01' on a partitioned table should:

- **A.** Prune to that partition directory
- **B.** Always full-scan the warehouse
- **C.** Query the NameNode only
- **D.** Use mongos

**Answer:** A
**Explanation:** Partition pruning.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **Hive** and **Pig**?

- **A.** Hive is SQL/warehouse; Pig is procedural data-flow scripting.
- **B.** Hive cannot query files.
- **C.** Pig replaces HDFS.
- **D.** They are Mongo drivers.

**Answer:** A
**Explanation:** Hive is SQL/warehouse; Pig is procedural data-flow scripting.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **HiveQL** and **SQL on RDBMS**?

- **A.** HiveQL is millisecond OLTP.
- **B.** They have identical latency.
- **C.** HiveQL looks like SQL but runs as batch jobs on Hadoop with high latency.
- **D.** RDBMS SQL always uses MapReduce.

**Answer:** C
**Explanation:** HiveQL looks like SQL but runs as batch jobs on Hadoop with high latency.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **map join** and **shuffle join**?

- **A.** Map join is for two 10 TB tables.
- **B.** Shuffle join never uses network.
- **C.** Map join broadcasts a small table; shuffle join redistributes both by key.
- **D.** They are Pig bags.

**Answer:** C
**Explanation:** Map join broadcasts a small table; shuffle join redistributes both by key.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **partition** and **bucket**?

- **A.** Partitions are hash files only.
- **B.** They are YARN queues.
- **C.** Buckets are date directories.
- **D.** Partitions are directory values; buckets are hashed files inside.

**Answer:** D
**Explanation:** Partitions are directory values; buckets are hashed files inside.

### Q23  ·  Intermediate
**Question:** Which option best describes **External table**?

- **A.** Hive stores metadata only; dropping the table does not delete the HDFS files.
- **B.** Hive always deletes HDFS on DROP.
- **C.** A replica-set member.
- **D.** An HDFS NameNode.

**Answer:** A
**Explanation:** External table: Hive stores metadata only; dropping the table does not delete the HDFS files.

### Q24  ·  Intermediate
**Question:** Which option best describes **HQL / HiveQL**?

- **A.** Pig Latin only.
- **B.** CSS selectors.
- **C.** Hive’s SQL-like language compiled into MapReduce/Tez/Spark jobs.
- **D.** MQL only.

**Answer:** C
**Explanation:** HQL / HiveQL: Hive’s SQL-like language compiled into MapReduce/Tez/Spark jobs.

### Q25  ·  Intermediate
**Question:** Which option best describes **JOIN in Hive**?

- **A.** An automatic mongos $lookup.
- **B.** A TCP handshake.
- **C.** A BIOS interrupt.
- **D.** HQL join compiled to distributed join plans (common/shuffle/map join).

**Answer:** D
**Explanation:** JOIN in Hive: HQL join compiled to distributed join plans (common/shuffle/map join).

### Q26  ·  Intermediate
**Question:** Which option best describes **Metastore**?

- **A.** HDFS block bytes of videos.
- **B.** Spark UI CSS.
- **C.** YARN container RAM.
- **D.** The catalog of Hive tables, schemas and warehouse locations, often in RDBMS.

**Answer:** D
**Explanation:** Metastore: The catalog of Hive tables, schemas and warehouse locations, often in RDBMS.

### Q27  ·  Intermediate
**Question:** Which option best describes **Partition**?

- **A.** A YARN container.
- **B.** A directory-level slice of a table, e.g. by date or department, to skip data.
- **C.** A CSS column.
- **D.** A Mongo shard key always.

**Answer:** B
**Explanation:** Partition: A directory-level slice of a table, e.g. by date or department, to skip data.

### Q28  ·  Intermediate
**Question:** Which option best describes **Pig Latin**?

- **A.** Java bytecode.
- **B.** HDFS fsimage XML.
- **C.** HiveQL only.
- **D.** Pig’s data-flow language: LOAD, FILTER, FOREACH, JOIN, STORE…

**Answer:** D
**Explanation:** Pig Latin: Pig’s data-flow language: LOAD, FILTER, FOREACH, JOIN, STORE…

### Q29  ·  Intermediate
**Question:** Which option best describes **Pig**?

- **A.** A CUDA kernel.
- **B.** A platform for data-flow scripts (Pig Latin) that compile to MapReduce/Tez.
- **C.** A relational metastore.
- **D.** A replica set.

**Answer:** B
**Explanation:** Pig: A platform for data-flow scripts (Pig Latin) that compile to MapReduce/Tez.

### Q30  ·  Intermediate
**Question:** Which option best describes **RCFile / columnar**?

- **A.** A Mongo oplog format.
- **B.** Row-columnar file layouts that read only needed columns.
- **C.** An Ethernet frame.
- **D.** Always worse than CSV for analytics.

**Answer:** B
**Explanation:** RCFile / columnar: Row-columnar file layouts that read only needed columns.

### Q31  ·  Intermediate
**Question:** Which option best describes **Schema-on-read (Hive)**?

- **A.** Hive applies table schema when reading files, not when dumping raw files.
- **B.** Files must be BSON.
- **C.** Hive requires OLTP 3NF before any HDFS put.
- **D.** Metastore stores videos.

**Answer:** A
**Explanation:** Schema-on-read (Hive): Hive applies table schema when reading files, not when dumping raw files.

### Q32  ·  Intermediate
**Question:** Which option best describes **SerDe**?

- **A.** Serializer/Deserializer that maps files (CSV, JSON, ORC…) to columns.
- **B.** A YARN scheduler.
- **C.** A NameNode HA journal.
- **D.** A Spark DAG scheduler.

**Answer:** A
**Explanation:** SerDe: Serializer/Deserializer that maps files (CSV, JSON, ORC…) to columns.

### Q33  ·  Intermediate
**Question:** Which option best describes **Tez**?

- **A.** A Mongo shard router.
- **B.** A DAG execution engine that can run Hive/Pig more efficiently than classic MR.
- **C.** An HDFS checksum.
- **D.** A CSS engine.

**Answer:** B
**Explanation:** Tez: A DAG execution engine that can run Hive/Pig more efficiently than classic MR.

### Q34  ·  Intermediate
**Question:** Which option best describes **UDF**?

- **A.** A rack switch.
- **B.** A writeConcern.
- **C.** A NameNode daemon.
- **D.** User-defined function extending Hive or Pig.

**Answer:** D
**Explanation:** UDF: User-defined function extending Hive or Pig.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **Pig script**?

- **A.** STORE → then LOAD the same relation
- **B.** CREATE INDEX on fsimage
- **C.** Election of Hive primary
- **D.** LOAD → FOREACH/FILTER/JOIN/GROUP → STORE

**Answer:** D
**Explanation:** Correct sequence for Pig script: LOAD → FOREACH/FILTER/JOIN/GROUP → STORE

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **external table create**?

- **A.** DROP HDFS then CREATE
- **B.** Convert to BSON automatically
- **C.** CREATE EXTERNAL TABLE … LOCATION 'hdfs://…' → metastore entry, files untouched
- **D.** Move all files into NameNode

**Answer:** C
**Explanation:** Correct sequence for external table create: CREATE EXTERNAL TABLE … LOCATION 'hdfs://…' → metastore entry, files untouched

### Q37  ·  Intermediate
**Question:** Which statement about **Bucket** is FALSE?

- **A.** In this module, Bucket is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Bucket is that it is not the same as “An HDFS rack”.
- **C.** Bucket is correctly understood as: hash-based files within a partition/table for sampling and joins.
- **D.** Buckets are identical to Mongo replica sets.

**Answer:** D
**Explanation:** The false claim is: Buckets are identical to Mongo replica sets.. Bucket actually means: Hash-based files within a partition/table for sampling and joins.

### Q38  ·  Intermediate
**Question:** Which statement about **External table** is FALSE?

- **A.** A useful way to remember External table is that it is not the same as “Hive always deletes HDFS on DROP”.
- **B.** External tables cannot be queried.
- **C.** In this module, External table is a core idea students must distinguish from nearby terms.
- **D.** External table is correctly understood as: hive stores metadata only; dropping the table does not delete the HDFS files.

**Answer:** B
**Explanation:** The false claim is: External tables cannot be queried.. External table actually means: Hive stores metadata only; dropping the table does not delete the HDFS files.

### Q39  ·  Intermediate
**Question:** Which statement about **Hive** is FALSE?

- **A.** In this module, Hive is a core idea students must distinguish from nearby terms.
- **B.** Hive is correctly understood as: a warehouse system that runs SQL-like HQL over Hadoop data.
- **C.** A useful way to remember Hive is that it is not the same as “A CSS framework”.
- **D.** Hive stores every row inside the NameNode heap.

**Answer:** D
**Explanation:** The false claim is: Hive stores every row inside the NameNode heap.. Hive actually means: A warehouse system that runs SQL-like HQL over Hadoop data.

### Q40  ·  Intermediate
**Question:** Which statement about **JOIN in Hive** is FALSE?

- **A.** JOIN in Hive is correctly understood as: hQL join compiled to distributed join plans (common/shuffle/map join).
- **B.** In this module, JOIN in Hive is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember JOIN in Hive is that it is not the same as “An automatic mongos $lookup”.
- **D.** Hive cannot join two tables.

**Answer:** D
**Explanation:** The false claim is: Hive cannot join two tables.. JOIN in Hive actually means: HQL join compiled to distributed join plans (common/shuffle/map join).

### Q41  ·  Intermediate
**Question:** Which statement about **Metastore** is FALSE?

- **A.** Metastore is correctly understood as: the catalog of Hive tables, schemas and warehouse locations, often in RDBMS.
- **B.** A useful way to remember Metastore is that it is not the same as “HDFS block bytes of videos”.
- **C.** In this module, Metastore is a core idea students must distinguish from nearby terms.
- **D.** Metastore stores all table data files themselves.

**Answer:** D
**Explanation:** The false claim is: Metastore stores all table data files themselves.. Metastore actually means: The catalog of Hive tables, schemas and warehouse locations, often in RDBMS.

### Q42  ·  Intermediate
**Question:** Which statement about **Pig** is FALSE?

- **A.** In this module, Pig is a core idea students must distinguish from nearby terms.
- **B.** Pig is correctly understood as: a platform for data-flow scripts (Pig Latin) that compile to MapReduce/Tez.
- **C.** A useful way to remember Pig is that it is not the same as “A relational metastore”.
- **D.** Pig can only run inside MongoDB.

**Answer:** D
**Explanation:** The false claim is: Pig can only run inside MongoDB.. Pig actually means: A platform for data-flow scripts (Pig Latin) that compile to MapReduce/Tez.

### Q43  ·  Intermediate
**Question:** Which statement about **RCFile / columnar** is FALSE?

- **A.** Columnar formats must scan every CSV byte.
- **B.** A useful way to remember RCFile / columnar is that it is not the same as “Always worse than CSV for analytics”.
- **C.** In this module, RCFile / columnar is a core idea students must distinguish from nearby terms.
- **D.** RCFile / columnar is correctly understood as: row-columnar file layouts that read only needed columns.

**Answer:** A
**Explanation:** The false claim is: Columnar formats must scan every CSV byte.. RCFile / columnar actually means: Row-columnar file layouts that read only needed columns.

### Q44  ·  Intermediate
**Question:** Which statement about **Tez** is FALSE?

- **A.** A useful way to remember Tez is that it is not the same as “A Mongo shard router”.
- **B.** Tez stores the metastore.
- **C.** In this module, Tez is a core idea students must distinguish from nearby terms.
- **D.** Tez is correctly understood as: a DAG execution engine that can run Hive/Pig more efficiently than classic MR.

**Answer:** B
**Explanation:** The false claim is: Tez stores the metastore.. Tez actually means: A DAG execution engine that can run Hive/Pig more efficiently than classic MR.

### Q45  ·  Intermediate
**Question:** Which statement about **Tuple / bag / map** is FALSE?

- **A.** In this module, Tuple / bag / map is a core idea students must distinguish from nearby terms.
- **B.** Tuple / bag / map is correctly understood as: pig’s nested data model: tuple row, bag collection, map key-value.
- **C.** A useful way to remember Tuple / bag / map is that it is not the same as “HDFS block types”.
- **D.** Pig cannot nest bags.

**Answer:** D
**Explanation:** The false claim is: Pig cannot nest bags.. Tuple / bag / map actually means: Pig’s nested data model: tuple row, bag collection, map key-value.

### Q46  ·  Difficult
**Question:** A 120 GB table, 128 MB blocks. Order of HDFS blocks?

- **A.** 120
- **B.** 128
- **C.** 1
- **D.** About 960

**Answer:** D
**Explanation:** 120×1024/128 = 960.

### Q47  ·  Difficult
**Question:** A skewed join in Hive is problematic when:

- **A.** SerDe is ORC
- **B.** All keys are unique and tiny
- **C.** One key has a huge fraction of rows, overloading some reducers
- **D.** The table is empty

**Answer:** C
**Explanation:** Skew creates hot reducers.

### Q48  ·  Difficult
**Question:** A table partitioned by 365 days, query one day. If data is uniform, Hive can skip about what fraction?

- **A.** None — it must scan BSON
- **B.** ≈364/365 of files
- **C.** 50% always
- **D.** 0%

**Answer:** B
**Explanation:** Partition pruning reads one day.

### Q49  ·  Difficult
**Question:** Analysts need a procedural clean: load, filter null USNs, join lookup, store ORC. Natural tool?

- **A.** RFID firmware
- **B.** BIOS
- **C.** NameNode UI
- **D.** Pig Latin data-flow (or Spark); Hive for the warehouse after

**Answer:** D
**Explanation:** Pig shines at ETL flows.

### Q50  ·  Difficult
**Question:** Bucketed table with 8 buckets, query TABLESAMPLE (2 BUCKETS) aims to read about:

- **A.** 100%
- **B.** 8%
- **C.** 25% of the table files
- **D.** 2 rows

**Answer:** C
**Explanation:** 2/8 = 25%.

### Q51  ·  Difficult
**Question:** DROP TABLE must not delete raw dumps used by other tools. Use:

- **A.** MANAGED table with default warehouse delete
- **B.** EXTERNAL table
- **C.** A Mongo dropDatabase
- **D.** YARN drain

**Answer:** B
**Explanation:** External keeps files.

### Q52  ·  Difficult
**Question:** Hive on Spark/Tez vs classic MR mainly improves:

- **A.** Mongo elections
- **B.** NameNode HA
- **C.** DAG execution and fewer barriers/HDFS hops
- **D.** OLTP latency to microseconds always

**Answer:** C
**Explanation:** Engine, not SQL dialect, drives much of the speed.

### Q53  ·  Difficult
**Question:** Hive on Tez often reduces latency vs classic MR because DAGs avoid:

- **A.** Using DataNodes
- **B.** Using schema
- **C.** Using partitions
- **D.** Many extra HDFS materialisations between MR jobs

**Answer:** D
**Explanation:** Tez pipelines DAGs.

### Q54  ·  Difficult
**Question:** Hive query takes 40 s; users expected 40 ms like MySQL. Explain:

- **A.** Tez forbids SELECT
- **B.** Metastore is always broken
- **C.** HDFS cannot store tables
- **D.** Hive is batch SQL on Hadoop, not OLTP

**Answer:** D
**Explanation:** Latency class differs.

### Q55  ·  Difficult
**Question:** Metastore Derby on one laptop is risky in production because:

- **A.** Derby stores all HDFS blocks
- **B.** It does not scale/share safely for multi-user clusters
- **C.** HiveQL cannot run
- **D.** YARN cannot start

**Answer:** B
**Explanation:** Use shared RDBMS metastore.

### Q56  ·  Difficult
**Question:** ORC reads 4 of 40 equally sized columns. Ideal I/O vs full CSV row scan is about:

- **A.** 4 bytes
- **B.** ≈10% of column data (plus overhead)
- **C.** 40 TB
- **D.** 100% always

**Answer:** B
**Explanation:** Columnar reads needed columns.

### Q57  ·  Difficult
**Question:** Pig JOIN of 1e8 × 1e8 without filter is heavy because:

- **A.** HDFS forbids joins
- **B.** Pig cannot join
- **C.** Joins run on the NameNode CPU only
- **D.** It can explode intermediate shuffle volume

**Answer:** D
**Explanation:** Unfiltered huge joins shuffle massively.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **CSV** and **ORC/Parquet**?

- **A.** Columnar ORC/Parquet skip unread columns and compress better than CSV.
- **B.** ORC cannot be split.
- **C.** Parquet stores HDFS fsimage.
- **D.** CSV is always smaller than ORC.

**Answer:** A
**Explanation:** Columnar ORC/Parquet skip unread columns and compress better than CSV.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **LOAD in Pig** and **CREATE TABLE in Hive**?

- **A.** Pig CREATE is permanent warehouse DDL only.
- **B.** Pig LOAD binds a file to a relation in a script; Hive CREATE registers lasting metadata.
- **C.** They both format NameNodes.
- **D.** Hive LOAD is the only way Pig works.

**Answer:** B
**Explanation:** Pig LOAD binds a file to a relation in a script; Hive CREATE registers lasting metadata.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **managed** and **external table**?

- **A.** Managed tables cannot be partitioned.
- **B.** DROP managed can delete data; DROP external keeps files.
- **C.** They differ only in SerDe name.
- **D.** External DROP always wipes HDFS.

**Answer:** B
**Explanation:** DROP managed can delete data; DROP external keeps files.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **metastore** and **HDFS data**?

- **A.** HDFS holds CREATE TABLE text only.
- **B.** Metastore is schema catalog; HDFS holds the files.
- **C.** Metastore holds all row bytes.
- **D.** They are the same Derby file.

**Answer:** B
**Explanation:** Metastore is schema catalog; HDFS holds the files.

### Q62  ·  Difficult
**Question:** Which statement about **HQL / HiveQL** is FALSE?

- **A.** HiveQL cannot SELECT.
- **B.** HQL / HiveQL is correctly understood as: hive’s SQL-like language compiled into MapReduce/Tez/Spark jobs.
- **C.** A useful way to remember HQL / HiveQL is that it is not the same as “Pig Latin only”.
- **D.** In this module, HQL / HiveQL is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: HiveQL cannot SELECT.. HQL / HiveQL actually means: Hive’s SQL-like language compiled into MapReduce/Tez/Spark jobs.

### Q63  ·  Difficult
**Question:** Which statement about **Managed table** is FALSE?

- **A.** A useful way to remember Managed table is that it is not the same as “A table Hive must never drop”.
- **B.** In this module, Managed table is a core idea students must distinguish from nearby terms.
- **C.** Managed table is correctly understood as: hive controls the data lifecycle; dropping the table can delete HDFS data.
- **D.** Managed tables never touch HDFS.

**Answer:** D
**Explanation:** The false claim is: Managed tables never touch HDFS.. Managed table actually means: Hive controls the data lifecycle; dropping the table can delete HDFS data.

### Q64  ·  Difficult
**Question:** Which statement about **ORC/Parquet** is FALSE?

- **A.** In this module, ORC/Parquet is a core idea students must distinguish from nearby terms.
- **B.** ORC stores documents in BSON.
- **C.** ORC/Parquet is correctly understood as: columnar, compressed, splittable warehouse formats used with Hive.
- **D.** A useful way to remember ORC/Parquet is that it is not the same as “NameNode fsimage formats”.

**Answer:** B
**Explanation:** The false claim is: ORC stores documents in BSON.. ORC/Parquet actually means: Columnar, compressed, splittable warehouse formats used with Hive.

### Q65  ·  Difficult
**Question:** Which statement about **Partition** is FALSE?

- **A.** A useful way to remember Partition is that it is not the same as “A Mongo shard key always”.
- **B.** Partition is correctly understood as: a directory-level slice of a table, e.g. by date or department, to skip data.
- **C.** Partitions are only in-memory JVM flags.
- **D.** In this module, Partition is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Partitions are only in-memory JVM flags.. Partition actually means: A directory-level slice of a table, e.g. by date or department, to skip data.

### Q66  ·  Difficult
**Question:** Which statement about **Pig Latin** is FALSE?

- **A.** Pig Latin is a CSS dialect.
- **B.** In this module, Pig Latin is a core idea students must distinguish from nearby terms.
- **C.** Pig Latin is correctly understood as: pig’s data-flow language: LOAD, FILTER, FOREACH, JOIN, STORE…
- **D.** A useful way to remember Pig Latin is that it is not the same as “HiveQL only”.

**Answer:** A
**Explanation:** The false claim is: Pig Latin is a CSS dialect.. Pig Latin actually means: Pig’s data-flow language: LOAD, FILTER, FOREACH, JOIN, STORE…

### Q67  ·  Difficult
**Question:** Which statement about **Schema-on-read (Hive)** is FALSE?

- **A.** In this module, Schema-on-read (Hive) is a core idea students must distinguish from nearby terms.
- **B.** Hive cannot read CSV.
- **C.** A useful way to remember Schema-on-read (Hive) is that it is not the same as “Hive requires OLTP 3NF before any HDFS put”.
- **D.** Schema-on-read (Hive) is correctly understood as: hive applies table schema when reading files, not when dumping raw files.

**Answer:** B
**Explanation:** The false claim is: Hive cannot read CSV.. Schema-on-read (Hive) actually means: Hive applies table schema when reading files, not when dumping raw files.

### Q68  ·  Difficult
**Question:** Which statement about **SerDe** is FALSE?

- **A.** SerDe is a Pig join algorithm.
- **B.** A useful way to remember SerDe is that it is not the same as “A YARN scheduler”.
- **C.** SerDe is correctly understood as: serializer/Deserializer that maps files (CSV, JSON, ORC…) to columns.
- **D.** In this module, SerDe is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: SerDe is a Pig join algorithm.. SerDe actually means: Serializer/Deserializer that maps files (CSV, JSON, ORC…) to columns.

### Q69  ·  Difficult
**Question:** Which statement about **UDF** is FALSE?

- **A.** In this module, UDF is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember UDF is that it is not the same as “A NameNode daemon”.
- **C.** UDFs are illegal in Hive.
- **D.** UDF is correctly understood as: user-defined function extending Hive or Pig.

**Answer:** C
**Explanation:** The false claim is: UDFs are illegal in Hive.. UDF actually means: User-defined function extending Hive or Pig.

### Q70  ·  Difficult
**Question:** Which statement about **Warehouse directory** is FALSE?

- **A.** Warehouse directory is correctly understood as: hDFS location (e.g. /user/hive/warehouse) for managed table data.
- **B.** Managed data never lives on HDFS.
- **C.** A useful way to remember Warehouse directory is that it is not the same as “The NameNode RAM disk for BSON”.
- **D.** In this module, Warehouse directory is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Managed data never lives on HDFS.. Warehouse directory actually means: HDFS location (e.g. /user/hive/warehouse) for managed table data.

---

## Quick answer key

Q01–A | Q02–C | Q03–A | Q04–B | Q05–A | Q06–D | Q07–B | Q08–B | Q09–B | Q10–C | Q11–D | Q12–C | Q13–C | Q14–B | Q15–B | Q16–C | Q17–C | Q18–A | Q19–A | Q20–C | Q21–C | Q22–D | Q23–A | Q24–C | Q25–D | Q26–D | Q27–B | Q28–D | Q29–B | Q30–B | Q31–A | Q32–A | Q33–B | Q34–D | Q35–D | Q36–C | Q37–D | Q38–B | Q39–D | Q40–D | Q41–D | Q42–D | Q43–A | Q44–B | Q45–D | Q46–D | Q47–C | Q48–B | Q49–D | Q50–C | Q51–B | Q52–C | Q53–D | Q54–D | Q55–B | Q56–B | Q57–D | Q58–A | Q59–B | Q60–B | Q61–B | Q62–A | Q63–D | Q64–B | Q65–C | Q66–A | Q67–B | Q68–A | Q69–C | Q70–B
