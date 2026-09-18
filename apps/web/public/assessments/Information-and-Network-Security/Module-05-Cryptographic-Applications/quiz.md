# Quiz — Information and Network Security — Module 5: Cryptographic Applications

**Subject:** Information and Network Security  
**Module:** Module 5 — Cryptographic Applications  
**Questions:** 72  
**Mix:** 12 Easy · 35 Intermediate · 25 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** HSTS helps against:

- **A.** Caesar ciphers
- **B.** SSL-stripping / forcing HTTP on a later visit (within max-age)
- **C.** Weak WPA-PSK
- **D.** SIM swapping only

**Answer:** B
**Explanation:** Force HTTPS.

### Q02  ·  Easy
**Question:** SSL was replaced in practice by:

- **A.** TLS (currently TLS 1.2/1.3 in modern deployments)
- **B.** A5/1
- **C.** Caesar
- **D.** WEP

**Answer:** A
**Explanation:** TLS is the successor name in use.

### Q03  ·  Easy
**Question:** The GSM secret Ki lives in:

- **A.** Every SMS
- **B.** The SIM/AuC, not in clear on the air as a password
- **C.** The App Store
- **D.** The WPA poster

**Answer:** B
**Explanation:** SIM key.

### Q04  ·  Easy
**Question:** WPA was introduced mainly to replace:

- **A.** WEP’s broken 802.11 encryption/authentication
- **B.** Shamir sharing
- **C.** HMAC
- **D.** X.509

**Answer:** A
**Explanation:** WLAN history.

### Q05  ·  Easy
**Question:** Which option best describes **Broadcast encryption**?

- **A.** A unicast OTP to one student.
- **B.** TLS to a single browser tab.
- **C.** Encrypting content so only authorized receivers (subset of subscribers) can decrypt, often with key-tree/subset-cover schemes for pay-TV.
- **D.** Caesar of the EPG.

**Answer:** C
**Explanation:** Broadcast encryption: Encrypting content so only authorized receivers (subset of subscribers) can decrypt, often with key-tree/subset-cover schemes for pay-TV.

### Q06  ·  Easy
**Question:** Which option best describes **Certificate pinning (apps)**?

- **A.** Using HTTP hashes only.
- **B.** Disabling TLS.
- **C.** An app restricts which CAs/keys it accepts for a host, reducing rogue-CA or mis-issuance risk, at the cost of operational rigidity.
- **D.** Trusting every CA in the device store without constraint.

**Answer:** C
**Explanation:** Certificate pinning (apps): An app restricts which CAs/keys it accepts for a host, reducing rogue-CA or mis-issuance risk, at the cost of operational rigidity.

### Q07  ·  Easy
**Question:** Which option best describes **End-to-end encryption (E2EE)**?

- **A.** Only endpoints can read payloads; relays (college mail gateway, chat server) cannot decrypt content.
- **B.** WPA on the AP.
- **C.** TLS only to the college proxy that inspects HTTPS.
- **D.** Disk encryption of the server.

**Answer:** A
**Explanation:** End-to-end encryption (E2EE): Only endpoints can read payloads; relays (college mail gateway, chat server) cannot decrypt content.

### Q08  ·  Easy
**Question:** Which option best describes **GSM authentication (SIM)**?

- **A.** TLS 1.3 to the tower with a public CA.
- **B.** WPA3-SAE.
- **C.** The SIM and AuC share a key; a challenge-response (A3/A8 family) proves the SIM and derives a session key for air encryption (A5 historically).
- **D.** The handset sends the IMSI password in clear every call as the only method.

**Answer:** C
**Explanation:** GSM authentication (SIM): The SIM and AuC share a key; a challenge-response (A3/A8 family) proves the SIM and derives a session key for air encryption (A5 historically).

### Q09  ·  Easy
**Question:** Which option best describes **TLS (SSL successor)**?

- **A.** A WPA-PSK poster.
- **B.** A cipher that replaces IP routing.
- **C.** A protocol providing confidentiality, integrity and authentication for TCP applications via a handshake (keys, certs) and a record layer (AEAD).
- **D.** A hash of HTML only.

**Answer:** C
**Explanation:** TLS (SSL successor): A protocol providing confidentiality, integrity and authentication for TCP applications via a handshake (keys, certs) and a record layer (AEAD).

### Q10  ·  Easy
**Question:** Which option best describes **WPA (WLAN security)**?

- **A.** Wi-Fi Protected Access: authenticates stations and encrypts 802.11 frames (WPA2-PSK/Enterprise, WPA3 improvements) replacing broken WEP.
- **B.** An X.509 email protocol.
- **C.** A hash of the SSID only, with open data frames.
- **D.** GSM A5/1 by another name.

**Answer:** A
**Explanation:** WPA (WLAN security): Wi-Fi Protected Access: authenticates stations and encrypts 802.11 frames (WPA2-PSK/Enterprise, WPA3 improvements) replacing broken WEP.

### Q11  ·  Easy
**Question:** Which sequence correctly describes **GSM SIM auth (simplified)**?

