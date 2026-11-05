# Electrodynamics

## 00:00 — Two surfaces, one magnetic circulation

Picture a capacitor being charged. Current flows in the wire, but no conduction charge crosses the vacuum gap. Now draw a loop around the wire. A flat surface through that loop cuts the wire. A curved surface with the same edge can pass through the gap instead. Can these surfaces give two different values for the same magnetic circulation? This puzzle takes us from Maxwell's equations all the way to an optical coating.

## 00:24 — Keep the boundary fixed

The magnetic circulation is an integral along the loop. It has one value once we fix the direction of travel. Match each surface normal to that direction by the right hand rule. Ampere's original magnetostatic equation counts the conduction current through the surface. The wire surface counts current. The gap surface does not. A charging circuit lies outside the assumptions of magnetostatics.

## 00:51 — Predict the missing term

Pause and choose. In the ideal vacuum gap, is the electric flux fixed, does it change so that epsilon zero times its rate of change equals the lead current, or do electrons carry that current through the vacuum? Sketch the two surfaces before choosing. Think about what happens to the charge on the plates during charging.

## 01:16 — The changing flux closes the budget

The changing flux supplies the missing term. In the parallel plate approximation, the electric flux across the gap is the plate charge divided by epsilon zero. Differentiate with respect to time. The result, multiplied by epsilon zero, is the rate at which charge arrives. Maxwell's correction makes the surface choice consistent. Displacement current has units of amperes. In this gap it describes a changing field without a flow of charge carriers.

## 01:44 — A changing magnetic field drives circulation

Now drive current up a long solenoid. Take the magnetic field inside to point along positive z and grow steadily. Outside, approximate the magnetic field as zero. Place an imaginary circle around the coil, without adding a conductor. Faraday's law relates the electric circulation around that circle to the rate of change of magnetic flux through its disk.

## 02:06 — Flux depends on the field-filled area

Cylindrical symmetry makes the induced electric field azimuthal in this idealization. The disk flux uses only the part of the disk where the magnetic field exists. For a circle inside the coil, that area grows as radius squared. Outside the coil, it saturates at the coil's cross section. The circumference keeps growing, however. Divide the rate of flux change by that circumference.

## 02:30 — Predict outside the solenoid

The positive z magnetic field is increasing. The magnetic field outside is negligible. From the positive z side, which way does the induced electric field circulate outside? Choose clockwise, counterclockwise, or zero. Decide whether the local field or the flux through the entire disk enters Faraday's law.

## 02:56 — A field can circulate where its curl vanishes

The electric field points clockwise. Positive flux increases, so circulation is negative for the counterclockwise orientation. Beyond the coil radius, its magnitude decreases inversely with radius. The field can be nonzero even where its local curl vanishes. Outside the coil, a spanning disk for a loop encircling the axis also includes the interior. This distinction between local and integral statements is worth slowing down for.

## 03:24 — From local rotation to a boundary integral

Curl measures circulation per area in the small-loop limit. To see how local curls build up, imagine tiling a disk with tiny oriented loops. On shared edges, neighboring loops traverse the same edge in opposite directions. Those contributions cancel. Summing all of the little loops leaves circulation along the outside boundary.

## 03:45 — Shrink a loop without crossing the coil

Take a tiny disk in the exterior that does not enclose the solenoid. Its normal is still along positive z. The changing magnetic flux through that disk is zero in this model. Yet a probe at a point on the disk detects a nonzero induced electric field. A curl measurement compares contributions around the whole small loop. It is different from a point measurement of the field.

## 04:09 — Predict the small-loop result

For the small exterior disk, which statement is required? Its electric circulation vanishes, the electric field vanishes everywhere along its edge, or the circulation equals that of the larger loop surrounding the coil? Choose an answer and explain how the result depends on which region the disk spans.

## 04:32 — Use orientation consistently

The small-loop circulation vanishes. The field contributions cancel in the line integral. In differential form, the curl of the electric field equals minus the time derivative of the magnetic field. Integrate this relation over the oriented surface, then apply Stokes' theorem. Reversing the chosen normal reverses the loop direction and both sides change sign together.

## 04:55 — Charge has a local budget

Charge conservation gives a useful diagnostic. Choose a fixed volume. Count the charge inside, and count the current leaving through its closed surface. If more charge flows out than in, the stored charge falls. The divergence theorem converts the outward flux into a volume integral of the divergence. Since the choice of volume is arbitrary, we obtain the local continuity equation.

## 05:19 — A varying current density can be divergence-free

In a straight steady conductor that narrows, the same current passes through every cross section, while the average current density increases in the narrow section. A plot of that axial average can slope upward. It is not the three-dimensional divergence. Near a taper the current field can have transverse components, and an insulating wall contributes no outward charge flux.

