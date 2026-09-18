# Quiz — Information and Network Security — Module 4: Key Management

**Subject:** Information and Network Security  
**Module:** Module 4 — Key Management  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A CRL contains:

- **A.** WPA passphrases
- **B.** Serials (or equivalent IDs) of certificates that are revoked, plus a CA signature
- **C.** Private keys of leaves
- **D.** User passwords

**Answer:** B
**Explanation:** Signed revocation list.

### Q02  ·  Easy
**Question:** An HSM’s main security goal is:

- **A.** Speed up Python loops
- **B.** Keep private keys non-exportable and use them inside the module
- **C.** Replace TLS
- **D.** Store CRL caches only

**Answer:** B
**Explanation:** Key protection.

### Q03  ·  Easy
**Question:** An X.509 certificate binds:

- **A.** A public key to a subject, signed by a CA
- **B.** An AES key to a MAC
- **C.** A salt to a username only
- **D.** A private key to a password

**Answer:** A
**Explanation:** PKC definition.

### Q04  ·  Easy
**Question:** Which is a typical key-lifecycle stage?

- **A.** Rotation / destruction after end of life
- **B.** Skipping storage protection
- **C.** Publishing private keys
- **D.** Never generating entropy

**Answer:** A
**Explanation:** Lifecycle includes retirement.

### Q05  ·  Easy
**Question:** Which option best describes **Certificate chain**?

- **A.** A password salt chain.
- **B.** A single self-signed leaf with no trust anchor.
- **C.** A leaf certificate plus intermediate CA certs leading to a trusted root that the verifier already has.
- **D.** A Shamir share list.

**Answer:** C
**Explanation:** Certificate chain: A leaf certificate plus intermediate CA certs leading to a trusted root that the verifier already has.

### Q06  ·  Easy
**Question:** Which option best describes **Certificate expiry (notAfter)**?

- **A.** A hard stop after which the certificate must not be accepted even if the signature is valid.
- **B.** A KDC ticket flag only.
- **C.** A hint that browsers ignore.
- **D.** The same as revocation.

**Answer:** A
**Explanation:** Certificate expiry (notAfter): A hard stop after which the certificate must not be accepted even if the signature is valid.

### Q07  ·  Easy
**Question:** Which option best describes **HSM**?

- **A.** A Post-it under the keyboard.
- **B.** A Git private repo.
- **C.** A hardened device that generates/stores keys and performs crypto so keys do not appear in ordinary RAM/disks.
- **D.** A USB stick with a PEM file in a student locker.

**Answer:** C
**Explanation:** HSM: A hardened device that generates/stores keys and performs crypto so keys do not appear in ordinary RAM/disks.

### Q08  ·  Easy
**Question:** Which option best describes **Key distribution**?

- **A.** Delivering keys to parties who need them without exposing them to others (physical, KDC, public-key wrapping, out-of-band).
- **B.** Emailing AES keys in plaintext.
- **C.** Printing private keys on ID cards.
- **D.** Posting them on the LMS forum.

**Answer:** A
**Explanation:** Key distribution: Delivering keys to parties who need them without exposing them to others (physical, KDC, public-key wrapping, out-of-band).

### Q09  ·  Easy
**Question:** Which option best describes **Key lifecycle**?

- **A.** A hash function’s IV.
- **B.** Choosing AES as the only step.
- **C.** Generation, distribution, storage, use, rotation, revocation/compromise handling, and destruction of cryptographic keys.
- **D.** Publishing private keys in Git as rotation.

**Answer:** C
**Explanation:** Key lifecycle: Generation, distribution, storage, use, rotation, revocation/compromise handling, and destruction of cryptographic keys.

### Q10  ·  Easy
**Question:** Which option best describes **OCSP**?

- **A.** A type of Enigma rotor.
- **B.** A password KDF.
- **C.** Online Certificate Status Protocol: a responder answers whether a certificate is revoked, without downloading a full CRL.
- **D.** A replacement for TLS.

**Answer:** C
**Explanation:** OCSP: Online Certificate Status Protocol: a responder answers whether a certificate is revoked, without downloading a full CRL.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **Kerberos AS/TGS idea**?

- **A.** TGT is the private key of the root CA
- **B.** Client sends password to every service
- **C.** AS authenticates user and issues TGT → TGS issues service ticket → client presents ticket to service (authenticators for freshness)
- **D.** Service calls the CA for OCSP of the password

**Answer:** C
**Explanation:** Correct sequence for Kerberos AS/TGS idea: AS authenticates user and issues TGT → TGS issues service ticket → client presents ticket to service (authenticators for freshness)

