# Quiz — Big Data Analytics — Module 2: Introduction to Hadoop

**Subject:** Big Data Analytics  
**Module:** Module 2 — Introduction to Hadoop  
**Questions:** 71  
**Mix:** 12 Easy · 34 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** HDFS default replication factor is commonly:

- **A.** 3
- **B.** 1
- **C.** 512
- **D.** 128

**Answer:** A
**Explanation:** Three replicas are the classic default.

### Q02  ·  Easy
**Question:** Which daemon stores HDFS file bytes?

- **A.** DataNode
- **B.** ResourceManager
- **C.** ApplicationMaster
- **D.** Hive CLI

**Answer:** A
**Explanation:** Blocks live on DataNodes.

### Q03  ·  Easy
**Question:** Which option best describes **DataNode**?

- **A.** A JDBC driver.
- **B.** A DNS root server.
- **C.** The only node allowed to run JobTracker UI CSS.
- **D.** A worker that stores HDFS blocks and serves read/write requests.

**Answer:** D
**Explanation:** DataNode: A worker that stores HDFS blocks and serves read/write requests.

### Q04  ·  Easy
**Question:** Which option best describes **Hadoop ecosystem**?

- **A.** A keyboard layout.
- **B.** Related projects such as Hive, Pig, HBase, Sqoop, Flume and Spark on Hadoop.
- **C.** Only the NameNode UI.
- **D.** A single JVM flag.

**Answer:** B
**Explanation:** Hadoop ecosystem: Related projects such as Hive, Pig, HBase, Sqoop, Flume and Spark on Hadoop.

### Q05  ·  Easy
**Question:** Which option best describes **Hadoop**?

- **A.** An open-source framework for distributed storage and processing on commodity clusters.
- **B.** A single-user spreadsheet.
- **C.** A BIOS vendor.
- **D.** A CSS animation library.

**Answer:** A
**Explanation:** Hadoop: An open-source framework for distributed storage and processing on commodity clusters.

### Q06  ·  Easy
**Question:** Which option best describes **MapReduce**?

- **A.** A CSS flex layout.
- **B.** A programming model of map, shuffle/sort and reduce over splits.
- **C.** A BIOS interrupt.
- **D.** An Ethernet frame type.

**Answer:** B
**Explanation:** MapReduce: A programming model of map, shuffle/sort and reduce over splits.

### Q07  ·  Easy
**Question:** Which option best describes **NodeManager**?

- **A.** An SMTP daemon.
- **B.** The YARN agent on each node that launches and monitors containers.
- **C.** The HDFS NameNode standby only.
- **D.** A CSS linter.

**Answer:** B
**Explanation:** NodeManager: The YARN agent on each node that launches and monitors containers.

### Q08  ·  Easy
**Question:** Which option best describes **Secondary NameNode**?

- **A.** YARN’s UI.
- **B.** A helper that merges edits with fsimage; it is not a hot standby by itself.
- **C.** A third DataNode.
- **D.** An automatic silent replacement of a dead NameNode in all Hadoop versions.

**Answer:** B
**Explanation:** Secondary NameNode: A helper that merges edits with fsimage; it is not a hot standby by itself.

### Q09  ·  Easy
**Question:** Which sequence correctly describes **HDFS replica placement (typical)**?

- **A.** One local replica → second on off-rack node → third on another node of that rack
- **B.** No replica until reduce finishes
- **C.** All replicas only on the NameNode heap
- **D.** Three copies on the same disk platter

**Answer:** A
**Explanation:** Correct sequence for HDFS replica placement (typical): One local replica → second on off-rack node → third on another node of that rack

### Q10  ·  Easy
**Question:** Which sequence correctly describes **HDFS write (simplified)**?

- **A.** YARN shuffle → then create the file name
- **B.** DataNode formats NameNode → client deletes fsimage
- **C.** Client → NameNode for blocks → pipeline write to DataNodes → replica acknowledgements → complete
- **D.** Pig parser → BIOS → disk

