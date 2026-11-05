"""Model-derived Manim panels, rendered as muted production intermediates."""
from pathlib import Path
import sys

import numpy as np
from manim import (
    Scene, Text, VGroup, Arrow, Arc, Circle, Rectangle, Axes, Dot,
    DashedLine, Line, Create, FadeIn, GrowArrow, DOWN, LEFT, RIGHT, UP,
)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from course.physics import capacitor, solenoid_e, taper_j, interface, film_matrix, quarter_wave

BG, INK, MUTE = "#102A36", "#F3F6F0", "#B8CED6"
TEAL, GOLD = "#6EE0D1", "#FFC779"


def label(value, size=32, color=INK):
    return Text(value, font="Arial", font_size=size, color=color)


def heading(scene, title, subtitle):
    scene.camera.background_color = BG
    scene.add(label(title, 41).to_edge(UP, buff=.38))
    scene.add(label(subtitle, 25, MUTE).to_edge(UP, buff=1.08))


def capacitor_diagram(scene, power=False):
    heading(scene, "ENERGY ENTERS FROM THE SIDE" if power else "A CHARGING VACUUM CAPACITOR",
            "Quasistatic side view • parallel-plate approximation")
    for y, sign in [(-1.1, "+"), (1.1, "−")]:
        plate = Rectangle(width=5.4, height=.17, stroke_width=0, fill_color=TEAL, fill_opacity=1).move_to([0,y,0])
        scene.add(plate, label(sign, 29).next_to(plate, RIGHT))
    arrows=VGroup(*[Arrow([x,-.94,0],[x,.94,0],buff=0,color=GOLD,stroke_width=4) for x in [-1.5,0,1.5]])
    scene.play(*[GrowArrow(a) for a in arrows],run_time=1.2)
    if power:
        arrows = [Arrow([-4.9,0,0],[-2.62,0,0],buff=0,color=TEAL),
                  Arrow([4.9,0,0],[2.62,0,0],buff=0,color=TEAL)]
        scene.play(*[GrowArrow(a) for a in arrows],run_time=1.2)
        scene.add(label("Poynting flux", 26, TEAL).move_to([0,-1.9,0]))
        watts=capacitor(.05,.001,10,.002)[-1]
        scene.add(label(f"10 V × 2 mA → outward power {watts*1000:.0f} mW",27).move_to([0,-2.65,0]))
    else:
        lead=Arrow([0,-2.9,0],[0,-1.2,0],buff=0,color=TEAL)
        scene.play(GrowArrow(lead),run_time=1)
        scene.add(label("lead current I",27,TEAL).move_to([-1.7,-2.15,0]))
        scene.add(label("Changing electric flux",29,GOLD).move_to([0,1.96,0]))
        scene.add(label("ε₀ dΦₑ/dt = I",34).move_to([3.9,-1.9,0]))


def induction(scene):
    heading(scene,"THE INDUCED FIELD HAS TWO REGIMES","Ideal solenoid • increasing positive axial magnetic field")
    a=.1
    b_rate=2
    axes=Axes(x_range=[0,.31,.1],y_range=[-.11,.01,.05],x_length=8.1,y_length=3.7,
              axis_config={"include_tip":False,"color":MUTE}).shift(DOWN*.35)
    curve1=axes.plot(lambda r:float(solenoid_e(r,a,b_rate)),x_range=[0,a],color=GOLD)
    curve2=axes.plot(lambda r:float(solenoid_e(r,a,b_rate)),x_range=[a,.3],color=TEAL)
    scene.add(axes,label("Eφ  (V/m)",25).move_to([-4.15,2,0]),label("r  (m)",25).move_to([4,-2.85,0]))
    scene.play(Create(curve1),Create(curve2),run_time=1.8)
    scene.add(DashedLine(axes.c2p(a,-.1),axes.c2p(a,0),color=MUTE))
    scene.add(label("r = a",25).move_to([-1.55,-2.7,0]),label("−0.10",22).next_to(axes.c2p(0,-.10),LEFT))
    scene.add(label("linear",26,GOLD).move_to([-2.9,.65,0]),label("inverse radius",26,TEAL).move_to([2.1,-1.85,0]))