### Q12  ·  Easy
**Question:** Which sequence correctly describes **X.509 chain validation (logical)**?

- **A.** Build path to a trust anchor → check signatures → validity time → names/EKU/policy → revocation (CRL/OCSP) → accept
- **B.** Require the CA private key on the client
- **C.** Skip time checks if the lock icon is green in a screenshot
- **D.** Trust the first self-signed leaf from the TCP connection

**Answer:** A
**Explanation:** Correct sequence for X.509 chain validation (logical): Build path to a trust anchor → check signatures → validity time → names/EKU/policy → revocation (CRL/OCSP) → accept

### Q13  ·  Intermediate
**Question:** Key wrapping is used to:

- **A.** Encrypt keys for disk or for sending under a KEK
- **B.** Generate RSA primes by XOR
- **C.** Hash certificates
- **D.** Replace OCSP

**Answer:** A
**Explanation:** KEK wrapping.

### Q14  ·  Intermediate
**Question:** OCSP stapling improves:

- **A.** Password entropy
- **B.** Enigma period
- **C.** The AES key length
- **D.** Privacy and sometimes availability vs each client querying the CA, while still conveying revocation status

**Answer:** D
**Explanation:** Stapled OCSP.

### Q15  ·  Intermediate
**Question:** OCSP stapling on https://erp.vviet.ac.in means:

- **A.** The client sends its password to the CA
- **B.** CRLs are abolished by physics
- **C.** The server presents a recent OCSP response so clients need not query the CA directly
- **D.** The leaf contains the CA private key

**Answer:** C
**Explanation:** Stapling.

### Q16  ·  Intermediate
**Question:** POS terminals derive a new key per payment from a BDK. This is:

- **A.** A static PIN key for 10 years
- **B.** A CRL delta
- **C.** An OCSP nonce
- **D.** UKPT-style unique keys per transaction

**Answer:** D
**Explanation:** Payment key hierarchy.

### Q17  ·  Intermediate
**Question:** Students pin the college CA in the mail app. A rogue café presents a leaf signed by a public CA for mail.vviet.edu.in if CAA/DNS is wrong. Defence includes:

- **A.** Name constraints, CAA, pinning/DANE, and monitoring — not trust-every-public-CA blindly for a private name
- **B.** Accepting any lock icon
- **C.** Caesar of IMAP
- **D.** Disabling TLS

**Answer:** A
**Explanation:** Trust-anchor hygiene.

### Q18  ·  Intermediate
**Question:** UKPT limits fraud because:

- **A.** OCSP signs PIN blocks
- **B.** Certificates include PINs
- **C.** Compromise of one transaction key should not expose other transactions’ keys
- **D.** All PINs use one static key by design

**Answer:** C
**Explanation:** Per-transaction keys.

### Q19  ·  Intermediate
**Question:** VVIET’s web cert expired during holidays. Browsers show a warning because:

- **A.** The CA private key is in the leaf
- **B.** OCSP must staple expiry
- **C.** Validity period failed even if the signature is cryptographically fine
- **D.** SHA-256 is broken

**Answer:** C
**Explanation:** Time validation.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **CRL** and **OCSP**?

- **A.** CRL is a signed batch list the client downloads; OCSP is a per-certificate online query (often stapled).
- **B.** CRLs cannot be signed.
- **C.** They both replace TLS handshake.
- **D.** OCSP is a list of all passwords.

**Answer:** A
**Explanation:** CRL is a signed batch list the client downloads; OCSP is a per-certificate online query (often stapled).

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **HKDF** and **password KDF (Argon2)**?

- **A.** Argon2 is for expanding a 256-bit random key only.
- **B.** HKDF is the right way to store ‘password123’.
- **C.** They are the same cost parameters.
- **D.** HKDF extracts/expands from high-entropy key material; password KDFs are slow and memory-hard for low-entropy secrets.

**Answer:** D
**Explanation:** HKDF extracts/expands from high-entropy key material; password KDFs are slow and memory-hard for low-entropy secrets.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **KDC** and **public-key CA**?

- **A.** A KDC publishes a root certificate only and never shares secrets.
- **B.** A KDC shares symmetric keys and mints session keys/tickets; a CA signs public-key certificates for open verification.
- **C.** They solve confidentiality of HTTP without keys.
- **D.** A CA stores everyone’s AES keys.

**Answer:** B
**Explanation:** A KDC shares symmetric keys and mints session keys/tickets; a CA signs public-key certificates for open verification.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **key rotation** and **revocation**?

- **A.** They are identical CRL fields.
- **B.** Rotation is planned replacement of aging keys; revocation is emergency invalidation after compromise or role change.
- **C.** Rotation is only for stolen keys.
- **D.** Revocation is a scheduled annual party.

