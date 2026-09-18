# Quiz — Object Oriented Programming with Java — Module 4: Exceptions and Threads

**Subject:** Object Oriented Programming with Java  
**Module:** Module 4 — Exceptions and Threads  
**Questions:** 71  
**Mix:** 11 Easy · 34 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** The parent of all exception classes used with throw is:

- **A.** Thread
- **B.** Throwable
- **C.** String
- **D.** Runnable

**Answer:** B
**Explanation:** throw requires a Throwable.

### Q02  ·  Easy
**Question:** Which block always executes when leaving a try (short of JVM halt)?

- **A.** finally
- **B.** throws
- **C.** catch
- **D.** throw

**Answer:** A
**Explanation:** finally is the cleanup clause.

### Q03  ·  Easy
**Question:** Which is unchecked?

- **A.** SQLException
- **B.** IOException
- **C.** NullPointerException
- **D.** ClassNotFoundException

**Answer:** C
**Explanation:** NPE is a RuntimeException.

### Q04  ·  Easy
**Question:** Which option best describes **Checked exception**?

- **A.** Errors such as OutOfMemoryError only.
- **B.** A Throwable (not RuntimeException/Error) that the compiler forces you to catch or declare.
- **C.** A boolean flag.
- **D.** Any subclass of RuntimeException.

**Answer:** B
**Explanation:** Checked exception: A Throwable (not RuntimeException/Error) that the compiler forces you to catch or declare.

### Q05  ·  Easy
**Question:** Which option best describes **Custom exception**?

- **A.** A package-info tag.
- **B.** An enum.
- **C.** A class extending Thread.
- **D.** A user class extending Exception (checked) or RuntimeException (unchecked).

**Answer:** D
**Explanation:** Custom exception: A user class extending Exception (checked) or RuntimeException (unchecked).

### Q06  ·  Easy
**Question:** Which option best describes **Exception**?

- **A.** A compiler warning only.
- **B.** An object representing an abnormal condition, thrown and possibly caught.
- **C.** A Thread state.
- **D.** A checked boolean.

**Answer:** B
**Explanation:** Exception: An object representing an abnormal condition, thrown and possibly caught.

### Q07  ·  Easy
**Question:** Which option best describes **finally**?

- **A.** A synonym for catch (Throwable).
- **B.** A thread join.
- **C.** A block that runs only on success.
- **D.** A block that runs on the way out of try/catch whether or not an exception occurred (except JVM abort / infinite stall).

**Answer:** D
**Explanation:** finally: A block that runs on the way out of try/catch whether or not an exception occurred (except JVM abort / infinite stall).

### Q08  ·  Easy
**Question:** Which option best describes **join**?

- **A.** A merge of two exception types.
- **B.** A method that starts a thread.
- **C.** A call that waits for another thread to terminate (or for a timeout).
- **D.** A package name.

**Answer:** C
**Explanation:** join: A call that waits for another thread to terminate (or for a timeout).

### Q09  ·  Easy
**Question:** Which option best describes **start vs run**?

- **A.** start() creates a new call stack and invokes run() on it; calling run() directly stays on the current thread.
- **B.** start() calls run() twice.
- **C.** They are identical.
- **D.** run() always starts a new OS thread.

**Answer:** A
**Explanation:** start vs run: start() creates a new call stack and invokes run() on it; calling run() directly stays on the current thread.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **exception propagation**?

- **A.** throw → matching catch on the stack, else unwind → finally clauses run → if uncaught, thread’s handler / terminate thread
- **B.** Error skips finally always
- **C.** finally skipped on throw
- **D.** catch before throw

**Answer:** A
**Explanation:** Correct sequence for exception propagation: throw → matching catch on the stack, else unwind → finally clauses run → if uncaught, thread’s handler / terminate thread

### Q11  ·  Easy
**Question:** Which sequence correctly describes **join timing (parallel)**?

- **A.** sleep on main starts the workers
- **B.** join each before the next start → elapsed ≈ sum
- **C.** start all workers → join each → elapsed ≈ max(work times) not the sum, if they truly overlap
- **D.** join(0) always waits forever in all JDKs identically to join()

