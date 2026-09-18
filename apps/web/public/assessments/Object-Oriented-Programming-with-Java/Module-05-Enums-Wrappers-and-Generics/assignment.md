# Assignment — Object Oriented Programming with Java — Module 5 — Enums, Wrappers and Generics

**Subject:** Object Oriented Programming with Java  
**Module:** Module 5 — Enums, Wrappers and Generics  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is an enum? Show values(), valueOf and a switch on the enum.

**Expected Key Points:**
- enum Level { LOW, MED, HIGH } Level.values(); Level.valueOf("MED"); switch(level){ case LOW: ... }.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define wrapper classes. List the eight wrappers.

**Expected Key Points:**
- Boolean, Byte, Short, Character, Integer, Long, Float, Double — immutable objects around primitives.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain autoboxing and unboxing with List<Integer> and a sum loop.

**Expected Key Points:**
- list.add(3) boxes.
- int x = list.get(0) unboxes.
- for (int n : list) unboxes each element.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** What do ordinal() and name() return? Why is storing ordinal in a DB risky?

**Expected Key Points:**
- ordinal is the index; name is the identifier.
- Inserting a new constant in the middle shifts ordinals and corrupts stored data.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare Integer.parseInt and Integer.valueOf. Which uses the cache for small values?

**Expected Key Points:**
- parseInt → int.
- valueOf(int) and valueOf(String) → Integer, cache for small ints.
- Parsing "128" then boxing may not share identity with another 128.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the Integer cache and why == is a bad equality test for Integer.

**Expected Key Points:**
- valueOf reuses -128..127 (and maybe more).
- Outside that, == is identity.
- Use equals or unbox to int.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write a generic class Pair<K,V> with getters and a generic method that swaps a Pair<Integer,Integer> in a static helper that returns a new pair.

**Expected Key Points:**
- class Pair<K,V>{...} static <A,B> Pair<B,A> swap(Pair<A,B> p){ return new Pair<>(p.v, p.k); }.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is type erasure? What happens to Box<String> and Box<Integer> at runtime?

**Expected Key Points:**
- Both are Box.
- get() returns Object in bytecode; casts inserted.
- You cannot overload m(List<String>) and m(List<Integer>).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design enum Planet with mass, radius and a method surfaceGravity(). Show values() loop. Discuss why this beats parallel arrays of doubles.

**Expected Key Points:**
- Each constant has a constructor Planet(mass,radius).
- Methods use the fields.
- Type-safe, printable names, no index mix-ups.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Trace Integer a=127, b=127, c=128, d=128; print a==b, c==d, a.equals(b), c.equals(d).

**Expected Key Points:**
- == true, false; equals true, true (value equality).
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the diamond operator? Give one line creating an ArrayList of String.

**Expected Key Points:**
- List<String> xs = new ArrayList<>(); the compiler infers String on the right.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Can enums have constructors, fields and implement interfaces? Can they extend a class?

**Expected Key Points:**
- Yes constructors (implicitly private), fields, methods, implement interfaces.
- They implicitly extend java.lang.Enum so cannot extend another class.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain PECS with a copy method signature void copy(List<? extends T> src, List<? super T> dst).

**Expected Key Points:**
- Read from src (producer extends), write to dst (consumer super).
- You cannot add to src; you cannot get T out of dst except as Object.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Show a bounded generic method <T extends Number> double sum(List<T> xs).

**Expected Key Points:**
- Loop xs, add x.doubleValue(), return.
- T cannot be String.
- Unboxing via Number methods, not + on T.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO2
**Question:** A student writes class Node<T> { T data; Node<T> next; Node(){ data = new T(); } }. Explain the compile error and two fixes.

**Expected Key Points:**
- Erasure: cannot new T().
- Fixes: pass T value in constructor; pass Class<T> and clazz.newInstance() (or a Supplier<T>).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Why are generic type parameters not allowed to be primitives? How do wrappers and autoboxing fill the gap? Mention arrays vs generics.

**Expected Key Points:**
- Erasure and Object bounds.
- List<int> illegal; List<Integer> plus autobox.
- Arrays are reified and covariant (and therefore unsafe); generics are erased and invariant.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List four Integer/Double methods used in labs (parse, compare, MAX_VALUE, isNaN for Double).

**Expected Key Points:**
- parseInt/parseDouble, compare, MAX_VALUE/MIN_VALUE, Double.isNaN, intValue.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO1
**Question:** Compare raw types, List<Object> and List<?>. What can you add to each?

**Expected Key Points:**
- Raw: add anything with warnings.
- List<Object>: add any reference.
- List<?>: only null.
- Prefer parameterised types.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** Write a typesafe enum-like bit of API: enum Result { PASS, FAIL, ABSENT } plus a generic class GradeBox<T extends Enum<T>> holding a T.

**Expected Key Points:**
- GradeBox stores T, toString uses name().
- Show GradeBox<Result>.
- Explain Enum<T> bound used by EnumSet/EnumMap.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** What exception does Integer.parseInt("x") throw? Is it checked?

**Expected Key Points:**
- NumberFormatException, a RuntimeException, unchecked.
- Validate input or catch if it comes from a user field.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 05 Enums Wrappers and Generics).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Enums and Wrappers in the context of Enums, Wrappers and Generics. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Object Oriented Programming with Java scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Enums as used in Enums, Wrappers and Generics. Include one precise example.

**Model answer:** Enums is a foundational construct in Enums, Wrappers and Generics. Example should name entities/operations and relate to Wrappers. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Enums and Wrappers. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Enums, Wrappers and Generics theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Generics to a realistic campus/industry scenario relevant to Enums, Wrappers and Generics. State assumptions.

**Model answer:** Describe scenario, map concepts (Enums, Wrappers), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Wrappers and its role within Enums, Wrappers and Generics.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Enums if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Enums Wrappers within Enums, Wrappers and Generics; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Enums while building a solution involving Enums Wrappers. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Enums, Wrappers and Generics principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Enums, Wrappers and Generics that integrates Enums, Wrappers, and Generics.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Wrappers in Enums, Wrappers and Generics.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Enums.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Enums and Wrappers Generics. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Enums and Generics: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Enums, Wrappers and Generics, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Generics under constraints typical of Object Oriented Programming with Java.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Enums Wrappers depends on earlier ideas such as Enums in Enums, Wrappers and Generics.

**Model answer:** Dependency chain with one counterexample showing what fails if Enums is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Wrappers Generics measurably improves an outcome in Object Oriented Programming with Java.

**Model answer:** Context, intervention using Wrappers Generics, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Wrappers in Enums, Wrappers and Generics. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Enums in Enums, Wrappers and Generics: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Object Oriented Programming with Java.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Generics for Enums, Wrappers and Generics.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Generics.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Generics in Object Oriented Programming with Java.

**Model answer:** Provide four definitions: include Enums, Wrappers, and two adjacent terms from Enums, Wrappers and Generics. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Wrappers in Enums, Wrappers and Generics. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Enums in Enums, Wrappers and Generics, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

