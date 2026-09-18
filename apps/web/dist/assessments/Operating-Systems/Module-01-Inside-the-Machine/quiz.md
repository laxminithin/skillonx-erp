# Quiz — Operating Systems — Module 1: Inside the Machine

**Subject:** Operating Systems  
**Module:** Module 1 — Inside the Machine  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** An interrupt vector contains:

- **A.** Java bytecode
- **B.** Handler addresses
- **C.** SCAN queues only
- **D.** User passwords

**Answer:** B
**Explanation:** Indexed jump table of ISRs.

### Q02  ·  Easy
**Question:** System calls are used to:

- **A.** Request OS services from user programs
- **B.** Compile Java
- **C.** Replace the MMU
- **D.** Paint the BIOS logo

**Answer:** A
**Explanation:** Syscalls are the user–kernel service interface.

### Q03  ·  Easy
**Question:** Which component loads the OS kernel at power-on?

- **A.** The bootstrap/bootloader path
- **B.** The disk SCAN scheduler
- **C.** A page-replacement algorithm
- **D.** The ready queue

**Answer:** A
**Explanation:** Boot firmware and bootloader load the kernel.

### Q04  ·  Easy
**Question:** Which option best describes **Bootstrap**?

- **A.** A user login prompt only.
- **B.** Formatting the disk before every boot.
- **C.** Compiling the kernel from source at every power-on as a required step.
- **D.** The firmware/bootloader sequence that loads the kernel into memory and starts it.

**Answer:** D
**Explanation:** Bootstrap: The firmware/bootloader sequence that loads the kernel into memory and starts it.

### Q05  ·  Easy
**Question:** Which option best describes **Interrupt**?

- **A.** A compiler optimisation.
- **B.** A synchronous jump in the user program’s switch statement.
- **C.** An asynchronous signal that transfers control to a handler via the interrupt vector.
- **D.** A disk formatting utility.

**Answer:** C
**Explanation:** Interrupt: An asynchronous signal that transfers control to a handler via the interrupt vector.

### Q06  ·  Easy
**Question:** Which option best describes **Microkernel**?

- **A.** A small kernel providing IPC, scheduling and basic I/O; other services run as user servers.
- **B.** A type-2 hypervisor.
- **C.** A kernel that includes every driver in ring 0 by definition.
- **D.** MS-DOS without protection.

**Answer:** A
**Explanation:** Microkernel: A small kernel providing IPC, scheduling and basic I/O; other services run as user servers.

### Q07  ·  Easy
**Question:** Which option best describes **Operating system**?

- **A.** A program that manages hardware and provides an environment for executing applications.
- **B.** The CPU arithmetic unit.
- **C.** A single device driver with no policy.
- **D.** A user-level spreadsheet.

**Answer:** A
**Explanation:** Operating system: A program that manages hardware and provides an environment for executing applications.

### Q08  ·  Easy
**Question:** Which option best describes **System call**?

- **A.** A BIOS beep.
- **B.** The controlled interface by which a user program requests an OS service.
- **C.** A linker flag.
- **D.** A Java method call that never enters the kernel.

**Answer:** B
**Explanation:** System call: The controlled interface by which a user program requests an OS service.

### Q09  ·  Easy
**Question:** Which option best describes **Type-1 hypervisor**?

- **A.** A process in a host OS such as a typical desktop VirtualBox install.
- **B.** A VMM that runs on bare metal and hosts guest OSes (e.g. ESXi, Hyper-V parent).
- **C.** A microkernel IPC message.
- **D.** The BIOS only.

**Answer:** B
**Explanation:** Type-1 hypervisor: A VMM that runs on bare metal and hosts guest OSes (e.g. ESXi, Hyper-V parent).

### Q10  ·  Easy
**Question:** Which sequence correctly describes **bootstrap (simplified)**?

- **A.** user mode first, then firmware
- **B.** DMA loads Word documents as the kernel
- **C.** init runs before the kernel is loaded
- **D.** power-on firmware/POST → bootloader from boot device → load kernel → kernel init → start first process (e.g. init/systemd)

**Answer:** D
**Explanation:** Correct sequence for bootstrap (simplified): power-on firmware/POST → bootloader from boot device → load kernel → kernel init → start first process (e.g. init/systemd)

