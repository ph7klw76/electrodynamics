import unittest
from math import pi

import numpy as np
from course.physics import EPS0, capacitor, solenoid_e, taper_j, interface, quarter_wave, film_matrix, film_series


class PhysicsTests(unittest.TestCase):
    def test_capacitor_energy_and_displacement(self):
        for radius,gap,V,I in [(0.05,.001,10,.002),(.11,.004,-15,.02),(.09,.003,1,-.005)]:
            C,_,Edot,_,out = capacitor(radius,gap,V,I)
            dt = 1e-10
            before,after = (V-I*dt/C), (V+I*dt/C)
            dU = .5*C*(after**2-before**2)/(2*dt)
            self.assertAlmostEqual(EPS0*pi*radius**2*Edot,I,places=13)
            self.assertAlmostEqual(dU,-out,places=10)

    def test_faraday_disk_quadrature(self):
        a = .2
        for rate in [0, -.3, 2]:
            for r in [.05,a,.28,1.5]:
                dr = min(r,a)/1000
                midpoint = (np.arange(1000)+.5)*dr
                derivative = 2*pi*dr*np.sum(rate*midpoint)
                self.assertAlmostEqual(2*pi*r*solenoid_e(r,a,rate),-derivative,places=12)
        self.assertEqual(solenoid_e(0,a,2),0)
        self.assertAlmostEqual(solenoid_e(a-1e-10,a,2),solenoid_e(a+1e-10,a,2),places=9)

    def test_taper_divergence_and_no_wall_flow(self):
        a0,L,I = .07,.2,.005
        for z in [.02,.1,.18]:
            a = a0*np.exp(-z/L)
            j_wall,j_axial = taper_j(a,z,a0,L,I)
            self.assertAlmostEqual(j_wall+a/L*j_axial,0)
            r,h = .5*a,1e-6
            dr = ((r+h)*taper_j(r+h,z,a0,L,I)[0]-(r-h)*taper_j(r-h,z,a0,L,I)[0])/(2*r*h)
            dz = (taper_j(r,z+h,a0,L,I)[1]-taper_j(r,z-h,a0,L,I)[1])/(2*h)
            self.assertAlmostEqual(dr+dz,0,places=7)
            self.assertAlmostEqual(j_axial*pi*a**2,I)

    def test_interface_independent_boundaries_and_power(self):
        for n1,n2 in [(1,1.5),(1.5,1),(1,1),(1.1,4)]:
            r,t,R,T = interface(n1,n2)
            np.testing.assert_allclose([r,t],np.linalg.solve([[1,-1],[-n1,-n2]],[-1,-n1]))
            self.assertAlmostEqual(R+T,1)

    def test_film_independent_methods_and_limits(self):
        for n1,nf,n3 in [(1,1.28,1.5),(1.3,2.15,1.1),(1,1,1)]:
            for w in np.linspace(410e-9,790e-9,13):
                for d in [0,95e-9,300e-9]:
                    r,t,R,T = film_matrix(w,d,n1,nf,n3)
                    np.testing.assert_allclose((r,t),film_series(w,d,n1,nf,n3),atol=1e-12)
                    self.assertAlmostEqual(R+T,1)
                    if not d:
                        np.testing.assert_allclose((r,t),interface(n1,n3)[:2],atol=1e-12)
        w=550e-9
        nf,d=quarter_wave(w,1,1.5)
        self.assertLess(film_matrix(w,d,1,nf,1.5)[2],1e-28)

    def test_reject_invalid_domains(self):
        for fn,args in [(capacitor,(0,1,1,1)),(solenoid_e,(-1,1,1)),(taper_j,(.1,1,.1,.1,1)),
                        (interface,(1,float("inf"))),(film_matrix,(1,-1,1,1,1)),(quarter_wave,(0,1,1))]:
            with self.subTest(fn=fn.__name__), self.assertRaises(ValueError):
                fn(*args)
