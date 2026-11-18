/* Learner-paced experiments using the models behind the full field explorers. */
(() => {
  'use strict';
  const model = window.FieldLab;
  const teal = '#087d73', gold = '#875918', ink = '#12313d';
  const label = (x, y, words, anchor = 'start') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}">${words}</text>`;

  function probePicture(cm, field) {
    const x = 100 + 9 * cm;
    const length = 3.5 * field;
    return `<circle cx="100" cy="88" r="45" fill="#d8eee9" stroke="${teal}" stroke-width="2"/>
      <path d="M100 88 H${x}" stroke="${ink}" stroke-dasharray="4 3"/>
      ${label(85, 72, '⊙ B')}${label(80, 149, 'Coil edge at 5 cm')}
      <circle cx="100" cy="88" r="2" fill="${ink}"/>
      <circle cx="${x}" cy="88" r="5" fill="white" stroke="${gold}" stroke-width="3"/>
      ${field > 0 ? `<path d="M${x} 88 v${length} m-3 -4 l3 4 3 -4" fill="none" stroke="${teal}" stroke-width="2.5"/>` : ''}
      ${label(x + 8, 85, 'Probe')}${label(12, 20, 'End view · field growing toward you')}`;
  }

  function pulsePicture(index, amplitude) {
    // Equal incident-side amplitude scales. The two rows show separately timed snapshots.
    const pulse = (mid, axis, height) => Array.from({length: 101}, (_, i) => {
      const x = 18 + 1.92 * i;
      const y = axis - height * Math.exp(-(((x - mid) / 16) ** 2));
      return x.toFixed(1) + ',' + y.toFixed(2);
    }).join(' ');
    return `<rect x="210" y="24" width="96" height="118" fill="#d8eee9"/>
      <path d="M210 18 V144 M18 73 H210 M18 120 H210" fill="none" stroke="#859593"/>
      ${label(18, 16, 'Glass · 1.50')}${label(217, 16, 'Index ' + index.toFixed(2))}
      ${label(20, 42, 'Incident →')}${label(20, 100, '← Reflected')}
      <polyline points="${pulse(133, 73, 30)}" fill="none" stroke="${teal}" stroke-width="2.5"/>
      <polyline points="${pulse(120, 120, 30 * amplitude)}" fill="none" stroke="${gold}" stroke-width="3"/>
      ${label(18, 154, 'Electric pulses · same vertical scale')}`;
  }

  function powerPicture(current, power) {
    // Each arrow straddles the rim. Positive outward power points away from the plates.
    const length = 1.7 * Math.abs(power);
    const arrows = [74, 238].map((rim, side) => {
      const direction = (side === 0 ? -1 : 1) * Math.sign(power);
      const tip = rim + direction * length / 2;
      const tail = rim - direction * length / 2;
      const wing = tip - direction * Math.min(5, length * .45);
      return power === 0 ? '' : `<path data-flow d="M${tail} 87 H${tip} M${wing} 84 L${tip} 87 L${wing} 90" stroke="${gold}" stroke-width="3" fill="none"/>`;
    }).join('');
    return `${label(16,19,'Side view · vacuum gap')}
      <rect x="74" y="51" width="164" height="71" fill="#e3f1ed"/>
      <path d="M69 50 H243 M69 123 H243" stroke="${ink}" stroke-width="5"/>
      <path d="M156 104 V68 m-4 6 4 -6 4 6" stroke="${teal}" stroke-width="2.5" fill="none"/>
      ${label(164,91,'E')}${label(252,55,'−')}${label(252,127,'+')}
      ${arrows}${label(156,151,current === 0 ? 'No energy crosses the rim' : power > 0 ? 'Energy leaves both sides of the rim' : 'Energy enters both sides of the rim','middle')}`;
  }

  function wirePicture(mm) {
    const radius = 12 * mm;
    // Equal-current area samples retain their fractional positions on each face.
    const dots = [[0,0], ...Array.from({length:8}, (_, i) =>
      [.7 * Math.cos(i * Math.PI / 4), .7 * Math.sin(i * Math.PI / 4)])];
    return `${label(12,19,'End view · current toward you')}
      <circle cx="103" cy="86" r="48" fill="none" stroke="${ink}" stroke-dasharray="4 3"/>
      <circle cx="103" cy="86" r="${radius}" fill="#d8eee9" stroke="${teal}" stroke-width="2"/>
      ${dots.map(([x,y]) => `<circle cx="${103 + x * radius}" cy="${86 + y * radius}" r="3" fill="${teal}"/>`).join('')}
      ${label(166,70,'Total current')}${label(166,91,'4.00 mA')}
      ${label(166,116,'Radius ' + mm.toFixed(2) + ' mm')}
      ${label(12,153,'Dots represent equal shares of the current.')}`;
  }

  const studies = {
    power: {
      min:-2, max:2, step:.1, start:2, target:-2, digits:1,
      control:'Current onto the positive plate', unit:'mA', action:'Reverse the current',
      options:['Energy still enters', 'Energy leaves at the same rate', 'Energy flow stops'], correct:1,
      value: current => 1000 * model.capacitorState(10, current / 1000).outwardPower,
      limits:[-20,20], ticks:[-2,0,2], axis:'Charging current (mA)', ordinate:'Outward power (mW)',
      picture:'Energy crossing the capacitor rim', graph:'Outward power versus current', draw:powerPicture,
      report: (current, power) => `At ${current.toFixed(1)} mA the signed outward power is ${power.toFixed(1)} mW. ${power === 0 ? 'The electric field still stores energy.' : power > 0 ? 'Stored energy is decreasing.' : 'Stored energy is increasing.'}`,
      finding:'The power changes from −20 to +20 mW. The electric field still points upward, but reversing the current reverses the magnetic field and the energy flow.',
      prompt:'Set the current to zero. Can the capacitor have stored energy while the power crossing its rim is zero?',
      equation:'For ideal circular plates in vacuum, the Poynting vector is S = E × H. Integrated over the rim, Pout = −VI with positive I charging the positive plate. Each slider position is a separate instantaneous state at 10 V. Fringing and losses are neglected.',
      notebook:'Capacitor_Investigation.ipynb'
    },
    density: {
      min:2, max:4, step:.05, start:4, target:2, digits:2,
      control:'Radius of the selected face', unit:'mm', action:'Move to the narrower face',
      options:['It doubles', 'It quadruples', 'It stays the same'], correct:1,
      value: mm => model.taperState(0, 0, .004, mm / 1000).axial,
      limits:[0,320], ticks:[2,3,4], axis:'Cross-section radius (mm)', ordinate:'Axial current density (A/m²)',
      picture:'Current through the selected face', graph:'Current density versus radius', draw:wirePicture,
      report:(mm, density) => `At radius ${mm.toFixed(2)} mm, axial current density is ${density.toFixed(2)} A/m² through an area of ${(Math.PI * mm * mm).toFixed(2)} mm². Total current remains 4.00 mA.`,
      finding:'Halving the radius gives one quarter of the area. Each second the same charge crosses a smaller face, so the axial current density rises fourfold.',
      prompt:'Pick an intermediate radius. How can you use its area and the plotted density to recover the total current?',
      equation:'For this steady axisymmetric model, Jz is uniform across each circular face and I = ∫ J · dA = Jz πa². The radial component follows the insulated wall. The dots illustrate current sharing. They are not individual electrons.',
      notebook:'Taper_Investigation.ipynb'
    },
    probe: {
      min: 0, max: 15, step: 0.25, start: 5, target: 10, digits: 2,
      control: 'Probe distance from center', unit: 'cm', action: 'Move the probe to 10 cm',
      options: ['It drops to zero', 'It halves', 'It doubles'], correct: 1,
      value: cm => 1000 * Math.abs(model.solenoidE(cm / 100, 0.05, 0.4)),
      limits: [0, 10], ticks: [0, 5, 10, 15], axis: 'Distance from center (cm)',
      ordinate: 'Field strength (mV/m)', picture: 'Probe on the coil radius',
      graph: 'Induced electric field along the radius', draw: probePicture,
      report: (cm, field) => `At ${cm.toFixed(2)} cm the field strength is ${field.toFixed(2)} mV/m.`,
      finding: 'At 10 cm the field is half as strong as at the edge. Both circular paths enclose the same changing magnetic flux, but the outer path is twice as long.',
      prompt: 'Move the probe through the coil edge. Where does the field reach its maximum, and why does the trend change there?',
      equation: 'For a long ideal solenoid of radius a, |Eφ| = |dB/dt|r/2 inside and |Eφ| = |dB/dt|a²/(2r) outside. Here a = 0.05 m and dB/dt = +0.40 T/s. Faraday’s law gives a clockwise field as viewed from +z. The diagram samples it at the right of the axis.',
      notebook: 'Solenoid_Investigation.ipynb'
    },
    match: {
      min: 1, max: 2, step: 0.01, start: 1, target: 1.5, digits: 2,
      control: 'Second-medium index', unit: '', action: 'Match the two indices',
      options: ['It stays upright and just as strong', 'It disappears', 'It flips with the same strength'], correct: 1,
      value: index => model.waveInterface(1.5, index).r,
      limits: [-0.2, 0.2], ticks: [1, 1.5, 2], axis: 'Second-medium index',
      ordinate: 'Reflected / incident E (signed)', picture: 'Pulse approaching and returning',
      graph: 'Reflected electric amplitude', draw: pulsePicture,
      report: (index, r) => `At index ${index.toFixed(2)} the reflected pulse is ${r === 0 ? 'absent' : r > 0 ? 'upright' : 'inverted'}. Its signed amplitude is ${r.toFixed(3)} times the incident amplitude. Reflected power is ${(100 * r * r).toFixed(2)}% of incident power.`,
      finding: 'At equal indices the reflected pulse vanishes. These two nonmagnetic media have the same wave impedance, so the incident wave already satisfies the boundary conditions.',
      prompt: 'Move past the matched index. What changes sign? Can the reflected power ever become negative?',
      equation: 'At normal incidence between lossless, nondispersive, nonmagnetic media, r = (n₁ − n₂)/(n₁ + n₂) and R = r². The graph shows the signed electric amplitude ratio r. The readout also gives the power fraction R.',
      notebook: 'Optics_Investigation.ipynb'
    }
  };

  function plot(s, x, explored) {
    const [low, high] = s.limits;
    const px = v => 47 + 237 * (v - s.min) / (s.max - s.min);
    const py = v => 116 - 83 * (v - low) / (high - low);
    const points = Array.from({length: 121}, (_, i) => {
      const v = s.min + i * (s.max - s.min) / 120;
      return px(v).toFixed(2) + ',' + py(s.value(v)).toFixed(2);
    }).join(' ');
    const initial = s.value(s.start);
    return `${label(8, 16, s.ordinate)}
      <path d="M47 28 V116 H284 M47 ${py(0)} H284" fill="none" stroke="#879893"/>
      ${[...new Set([low, (high + low) / 2, high])].map(y => label(40, py(y) + 4, y, 'end')).join('')}
      ${s.ticks.map(v => label(px(v), 134, v, 'middle')).join('')}
      ${label(165, 154, s.axis, 'middle')}
      ${explored ? `<polyline points="${points}" stroke="${teal}" stroke-width="2.5" fill="none"/>` : ''}
      <circle cx="${px(s.start)}" cy="${py(initial)}" r="6" fill="white" stroke="${ink}" stroke-width="2"/>
      <circle data-marker cx="${px(x)}" cy="${py(s.value(x))}" r="3.5" fill="${gold}"/>`;
  }

  function mount(host) {
    const id = host.dataset.study, s = studies[id];
    host.innerHTML = `<div class="study-controls">
      <label>Your prediction<select data-choice><option value="">Choose a prediction</option>
      ${s.options.map((v, i) => `<option value="${i}">${v}</option>`).join('')}</select></label>
      <button data-try type="button" disabled>${s.action}</button></div>
      <div class="study-figures">
      <figure><figcaption>${s.picture}</figcaption><svg viewBox="0 0 312 164" role="img" aria-label="${s.picture}"></svg></figure>
      <figure><figcaption>${s.graph}</figcaption><svg viewBox="0 0 312 164" role="img" aria-label="${s.graph}"></svg></figure></div>
      <p data-reading></p><p role="status" data-feedback></p>
      <div data-explore hidden><div class="study-control">
      <label for="${id}-sweep">${s.control} <output for="${id}-sweep"></output></label>
      <input id="${id}-sweep" type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.start}"></div>
      <p>Open circle marks the starting case. The filled dot follows your control.</p>
      <p>${s.prompt}</p><details><summary>Explain with the equation</summary><p>${s.equation}</p>
      <a href="lab/lab/index.html?path=${s.notebook}">Test the model in Python</a></details>
      <button type="button" data-again>Try another prediction</button></div>`;
    const choice = host.querySelector('select'), button = host.querySelector('[data-try]');
    const explore = host.querySelector('[data-explore]'), sweep = host.querySelector('input');
    const feedback = host.querySelector('[data-feedback]');
    const [picture, graph] = host.querySelectorAll('svg');
    function render() {
      const x = Number(sweep.value), y = s.value(x);
      const reading = s.report(x, y);
      picture.innerHTML = s.draw(x, y);
      graph.innerHTML = plot(s, x, !explore.hidden);
      host.querySelector('[data-reading]').textContent = reading;
      const display = [x.toFixed(s.digits), s.unit].filter(Boolean).join(' ');
      host.querySelector('output').value = display;
      sweep.setAttribute('aria-valuetext', display + '. ' + reading);
    }
    choice.onchange = () => { button.disabled = choice.value === ''; };
    button.onclick = () => {
      explore.hidden = false;
      sweep.value = s.target;
      choice.disabled = button.disabled = true;
      feedback.textContent = (Number(choice.value) === s.correct ? 'Your prediction matches. ' : 'Compare your prediction with the graph. ') + s.finding;
      render();
      sweep.focus({preventScroll: true});
    };
    sweep.oninput = render;
    host.querySelector('[data-again]').onclick = () => {
      sweep.value = s.start;
      choice.value = '';
      choice.disabled = false;
      button.disabled = true;
      feedback.textContent = '';
      host.querySelector('details').open = false;
      explore.hidden = true;
      render();
      choice.focus();
    };
    render();
  }
  document.querySelectorAll('[data-study]').forEach(mount);
})();
