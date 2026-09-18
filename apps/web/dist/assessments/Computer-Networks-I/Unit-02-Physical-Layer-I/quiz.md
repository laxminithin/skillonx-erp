# Quiz — Computer Networks-I — Unit 2: Physical Layer-I

**Subject:** Computer Networks-I  
**Module:** Unit 2 — Physical Layer-I  
**Questions:** 65  
**Mix:** 11 Easy · 31 Intermediate · 23 Difficult  
**Type:** Multiple choice (single correct option)  
**Instructions:** Choose the best option. Answers and short explanations follow each question.

---

### Q01  ·  Easy
**Question:** Nyquist bit rate for a noiseless channel is:

- **A.** C = 2 B log2(L)
- **B.** C = B log2(1+SNR)
- **C.** C = 1/(2e)
- **D.** C = 2^r − 1

**Answer:** A
**Explanation:** Noiseless multilevel formula is Nyquist.

### Q02  ·  Easy
**Question:** PCM consists of:

- **A.** Token passing and CSMA
- **B.** CRC and Hamming only
- **C.** Sampling, quantization and encoding
- **D.** IPv4 NAT only

**Answer:** C
**Explanation:** Classic PCM chain.

### Q03  ·  Easy
**Question:** Shannon capacity is:

- **A.** C = B log2(1+SNR)
- **B.** C = 2 B log2(L)
- **C.** C = W/(1+2a)
- **D.** C = 64 kbps always

**Answer:** A
**Explanation:** Shannon includes noise via SNR.

### Q04  ·  Easy
**Question:** Which option best describes **ASK**?

- **A.** Time-division slot assignment.
- **B.** Changing only the carrier phase.
- **C.** Amplitude Shift Keying: digital data change the amplitude of a carrier.
- **D.** Changing only the carrier frequency.

**Answer:** C
**Explanation:** ASK: Amplitude Shift Keying: digital data change the amplitude of a carrier.

### Q05  ·  Easy
**Question:** Which option best describes **Analog signal**?

- **A.** A stream of only two discrete voltage levels.
- **B.** A CRC remainder.
- **C.** A continuous-time, continuous-amplitude waveform, such as a sine wave.
- **D.** An IPv4 /24 mask.

**Answer:** C
**Explanation:** Analog signal: A continuous-time, continuous-amplitude waveform, such as a sine wave.

### Q06  ·  Easy
**Question:** Which option best describes **Distortion**?

- **A.** Change of signal shape because different frequency components travel at different speeds.
- **B.** TCP slow start.
- **C.** Simple scaling of amplitude with no shape change.
- **D.** A MAC address collision.

**Answer:** A
**Explanation:** Distortion: Change of signal shape because different frequency components travel at different speeds.

### Q07  ·  Easy
**Question:** Which option best describes **Manchester**?

- **A.** A code with no transitions at all.
- **B.** A line code with a transition in the middle of each bit interval (clock + data).
- **C.** Shannon’s noisy formula.
- **D.** ASK with one amplitude.

**Answer:** B
**Explanation:** Manchester: A line code with a transition in the middle of each bit interval (clock + data).

### Q08  ·  Easy
**Question:** Which option best describes **QAM**?

- **A.** Pure FSK with two tones and no I/Q plane.
- **B.** A baseband Manchester-only code.
- **C.** Quadrature Amplitude Modulation: combined amplitude and phase (I and Q) to send multiple bits per symbol.
- **D.** Stop-and-wait ARQ.

**Answer:** C
**Explanation:** QAM: Quadrature Amplitude Modulation: combined amplitude and phase (I and Q) to send multiple bits per symbol.

### Q09  ·  Easy
**Question:** Which option best describes **Shannon capacity**?

- **A.** C = L / B.
- **B.** C = MAC address length.
- **C.** C = 2 B log2(L) for noiseless multilevel signalling.
- **D.** The noisy-channel limit C = B log2(1 + SNR) bits per second.

**Answer:** D
**Explanation:** Shannon capacity: The noisy-channel limit C = B log2(1 + SNR) bits per second.

