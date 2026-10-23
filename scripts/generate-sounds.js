// One-off script to generate short WAV beep tones for session start/end audio cues.
// Run with: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;

function toneSamples(freqHz, durationMs, amplitude = 0.5) {
  const n = Math.round((SAMPLE_RATE * durationMs) / 1000);
  const samples = new Float32Array(n);
  const fadeSamples = Math.min(200, Math.floor(n / 4));
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > n - fadeSamples) env = (n - i) / fadeSamples;
    samples[i] = Math.sin(2 * Math.PI * freqHz * t) * amplitude * env;
  }
  return samples;
}

function writeWav(filePath, floatSamples) {
  const numSamples = floatSamples.length;
  const blockAlign = 2; // mono, 16-bit
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

// Single short blip: played 1x/2x/3x depending on which trial (1/2/3) is starting.
writeWav(path.join(outDir, 'session-start.wav'), toneSamples(1000, 180));
// Single long tone: signals the whole series/trial is over.
writeWav(path.join(outDir, 'session-end.wav'), toneSamples(600, 700));

console.log('Generated session-start.wav and session-end.wav in assets/sounds/');
