# Assignment — Object Oriented Programming with Java — Module 3 — Inheritance, Packages and Interfaces

**Subject:** Object Oriented Programming with Java  
**Module:** Module 3 — Inheritance, Packages and Interfaces  
**Questions:** 40  
**Mix:** 12 Easy · 17 Intermediate · 11 Difficult  
**Bank total:** 313 marks (faculty may select a 50-mark subset)  
**Instructions:** Answer in your own words. Paste or type long-form responses. Expected key points are for evaluators only.

---

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Explain inheritance with Person and Student. What is reused and what is specialised?

**Expected Key Points:**
- Student extends Person, reuses name/id methods, adds USN/semester.
- Single superclass.
- Constructors call super(...).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define method overriding. How does it differ from overloading?

**Expected Key Points:**
- Same signature and compatible return in a subclass, runtime dispatch.
- Overloading: different parameters, compile-time choice.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A03  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is super used for? Give constructor and method examples.

**Expected Key Points:**
- super(args) parent constructor.
- super.method() calls hidden/overridden parent method.
- super.field if hidden.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A04  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a package? Why import java.util.ArrayList rather than writing the FQCN every time?

**Expected Key Points:**
- Package = namespace + access boundary.
- import is compile-time shorthand, not a runtime copy of code.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A05  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Write abstract class Shape with abstract double area(); subclasses Circle and Rectangle; demonstrate Shape s = new Circle(2);

**Expected Key Points:**
- Shape cannot be new’ed.
- Circle/Rectangle implement area.
- Loop Shape[] printing runtime areas via dispatch.
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A06  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain dynamic method dispatch with a three-level hierarchy A, B, C each overriding display().

**Expected Key Points:**
- A ref pointing at C runs C.display().
- Binding uses the object’s class, not the variable type, for instance methods.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A07  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare abstract class and interface for a campus ‘Payable’ design (Staff vs Vendor).

**Expected Key Points:**
- Shared code/state → abstract class.
- Multiple unrelated payers → interface.
- Java 8 default methods can share algorithm without state.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A08  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain access protection across packages using public, protected, default, private.

**Expected Key Points:**
- Draw a table: class / package / subclass other pkg / world.
- Stress default vs protected.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A09  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO2
**Question:** Design interfaces Drawable and Resizable with a default describe() and a class Chart that implements both and resolves a default-method clash.

**Expected Key Points:**
- Both define default describe(); Chart overrides and may call Drawable.super.describe().
- Mention Java 8 rule.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A10  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO5
**Question:** Trace construction prints: class A { A(){ print A;} A(int x){ print Ax;} } class B extends A { B(){ super(1); print B;} } new B();

**Expected Key Points:**
- Prints Ax then B.
- Explicit super(1) skips A().
**Mapping Basis:** Question assesses outcomes aligned with CO5 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A11  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What does class Object provide that every class inherits?

**Expected Key Points:**
- toString, equals, hashCode, getClass, wait/notify, clone (protected), finalize (legacy).
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A12  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Can an interface extend another interface? Can it extend a class?

**Expected Key Points:**
- Yes, interfaces may extend multiple interfaces.
- No, an interface cannot extend a class.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A13  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Write package edu.vviet.lab; class Marks with default-access total; try to use it from edu.vviet.office and explain the error.

**Expected Key Points:**
- Different packages: default-access total is not visible.
- Fix: public getter or move the class / use public.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A14  ·  Intermediate  ·  10 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is method hiding vs overriding for static methods?

**Expected Key Points:**
- Subclass static with same signature hides.
- Call uses reference type (or class name).
- @Override is illegal.
- No runtime polymorphism.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A15  ·  Difficult  ·  15 marks  ·  CASE_STUDY  ·  CO3
**Question:** Faculty want Student to extend both Person and Hosteller. Java forbids two classes. Propose a design.

**Expected Key Points:**
- Extend Person; Hosteller as interface or composition (has-a HostelStay).
- Prefer composition if hosteller is a role.
**Mapping Basis:** Question assesses outcomes aligned with CO3 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A16  ·  Difficult  ·  15 marks  ·  DESCRIPTIVE  ·  CO2
**Question:** Explain the equals/hashCode contract. Why does String override both?

**Expected Key Points:**
- Equal objects ⇒ equal hashCodes; hashCode consistent with equals.
- String uses content so it works as HashMap keys.
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A17  ·  Easy  ·  5 marks  ·  SHORT_ANALYSIS  ·  CO1
**Question:** List Object methods you typically override and one you usually should not.

