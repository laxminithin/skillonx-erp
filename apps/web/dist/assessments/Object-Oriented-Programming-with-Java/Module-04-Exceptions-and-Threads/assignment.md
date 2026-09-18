# Assignment — Object Oriented Programming with Java — Module 4 — Exceptions and Threads

**Subject:** Object Oriented Programming with Java  
**Module:** Module 4 — Exceptions and Threads  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain try, catch and finally with a file-read sketch. When does finally run?

**Expected Key Points:**
- Guard I/O in try, catch IOException, close in finally (or try-with-resources).
- finally runs on success, catch, and return from try.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define checked vs unchecked exceptions with two examples each.

**Expected Key Points:**
- Checked: IOException, SQLException — must catch/declare.
- Unchecked: NPE, IllegalArgumentException — programming defects.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Difference between throw and throws.

**Expected Key Points:**
- throw new E() at a statement.
- throws E on a method header for checked exceptions the method may propagate.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** How do you create a custom checked exception for invalid register numbers?

**Expected Key Points:**
- class InvalidUSNException extends Exception { constructors with message/cause }.
- throw new InvalidUSNException(usn); callers catch or declare.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare extending Thread vs implementing Runnable. Which fits a class that already extends JFrame?

**Expected Key Points:**
- Single class inheritance ⇒ use Runnable.
- Runnable also separates task from worker and suits thread pools.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain Java thread states NEW through TERMINATED. Where does sleep sit?

**Expected Key Points:**
- NEW before start; RUNNABLE when eligible; BLOCKED on a monitor; WAITING/TIMED_WAITING on wait/join/sleep; TERMINATED after run returns.
- sleep → TIMED_WAITING.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Threads T1,T2,T3 sleep 120, 300, 180 ms. main starts all three then joins in order T1,T2,T3. Estimate elapsed time and justify.

**Expected Key Points:**
- Overlapping work: elapsed ≈ 300 ms (the max), not 600 ms, because T2 is already running while main join()s T1.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Trace t.start(); t.join(50); when run() sleeps 400 ms. Is t alive after join returns? What does isAlive() likely show?

**Expected Key Points:**
- join returns after ~50 ms; t still asleep so isAlive() is true.
- Timeout does not stop the worker.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write a Counter with increment() used by two threads 100_000 times each, once unsynchronized and once synchronized. Explain the two observed totals.

**Expected Key Points:**
- Unsync: lost updates, total < 200_000 typical.
- synchronized increment on the same object: exactly 200_000.
- Mention visibility as well as atomicity.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design exception types for a banking withdraw: insufficient funds (checked) vs null account id (unchecked). Justify.

**Expected Key Points:**
- InsufficientFundsException extends Exception — caller must decide.
- IllegalArgumentException/NPE for programming errors that should not be forced on every signature.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What does Thread.start() do that run() does not?

**Expected Key Points:**
- start() registers a new thread with the scheduler and arranges for run() to execute there.
- run() on this is a plain call.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is synchronization in one paragraph? Mention the lock object.

**Expected Key Points:**
- A monitor associated with an object.
- synchronized(this) or synchronized methods serialise critical sections that share mutable state.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare sleep and wait. Which needs a synchronized block? Which releases the lock?

**Expected Key Points:**
- wait must be called while holding the object’s monitor and releases it.
- sleep can be called anywhere and keeps monitors.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** What happens if an exception is thrown in a thread’s run() and not caught?

**Expected Key Points:**
- The thread dies; default UncaughtExceptionHandler may print the stack.
- Other threads (including main) keep running.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO4
**Question:** A lab program calls sleep to ‘fix’ a race on a shared counter. Critique and give the correct tool.

**Expected Key Points:**
- sleep does not establish happens-before on the counter and is timing-lucky.
- Use synchronized/volatile/locks/atomic integers.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO1
**Question:** Four workers 50, 50, 50, 200 ms all start(); main joins only the 200 ms thread. Give a bound for when main proceeds and whether the 50 ms threads have finished.

**Expected Key Points:**
- Main blocks ~200 ms on that join.
- The 50 ms threads almost certainly finished earlier (~50 ms) if they were started before the join.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List five Thread.State values and one way to enter each of BLOCKED and TIMED_WAITING.

**Expected Key Points:**
- NEW, RUNNABLE, BLOCKED (entering synchronized held by another), WAITING, TIMED_WAITING (sleep/join(ms)/wait(ms)), TERMINATED.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write try-with-resources vs finally-close for a FileReader. Why is try-with-resources preferred?

**Expected Key Points:**
- try (FileReader r = new FileReader(path)) { ...
- } AutoCloseable close in reverse order, including when close itself throws (suppressed exceptions).
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain scheduling of Java threads: time-slicing vs native threads, and why setPriority is not a correctness tool.

**Expected Key Points:**
- HotSpot uses OS threads; scheduling is OS-dependent.
- Priorities are hints.
- Correctness needs locks/joins, not priority or sleep.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the difference between catch (Exception e) and catch (RuntimeException e) placed first?

**Expected Key Points:**
- If RuntimeException is first, it handles unchecked; later Exception handles remaining checked.
- If Exception is first, the RuntimeException catch is unreachable.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 04 Exceptions and Threads).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Exceptions and Threads in the context of Exceptions and Threads. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Object Oriented Programming with Java scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Exceptions as used in Exceptions and Threads. Include one precise example.

**Model answer:** Exceptions is a foundational construct in Exceptions and Threads. Example should name entities/operations and relate to Threads. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Exceptions and Threads. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Exceptions and Threads theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Exceptions Threads to a realistic campus/industry scenario relevant to Exceptions and Threads. State assumptions.

**Model answer:** Describe scenario, map concepts (Exceptions, Threads), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Threads and its role within Exceptions and Threads.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Exceptions if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Exceptions and Threads; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Exceptions while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Exceptions and Threads principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Exceptions and Threads that integrates Exceptions, Threads, and Exceptions Threads.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Threads in Exceptions and Threads.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Exceptions.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Exceptions and expected. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Exceptions and Exceptions Threads: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Exceptions and Threads, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Exceptions Threads under constraints typical of Object Oriented Programming with Java.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Exceptions in Exceptions and Threads.

**Model answer:** Dependency chain with one counterexample showing what fails if Exceptions is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where expected measurably improves an outcome in Object Oriented Programming with Java.

**Model answer:** Context, intervention using expected, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Threads in Exceptions and Threads. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Exceptions in Exceptions and Threads: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Object Oriented Programming with Java.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Exceptions Threads for Exceptions and Threads.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Exceptions Threads.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Exceptions Threads in Object Oriented Programming with Java.

**Model answer:** Provide four definitions: include Exceptions, Threads, and two adjacent terms from Exceptions and Threads. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Threads in Exceptions and Threads. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Exceptions in Exceptions and Threads, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

