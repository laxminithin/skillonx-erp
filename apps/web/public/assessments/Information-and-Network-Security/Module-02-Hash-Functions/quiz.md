# Quiz — Information and Network Security — Module 2: Hash Functions

**Subject:** Information and Network Security  
**Module:** Module 2 — Hash Functions  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A cryptographic hash output is called a:

- **A.** Digest (or hash value)
- **B.** Certificate chain
- **C.** Initialization vector of AES-CTR only
- **D.** Private key

**Answer:** A
**Explanation:** Fixed-length digest.

### Q02  ·  Easy
**Question:** HMAC is primarily a:

- **A.** Keyed message authentication construction from a hash
- **B.** Substitution cipher
- **C.** One-time pad
- **D.** Public-key signature

**Answer:** A
**Explanation:** MAC from hashes.

### Q03  ·  Easy
**Question:** Proof of work asks for:

- **A.** The CA’s private key
- **B.** A nonce making the hash meet a difficulty target
- **C.** A CRC of zero
- **D.** A transposition key

**Answer:** B
**Explanation:** Hashcash-style search.

### Q04  ·  Easy
**Question:** Which is not a cryptographic hash goal?

- **A.** Deterministic fixed-length output
- **B.** Efficient inversion of the digest to the original message
- **C.** Preimage resistance
- **D.** Collision resistance

**Answer:** B
**Explanation:** Hashes are one-way.

### Q05  ·  Easy
**Question:** Which option best describes **CRC vs crypto hash**?

- **A.** They are the same polynomial.
- **B.** SHA-256 is only for noisy disks, not adversaries.
- **C.** CRC is an error-detecting code, not collision-resistant against an adversary; cryptographic hashes target adversarial collision/preimage hardness.
- **D.** CRC32 is collision-resistant at 2^128 work.

**Answer:** C
**Explanation:** CRC vs crypto hash: CRC is an error-detecting code, not collision-resistant against an adversary; cryptographic hashes target adversarial collision/preimage hardness.

### Q06  ·  Easy
**Question:** Which option best describes **Collision resistance**?

- **A.** It is infeasible to find any pair m1≠m2 with H(m1)=H(m2).
- **B.** Given y, invert H.
- **C.** Given m1, invert AES.
- **D.** A MAC with a secret key as the definition of unkeyed hashing.

**Answer:** A
**Explanation:** Collision resistance: It is infeasible to find any pair m1≠m2 with H(m1)=H(m2).

### Q07  ·  Easy
**Question:** Which option best describes **Cryptographic hash**?

- **A.** A transposition of columns only.
- **B.** A reversible Caesar cipher.
- **C.** A deterministic function mapping arbitrary-length input to a fixed-length digest, with preimage, second-preimage and collision resistance as goals.
- **D.** A public-key decryption function.

**Answer:** C
**Explanation:** Cryptographic hash: A deterministic function mapping arbitrary-length input to a fixed-length digest, with preimage, second-preimage and collision resistance as goals.

### Q08  ·  Easy
**Question:** Which option best describes **Digest length**?

- **A.** Output bits n; generic preimage ~2^n, generic collision ~2^{n/2}; 128-bit collision resistance needs about 256-bit digest.
- **B.** Preimage cost is 2^{n/2} generically.
- **C.** n=32 is enough against nation-state collision search.
- **D.** Collision cost is always 2^n.

**Answer:** A
**Explanation:** Digest length: Output bits n; generic preimage ~2^n, generic collision ~2^{n/2}; 128-bit collision resistance needs about 256-bit digest.

### Q09  ·  Easy
**Question:** Which option best describes **Digital signature (hash-then-sign)**?

- **A.** Hash without any key and call it non-repudiation.
- **B.** MAC with a key shared with the world.
- **C.** Sign H(m) with a private key so verifiers hash m and check the signature; hashing handles long messages and adds collision-critical dependence.
- **D.** Encrypt m with the public key and call it a signature.

**Answer:** C
**Explanation:** Digital signature (hash-then-sign): Sign H(m) with a private key so verifiers hash m and check the signature; hashing handles long messages and adds collision-critical dependence.

### Q10  ·  Easy
**Question:** Which option best describes **Tiger hash**?

- **A.** An X.509 field.
- **B.** A stream cipher used in TLS 1.3 as the only record cipher.
- **C.** A cryptographic hash designed by Anderson and Biham, producing 192-bit (and truncated) digests, optimized historically for 64-bit CPUs.
- **D.** A salt format.

**Answer:** C
**Explanation:** Tiger hash: A cryptographic hash designed by Anderson and Biham, producing 192-bit (and truncated) digests, optimized historically for 64-bit CPUs.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **birthday collision search (generic)**?

- **A.** Sort the plaintext alphabet
- **B.** Invert a given target with 2^{n/2} as preimage
- **C.** Randomly sample messages → store digests → stop when a digest repeats (≈2^{n/2})
- **D.** Try 2^n messages always

