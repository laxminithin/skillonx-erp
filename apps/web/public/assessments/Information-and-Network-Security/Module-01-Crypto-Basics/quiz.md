# Quiz — Information and Network Security — Module 1: Crypto Basics

**Subject:** Information and Network Security  
**Module:** Module 1 — Crypto Basics  
**Questions:** 74  
**Mix:** 13 Easy · 36 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Asymmetric encryption allows:

- **A.** The same AES key to be posted on the notice board safely as a private key
- **B.** Anyone to encrypt to Alice using Alice’s public key; only Alice decrypts
- **C.** Hash-only confidentiality
- **D.** Anyone to decrypt with the public key

**Answer:** B
**Explanation:** Public-key encryption.

### Q02  ·  Easy
**Question:** CIA in information security stands for:

- **A.** Code, IV, Authentication-tag only
- **B.** Cipher, Index, AES
- **C.** Certificate, Issuer, Authority
- **D.** Confidentiality, Integrity, Availability

**Answer:** D
**Explanation:** Classic security triad.

### Q03  ·  Easy
**Question:** Symmetric cryptography’s main key-distribution problem is:

- **A.** Sharing the secret key without exposing it to eavesdroppers
- **B.** Publishing the private key
- **C.** Computing totient of n
- **D.** Choosing a hash IV

**Answer:** A
**Explanation:** Shared-secret logistics.

### Q04  ·  Easy
**Question:** Which is a transposition cipher?

- **A.** Caesar shift
- **B.** Monoalphabetic letter swap
- **C.** Vigenère
- **D.** Rail fence / columnar transposition

**Answer:** D
**Explanation:** Order changes, letters stay.

### Q05  ·  Easy
**Question:** Which option best describes **Confidentiality**?

- **A.** Guaranteeing a service is up.
- **B.** Ensuring a message was not modified, without secrecy.
- **C.** Ensuring that information is not disclosed to unauthorized parties (typically via encryption or access control).
- **D.** Proving who sent a message.

**Answer:** C
**Explanation:** Confidentiality: Ensuring that information is not disclosed to unauthorized parties (typically via encryption or access control).

### Q06  ·  Easy
**Question:** Which option best describes **Confusion**?

- **A.** Shannon’s property: making the relation between ciphertext and the key as complex as possible (often substitution).
- **B.** A replay counter.
- **C.** Spreading a plaintext bit into many ciphertext bits (diffusion).
- **D.** Publishing the key.

**Answer:** A
**Explanation:** Confusion: Shannon’s property: making the relation between ciphertext and the key as complex as possible (often substitution).

### Q07  ·  Easy
**Question:** Which option best describes **Kerckhoffs’ principle**?

- **A.** A cryptosystem should remain secure if everything except the key is public knowledge.
- **B.** Security by hiding the algorithm (security through obscurity) is sufficient.
- **C.** The key must be published with the ciphertext.
- **D.** Ciphers must use a codebook of phrases only.

**Answer:** A
**Explanation:** Kerckhoffs’ principle: A cryptosystem should remain secure if everything except the key is public knowledge.

### Q08  ·  Easy
**Question:** Which option best describes **Known-plaintext attack**?

- **A.** The attacker has matching plaintext-ciphertext pairs and tries to recover the key or decrypt other traffic.
- **B.** The attacker is the legitimate sender.
- **C.** A DoS flood.
- **D.** The attacker has only ciphertext and no language statistics.

**Answer:** A
**Explanation:** Known-plaintext attack: The attacker has matching plaintext-ciphertext pairs and tries to recover the key or decrypt other traffic.

### Q09  ·  Easy
**Question:** Which option best describes **One-time pad (OTP)**?

- **A.** A codebook of 10 phrases.
- **B.** AES with a password reused for a year.
- **C.** XOR (or modular add) of plaintext with a truly random key as long as the message, used only once; information-theoretically secret if the key is secret and never reused.
- **D.** A Caesar shift of 1 used every day.

**Answer:** C
**Explanation:** One-time pad (OTP): XOR (or modular add) of plaintext with a truly random key as long as the message, used only once; information-theoretically secret if the key is secret and never reused.

### Q10  ·  Easy
**Question:** Which option best describes **Polyalphabetic cipher**?

- **A.** A hash function.
- **B.** A single fixed alphabet permutation for the whole text.
- **C.** The substitution mapping changes during the message (for example, Vigenère with a repeating key).
- **D.** An Enigma rotor that never moves.

**Answer:** C
**Explanation:** Polyalphabetic cipher: The substitution mapping changes during the message (for example, Vigenère with a repeating key).

### Q11  ·  Easy
**Question:** Which option best describes **Substitution cipher**?

- **A.** A one-way hash with no inverse.
- **B.** A public-key modulus.
- **C.** Plaintext symbols are replaced by other symbols according to a mapping (monoalphabetic or polyalphabetic).
- **D.** The order of letters is shuffled but letters stay the same.