**Answer:** B
**Explanation:** Rotation is planned replacement of aging keys; revocation is emergency invalidation after compromise or role change.

### Q24  ·  Intermediate
**Question:** Which option best describes **CRL**?

- **A.** A Bloom filter of IP addresses only.
- **B.** A signed list of unexpired certificates that should no longer be trusted, published by a CA.
- **C.** An OCSP staple that cannot exist.
- **D.** A list of strong passwords.

**Answer:** B
**Explanation:** CRL: A signed list of unexpired certificates that should no longer be trusted, published by a CA.

### Q25  ·  Intermediate
**Question:** Which option best describes **Certification authority (CA)**?

- **A.** A trusted issuer that signs certificates after identity checks (policy-dependent).
- **B.** A CRC checker.
- **C.** A WPA-PSK poster.
- **D.** A student who self-signs for the whole Internet.

**Answer:** A
**Explanation:** Certification authority (CA): A trusted issuer that signs certificates after identity checks (policy-dependent).

### Q26  ·  Intermediate
**Question:** Which option best describes **Digital certificate fields**?

- **A.** Only a MAC of the hostname.
- **B.** Typical fields: version, serial, issuer, validity, subject, subject public key, extensions, signature.
- **C.** Only the AES key.
- **D.** Only a JPEG photo of the student.

**Answer:** B
**Explanation:** Digital certificate fields: Typical fields: version, serial, issuer, validity, subject, subject public key, extensions, signature.

### Q27  ·  Intermediate
**Question:** Which option best describes **KDC (key distribution centre)**?

- **A.** An X.509 leaf with no CA.
- **B.** A public bulletin board of AES keys.
- **C.** A hash-only service.
- **D.** A trusted party that shares a key with each principal and helps them establish session keys (Kerberos-style).

**Answer:** D
**Explanation:** KDC (key distribution centre): A trusted party that shares a key with each principal and helps them establish session keys (Kerberos-style).

### Q28  ·  Intermediate
**Question:** Which option best describes **Kerberos intuition**?

- **A.** OTP pads mailed daily.
- **B.** X.509 only, no tickets.
- **C.** Open distribution of all service keys to all clients.
- **D.** A KDC issues time-limited tickets proving identity to services, using symmetric keys per principal.

**Answer:** D
**Explanation:** Kerberos intuition: A KDC issues time-limited tickets proving identity to services, using symmetric keys per principal.

### Q29  ·  Intermediate
**Question:** Which option best describes **Key derivation (KDF)**?

- **A.** Using MD5 once as a general-purpose KDF for passwords.
- **B.** Deriving one or more keys from a secret (password or master key) using a KDF (HKDF, Argon2, PBKDF2) with salt/context.
- **C.** Copying the password as the AES key without stretching.
- **D.** XOR with 0xFF only.

**Answer:** B
**Explanation:** Key derivation (KDF): Deriving one or more keys from a secret (password or master key) using a KDF (HKDF, Argon2, PBKDF2) with salt/context.

### Q30  ·  Intermediate
**Question:** Which option best describes **Key generation**?

- **A.** Reusing yesterday’s TLS nonce as a year-long master key.
- **B.** Creating keys with sufficient entropy (CSPRNG/HSM) matching the algorithm’s requirements.
- **C.** Deriving keys from student USNs only.
- **D.** Using ‘VVIET’ as a 128-bit AES key.

**Answer:** B
**Explanation:** Key generation: Creating keys with sufficient entropy (CSPRNG/HSM) matching the algorithm’s requirements.

### Q31  ·  Intermediate
**Question:** Which option best describes **Key wrapping**?

- **A.** Hashing the key with CRC32.
- **B.** Encrypting a key under another key (KEK) for storage or transport.
- **C.** Storing the key next to the ciphertext unencrypted.
- **D.** Printing the key in hex in a log.

**Answer:** B
**Explanation:** Key wrapping: Encrypting a key under another key (KEK) for storage or transport.

### Q32  ·  Intermediate
**Question:** Which option best describes **Revocation**?

- **A.** Changing the DNS A record only.
- **B.** Deleting the leaf from the web server and hoping caches die.
- **C.** Invalidating a certificate/key before expiry due to compromise, affiliation change, or policy, and distributing that fact.
- **D.** Waiting until the notAfter date always, even after a leaked key.

**Answer:** C
**Explanation:** Revocation: Invalidating a certificate/key before expiry due to compromise, affiliation change, or policy, and distributing that fact.