**Answer:** C
**Explanation:** Correct sequence for birthday collision search (generic): Randomly sample messages → store digests → stop when a digest repeats (≈2^{n/2})

### Q12  ·  Easy
**Question:** Which sequence correctly describes **hash-then-sign**?

- **A.** Hash the message → sign the digest with the private key → verifier hashes independently and verifies with the public key
- **B.** Encrypt the hash with the verifier’s public key and call it a signature always
- **C.** Hash with a public CRC → skip the private key
- **D.** Sign the raw gigabyte without hashing → skip verify

**Answer:** A
**Explanation:** Correct sequence for hash-then-sign: Hash the message → sign the digest with the private key → verifier hashes independently and verifies with the public key

### Q13  ·  Intermediate
**Question:** Generic complexity to find some SHA-1 collision (160-bit, ignoring cryptanalysis) is about:

- **A.** 160 trials
- **B.** 2^16 work
- **C.** 2^160 work
- **D.** 2^80 work

**Answer:** D
**Explanation:** Birthday bound (real SHA-1 is weaker).

### Q14  ·  Intermediate
**Question:** In Shamir (t,n), t−1 shares:

- **A.** Equal the OTP keystream
- **B.** Are enough to reconstruct
- **C.** Reveal no information about the secret (over a large field, honest setup)
- **D.** Determine the secret uniquely

**Answer:** C
**Explanation:** Information-theoretic threshold.

### Q15  ·  Intermediate
**Question:** Lab assignment: find x with SHA-256(x) starting with 20 zero bits. This is:

- **A.** A preimage of a random full digest
- **B.** Shamir reconstruction
- **C.** A second-preimage of a given file
- **D.** A small proof-of-work / challenge

**Answer:** D
**Explanation:** Partial preimage / PoW.

### Q16  ·  Intermediate
**Question:** The ERP computes H(password) without salt. Immediate issue:

- **A.** Rainbow tables / identical hashes for identical passwords across users
- **B.** Perfect forward secrecy
- **C.** Kerckhoffs violation of AES
- **D.** Enigma stepping

**Answer:** A
**Explanation:** Unsalted hashes.

### Q17  ·  Intermediate
**Question:** Tiger is best classified as:

- **A.** A cryptographic hash function (192-bit family)
- **B.** A secret-sharing polynomial
- **C.** A TLS handshake
- **D.** An X.509 CA

**Answer:** A
**Explanation:** Tiger hash.

### Q18  ·  Intermediate
**Question:** Tiger vs SHA-256 for new file integrity in 2026 teaching labs. Prefer:

- **A.** Tiger because 192 > 256
- **B.** CRC32 for adversarial firmware
- **C.** SHA-256 (or SHA-3/BLAKE2) as the default modern choice
- **D.** MD5 for certificates

**Answer:** C
**Explanation:** Use current standard hashes.

### Q19  ·  Intermediate
**Question:** VVIET posts SHA-256 of a firmware file on HTTPS and the file on an open mirror. The hash mainly provides:

- **A.** Confidentiality of the binary
- **B.** A digital signature without a key
- **C.** Integrity vs accidental/corrupt download, if the hash was fetched from a trusted page
- **D.** A MAC against a MITM who also edits the HTTPS page

**Answer:** C
**Explanation:** Unkeyed hash + trusted channel.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **CRC** and **SHA-256**?

- **A.** SHA-256 cannot detect a flipped bit.
- **B.** CRC detects random errors; SHA-256 targets adversarial preimage/collision hardness.
- **C.** They differ only in output encoding.
- **D.** CRC32 is collision-resistant for certificates.

**Answer:** B
**Explanation:** CRC detects random errors; SHA-256 targets adversarial preimage/collision hardness.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **hash** and **MAC (HMAC)**?

- **A.** They are both public-key algorithms.
- **B.** A hash is unkeyed; HMAC uses a secret key so outsiders cannot forge tags.
- **C.** HMAC is unkeyed SHA.
- **D.** A hash provides non-repudiation like RSA-PSS.

**Answer:** B
**Explanation:** A hash is unkeyed; HMAC uses a secret key so outsiders cannot forge tags.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **preimage resistance** and **collision resistance**?

- **A.** Preimage: invert a given digest (~2^n). Collision: any pair (~2^{n/2} birthday).
- **B.** Collision is harder than preimage generically.
- **C.** Both are CRC goals only.
- **D.** They have the same generic complexity.

**Answer:** A
**Explanation:** Preimage: invert a given digest (~2^n). Collision: any pair (~2^{n/2} birthday).

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **proof of work** and **password hashing**?

- **A.** They are the same Bitcoin header.
- **B.** Password hashing needs no salt.
- **C.** PoW is HMAC-SHA1 of a password.
- **D.** PoW searches a nonce for a public difficulty target; password hashing slows verifying a secret with salt and a KDF, not a public lottery.