**Expected Key Points:**
- Override toString, equals, hashCode.
- Avoid wait/notify unless doing low-level concurrency.
- Treat clone with care.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A18  ·  Intermediate  ·  10 marks  ·  COMPARE_JUSTIFY  ·  CO2
**Question:** Compare import, wildcard import, and fully qualified names. Does import affect runtime performance?

**Expected Key Points:**
- No runtime cost.
- Wildcard does not import subpackages.
- FQCN useful when two types share a simple name (Date).
**Mapping Basis:** Question assesses outcomes aligned with CO2 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A19  ·  Difficult  ·  15 marks  ·  DESIGN  ·  CO4
**Question:** Model a library: Item abstract, Book and DVD, Borrowable interface, default dueDate() in Java 8 style.

**Expected Key Points:**
- Item fields + abstract lateFee.
- Book/DVD extend Item implement Borrowable.
- default dueDate uses loanDays.
- Show a list of Borrowable.
**Mapping Basis:** Question assesses outcomes aligned with CO4 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A20  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** What is a final method and a final class? Why lock a method?

**Expected Key Points:**
- final method cannot be overridden (security/invariant).
- final class cannot be subclassed (e.g.
**Mapping Basis:** Question assesses outcomes aligned with CO1 using module content (Module 03 Inheritance Packages and Interfaces).
**Verification:** ACADEMIC_ANALYSIS

### A21  ·  Intermediate  ·  6 marks  ·  Compare
**Question:** Compare and contrast Inheritance and Packages in the context of Inheritance, Packages and Interfaces. Justify when to prefer each.

**Model answer:** Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for Object Oriented Programming with Java scenarios.

**Evaluation scheme:**
- Comparison — 2 marks
- Justification — 2 marks
- Conclusion — 2 marks

### A22  ·  Easy  ·  4 marks  ·  Explain
**Question:** Define the core idea of Inheritance as used in Inheritance, Packages and Interfaces. Include one precise example.

**Model answer:** Inheritance is a foundational construct in Inheritance, Packages and Interfaces. Example should name entities/operations and relate to Packages. Avoid vague one-liners; state purpose and boundary.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A23  ·  Difficult  ·  8 marks  ·  Case
**Question:** Case study: an organization scales a system relying on Inheritance and Packages. Analyze trade-offs and recommend a design.

**Model answer:** Frame problem, analyze with Inheritance, Packages and Interfaces theory, compare alternatives, recommend with risks and monitoring.

**Evaluation scheme:**
- Understanding — 2 marks
- Analysis — 3 marks
- Recommendation — 3 marks

### A24  ·  Intermediate  ·  6 marks  ·  Application
**Question:** Apply Interfaces to a realistic campus/industry scenario relevant to Inheritance, Packages and Interfaces. State assumptions.

**Model answer:** Describe scenario, map concepts (Inheritance, Packages), show steps, and note failure modes if assumptions break.

**Evaluation scheme:**
- Concept mapping — 3 marks
- Realism — 3 marks

### A25  ·  Easy  ·  4 marks  ·  Short notes
**Question:** Write short notes on Packages and its role within Inheritance, Packages and Interfaces.

**Model answer:** Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to Inheritance if relevant.

**Evaluation scheme:**
- Key points — 2 marks
- Clarity — 2 marks

### A26  ·  Difficult  ·  8 marks  ·  Lab
**Question:** Research task: survey two standard approaches to Inheritance Packages within Inheritance, Packages and Interfaces; cite what you would look up and synthesize differences.

**Model answer:** Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint.

**Evaluation scheme:**
- Sources — 2 marks
- Synthesis — 3 marks
- Insight — 3 marks

### A27  ·  Intermediate  ·  6 marks  ·  Scenario
**Question:** Scenario: a team misapplies Inheritance while building a solution involving Inheritance Packages. Diagnose and correct.

**Model answer:** Identify the misconception, show the correct model using Inheritance, Packages and Interfaces principles, and give a preventive checklist.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 3 marks
- Risks — 1 marks

### A28  ·  Difficult  ·  8 marks  ·  Design
**Question:** Design an end-to-end approach for a non-trivial problem in Inheritance, Packages and Interfaces that integrates Inheritance, Packages, and Interfaces.

**Model answer:** Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 4 marks
- Trade-offs — 2 marks

### A29  ·  Intermediate  ·  6 marks  ·  Design
**Question:** Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on Packages in Inheritance, Packages and Interfaces.

**Model answer:** State requirements, produce the design artifact, argue completeness (edge cases), and relate to Inheritance.

**Evaluation scheme:**
- Requirements — 2 marks
- Design — 3 marks
- Trade-offs — 1 marks

### A30  ·  Difficult  ·  8 marks  ·  Numerical
**Question:** Work a multi-step problem that appears to need both Inheritance and Packages Interfaces. Show a correct method and a common wrong path.

**Model answer:** Correct solution with reasoning; contrast mistaken approach; state the discriminating check.

**Evaluation scheme:**
- Problem setup — 2 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 2 marks

### A31  ·  Intermediate  ·  6 marks  ·  Numerical
**Question:** Solve a worked problem involving Inheritance and Interfaces: show stepwise reasoning, not only the final claim.

**Model answer:** Restate given data, choose method from Inheritance, Packages and Interfaces, show intermediate results, box the final answer, and sanity-check.

**Evaluation scheme:**
- Problem setup — 1 marks
- Method/steps — 2 marks
- Working — 2 marks
- Result — 1 marks

### A32  ·  Difficult  ·  8 marks  ·  Compare
**Question:** Critically compare three strategies for handling Interfaces under constraints typical of Object Oriented Programming with Java.

**Model answer:** Criteria matrix, evidence from module concepts, recommendation with explicit justification.

**Evaluation scheme:**
- Comparison — 3 marks
- Justification — 3 marks
- Conclusion — 2 marks

### A33  ·  Intermediate  ·  6 marks  ·  Short notes
**Question:** Explain how Inheritance Packages depends on earlier ideas such as Inheritance in Inheritance, Packages and Interfaces.

**Model answer:** Dependency chain with one counterexample showing what fails if Inheritance is ignored.

**Evaluation scheme:**
- Key points — 4 marks
- Clarity — 2 marks

### A34  ·  Intermediate  ·  6 marks  ·  Use case
**Question:** Present a use case where Packages Interfaces measurably improves an outcome in Object Oriented Programming with Java.

**Model answer:** Context, intervention using Packages Interfaces, metrics, and limits of generalization.

**Evaluation scheme:**
- Context — 2 marks
- Approach — 3 marks
- Feasibility — 1 marks

### A35  ·  Intermediate  ·  6 marks  ·  Interpretation
**Question:** Interpret a hypothetical result/table/trace involving Packages in Inheritance, Packages and Interfaces. What does it imply?

**Model answer:** Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim.

**Evaluation scheme:**
- Reading — 2 marks
- Inference — 2 marks
- Limits — 2 marks

### A36  ·  Intermediate  ·  6 marks  ·  Code
**Question:** Explain (pseudocode-level) a standard procedure associated with Inheritance in Inheritance, Packages and Interfaces: inputs, steps, output.

**Model answer:** Walk through control/data flow, complexity notes, and one edge case. Align terminology with Object Oriented Programming with Java.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity/edges — 2 marks
- Clarity — 1 marks

### A37  ·  Intermediate  ·  6 marks  ·  Algorithm
**Question:** Give an algorithmic outline to compute/decide a property related to Interfaces for Inheritance, Packages and Interfaces.

**Model answer:** Clear steps, termination argument, and correctness sketch referencing definitions of Interfaces.

**Evaluation scheme:**
- Correctness — 3 marks
- Complexity — 2 marks
- Clarity — 1 marks

### A38  ·  Easy  ·  4 marks  ·  Explain
**Question:** List four key terms a learner must know before applying Interfaces in Object Oriented Programming with Java.

**Model answer:** Provide four definitions: include Inheritance, Packages, and two adjacent terms from Inheritance, Packages and Interfaces. One-line each.

**Evaluation scheme:**
- Core idea — 2 marks
- Explanation/example — 2 marks
- Completeness — 0 marks

### A39  ·  Difficult  ·  8 marks  ·  Scenario
**Question:** Hard scenario: conflicting stakeholder requirements around Packages in Inheritance, Packages and Interfaces. Propose a principled resolution.

**Model answer:** Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria.

**Evaluation scheme:**
- Understanding — 2 marks
- Response — 4 marks
- Risks — 2 marks

### A40  ·  Difficult  ·  8 marks  ·  Interpretation
**Question:** Given a flawed student solution about Inheritance in Inheritance, Packages and Interfaces, interpret the error class and write a model correction.

**Model answer:** Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap.

**Evaluation scheme:**
- Reading — 3 marks
- Inference — 3 marks
- Limits — 2 marks