### Q10  ·  Easy
**Question:** Which sequence correctly describes **PCM digitisation**?

- **A.** Encode → then analog sample the CRC
- **B.** Hop frequencies → token → IP TTL
- **C.** Quantize MAC addresses → FSK → RJ45 colour
- **D.** Filter → sample → quantize → encode

**Answer:** D
**Explanation:** Correct sequence for PCM digitisation: Filter → sample → quantize → encode

### Q11  ·  Easy
**Question:** Which sequence correctly describes **signal travel impairments (typical order of concern)**?

- **A.** Noise first creates the information bits
- **B.** Routing first, then analog sampling of IP
- **C.** Generated signal → attenuation/distortion along path → noise added → received waveform
- **D.** Jitter of HTTP cookies then AMI

**Answer:** C
**Explanation:** Correct sequence for signal travel impairments (typical order of concern): Generated signal → attenuation/distortion along path → noise added → received waveform

### Q12  ·  Intermediate
**Question:** 16-QAM sends how many bits per symbol?

- **A.** 4
- **B.** 16
- **C.** 8
- **D.** 2

**Answer:** A
**Explanation:** log2(16) = 4 bits/symbol.

### Q13  ·  Intermediate
**Question:** A designer has a noiseless 1 MHz channel and may choose many voltage levels. Which formula bounds the bit rate?

- **A.** Nyquist: 2B log2(L)
- **B.** Hamming 2r ≥ m+r+1
- **C.** Shannon with SNR=0 as 0 bps only
- **D.** ALOHA 1/(2e)

**Answer:** A
**Explanation:** Noiseless multilevel signalling is Nyquist.

### Q14  ·  Intermediate
**Question:** A long copper run is quiet but the far-end voltage is much smaller. The impairment is mainly:

- **A.** IPv4 checksum failure
- **B.** Token rotation
- **C.** Attenuation
- **D.** Impulse noise only

**Answer:** C
**Explanation:** Amplitude/power loss with distance is attenuation.

### Q15  ·  Intermediate
**Question:** Ethernet 10BASE-T historically used which line code family for baseband bits?

- **A.** AMI T1 only
- **B.** 256-QAM cable modem only
- **C.** FSK two-tone radio only
- **D.** Manchester

**Answer:** D
**Explanation:** Classic Ethernet used Manchester encoding.

### Q16  ·  Intermediate
**Question:** SNRdB = 10 log10(SNR). If SNRdB = 30, SNR is:

- **A.** 3
- **B.** 10
- **C.** 1000
- **D.** 30

**Answer:** C
**Explanation:** 10^(30/10) = 1000.

### Q17  ·  Intermediate
**Question:** Telephone PCM uses 8000 samples/s. Why that rate?

- **A.** OSI seven layers × 1143
- **B.** Shannon SNR of 8000 dB
- **C.** Nyquist sampling of ~4 kHz voice
- **D.** MAC address of 8000 bits

**Answer:** C
**Explanation:** Nyquist: fs ≥ 2fmax; voice band ≈ 4 kHz.

### Q18  ·  Intermediate
**Question:** What is the most important distinction between **Manchester** and **NRZ-L**?

- **A.** Manchester has a mid-bit transition (better clocking, twice the baud); NRZ-L does not.
- **B.** NRZ-L always has a mid-bit clock edge.
- **C.** They are identical spectra.
- **D.** Manchester uses zero baud.

**Answer:** A
**Explanation:** Manchester has a mid-bit transition (better clocking, twice the baud); NRZ-L does not.

### Q19  ·  Intermediate
**Question:** What is the most important distinction between **Nyquist rate** and **Shannon capacity**?

- **A.** Shannon ignores noise.
- **B.** They always give the same number.
- **C.** Nyquist is noiseless and uses levels L; Shannon is noisy and uses SNR.
- **D.** Nyquist requires SNR in dB.

**Answer:** C
**Explanation:** Nyquist is noiseless and uses levels L; Shannon is noisy and uses SNR.