### Q11  ·  Easy
**Question:** Which sequence correctly describes **interrupt handling**?

- **A.** handler runs in user mode without saving PC
- **B.** finish/steal current instruction → save state → index vector → handler in kernel mode → restore/return
- **C.** disable the mode bit permanently
- **D.** skip the vector and jump to main()

**Answer:** B
**Explanation:** Correct sequence for interrupt handling: finish/steal current instruction → save state → index vector → handler in kernel mode → restore/return

### Q12  ·  Intermediate
**Question:** A looping while(true); user program still returns to the OS because of:

- **A.** The compiler inserting returns
- **B.** DMA stealing the program counter
- **C.** The BIOS resetting RAM
- **D.** Timer interrupts enabling preemption

**Answer:** D
**Explanation:** The timer gives the kernel a chance to schedule.

### Q13  ·  Intermediate
**Question:** A privileged instruction executed in user mode typically causes:

- **A.** A trap to the OS
- **B.** DMA to start
- **C.** A compile error at runtime of javac
- **D.** Silent success

**Answer:** A
**Explanation:** The CPU traps; the OS may kill or emulate.

### Q14  ·  Intermediate
**Question:** A student program executes HLT (halt). On a dual-mode CPU this should:

- **A.** Trap as a privileged instruction in user mode
- **B.** Switch the compiler off
- **C.** Be ignored
- **D.** Halt the whole laboratory immediately

**Answer:** A
**Explanation:** HLT is privileged; user mode traps to the OS.

### Q15  ·  Intermediate
**Question:** DMA is preferred for large disk transfers because:

- **A.** The CPU is free during the bulk copy and is interrupted once
- **B.** Interrupts are disabled forever
- **C.** Virtual memory is turned off
- **D.** The CPU copies each byte faster than the device

**Answer:** A
**Explanation:** DMA overlaps CPU work with I/O.

### Q16  ·  Intermediate
**Question:** MINIX-style file servers in user space talking to a small kernel via messages illustrate:

- **A.** A monolithic kernel with no IPC
- **B.** A bootloader
- **C.** A microkernel
- **D.** MS-DOS real mode only

**Answer:** C
**Explanation:** Servers + IPC + tiny kernel = microkernel.

### Q17  ·  Intermediate
**Question:** The main reason for dual mode is:

- **A.** Larger disk sectors
- **B.** Faster addition of integers
- **C.** Protection of the OS and isolation of processes
- **D.** Colourful GUIs

**Answer:** C
**Explanation:** Mode bits stop apps from taking over hardware.

### Q18  ·  Intermediate
**Question:** VirtualBox running as a process on Windows hosting Ubuntu is:

- **A.** Dual-mode hardware itself
- **B.** A Type-2 hypervisor
- **C.** A Type-1 hypervisor
- **D.** A microkernel IPC path

**Answer:** B
**Explanation:** Hosted VMM is Type-2.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **Type-1 hypervisor** and **Type-2 hypervisor**?

- **A.** Type-1 cannot run guests.
- **B.** VirtualBox on Ubuntu is Type-1.
- **C.** Type-1 sits on hardware; Type-2 is a host-OS process that virtualises guests.
- **D.** Type-2 is bare metal.

**Answer:** C
**Explanation:** Type-1 sits on hardware; Type-2 is a host-OS process that virtualises guests.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **monolithic kernel** and **microkernel**?

- **A.** Monolithic runs many services in kernel space; microkernel pushes servers to user space and uses IPC.
- **B.** Monolithic kernels cannot have modules.
- **C.** They are identical if both are written in C.
- **D.** Microkernels always include a full in-kernel VFS.

**Answer:** A
**Explanation:** Monolithic runs many services in kernel space; microkernel pushes servers to user space and uses IPC.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **programmed I/O** and **DMA**?

- **A.** DMA cannot move disk blocks.
- **B.** They have identical CPU cost.
- **C.** PIO uses the CPU for every word; DMA offloads bulk transfer and interrupts at the end.
- **D.** PIO never uses the CPU.

**Answer:** C
**Explanation:** PIO uses the CPU for every word; DMA offloads bulk transfer and interrupts at the end.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **user mode** and **kernel mode**?