**Answer:** C
**Explanation:** Substitution cipher: Plaintext symbols are replaced by other symbols according to a mapping (monoalphabetic or polyalphabetic).

### Q12  ·  Easy
**Question:** Which sequence correctly describes **Kerckhoffs design checklist**?

- **A.** Publish/peer-review the algorithm → keep keys secret and managed → size the key space against brute force → assume attacker knows the system
- **B.** Rely on a secret shift of 3 forever
- **C.** Ship the key in the APK as a string
- **D.** Hide the C source and use a 4-letter password

**Answer:** A
**Explanation:** Correct sequence for Kerckhoffs design checklist: Publish/peer-review the algorithm → keep keys secret and managed → size the key space against brute force → assume attacker knows the system

### Q13  ·  Easy
**Question:** Which sequence correctly describes **breaking a monoalphabetic English cipher**?

- **A.** Ignore frequencies and hope
- **B.** Try all 2^128 AES keys first
- **C.** Collect ciphertext → tally letter/n-gram frequencies → map to English profile → recover remaining with cribs/word structure
- **D.** Factor the plugboard as RSA

**Answer:** C
**Explanation:** Correct sequence for breaking a monoalphabetic English cipher: Collect ciphertext → tally letter/n-gram frequencies → map to English profile → recover remaining with cribs/word structure

### Q14  ·  Intermediate
**Question:** A polyalphabetic cipher is intended to:

- **A.** Replace transposition
- **B.** Flatten simple letter frequencies by changing the mapping
- **C.** Make brute force of 25 Caesar keys hard
- **D.** Use one permutation for a novel

**Answer:** B
**Explanation:** Multiple alphabets.

### Q15  ·  Intermediate
**Question:** Confusion vs diffusion: an S-box primarily provides:

- **A.** A MAC
- **B.** Diffusion only by permuting wires without substitution
- **C.** A certificate chain
- **D.** Confusion (complex key/ciphertext relation)

**Answer:** D
**Explanation:** S-boxes are classic confusion.

### Q16  ·  Intermediate
**Question:** Exam papers in English encrypted with a crossword-style monoalphabetic puzzle. First attack:

- **A.** Need the private key of the CA
- **B.** Wait for a 26!-year brute force only
- **C.** Frequency analysis (E, T, A, … and common words)
- **D.** Birthday paradox on SHA-1

**Answer:** C
**Explanation:** Language redundancy.

### Q17  ·  Intermediate
**Question:** Hostel Wi-Fi ‘encrypts’ by reversing packet payloads (transposition only). An attacker who knows the method:

- **A.** Must break RSA
- **B.** Faces a one-time pad
- **C.** Cannot reorder known patterns
- **D.** Still reads all bytes; order is recoverable; no secrecy of content symbols

**Answer:** D
**Explanation:** Transposition without a strong keyed permutation is weak.

### Q18  ·  Intermediate
**Question:** Kerckhoffs would reject which design?

- **A.** AES with a 128-bit random key in an HSM
- **B.** A proprietary exam-app cipher whose only secret is that it is a Caesar of 7, with the method in comments
- **C.** TLS with public RFCs
- **D.** RSA with published modulus and secret d

**Answer:** B
**Explanation:** Obscurity of a weak cipher.

### Q19  ·  Intermediate
**Question:** Museum replica Enigma: after each keypress the rotor steps. This provides:

- **A.** A changing polyalphabetic substitution (period related to rotors)
- **B.** A single monoalphabetic map for the day with no stepping
- **C.** A hash-only integrity scheme
- **D.** RSA OAEP

**Answer:** A
**Explanation:** Stepping rotors change the mapping.

### Q20  ·  Intermediate
**Question:** VVIET publishes the exam-portal cipher algorithm but keeps the site key in an HSM. This follows:

- **A.** Kerckhoffs’ principle
- **B.** Hiding Caesar shifts in PHP comments as the only defence
- **C.** Security only through an unpublished algorithm
- **D.** OTP reuse as policy

**Answer:** A
**Explanation:** Public algorithm, secret key.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **cipher** and **code**?

- **A.** Codes are always one-time pads.
- **B.** Ciphers cannot have keys.
- **C.** They are both SHA-256.
- **D.** Ciphers transform according to an algorithm and key at letter/bit level; codes replace phrases via a codebook.

**Answer:** D
**Explanation:** Ciphers transform according to an algorithm and key at letter/bit level; codes replace phrases via a codebook.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **confidentiality** and **integrity**?

- **A.** Confidentiality is hashing without a key.
- **B.** Confidentiality hides content; integrity detects modification. Encryption alone does not guarantee integrity.
- **C.** They are identical CIA goals.
- **D.** Integrity is achieved by secrecy of the algorithm only.