**Answer:** C
**Explanation:** Correct sequence for HDFS write (simplified): Client → NameNode for blocks → pipeline write to DataNodes → replica acknowledgements → complete

### Q11  ·  Easy
**Question:** Which sequence correctly describes **MapReduce job**?

- **A.** Format HDFS → skip maps → print
- **B.** Reduce → then map → then split input
- **C.** YARN deletes NameNode → map
- **D.** Submit → splits/maps → shuffle/sort → reduce → write output

**Answer:** D
**Explanation:** Correct sequence for MapReduce job: Submit → splits/maps → shuffle/sort → reduce → write output

### Q12  ·  Easy
**Question:** YARN stands for:

- **A.** Your Archive Replay Node
- **B.** Yet Another Resource Negotiator
- **C.** Yet Another RAID Namespace
- **D.** Yellow Avro Record Network

**Answer:** B
**Explanation:** Standard Hadoop expansion.

### Q13  ·  Intermediate
**Question:** A 300 MB lecture video is stored in HDFS with 128 MB blocks. How is it laid out?

- **A.** NameNode stores the video bytes
- **B.** One 4 KB inode only
- **C.** Three blocks (128+128+44) with replicas
- **D.** YARN containers hold the MP4

**Answer:** C
**Explanation:** HDFS splits by block size.

### Q14  ·  Intermediate
**Question:** A job needs 10 map containers. Which component grants the resources?

- **A.** HDFS DataNode block scanner
- **B.** YARN ResourceManager (via ApplicationMaster requests)
- **C.** DNS
- **D.** Hive UI theme

**Answer:** B
**Explanation:** YARN schedules CPU/memory.

### Q15  ·  Intermediate
**Question:** HDFS is designed primarily for:

- **A.** Editing 4 KB documents in place all day
- **B.** High-rate single-row OLTP updates
- **C.** Write-once, read-many large files
- **D.** Replacing CPU caches

**Answer:** C
**Explanation:** HDFS favours large streaming reads.

### Q16  ·  Intermediate
**Question:** MapReduce ‘map’ should be:

- **A.** A CSS preprocessor
- **B.** A NameNode failover tool
- **C.** A side-effect-light transformation of a split to key/value pairs
- **D.** The only place to write HDFS fsimage

**Answer:** C
**Explanation:** Maps emit intermediate pairs.

### Q17  ·  Intermediate
**Question:** Secondary NameNode running does not mean:

- **A.** fsimage can be merged
- **B.** Edit-log checkpointing can occur
- **C.** Automatic hot failover of an active NameNode in classic Hadoop
- **D.** Cluster can still have a NameNode

**Answer:** C
**Explanation:** SNN is not HA standby by itself.

### Q18  ·  Intermediate
**Question:** Sqoop is used in the ecosystem mainly to:

- **A.** Replace Ethernet
- **B.** Compile C++
- **C.** Move data between RDBMS and Hadoop
- **D.** Paint racks

**Answer:** C
**Explanation:** Sqoop imports/exports relational data.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **MapReduce** and **Spark (in-memory)**?

- **A.** MapReduce forbids reduce.
- **B.** They are CSS frameworks.
- **C.** Spark cannot run on YARN.
- **D.** MapReduce materialises shuffle on disk; Spark can keep RDDs in memory.

**Answer:** D
**Explanation:** MapReduce materialises shuffle on disk; Spark can keep RDDs in memory.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **NameNode** and **DataNode**?

- **A.** NameNode keeps metadata; DataNodes store block bytes.
- **B.** NameNode stores all video bytes.
- **C.** DataNodes keep the file tree.
- **D.** They are YARN UI skins.

**Answer:** A
**Explanation:** NameNode keeps metadata; DataNodes store block bytes.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **fsimage** and **edit log**?

- **A.** fsimage is a reducer output.
- **B.** Edits store video blocks.
- **C.** fsimage is a checkpoint; edits record incremental namespace changes.
- **D.** They are Pig tuples.

