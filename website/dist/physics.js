/* Browser representation cross-checked with the Python boundary solver. */
(function(root){
  'use strict';
  function waveInterface(n1, n2) {
    if (![n1, n2].every(n => Number.isFinite(n) && n > 0)) {
      throw new RangeError('Expected finite positive refractive indices');
    }
    const r = (n1 - n2) / (n1 + n2);
    const t = 1 + r;
    return {r, t, reflectance: r * r, transmittance: n2 / n1 * t * t};
  }

  function solenoidE(r, radius, rate) {
    if (![r, radius, rate].every(Number.isFinite) || r < 0 || radius <= 0) {
      throw new RangeError('Expected a positive coil radius and nonnegative probe radius');
    }
    return -0.5 * rate * (r <= radius ? r : radius * radius / r);
  }

  function coating(wavelength, thickness, n1, nf, n3){
    if (![wavelength,n1,nf,n3].every(x=>Number.isFinite(x)&&x>0) || !Number.isFinite(thickness) || thickness<0) {
      throw new RangeError('Invalid coating parameters');
    }
    const {r: a} = waveInterface(n1, nf);
    const {r: b} = waveInterface(nf, n3);
    const angle = 4 * Math.PI * nf * thickness / wavelength;
    const phaseX = Math.cos(angle);
    const phaseY = Math.sin(angle);
    const denominatorX = 1 + a * b * phaseX;
    const denominatorY = a * b * phaseY;
    const norm = denominatorX ** 2 + denominatorY ** 2;
    // Exact sum of the returns from the film after the direct reflection a.
    const returnScale = (1 - a ** 2) * b / norm;
    const returnX = returnScale * (phaseX * denominatorX + phaseY * denominatorY);
    const returnY = returnScale * (phaseY * denominatorX - phaseX * denominatorY);
    const reflectedX = a + returnX;
    const reflectance = reflectedX ** 2 + returnY ** 2;
    const transmittance=n3/n1*((1+a)*(1+b))**2/norm;
    return {reflectance, transmittance, angle, direct: a, returnX, returnY, reflectedX};
  }
  const model={coating, waveInterface, solenoidE};
  if(typeof module==='object')module.exports=model;
  else root.FieldLab=model;
})(globalThis);