def stokes(scene):
    heading(scene,"TWO LOOPS, TWO FLUXES","Top view • positive z points toward the viewer")
    coil=Circle(radius=.76,color=GOLD,fill_color=GOLD,fill_opacity=.22).move_to([-1.9,-.18,0])
    large=Circle(radius=1.92,color=TEAL).move_to(coil)
    small=Circle(radius=.64,color=INK).move_to([2.05,-.18,0])
    scene.add(coil,label("B ↑",26,GOLD).move_to(coil))
    scene.play(Create(large),Create(small),run_time=1.6)
    scene.add(label("Encloses changing flux",25,TEAL).move_to([-1.9,-2.65,0]))
    scene.add(label("Zero changing flux",25).move_to([2.35,-1.25,0]))
    scene.add(label("E can be nonzero here",25,MUTE).move_to([2.4,-1.95,0]))


def taper(scene):
    heading(scene,"THE SAME CURRENT CROSSES BOTH ENDS","Synthetic axisymmetric current field • insulating side wall")
    zs=np.linspace(0,1,60)
    walls=[[[-3.8+7.6*z, sign*1.55*np.exp(-z),0] for z in zs] for sign in [-1,1]]
    scene.play(*[Create(VGroup(*[Line(p,q,color=MUTE) for p,q in zip(points,points[1:])])) for points in walls],run_time=1.1)
    arrows=[]
    for z in [.08,.33,.58,.83]:
        for fraction in [-.65,0,.65]:
            r=abs(fraction)*np.exp(-z)
            jr,jz=taper_j(r,z,1,1,1)
            x=-3.8+7.6*z
            y=fraction*1.55*np.exp(-z)
            arrows.append(Arrow([x,y,0],[x+.38+.21*jz,y+np.sign(fraction)*jr*.32,0],buff=0,
                                color=TEAL,stroke_width=3,max_tip_length_to_length_ratio=.3))
    scene.play(*[GrowArrow(a) for a in arrows],run_time=1.4)
    scene.add(label("Inlet: −I",30).move_to([-3,-2.3,0]),label("Outlet: +I",30).move_to([3,-2.3,0]))
    scene.add(label("Net outward current = 0",30,GOLD).to_edge(DOWN,buff=.55))


def waves(scene):
    heading(scene,"MATCH TWO TANGENTIAL FIELDS","Normal incidence • lossless media • indices 1 and 1.5")
    scene.add(Line([0,-2.1,0],[0,1.55,0],color=MUTE))
    r,t,R,T=interface(1,1.5)
    entries=[("Incident",1,[-4.9,.75,0],[-.2,.75,0],TEAL),
             ("Reflected",r,[-.2,-.7,0],[-4.9,-.7,0],GOLD),
             ("Transmitted",t,[.2,.75,0],[4.9,.75,0],TEAL)]
    for name,value,first,last,color in entries:
        arrow=Arrow(first,last,buff=0,color=color)
        scene.play(GrowArrow(arrow),FadeIn(label(f"{name}  {value:+.1f}",29,color).next_to(arrow,UP)),run_time=.75)
    scene.add(label(f"Reflected power: {R:.0%}    Transmitted power: {T:.0%}",30).move_to([0,-2.6,0]))


def coating(scene):
    heading(scene,"A MATCH AT THE DESIGN WAVELENGTH","Air → transparent film → glass • model predictions")
    nf,d=quarter_wave(550e-9,1,1.5)
    axes=Axes(x_range=[400,701,100],y_range=[0,.052,.02],x_length=8.3,y_length=3.4,
              axis_config={"include_tip":False,"color":MUTE}).shift(DOWN*.35)
    curve=axes.plot(lambda nm:film_matrix(nm*1e-9,d,1,nf,1.5)[2],x_range=[400,700,5],color=TEAL)
    baseline=DashedLine(axes.c2p(400,.04),axes.c2p(700,.04),color=GOLD)
    scene.add(axes,label("R",26).move_to([-4.7,1.6,0]))
    scene.add(label("Uncoated interface: R = 0.04",24,GOLD).move_to([1.35,1.24,0]))
    scene.play(Create(curve),Create(baseline),run_time=1.75)
    scene.add(Dot(axes.c2p(550,0),color=INK),label("550 nm",26).move_to([0,-2.3,0]))
    scene.add(label(f"Film index {nf:.3f} • thickness {d*1e9:.2f} nm",28).move_to([0,-2.95,0]))


PANELS = [lambda s:capacitor_diagram(s), induction, stokes, taper,
          lambda s:capacitor_diagram(s,True), waves, coating]

def chapter(panel):
    def construct(self):
        panel(self)
        self.wait(1)
    return construct

for index, panel in enumerate(PANELS, start=1):
    globals()[f"Chapter{index}"] = type(f"Chapter{index}", (Scene,), {"construct": chapter(panel)})
