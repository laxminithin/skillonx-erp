# Quiz — Big Data Analytics — Module 5: Spark, Text and Web Analytics

**Subject:** Big Data Analytics  
**Module:** Module 5 — Spark, Text and Web Analytics  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Hyperlinks in a web graph are:

- **A.** YARN containers
- **B.** Hive partitions
- **C.** Directed edges
- **D.** HDFS blocks

**Answer:** C
**Explanation:** Structure mining.

### Q02  ·  Easy
**Question:** RDD stands for:

- **A.** Resilient Distributed Dataset
- **B.** Remote DataNode Daemon
- **C.** Rapid Derby Dump
- **D.** Rack Disk Duplex

**Answer:** A
**Explanation:** Core Spark abstraction.

### Q03  ·  Easy
**Question:** Tokenization is:

- **A.** Electing a Mongo primary
- **B.** Splitting HDFS racks
- **C.** Splitting text into terms
- **D.** A Tez UI tab

**Answer:** C
**Explanation:** NLP preprocess.

### Q04  ·  Easy
**Question:** Which Spark operation is an action?

- **A.** count()
- **B.** flatMap()
- **C.** filter()
- **D.** map()

**Answer:** A
**Explanation:** count triggers a job.

### Q05  ·  Easy
**Question:** Which option best describes **Apache Spark**?

- **A.** A unified engine for in-memory parallel data processing (batch, SQL, streaming, ML).
- **B.** A Mongo arbiter.
- **C.** A CSS runtime.
- **D.** An HDFS NameNode.

**Answer:** A
**Explanation:** Apache Spark: A unified engine for in-memory parallel data processing (batch, SQL, streaming, ML).

### Q06  ·  Easy
**Question:** Which option best describes **Shuffle**?

- **A.** A local map-only filter.
- **B.** Redistribution of data by key across the cluster (wide dependency).
- **C.** ORC footer read.
- **D.** NameNode checkpoint.

**Answer:** B
**Explanation:** Shuffle: Redistribution of data by key across the cluster (wide dependency).

### Q07  ·  Easy
**Question:** Which option best describes **Spark SQL**?

- **A.** Pig Latin parser.
- **B.** SQL/DataFrame API on Spark with a catalyst optimizer.
- **C.** MQL in mongod.
- **D.** Hive metastore replacement that deletes HDFS.

**Answer:** B
**Explanation:** Spark SQL: SQL/DataFrame API on Spark with a catalyst optimizer.

### Q08  ·  Easy
**Question:** Which option best describes **Text mining**?

- **A.** Compiling Pig.
- **B.** Extracting structure and insight from unstructured text.
- **C.** Formatting HDFS.
- **D.** Painting racks.

**Answer:** B
**Explanation:** Text mining: Extracting structure and insight from unstructured text.

### Q09  ·  Easy
**Question:** Which option best describes **Transformation**?

- **A.** A writeConcern.
- **B.** A NameNode format.
- **C.** An immediate driver println only.
- **D.** A lazy RDD/Dataset operation that builds a new plan (map, filter, join).

**Answer:** D
**Explanation:** Transformation: A lazy RDD/Dataset operation that builds a new plan (map, filter, join).

### Q10  ·  Easy
**Question:** Which option best describes **Web mining**?

- **A.** CSS linting only.
- **B.** Discovering patterns from web content, structure or usage.
- **C.** Formatting BIOS.
- **D.** A NameNode HA mode.

**Answer:** B
**Explanation:** Web mining: Discovering patterns from web content, structure or usage.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **Spark job**?

- **A.** Action happens before any DAG
- **B.** Executors format NameNode first
- **C.** Driver builds DAG → stages at shuffles → tasks on executors → results/action
- **D.** mongos assigns Spark partitions

**Answer:** C
**Explanation:** Correct sequence for Spark job: Driver builds DAG → stages at shuffles → tasks on executors → results/action

### Q12  ·  Easy
**Question:** Which sequence correctly describes **text mining pipeline**?

- **A.** Format HDFS → skip tokens
- **B.** PageRank the letters of the alphabet
- **C.** YARN election of terms
- **D.** Collect corpus → clean/tokenize → weight (TF-IDF) → model/cluster/classify → evaluate