- **A.** Skip RAND and reuse last week’s Kc without auth
- **B.** Phone sends Ki to the tower
- **C.** Network sends RAND → SIM computes SRES and Kc from Ki → SRES compared at AuC → air cipher with Kc
- **D.** Tower sends Ki to the phone

**Answer:** C
**Explanation:** Correct sequence for GSM SIM auth (simplified): Network sends RAND → SIM computes SRES and Kc from Ki → SRES compared at AuC → air cipher with Kc

### Q12  ·  Easy
**Question:** Which sequence correctly describes **TLS 1.3 connection (teaching sequence)**?

- **A.** TCP → ClientHello (key share) → ServerHello + cert + finished → client finished → AEAD application data
- **B.** Skip certificates if the café is trusted
- **C.** Reuse RC4 state from last week
- **D.** Send password first in HTTP → then maybe encrypt

**Answer:** A
**Explanation:** Correct sequence for TLS 1.3 connection (teaching sequence): TCP → ClientHello (key share) → ServerHello + cert + finished → client finished → AEAD application data

### Q13  ·  Intermediate
**Question:** A fake campus AP named ‘VVIET-Student’ captures portal passwords. Which Wi-Fi mode plus server auth reduces this?

- **A.** WPA-Enterprise with a validated RADIUS/IdP certificate (and user education)
- **B.** Open Wi-Fi with a splash page only
- **C.** WEP
- **D.** A longer poster PSK of 8 letters

**Answer:** A
**Explanation:** Mutual/server authentication in EAP.

### Q14  ·  Intermediate
**Question:** A hostel IP camera uses default password and RTSP open to WAN. This violates:

- **A.** Kerckhoffs by using H.264
- **B.** Hash-then-sign of the SSID
- **C.** Basic key/password hygiene and authenticated access for home/IoT security
- **D.** UKPT for video

**Answer:** C
**Explanation:** IoT defaults.

### Q15  ·  Intermediate
**Question:** An eID card that silently answers identity without a PIN is risky because of:

- **A.** Skimming / unauthenticated attribute release
- **B.** UKPT
- **C.** Kerckhoffs
- **D.** TLS version intolerance only

**Answer:** A
**Explanation:** Contactless privacy.

### Q16  ·  Intermediate
**Question:** Cloning a mag-stripe is easy; cloning a well-implemented EMV chip to pass online ARQC is:

- **A.** Identical if you photograph the chip
- **B.** Equivalent to WPA-PSK
- **C.** Solved by knowing the PAN only
- **D.** Not the same problem — dynamic cryptograms bind the transaction

**Answer:** D
**Explanation:** EMV dynamics.

### Q17  ·  Intermediate
**Question:** Perfect forward secrecy in TLS is provided by:

- **A.** Static RSA key transport as in old TLS
- **B.** A long HSTS header
- **C.** WPA-PSK
- **D.** Ephemeral (EC)DH key agreement, not encrypting the session secret only to a long-term RSA key

**Answer:** D
**Explanation:** DHE/ECDHE.

### Q18  ·  Intermediate
**Question:** Students on café Wi-Fi open https://erp.vviet.ac.in. What still protects the password if the café is hostile?

- **A.** Hiding the password in Base64
- **B.** GSM encryption of the laptop
- **C.** TLS to the ERP (if the chain is valid and not stripped)
- **D.** WPA-PSK of the café that everyone knows

**Answer:** C
**Explanation:** End-to-site TLS; café PSK is not E2E to ERP.

### Q19  ·  Intermediate
**Question:** UMTS improved on GSM authentication by:

- **A.** Publishing operator keys
- **B.** Using WEP
- **C.** Mutual authentication of network and USIM
- **D.** Removing encryption

**Answer:** C
**Explanation:** 3G mutual auth.

### Q20  ·  Intermediate
**Question:** WPA-Enterprise differs from PSK because:

- **A.** It forbids AES
- **B.** It is open authentication
- **C.** It uses WEP IVs
- **D.** Each user authenticates to a backend (EAP/RADIUS) and can be revoked independently

**Answer:** D
**Explanation:** 802.1X.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **EMV chip** and **magnetic stripe**?

- **A.** Chips cannot authenticate.
- **B.** Chip produces dynamic cryptograms; stripe is static and easily cloned.
- **C.** They both use WEP.
- **D.** Stripe is the EMV successor.

**Answer:** B
**Explanation:** Chip produces dynamic cryptograms; stripe is static and easily cloned.

### Q22  ·  Intermediate
**Question:** What is the most important distinction between **GSM (2G) auth** and **UMTS (3G) auth**?

- **A.** They use WPA3.
- **B.** GSM authenticates the SIM to the network and historically not vice versa; UMTS adds mutual authentication and stronger crypto.
- **C.** 3G removed the SIM key.
- **D.** 2G already authenticated the network to the phone always.

**Answer:** B
**Explanation:** GSM authenticates the SIM to the network and historically not vice versa; UMTS adds mutual authentication and stronger crypto.

### Q23  ·  Intermediate
**Question:** What is the most important distinction between **TLS** and **WPA2**?

- **A.** TLS protects an application session (usually TCP) end-to-end to a server; WPA2 protects the 802.11 hop between station and AP.
- **B.** WPA2 replaces certificates on websites.
- **C.** TLS encrypts Wi-Fi beacons.
- **D.** They are the same layer.