- **A.** Kernel mode cannot handle interrupts.
- **B.** They differ only in GUI colour.
- **C.** User mode forbids privileged instructions; kernel mode may execute them.
- **D.** User mode can halt the CPU.

**Answer:** C
**Explanation:** User mode forbids privileged instructions; kernel mode may execute them.

### Q23  ·  Intermediate
**Question:** Which option best describes **DMA**?

- **A.** A page table walk.
- **B.** A device that transfers blocks between memory and I/O with a single interrupt at completion.
- **C.** CPU programmed I/O of each byte with no interrupt.
- **D.** The bootstrap ROM.

**Answer:** B
**Explanation:** DMA: A device that transfers blocks between memory and I/O with a single interrupt at completion.

### Q24  ·  Intermediate
**Question:** Which option best describes **Dual mode**?

- **A.** Hardware user/kernel (supervisor) modes so privileged instructions cannot be issued by apps.
- **B.** A GUI theme switch.
- **C.** Two CPU cores required by the OS specification.
- **D.** Two copies of every file.

**Answer:** A
**Explanation:** Dual mode: Hardware user/kernel (supervisor) modes so privileged instructions cannot be issued by apps.

### Q25  ·  Intermediate
**Question:** Which option best describes **Hybrid kernel**?

- **A.** A design mixing a larger kernel with some modular/user-level services (e.g. Windows NT family).
- **B.** A BIOS replacement.
- **C.** A kernel that cannot support virtual memory.
- **D.** A CPU without dual mode.

**Answer:** A
**Explanation:** Hybrid kernel: A design mixing a larger kernel with some modular/user-level services (e.g. Windows NT family).

### Q26  ·  Intermediate
**Question:** Which option best describes **Interrupt vector**?

- **A.** A table of handler addresses indexed by interrupt number.
- **B.** The BIOS boot sector payload.
- **C.** The ready queue of processes.
- **D.** A page table.

**Answer:** A
**Explanation:** Interrupt vector: A table of handler addresses indexed by interrupt number.

### Q27  ·  Intermediate
**Question:** Which option best describes **Monolithic kernel**?

- **A.** A hypervisor only.
- **B.** A kernel where most services (FS, scheduling, drivers) run in one privileged address space.
- **C.** A bootloader.
- **D.** A kernel with every service in a user-level server.

**Answer:** B
**Explanation:** Monolithic kernel: A kernel where most services (FS, scheduling, drivers) run in one privileged address space.

### Q28  ·  Intermediate
**Question:** Which option best describes **Privileged instruction**?

- **A.** Loading a general-purpose register with a constant.
- **B.** add of two user integers.
- **C.** An instruction legal only in kernel mode, e.g. HLT, I/O, clearing the mode bit.
- **D.** A floating-point multiply.

**Answer:** C
**Explanation:** Privileged instruction: An instruction legal only in kernel mode, e.g. HLT, I/O, clearing the mode bit.

### Q29  ·  Intermediate
**Question:** Which option best describes **System view of OS**?

- **A.** The OS as a resource allocator and control program that prevents errors and misuse.
- **B.** A paint program.
- **C.** The BIOS splash screen only.
- **D.** A Java class library.

**Answer:** A
**Explanation:** System view of OS: The OS as a resource allocator and control program that prevents errors and misuse.

### Q30  ·  Intermediate
**Question:** Which option best describes **System-call interface**?

- **A.** The window manager only.
- **B.** A library/API (often libc) that traps into the kernel with a service number and arguments.
- **C.** A makefile.
- **D.** A raw JMP to a driver with no mode switch.

**Answer:** B
**Explanation:** System-call interface: A library/API (often libc) that traps into the kernel with a service number and arguments.

### Q31  ·  Intermediate
**Question:** Which option best describes **Timer interrupt**?

- **A.** A disk seek complete signal only.
- **B.** A syscall from printf.
- **C.** A page-fault handler alias.
- **D.** A periodic interrupt used to regain control, implement time-sharing and prevent a process hogging the CPU.

**Answer:** D
**Explanation:** Timer interrupt: A periodic interrupt used to regain control, implement time-sharing and prevent a process hogging the CPU.

### Q32  ·  Intermediate
**Question:** Which option best describes **Trap / exception**?