### Q33  ·  Intermediate
**Question:** Which option best describes **Trust anchor**?

- **A.** A preinstalled root certificate (or key) that starts chain validation; not retrieved from the connection unauthenticated.
- **B.** The leaf cert of the site you just met.
- **C.** A self-signed exam PDF.
- **D.** The first Google result.

**Answer:** A
**Explanation:** Trust anchor: A preinstalled root certificate (or key) that starts chain validation; not retrieved from the connection unauthenticated.

### Q34  ·  Intermediate
**Question:** Which option best describes **UKPT (Unique Key Per Transaction)**?

- **A.** One terminal master key used as the PIN-block key forever with no derivation.
- **B.** A public CA certificate.
- **C.** Payment-industry practice: a new key for each transaction, derived from a base key, limiting compromise scope.
- **D.** A Caesar daily shift.

**Answer:** C
**Explanation:** UKPT (Unique Key Per Transaction): Payment-industry practice: a new key for each transaction, derived from a base key, limiting compromise scope.

### Q35  ·  Intermediate
**Question:** Which option best describes **X.509 certificate**?

- **A.** A signed document binding a public key to a subject (and metadata) under a CA’s signature.
- **B.** A symmetric session key.
- **C.** A password hash.
- **D.** A private key file.

**Answer:** A
**Explanation:** X.509 certificate: A signed document binding a public key to a subject (and metadata) under a CA’s signature.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **issuing a campus TLS certificate**?

- **A.** Copy the root private key to Apache
- **B.** CSR from key in HSM → CA verifies control of name → CA signs leaf → install leaf+chain → enable stapling/CRL → monitor expiry
- **C.** Self-sign on a lab PC and email the private key to the web team via WhatsApp
- **D.** Set notAfter to 2099 and skip revocation URLs

**Answer:** B
**Explanation:** Correct sequence for issuing a campus TLS certificate: CSR from key in HSM → CA verifies control of name → CA signs leaf → install leaf+chain → enable stapling/CRL → monitor expiry

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **key compromise response**?

- **A.** Keep using the stolen PEM until expiry
- **B.** Post the incident only after the next NAAC visit
- **C.** Contain → revoke cert/key → generate new key material in HSM → reissue → audit logs → destroy old key copies
- **D.** Rotate the wallpaper

**Answer:** C
**Explanation:** Correct sequence for key compromise response: Contain → revoke cert/key → generate new key material in HSM → reissue → audit logs → destroy old key copies

### Q38  ·  Intermediate
**Question:** Which statement about **Certification authority (CA)** is FALSE?

- **A.** A CA must publish its private key so verifiers can sign too.
- **B.** In this module, Certification authority (CA) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Certification authority (CA) is that it is not the same as “A student who self-signs for the whole Internet”.
- **D.** Certification authority (CA) is correctly understood as: a trusted issuer that signs certificates after identity checks (policy-dependent).

**Answer:** A
**Explanation:** The false claim is: A CA must publish its private key so verifiers can sign too.. Certification authority (CA) actually means: A trusted issuer that signs certificates after identity checks (policy-dependent).

### Q39  ·  Intermediate
**Question:** Which statement about **Digital certificate fields** is FALSE?

- **A.** Certificates never carry a validity period.
- **B.** In this module, Digital certificate fields is a core idea students must distinguish from nearby terms.
- **C.** Digital certificate fields is correctly understood as: typical fields: version, serial, issuer, validity, subject, subject public key, extensions, signature.
- **D.** A useful way to remember Digital certificate fields is that it is not the same as “Only a JPEG photo of the student”.

**Answer:** A
**Explanation:** The false claim is: Certificates never carry a validity period.. Digital certificate fields actually means: Typical fields: version, serial, issuer, validity, subject, subject public key, extensions, signature.

### Q40  ·  Intermediate
**Question:** Which statement about **HSM** is FALSE?

- **A.** In this module, HSM is a core idea students must distinguish from nearby terms.
- **B.** An HSM is just a faster CPU; extracting keys as files is the intended API.
- **C.** A useful way to remember HSM is that it is not the same as “A USB stick with a PEM file in a student locker”.
- **D.** HSM is correctly understood as: a hardened device that generates/stores keys and performs crypto so keys do not appear in ordinary RAM/disks.

**Answer:** B
**Explanation:** The false claim is: An HSM is just a faster CPU; extracting keys as files is the intended API.. HSM actually means: A hardened device that generates/stores keys and performs crypto so keys do not appear in ordinary RAM/disks.

### Q41  ·  Intermediate
**Question:** Which statement about **KDC (key distribution centre)** is FALSE?

