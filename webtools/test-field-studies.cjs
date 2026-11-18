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
    'from course.physics import solenoid_e, interface',
    'print(json.dumps(dict(probe=[float(abs(solenoid_e(i / 400, .05, .4)) * 1000) for i in range(61)],',
    '                      match=[interface(1.5, 1 + i / 100)[0] for i in range(101)])))'
  ].join('\n')], {cwd: root, encoding: 'utf8'}));
  const cases = [
    {id:'probe', hash:'induction-probe', initial:5, target:10, min:0, max:15, step:.25, ticks:60},
    {id:'match', hash:'index-match', initial:1, target:1.5, min:1, max:2, step:.01, ticks:100}
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
        const browserValues = await page.evaluate(({id, min, step, ticks}) => Array.from({length:ticks + 1}, (_, i) => {
          const x = min + i * step;
          return id === 'probe' ? Math.abs(FieldLab.solenoidE(x / 100, .05, .4)) * 1000 : FieldLab.waveInterface(1.5, x).r;
        }), c);
        browserValues.forEach((v, i) => assert.ok(Math.abs(v - python[i]) < 1e-10));
        async function checkMarker() {
          const x = Number(await slider.inputValue()), y = python[Math.round((x - c.min) / c.step)];
          const [low, high] = c.id === 'probe' ? [0,10] : [-.2,.2];
          const marker = curve.locator('[data-marker]');
          assert.ok(Math.abs(Number(await marker.getAttribute('cx')) - (47 + 237 * (x - c.min) / (c.max - c.min))) < .001);
          assert.ok(Math.abs(Number(await marker.getAttribute('cy')) - (116 - 83 * (y - low) / (high - low))) < .001);
          const reading = await host.locator('[data-reading]').innerText();
          assert.ok(reading.includes(c.id === 'probe' ? y.toFixed(2) + ' mV/m' : y.toFixed(3) + ' times'), reading);
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
  return {layouts:['desktop keyboard', 'phone touch'], modelCases:162, studies:2};
}
module.exports = {checkFieldStudies};
if (require.main === module) (async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || undefined});
  try { console.log(await checkFieldStudies(browser, process.argv[2])); }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
