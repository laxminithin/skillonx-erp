#!/usr/bin/env python3
"""Expand assignment.md banks from ~20 to ~40 questions per module."""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path
from typing import Dict, List, Tuple

Diff = str  # Easy | Intermediate | Difficult

def marks_for(diff: Diff) -> int:
    return {"Easy": 4, "Intermediate": 6, "Difficult": 8}[diff]

def type_label(qtype: str) -> str:
    return {
        "DESCRIPTIVE": "Explain",
        "SHORT_ANALYSIS": "Short notes",
        "USE_CASE": "Use case",
        "CASE_STUDY": "Case",
        "PROBLEM_SOLVING": "Numerical",
        "DESIGN": "Design",
        "COMPARE_JUSTIFY": "Compare",
        "APPLICATION": "Application",
        "RESEARCH_TASK": "Lab",
        "CODE_EXPLANATION": "Code",
        "SCENARIO": "Scenario",
        "ALGORITHM": "Algorithm",
        "INTERPRETATION": "Interpretation",
    }.get(qtype, "Explain")

def scheme_lines(qtype: str, marks: int) -> List[str]:
    templates = {
        "PROBLEM_SOLVING": [("Problem setup", 0.2), ("Method/steps", 0.3), ("Working", 0.3), ("Result", 0.2)],
        "ALGORITHM": [("Correctness", 0.45), ("Complexity", 0.3), ("Clarity", 0.25)],
        "CASE_STUDY": [("Understanding", 0.25), ("Analysis", 0.4), ("Recommendation", 0.35)],
        "SCENARIO": [("Understanding", 0.3), ("Response", 0.5), ("Risks", 0.2)],
        "USE_CASE": [("Context", 0.25), ("Approach", 0.45), ("Feasibility", 0.3)],
        "DESIGN": [("Requirements", 0.25), ("Design", 0.5), ("Trade-offs", 0.25)],
        "COMPARE_JUSTIFY": [("Comparison", 0.4), ("Justification", 0.4), ("Conclusion", 0.2)],
        "CODE_EXPLANATION": [("Correctness", 0.5), ("Complexity/edges", 0.3), ("Clarity", 0.2)],
        "INTERPRETATION": [("Reading", 0.4), ("Inference", 0.4), ("Limits", 0.2)],
        "RESEARCH_TASK": [("Sources", 0.3), ("Synthesis", 0.4), ("Insight", 0.3)],
        "APPLICATION": [("Concept mapping", 0.5), ("Realism", 0.5)],
        "SHORT_ANALYSIS": [("Key points", 0.6), ("Clarity", 0.4)],
        "DESCRIPTIVE": [("Core idea", 0.4), ("Explanation/example", 0.4), ("Completeness", 0.2)],
    }
    parts = templates.get(qtype, templates["DESCRIPTIVE"])
    raw = [(lab, round(marks * w)) for lab, w in parts]
    s = sum(m for _, m in raw)
    if raw and s != marks:
        lab, m = raw[-1]
        raw[-1] = (lab, m + (marks - s))
    return [f"- {lab} — {m} marks" for lab, m in raw]


def fmt_q(num: int, diff: Diff, qtype: str, question: str, answer: str) -> str:
    m = marks_for(diff)
    label = type_label(qtype)
    scheme = "\n".join(scheme_lines(qtype, m))
    return (
        f"### A{num:02d}  ·  {diff}  ·  {m} marks  ·  {label}\n"
        f"**Question:** {question}\n\n"
        f"**Model answer:** {answer}\n\n"
        f"**Evaluation scheme:**\n{scheme}\n"
    )


# ── Handcrafted banks for priority subjects ──────────────────────────────────

TOC: Dict[str, List[Tuple[Diff, str, str, str]]] = {}

TOC["Module-01-Introduction-to-Automata-and-Finite-Automata"] = [
    ("Easy", "DESCRIPTIVE",
     "Define a configuration of a DFA and explain how a run on a string is a sequence of configurations.",
     "A configuration is (q, w) with remaining input w. Start (q0,x). One step applies δ. Accept if a configuration (f,ε) with f∈F is reachable."),
    ("Easy", "SHORT_ANALYSIS",
     "List three reasons finite automata are still useful despite being weaker than TMs.",
     "Lexical analysis, protocol/controller modelling, pattern matching with guaranteed linear-time recognition; simplicity and decidable emptiness/equivalence."),
    ("Easy", "DESCRIPTIVE",
     "What does it mean for δ to be a total function in a DFA? Why do textbooks add a dead state?",
     "Every (q,a) has exactly one next state. Dead/sink completes partial transition tables without changing the language."),
    ("Intermediate", "COMPARE_JUSTIFY",
     "Compare ε-NFA and NFA without ε. Which conversions preserve the language?",
     "ε-NFA allows ε-moves; removing ε via ε-closure yields an equivalent NFA; subset construction then yields a DFA. All three denote REG."),
    ("Intermediate", "ALGORITHM",
     "Give an algorithm to compute ε-closure(S) for a set of states S. State time complexity in terms of |Q| and |δ_ε|.",
     "DFS/BFS from S following only ε-edges; O(|Q|+|δ_ε|). Mark visited to avoid cycles."),
    ("Intermediate", "PROBLEM_SOLVING",
     "Build a DFA for binary strings whose third symbol from the start is 1. How many states suffice?",
     "Remember position 1 and 2 then branch; after reading ≥3 symbols stay in accept/reject sinks. About 5–6 states with sinks."),
    ("Intermediate", "DESIGN",
     "Design an NFA for strings over {0,1} containing 101 as a substring. Then sketch the DFA idea.",
     "NFA tracks progress 1,10,101 with self-loops. DFA is the classic string-matcher automaton for pattern 101."),
    ("Intermediate", "APPLICATION",
     "A campus gate opens on badge IDs that are binary strings of even parity. Model the checker as a DFA and justify minimality.",
     "Two states even/odd; accept even. Myhill–Nerode: ε and 1 are distinguishable; two classes ⇒ minimal."),
    ("Intermediate", "SCENARIO",
     "A student claims every NFA with n states has an equivalent DFA with at most n states. Refute with a concrete language family.",
     "Language of strings whose nth symbol from the end is 1 needs ~2^n DFA states; NFA uses n+1. Exponential blow-up is necessary."),
    ("Intermediate", "INTERPRETATION",
     "Interpret the transition table: q0-a→q0,q1; q1-b→q2; F={q2}. Which strings of length ≤3 are accepted?",
     "Must end with ...ab reaching q2. Length≤3: ab, aab, abb? Check reachable paths; list accepted ones ending in ab with possible leading a* before last ab."),
    ("Intermediate", "SHORT_ANALYSIS",
     "Why is the empty language regular? Why is Σ* regular?",
     "∅: DFA with no accepting states (or unreachable F). Σ*: DFA with one accepting state looping on all symbols."),
    ("Intermediate", "COMPARE_JUSTIFY",
     "Justify whether DFAs can implement ‘look-ahead’ like NFAs appear to. What is the right mental model?",
     "NFA look-ahead is existential branching, compiled away by subset construction. DFAs encode the set of possible NFA states."),
    ("Difficult", "DESIGN",
     "Design a product DFA that accepts binary strings with an odd number of 0s and even number of 1s. List F.",
     "States (parity0, parity1). Start (even,even). Accept (odd,even). Define δ for 0/1 flips."),
    ("Difficult", "PROBLEM_SOLVING",
     "Prove by induction that δ̂(q, xy) = δ̂(δ̂(q,x), y) for a DFA. State the inductive parameter clearly.",
     "Induct on |y|. Base y=ε. Step: y=za; use definition δ̂(p,za)=δ(δ̂(p,z),a)."),
    ("Difficult", "CASE_STUDY",
     "Case: a login filter must accept IDs matching letter(letter|digit)*. Argue DFA vs regex implementation trade-offs.",
     "Both regular. DFA: explicit states start/ID/dead. Regex: concise. DFA better for streaming hardware; regex for maintainability."),
    ("Difficult", "RESEARCH_TASK",
     "Lab brief: implement NFA→DFA subset construction; list four graded deliverables and an acceptance test suite.",
     "Deliverables: ε-closure, reachable subsets only, transition table, accept flags. Tests: known NFAs, exponential case, empty language."),
    ("Difficult", "ALGORITHM",
     "Describe an algorithm to decide whether L(M)=∅ for DFA M. Correctness sketch.",
     "BFS/DFS from q0; accept if any state in F reachable. Correct because only reachable states affect L."),
    ("Easy", "DESCRIPTIVE",
     "Define Myhill–Nerode equivalence roughly and say how it relates to the number of DFA states.",
     "x≡y if no continuation distinguishes them. Number of classes = size of minimal DFA."),
    ("Intermediate", "USE_CASE",
     "Use case: detect binary strings ending with 00 using an NFA with as few states as you can, then convert insight to DFA.",
     "NFA: guess start of final 00. DFA remembers trailing 0-count (0,1,2+) with 3 states."),
    ("Difficult", "COMPARE_JUSTIFY",
     "Compare automata as language recognizers vs. generators. Where do NFAs fit in compilers?",
     "Recognizers decide membership; generators produce strings. Lexer NFAs/DFAs recognize tokens; grammar CFGs generate structure."),
]

