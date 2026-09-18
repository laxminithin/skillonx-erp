# Quiz — Operating Systems — Module 5: Where Data Lives

**Subject:** Operating Systems  
**Module:** Module 5 — Where Data Lives  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A directory is primarily:

- **A.** A mapping from names to files
- **B.** A semaphore
- **C.** A page-table leaf
- **D.** A CPU burst descriptor

**Answer:** A
**Explanation:** The hierarchical namespace.

### Q02  ·  Easy
**Question:** NFS is an example of:

- **A.** A page-replacement stack
- **B.** NAS / network file access
- **C.** Peterson’s algorithm
- **D.** A SAN block LUN by itself

**Answer:** B
**Explanation:** File-level remote FS.

### Q03  ·  Easy
**Question:** Which disk algorithm is the elevator algorithm?

- **A.** SCAN
- **B.** FCFS
- **C.** SSTF
- **D.** FIFO page replacement

**Answer:** A
**Explanation:** SCAN sweeps like an elevator.

### Q04  ·  Easy
**Question:** Which option best describes **C-SCAN**?

- **A.** SCAN in one direction then jump to the other end and sweep the same way again (more uniform wait).
- **B.** LOOK without going to the end.
- **C.** SSTF.
- **D.** FCFS.

**Answer:** A
**Explanation:** C-SCAN: SCAN in one direction then jump to the other end and sweep the same way again (more uniform wait).

### Q05  ·  Easy
**Question:** Which option best describes **FCFS disk scheduling**?

- **A.** Sweep in one direction only.
- **B.** Service requests in arrival order; simple, may move the head a long way.
- **C.** LOOK without a queue.
- **D.** Always shortest seek next.

**Answer:** B
**Explanation:** FCFS disk scheduling: Service requests in arrival order; simple, may move the head a long way.

### Q06  ·  Easy
**Question:** Which option best describes **File**?

- **A.** A named logical unit of related information stored by the file system.
- **B.** A TLB line.
- **C.** A semaphore.
- **D.** A CPU register.

**Answer:** A
**Explanation:** File: A named logical unit of related information stored by the file system.

### Q07  ·  Easy
**Question:** Which option best describes **Indexed allocation**?

- **A.** Mandatory contiguous placement.
- **B.** Only a next-pointer in each data block.
- **C.** An index block (or tree of them) holds pointers to data blocks (Unix inodes, NTFS extents as a relative).
- **D.** DMA tables in RAM only, never on disk.

**Answer:** C
**Explanation:** Indexed allocation: An index block (or tree of them) holds pointers to data blocks (Unix inodes, NTFS extents as a relative).

### Q08  ·  Easy
**Question:** Which option best describes **Metadata / inode**?

- **A.** The file’s first data byte only.
- **B.** The interrupt vector.
- **C.** The SCAN queue.
- **D.** On-disk (and cached) attributes: size, owner, timestamps, block pointers — not the data bytes themselves.

**Answer:** D
**Explanation:** Metadata / inode: On-disk (and cached) attributes: size, owner, timestamps, block pointers — not the data bytes themselves.

### Q09  ·  Easy
**Question:** Which option best describes **SAN**?

- **A.** An NFS export of directories.
- **B.** A network (often Fibre Channel/iSCSI) presenting block devices; the host runs the file system.
- **C.** A microkernel IPC bus.
- **D.** A page cache only.

**Answer:** B
**Explanation:** SAN: A network (often Fibre Channel/iSCSI) presenting block devices; the host runs the file system.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **linked-file sequential read**?

- **A.** require all blocks adjacent
- **B.** translate through the TLB only
- **C.** use the index block only
- **D.** start at first block → read data → follow next pointer → repeat until EOF

**Answer:** D
**Explanation:** Correct sequence for linked-file sequential read: start at first block → read data → follow next pointer → repeat until EOF

### Q11  ·  Easy
**Question:** Which sequence correctly describes **open/read path (simplified)**?

- **A.** DMA the filename to the CPU scheduler
- **B.** path lookup in directories → permission check → inode/file object in VFS → read via FS → maybe page cache → copy to user
- **C.** skip directories
- **D.** SCAN the name string on the platter without inodes