**Answer:** D
**Explanation:** PoW searches a nonce for a public difficulty target; password hashing slows verifying a secret with salt and a KDF, not a public lottery.

### Q24  ·  Intermediate
**Question:** Which option best describes **Avalanche effect**?

- **A.** The digest must equal the first 256 bits of the message.
- **B.** Collisions become easier.
- **C.** A small input change (even one bit) should flip each output bit with probability about 1/2.
- **D.** The function becomes invertible.

**Answer:** C
**Explanation:** Avalanche effect: A small input change (even one bit) should flip each output bit with probability about 1/2.

### Q25  ·  Intermediate
**Question:** Which option best describes **Birthday attack**?

- **A.** A replay of a password.
- **B.** Inverting a hash in 2^{n/2} always as a preimage attack.
- **C.** Factoring n=pq.
- **D.** Finding some collision in an n-bit hash in about 2^{n/2} trials due to the birthday paradox, not 2^n.

**Answer:** D
**Explanation:** Birthday attack: Finding some collision in an n-bit hash in about 2^{n/2} trials due to the birthday paradox, not 2^n.

### Q26  ·  Intermediate
**Question:** Which option best describes **HMAC**?

- **A.** A keyed hash construction (nested H with key ⊕ ipad/opad) providing a MAC from a hash function.
- **B.** A Caesar shift of a hash.
- **C.** A public-key signature.
- **D.** An unkeyed digest like SHA-256 used alone as a MAC.

**Answer:** A
**Explanation:** HMAC: A keyed hash construction (nested H with key ⊕ ipad/opad) providing a MAC from a hash function.

### Q27  ·  Intermediate
**Question:** Which option best describes **Hash-then-sign collision attack**?

- **A.** Only preimages matter for hash-then-sign, never collisions.
- **B.** If H(m1)=H(m2), a signature on m1 verifies for m2; colliding certificates/documents are the threat.
- **C.** MACs ignore collisions always.
- **D.** Collisions cannot affect signatures because RSA is used.

**Answer:** B
**Explanation:** Hash-then-sign collision attack: If H(m1)=H(m2), a signature on m1 verifies for m2; colliding certificates/documents are the threat.

### Q28  ·  Intermediate
**Question:** Which option best describes **Keyed vs unkeyed**?

- **A.** Salts are private keys for RSA.
- **B.** Keyed hashes are public-key signatures.
- **C.** Unkeyed hashes prove who sent a message on an open channel.
- **D.** Unkeyed hashes provide integrity only against accidental error or when the digest is fetched from a trusted channel; keyed MACs authenticate origin given key secrecy.

**Answer:** D
**Explanation:** Keyed vs unkeyed: Unkeyed hashes provide integrity only against accidental error or when the digest is fetched from a trusted channel; keyed MACs authenticate origin given key secrecy.

### Q29  ·  Intermediate
**Question:** Which option best describes **Length-extension**?

- **A.** A transposition.
- **B.** An RSA blinding attack.
- **C.** Some Merkle–Damgård hashes allow computing H(m||pad||x) from H(m) and |m| without m, breaking naive H(key||m) MACs.
- **D.** A property of HMAC that HMAC is designed to reintroduce.

**Answer:** C
**Explanation:** Length-extension: Some Merkle–Damgård hashes allow computing H(m||pad||x) from H(m) and |m| without m, breaking naive H(key||m) MACs.

### Q30  ·  Intermediate
**Question:** Which option best describes **MAC vs hash**?

- **A.** A MAC uses a secret key so only holders can forge tags; an unkeyed hash can be recomputed by anyone.
- **B.** A MAC is always a public-key signature.
- **C.** CRC is a MAC.
- **D.** A hash cannot detect any change.

**Answer:** A
**Explanation:** MAC vs hash: A MAC uses a secret key so only holders can forge tags; an unkeyed hash can be recomputed by anyone.

### Q31  ·  Intermediate
**Question:** Which option best describes **Preimage resistance**?

- **A.** Reversing AES with a known key.
- **B.** Given y, it is infeasible to find any m with H(m)=y (one-wayness).
- **C.** Finding any two messages that collide without a target.
- **D.** Given m1, find m2≠m1 with H(m1)=H(m2).

**Answer:** B
**Explanation:** Preimage resistance: Given y, it is infeasible to find any m with H(m)=y (one-wayness).

### Q32  ·  Intermediate
**Question:** Which option best describes **Proof of work**?

- **A.** A one-time pad.
- **B.** Finding a nonce such that H(header||nonce) meets a difficulty target (leading zeros); expected trials scale with difficulty.
- **C.** HMAC with a known key.
- **D.** A digital signature by a CA.

