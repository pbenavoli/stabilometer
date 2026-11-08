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

import type { SwayEllipse, TrialShape } from '@/lib/stability';

const GRID_STEPS_CM = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
const MIN_EXTENT_CM = 0.5;

/** Outline of a sway ellipse as [x, y] points in cm, centred on the origin. */
export function ellipsePoints(ellipse: SwayEllipse, segments = 48): [number, number][] {
  const cos = Math.cos(ellipse.angleRad);
  const sin = Math.sin(ellipse.angleRad);
  return Array.from({ length: segments }, (_, i) => {
    const phi = (2 * Math.PI * i) / segments;
    const ex = ellipse.semiMajorCm * Math.cos(phi);
    const ey = ellipse.semiMinorCm * Math.sin(phi);
    return [ex * cos - ey * sin, ex * sin + ey * cos];
  });
}

/** Half-width (cm) of the square chart area so every path and ellipse fits, with a margin. */
export function chartExtentCm(shapes: TrialShape[]): number {
  let extent = 0;
  for (const shape of shapes) {
    for (const [x, y] of shape.path) extent = Math.max(extent, Math.abs(x), Math.abs(y));
    for (const [x, y] of ellipsePoints(shape.ellipse)) extent = Math.max(extent, Math.abs(x), Math.abs(y));
  }
  return Math.max(extent * 1.1, MIN_EXTENT_CM);
}

/** Largest-resolution grid spacing that still keeps at most five lines per side of the origin. */
export function gridStepCm(extentCm: number): number {
  return GRID_STEPS_CM.find((step) => extentCm / step <= 5) ?? GRID_STEPS_CM[GRID_STEPS_CM.length - 1];
}