**Answer:** B
**Explanation:** Correct sequence for open/read path (simplified): path lookup in directories → permission check → inode/file object in VFS → read via FS → maybe page cache → copy to user

### Q12  ·  Intermediate
**Question:** A student copies a movie sequentially. Which allocation shines for sequential streaming?

- **A.** Contiguous (or extent-based) sequential layout
- **B.** SSTF on a RAM disk with no file
- **C.** Random inode trees with no clustering
- **D.** Pure linked with pointers in each 512-byte sector and no FAT cache

**Answer:** A
**Explanation:** Sequential layout minimises seeks.

### Q13  ·  Intermediate
**Question:** C-SCAN is chosen over SCAN on a busy server because:

- **A.** It avoids all seeks
- **B.** It equalises wait time by always sweeping the same way
- **C.** It never moves the head
- **D.** It is FCFS

**Answer:** B
**Explanation:** No extra delay for requests just missed by a reversal.

### Q14  ·  Intermediate
**Question:** Department stores VM disks as LUNs on Fibre Channel; hosts format NTFS/ext4. This is:

- **A.** NAS file share only
- **B.** Linked allocation in RAM
- **C.** SAN (block) storage
- **D.** A local floppy

**Answer:** C
**Explanation:** Block-level remote disks.

### Q15  ·  Intermediate
**Question:** Disk arm stuck serving a hot cylinder while a request at the far edge waits forever. Policy risk?

- **A.** FCFS unfairness of a different kind only
- **B.** C-LOOK going to the last request
- **C.** VFS naming
- **D.** SSTF starvation

**Answer:** D
**Explanation:** Greedy nearest can ignore the far request.

### Q16  ·  Intermediate
**Question:** Indexed allocation is preferred over linked for random access because:

- **A.** Block addresses are available from the index without walking a chain
- **B.** It is the same as FCFS
- **C.** It never needs disk I/O
- **D.** It forces contiguous placement

**Answer:** A
**Explanation:** O(1) or O(log) through inode/indirects.

### Q17  ·  Intermediate
**Question:** LOOK differs from SCAN in that:

- **A.** It is FCFS
- **B.** It never reverses
- **C.** The arm turns around at the last request rather than the disk’s physical end
- **D.** It ignores the queue

**Answer:** C
**Explanation:** LOOK saves the empty seek to the rim.

### Q18  ·  Intermediate
**Question:** VFS exists so that:

- **A.** User syscalls need not know the on-disk FS type
- **B.** Disks cannot be mounted
- **C.** Directories are illegal
- **D.** Every FS must be FAT

**Answer:** A
**Explanation:** Common file_operations / inode API.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **FCFS disk** and **SSTF**?

- **A.** FCFS minimises total arm movement always.
- **B.** They are identical if the queue has one request.
- **C.** FCFS is fair in arrival order; SSTF minimises next seek but can starve far requests.
- **D.** SSTF is always fairer.

**Answer:** C
**Explanation:** FCFS is fair in arrival order; SSTF minimises next seek but can starve far requests.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **SCAN** and **C-SCAN**?

- **A.** SCAN reverses and services the return; C-SCAN jumps back and only services one sweep direction, fairer waits.
- **B.** SCAN never reverses.
- **C.** They are both SSTF.
- **D.** C-SCAN services both ways.

**Answer:** A
**Explanation:** SCAN reverses and services the return; C-SCAN jumps back and only services one sweep direction, fairer waits.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **contiguous file allocation** and **linked allocation**?

- **A.** Contiguous never needs compaction.
- **B.** They use the same on-disk pointer shape.
- **C.** Contiguous is fast sequential/random but fragments; linked is flexible but poor random access.
- **D.** Linked needs one large hole.

**Answer:** C
**Explanation:** Contiguous is fast sequential/random but fragments; linked is flexible but poor random access.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **directory tree** and **DAG / hard links**?

- **A.** Hard links always create directory cycles.
- **B.** Soft links cannot name a path.
- **C.** A tree has one parent; a DAG of files via hard links shares inodes with multiple names (no directory cycles typically).
- **D.** Trees cannot name files.