**Answer:** B
**Explanation:** Confidentiality hides content; integrity detects modification. Encryption alone does not guarantee integrity.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **security through obscurity** and **Kerckhoffs**?

- **A.** Obscurity is required for AES.
- **B.** Kerckhoffs assumes the algorithm is known; obscurity hides the algorithm and fails when it leaks.
- **C.** They recommend the same design rule.
- **D.** Kerckhoffs forbids public algorithms.

**Answer:** B
**Explanation:** Kerckhoffs assumes the algorithm is known; obscurity hides the algorithm and fails when it leaks.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **substitution** and **transposition**?

- **A.** Substitution only shuffles positions.
- **B.** Substitution changes symbol identities; transposition changes order only.
- **C.** They are both hash functions.
- **D.** Transposition always changes A into Z.

**Answer:** B
**Explanation:** Substitution changes symbol identities; transposition changes order only.

### Q25  ·  Intermediate
**Question:** Which option best describes **Asymmetric encryption**?

- **A.** The same shared password encrypts and decrypts.
- **B.** Only transposition is used.
- **C.** A public key encrypts (or verifies) and a matching private key decrypts (or signs); keys are not interchangeable secrets.
- **D.** A Caesar shift known to everyone including attackers as the only key.

**Answer:** C
**Explanation:** Asymmetric encryption: A public key encrypts (or verifies) and a matching private key decrypts (or signs); keys are not interchangeable secrets.

### Q26  ·  Intermediate
**Question:** Which option best describes **Availability**?

- **A.** Kerckhoffs’ principle.
- **B.** Ensuring authorized users can access a service or data when needed; attacks include DoS.
- **C.** Encrypting a hard disk.
- **D.** Hashing a password.

**Answer:** B
**Explanation:** Availability: Ensuring authorized users can access a service or data when needed; attacks include DoS.

### Q27  ·  Intermediate
**Question:** Which option best describes **Brute-force attack**?

- **A.** A replay of a token.
- **B.** A birthday attack on hashes only.
- **C.** Frequency analysis of a Caesar only.
- **D.** Trying keys (or passwords) until the correct one is found; cost grows with key space.

**Answer:** D
**Explanation:** Brute-force attack: Trying keys (or passwords) until the correct one is found; cost grows with key space.

### Q28  ·  Intermediate
**Question:** Which option best describes **Caesar cipher**?

- **A.** RSA with e=3.
- **B.** A monoalphabetic shift of each letter by a fixed offset modulo 26.
- **C.** A transposition by columns only.
- **D.** A one-time pad.

**Answer:** B
**Explanation:** Caesar cipher: A monoalphabetic shift of each letter by a fixed offset modulo 26.

### Q29  ·  Intermediate
**Question:** Which option best describes **Codebook**?

- **A.** An X.509 extension.
- **B.** A hash IV.
- **C.** A prearranged mapping of phrases or words to codegroups, unlike a cipher that operates on letters/bits by algorithm.
- **D.** A public AES S-box.

**Answer:** C
**Explanation:** Codebook: A prearranged mapping of phrases or words to codegroups, unlike a cipher that operates on letters/bits by algorithm.

### Q30  ·  Intermediate
**Question:** Which option best describes **Diffusion**?

- **A.** A MAC key.
- **B.** Shannon’s property: spreading the influence of a plaintext bit over many ciphertext bits (often permutation/transposition).
- **C.** Kerckhoffs’ public algorithm only.
- **D.** Hiding the key in the algorithm.

**Answer:** B
**Explanation:** Diffusion: Shannon’s property: spreading the influence of a plaintext bit over many ciphertext bits (often permutation/transposition).

### Q31  ·  Intermediate
**Question:** Which option best describes **Enigma**?

- **A.** An electro-mechanical rotor machine: stepped rotors plus a plugboard implement a changing polyalphabetic substitution each keypress.
- **B.** A public-key algorithm from the 1970s.
- **C.** A hash-then-sign scheme.
- **D.** A one-time pad printer.

**Answer:** A
**Explanation:** Enigma: An electro-mechanical rotor machine: stepped rotors plus a plugboard implement a changing polyalphabetic substitution each keypress.

### Q32  ·  Intermediate
**Question:** Which option best describes **Frequency analysis**?

- **A.** A HMAC construction.
- **B.** Recovering a substitution by matching ciphertext letter (or n-gram) frequencies to language statistics.
- **C.** Kerckhoffs’ catalog of algorithms.
- **D.** A brute-force search of RSA moduli.

**Answer:** B
**Explanation:** Frequency analysis: Recovering a substitution by matching ciphertext letter (or n-gram) frequencies to language statistics.

### Q33  ·  Intermediate
**Question:** Which option best describes **Integrity**?

- **A.** A synonym for availability of the web server.
- **B.** Detecting (or preventing) unauthorized modification of data, often with MACs or signatures.
- **C.** Making the key public.
- **D.** Hiding the content from eavesdroppers only.

