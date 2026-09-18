# Quiz — Theory of Computation — Module 2: Regular Expressions and Finite Automata

**Subject:** Theory of Computation  
**Module:** Module 2 — Regular Expressions and Finite Automata  
**Questions:** 73  
**Mix:** 12 Easy · 35 Intermediate · 26 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** L((a+b)*) is:

- **A.** {ab}
- **B.** {ε} only
- **C.** ∅
- **D.** {a,b}*

**Answer:** D
**Explanation:** Star of {a,b} is all strings.

### Q02  ·  Easy
**Question:** Regular languages are closed under:

- **A.** Arbitrary intersection of CFLs
- **B.** Only complement of CFLs
- **C.** Only concatenation
- **D.** Union, concatenation, star, complement, intersection

**Answer:** D
**Explanation:** REG is a Boolean algebra and a Kleene algebra.

### Q03  ·  Easy
**Question:** The regular expression ∅* denotes:

- **A.** ∅
- **B.** {ε}
- **C.** {a}
- **D.** Σ*

**Answer:** B
**Explanation:** Star of the empty language is {ε}.

### Q04  ·  Easy
**Question:** Which is a regular expression for even-length strings over {0,1}?

- **A.** (0+1)*1
- **B.** (0+1)(0+1)(0+1)
- **C.** (00+01+10+11)*
- **D.** a^n b^n

**Answer:** C
**Explanation:** Blocks of two symbols, including ε.

### Q05  ·  Easy
**Question:** Which option best describes **Closure under union**?

- **A.** Regular languages are not closed under union.
- **B.** If L and M are regular then L∪M is regular (RE r+s, or product/NFA).
- **C.** Union of regular languages may be context-free only.
- **D.** Union requires a TM.

**Answer:** B
**Explanation:** Closure under union: If L and M are regular then L∪M is regular (RE r+s, or product/NFA).

### Q06  ·  Easy
**Question:** Which option best describes **DFA minimisation**?

- **A.** Converting CFG to GNF.
- **B.** Deleting a TM’s halt state.
- **C.** Merging indistinguishable states to obtain the unique (up to renaming) smallest DFA for L.
- **D.** Pumping the start state.

**Answer:** C
**Explanation:** DFA minimisation: Merging indistinguishable states to obtain the unique (up to renaming) smallest DFA for L.

### Q07  ·  Easy
**Question:** Which option best describes **Equivalence of FA and RE**?

- **A.** REs denote a strictly larger class than DFAs.
- **B.** DFAs denote only finite languages.
- **C.** A language is regular iff it is L(DFA) iff L(NFA) iff L(ε-NFA) iff L(RE).
- **D.** ε-NFAs denote CFLs.

**Answer:** C
**Explanation:** Equivalence of FA and RE: A language is regular iff it is L(DFA) iff L(NFA) iff L(ε-NFA) iff L(RE).

### Q08  ·  Easy
**Question:** Which option best describes **Regular expression**?

- **A.** An expression built from ∅, ε, symbols, union, concatenation and Kleene star denoting a regular language.
- **B.** A TM program.
- **C.** A CFG with only unit productions.
- **D.** A pumping length.

**Answer:** A
**Explanation:** Regular expression: An expression built from ∅, ε, symbols, union, concatenation and Kleene star denoting a regular language.

### Q09  ·  Easy
**Question:** Which option best describes **Reverse of a language**?

- **A.** L^R is always equal to L.
- **B.** Reversal requires a two-stack PDA.
- **C.** L^R = { w^R | w∈L }; regular languages are closed under reversal (reverse arrows, swap start/F, ε-NFA).
- **D.** Reversal of a regular language is never regular.

**Answer:** C
**Explanation:** Reverse of a language: L^R = { w^R | w∈L }; regular languages are closed under reversal (reverse arrows, swap start/F, ε-NFA).

### Q10  ·  Easy
**Question:** Which option best describes **State elimination**?

- **A.** CNF conversion.
- **B.** A method to convert a FA into an equivalent regular expression by ripping states.
- **C.** Removing unreachable TM states.
- **D.** ε-closure only.

**Answer:** B
**Explanation:** State elimination: A method to convert a FA into an equivalent regular expression by ripping states.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **DFA minimisation (table filling)**?

