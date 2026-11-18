/* Prediction, reveal and transfer paths on the built site or its live Pages URL. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');

async function checkFieldStudies(browser, base) {
  const root = path.join(__dirname, '..');
  const fixtures = JSON.parse(execFileSync(process.env.PYTHON || 'python', ['-c', [
    'import json',
    'from math import log',
    'from course.physics import solenoid_e, interface, capacitor, taper_j',
    'print(json.dumps(dict(probe=[float(abs(solenoid_e(i / 400, .05, .4)) * 1000) for i in range(61)],',
    '                      match=[interface(1.5, 1 + i / 100)[0] for i in range(101)],',
    '                      power=[1000*capacitor(.05, .001, 10, (i-20)/10000)[-1] for i in range(41)],',
    '                      density=[taper_j(0, .2*log(4/(2+i/20)), .004, .2, .004)[1] for i in range(41)])))'
  ].join('\n')], {cwd: root, encoding: 'utf8'}));
  const cases = [
    {id:'probe', hash:'induction-probe', target:10, min:0, max:15, step:.25, limits:[0,10], digits:2, unit:'mV/m'},
    {id:'match', hash:'index-match', target:1.5, min:1, max:2, step:.01, limits:[-.2,.2], digits:3, unit:'times'},
    {id:'power', hash:'capacitor-power', target:-2, min:-2, max:2, step:.1, limits:[-20,20], digits:1, unit:'mW'},
    {id:'density', hash:'wire-density', target:2, min:2, max:4, step:.05, limits:[0,320], digits:2, unit:'A/m²'}
  ];
  for (const phone of [false, true]) {
    const context = await browser.newContext({hasTouch:phone, reducedMotion:'reduce',
      viewport:phone ? {width:390, height:844} : {width:1280, height:900}});
    try {
      const page = await context.newPage();
      for (const c of cases) {
        await page.goto(base + '#' + c.hash, {waitUntil:'domcontentloaded'});
        const host = page.locator(`[data-study="${c.id}"]`);
        const select = host.getByRole('combobox'), button = host.locator('[data-try]');
        const slider = host.locator('input'), details = host.locator('details');
        const diagram = host.locator('svg').first(), curve = host.locator('svg').last();
        assert.ok(await button.isDisabled());
        assert.ok(await details.isHidden());
        assert.equal(await curve.locator('polyline').count(), 0);
        const baseline = await diagram.innerHTML();
        await select.selectOption(phone ? '1' : '0');
        if (phone) await button.tap(); else await button.press('Enter');
        assert.ok((await host.locator('[data-feedback]').innerText()).startsWith(phone ? 'Your prediction matches' : 'Compare your prediction'));
        assert.equal(Number(await slider.inputValue()), c.target);
        assert.notEqual(await diagram.innerHTML(), baseline);
        const python = fixtures[c.id];
        // Exercise the actual slider binding, including zero and the transition between regimes.
        const sweep = await host.evaluate((element, count) => {
          const input = element.querySelector('input');
          const saved = input.value;
          const samples = Array.from({length:count}, (_, i) => {
            input.value = Number(input.min) + i * Number(input.step);
            input.dispatchEvent(new Event('input'));
            return Number(element.querySelector('[data-marker]').getAttribute('cy'));
          });
          input.value = saved;
          input.dispatchEvent(new Event('input'));
          return samples;
        }, python.length);
        const [low, high] = c.limits;
        sweep.forEach((v, i) => assert.ok(Math.abs(v - (116 - 83 * (python[i] - low) / (high - low))) < 1e-8));
        async function checkMarker() {
          const x = Number(await slider.inputValue()), y = python[Math.round((x - c.min) / c.step)];
          const marker = curve.locator('[data-marker]');
          assert.ok(Math.abs(Number(await marker.getAttribute('cx')) - (47 + 237 * (x - c.min) / (c.max - c.min))) < .001);
          assert.ok(Math.abs(Number(await marker.getAttribute('cy')) - (116 - 83 * (y - low) / (high - low))) < .001);
          const reading = await host.locator('[data-reading]').innerText();
          assert.ok(reading.includes(y.toFixed(c.digits) + ' ' + c.unit), reading);
        }
        await checkMarker();
        if (phone) {
          const box = await slider.boundingBox();
          await slider.tap({position:{x:box.width * .83, y:box.height / 2}});
        } else {
          await slider.press('End');
          assert.equal(Number(await slider.inputValue()), c.max);
        }
        assert.notEqual(Number(await slider.inputValue()), c.target);
        await checkMarker();
        assert.ok(!await details.evaluate(el => el.open));
        await details.locator('summary').click();
        assert.ok(await details.getByRole('link').isVisible());
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await host.locator('[data-again]').click();
        assert.equal(await diagram.innerHTML(), baseline);
        assert.ok(await details.isHidden());
      }
    } finally {
      await context.close();
    }
  }
  return {layouts:['desktop keyboard', 'phone touch'], modelCases:Object.values(fixtures).reduce((n, rows) => n + rows.length, 0), studies:cases.length};
}
module.exports = {checkFieldStudies};
if (require.main === module) (async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || undefined});
  try { console.log(await checkFieldStudies(browser, process.argv[2])); }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
