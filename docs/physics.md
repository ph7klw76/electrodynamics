# Model scope and independent checks

This is a short module on selected E&M II ideas. It uses SI throughout.
Symbols in the lecture and notebooks refer to the same models in
`course/physics.py`. The animation geometry is schematic, and the lab data
are simulated. The motion graphics use prediction panels before the answers
and model-derived diagrams after the reveal.

| Checkpoint | Model and assumptions | Independent check or learner action |
|---|---|---|
| Q1. Two surfaces | Vacuum circular capacitor, quasistatic ramp; plate separation small compared with radius. E = V/g, C = ε₀πa²/g. | Gauss's law yields ε₀ dΦ_E/dt = I in the ideal gap. Compare against the conduction surface. |
| Q2. Induction | Infinite solenoid with uniform axial B(t) inside radius a; B = 0 outside. Eφ = −Ḃ min(r,a)²/(2r), with axis limit zero. | Integrate disk flux numerically. Compare inner/outer regimes and the continuous limiting value at r = a. |
| Q3. Stokes | Contour orientation uses right-hand convention. The exterior small loop misses the coil. | Integrate E along discrete closed paths, one around the axis and one entirely outside. Compare with the two flux derivatives. |
| Q4. Continuity | A synthetic insulated taper a(z)=a₀ exp(−z/L), j_z = I/(πa²), j_r = −r j_z/L. | Check tangent wall flux and numerically differentiate both divergence terms. This construction illustrates continuity, without a claim that it satisfies material-specific Ohm's law. |
| Q5. Poynting flux | S = E × H, with side flux in a parallel-plate approximation. Magnetic-energy change and fringing are neglected at leading order. | Compare the side integral with a finite difference of CV²/2. For 10 V and 2 mA the outward power is −20 mW. |
| Q6. Bare interface | Plane waves at normal incidence in isotropic, lossless, nonmagnetic media; no free surface current. Z = Z₀/n. | Independently solve both boundary equations. Check r=−0.2, t=0.8, R=4% and T=96% for air to n=1.5. |
| Q7. Layer | Same optical assumptions and a uniform film. Phasors use exp(i k z − i ω t). Physical thickness is in metres. | Compare the four-equation solve with a multiple-reflection sum, check power and zero-thickness limits, and bracket sensitivity to thickness. |

The exact matched index for a film between index 1 and index 1.5 is √1.5.
At a 550 nm vacuum wavelength, the ideal thickness is about 112.27 nm.
A fixed quarter-wave layer reflects again when detuned, except at other
discrete phase matches under the nondispersive idealization.

The unfamiliar transfer task asks students to optimize worst-case reflectance
over a band and manufacturing tolerance for an index-2.25 substrate, verify the
result independently, and explain what an experiment would need to measure.

Scientific background [MIT 8.02T Electricity and Magnetism lecture notes](https://ocw.mit.edu/courses/8-02t-electricity-and-magnetism-spring-2005/pages/lecture-notes/).
Research context [Baily et al., Phys. Rev. Phys. Educ. Res. 13, 020113 (2017)](https://doi.org/10.1103/PhysRevPhysEducRes.13.020113).

Optical matching reference [MIT 6.974 Classical Electromagnetism and Optics](https://ocw.mit.edu/courses/6-974-fundamentals-of-photonics-quantum-electronics-spring-2006/8e54d1625e9e71eb5b4e4998e6967e4e_chapter2.pdf).
