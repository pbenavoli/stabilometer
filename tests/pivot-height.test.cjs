/*
Copyright (C) 2026 Patrick Benavoli

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://gnu.org>.
*/

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadTypeScript(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  const localRequire = (name) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    return require(name);
  };
  new Function('require', 'exports', outputText)(localRequire, exports);
  return exports;
}

const { parsePivotHeight } = loadTypeScript('src/lib/pivotHeight.ts');
const orientation = loadTypeScript('src/lib/orientation.ts');
const stability = loadTypeScript('src/lib/stability.ts', {
  '@/lib/orientation': orientation,
});
const { computeStabilityMetrics, DEFAULT_PIVOT_HEIGHT_CM } = stability;

test('height input accepts positive centimeters and rejects invalid values', () => {
  assert.equal(parsePivotHeight('100'), 100);
  assert.equal(parsePivotHeight(' 87,5 '), 87.5);
  assert.equal(parsePivotHeight('87.5'), 87.5);
  for (const invalid of ['', '0', '-1', '1e2', '1.2.3', 'abc', 'Infinity']) {
    assert.equal(parsePivotHeight(invalid), null, invalid);
  }
  assert.equal(DEFAULT_PIVOT_HEIGHT_CM, 100);
});

test('height scales sway coordinates, length, velocity and area', () => {
  const sample = (t, gx, gz) => ({ t, gx, gy: -9.8, gz, ax: 0, ay: 0, az: 0 });
  const samples = [
    sample(0, 0, 0),
    sample(1000, 0.1, 0),
    sample(2000, 0, 0.2),
    sample(3000, -0.1, -0.1),
  ];
  const base = computeStabilityMetrics(samples, 100);
  const doubled = computeStabilityMetrics(samples, 200);
  assert.ok(base && doubled);
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10);
  for (let i = 0; i < samples.length; i++) {
    near(doubled.points[i].x, base.points[i].x * 2);
    near(doubled.points[i].y, base.points[i].y * 2);
  }
  assert.ok(base.swayAreaCm2 > 0);
  near(doubled.pathLengthCm, base.pathLengthCm * 2);
  near(doubled.meanVelocityCmPerS, base.meanVelocityCmPerS * 2);
  near(doubled.swayAreaCm2, base.swayAreaCm2 * 4);
  near(doubled.ellipse.semiMajorCm, base.ellipse.semiMajorCm * 2);
  near(doubled.ellipse.semiMinorCm, base.ellipse.semiMinorCm * 2);
  near(doubled.stabilityIndex, 1000 / (doubled.swayAreaCm2 + 1));
});

test('legacy series retain the 100 cm height while new series retain their own height', () => {
  const { seriesPivotHeightCm } = loadTypeScript('src/hooks/useSeriesHistory.ts', {
    'expo-sqlite/kv-store': { default: {} },
    react: {},
    '@/lib/stability': stability,
  });
  assert.equal(seriesPivotHeightCm({}), 100);
  assert.equal(seriesPivotHeightCm({ pivotHeightCm: 87.5 }), 87.5);
});

test('completed series saves its selected height alongside its calculated results', async () => {
  let saved;
  const storage = {
    getItem: async () => null,
    setItem: async (key, value) => { saved = JSON.parse(value); },
  };
  const react = {
    useState: (initial) => [initial, () => {}],
    useRef: (initial) => ({ current: initial }),
    useEffect: () => {},
  };
  const { useSeriesHistory } = loadTypeScript('src/hooks/useSeriesHistory.ts', {
    'expo-sqlite/kv-store': storage,
    react,
    '@/lib/stability': stability,
  });
  const samples = [
    { t: 0, gx: 0, gy: -9.8, gz: 0, ax: 0, ay: 0, az: 0 },
    { t: 1000, gx: 0.1, gy: -9.8, gz: 0.2, ax: 0, ay: 0, az: 0 },
  ];
  const trial = computeStabilityMetrics(samples, 87.5);
  const aggregate = stability.aggregateTrials([trial]);
  await useSeriesHistory().saveSeries('With orthosis', aggregate, [trial], 30, 87.5, 'test');
  assert.equal(saved[0].pivotHeightCm, 87.5);
  assert.equal(saved[0].aggregate.meanSwayAreaCm2, trial.swayAreaCm2);
  assert.equal(saved[0].trialShapes.length, 1);
});

test('legacy options get the default height and height updates are persisted in order', async () => {
  let state;
  let effect;
  let queue;
  const writes = [];
  const react = {
    useState(initial) {
      state = initial;
      return [state, (value) => { state = value; }];
    },
    useRef(initial) {
      queue = { current: initial };
      return queue;
    },
    useEffect(callback) {
      effect = callback;
    },
  };
  const storage = {
    getItem: async () => JSON.stringify({ trialsPerSeries: 2, durationS: 45, defaultLabel: 'test' }),
    async setItem(key, value) {
      writes.push(JSON.parse(value));
    },
  };
  const { useMeasurementOptions } = loadTypeScript('src/hooks/useMeasurementOptions.ts', {
    'expo-sqlite/kv-store': storage,
    react,
    '@/lib/stability': stability,
  });
  const hook = useMeasurementOptions();
  effect();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(state.pivotHeightCm, 100);
  assert.equal(state.durationS, 45);
  hook.updateOptions({ ...state, pivotHeightCm: 87.5 });
  hook.updateOptions({ ...state, pivotHeightCm: 90 });
  await queue.current;
  assert.deepEqual(writes.map((write) => write.pivotHeightCm), [87.5, 90]);
});