**Answer:** B
**Explanation:** Proof of work: Finding a nonce such that H(header||nonce) meets a difficulty target (leading zeros); expected trials scale with difficulty.

### Q33  ·  Intermediate
**Question:** Which option best describes **Random oracle intuition**?

- **A.** An idealized hash that returns independent random values for new inputs, used in proofs; real hashes only approximate this.
- **B.** A Caesar cipher with shift 1.
- **C.** A public invertible permutation with a key.
- **D.** A codebook.

**Answer:** A
**Explanation:** Random oracle intuition: An idealized hash that returns independent random values for new inputs, used in proofs; real hashes only approximate this.

### Q34  ·  Intermediate
**Question:** Which option best describes **Second-preimage resistance**?

- **A.** A birthday attack’s √n cost as the definition of this property.
- **B.** Given m1, it is infeasible to find m2≠m1 with H(m2)=H(m1).
- **C.** Finding any colliding pair from scratch.
- **D.** Encrypting with a public key.

**Answer:** B
**Explanation:** Second-preimage resistance: Given m1, it is infeasible to find m2≠m1 with H(m2)=H(m1).

### Q35  ·  Intermediate
**Question:** Which option best describes **Secret sharing (Shamir)**?

- **A.** XOR the key with a public hash.
- **B.** Split a secret into n shares so any t shares reconstruct it (threshold), while t−1 reveal nothing in the information-theoretic sense for Shamir over a field.
- **C.** Store the key in Git.
- **D.** Give the whole key to each of n people.

**Answer:** B
**Explanation:** Secret sharing (Shamir): Split a secret into n shares so any t shares reconstruct it (threshold), while t−1 reveal nothing in the information-theoretic sense for Shamir over a field.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **HMAC evaluation (nested)**?

- **A.** H(key || msg) only
- **B.** XOR key with the digest once without nesting
- **C.** Derive kipad/kopad from key → inner H(kipad || msg) → outer H(kopad || inner)
- **D.** Caesar the message then SHA

**Answer:** C
**Explanation:** Correct sequence for HMAC evaluation (nested): Derive kipad/kopad from key → inner H(kipad || msg) → outer H(kopad || inner)

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **Shamir share generation**?

- **A.** Use degree n+1 so nobody can reconstruct
- **B.** Choose random polynomial of degree t−1 with a0=secret → evaluate at n distinct x → distribute (x,f(x)) → reconstruct via interpolation at 0
- **C.** Give a0 to everyone
- **D.** Publish all coefficients including a0

**Answer:** B
**Explanation:** Correct sequence for Shamir share generation: Choose random polynomial of degree t−1 with a0=secret → evaluate at n distinct x → distribute (x,f(x)) → reconstruct via interpolation at 0

### Q38  ·  Intermediate
**Question:** Which statement about **Birthday attack** is FALSE?

- **A.** Birthday collisions require about 2^n trials, the same as preimage search.
- **B.** Birthday attack is correctly understood as: finding some collision in an n-bit hash in about 2^{n/2} trials due to the birthday paradox, not 2^n.
- **C.** In this module, Birthday attack is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Birthday attack is that it is not the same as “Inverting a hash in 2^{n/2} always as a preimage attack”.

**Answer:** A
**Explanation:** The false claim is: Birthday collisions require about 2^n trials, the same as preimage search.. Birthday attack actually means: Finding some collision in an n-bit hash in about 2^{n/2} trials due to the birthday paradox, not 2^n.

### Q39  ·  Intermediate
**Question:** Which statement about **CRC vs crypto hash** is FALSE?

- **A.** A useful way to remember CRC vs crypto hash is that it is not the same as “CRC32 is collision-resistant at 2^128 work”.
- **B.** In this module, CRC vs crypto hash is a core idea students must distinguish from nearby terms.
- **C.** CRC vs crypto hash is correctly understood as: cRC is an error-detecting code, not collision-resistant against an adversary; cryptographic hashes target adversarial collision/preimage hardness.
- **D.** CRC is a drop-in replacement for SHA-256 in signatures.

**Answer:** D
**Explanation:** The false claim is: CRC is a drop-in replacement for SHA-256 in signatures.. CRC vs crypto hash actually means: CRC is an error-detecting code, not collision-resistant against an adversary; cryptographic hashes target adversarial collision/preimage hardness.

### Q40  ·  Intermediate
**Question:** Which statement about **Cryptographic hash** is FALSE?

- **A.** A cryptographic hash is designed to be easily inverted to recover the exact message.
- **B.** In this module, Cryptographic hash is a core idea students must distinguish from nearby terms.
- **C.** Cryptographic hash is correctly understood as: a deterministic function mapping arbitrary-length input to a fixed-length digest, with preimage, second-preimage and collision resistance as goals.
- **D.** A useful way to remember Cryptographic hash is that it is not the same as “A reversible Caesar cipher”.