**Answer:** A
**Explanation:** TLS protects an application session (usually TCP) end-to-end to a server; WPA2 protects the 802.11 hop between station and AP.

### Q24  ·  Intermediate
**Question:** What is the most important distinction between **WEP** and **WPA2-CCMP**?

- **A.** WEP is recommended in 2026 hostels.
- **B.** CCMP is RC4 with a longer IV.
- **C.** They have the same IV size and attacks.
- **D.** WEP had short IVs, weak RC4 use, and no modern AEAD; WPA2-CCMP uses AES-CCMP with better nonce handling.

**Answer:** D
**Explanation:** WEP had short IVs, weak RC4 use, and no modern AEAD; WPA2-CCMP uses AES-CCMP with better nonce handling.

### Q25  ·  Intermediate
**Question:** Which option best describes **EMV payment card**?

- **A.** Chip cards using offline/online cryptograms, unique-per-transaction data, and issuer keys — not copying a static magnetic stripe.
- **B.** WPA-PSK.
- **C.** A hostel RFID UID.
- **D.** A photocopy of the 16-digit PAN as a clone of the chip.

**Answer:** A
**Explanation:** EMV payment card: Chip cards using offline/online cryptograms, unique-per-transaction data, and issuer keys — not copying a static magnetic stripe.

### Q26  ·  Intermediate
**Question:** Which option best describes **HSTS**?

- **A.** An OCSP nonce.
- **B.** A GSM algorithm.
- **C.** HTTP Strict Transport Security: the browser must use HTTPS for the host for a period, reducing SSL-strip attacks.
- **D.** A WPA setting.

**Answer:** C
**Explanation:** HSTS: HTTP Strict Transport Security: the browser must use HTTPS for the host for a period, reducing SSL-strip attacks.

### Q27  ·  Intermediate
**Question:** Which option best describes **Home security crypto**?

- **A.** WEP on the doorbell.
- **B.** Alarms/cameras/locks need authenticated pairing, unique keys, update signing, and not default passwords on the Internet.
- **C.** Telnet without TLS as the management plane.
- **D.** Default admin/admin on a camera facing the hostel gate, forwarded on uPnP.

**Answer:** B
**Explanation:** Home security crypto: Alarms/cameras/locks need authenticated pairing, unique keys, update signing, and not default passwords on the Internet.

### Q28  ·  Intermediate
**Question:** Which option best describes **Perfect forward secrecy (PFS)**?

- **A.** OTP reuse.
- **B.** Compromise of a long-term private key does not decrypt past sessions that used ephemeral DH/ECDHE.
- **C.** RSA key-transport-only ciphersuites that encrypt the premaster with the long-term key.
- **D.** Reusing a static DH share for a decade without authentication.

**Answer:** B
**Explanation:** Perfect forward secrecy (PFS): Compromise of a long-term private key does not decrypt past sessions that used ephemeral DH/ECDHE.

### Q29  ·  Intermediate
**Question:** Which option best describes **SIM / USIM**?

- **A.** A WPA-PSK.
- **B.** The user’s Google password.
- **C.** A file in the phone gallery.
- **D.** A tamper-resistant module storing operator keys and running authentication algorithms; USIM is the UMTS-era application.

**Answer:** D
**Explanation:** SIM / USIM: A tamper-resistant module storing operator keys and running authentication algorithms; USIM is the UMTS-era application.

### Q30  ·  Intermediate
**Question:** Which option best describes **TLS handshake**?

- **A.** A DNS A lookup only.
- **B.** Negotiates version/ciphers, authenticates the server (and optionally client), and establishes fresh traffic keys, preferably with (EC)DHE for PFS.
- **C.** Reuses yesterday’s AES key without messages.
- **D.** Sends the user’s password to every CA.

**Answer:** B
**Explanation:** TLS handshake: Negotiates version/ciphers, authenticates the server (and optionally client), and establishes fresh traffic keys, preferably with (EC)DHE for PFS.

### Q31  ·  Intermediate
**Question:** Which option best describes **UMTS/3G improvement**?

- **A.** Mutual authentication (network proves itself too) and stronger algorithms than classic GSM, addressing rogue-BTS/IMSI-catcher gaps of 2G.
- **B.** WEP on the air interface.
- **C.** Going back to A5/1 as the only option.
- **D.** Removing the SIM.

**Answer:** A
**Explanation:** UMTS/3G improvement: Mutual authentication (network proves itself too) and stronger algorithms than classic GSM, addressing rogue-BTS/IMSI-catcher gaps of 2G.

### Q32  ·  Intermediate
**Question:** Which option best describes **VPN (crypto role)**?

- **A.** A tunnel that authenticates endpoints and encrypts IP (or higher) traffic across untrusted networks.
- **B.** A Caesar of DNS only.
- **C.** Open Wi-Fi.
- **D.** A CRL file.

**Answer:** A
**Explanation:** VPN (crypto role): A tunnel that authenticates endpoints and encrypts IP (or higher) traffic across untrusted networks.

### Q33  ·  Intermediate
**Question:** Which option best describes **WPA-Enterprise (802.1X)**?