TOC["Module-02-Regular-Expressions-and-Finite-Automata"] = [
    ("Easy", "DESCRIPTIVE", "Define the syntax of regular expressions over Σ including ε, ∅, union, concat, star.",
     "Atomic: a∈Σ, ε, ∅. Inductive: (r+s), (rs), r*. Parentheses for grouping."),
    ("Easy", "SHORT_ANALYSIS", "Give regexes for: (i) strings ending in 01 (ii) even length (iii) at least one a.",
     "(0+1)*01; ((0+1)(0+1))*; (0+1)*a(0+1)*."),
    ("Easy", "DESCRIPTIVE", "State Kleene’s theorem in one sentence.",
     "A language is regular iff it is denoted by some regular expression iff it is accepted by some FA."),
    ("Intermediate", "ALGORITHM", "Outline Thompson’s construction from regex to ε-NFA. Complexity intuition.",
     "Each operator builds a small ε-NFA fragment; glue with ε. Linear in regex size."),
    ("Intermediate", "ALGORITHM", "Outline state-elimination (Arden) method from DFA to regex.",
     "Label edges by regex; eliminate states solving R=Q+RP ⇒ R=QP*; combine until start→accept expression."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare GNFA and ordinary NFA. Why do textbooks use GNFAs for regex conversion?",
     "GNFA edges carry regexes; state elimination is cleaner. Same power as NFA."),
    ("Intermediate", "PROBLEM_SOLVING", "Convert (0+1)*1(0+1) to an NFA with ≤6 states (sketch).",
     "Star loop, then must-read 1, then one arbitrary symbol; accept."),
    ("Intermediate", "DESIGN", "Design a regex and a DFA for identifiers: letter followed by letters/digits.",
     "Regex: l(l+d)*. DFA: start → ID → ID; other → dead."),
    ("Intermediate", "APPLICATION", "How do regex engines in practice differ from theoretical regex (backrefs)?",
     "Backreferences take you beyond REG. Theoretical regex = REG; Perl-like features may be non-regular."),
    ("Intermediate", "SCENARIO", "A teammate writes (0*)(1*) for ‘equal 0s and 1s’. Diagnose.",
     "That is 0*1*, not {0^n1^n}. Equal counts need CFG/PDA, not regex."),
    ("Intermediate", "INTERPRETATION", "Interpret L((0+ε)(1+ε)). List all strings.",
     "{ε,0,1,01}."),
    ("Intermediate", "SHORT_ANALYSIS", "Why is ∅* = {ε}? Why is ε*={ε}?",
     "Star is union of concatenations of length n≥0; n=0 gives ε. ε concatenated is still ε."),
    ("Difficult", "PROBLEM_SOLVING", "Prove REG closed under complement using DFAs, then derive closure under intersection.",
     "Complement flip F; intersection via De Morgan or product. Hence Boolean algebra."),
    ("Difficult", "DESIGN", "Build an FA for the regex (0+1)*011 and minimize informally.",
     "String matcher for 011 with failure links; minimize by merging indistinguishable."),
    ("Difficult", "CASE_STUDY", "Case: input validation for emails with regex. Discuss correctness limits.",
     "Full RFC email is messy; regex approximates. Over-restriction vs under-restriction; prefer library validators."),
    ("Difficult", "RESEARCH_TASK", "Lab: implement regex→NFA→DFA→minimized DFA pipeline; grading rubric.",
     "Correct Thompson, subset, Hopcroft/Brzozowski; tests on identities like (r*)*=r*."),
    ("Difficult", "ALGORITHM", "Describe Brzozowski minimization at high level.",
     "Determinize reverse(determinize(reverse(DFA))). Yields minimal DFA."),
    ("Easy", "COMPARE_JUSTIFY", "Justify preferring DFA over regex for a high-speed packet filter.",
     "DFA: O(1) per byte, no backtracking. Regex engines may backtrack catastrophically."),
    ("Intermediate", "USE_CASE", "Use Arden’s lemma to solve R = 0R + 1 for R.",
     "R = 0*1."),
    ("Difficult", "INTERPRETATION", "Given DFA↔regex round-trip produced a huge expression, interpret what went wrong and how to simplify.",
     "State elimination order matters; algebraic simplifications (distributivity, idempotence) needed; minimize DFA first."),
]

