/* Browser representation cross-checked with the Python boundary solver. */
(function(root){
  'use strict';
  function coating(wavelength, thickness, n1, nf, n3){
    if (![wavelength,n1,nf,n3].every(x=>Number.isFinite(x)&&x>0) || !Number.isFinite(thickness) || thickness<0) {
      throw new RangeError('Invalid coating parameters');
    }
    const a=(n1-nf)/(n1+nf), b=(nf-n3)/(nf+n3);
    const angle=4*Math.PI*nf*thickness/wavelength, cos=Math.cos(angle);
    const norm=1+(a*b)**2+2*a*b*cos;
    const reflectance=((a+b*cos)**2+(b*Math.sin(angle))**2)/norm;
    const transmittance=n3/n1*((1+a)*(1+b))**2/norm;
    return {reflectance,transmittance};
  }
  const model={coating};
  if(typeof module==='object')module.exports=model;
  else root.FieldLab=model;
})(globalThis);
