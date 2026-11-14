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
  Fragment: 'Fragment',
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};

function loadScreen(file, dependencies, useState = () => {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  const localRequire = (name) => {
    if (name === 'react/jsx-runtime') return jsxRuntime;
    if (name === 'react') return { useMemo: (factory) => factory(), useState };
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

function fragmentChildren(node) {
  return node.type === jsxRuntime.Fragment ? node.props.children : [node];
}

function descendants(node) {
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (node == null || typeof node !== 'object') return [];
  return [node, ...descendants(node.props.children)];
}

test('About displays the configured version and complete license notice', () => {
  const constants = { expoConfig: { version: '2.7.3' } };
  const About = loadScreen('src/app/(tabs)/about.tsx', {
    'expo-constants': constants,
    '@/components/MarkdownDocument': 'MarkdownDocument',
    'react-native': {
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      Text: 'Text',
      StyleSheet: { create: (styles) => styles },
    },
    '@/components/commonStyles': { commonStyles: {} },
    '../../../USAGE.md': fs.readFileSync(path.join(__dirname, '../USAGE.md'), 'utf8'),
  }, (initialValue) => [initialValue, () => {}]);
  const paragraphs = fragmentChildren(About().props.children).map(textContent);
  assert.equal(paragraphs[1], 'Version: 2.7.3');
  const normalize = (text) => text.replace(/\s+/g, ' ').trim();
  const source = fs.readFileSync(path.join(__dirname, '../src/app/(tabs)/about.tsx'), 'utf8');
  const header = source.slice(3, source.indexOf('*/')).trim();
  assert.equal(normalize(paragraphs.slice(3, 7).join(' ')), normalize(header));
  assert.equal(paragraphs[7], 'Read user manual');

  constants.expoConfig = null;
  assert.equal(textContent(fragmentChildren(About().props.children)[1]), 'Version: Unavailable');
});

test('About displays the bundled Markdown usage guide and can return to About', () => {
  const usageGuide = fs.readFileSync(path.join(__dirname, '../USAGE.md'), 'utf8');
  let showManual = false;
  const setShowManual = (value) => {
    showManual = value;
  };
  const About = loadScreen('src/app/(tabs)/about.tsx', {
    'expo-constants': { expoConfig: { version: '2.7.3' } },
    '@/components/MarkdownDocument': 'MarkdownDocument',
    'react-native': {
      Pressable: 'Pressable',
      ScrollView: 'ScrollView',
      Text: 'Text',
      StyleSheet: { create: (styles) => styles },
    },
    '@/components/commonStyles': { commonStyles: { button: {}, buttonText: {}, title: {}, subtitle: {} } },
    '../../../USAGE.md': usageGuide,
  }, (initialValue) => [showManual || initialValue, setShowManual]);

  const about = About();
  fragmentChildren(about.props.children)[7].props.onPress();
  const manual = About();
  const manualChildren = fragmentChildren(manual.props.children);
  const markdown = manualChildren[1];
  assert.equal(markdown.type, 'MarkdownDocument');
  assert.equal(markdown.props.markdown, usageGuide);

  manualChildren[0].props.onPress();
  assert.equal(fragmentChildren(About().props.children)[0].props.children, 'About Stabilometer');
});

test('Markdown document renders headings, emphasis, links, and both list styles', () => {
  const MarkdownDocument = loadScreen('src/components/MarkdownDocument.tsx', {
    '@native-html/render': 'RenderHTML',
    'react-native': {
      StyleSheet: { create: (styles) => styles },
      View: 'View',
      useWindowDimensions: () => ({ width: 390 }),
    },
  });
  const document = MarkdownDocument({
    markdown: '# Manual\n\nThis is **important**.\n\n- First point\n- [Second point](./guide.pdf)\n\n1. Step one\n2. Step two',
  });
  const renderer = document.props.children;
  assert.equal(renderer.type, 'RenderHTML');
  assert.equal(renderer.props.contentWidth, 342);
  assert.match(renderer.props.source.html, /<h1>Manual<\/h1>/);
  assert.match(renderer.props.source.html, /<strong>important<\/strong>/);
  assert.match(renderer.props.source.html, /<li>First point<\/li>/);
  assert.match(renderer.props.source.html, /<ol>\s*<li>Step one<\/li>/);
  assert.equal(renderer.props.renderers, undefined);

  const usageGuide = fs.readFileSync(path.join(__dirname, '../USAGE.md'), 'utf8');
  const renderedGuide = MarkdownDocument({ markdown: usageGuide });
  assert.doesNotMatch(renderedGuide.props.children.props.source.html, /<img\b/);
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
