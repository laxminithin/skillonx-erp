# Quiz — Computer Networks-I — Unit 4: Error Detection & Correction

**Subject:** Computer Networks-I  
**Module:** Unit 4 — Error Detection & Correction  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Even parity on 10010 is which extra bit?

- **A.** 1
- **B.** 10010 again
- **C.** 0 (already even number of 1s: two)
- **D.** 11

**Answer:** C
**Explanation:** Two 1s already even, even-parity bit = 0.

### Q02  ·  Easy
**Question:** If dmin = 4, the code can detect up to how many errors?

- **A.** 3
- **B.** 4
- **C.** 2
- **D.** 1

**Answer:** A
**Explanation:** s = dmin − 1 = 3.

### Q03  ·  Easy
**Question:** If dmin = 5, it can correct up to how many errors?

- **A.** 2
- **B.** 5
- **C.** 4
- **D.** 0

**Answer:** A
**Explanation:** t = floor((5−1)/2) = 2.

### Q04  ·  Easy
**Question:** Which option best describes **Checksum**?

- **A.** FHSS hop set.
- **B.** Manchester mid-bit edges.
- **C.** An error-detecting code using one’s-complement sum of words (as in IPv4 header).
- **D.** A convolutional trellis decoder.

**Answer:** C
**Explanation:** Checksum: An error-detecting code using one’s-complement sum of words (as in IPv4 header).

### Q05  ·  Easy
**Question:** Which option best describes **Cyclic code**?

- **A.** NRZ-I only.
- **B.** A code with no algebraic shift property.
- **C.** A linear code where a cyclic shift of a codeword is also a codeword; CRC codes are cyclic.
- **D.** Stop-and-wait ACK.

**Answer:** C
**Explanation:** Cyclic code: A linear code where a cyclic shift of a codeword is also a codeword; CRC codes are cyclic.

### Q06  ·  Easy
**Question:** Which option best describes **Error correction capability**?

- **A.** t = SNR in dB.
- **B.** t = number of FDM channels.
- **C.** t = dmin + 2 always.
- **D.** A code with dmin can correct up to t = floor((dmin−1)/2) errors.

**Answer:** D
**Explanation:** Error correction capability: A code with dmin can correct up to t = floor((dmin−1)/2) errors.

### Q07  ·  Easy
**Question:** Which option best describes **Hamming distance**?

- **A.** The number of bit positions in which two words differ.
- **B.** The TDM slot number.
- **C.** The Euclidean distance of QAM points only.
- **D.** The IPv4 TTL.

**Answer:** A
**Explanation:** Hamming distance: The number of bit positions in which two words differ.

### Q08  ·  Easy
**Question:** Which option best describes **Parity bit**?

- **A.** A bit that always equals 0.
- **B.** An extra bit chosen so that the number of 1s is even (even parity) or odd (odd parity).
- **C.** A WDM lambda id.
- **D.** The IPv6 version nibble.

**Answer:** B
**Explanation:** Parity bit: An extra bit chosen so that the number of 1s is even (even parity) or odd (odd parity).

### Q09  ·  Easy
**Question:** Which option best describes **Single-bit error**?

- **A.** A burst of 10 consecutive bits flipped.
- **B.** Loss of an entire frame.
- **C.** Exactly one bit in the data unit is inverted.
- **D.** Jitter of delay only.

**Answer:** C
**Explanation:** Single-bit error: Exactly one bit in the data unit is inverted.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **CRC encode**?

- **A.** Hamming-correct first using syndrome of QAM
- **B.** Vote 3 copies then FDM
- **C.** One’s-complement then hop FHSS
- **D.** Append r zeros → divide by G(x) → append remainder as FCS

**Answer:** D
**Explanation:** Correct sequence for CRC encode: Append r zeros → divide by G(x) → append remainder as FCS

### Q11  ·  Easy
**Question:** Which sequence correctly describes **Hamming SEC encode (even parity positions 1,2,4,…)**?

- **A.** CRC divide by 1101 as the only step
- **B.** Add one even parity over all bits only
- **C.** Place data in non-power-of-two positions → compute each parity over its coverage set → send n-bit word
- **D.** TDM slot then WDM

**Answer:** C
**Explanation:** Correct sequence for Hamming SEC encode (even parity positions 1,2,4,…): Place data in non-power-of-two positions → compute each parity over its coverage set → send n-bit word