- **A.** A DMA completion that is never synchronous.
- **B.** A synchronous transfer to the kernel caused by a program action (syscall, fault, divide-by-zero).
- **C.** A timer tick from hardware only.
- **D.** A GUI click.

**Answer:** B
**Explanation:** Trap / exception: A synchronous transfer to the kernel caused by a program action (syscall, fault, divide-by-zero).

### Q33  ·  Intermediate
**Question:** Which option best describes **User view of OS**?

- **A.** Convenience: a convenient, easy-to-use interface to run programs and devices.
- **B.** Hiding the existence of system calls from the kernel.
- **C.** Maximising device utilisation as the only goal.
- **D.** Replacing the CPU scheduler with a compiler.

**Answer:** A
**Explanation:** User view of OS: Convenience: a convenient, easy-to-use interface to run programs and devices.

### Q34  ·  Intermediate
**Question:** Which option best describes **Virtual machine**?

- **A.** A Java interface.
- **B.** An isolated duplicate of a machine, implemented by a VMM/hypervisor using trapping and emulation.
- **C.** A disk partition label only.
- **D.** A physical second CPU required per guest.

**Answer:** B
**Explanation:** Virtual machine: An isolated duplicate of a machine, implemented by a VMM/hypervisor using trapping and emulation.

### Q35  ·  Intermediate
**Question:** Which sequence correctly describes **mode switch on interrupt**?

- **A.** software flips the mode bit in user mode without a trap
- **B.** the compiler sets the mode bit
- **C.** DMA sets user mode only
- **D.** hardware sets kernel mode, saves PC/PSW → OS handler → before iret, restore user mode

**Answer:** D
**Explanation:** Correct sequence for mode switch on interrupt: hardware sets kernel mode, saves PC/PSW → OS handler → before iret, restore user mode

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **system-call path**?

- **A.** user library stub → trap/syscall instruction → kernel dispatch on number → do the service → return to user mode
- **B.** JMP into the driver in user mode
- **C.** bootstrap the kernel again
- **D.** compiler inlines the disk firmware

**Answer:** A
**Explanation:** Correct sequence for system-call path: user library stub → trap/syscall instruction → kernel dispatch on number → do the service → return to user mode

### Q37  ·  Intermediate
**Question:** Which statement about **Dual mode** is FALSE?

- **A.** In this module, Dual mode is a core idea students must distinguish from nearby terms.
- **B.** User mode is allowed to disable interrupts and program the MMU freely.
- **C.** Dual mode is correctly understood as: hardware user/kernel (supervisor) modes so privileged instructions cannot be issued by apps.
- **D.** A useful way to remember Dual mode is that it is not the same as “Two CPU cores required by the OS specification”.

**Answer:** B
**Explanation:** The false claim is: User mode is allowed to disable interrupts and program the MMU freely.. Dual mode actually means: Hardware user/kernel (supervisor) modes so privileged instructions cannot be issued by apps.

### Q38  ·  Intermediate
**Question:** Which statement about **Interrupt vector** is FALSE?

- **A.** In this module, Interrupt vector is a core idea students must distinguish from nearby terms.
- **B.** The interrupt vector stores process register snapshots, not handler addresses.
- **C.** Interrupt vector is correctly understood as: a table of handler addresses indexed by interrupt number.
- **D.** A useful way to remember Interrupt vector is that it is not the same as “The ready queue of processes”.

**Answer:** B
**Explanation:** The false claim is: The interrupt vector stores process register snapshots, not handler addresses.. Interrupt vector actually means: A table of handler addresses indexed by interrupt number.

### Q39  ·  Intermediate
**Question:** Which statement about **Interrupt** is FALSE?

- **A.** Interrupts are ignored until the current user process terminates.
- **B.** Interrupt is correctly understood as: an asynchronous signal that transfers control to a handler via the interrupt vector.
- **C.** In this module, Interrupt is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Interrupt is that it is not the same as “A synchronous jump in the user program’s switch statement”.

**Answer:** A
**Explanation:** The false claim is: Interrupts are ignored until the current user process terminates.. Interrupt actually means: An asynchronous signal that transfers control to a handler via the interrupt vector.

### Q40  ·  Intermediate
**Question:** Which statement about **Microkernel** is FALSE?

