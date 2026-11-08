import * as Haptics from 'expo-haptics';

const PULSE_GAP_MS = 100;

/** A single impact is easy to miss; a short burst of heavy ones is much easier to feel. */
export function strongBuzz(pulses = 3) {
  for (let i = 0; i < pulses; i++) {
    setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, i * PULSE_GAP_MS);
  }
}