- **A.** Swap F and halt
- **B.** Build a product with a TM
- **C.** Merge all states first then split randomly
- **D.** Mark accept/reject pairs → repeatedly mark pairs whose successors are marked → merge unmarked pairs

**Answer:** D
**Explanation:** Correct sequence for DFA minimisation (table filling): Mark accept/reject pairs → repeatedly mark pairs whose successors are marked → merge unmarked pairs

### Q12  ·  Easy
**Question:** Which sequence correctly describes **RE → DFA (typical lexer pipeline)**?

- **A.** Write a TM → reduce HALT
- **B.** RE → Thompson ε-NFA → subset construction DFA → minimise
- **C.** Pump the RE → CNF → PDA
- **D.** CYK the regex

**Answer:** B
**Explanation:** Correct sequence for RE → DFA (typical lexer pipeline): RE → Thompson ε-NFA → subset construction DFA → minimise

### Q13  ·  Intermediate
**Question:** (0+1)* and (0*1*)* denote:

- **A.** Only {ε}
- **B.** Different languages
- **C.** Only even-length strings
- **D.** The same language {0,1}*

**Answer:** D
**Explanation:** Any bit string is a concatenation of 0*1* blocks.

### Q14  ·  Intermediate
**Question:** A language is regular iff it is generated by:

- **A.** A context-sensitive grammar only
- **B.** A non-deterministic TM only
- **C.** A regular expression (equivalently a FA)
- **D.** An unrestricted grammar only

**Answer:** C
**Explanation:** Kleene’s theorem.

### Q15  ·  Intermediate
**Question:** Arden’s lemma: if ε∉P then R=Q+RP has solution:

- **A.** R=Q*
- **B.** R=P+Q
- **C.** R=QP*
- **D.** R=PQ*

**Answer:** C
**Explanation:** Unique solution QP* when P is ε-free.

### Q16  ·  Intermediate
**Question:** Complement of a regex language in a scanner (e.g. not a keyword) is easy if you first:

- **A.** Build a complete DFA and swap F
- **B.** Convert to a PDA
- **C.** Swap F on the NFA directly
- **D.** Apply pumping

**Answer:** A
**Explanation:** Complement needs a total DFA.

### Q17  ·  Intermediate
**Question:** The pumping lemma is used mainly to:

- **A.** Solve Arden’s equation
- **B.** Prove certain languages are not regular
- **C.** Minimise DFAs
- **D.** Prove every language is regular

**Answer:** B
**Explanation:** It is a necessary condition; failure ⇒ not regular.

### Q18  ·  Intermediate
**Question:** To prove {a^n b^n | n≥0} is not regular, the standard tool is:

- **A.** Arden’s lemma
- **B.** Pumping lemma (or Myhill–Nerode infinite index)
- **C.** Swapping F in a DFA
- **D.** Thompson construction

**Answer:** B
**Explanation:** Pump a^p b^p to unbalance counts.

### Q19  ·  Intermediate
**Question:** Two DFAs might look different but accept the same L. Uniqueness up to isomorphism holds for the:

- **A.** Any RE
- **B.** Any ε-NFA
- **C.** Minimal DFA
- **D.** Any NFA

**Answer:** C
**Explanation:** The minimal DFA is unique.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **Arden** and **state elimination**?

- **A.** Both solve FA→RE; Arden uses linear language equations, elimination rips states.
- **B.** They produce non-regular sets.
- **C.** State elimination is only for CFGs.
- **D.** Arden requires a TM.

**Answer:** A
**Explanation:** Both solve FA→RE; Arden uses linear language equations, elimination rips states.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **DFA minimisation** and **subset construction**?

- **A.** Subset construction shrinks DFAs.
- **B.** Minimisation builds an NFA from an RE.
- **C.** Subset construction may blow up states; minimisation merges equivalent ones afterward.
- **D.** They are the same algorithm.

**Answer:** C
**Explanation:** Subset construction may blow up states; minimisation merges equivalent ones afterward.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **complete DFA complement** and **NFA F-swap**?

- **A.** DFAs cannot be complemented.
- **B.** NFAs complement by F-swap.
- **C.** Complement is safe on a complete DFA; swapping F on an NFA does not complement.
- **D.** Both methods always work.

**Answer:** C
**Explanation:** Complement is safe on a complete DFA; swapping F on an NFA does not complement.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **regular expression** and **CFG**?

