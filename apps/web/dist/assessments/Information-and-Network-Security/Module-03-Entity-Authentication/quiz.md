# Quiz — Information and Network Security — Module 3: Entity Authentication

**Subject:** Information and Network Security  
**Module:** Module 3 — Entity Authentication  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** A nonce is used primarily to:

- **A.** Ensure freshness / prevent replay of a protocol run
- **B.** Store passwords
- **C.** Factor RSA
- **D.** Replace a hash function

**Answer:** A
**Explanation:** Number used once.

### Q02  ·  Easy
**Question:** A salt should be:

- **A.** Unique per user (and stored alongside the hash)
- **B.** The username only always, even if usernames change case
- **C.** Secret like an AES key and never stored
- **D.** The same 4 letters for the whole college

**Answer:** A
**Explanation:** Per-user uniqueness is the main point; secrecy is a pepper.

### Q03  ·  Easy
**Question:** Replay is best prevented by:

- **A.** CRC32 of the username
- **B.** Fresh nonces/timestamps/counters bound into the authenticator
- **C.** Using a longer static password only
- **D.** Publishing the algorithm

**Answer:** B
**Explanation:** Freshness.

### Q04  ·  Easy
**Question:** Which is a possession factor?

- **A.** A mother’s maiden name only
- **B.** A TOTP app / hardware token / smart card
- **C.** A fingerprint only (that is inherence)
- **D.** A 4-letter password only

**Answer:** B
**Explanation:** Something you have.

### Q05  ·  Easy
**Question:** Which option best describes **Entity authentication**?

- **A.** A CIA availability metric.
- **B.** Encrypting a hard disk at rest only.
- **C.** Verifying that a communicating party is who they claim to be, in real time (liveness), not only that a file is unmodified.
- **D.** Hashing a public firmware image.

**Answer:** C
**Explanation:** Entity authentication: Verifying that a communicating party is who they claim to be, in real time (liveness), not only that a file is unmodified.

### Q06  ·  Easy
**Question:** Which option best describes **Nonce**?

- **A.** A CA’s distinguished name.
- **B.** A password stored in the database.
- **C.** A number used once (random or a counter) to bind a protocol run and prevent replay.
- **D.** A hash IV fixed in the standard.

**Answer:** C
**Explanation:** Nonce: A number used once (random or a counter) to bind a protocol run and prevent replay.

### Q07  ·  Easy
**Question:** Which option best describes **Online vs offline guessing**?

- **A.** Online: each try hits the verifier (rate-limitable). Offline: attacker has a hash/verifier and tries locally at GPU speed.
- **B.** They are the same as birthday attacks on TLS.
- **C.** Offline attacks cannot use GPUs.
- **D.** Online attacks never need rate limits.

**Answer:** A
**Explanation:** Online vs offline guessing: Online: each try hits the verifier (rate-limitable). Offline: attacker has a hash/verifier and tries locally at GPU speed.

### Q08  ·  Easy
**Question:** Which option best describes **Pass-the-hash**?

- **A.** A transposition.
- **B.** Kerckhoffs.
- **C.** Replaying a stolen password hash/NT hash as if it were the credential, without knowing the password.
- **D.** A birthday attack on SHA-3.

**Answer:** C
**Explanation:** Pass-the-hash: Replaying a stolen password hash/NT hash as if it were the credential, without knowing the password.

### Q09  ·  Easy
**Question:** Which option best describes **Pepper**?

- **A.** A username-colored avatar.
- **B.** A CRC polynomial.
- **C.** A secret site-wide value stored apart from the hash database (HSM/config) and mixed into password hashes.
- **D.** A public username.

**Answer:** C
**Explanation:** Pepper: A secret site-wide value stored apart from the hash database (HSM/config) and mixed into password hashes.

### Q10  ·  Easy
**Question:** Which option best describes **Replay attack**?

- **A.** Capturing a valid authentication transcript and resending it to impersonate a party.
- **B.** Factoring RSA.
- **C.** A birthday collision.
- **D.** A frequency analysis of Caesar.

**Answer:** A
**Explanation:** Replay attack: Capturing a valid authentication transcript and resending it to impersonate a party.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **replay-resistant RFID design (logical)**?

- **A.** XOR the UID with the date as a public Caesar
- **B.** Transmit a static UID and trust it
- **C.** Include a changing challenge or rotating token → authenticate with a keyed MAC → reject repeats within the window
- **D.** Cache the first successful tap forever as open

**Answer:** C
**Explanation:** Correct sequence for replay-resistant RFID design (logical): Include a changing challenge or rotating token → authenticate with a keyed MAC → reject repeats within the window

