"""Create the self-contained learner notebook with the exact canonical model."""
from hashlib import sha256
from pathlib import Path

import nbformat as nb

ROOT = Path(__file__).resolve().parents[1]
cells = []
def md(text, cell_id=None):
    cell = nb.v4.new_markdown_cell(text.strip())
    if cell_id is not None:
        cell.id = cell_id
    cells.append(cell)
def code(text):
    cells.append(nb.v4.new_code_cell(text.strip()))

md("""
# Electrodynamics Field Lab

**Level:** Upper-division undergraduate physics. You should be able to use
vector calculus, complex exponentials, SI units and basic NumPy.

Write your predictions in the Markdown prompts before running the investigations.
Run the import and canonical-model cells once in a fresh kernel. You can then
start with any investigation. If you arrived from a video checkpoint, use the
table of contents to find the setup cells at the top.

| Checkpoints | Investigation |
|---|---|
| Q1 and Q5 | Capacitor charge and energy budgets |
| Q2 and Q3 | Circulation outside the coil |
| Q4 | Charge conservation in a taper |
| Q6 and Q7 | Reflection and a coating |

Run All uses NumPy and Matplotlib in Python (Pyodide) or desktop Python. First
browser launch needs network access. Download the notebook to retain your edits.
""")

md("""
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
setup_cells = cells[1:]
md("""
## Q1 and Q5 · Capacitor charge and energy budgets

Picture two circular plates facing each other across a vacuum gap. Use a loop
around the lead. One surface spanning the loop cuts the wire. A second surface
bulges through the gap. For the energy budget, draw a short cylinder around
the gap with its outward normal pointing radially away from the plates.

> **Predict before running.** At fixed current, what happens to the electric-field
> growth rate if you halve the plate radius? Which way does energy cross the
> cylinder wall while the capacitor charges? Sketch your directions.
>
> **My prediction and reasoning:** …

Compare the lead current to the changing electric flux through the gap. Check
the side power against the energy change from a centered time difference.
""", "capacitor")
code("""
radius, gap, voltage, current = .05, .001, 10., .002
cap, Ez, dEz, B_rim, power_out = capacitor(radius, gap, voltage, current)
dt = 1e-10
v_before, v_after = voltage - dt*current/cap, voltage + dt*current/cap
power_energy = (.5*cap*v_after**2 - .5*cap*v_before**2)/(2*dt)
gap_current = EPS0*np.pi*radius**2*dEz
print(f"Electric-field growth (V/m/s): {dEz:.3g}")
print(f"Lead current and gap displacement current (A): {current:.6g}, {gap_current:.6g}")
print("Power out (W), dU_E/dt (W):", round(power_out, 6), round(power_energy, 6))
assert np.isclose(gap_current, current)
assert np.isclose(power_out, -power_energy, atol=1e-10)
times = np.linspace(0, 5*dt, 101)
fig, (diagram, energy) = plt.subplots(1, 2, figsize=(9, 3.4), layout="constrained")
diagram.hlines([-1, 1], -1.2, 1.2, linewidth=4)
diagram.text(0, -1.25, "Lower plate", ha="center", va="top")
diagram.text(0, 1.25, "Upper plate", ha="center")
diagram.vlines([-1.2, 1.2], -1, 1, color="0.5", linestyle=":")
diagram.annotate("", xy=(1.72, .56), xytext=(1.2, .56),
                 arrowprops={"arrowstyle": "->", "color": "0.35"})
diagram.text(1.45, .67, "Outward", ha="center", fontsize=8)
diagram.quiver([0], [0], [0], [.7*np.sign(Ez)], color="tab:blue", pivot="middle",
               angles="xy", scale_units="xy", scale=1)
diagram.text(.12, 0, "E field", color="tab:blue", va="center")
diagram.quiver([-1.2, 1.2], [0, 0], [-.55*np.sign(power_out), .55*np.sign(power_out)],
               [0, 0], color="tab:orange", pivot="middle", angles="xy",
               scale_units="xy", scale=1)
diagram.text(0, -.6, f"Power out of side: {power_out*1e3:+.3g} mW", ha="center",
             color="tab:orange")
diagram.set(xlim=(-1.9, 1.9), ylim=(-1.6, 1.7), title="Gap cross-section (schematic)")
diagram.axis("off")
energy.plot(times*1e9, .5*cap*(voltage + current*times/cap)**2*1e9)
energy.set(xlabel="Time (ns)", ylabel="Electric energy (nJ)", title="Stored electric energy")
plt.show()
""")
md("""
**Change and explain.** Set `radius` to 0.025 m and rerun. Compare the field growth
with the gap displacement current and explain why the latter stays fixed. Restore
the radius and set `voltage` to −10 V at the original current. Use the arrows and
the initial slope of the energy curve to explain the change in power direction.
Check where the gap-to-radius or quasistatic approximation would break down.
""")
md("""
## Q2 and Q3 · Circulation outside the coil

Look down the coil from +z. Sketch two counterclockwise paths. Center the large
one on the coil and put the smaller one entirely outside it. Label the +z flux
through the surfaces and the tangent to each path.

> **Predict before running.** If the axial field inside the coil increases in +z,
> which way will the induced electric field point at twice the coil radius?
> Predict the sign of circulation around each path.
>
> **My prediction and reasoning:** …

Integrate the tangential electric field along each path using segment midpoints.
Compare the result with the changing magnetic flux through the corresponding disk.
""", "solenoid")
code("""
a, rate = .10, 2.0
radii = np.linspace(0, .30, 201)
small_x, small_radius = 2.4*a, .25*a
fig, (geometry, profile) = plt.subplots(1, 2, figsize=(9, 3.8), layout="constrained")
geometry.add_patch(plt.Circle((0, 0), a, color="tab:blue", alpha=.18, label="Coil cross-section"))
geometry.add_patch(plt.Circle((0, 0), 2*a, fill=False, color="tab:blue", label="Enclosing path"))
geometry.add_patch(plt.Circle((small_x, 0), small_radius, fill=False,
                              color="tab:orange", label="Exterior path"))
x, y = np.meshgrid(np.linspace(-.24, .24, 9), np.linspace(-.24, .24, 9))
probe_radius = np.hypot(x, y)
e_phi = solenoid_e(probe_radius, a, rate)
unit_factor = np.divide(e_phi, probe_radius, out=np.zeros_like(e_phi), where=probe_radius > 0)
geometry.quiver(x, y, -y*unit_factor, x*unit_factor, alpha=.75,
                angles="xy", scale_units="xy", scale=4)
geometry.set(aspect="equal", xlim=(-.28, .28), ylim=(-.28, .28), xlabel="x (m)", ylabel="y (m)",
             title="View from +z • arrows show E")
geometry.legend(loc="upper center", bbox_to_anchor=(.5, -.18), ncol=2, fontsize=8)
profile.plot(radii, solenoid_e(radii, a, rate), label="Eφ")
profile.axvline(a, linestyle="--", label="Coil radius")
profile.set(xlabel="Radius (m)", ylabel="Azimuthal E (V/m)", title="Signed radial profile")
profile.legend()
plt.show()

def loop_integral(center_x, radius, steps):
    angles = np.linspace(0, 2*np.pi, steps+1)
    xy = np.column_stack((center_x + radius*np.cos(angles), radius*np.sin(angles)))
    mid = (xy[:-1] + xy[1:])/2
    r = np.linalg.norm(mid, axis=1)
    azimuth = np.column_stack((-mid[:,1], mid[:,0]))/r[:,None]
    return np.sum(solenoid_e(r,a,rate)[:,None]*azimuth*np.diff(xy,axis=0))

coarse = loop_integral(0, 2*a, 512)
large = loop_integral(0, 2*a, 2048)
small = loop_integral(small_x, small_radius, 2048)
print("Large and exterior-small circulation (V):", f"{large:.6f}, {small:.6f}")
print(f"Enclosing loop, 512 vs 2048 segments (V): {coarse:.9f}, {large:.9f}")
assert np.isclose(large, -np.pi*a*a*rate, atol=2e-7)
assert abs(small) < 1e-10
""")
md("""
**Change and explain.** Set `rate` to −2 T/s and rerun. Explain which arrows
and loop integrals change sign and why the small loop still gives zero. Compare
512 and 2048 segments. Describe where the infinite-solenoid model would fail.
""")
md("""
## Q4 · Charge conservation in a taper

Sketch a short volume bounded by the tube wall and two cross-sections. Draw an
outward normal on each end. The steady current points toward the narrower end,
and the synthetic current field is tangent to the insulated wall.

> **Predict before running.** Compare the axial current density at the two
> cross-sections, then compare the total current through them. Does charge
> accumulate in the volume? Sketch a local current-density arrow off the axis.
>
> **My prediction and reasoning:** …

Compute the signed end currents and check the local radial and axial derivatives
separately. Use the sketch to connect these two views of conservation.
""", "taper")
code("""
r, z, step = .01, .03, 1e-6
a0, L, I = .03, .1, .004
z_in, z_out = .015, .085
end_z = np.array([z_in, z_out])
end_area = np.pi*(a0*np.exp(-end_z/L))**2
end_jz = np.array([taper_j(0, p, a0, L, I)[1] for p in end_z])
outward_current = np.array([-1, 1])*end_area*end_jz
print(f"Signed end currents (mA): {outward_current[0]*1e3:+.3f}, {outward_current[1]*1e3:+.3f}")
print(f"End areas (cm²): {end_area[0]*1e4:.3f}, {end_area[1]*1e4:.3f}")
print(f"Axial end densities (A/m²): {end_jz[0]:.3f}, {end_jz[1]:.3f}")
print(f"Net outward current (A): {sum(outward_current):+.3g}")
assert np.isclose(sum(outward_current), 0, atol=1e-12)
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
wall = a0*np.exp(-zz/L)
fig, (geometry, profile) = plt.subplots(1, 2, figsize=(9, 3.4), layout="constrained")
geometry.plot(zz, wall, zz, -wall, color="0.25")
geometry.fill_between(zz, -wall, wall, where=(z_in <= zz) & (zz <= z_out),
                      color="tab:blue", alpha=.16, label="Control volume")
for section_z, signed_current in zip(end_z, outward_current):
    section_radius = a0*np.exp(-section_z/L)
    geometry.vlines(section_z, -section_radius, section_radius, color="tab:blue", linestyle="--")
    geometry.text(section_z, section_radius+.003, f"{signed_current*1e3:+.1f} mA",
                  ha="center", fontsize=8)
arrow_scale = max(1e-12, max(abs(np.asarray(J)))*110)
for sample_z in np.linspace(.004, .092, 7):
    for sample_r in a0*np.exp(-sample_z/L)*np.array([-.65, 0, .65]):
        jr, jz = taper_j(abs(sample_r), sample_z, a0, L, I)
        geometry.quiver(sample_z, sample_r, jz, np.sign(sample_r)*jr, color="tab:orange",
                        angles="xy", scale_units="xy", scale=arrow_scale)
geometry.set(xlabel="z (m)", ylabel="Signed transverse position (m)", title="Current density and end flux")
geometry.legend(loc="lower left", fontsize=8)
profile.plot(zz, J)
profile.scatter(end_z, end_jz, color="tab:blue")
profile.set(xlabel="z (m)", ylabel="Axial current density (A/m²)", title="Density rises as area shrinks")
plt.show()
""")
md("""
**Change and explain.** Set `z_out` to 0.06 m. Compare the new cross-sectional
area and current density at the exit with the signed current. Explain why
the net result and the local divergence describe charge conservation at
different scales.
""")
md("""
## Q6 and Q7 · Reflection and a coating

Sketch the incident wave in air and the transmitted wave in glass. Add the
reflected wave in air with its propagation arrow pointing back toward the
source. For the film case, mark the two interfaces that contribute to reflection.

> **Predict before running.** What is the reflected electric field's phase
> relative to the incident field at a bare air-to-glass boundary? For the
> matched film, sketch how the two reflected contributions add at the design
> wavelength. Predict what changes when you detune the illumination.
>
> **My prediction and reasoning:** …

Check the electric and magnetic boundary values independently, then compare
the film boundary solver with the sum over internal reflections.
""", "optics")
code("""
n_in, n_out, design = 1., 1.5, 550e-9
probe_nm = 550
r, t, R, T = interface(n_in,n_out)
print("Bare interface r, t, R, T:", *(round(x, 4) for x in (r,t,R,T)))
left = [1+r, n_in*(1-r)]
right = [t, n_out*t]
print("Tangential E on both sides:", *(round(x, 4) for x in (left[0], right[0])))
print("Tangential Z₀H on both sides:", *(round(x, 4) for x in (left[1], right[1])))
assert np.allclose(left, right)
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
fig, (spectrum, phasors) = plt.subplots(1, 2, figsize=(10, 4), layout="constrained")
for offset_nm, curve in spectra.items():
    spectrum.plot(wavelengths*1e9, 100*np.array(curve), label=f"{offset_nm:+d} nm offset")
total, _, probe_R, _ = film_matrix(probe_nm*1e-9, thickness, n_in, nf, n_out)
front, *_ = interface(n_in, nf)
returns = total - front
spectrum.scatter([probe_nm], [100*probe_R], color="black", zorder=4, label="Phasor probe")
spectrum.set(xlabel="Vacuum wavelength (nm)", ylabel="Reflectance (%)",
             title="Reflected power")
spectrum.legend(fontsize=8)

limit = 1.2*max(.02, abs(front), abs(returns), abs(total))
for start, vector, color, width, label in [
    (0j, complex(front), "tab:blue", .015, "Direct front reflection"),
    (complex(front), returns, "tab:orange", .007, "All returns through film"),
    (0j, total, "tab:green", .006, "Net reflected amplitude"),
]:
    phasors.quiver(start.real, start.imag, vector.real, vector.imag, angles="xy", scale_units="xy",
                   scale=1, color=color, width=width, label=label)
phasors.axhline(0, color="0.75", linewidth=.7)
phasors.axvline(0, color="0.75", linewidth=.7)
phasors.set(aspect="equal", xlim=(-limit, limit), ylim=(-limit, limit), xlabel="Real amplitude",
            ylabel="Imaginary amplitude", title=f"Reflection at {probe_nm} nm")
phasors.legend(loc="upper center", bbox_to_anchor=(.5, -.16), fontsize=8)
print(f"Probe: |r| = {abs(total):.5f}, reflected power = {100*probe_R:.4f}%")
plt.show()
""")
md("""
**Change and explain.** Set `probe_nm` to 400 while keeping the coating fixed.
Explain how the changed return phasor creates a nonzero vector sum. Connect
its squared length to the dot on the spectrum. The ±5 nm curves show
deterministic sensitivity. Explain how you would use measured distributions
of thickness and index to estimate uncertainty.
""")
md("""
## Transfer · An unfamiliar substrate

A sensor window has index 2.25. Illumination spans 450–650 nm around a 525 nm
design wavelength. You have a film of index 1.40 and a thickness tolerance of
±8 nm.

1. Derive the perfectly matched index and thickness for the ideal design.
   Predict what prevents perfect cancellation at 525 nm with the available film.
2. For the available film, search plausible thicknesses around its
   quarter-wave value. Propose the one that minimizes the **worst** reflectance
   across the specified band and tolerance interval. Refine the wavelength and
   tolerance grids to check convergence.
3. Choose either the boundary solver or the internal-reflection sum for the
   search. Explain how the choice fits the problem, then verify your selected
   design and worst-case point with the other method. Compare with the bare
   substrate and distinguish absolute reflectance from percentage-point changes.
4. Explain how absorption, dispersion, oblique illumination or uncertain
   substrate index would change the model. Propose a measurement that could
   challenge your design.

Submit the derivation, code, labelled plots, comparison and model critique.
The scaffold leaves the design choices to you.
""", "transfer")
code("""
print("LAB_COMPLETE", sys.platform, "four model plots generated")
""")
metadata = {
    "kernelspec": {"display_name": "Python (Pyodide)", "language": "python", "name": "python"},
    "language_info": {"name": "python"},
}
book = nb.v4.new_notebook(cells=cells, metadata=metadata)
for target in ("lab/files", "lab", "website/dist"):
    folder = ROOT / target
    folder.mkdir(parents=True, exist_ok=True)
    nb.write(book, folder / "Electrodynamics_Lab.ipynb")

# Lite's static path query opens a notebook at the top. Generate focused views
# of the same cells so each checkpoint can land directly on its own prediction.
investigations = [
    ("capacitor", "Capacitor_Investigation.ipynb"),
    ("solenoid", "Solenoid_Investigation.ipynb"),
    ("taper", "Taper_Investigation.ipynb"),
    ("optics", "Optics_Investigation.ipynb"),
]
positions = {cell.id: index for index, cell in enumerate(cells)}
ends = [key for key, _ in investigations[1:]] + ["transfer"]
for (key, filename), end in zip(investigations, ends):
    prediction, *exercise = cells[positions[key]:positions[end]]
    completion = nb.v4.new_code_cell('print("INVESTIGATION_COMPLETE")')
    focused = nb.v4.new_notebook(
        cells=[prediction, *setup_cells, *exercise, completion], metadata=metadata,
    )
    nb.write(focused, ROOT / "lab/files" / filename)

(ROOT / "lab/jupyter-lite.json").write_text(
    '{"jupyter-config-data":{"appName":"Electrodynamics Field Lab","enableMemoryStorage":true}}\n',
    encoding="utf-8",
)