- **A.** REs can count a^n b^n.
- **B.** REs generate regular languages; CFGs generate the larger CFL class.
- **C.** Every CFG has an equivalent RE.
- **D.** They denote the same family.

**Answer:** B
**Explanation:** REs generate regular languages; CFGs generate the larger CFL class.

### Q24  ·  Intermediate
**Question:** Which option best describes **Arden’s lemma**?

- **A.** A pumping lemma for CFLs.
- **B.** If ε∉L(P) then R=Q+RP has unique solution R=QP*.
- **C.** Myhill–Nerode index formula.
- **D.** A TM reduction.

**Answer:** B
**Explanation:** Arden’s lemma: If ε∉L(P) then R=Q+RP has unique solution R=QP*.

### Q25  ·  Intermediate
**Question:** Which option best describes **Closure under complement**?

- **A.** Regular languages are closed under complement by swapping F in a complete DFA.
- **B.** Complement needs a PDA.
- **C.** Complement of a regular language is always finite.
- **D.** NFAs complement by swapping F without making δ total.

**Answer:** A
**Explanation:** Closure under complement: Regular languages are closed under complement by swapping F in a complete DFA.

### Q26  ·  Intermediate
**Question:** Which option best describes **Closure under intersection**?

- **A.** Intersection needs CNF.
- **B.** Regular languages are closed under ∩ via product automata (or De Morgan).
- **C.** Regular languages are not closed under ∩.
- **D.** Intersection of regular languages can be non-RE.

**Answer:** B
**Explanation:** Closure under intersection: Regular languages are closed under ∩ via product automata (or De Morgan).

### Q27  ·  Intermediate
**Question:** Which option best describes **Distinguishable strings**?

- **A.** Only ε and a.
- **B.** Strings that a DFA maps to the same state.
- **C.** Strings of equal length.
- **D.** x and y are distinguishable w.r.t. L if some continuation z puts exactly one of xz, yz in L.

**Answer:** D
**Explanation:** Distinguishable strings: x and y are distinguishable w.r.t. L if some continuation z puts exactly one of xz, yz in L.

### Q28  ·  Intermediate
**Question:** Which option best describes **Finite language**?

- **A.** Any finite set of strings is regular (RE as a big union, or a trie-like DFA).
- **B.** Finite languages are not regular.
- **C.** Only infinite languages are regular.
- **D.** Finite languages need a TM to list them.

**Answer:** A
**Explanation:** Finite language: Any finite set of strings is regular (RE as a big union, or a trie-like DFA).

### Q29  ·  Intermediate
**Question:** Which option best describes **Homomorphism**?

- **A.** A stack homomorphism only.
- **B.** A TM encoding of states.
- **C.** A string map h(σ)∈Γ* extended by concatenation; regular languages are closed under h and h^{-1}.
- **D.** A parse-tree yield.

**Answer:** C
**Explanation:** Homomorphism: A string map h(σ)∈Γ* extended by concatenation; regular languages are closed under h and h^{-1}.

### Q30  ·  Intermediate
**Question:** Which option best describes **Indistinguishable states**?

- **A.** States with equal out-degree.
- **B.** States with the same name.
- **C.** Any two accepting states.
- **D.** p and q are equivalent if for every w, δ̂(p,w)∈F iff δ̂(q,w)∈F.

**Answer:** D
**Explanation:** Indistinguishable states: p and q are equivalent if for every w, δ̂(p,w)∈F iff δ̂(q,w)∈F.

### Q31  ·  Intermediate
**Question:** Which option best describes **Language of an RE**?

- **A.** The set of parse trees of the expression.
- **B.** Always Σ*.
- **C.** The unique regular language obtained by interpreting the operators inductively.
- **D.** Always a finite set.

**Answer:** C
**Explanation:** Language of an RE: The unique regular language obtained by interpreting the operators inductively.

### Q32  ·  Intermediate
**Question:** Which option best describes **Myhill–Nerode relation**?

- **A.** x ≡_L y iff ∀z, xz∈L ⇔ yz∈L; L is regular iff ≡_L has finitely many classes.
- **B.** Arden’s unique-solution test.
- **C.** A TM tape compression.
- **D.** A stack discipline for PDAs.

**Answer:** A
**Explanation:** Myhill–Nerode relation: x ≡_L y iff ∀z, xz∈L ⇔ yz∈L; L is regular iff ≡_L has finitely many classes.