TOC["Module-03-Context-Free-Grammars-and-Pushdown-Automata"] = [
    ("Easy", "DESCRIPTIVE", "Define a CFG as a 4-tuple and give a grammar for {a^n b^n | n≥0}.",
     "G=(V,Σ,R,S). S→aSb|ε."),
    ("Easy", "SHORT_ANALYSIS", "What is a leftmost derivation? Why care in parsing?",
     "Always expand leftmost variable. Parsers often correspond to leftmost/rightmost derivations / parse trees."),
    ("Easy", "DESCRIPTIVE", "Define acceptance by empty stack vs final state for PDAs.",
     "Empty stack: accept when input consumed and stack empty. Final state: accept in F regardless of stack (variants exist). Convertible."),
    ("Intermediate", "DESIGN", "Design a PDA for palindromes over {0,1} (odd and even length).",
     "Guess middle; push then pop matching. Nondeterministic guess of center."),
    ("Intermediate", "DESIGN", "Give a CFG for balanced parentheses and the corresponding PDA idea.",
     "S→(S)|SS|ε. PDA pushes on ‘(’, pops on ‘)’."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare DPDA and NPDA. Name a CFL that needs nondeterminism.",
     "DPDA properly weaker. Palindromes / {ww^R} typical NPDA language."),
    ("Intermediate", "ALGORITHM", "Explain how to eliminate ε-productions from a CFG (high level).",
     "Find nullable variables; replace productions omitting nullable symbols; carefully handle S→ε if ε∈L."),
    ("Intermediate", "ALGORITHM", "Explain elimination of unit productions.",
     "Compute unit pairs A⇒*B; add B’s non-unit productions to A; delete units."),
    ("Intermediate", "PROBLEM_SOLVING", "Show a parse tree and leftmost derivation for aabbb from S→aSb|b.",
     "Wait language a^n b^{n+1}? Adjust: for S→aSb|ab derive aabb: S⇒aSb⇒a ab b = aabb."),
    ("Intermediate", "APPLICATION", "Where do CFGs appear in programming language syntax?",
     "Expressions, blocks, declarations — typically CFG (often LALR/LL fragments)."),
    ("Intermediate", "SCENARIO", "Student writes CFG for {a^n b^n c^n}. Correct them.",
     "Not context-free (pumping/Ogden). Needs CSG or TM."),
    ("Intermediate", "INTERPRETATION", "Interpret stack operations: push A, push B, pop B, pop A on input ε. What changed?",
     "Net identity if order matches; illustrates LIFO discipline."),
    ("Difficult", "DESIGN", "Construct CFG and PDA for {a^i b^j c^k | i=j or j=k}.",
     "Union of i=j (c* free) and j=k (a* free). PDA nondeterministically chooses which equality."),
    ("Difficult", "PROBLEM_SOLVING", "Convert CFG S→aB|bA; A→a|aS|bAA; B→b|bS|aBB to Chomsky form sketch.",
     "Eliminate ε/unit if any; replace long RHS with binaries; terminals isolated."),
    ("Difficult", "CASE_STUDY", "Case: ambiguous grammar for dangling else. Risks and fixes.",
     "Two parse trees ⇒ semantic bugs. Fix: revise grammar / require braces / parser precedence."),
    ("Difficult", "RESEARCH_TASK", "Lab: implement CYK for CNF grammars; complexity and test plan.",
     "O(n^3|G|); tests on a^n b^n, ambiguous grammars, rejection cases."),
    ("Difficult", "COMPARE_JUSTIFY", "Justify PDA empty-stack vs final-state acceptance equivalence (sketch).",
     "Add bottom marker / ε-transitions to clear stack or enter accept; constructions preserve L."),
    ("Easy", "COMPARE_JUSTIFY", "Compare regular grammar vs general CFG.",
     "Regular: productions A→aB|a|ε (right/left linear). CFG: unrestricted RHS in variables/terminals."),
    ("Intermediate", "USE_CASE", "Use a CFG to generate simple arithmetic expressions with + and ×.",
     "E→E+T|T; T→T×F|F; F→(E)|id — classic ambiguous-avoiding form."),
    ("Difficult", "ALGORITHM", "Describe CYK membership testing steps on a short string.",
     "Fill triangular DP table with variables deriving substrings; accept if S in [1,n]."),
]

TOC["Module-04-Properties-of-Context-Free-Languages"] = [
    ("Easy", "DESCRIPTIVE", "State the pumping lemma for CFLs (informal statement).",
     "For CFL L, ∃p such that any s∈L, |s|≥p, can be split uvxyz with |vxy|≤p, |vy|≥1, uv^i xy^i z ∈L ∀i≥0."),
    ("Easy", "SHORT_ANALYSIS", "List four closure properties of CFLs.",
     "Closed under union, concat, star, homomorphism; not under intersection or complement."),
    ("Easy", "DESCRIPTIVE", "What is a inherently ambiguous CFL? Give the classic example name.",
     "Every grammar for the language is ambiguous. Classic: {a^n b^n c^m} ∪ {a^n b^m c^m}."),
    ("Intermediate", "PROBLEM_SOLVING", "Use pumping lemma to show {a^n b^n c^n} is not CFL.",
     "Pump v,y that cannot preserve all three counts simultaneously."),
    ("Intermediate", "PROBLEM_SOLVING", "Show {ww | w∈{0,1}*} is not CFL (sketch).",
     "Pumping/Ogden or intersect with regular language to get non-CFL."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare CFL∩REG vs CFL∩CFL.",
     "CFL∩REG is CFL; CFL∩CFL may leave CFL (e.g. a^n b^n c^n via two CFLs)."),
    ("Intermediate", "APPLICATION", "Why compilers still use CFGs if CFL∩CFL isn’t closed?",
     "Syntax approx CFG; semantic constraints (type agreement) handled in later phases, not pure CFG."),
    ("Intermediate", "SCENARIO", "Someone concludes CFLs closed under complement because DFAs are. Refute.",
     "CFL not closed under complement; if they were, intersection would follow via De Morgan and break known examples."),
    ("Intermediate", "INTERPRETATION", "Interpret what Ogden’s lemma buys beyond ordinary pumping.",
     "Distinguished positions force pumpable parts into chosen regions — stronger for some proofs."),
    ("Intermediate", "SHORT_ANALYSIS", "Is emptiness of CFGs decidable? Universality?",
     "Emptiness decidable (productive variables). Universality undecidable for CFGs."),
    ("Intermediate", "DESIGN", "Design a proof outline that CFLs are closed under union via grammars.",
     "New start S→S1|S2 with disjoint variables."),
    ("Difficult", "PROBLEM_SOLVING", "Prove {a^i b^j c^k | i=j=k} not CFL using intersection with a regular language if helpful.",
     "Direct pumping or note CFL∩a*b*c* arguments; standard pumping on a^p b^p c^p."),
    ("Difficult", "CASE_STUDY", "Case: two CFGs for fragments of a protocol; intersection needed. What automaton class helps?",
     "Intersection of CFL not CFL; may need CFL∩REG techniques or move to CSG/TM model."),
    ("Difficult", "RESEARCH_TASK", "Survey decidable vs undecidable problems for CFGs; cite three each.",
     "Decidable: emptiness, membership (CYK), finiteness (advanced). Undecidable: equivalence, universality, ambiguity."),
    ("Difficult", "COMPARE_JUSTIFY", "Justify Chomsky hierarchy placements: REG ⊂ CFL ⊂ CSL ⊂ RE.",
     "Strict inclusions via classic witness languages a^n b^n, a^n b^n c^n, halting-related RE-not-recursive."),
    ("Difficult", "ALGORITHM", "High-level algorithm to test if a CFG generates any string (emptiness).",
     "Mark terminals productive; propagate productivity to variables; check if S productive."),
    ("Easy", "APPLICATION", "Give one practical reason pumping lemmas are ‘negative tools’.",
     "They prove non-membership in a class; they do not prove a language is CFL."),
    ("Intermediate", "USE_CASE", "Use closure facts to quickly decide if L1∪L2 is CFL when both are.",
     "Yes — closed under union."),
    ("Intermediate", "DESCRIPTIVE", "Define deterministic CFL (DCFL) briefly and one property vs CFL.",
     "Accepted by DPDA. DCFLs closed under complement; CFLs not. DCFLs not closed under union."),
    ("Difficult", "INTERPRETATION", "Interpret a ‘proof’ that used pumping with |vy|=0. Where is the bug?",
     "Pumping lemma requires |vy|≥1; a split with empty pumpable part is invalid."),
]