- **A.** A single hostel poster password.
- **B.** WEP with a longer IV.
- **C.** Per-user authentication via EAP/RADIUS, issuing per-session keys; a user’s leave/revoke does not require changing a global poster password.
- **D.** Unencrypted 802.11 with MAC filters only.

**Answer:** C
**Explanation:** WPA-Enterprise (802.1X): Per-user authentication via EAP/RADIUS, issuing per-session keys; a user’s leave/revoke does not require changing a global poster password.

### Q34  ·  Intermediate
**Question:** Which option best describes **WPA-PSK**?

- **A.** Open Wi-Fi with a Caesar of 1.
- **B.** Each user has a unique 802.1X credential via RADIUS.
- **C.** TLS client certificates on the AP only, never a passphrase.
- **D.** All users share a passphrase from which the PSK is derived; a leaked passphrase lets anyone join and, depending on handshake capture, may expose traffic.

**Answer:** D
**Explanation:** WPA-PSK: All users share a passphrase from which the PSK is derived; a leaked passphrase lets anyone join and, depending on handshake capture, may expose traffic.

### Q35  ·  Intermediate
**Question:** Which option best describes **Wireless IV/nonce uniqueness**?

- **A.** IVs are private keys.
- **B.** Stream/AEAD Wi-Fi keys must not reuse nonce/IV with the same key (WEP’s original sin).
- **C.** OCSP staples IVs.
- **D.** Reusing IVs is fine if the password is long.

**Answer:** B
**Explanation:** Wireless IV/nonce uniqueness: Stream/AEAD Wi-Fi keys must not reuse nonce/IV with the same key (WEP’s original sin).

### Q36  ·  Intermediate
**Question:** Which option best describes **eID / identity card crypto**?

- **A.** A paper photocopy.
- **B.** Smart-card based identity: keys in the chip, PIN/biometrics, signed attributes, and terminal authentication to reduce skimming.
- **C.** Open RFID UID.
- **D.** Printing a QR of the Aadhaar number on a sticker as the only control.

**Answer:** B
**Explanation:** eID / identity card crypto: Smart-card based identity: keys in the chip, PIN/biometrics, signed attributes, and terminal authentication to reduce skimming.

### Q37  ·  Intermediate
**Question:** Which sequence correctly describes **EMV online purchase (simplified)**?

- **A.** Merchant stores the PIN and Ki
- **B.** Card authenticates (PIN/CDCVM) → generates an authorization cryptogram over transaction data → issuer verifies → approve
- **C.** POS copies the stripe track and replays it next year as a chip
- **D.** Broadcast the content key on Twitter

**Answer:** B
**Explanation:** Correct sequence for EMV online purchase (simplified): Card authenticates (PIN/CDCVM) → generates an authorization cryptogram over transaction data → issuer verifies → approve

### Q38  ·  Intermediate
**Question:** Which sequence correctly describes **WPA2-PSK join (simplified)**?

- **A.** Send the passphrase in every data frame forever
- **B.** Skip the handshake if the SSID matches
- **C.** Associate → 4-way handshake from PMK/PSK → install PTK/GTK → encrypted data frames
- **D.** Use WEP IV increment as the only step

**Answer:** C
**Explanation:** Correct sequence for WPA2-PSK join (simplified): Associate → 4-way handshake from PMK/PSK → install PTK/GTK → encrypted data frames

### Q39  ·  Intermediate
**Question:** Which statement about **Certificate pinning (apps)** is FALSE?

- **A.** A useful way to remember Certificate pinning (apps) is that it is not the same as “Trusting every CA in the device store without constraint”.
- **B.** In this module, Certificate pinning (apps) is a core idea students must distinguish from nearby terms.
- **C.** Certificate pinning (apps) is correctly understood as: an app restricts which CAs/keys it accepts for a host, reducing rogue-CA or mis-issuance risk, at the cost of operational rigidity.
- **D.** Pinning means the app ignores expiry and revocation forever.

**Answer:** D
**Explanation:** The false claim is: Pinning means the app ignores expiry and revocation forever.. Certificate pinning (apps) actually means: An app restricts which CAs/keys it accepts for a host, reducing rogue-CA or mis-issuance risk, at the cost of operational rigidity.

### Q40  ·  Intermediate
**Question:** Which statement about **EMV payment card** is FALSE?

- **A.** EMV chip static data is intended to be cloned like a mag-stripe and still pass ARQC forever.
- **B.** In this module, EMV payment card is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember EMV payment card is that it is not the same as “A photocopy of the 16-digit PAN as a clone of the chip”.
- **D.** EMV payment card is correctly understood as: chip cards using offline/online cryptograms, unique-per-transaction data, and issuer keys — not copying a static magnetic stripe.

**Answer:** A
**Explanation:** The false claim is: EMV chip static data is intended to be cloned like a mag-stripe and still pass ARQC forever.. EMV payment card actually means: Chip cards using offline/online cryptograms, unique-per-transaction data, and issuer keys — not copying a static magnetic stripe.

### Q41  ·  Intermediate
**Question:** Which statement about **GSM authentication (SIM)** is FALSE?

