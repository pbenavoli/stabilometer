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

export interface MotionSample {
  /** Milliseconds since the session started. */
  t: number;
  /** Gravity in the phone's frame, m/s^2 (pointing down): x to the screen's right, y up the screen, z out of the screen. */
  gx: number;
  gy: number;
  gz: number;
  /** Gravity-compensated acceleration, m/s^2. */
  ax: number;
  ay: number;
  az: number;
}