### Q33  ·  Intermediate
**Question:** Which option best describes **Positive closure L+**?

- **A.** L+ is the complement of L*.
- **B.** L+ = LL* = L* without forcing ε unless ε∈L.
- **C.** L+ always contains ε.
- **D.** L+ is L∪{ε}.

**Answer:** B
**Explanation:** Positive closure L+: L+ = LL* = L* without forcing ε unless ε∈L.

### Q34  ·  Intermediate
**Question:** Which option best describes **Pumping lemma (RL)**?

- **A.** If L is regular then ∃p such that any w∈L with |w|≥p can be split xyz, |xy|≤p, |y|≥1, xy^k z∈L ∀k≥0.
- **B.** A parse-tree lemma.
- **C.** A method to prove a language is regular.
- **D.** A conversion from RE to DFA.

**Answer:** A
**Explanation:** Pumping lemma (RL): If L is regular then ∃p such that any w∈L with |w|≥p can be split xyz, |xy|≤p, |y|≥1, xy^k z∈L ∀k≥0.

### Q35  ·  Intermediate
**Question:** Which option best describes **Thompson construction**?

- **A.** A systematic RE→ε-NFA translation using fragments for ∪, · and *.
- **B.** CYK parsing.
- **C.** Arden’s lemma.
- **D.** A DFA minimisation algorithm.

**Answer:** A
**Explanation:** Thompson construction: A systematic RE→ε-NFA translation using fragments for ∪, · and *.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **DFA → RE (state elimination)**?

- **A.** Delete F then complement
- **B.** Add new start/accept via ε → rip internal states, replacing edges by REs → read the remaining RE
- **C.** Convert to GNF first
- **D.** Apply pumping with k=0

**Answer:** B
**Explanation:** Correct sequence for DFA → RE (state elimination): Add new start/accept via ε → rip internal states, replacing edges by REs → read the remaining RE

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **Pumping-lemma attack on a candidate non-regular L**?

- **A.** Assume regular with p → pick w∈L, |w|≥p → consider all xyz splits allowed → find k with xy^k z∉L
- **B.** Apply Arden until it fails
- **C.** Construct an RE for L
- **D.** Minimise a DFA for L

**Answer:** A
**Explanation:** Correct sequence for Pumping-lemma attack on a candidate non-regular L: Assume regular with p → pick w∈L, |w|≥p → consider all xyz splits allowed → find k with xy^k z∉L

### Q38  ·  Intermediate
**Question:** Which statement about **Arden’s lemma** is FALSE?

- **A.** Arden’s lemma requires ε∈P to have a unique R.
- **B.** A useful way to remember Arden’s lemma is that it is not the same as “A pumping lemma for CFLs”.
- **C.** Arden’s lemma is correctly understood as: if ε∉L(P) then R=Q+RP has unique solution R=QP*.
- **D.** In this module, Arden’s lemma is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Arden’s lemma requires ε∈P to have a unique R.. Arden’s lemma actually means: If ε∉L(P) then R=Q+RP has unique solution R=QP*.

### Q39  ·  Intermediate
**Question:** Which statement about **Closure under intersection** is FALSE?

- **A.** Closure under intersection is correctly understood as: regular languages are closed under ∩ via product automata (or De Morgan).
- **B.** In this module, Closure under intersection is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Closure under intersection is that it is not the same as “Intersection of regular languages can be non-RE”.
- **D.** Product automata recognise concatenation, not intersection.

**Answer:** D
**Explanation:** The false claim is: Product automata recognise concatenation, not intersection.. Closure under intersection actually means: Regular languages are closed under ∩ via product automata (or De Morgan).

### Q40  ·  Intermediate
**Question:** Which statement about **Closure under union** is FALSE?

- **A.** Closure under union is correctly understood as: if L and M are regular then L∪M is regular (RE r+s, or product/NFA).
- **B.** A useful way to remember Closure under union is that it is not the same as “Union of regular languages may be context-free only”.
- **C.** L∪M is regular only when L∩M=∅.
- **D.** In this module, Closure under union is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: L∪M is regular only when L∩M=∅.. Closure under union actually means: If L and M are regular then L∪M is regular (RE r+s, or product/NFA).

### Q41  ·  Intermediate
**Question:** Which statement about **DFA minimisation** is FALSE?