### Q20  ·  Intermediate
**Question:** What is the most important distinction between **PCM** and **line coding**?

- **A.** PCM is Manchester only.
- **B.** Line coding samples analog voice.
- **C.** PCM digitises analog sources; line coding maps bits to baseband pulses for a link.
- **D.** They are IP routing protocols.

**Answer:** C
**Explanation:** PCM digitises analog sources; line coding maps bits to baseband pulses for a link.

### Q21  ·  Intermediate
**Question:** What is the most important distinction between **analog signal** and **digital signal**?

- **A.** Analog varies continuously in amplitude/time; digital uses discrete levels for bits.
- **B.** Analog signals have only two levels.
- **C.** Digital signals cannot be transmitted on copper.
- **D.** They differ only in cable colour.

**Answer:** A
**Explanation:** Analog varies continuously in amplitude/time; digital uses discrete levels for bits.

### Q22  ·  Intermediate
**Question:** Which line code embeds a clock as a mid-bit transition?

- **A.** NRZ-L
- **B.** Manchester
- **C.** ASK with constant envelope
- **D.** Unipolar NRZ with long zero runs

**Answer:** B
**Explanation:** Manchester transitions in the middle of each bit.

### Q23  ·  Intermediate
**Question:** Which option best describes **AMI**?

- **A.** QPSK on two quadratures.
- **B.** Alternate Mark Inversion: 0 is zero voltage; 1s alternate in polarity.
- **C.** FDM of voice channels.
- **D.** Every bit inverted in the middle like Manchester.

**Answer:** B
**Explanation:** AMI: Alternate Mark Inversion: 0 is zero voltage; 1s alternate in polarity.

### Q24  ·  Intermediate
**Question:** Which option best describes **Attenuation**?

- **A.** Loss of signal amplitude (power) as it travels through a medium.
- **B.** A routing-table timeout.
- **C.** An increase of amplitude with distance.
- **D.** A change only in the colour of insulation.

**Answer:** A
**Explanation:** Attenuation: Loss of signal amplitude (power) as it travels through a medium.

### Q25  ·  Intermediate
**Question:** Which option best describes **Digital signal**?

- **A.** A purely continuous FM radio carrier with no symbols.
- **B.** A signal with a discrete set of levels used to represent bits.
- **C.** An unquantised microphone voltage.
- **D.** A random thermal voltage with infinite levels as the intended code.

**Answer:** B
**Explanation:** Digital signal: A signal with a discrete set of levels used to represent bits.

### Q26  ·  Intermediate
**Question:** Which option best describes **FSK**?

- **A.** Frequency Shift Keying: digital data select among carrier frequencies.
- **B.** Changing only amplitude of one tone.
- **C.** AMI line coding of baseband pulses.
- **D.** QAM constellation on I and Q only, without frequency meaning.

**Answer:** A
**Explanation:** FSK: Frequency Shift Keying: digital data select among carrier frequencies.

### Q27  ·  Intermediate
**Question:** Which option best describes **NRZ-I**?

- **A.** FSK with two frequencies.
- **B.** PCM quantization only.
- **C.** Manchester mid-bit transition coding.
- **D.** A line code that inverts the voltage when a 1 occurs and stays the same for a 0 (typical convention).

**Answer:** D
**Explanation:** NRZ-I: A line code that inverts the voltage when a 1 occurs and stays the same for a 0 (typical convention).

### Q28  ·  Intermediate
**Question:** Which option best describes **NRZ-L**?

- **A.** AMI with forced zeros as pulses.
- **B.** A line code in which the voltage level itself represents the bit (e.g. positive for 0, negative for 1).
- **C.** A code with a mandatory mid-bit transition for every bit.
- **D.** QAM on two carriers.

**Answer:** B
**Explanation:** NRZ-L: A line code in which the voltage level itself represents the bit (e.g. positive for 0, negative for 1).

### Q29  ·  Intermediate
**Question:** Which option best describes **Noise**?