**Answer:** C
**Explanation:** A tree has one parent; a DAG of files via hard links shares inodes with multiple names (no directory cycles typically).

### Q23  ·  Intermediate
**Question:** Which option best describes **Absolute path**?

- **A.** A path from the root of the namespace to the file.
- **B.** A path from the current directory only.
- **C.** A cylinder number.
- **D.** A PCB field.

**Answer:** A
**Explanation:** Absolute path: A path from the root of the namespace to the file.

### Q24  ·  Intermediate
**Question:** Which option best describes **Contiguous allocation (files)**?

- **A.** A file occupies consecutive disk blocks; directory stores start and length.
- **B.** FAT by definition.
- **C.** Linked list of blocks always.
- **D.** i-node multi-level index only.

**Answer:** A
**Explanation:** Contiguous allocation (files): A file occupies consecutive disk blocks; directory stores start and length.

### Q25  ·  Intermediate
**Question:** Which option best describes **Directory**?

- **A.** A mapping from names to files (and subdirectories), implementing the namespace.
- **B.** A page frame.
- **C.** A disk platter.
- **D.** A mutex.

**Answer:** A
**Explanation:** Directory: A mapping from names to files (and subdirectories), implementing the namespace.

### Q26  ·  Intermediate
**Question:** Which option best describes **FAT**?

- **A.** A CPU scheduler.
- **B.** A table of next-block links kept in a reserved disk area (linked allocation with the links pulled out of data blocks).
- **C.** A Unix inode tree only.
- **D.** A hypervisor.

**Answer:** B
**Explanation:** FAT: A table of next-block links kept in a reserved disk area (linked allocation with the links pulled out of data blocks).

### Q27  ·  Intermediate
**Question:** Which option best describes **LOOK / C-LOOK**?

- **A.** Like SCAN/C-SCAN but only as far as the last request, not to the physical end if unused.
- **B.** Linked file allocation.
- **C.** Always go to cylinder 0.
- **D.** FCFS.

**Answer:** A
**Explanation:** LOOK / C-LOOK: Like SCAN/C-SCAN but only as far as the last request, not to the physical end if unused.

### Q28  ·  Intermediate
**Question:** Which option best describes **Linked allocation**?

- **A.** A single index block listing all pointers and nothing else ever.
- **B.** All blocks consecutive.
- **C.** Each block holds a pointer to the next; directory stores the first (and maybe last) block.
- **D.** SCAN itself.

**Answer:** C
**Explanation:** Linked allocation: Each block holds a pointer to the next; directory stores the first (and maybe last) block.

### Q29  ·  Intermediate
**Question:** Which option best describes **NAS**?

- **A.** Block-level storage presented as a local disk (typical SAN).
- **B.** File-level remote storage accessed over a network (NFS/SMB) as files/directories.
- **C.** The TLB.
- **D.** A local ext4 partition only.

**Answer:** B
**Explanation:** NAS: File-level remote storage accessed over a network (NFS/SMB) as files/directories.

### Q30  ·  Intermediate
**Question:** Which option best describes **Random access**?

- **A.** The same cost as linked-list walks for inodes.
- **B.** Jump to any offset; efficient with indexed/contiguous, poor with pure linked chains.
- **C.** Only allowed on tape.
- **D.** Forbidden in Unix.

**Answer:** B
**Explanation:** Random access: Jump to any offset; efficient with indexed/contiguous, poor with pure linked chains.

### Q31  ·  Intermediate
**Question:** Which option best describes **SCAN (elevator)**?

- **A.** Circular one-way then instant rewind without servicing the return in the same way as C-SCAN.
- **B.** Head moves toward one end, servicing, then reverses.
- **C.** FCFS.
- **D.** Jumps to the nearest request only.

**Answer:** B
**Explanation:** SCAN (elevator): Head moves toward one end, servicing, then reverses.

### Q32  ·  Intermediate
**Question:** Which option best describes **SSTF**?