### Q12  ·  Intermediate
**Question:** A Hamming SEC decoder computes a nonzero syndrome 101 (binary 5). It should:

- **A.** Increase dmin
- **B.** Always discard the frame without correction
- **C.** Treat it as CRC remainder 0
- **D.** Flip the bit in position 5 and accept the word

**Answer:** D
**Explanation:** Syndrome gives the error position in Hamming SEC.

### Q13  ·  Intermediate
**Question:** CRC remainder length equals:

- **A.** The IPv4 header length
- **B.** The degree of G(x)
- **C.** The Hamming r for m=4 only
- **D.** Always 1 bit

**Answer:** B
**Explanation:** r = deg(G) check bits.

### Q14  ·  Intermediate
**Question:** Ethernet uses CRC-32 in the trailer. The usual action on a bad CRC is:

- **A.** Detect and discard (rely on higher-layer recovery)
- **B.** Change Manchester to NRZ
- **C.** Correct all 32-bit bursts in hardware always
- **D.** Rewrite the IP TTL

**Answer:** A
**Explanation:** Link CRC is detection; TCP/app may retransmit.

### Q15  ·  Intermediate
**Question:** Hamming codes are designed with dmin =

- **A.** 5 always
- **B.** 32
- **C.** 3
- **D.** 1

**Answer:** C
**Explanation:** Single-error-correcting Hamming codes have dmin = 3.

### Q16  ·  Intermediate
**Question:** Internet checksum wraparound is:

- **A.** End-around carry in one’s complement
- **B.** Polynomial mod 2 without carries
- **C.** Hamming syndrome
- **D.** Two’s complement discard

**Answer:** A
**Explanation:** One’s-complement sum adds carry back.

### Q17  ·  Intermediate
**Question:** Lightning flips 6 consecutive bits on a UTP pair. This is a:

- **A.** Jitter-only event
- **B.** Port-address error
- **C.** Burst error
- **D.** Single-bit error

**Answer:** C
**Explanation:** A span of corrupted bits is a burst.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **CRC** and **checksum**?

- **A.** CRC uses polynomial division; Internet checksum uses one’s-complement addition of words.
- **B.** Checksum is CRC-32.
- **C.** They are Manchester codes.
- **D.** CRC is one’s-complement sum.

**Answer:** A
**Explanation:** CRC uses polynomial division; Internet checksum uses one’s-complement addition of words.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **Hamming distance** and **minimum distance dmin**?

- **A.** dmin is a pair of words’ IP TTLs.
- **B.** They are baud rates.
- **C.** Distance is between two words; dmin is the smallest such distance in the code.
- **D.** Hamming distance is only for CRC degree.

**Answer:** C
**Explanation:** Distance is between two words; dmin is the smallest such distance in the code.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **linear block code** and **nonlinear code**?

- **A.** Linear codes cannot be Hamming codes.
- **B.** Nonlinear codes must include 0.
- **C.** Linear codes are closed under XOR and include 0; nonlinear codes need not.
- **D.** They are IPv4 classes.

**Answer:** C
**Explanation:** Linear codes are closed under XOR and include 0; nonlinear codes need not.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **single-bit error** and **burst error**?

- **A.** Single-bit flips one position; a burst corrupts a span of bits.
- **B.** Single-bit errors are defined as 10-bit spans.
- **C.** Bursts cannot be longer than 1 bit.
- **D.** They are identical to jitter.

**Answer:** A
**Explanation:** Single-bit flips one position; a burst corrupts a span of bits.

### Q22  ·  Intermediate
**Question:** Which option best describes **Block coding**?

- **A.** k-bit datawords are mapped to n-bit codewords (n>k) to detect or correct errors.
- **B.** FDM guard bands.
- **C.** Line coding NRZ only.
- **D.** Removing all redundancy.

**Answer:** A
**Explanation:** Block coding: k-bit datawords are mapped to n-bit codewords (n>k) to detect or correct errors.

### Q23  ·  Intermediate
**Question:** Which option best describes **Burst error**?

- **A.** Exactly one flipped bit.
- **B.** Two or more consecutive bits are corrupted (length measured from first to last error).
- **C.** A TCP port collision.
- **D.** A correct CRC remainder of 0 guaranteeing no burst.