### Q12  ·  Easy
**Question:** Which sequence correctly describes **salted password enrolment**?

- **A.** Generate unique salt → KDF(password, salt, cost) → store (user, salt, hash, params) → never store the password
- **B.** Email the password to the DBA
- **C.** Hash without salt using MD5 once
- **D.** Store password plaintext ‘for support’

**Answer:** A
**Explanation:** Correct sequence for salted password enrolment: Generate unique salt → KDF(password, salt, cost) → store (user, salt, hash, params) → never store the password

### Q13  ·  Intermediate
**Question:** An attacker records a valid hostel RFID tap and plays it at the door next week. The missing property is:

- **A.** Collision resistance of SHA-3 only
- **B.** Enigma stepping
- **C.** Freshness (replay protection)
- **D.** Kerckhoffs

**Answer:** C
**Explanation:** Replay of a static authenticator.

### Q14  ·  Intermediate
**Question:** Challenge-response authenticates by:

- **A.** Sending the password in Base64
- **B.** Replaying a recorded success packet
- **C.** Hashing the SSID
- **D.** Proving knowledge of a secret without sending the secret itself, using a fresh challenge

**Answer:** D
**Explanation:** CR definition.

### Q15  ·  Intermediate
**Question:** Exam seating app accepts a bearer token in the URL and logs it in Apache logs. Risk:

- **A.** Strong binding to TPM automatically
- **B.** ZK proof
- **C.** Token theft via logs/Referer; session hijack
- **D.** OTP perfect secrecy

**Answer:** C
**Explanation:** Bearer tokens leak.

### Q16  ·  Intermediate
**Question:** Login uses SELECT * FROM users WHERE user='x' AND hash=SHA1(pass) with no salt. Stolen DB enables:

- **A.** Offline dictionary/GPU cracking and cross-user identical-hash detection
- **B.** Only online rate-limited guesses
- **C.** Perfect ZK
- **D.** Mutual TLS

**Answer:** A
**Explanation:** Unsalted fast hashes.

### Q17  ·  Intermediate
**Question:** Mutual authentication in TLS typically means:

- **A.** Caesar of the SNI
- **B.** No certificates
- **C.** The server presents a certificate and the client also proves identity (password/mTLS)
- **D.** Only the user sends a password to any site with a lock icon drawn in CSS

**Answer:** C
**Explanation:** Both directions.

### Q18  ·  Intermediate
**Question:** Offline password guessing requires:

- **A.** A CA private key always
- **B.** Enigma cribs
- **C.** The live login page only
- **D.** A stolen hash/verifier (or encrypted material) that can be tested locally

**Answer:** D
**Explanation:** Stolen verifier.

### Q19  ·  Intermediate
**Question:** Phishing site looks like ERP and collects passwords. MFA with a phone push bound to the real origin helps because:

- **A.** The password becomes 128-bit
- **B.** HTTP is enough
- **C.** Kerckhoffs fails
- **D.** Possession factor is not typed into the fake page (if well bound)

**Answer:** D
**Explanation:** Second factor / binding.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **OTP (one-time password)** and **static password**?

- **A.** Static passwords are single-use.
- **B.** OTPs never need clock/counter sync (TOTP/HOTP).
- **C.** They are both OTPs in the Shannon sense.
- **D.** OTPs expire or are single-use, limiting replay; static passwords remain valid until changed.

**Answer:** D
**Explanation:** OTPs expire or are single-use, limiting replay; static passwords remain valid until changed.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **entity authentication** and **message authentication (MAC)**?

- **A.** Entity auth proves who is present now; a MAC proves a message was produced by a key holder, not necessarily liveness.
- **B.** MACs always prevent replay without nonces.
- **C.** Entity auth is only SHA-256 of a file.
- **D.** They are the same as encryption.

**Answer:** A
**Explanation:** Entity auth proves who is present now; a MAC proves a message was produced by a key holder, not necessarily liveness.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **salt** and **nonce**?

- **A.** They are both RSA private keys.
- **B.** A salt is stored with a password hash to uniquify it; a nonce freshens a protocol/AEAD message.
- **C.** A salt must be secret like a pepper.
- **D.** A nonce is stored in the user table instead of the hash.

**Answer:** B
**Explanation:** A salt is stored with a password hash to uniquify it; a nonce freshens a protocol/AEAD message.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **timestamp** and **random nonce**?

- **A.** Random nonces require NTP.
- **B.** Timestamps need clocks and windows; random nonces need state/cache or inclusion in a signed response, not clock sync.
- **C.** They are identical freshness gadgets.
- **D.** Timestamps never need a replay cache.