- **A.** Always go to the edge of the disk.
- **B.** Serve the request closest to the current head position (greedy).
- **C.** Random cylinder.
- **D.** Serve in arrival order.

**Answer:** B
**Explanation:** SSTF: Serve the request closest to the current head position (greedy).

### Q33  ·  Intermediate
**Question:** Which option best describes **Sequential access**?

- **A.** Jumping to an arbitrary offset with equal cost always.
- **B.** Memory-mapped I/O only.
- **C.** SCAN by name.
- **D.** Read/write in order; matching linked allocation and streaming media.

**Answer:** D
**Explanation:** Sequential access: Read/write in order; matching linked allocation and streaming media.

### Q34  ·  Intermediate
**Question:** Which option best describes **VFS**?

- **A.** A kernel abstraction so open/read/write work across ext4, NFS, FAT via a common inode/file-ops interface.
- **B.** A disk head algorithm.
- **C.** A user-space GUI file manager.
- **D.** A Type-1 hypervisor.

**Answer:** A
**Explanation:** VFS: A kernel abstraction so open/read/write work across ext4, NFS, FAT via a common inode/file-ops interface.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **SCAN service**?

- **A.** sort pending requests along the current direction → service until last/end → reverse (or jump if C-SCAN) → repeat
- **B.** always pick FCFS even if farther
- **C.** stay at one cylinder forever if SSTF would move
- **D.** ignore the queue

**Answer:** A
**Explanation:** Correct sequence for SCAN service: sort pending requests along the current direction → service until last/end → reverse (or jump if C-SCAN) → repeat

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **inode random read (direct)**?

- **A.** walk every previous data block’s next field
- **B.** allocate a new contiguous region first
- **C.** run Banker
- **D.** compute block index from offset → load pointer from inode → read that data block

**Answer:** D
**Explanation:** Correct sequence for inode random read (direct): compute block index from offset → load pointer from inode → read that data block

### Q37  ·  Intermediate
**Question:** Which statement about **Absolute path** is FALSE?

- **A.** In this module, Absolute path is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Absolute path is that it is not the same as “A path from the current directory only”.
- **C.** Absolute path is correctly understood as: a path from the root of the namespace to the file.
- **D.** Absolute paths never start at the root.

**Answer:** D
**Explanation:** The false claim is: Absolute paths never start at the root.. Absolute path actually means: A path from the root of the namespace to the file.

### Q38  ·  Intermediate
**Question:** Which statement about **C-SCAN** is FALSE?

- **A.** A useful way to remember C-SCAN is that it is not the same as “SSTF”.
- **B.** In this module, C-SCAN is a core idea students must distinguish from nearby terms.
- **C.** C-SCAN is correctly understood as: sCAN in one direction then jump to the other end and sweep the same way again (more uniform wait).
- **D.** C-SCAN services requests on the return trip the same as SCAN.

**Answer:** D
**Explanation:** The false claim is: C-SCAN services requests on the return trip the same as SCAN.. C-SCAN actually means: SCAN in one direction then jump to the other end and sweep the same way again (more uniform wait).

### Q39  ·  Intermediate
**Question:** Which statement about **Contiguous allocation (files)** is FALSE?

- **A.** In this module, Contiguous allocation (files) is a core idea students must distinguish from nearby terms.
- **B.** Contiguous file allocation has no external fragmentation on a busy disk.
- **C.** Contiguous allocation (files) is correctly understood as: a file occupies consecutive disk blocks; directory stores start and length.
- **D.** A useful way to remember Contiguous allocation (files) is that it is not the same as “Linked list of blocks always”.

**Answer:** B
**Explanation:** The false claim is: Contiguous file allocation has no external fragmentation on a busy disk.. Contiguous allocation (files) actually means: A file occupies consecutive disk blocks; directory stores start and length.

### Q40  ·  Intermediate
**Question:** Which statement about **File** is FALSE?

- **A.** A useful way to remember File is that it is not the same as “A CPU register”.
- **B.** A file cannot persist after the process that created it exits.
- **C.** File is correctly understood as: a named logical unit of related information stored by the file system.
- **D.** In this module, File is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A file cannot persist after the process that created it exits.. File actually means: A named logical unit of related information stored by the file system.