TOC["Module-05-Turing-Machines-and-Undecidability"] = [
    ("Easy", "DESCRIPTIVE", "Give the 7-tuple of a deterministic TM and explain the tape alphabet.",
     "Q,Σ,Γ,δ,q0,B,F (variants). Γ⊃Σ∪{B}; tape symbols include blank."),
    ("Easy", "SHORT_ANALYSIS", "List three differences between FA and TM.",
     "TM read/write, two-way head, unbounded tape, may loop; FA one-way read-only finite control."),
    ("Easy", "DESCRIPTIVE", "Define recognizer vs decider.",
     "Recognizer: accept if in L, may loop if not. Decider: always halt, accept/reject correctly."),
    ("Intermediate", "DESIGN", "Design a TM that accepts {0^n 1^n | n≥0} (high-level cross-off).",
     "Zig-zag crossing off matching 0/1; accept if all gone; reject mismatch."),
    ("Intermediate", "DESIGN", "Sketch a TM for addition of two unary numbers separated by +.",
     "Move across, rewrite + as 1 or shift; standard unary add."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare multi-tape and single-tape TMs for language recognition power.",
     "Same languages (RE); multi-tape can be faster asymptotically."),
    ("Intermediate", "ALGORITHM", "Describe dovetailing at a high level for enumerating RE languages.",
     "Simulate all machines/inputs in round-robin time slices; list accepts."),
    ("Intermediate", "APPLICATION", "Why is undecidability relevant to program analysis / antivirus idealizations?",
     "Halting/virus detection related problems are undecidable in general; practical tools approximate."),
    ("Intermediate", "SCENARIO", "A student says ‘infinite tape means TM can decide everything’. Correct them.",
     "Power ≠ decidability of all problems; diagonalization/reduction show undecidable languages."),
    ("Intermediate", "INTERPRETATION", "Interpret a reduction A ≤ B. If B is decidable, what about A?",
     "A is decidable. Contrapositively, if A undecidable, B is."),
    ("Intermediate", "SHORT_ANALYSIS", "State the Church–Turing thesis informally.",
     "Intuitive effective procedures ≡ TM-computable functions."),
    ("Difficult", "PROBLEM_SOLVING", "Prove ATM (acceptance problem) undecidable by diagonalization sketch.",
     "Assume decider H; build D that diagonalizes on 〈M〉; contradiction."),
    ("Difficult", "PROBLEM_SOLVING", "Reduce ATM to HALT to show HALT undecidable (sketch).",
     "On 〈M,w〉 build M' that accepts if M accepts else loops; halt-decider would decide ATM."),
    ("Difficult", "CASE_STUDY", "Case: equivalence of two arbitrary TMs. Classify decidability and justify.",
     "Undecidable (and worse). Classic via reductions from emptiness/universality."),
    ("Difficult", "RESEARCH_TASK", "Write a mini-survey: RE vs recursive languages with two example problems each.",
     "Recursive: decidable problems (A_DFA). RE-not-recursive: ATM. Co-RE examples: complement ATM."),
    ("Difficult", "DESIGN", "Design a nondeterministic TM view of guessing a witness for an RE language.",
     "NTM guesses certificate then verifies; equivalent power to DTM via BFS of configurations."),
    ("Difficult", "COMPARE_JUSTIFY", "Compare decidable, RE, and non-RE languages with the semantic picture of halting.",
     "Decidable always halt; RE enumerate accepts; some languages neither RE nor co-RE."),
    ("Easy", "APPLICATION", "Give one example of a decidable language about automata.",
     "A_DFA, E_DFA, EQ_DFA are decidable."),
    ("Intermediate", "USE_CASE", "Use a TM high-level description to recognize { ww | w∈{0,1}* }.",
     "Find midpoint nondeterministically or by marking; compare halves."),
    ("Difficult", "ALGORITHM", "Explain the universal TM idea: input 〈M,w〉 simulates M on w.",
     "Encode transitions; single TM interprets encoding — foundation of undecidability proofs."),
]

DBMS: Dict[str, List[Tuple[Diff, str, str, str]]] = {}

DBMS["Module-01-Fundamentals-and-ER-Model"] = [
    ("Easy", "DESCRIPTIVE", "Define data independence and distinguish logical vs physical.",
     "Logical: hide conceptual changes from apps. Physical: hide storage/index changes from conceptual schema."),
    ("Easy", "SHORT_ANALYSIS", "List four functions of a DBMS besides storing data.",
     "Concurrency control, recovery, authorization, query optimization/integrity enforcement."),
    ("Easy", "DESCRIPTIVE", "What is a miniworld in database design?",
     "The portion of the real world relevant to the application being modeled."),
    ("Intermediate", "DESIGN", "Design an ER diagram for LIBRARY with Book, Copy, Member, Loan. Mark keys and a weak entity if any.",
     "COPY weak on BOOK with CopyNo; LOAN relates Member–Copy with dates; keys USN/MemberId, ISBN."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare entity type vs entity instance; relationship type vs instance.",
     "Type is schema construct; instance is occurrence at a moment. Relationship instances link entity instances."),
    ("Intermediate", "APPLICATION", "Map a university Course–Student–Instructor scenario to ER constructs including ternary if needed.",
     "ENROLLS binary Student–Course; TEACHES Instructor–Course; if section-specific, use SECTION entity."),
    ("Intermediate", "SCENARIO", "Stakeholders insist on storing derived Age. Advise with schema implications.",
     "Prefer DOB + derived Age in views; stored Age risks inconsistency unless triggered maintenance."),
    ("Intermediate", "INTERPRETATION", "Interpret total vs partial participation of DEPENDENT in EMPLOYEE–DEPENDENT.",
     "Total DEPENDENT: every dependent must link to employee. Employee participation often partial."),
    ("Intermediate", "SHORT_ANALYSIS", "Explain recursive relationships with a campus OrgChart example.",
     "EMPLOYEE supervises EMPLOYEE; role names supervisor/supervisee; careful cardinality."),
    ("Intermediate", "PROBLEM_SOLVING", "For a 1:N relationship DEPARTMENT–EMPLOYEE, where does the FK go and why?",
     "FK on N-side EMPLOYEE referencing DEPARTMENT. Avoids repeating groups."),
    ("Intermediate", "USE_CASE", "Use ER to model Event registration with waitlist capacity constraints (describe; constraints may be beyond basic ER).",
     "Entities Event, Attendee, Registration; capacity as attribute; waitlist flag; enforce in logic/DB constraints."),
    ("Difficult", "DESIGN", "Design ER for hospital: Patient, Doctor, Ward, Bed, Admission, Prescription. Identify weak entities.",
     "BED weak on WARD; PRESCRIPTION line items weak on PRESCRIPTION; Admission relates Patient–Ward/Bed."),
    ("Difficult", "CASE_STUDY", "Case: two departments share employees (matrix org). How does ER change vs single dept?",
     "N:M EMPLOYEE–DEPARTMENT with percentage attribute; or ASSIGNMENT associative entity."),
    ("Difficult", "RESEARCH_TASK", "Compare Chen ER vs crow’s foot notation; deliver a one-page mapping guide for your team.",
     "Cardinality placement differs; map 1/N/M symbols; prefer one standard per project."),
    ("Difficult", "COMPARE_JUSTIFY", "Justify when to promote a relationship to an associative entity.",
     "When relationship has attributes, or becomes M:N needing identity, or must relate to others."),
    ("Difficult", "APPLICATION", "Apply specialization/generalization to PERSON → STUDENT/FACULTY with overlapping or disjoint constraints.",
     "Disjoint/overlapping, total/partial specialization; schema implications for tables."),
    ("Easy", "APPLICATION", "Give one example where a DBMS catalog (metadata) is queried by tools.",
     "ORMs and IDEs list tables/columns from INFORMATION_SCHEMA / catalog."),
    ("Intermediate", "DESIGN", "Draw (describe) ER for online shopping: Customer, Product, Order, OrderLine, Payment.",
     "OrderLine weak/associative between Order–Product with qty; Payment 1:1 or 1:N with Order."),
    ("Intermediate", "DESCRIPTIVE", "Define cardinality ratio and participation constraint.",
     "Cardinality: max counts (1:1,1:N,M:N). Participation: whether all entities must engage (total/partial)."),
    ("Difficult", "INTERPRETATION", "Interpret an ER that models Room–KeyCard–AccessLog. Spot a likely missing constraint.",
     "Often missing time-window uniqueness, lost-card revocation, or which doors a card opens (N:M Room–Card)."),
]