- **A.** A useful way to remember Microkernel is that it is not the same as “A kernel that includes every driver in ring 0 by definition”.
- **B.** In this module, Microkernel is a core idea students must distinguish from nearby terms.
- **C.** Microkernel is correctly understood as: a small kernel providing IPC, scheduling and basic I/O; other services run as user servers.
- **D.** Microkernels execute device drivers in kernel mode only, never as user processes.

**Answer:** D
**Explanation:** The false claim is: Microkernels execute device drivers in kernel mode only, never as user processes.. Microkernel actually means: A small kernel providing IPC, scheduling and basic I/O; other services run as user servers.

### Q41  ·  Intermediate
**Question:** Which statement about **Operating system** is FALSE?

- **A.** A useful way to remember Operating system is that it is not the same as “A user-level spreadsheet”.
- **B.** An OS is only a GUI skin and is not involved in I/O or CPU allocation.
- **C.** Operating system is correctly understood as: a program that manages hardware and provides an environment for executing applications.
- **D.** In this module, Operating system is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: An OS is only a GUI skin and is not involved in I/O or CPU allocation.. Operating system actually means: A program that manages hardware and provides an environment for executing applications.

### Q42  ·  Intermediate
**Question:** Which statement about **System view of OS** is FALSE?

- **A.** In this module, System view of OS is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember System view of OS is that it is not the same as “A paint program”.
- **C.** System view of OS is correctly understood as: the OS as a resource allocator and control program that prevents errors and misuse.
- **D.** From the system view the OS never allocates CPU, memory or I/O.

**Answer:** D
**Explanation:** The false claim is: From the system view the OS never allocates CPU, memory or I/O.. System view of OS actually means: The OS as a resource allocator and control program that prevents errors and misuse.

### Q43  ·  Intermediate
**Question:** Which statement about **System-call interface** is FALSE?

- **A.** System-call interface is correctly understood as: a library/API (often libc) that traps into the kernel with a service number and arguments.
- **B.** In this module, System-call interface is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember System-call interface is that it is not the same as “A raw JMP to a driver with no mode switch”.
- **D.** User programs typically invoke kernel internals by jumping to driver code with no trap.

**Answer:** D
**Explanation:** The false claim is: User programs typically invoke kernel internals by jumping to driver code with no trap.. System-call interface actually means: A library/API (often libc) that traps into the kernel with a service number and arguments.

### Q44  ·  Intermediate
**Question:** Which statement about **Timer interrupt** is FALSE?

- **A.** A useful way to remember Timer interrupt is that it is not the same as “A disk seek complete signal only”.
- **B.** Timer interrupt is correctly understood as: a periodic interrupt used to regain control, implement time-sharing and prevent a process hogging the CPU.
- **C.** In this module, Timer interrupt is a core idea students must distinguish from nearby terms.
- **D.** Without a timer, a looping user process can still be preempted by the OS using only software.

**Answer:** D
**Explanation:** The false claim is: Without a timer, a looping user process can still be preempted by the OS using only software.. Timer interrupt actually means: A periodic interrupt used to regain control, implement time-sharing and prevent a process hogging the CPU.

### Q45  ·  Intermediate
**Question:** Which statement about **Virtual machine** is FALSE?

- **A.** Virtual machine is correctly understood as: an isolated duplicate of a machine, implemented by a VMM/hypervisor using trapping and emulation.
- **B.** A useful way to remember Virtual machine is that it is not the same as “A Java interface”.
- **C.** In this module, Virtual machine is a core idea students must distinguish from nearby terms.
- **D.** A VM lets the guest issue real privileged instructions on the host CPU with no hypervisor.

**Answer:** D
**Explanation:** The false claim is: A VM lets the guest issue real privileged instructions on the host CPU with no hypervisor.. Virtual machine actually means: An isolated duplicate of a machine, implemented by a VMM/hypervisor using trapping and emulation.

### Q46  ·  Difficult
**Question:** A 32-bit processor has a virtual address space of how many bytes if every address is byte-addressable?

- **A.** 2 GB
- **B.** 32 GB
- **C.** 64 KB
- **D.** 4 GB

**Answer:** D
**Explanation:** 2^32 = 4,294,967,296 bytes = 4 GiB.