- **A.** Two different minimal DFAs for the same L can be non-isomorphic.
- **B.** DFA minimisation is correctly understood as: merging indistinguishable states to obtain the unique (up to renaming) smallest DFA for L.
- **C.** In this module, DFA minimisation is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember DFA minimisation is that it is not the same as “Deleting a TM’s halt state”.

**Answer:** A
**Explanation:** The false claim is: Two different minimal DFAs for the same L can be non-isomorphic.. DFA minimisation actually means: Merging indistinguishable states to obtain the unique (up to renaming) smallest DFA for L.

### Q42  ·  Intermediate
**Question:** Which statement about **Homomorphism** is FALSE?

- **A.** A homomorphism can map a regular language to {a^n b^n}.
- **B.** A useful way to remember Homomorphism is that it is not the same as “A TM encoding of states”.
- **C.** In this module, Homomorphism is a core idea students must distinguish from nearby terms.
- **D.** Homomorphism is correctly understood as: a string map h(σ)∈Γ* extended by concatenation; regular languages are closed under h and h^{-1}.

**Answer:** A
**Explanation:** The false claim is: A homomorphism can map a regular language to {a^n b^n}.. Homomorphism actually means: A string map h(σ)∈Γ* extended by concatenation; regular languages are closed under h and h^{-1}.

### Q43  ·  Intermediate
**Question:** Which statement about **Myhill–Nerode relation** is FALSE?

- **A.** Myhill–Nerode relation is correctly understood as: x ≡_L y iff ∀z, xz∈L ⇔ yz∈L; L is regular iff ≡_L has finitely many classes.
- **B.** In this module, Myhill–Nerode relation is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Myhill–Nerode relation is that it is not the same as “A stack discipline for PDAs”.
- **D.** Infinitely many ≡_L classes still allow a DFA.

**Answer:** D
**Explanation:** The false claim is: Infinitely many ≡_L classes still allow a DFA.. Myhill–Nerode relation actually means: x ≡_L y iff ∀z, xz∈L ⇔ yz∈L; L is regular iff ≡_L has finitely many classes.

### Q44  ·  Intermediate
**Question:** Which statement about **Positive closure L+** is FALSE?

- **A.** In this module, Positive closure L+ is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Positive closure L+ is that it is not the same as “L+ always contains ε”.
- **C.** L+ equals L* for every L.
- **D.** Positive closure L+ is correctly understood as: l+ = LL* = L* without forcing ε unless ε∈L.

**Answer:** C
**Explanation:** The false claim is: L+ equals L* for every L.. Positive closure L+ actually means: L+ = LL* = L* without forcing ε unless ε∈L.

### Q45  ·  Intermediate
**Question:** Which statement about **Regular expression** is FALSE?

- **A.** In this module, Regular expression is a core idea students must distinguish from nearby terms.
- **B.** Regular expressions can denote {a^n b^n | n≥0}.
- **C.** Regular expression is correctly understood as: an expression built from ∅, ε, symbols, union, concatenation and Kleene star denoting a regular language.
- **D.** A useful way to remember Regular expression is that it is not the same as “A CFG with only unit productions”.

**Answer:** B
**Explanation:** The false claim is: Regular expressions can denote {a^n b^n | n≥0}.. Regular expression actually means: An expression built from ∅, ε, symbols, union, concatenation and Kleene star denoting a regular language.

### Q46  ·  Intermediate
**Question:** Which statement about **Thompson construction** is FALSE?

- **A.** Thompson construction is correctly understood as: a systematic RE→ε-NFA translation using fragments for ∪, · and *.
- **B.** Thompson’s method yields a deterministic PDA.
- **C.** A useful way to remember Thompson construction is that it is not the same as “A DFA minimisation algorithm”.
- **D.** In this module, Thompson construction is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Thompson’s method yields a deterministic PDA.. Thompson construction actually means: A systematic RE→ε-NFA translation using fragments for ∪, · and *.

### Q47  ·  Intermediate
**Question:** Why doesn’t swapping accept/reject states of an NFA complement the language?

- **A.** You must first convert to a CFG
- **B.** NFAs cannot reject
- **C.** Complement is not defined for regular languages
- **D.** Some strings have both accepting and rejecting paths; also missing transitions

**Answer:** D
**Explanation:** Existential acceptance and partial δ break F-swap.