**Answer:** D
**Explanation:** Correct sequence for text mining pipeline: Collect corpus → clean/tokenize → weight (TF-IDF) → model/cluster/classify → evaluate

### Q13  ·  Intermediate
**Question:** A wide dependency requires:

- **A.** Only a local map
- **B.** A CSS rebuild
- **C.** Shuffle
- **D.** Deleting lineage

**Answer:** C
**Explanation:** join/groupBy/reduceByKey.

### Q14  ·  Intermediate
**Question:** Build a campus search engine: crawl pages, parse text, rank by links. Spark’s role?

- **A.** Replace Ethernet
- **B.** Replace DNS
- **C.** Distributed parse/index/PageRank; not a crawler replacement by itself
- **D.** Store fsimage

**Answer:** C
**Explanation:** Spark processes the crawl.

### Q15  ·  Intermediate
**Question:** IDF is high when a term is:

- **A.** In every document
- **B.** A stopword like ‘the’
- **C.** Rare across documents
- **D.** Empty string

**Answer:** C
**Explanation:** Discriminative terms.

### Q16  ·  Intermediate
**Question:** Lineage helps Spark because:

- **A.** It is a SerDe
- **B.** Lost partitions can be recomputed from parents
- **C.** It replaces HDFS replication always
- **D.** It deletes DAGs

**Answer:** B
**Explanation:** Fault recovery.

### Q17  ·  Intermediate
**Question:** PageRank on the college intranet graph is which web-mining type?

- **A.** Only usage log mining
- **B.** Structure mining
- **C.** Hive SerDe
- **D.** RAID scrubbing

**Answer:** B
**Explanation:** Hyperlink structure.

### Q18  ·  Intermediate
**Question:** Spark job on YARN: who runs tasks?

- **A.** Only the NameNode
- **B.** mongos
- **C.** Executors in YARN containers
- **D.** Pig grunt

**Answer:** C
**Explanation:** Executor tasks.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **PageRank** and **in-degree**?

- **A.** In-degree always equals PageRank.
- **B.** PageRank is word frequency.
- **C.** PageRank weights links by source importance, not raw count of in-links.
- **D.** PageRank ignores dangling nodes always without any fix.

**Answer:** C
**Explanation:** PageRank weights links by source importance, not raw count of in-links.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **Spark** and **MapReduce**?

- **A.** Spark can cache in memory and pipeline DAGs; MR writes shuffle to disk between jobs.
- **B.** Spark cannot run on YARN.
- **C.** MR is always faster for iterative ML.
- **D.** They are the same engine.

**Answer:** A
**Explanation:** Spark can cache in memory and pipeline DAGs; MR writes shuffle to disk between jobs.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **content mining** and **structure mining**?

- **A.** Content is only server logs.
- **B.** They are identical.
- **C.** Structure ignores links.
- **D.** Content uses page text; structure uses hyperlink graph (e.g. PageRank).

**Answer:** D
**Explanation:** Content uses page text; structure uses hyperlink graph (e.g. PageRank).

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **usage mining** and **content mining**?

- **A.** Content is cookies only.
- **B.** Usage is hyperlink PageRank only.
- **C.** Usage mining uses logs/clicks; content mining uses page text.
- **D.** They both format HDFS.

**Answer:** C
**Explanation:** Usage mining uses logs/clicks; content mining uses page text.

### Q23  ·  Intermediate
**Question:** Which option best describes **Action**?

- **A.** An operation that triggers computation (count, collect, save).
- **B.** A lazy map.
- **C.** A parse-time no-op.
- **D.** A CSS hover.

**Answer:** A
**Explanation:** Action: An operation that triggers computation (count, collect, save).

### Q24  ·  Intermediate
**Question:** Which option best describes **DAG scheduler**?

- **A.** mongos router.
- **B.** Spark component that splits the job into stages at shuffle boundaries.
- **C.** Hive metastore.
- **D.** HDFS block placer.

**Answer:** B
**Explanation:** DAG scheduler: Spark component that splits the job into stages at shuffle boundaries.

### Q25  ·  Intermediate
**Question:** Which option best describes **DataFrame**?

- **A.** An untyped Hadoop split only.
- **B.** A CSS grid.
- **C.** A BSON document on disk in mongod always.
- **D.** Distributed table with schema and optimizer, built on Spark’s engine.