**Answer:** B
**Explanation:** Burst error: Two or more consecutive bits are corrupted (length measured from first to last error).

### Q24  ·  Intermediate
**Question:** Which option best describes **CRC**?

- **A.** Hamming dmin of QAM.
- **B.** Cyclic Redundancy Check: the remainder of binary polynomial division of the message by a generator polynomial.
- **C.** Token-ring priority bits.
- **D.** A simple even parity on one bit only.

**Answer:** B
**Explanation:** CRC: Cyclic Redundancy Check: the remainder of binary polynomial division of the message by a generator polynomial.

### Q25  ·  Intermediate
**Question:** Which option best describes **Error detection capability**?

- **A.** It detects nothing if dmin>1.
- **B.** It can always correct dmin errors.
- **C.** A code with dmin can detect up to s = dmin − 1 errors.
- **D.** It equals the CRC degree always.

**Answer:** C
**Explanation:** Error detection capability: A code with dmin can detect up to s = dmin − 1 errors.

### Q26  ·  Intermediate
**Question:** Which option best describes **Generator polynomial**?

- **A.** The IPv4 source address.
- **B.** The TCP window size.
- **C.** The Ethernet IFG.
- **D.** The divisor polynomial G(x) that defines a CRC; remainder length is deg(G).

**Answer:** D
**Explanation:** Generator polynomial: The divisor polynomial G(x) that defines a CRC; remainder length is deg(G).

### Q27  ·  Intermediate
**Question:** Which option best describes **Hamming code**?

- **A.** Checksum wraparound only.
- **B.** AMI line code.
- **C.** A CRC-32 Ethernet trailer only.
- **D.** A linear block code with dmin = 3 that can correct 1-bit errors, with 2^r ≥ m+r+1 parity bits.

**Answer:** D
**Explanation:** Hamming code: A linear block code with dmin = 3 that can correct 1-bit errors, with 2^r ≥ m+r+1 parity bits.

### Q28  ·  Intermediate
**Question:** Which option best describes **Linear block code**?

- **A.** IPv4 classful routing.
- **B.** A block code closed under XOR; the XOR of two codewords is a codeword (including the all-zero word).
- **C.** A nonlinear mapping with no algebraic structure.
- **D.** Manchester encoding.

**Answer:** B
**Explanation:** Linear block code: A block code closed under XOR; the XOR of two codewords is a codeword (including the all-zero word).

### Q29  ·  Intermediate
**Question:** Which option best describes **Minimum distance dmin**?

- **A.** The average IP packet size.
- **B.** The Shannon SNR.
- **C.** The MAC address OUI.
- **D.** The smallest Hamming distance between any two distinct codewords of a code.

**Answer:** D
**Explanation:** Minimum distance dmin: The smallest Hamming distance between any two distinct codewords of a code.

### Q30  ·  Intermediate
**Question:** Which option best describes **Redundancy**?

- **A.** Deleting CRC to save bandwidth.
- **B.** Removing Hamming parity.
- **C.** Compressing PCM to 1 bit always.
- **D.** Extra bits added to data to allow detection or correction of errors.

**Answer:** D
**Explanation:** Redundancy: Extra bits added to data to allow detection or correction of errors.

### Q31  ·  Intermediate
**Question:** Which option best describes **Syndrome**?

- **A.** In Hamming decoding, the pattern of parity checks that indicates the error bit position (or 0 if none).
- **B.** The T1 framing bit.
- **C.** The NAT pool size.
- **D.** The CSMA backoff counter.

**Answer:** A
**Explanation:** Syndrome: In Hamming decoding, the pattern of parity checks that indicates the error bit position (or 0 if none).

### Q32  ·  Intermediate
**Question:** Which sequence correctly describes **CRC check at receiver**?

- **A.** Always flip bit 1
- **B.** Compute Hamming position 7 always
- **C.** Divide received word by G(x) → remainder 0 means accept (with rare undetected errors)
- **D.** Ignore G(x) and check MAC OUI

**Answer:** C
**Explanation:** Correct sequence for CRC check at receiver: Divide received word by G(x) → remainder 0 means accept (with rare undetected errors)

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **Hamming SEC decode**?

- **A.** Recompute parities → syndrome S → if S=0 accept, else flip bit S
- **B.** Always request a full TCP reset
- **C.** Treat syndrome as IPv4 checksum
- **D.** Discard if any 1 is present even if S=0