**Answer:** A
**Explanation:** The false claim is: A cryptographic hash is designed to be easily inverted to recover the exact message.. Cryptographic hash actually means: A deterministic function mapping arbitrary-length input to a fixed-length digest, with preimage, second-preimage and collision resistance as goals.

### Q41  ·  Intermediate
**Question:** Which statement about **Digital signature (hash-then-sign)** is FALSE?

- **A.** In this module, Digital signature (hash-then-sign) is a core idea students must distinguish from nearby terms.
- **B.** Hash-then-sign is secure even if H is a CRC with easy collisions (existential forgery by collision).
- **C.** A useful way to remember Digital signature (hash-then-sign) is that it is not the same as “Encrypt m with the public key and call it a signature”.
- **D.** Digital signature (hash-then-sign) is correctly understood as: sign H(m) with a private key so verifiers hash m and check the signature; hashing handles long messages and adds collision-critical dependence.

**Answer:** B
**Explanation:** The false claim is: Hash-then-sign is secure even if H is a CRC with easy collisions (existential forgery by collision).. Digital signature (hash-then-sign) actually means: Sign H(m) with a private key so verifiers hash m and check the signature; hashing handles long messages and adds collision-critical dependence.

### Q42  ·  Intermediate
**Question:** Which statement about **Hash-then-sign collision attack** is FALSE?

- **A.** Hash-then-sign collision attack is correctly understood as: if H(m1)=H(m2), a signature on m1 verifies for m2; colliding certificates/documents are the threat.
- **B.** A useful way to remember Hash-then-sign collision attack is that it is not the same as “Collisions cannot affect signatures because RSA is used”.
- **C.** In this module, Hash-then-sign collision attack is a core idea students must distinguish from nearby terms.
- **D.** A collision in H is irrelevant to hash-then-sign schemes.

**Answer:** D
**Explanation:** The false claim is: A collision in H is irrelevant to hash-then-sign schemes.. Hash-then-sign collision attack actually means: If H(m1)=H(m2), a signature on m1 verifies for m2; colliding certificates/documents are the threat.

### Q43  ·  Intermediate
**Question:** Which statement about **MAC vs hash** is FALSE?

- **A.** An unkeyed hash of a download is a MAC because the website is public.
- **B.** In this module, MAC vs hash is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember MAC vs hash is that it is not the same as “A hash cannot detect any change”.
- **D.** MAC vs hash is correctly understood as: a MAC uses a secret key so only holders can forge tags; an unkeyed hash can be recomputed by anyone.

**Answer:** A
**Explanation:** The false claim is: An unkeyed hash of a download is a MAC because the website is public.. MAC vs hash actually means: A MAC uses a secret key so only holders can forge tags; an unkeyed hash can be recomputed by anyone.

### Q44  ·  Intermediate
**Question:** Which statement about **Proof of work** is FALSE?

- **A.** Proof of work is solved by inverting the hash in one step if you know the algorithm (Kerckhoffs).
- **B.** In this module, Proof of work is a core idea students must distinguish from nearby terms.
- **C.** Proof of work is correctly understood as: finding a nonce such that H(header||nonce) meets a difficulty target (leading zeros); expected trials scale with difficulty.
- **D.** A useful way to remember Proof of work is that it is not the same as “A digital signature by a CA”.

**Answer:** A
**Explanation:** The false claim is: Proof of work is solved by inverting the hash in one step if you know the algorithm (Kerckhoffs).. Proof of work actually means: Finding a nonce such that H(header||nonce) meets a difficulty target (leading zeros); expected trials scale with difficulty.

### Q45  ·  Intermediate
**Question:** Which statement about **Random oracle intuition** is FALSE?

- **A.** Real hash standards are literally random oracles implemented in hardware as true randomness.
- **B.** Random oracle intuition is correctly understood as: an idealized hash that returns independent random values for new inputs, used in proofs; real hashes only approximate this.
- **C.** A useful way to remember Random oracle intuition is that it is not the same as “A Caesar cipher with shift 1”.
- **D.** In this module, Random oracle intuition is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Real hash standards are literally random oracles implemented in hardware as true randomness.. Random oracle intuition actually means: An idealized hash that returns independent random values for new inputs, used in proofs; real hashes only approximate this.

### Q46  ·  Intermediate
**Question:** Which statement about **Second-preimage resistance** is FALSE?

- **A.** In this module, Second-preimage resistance is a core idea students must distinguish from nearby terms.
- **B.** Second-preimage resistance is correctly understood as: given m1, it is infeasible to find m2≠m1 with H(m2)=H(m1).
- **C.** Second-preimage resistance is identical to collision resistance and has the same typical attack cost.
- **D.** A useful way to remember Second-preimage resistance is that it is not the same as “Finding any colliding pair from scratch”.