**Answer:** C
**Explanation:** fsimage is a checkpoint; edits record incremental namespace changes.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **replication** and **erasure coding**?

- **A.** EC always uses 3 full copies.
- **B.** They are Hive SerDes.
- **C.** Replication copies whole blocks; EC stores fragments with parity for less overhead.
- **D.** Replication stores parity only.

**Answer:** C
**Explanation:** Replication copies whole blocks; EC stores fragments with parity for less overhead.

### Q23  ·  Intermediate
**Question:** Which option best describes **ApplicationMaster**?

- **A.** ZooKeeper’s only disk.
- **B.** Per-application YARN coordinator that requests containers and manages the job.
- **C.** The global HDFS formatter.
- **D.** A BIOS bootloader.

**Answer:** B
**Explanation:** ApplicationMaster: Per-application YARN coordinator that requests containers and manages the job.

### Q24  ·  Intermediate
**Question:** Which option best describes **Block**?

- **A.** The large storage unit in HDFS, commonly 128 MB in modern Hadoop.
- **B.** A 4 KB ext4 block only.
- **C.** A MongoDB _id.
- **D.** A TCP window.

**Answer:** A
**Explanation:** Block: The large storage unit in HDFS, commonly 128 MB in modern Hadoop.

### Q25  ·  Intermediate
**Question:** Which option best describes **Container**?

- **A.** A YARN resource allocation (CPU/memory) in which a task attempt runs.
- **B.** A Docker-only legal requirement.
- **C.** An HDFS block replica.
- **D.** A Hive view.

**Answer:** A
**Explanation:** Container: A YARN resource allocation (CPU/memory) in which a task attempt runs.

### Q26  ·  Intermediate
**Question:** Which option best describes **HDFS**?

- **A.** A Windows Recycle Bin.
- **B.** A CSS reset.
- **C.** Hadoop’s distributed filesystem that stores large files as replicated blocks.
- **D.** A CPU cache protocol.

**Answer:** C
**Explanation:** HDFS: Hadoop’s distributed filesystem that stores large files as replicated blocks.

### Q27  ·  Intermediate
**Question:** Which option best describes **NameNode**?

- **A.** A node that stores all file bytes itself.
- **B.** A Pig lexer.
- **C.** A YARN UI theme.
- **D.** The HDFS master that keeps namespace and block-location metadata in memory.

**Answer:** D
**Explanation:** NameNode: The HDFS master that keeps namespace and block-location metadata in memory.

### Q28  ·  Intermediate
**Question:** Which option best describes **Rack awareness**?

- **A.** Disabling replication.
- **B.** Storing all replicas on one disk.
- **C.** Painting server racks blue.
- **D.** Placing replicas across racks so a rack failure does not lose data.

**Answer:** D
**Explanation:** Rack awareness: Placing replicas across racks so a rack failure does not lose data.

### Q29  ·  Intermediate
**Question:** Which option best describes **Replication factor**?

- **A.** Hive SerDe name.
- **B.** How many copies of each HDFS block are stored, default 3.
- **C.** Spark partitioner hash.
- **D.** The MapReduce shuffle codec.

**Answer:** B
**Explanation:** Replication factor: How many copies of each HDFS block are stored, default 3.

### Q30  ·  Intermediate
**Question:** Which option best describes **ResourceManager**?

- **A.** Hive metastore Derby only.
- **B.** The YARN master that schedules cluster resources among applications.
- **C.** A Pig Latin parser.
- **D.** The HDFS block scanner.

**Answer:** B
**Explanation:** ResourceManager: The YARN master that schedules cluster resources among applications.

### Q31  ·  Intermediate
**Question:** Which option best describes **Shuffle**?

- **A.** Randomly deleting blocks.
- **B.** The MapReduce phase that transfers map outputs to reducers by key.
- **C.** Rebooting DataNodes.
- **D.** Reformatting the NameNode.