**Answer:** B
**Explanation:** Integrity: Detecting (or preventing) unauthorized modification of data, often with MACs or signatures.

### Q34  ·  Intermediate
**Question:** Which option best describes **Monoalphabetic cipher**?

- **A.** Each plaintext letter maps to a single ciphertext letter for the whole message (fixed permutation of the alphabet).
- **B.** A one-time pad with a random key as long as the message.
- **C.** A transposition rail fence.
- **D.** The mapping changes every letter according to a repeating keyword (Vigenère-style).

**Answer:** A
**Explanation:** Monoalphabetic cipher: Each plaintext letter maps to a single ciphertext letter for the whole message (fixed permutation of the alphabet).

### Q35  ·  Intermediate
**Question:** Which option best describes **Symmetric encryption**?

- **A.** No key is needed.
- **B.** Encryption uses a public key and decryption a matching private key.
- **C.** Only hashing is used.
- **D.** The same secret key is used to encrypt and decrypt (or easily derived from each other).

**Answer:** D
**Explanation:** Symmetric encryption: The same secret key is used to encrypt and decrypt (or easily derived from each other).

### Q36  ·  Intermediate
**Question:** Which option best describes **Transposition cipher**?

- **A.** Plaintext symbols are rearranged; the alphabet of symbols is unchanged.
- **B.** A MAC tag.
- **C.** RSA modular exponentiation.
- **D.** Each letter is replaced by a different letter by a fixed map.

**Answer:** A
**Explanation:** Transposition cipher: Plaintext symbols are rearranged; the alphabet of symbols is unchanged.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **Shannon product cipher idea**?

- **A.** Alternate confusion (substitution) and diffusion (permutation) in rounds so statistics are hidden
- **B.** Use only transposition for 1 round
- **C.** Replace rounds with a codebook of 5 phrases
- **D.** Publish each round key

**Answer:** A
**Explanation:** Correct sequence for Shannon product cipher idea: Alternate confusion (substitution) and diffusion (permutation) in rounds so statistics are hidden

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **using an OTP correctly**?

- **A.** Publish the pad with the ciphertext
- **B.** Generate truly random key as long as the message → share it via a secure channel → XOR once → destroy the pad; never reuse
- **C.** Reuse a 16-byte keystream for a semester
- **D.** Generate the pad from the plaintext

**Answer:** B
**Explanation:** Correct sequence for using an OTP correctly: Generate truly random key as long as the message → share it via a secure channel → XOR once → destroy the pad; never reuse

### Q39  ·  Intermediate
**Question:** Which statement about **Availability** is FALSE?

- **A.** In this module, Availability is a core idea students must distinguish from nearby terms.
- **B.** Availability is correctly understood as: ensuring authorized users can access a service or data when needed; attacks include DoS.
- **C.** Availability is guaranteed by using a longer Caesar key.
- **D.** A useful way to remember Availability is that it is not the same as “Encrypting a hard disk”.

**Answer:** C
**Explanation:** The false claim is: Availability is guaranteed by using a longer Caesar key.. Availability actually means: Ensuring authorized users can access a service or data when needed; attacks include DoS.

### Q40  ·  Intermediate
**Question:** Which statement about **Confidentiality** is FALSE?

- **A.** Confidentiality is the same as integrity: encryption always detects forgeries.
- **B.** In this module, Confidentiality is a core idea students must distinguish from nearby terms.
- **C.** Confidentiality is correctly understood as: ensuring that information is not disclosed to unauthorized parties (typically via encryption or access control).
- **D.** A useful way to remember Confidentiality is that it is not the same as “Ensuring a message was not modified, without secrecy”.

**Answer:** A
**Explanation:** The false claim is: Confidentiality is the same as integrity: encryption always detects forgeries.. Confidentiality actually means: Ensuring that information is not disclosed to unauthorized parties (typically via encryption or access control).

### Q41  ·  Intermediate
**Question:** Which statement about **Diffusion** is FALSE?

- **A.** Diffusion is correctly understood as: shannon’s property: spreading the influence of a plaintext bit over many ciphertext bits (often permutation/transposition).
- **B.** A useful way to remember Diffusion is that it is not the same as “Hiding the key in the algorithm”.
- **C.** In this module, Diffusion is a core idea students must distinguish from nearby terms.
- **D.** Diffusion is achieved only by keeping the cipher algorithm secret.

**Answer:** D
**Explanation:** The false claim is: Diffusion is achieved only by keeping the cipher algorithm secret.. Diffusion actually means: Shannon’s property: spreading the influence of a plaintext bit over many ciphertext bits (often permutation/transposition).

### Q42  ·  Intermediate
**Question:** Which statement about **Enigma** is FALSE?