- **A.** A KDC is untrusted by definition and never stores master keys.
- **B.** KDC (key distribution centre) is correctly understood as: a trusted party that shares a key with each principal and helps them establish session keys (Kerberos-style).
- **C.** In this module, KDC (key distribution centre) is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember KDC (key distribution centre) is that it is not the same as “A public bulletin board of AES keys”.

**Answer:** A
**Explanation:** The false claim is: A KDC is untrusted by definition and never stores master keys.. KDC (key distribution centre) actually means: A trusted party that shares a key with each principal and helps them establish session keys (Kerberos-style).

### Q42  ·  Intermediate
**Question:** Which statement about **Key derivation (KDF)** is FALSE?

- **A.** In this module, Key derivation (KDF) is a core idea students must distinguish from nearby terms.
- **B.** Key derivation (KDF) is correctly understood as: deriving one or more keys from a secret (password or master key) using a KDF (HKDF, Argon2, PBKDF2) with salt/context.
- **C.** A KDF is unnecessary if the password is ‘long enough’ like 8 English letters.
- **D.** A useful way to remember Key derivation (KDF) is that it is not the same as “Copying the password as the AES key without stretching”.

**Answer:** C
**Explanation:** The false claim is: A KDF is unnecessary if the password is ‘long enough’ like 8 English letters.. Key derivation (KDF) actually means: Deriving one or more keys from a secret (password or master key) using a KDF (HKDF, Argon2, PBKDF2) with salt/context.

### Q43  ·  Intermediate
**Question:** Which statement about **Key lifecycle** is FALSE?

- **A.** Once generated, a key should never be rotated or destroyed.
- **B.** In this module, Key lifecycle is a core idea students must distinguish from nearby terms.
- **C.** Key lifecycle is correctly understood as: generation, distribution, storage, use, rotation, revocation/compromise handling, and destruction of cryptographic keys.
- **D.** A useful way to remember Key lifecycle is that it is not the same as “Choosing AES as the only step”.

**Answer:** A
**Explanation:** The false claim is: Once generated, a key should never be rotated or destroyed.. Key lifecycle actually means: Generation, distribution, storage, use, rotation, revocation/compromise handling, and destruction of cryptographic keys.

### Q44  ·  Intermediate
**Question:** Which statement about **Key wrapping** is FALSE?

- **A.** Key wrapping is correctly understood as: encrypting a key under another key (KEK) for storage or transport.
- **B.** A useful way to remember Key wrapping is that it is not the same as “Printing the key in hex in a log”.
- **C.** In this module, Key wrapping is a core idea students must distinguish from nearby terms.
- **D.** Key wrapping is the same as hashing the key and throwing away the original.

**Answer:** D
**Explanation:** The false claim is: Key wrapping is the same as hashing the key and throwing away the original.. Key wrapping actually means: Encrypting a key under another key (KEK) for storage or transport.

### Q45  ·  Intermediate
**Question:** Which statement about **OCSP** is FALSE?

- **A.** A useful way to remember OCSP is that it is not the same as “A replacement for TLS”.
- **B.** In this module, OCSP is a core idea students must distinguish from nearby terms.
- **C.** OCSP is correctly understood as: online Certificate Status Protocol: a responder answers whether a certificate is revoked, without downloading a full CRL.
- **D.** OCSP requires the client to possess the CA private key.

**Answer:** D
**Explanation:** The false claim is: OCSP requires the client to possess the CA private key.. OCSP actually means: Online Certificate Status Protocol: a responder answers whether a certificate is revoked, without downloading a full CRL.

### Q46  ·  Intermediate
**Question:** Which statement about **Trust anchor** is FALSE?

- **A.** Trust anchors should be downloaded from the same suspicious site as the leaf, without pinning.
- **B.** Trust anchor is correctly understood as: a preinstalled root certificate (or key) that starts chain validation; not retrieved from the connection unauthenticated.
- **C.** A useful way to remember Trust anchor is that it is not the same as “The leaf cert of the site you just met”.
- **D.** In this module, Trust anchor is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Trust anchors should be downloaded from the same suspicious site as the leaf, without pinning.. Trust anchor actually means: A preinstalled root certificate (or key) that starts chain validation; not retrieved from the connection unauthenticated.

### Q47  ·  Intermediate
**Question:** Why do browsers carry root CAs (trust anchors)?

- **A.** To decrypt TLS records with the root private key
- **B.** To store all website passwords
- **C.** To run OCSP as a KDC
- **D.** To start chain validation without fetching an untrusted root from the connection

**Answer:** D
**Explanation:** Trust must start somewhere.