DBMS["Module-02-Relational-Model-and-Algebra"] = [
    ("Easy", "DESCRIPTIVE", "Define relation schema vs relation instance.",
     "Schema: name + attributes + domains. Instance: set of tuples at a time (no duplicates in pure model)."),
    ("Easy", "SHORT_ANALYSIS", "State entity integrity and referential integrity.",
     "Entity: primary key ≠ null. Referential: FK null or matches existing PK."),
    ("Easy", "DESCRIPTIVE", "What is a candidate key vs superkey?",
     "Superkey uniquely identifies; candidate key is minimal superkey."),
    ("Intermediate", "PROBLEM_SOLVING", "Given Student(ID,Name,Dept) and Enroll(ID,Course,Grade), write algebra for names of students in CS enrolled in DB.",
     "π_Name (σ_Dept='CS'(Student) ⨝ σ_Course='DB'(Enroll))."),
    ("Intermediate", "PROBLEM_SOLVING", "Express antijoin: students with no enrollments.",
     "Student ▷ Enroll or π(Student) − π_ID(Student ⨝ Enroll) appropriately."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare θ-join, equijoin, and natural join.",
     "θ-join arbitrary condition; equijoin equality; natural join equality on common names + project-out duplicates."),
    ("Intermediate", "APPLICATION", "Translate a business rule ‘each project has one manager’ into relational constraints.",
     "FK Project.manager → Emp.ID; optionally UNIQUE if 1:1; NOT NULL."),
    ("Intermediate", "SCENARIO", "Analyst uses Cartesian product without join condition. What goes wrong?",
     "Combinatorial explosion / meaningless pairs; almost always a bug."),
    ("Intermediate", "INTERPRETATION", "Interpret π_A (r) when r has duplicate A values in bags vs sets.",
     "Set algebra removes duplicates; SQL bags keep them unless DISTINCT."),
    ("Intermediate", "SHORT_ANALYSIS", "Why is division useful? Give schema example Supplier–Part.",
     "Suppliers who supply all parts: SP ÷ Parts."),
    ("Intermediate", "DESIGN", "Design schemas for Library with referential actions ON DELETE for Copy vs Loan.",
     "Deleting Book cascades/restricts Copies; Loans restrict if active; choose business policy."),
    ("Difficult", "PROBLEM_SOLVING", "Using algebra, find course IDs taken by all students in dept D (division pattern).",
     "π_Course(Enroll) ÷ π_ID(σ_Dept=D Student) with correct dividend schema."),
    ("Difficult", "CASE_STUDY", "Case: nullable FK to represent optional advisor. Discuss outer joins in reporting.",
     "LEFT OUTER JOIN students to advisor; NULLs mean unassigned; careful with predicates on nullable side."),
    ("Difficult", "RESEARCH_TASK", "Compare RA expressiveness vs safe relational calculus; write a short note.",
     "Codd: equivalent expressive power for safe queries; calculus declarative vs algebra procedural."),
    ("Difficult", "COMPARE_JUSTIFY", "Justify including ∪, −, × as primitive vs defining via others.",
     "Different complete sets exist; teaching often takes select/project/union/difference/product as basis."),
    ("Difficult", "ALGORITHM", "Describe how a query optimizer might reorder joins (conceptual).",
     "Search plan space; cost model with statistics; prefer small intermediate results."),
    ("Easy", "APPLICATION", "Give an example update anomaly in an unnormalized student-course table.",
     "Repeating student address per enrollment; update one row leave others stale."),
    ("Intermediate", "USE_CASE", "Use rename operator ρ to join a relation with itself for prerequisite pairs.",
     "ρ_P(prereq) ⨝ ... Course with aliases for course vs prereq ids."),
    ("Intermediate", "DESCRIPTIVE", "Define domain constraint with an example.",
     "Attribute values drawn from domain (e.g., Grade ∈ {S,A,B,C,F})."),
    ("Difficult", "INTERPRETATION", "Interpret a relational expression that projects away a FK. Integrity impact?",
     "Result may be a view without the FK column; base tables still enforce integrity."),
]

DBMS["Module-03-Normalization-and-SQL"] = [
    ("Easy", "DESCRIPTIVE", "Define functional dependency X → Y.",
     "For any two tuples, equal X ⇒ equal Y. Property of the miniworld / intended constraints."),
    ("Easy", "SHORT_ANALYSIS", "State 1NF, 2NF, 3NF briefly.",
     "1NF atomic attributes; 2NF no partial dependency on whole key; 3NF no transitive dependency on key."),
    ("Easy", "DESCRIPTIVE", "What is a trivial FD?",
     "Y ⊆ X for X→Y."),
    ("Intermediate", "PROBLEM_SOLVING", "Given FDs: A→B, B→C, AC→D, compute attribute closure of A.",
     "A+ = ABC (then not D unless via AC); explain steps with Armstrong axioms."),
    ("Intermediate", "PROBLEM_SOLVING", "Decompose R(A,B,C,D) with key A and FDs A→BC, B→D into 3NF.",
     "Create schemas for each FD / use synthesis; e.g., (A,B,C), (B,D) if B→D and check lossless."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare 3NF and BCNF with an example that is 3NF but not BCNF.",
     "Classic: overlapping candidate keys causing FD where determinant not superkey."),
    ("Intermediate", "APPLICATION", "Write SQL to find students with CGPA above dept average (nested query).",
     "WHERE cgpa > (SELECT AVG(cgpa) FROM student s2 WHERE s2.dept=s1.dept)."),
    ("Intermediate", "SCENARIO", "Team denormalizes for read performance. What integrity risks appear?",
     "Redundancy → update anomalies; need triggers or app discipline."),
    ("Intermediate", "INTERPRETATION", "Interpret EXPLAIN showing a full table scan on a selective WHERE. Likely fix?",
     "Missing/unusable index; rewrite function-wrapped columns; update stats."),
    ("Intermediate", "SHORT_ANALYSIS", "Difference between WHERE and HAVING.",
     "WHERE filters rows before grouping; HAVING filters groups after aggregation."),
    ("Intermediate", "DESIGN", "Design 3NF schemas for Order(orderId, customerId, customerCity, itemId, price, qty) with obvious FDs.",
     "Customer(customerId,city); Item(itemId,price); Order(orderId,customerId); OrderLine(orderId,itemId,qty)."),
    ("Difficult", "PROBLEM_SOLVING", "Prove lossless-join for a binary decomposition using the FD chase/criterion.",
     "If FD X→Y and X is key of one subschema spanning the overlap, decomposition is lossless."),
    ("Difficult", "CASE_STUDY", "Case: SQL NULL marks and three-valued logic bug in NOT IN subquery.",
     "NOT IN with NULLs yields unknown; prefer NOT EXISTS / anti-join patterns."),
    ("Difficult", "RESEARCH_TASK", "Lab: normalize a messy spreadsheet of campus clubs to 3NF and load with SQL DDL/DML.",
     "Identify FDs, decompose, CREATE TABLE+FKs, INSERT, sample queries; document anomalies removed."),
    ("Difficult", "CODE_EXPLANATION", "Explain what this query does and its pitfalls: SELECT dept, COUNT(*) FROM emp WHERE salary>50000 GROUP BY dept;",
     "Counts high-salary employees per dept; excludes NULL dept unless grouped; filter before aggregate."),
    ("Difficult", "ALGORITHM", "Describe 3NF synthesis algorithm steps.",
     "Minimal cover; one schema per FD; ensure key schema; remove contained schemas."),
    ("Easy", "APPLICATION", "Write a SQL UNIQUE + NOT NULL constraint approximating a candidate key.",
     "UNIQUE(col) with NOT NULL on the columns of the key."),
    ("Intermediate", "USE_CASE", "Use WINDOW functions (conceptually) to rank students by CGPA within dept.",
     "RANK() OVER (PARTITION BY dept ORDER BY cgpa DESC)."),
    ("Intermediate", "DESCRIPTIVE", "Define multivalued dependency and 4NF at a high level.",
     "MVDs independent multi-valued facts; 4NF removes non-trivial MVDs not implied by keys."),
    ("Difficult", "INTERPRETATION", "Interpret a decomposition that is dependency-preserving vs one that is not.",
     "Preserving: local checks imply global FDs. If not, may need costly joins to enforce FDs."),
]

