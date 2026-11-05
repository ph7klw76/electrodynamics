'use strict';

(() => {
  const model = window.FieldLab;
  const TAU = 2 * Math.PI;
  const signed = (value, digits = 3) => (Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value).toFixed(digits);
  const slider = (id, label, min, max, step, initial) =>
    `<label for="${id}">${label}<output for="${id}" aria-live="off"></output></label>
     <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${initial}">`;
  const svg = (id, title, width, height) =>
    `<svg class="wave-diagram" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title">
       <title id="${id}-title">${title}</title><g></g>
     </svg>`;
  const markers = (id, colors) => `<defs>${Object.keys(colors).map(name =>
    `<marker id="${id}-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
       <path fill="${colors[name]}" d="M 0 0 L 10 5 L 0 10 z"/>
     </marker>`).join('')}</defs>`;
  const arrow = (id, name, x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="vector ${name}" marker-end="url(#${id}-${name})"/>`;
  const colors = {electric: '#087d73', magnetic: '#82571d', total: '#12313d'};

  function connectClock(host, input, render, step) {
    const play = host.querySelector('[data-play]');
    let request = 0;
    let previous;
    let time = Number(input.value);

    function stop() {
      cancelAnimationFrame(request);
      request = 0;
      previous = undefined;
      play.textContent = 'Play';
    }

    function tick(now) {
      if (previous !== undefined) time += (now - previous) / 1500;
      previous = now;
      input.value = Math.min(time, Number(input.max));
      render();
      if (time < Number(input.max)) request = requestAnimationFrame(tick);
      else stop();
    }

    play.addEventListener('click', () => {
      if (request) {
        stop();
        return;
      }
      time = Number(input.value);
      if (time >= Number(input.max)) time = Number(input.min);
      play.textContent = 'Pause';
      request = requestAnimationFrame(tick);
    });
    host.querySelector('[data-step]').addEventListener('click', () => {
      stop();
      const current = Number(input.value);
      input.value = current >= Number(input.max) ? input.min : Math.min(Number(input.max), current + step);
      render();
    });
    host.querySelector('[data-reset]').addEventListener('click', () => {
      stop();
      host.querySelectorAll('input').forEach(control => { control.value = control.defaultValue; });
      host.querySelectorAll('select').forEach(control => { control.selectedIndex = 0; });
      host.querySelectorAll('details').forEach(disclosure => { disclosure.open = false; });
      render();
    });
    input.addEventListener('input', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  }

  const transport = `<div class="wave-transport">
    <button type="button" data-play>Play</button>
    <button type="button" data-step>Step</button>
    <button type="button" data-reset>Reset</button>
  </div>`;

  function setupSolenoid(host) {
    host.classList.add('wave-explorer');
    host.innerHTML = `<p>Look from +z at an ideal, infinitely long solenoid. Predict what changes when you reverse the magnetic ramp or move the small loop.</p>
      <div class="wave-layout"><div class="wave-controls">
        ${slider('coil-start', 'Starting axial B (T)', -1, 1, 0.1, 0.6)}
        ${slider('coil-ramp', 'Axial field ramp (T/s)', -0.5, 0.5, 0.05, 0.25)}
        ${slider('coil-time', 'Elapsed model time (s)', 0, 2, 0.01, 0)}
        ${slider('coil-loop', 'Small-loop center (coil radii)', 1.8, 3.2, 0.05, 2.6)}
        ${transport}
      </div><div class="wave-figure">
        ${svg('coil-picture', 'Axial magnetic field, induced electric field and two integration loops', 360, 251)}
        <p class="wave-caption" data-result></p>
        <details>
          <summary>Check the flux and circulation</summary>
          <p class="wave-caption" data-circulation></p>
          <p class="wave-caption">Solid blue and dashed gold show positive and negative contributions to the counterclockwise line integral. The small disk stays outside the coil, where its magnetic flux is zero. Its positive and negative contributions cancel even when the local electric field is nonzero. Faraday’s law gives circulation = −dΦ<sub>B</sub>/dt.</p>
        </details>
      </div></div>`;
    const [start, ramp, time, center] = host.querySelectorAll('input');
    const diagram = host.querySelector('svg');
    const scene = diagram.querySelector('g');
    const result = host.querySelector('[data-result]');
    const circulation = host.querySelector('[data-circulation]');
    const radius = 0.05;
    const smallRadius = 0.62;
    const loopRadius = 2.08;
    const x0 = 127;
    const y0 = 119;
    const scale = 42;
    const cx = r => x0 + r * scale;
    const cy = y => y0 - y * scale;

    function render() {
      const bRate = Number(ramp.value);
      const b = Number(start.value) + bRate * Number(time.value);
      const smallCenter = Number(center.value);
      for (const control of [start, ramp, time, center]) {
        host.querySelector(`output[for="${control.id}"]`).value = signed(Number(control.value), 2);
      }
      const largeSign = bRate < 0 ? 'contribution-positive' : bRate > 0 ? 'contribution-negative' : 'coil-loop';
      const graphics = [markers('coil', colors),
        `<circle cx="${x0}" cy="${y0}" r="${scale}" class="coil-body"/>`,
        `<circle cx="${x0}" cy="${y0}" r="${loopRadius * scale}" class="${largeSign}"/>`,
        `<text x="18" y="22">Large loop</text>
          <text x="${cx(smallCenter)}" y="${y0 + smallRadius * scale + 25}" text-anchor="middle">Small loop</text>
          <text x="18" y="231">Teal arrows · electric field E</text>`];
      for (const [x, y] of [[0, 0], [-0.48, -0.48], [0.48, -0.48], [-0.48, 0.48], [0.48, 0.48]]) {
        const symbol = Math.abs(b) < 1e-8 ? '' : b > 0 ? '⊙' : '⊗';
        graphics.push(`<text x="${cx(x)}" y="${cy(y) + 5}" class="field-marker" text-anchor="middle">${symbol}</text>`);
      }
      for (const r of [0.85, 1.48, 2.52]) {
        for (let i = 0; i < 8; i++) {
          const angle = (i + 0.35) * TAU / 8;
          const x = cx(r * Math.cos(angle));
          const y = cy(r * Math.sin(angle));
          const length = 1650 * model.solenoidE(r * radius, radius, bRate);
          if (Math.abs(length) >= 0.2) {
            graphics.push(arrow('coil', 'electric', x, y, x - length * Math.sin(angle), y - length * Math.cos(angle)));
          }
        }
      }
      const segmentSums = [];
      for (let segment = 0; segment < 4; segment++) {
        const first = segment * TAU / 4;
        const last = first + TAU / 4;
        let integral = 0;
        for (let i = 0; i < 24; i++) {
          const a = first + (i + 0.5) * (last - first) / 24;
          const x = smallCenter + smallRadius * Math.cos(a);
          const y = smallRadius * Math.sin(a);
          const r = Math.hypot(x, y);
          const tangentDot = (x * Math.cos(a) + y * Math.sin(a)) / r;
          integral += model.solenoidE(r * radius, radius, bRate) * tangentDot * smallRadius * radius * (last - first) / 24;
        }
        segmentSums.push(integral);
        const px = a => cx(smallCenter + smallRadius * Math.cos(a));
        const py = a => cy(smallRadius * Math.sin(a));
        const segmentClass = integral > 1e-12 ? 'contribution-positive' : integral < -1e-12 ? 'contribution-negative' : 'coil-loop';
        graphics.push(`<path class="${segmentClass}" d="M ${px(first)} ${py(first)} A ${smallRadius * scale} ${smallRadius * scale} 0 0 0 ${px(last)} ${py(last)}"/>`);
      }
      scene.innerHTML = graphics.join('');
      const direction = bRate > 0 ? 'clockwise' : bRate < 0 ? 'counterclockwise' : 'zero';
      const axial = Math.abs(b) < 1e-8 ? 'zero' : b > 0 ? 'out of the page (⊙)' : 'into the page (⊗)';
      result.textContent = `Axial B = ${signed(b, 2)} T, ${axial}. The electric circulation is ${direction}. Both loops are oriented counterclockwise.`;
      const large = TAU * loopRadius * radius * model.solenoidE(loopRadius * radius, radius, bRate);
      const small = segmentSums.reduce((sum, contribution) => sum + contribution, 0);
      const local = model.solenoidE(smallCenter * radius, radius, bRate);
      circulation.textContent = `Large-loop circulation ${signed(1000 * large)} mV. Small-loop circulation ≈ ${signed(1000 * small)} mV. Eφ at the center of the small loop is ${signed(1000 * local)} mV/m.`;
    }

    [start, ramp, time, center].forEach(control => control.addEventListener('input', render));
    connectClock(host, time, render, 0.25);
    render();
  }

  function setupReflection(host) {
    host.classList.add('wave-explorer');
    host.innerHTML = `<p>Predict what reversing the material order does to the reflected electric field. Scrub the phase to compare all three waves at the interface.</p>
      <div class="wave-layout"><div class="wave-controls">
        <label for="wave-order">Material order</label>
        <select id="wave-order"><option value="forward">Air → glass</option><option value="reverse">Glass → air</option></select>
        ${slider('wave-time', 'Elapsed wave periods', 0, 1, 0.01, 0)}
        ${transport}
      </div><div class="wave-figure">
        ${svg('boundary-picture', 'Plane electric and magnetic waves at a dielectric boundary', 460, 224)}
        <p class="wave-legend"><span class="incoming">Incident</span><span class="backward">Reflected</span><span class="continuity">Total at each side</span></p>
        <p class="wave-caption" data-result></p>
        <details><summary>Check the field matching</summary><p class="wave-caption" data-boundary></p>
        <p class="wave-caption">The total tangential electric and magnetic fields match at the boundary. H reverses sign relative to E for the backward wave. The plots use a common electric amplitude unit and show H scaled by the vacuum impedance Z₀.</p></details>
      </div></div>`;
    const time = host.querySelector('input');
    const order = host.querySelector('select');
    const output = host.querySelector('output');
    const scene = host.querySelector('svg g');

    function render() {
      const [n1, n2] = order.value === 'forward' ? [1, 1.5] : [1.5, 1];
      const {r, t, reflectance} = model.waveInterface(n1, n2);
      const phase = TAU * Number(time.value);
      output.value = signed(Number(time.value), 2);
      const center = 238;
      const incoming = z => Math.cos(TAU * n1 * z - phase);
      const reflected = z => r * Math.cos(-TAU * n1 * z - phase);
      const transmitted = z => t * Math.cos(TAU * n2 * z - phase);
      const trace = (first, last, y, name, signal) => {
        const points = Array.from({length: 101}, (_, i) => {
          const z = first + (last - first) * i / 100;
          return `${(center + 190 * z).toFixed(2)},${(y - 20 * signal(z)).toFixed(2)}`;
        });
        return `<polyline class="${name}" points="${points.join(' ')}"/>`;
      };
      scene.innerHTML = `<path class="diagram-axis" d="M 39 75 H 435 M 39 167 H 435"/>
        <path class="boundary-line" d="M ${center} 22 V 207"/>
        <text x="63" y="17">Incident side, n = ${n1}</text><text x="254" y="17">Second medium, n = ${n2}</text>
        <text x="7" y="79">E</text><text x="7" y="171">Z₀H</text>
        <text x="178" y="222">Interface at z = 0</text>
        ${trace(-1, 0, 75, 'incoming', incoming)}
        ${trace(-1, 0, 75, 'backward', reflected)}
        ${trace(-1, 0, 75, 'continuity', z => incoming(z) + reflected(z))}
        ${trace(0, 1, 75, 'continuity', transmitted)}
        ${trace(-1, 0, 167, 'incoming', z => n1 * incoming(z))}
        ${trace(-1, 0, 167, 'backward', z => -n1 * reflected(z))}
        ${trace(-1, 0, 167, 'continuity', z => n1 * (incoming(z) - reflected(z)))}
        ${trace(0, 1, 167, 'continuity', z => n2 * transmitted(z))}
        <circle class="boundary-point" cx="${center}" cy="${75 - 20 * transmitted(0)}" r="4"/>
        <circle class="boundary-point" cx="${center}" cy="${167 - 20 * n2 * transmitted(0)}" r="4"/>`;
      host.querySelector('[data-result]').textContent = `Reflected electric amplitude r = ${signed(r, 2)}. Reflected power = ${(100 * reflectance).toFixed(1)}%. The reflected E is ${r < 0 ? 'phase-inverted' : 'in phase'} relative to the incident E at z = 0.`;
      const electricLeft = incoming(0) + reflected(0);
      const magneticLeft = n1 * (incoming(0) - reflected(0));
      const electricRight = transmitted(0);
      const magneticRight = n2 * transmitted(0);
      host.querySelector('[data-boundary]').textContent = `E at the boundary (left, right) = (${signed(electricLeft)}, ${signed(electricRight)}). Scaled Z₀H (left, right) = (${signed(magneticLeft)}, ${signed(magneticRight)}).`;
    }

    [time, order].forEach(control => control.addEventListener('input', render));
    connectClock(host, time, render, 0.125);
    render();
  }

  function setupFilm(host) {
    const wavelength = document.querySelector('#wavelength');
    const thickness = document.querySelector('#thickness');
    if (!wavelength || !thickness) return;
    host.classList.add('film-phasors');
    host.innerHTML = `<h3>See the reflected amplitudes add</h3>
      <p class="wave-caption">Predict what moving either slider does to the reflected amplitude. Then follow the arrows from the entrance face and from inside the film.</p>
      ${svg('film-picture', 'Film geometry and vector addition of complex reflected amplitudes', 460, 280)}
      <p class="wave-legend"><span class="incoming">Direct reflection</span><span class="backward">All returns from film</span><span class="continuity">Net reflected E</span></p>
      <p class="wave-caption" data-result></p>`;
    const scene = host.querySelector('svg g');

    function render() {
      const nm = Number(wavelength.value);
      const d = Number(thickness.value);
      const result = model.coating(nm, d, 1, Math.sqrt(1.5), 1.5);
      const startX = 223;
      const startY = 181;
      const scale = 535;
      const directX = startX + scale * result.direct;
      const endX = startX + scale * result.reflectedX;
      const endY = startY - scale * result.returnY;
      const backFace = 191 + 0.56 * d;
      const net = Math.sqrt(result.reflectance);
      scene.innerHTML = markers('film', colors) + `
        <rect class="film-layer" x="164" y="32" width="${backFace - 164}" height="46"/>
        <rect class="film-substrate" x="${backFace}" y="32" width="${405 - backFace}" height="46"/>
        <text x="61" y="24">Air</text><text x="174" y="24">Film</text><text x="328" y="24">Glass</text>
        <line class="diagram-axis" x1="164" y1="78" x2="164" y2="89"/>
        <line class="diagram-axis" x1="${backFace}" y1="78" x2="${backFace}" y2="89"/>
        <text x="165" y="104">d = ${d.toFixed(2)} nm</text>
        ${arrow('film', 'electric', 65, 43, 160, 43)}
        ${arrow('film', 'electric', 162, 55, 90, 55)}
        ${arrow('film', 'magnetic', backFace - 2, 67, 91, 67)}
        <path class="diagram-axis" d="M 61 ${startY} H 405 M ${startX} 125 V 249"/>
        <text x="386" y="200">Re</text><text x="231" y="133">Im</text>
        ${arrow('film', 'electric', startX, startY, directX, startY)}
        ${arrow('film', 'magnetic', directX, startY, endX, endY)}
        ${net > 0.004 ? arrow('film', 'total', startX, startY, endX, endY) : `<circle cx="${startX}" cy="${startY}" r="5" class="boundary-point"/>`}
        <text x="59" y="269">Complex electric amplitudes divided by the incident amplitude</text>`;
      host.querySelector('[data-result]').textContent = `At ${nm} nm, the round trip adds ${(result.angle * 180 / Math.PI).toFixed(1)}° of propagation phase. The net amplitude is ${net.toFixed(4)} and its squared magnitude gives ${(100 * result.reflectance).toFixed(3)}% reflectance.`;
    }

    [wavelength, thickness].forEach(control => control.addEventListener('input', render));
    wavelength.form?.addEventListener('reset', () => requestAnimationFrame(render));
    render();
  }

  const solenoid = document.querySelector('#solenoid-explorer');
  const reflection = document.querySelector('#reflection-explorer');
  const film = document.querySelector('#film-phasors');
  if (solenoid) setupSolenoid(solenoid);
  if (reflection) setupReflection(reflection);
  if (film) setupFilm(film);
})();