**Answer:** A
**Explanation:** Correct sequence for Hamming SEC decode: Recompute parities → syndrome S → if S=0 accept, else flip bit S

### Q34  ·  Intermediate
**Question:** Which statement about **Block coding** is FALSE?

- **A.** Block coding is correctly understood as: k-bit datawords are mapped to n-bit codewords (n>k) to detect or correct errors.
- **B.** In this module, Block coding is a core idea students must distinguish from nearby terms.
- **C.** Block coding always shortens words so n<k.
- **D.** A useful way to remember Block coding is that it is not the same as “Removing all redundancy”.

**Answer:** C
**Explanation:** The false claim is: Block coding always shortens words so n<k.. Block coding actually means: k-bit datawords are mapped to n-bit codewords (n>k) to detect or correct errors.

### Q35  ·  Intermediate
**Question:** Which statement about **CRC** is FALSE?

- **A.** CRC is correctly understood as: cyclic Redundancy Check: the remainder of binary polynomial division of the message by a generator polynomial.
- **B.** A useful way to remember CRC is that it is not the same as “A simple even parity on one bit only”.
- **C.** CRC is computed by decimal long division of ASCII letters.
- **D.** In this module, CRC is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: CRC is computed by decimal long division of ASCII letters.. CRC actually means: Cyclic Redundancy Check: the remainder of binary polynomial division of the message by a generator polynomial.

### Q36  ·  Intermediate
**Question:** Which statement about **Checksum** is FALSE?

- **A.** A useful way to remember Checksum is that it is not the same as “A convolutional trellis decoder”.
- **B.** The Internet checksum can correct 3-bit errors in general.
- **C.** In this module, Checksum is a core idea students must distinguish from nearby terms.
- **D.** Checksum is correctly understood as: an error-detecting code using one’s-complement sum of words (as in IPv4 header).

**Answer:** B
**Explanation:** The false claim is: The Internet checksum can correct 3-bit errors in general.. Checksum actually means: An error-detecting code using one’s-complement sum of words (as in IPv4 header).

### Q37  ·  Intermediate
**Question:** Which statement about **Error correction capability** is FALSE?

- **A.** In this module, Error correction capability is a core idea students must distinguish from nearby terms.
- **B.** Correction capability is t = 2 dmin + 1.
- **C.** Error correction capability is correctly understood as: a code with dmin can correct up to t = floor((dmin−1)/2) errors.
- **D.** A useful way to remember Error correction capability is that it is not the same as “t = dmin + 2 always”.

**Answer:** B
**Explanation:** The false claim is: Correction capability is t = 2 dmin + 1.. Error correction capability actually means: A code with dmin can correct up to t = floor((dmin−1)/2) errors.

### Q38  ·  Intermediate
**Question:** Which statement about **Hamming code** is FALSE?

- **A.** Hamming codes have dmin = 1 and cannot correct any error.
- **B.** In this module, Hamming code is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Hamming code is that it is not the same as “A CRC-32 Ethernet trailer only”.
- **D.** Hamming code is correctly understood as: a linear block code with dmin = 3 that can correct 1-bit errors, with 2^r ≥ m+r+1 parity bits.

**Answer:** A
**Explanation:** The false claim is: Hamming codes have dmin = 1 and cannot correct any error.. Hamming code actually means: A linear block code with dmin = 3 that can correct 1-bit errors, with 2^r ≥ m+r+1 parity bits.

### Q39  ·  Intermediate
**Question:** Which statement about **Minimum distance dmin** is FALSE?

- **A.** Minimum distance dmin is correctly understood as: the smallest Hamming distance between any two distinct codewords of a code.
- **B.** A useful way to remember Minimum distance dmin is that it is not the same as “The average IP packet size”.
- **C.** dmin is always 1 for any useful error-detecting code.
- **D.** In this module, Minimum distance dmin is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: dmin is always 1 for any useful error-detecting code.. Minimum distance dmin actually means: The smallest Hamming distance between any two distinct codewords of a code.

### Q40  ·  Intermediate
**Question:** Which statement about **Redundancy** is FALSE?