**Answer:** C
**Explanation:** Correct sequence for join timing (parallel): start all workers → join each → elapsed ≈ max(work times) not the sum, if they truly overlap

### Q12  ·  Intermediate
**Question:** A method declares throws IOException but the body never throws. This is:

- **A.** Legal only if the method is abstract
- **B.** Legal; callers still must handle IOException
- **C.** Converted to Error
- **D.** A compile error

**Answer:** B
**Explanation:** throws is a contract; the body may be a conservative declaration.

### Q13  ·  Intermediate
**Question:** A synchronized increment on the same object from two threads. Expected:

- **A.** Deadlock always
- **B.** Still a race because synchronized is advisory
- **C.** Mutual exclusion on that object’s lock; count is consistent if all updates use the same lock
- **D.** The compiler forbids it

**Answer:** C
**Explanation:** The same monitor serialises the critical section.

### Q14  ·  Intermediate
**Question:** Calling start() twice on the same Thread object:

- **A.** Restarts it cleanly
- **B.** Throws IllegalThreadStateException
- **C.** Is ignored
- **D.** Calls run() on main

**Answer:** B
**Explanation:** A Thread is not restartable after it has been started.

### Q15  ·  Intermediate
**Question:** What is the most important distinction between **Exception** and **Error**?

- **A.** Exception is for recoverable conditions; Error is for unrecoverable JVM faults.
- **B.** You must declare Error in throws.
- **C.** Error is a subclass of Exception.
- **D.** They are the same type.

**Answer:** A
**Explanation:** Exception is for recoverable conditions; Error is for unrecoverable JVM faults.

### Q16  ·  Intermediate
**Question:** What is the most important distinction between **start()** and **run()**?

- **A.** start() is inherited from Runnable.
- **B.** They must both be called to spawn twice.
- **C.** run() spawns; start() does not.
- **D.** start() actually spawns the thread; run() is the payload and does not spawn if called directly.

**Answer:** D
**Explanation:** start() actually spawns the thread; run() is the payload and does not spawn if called directly.

### Q17  ·  Intermediate
**Question:** What is the most important distinction between **synchronized method** and **synchronized block**?

- **A.** Methods lock a global JVM mutex only.
- **B.** A synchronized method locks this (or the Class for static); a block can lock a chosen object.
- **C.** They cannot be mixed in one class.
- **D.** Blocks cannot specify a lock object.

**Answer:** B
**Explanation:** A synchronized method locks this (or the Class for static); a block can lock a chosen object.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **throw** and **throws**?

- **A.** They are spelling variants.
- **B.** throws creates the object.
- **C.** throw appears in a method header.
- **D.** throw raises an exception at a statement; throws declares checked exceptions in a signature.

**Answer:** D
**Explanation:** throw raises an exception at a statement; throws declares checked exceptions in a signature.

### Q19  ·  Intermediate
**Question:** Which interface’s run() supplies thread work without extending Thread?

- **A.** Runnable
- **B.** Iterable
- **C.** AutoCloseable
- **D.** Comparable

**Answer:** A
**Explanation:** Runnable is the task abstraction.

### Q20  ·  Intermediate
**Question:** Which option best describes **Error**?

- **A.** A thread interrupt.
- **B.** Serious JVM problems (e.g. OutOfMemoryError) usually not caught by applications.
- **C.** A checked exception for files.
- **D.** A compile-time warning.

**Answer:** B
**Explanation:** Error: Serious JVM problems (e.g. OutOfMemoryError) usually not caught by applications.

### Q21  ·  Intermediate
**Question:** Which option best describes **Runnable**?

- **A.** A class that must extend Thread.
- **B.** An interface with run(); passed to a Thread (or executor) to supply the work.
- **C.** A package.
- **D.** A checked exception.

**Answer:** B
**Explanation:** Runnable: An interface with run(); passed to a Thread (or executor) to supply the work.