### Q48  ·  Difficult
**Question:** A CA issues 4096 certificates with independently random 20-bit serials. Expected pairwise serial collisions are about:

- **A.** 0, because 4096 < 2^20 so pigeonhole cannot apply
- **B.** Exactly 20 collisions, one per bit
- **C.** 8, so 20-bit serials are far too small
- **D.** 4096 collisions, one per certificate

**Answer:** C
**Explanation:** Expected collisions ≈ k(k−1)/2N ≈ 4096² / (2 × 2^20) ≈ 8. Serials must be large and unique by CA policy.

### Q49  ·  Difficult
**Question:** A certificate valid 1 Jul 2026–1 Jul 2027 is presented on 2 Jul 2027. Path building otherwise succeeds. Result?

- **A.** Accept if OCSP is slow
- **B.** Reject (expired)
- **C.** Accept if CRL is a week old
- **D.** Accept because the CA still exists

**Answer:** B
**Explanation:** notAfter has passed.

### Q50  ·  Difficult
**Question:** A chain with a valid signature to a trusted root can still be rejected because:

- **A.** SHA-256 cannot sign
- **B.** The name does not match, it is expired, EKU is wrong, or it is revoked
- **C.** Kerckhoffs forbids CAs
- **D.** HSMs cannot store public keys

**Answer:** B
**Explanation:** Validation is more than a signature check.

### Q51  ·  Difficult
**Question:** A clerk generates AES keys with a spreadsheet RAND(). Risk:

- **A.** Kerckhoffs violation of AES rounds
- **B.** Low entropy / predictable keys
- **C.** X.509 name mismatch only
- **D.** UKPT success

**Answer:** B
**Explanation:** Bad generation.

### Q52  ·  Difficult
**Question:** A stolen laptop holds the fee-portal private key PEM. First PKI action:

- **A.** Wait for notAfter in 11 months
- **B.** Publish the PEM so others can help
- **C.** Revoke the certificate (CRL/OCSP) and replace the key pair
- **D.** Disable HTTPS

**Answer:** C
**Explanation:** Compromise handling.

### Q53  ·  Difficult
**Question:** CRL issued hourly; browser caches 24 h. Maximum time a revoked cert may still be accepted if relying only on that CRL cache?

- **A.** 1 second
- **B.** The remaining year of validity
- **C.** Never cached
- **D.** Up to about 24 hours (plus CRL issuance lag)

**Answer:** D
**Explanation:** Cache TTL dominates.

### Q54  ·  Difficult
**Question:** Exam cell uses an HSM to sign result PDFs. The application should:

- **A.** Email the key before each convocation
- **B.** Store d in the PDF
- **C.** Send hashes to the HSM to sign; never export the private key
- **D.** Copy the private key to each clerk PC daily

**Answer:** C
**Explanation:** HSM usage.

### Q55  ·  Difficult
**Question:** HKDF expands 256 bits of IKMs into 4 AES-128 keys. Total key bits out?

- **A.** 128
- **B.** 256
- **C.** 1024
- **D.** 512

**Answer:** D
**Explanation:** 4×128=512 bits of keying material.

### Q56  ·  Difficult
**Question:** HKDF vs PBKDF2/Argon2: which sentence is correct?

- **A.** Do not use a fast HKDF alone to derive keys from user passwords; use a password KDF first
- **B.** HKDF is slow and memory-hard by default like Argon2id
- **C.** Passwords may be used as AES-256 keys if they have 8 characters
- **D.** Argon2 is only for expanding 256-bit random keys

**Answer:** A
**Explanation:** Match KDF to entropy source.

### Q57  ·  Difficult
**Question:** Kerberos ticket lifetime 8 hours. A stolen ticket without a renewable flag is useful at most:

- **A.** Until it expires (8 hours) unless already expired
- **B.** 1 second
- **C.** Forever, like a password hash
- **D.** Until the CA root rotates

**Answer:** A
**Explanation:** Tickets are time-bounded.

### Q58  ·  Difficult
**Question:** Kerberos-style campus login: the student never sends the password to the file server. Instead:

- **A.** The file server stores all passwords
- **B.** OTP pads in /etc
- **C.** X.509 private keys of every student sit on NFS
- **D.** A KDC-issued ticket (TGS) authenticates to the service

**Answer:** D
**Explanation:** Tickets.

### Q59  ·  Difficult
**Question:** RSA-2048 cert: which key is in the certificate?

- **A.** An AES-256 data key
- **B.** The 2048-bit public modulus/exponent, not d
- **C.** The private exponent d
- **D.** A 4-digit PIN

**Answer:** B
**Explanation:** Certificates carry public keys.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **HSM** and **software keystore on disk**?