DBMS["Module-04-Transactions-Recovery-and-Serializability"] = [
    ("Easy", "DESCRIPTIVE", "Define the ACID properties in one line each.",
     "Atomicity all-or-nothing; Consistency preserve integrity; Isolation concurrency illusion; Durability committed persists."),
    ("Easy", "SHORT_ANALYSIS", "What is a schedule? What is a serial schedule?",
     "Interleaving of operations across transactions. Serial: no interleaving — one after another."),
    ("Easy", "DESCRIPTIVE", "Define dirty read.",
     "Reading uncommitted data written by another transaction."),
    ("Intermediate", "PROBLEM_SOLVING", "Test conflict serializability of a given schedule r1(X) w2(X) w1(X) using a precedence graph.",
     "Edges from conflicts; cycle ⇒ not conflict serializable. Explain each edge."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare conflict vs view serializability.",
     "Conflict stricter/poly-time testable; view more general but NP-hard to test."),
    ("Intermediate", "APPLICATION", "Which isolation level prevents dirty reads but allows non-repeatable reads?",
     "READ COMMITTED (typical)."),
    ("Intermediate", "SCENARIO", "Funds transfer: debit then system crash before credit. Which ACID property & recovery action?",
     "Atomicity; UNDO incomplete transaction on recovery."),
    ("Intermediate", "INTERPRETATION", "Interpret a waits-for graph with a cycle.",
     "Deadlock; victim selection / abort one txn."),
    ("Intermediate", "SHORT_ANALYSIS", "Role of WAL (write-ahead logging).",
     "Log force before data pages; enables redo/undo correctly."),
    ("Intermediate", "DESIGN", "Design a logging strategy for a banking debit with checkpoints.",
     "Begin, update logs with undo/redo info, commit; checkpoints truncate recovery work."),
    ("Intermediate", "USE_CASE", "Use two-phase locking to show a non-serializable risk if unlock early.",
     "Releasing locks before all locks acquired can allow cycles; 2PL forbids."),
    ("Difficult", "PROBLEM_SOLVING", "Show a schedule that is view serializable but not conflict serializable (classic pattern).",
     "Blind writes example; explain why view ok but conflict graph cycles."),
    ("Difficult", "CASE_STUDY", "Case: airline booking oversell under READ UNCOMMITTED. Propose isolation + constraints.",
     "Use SERIALIZABLE or careful SELECT FOR UPDATE; seat count constraint; compensating transactions."),
    ("Difficult", "RESEARCH_TASK", "Compare ARIES recovery phases Analysis/Redo/Undo in a short brief.",
     "Analysis find dirty/active; Redo repeat history; Undo losers; CLRs."),
    ("Difficult", "ALGORITHM", "Outline deadlock detection via waits-for graph periodically.",
     "Build graph from lock waits; find cycle; abort victim; repeat."),
    ("Difficult", "COMPARE_JUSTIFY", "Justify checkpoints even though logs already exist.",
     "Bound recovery redo/undo work; without checkpoints restart scans entire log history."),
    ("Easy", "APPLICATION", "Give an example of a lost update without concurrency control.",
     "Two txns read balance 100, both write 100+10 → 110 not 120."),
    ("Intermediate", "DESCRIPTIVE", "Define cascading rollback and how strict schedules avoid it.",
     "Abort forces others who read dirty data to abort. Strict: no dirty reads of uncommitted writes."),
    ("Intermediate", "PROBLEM_SOLVING", "For schedule w1(X) r2(X) w1(Y) c1 c2, discuss recoverability.",
     "T2 read dirty X; if T1 aborts must cascade. If commits ordered carefully may be recoverable — analyze."),
    ("Difficult", "INTERPRETATION", "Interpret ‘repeatable read’ still allowing phantom reads.",
     "Same rows repeat but new matching rows can appear; predicates not locked fully unless serializable."),
]