- **A.** Enigma is a monoalphabetic Caesar cipher with a single daily shift and no rotors.
- **B.** Enigma is correctly understood as: an electro-mechanical rotor machine: stepped rotors plus a plugboard implement a changing polyalphabetic substitution each keypress.
- **C.** A useful way to remember Enigma is that it is not the same as “A public-key algorithm from the 1970s”.
- **D.** In this module, Enigma is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Enigma is a monoalphabetic Caesar cipher with a single daily shift and no rotors.. Enigma actually means: An electro-mechanical rotor machine: stepped rotors plus a plugboard implement a changing polyalphabetic substitution each keypress.

### Q43  ·  Intermediate
**Question:** Which statement about **Frequency analysis** is FALSE?

- **A.** Frequency analysis cannot attack English monoalphabetic ciphers because all letters occur equally.
- **B.** In this module, Frequency analysis is a core idea students must distinguish from nearby terms.
- **C.** Frequency analysis is correctly understood as: recovering a substitution by matching ciphertext letter (or n-gram) frequencies to language statistics.
- **D.** A useful way to remember Frequency analysis is that it is not the same as “A brute-force search of RSA moduli”.

**Answer:** A
**Explanation:** The false claim is: Frequency analysis cannot attack English monoalphabetic ciphers because all letters occur equally.. Frequency analysis actually means: Recovering a substitution by matching ciphertext letter (or n-gram) frequencies to language statistics.

### Q44  ·  Intermediate
**Question:** Which statement about **Known-plaintext attack** is FALSE?

- **A.** A known-plaintext attack requires that the attacker never sees any plaintext.
- **B.** In this module, Known-plaintext attack is a core idea students must distinguish from nearby terms.
- **C.** Known-plaintext attack is correctly understood as: the attacker has matching plaintext-ciphertext pairs and tries to recover the key or decrypt other traffic.
- **D.** A useful way to remember Known-plaintext attack is that it is not the same as “The attacker has only ciphertext and no language statistics”.

**Answer:** A
**Explanation:** The false claim is: A known-plaintext attack requires that the attacker never sees any plaintext.. Known-plaintext attack actually means: The attacker has matching plaintext-ciphertext pairs and tries to recover the key or decrypt other traffic.

### Q45  ·  Intermediate
**Question:** Which statement about **Monoalphabetic cipher** is FALSE?

- **A.** Monoalphabetic ciphers are immune to frequency analysis because each letter has many images.
- **B.** In this module, Monoalphabetic cipher is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Monoalphabetic cipher is that it is not the same as “The mapping changes every letter according to a repeating keyword (Vigenère-style)”.
- **D.** Monoalphabetic cipher is correctly understood as: each plaintext letter maps to a single ciphertext letter for the whole message (fixed permutation of the alphabet).

**Answer:** A
**Explanation:** The false claim is: Monoalphabetic ciphers are immune to frequency analysis because each letter has many images.. Monoalphabetic cipher actually means: Each plaintext letter maps to a single ciphertext letter for the whole message (fixed permutation of the alphabet).

### Q46  ·  Intermediate
**Question:** Which statement about **One-time pad (OTP)** is FALSE?

- **A.** A useful way to remember One-time pad (OTP) is that it is not the same as “A Caesar shift of 1 used every day”.
- **B.** In this module, One-time pad (OTP) is a core idea students must distinguish from nearby terms.
- **C.** One-time pad (OTP) is correctly understood as: xOR (or modular add) of plaintext with a truly random key as long as the message, used only once; information-theoretically secret if the key is secret and never reused.
- **D.** A one-time pad remains perfectly secret if the same pad is reused for two messages (VENONA-style).

**Answer:** D
**Explanation:** The false claim is: A one-time pad remains perfectly secret if the same pad is reused for two messages (VENONA-style).. One-time pad (OTP) actually means: XOR (or modular add) of plaintext with a truly random key as long as the message, used only once; information-theoretically secret if the key is secret and never reused.

### Q47  ·  Intermediate
**Question:** Which statement about **Substitution cipher** is FALSE?

- **A.** In this module, Substitution cipher is a core idea students must distinguish from nearby terms.
- **B.** Substitution never changes letter identities; it only reorders the message.
- **C.** A useful way to remember Substitution cipher is that it is not the same as “The order of letters is shuffled but letters stay the same”.
- **D.** Substitution cipher is correctly understood as: plaintext symbols are replaced by other symbols according to a mapping (monoalphabetic or polyalphabetic).

**Answer:** B
**Explanation:** The false claim is: Substitution never changes letter identities; it only reorders the message.. Substitution cipher actually means: Plaintext symbols are replaced by other symbols according to a mapping (monoalphabetic or polyalphabetic).

### Q48  ·  Intermediate
**Question:** Which statement about **Symmetric encryption** is FALSE?

