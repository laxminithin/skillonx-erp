# Assignment — Object Oriented Programming with Java — Module 1 — Java Fundamentals

**Subject:** Object Oriented Programming with Java  
**Module:** Module 1 — Java Fundamentals  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the four OOP pillars and give one Java-shaped example of each.

**Expected Key Points:**
- Encapsulation: private fields + getters.
- Inheritance: class Student extends Person.
- Polymorphism: Shape s = new Circle(); s.area().
- Abstraction: abstract class Shape or interface Payable.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define JVM, JRE and JDK and state which you need to compile a program.

**Expected Key Points:**
- JVM executes bytecode.
- JRE = JVM + libraries to run.
- JDK = JRE + javac/javadoc/jar.
- Compilation requires the JDK.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is bytecode? Why can one .class file run on different OS/CPU pairs?

**Expected Key Points:**
- Bytecode is JVM instructions in a .class file.
- A JVM on each platform interprets or JITs it, so source is not recompiled per OS.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List eight Java primitive types and the bit width of each (boolean may be described as JVM-dependent).

**Expected Key Points:**
- byte 8, short 16, int 32, long 64, float 32, double 64, char 16, boolean JVM-dependent (not a numeric size in the JLS).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain operator precedence vs associativity using 5 + 3 * 2 and 7 % 3 * 2.

**Expected Key Points:**
- Precedence: * before + so 5+6=11.
- % and * same precedence, left-associative: (7%3)*2 = 2.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Write a Java fragment that reads n, allocates int[n], fills 0..n-1, and prints the sum. Mention the default of unused slots.

**Expected Key Points:**
- int[] a = new int[n]; for (int i=0;i<n;i++) a[i]=i; then sum loop.
- Unused/new int[] slots are 0.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare while, do-while and for. When is do-while the right choice?

**Expected Key Points:**
- while/for test first (zero trips possible).
- do-while tests after (at least one trip).
- Use do-while for menu loops that must show once.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain break vs continue with a labelled loop example (searching a 2-D array).

**Expected Key Points:**
- continue skips to next iteration; break leaves the loop.
- A labelled break outer; can leave both nested loops when a match is found.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  PROBLEM_SOLVING  ·  CO4
**Question:** Trace int x=5; System.out.println(x++ + ++x); and int y=7; System.out.println(y-- * --y); Show each operand value.

**Expected Key Points:**
- x++ yields 5 (x=6); ++x yields 7; print 12.
- y-- yields 7 (y=6); --y yields 5; 7*5=35.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Show the output of: for(int i=0;i<5;i++){ if(i==2) continue; if(i==4) break; System.out.print(i+" "); }

**Expected Key Points:**
- Prints 0 1 3  because 2 is skipped and 4 causes break before print.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is type promotion in an expression such as byte + int?

**Expected Key Points:**
- Binary numeric promotion lifts byte/short/char to int (or to the wider of the two numeric types) before the operation.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Describe array declaration, creation and initialisation in one step vs two steps.

**Expected Key Points:**
- Two-step: int[] a; a = new int[3]; One-step: int[] a = {1,2,3}; or new int[]{1,2,3}.
- length is fixed after creation.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  CASE_STUDY  ·  CO2
**Question:** A student writes if (marks = 40) to test equality. Explain the compile error and the correct test.

**Expected Key Points:**
- Assignment yields int, not boolean.
- Use == for comparison: if (marks == 40).
- For assignment-and-test, that pattern is illegal for int.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** How does switch fall-through work? When is it useful vs dangerous?

**Expected Key Points:**
- Without break, control continues into the next case.
- Useful for shared handlers (case 1: case 2:).
- Dangerous when a missing break is accidental.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** ‘Java is both compiled and interpreted.’ Explain javac, class loading, interpretation and JIT for a campus lab.

**Expected Key Points:**
- javac → bytecode.
- Class loader loads .class.
- Interpreter starts quickly.
- HotSpot JIT compiles hot methods to native code.
- Same bytecode on Windows/Linux lab PCs.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List the integer and floating primitive types and one typical use each.

**Expected Key Points:**
- byte flags/I-O, short rare compact ints, int default counts, long IDs/time, float rare, double default real arithmetic.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Intermediate  ·  10 marks  ·  PROBLEM_SOLVING  ·  CO2
**Question:** A char is 16 bits. How many distinct char values exist? How does this relate to UTF-16?

**Expected Key Points:**
- 2^16 = 65536 code units.
- Java String uses UTF-16; supplementary characters need two chars (a surrogate pair).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** Evaluate System.out.println(10 + 20 + "Java" + 10 + 20); and System.out.println("Java" + 10 + 20);

**Expected Key Points:**
- First: 30Java1020.
- Second: Java1020 because concatenation starts immediately so 10 and 20 are not added.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** What does System.out.println mean in terms of packages and static fields?

**Expected Key Points:**
- System is java.lang.System; out is a static PrintStream; println is an instance method on that stream.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO5
**Question:** Write a complete class LabMarks with a main that uses a switch on a char grade A–F and prints a message, with a default for illegal input.

**Expected Key Points:**
- Read or set char g; switch(g){ case 'A': ...
- case 'F': ...
- default: illegal } include break; mention case labels are compile-time constants.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 01 Java Fundamentals).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Java and Fundamentals in the context of Java Fundamentals. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Object Oriented Programming with Java scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Java as used in Java Fundamentals. Include one precise example.

**Model answer:** Java is a foundational construct in Java Fundamentals. Example should name entities/operations and relate to Fundamentals. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Java and Fundamentals. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Java Fundamentals theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Java Fundamentals to a realistic campus/industry scenario relevant to Java Fundamentals. State assumptions.

**Model answer:** Describe scenario, map concepts (Java, Fundamentals), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Fundamentals and its role within Java Fundamentals.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Java if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Java Fundamentals; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Java while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Java Fundamentals principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Java Fundamentals that integrates Java, Fundamentals, and Java Fundamentals.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Fundamentals in Java Fundamentals.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Java.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Java and analysis. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Java and Java Fundamentals: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Java Fundamentals, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Java Fundamentals under constraints typical of Object Oriented Programming with Java.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Java in Java Fundamentals.

**Model answer:** Dependency chain with one counterexample showing what fails if Java is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where analysis measurably improves an outcome in Object Oriented Programming with Java.

**Model answer:** Context, intervention using analysis, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Fundamentals in Java Fundamentals. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Java in Java Fundamentals: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Object Oriented Programming with Java.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Java Fundamentals for Java Fundamentals.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Java Fundamentals.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Java Fundamentals in Object Oriented Programming with Java.

**Model answer:** Provide four definitions: include Java, Fundamentals, and two adjacent terms from Java Fundamentals. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Fundamentals in Java Fundamentals. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Java in Java Fundamentals, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