- **A.** Redundancy always decreases dmin to 0.
- **B.** A useful way to remember Redundancy is that it is not the same as “Deleting CRC to save bandwidth”.
- **C.** Redundancy is correctly understood as: extra bits added to data to allow detection or correction of errors.
- **D.** In this module, Redundancy is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: Redundancy always decreases dmin to 0.. Redundancy actually means: Extra bits added to data to allow detection or correction of errors.

### Q41  ·  Intermediate
**Question:** Which statement about **Single-bit error** is FALSE?

- **A.** A single-bit error means two bits flipped.
- **B.** In this module, Single-bit error is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Single-bit error is that it is not the same as “A burst of 10 consecutive bits flipped”.
- **D.** Single-bit error is correctly understood as: exactly one bit in the data unit is inverted.

**Answer:** A
**Explanation:** The false claim is: A single-bit error means two bits flipped.. Single-bit error actually means: Exactly one bit in the data unit is inverted.

### Q42  ·  Intermediate
**Question:** dmin of a repetition code 000,111 is 3. It can:

- **A.** Only detect, never correct, 1 error
- **B.** Correct 3-bit errors
- **C.** Correct 1-bit errors (majority vote)
- **D.** Detect 0 errors

**Answer:** C
**Explanation:** t = floor((3−1)/2) = 1.

### Q43  ·  Difficult
**Question:** A code has dmin = 3. How many errors can it detect? How many can it correct?

- **A.** Detect 1; correct 2
- **B.** Detect 0; correct 0
- **C.** Detect 2; correct 1
- **D.** Detect 3; correct 3

**Answer:** C
**Explanation:** s = dmin−1 = 2; t = floor((3−1)/2) = 1.

### Q44  ·  Difficult
**Question:** A code uses even parity on 7 data bits. Two data bits flip. What happens?

- **A.** Parity always detects all 2-bit errors
- **B.** Parity still looks even, so the double error is undetected
- **C.** CRC degree becomes 0
- **D.** Hamming syndrome corrects both automatically with one bit

**Answer:** B
**Explanation:** Even parity detects odd counts, not 2-bit errors.

### Q45  ·  Difficult
**Question:** A linear codeword XOR another codeword yields:

- **A.** An FDM guard
- **B.** A QAM symbol
- **C.** Another codeword (including possibly 0)
- **D.** A TCP SYN

**Answer:** C
**Explanation:** Closure under XOR is the linear-code property.

### Q46  ·  Difficult
**Question:** CRC: data 10110, generator 1101. What is the 3-bit remainder (FCS) to append?

- **A.** 101
- **B.** 111
- **C.** 000
- **D.** 001

**Answer:** A
**Explanation:** Append 000 and divide by 1101; remainder is 101. Transmitted 10110101.

### Q47  ·  Difficult
**Question:** Even-parity checksum of 8-bit words 10101001 and 00111001 (one’s complement Internet-style complement of the sum). Checksum bits?

- **A.** 11100010
- **B.** 11111111
- **C.** 10101001
- **D.** 00011101

**Answer:** D
**Explanation:** Sum = 11100010; checksum = 00011101. Sum+checksum = 11111111.

### Q48  ·  Difficult
**Question:** For m data bits, Hamming r satisfies:

- **A.** 2^r = m
- **B.** r = dmin + CRC
- **C.** 2^r ≥ m + r + 1
- **D.** r = m − 1

**Answer:** C
**Explanation:** Positions 1…n include r parities and m data, plus the no-error syndrome.

### Q49  ·  Difficult
**Question:** Hamming (7,4): 4 data bits need how many parity bits, and what is n?

- **A.** 4 parity bits, n = 8
- **B.** 3 parity bits, n = 7
- **C.** 1 parity bit, n = 5
- **D.** 7 parity bits, n = 11

**Answer:** B
**Explanation:** 2^3 = 8 ≥ 4+3+1. Classic (7,4) code.

### Q50  ·  Difficult
**Question:** Hamming distance between 10101 and 11001?

- **A.** 1
- **B.** 5
- **C.** 2
- **D.** 0

**Answer:** C
**Explanation:** They differ in the 2nd and 3rd bits (from the left): 0≠1 and 1≠0.

### Q51  ·  Difficult
**Question:** How many parity bits r are needed for a Hamming code with m = 8 data bits?

- **A.** 4
- **B.** 8
- **C.** 3
- **D.** 1