### Q47  ·  Difficult
**Question:** A disk DMA copies a 4 KB block. The CPU is interrupted once at the end. How many completion interrupts for 8 such blocks?

- **A.** 4
- **B.** 8
- **C.** 4096
- **D.** 1

**Answer:** B
**Explanation:** One interrupt per completed DMA transfer: 8.

### Q48  ·  Difficult
**Question:** A guest OS in a VM executes a privileged I/O instruction. What must the VMM do?

- **A.** Trap/emulate (or use hardware assists) so the host devices stay isolated
- **B.** Let it program the real NIC unchecked
- **C.** Reboot the host
- **D.** Switch off dual mode on the host

**Answer:** A
**Explanation:** Popek–Goldberg: sensitive instructions trap to the hypervisor.

### Q49  ·  Difficult
**Question:** A syscall ABI uses a 1-byte service number. How many distinct syscall numbers can it encode?

- **A.** 256
- **B.** 128
- **C.** 8
- **D.** 16

**Answer:** A
**Explanation:** 2^8 = 256 distinct numbers.

### Q50  ·  Difficult
**Question:** A timer interrupts every 10 ms. How many timer interrupts occur in 1 second?

- **A.** 1000
- **B.** 10
- **C.** 50
- **D.** 100

**Answer:** D
**Explanation:** 1 s / 0.010 s = 100 interrupts.

### Q51  ·  Difficult
**Question:** An interrupt vector has 256 entries of 4-byte addresses. How large is the table?

- **A.** 1 KB
- **B.** 512 bytes
- **C.** 256 bytes
- **D.** 4 KB

**Answer:** A
**Explanation:** 256 × 4 = 1024 bytes = 1 KB.

### Q52  ·  Difficult
**Question:** Dual mode needs at least how many hardware modes (user vs supervisor)?

- **A.** 2
- **B.** 8
- **C.** 1
- **D.** 32

**Answer:** A
**Explanation:** A mode bit distinguishes at least user and kernel.

### Q53  ·  Difficult
**Question:** During boot, firmware finds a bootloader, which loads the kernel image, which then initialises devices. This sequence is:

- **A.** A context switch between two apps
- **B.** A system call from a user shell
- **C.** Bootstrap / boot
- **D.** A page fault

**Answer:** C
**Explanation:** Cold start loads the kernel before any user process.

### Q54  ·  Difficult
**Question:** Kernel mode bit is 0, user is 1. After a trap the hardware sets the bit to kernel. What value is it while the handler runs?

- **A.** 0
- **B.** 1
- **C.** 2
- **D.** undefined always

**Answer:** A
**Explanation:** Handler runs privileged, mode bit 0 in this encoding.

### Q55  ·  Difficult
**Question:** Linux loads drivers as modules but still runs most services in kernel space. This is closest to:

- **A.** A Type-2 hypervisor
- **B.** A monolithic (modular) kernel
- **C.** No kernel at all
- **D.** A pure microkernel with only IPC in ring 0

**Answer:** B
**Explanation:** Modules do not make it a microkernel.

### Q56  ·  Difficult
**Question:** VMware ESXi running directly on a lab server hosting three guest OSes is:

- **A.** Bootstrap firmware of the guest
- **B.** A Type-1 hypervisor
- **C.** A system call table
- **D.** A Type-2 hypervisor only

**Answer:** B
**Explanation:** Bare-metal VMM is Type-1.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **OS as resource allocator** and **OS as control program**?

- **A.** Control program only paints windows.
- **B.** The two views contradict dual mode.
- **C.** Allocator shares CPU/memory/devices fairly; control program prevents errors and unauthorised access.
- **D.** Allocator never schedules the CPU.

**Answer:** C
**Explanation:** Allocator shares CPU/memory/devices fairly; control program prevents errors and unauthorised access.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **bootstrap** and **system call**?

- **A.** Syscalls load the kernel from disk at power-on.
- **B.** Bootstrap is invoked by printf.
- **C.** They are the same trap.
- **D.** Bootstrap loads and starts the kernel at power-on; syscalls are how running programs request services.

**Answer:** D
**Explanation:** Bootstrap loads and starts the kernel at power-on; syscalls are how running programs request services.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **interrupt** and **trap**?