### Q48  ·  Difficult
**Question:** A DFA has 5 states. A pumping length p that is always safe to use in the RL pumping lemma is:

- **A.** 1 always, for every DFA
- **B.** 5
- **C.** ∞
- **D.** 10 only

**Answer:** B
**Explanation:** p ≤ |Q| works; |Q|=5 is a valid pumping length.

### Q49  ·  Difficult
**Question:** A compiler’s regex for comments is converted to an NFA then a DFA. The algorithm NFA→DFA is:

- **A.** Rice’s theorem
- **B.** Subset construction
- **C.** Earley
- **D.** CYK

**Answer:** B
**Explanation:** Lexers compile RE→NFA→DFA (and minimise).

### Q50  ·  Difficult
**Question:** How many strings does the RE (0+1)(0+1) denote?

- **A.** 2
- **B.** 1
- **C.** 4
- **D.** infinite

**Answer:** C
**Explanation:** Length-2 bit strings: 00,01,10,11.

### Q51  ·  Difficult
**Question:** If ≡_L has infinitely many classes, then:

- **A.** L has a 1-state DFA
- **B.** L is not regular
- **C.** L is finite
- **D.** L is regular but infinite

**Answer:** B
**Explanation:** Myhill–Nerode: regular iff finite index.

### Q52  ·  Difficult
**Question:** L = { a^n b^n | n≥0 }. If it were regular with pumping length p, |w|=2p for w=a^p b^p. After pumping y of a’s once (k=2), |w'| is:

- **A.** greater than 2p with more a’s than b’s
- **B.** still 2p with equal a’s and b’s
- **C.** always 0
- **D.** always p

**Answer:** A
**Explanation:** y lies in the first p symbols (all a’s), so xyyz has extra a’s.

### Q53  ·  Difficult
**Question:** Minimal DFA for (0+1)*1 over {0,1} has how many states?

- **A.** 8
- **B.** 1
- **C.** 2
- **D.** 4

**Answer:** C
**Explanation:** States: last bit 0 (reject) and last bit 1 (accept).

### Q54  ·  Difficult
**Question:** Minimal DFA for strings over {0,1} ending with 01 has how many states?

- **A.** 3
- **B.** 1
- **C.** 2
- **D.** 4

**Answer:** A
**Explanation:** Track progress toward suffix 01: ε, 0, 01.

### Q55  ·  Difficult
**Question:** Minimisation marks (accept,reject) pairs as distinguishable first because:

- **A.** REs cannot be minimised
- **B.** A string ε already separates F from Q−F
- **C.** Minimisation ignores F
- **D.** All states start equivalent

**Answer:** B
**Explanation:** 0-equivalence is the F vs non-F partition.

### Q56  ·  Difficult
**Question:** Myhill–Nerode says a^n b^n is not regular because:

- **A.** The prefixes a^i (i=0,1,…) are pairwise distinguishable
- **B.** It has a 2-state DFA
- **C.** It equals (ab)*
- **D.** The language is finite

**Answer:** A
**Explanation:** b^i is a distinguishing continuation for a^i.

### Q57  ·  Difficult
**Question:** Number of Myhill–Nerode classes of { w | w has even number of 0s } over {0,1} is:

- **A.** 26
- **B.** 2
- **C.** infinite
- **D.** 1

**Answer:** B
**Explanation:** Even-0s vs odd-0s prefixes; 1s do not change the class.

### Q58  ·  Difficult
**Question:** RE (a+b)*ab(a+b)* . After converting and minimising, a typical DFA has how many states (progress toward ‘ab’)?

- **A.** 1
- **B.** 8
- **C.** 3
- **D.** 26

**Answer:** C
**Explanation:** Have not started / have a / have seen ab (absorbing accept).

### Q59  ·  Difficult
**Question:** Two states p,q of a DFA are equivalent iff:

- **A.** δ(p,a)=δ(q,a) for one symbol a only
- **B.** They have the same number of loops
- **C.** Both are start states
- **D.** No string leads to different accept/reject from p vs q

**Answer:** D
**Explanation:** Definition of k-equivalence in the limit.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **L*** and **L+**?

- **A.** L* always contains ε; L+ contains ε iff ε∈L.
- **B.** L* excludes ε.
- **C.** L+ is a non-regular operator.
- **D.** They are always equal.