### Q22  ·  Intermediate
**Question:** Which option best describes **Scheduler**?

- **A.** The garbage collector only.
- **B.** The exception table.
- **C.** The javac compiler.
- **D.** The component (OS/JVM) that maps RUNNABLE threads onto processors; Java’s exact preemption is platform-dependent.

**Answer:** D
**Explanation:** Scheduler: The component (OS/JVM) that maps RUNNABLE threads onto processors; Java’s exact preemption is platform-dependent.

### Q23  ·  Intermediate
**Question:** Which option best describes **Synchronization**?

- **A.** A package import.
- **B.** Using intrinsic locks (synchronized) so only one thread at a time executes a critical section on that lock.
- **C.** A checked exception.
- **D.** A way to start threads.

**Answer:** B
**Explanation:** Synchronization: Using intrinsic locks (synchronized) so only one thread at a time executes a critical section on that lock.

### Q24  ·  Intermediate
**Question:** Which option best describes **Thread states**?

- **A.** RUNNING as a state distinct from RUNNABLE in java.lang.Thread.State.
- **B.** SLEEPING as an enum constant.
- **C.** NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED as defined by Thread.State.
- **D.** Only NEW and DEAD.

**Answer:** C
**Explanation:** Thread states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED as defined by Thread.State.

### Q25  ·  Intermediate
**Question:** Which option best describes **Thread**?

- **A.** A JVM instruction.
- **B.** A process in another address space always.
- **C.** An independent path of execution; java.lang.Thread is a class that can be subclassed or can wrap a Runnable.
- **D.** A synchronized block.

**Answer:** C
**Explanation:** Thread: An independent path of execution; java.lang.Thread is a class that can be subclassed or can wrap a Runnable.

### Q26  ·  Intermediate
**Question:** Which option best describes **Unchecked exception**?

- **A.** RuntimeException and Error types that javac does not require you to declare.
- **B.** IOException and SQLException.
- **C.** Only Error, not RuntimeException.
- **D.** A checked interface.

**Answer:** A
**Explanation:** Unchecked exception: RuntimeException and Error types that javac does not require you to declare.

### Q27  ·  Intermediate
**Question:** Which option best describes **catch**?

- **A.** A handler clause that names an exception type to handle if thrown in try.
- **B.** A loop control.
- **C.** A keyword that ignores bytecode verification.
- **D.** A method that starts a thread.

**Answer:** A
**Explanation:** catch: A handler clause that names an exception type to handle if thrown in try.

### Q28  ·  Intermediate
**Question:** Which option best describes **sleep**?

- **A.** A static Thread method that pauses the current thread for a timed wait (TIMED_WAITING), without releasing synchronized locks it already holds.
- **B.** A method that releases all monitors.
- **C.** A way to start another thread.
- **D.** An exception type.

**Answer:** A
**Explanation:** sleep: A static Thread method that pauses the current thread for a timed wait (TIMED_WAITING), without releasing synchronized locks it already holds.

### Q29  ·  Intermediate
**Question:** Which option best describes **throw**?

- **A.** A statement that actually raises an exception object.
- **B.** A constructor of Thread.
- **C.** A method declaration clause.
- **D.** A checked annotation.

**Answer:** A
**Explanation:** throw: A statement that actually raises an exception object.

### Q30  ·  Intermediate
**Question:** Which option best describes **throws**?

- **A.** A Thread state.
- **B.** A method clause listing checked exceptions callers must handle or declare.
- **C.** An unchecked-only keyword.
- **D.** A statement inside a block that creates an exception.

**Answer:** B
**Explanation:** throws: A method clause listing checked exceptions callers must handle or declare.

### Q31  ·  Intermediate
**Question:** Which option best describes **try**?

- **A.** A package name.
- **B.** A Thread method.
- **C.** A loop keyword.
- **D.** A block that guards statements so matching catch/finally can handle failure.

**Answer:** D
**Explanation:** try: A block that guards statements so matching catch/finally can handle failure.