- **A.** Symmetric encryption uses a public/private key pair and never a shared secret.
- **B.** Symmetric encryption is correctly understood as: the same secret key is used to encrypt and decrypt (or easily derived from each other).
- **C.** In this module, Symmetric encryption is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Symmetric encryption is that it is not the same as “Encryption uses a public key and decryption a matching private key”.

**Answer:** A
**Explanation:** The false claim is: Symmetric encryption uses a public/private key pair and never a shared secret.. Symmetric encryption actually means: The same secret key is used to encrypt and decrypt (or easily derived from each other).

### Q49  ·  Intermediate
**Question:** Why is a reused one-time pad insecure?

- **A.** OTP becomes RSA
- **B.** C1⊕C2 = P1⊕P2 leaks language structure and cribs
- **C.** The key must be shorter than the message
- **D.** XOR is not reversible

**Answer:** B
**Explanation:** VENONA / two-time pad.

### Q50  ·  Difficult
**Question:** 26! is about 4×10^26. If a machine tries 10^9 keys/s, order of years to exhaust (ignore language pruning)? Use ~3×10^7 s/year.

- **A.** On the order of 10^10 years
- **B.** 10^3 years
- **C.** 26 years
- **D.** 1 second

**Answer:** A
**Explanation:** 4e26 / 1e9 / 3e7 ≈ 1e10 years. Frequency analysis still breaks it quickly.

### Q51  ·  Difficult
**Question:** A Caesar cipher on English letters has how many non-trivial keys (shift 1–25)?

- **A.** 2^26
- **B.** 26
- **C.** 26!
- **D.** 25

**Answer:** D
**Explanation:** Shift 0 is identity; 25 remaining shifts.

### Q52  ·  Difficult
**Question:** A club uses a codebook: ‘MEET AT GATE’ → 7741. This is primarily a:

- **A.** HMAC
- **B.** Code (phrase substitution), not a bit-level cipher
- **C.** AES-GCM session
- **D.** Enigma rotor

**Answer:** B
**Explanation:** Codebook vs cipher.

### Q53  ·  Difficult
**Question:** A monoalphabetic substitution on 26 letters has key space size:

- **A.** 25
- **B.** 26
- **C.** 2^26
- **D.** 26!

**Answer:** D
**Explanation:** Number of permutations of the alphabet.

### Q54  ·  Difficult
**Question:** A student encodes a love letter by shifting every letter by 3. The weakest typical break is:

- **A.** Need a 2^128 brute-force farm
- **B.** Need to factor a 2048-bit modulus
- **C.** Tiny key space / frequency still works; Caesar is trivial
- **D.** Need a collision in SHA-256

**Answer:** C
**Explanation:** Caesar is a toy cipher.

### Q55  ·  Difficult
**Question:** Enigma’s plugboard plus rotors still fell to cryptanalysis mainly because of:

- **A.** Public RSA moduli
- **B.** Information-theoretic secrecy of a true OTP
- **C.** Operational mistakes, cribs, and statistical/mechanical constraints — not a huge random OTP
- **D.** SHA-1 collisions

**Answer:** C
**Explanation:** Machine ciphers are not OTPs; history of Ultra.

### Q56  ·  Difficult
**Question:** OTP: 8-bit ASCII message of 20 characters. Minimum random key length in bits for a classical OTP?

- **A.** 128 always, independent of message
- **B.** 160
- **C.** 26
- **D.** 8

**Answer:** B
**Explanation:** 20×8 = 160 bits, used once.

### Q57  ·  Difficult
**Question:** Shannon perfect secrecy (OTP intuition) requires that:

- **A.** The key is random, uniformly chosen, as long as the message, and independent/never reused
- **B.** The algorithm is secret
- **C.** The ciphertext is shorter than the key
- **D.** The plaintext is English

**Answer:** A
**Explanation:** Keyspace and independence.

### Q58  ·  Difficult
**Question:** The ERP must hide fees in transit and also detect if a proxy alters the amount. Need:

- **A.** Caesar only
- **B.** Transposition of HTML tags only
- **C.** Confidentiality plus integrity (AEAD or encrypt-then-MAC / TLS)
- **D.** Availability of the printer only

**Answer:** C
**Explanation:** CIA: secrecy and integrity are different.

### Q59  ·  Difficult
**Question:** Two circulars encrypted with the same reused ‘OTP’ file. Cryptanalysis should first:

- **A.** Run HMAC
- **B.** Factor N
- **C.** Issue an OCSP request
- **D.** XOR the two ciphertexts to remove the key

**Answer:** D
**Explanation:** Reused pad.

### Q60  ·  Difficult
**Question:** Vigenère keyword of length 3 on English. Roughly how many distinct repeating keys if letters A–Z and case ignored?

- **A.** 3
- **B.** 26!
- **C.** 26^3 = 17,576
- **D.** 26

**Answer:** C
**Explanation:** Each of 3 positions has 26 letters.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **OTP** and **Vigenère**?