### Q41  ·  Intermediate
**Question:** Which statement about **Indexed allocation** is FALSE?

- **A.** Indexed allocation cannot support random access.
- **B.** Indexed allocation is correctly understood as: an index block (or tree of them) holds pointers to data blocks (Unix inodes, NTFS extents as a relative).
- **C.** In this module, Indexed allocation is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Indexed allocation is that it is not the same as “Only a next-pointer in each data block”.

**Answer:** A
**Explanation:** The false claim is: Indexed allocation cannot support random access.. Indexed allocation actually means: An index block (or tree of them) holds pointers to data blocks (Unix inodes, NTFS extents as a relative).

### Q42  ·  Intermediate
**Question:** Which statement about **NAS** is FALSE?

- **A.** NAS is correctly understood as: file-level remote storage accessed over a network (NFS/SMB) as files/directories.
- **B.** A useful way to remember NAS is that it is not the same as “Block-level storage presented as a local disk (typical SAN)”.
- **C.** In this module, NAS is a core idea students must distinguish from nearby terms.
- **D.** NAS is indistinguishable from a SAN because both always export raw SCSI blocks.

**Answer:** D
**Explanation:** The false claim is: NAS is indistinguishable from a SAN because both always export raw SCSI blocks.. NAS actually means: File-level remote storage accessed over a network (NFS/SMB) as files/directories.

### Q43  ·  Intermediate
**Question:** Which statement about **SSTF** is FALSE?

- **A.** SSTF is correctly understood as: serve the request closest to the current head position (greedy).
- **B.** In this module, SSTF is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember SSTF is that it is not the same as “Serve in arrival order”.
- **D.** SSTF cannot starve a far request in pathological streams — it never starves.

**Answer:** D
**Explanation:** The false claim is: SSTF cannot starve a far request in pathological streams — it never starves.. SSTF actually means: Serve the request closest to the current head position (greedy).

### Q44  ·  Intermediate
**Question:** Which statement about **Sequential access** is FALSE?

- **A.** A useful way to remember Sequential access is that it is not the same as “Jumping to an arbitrary offset with equal cost always”.
- **B.** Sequential access is correctly understood as: read/write in order; matching linked allocation and streaming media.
- **C.** In this module, Sequential access is a core idea students must distinguish from nearby terms.
- **D.** Sequential access is impossible on magnetic disks.

**Answer:** D
**Explanation:** The false claim is: Sequential access is impossible on magnetic disks.. Sequential access actually means: Read/write in order; matching linked allocation and streaming media.

### Q45  ·  Intermediate
**Question:** Which statement about **VFS** is FALSE?

- **A.** In this module, VFS is a core idea students must distinguish from nearby terms.
- **B.** VFS requires every disk in the world to use the same on-disk layout.
- **C.** VFS is correctly understood as: a kernel abstraction so open/read/write work across ext4, NFS, FAT via a common inode/file-ops interface.
- **D.** A useful way to remember VFS is that it is not the same as “A user-space GUI file manager”.

**Answer:** B
**Explanation:** The false claim is: VFS requires every disk in the world to use the same on-disk layout.. VFS actually means: A kernel abstraction so open/read/write work across ext4, NFS, FAT via a common inode/file-ops interface.

### Q46  ·  Difficult
**Question:** A Unix inode has direct, single, double, triple indirect pointers mainly to:

- **A.** Support large files without a huge static pointer array in every inode
- **B.** Implement SCAN
- **C.** Store the file name
- **D.** Replace the page table

**Answer:** A
**Explanation:** Tree of block pointers grows with file size.

### Q47  ·  Difficult
**Question:** A file grows slowly for months on a nearly full disk. Contiguous allocation problem:

- **A.** VFS stops working
- **B.** Random access becomes impossible
- **C.** May not find a large enough hole (external fragmentation) / expensive copy to grow
- **D.** Directories cannot name it

**Answer:** C
**Explanation:** Growth is the Achilles heel of pure contiguous files.

### Q48  ·  Difficult
**Question:** A file of 6 data blocks uses linked allocation. How many next-pointer follows to read block 5 (0-based) from the start?