### Q32  ·  Intermediate
**Question:** Which sequence correctly describes **starting a worker**?

- **A.** start() twice successfully
- **B.** run() then start()
- **C.** new Thread(runnable) [NEW] → start() [RUNNABLE] → scheduler runs run() → terminate [TERMINATED]
- **D.** join() before start() to launch

**Answer:** C
**Explanation:** Correct sequence for starting a worker: new Thread(runnable) [NEW] → start() [RUNNABLE] → scheduler runs run() → terminate [TERMINATED]

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **synchronized increment**?

- **A.** acquire two monitors in opposite order from two threads as the recommended pattern
- **B.** write n without a monitor
- **C.** acquire monitor → read n → add 1 → write n → release
- **D.** use Thread.sleep to skip the lock

**Answer:** C
**Explanation:** Correct sequence for synchronized increment: acquire monitor → read n → add 1 → write n → release

### Q34  ·  Intermediate
**Question:** Which statement about **Checked exception** is FALSE?

- **A.** IOException is unchecked so javac ignores it.
- **B.** Checked exception is correctly understood as: a Throwable (not RuntimeException/Error) that the compiler forces you to catch or declare.
- **C.** In this module, Checked exception is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Checked exception is that it is not the same as “Any subclass of RuntimeException”.

**Answer:** A
**Explanation:** The false claim is: IOException is unchecked so javac ignores it.. Checked exception actually means: A Throwable (not RuntimeException/Error) that the compiler forces you to catch or declare.

### Q35  ·  Intermediate
**Question:** Which statement about **Error** is FALSE?

- **A.** A useful way to remember Error is that it is not the same as “A checked exception for files”.
- **B.** Error is correctly understood as: serious JVM problems (e.g. OutOfMemoryError) usually not caught by applications.
- **C.** In this module, Error is a core idea students must distinguish from nearby terms.
- **D.** Applications should routinely catch Error and continue as normal.

**Answer:** D
**Explanation:** The false claim is: Applications should routinely catch Error and continue as normal.. Error actually means: Serious JVM problems (e.g. OutOfMemoryError) usually not caught by applications.

### Q36  ·  Intermediate
**Question:** Which statement about **Exception** is FALSE?

- **A.** Exception is correctly understood as: an object representing an abnormal condition, thrown and possibly caught.
- **B.** A useful way to remember Exception is that it is not the same as “A compiler warning only”.
- **C.** Exceptions always terminate the JVM without unwinding the stack.
- **D.** In this module, Exception is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Exceptions always terminate the JVM without unwinding the stack.. Exception actually means: An object representing an abnormal condition, thrown and possibly caught.

### Q37  ·  Intermediate
**Question:** Which statement about **Synchronization** is FALSE?

- **A.** synchronized methods on different objects still share one global JVM lock.
- **B.** Synchronization is correctly understood as: using intrinsic locks (synchronized) so only one thread at a time executes a critical section on that lock.
- **C.** A useful way to remember Synchronization is that it is not the same as “A way to start threads”.
- **D.** In this module, Synchronization is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: synchronized methods on different objects still share one global JVM lock.. Synchronization actually means: Using intrinsic locks (synchronized) so only one thread at a time executes a critical section on that lock.

### Q38  ·  Intermediate
**Question:** Which statement about **Thread** is FALSE?

- **A.** A useful way to remember Thread is that it is not the same as “A process in another address space always”.
- **B.** A Java program can have only one Thread besides main.
- **C.** Thread is correctly understood as: an independent path of execution; java.lang.Thread is a class that can be subclassed or can wrap a Runnable.
- **D.** In this module, Thread is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A Java program can have only one Thread besides main.. Thread actually means: An independent path of execution; java.lang.Thread is a class that can be subclassed or can wrap a Runnable.

### Q39  ·  Intermediate
**Question:** Which statement about **catch** is FALSE?

- **A.** catch is correctly understood as: a handler clause that names an exception type to handle if thrown in try.
- **B.** In this module, catch is a core idea students must distinguish from nearby terms.
- **C.** catch (Exception e) runs before the throw occurs.
- **D.** A useful way to remember catch is that it is not the same as “A method that starts a thread”.