- **A.** In this module, GSM authentication (SIM) is a core idea students must distinguish from nearby terms.
- **B.** GSM never uses a shared secret in the SIM; the operator looks up the PIN from the phone number.
- **C.** A useful way to remember GSM authentication (SIM) is that it is not the same as “The handset sends the IMSI password in clear every call as the only method”.
- **D.** GSM authentication (SIM) is correctly understood as: the SIM and AuC share a key; a challenge-response (A3/A8 family) proves the SIM and derives a session key for air encryption (A5 historically).

**Answer:** B
**Explanation:** The false claim is: GSM never uses a shared secret in the SIM; the operator looks up the PIN from the phone number.. GSM authentication (SIM) actually means: The SIM and AuC share a key; a challenge-response (A3/A8 family) proves the SIM and derives a session key for air encryption (A5 historically).

### Q42  ·  Intermediate
**Question:** Which statement about **Perfect forward secrecy (PFS)** is FALSE?

- **A.** In this module, Perfect forward secrecy (PFS) is a core idea students must distinguish from nearby terms.
- **B.** Perfect forward secrecy (PFS) is correctly understood as: compromise of a long-term private key does not decrypt past sessions that used ephemeral DH/ECDHE.
- **C.** PFS means a stolen server key lets you decrypt all archived TLS captures.
- **D.** A useful way to remember Perfect forward secrecy (PFS) is that it is not the same as “RSA key-transport-only ciphersuites that encrypt the premaster with the long-term key”.

**Answer:** C
**Explanation:** The false claim is: PFS means a stolen server key lets you decrypt all archived TLS captures.. Perfect forward secrecy (PFS) actually means: Compromise of a long-term private key does not decrypt past sessions that used ephemeral DH/ECDHE.

### Q43  ·  Intermediate
**Question:** Which statement about **TLS (SSL successor)** is FALSE?

- **A.** TLS 1.3 still requires RSA key transport and RC4 as mandatory ciphers.
- **B.** In this module, TLS (SSL successor) is a core idea students must distinguish from nearby terms.
- **C.** TLS (SSL successor) is correctly understood as: a protocol providing confidentiality, integrity and authentication for TCP applications via a handshake (keys, certs) and a record layer (AEAD).
- **D.** A useful way to remember TLS (SSL successor) is that it is not the same as “A cipher that replaces IP routing”.

**Answer:** A
**Explanation:** The false claim is: TLS 1.3 still requires RSA key transport and RC4 as mandatory ciphers.. TLS (SSL successor) actually means: A protocol providing confidentiality, integrity and authentication for TCP applications via a handshake (keys, certs) and a record layer (AEAD).

### Q44  ·  Intermediate
**Question:** Which statement about **VPN (crypto role)** is FALSE?

- **A.** A VPN is unnecessary if the café uses WPA2-PSK that everyone knows.
- **B.** VPN (crypto role) is correctly understood as: a tunnel that authenticates endpoints and encrypts IP (or higher) traffic across untrusted networks.
- **C.** A useful way to remember VPN (crypto role) is that it is not the same as “A Caesar of DNS only”.
- **D.** In this module, VPN (crypto role) is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: A VPN is unnecessary if the café uses WPA2-PSK that everyone knows.. VPN (crypto role) actually means: A tunnel that authenticates endpoints and encrypts IP (or higher) traffic across untrusted networks.

### Q45  ·  Intermediate
**Question:** Which statement about **WPA-PSK** is FALSE?

- **A.** WPA-PSK is the same as WPA-Enterprise with RADIUS.
- **B.** WPA-PSK is correctly understood as: all users share a passphrase from which the PSK is derived; a leaked passphrase lets anyone join and, depending on handshake capture, may expose traffic.
- **C.** In this module, WPA-PSK is a core idea students must distinguish from nearby terms.
- **D.** A useful way to remember WPA-PSK is that it is not the same as “Each user has a unique 802.1X credential via RADIUS”.

**Answer:** A
**Explanation:** The false claim is: WPA-PSK is the same as WPA-Enterprise with RADIUS.. WPA-PSK actually means: All users share a passphrase from which the PSK is derived; a leaked passphrase lets anyone join and, depending on handshake capture, may expose traffic.

### Q46  ·  Intermediate
**Question:** Which statement about **Wireless IV/nonce uniqueness** is FALSE?

- **A.** Wireless IV/nonce uniqueness is correctly understood as: stream/AEAD Wi-Fi keys must not reuse nonce/IV with the same key (WEP’s original sin).
- **B.** A useful way to remember Wireless IV/nonce uniqueness is that it is not the same as “Reusing IVs is fine if the password is long”.
- **C.** In this module, Wireless IV/nonce uniqueness is a core idea students must distinguish from nearby terms.
- **D.** WEP’s 24-bit IV space was large enough that reuse never happened in practice.

**Answer:** D
**Explanation:** The false claim is: WEP’s 24-bit IV space was large enough that reuse never happened in practice.. Wireless IV/nonce uniqueness actually means: Stream/AEAD Wi-Fi keys must not reuse nonce/IV with the same key (WEP’s original sin).

### Q47  ·  Intermediate
**Question:** Which statement about **eID / identity card crypto** is FALSE?

