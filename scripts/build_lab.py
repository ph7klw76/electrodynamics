"""Create the self-contained learner notebook with the exact canonical model."""
from hashlib import sha256
from pathlib import Path

import nbformat as nb

ROOT = Path(__file__).resolve().parents[1]
cells = []
def md(text):
    cells.append(nb.v4.new_markdown_cell(text.strip()))
def code(text):
    cells.append(nb.v4.new_code_cell(text.strip()))

md("""
# Electrodynamics Field Lab

**Level:** Upper-division undergraduate physics. You should be able to use
vector calculus, complex exponentials, SI units and basic NumPy.

Work in order. Predict before running each calculation, compare two routes and
explain any disagreement. Run All uses NumPy and Matplotlib in Python (Pyodide)
or desktop Python. First browser launch needs network access. Download the
notebook to retain your edits.

## Model contract

The capacitor is circular, vacuum-filled and quasistatic. The ideal solenoid is
infinitely long, with a spatially uniform axial field inside and zero field
outside. The taper demonstrates conservation with a synthetic current field.
Optical media are linear, homogeneous, lossless, isotropic and nonmagnetic.
Waves are normally incident. Lengths and wavelengths passed to the model are
in metres. Complex fields use exp(i k z − i ω t). All results are predictions.
""")
code("""
import sys
import numpy as np
import matplotlib.pyplot as plt

print("Python runtime:", sys.platform)
""")
source = (ROOT / "course/physics.py").read_text(encoding="utf-8")
md(f"## Canonical model\n\nEmbedded for offline desktop use and browser execution. Model SHA-256 `{sha256(source.encode()).hexdigest()}`.")
code(source)
md("""
## Q1 and Q5 · Compare charge and energy budgets

Predict what happens to the electric field rate when you halve the plate radius
at fixed current. Independently estimate the rate of change of capacitor energy
with a centered difference in time. Which result depends on the gap?
""")
code("""
radius, gap, voltage, current = .05, .001, 10., .002
cap, Ez, dEz, B_rim, power_out = capacitor(radius, gap, voltage, current)
dt = 1e-10
v_before, v_after = voltage - dt*current/cap, voltage + dt*current/cap
power_energy = (.5*cap*v_after**2 - .5*cap*v_before**2)/(2*dt)
print("Gap displacement current (A):", round(EPS0*np.pi*radius**2*dEz, 6))
print("Power out (W), dU_E/dt (W):", round(power_out, 6), round(power_energy, 6))
assert np.isclose(power_out, -power_energy, atol=1e-10)
times = np.linspace(0, 5*dt, 101)
plt.figure(figsize=(6, 3))
plt.plot(times*1e9, .5*cap*(voltage + current*times/cap)**2*1e9)
plt.xlabel("Time (ns)"); plt.ylabel("Electric energy (nJ)")
plt.tight_layout(); plt.show()
""")
md("""
At fixed capacitance and current, reversing the voltage while holding the
current sign fixed reverses the instantaneous energy flux. Explain why.
Estimate the limits of the approximation from the ratios of gap to radius and
field-variation time to light-crossing time. A complete time-dependent solution
also tracks magnetic energy and fringing.
""")
md("""
## Q2 and Q3 · Circulation outside the coil

Predict the sign of the induced field at twice the coil radius for a positive
magnetic ramp. Then integrate E numerically around two circles using segment
midpoints. The small circle lies entirely outside the coil.
""")
code("""
a, rate = .10, 2.0
radii = np.linspace(0, .30, 201)
plt.figure(figsize=(6, 3))
plt.plot(radii, solenoid_e(radii, a, rate), label="Eφ")
plt.axvline(a, linestyle="--", label="Coil radius")
plt.xlabel("Radius (m)"); plt.ylabel("Azimuthal E (V/m)")
plt.legend(); plt.tight_layout(); plt.show()

def loop_integral(center_x, radius, steps):
    angles = np.linspace(0, 2*np.pi, steps+1)
    xy = np.column_stack((center_x + radius*np.cos(angles), radius*np.sin(angles)))
    mid = (xy[:-1] + xy[1:])/2
    r = np.linalg.norm(mid, axis=1)
    azimuth = np.column_stack((-mid[:,1], mid[:,0]))/r[:,None]
    return np.sum(solenoid_e(r,a,rate)[:,None]*azimuth*np.diff(xy,axis=0))

large = loop_integral(0, 2*a, 2048)
small = loop_integral(2*a, .25*a, 2048)
print("Large and exterior-small circulation (V):", f"{large:.6f}, {small:.6f}")
assert np.isclose(large, -np.pi*a*a*rate, atol=2e-7)
assert abs(small) < 1e-10
""")
md("""
Flip the ramp sign. Repeat at several discretizations. Explain how a nonzero
field outside the coil can give a zero result around the small loop. Describe
one circumstance where the infinite-solenoid approximation would fail.
""")
md("""
## Q4 · Numerical charge conservation in a taper

An insulated tube narrows with a(z)=a₀ exp(−z/L). The synthetic field is tangent
to the walls. Predict the separate radial and axial contributions to divergence
when the axial current density increases.
""")
code("""
r, z, step = .01, .03, 1e-6
a0, L, I = .03, .1, .004
jr_plus, _ = taper_j(r+step,z,a0,L,I)
jr_minus, _ = taper_j(r-step,z,a0,L,I)
_, jz_plus = taper_j(r,z+step,a0,L,I)
_, jz_minus = taper_j(r,z-step,a0,L,I)
radial = ((r+step)*jr_plus - (r-step)*jr_minus)/(2*step*r)
axial = (jz_plus-jz_minus)/(2*step)
print("Divergence components (A/m³):", round(radial,5), round(axial,5))
assert abs(radial+axial) < 1e-6
zz = np.linspace(0,.1,101)
J = [taper_j(0,p,a0,L,I)[1] for p in zz]
plt.figure(figsize=(6, 3))
plt.plot(zz,J); plt.xlabel("z (m)"); plt.ylabel("Axial current density (A/m²)")
plt.tight_layout(); plt.show()
""")
md("""
## Q6 and Q7 · Compare two independent optical calculations

Predict the sign of the reflected electric field and the energy fractions for
air to glass. Add a matched quarter-wave layer. Verify the boundary solver
against the internal-reflection sum. Change the wavelength and explain which
matching condition is affected by detuning.
""")
code("""
n_in, n_out, design = 1., 1.5, 550e-9
r, t, R, T = interface(n_in,n_out)
print("Bare interface r, t, R, T:", *(round(x, 4) for x in (r,t,R,T)))
assert np.allclose([1+r, n_in*(1-r)], [t, n_out*t])
nf, thickness = quarter_wave(design, n_in, n_out)
wavelengths = np.linspace(400,700,121)*1e-9
spectra = {}
for offset_nm in (-5,0,5):
    d = thickness + offset_nm*1e-9
    curve = []
    for w in wavelengths:
        r, t, R, T = film_matrix(w,d,n_in,nf,n_out)
        assert np.allclose((r,t), film_series(w,d,n_in,nf,n_out), atol=1e-12)
        assert np.isclose(R+T,1)
        curve.append(R)
    spectra[offset_nm] = curve

assert film_matrix(design,thickness,n_in,nf,n_out)[2] < 1e-28
print(f"Matched coating: n={nf:.6f}, d={thickness*1e9:.4f} nm")
plt.figure(figsize=(6, 3))
for offset_nm, curve in spectra.items():
    plt.plot(wavelengths*1e9,100*np.array(curve),label=f"{offset_nm:+d} nm thickness offset")
plt.axvline(design*1e9,color="black",linestyle=":",label="Design wavelength")
plt.xlabel("Vacuum wavelength (nm)"); plt.ylabel("Reflectance (%)")
plt.legend(); plt.tight_layout(); plt.show()
""")
md("""
The ±5 nm curves are a deterministic sensitivity bracket. They carry no
statistical confidence level. Explain how measured thickness and index
distributions would change the uncertainty analysis.
""")
md("""
## Transfer · An unfamiliar substrate

A sensor window has index 2.25. Illumination spans 450–650 nm around a 525 nm
design wavelength. You have a film of index 1.40 and a thickness tolerance of
±8 nm.

1. Derive the perfectly matched index and thickness for the ideal design.
2. For the available film, search plausible thicknesses around its
   quarter-wave value. Propose the one that minimizes the **worst** reflectance
   across the specified band and tolerance interval. Refine the wavelength and
   tolerance grids to check convergence.
3. Compare with the bare substrate. Use the independent solver to verify your
   selected design and the worst-case point. Distinguish absolute reflectance
   from percentage-point changes.
4. Explain how absorption, dispersion, oblique illumination or uncertain
   substrate index would change the model. Propose a measurement that could
   challenge your design.

Submit the derivation, code, labelled plots, comparison and model critique.
The scaffold leaves the design choices to you.
""")
code("""
print("LAB_COMPLETE", sys.platform, "four model plots generated")
""")
book = nb.v4.new_notebook(cells=cells, metadata={
    "kernelspec": {"display_name": "Python (Pyodide)", "language": "python", "name": "python"},
    "language_info": {"name": "python"},
})
for target in ("lab/files", "lab", "website/dist"):
    folder = ROOT / target
    folder.mkdir(parents=True, exist_ok=True)
    nb.write(book, folder / "Electrodynamics_Lab.ipynb")
(ROOT / "lab/jupyter-lite.json").write_text(
    '{"jupyter-config-data":{"appName":"Electrodynamics Field Lab","enableMemoryStorage":true}}\n',
    encoding="utf-8",
)