**Answer:** D
**Explanation:** DataFrame: Distributed table with schema and optimizer, built on Spark’s engine.

### Q26  ·  Intermediate
**Question:** Which option best describes **Driver**?

- **A.** A replica secondary.
- **B.** The process that hosts SparkContext, builds DAGs and schedules.
- **C.** A CSS minifier.
- **D.** A DataNode volume scanner.

**Answer:** B
**Explanation:** Driver: The process that hosts SparkContext, builds DAGs and schedules.

### Q27  ·  Intermediate
**Question:** Which option best describes **Executor**?

- **A.** A JVM on a worker that runs Spark tasks and caches data.
- **B.** The HDFS NameNode process.
- **C.** A Pig grunt.
- **D.** A BIOS.

**Answer:** A
**Explanation:** Executor: A JVM on a worker that runs Spark tasks and caches data.

### Q28  ·  Intermediate
**Question:** Which option best describes **Lineage**?

- **A.** A backup USB.
- **B.** A Hive SerDe.
- **C.** An HDFS rack name.
- **D.** The graph of transformations used to recompute a lost RDD partition.

**Answer:** D
**Explanation:** Lineage: The graph of transformations used to recompute a lost RDD partition.

### Q29  ·  Intermediate
**Question:** Which option best describes **Narrow vs wide dependency**?

- **A.** Narrow: each child partition needs one parent; wide: needs many (shuffle).
- **B.** Narrow always shuffles.
- **C.** Wide means no network.
- **D.** They are Hive SerDes.

**Answer:** A
**Explanation:** Narrow vs wide dependency: Narrow: each child partition needs one parent; wide: needs many (shuffle).

### Q30  ·  Intermediate
**Question:** Which option best describes **PageRank**?

- **A.** HTTP status 200 count only.
- **B.** File size on disk.
- **C.** Alphabetical URL sort.
- **D.** A link-analysis score: important pages are linked from other important pages.

**Answer:** D
**Explanation:** PageRank: A link-analysis score: important pages are linked from other important pages.

### Q31  ·  Intermediate
**Question:** Which option best describes **RDD**?

- **A.** A mutable Hadoop fsimage.
- **B.** A YARN UI widget.
- **C.** Immutable partitioned collection with lineage for fault recovery.
- **D.** A Mongo oplog document.

**Answer:** C
**Explanation:** RDD: Immutable partitioned collection with lineage for fault recovery.

### Q32  ·  Intermediate
**Question:** Which option best describes **TF-IDF**?

- **A.** A Mongo writeConcern.
- **B.** A Spark executor core count.
- **C.** A Hadoop replication factor.
- **D.** Term weighting: frequent in a document, rare in the corpus.

**Answer:** D
**Explanation:** TF-IDF: Term weighting: frequent in a document, rare in the corpus.

### Q33  ·  Intermediate
**Question:** Which option best describes **Tokenization**?

- **A.** IP fragmentation.
- **B.** Splitting text into terms/tokens.
- **C.** HDFS block splitting only.
- **D.** YARN container split.

**Answer:** B
**Explanation:** Tokenization: Splitting text into terms/tokens.

### Q34  ·  Intermediate
**Question:** Which option best describes **Web graph**?

- **A.** HDFS rack topology only.
- **B.** Pages as nodes and hyperlinks as directed edges.
- **C.** A Mongo replica set.
- **D.** A YARN queue graph.

**Answer:** B
**Explanation:** Web graph: Pages as nodes and hyperlinks as directed edges.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **PageRank iteration**?

- **A.** Sort URLs alphabetically once
- **B.** Count words only
- **C.** Delete dangling nodes and stop
- **D.** Each page sends rank/out-degree along outlinks → sum incoming → apply damping/teleport → repeat

**Answer:** D
**Explanation:** Correct sequence for PageRank iteration: Each page sends rank/out-degree along outlinks → sum incoming → apply damping/teleport → repeat

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **web search scoring (simplified)**?

- **A.** Sort by file size only
- **B.** Hive DROP INDEX
- **C.** Parse/index tokens → retrieve candidates → rank (text + PageRank/usage) → return SERP
- **D.** Return random HDFS blocks