- **A.** Disk PEMs are harder to steal than HSM keys.
- **B.** HSM resists extraction and can enforce policy; disk PEMs are copied by anyone with filesystem access.
- **C.** HSMs publish private keys via HTTP.
- **D.** They provide the same extraction resistance.

**Answer:** B
**Explanation:** HSM resists extraction and can enforce policy; disk PEMs are copied by anyone with filesystem access.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **UKPT** and **static terminal key**?

- **A.** They are both Caesar shifts.
- **B.** UKPT uses one PIN as the master key.
- **C.** UKPT derives unique per-transaction keys so one dump does not kill all future PINs; a static key is a single point of failure.
- **D.** Static keys are required by PCI as the only option.

**Answer:** C
**Explanation:** UKPT derives unique per-transaction keys so one dump does not kill all future PINs; a static key is a single point of failure.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **root CA** and **leaf certificate**?

- **A.** A root is a trust anchor (typically self-signed in the store); a leaf binds an end-entity key and is signed by an intermediate/root.
- **B.** They are the same file.
- **C.** Leaves sign roots.
- **D.** Roots contain the website’s private key.

**Answer:** A
**Explanation:** A root is a trust anchor (typically self-signed in the store); a leaf binds an end-entity key and is signed by an intermediate/root.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **self-signed certificate** and **CA-signed certificate**?

- **A.** CA-signed certs include the private key.
- **B.** Self-signed is trusted only if pinned/out-of-band; CA-signed inherits the CA’s trust for browsers/OS stores.
- **C.** Self-signed is always trusted by every browser without warnings.
- **D.** They both skip expiry.

**Answer:** B
**Explanation:** Self-signed is trusted only if pinned/out-of-band; CA-signed inherits the CA’s trust for browsers/OS stores.

### Q64  ·  Difficult
**Question:** Which statement about **CRL** is FALSE?

- **A.** In this module, CRL is a core idea students must distinguish from nearby terms.
- **B.** A CRL is a secret document the relying party must never download.
- **C.** A useful way to remember CRL is that it is not the same as “A list of strong passwords”.
- **D.** CRL is correctly understood as: a signed list of unexpired certificates that should no longer be trusted, published by a CA.

**Answer:** B
**Explanation:** The false claim is: A CRL is a secret document the relying party must never download.. CRL actually means: A signed list of unexpired certificates that should no longer be trusted, published by a CA.

### Q65  ·  Difficult
**Question:** Which statement about **Certificate chain** is FALSE?

- **A.** Verifiers need the root’s private key to check a chain.
- **B.** A useful way to remember Certificate chain is that it is not the same as “A single self-signed leaf with no trust anchor”.
- **C.** Certificate chain is correctly understood as: a leaf certificate plus intermediate CA certs leading to a trusted root that the verifier already has.
- **D.** In this module, Certificate chain is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Verifiers need the root’s private key to check a chain.. Certificate chain actually means: A leaf certificate plus intermediate CA certs leading to a trusted root that the verifier already has.

### Q66  ·  Difficult
**Question:** Which statement about **Certificate expiry (notAfter)** is FALSE?

- **A.** Certificate expiry (notAfter) is correctly understood as: a hard stop after which the certificate must not be accepted even if the signature is valid.
- **B.** In this module, Certificate expiry (notAfter) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Certificate expiry (notAfter) is that it is not the same as “A hint that browsers ignore”.
- **D.** Expired certificates remain valid if the CA is still trusted.

**Answer:** D
**Explanation:** The false claim is: Expired certificates remain valid if the CA is still trusted.. Certificate expiry (notAfter) actually means: A hard stop after which the certificate must not be accepted even if the signature is valid.

### Q67  ·  Difficult
**Question:** Which statement about **Kerberos intuition** is FALSE?

- **A.** Kerberos requires each service to hold an RSA certificate and never a shared secret with the KDC.
- **B.** Kerberos intuition is correctly understood as: a KDC issues time-limited tickets proving identity to services, using symmetric keys per principal.
- **C.** A useful way to remember Kerberos intuition is that it is not the same as “Open distribution of all service keys to all clients”.
- **D.** In this module, Kerberos intuition is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Kerberos requires each service to hold an RSA certificate and never a shared secret with the KDC.. Kerberos intuition actually means: A KDC issues time-limited tickets proving identity to services, using symmetric keys per principal.

### Q68  ·  Difficult
**Question:** Which statement about **Key distribution** is FALSE?