- **A.** The intended information-bearing waveform.
- **B.** The IPv6 hop-limit field.
- **C.** A well-known TCP port.
- **D.** Unwanted energy added to the signal (thermal, induced, crosstalk, impulse).

**Answer:** D
**Explanation:** Noise: Unwanted energy added to the signal (thermal, induced, crosstalk, impulse).

### Q30  ·  Intermediate
**Question:** Which option best describes **Nyquist bit rate**?

- **A.** C = B only, ignoring levels.
- **B.** C = B log2(1+SNR) including noise.
- **C.** For a noiseless channel, C = 2 B log2(L), the maximum bit rate with L signal levels.
- **D.** C = SNR without bandwidth.

**Answer:** C
**Explanation:** Nyquist bit rate: For a noiseless channel, C = 2 B log2(L), the maximum bit rate with L signal levels.

### Q31  ·  Intermediate
**Question:** Which option best describes **PCM**?

- **A.** Frequency hopping of a PN code.
- **B.** Token passing on a ring.
- **C.** IPv4 fragmentation.
- **D.** Pulse Code Modulation: sample, quantize and encode an analog signal into bits.

**Answer:** D
**Explanation:** PCM: Pulse Code Modulation: sample, quantize and encode an analog signal into bits.

### Q32  ·  Intermediate
**Question:** Which option best describes **PSK**?

- **A.** Changing only the DC voltage of NRZ.
- **B.** CRC generator selection.
- **C.** FDM guard-band allocation.
- **D.** Phase Shift Keying: digital data change the phase of a carrier.

**Answer:** D
**Explanation:** PSK: Phase Shift Keying: digital data change the phase of a carrier.

### Q33  ·  Intermediate
**Question:** Which sequence correctly describes **Nyquist vs Shannon use**?

- **A.** If noiseless, apply C=2B log2(L); if noisy, apply C=B log2(1+SNR)
- **B.** Always ignore B
- **C.** Always set L=SNR in dB as bit rate
- **D.** Use ALOHA throughput as channel capacity

**Answer:** A
**Explanation:** Correct sequence for Nyquist vs Shannon use: If noiseless, apply C=2B log2(L); if noisy, apply C=B log2(1+SNR)

### Q34  ·  Intermediate
**Question:** Which sequence correctly describes **digital-to-analog modulation choice**?

- **A.** Map bits to TCP ports only
- **B.** Map bits to IPv4 classes only
- **C.** Map bits to amplitude and/or frequency and/or phase of a carrier (ASK/FSK/PSK/QAM)
- **D.** Map bits to Hamming dmin only

**Answer:** C
**Explanation:** Correct sequence for digital-to-analog modulation choice: Map bits to amplitude and/or frequency and/or phase of a carrier (ASK/FSK/PSK/QAM)

### Q35  ·  Intermediate
**Question:** Which statement about **AMI** is FALSE?

- **A.** AMI is correctly understood as: alternate Mark Inversion: 0 is zero voltage; 1s alternate in polarity.
- **B.** A useful way to remember AMI is that it is not the same as “Every bit inverted in the middle like Manchester”.
- **C.** AMI encodes 0 as a full-amplitude pulse every time.
- **D.** In this module, AMI is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: AMI encodes 0 as a full-amplitude pulse every time.. AMI actually means: Alternate Mark Inversion: 0 is zero voltage; 1s alternate in polarity.

### Q36  ·  Intermediate
**Question:** Which statement about **ASK** is FALSE?

- **A.** A useful way to remember ASK is that it is not the same as “Changing only the carrier frequency”.
- **B.** ASK keeps amplitude fixed and changes only frequency.
- **C.** In this module, ASK is a core idea students must distinguish from nearby terms.
- **D.** ASK is correctly understood as: amplitude Shift Keying: digital data change the amplitude of a carrier.

**Answer:** B
**Explanation:** The false claim is: ASK keeps amplitude fixed and changes only frequency.. ASK actually means: Amplitude Shift Keying: digital data change the amplitude of a carrier.

### Q37  ·  Intermediate
**Question:** Which statement about **Analog signal** is FALSE?