**Answer:** C
**Explanation:** Correct sequence for web search scoring (simplified): Parse/index tokens → retrieve candidates → rank (text + PageRank/usage) → return SERP

### Q37  ·  Intermediate
**Question:** Which statement about **Action** is FALSE?

- **A.** A useful way to remember Action is that it is not the same as “A lazy map”.
- **B.** Actions never run tasks.
- **C.** In this module, Action is a core idea students must distinguish from nearby terms.
- **D.** Action is correctly understood as: an operation that triggers computation (count, collect, save).

**Answer:** B
**Explanation:** The false claim is: Actions never run tasks.. Action actually means: An operation that triggers computation (count, collect, save).

### Q38  ·  Intermediate
**Question:** Which statement about **Apache Spark** is FALSE?

- **A.** In this module, Apache Spark is a core idea students must distinguish from nearby terms.
- **B.** Apache Spark is correctly understood as: a unified engine for in-memory parallel data processing (batch, SQL, streaming, ML).
- **C.** A useful way to remember Apache Spark is that it is not the same as “An HDFS NameNode”.
- **D.** Spark can only replace Ethernet.

**Answer:** D
**Explanation:** The false claim is: Spark can only replace Ethernet.. Apache Spark actually means: A unified engine for in-memory parallel data processing (batch, SQL, streaming, ML).

### Q39  ·  Intermediate
**Question:** Which statement about **DataFrame** is FALSE?

- **A.** DataFrame is correctly understood as: distributed table with schema and optimizer, built on Spark’s engine.
- **B.** In this module, DataFrame is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember DataFrame is that it is not the same as “An untyped Hadoop split only”.
- **D.** DataFrames cannot be cached.

**Answer:** D
**Explanation:** The false claim is: DataFrames cannot be cached.. DataFrame actually means: Distributed table with schema and optimizer, built on Spark’s engine.

### Q40  ·  Intermediate
**Question:** Which statement about **Driver** is FALSE?

- **A.** The driver stores all HDFS blocks.
- **B.** A useful way to remember Driver is that it is not the same as “A DataNode volume scanner”.
- **C.** In this module, Driver is a core idea students must distinguish from nearby terms.
- **D.** Driver is correctly understood as: the process that hosts SparkContext, builds DAGs and schedules.

**Answer:** A
**Explanation:** The false claim is: The driver stores all HDFS blocks.. Driver actually means: The process that hosts SparkContext, builds DAGs and schedules.

### Q41  ·  Intermediate
**Question:** Which statement about **Lineage** is FALSE?

- **A.** Lineage is correctly understood as: the graph of transformations used to recompute a lost RDD partition.
- **B.** A useful way to remember Lineage is that it is not the same as “A backup USB”.
- **C.** In this module, Lineage is a core idea students must distinguish from nearby terms.
- **D.** Lineage means Spark never recomputes.

**Answer:** D
**Explanation:** The false claim is: Lineage means Spark never recomputes.. Lineage actually means: The graph of transformations used to recompute a lost RDD partition.

### Q42  ·  Intermediate
**Question:** Which statement about **Shuffle** is FALSE?

- **A.** In this module, Shuffle is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Shuffle is that it is not the same as “A local map-only filter”.
- **C.** Shuffle is correctly understood as: redistribution of data by key across the cluster (wide dependency).
- **D.** Shuffle is always avoided by collect().

**Answer:** D
**Explanation:** The false claim is: Shuffle is always avoided by collect().. Shuffle actually means: Redistribution of data by key across the cluster (wide dependency).

### Q43  ·  Intermediate
**Question:** Which statement about **Tokenization** is FALSE?

- **A.** In this module, Tokenization is a core idea students must distinguish from nearby terms.
- **B.** Tokenization is correctly understood as: splitting text into terms/tokens.
- **C.** A useful way to remember Tokenization is that it is not the same as “HDFS block splitting only”.
- **D.** Tokenization deletes the corpus.

**Answer:** D
**Explanation:** The false claim is: Tokenization deletes the corpus.. Tokenization actually means: Splitting text into terms/tokens.

### Q44  ·  Intermediate
**Question:** Which statement about **Web graph** is FALSE?