**Answer:** C
**Explanation:** The false claim is: Second-preimage resistance is identical to collision resistance and has the same typical attack cost.. Second-preimage resistance actually means: Given m1, it is infeasible to find m2≠m1 with H(m2)=H(m1).

### Q47  ·  Intermediate
**Question:** Why is collision resistance the critical hash property for digital signatures?

- **A.** Collisions invert RSA
- **B.** Preimage is easier than collision
- **C.** Signatures do not use hashes
- **D.** A collision lets an attacker swap a signed document for another with the same digest

**Answer:** D
**Explanation:** Hash-then-sign.

### Q48  ·  Difficult
**Question:** API authenticates with SHA256(secret||message). Length-extension risk applies if:

- **A.** The secret is empty and H is CRC
- **B.** RSA-PSS is used
- **C.** H is Merkle–Damgård (SHA-256) and secret is prefix
- **D.** H is SHA-3/HMAC designed to block this

**Answer:** C
**Explanation:** Naive prefix MAC.

### Q49  ·  Difficult
**Question:** Five HODs; any three should open the question-bank safe. Cryptographic tool:

- **A.** XOR into 5 pieces requiring all 5 always only
- **B.** Caesar of the PIN
- **C.** HMAC of the door
- **D.** Shamir (3,5) secret sharing

**Answer:** D
**Explanation:** Threshold sharing.

### Q50  ·  Difficult
**Question:** Generic collision work for a 160-bit hash (birthday)?

- **A.** 160
- **B.** About 2^80 evaluations
- **C.** 2^40 always for any n
- **D.** 2^160

**Answer:** B
**Explanation:** 2^{n/2} = 2^80.

### Q51  ·  Difficult
**Question:** Generic preimage work for SHA-256?

- **A.** 2^128
- **B.** 2^64
- **C.** About 2^256
- **D.** 256

**Answer:** C
**Explanation:** 2^n for n=256.

### Q52  ·  Difficult
**Question:** HMAC-SHA256 of fee JSON with a server-side key. A client without the key:

- **A.** Can recompute HMAC because the algorithm is public (Kerckhoffs misapplied to the key)
- **B.** Cannot forge a valid tag (if the key is strong and secret)
- **C.** Gets non-repudiation against the server vis-à-vis a third-party court without PKI
- **D.** Breaks SHA-256 collisions to forge HMAC easily at 2^64

**Answer:** B
**Explanation:** MAC forgery needs the key.

### Q53  ·  Difficult
**Question:** HMAC-SHA256 tag length in bits typically?

- **A.** 256
- **B.** 32
- **C.** 128 only always
- **D.** 1600

**Answer:** A
**Explanation:** Same as the underlying digest unless truncated.

### Q54  ·  Difficult
**Question:** How many random 365-day birthdays until collision probability is ~50% (classroom birthday)?

- **A.** 365
- **B.** 183
- **C.** 2^365
- **D.** About 23

**Answer:** D
**Explanation:** Classic ≈1.177√365 ≈ 23.

### Q55  ·  Difficult
**Question:** PoW target: 20 leading zero bits in a 256-bit hash. Expected hashes?

- **A.** 20
- **B.** 2^256
- **C.** 2^10
- **D.** About 2^20

**Answer:** D
**Explanation:** Probability 2^{-20} per try if the hash is uniform.

### Q56  ·  Difficult
**Question:** Second-preimage resistance protects which scenario?

- **A.** An attacker who must match a given signed firmware image’s digest with a different image
- **B.** Inverting a random digest with no message
- **C.** Breaking HMAC with no key by birthday on tags of length 256 in 2^128 if the key is secret
- **D.** Finding any two colliding PDFs from scratch

**Answer:** A
**Explanation:** Fixed m1.

### Q57  ·  Difficult
**Question:** Shamir (3,5) sharing: minimum shares to reconstruct?

- **A.** 1
- **B.** 3
- **C.** 5
- **D.** 4

**Answer:** B
**Explanation:** Threshold t=3.

### Q58  ·  Difficult
**Question:** Two PDFs collide under a broken hash and one is signed by the registrar. Risk:

- **A.** RSA becomes OTP
- **B.** HMAC keys leak automatically
- **C.** The signature verifies the colliding bogus PDF (hash-then-sign)
- **D.** CRC becomes SHA-3

**Answer:** C
**Explanation:** Collision breaks hash-then-sign.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **(t,n) secret sharing** and **splitting a key into n XOR pieces all required**?

- **A.** Shamir needs all n shares always.
- **B.** Threshold t reconstructs; XOR n-of-n needs every piece. Shamir allows missing shareholders.
- **C.** XOR n-of-n is a (2,n) Shamir scheme.
- **D.** They both publish the secret.

**Answer:** B
**Explanation:** Threshold t reconstructs; XOR n-of-n needs every piece. Shamir allows missing shareholders.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **Tiger** and **SHA-256**?