- **A.** Interrupts are always caused by divide-by-zero.
- **B.** Traps never enter the kernel.
- **C.** Interrupts are typically asynchronous device/timer events; traps are synchronous with the instruction stream.
- **D.** They use no vector table.

**Answer:** C
**Explanation:** Interrupts are typically asynchronous device/timer events; traps are synchronous with the instruction stream.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **system call** and **ordinary procedure call**?

- **A.** A syscall changes mode via a trap and enters the kernel; a procedure call stays in the process.
- **B.** Syscalls never copy arguments.
- **C.** They have the same cost.
- **D.** Procedure calls switch to kernel mode.

**Answer:** A
**Explanation:** A syscall changes mode via a trap and enters the kernel; a procedure call stays in the process.

### Q61  ·  Difficult
**Question:** Which statement about **Bootstrap** is FALSE?

- **A.** A useful way to remember Bootstrap is that it is not the same as “A user login prompt only”.
- **B.** Bootstrap is correctly understood as: the firmware/bootloader sequence that loads the kernel into memory and starts it.
- **C.** Bootstrap begins after the kernel is already running user processes.
- **D.** In this module, Bootstrap is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Bootstrap begins after the kernel is already running user processes.. Bootstrap actually means: The firmware/bootloader sequence that loads the kernel into memory and starts it.

### Q62  ·  Difficult
**Question:** Which statement about **DMA** is FALSE?

- **A.** DMA is correctly understood as: a device that transfers blocks between memory and I/O with a single interrupt at completion.
- **B.** DMA requires the CPU to copy every byte of a disk block into a register.
- **C.** In this module, DMA is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember DMA is that it is not the same as “CPU programmed I/O of each byte with no interrupt”.

**Answer:** B
**Explanation:** The false claim is: DMA requires the CPU to copy every byte of a disk block into a register.. DMA actually means: A device that transfers blocks between memory and I/O with a single interrupt at completion.

### Q63  ·  Difficult
**Question:** Which statement about **Hybrid kernel** is FALSE?

- **A.** Hybrid kernel is correctly understood as: a design mixing a larger kernel with some modular/user-level services (e.g. Windows NT family).
- **B.** Hybrid kernels are defined as microkernels with zero kernel-mode code beyond IPC.
- **C.** In this module, Hybrid kernel is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Hybrid kernel is that it is not the same as “A kernel that cannot support virtual memory”.

**Answer:** B
**Explanation:** The false claim is: Hybrid kernels are defined as microkernels with zero kernel-mode code beyond IPC.. Hybrid kernel actually means: A design mixing a larger kernel with some modular/user-level services (e.g. Windows NT family).

### Q64  ·  Difficult
**Question:** Which statement about **Monolithic kernel** is FALSE?

- **A.** Monolithic kernel is correctly understood as: a kernel where most services (FS, scheduling, drivers) run in one privileged address space.
- **B.** In this module, Monolithic kernel is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Monolithic kernel is that it is not the same as “A kernel with every service in a user-level server”.
- **D.** Linux-style kernels put the file system only in user space as a required design.

**Answer:** D
**Explanation:** The false claim is: Linux-style kernels put the file system only in user space as a required design.. Monolithic kernel actually means: A kernel where most services (FS, scheduling, drivers) run in one privileged address space.

### Q65  ·  Difficult
**Question:** Which statement about **Privileged instruction** is FALSE?

- **A.** A useful way to remember Privileged instruction is that it is not the same as “add of two user integers”.
- **B.** I/O instructions are unprivileged so any app may talk to the disk controller.
- **C.** In this module, Privileged instruction is a core idea students must distinguish from nearby terms.
- **D.** Privileged instruction is correctly understood as: an instruction legal only in kernel mode, e.g. HLT, I/O, clearing the mode bit.

**Answer:** B
**Explanation:** The false claim is: I/O instructions are unprivileged so any app may talk to the disk controller.. Privileged instruction actually means: An instruction legal only in kernel mode, e.g. HLT, I/O, clearing the mode bit.

### Q66  ·  Difficult
**Question:** Which statement about **System call** is FALSE?

- **A.** In this module, System call is a core idea students must distinguish from nearby terms.
- **B.** System call is correctly understood as: the controlled interface by which a user program requests an OS service.
- **C.** System calls run entirely in user mode and cannot access kernel data.
- **D.** A useful way to remember System call is that it is not the same as “A Java method call that never enters the kernel”.