**Answer:** B
**Explanation:** Timestamps need clocks and windows; random nonces need state/cache or inclusion in a signed response, not clock sync.

### Q24  ·  Intermediate
**Question:** Which option best describes **Challenge-response**?

- **A.** The verifier sends a fresh challenge; the prover returns f(secret, challenge), proving knowledge without sending the secret itself.
- **B.** Replaying yesterday’s successful response.
- **C.** Hashing the username only.
- **D.** Sending the password in plaintext each time.

**Answer:** A
**Explanation:** Challenge-response: The verifier sends a fresh challenge; the prover returns f(secret, challenge), proving knowledge without sending the secret itself.

### Q25  ·  Intermediate
**Question:** Which option best describes **Dictionary attack**?

- **A.** Trying high-probability passwords (wordlists, mangling) rather than the full key space.
- **B.** Factoring n.
- **C.** A collision search on SHA-256 certificates.
- **D.** A rail-fence cipher.

**Answer:** A
**Explanation:** Dictionary attack: Trying high-probability passwords (wordlists, mangling) rather than the full key space.

### Q26  ·  Intermediate
**Question:** Which option best describes **Freshness**?

- **A.** Kerckhoffs’ algorithm list.
- **B.** Evidence that a protocol message is recent and not a replay (nonces, timestamps, counters).
- **C.** Storing passwords in plaintext.
- **D.** A static API key reused for a year without binding to a request.

**Answer:** B
**Explanation:** Freshness: Evidence that a protocol message is recent and not a replay (nonces, timestamps, counters).

### Q27  ·  Intermediate
**Question:** Which option best describes **Multi-factor authentication**?

- **A.** A longer Caesar key.
- **B.** The same OTP SMS printed on the ID card permanently.
- **C.** Combining independent factors (knowledge, possession, inherence) so stealing one is not enough.
- **D.** Two passwords typed twice.

**Answer:** C
**Explanation:** Multi-factor authentication: Combining independent factors (knowledge, possession, inherence) so stealing one is not enough.

### Q28  ·  Intermediate
**Question:** Which option best describes **Mutual authentication**?

- **A.** A one-way hash of the logo.
- **B.** Both parties authenticate each other (client proves identity and server proves it is the real server).
- **C.** Availability ping.
- **D.** Only the user types a password into any page that looks like ERP.

**Answer:** B
**Explanation:** Mutual authentication: Both parties authenticate each other (client proves identity and server proves it is the real server).

### Q29  ·  Intermediate
**Question:** Which option best describes **Password**?

- **A.** An X.509 private key.
- **B.** A 256-bit AES session key stored in an HSM as the user’s only memory.
- **C.** A one-time pad.
- **D.** A memorized secret used to authenticate a user; must be stored as a salted slow hash, never in plaintext.

**Answer:** D
**Explanation:** Password: A memorized secret used to authenticate a user; must be stored as a salted slow hash, never in plaintext.

### Q30  ·  Intermediate
**Question:** Which option best describes **Randomness (crypto)**?

- **A.** A Caesar shift.
- **B.** Unpredictable bits for nonces, keys and challenges; poor RNGs enable replay and key recovery.
- **C.** The public AES S-box.
- **D.** A repeating 0000 counter advertised as a nonce.

**Answer:** B
**Explanation:** Randomness (crypto): Unpredictable bits for nonces, keys and challenges; poor RNGs enable replay and key recovery.

### Q31  ·  Intermediate
**Question:** Which option best describes **Salt**?

- **A.** The HMAC key of the web server.
- **B.** A public RSA exponent.
- **C.** A per-user random value mixed into password hashing so equal passwords do not hash equal and rainbow tables fail.
- **D.** An IV that must remain secret forever like a key.

**Answer:** C
**Explanation:** Salt: A per-user random value mixed into password hashing so equal passwords do not hash equal and rainbow tables fail.

### Q32  ·  Intermediate
**Question:** Which option best describes **Session binding**?

- **A.** Disabling HTTPS after login.
- **B.** Using a 4-digit PIN as a permanent bearer token in GET URLs.
- **C.** Printing the token on a notice board.
- **D.** Binding a session token to context (TLS channel, IP cautiously, expiry, rotation) to reduce theft usefulness.

**Answer:** D
**Explanation:** Session binding: Binding a session token to context (TLS channel, IP cautiously, expiry, rotation) to reduce theft usefulness.

### Q33  ·  Intermediate
**Question:** Which option best describes **Timestamp freshness**?