**Answer:** A
**Explanation:** L* always contains ε; L+ contains ε iff ε∈L.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **finite language** and **infinite regular language**?

- **A.** Infinite ⇒ not regular.
- **B.** Regularity forbids infinity.
- **C.** Finite sets are regular; infinite regular sets still have a DFA/RE (e.g. a*).
- **D.** Finite ⇒ not regular.

**Answer:** C
**Explanation:** Finite sets are regular; infinite regular sets still have a DFA/RE (e.g. a*).

### Q62  ·  Difficult
**Question:** What is the most important distinction between **pumping lemma** and **Myhill–Nerode**?

- **A.** Both convert RE to NFA.
- **B.** Pumping gives a necessary condition used to show non-regularity; MN is iff finite index.
- **C.** Pumping characterises regularity completely.
- **D.** MN cannot prove non-regularity.

**Answer:** B
**Explanation:** Pumping gives a necessary condition used to show non-regularity; MN is iff finite index.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **union of REs** and **concatenation of REs**?

- **A.** r+s denotes L(r)∪L(s); rs denotes concatenations.
- **B.** r+s is concatenation.
- **C.** rs is the same language as r+s.
- **D.** Star is the same as union.

**Answer:** A
**Explanation:** r+s denotes L(r)∪L(s); rs denotes concatenations.

### Q64  ·  Difficult
**Question:** Which statement about **Closure under complement** is FALSE?

- **A.** Closure under complement is correctly understood as: regular languages are closed under complement by swapping F in a complete DFA.
- **B.** In this module, Closure under complement is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Closure under complement is that it is not the same as “NFAs complement by swapping F without making δ total”.
- **D.** Complementing an NFA’s F always yields the complement language.

**Answer:** D
**Explanation:** The false claim is: Complementing an NFA’s F always yields the complement language.. Closure under complement actually means: Regular languages are closed under complement by swapping F in a complete DFA.

### Q65  ·  Difficult
**Question:** Which statement about **Distinguishable strings** is FALSE?

- **A.** If two strings reach the same DFA state they must be distinguishable.
- **B.** A useful way to remember Distinguishable strings is that it is not the same as “Strings of equal length”.
- **C.** Distinguishable strings is correctly understood as: x and y are distinguishable w.r.t. L if some continuation z puts exactly one of xz, yz in L.
- **D.** In this module, Distinguishable strings is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: If two strings reach the same DFA state they must be distinguishable.. Distinguishable strings actually means: x and y are distinguishable w.r.t. L if some continuation z puts exactly one of xz, yz in L.

### Q66  ·  Difficult
**Question:** Which statement about **Equivalence of FA and RE** is FALSE?

- **A.** In this module, Equivalence of FA and RE is a core idea students must distinguish from nearby terms.
- **B.** Equivalence of FA and RE is correctly understood as: a language is regular iff it is L(DFA) iff L(NFA) iff L(ε-NFA) iff L(RE).
- **C.** A useful way to remember Equivalence of FA and RE is that it is not the same as “REs denote a strictly larger class than DFAs”.
- **D.** Some regular languages have no regular expression.

**Answer:** D
**Explanation:** The false claim is: Some regular languages have no regular expression.. Equivalence of FA and RE actually means: A language is regular iff it is L(DFA) iff L(NFA) iff L(ε-NFA) iff L(RE).

### Q67  ·  Difficult
**Question:** Which statement about **Finite language** is FALSE?

- **A.** A finite language cannot have a regular expression.
- **B.** In this module, Finite language is a core idea students must distinguish from nearby terms.
- **C.** Finite language is correctly understood as: any finite set of strings is regular (RE as a big union, or a trie-like DFA).
- **D.** A useful way to remember Finite language is that it is not the same as “Finite languages are not regular”.

**Answer:** A
**Explanation:** The false claim is: A finite language cannot have a regular expression.. Finite language actually means: Any finite set of strings is regular (RE as a big union, or a trie-like DFA).

### Q68  ·  Difficult
**Question:** Which statement about **Indistinguishable states** is FALSE?

- **A.** Indistinguishable states is correctly understood as: p and q are equivalent if for every w, δ̂(p,w)∈F iff δ̂(q,w)∈F.
- **B.** In this module, Indistinguishable states is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Indistinguishable states is that it is not the same as “States with the same name”.
- **D.** An accepting state can be equivalent to a rejecting state.

