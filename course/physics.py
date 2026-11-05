"""Canonical SI models for the electrodynamics module.

Vacuum and quasistatic capacitor; infinite solenoid; insulated steady
axisymmetric taper; normally incident plane waves in nondispersive, lossless,
nonmagnetic media. Phasors use exp(i k z - i omega t).
"""
from math import pi, isfinite, sqrt
import numpy as np

C0 = 299_792_458.0  # m/s, exact in SI
EPS0 = 8.854_187_8188e-12  # F/m, 2022 CODATA central value
MU0 = 1 / (EPS0 * C0**2)
Z0 = MU0 * C0


def _positive(*values):
    if not all(isfinite(x) and x > 0 for x in values):
        raise ValueError("Expected finite positive physical parameters")


def capacitor(radius, gap, voltage, current):
    """Ideal circular plates. Returns C, E_z, dE_z/dt, B_phi at rim and signed side power."""
    _positive(radius, gap)
    if not all(isfinite(x) for x in (voltage, current)):
        raise ValueError("Voltage and current must be finite")
    area = pi * radius**2
    capacitance = EPS0 * area / gap
    electric = voltage / gap
    electric_rate = current / (EPS0 * area)
    magnetic_rim = MU0 * current / (2 * pi * radius)
    outward_power = -electric * magnetic_rim / MU0 * 2 * pi * radius * gap
    return capacitance, electric, electric_rate, magnetic_rim, outward_power


def solenoid_e(r, a, b_rate):
    """Signed E_phi (V/m) for a uniform axial B ramp (T/s) inside radius a."""
    _positive(a)
    r = np.asarray(r, dtype=float)
    if np.any(~np.isfinite(r)) or np.any(r < 0) or not isfinite(b_rate):
        raise ValueError("Radius must be finite and nonnegative; field rate must be finite")
    return -0.5 * b_rate * np.minimum(r, a) * np.minimum(1, a / np.maximum(r, a))


def taper_j(r, z, a0, scale, current):
    """Synthetic divergence-free J in a tapered tube with a(z)=a0 exp(-z/scale).

    The field is tangent to the wall. Use only for r <= a(z), over a
    finite segment. This is a kinematic continuity example, not a solution
    of Ohm's law for a homogeneous material.
    """
    _positive(a0, scale)
    if not all(isfinite(x) for x in (r, z, current)):
        raise ValueError("Coordinates and current must be finite")
    a = a0 * np.exp(-z / scale)
    if not 0 <= r <= a:
        raise ValueError("Probe outside the conducting domain")
    jz = current / (pi * a**2)
    return -r * jz / scale, jz


def interface(n1, n2):
    """Electric-field amplitudes and normal power fractions for incident amplitude 1."""
    _positive(n1, n2)
    r = (n1 - n2) / (n1 + n2)
    t = 1 + r
    return r, t, r**2, n2 / n1 * t**2


def film_matrix(wavelength, thickness, n1, nf, n3):
    """Solve four boundary conditions; returned t is defined at the second interface."""
    _positive(wavelength, n1, nf, n3)
    if not isfinite(thickness) or thickness < 0:
        raise ValueError("Thickness must be finite and nonnegative")
    p = np.exp(2j * pi * nf * thickness / wavelength)
    matrix = [[1, -1, -1, 0], [-n1, -nf, nf, 0],
              [0, p, 1/p, -1], [0, nf*p, -nf/p, -n3]]
    r, _, _, t = np.linalg.solve(matrix, [-1, -n1, 0, 0])
    return r, t, abs(r)**2, n3/n1 * abs(t)**2


def film_series(wavelength, thickness, n1, nf, n3):
    """Independent closed form obtained by summing internal round trips."""
    _positive(wavelength, n1, nf, n3)
    if not isfinite(thickness) or thickness < 0:
        raise ValueError("Thickness must be finite and nonnegative")
    r12, t12, *_ = interface(n1, nf)
    r23, t23, *_ = interface(nf, n3)
    p = np.exp(2j * pi * nf * thickness / wavelength)
    den = 1 + r12*r23*p**2
    return (r12 + r23*p**2)/den, t12*t23*p/den


def quarter_wave(wavelength, n1, n3):
    """Matched index and physical thickness for a design wavelength in vacuum."""
    _positive(wavelength, n1, n3)
    index = sqrt(n1*n3)
    return index, wavelength / (4*index)


def fixtures():
    nf, d = quarter_wave(550e-9, 1.0, 1.5)
    r, t, reflectance, transmittance = interface(1.0, 1.5)
    return dict(interface_r=r, interface_t=t, interface_R=reflectance, interface_T=transmittance,
                design_nm=550, film_index=nf, thickness_nm=d*1e9,
                detuned_R=float(film_matrix(400e-9, d, 1, nf, 1.5)[2]),
                gap_outward_W=capacitor(.05, .001, 10, .002)[-1])