- **A.** Enigma rotors.
- **B.** Using clocks so messages older than a window are rejected; needs synchronized time and a replay cache within the window.
- **C.** A static MAC key.
- **D.** A random nonce with no clock.

**Answer:** B
**Explanation:** Timestamp freshness: Using clocks so messages older than a window are rejected; needs synchronized time and a replay cache within the window.

### Q34  ·  Intermediate
**Question:** Which option best describes **Token (auth)**?

- **A.** A later-presented credential (session cookie, bearer token, smart-card output) obtained after primary authentication.
- **B.** A WAL record.
- **C.** The TLS cipher suite name.
- **D.** A Caesar ciphertext of the homepage.

**Answer:** A
**Explanation:** Token (auth): A later-presented credential (session cookie, bearer token, smart-card output) obtained after primary authentication.

### Q35  ·  Intermediate
**Question:** Which option best describes **Zero-knowledge proof (intuition)**?

- **A.** Sending the password hash over HTTP.
- **B.** Proving a statement (for example, knowledge of a secret) without revealing the secret itself, beyond the validity of the statement.
- **C.** OTP reuse.
- **D.** Emailing the private key to the verifier.

**Answer:** B
**Explanation:** Zero-knowledge proof (intuition): Proving a statement (for example, knowledge of a secret) without revealing the secret itself, beyond the validity of the statement.

### Q36  ·  Intermediate
**Question:** Which sequence correctly describes **MFA enrolment**?

- **A.** Disable the password after MFA and put the TOTP seed in Git
- **B.** Register password (KDF) → register second factor (TOTP secret or WebAuthn) → at login verify both → recover via a controlled break-glass process
- **C.** Print TOTP secrets on ID cards
- **D.** Ask the same password in two form fields

**Answer:** B
**Explanation:** Correct sequence for MFA enrolment: Register password (KDF) → register second factor (TOTP secret or WebAuthn) → at login verify both → recover via a controlled break-glass process

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **challenge-response login (HMAC)**?

- **A.** Client sends password every time → server compares in clear
- **B.** Reuse nonce=1 forever
- **C.** Server sends fresh nonce → client computes HMAC(key, nonce) → server verifies and records nonce used
- **D.** Client sends HMAC of an empty string only

**Answer:** C
**Explanation:** Correct sequence for challenge-response login (HMAC): Server sends fresh nonce → client computes HMAC(key, nonce) → server verifies and records nonce used

### Q38  ·  Intermediate
**Question:** Which statement about **Challenge-response** is FALSE?

- **A.** Challenge-response is secure if the challenge never changes (constant 42).
- **B.** In this module, Challenge-response is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Challenge-response is that it is not the same as “Sending the password in plaintext each time”.
- **D.** Challenge-response is correctly understood as: the verifier sends a fresh challenge; the prover returns f(secret, challenge), proving knowledge without sending the secret itself.

**Answer:** A
**Explanation:** The false claim is: Challenge-response is secure if the challenge never changes (constant 42).. Challenge-response actually means: The verifier sends a fresh challenge; the prover returns f(secret, challenge), proving knowledge without sending the secret itself.

### Q39  ·  Intermediate
**Question:** Which statement about **Dictionary attack** is FALSE?

- **A.** Dictionary attacks cannot succeed if users pick ‘password’ because it is English.
- **B.** Dictionary attack is correctly understood as: trying high-probability passwords (wordlists, mangling) rather than the full key space.
- **C.** A useful way to remember Dictionary attack is that it is not the same as “Factoring n”.
- **D.** In this module, Dictionary attack is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Dictionary attacks cannot succeed if users pick ‘password’ because it is English.. Dictionary attack actually means: Trying high-probability passwords (wordlists, mangling) rather than the full key space.

### Q40  ·  Intermediate
**Question:** Which statement about **Entity authentication** is FALSE?

- **A.** Entity authentication is identical to encrypting a message for confidentiality.
- **B.** In this module, Entity authentication is a core idea students must distinguish from nearby terms.
- **C.** Entity authentication is correctly understood as: verifying that a communicating party is who they claim to be, in real time (liveness), not only that a file is unmodified.
- **D.** A useful way to remember Entity authentication is that it is not the same as “Encrypting a hard disk at rest only”.

**Answer:** A
**Explanation:** The false claim is: Entity authentication is identical to encrypting a message for confidentiality.. Entity authentication actually means: Verifying that a communicating party is who they claim to be, in real time (liveness), not only that a file is unmodified.

### Q41  ·  Intermediate
**Question:** Which statement about **Freshness** is FALSE?