- **A.** They are both transposition ciphers.
- **B.** SHA-256 is a rotor machine.
- **C.** Tiger outputs 192 bits (often) and was aimed at 64-bit software; SHA-256 outputs 256 bits and is the current common default.
- **D.** Tiger is a CA protocol.

**Answer:** C
**Explanation:** Tiger outputs 192 bits (often) and was aimed at 64-bit software; SHA-256 outputs 256 bits and is the current common default.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **digital signature** and **MAC**?

- **A.** MACs use private keys published to the world.
- **B.** Signatures use key pairs and are verifiable by anyone (non-repudiation); MACs share a secret and do not distinguish which holder forged.
- **C.** Signatures require a shared password.
- **D.** They are both CRC32.

**Answer:** B
**Explanation:** Signatures use key pairs and are verifiable by anyone (non-repudiation); MACs share a secret and do not distinguish which holder forged.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **second-preimage** and **collision**?

- **A.** Second-preimage fixes one message; collision allows both to be chosen. Collision is easier (birthday).
- **B.** Second-preimage forges a MAC key.
- **C.** Second-preimage uses birthday 2^{n/2} as the generic cost for SHA-256.
- **D.** They are identical attacks.

**Answer:** A
**Explanation:** Second-preimage fixes one message; collision allows both to be chosen. Collision is easier (birthday).

### Q63  ·  Difficult
**Question:** Which statement about **Avalanche effect** is FALSE?

- **A.** Avalanche effect is correctly understood as: a small input change (even one bit) should flip each output bit with probability about 1/2.
- **B.** In this module, Avalanche effect is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Avalanche effect is that it is not the same as “The digest must equal the first 256 bits of the message”.
- **D.** Avalanche means a 1-bit message change flips exactly one digest bit.

**Answer:** D
**Explanation:** The false claim is: Avalanche means a 1-bit message change flips exactly one digest bit.. Avalanche effect actually means: A small input change (even one bit) should flip each output bit with probability about 1/2.

### Q64  ·  Difficult
**Question:** Which statement about **Collision resistance** is FALSE?

- **A.** Collision resistance is correctly understood as: it is infeasible to find any pair m1≠m2 with H(m1)=H(m2).
- **B.** Collision resistance is guaranteed for any 32-bit checksum such as CRC32.
- **C.** A useful way to remember Collision resistance is that it is not the same as “Given y, invert H”.
- **D.** In this module, Collision resistance is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Collision resistance is guaranteed for any 32-bit checksum such as CRC32.. Collision resistance actually means: It is infeasible to find any pair m1≠m2 with H(m1)=H(m2).

### Q65  ·  Difficult
**Question:** Which statement about **Digest length** is FALSE?

- **A.** Digest length is correctly understood as: output bits n; generic preimage ~2^n, generic collision ~2^{n/2}; 128-bit collision resistance needs about 256-bit digest.
- **B.** In this module, Digest length is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Digest length is that it is not the same as “n=32 is enough against nation-state collision search”.
- **D.** A 160-bit digest has generic collision work 2^160, not 2^80.

**Answer:** D
**Explanation:** The false claim is: A 160-bit digest has generic collision work 2^160, not 2^80.. Digest length actually means: Output bits n; generic preimage ~2^n, generic collision ~2^{n/2}; 128-bit collision resistance needs about 256-bit digest.

### Q66  ·  Difficult
**Question:** Which statement about **HMAC** is FALSE?

- **A.** HMAC is correctly understood as: a keyed hash construction (nested H with key ⊕ ipad/opad) providing a MAC from a hash function.
- **B.** A useful way to remember HMAC is that it is not the same as “An unkeyed digest like SHA-256 used alone as a MAC”.
- **C.** In this module, HMAC is a core idea students must distinguish from nearby terms.
- **D.** HMAC is just H(key || message) without nested padding, which is always the recommended construction.

**Answer:** D
**Explanation:** The false claim is: HMAC is just H(key || message) without nested padding, which is always the recommended construction.. HMAC actually means: A keyed hash construction (nested H with key ⊕ ipad/opad) providing a MAC from a hash function.

### Q67  ·  Difficult
**Question:** Which statement about **Keyed vs unkeyed** is FALSE?

- **A.** SHA-256 of a message sent alongside it on the same channel authenticates the sender.
- **B.** Keyed vs unkeyed is correctly understood as: unkeyed hashes provide integrity only against accidental error or when the digest is fetched from a trusted channel; keyed MACs authenticate origin given key secrecy.
- **C.** A useful way to remember Keyed vs unkeyed is that it is not the same as “Unkeyed hashes prove who sent a message on an open channel”.
- **D.** In this module, Keyed vs unkeyed is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: SHA-256 of a message sent alongside it on the same channel authenticates the sender.. Keyed vs unkeyed actually means: Unkeyed hashes provide integrity only against accidental error or when the digest is fetched from a trusted channel; keyed MACs authenticate origin given key secrecy.