- **A.** An eID chip that always answers without a PIN is the recommended privacy design.
- **B.** In this module, eID / identity card crypto is a core idea students must distinguish from nearby terms.
- **C.** eID / identity card crypto is correctly understood as: smart-card based identity: keys in the chip, PIN/biometrics, signed attributes, and terminal authentication to reduce skimming.
- **D.** A useful way to remember eID / identity card crypto is that it is not the same as “Printing a QR of the Aadhaar number on a sticker as the only control”.

**Answer:** A
**Explanation:** The false claim is: An eID chip that always answers without a PIN is the recommended privacy design.. eID / identity card crypto actually means: Smart-card based identity: keys in the chip, PIN/biometrics, signed attributes, and terminal authentication to reduce skimming.

### Q48  ·  Difficult
**Question:** 2G phone at a rogue base station may accept the network without authenticating it. 3G/UMTS aimed to:

- **A.** Use WEP
- **B.** Publish Ki
- **C.** Authenticate the network to the USIM as well
- **D.** Remove all encryption

**Answer:** C
**Explanation:** Mutual auth.

### Q49  ·  Difficult
**Question:** A captured WPA2-PSK 4-way handshake plus the passphrase allows:

- **A.** The SIM Ki
- **B.** Deriving the PTK and decrypting that session’s unicast traffic (in the classic PSK model)
- **C.** The CA private key
- **D.** OCSP responses

**Answer:** B
**Explanation:** PSK + handshake → keys.

### Q50  ·  Difficult
**Question:** Broadcast encryption’s core problem is:

- **A.** Efficiently excluding revoked subscribers without re-encrypting under every remaining personal key from scratch each time
- **B.** WPA3 on coaxial cable
- **C.** Hashing the TV guide
- **D.** TLS handshakes per packet to 10^7 TVs as the only algorithm

**Answer:** A
**Explanation:** Subset-cover / trees.

### Q51  ·  Difficult
**Question:** College app pins the ERP cert SPKI. After an unplanned CA reissue without app update:

- **A.** Browsers ignore pins always in native apps
- **B.** WPA breaks
- **C.** TLS becomes HTTP
- **D.** The app fails safe (connection error) until pin update — the operational cost of pinning

**Answer:** D
**Explanation:** Pinning trade-off.

### Q52  ·  Difficult
**Question:** GSM A5/1 is a 64-bit session key historically. Brute-force 2^64 is:

- **A.** Impossible even for nations by definition of 64
- **B.** Easier than Caesar
- **C.** The same as AES-256
- **D.** Out of laptop range but not ‘forever’ for well-funded actors; also A5/1 has cryptanalytic breaks far cheaper

**Answer:** D
**Explanation:** 64-bit is not modern security; GSM had worse practical breaks.

### Q53  ·  Difficult
**Question:** HSTS max-age = 31536000 seconds is how many days?

- **A.** 365
- **B.** 7
- **C.** 30
- **D.** 1

**Answer:** A
**Explanation:** 365×86400 = 31536000.

### Q54  ·  Difficult
**Question:** Hostel poster: WPA2 password ‘vvietwifi’. A former student still connects because:

- **A.** RADIUS revoked them automatically
- **B.** TLS client certs expired
- **C.** PSK was not rotated; no per-user revocation
- **D.** OCSP stapling on the AP

**Answer:** C
**Explanation:** Shared PSK problem.

### Q55  ·  Difficult
**Question:** Live convocation stream sold only to alumni: a fitting crypto pattern is:

- **A.** WEP on the camera
- **B.** Broadcast encryption / licensed players with subscriber keys, not one TLS session per viewer at the encoder
- **C.** Emailing one AES key on the public website
- **D.** GSM A5/1 of the M3U8 file

**Answer:** B
**Explanation:** Subset of receivers.

### Q56  ·  Difficult
**Question:** Pay-TV subset-cover: 8 subscribers, revoke 1. A naive unique-key-per-user would wrap the content key how many times for the remaining 7?

- **A.** 1
- **B.** 7
- **C.** 8
- **D.** 64

**Answer:** B
**Explanation:** One wrap per remaining user in the naive scheme — trees do better.

### Q57  ·  Difficult
**Question:** TLS 1.3 traffic keys are derived per connection via HKDF. If 100 students each make 1 connection, how many independent record-key sets (order of)?

- **A.** 1 shared campus key
- **B.** 24
- **C.** About 100 (one per handshake)
- **D.** 2^128

**Answer:** C
**Explanation:** Ephemeral per connection (plus directions/epochs).

### Q58  ·  Difficult
**Question:** WEP IV is 24 bits. After about 2^12 frames with a weak implementation, collisions become likely (birthday on 24 bits is ~2^12). 2^{12} equals:

- **A.** 2^24
- **B.** 4096
- **C.** 128
- **D.** 24

**Answer:** B
**Explanation:** Birthday ~2^{12} for 24-bit space; WEP’s actual attacks are even worse than generic birthday.

### Q59  ·  Difficult
**Question:** WPA2-PSK passphrase 8 chars from 26 lowercase letters, uniform. Space size?

- **A.** 8^26
- **B.** 2^8
- **C.** 128^8
- **D.** 26^8