**Answer:** B
**Explanation:** Shuffle: The MapReduce phase that transfers map outputs to reducers by key.

### Q32  ·  Intermediate
**Question:** Which option best describes **Split**?

- **A.** An IP fragment only.
- **B.** A BIOS boot sector.
- **C.** A CSS column.
- **D.** The input unit a map task processes, often aligned to an HDFS block.

**Answer:** D
**Explanation:** Split: The input unit a map task processes, often aligned to an HDFS block.

### Q33  ·  Intermediate
**Question:** Which option best describes **YARN**?

- **A.** Hadoop’s resource manager that allocates containers to applications.
- **B.** A JavaScript package manager.
- **C.** A wool textile.
- **D.** A RAID controller brand.

**Answer:** A
**Explanation:** YARN: Hadoop’s resource manager that allocates containers to applications.

### Q34  ·  Intermediate
**Question:** Which option best describes **fsimage**?

- **A.** A JPEG of the cluster photo.
- **B.** A Pig script.
- **C.** A Spark DAG.
- **D.** A checkpointed snapshot of the HDFS namespace on the NameNode.

**Answer:** D
**Explanation:** fsimage: A checkpointed snapshot of the HDFS namespace on the NameNode.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **HDFS read (simplified)**?

- **A.** Client reads fsimage bytes of the video from RM
- **B.** Reducer writes the file first
- **C.** Secondary NameNode streams blocks to browsers
- **D.** Client asks NameNode for locations → reads nearest DataNode replicas

**Answer:** D
**Explanation:** Correct sequence for HDFS read (simplified): Client asks NameNode for locations → reads nearest DataNode replicas

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **YARN app launch**?

- **A.** BIOS → Hive → CSS
- **B.** Reducer → NameNode format
- **C.** Client → ResourceManager → ApplicationMaster → containers on NodeManagers
- **D.** DataNode → fsimage → Pig

**Answer:** C
**Explanation:** Correct sequence for YARN app launch: Client → ResourceManager → ApplicationMaster → containers on NodeManagers

### Q37  ·  Intermediate
**Question:** Which statement about **ApplicationMaster** is FALSE?

- **A.** In this module, ApplicationMaster is a core idea students must distinguish from nearby terms.
- **B.** ApplicationMaster is correctly understood as: per-application YARN coordinator that requests containers and manages the job.
- **C.** A useful way to remember ApplicationMaster is that it is not the same as “The global HDFS formatter”.
- **D.** There is only one ApplicationMaster for the entire cluster ever.

**Answer:** D
**Explanation:** The false claim is: There is only one ApplicationMaster for the entire cluster ever.. ApplicationMaster actually means: Per-application YARN coordinator that requests containers and manages the job.

### Q38  ·  Intermediate
**Question:** Which statement about **Block** is FALSE?

- **A.** A useful way to remember Block is that it is not the same as “A 4 KB ext4 block only”.
- **B.** HDFS blocks are always 512 bytes like disk sectors.
- **C.** In this module, Block is a core idea students must distinguish from nearby terms.
- **D.** Block is correctly understood as: the large storage unit in HDFS, commonly 128 MB in modern Hadoop.

**Answer:** B
**Explanation:** The false claim is: HDFS blocks are always 512 bytes like disk sectors.. Block actually means: The large storage unit in HDFS, commonly 128 MB in modern Hadoop.

### Q39  ·  Intermediate
**Question:** Which statement about **Hadoop ecosystem** is FALSE?

- **A.** In this module, Hadoop ecosystem is a core idea students must distinguish from nearby terms.
- **B.** Hadoop ecosystem is correctly understood as: related projects such as Hive, Pig, HBase, Sqoop, Flume and Spark on Hadoop.
- **C.** A useful way to remember Hadoop ecosystem is that it is not the same as “Only the NameNode UI”.
- **D.** The ecosystem is illegal to use with HDFS.

**Answer:** D
**Explanation:** The false claim is: The ecosystem is illegal to use with HDFS.. Hadoop ecosystem actually means: Related projects such as Hive, Pig, HBase, Sqoop, Flume and Spark on Hadoop.