**Answer:** A
**Explanation:** Need 2^r ≥ m+r+1 = 9+r. r=4: 16 ≥ 13. Total n=12.

### Q52  ·  Difficult
**Question:** IPv4 header uses a 16-bit one’s-complement checksum. It does not cover:

- **A.** The payload of TCP/UDP (those have their own checksums)
- **B.** The IPv4 header fields it is specified to cover
- **C.** Source address
- **D.** Version/IHL

**Answer:** A
**Explanation:** IPv4 checksum is header-only; payload is not included.

### Q53  ·  Difficult
**Question:** What is the most important distinction between **Hamming code** and **CRC**?

- **A.** Hamming is only a checksum wrap.
- **B.** They are both TDM.
- **C.** CRC always corrects 1-bit errors like Hamming SEC.
- **D.** Hamming (typical) corrects 1-bit errors; CRC is strong at detection (especially bursts), usually via retransmission.

**Answer:** D
**Explanation:** Hamming (typical) corrects 1-bit errors; CRC is strong at detection (especially bursts), usually via retransmission.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **error detection** and **error correction**?

- **A.** Detection flags that an error occurred; correction identifies and repairs bit values.
- **B.** They are the same as FDM.
- **C.** Detection always repairs the bits.
- **D.** Correction never needs extra bits.

**Answer:** A
**Explanation:** Detection flags that an error occurred; correction identifies and repairs bit values.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **even parity** and **Hamming SEC code**?

- **A.** Even parity corrects 1 bit always.
- **B.** One parity bit detects (does not correct) odd errors; Hamming SEC uses several parities to correct 1 bit.
- **C.** They are FSK.
- **D.** Hamming uses one parity bit only.

**Answer:** B
**Explanation:** One parity bit detects (does not correct) odd errors; Hamming SEC uses several parities to correct 1 bit.

### Q56  ·  Difficult
**Question:** Which statement about **Burst error** is FALSE?

- **A.** In this module, Burst error is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Burst error is that it is not the same as “Exactly one flipped bit”.
- **C.** A burst error cannot span more than one bit by definition.
- **D.** Burst error is correctly understood as: two or more consecutive bits are corrupted (length measured from first to last error).

**Answer:** C
**Explanation:** The false claim is: A burst error cannot span more than one bit by definition.. Burst error actually means: Two or more consecutive bits are corrupted (length measured from first to last error).

### Q57  ·  Difficult
**Question:** Which statement about **Cyclic code** is FALSE?

- **A.** A useful way to remember Cyclic code is that it is not the same as “A code with no algebraic shift property”.
- **B.** In this module, Cyclic code is a core idea students must distinguish from nearby terms.
- **C.** Cyclic codes cannot be used for CRC.
- **D.** Cyclic code is correctly understood as: a linear code where a cyclic shift of a codeword is also a codeword; CRC codes are cyclic.

**Answer:** C
**Explanation:** The false claim is: Cyclic codes cannot be used for CRC.. Cyclic code actually means: A linear code where a cyclic shift of a codeword is also a codeword; CRC codes are cyclic.

### Q58  ·  Difficult
**Question:** Which statement about **Error detection capability** is FALSE?

- **A.** A useful way to remember Error detection capability is that it is not the same as “It can always correct dmin errors”.
- **B.** Detection capability is s = dmin + 1.
- **C.** In this module, Error detection capability is a core idea students must distinguish from nearby terms.
- **D.** Error detection capability is correctly understood as: a code with dmin can detect up to s = dmin − 1 errors.

**Answer:** B
**Explanation:** The false claim is: Detection capability is s = dmin + 1.. Error detection capability actually means: A code with dmin can detect up to s = dmin − 1 errors.

### Q59  ·  Difficult
**Question:** Which statement about **Generator polynomial** is FALSE?

- **A.** In this module, Generator polynomial is a core idea students must distinguish from nearby terms.
- **B.** Generator polynomial is correctly understood as: the divisor polynomial G(x) that defines a CRC; remainder length is deg(G).
- **C.** A useful way to remember Generator polynomial is that it is not the same as “The IPv4 source address”.
- **D.** The generator polynomial is the Hamming dmin of IPv6.

**Answer:** D
**Explanation:** The false claim is: The generator polynomial is the Hamming dmin of IPv6.. Generator polynomial actually means: The divisor polynomial G(x) that defines a CRC; remainder length is deg(G).