- **A.** An analog signal can take only the values 0 V and 5 V.
- **B.** In this module, Analog signal is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Analog signal is that it is not the same as “A stream of only two discrete voltage levels”.
- **D.** Analog signal is correctly understood as: a continuous-time, continuous-amplitude waveform, such as a sine wave.

**Answer:** A
**Explanation:** The false claim is: An analog signal can take only the values 0 V and 5 V.. Analog signal actually means: A continuous-time, continuous-amplitude waveform, such as a sine wave.

### Q38  ·  Intermediate
**Question:** Which statement about **Attenuation** is FALSE?

- **A.** Attenuation is correctly understood as: loss of signal amplitude (power) as it travels through a medium.
- **B.** In this module, Attenuation is a core idea students must distinguish from nearby terms.
- **C.** Attenuation always increases amplitude along a fibre.
- **D.** A useful way to remember Attenuation is that it is not the same as “A change only in the colour of insulation”.

**Answer:** C
**Explanation:** The false claim is: Attenuation always increases amplitude along a fibre.. Attenuation actually means: Loss of signal amplitude (power) as it travels through a medium.

### Q39  ·  Intermediate
**Question:** Which statement about **NRZ-I** is FALSE?

- **A.** NRZ-I is identical to Manchester encoding.
- **B.** In this module, NRZ-I is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember NRZ-I is that it is not the same as “Manchester mid-bit transition coding”.
- **D.** NRZ-I is correctly understood as: a line code that inverts the voltage when a 1 occurs and stays the same for a 0 (typical convention).

**Answer:** A
**Explanation:** The false claim is: NRZ-I is identical to Manchester encoding.. NRZ-I actually means: A line code that inverts the voltage when a 1 occurs and stays the same for a 0 (typical convention).

### Q40  ·  Intermediate
**Question:** Which statement about **Noise** is FALSE?

- **A.** Noise is correctly understood as: unwanted energy added to the signal (thermal, induced, crosstalk, impulse).
- **B.** A useful way to remember Noise is that it is not the same as “The intended information-bearing waveform”.
- **C.** Noise is the useful message itself.
- **D.** In this module, Noise is a core idea students must distinguish from nearby terms.

**Answer:** C
**Explanation:** The false claim is: Noise is the useful message itself.. Noise actually means: Unwanted energy added to the signal (thermal, induced, crosstalk, impulse).

### Q41  ·  Intermediate
**Question:** Which statement about **PSK** is FALSE?

- **A.** PSK never uses a sinusoidal carrier.
- **B.** A useful way to remember PSK is that it is not the same as “Changing only the DC voltage of NRZ”.
- **C.** PSK is correctly understood as: phase Shift Keying: digital data change the phase of a carrier.
- **D.** In this module, PSK is a core idea students must distinguish from nearby terms.

**Answer:** A
**Explanation:** The false claim is: PSK never uses a sinusoidal carrier.. PSK actually means: Phase Shift Keying: digital data change the phase of a carrier.

### Q42  ·  Intermediate
**Question:** Which statement about **Shannon capacity** is FALSE?

- **A.** In this module, Shannon capacity is a core idea students must distinguish from nearby terms.
- **B.** Shannon capacity ignores SNR completely.
- **C.** Shannon capacity is correctly understood as: the noisy-channel limit C = B log2(1 + SNR) bits per second.
- **D.** A useful way to remember Shannon capacity is that it is not the same as “C = 2 B log2(L) for noiseless multilevel signalling”.

**Answer:** B
**Explanation:** The false claim is: Shannon capacity ignores SNR completely.. Shannon capacity actually means: The noisy-channel limit C = B log2(1 + SNR) bits per second.

### Q43  ·  Difficult
**Question:** A link must recover clock from the data with frequent transitions. Which code helps more?

- **A.** Unmodulated DC
- **B.** Long runs of NRZ-L zeros with no edges
- **C.** Manchester (mid-bit transition every bit)
- **D.** IPv6 flow label

**Answer:** C
**Explanation:** Manchester guarantees a transition each bit interval.