**Answer:** C
**Explanation:** The false claim is: catch (Exception e) runs before the throw occurs.. catch actually means: A handler clause that names an exception type to handle if thrown in try.

### Q40  ·  Intermediate
**Question:** Which statement about **sleep** is FALSE?

- **A.** In this module, sleep is a core idea students must distinguish from nearby terms.
- **B.** Thread.sleep always unlocks synchronized monitors so others may enter.
- **C.** A useful way to remember sleep is that it is not the same as “A method that releases all monitors”.
- **D.** sleep is correctly understood as: a static Thread method that pauses the current thread for a timed wait (TIMED_WAITING), without releasing synchronized locks it already holds.

**Answer:** B
**Explanation:** The false claim is: Thread.sleep always unlocks synchronized monitors so others may enter.. sleep actually means: A static Thread method that pauses the current thread for a timed wait (TIMED_WAITING), without releasing synchronized locks it already holds.

### Q41  ·  Intermediate
**Question:** Which statement about **start vs run** is FALSE?

- **A.** t.run() schedules the thread concurrently with main.
- **B.** A useful way to remember start vs run is that it is not the same as “run() always starts a new OS thread”.
- **C.** start vs run is correctly understood as: start() creates a new call stack and invokes run() on it; calling run() directly stays on the current thread.
- **D.** In this module, start vs run is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: t.run() schedules the thread concurrently with main.. start vs run actually means: start() creates a new call stack and invokes run() on it; calling run() directly stays on the current thread.

### Q42  ·  Intermediate
**Question:** Which statement about **throw** is FALSE?

- **A.** throw is correctly understood as: a statement that actually raises an exception object.
- **B.** throw new E() compiles even if E is a checked exception and the method has no throws and no catch.
- **C.** In this module, throw is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember throw is that it is not the same as “A method declaration clause”.

**Answer:** B
**Explanation:** The false claim is: throw new E() compiles even if E is a checked exception and the method has no throws and no catch.. throw actually means: A statement that actually raises an exception object.

### Q43  ·  Intermediate
**Question:** You need a thread whose class already extends JPanel. You should:

- **A.** Implement Runnable and pass this to new Thread(this)
- **B.** Extend Thread as well (illegal two extends)
- **C.** Call run() from paint()
- **D.** Use throw new Thread()

**Answer:** A
**Explanation:** Runnable allows a single class parent.

### Q44  ·  Intermediate
**Question:** readFile() uses FileReader and might throw IOException. A caller that does not catch it must:

- **A.** Declare throws IOException (or a supertype)
- **B.** Mark the method synchronized
- **C.** Only catch Error
- **D.** Do nothing; IOException is unchecked

**Answer:** A
**Explanation:** IOException is checked.

### Q45  ·  Intermediate
**Question:** try { throw new RuntimeException(); } finally { System.out.print("F"); } catch is absent. What happens?

- **A.** The exception is swallowed
- **B.** F is skipped
- **C.** F prints, then the exception propagates
- **D.** Compile error: catch required

**Answer:** C
**Explanation:** finally runs during unwind of unchecked exceptions too.

### Q46  ·  Difficult
**Question:** A method catches Exception and then catch (IOException) below it. The compiler:

- **A.** Converts it to Error
- **B.** Runs both
- **C.** Rejects the IOException catch as unreachable
- **D.** Accepts it as more specific later

**Answer:** C
**Explanation:** Broader catch first shadows the later one.

### Q47  ·  Difficult
**Question:** Same 200 ms threads but main does a.start(); a.join(); b.start(); b.join(); Approximate minimum time?

- **A.** 100 ms
- **B.** 400 ms
- **C.** 200 ms
- **D.** 0 ms

**Answer:** B
**Explanation:** Sequential joins: ~200+200=400 ms.

### Q48  ·  Difficult
**Question:** Thread A sleeps 200 ms, B sleeps 200 ms. main does a.start(); b.start(); a.join(); b.join(); Approximate minimum time until both joins return?