- **A.** In this module, Freshness is a core idea students must distinguish from nearby terms.
- **B.** Freshness is correctly understood as: evidence that a protocol message is recent and not a replay (nonces, timestamps, counters).
- **C.** Freshness is guaranteed by using the same challenge in every login forever.
- **D.** A useful way to remember Freshness is that it is not the same as “Storing passwords in plaintext”.

**Answer:** C
**Explanation:** The false claim is: Freshness is guaranteed by using the same challenge in every login forever.. Freshness actually means: Evidence that a protocol message is recent and not a replay (nonces, timestamps, counters).

### Q42  ·  Intermediate
**Question:** Which statement about **Mutual authentication** is FALSE?

- **A.** Mutual authentication is correctly understood as: both parties authenticate each other (client proves identity and server proves it is the real server).
- **B.** A useful way to remember Mutual authentication is that it is not the same as “Only the user types a password into any page that looks like ERP”.
- **C.** In this module, Mutual authentication is a core idea students must distinguish from nearby terms.
- **D.** Mutual authentication is complete if the user authenticates and the server never proves anything (phishing still works).

**Answer:** D
**Explanation:** The false claim is: Mutual authentication is complete if the user authenticates and the server never proves anything (phishing still works).. Mutual authentication actually means: Both parties authenticate each other (client proves identity and server proves it is the real server).

### Q43  ·  Intermediate
**Question:** Which statement about **Pass-the-hash** is FALSE?

- **A.** A useful way to remember Pass-the-hash is that it is not the same as “A birthday attack on SHA-3”.
- **B.** In this module, Pass-the-hash is a core idea students must distinguish from nearby terms.
- **C.** Pass-the-hash is correctly understood as: replaying a stolen password hash/NT hash as if it were the credential, without knowing the password.
- **D.** Pass-the-hash is impossible if the protocol accepts raw hashes as authenticators.

**Answer:** D
**Explanation:** The false claim is: Pass-the-hash is impossible if the protocol accepts raw hashes as authenticators.. Pass-the-hash actually means: Replaying a stolen password hash/NT hash as if it were the credential, without knowing the password.

### Q44  ·  Intermediate
**Question:** Which statement about **Password** is FALSE?

- **A.** Storing unsalted SHA-1(password) is best practice for a campus LDAP.
- **B.** Password is correctly understood as: a memorized secret used to authenticate a user; must be stored as a salted slow hash, never in plaintext.
- **C.** In this module, Password is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember Password is that it is not the same as “A 256-bit AES session key stored in an HSM as the user’s only memory”.

**Answer:** A
**Explanation:** The false claim is: Storing unsalted SHA-1(password) is best practice for a campus LDAP.. Password actually means: A memorized secret used to authenticate a user; must be stored as a salted slow hash, never in plaintext.

### Q45  ·  Intermediate
**Question:** Which statement about **Pepper** is FALSE?

- **A.** In this module, Pepper is a core idea students must distinguish from nearby terms.
- **B.** A pepper is stored in the same leaked SQL table as the hashes, by definition.
- **C.** A useful way to remember Pepper is that it is not the same as “A public username”.
- **D.** Pepper is correctly understood as: a secret site-wide value stored apart from the hash database (HSM/config) and mixed into password hashes.

**Answer:** B
**Explanation:** The false claim is: A pepper is stored in the same leaked SQL table as the hashes, by definition.. Pepper actually means: A secret site-wide value stored apart from the hash database (HSM/config) and mixed into password hashes.

### Q46  ·  Intermediate
**Question:** Which statement about **Timestamp freshness** is FALSE?

- **A.** Timestamps remove all need for replay caches even with a ±1 day window and attacker-controlled clocks.
- **B.** In this module, Timestamp freshness is a core idea students must distinguish from nearby terms.
- **C.** Timestamp freshness is correctly understood as: using clocks so messages older than a window are rejected; needs synchronized time and a replay cache within the window.
- **D.** A useful way to remember Timestamp freshness is that it is not the same as “A random nonce with no clock”.

**Answer:** A
**Explanation:** The false claim is: Timestamps remove all need for replay caches even with a ±1 day window and attacker-controlled clocks.. Timestamp freshness actually means: Using clocks so messages older than a window are rejected; needs synchronized time and a replay cache within the window.

### Q47  ·  Intermediate
**Question:** Zero-knowledge authentication’s teaching goal is:

- **A.** The verifier learns nothing reusable about the secret beyond ‘yes, this run succeeded’
- **B.** To replace TLS record encryption
- **C.** To email the PIN to the helpdesk
- **D.** To reuse OTPs

**Answer:** A
**Explanation:** ZK intuition.

### Q48  ·  Difficult
**Question:** A poorly designed CR that returns H(password||challenge) with a fast hash and no rate limit still fails because:

- **A.** Offline or parallel guessing if transcripts leak, and phishing of challenges; use a slow KDF/PAKE/WebAuthn
- **B.** Kerckhoffs forbids CR
- **C.** Nonces must be passwords
- **D.** Hashes cannot include challenges

**Answer:** A
**Explanation:** Fast hashes + leaked transcripts ≈ offline attack.

### Q49  ·  Difficult
**Question:** Ali Baba cave story in class maps to:

- **A.** Sending the password twice
- **B.** Zero-knowledge: prove knowledge of the secret without showing it to the verifier in the clear
- **C.** Caesar of the cave map
- **D.** A replay of yesterday’s walk without random challenge

**Answer:** B
**Explanation:** Classic ZK intuition; still need sound challenges.

### Q50  ·  Difficult
**Question:** HOTP counter stored as 64-bit. If the attacker does not know the HMAC key, brute-forcing a 6-digit code in one try succeeds with chance:

- **A.** 1/64
- **B.** 10^{-6}
- **C.** 2^{-64}
- **D.** 1/2

**Answer:** B
**Explanation:** A 6-digit OTP has 10^6 values if uniformly generated.

### Q51  ·  Difficult
**Question:** PIN of 4 decimal digits, no lockout. Worst-case online guesses?

- **A.** 16
- **B.** 10,000
- **C.** 10^6
- **D.** 4

**Answer:** B
**Explanation:** 10^4 combinations.

### Q52  ·  Difficult
**Question:** Password length 8 from 62-char alphabet, uniform. Key space?

- **A.** 8^62
- **B.** 256
- **C.** 62^8 ≈ 2.18×10^14
- **D.** 62×8

**Answer:** C
**Explanation:** 62^8.

### Q53  ·  Difficult
**Question:** Rate limit 5 password tries / 15 min / account. Tries per day per account?

- **A.** 480
- **B.** 96
- **C.** 5
- **D.** 15

**Answer:** A
**Explanation:** 24×4×5 = 480 (four 15-min blocks per hour). 96 fifteen-minute windows × 5 = 480.

### Q54  ·  Difficult
**Question:** Salt 16 bytes unique per user, 10,000 users. Rainbow table reuse across users?

- **A.** One table still cracks all instantly
- **B.** Salts reduce SHA-256 to 16 bits
- **C.** Salts replace the password
- **D.** A precomputed table for unsalted hashes does not apply per user; each salt needs its own table

**Answer:** D
**Explanation:** Unique salts defeat global rainbows.

### Q55  ·  Difficult
**Question:** Server stores bcrypt(password, salt) and a pepper in an HSM. A SQL dump alone:

- **A.** Yields all passwords in plaintext
- **B.** Reveals the CA root key
- **C.** Breaks TLS
- **D.** Is insufficient to verify guesses without the pepper (or much harder)

**Answer:** D
**Explanation:** Pepper not in the DB.

### Q56  ·  Difficult
**Question:** TOTP step 30 s, accept ±1 step. How long is a captured code valid at the server (window)?

- **A.** 30 hours
- **B.** 1 second always
- **C.** Until password reset only
- **D.** About 90 seconds (±1 step around now)

**Answer:** D
**Explanation:** 3×30 s window is common.

### Q57  ·  Difficult
**Question:** VVIET ERP still sends passwords in HTTP Basic on the campus LAN. Primary risk:

- **A.** Birthday attack on TLS certificates
- **B.** OTP pad reuse of AES
- **C.** Sniffing and replay of the password
- **D.** Frequency analysis of HTML tags

**Answer:** C
**Explanation:** Plaintext passwords on the wire.

### Q58  ·  Difficult
**Question:** What is the most important distinction between **challenge-response** and **send-the-password**?

- **A.** CR is weaker on an open LAN always.
- **B.** CR proves knowledge of a secret without putting the password on the wire each time; sending the password exposes it to sniffing/phishing of that run.
- **C.** Sending passwords is replay-proof.
- **D.** They both need no freshness.

**Answer:** B
**Explanation:** CR proves knowledge of a secret without putting the password on the wire each time; sending the password exposes it to sniffing/phishing of that run.

### Q59  ·  Difficult
**Question:** What is the most important distinction between **online guessing** and **offline guessing**?

- **A.** They have the same cost always.
- **B.** Rate limits stop stolen-hash GPU attacks.
- **C.** Online is throttled by the server; offline uses a stolen verifier at full speed.
- **D.** Salts stop online attacks only.

**Answer:** C
**Explanation:** Online is throttled by the server; offline uses a stolen verifier at full speed.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **password** and **cryptographic key**?