### Q68  ·  Difficult
**Question:** Which statement about **Length-extension** is FALSE?

- **A.** A useful way to remember Length-extension is that it is not the same as “A property of HMAC that HMAC is designed to reintroduce”.
- **B.** In this module, Length-extension is a core idea students must distinguish from nearby terms.
- **C.** Length-extension means SHA-256 cannot be used inside HMAC at all.
- **D.** Length-extension is correctly understood as: some Merkle–Damgård hashes allow computing H(m||pad||x) from H(m) and |m| without m, breaking naive H(key||m) MACs.

**Answer:** C
**Explanation:** The false claim is: Length-extension means SHA-256 cannot be used inside HMAC at all.. Length-extension actually means: Some Merkle–Damgård hashes allow computing H(m||pad||x) from H(m) and |m| without m, breaking naive H(key||m) MACs.

### Q69  ·  Difficult
**Question:** Which statement about **Preimage resistance** is FALSE?

- **A.** In this module, Preimage resistance is a core idea students must distinguish from nearby terms.
- **B.** Preimage resistance is correctly understood as: given y, it is infeasible to find any m with H(m)=y (one-wayness).
- **C.** A useful way to remember Preimage resistance is that it is not the same as “Given m1, find m2≠m1 with H(m1)=H(m2)”.
- **D.** Preimage resistance means it is easy to invert SHA-256 on a random digest with a laptop.

**Answer:** D
**Explanation:** The false claim is: Preimage resistance means it is easy to invert SHA-256 on a random digest with a laptop.. Preimage resistance actually means: Given y, it is infeasible to find any m with H(m)=y (one-wayness).

### Q70  ·  Difficult
**Question:** Which statement about **Secret sharing (Shamir)** is FALSE?

- **A.** In this module, Secret sharing (Shamir) is a core idea students must distinguish from nearby terms.
- **B.** In a (t,n) Shamir scheme, a single share determines the secret if t>1.
- **C.** A useful way to remember Secret sharing (Shamir) is that it is not the same as “Give the whole key to each of n people”.
- **D.** Secret sharing (Shamir) is correctly understood as: split a secret into n shares so any t shares reconstruct it (threshold), while t−1 reveal nothing in the information-theoretic sense for Shamir over a field.

**Answer:** B
**Explanation:** The false claim is: In a (t,n) Shamir scheme, a single share determines the secret if t>1.. Secret sharing (Shamir) actually means: Split a secret into n shares so any t shares reconstruct it (threshold), while t−1 reveal nothing in the information-theoretic sense for Shamir over a field.

### Q71  ·  Difficult
**Question:** Which statement about **Tiger hash** is FALSE?

- **A.** Tiger is a public-key signature algorithm, not a hash.
- **B.** A useful way to remember Tiger hash is that it is not the same as “A stream cipher used in TLS 1.3 as the only record cipher”.
- **C.** Tiger hash is correctly understood as: a cryptographic hash designed by Anderson and Biham, producing 192-bit (and truncated) digests, optimized historically for 64-bit CPUs.
- **D.** In this module, Tiger hash is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Tiger is a public-key signature algorithm, not a hash.. Tiger hash actually means: A cryptographic hash designed by Anderson and Biham, producing 192-bit (and truncated) digests, optimized historically for 64-bit CPUs.

### Q72  ·  Difficult
**Question:** Why is H(key||m) a bad MAC for SHA-256?

- **A.** HMAC forbids SHA-256
- **B.** Merkle–Damgård length-extension forges H(key||m||pad||x) from the tag
- **C.** SHA-256 cannot take a key of any length
- **D.** Kerckhoffs forbids keyed hashes

**Answer:** B
**Explanation:** Length extension.

---

## Quick answer key

Q01–A | Q02–A | Q03–B | Q04–B | Q05–C | Q06–A | Q07–C | Q08–A | Q09–C | Q10–C | Q11–C | Q12–A | Q13–D | Q14–C | Q15–D | Q16–A | Q17–A | Q18–C | Q19–C | Q20–B | Q21–B | Q22–A | Q23–D | Q24–C | Q25–D | Q26–A | Q27–B | Q28–D | Q29–C | Q30–A | Q31–B | Q32–B | Q33–A | Q34–B | Q35–B | Q36–C | Q37–B | Q38–A | Q39–D | Q40–A | Q41–B | Q42–D | Q43–A | Q44–A | Q45–A | Q46–C | Q47–D | Q48–C | Q49–D | Q50–B | Q51–C | Q52–B | Q53–A | Q54–D | Q55–D | Q56–A | Q57–B | Q58–C | Q59–B | Q60–C | Q61–B | Q62–A | Q63–D | Q64–B | Q65–D | Q66–D | Q67–A | Q68–C | Q69–D | Q70–B | Q71–A | Q72–B