### Q40  ·  Intermediate
**Question:** Which statement about **Hadoop** is FALSE?

- **A.** In this module, Hadoop is a core idea students must distinguish from nearby terms.
- **B.** Hadoop is correctly understood as: an open-source framework for distributed storage and processing on commodity clusters.
- **C.** A useful way to remember Hadoop is that it is not the same as “A CSS animation library”.
- **D.** Hadoop runs only on one laptop GPU.

**Answer:** D
**Explanation:** The false claim is: Hadoop runs only on one laptop GPU.. Hadoop actually means: An open-source framework for distributed storage and processing on commodity clusters.

### Q41  ·  Intermediate
**Question:** Which statement about **MapReduce** is FALSE?

- **A.** In this module, MapReduce is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember MapReduce is that it is not the same as “A CSS flex layout”.
- **C.** MapReduce is correctly understood as: a programming model of map, shuffle/sort and reduce over splits.
- **D.** MapReduce forbids grouping by key.

**Answer:** D
**Explanation:** The false claim is: MapReduce forbids grouping by key.. MapReduce actually means: A programming model of map, shuffle/sort and reduce over splits.

### Q42  ·  Intermediate
**Question:** Which statement about **NameNode** is FALSE?

- **A.** NameNode is correctly understood as: the HDFS master that keeps namespace and block-location metadata in memory.
- **B.** A useful way to remember NameNode is that it is not the same as “A node that stores all file bytes itself”.
- **C.** In this module, NameNode is a core idea students must distinguish from nearby terms.
- **D.** The NameNode stores every file’s bytes, not metadata.

**Answer:** D
**Explanation:** The false claim is: The NameNode stores every file’s bytes, not metadata.. NameNode actually means: The HDFS master that keeps namespace and block-location metadata in memory.

### Q43  ·  Intermediate
**Question:** Which statement about **ResourceManager** is FALSE?

- **A.** ResourceManager writes HDFS file bytes.
- **B.** A useful way to remember ResourceManager is that it is not the same as “The HDFS block scanner”.
- **C.** In this module, ResourceManager is a core idea students must distinguish from nearby terms.
- **D.** ResourceManager is correctly understood as: the YARN master that schedules cluster resources among applications.

**Answer:** A
**Explanation:** The false claim is: ResourceManager writes HDFS file bytes.. ResourceManager actually means: The YARN master that schedules cluster resources among applications.

### Q44  ·  Intermediate
**Question:** Which statement about **Shuffle** is FALSE?

- **A.** A useful way to remember Shuffle is that it is not the same as “Randomly deleting blocks”.
- **B.** Shuffle happens before maps start.
- **C.** In this module, Shuffle is a core idea students must distinguish from nearby terms.
- **D.** Shuffle is correctly understood as: the MapReduce phase that transfers map outputs to reducers by key.

**Answer:** B
**Explanation:** The false claim is: Shuffle happens before maps start.. Shuffle actually means: The MapReduce phase that transfers map outputs to reducers by key.

### Q45  ·  Intermediate
**Question:** Which statement about **fsimage** is FALSE?

- **A.** fsimage is correctly understood as: a checkpointed snapshot of the HDFS namespace on the NameNode.
- **B.** In this module, fsimage is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember fsimage is that it is not the same as “A JPEG of the cluster photo”.
- **D.** fsimage stores all file bytes.

**Answer:** D
**Explanation:** The false claim is: fsimage stores all file bytes.. fsimage actually means: A checkpointed snapshot of the HDFS namespace on the NameNode.

### Q46  ·  Intermediate
**Question:** Why are HDFS blocks large (64/128 MB)?

- **A.** Because Ethernet frames are 128 MB
- **B.** Because JSON keys are 128 MB
- **C.** To reduce NameNode metadata and improve sequential throughput
- **D.** Because TCP windows are 128 MB