- **A.** Passwords are human-memorable and low entropy; keys should be uniform high-entropy bits in a KDF/HSM.
- **B.** They should be stored the same way (plaintext).
- **C.** Passwords have 128 bits always.
- **D.** Keys are 8-letter English words.

**Answer:** A
**Explanation:** Passwords are human-memorable and low entropy; keys should be uniform high-entropy bits in a KDF/HSM.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **zero knowledge** and **challenge-response with a shared password hash**?

- **A.** ZK requires sending the secret.
- **B.** ZK aims to reveal nothing beyond validity; simple CR may leak information or still use a shared secret the server stores.
- **C.** Simple HTTP Basic is ZK.
- **D.** They are both Caesar logins.

**Answer:** B
**Explanation:** ZK aims to reveal nothing beyond validity; simple CR may leak information or still use a shared secret the server stores.

### Q62  ·  Difficult
**Question:** Which statement about **Multi-factor authentication** is FALSE?

- **A.** A useful way to remember Multi-factor authentication is that it is not the same as “Two passwords typed twice”.
- **B.** In this module, Multi-factor authentication is a core idea students must distinguish from nearby terms.
- **C.** MFA is achieved by asking the password twice on the same keyboard.
- **D.** Multi-factor authentication is correctly understood as: combining independent factors (knowledge, possession, inherence) so stealing one is not enough.

**Answer:** C
**Explanation:** The false claim is: MFA is achieved by asking the password twice on the same keyboard.. Multi-factor authentication actually means: Combining independent factors (knowledge, possession, inherence) so stealing one is not enough.

### Q63  ·  Difficult
**Question:** Which statement about **Nonce** is FALSE?

- **A.** Reusing the same nonce with the same key in many AEAD schemes is harmless.
- **B.** A useful way to remember Nonce is that it is not the same as “A password stored in the database”.
- **C.** Nonce is correctly understood as: a number used once (random or a counter) to bind a protocol run and prevent replay.
- **D.** In this module, Nonce is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Reusing the same nonce with the same key in many AEAD schemes is harmless.. Nonce actually means: A number used once (random or a counter) to bind a protocol run and prevent replay.

### Q64  ·  Difficult
**Question:** Which statement about **Online vs offline guessing** is FALSE?

- **A.** Online vs offline guessing is correctly understood as: online: each try hits the verifier (rate-limitable). Offline: attacker has a hash/verifier and tries locally at GPU speed.
- **B.** In this module, Online vs offline guessing is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Online vs offline guessing is that it is not the same as “Offline attacks cannot use GPUs”.
- **D.** Salting without a slow KDF stops offline GPU guessing completely.

**Answer:** D
**Explanation:** The false claim is: Salting without a slow KDF stops offline GPU guessing completely.. Online vs offline guessing actually means: Online: each try hits the verifier (rate-limitable). Offline: attacker has a hash/verifier and tries locally at GPU speed.

### Q65  ·  Difficult
**Question:** Which statement about **Randomness (crypto)** is FALSE?

- **A.** In this module, Randomness (crypto) is a core idea students must distinguish from nearby terms.
- **B.** Randomness (crypto) is correctly understood as: unpredictable bits for nonces, keys and challenges; poor RNGs enable replay and key recovery.
- **C.** A useful way to remember Randomness (crypto) is that it is not the same as “A repeating 0000 counter advertised as a nonce”.
- **D.** A timestamp that an attacker can predict is a perfect cryptographic nonce.

**Answer:** D
**Explanation:** The false claim is: A timestamp that an attacker can predict is a perfect cryptographic nonce.. Randomness (crypto) actually means: Unpredictable bits for nonces, keys and challenges; poor RNGs enable replay and key recovery.

### Q66  ·  Difficult
**Question:** Which statement about **Replay attack** is FALSE?

- **A.** Replay attack is correctly understood as: capturing a valid authentication transcript and resending it to impersonate a party.
- **B.** Replay cannot work if the protocol uses no freshness, because old messages are always rejected.
- **C.** A useful way to remember Replay attack is that it is not the same as “Factoring RSA”.
- **D.** In this module, Replay attack is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Replay cannot work if the protocol uses no freshness, because old messages are always rejected.. Replay attack actually means: Capturing a valid authentication transcript and resending it to impersonate a party.

### Q67  ·  Difficult
**Question:** Which statement about **Salt** is FALSE?

- **A.** Salt is correctly understood as: a per-user random value mixed into password hashing so equal passwords do not hash equal and rainbow tables fail.
- **B.** In this module, Salt is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Salt is that it is not the same as “The HMAC key of the web server”.
- **D.** A global salt shared by all users is as good as a unique per-user salt against intra-database duplicates.