- **A.** 5
- **B.** 1
- **C.** 0
- **D.** 6

**Answer:** A
**Explanation:** Must walk 0→1→2→3→4→5, five follows from the first block.

### Q49  ·  Difficult
**Question:** Database jumps to records in the middle of a 4 GB file. Worst classic method?

- **A.** Pure linked allocation (chain walk)
- **B.** Contiguous if not fragmented
- **C.** Indexed/inode with enough cache
- **D.** Memory-mapped extents

**Answer:** A
**Explanation:** Random access is O(n) along the chain.

### Q50  ·  Difficult
**Question:** LOOK toward 0 (do not go to 0). Same queue from 53. Total movement?

- **A.** 640
- **B.** 208
- **C.** 382
- **D.** 236

**Answer:** B
**Explanation:** 53→37→14 then reverse 65→67→98→122→124→183: 16+23+51+2+31+24+2+59=208.

### Q51  ·  Difficult
**Question:** Lab home directories mounted with NFS from a server. This is:

- **A.** A Type-1 hypervisor
- **B.** NAS (file-level)
- **C.** Contiguous allocation of RAM
- **D.** SAN LUN without a protocol

**Answer:** B
**Explanation:** NFS is a network file system.

### Q52  ·  Difficult
**Question:** Queue 98,183,37,122,14,124,65,67; head at 53. FCFS total head movement?

- **A.** 331
- **B.** 236
- **C.** 208
- **D.** 640

**Answer:** D
**Explanation:** 53→98→183→37→122→14→124→65→67: 45+85+146+85+108+110+59+2=640.

### Q53  ·  Difficult
**Question:** Same queue, C-SCAN toward 199 (include jump 199→0), then 14,37. Total movement?

- **A.** 382
- **B.** 208
- **C.** 236
- **D.** 640

**Answer:** A
**Explanation:** 53→65→67→98→122→124→183→199→0→14→37: 12+2+31+24+2+59+16+199+14+23=382.

### Q54  ·  Difficult
**Question:** Same queue, SSTF from 53. Total movement?

- **A.** 236
- **B.** 382
- **C.** 640
- **D.** 331

**Answer:** A
**Explanation:** 53→65→67→37→14→98→122→124→183: 12+2+30+23+84+24+2+59=236.

### Q55  ·  Difficult
**Question:** Same queue, head 53, SCAN toward 0 on cylinders 0–199. Total movement?

- **A.** 640
- **B.** 208
- **C.** 382
- **D.** 236

**Answer:** D
**Explanation:** 53→37→14→0→65→67→98→122→124→183: 16+23+14+65+2+31+24+2+59=236.

### Q56  ·  Difficult
**Question:** Unix-style inode with 12 direct pointers, 4 KB blocks, 4-byte block addresses. Max file size using directs only?

- **A.** 48 KB
- **B.** 4 KB
- **C.** 4 MB
- **D.** 12 bytes

**Answer:** A
**Explanation:** 12 × 4 KB = 48 KB without indirects.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **NAS** and **SAN**?

- **A.** SAN is file-level.
- **B.** NAS is always Fibre Channel blocks.
- **C.** A USB stick is a SAN fabric.
- **D.** NAS exports files (NFS/SMB); SAN exports blocks (SCSI-like) and the host FS sits on top.

**Answer:** D
**Explanation:** NAS exports files (NFS/SMB); SAN exports blocks (SCSI-like) and the host FS sits on top.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **SCAN** and **LOOK**?

- **A.** SCAN goes to the disk end; LOOK turns around at the last pending request.
- **B.** SCAN never goes toward an end.
- **C.** They produce identical Gantt charts whenever requests exist at both ends.
- **D.** LOOK always hits cylinder 0.

**Answer:** A
**Explanation:** SCAN goes to the disk end; LOOK turns around at the last pending request.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **VFS** and **on-disk ext4 layout**?

- **A.** VFS is a disk format.
- **B.** Applications call ext4 structures directly in portable Unix.
- **C.** VFS is the in-kernel API; ext4 is one implementation of inodes/blocks behind that API.
- **D.** ext4 is only a network protocol.

