# Assignment — Object Oriented Programming with Java — Module 2 — Classes and Methods

**Subject:** Object Oriented Programming with Java  
**Module:** Module 2 — Classes and Methods  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define class and object. How does new Student("A") use both?

**Expected Key Points:**
- Class is the blueprint (fields/methods).
- Object is a heap instance.
- new allocates and the constructor sets the name "A".
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a constructor? Contrast it with a void init() method.

**Expected Key Points:**
- Constructor: no return type, same name as class, runs on new.
- init() is an ordinary method you could forget to call.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain this as a field disambiguator and as this() constructor chaining.

**Expected Key Points:**
- this.x = x assigns the field.
- this(args) must be first statement and calls another constructor of the same class.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** List the four access levels and who can see a member at each level.

**Expected Key Points:**
- private: class.
- default: package.
- protected: package + subclasses.
- public: anywhere the type is visible.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write a class BankAccount with private balance, a constructor, deposit, withdraw (reject negative), and a static count of accounts.

**Expected Key Points:**
- private double balance; constructor sets opening balance and count++.
- Methods validate amounts.
- static int getCount().
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain method overloading with two constructors and two print methods. What cannot differ alone?

**Expected Key Points:**
- Same name, different parameters (count/type/order).
- Return type alone cannot overload.
- Constructors overload the same way.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare static and instance members with a Student(id) plus universityName example.

**Expected Key Points:**
- universityName static shared.
- Static methods cannot use this.id without an object.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Trace why swap of two int parameters fails and how swapping two array slots in a method succeeds.

**Expected Key Points:**
- int copies values.
- Array reference copy still points at the same array so p[i] changes are visible.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO3
**Question:** Design class Book (isbn, title) with overloaded constructors, this(), private fields, equals-style isbn check, and a static inner ISBN validator.

**Expected Key Points:**
- Validate isbn in static nested class; this() chains from 1-arg to 2-arg; encapsulate fields; factory or constructor throws on bad isbn.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain inner vs static nested class. When does a hidden outer reference hurt?

**Expected Key Points:**
- Inner: Outer.this, cannot construct from static main without outer.
- Static nested: no leak of outer, good for Entry in a map.
- Hidden outer can pin a large GUI in memory.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is the default constructor and when is it generated?

**Expected Key Points:**
- A public no-arg constructor synthesised only if the class declares no constructors.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** What does ‘Java is pass-by-value’ mean for objects?

**Expected Key Points:**
- The value of the reference is copied.
- You can mutate the object; you cannot make the caller’s variable point elsewhere by assigning the parameter.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO3
**Question:** Write a method that attempts to ‘swap’ two Box references and a method that swaps their int fields. Show a main proving the difference.

**Expected Key Points:**
- rebind does not swap caller vars; swapFields uses t=a.v; a.v=b.v; b.v=t and does swap state.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO4
**Question:** How does overload resolution treat an int literal versus an Integer variable?

**Expected Key Points:**
- int literal prefers m(int) over m(long) and m(Integer).
- An Integer variable prefers m(Integer) over m(int) unboxing depending on applicability phases — discuss most-specific and boxing phases.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO5
**Question:** A teammate makes every field public ‘for speed’. Argue using encapsulation, invariants (balance ≥ 0), and later subclassing.

**Expected Key Points:**
- Public fields break invariants, couple callers, block change of representation, and make thread-safety and validation impossible at the boundary.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** class T { static int s; int i; T(){ s++; i=s; } } Create three objects and state each i and final s.

**Expected Key Points:**
- s ends at 3. Objects get i=1,2,3 in construction order.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List three uses of static: main, shared constant, factory-style helper.

**Expected Key Points:**
- public static void main; public static final double PI; static int parse or valueOf helpers.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare private constructors with public constructors. When is a private constructor useful?

**Expected Key Points:**
- Private: singletons, factory-only creation, non-instantiable utility classes (like Math).
- Public: ordinary client new.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain object initialisation order: statics, instance initialisers, constructor, super().

**Expected Key Points:**
- Super constructor first (after super statics).
- Then instance fields/initialisers of this class, then constructor body.
- static initialisers run once at class load.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a method signature in Java? Why does it exclude the return type?

**Expected Key Points:**
- Name + parameter types.
- Return type is not used to distinguish overloads so the compiler would not know which to call from the argument list alone.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 02 Classes and Methods).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Classes and Methods in the context of Classes and Methods. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Object Oriented Programming with Java scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Classes as used in Classes and Methods. Include one precise example.

**Model answer:** Classes is a foundational construct in Classes and Methods. Example should name entities/operations and relate to Methods. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Classes and Methods. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Classes and Methods theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Classes Methods to a realistic campus/industry scenario relevant to Classes and Methods. State assumptions.

**Model answer:** Describe scenario, map concepts (Classes, Methods), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Methods and its role within Classes and Methods.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Classes if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to module within Classes and Methods; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Classes while building a solution involving module. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Classes and Methods principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Classes and Methods that integrates Classes, Methods, and Classes Methods.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Methods in Classes and Methods.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Classes.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Classes and points. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Classes and Classes Methods: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Classes and Methods, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Classes Methods under constraints typical of Object Oriented Programming with Java.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how module depends on earlier ideas such as Classes in Classes and Methods.

**Model answer:** Dependency chain with one counterexample showing what fails if Classes is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where points measurably improves an outcome in Object Oriented Programming with Java.

**Model answer:** Context, intervention using points, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Methods in Classes and Methods. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Classes in Classes and Methods: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Object Oriented Programming with Java.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Classes Methods for Classes and Methods.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Classes Methods.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Classes Methods in Object Oriented Programming with Java.

**Model answer:** Provide four definitions: include Classes, Methods, and two adjacent terms from Classes and Methods. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Methods in Classes and Methods. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Classes in Classes and Methods, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