- **A.** 600 ms
- **B.** 400 ms
- **C.** 0 ms
- **D.** 200 ms

**Answer:** D
**Explanation:** A and B overlap; main waits for the slower, about 200 ms plus overhead, not 400.

### Q49  ·  Difficult
**Question:** Thread is in TIMED_WAITING because of sleep(1000). interrupt() is called. Typical result:

- **A.** Nothing until sleep ends
- **B.** The JVM exits
- **C.** sleep throws InterruptedException and the interrupt status is cleared
- **D.** The thread dies immediately without an exception

**Answer:** C
**Explanation:** Blocking Object/Thread waits throw InterruptedException.

### Q50  ·  Difficult
**Question:** Thread t sleeps 1000 ms. main: t.start(); t.join(0); In Java, join(0) means:

- **A.** start t again
- **B.** wait forever for t to die (same idea as join())
- **C.** wait 0 ms then continue
- **D.** throw IllegalArgumentException

**Answer:** B
**Explanation:** join(0) is specified as waiting forever, like join().

### Q51  ·  Difficult
**Question:** Thread t sleeps 500 ms. main: t.start(); t.join(100); How long does main block on join at most?

- **A.** 500 ms
- **B.** 0 ms
- **C.** 100 ms
- **D.** 600 ms

**Answer:** C
**Explanation:** join(100) times out after 100 ms even if t is still asleep.

### Q52  ·  Difficult
**Question:** Three threads sleep 100, 250 and 400 ms, all start() then each is join()ed from main. Approx. time until the last join returns?

- **A.** 400 ms
- **B.** 100 ms
- **C.** 750 ms
- **D.** 250 ms

**Answer:** A
**Explanation:** They run concurrently; the longest (400 ms) dominates.

### Q53  ·  Difficult
**Question:** Two threads, lock order: T1 locks A then B; T2 locks B then A. This can cause:

- **A.** A deadlock (Coffman circular wait on monitors)
- **B.** A checked exception
- **C.** The JVM to reject synchronized
- **D.** Guaranteed fairness

**Answer:** A
**Explanation:** Inconsistent lock ordering is a classic deadlock.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **Thread subclass** and **Runnable**?

- **A.** You cannot pass Runnable to new Thread(r).
- **B.** Runnable cannot run on a Thread.
- **C.** Subclassing Thread couples work to the worker; Runnable separates the task and allows extending another class.
- **D.** They both require extending Thread.

**Answer:** C
**Explanation:** Subclassing Thread couples work to the worker; Runnable separates the task and allows extending another class.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **checked** and **unchecked exception**?

- **A.** They are both Errors.
- **B.** Unchecked must be declared.
- **C.** Checked must be caught or declared; unchecked (RuntimeException/Error) need not.
- **D.** Checked includes NullPointerException.

**Answer:** C
**Explanation:** Checked must be caught or declared; unchecked (RuntimeException/Error) need not.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **join()** and **join(ms)**?

- **A.** join(ms) ignores the timeout if the thread is RUNNABLE.
- **B.** join(ms) starts the thread after ms.
- **C.** join() times out after 0 ms always.
- **D.** join() waits forever for death; join(ms) waits at most ms milliseconds.

**Answer:** D
**Explanation:** join() waits forever for death; join(ms) waits at most ms milliseconds.

### Q57  ·  Difficult
**Question:** What is the most important distinction between **sleep** and **wait**?

- **A.** They are identical pauses.
- **B.** wait is static on Thread.
- **C.** sleep releases the intrinsic lock.
- **D.** sleep is Thread.static and keeps the monitor; wait is Object and releases the monitor until notify.

**Answer:** D
**Explanation:** sleep is Thread.static and keeps the monitor; wait is Object and releases the monitor until notify.

### Q58  ·  Difficult
**Question:** Which statement about **Custom exception** is FALSE?