**Answer:** D
**Explanation:** The false claim is: An accepting state can be equivalent to a rejecting state.. Indistinguishable states actually means: p and q are equivalent if for every w, δ̂(p,w)∈F iff δ̂(q,w)∈F.

### Q69  ·  Difficult
**Question:** Which statement about **Language of an RE** is FALSE?

- **A.** A useful way to remember Language of an RE is that it is not the same as “Always a finite set”.
- **B.** L(r) is context-sensitive but not regular.
- **C.** Language of an RE is correctly understood as: the unique regular language obtained by interpreting the operators inductively.
- **D.** In this module, Language of an RE is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: L(r) is context-sensitive but not regular.. Language of an RE actually means: The unique regular language obtained by interpreting the operators inductively.

### Q70  ·  Difficult
**Question:** Which statement about **Pumping lemma (RL)** is FALSE?

- **A.** A useful way to remember Pumping lemma (RL) is that it is not the same as “A method to prove a language is regular”.
- **B.** The pumping lemma is a sufficient condition for regularity.
- **C.** Pumping lemma (RL) is correctly understood as: if L is regular then ∃p such that any w∈L with |w|≥p can be split xyz, |xy|≤p, |y|≥1, xy^k z∈L ∀k≥0.
- **D.** In this module, Pumping lemma (RL) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The pumping lemma is a sufficient condition for regularity.. Pumping lemma (RL) actually means: If L is regular then ∃p such that any w∈L with |w|≥p can be split xyz, |xy|≤p, |y|≥1, xy^k z∈L ∀k≥0.

### Q71  ·  Difficult
**Question:** Which statement about **Reverse of a language** is FALSE?

- **A.** Reverse of a language is correctly understood as: l^R = { w^R | w∈L }; regular languages are closed under reversal (reverse arrows, swap start/F, ε-NFA).
- **B.** A useful way to remember Reverse of a language is that it is not the same as “Reversal of a regular language is never regular”.
- **C.** Reversing a DFA always yields a DFA without ε-moves.
- **D.** In this module, Reverse of a language is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Reversing a DFA always yields a DFA without ε-moves.. Reverse of a language actually means: L^R = { w^R | w∈L }; regular languages are closed under reversal (reverse arrows, swap start/F, ε-NFA).

### Q72  ·  Difficult
**Question:** Which statement about **State elimination** is FALSE?

- **A.** State elimination is correctly understood as: a method to convert a FA into an equivalent regular expression by ripping states.
- **B.** In this module, State elimination is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember State elimination is that it is not the same as “Removing unreachable TM states”.
- **D.** State elimination can produce a non-regular expression.

**Answer:** D
**Explanation:** The false claim is: State elimination can produce a non-regular expression.. State elimination actually means: A method to convert a FA into an equivalent regular expression by ripping states.

### Q73  ·  Difficult
**Question:** You have an NFA and want an RE. A classroom method is:

- **A.** State elimination or Arden’s equations
- **B.** Post correspondence
- **C.** Greibach normal form
- **D.** Pumping lemma

**Answer:** A
**Explanation:** FA→RE via elimination/Arden.

---

## Quick answer key

Q01–D | Q02–D | Q03–B | Q04–C | Q05–B | Q06–C | Q07–C | Q08–A | Q09–C | Q10–B | Q11–D | Q12–B | Q13–D | Q14–C | Q15–C | Q16–A | Q17–B | Q18–B | Q19–C | Q20–A | Q21–C | Q22–C | Q23–B | Q24–B | Q25–A | Q26–B | Q27–D | Q28–A | Q29–C | Q30–D | Q31–C | Q32–A | Q33–B | Q34–A | Q35–A | Q36–B | Q37–A | Q38–A | Q39–D | Q40–C | Q41–A | Q42–A | Q43–D | Q44–C | Q45–B | Q46–B | Q47–D | Q48–B | Q49–B | Q50–C | Q51–B | Q52–A | Q53–C | Q54–A | Q55–B | Q56–A | Q57–B | Q58–C | Q59–D | Q60–A | Q61–C | Q62–B | Q63–A | Q64–D | Q65–A | Q66–D | Q67–A | Q68–D | Q69–B | Q70–B | Q71–C | Q72–D | Q73–A