**Answer:** C
**Explanation:** Large blocks amortise metadata and seeks.

### Q47  ·  Difficult
**Question:** A 1 GB file, 128 MB blocks. How many map tasks if 1 split = 1 block?

- **A.** 128
- **B.** 8
- **C.** 1024
- **D.** 1

**Answer:** B
**Explanation:** 1 GB = 1024 MB; 1024/128 = 8.

### Q48  ·  Difficult
**Question:** A MapReduce word-count’s grouping of identical words happens in:

- **A.** CSS bundling
- **B.** NameNode heartbeat
- **C.** DataNode volume scanner only
- **D.** Shuffle/sort before reduce

**Answer:** D
**Explanation:** Shuffle groups map output by key.

### Q49  ·  Difficult
**Question:** Cluster of 20 DataNodes, 4 TB usable each. Rough raw HDFS capacity ignoring replication?

- **A.** 4 TB
- **B.** 20 GB
- **C.** 128 MB
- **D.** 80 TB

**Answer:** D
**Explanation:** 20 × 4 TB = 80 TB raw.

### Q50  ·  Difficult
**Question:** Default replication 3, block 128 MB, file 256 MB. How many block files are stored cluster-wide?

- **A.** 3
- **B.** 6
- **C.** 128
- **D.** 2

**Answer:** B
**Explanation:** 2 blocks × 3 replicas = 6 stored copies.

### Q51  ·  Difficult
**Question:** Flume is typically used to:

- **A.** Replace the NameNode
- **B.** Ingest streaming logs into HDFS
- **C.** Minify JavaScript
- **D.** Format BIOS

**Answer:** B
**Explanation:** Flume is a log ingest service.

### Q52  ·  Difficult
**Question:** If replication is 3 and two DataNodes on the same rack die, a block is still safe if:

- **A.** Only fsimage had the bytes
- **B.** All replicas were on those two nodes
- **C.** The third replica is on another rack (typical placement)
- **D.** YARN held the file

**Answer:** C
**Explanation:** Cross-rack placement survives two node deaths on one rack if the off-rack copy lives.

### Q53  ·  Difficult
**Question:** NameNode HA uses:

- **A.** Pig Latin only
- **B.** Spark UI
- **C.** Active/standby NameNodes with shared edits (e.g. JournalNodes) plus ZooKeeper failover
- **D.** Three DataNodes voting on fsimage weekly

**Answer:** C
**Explanation:** HA is not the classic Secondary NameNode.

### Q54  ·  Difficult
**Question:** NameNode metadata ≈ 150 bytes/block. ~200 million blocks need about how much RAM order-of-magnitude?

- **A.** 1 KB
- **B.** 150 bytes total
- **C.** 200 TB of NameNode RAM for bytes of files
- **D.** Tens of GB

**Answer:** D
**Explanation:** 200e6 × 150 B ≈ 30 GB plus overhead.

### Q55  ·  Difficult
**Question:** Placing all three replicas on one rack is dangerous because:

- **A.** JSON becomes invalid
- **B.** Maps cannot run
- **C.** HDFS forbids racks
- **D.** A rack switch/power failure can lose the block

**Answer:** D
**Explanation:** Rack awareness exists to survive rack loss.

### Q56  ·  Difficult
**Question:** Rack policy: first replica local, second off-rack, third on a different node of the second rack. How many racks hold replicas of one block (typical)?

- **A.** 1
- **B.** 3 always
- **C.** 0
- **D.** 2

**Answer:** D
**Explanation:** Standard HDFS placement uses two racks.

### Q57  ·  Difficult
**Question:** The NameNode process is killed and there is no HA. What happens to namespace operations?

- **A.** DataNodes silently become NameNodes
- **B.** HDFS becomes unavailable for namespace changes/reads needing NN
- **C.** Files are deleted
- **D.** Spark takes over fsimage

**Answer:** B
**Explanation:** Client metadata ops need the NameNode.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **HDFS** and **local POSIX FS**?