DBMS["Module-05-Concurrency-Control-and-NoSQL"] = [
    ("Easy", "DESCRIPTIVE", "Define two-phase locking (growing and shrinking).",
     "Growing: acquire locks only; shrinking: release only; no acquire after first release."),
    ("Easy", "SHORT_ANALYSIS", "What is a phantom read? Give an example predicate.",
     "New rows appear for a SELECT WHERE predicate between reads; e.g., count of open seats."),
    ("Easy", "DESCRIPTIVE", "Name three common NoSQL categories.",
     "Key-value, document, column-family, graph (any three)."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare optimistic concurrency (validation) vs locking.",
     "Optimistic: read freely, validate at commit — good for low conflict. Locking: pessimistic, blocking."),
    ("Intermediate", "COMPARE_JUSTIFY", "Compare MongoDB document model vs relational normalization for blog posts/comments.",
     "Embed comments for read locality vs reference for unbounded growth; trade consistency & duplication."),
    ("Intermediate", "APPLICATION", "When would you choose a key-value store for session data?",
     "Simple get/put, TTL, horizontal scale, no complex joins needed."),
    ("Intermediate", "SCENARIO", "Global e-commerce needs low-latency reads worldwide. Discuss replication vs consistency.",
     "Geo-replicas raise availability/latency; CAP/PACELC trade-offs; eventual vs strong consistency choices."),
    ("Intermediate", "INTERPRETATION", "Interpret an isolation anomaly under snapshot isolation (write skew) at high level.",
     "Two txns read snapshot, write disjoint rows violating constraint together; SI may allow."),
    ("Intermediate", "SHORT_ANALYSIS", "What does BASE emphasize compared to ACID?",
     "Basically Available, Soft state, Eventual consistency — favor availability/partition tolerance."),
    ("Intermediate", "DESIGN", "Design a sharding key for multi-tenant SaaS invoices.",
     "Shard by tenant_id for locality; avoid hot tenants; consider composite keys."),
    ("Intermediate", "USE_CASE", "Use timestamp ordering to explain a rejected write.",
     "Write timestamp older than read-max for item ⇒ reject to preserve order."),
    ("Difficult", "CASE_STUDY", "Case: move product catalog from RDBMS to document DB. Migration pitfalls.",
     "Join-heavy reporting, transactions across docs, duplication, schema evolution, transactional checkout still relational."),
    ("Difficult", "PROBLEM_SOLVING", "Explain how multiversion concurrency control (MVCC) serves readers without blocking writers (concept).",
     "Readers see snapshots; writers create versions; vacuum/GC old versions."),
    ("Difficult", "RESEARCH_TASK", "Compare primary-secondary replication lag impacts on read-your-writes.",
     "Session stickiness / causal tokens; read from primary when needed."),
    ("Difficult", "ALGORITHM", "Outline wound-wait or wait-die deadlock prevention.",
     "Use timestamps: wound-wait younger waits / older wounds; wait-die younger dies; prevents cycles."),
    ("Difficult", "COMPARE_JUSTIFY", "Justify CAP: why a partitioned system cannot provide both linearizability and perfect availability.",
     "Partition forces choice between answering (risk stale) vs refusing (preserve consistency)."),
    ("Easy", "APPLICATION", "Give one graph-DB use case poorly suited to relational joins-at-scale.",
     "Social friend-of-friend traversal deep paths."),
    ("Intermediate", "DESCRIPTIVE", "Define eventual consistency with an example of shopping cart merge.",
     "Replicas converge if no new updates; concurrent carts merge by item union with care for deletes."),
    ("Intermediate", "CODE_EXPLANATION", "Explain a MongoDB-style find query filtering nested document fields conceptually.",
     "Match on path into embedded doc/array; indexing dotted paths; array matching semantics."),
    ("Difficult", "INTERPRETATION", "Interpret a system choosing quorum R+W>N. What guarantee emerges?",
     "Read-write overlap ⇒ readers see latest acknowledged write under simple quorum models."),
]

PRIORITY = {
    "Theory-of-Computation": TOC,
    "Database-Management-Systems": DBMS,
}


def concepts_from_module(module_folder: str) -> List[str]:
    # Module-01-Foo-Bar -> [Foo, Bar, ...]
    m = re.match(r"^(?:Module|Unit)-\d+-(.+)$", module_folder, re.I)
    raw = m.group(1) if m else module_folder
    parts = [p for p in re.split(r"[-_]+", raw) if p and p.lower() not in {"and", "or", "the", "of", "to", "a"}]
    # also keep bigrams
    concepts = parts[:]
    for i in range(len(parts) - 1):
        concepts.append(f"{parts[i]} {parts[i+1]}")
    return concepts or [raw.replace("-", " ")]


def generic_questions(subject: str, module_folder: str, module_title: str, existing_text: str) -> List[Tuple[Diff, str, str, str]]:
    concepts = concepts_from_module(module_folder)
    # pull distinctive words from existing questions for alignment
    words = re.findall(r"[A-Za-z][A-Za-z0-9+\-/]{3,}", existing_text)
    freq = {}
    for w in words:
        lw = w.lower()
        if lw in {"question", "model", "answer", "marks", "easy", "intermediate", "difficult", "with", "that", "this", "from", "your", "into", "when", "what", "explain", "define"}:
            continue
        freq[lw] = freq.get(lw, 0) + 1
    top = [w for w, _ in sorted(freq.items(), key=lambda kv: -kv[1])[:12]]
    pool = concepts + [t.replace("-", " ") for t in top]
    # unique preserve order
    seen = set()
    pool2 = []
    for p in pool:
        k = p.lower()
        if k not in seen:
            seen.add(k)
            pool2.append(p)
    pool = pool2 or [module_title]

    def c(i: int) -> str:
        return pool[i % len(pool)]

    topic = module_title.split("—")[-1].strip() if "—" in module_title else module_title
    qs: List[Tuple[Diff, str, str, str]] = []

    templates: List[Tuple[Diff, str, str, str]] = [
        ("Easy", "DESCRIPTIVE",
         f"Define the core idea of {c(0)} as used in {topic}. Include one precise example.",
         f"{c(0)} is a foundational construct in {topic}. Example should name entities/operations and relate to {c(1)}. Avoid vague one-liners; state purpose and boundary."),
        ("Easy", "SHORT_ANALYSIS",
         f"Write short notes on {c(1)} and its role within {topic}.",
         f"Cover definition, where it appears in the module workflow, and one benefit/limitation. Tie to {c(0)} if relevant."),
        ("Easy", "DESCRIPTIVE",
         f"List four key terms a learner must know before applying {c(2)} in {subject}.",
         f"Provide four definitions: include {c(0)}, {c(1)}, and two adjacent terms from {topic}. One-line each."),
        ("Intermediate", "COMPARE_JUSTIFY",
         f"Compare and contrast {c(0)} and {c(1)} in the context of {topic}. Justify when to prefer each.",
         f"Use 3–4 dimensions (purpose, cost/complexity, guarantees, typical use). Conclude with a selection rule for {subject} scenarios."),
        ("Intermediate", "APPLICATION",
         f"Apply {c(2)} to a realistic campus/industry scenario relevant to {topic}. State assumptions.",
         f"Describe scenario, map concepts ({c(0)}, {c(1)}), show steps, and note failure modes if assumptions break."),
        ("Intermediate", "SCENARIO",
         f"Scenario: a team misapplies {c(0)} while building a solution involving {c(3)}. Diagnose and correct.",
         f"Identify the misconception, show the correct model using {topic} principles, and give a preventive checklist."),
        ("Intermediate", "DESIGN",
         f"Design a solution structure (diagram/steps/schema/algorithm as appropriate) for a problem centered on {c(1)} in {topic}.",
         f"State requirements, produce the design artifact, argue completeness (edge cases), and relate to {c(0)}."),
        ("Intermediate", "PROBLEM_SOLVING",
         f"Solve a worked problem involving {c(0)} and {c(2)}: show stepwise reasoning, not only the final claim.",
         f"Restate given data, choose method from {topic}, show intermediate results, box the final answer, and sanity-check."),
        ("Intermediate", "SHORT_ANALYSIS",
         f"Explain how {c(3)} depends on earlier ideas such as {c(0)} in {topic}.",
         f"Dependency chain with one counterexample showing what fails if {c(0)} is ignored."),
        ("Intermediate", "USE_CASE",
         f"Present a use case where {c(4)} measurably improves an outcome in {subject}.",
         f"Context, intervention using {c(4)}, metrics, and limits of generalization."),
        ("Intermediate", "INTERPRETATION",
         f"Interpret a hypothetical result/table/trace involving {c(1)} in {topic}. What does it imply?",
         f"Read the artifact carefully; infer meaning; list alternative explanations; conclude with best-supported claim."),
        ("Intermediate", "CODE_EXPLANATION",
         f"Explain (pseudocode-level) a standard procedure associated with {c(0)} in {topic}: inputs, steps, output.",
         f"Walk through control/data flow, complexity notes, and one edge case. Align terminology with {subject}."),
        ("Intermediate", "ALGORITHM",
         f"Give an algorithmic outline to compute/decide a property related to {c(2)} for {topic}.",
         f"Clear steps, termination argument, and correctness sketch referencing definitions of {c(2)}."),
        ("Difficult", "CASE_STUDY",
         f"Case study: an organization scales a system relying on {c(0)} and {c(1)}. Analyze trade-offs and recommend a design.",
         f"Frame problem, analyze with {topic} theory, compare alternatives, recommend with risks and monitoring."),
        ("Difficult", "RESEARCH_TASK",
         f"Research task: survey two standard approaches to {c(3)} within {topic}; cite what you would look up and synthesize differences.",
         f"Scope, comparison criteria, synthesis table, and a justified recommendation for a stated constraint."),
        ("Difficult", "DESIGN",
         f"Design an end-to-end approach for a non-trivial problem in {topic} that integrates {c(0)}, {c(1)}, and {c(2)}.",
         f"Requirements, architecture/steps, invariants, test plan, and discussion of complexity or integrity."),
        ("Difficult", "PROBLEM_SOLVING",
         f"Work a multi-step problem that appears to need both {c(0)} and {c(4)}. Show a correct method and a common wrong path.",
         f"Correct solution with reasoning; contrast mistaken approach; state the discriminating check."),
        ("Difficult", "COMPARE_JUSTIFY",
         f"Critically compare three strategies for handling {c(2)} under constraints typical of {subject}.",
         f"Criteria matrix, evidence from module concepts, recommendation with explicit justification."),
        ("Difficult", "SCENARIO",
         f"Hard scenario: conflicting stakeholder requirements around {c(1)} in {topic}. Propose a principled resolution.",
         f"Clarify conflicts, map to theory, propose compromise/technical solution, and evaluation criteria."),
        ("Difficult", "INTERPRETATION",
         f"Given a flawed student solution about {c(0)} in {topic}, interpret the error class and write a model correction.",
         f"Name the misconception, show corrected reasoning, and add a one-line exam tip to avoid the trap."),
    ]
    return templates


