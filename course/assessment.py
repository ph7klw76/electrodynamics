"""Original formative items informed by CURrENT domains."""

ITEMS = [
 ("Across the ideal vacuum gap of a charging capacitor, what accounts for the lead current in Ampère-Maxwell's law?",
  ["The electric flux is fixed.", "ε₀ times the rate of change of electric flux.", "Conduction electrons crossing the gap."], 1,
  "The electric flux is Q/ε₀ in the ideal gap, so ε₀ dΦ_E/dt = dQ/dt = I.",
  {0:"The plates are gaining charge. Gauss's law connects that changing charge to changing electric flux.",2:"In an ideal vacuum capacitor, charges accumulate on the plates. The field term accounts for the gap."}),
 ("Viewed from +z, which way does E circulate outside a long solenoid whose +z magnetic field is increasing?",
  ["Clockwise.", "Counterclockwise.", "There is no induced E."],0,
  "The positive flux increases. Faraday's minus sign gives negative circulation relative to the counterclockwise direction.",
  {1:"The right-hand orientation is counterclockwise for +z. The increasing positive flux enters with a minus sign.",2:"The loop encloses a changing flux even where the local magnetic field is negligible."}),
 ("A small disk lies entirely outside the ideal solenoid and misses its axis. What must vanish?",
  ["The electric field at every point of the edge.", "The magnetic flux change, but the circulation equals the larger loop's.", "The electric circulation around this edge."],2,
  "The flux through this disk is constant at zero, so Faraday's law gives zero electric circulation.",
  {0:"A line integral can vanish even when the field is nonzero along the path.",1:"Different boundary curves can enclose different changing fluxes. Apply the law to this disk."}),
 ("A steady insulated conductor narrows. What is the net outward current through a volume spanning the constriction?",
  ["Positive.", "Zero.", "Negative."],1,
  "Steady charge means no accumulation. The inlet and outlet carry equal currents with opposite outward signs.",
  {0:"Greater current density over a smaller area can carry the same total current. Compare face integrals.",2:"There is no accumulation in this steady example. Include the exit current as well as the entry."}),
 ("While a circular vacuum capacitor charges with V > 0 and I > 0, what is the sign of outward side power?",
  ["Positive.", "Zero.", "Negative."],2,
  "E points along +z and H along +φ. E × H points inward, giving negative outward power and increasing electric energy.",
  {0:"Check the cross-product order E × H and the outward radial normal.",1:"The work term J·E is zero in the vacuum gap, but the electromagnetic flux can cross the side."}),
 ("A normally incident wave goes from n = 1 to n = 1.5. What is the reflected electric field sign at the interface?",
  ["Negative.", "Positive.", "Zero."],0,
  "r = (1 − 1.5)/(1 + 1.5) = −0.2. The reflected electric field has a π phase shift at the interface.",
  {1:"The backward wave reverses the sign in the magnetic matching condition. Solve both conditions together.",2:"The indices differ, so these nonmagnetic media have unequal wave impedances."}),
 ("A matched quarter-wave film stays fixed while the vacuum wavelength changes. What generally happens?",
  ["Cancellation stays exact at every wavelength.", "Reflected power returns.", "All incident power is absorbed."],1,
  "The phase 2π n_f d/λ depends on wavelength. Detuning generally spoils cancellation; the model has no absorption.",
  {0:"The physical thickness is fixed, but the number of wavelengths traversed is not.",2:"The materials are lossless. Any missing transmitted power must be reflected in this model."}),
]
QUESTIONS = [
    dict(id=f"Q{i+1}", scene=4*i+2, review_scene=4*i,
         question=q, options=opts, correct=c, explanation=why, wrong=wrong)
    for i, (q, opts, c, why, wrong) in enumerate(ITEMS)
]
SUMMARY = [
    ["A changing electric flux can account for the magnetic circulation in a vacuum gap.",
     "Conduction electrons must cross an ideal vacuum capacitor."],
    ["A local field may be nonzero even when a small loop has zero circulation.",
     "Zero curl forces the electric field itself to vanish."],
    ["Steady charge implies zero net outward charge flux from a fixed volume.",
     "Larger current density always implies net outward current."],
    ["Electromagnetic energy flux is E × H and depends on the chosen outward normal.",
     "Energy can cross the vacuum gap only with conduction current."],
    ["Film cancellation depends on phase and on amplitude matching.",
     "Quarter-wave thickness guarantees perfect cancellation for any film index and wavelength."],
]