- **A.** POSIX always replicates 3 ways.
- **B.** HDFS uses large replicated blocks and write-once files; POSIX allows many small updates.
- **C.** There is no difference.
- **D.** HDFS uses 4 KB blocks only.

**Answer:** B
**Explanation:** HDFS uses large replicated blocks and write-once files; POSIX allows many small updates.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **JobTracker (MRv1)** and **YARN**?

- **A.** MRv1 is Spark-only.
- **B.** MRv1 couples resource and job control; YARN separates RM, NM and AM.
- **C.** YARN removes DataNodes.
- **D.** They both store HDFS blocks.

**Answer:** B
**Explanation:** MRv1 couples resource and job control; YARN separates RM, NM and AM.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **ResourceManager** and **NameNode**?

- **A.** RM schedules compute; NameNode manages HDFS namespace.
- **B.** RM keeps fsimage.
- **C.** They are the same daemon.
- **D.** Both store file bytes.

**Answer:** A
**Explanation:** RM schedules compute; NameNode manages HDFS namespace.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **block** and **split**?

- **A.** They are always different sizes by law.
- **B.** A block is a stored chunk; a split is a map input logical range.
- **C.** A split is a YARN container.
- **D.** Splits live only on the NameNode disk as bytes.

**Answer:** B
**Explanation:** A block is a stored chunk; a split is a map input logical range.

### Q62  ·  Difficult
**Question:** Which statement about **Container** is FALSE?

- **A.** In this module, Container is a core idea students must distinguish from nearby terms.
- **B.** A container is a 128 MB HDFS block.
- **C.** A useful way to remember Container is that it is not the same as “An HDFS block replica”.
- **D.** Container is correctly understood as: a YARN resource allocation (CPU/memory) in which a task attempt runs.

**Answer:** B
**Explanation:** The false claim is: A container is a 128 MB HDFS block.. Container actually means: A YARN resource allocation (CPU/memory) in which a task attempt runs.

### Q63  ·  Difficult
**Question:** Which statement about **DataNode** is FALSE?

- **A.** A useful way to remember DataNode is that it is not the same as “The only node allowed to run JobTracker UI CSS”.
- **B.** In this module, DataNode is a core idea students must distinguish from nearby terms.
- **C.** DataNode is correctly understood as: a worker that stores HDFS blocks and serves read/write requests.
- **D.** DataNodes hold the namespace tree, not blocks.

**Answer:** D
**Explanation:** The false claim is: DataNodes hold the namespace tree, not blocks.. DataNode actually means: A worker that stores HDFS blocks and serves read/write requests.

### Q64  ·  Difficult
**Question:** Which statement about **HDFS** is FALSE?

- **A.** HDFS is a POSIX laptop filesystem with 4 KB blocks only.
- **B.** HDFS is correctly understood as: hadoop’s distributed filesystem that stores large files as replicated blocks.
- **C.** A useful way to remember HDFS is that it is not the same as “A Windows Recycle Bin”.
- **D.** In this module, HDFS is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: HDFS is a POSIX laptop filesystem with 4 KB blocks only.. HDFS actually means: Hadoop’s distributed filesystem that stores large files as replicated blocks.

### Q65  ·  Difficult
**Question:** Which statement about **NodeManager** is FALSE?

- **A.** In this module, NodeManager is a core idea students must distinguish from nearby terms.
- **B.** NodeManagers store the HDFS namespace.
- **C.** NodeManager is correctly understood as: the YARN agent on each node that launches and monitors containers.
- **D.** A useful way to remember NodeManager is that it is not the same as “The HDFS NameNode standby only”.

**Answer:** B
**Explanation:** The false claim is: NodeManagers store the HDFS namespace.. NodeManager actually means: The YARN agent on each node that launches and monitors containers.

### Q66  ·  Difficult
**Question:** Which statement about **Rack awareness** is FALSE?