**Answer:** C
**Explanation:** The false claim is: System calls run entirely in user mode and cannot access kernel data.. System call actually means: The controlled interface by which a user program requests an OS service.

### Q67  ·  Difficult
**Question:** Which statement about **Trap / exception** is FALSE?

- **A.** A system call is implemented by a privileged instruction executed in user mode without trapping.
- **B.** A useful way to remember Trap / exception is that it is not the same as “A timer tick from hardware only”.
- **C.** Trap / exception is correctly understood as: a synchronous transfer to the kernel caused by a program action (syscall, fault, divide-by-zero).
- **D.** In this module, Trap / exception is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A system call is implemented by a privileged instruction executed in user mode without trapping.. Trap / exception actually means: A synchronous transfer to the kernel caused by a program action (syscall, fault, divide-by-zero).

### Q68  ·  Difficult
**Question:** Which statement about **Type-1 hypervisor** is FALSE?

- **A.** In this module, Type-1 hypervisor is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Type-1 hypervisor is that it is not the same as “A process in a host OS such as a typical desktop VirtualBox install”.
- **C.** Type-1 hypervisor is correctly understood as: a VMM that runs on bare metal and hosts guest OSes (e.g. ESXi, Hyper-V parent).
- **D.** Type-1 hypervisors require a full host OS such as Windows underneath them always.

**Answer:** D
**Explanation:** The false claim is: Type-1 hypervisors require a full host OS such as Windows underneath them always.. Type-1 hypervisor actually means: A VMM that runs on bare metal and hosts guest OSes (e.g. ESXi, Hyper-V parent).

### Q69  ·  Difficult
**Question:** Which statement about **User view of OS** is FALSE?

- **A.** The user view of an OS is identical to the resource-allocator view used by the kernel designer.
- **B.** In this module, User view of OS is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember User view of OS is that it is not the same as “Maximising device utilisation as the only goal”.
- **D.** User view of OS is correctly understood as: convenience: a convenient, easy-to-use interface to run programs and devices.

**Answer:** A
**Explanation:** The false claim is: The user view of an OS is identical to the resource-allocator view used by the kernel designer.. User view of OS actually means: Convenience: a convenient, easy-to-use interface to run programs and devices.

### Q70  ·  Difficult
**Question:** Why can a pure microkernel file read cost more than a monolithic one?

- **A.** More user/kernel crossings and IPC to a file server
- **B.** Microkernels cannot implement files
- **C.** Monolithic kernels never copy data
- **D.** IPC is a privileged instruction apps issue directly

**Answer:** A
**Explanation:** Each message is a context switch/copy; monolithic FS is a function call in kernel space.

### Q71  ·  Difficult
**Question:** You click ‘Save’ in an editor. The data reaches the disk primarily through:

- **A.** A write system call that traps into the kernel/file system
- **B.** The bootstrap ROM
- **C.** A direct user-mode store to the disk MMIO with no OS
- **D.** The JVM verifier

**Answer:** A
**Explanation:** I/O is mediated by syscalls and drivers.

---

## Quick answer key

Q01–B | Q02–A | Q03–A | Q04–D | Q05–C | Q06–A | Q07–A | Q08–B | Q09–B | Q10–D | Q11–B | Q12–D | Q13–A | Q14–A | Q15–A | Q16–C | Q17–C | Q18–B | Q19–C | Q20–A | Q21–C | Q22–C | Q23–B | Q24–A | Q25–A | Q26–A | Q27–B | Q28–C | Q29–A | Q30–B | Q31–D | Q32–B | Q33–A | Q34–B | Q35–D | Q36–A | Q37–B | Q38–B | Q39–A | Q40–D | Q41–B | Q42–D | Q43–D | Q44–D | Q45–D | Q46–D | Q47–B | Q48–A | Q49–A | Q50–D | Q51–A | Q52–A | Q53–C | Q54–A | Q55–B | Q56–B | Q57–C | Q58–D | Q59–C | Q60–A | Q61–C | Q62–B | Q63–B | Q64–D | Q65–B | Q66–C | Q67–A | Q68–D | Q69–A | Q70–A | Q71–A