### Q60  ·  Difficult
**Question:** Which statement about **Hamming distance** is FALSE?

- **A.** Hamming distance is the voltage of AMI pulses.
- **B.** In this module, Hamming distance is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Hamming distance is that it is not the same as “The Euclidean distance of QAM points only”.
- **D.** Hamming distance is correctly understood as: the number of bit positions in which two words differ.

**Answer:** A
**Explanation:** The false claim is: Hamming distance is the voltage of AMI pulses.. Hamming distance actually means: The number of bit positions in which two words differ.

### Q61  ·  Difficult
**Question:** Which statement about **Linear block code** is FALSE?

- **A.** A useful way to remember Linear block code is that it is not the same as “A nonlinear mapping with no algebraic structure”.
- **B.** In this module, Linear block code is a core idea students must distinguish from nearby terms.
- **C.** Linear codes cannot include the all-zero codeword.
- **D.** Linear block code is correctly understood as: a block code closed under XOR; the XOR of two codewords is a codeword (including the all-zero word).

**Answer:** C
**Explanation:** The false claim is: Linear codes cannot include the all-zero codeword.. Linear block code actually means: A block code closed under XOR; the XOR of two codewords is a codeword (including the all-zero word).

### Q62  ·  Difficult
**Question:** Which statement about **Parity bit** is FALSE?

- **A.** Parity bit is correctly understood as: an extra bit chosen so that the number of 1s is even (even parity) or odd (odd parity).
- **B.** A parity bit can correct two random errors by itself.
- **C.** A useful way to remember Parity bit is that it is not the same as “A bit that always equals 0”.
- **D.** In this module, Parity bit is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: A parity bit can correct two random errors by itself.. Parity bit actually means: An extra bit chosen so that the number of 1s is even (even parity) or odd (odd parity).

### Q63  ·  Difficult
**Question:** Which statement about **Syndrome** is FALSE?

- **A.** In this module, Syndrome is a core idea students must distinguish from nearby terms.
- **B.** A zero syndrome always means two errors occurred.
- **C.** Syndrome is correctly understood as: in Hamming decoding, the pattern of parity checks that indicates the error bit position (or 0 if none).
- **D.** A useful way to remember Syndrome is that it is not the same as “The T1 framing bit”.

**Answer:** B
**Explanation:** The false claim is: A zero syndrome always means two errors occurred.. Syndrome actually means: In Hamming decoding, the pattern of parity checks that indicates the error bit position (or 0 if none).

### Q64  ·  Difficult
**Question:** Why can a CRC with remainder 0 still miss an error?

- **A.** An error polynomial divisible by G(x) is undetectable
- **B.** Remainder 0 means two errors always
- **C.** G(x) is Hamming dmin
- **D.** CRC never misses errors

**Answer:** A
**Explanation:** Undetected errors are those in the code ideal of G(x).

### Q65  ·  Difficult
**Question:** Why is CRC popular on links compared with simple parity?

- **A.** Much stronger burst detection for a few remainder bits
- **B.** CRC always corrects 10-bit errors
- **C.** Parity detects all bursts of length 32
- **D.** CRC replaces routing

**Answer:** A
**Explanation:** Cyclic codes detect many burst patterns cheaply.

---

## Quick answer key

Q01–C | Q02–A | Q03–A | Q04–C | Q05–C | Q06–D | Q07–A | Q08–B | Q09–C | Q10–D | Q11–C | Q12–D | Q13–B | Q14–A | Q15–C | Q16–A | Q17–C | Q18–A | Q19–C | Q20–C | Q21–A | Q22–A | Q23–B | Q24–B | Q25–C | Q26–D | Q27–D | Q28–B | Q29–D | Q30–D | Q31–A | Q32–C | Q33–A | Q34–C | Q35–C | Q36–B | Q37–B | Q38–A | Q39–C | Q40–A | Q41–A | Q42–C | Q43–C | Q44–B | Q45–C | Q46–A | Q47–D | Q48–C | Q49–B | Q50–C | Q51–A | Q52–A | Q53–D | Q54–A | Q55–B | Q56–C | Q57–C | Q58–B | Q59–D | Q60–A | Q61–C | Q62–B | Q63–B | Q64–A | Q65–A