- **A.** Rack awareness puts all three replicas on the same rack for speed only.
- **B.** In this module, Rack awareness is a core idea students must distinguish from nearby terms.
- **C.** Rack awareness is correctly understood as: placing replicas across racks so a rack failure does not lose data.
- **D.** A useful way to remember Rack awareness is that it is not the same as “Painting server racks blue”.

**Answer:** A
**Explanation:** The false claim is: Rack awareness puts all three replicas on the same rack for speed only.. Rack awareness actually means: Placing replicas across racks so a rack failure does not lose data.

### Q67  ·  Difficult
**Question:** Which statement about **Replication factor** is FALSE?

- **A.** A useful way to remember Replication factor is that it is not the same as “The MapReduce shuffle codec”.
- **B.** Replication factor is correctly understood as: how many copies of each HDFS block are stored, default 3.
- **C.** Replication factor 3 means three NameNodes for every file name.
- **D.** In this module, Replication factor is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Replication factor 3 means three NameNodes for every file name.. Replication factor actually means: How many copies of each HDFS block are stored, default 3.

### Q68  ·  Difficult
**Question:** Which statement about **Secondary NameNode** is FALSE?

- **A.** Secondary NameNode is correctly understood as: a helper that merges edits with fsimage; it is not a hot standby by itself.
- **B.** Secondary NameNode is always an HA failover NameNode.
- **C.** A useful way to remember Secondary NameNode is that it is not the same as “An automatic silent replacement of a dead NameNode in all Hadoop versions”.
- **D.** In this module, Secondary NameNode is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Secondary NameNode is always an HA failover NameNode.. Secondary NameNode actually means: A helper that merges edits with fsimage; it is not a hot standby by itself.

### Q69  ·  Difficult
**Question:** Which statement about **Split** is FALSE?

- **A.** In this module, Split is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Split is that it is not the same as “A CSS column”.
- **C.** A split is the NameNode heap dump.
- **D.** Split is correctly understood as: the input unit a map task processes, often aligned to an HDFS block.

**Answer:** C
**Explanation:** The false claim is: A split is the NameNode heap dump.. Split actually means: The input unit a map task processes, often aligned to an HDFS block.

### Q70  ·  Difficult
**Question:** Which statement about **YARN** is FALSE?

- **A.** YARN stores HDFS blocks.
- **B.** A useful way to remember YARN is that it is not the same as “A JavaScript package manager”.
- **C.** YARN is correctly understood as: hadoop’s resource manager that allocates containers to applications.
- **D.** In this module, YARN is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: YARN stores HDFS blocks.. YARN actually means: Hadoop’s resource manager that allocates containers to applications.

### Q71  ·  Difficult
**Question:** With replication 3, 80 TB raw yields about how much logical HDFS space?

- **A.** 3 TB
- **B.** 240 TB
- **C.** ≈26.7 TB
- **D.** 80 TB

**Answer:** C
**Explanation:** Logical ≈ raw / 3.

---

## Quick answer key

Q01–A | Q02–A | Q03–D | Q04–B | Q05–A | Q06–B | Q07–B | Q08–B | Q09–A | Q10–C | Q11–D | Q12–B | Q13–C | Q14–B | Q15–C | Q16–C | Q17–C | Q18–C | Q19–D | Q20–A | Q21–C | Q22–C | Q23–B | Q24–A | Q25–A | Q26–C | Q27–D | Q28–D | Q29–B | Q30–B | Q31–B | Q32–D | Q33–A | Q34–D | Q35–D | Q36–C | Q37–D | Q38–B | Q39–D | Q40–D | Q41–D | Q42–D | Q43–A | Q44–B | Q45–D | Q46–C | Q47–B | Q48–D | Q49–D | Q50–B | Q51–B | Q52–C | Q53–C | Q54–D | Q55–D | Q56–D | Q57–B | Q58–B | Q59–B | Q60–A | Q61–B | Q62–B | Q63–D | Q64–A | Q65–B | Q66–A | Q67–C | Q68–B | Q69–C | Q70–A | Q71–C
