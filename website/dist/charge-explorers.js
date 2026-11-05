/* Browser versions of capacitor and taper_j in course/physics.py. */
(function () {
  'use strict';
  const EPS0 = 8.8541878188e-12;
  const MU0 = 1 / (EPS0 * 299792458 ** 2);
  const cap = { radius: .05, gap: .001, current: .002, maxVoltage: 10 };
  const wire = { radius: .07, scale: .20, current: .005, length: .20 };

  function capacitorState(voltage, current = cap.current, radius = cap.radius, gap = cap.gap) {
    const area = Math.PI * radius ** 2;
    const capacitance = EPS0 * area / gap;
    const field = voltage / gap;
    const fieldRate = current / (EPS0 * area);
    const rimField = MU0 * current / (2 * Math.PI * radius);
    const outwardPower = -field * rimField / MU0 * (2 * Math.PI * radius * gap);
    return { capacitance, field, fieldRate, rimField, outwardPower,
      charge: capacitance * voltage, energy: capacitance * voltage ** 2 / 2,
      displacement: EPS0 * area * fieldRate };
  }

  function taperState(z, radialFraction, current = wire.current, radius = wire.radius, scale = wire.scale) {
    const localRadius = radius * Math.exp(-z / scale);
    const area = Math.PI * localRadius ** 2;
    const axial = current / area;
    return { localRadius, area, axial, radial: -radialFraction * localRadius * axial / scale,
      flux: area * axial, axialDivergence: 2 * axial / scale, radialDivergence: -2 * axial / scale };
  }

  // Node checks can compare these functions with the canonical Python model.
  if (typeof module === 'object' && module.exports) module.exports = { capacitorState, taperState };
  if (typeof document === 'undefined') return;

  function elements(mount, names) {
    return Object.fromEntries(names.split(' ').map(name => [name, mount.querySelector(`[data-part="${name}"]`)]));
  }

  function arrow(x, y, dx, dy, color) {
    const length = Math.hypot(dx, dy);
    if (length < 2) return '';
    const tipX = x + dx;
    const tipY = y + dy;
    const unitX = dx / length;
    const unitY = dy / length;
    const head = Math.min(8, length * .48);
    const backX = tipX - head * unitX;
    const backY = tipY - head * unitY;
    const halfWidth = head / 2;
    return `<path d="M${x},${y} L${backX},${backY}" fill="none" stroke="${color}" stroke-width="2.5"/>
      <path d="M${tipX},${tipY} L${backX - halfWidth * unitY},${backY + halfWidth * unitX}
      L${backX + halfWidth * unitY},${backY - halfWidth * unitX} Z" fill="${color}"/>`;
  }

  const ink = '#12313d';
  const electricColor = '#056f66';
  const powerColor = '#9b4f10';
  const magneticColor = '#624c91';
  const fixed = (value, digits = 2) => value.toFixed(digits).replace('-', '−');

  function motion(playButton, update, rate) {
    let frame = null;
    let previous;
    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previous = undefined;
      playButton.textContent = 'Play';
      playButton.setAttribute('aria-pressed', 'false');
    }
    function tick(now) {
      const increment = previous === undefined ? 0 : Math.min(now - previous, 80) * rate;
      previous = now;
      if (update(increment)) frame = requestAnimationFrame(tick);
      else stop();
    }
    playButton.addEventListener('click', () => {
      if (frame !== null) stop();
      else {
        playButton.textContent = 'Pause';
        playButton.setAttribute('aria-pressed', 'true');
        frame = requestAnimationFrame(tick);
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    return stop;
  }

  function capacitorExplorer(mount) {
    mount.classList.add('field-explorer');
    mount.innerHTML = `
      <h3>Where does energy enter?</h3>
      <p>Start with uncharged plates. Play or step the model to build an electric field in the vacuum gap.</p>
      <svg viewBox="0 0 480 260" role="img" aria-labelledby="cap-title cap-desc">
        <title id="cap-title">Side view of a circular vacuum capacitor</title>
        <desc id="cap-desc" data-part="description">Two uncharged plates with vacuum between them.</desc>
        <path d="M240 0V67 M240 188V250" stroke="${ink}" stroke-width="6"/>
        <path d="M124 67H356 M124 188H356" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M124 82V172 M356 82V172" stroke="${powerColor}" stroke-dasharray="5 5" fill="none"/>
        <text x="240" y="42" text-anchor="middle" dx="92">top plate</text>
        <text x="240" y="219" text-anchor="middle" dx="98">bottom plate</text>
        <text x="240" y="113" text-anchor="middle">vacuum gap</text>
        <text x="20" y="40">+z up</text>
        <g data-part="electric"></g>
        <g data-part="power" hidden></g>
      </svg>
      <div class="field-explorer-controls">
        <button type="button" data-part="play" aria-label="Play or pause charging" aria-pressed="false">Play</button>
        <button type="button" data-part="step">Step charge</button>
        <button type="button" data-part="reset">Reset capacitor</button>
      </div>
      <p class="field-measurement" data-part="measurement"></p>
      <p class="field-assumptions">Ideal circular plates, constant 2 mA, no fringing. Time is slowed for viewing.</p>
      <label for="cap-prediction">Predict where energy crosses into the gap.</label>
      <div class="field-explorer-controls">
        <select id="cap-prediction" data-part="prediction">
          <option value="">Choose a direction</option>
          <option value="side">Inward through the sides</option>
          <option value="plates">Through the plate faces</option>
          <option value="none">No energy enters the gap</option>
        </select>
        <button type="button" data-part="reveal" disabled>Reveal energy flow</button>
      </div>
      <div class="field-reveal" data-part="answer" hidden>
        <p data-part="feedback" role="status"></p>
        <label for="cap-energy">Stored electric energy</label>
        <meter id="cap-energy" data-part="energyBar" min="0" value="0"></meter>
        <p class="field-measurement" data-part="energy"></p>
        <p>E points up. H curls around the lead axis and points out of the page on the left (⊙) and into the page on the right (⊗). Their cross product <strong>S = E × H</strong> points inward. The rate of stored electric energy increase is the inward power, IV, in this model.</p>
      </div>
      <details class="field-surfaces">
        <summary>Compare the two Ampère–Maxwell surfaces</summary>
        <svg viewBox="0 0 480 200" role="img" aria-labelledby="cap-surface-title cap-surface-desc">
          <title id="cap-surface-title">Two surfaces with the same loop boundary</title>
          <desc id="cap-surface-desc">An edge-on sketch. The solid flat surface crosses the lower wire. The dashed bulging surface curves around the lower plate and crosses the vacuum gap. Both meet at the same two marked edges of the loop.</desc>
          <path d="M240 86V190 M140 86H340 M140 34H340" stroke="${ink}" stroke-width="6" fill="none"/>
          <path d="M92 152H388" stroke="${powerColor}" stroke-width="4"/>
          <path d="M92 152 C92 72 105 59 157 59 H323 C375 59 388 72 388 152" stroke="${electricColor}" stroke-width="4" stroke-dasharray="7 5" fill="none"/>
          <circle cx="92" cy="152" r="6" fill="${ink}"/><circle cx="388" cy="152" r="6" fill="${ink}"/>
          <text x="240" y="20" text-anchor="middle">Gap surface (dashed)</text>
          <text x="240" y="183" text-anchor="middle" style="paint-order:stroke;stroke:#fff;stroke-width:5px">Wire surface (solid)</text>
        </svg>
        <p class="field-measurement" data-part="surfaces"></p>
        <p>The two surfaces end on the same loop. The flat one counts charge crossing the wire. The bulging one goes around the plate, so it counts changing electric flux through the gap instead. That gives the same magnetic circulation.</p>
      </details>`;
    const ui = elements(mount, 'description electric power play step reset measurement prediction reveal answer feedback energyBar energy surfaces');
    ui.energyBar.max = capacitorState(cap.maxVoltage).energy * 1e9;
    let voltage = 0;
    function draw() {
      const value = capacitorState(voltage);
      const fraction = voltage / cap.maxVoltage;
      ui.reveal.disabled = !ui.prediction.value || voltage === 0;
      ui.electric.innerHTML = [157, 194, 231, 268, 305].map(x => arrow(x, 170, 0, -50 * fraction, electricColor)).join('') +
        (voltage > 0 ? '<text x="364" y="74">−</text><text x="364" y="195">+</text>' : '');
      ui.power.innerHTML = `<text x="99" y="96" fill="${magneticColor}">⊙</text><text x="366" y="96" fill="${magneticColor}">⊗</text>` +
        arrow(53, 140, 58 * fraction, 0, powerColor) + arrow(427, 140, -58 * fraction, 0, powerColor) +
        (voltage > 0 ? `<text x="68" y="166" fill="${powerColor}">S</text><text x="395" y="166" fill="${powerColor}">S</text>` : '');
      const nanoseconds = value.charge / cap.current * 1e9;
      ui.measurement.textContent = `Time ${fixed(nanoseconds, 0)} ns · plate charge ±${fixed(value.charge * 1e9, 3)} nC · upward E ${fixed(value.field / 1000)} kV/m`;
      ui.description.textContent = `The voltage is ${fixed(voltage, 1)} V. ${voltage > 0 ? 'Electric field arrows point upward in the gap.' : 'The electric field is zero initially.'}${ui.answer.hidden ? '' : voltage > 0 ? 'Energy crosses the sides inward.' : 'The instantaneous energy flow is initially zero.'}`;
      ui.energy.textContent = `Stored electric energy ${fixed(value.energy * 1e9)} nJ · inward power ${fixed(-value.outwardPower * 1000)} mW`;
      ui.energyBar.value = value.energy * 1e9;
      ui.surfaces.textContent = `Wire: I = ${fixed(cap.current * 1000)} mA · gap: ε₀ dΦE/dt = ${fixed(value.displacement * 1000)} mA`;
    }
    const stop = motion(ui.play, increment => {
      if (voltage >= cap.maxVoltage && increment === 0) voltage = 0;
      voltage = Math.min(cap.maxVoltage, voltage + increment);
      draw();
      return voltage < cap.maxVoltage;
    }, .0025);
    ui.step.addEventListener('click', () => { stop(); voltage = Math.min(cap.maxVoltage, voltage + 1); draw(); });
    ui.reset.addEventListener('click', () => {
      stop(); voltage = 0; ui.prediction.value = ''; ui.reveal.disabled = true;
      ui.answer.hidden = true;
      ui.power.toggleAttribute('hidden', true);
      draw();
    });
    ui.prediction.addEventListener('change', () => {
      ui.answer.hidden = true;
      ui.power.toggleAttribute('hidden', true);
      draw();
    });
    ui.reveal.addEventListener('click', () => {
      stop();
      ui.answer.hidden = false;
      ui.power.toggleAttribute('hidden', false);
      ui.feedback.textContent = ui.prediction.value === 'side' ? 'Correct. The arrows show energy entering through the curved side.' : 'Follow the horizontal arrows. They point inward through the curved side of the gap.';
      draw();
    });
    draw();
  }

  function conductorExplorer(mount) {
    mount.classList.add('field-explorer');
    mount.innerHTML = `
      <h3>Does charge accumulate in a narrowing wire?</h3>
      <p>Move and shrink the shaded slice. Arrow lengths encode current density. Watch how the flow bends as it passes through the narrower end.</p>
      <svg viewBox="0 0 480 236" role="img" aria-labelledby="wire-title wire-desc">
        <title id="wire-title">Cutaway of an insulated conductor that narrows to the right</title>
        <desc id="wire-desc" data-part="description"></desc>
        <g data-part="geometry"></g>
        <g data-part="slice"></g>
        <g data-part="vectors"></g>
        <g data-part="tracers"></g>
        <text x="36" y="220">wide end</text><text x="355" y="220">narrow end · +z</text>
      </svg>
      <div class="field-explorer-sliders">
        <div><label for="wire-position">Slice center <span data-part="positionValue"></span></label><input id="wire-position" data-part="position" type="range" min="30" max="170" value="100"></div>
        <div><label for="wire-width">Slice width <span data-part="widthValue"></span></label><input id="wire-width" data-part="width" type="range" min="12" max="52" value="40"></div>
      </div>
      <div class="field-explorer-controls">
        <button type="button" data-part="play" aria-label="Play or pause current tracers" aria-pressed="false">Play</button>
        <button type="button" data-part="step">Step tracers</button>
        <button type="button" data-part="reset">Reset slice</button>
      </div>
      <p class="field-assumptions">Steady 5 mA. Tracers depict the model current direction. The insulated walls carry zero outward current.</p>
      <label for="wire-prediction">Predict how charge in the slice changes.</label>
      <div class="field-explorer-controls">
        <select id="wire-prediction" data-part="prediction">
          <option value="">Choose a prediction</option>
          <option value="increases">Charge increases</option>
          <option value="steady">Charge stays constant</option>
          <option value="decreases">Charge decreases</option>
        </select>
        <button type="button" data-part="reveal" disabled>Reveal the current balance</button>
      </div>
      <div class="field-reveal" data-part="answer" hidden>
        <p data-part="feedback" role="status"></p>
        <p class="field-measurement" data-part="flux"></p>
        <p class="field-measurement" data-part="density"></p>
        <p class="field-measurement" data-part="divergence"></p>
        <p>The smaller exit has greater current density and less area. Their product gives the same total current as at the entrance. Locally, the axial contribution to ∇·J is canceled by the inward radial contribution. The continuity equation gives ∂ρ/∂t = −∇·J = 0.</p>
      </div>`;
    const ui = elements(mount, 'description geometry slice vectors tracers positionValue position widthValue width play step reset prediction reveal answer feedback flux density divergence');
    const x = z => 36 + 402 * z / wire.length;
    const y = (z, fraction) => 114 - 1000 * fraction * taperState(z, fraction).localRadius;
    const sample = Array.from({ length: 41 }, (_, i) => wire.length * i / 40);
    const path = (fraction, points = sample) => points.map(z => `${x(z)},${y(z, fraction)}`).join(' ');
    ui.geometry.innerHTML = `<polygon points="${path(1)} ${path(-1, [...sample].reverse())}" fill="#f5f3eb" stroke="${ink}" stroke-width="2"/>` +
      [-.66, -.33, 0, .33, .66].map(fraction => `<polyline points="${path(fraction)}" fill="none" stroke="#a5b8b2" stroke-width="1"/>`).join('');
    ui.vectors.innerHTML = [.02, .065, .11, .155].flatMap(z => [-.66, -.33, 0, .33, .66].map(fraction => {
      const value = taperState(z, fraction);
      return arrow(x(z), y(z, fraction), value.axial * 15, -value.radial * 7.5, electricColor);
    })).join('');
    let phase = 0;
    function drawTracers() {
      const domainTravel = 1 - Math.exp(-2 * wire.length / wire.scale);
      ui.tracers.innerHTML = [-.66, -.33, 0, .33, .66].flatMap(fraction => [0, .25, .50, .75].map(offset => {
        const t = (phase + offset) % 1;
        const z = -wire.scale * Math.log(1 - t * domainTravel) / 2;
        return `<circle cx="${x(z)}" cy="${y(z, fraction)}" r="3.5" fill="${electricColor}"/>`;
      })).join('');
    }
    function drawSlice() {
      const center = Number(ui.position.value) / 1000;
      const width = Number(ui.width.value) / 1000;
      const start = center - width / 2;
      const end = center + width / 2;
      const points = [start, center, end];
      const inlet = taperState(start, 0);
      const outlet = taperState(end, 0);
      const local = taperState(center, .55);
      ui.slice.innerHTML = `<polygon points="${path(1, points)} ${path(-1, [...points].reverse())}" fill="#e3b45f" fill-opacity=".42" stroke="${powerColor}" stroke-width="2"/>` +
        (ui.answer.hidden ? '' : `<circle cx="${x(center)}" cy="${y(center, .55)}" r="6" stroke="${powerColor}" stroke-width="2" fill="white"/>`);
      ui.positionValue.textContent = `${ui.position.value} mm`;
      ui.widthValue.textContent = `${ui.width.value} mm`;
      ui.position.setAttribute('aria-valuetext', ui.positionValue.textContent);
      ui.width.setAttribute('aria-valuetext', ui.widthValue.textContent);
      ui.description.textContent = `A slice from ${fixed(start * 1000, 0)} to ${fixed(end * 1000, 0)} millimeters is shaded. Current density arrows become longer toward the narrow end.${ui.answer.hidden ? '' : ' The outward current is negative at the entrance and equally positive at the exit.'}`;
      const net = (outlet.flux - inlet.flux) * 1000;
      ui.flux.textContent = `Outward current at entrance ${fixed(-inlet.flux * 1000)} mA · exit +${fixed(outlet.flux * 1000)} mA · net ${fixed(Math.abs(net) < 1e-10 ? 0 : net)} mA`;
      ui.density.textContent = `Axial current density ${fixed(inlet.axial)} → ${fixed(outlet.axial)} A/m² · area ${fixed(inlet.area * 1e4)} → ${fixed(outlet.area * 1e4)} cm²`;
      ui.divergence.textContent = `At the circled probe: axial ${fixed(local.axialDivergence)} + radial (${fixed(local.radialDivergence)}) = 0 A/m³`;
    }
    const stop = motion(ui.play, increment => { phase = (phase + increment) % 1; drawTracers(); return true; }, .00035);
    ui.step.addEventListener('click', () => { stop(); phase += .055; drawTracers(); });
    ui.reset.addEventListener('click', () => {
      stop(); phase = 0;
      ui.position.value = '100'; ui.width.value = '40'; ui.prediction.value = '';
      ui.reveal.disabled = true; ui.answer.hidden = true;
      drawSlice(); drawTracers();
    });
    ui.position.addEventListener('input', drawSlice);
    ui.width.addEventListener('input', drawSlice);
    ui.prediction.addEventListener('change', () => { ui.reveal.disabled = !ui.prediction.value; ui.answer.hidden = true; drawSlice(); });
    ui.reveal.addEventListener('click', () => {
      stop(); ui.answer.hidden = false;
      ui.feedback.textContent = ui.prediction.value === 'steady' ? 'Correct. The charge in the slice stays constant.' : 'The charge stays constant. Compare the equal and opposite outward currents on the two faces.';
      drawSlice();
    });
    drawSlice(); drawTracers();
  }

  const capacitor = document.getElementById('capacitor-explorer');
  const conductor = document.getElementById('conductor-explorer');
  if (capacitor) capacitorExplorer(capacitor);
  if (conductor) conductorExplorer(conductor);
})();