## 05:41 — Predict at a steady constriction

Suppose the lead current is steady and the conductor's sides are insulated. Through a volume that spans the constriction, is the net outward current positive, negative, or zero? Draw arrows for the two end faces and label the outward normals. Decide whether a higher current density implies a higher current.

## 06:05 — Continuity also checks Maxwell's correction

The net flux is zero. The same current enters and leaves, so charge does not accumulate. Now take the divergence of the Ampere-Maxwell equation. The divergence of the left hand curl vanishes identically. Gauss's law turns the divergence of the changing electric field term into the time derivative of charge density. What remains on the right is the continuity equation.

## 06:29 — Follow energy through the gap

The capacitor stores electric field energy as it charges. How does that energy reach the gap? Take the electric field to point up, along positive z. In a circular capacitor, the magnetic field in the gap points around the axis in the positive azimuthal direction. The cross product of the electric and magnetic fields points radially inward.

## 06:50 — Balance flux against field energy

Poynting's theorem follows by dotting the curl equations with the appropriate fields and using the divergence identity for a cross product. The result separates the rate of change of field energy, the outward energy flux and the rate at which fields do work on matter. In the vacuum gap, the work term is zero. For this quasistatic example, the leading change is the electric energy.

## 07:13 — Predict the sign of outward power

For the gap volume, what is the sign of the outward electromagnetic power through its curved side during charging? Choose positive, zero, or negative. Use the outward normal, not the direction in which you happen to draw the integration arrow. Then ask how this sign relates to the growing electric energy.

## 07:37 — The inward power equals V times I

The outward power is negative. Integrate the radial Poynting flux over the cylindrical side. Using the Ampere-Maxwell field at the rim, the inward power is voltage times current. Independently, differentiate one half times capacitance times voltage squared. It gives the same power. In the lab you will check both calculations and estimate when neglecting changing magnetic energy and edge fringing is reasonable.

## 08:03 — At an interface, match both tangential fields

Move from slowly changing fields to a traveling plane wave. Its electric and magnetic fields are transverse. The ratio of electric field to magnetic field intensity is the wave impedance. At a plane interface, match tangential electric and magnetic fields. For the reflected wave the magnetic field changes sign relative to the electric field, because the propagation direction reverses.

## 08:28 — Amplitudes and powers are different

Take two linear lossless nonmagnetic media. The impedance is the vacuum impedance divided by refractive index. Solve the two matching equations for the reflected and transmitted electric amplitudes. To compute average power, square the electric amplitude and divide by twice the impedance. A transmitted amplitude of one half, for example, does not by itself tell you the fraction of power transmitted.

## 08:53 — Predict reflection phase

Send a wave from index one into index one point five at normal incidence. Relative to the incident electric field at the interface, does the reflected electric field have a minus sign, a plus sign, or zero amplitude? Choose before solving. Use both matching conditions and keep the forward and backward magnetic field signs separate.

## 09:19 — Check the answer with power conservation

The reflected electric amplitude has a minus sign, giving a phase reversal at the interface. The reflected power fraction is four percent. The transmitted electric amplitude is zero point eight, while transmitted power is ninety-six percent. The impedance factor makes the difference. Check both field residuals and power conservation; either check alone can miss a mistake.

## 09:42 — Add a layer and track propagation phase

Now put a transparent film between air and glass. Reflection can come from both boundaries, and the field travels through the film in both directions. A film a quarter wavelength thick gives a half-cycle of round-trip phase. To cancel reflection completely at the design wavelength, the returning amplitudes must also balance. Thickness sets phase. Impedance sets the amplitude matching.

## 10:05 — Design at one wavelength

For nonmagnetic lossless media at normal incidence, choose the film index as the geometric mean of the outer indices. Set thickness to the vacuum design wavelength divided by four times that film index. This ideal match eliminates reflection at the design wavelength. A finite spectral band, material dispersion, absorption, or oblique incidence changes the result.

## 10:30 — Predict what detuning changes

Change the illumination wavelength while holding film thickness and indices fixed. Does the cancellation generally remain exact, does reflected power generally return, or is all incident power now absorbed? Think about the phase accrued in one traversal. State which assumptions exclude energy loss before choosing.

## 10:55 — Design, test, and critique a coating

Reflected power generally returns. The physical film stays the same, but its optical phase changes with wavelength. In the Python lab, compare a boundary-matching solver with a separate multiple-reflection formula. Then design a coating for a new substrate and report how thickness tolerance shifts the reflectance curve. Explain what a real experiment would need to measure, and which conclusion would fail first if your assumptions changed.