- **A.** A useful way to remember Custom exception is that it is not the same as “A class extending Thread”.
- **B.** In this module, Custom exception is a core idea students must distinguish from nearby terms.
- **C.** Custom exceptions cannot have constructors or messages.
- **D.** Custom exception is correctly understood as: a user class extending Exception (checked) or RuntimeException (unchecked).

**Answer:** C
**Explanation:** The false claim is: Custom exceptions cannot have constructors or messages.. Custom exception actually means: A user class extending Exception (checked) or RuntimeException (unchecked).

### Q59  ·  Difficult
**Question:** Which statement about **Runnable** is FALSE?

- **A.** In this module, Runnable is a core idea students must distinguish from nearby terms.
- **B.** Implementing Runnable automatically starts the thread without new Thread(...).start().
- **C.** Runnable is correctly understood as: an interface with run(); passed to a Thread (or executor) to supply the work.
- **D.** A useful way to remember Runnable is that it is not the same as “A class that must extend Thread”.

**Answer:** B
**Explanation:** The false claim is: Implementing Runnable automatically starts the thread without new Thread(...).start().. Runnable actually means: An interface with run(); passed to a Thread (or executor) to supply the work.

### Q60  ·  Difficult
**Question:** Which statement about **Scheduler** is FALSE?

- **A.** In this module, Scheduler is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Scheduler is that it is not the same as “The javac compiler”.
- **C.** Java requires a strictly round-robin scheduler with a user-set quantum in the language specification.
- **D.** Scheduler is correctly understood as: the component (OS/JVM) that maps RUNNABLE threads onto processors; Java’s exact preemption is platform-dependent.

**Answer:** C
**Explanation:** The false claim is: Java requires a strictly round-robin scheduler with a user-set quantum in the language specification.. Scheduler actually means: The component (OS/JVM) that maps RUNNABLE threads onto processors; Java’s exact preemption is platform-dependent.

### Q61  ·  Difficult
**Question:** Which statement about **Thread states** is FALSE?

- **A.** Java’s Thread.State includes a separate RUNNING constant besides RUNNABLE.
- **B.** A useful way to remember Thread states is that it is not the same as “RUNNING as a state distinct from RUNNABLE in java.lang.Thread.State”.
- **C.** In this module, Thread states is a core idea students must distinguish from nearby terms.
- **D.** Thread states is correctly understood as: nEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED as defined by Thread.State.

**Answer:** A
**Explanation:** The false claim is: Java’s Thread.State includes a separate RUNNING constant besides RUNNABLE.. Thread states actually means: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED as defined by Thread.State.

### Q62  ·  Difficult
**Question:** Which statement about **Unchecked exception** is FALSE?

- **A.** NullPointerException must be listed in throws or the program will not compile.
- **B.** In this module, Unchecked exception is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Unchecked exception is that it is not the same as “IOException and SQLException”.
- **D.** Unchecked exception is correctly understood as: runtimeException and Error types that javac does not require you to declare.

**Answer:** A
**Explanation:** The false claim is: NullPointerException must be listed in throws or the program will not compile.. Unchecked exception actually means: RuntimeException and Error types that javac does not require you to declare.

### Q63  ·  Difficult
**Question:** Which statement about **finally** is FALSE?

- **A.** finally is skipped when the try block returns normally.
- **B.** A useful way to remember finally is that it is not the same as “A block that runs only on success”.
- **C.** finally is correctly understood as: a block that runs on the way out of try/catch whether or not an exception occurred (except JVM abort / infinite stall).
- **D.** In this module, finally is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: finally is skipped when the try block returns normally.. finally actually means: A block that runs on the way out of try/catch whether or not an exception occurred (except JVM abort / infinite stall).

### Q64  ·  Difficult
**Question:** Which statement about **join** is FALSE?

- **A.** join() starts the other thread if it has not been started.
- **B.** join is correctly understood as: a call that waits for another thread to terminate (or for a timeout).
- **C.** In this module, join is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember join is that it is not the same as “A method that starts a thread”.