**Answer:** D
**Explanation:** The false claim is: A global salt shared by all users is as good as a unique per-user salt against intra-database duplicates.. Salt actually means: A per-user random value mixed into password hashing so equal passwords do not hash equal and rainbow tables fail.

### Q68  ·  Difficult
**Question:** Which statement about **Session binding** is FALSE?

- **A.** Once a cookie is set without Secure/HttpOnly flags, session binding is complete.
- **B.** Session binding is correctly understood as: binding a session token to context (TLS channel, IP cautiously, expiry, rotation) to reduce theft usefulness.
- **C.** A useful way to remember Session binding is that it is not the same as “Printing the token on a notice board”.
- **D.** In this module, Session binding is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Once a cookie is set without Secure/HttpOnly flags, session binding is complete.. Session binding actually means: Binding a session token to context (TLS channel, IP cautiously, expiry, rotation) to reduce theft usefulness.

### Q69  ·  Difficult
**Question:** Which statement about **Token (auth)** is FALSE?

- **A.** Token (auth) is correctly understood as: a later-presented credential (session cookie, bearer token, smart-card output) obtained after primary authentication.
- **B.** A useful way to remember Token (auth) is that it is not the same as “A Caesar ciphertext of the homepage”.
- **C.** In this module, Token (auth) is a core idea students must distinguish from nearby terms.
- **D.** A bearer token in a URL is always bound to the client’s TPM and cannot be stolen.

**Answer:** D
**Explanation:** The false claim is: A bearer token in a URL is always bound to the client’s TPM and cannot be stolen.. Token (auth) actually means: A later-presented credential (session cookie, bearer token, smart-card output) obtained after primary authentication.

### Q70  ·  Difficult
**Question:** Which statement about **Zero-knowledge proof (intuition)** is FALSE?

- **A.** In this module, Zero-knowledge proof (intuition) is a core idea students must distinguish from nearby terms.
- **B.** A ZK login still sends the password to the server in plaintext ‘just in case’.
- **C.** A useful way to remember Zero-knowledge proof (intuition) is that it is not the same as “Emailing the private key to the verifier”.
- **D.** Zero-knowledge proof (intuition) is correctly understood as: proving a statement (for example, knowledge of a secret) without revealing the secret itself, beyond the validity of the statement.

**Answer:** B
**Explanation:** The false claim is: A ZK login still sends the password to the server in plaintext ‘just in case’.. Zero-knowledge proof (intuition) actually means: Proving a statement (for example, knowledge of a secret) without revealing the secret itself, beyond the validity of the statement.

### Q71  ·  Difficult
**Question:** Why do timestamps alone not give a complete replay defence?

- **A.** NTP is illegal on campus
- **B.** Within the acceptance window, and if clocks can be skewed, replays can succeed unless a nonce cache or unique IDs are kept
- **C.** Timestamps make Kerckhoffs false
- **D.** Hashes cannot include time

**Answer:** B
**Explanation:** Window + clock attacks.

### Q72  ·  Difficult
**Question:** Wi-Fi captive portal challenges with a random nonce each time; laptop proves HMAC(key, nonce). This is:

- **A.** Hash-then-sign by a CA
- **B.** Transposition of SSID
- **C.** Challenge-response entity authentication
- **D.** A one-time pad of the webpage

**Answer:** C
**Explanation:** CR protocol.

---

## Quick answer key

Q01–A | Q02–A | Q03–B | Q04–B | Q05–C | Q06–C | Q07–A | Q08–C | Q09–C | Q10–A | Q11–C | Q12–A | Q13–C | Q14–D | Q15–C | Q16–A | Q17–C | Q18–D | Q19–D | Q20–D | Q21–A | Q22–B | Q23–B | Q24–A | Q25–A | Q26–B | Q27–C | Q28–B | Q29–D | Q30–B | Q31–C | Q32–D | Q33–B | Q34–A | Q35–B | Q36–B | Q37–C | Q38–A | Q39–A | Q40–A | Q41–C | Q42–D | Q43–D | Q44–A | Q45–B | Q46–A | Q47–A | Q48–A | Q49–B | Q50–B | Q51–B | Q52–C | Q53–A | Q54–D | Q55–D | Q56–D | Q57–C | Q58–B | Q59–C | Q60–A | Q61–B | Q62–C | Q63–A | Q64–D | Q65–D | Q66–B | Q67–D | Q68–A | Q69–D | Q70–B | Q71–B | Q72–C