**Answer:** D
**Explanation:** 26^8 ≈ 2.08e11, too small.

### Q60  ·  Difficult
**Question:** What is the most important distinction between **HTTPS** and **E2EE chat**?

- **A.** They are identical trust models.
- **B.** HTTPS authenticates the server and encrypts the hop to that server; the server still sees plaintext. E2EE keeps plaintext off the server.
- **C.** E2EE means the ISP CA can read chat.
- **D.** HTTPS forbids certificates.

**Answer:** B
**Explanation:** HTTPS authenticates the server and encrypts the hop to that server; the server still sees plaintext. E2EE keeps plaintext off the server.

### Q61  ·  Difficult
**Question:** What is the most important distinction between **WPA-PSK** and **WPA-Enterprise**?

- **A.** PSK shares one passphrase; Enterprise uses per-user EAP/RADIUS and better revocation/leave handling.
- **B.** They both equal WEP.
- **C.** Enterprise is a longer PSK poster.
- **D.** PSK uses RADIUS for each student uniquely by default.

**Answer:** A
**Explanation:** PSK shares one passphrase; Enterprise uses per-user EAP/RADIUS and better revocation/leave handling.

### Q62  ·  Difficult
**Question:** What is the most important distinction between **broadcast encryption** and **unicast TLS**?

- **A.** They are both GSM A5.
- **B.** Broadcast encryption needs a TCP handshake per TV frame.
- **C.** Broadcast schemes share encrypted content with many authorized receivers efficiently; TLS is typically one client-server session.
- **D.** TLS is the only way to send live TV to 10 million set-tops with one packet.

**Answer:** C
**Explanation:** Broadcast schemes share encrypted content with many authorized receivers efficiently; TLS is typically one client-server session.

### Q63  ·  Difficult
**Question:** What is the most important distinction between **eID chip** and **printed ID card**?

- **A.** Chips must always broadcast the national ID in the clear.
- **B.** A chip can authenticate a terminal and release attributes under PIN; print is photocopiable.
- **C.** Print cannot be copied.
- **D.** They provide the same skimming resistance.

**Answer:** B
**Explanation:** A chip can authenticate a terminal and release attributes under PIN; print is photocopiable.

### Q64  ·  Difficult
**Question:** Which statement about **Broadcast encryption** is FALSE?

- **A.** Broadcast encryption is just posting the AES key on Twitter for all subscribers.
- **B.** A useful way to remember Broadcast encryption is that it is not the same as “TLS to a single browser tab”.
- **C.** Broadcast encryption is correctly understood as: encrypting content so only authorized receivers (subset of subscribers) can decrypt, often with key-tree/subset-cover schemes for pay-TV.
- **D.** In this module, Broadcast encryption is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Broadcast encryption is just posting the AES key on Twitter for all subscribers.. Broadcast encryption actually means: Encrypting content so only authorized receivers (subset of subscribers) can decrypt, often with key-tree/subset-cover schemes for pay-TV.

### Q65  ·  Difficult
**Question:** Which statement about **End-to-end encryption (E2EE)** is FALSE?

- **A.** End-to-end encryption (E2EE) is correctly understood as: only endpoints can read payloads; relays (college mail gateway, chat server) cannot decrypt content.
- **B.** In this module, End-to-end encryption (E2EE) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember End-to-end encryption (E2EE) is that it is not the same as “TLS only to the college proxy that inspects HTTPS”.
- **D.** E2EE is the same as HTTPS to a server that stores plaintext mail.

**Answer:** D
**Explanation:** The false claim is: E2EE is the same as HTTPS to a server that stores plaintext mail.. End-to-end encryption (E2EE) actually means: Only endpoints can read payloads; relays (college mail gateway, chat server) cannot decrypt content.

### Q66  ·  Difficult
**Question:** Which statement about **HSTS** is FALSE?

- **A.** A useful way to remember HSTS is that it is not the same as “A WPA setting”.
- **B.** In this module, HSTS is a core idea students must distinguish from nearby terms.
- **C.** HSTS tells the browser to prefer HTTP if HTTPS is slow.
- **D.** HSTS is correctly understood as: hTTP Strict Transport Security: the browser must use HTTPS for the host for a period, reducing SSL-strip attacks.

**Answer:** C
**Explanation:** The false claim is: HSTS tells the browser to prefer HTTP if HTTPS is slow.. HSTS actually means: HTTP Strict Transport Security: the browser must use HTTPS for the host for a period, reducing SSL-strip attacks.

### Q67  ·  Difficult
**Question:** Which statement about **Home security crypto** is FALSE?

- **A.** In this module, Home security crypto is a core idea students must distinguish from nearby terms.
- **B.** IoT devices should all share one hardcoded key in the firmware for ease of support.
- **C.** A useful way to remember Home security crypto is that it is not the same as “Default admin/admin on a camera facing the hostel gate, forwarded on uPnP”.
- **D.** Home security crypto is correctly understood as: alarms/cameras/locks need authenticated pairing, unique keys, update signing, and not default passwords on the Internet.

**Answer:** B
**Explanation:** The false claim is: IoT devices should all share one hardcoded key in the firmware for ease of support.. Home security crypto actually means: Alarms/cameras/locks need authenticated pairing, unique keys, update signing, and not default passwords on the Internet.