**Answer:** A
**Explanation:** The false claim is: join() starts the other thread if it has not been started.. join actually means: A call that waits for another thread to terminate (or for a timeout).

### Q65  ·  Difficult
**Question:** Which statement about **throws** is FALSE?

- **A.** throws is required on every method that might throw a NullPointerException.
- **B.** throws is correctly understood as: a method clause listing checked exceptions callers must handle or declare.
- **C.** A useful way to remember throws is that it is not the same as “A statement inside a block that creates an exception”.
- **D.** In this module, throws is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: throws is required on every method that might throw a NullPointerException.. throws actually means: A method clause listing checked exceptions callers must handle or declare.

### Q66  ·  Difficult
**Question:** Which statement about **try** is FALSE?

- **A.** In this module, try is a core idea students must distinguish from nearby terms.
- **B.** try is correctly understood as: a block that guards statements so matching catch/finally can handle failure.
- **C.** try can be used without catch or finally (bare try) in classic Java.
- **D.** A useful way to remember try is that it is not the same as “A loop keyword”.

**Answer:** C
**Explanation:** The false claim is: try can be used without catch or finally (bare try) in classic Java.. try actually means: A block that guards statements so matching catch/finally can handle failure.

### Q67  ·  Difficult
**Question:** Why does Thread.sleep not release a synchronized lock the thread already holds?

- **A.** The JLS forbids TIMED_WAITING
- **B.** sleep is an instance method on Object
- **C.** sleep is not specified to exit the monitor; the thread remains the owner while timed-waiting
- **D.** sleep is not a real pause

**Answer:** C
**Explanation:** Only wait/notify (and similar) drop the intrinsic lock.

### Q68  ·  Difficult
**Question:** You write a class InvalidUSNException extends Exception. Callers of a method that throw new InvalidUSNException() must:

- **A.** Use assert only
- **B.** Ignore it as unchecked
- **C.** Extend Thread
- **D.** Catch or declare it (checked)

**Answer:** D
**Explanation:** Extending Exception (not RuntimeException) is checked.

### Q69  ·  Difficult
**Question:** int n=0; two threads each do 1000 times n++ without sync. n is:

- **A.** always 2000
- **B.** always 1000
- **C.** always 0
- **D.** not guaranteed to be 2000 due to races

**Answer:** D
**Explanation:** Lost updates from a non-atomic read-modify-write.

### Q70  ·  Difficult
**Question:** main calls t.run() instead of t.start() for a long task. Observation:

- **A.** The task runs on main’s thread; no concurrency
- **B.** IllegalStateException always
- **C.** The JVM forks
- **D.** A second OS thread starts

**Answer:** A
**Explanation:** run() is a normal method call.

### Q71  ·  Difficult
**Question:** try { return 1; } finally { return 2; } What does the method return?

- **A.** 0
- **B.** 2
- **C.** 1
- **D.** throws

**Answer:** B
**Explanation:** finally’s return replaces the try’s 1 (poor style, but defined).

---

## Quick answer key

Q01–B | Q02–A | Q03–C | Q04–B | Q05–D | Q06–B | Q07–D | Q08–C | Q09–A | Q10–A | Q11–C | Q12–B | Q13–C | Q14–B | Q15–A | Q16–D | Q17–B | Q18–D | Q19–A | Q20–B | Q21–B | Q22–D | Q23–B | Q24–C | Q25–C | Q26–A | Q27–A | Q28–A | Q29–A | Q30–B | Q31–D | Q32–C | Q33–C | Q34–A | Q35–D | Q36–C | Q37–A | Q38–B | Q39–C | Q40–B | Q41–A | Q42–B | Q43–A | Q44–A | Q45–C | Q46–C | Q47–B | Q48–D | Q49–C | Q50–B | Q51–C | Q52–A | Q53–A | Q54–C | Q55–C | Q56–D | Q57–D | Q58–C | Q59–B | Q60–C | Q61–A | Q62–A | Q63–A | Q64–A | Q65–A | Q66–C | Q67–C | Q68–D | Q69–D | Q70–A | Q71–B