- **A.** A useful way to remember Web graph is that it is not the same as “HDFS rack topology only”.
- **B.** Web graphs have no edges.
- **C.** In this module, Web graph is a core idea students must distinguish from nearby terms.
- **D.** Web graph is correctly understood as: pages as nodes and hyperlinks as directed edges.

**Answer:** B
**Explanation:** The false claim is: Web graphs have no edges.. Web graph actually means: Pages as nodes and hyperlinks as directed edges.

### Q45  ·  Intermediate
**Question:** Which statement about **Web mining** is FALSE?

- **A.** In this module, Web mining is a core idea students must distinguish from nearby terms.
- **B.** Web mining is correctly understood as: discovering patterns from web content, structure or usage.
- **C.** A useful way to remember Web mining is that it is not the same as “Formatting BIOS”.
- **D.** Web mining is illegal on graphs.

**Answer:** D
**Explanation:** The false claim is: Web mining is illegal on graphs.. Web mining actually means: Discovering patterns from web content, structure or usage.

### Q46  ·  Intermediate
**Question:** Why is Spark often faster than MR for iterative algorithms?

- **A.** In-memory caching and DAGs without a full MR job per iteration
- **B.** Spark does not use CPUs
- **C.** MR cannot add numbers
- **D.** Spark stores data in the NameNode RAM only

**Answer:** A
**Explanation:** Iterative ML/PageRank.

### Q47  ·  Intermediate
**Question:** filter() then map() without shuffle is:

- **A.** An action
- **B.** Two shuffles
- **C.** Narrow transformations, same stage
- **D.** A Hive DROP

**Answer:** C
**Explanation:** Pipelined stage.

### Q48  ·  Difficult
**Question:** A corpus of 10,000 docs, term in 100 docs. IDF ~ log(N/df) is log of:

- **A.** 1
- **B.** 100
- **C.** 0
- **D.** 10,000

**Answer:** B
**Explanation:** N/df = 10000/100 = 100.

### Q49  ·  Difficult
**Question:** A dangling page (no outlinks) in PageRank must be handled because:

- **A.** IDF becomes negative
- **B.** HTTP forbids dangling pages
- **C.** Spark cannot store graphs
- **D.** Its mass would otherwise vanish from the graph

**Answer:** D
**Explanation:** Redistribute dangling mass.

### Q50  ·  Difficult
**Question:** Iterative PageRank 20 iterations without cache of the graph:

- **A.** Deletes links
- **B.** Always uses zero CPU
- **C.** May re-read/recompute the graph each iteration (slow)
- **D.** Is impossible

**Answer:** C
**Explanation:** Cache/persist the static graph.

### Q51  ·  Difficult
**Question:** LMS click logs to find typical video drop-off is:

- **A.** ORC footer
- **B.** NameNode HA
- **C.** PageRank only
- **D.** Web usage mining

**Answer:** D
**Explanation:** Usage/logs.

### Q52  ·  Difficult
**Question:** PageRank with d=0.85: PR(p) includes:

- **A.** HDFS replication of p
- **B.** Only word count of p
- **C.** (1-d)/N + d × sum of PR(q)/out(q) over in-links q
- **D.** Only HTTP 404 rate

**Answer:** C
**Explanation:** Classic formula.

### Q53  ·  Difficult
**Question:** PageRank with damping 0.85: the (1-d) teleport share is:

- **A.** 3.00
- **B.** 0.15
- **C.** 1.00
- **D.** 0.85

**Answer:** B
**Explanation:** 1−0.85=0.15.

### Q54  ·  Difficult
**Question:** RDD of 128 partitions on 8 executors (uniform) → partitions per executor about:

- **A.** 128
- **B.** 8
- **C.** 1
- **D.** 16

**Answer:** D
**Explanation:** 128/8=16.

### Q55  ·  Difficult
**Question:** TF-IDF would rank the word ‘the’ low because:

- **A.** TF is always zero
- **B.** High document frequency → low IDF
- **C.** Spark deletes stopwords in HDFS
- **D.** PageRank equals TF

**Answer:** B
**Explanation:** Common terms get small IDF.

### Q56  ·  Difficult
**Question:** Two-stage word count: mapToPair + reduceByKey. The shuffle happens at:

- **A.** mapToPair only (narrow)
- **B.** textFile parse on driver
- **C.** Spark UI click
- **D.** reduceByKey (wide)