**Answer:** C
**Explanation:** VFS is the in-kernel API; ext4 is one implementation of inodes/blocks behind that API.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **linked allocation** and **indexed allocation**?

- **A.** Linked is best for random 4 KB reads in the middle of 4 GB.
- **B.** Indexed cannot grow a file.
- **C.** Linked follows next pointers; indexed stores pointers in an index (inode) for O(1)-ish random access.
- **D.** FAT cannot be seen as a form of linked mapping.

**Answer:** C
**Explanation:** Linked follows next pointers; indexed stores pointers in an index (inode) for O(1)-ish random access.

### Q61  ·  Difficult
**Question:** Which statement about **Directory** is FALSE?

- **A.** Directories cannot contain other directories in a tree-structured FS.
- **B.** In this module, Directory is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Directory is that it is not the same as “A disk platter”.
- **D.** Directory is correctly understood as: a mapping from names to files (and subdirectories), implementing the namespace.

**Answer:** A
**Explanation:** The false claim is: Directories cannot contain other directories in a tree-structured FS.. Directory actually means: A mapping from names to files (and subdirectories), implementing the namespace.

### Q62  ·  Difficult
**Question:** Which statement about **FAT** is FALSE?

- **A.** FAT stores the next-pointer inside every user data block like classic linked allocation only.
- **B.** A useful way to remember FAT is that it is not the same as “A Unix inode tree only”.
- **C.** FAT is correctly understood as: a table of next-block links kept in a reserved disk area (linked allocation with the links pulled out of data blocks).
- **D.** In this module, FAT is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: FAT stores the next-pointer inside every user data block like classic linked allocation only.. FAT actually means: A table of next-block links kept in a reserved disk area (linked allocation with the links pulled out of data blocks).

### Q63  ·  Difficult
**Question:** Which statement about **FCFS disk scheduling** is FALSE?

- **A.** In this module, FCFS disk scheduling is a core idea students must distinguish from nearby terms.
- **B.** FCFS disk scheduling is correctly understood as: service requests in arrival order; simple, may move the head a long way.
- **C.** FCFS disk scheduling is the same as SSTF.
- **D.** A useful way to remember FCFS disk scheduling is that it is not the same as “Always shortest seek next”.

**Answer:** C
**Explanation:** The false claim is: FCFS disk scheduling is the same as SSTF.. FCFS disk scheduling actually means: Service requests in arrival order; simple, may move the head a long way.

### Q64  ·  Difficult
**Question:** Which statement about **LOOK / C-LOOK** is FALSE?

- **A.** LOOK / C-LOOK is correctly understood as: like SCAN/C-SCAN but only as far as the last request, not to the physical end if unused.
- **B.** LOOK always seeks to the last cylinder of the disk even if no request is there.
- **C.** In this module, LOOK / C-LOOK is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember LOOK / C-LOOK is that it is not the same as “Always go to cylinder 0”.

**Answer:** B
**Explanation:** The false claim is: LOOK always seeks to the last cylinder of the disk even if no request is there.. LOOK / C-LOOK actually means: Like SCAN/C-SCAN but only as far as the last request, not to the physical end if unused.

### Q65  ·  Difficult
**Question:** Which statement about **Linked allocation** is FALSE?

- **A.** A useful way to remember Linked allocation is that it is not the same as “All blocks consecutive”.
- **B.** Linked allocation is excellent for random access to the middle of a large file with no extra seeks along the chain.
- **C.** In this module, Linked allocation is a core idea students must distinguish from nearby terms.
- **D.** Linked allocation is correctly understood as: each block holds a pointer to the next; directory stores the first (and maybe last) block.

**Answer:** B
**Explanation:** The false claim is: Linked allocation is excellent for random access to the middle of a large file with no extra seeks along the chain.. Linked allocation actually means: Each block holds a pointer to the next; directory stores the first (and maybe last) block.

### Q66  ·  Difficult
**Question:** Which statement about **Metadata / inode** is FALSE?

