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

import type { DeviceMotionMeasurement } from 'expo-sensors';
import type { MotionSample } from '@/types/motion';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Gravity in the phone's own frame (m/s², pointing down), or null until the sensor reports user acceleration.
 * Unlike Euler angles this has no singularity when the phone is held upright.
 */
export function gravityOf(m: DeviceMotionMeasurement): Vec3 | null {
  if (!m.acceleration) return null;
  return {
    x: m.accelerationIncludingGravity.x - m.acceleration.x,
    y: m.accelerationIncludingGravity.y - m.acceleration.y,
    z: m.accelerationIncludingGravity.z - m.acceleration.z,
  };
}

export function toMotionSample(m: DeviceMotionMeasurement, t: number): MotionSample | null {
  const gravity = gravityOf(m);
  if (!gravity || !m.acceleration) return null;
  return {
    t,
    gx: gravity.x,
    gy: gravity.y,
    gz: gravity.z,
    ax: m.acceleration.x,
    ay: m.acceleration.y,
    az: m.acceleration.z,
  };
}

/**
 * Sine of the phone's lean away from vertical, as right (+) and forward (+).
 * Assumes the phone is upright against the abdomen with its screen facing away from the body:
 * device +x is then the wearer's left and device +z points forward.
 */
export function tiltSines(gx: number, gy: number, gz: number): { right: number; forward: number } | null {
  const norm = Math.hypot(gx, gy, gz);
  if (norm === 0) return null;
  return { right: -gx / norm, forward: gz / norm };
}

/** Lean angles in degrees for display: lateral (+ right) and forward (+ forward). */
export function leanDegrees(gravity: Vec3): { lateralDeg: number; forwardDeg: number } | null {
  const tilt = tiltSines(gravity.x, gravity.y, gravity.z);
  if (!tilt) return null;
  return { lateralDeg: Math.asin(tilt.right) * RAD_TO_DEG, forwardDeg: Math.asin(tilt.forward) * RAD_TO_DEG };
}