### Q44  ·  Difficult
**Question:** A modem maps 4 bits onto one I/Q symbol using amplitude and phase. The scheme is:

- **A.** 16-QAM
- **B.** Binary ASK only
- **C.** NRZ-L
- **D.** Pure FSK with 2 frequencies

**Answer:** A
**Explanation:** 16-QAM has 16 constellation points = 4 bits/symbol.

### Q45  ·  Difficult
**Question:** A noiseless 4 kHz channel with 2 levels and a noisy 4 kHz channel with SNR = 15 (linear) — compare capacities.

- **A.** Both 4 kbps
- **B.** Both infinite
- **C.** Nyquist 8 kbps; Shannon 4k×log2(16)=16 kbps
- **D.** Nyquist 16 kbps; Shannon 8 kbps

**Answer:** C
**Explanation:** 2B log2(2)=8 kbps; log2(1+15)=4, so 16 kbps. Noise formula can exceed 2-level Nyquist because Shannon allows better signalling, not infinite L at 2 levels.

### Q46  ·  Difficult
**Question:** A square pulse arrives rounded because the cable is band-limited. This is:

- **A.** A MAC broadcast storm
- **B.** Distortion (dispersion of frequency components)
- **C.** TCP SACK only
- **D.** DNS NXDOMAIN

**Answer:** B
**Explanation:** Shape change from frequency-dependent delay/gain is distortion.

### Q47  ·  Difficult
**Question:** Binary Manchester at 10 Mbps. Baud rate (signal elements/s)?

- **A.** 10 Mbaud
- **B.** 20 Mbaud
- **C.** 5 Mbaud
- **D.** 2.5 Mbaud

**Answer:** B
**Explanation:** Manchester uses two signal elements per bit, so baud = 2 × bit rate.

### Q48  ·  Difficult
**Question:** If SNR = 100, what is SNRdB?

- **A.** 20 dB
- **B.** 10 dB
- **C.** 100 dB
- **D.** 2 dB

**Answer:** A
**Explanation:** SNRdB = 10 log10(100) = 20 dB.

### Q49  ·  Difficult
**Question:** Nyquist: a noiseless 3 kHz channel uses 4 signal levels. Maximum bit rate?

- **A.** 3 kbps
- **B.** 6 kbps
- **C.** 12 kbps
- **D.** 24 kbps

**Answer:** C
**Explanation:** C = 2B log2(L) = 2×3000×log2(4) = 12000 bps.

### Q50  ·  Difficult
**Question:** Nyquist: noiseless 4 kHz channel, L = 8 levels. Maximum bit rate?

- **A.** 4 kbps
- **B.** 64 kbps
- **C.** 24 kbps
- **D.** 8 kbps

**Answer:** C
**Explanation:** C = 2×4000×3 = 24000 bps.

### Q51  ·  Difficult
**Question:** PCM for 4 kHz voice, sampled at Nyquist rate with 8 bits/sample. Bit rate?

- **A.** 8 kbps
- **B.** 32 kbps
- **C.** 4 kbps
- **D.** 64 kbps

**Answer:** D
**Explanation:** fs = 8 kHz; R = 8000×8 = 64 kbps (DS0).

### Q52  ·  Difficult
**Question:** Shannon: B = 3 kHz, SNR = 30 dB. Approximate capacity?

- **A.** ≈ 29.9 kbps
- **B.** 30 bps
- **C.** 3 kbps
- **D.** 90 kbps

**Answer:** A
**Explanation:** SNR = 10^(30/10) = 1000; C = 3000 log2(1001) ≈ 29902 bps.

### Q53  ·  Difficult
**Question:** The same 1 MHz channel has SNR = 20 dB. Which formula now sets the true upper bound?

- **A.** Shannon C = B log2(1+SNR)
- **B.** Nyquist with L=∞ giving infinite rate regardless of noise
- **C.** IPv4 /8 host count
- **D.** Stop-and-wait 1/(1+2a)

**Answer:** A
**Explanation:** Noise makes Shannon the information-theoretic cap.