- **A.** A useful way to remember Metadata / inode is that it is not the same as “The file’s first data byte only”.
- **B.** Metadata / inode is correctly understood as: on-disk (and cached) attributes: size, owner, timestamps, block pointers — not the data bytes themselves.
- **C.** An inode stores the file’s name as its only attribute and no block pointers.
- **D.** In this module, Metadata / inode is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: An inode stores the file’s name as its only attribute and no block pointers.. Metadata / inode actually means: On-disk (and cached) attributes: size, owner, timestamps, block pointers — not the data bytes themselves.

### Q67  ·  Difficult
**Question:** Which statement about **Random access** is FALSE?

- **A.** Random access is correctly understood as: jump to any offset; efficient with indexed/contiguous, poor with pure linked chains.
- **B.** Unix inodes cannot seek() to the middle of a file.
- **C.** In this module, Random access is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Random access is that it is not the same as “Only allowed on tape”.

**Answer:** B
**Explanation:** The false claim is: Unix inodes cannot seek() to the middle of a file.. Random access actually means: Jump to any offset; efficient with indexed/contiguous, poor with pure linked chains.

### Q68  ·  Difficult
**Question:** Which statement about **SAN** is FALSE?

- **A.** In this module, SAN is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember SAN is that it is not the same as “An NFS export of directories”.
- **C.** SAN is correctly understood as: a network (often Fibre Channel/iSCSI) presenting block devices; the host runs the file system.
- **D.** On a SAN the storage box, not the host, must always implement the file system.

**Answer:** D
**Explanation:** The false claim is: On a SAN the storage box, not the host, must always implement the file system.. SAN actually means: A network (often Fibre Channel/iSCSI) presenting block devices; the host runs the file system.

### Q69  ·  Difficult
**Question:** Which statement about **SCAN (elevator)** is FALSE?

- **A.** SCAN (elevator) is correctly understood as: head moves toward one end, servicing, then reverses.
- **B.** In this module, SCAN (elevator) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember SCAN (elevator) is that it is not the same as “Jumps to the nearest request only”.
- **D.** SCAN never reverses; it only moves inward.

**Answer:** D
**Explanation:** The false claim is: SCAN never reverses; it only moves inward.. SCAN (elevator) actually means: Head moves toward one end, servicing, then reverses.

### Q70  ·  Difficult
**Question:** Why can SSTF have a higher variance of wait time than SCAN?

- **A.** A distant arrival can be skipped repeatedly while the arm stays in a dense region
- **B.** SSTF always visits the edges
- **C.** SCAN starves the middle
- **D.** FCFS has zero variance always

**Answer:** A
**Explanation:** Local density captures the greedy policy.

### Q71  ·  Difficult
**Question:** Windows laptop mounts a USB FAT32 stick and an NTFS disk with the same open() API. Kernel feature:

- **A.** Banker
- **B.** VFS-style vnode/file-ops switch
- **C.** TLB ASIDs
- **D.** SCAN in user space

**Answer:** B
**Explanation:** One syscall interface, many file systems.

---

## Quick answer key

Q01–A | Q02–B | Q03–A | Q04–A | Q05–B | Q06–A | Q07–C | Q08–D | Q09–B | Q10–D | Q11–B | Q12–A | Q13–B | Q14–C | Q15–D | Q16–A | Q17–C | Q18–A | Q19–C | Q20–A | Q21–C | Q22–C | Q23–A | Q24–A | Q25–A | Q26–B | Q27–A | Q28–C | Q29–B | Q30–B | Q31–B | Q32–B | Q33–D | Q34–A | Q35–A | Q36–D | Q37–D | Q38–D | Q39–B | Q40–B | Q41–A | Q42–D | Q43–D | Q44–D | Q45–B | Q46–A | Q47–C | Q48–A | Q49–A | Q50–B | Q51–B | Q52–D | Q53–A | Q54–A | Q55–D | Q56–A | Q57–D | Q58–A | Q59–C | Q60–C | Q61–A | Q62–A | Q63–C | Q64–B | Q65–B | Q66–C | Q67–B | Q68–D | Q69–D | Q70–A | Q71–B