- **A.** Key distribution is correctly understood as: delivering keys to parties who need them without exposing them to others (physical, KDC, public-key wrapping, out-of-band).
- **B.** The hardest problem in symmetric crypto is solved by writing the key on the chalkboard.
- **C.** A useful way to remember Key distribution is that it is not the same as “Emailing AES keys in plaintext”.
- **D.** In this module, Key distribution is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: The hardest problem in symmetric crypto is solved by writing the key on the chalkboard.. Key distribution actually means: Delivering keys to parties who need them without exposing them to others (physical, KDC, public-key wrapping, out-of-band).

### Q69  ·  Difficult
**Question:** Which statement about **Key generation** is FALSE?

- **A.** In this module, Key generation is a core idea students must distinguish from nearby terms.
- **B.** Key generation is correctly understood as: creating keys with sufficient entropy (CSPRNG/HSM) matching the algorithm’s requirements.
- **C.** A useful way to remember Key generation is that it is not the same as “Using ‘VVIET’ as a 128-bit AES key”.
- **D.** Key generation can safely use rand()%256 in a loop of 16 for AES-128.

**Answer:** D
**Explanation:** The false claim is: Key generation can safely use rand()%256 in a loop of 16 for AES-128.. Key generation actually means: Creating keys with sufficient entropy (CSPRNG/HSM) matching the algorithm’s requirements.

### Q70  ·  Difficult
**Question:** Which statement about **Revocation** is FALSE?

- **A.** A useful way to remember Revocation is that it is not the same as “Waiting until the notAfter date always, even after a leaked key”.
- **B.** In this module, Revocation is a core idea students must distinguish from nearby terms.
- **C.** Revocation is unnecessary because stolen private keys expire from the Internet immediately.
- **D.** Revocation is correctly understood as: invalidating a certificate/key before expiry due to compromise, affiliation change, or policy, and distributing that fact.

**Answer:** C
**Explanation:** The false claim is: Revocation is unnecessary because stolen private keys expire from the Internet immediately.. Revocation actually means: Invalidating a certificate/key before expiry due to compromise, affiliation change, or policy, and distributing that fact.

### Q71  ·  Difficult
**Question:** Which statement about **UKPT (Unique Key Per Transaction)** is FALSE?

- **A.** UKPT (Unique Key Per Transaction) is correctly understood as: payment-industry practice: a new key for each transaction, derived from a base key, limiting compromise scope.
- **B.** In this module, UKPT (Unique Key Per Transaction) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember UKPT (Unique Key Per Transaction) is that it is not the same as “One terminal master key used as the PIN-block key forever with no derivation”.
- **D.** UKPT means all terminals share one static key equal to the PIN itself.

**Answer:** D
**Explanation:** The false claim is: UKPT means all terminals share one static key equal to the PIN itself.. UKPT (Unique Key Per Transaction) actually means: Payment-industry practice: a new key for each transaction, derived from a base key, limiting compromise scope.

### Q72  ·  Difficult
**Question:** Which statement about **X.509 certificate** is FALSE?

- **A.** X.509 certificate is correctly understood as: a signed document binding a public key to a subject (and metadata) under a CA’s signature.
- **B.** A useful way to remember X.509 certificate is that it is not the same as “A private key file”.
- **C.** In this module, X.509 certificate is a core idea students must distinguish from nearby terms.
- **D.** An X.509 certificate contains the subject’s private key so anyone can decrypt.

**Answer:** D
**Explanation:** The false claim is: An X.509 certificate contains the subject’s private key so anyone can decrypt.. X.509 certificate actually means: A signed document binding a public key to a subject (and metadata) under a CA’s signature.

---

## Quick answer key

Q01–B | Q02–B | Q03–A | Q04–A | Q05–C | Q06–A | Q07–C | Q08–A | Q09–C | Q10–C | Q11–C | Q12–A | Q13–A | Q14–D | Q15–C | Q16–D | Q17–A | Q18–C | Q19–C | Q20–A | Q21–D | Q22–B | Q23–B | Q24–B | Q25–A | Q26–B | Q27–D | Q28–D | Q29–B | Q30–B | Q31–B | Q32–C | Q33–A | Q34–C | Q35–A | Q36–B | Q37–C | Q38–A | Q39–A | Q40–B | Q41–A | Q42–C | Q43–A | Q44–D | Q45–D | Q46–A | Q47–D | Q48–C | Q49–B | Q50–B | Q51–B | Q52–C | Q53–D | Q54–C | Q55–D | Q56–A | Q57–A | Q58–D | Q59–B | Q60–B | Q61–C | Q62–A | Q63–B | Q64–B | Q65–A | Q66–D | Q67–A | Q68–B | Q69–D | Q70–C | Q71–D | Q72–D