### Q54  ·  Difficult
**Question:** What is the most important distinction between **ASK** and **PSK**?

- **A.** PSK changes only amplitude.
- **B.** ASK encodes bits in amplitude; PSK encodes bits in phase.
- **C.** They are both PCM sampling theorems.
- **D.** ASK changes only phase.

**Answer:** B
**Explanation:** ASK encodes bits in amplitude; PSK encodes bits in phase.

### Q55  ·  Difficult
**Question:** What is the most important distinction between **NRZ-L** and **NRZ-I**?

- **A.** NRZ-I is FSK.
- **B.** They are QAM constellations.
- **C.** They are both Manchester.
- **D.** NRZ-L maps level to bit; NRZ-I maps inversion-on-1 (typical) to bit.

**Answer:** D
**Explanation:** NRZ-L maps level to bit; NRZ-I maps inversion-on-1 (typical) to bit.

### Q56  ·  Difficult
**Question:** What is the most important distinction between **attenuation** and **distortion**?

- **A.** Attenuation is amplitude loss; distortion is shape change from delay spread across frequencies.
- **B.** Attenuation is a transport-layer port.
- **C.** Distortion is only thermal noise.
- **D.** They are the same phenomenon.

**Answer:** A
**Explanation:** Attenuation is amplitude loss; distortion is shape change from delay spread across frequencies.

### Q57  ·  Difficult
**Question:** Which statement about **Digital signal** is FALSE?

- **A.** In this module, Digital signal is a core idea students must distinguish from nearby terms.
- **B.** A useful way to remember Digital signal is that it is not the same as “A purely continuous FM radio carrier with no symbols”.
- **C.** A digital signal must be a perfect sinusoid.
- **D.** Digital signal is correctly understood as: a signal with a discrete set of levels used to represent bits.

**Answer:** C
**Explanation:** The false claim is: A digital signal must be a perfect sinusoid.. Digital signal actually means: A signal with a discrete set of levels used to represent bits.

### Q58  ·  Difficult
**Question:** Which statement about **Distortion** is FALSE?

- **A.** Distortion is identical to attenuation.
- **B.** In this module, Distortion is a core idea students must distinguish from nearby terms.
- **C.** A useful way to remember Distortion is that it is not the same as “Simple scaling of amplitude with no shape change”.
- **D.** Distortion is correctly understood as: change of signal shape because different frequency components travel at different speeds.

**Answer:** A
**Explanation:** The false claim is: Distortion is identical to attenuation.. Distortion actually means: Change of signal shape because different frequency components travel at different speeds.

### Q59  ·  Difficult
**Question:** Which statement about **FSK** is FALSE?

- **A.** In this module, FSK is a core idea students must distinguish from nearby terms.
- **B.** FSK is identical to NRZ-L baseband.
- **C.** FSK is correctly understood as: frequency Shift Keying: digital data select among carrier frequencies.
- **D.** A useful way to remember FSK is that it is not the same as “Changing only amplitude of one tone”.

**Answer:** B
**Explanation:** The false claim is: FSK is identical to NRZ-L baseband.. FSK actually means: Frequency Shift Keying: digital data select among carrier frequencies.

### Q60  ·  Difficult
**Question:** Which statement about **Manchester** is FALSE?

- **A.** Manchester is correctly understood as: a line code with a transition in the middle of each bit interval (clock + data).
- **B.** Manchester uses one baud per bit and no mid-bit transition.
- **C.** A useful way to remember Manchester is that it is not the same as “A code with no transitions at all”.
- **D.** In this module, Manchester is a core idea students must distinguish from nearby terms.

**Answer:** B
**Explanation:** The false claim is: Manchester uses one baud per bit and no mid-bit transition.. Manchester actually means: A line code with a transition in the middle of each bit interval (clock + data).

### Q61  ·  Difficult
**Question:** Which statement about **NRZ-L** is FALSE?