**Answer:** D
**Explanation:** reduceByKey is wide.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **RDD** and **DataFrame**?

- **A.** RDDs have SQL optimizer always.
- **B.** RDDs are low-level partitions; DataFrames add schema and catalyst.
- **C.** DataFrames cannot spill to disk.
- **D.** They cannot share executors.

**Answer:** B
**Explanation:** RDDs are low-level partitions; DataFrames add schema and catalyst.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **TF** and **IDF**?

- **A.** TF is frequency in a document; IDF down-weights common corpus terms.
- **B.** TF is log of corpus size only.
- **C.** They are replication factors.
- **D.** IDF is raw count in one document.

**Answer:** A
**Explanation:** TF is frequency in a document; IDF down-weights common corpus terms.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **cache/persist** and **checkpoint**?

- **A.** Checkpoint is a CSS file.
- **B.** Cache keeps partitions in memory/disk for reuse; checkpoint truncates lineage to stable storage.
- **C.** They are mongos options.
- **D.** Cache deletes HDFS.

**Answer:** B
**Explanation:** Cache keeps partitions in memory/disk for reuse; checkpoint truncates lineage to stable storage.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **transformation** and **action**?

- **A.** count is lazy.
- **B.** Transformations are lazy; actions trigger jobs.
- **C.** Both never execute.
- **D.** map is an action.

**Answer:** B
**Explanation:** Transformations are lazy; actions trigger jobs.

### Q61  ·  Difficult
**Question:** Which statement about **DAG scheduler** is FALSE?

- **A.** A useful way to remember DAG scheduler is that it is not the same as “HDFS block placer”.
- **B.** DAG scheduler is correctly understood as: spark component that splits the job into stages at shuffle boundaries.
- **C.** The DAG scheduler stores BSON.
- **D.** In this module, DAG scheduler is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: The DAG scheduler stores BSON.. DAG scheduler actually means: Spark component that splits the job into stages at shuffle boundaries.

### Q62  ·  Difficult
**Question:** Which statement about **Executor** is FALSE?

- **A.** Executors live only on the driver laptop GPU.
- **B.** A useful way to remember Executor is that it is not the same as “The HDFS NameNode process”.
- **C.** Executor is correctly understood as: a JVM on a worker that runs Spark tasks and caches data.
- **D.** In this module, Executor is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Executors live only on the driver laptop GPU.. Executor actually means: A JVM on a worker that runs Spark tasks and caches data.

### Q63  ·  Difficult
**Question:** Which statement about **Narrow vs wide dependency** is FALSE?

- **A.** In this module, Narrow vs wide dependency is a core idea students must distinguish from nearby terms.
- **B.** map is a wide dependency.
- **C.** A useful way to remember Narrow vs wide dependency is that it is not the same as “Wide means no network”.
- **D.** Narrow vs wide dependency is correctly understood as: narrow: each child partition needs one parent; wide: needs many (shuffle).

**Answer:** B
**Explanation:** The false claim is: map is a wide dependency.. Narrow vs wide dependency actually means: Narrow: each child partition needs one parent; wide: needs many (shuffle).

### Q64  ·  Difficult
**Question:** Which statement about **PageRank** is FALSE?

- **A.** In this module, PageRank is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember PageRank is that it is not the same as “Alphabetical URL sort”.
- **C.** PageRank ignores the graph and uses only word count.
- **D.** PageRank is correctly understood as: a link-analysis score: important pages are linked from other important pages.

**Answer:** C
**Explanation:** The false claim is: PageRank ignores the graph and uses only word count.. PageRank actually means: A link-analysis score: important pages are linked from other important pages.

### Q65  ·  Difficult
**Question:** Which statement about **RDD** is FALSE?

- **A.** RDDs are stored only on the NameNode.
- **B.** RDD is correctly understood as: immutable partitioned collection with lineage for fault recovery.
- **C.** A useful way to remember RDD is that it is not the same as “A mutable Hadoop fsimage”.
- **D.** In this module, RDD is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: RDDs are stored only on the NameNode.. RDD actually means: Immutable partitioned collection with lineage for fault recovery.

### Q66  ·  Difficult
**Question:** Which statement about **Spark SQL** is FALSE?

