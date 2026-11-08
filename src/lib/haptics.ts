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