### Q68  ·  Difficult
**Question:** Which statement about **SIM / USIM** is FALSE?

- **A.** Anyone can read Ki from a SIM with a screenshot.
- **B.** SIM / USIM is correctly understood as: a tamper-resistant module storing operator keys and running authentication algorithms; USIM is the UMTS-era application.
- **C.** A useful way to remember SIM / USIM is that it is not the same as “A file in the phone gallery”.
- **D.** In this module, SIM / USIM is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Anyone can read Ki from a SIM with a screenshot.. SIM / USIM actually means: A tamper-resistant module storing operator keys and running authentication algorithms; USIM is the UMTS-era application.

### Q69  ·  Difficult
**Question:** Which statement about **TLS handshake** is FALSE?

- **A.** In this module, TLS handshake is a core idea students must distinguish from nearby terms.
- **B.** TLS handshake is correctly understood as: negotiates version/ciphers, authenticates the server (and optionally client), and establishes fresh traffic keys, preferably with (EC)DHE for PFS.
- **C.** A useful way to remember TLS handshake is that it is not the same as “Sends the user’s password to every CA”.
- **D.** The handshake’s only job is to download images faster; it does not authenticate.

**Answer:** D
**Explanation:** The false claim is: The handshake’s only job is to download images faster; it does not authenticate.. TLS handshake actually means: Negotiates version/ciphers, authenticates the server (and optionally client), and establishes fresh traffic keys, preferably with (EC)DHE for PFS.

### Q70  ·  Difficult
**Question:** Which statement about **UMTS/3G improvement** is FALSE?

- **A.** UMTS/3G improvement is correctly understood as: mutual authentication (network proves itself too) and stronger algorithms than classic GSM, addressing rogue-BTS/IMSI-catcher gaps of 2G.
- **B.** A useful way to remember UMTS/3G improvement is that it is not the same as “Removing the SIM”.
- **C.** In this module, UMTS/3G improvement is a core idea students must distinguish from nearby terms.
- **D.** UMTS dropped authentication entirely for speed.

**Answer:** D
**Explanation:** The false claim is: UMTS dropped authentication entirely for speed.. UMTS/3G improvement actually means: Mutual authentication (network proves itself too) and stronger algorithms than classic GSM, addressing rogue-BTS/IMSI-catcher gaps of 2G.

### Q71  ·  Difficult
**Question:** Which statement about **WPA (WLAN security)** is FALSE?

- **A.** WPA (WLAN security) is correctly understood as: wi-Fi Protected Access: authenticates stations and encrypts 802.11 frames (WPA2-PSK/Enterprise, WPA3 improvements) replacing broken WEP.
- **B.** WEP is still recommended over WPA3 for campus hostels.
- **C.** A useful way to remember WPA (WLAN security) is that it is not the same as “An X.509 email protocol”.
- **D.** In this module, WPA (WLAN security) is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: WEP is still recommended over WPA3 for campus hostels.. WPA (WLAN security) actually means: Wi-Fi Protected Access: authenticates stations and encrypts 802.11 frames (WPA2-PSK/Enterprise, WPA3 improvements) replacing broken WEP.

### Q72  ·  Difficult
**Question:** Which statement about **WPA-Enterprise (802.1X)** is FALSE?

- **A.** WPA-Enterprise (802.1X) is correctly understood as: per-user authentication via EAP/RADIUS, issuing per-session keys; a user’s leave/revoke does not require changing a global poster password.
- **B.** In this module, WPA-Enterprise (802.1X) is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember WPA-Enterprise (802.1X) is that it is not the same as “A single hostel poster password”.
- **D.** 802.1X means the AP does not need any backend and stores all passwords locally in plaintext.

**Answer:** D
**Explanation:** The false claim is: 802.1X means the AP does not need any backend and stores all passwords locally in plaintext.. WPA-Enterprise (802.1X) actually means: Per-user authentication via EAP/RADIUS, issuing per-session keys; a user’s leave/revoke does not require changing a global poster password.

---

## Quick answer key

Q01–B | Q02–A | Q03–B | Q04–A | Q05–C | Q06–C | Q07–A | Q08–C | Q09–C | Q10–A | Q11–C | Q12–A | Q13–A | Q14–C | Q15–A | Q16–D | Q17–D | Q18–C | Q19–C | Q20–D | Q21–B | Q22–B | Q23–A | Q24–D | Q25–A | Q26–C | Q27–B | Q28–B | Q29–D | Q30–B | Q31–A | Q32–A | Q33–C | Q34–D | Q35–B | Q36–B | Q37–B | Q38–C | Q39–D | Q40–A | Q41–B | Q42–C | Q43–A | Q44–A | Q45–A | Q46–D | Q47–A | Q48–C | Q49–B | Q50–A | Q51–D | Q52–D | Q53–A | Q54–C | Q55–B | Q56–B | Q57–C | Q58–B | Q59–D | Q60–B | Q61–A | Q62–C | Q63–B | Q64–A | Q65–D | Q66–C | Q67–B | Q68–A | Q69–D | Q70–D | Q71–B | Q72–D