- **A.** OTP remains safe when pads are reused.
- **B.** OTP needs a random, never-reused key as long as the message; Vigenère repeats a short keyword and is breakable.
- **C.** Vigenère is information-theoretically secure.
- **D.** They have the same key length always.

**Answer:** B
**Explanation:** OTP needs a random, never-reused key as long as the message; Vigenère repeats a short keyword and is breakable.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **brute force** and **frequency analysis**?

- **A.** Brute force cannot try Caesar’s 25 non-trivial shifts.
- **B.** Frequency analysis is only for RSA-2048.
- **C.** Brute force enumerates keys; frequency analysis exploits language redundancy without trying every key of a large monoalphabetic space.
- **D.** They are the same attack.

**Answer:** C
**Explanation:** Brute force enumerates keys; frequency analysis exploits language redundancy without trying every key of a large monoalphabetic space.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **monoalphabetic** and **polyalphabetic**?

- **A.** Frequency analysis never applies to either.
- **B.** Monoalphabetic is Vigenère.
- **C.** Monoalphabetic uses one mapping; polyalphabetic changes the mapping during the text, flattening simple frequencies.
- **D.** Polyalphabetic is a single Caesar for a book.

**Answer:** C
**Explanation:** Monoalphabetic uses one mapping; polyalphabetic changes the mapping during the text, flattening simple frequencies.

### Q64  ·  Difficult
**Question:** What is the most important distinction between **symmetric** and **asymmetric cryptography**?

- **A.** Asymmetric uses the same shared password both ways.
- **B.** Symmetric shares one secret key and is fast; asymmetric uses key pairs, enables open distribution of public keys, and is slower.
- **C.** Symmetric publishes the decryption key.
- **D.** They differ only in alphabet size.

**Answer:** B
**Explanation:** Symmetric shares one secret key and is fast; asymmetric uses key pairs, enables open distribution of public keys, and is slower.

### Q65  ·  Difficult
**Question:** Which statement about **Asymmetric encryption** is FALSE?

- **A.** Asymmetric encryption is correctly understood as: a public key encrypts (or verifies) and a matching private key decrypts (or signs); keys are not interchangeable secrets.
- **B.** In this module, Asymmetric encryption is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Asymmetric encryption is that it is not the same as “The same shared password encrypts and decrypts”.
- **D.** Asymmetric encryption requires that the private key be published for encryption.

**Answer:** D
**Explanation:** The false claim is: Asymmetric encryption requires that the private key be published for encryption.. Asymmetric encryption actually means: A public key encrypts (or verifies) and a matching private key decrypts (or signs); keys are not interchangeable secrets.

### Q66  ·  Difficult
**Question:** Which statement about **Brute-force attack** is FALSE?

- **A.** Brute force against a 128-bit random key is considered trivial on a laptop.
- **B.** Brute-force attack is correctly understood as: trying keys (or passwords) until the correct one is found; cost grows with key space.
- **C.** A useful way to remember Brute-force attack is that it is not the same as “Frequency analysis of a Caesar only”.
- **D.** In this module, Brute-force attack is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Brute force against a 128-bit random key is considered trivial on a laptop.. Brute-force attack actually means: Trying keys (or passwords) until the correct one is found; cost grows with key space.

### Q67  ·  Difficult
**Question:** Which statement about **Caesar cipher** is FALSE?

- **A.** In this module, Caesar cipher is a core idea students must distinguish from nearby terms.
- **B.** Caesar’s key space is 26! rather than 26 shifts.
- **C.** A useful way to remember Caesar cipher is that it is not the same as “A one-time pad”.
- **D.** Caesar cipher is correctly understood as: a monoalphabetic shift of each letter by a fixed offset modulo 26.

**Answer:** B
**Explanation:** The false claim is: Caesar’s key space is 26! rather than 26 shifts.. Caesar cipher actually means: A monoalphabetic shift of each letter by a fixed offset modulo 26.

### Q68  ·  Difficult
**Question:** Which statement about **Codebook** is FALSE?

- **A.** A useful way to remember Codebook is that it is not the same as “A public AES S-box”.
- **B.** In this module, Codebook is a core idea students must distinguish from nearby terms.
- **C.** A codebook is the same as a stream cipher keystream generator.
- **D.** Codebook is correctly understood as: a prearranged mapping of phrases or words to codegroups, unlike a cipher that operates on letters/bits by algorithm.

**Answer:** C
**Explanation:** The false claim is: A codebook is the same as a stream cipher keystream generator.. Codebook actually means: A prearranged mapping of phrases or words to codegroups, unlike a cipher that operates on letters/bits by algorithm.

### Q69  ·  Difficult
**Question:** Which statement about **Confusion** is FALSE?