def count_existing(text: str) -> Tuple[int, Dict[str, int]]:
    nums = [int(x) for x in re.findall(r"^###\s+A0*(\d+)", text, flags=re.M)]
    diffs = {"Easy": 0, "Intermediate": 0, "Difficult": 0}
    for m in re.finditer(r"^###\s+A\d+\s*·\s*(\w+)", text, flags=re.M):
        d = m.group(1).title()
        if d in diffs:
            diffs[d] += 1
    return (max(nums) if nums else 0, diffs)


def expand_file(path: Path, subject: str, module_folder: str, force: bool = False) -> Tuple[int, int]:
    text = path.read_text(encoding="utf-8")
    # Drop weak generated A21+ so we can replace with quality items
    if force or "### A21" in text:
        # Keep A01-A20 only
        parts = re.split(r"(?=^###\s+A)", text, flags=re.M)
        header = parts[0]
        keep = []
        for part in parts[1:]:
            m = re.match(r"###\s+A0*(\d+)", part)
            if not m:
                continue
            if int(m.group(1)) <= 20:
                keep.append(part.rstrip() + "\n")
        text = header.rstrip() + "\n\n" + "\n".join(keep) + "\n"
        path.write_text(text, encoding="utf-8")
    max_n, diffs = count_existing(text)
    if max_n >= 40 and not force:
        return max_n, 0

    header_module = re.search(r"\*\*Module:\*\*\s*(.+)", text)
    module_title = header_module.group(1).strip() if header_module else module_folder

    bank = PRIORITY.get(subject, {}).get(module_folder)
    if bank is None:
        bank = generic_questions(subject.replace("-", " "), module_folder, module_title, text)

    # Aim for overall ~10 Easy / 20 Intermediate / 10 Difficult
    need = {"Easy": max(0, 10 - diffs["Easy"]),
            "Intermediate": max(0, 20 - diffs["Intermediate"]),
            "Difficult": max(0, 10 - diffs["Difficult"])}
    # still add until 40 total
    target_total = 40
    to_add = target_total - max_n

    selected: List[Tuple[Diff, str, str, str]] = []
    # First satisfy difficulty deficits in order Intermediate, Easy, Difficult preference toward intermediate
    order_pool = list(bank)
    def take_for(diff: Diff):
        nonlocal order_pool
        for i, item in enumerate(order_pool):
            if item[0] == diff:
                selected.append(item)
                order_pool.pop(i)
                return True
        return False

    while len(selected) < to_add and any(need.values()):
        progressed = False
        for diff in ("Intermediate", "Easy", "Difficult"):
            if need[diff] > 0 and len(selected) < to_add and take_for(diff):
                need[diff] -= 1
                progressed = True
        if not progressed:
            break
    while len(selected) < to_add and order_pool:
        selected.append(order_pool.pop(0))
    # If still short, synthesize extras from generic
    extra_i = 0
    while len(selected) < to_add:
        gens = generic_questions(subject.replace("-", " "), module_folder, module_title, text)
        selected.append(gens[extra_i % len(gens)])
        extra_i += 1

    blocks = []
    n = max_n
    for item in selected[:to_add]:
        n += 1
        diff, qtype, q, a = item
        blocks.append(fmt_q(n, diff, qtype, q, a))

    # update header counts
    new_text = text.rstrip() + "\n\n" + "\n".join(blocks) + "\n"
    new_text = re.sub(r"(\*\*Questions:\*\*\s*)\d+", rf"\g<1>{n}", new_text, count=1)
    # recompute bank total marks roughly
    total_marks = 0
    for m in re.finditer(r"·\s*(\d+)\s*marks", new_text):
        total_marks += int(m.group(1))
    if re.search(r"\*\*Bank total:\*\*", new_text):
        new_text = re.sub(
            r"\*\*Bank total:\*\*.*",
            f"**Bank total:** {total_marks} marks (faculty may select a 50-mark subset)  ",
            new_text,
            count=1,
        )
    path.write_text(new_text, encoding="utf-8")
    return n, to_add


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=str(Path(__file__).resolve().parents[4]))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    repo = Path(args.repo)
    public_root = repo / "apps/web/public/assessments"
    dist_root = repo / "apps/web/dist/assessments"

    before_total = 0
    after_total = 0
    modules = 0
    subjects = sorted([p for p in public_root.iterdir() if p.is_dir()])
    print(f"Subjects: {len(subjects)}")
    for subj_dir in subjects:
        for assign in sorted(subj_dir.rglob("assignment.md")):
            modules += 1
            text = assign.read_text(encoding="utf-8")
            max_n, _ = count_existing(text)
            before_total += max_n
            if args.dry_run:
                print(f"DRY {assign.relative_to(public_root)} has {max_n}")
                continue
            after_n, added = expand_file(assign, subj_dir.name, assign.parent.name, force=True)
            after_total += after_n
            # sync to dist if present
            dist_path = dist_root / assign.relative_to(public_root)
            if dist_path.parent.exists() or dist_root.exists():
                dist_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(assign, dist_path)
            print(f"{assign.relative_to(public_root)}: {max_n} → {after_n} (+{added})")
    if not args.dry_run:
        print(f"TOTAL modules={modules} questions {before_total} → {after_total}")
    else:
        print(f"DRY modules={modules} questions={before_total}")


if __name__ == "__main__":
    main()
