"""Export SI model values for the animated field diagrams."""
from argparse import ArgumentParser
from math import cos, pi, sin
from pathlib import Path
import json
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from course.physics import EPS0, capacitor, film_matrix, film_series, interface, quarter_wave, solenoid_e, taper_j


def rounded(value):
    return round(float(value), 10)


def charging_trace():
    radius, gap, current = 0.05, 0.001, 0.002
    area = pi * radius**2
    values = []
    for voltage in np.linspace(2, 10, 33):
        C, E, rate, B, outward = capacitor(radius, gap, voltage, current)
        displacement = EPS0 * area * rate
        assert abs(displacement - current) < 1e-12
        assert abs(outward + voltage * current) < 1e-12
        values.append(dict(
            voltage=rounded(voltage), field_kv_m=rounded(E / 1000),
            charge_nc=rounded(C * voltage * 1e9), stored_nj=rounded(C * voltage**2 / 2 * 1e9),
            inward_mw=rounded(-outward * 1000), rim_nt=rounded(B * 1e9),
            displacement_ma=rounded(displacement * 1000),
        ))
    return values


def induction_data():
    a, slope = 0.10, 2.0
    radii = [0.04, 0.07, 0.10, 0.15, 0.20, 0.25]
    response = [rounded(solenoid_e(r, a, slope)) for r in radii]
    small_center, small_radius = .188, .034
    theta = np.linspace(0, 2*pi, 97)
    x, y = small_center + small_radius*np.cos(theta), small_radius*np.sin(theta)
    r = np.hypot(x, y)
    assert r.min() > a
    # E points along the azimuth about the solenoid. Project it along
    # the tangent of the offset loop to see both signs of E · dℓ.
    ex, ey = -y/r * solenoid_e(r, a, slope), x/r * solenoid_e(r, a, slope)
    projection = -ex*np.sin(theta) + ey*np.cos(theta)
    partial = np.r_[0, np.cumsum((projection[:-1]+projection[1:])/2*np.diff(theta)*small_radius)]
    assert abs(partial[-1]) < 1e-10
    return dict(radius=a, rate=slope, radii=radii, response=response,
                loop=dict(center=small_center, radius=small_radius,
                          projection=list(map(rounded,projection)), integral_mv=list(map(rounded,partial*1000))))


def taper_data():
    values=[]
    for z in np.linspace(0,1,17):
        radius=float(np.exp(-z))
        radial, axial=taper_j(.65*radius,z,1,1,1)
        current=pi*radius**2*axial
        assert abs(current-1)<1e-12
        values.append(dict(z=rounded(z),radius=rounded(radius),axial=rounded(axial),
                           radial=rounded(radial),current=rounded(current)))
    return values


def optical_data():
    cases=[]
    for left,right in [(1.5,1),(1,1.5)]:
        r,t,R,T=interface(left,right)
        assert np.allclose((1+r,left*(1-r),R+T),(t,right*t,1))
        cases.append(dict(left=left,right=right,r=rounded(r),t=rounded(t),R=rounded(R),T=rounded(T)))
    design_nm=550
    nf,d=quarter_wave(design_nm*1e-9,1,1.5)
    front,t12,*_=interface(1,nf)
    _,t21,*_=interface(nf,1)
    back,*_=interface(nf,1.5)
    points=[]
    for nm in range(400,701,5):
        wavelength=nm*1e-9
        phase=4*pi*nf*d/wavelength
        p=complex(cos(phase),sin(phase))
        # Sum all paths that enter the film and emerge back into medium 1.
        returned=t12*t21*back*p/(1+front*back*p)
        r,t,R,T=film_matrix(wavelength,d,1,nf,1.5)
        assert np.allclose((r,t),film_series(wavelength,d,1,nf,1.5),atol=1e-12)
        assert abs(r-front-returned)<1e-12 and abs(R+T-1)<1e-12
        points.append(dict(nm=nm,rx=rounded(r.real),ry=rounded(r.imag),
                           tx=rounded(t.real),ty=rounded(t.imag),return_x=rounded(returned.real),
                           return_y=rounded(returned.imag),R=rounded(R)))
    assert points[(design_nm-400)//5]["R"]==0
    return dict(interfaces=cases, film=dict(index=rounded(nf),thickness_nm=rounded(d*1e9),
                design_nm=design_nm,front=rounded(front),bare_R=rounded(interface(1,1.5)[2]),points=points))


def main():
    parser=ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    data=dict(charging=charging_trace(),induction=induction_data(),taper=taper_data(),optics=optical_data())
    target=ROOT/"remotion/src/field-data.json"
    text=json.dumps(data,separators=(",",":"),allow_nan=False)+"\n"
    if args.check:
        if target.read_text(encoding="utf-8")!=text:
            raise SystemExit("Field data differs from the canonical Python models. Run video/field_motion.py.")
    else:
        target.write_text(text,encoding="utf-8",newline="\n")
    print("PASS: checked capacitor power, solenoid loop integral, taper flux and optical boundary matching.")


if __name__=="__main__":
    main()