- **A.** Confusion is correctly understood as: shannon’s property: making the relation between ciphertext and the key as complex as possible (often substitution).
- **B.** In this module, Confusion is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Confusion is that it is not the same as “Spreading a plaintext bit into many ciphertext bits (diffusion)”.
- **D.** Confusion means permuting bit positions without mixing in key-dependent substitutions.

**Answer:** D
**Explanation:** The false claim is: Confusion means permuting bit positions without mixing in key-dependent substitutions.. Confusion actually means: Shannon’s property: making the relation between ciphertext and the key as complex as possible (often substitution).

### Q70  ·  Difficult
**Question:** Which statement about **Integrity** is FALSE?

- **A.** In this module, Integrity is a core idea students must distinguish from nearby terms.
- **B.** Integrity is correctly understood as: detecting (or preventing) unauthorized modification of data, often with MACs or signatures.
- **C.** A useful way to remember Integrity is that it is not the same as “Hiding the content from eavesdroppers only”.
- **D.** Integrity is automatically provided by any encryption algorithm, including ECB of a known file.

**Answer:** D
**Explanation:** The false claim is: Integrity is automatically provided by any encryption algorithm, including ECB of a known file.. Integrity actually means: Detecting (or preventing) unauthorized modification of data, often with MACs or signatures.

### Q71  ·  Difficult
**Question:** Which statement about **Kerckhoffs’ principle** is FALSE?

- **A.** Kerckhoffs’ principle is correctly understood as: a cryptosystem should remain secure if everything except the key is public knowledge.
- **B.** Kerckhoffs requires that the encryption algorithm itself be kept secret forever.
- **C.** A useful way to remember Kerckhoffs’ principle is that it is not the same as “Security by hiding the algorithm (security through obscurity) is sufficient”.
- **D.** In this module, Kerckhoffs’ principle is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Kerckhoffs requires that the encryption algorithm itself be kept secret forever.. Kerckhoffs’ principle actually means: A cryptosystem should remain secure if everything except the key is public knowledge.

### Q72  ·  Difficult
**Question:** Which statement about **Polyalphabetic cipher** is FALSE?

- **A.** Polyalphabetic ciphers use one fixed Caesar shift for the entire book.
- **B.** A useful way to remember Polyalphabetic cipher is that it is not the same as “A single fixed alphabet permutation for the whole text”.
- **C.** Polyalphabetic cipher is correctly understood as: the substitution mapping changes during the message (for example, Vigenère with a repeating key).
- **D.** In this module, Polyalphabetic cipher is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Polyalphabetic ciphers use one fixed Caesar shift for the entire book.. Polyalphabetic cipher actually means: The substitution mapping changes during the message (for example, Vigenère with a repeating key).

### Q73  ·  Difficult
**Question:** Which statement about **Transposition cipher** is FALSE?

- **A.** Transposition cipher is correctly understood as: plaintext symbols are rearranged; the alphabet of symbols is unchanged.
- **B.** A useful way to remember Transposition cipher is that it is not the same as “Each letter is replaced by a different letter by a fixed map”.
- **C.** In this module, Transposition cipher is a core idea students must distinguish from nearby terms.
- **D.** Transposition replaces A with X and B with Y but never moves positions.

**Answer:** D
**Explanation:** The false claim is: Transposition replaces A with X and B with Y but never moves positions.. Transposition cipher actually means: Plaintext symbols are rearranged; the alphabet of symbols is unchanged.

### Q74  ·  Difficult
**Question:** XOR OTP: C1=P1⊕K, C2=P2⊕K with the same K. C1⊕C2 equals:

- **A.** K
- **B.** P1
- **C.** P1⊕P2 (key cancelled)
- **D.** C1 only

**Answer:** C
**Explanation:** Reused pad leaks the XOR of plaintexts (VENONA).

---

## Quick answer key

Q01–B | Q02–D | Q03–A | Q04–D | Q05–C | Q06–A | Q07–A | Q08–A | Q09–C | Q10–C | Q11–C | Q12–A | Q13–C | Q14–B | Q15–D | Q16–C | Q17–D | Q18–B | Q19–A | Q20–A | Q21–D | Q22–B | Q23–B | Q24–B | Q25–C | Q26–B | Q27–D | Q28–B | Q29–C | Q30–B | Q31–A | Q32–B | Q33–B | Q34–A | Q35–D | Q36–A | Q37–A | Q38–B | Q39–C | Q40–A | Q41–D | Q42–A | Q43–A | Q44–A | Q45–A | Q46–D | Q47–B | Q48–A | Q49–B | Q50–A | Q51–D | Q52–B | Q53–D | Q54–C | Q55–C | Q56–B | Q57–A | Q58–C | Q59–D | Q60–C | Q61–B | Q62–C | Q63–C | Q64–B | Q65–D | Q66–A | Q67–B | Q68–C | Q69–D | Q70–D | Q71–B | Q72–A | Q73–D | Q74–C
