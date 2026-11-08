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

const jsxRuntime = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};

function loadScreen(file, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  const localRequire = (name) => {
    if (name === 'react/jsx-runtime') return jsxRuntime;
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    return require(name);
  };
  new Function('require', 'exports', outputText)(localRequire, exports);
  return exports.default;
}

function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return textContent(node.props.children);
}

test('About displays the configured version and complete license notice', () => {
  const constants = { expoConfig: { version: '2.7.3' } };
  const About = loadScreen('src/app/(tabs)/about.tsx', {
    'expo-constants': constants,
    'react-native': { ScrollView: 'ScrollView', Text: 'Text', StyleSheet: { create: (styles) => styles } },
    '@/components/commonStyles': { commonStyles: {} },
  });
  const paragraphs = About().props.children.map(textContent);
  assert.equal(paragraphs[1], 'Version: 2.7.3');
  const normalize = (text) => text.replace(/\s+/g, ' ').trim();
  const source = fs.readFileSync(path.join(__dirname, '../src/app/(tabs)/about.tsx'), 'utf8');
  const header = source.slice(3, source.indexOf('*/')).trim();
  assert.equal(normalize(paragraphs.slice(3).join(' ')), normalize(header));

  constants.expoConfig = null;
  assert.equal(textContent(About().props.children[1]), 'Version: Unavailable');
});

test('About is a tab and navigation remains hidden during a measurement', () => {
  const tabs = { Screen: 'Screen' };
  let measuring = false;
  const Layout = loadScreen('src/app/(tabs)/_layout.tsx', {
    'expo-router': { Tabs: tabs },
    '@/context/AppStateProvider': { useAppState: () => ({ isMeasuring: measuring }) },
  });
  const idle = Layout();
  assert.deepEqual(idle.props.children.map((screen) => screen.props.name), ['index', 'series', 'chart', 'live', 'about']);
  assert.equal(idle.props.screenOptions.tabBarStyle, undefined);
  measuring = true;
  assert.deepEqual(Layout().props.screenOptions.tabBarStyle, { display: 'none' });
});