- **A.** A useful way to remember NRZ-L is that it is not the same as “A code with a mandatory mid-bit transition for every bit”.
- **B.** In this module, NRZ-L is a core idea students must distinguish from nearby terms.
- **C.** NRZ-L always inverts on every 1 and never uses levels for values.
- **D.** NRZ-L is correctly understood as: a line code in which the voltage level itself represents the bit (e.g. positive for 0, negative for 1).

**Answer:** C
**Explanation:** The false claim is: NRZ-L always inverts on every 1 and never uses levels for values.. NRZ-L actually means: A line code in which the voltage level itself represents the bit (e.g. positive for 0, negative for 1).

### Q62  ·  Difficult
**Question:** Which statement about **Nyquist bit rate** is FALSE?

- **A.** A useful way to remember Nyquist bit rate is that it is not the same as “C = B log2(1+SNR) including noise”.
- **B.** Nyquist’s formula already includes thermal noise SNR.
- **C.** In this module, Nyquist bit rate is a core idea students must distinguish from nearby terms.
- **D.** Nyquist bit rate is correctly understood as: for a noiseless channel, C = 2 B log2(L), the maximum bit rate with L signal levels.

**Answer:** B
**Explanation:** The false claim is: Nyquist’s formula already includes thermal noise SNR.. Nyquist bit rate actually means: For a noiseless channel, C = 2 B log2(L), the maximum bit rate with L signal levels.

### Q63  ·  Difficult
**Question:** Which statement about **PCM** is FALSE?

- **A.** In this module, PCM is a core idea students must distinguish from nearby terms.
- **B.** PCM is correctly understood as: pulse Code Modulation: sample, quantize and encode an analog signal into bits.
- **C.** A useful way to remember PCM is that it is not the same as “Frequency hopping of a PN code”.
- **D.** PCM is a data-link ARQ protocol.

**Answer:** D
**Explanation:** The false claim is: PCM is a data-link ARQ protocol.. PCM actually means: Pulse Code Modulation: sample, quantize and encode an analog signal into bits.

### Q64  ·  Difficult
**Question:** Which statement about **QAM** is FALSE?

- **A.** A useful way to remember QAM is that it is not the same as “A baseband Manchester-only code”.
- **B.** In this module, QAM is a core idea students must distinguish from nearby terms.
- **C.** QAM can encode only one bit per symbol by definition.
- **D.** QAM is correctly understood as: quadrature Amplitude Modulation: combined amplitude and phase (I and Q) to send multiple bits per symbol.

**Answer:** C
**Explanation:** The false claim is: QAM can encode only one bit per symbol by definition.. QAM actually means: Quadrature Amplitude Modulation: combined amplitude and phase (I and Q) to send multiple bits per symbol.

### Q65  ·  Difficult
**Question:** Why can Shannon capacity not be exceeded by choosing huge L in Nyquist’s formula?

- **A.** Noise prevents reliable distinction of arbitrarily close levels
- **B.** SNR is always zero
- **C.** Fibre cannot carry analog carriers
- **D.** Nyquist forbids L>2 by law

**Answer:** A
**Explanation:** Close levels drown in noise; Shannon is the bound.

---

## Quick answer key

Q01–A | Q02–C | Q03–A | Q04–C | Q05–C | Q06–A | Q07–B | Q08–C | Q09–D | Q10–D | Q11–C | Q12–A | Q13–A | Q14–C | Q15–D | Q16–C | Q17–C | Q18–A | Q19–C | Q20–C | Q21–A | Q22–B | Q23–B | Q24–A | Q25–B | Q26–A | Q27–D | Q28–B | Q29–D | Q30–C | Q31–D | Q32–D | Q33–A | Q34–C | Q35–C | Q36–B | Q37–A | Q38–C | Q39–A | Q40–C | Q41–A | Q42–B | Q43–C | Q44–A | Q45–C | Q46–B | Q47–B | Q48–A | Q49–C | Q50–C | Q51–D | Q52–A | Q53–A | Q54–B | Q55–D | Q56–A | Q57–C | Q58–A | Q59–B | Q60–B | Q61–C | Q62–B | Q63–D | Q64–C | Q65–A