- **A.** Spark SQL is correctly understood as: sQL/DataFrame API on Spark with a catalyst optimizer.
- **B.** Spark SQL cannot read Parquet.
- **C.** A useful way to remember Spark SQL is that it is not the same as “Hive metastore replacement that deletes HDFS”.
- **D.** In this module, Spark SQL is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Spark SQL cannot read Parquet.. Spark SQL actually means: SQL/DataFrame API on Spark with a catalyst optimizer.

### Q67  ·  Difficult
**Question:** Which statement about **TF-IDF** is FALSE?

- **A.** TF-IDF is a network protocol.
- **B.** In this module, TF-IDF is a core idea students must distinguish from nearby terms.
- **C.** TF-IDF is correctly understood as: term weighting: frequent in a document, rare in the corpus.
- **D.** A useful way to remember TF-IDF is that it is not the same as “A Hadoop replication factor”.

**Answer:** A
**Explanation:** The false claim is: TF-IDF is a network protocol.. TF-IDF actually means: Term weighting: frequent in a document, rare in the corpus.

### Q68  ·  Difficult
**Question:** Which statement about **Text mining** is FALSE?

- **A.** In this module, Text mining is a core idea students must distinguish from nearby terms.
- **B.** Text mining is only RAID.
- **C.** Text mining is correctly understood as: extracting structure and insight from unstructured text.
- **D.** A useful way to remember Text mining is that it is not the same as “Formatting HDFS”.

**Answer:** B
**Explanation:** The false claim is: Text mining is only RAID.. Text mining actually means: Extracting structure and insight from unstructured text.

### Q69  ·  Difficult
**Question:** Which statement about **Transformation** is FALSE?

- **A.** A useful way to remember Transformation is that it is not the same as “An immediate driver println only”.
- **B.** In this module, Transformation is a core idea students must distinguish from nearby terms.
- **C.** Transformation is correctly understood as: a lazy RDD/Dataset operation that builds a new plan (map, filter, join).
- **D.** Transformations always trigger jobs immediately.

**Answer:** D
**Explanation:** The false claim is: Transformations always trigger jobs immediately.. Transformation actually means: A lazy RDD/Dataset operation that builds a new plan (map, filter, join).

### Q70  ·  Difficult
**Question:** Why collect() + Python loop on the driver is a smell for 100 GB?

- **A.** HDFS cannot store 100 GB
- **B.** RDDs cannot map
- **C.** Work should stay distributed on executors; driver will choke
- **D.** Spark forbids Python

**Answer:** C
**Explanation:** Keep compute at data.

### Q71  ·  Difficult
**Question:** Word-count in Spark should persist the tokenized RDD if:

- **A.** It is never reused
- **B.** Multiple actions will reuse it
- **C.** It is 10 rows on the driver
- **D.** It is a CSS file

**Answer:** B
**Explanation:** Avoid recomputation.

### Q72  ·  Difficult
**Question:** collect() of a 200 GB RDD to the driver is dangerous because:

- **A.** It formats NameNode
- **B.** It always succeeds silently
- **C.** It is a transformation
- **D.** It can OOM the driver

**Answer:** D
**Explanation:** collect pulls all data to one JVM.

---

## Quick answer key

Q01–C | Q02–A | Q03–C | Q04–A | Q05–A | Q06–B | Q07–B | Q08–B | Q09–D | Q10–B | Q11–C | Q12–D | Q13–C | Q14–C | Q15–C | Q16–B | Q17–B | Q18–C | Q19–C | Q20–A | Q21–D | Q22–C | Q23–A | Q24–B | Q25–D | Q26–B | Q27–A | Q28–D | Q29–A | Q30–D | Q31–C | Q32–D | Q33–B | Q34–B | Q35–D | Q36–C | Q37–B | Q38–D | Q39–D | Q40–A | Q41–D | Q42–D | Q43–D | Q44–B | Q45–D | Q46–A | Q47–C | Q48–B | Q49–D | Q50–C | Q51–D | Q52–C | Q53–B | Q54–D | Q55–B | Q56–D | Q57–B | Q58–A | Q59–B | Q60–B | Q61–C | Q62–A | Q63–B | Q64–C | Q65–A | Q66–B | Q67–A | Q68–B | Q69–D | Q70–C | Q71–B | Q72–D
