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

import { useMemo } from 'react';
import Svg, { Line, Polygon, Polyline } from 'react-native-svg';
import { chartExtentCm, ellipsePoints, gridStepCm } from '@/lib/chart';
import type { TrialShape } from '@/lib/stability';

export interface ChartLayer {
  key: string;
  color: string;
  shapes: TrialShape[];
}

/** Grid spacing and extent for the layers, so the screen can describe the scale. */
export function getChartScale(layers: ChartLayer[]) {
  const extentCm = chartExtentCm(layers.flatMap((layer) => layer.shapes));
  return { extentCm, gridStepCm: gridStepCm(extentCm) };
}

export function OverlayChart({ layers, size, label }: { layers: ChartLayer[]; size: number; label: string }) {
  const geometry = useMemo(() => {
    const { extentCm, gridStepCm: step } = getChartScale(layers);
    const center = size / 2;
    const scale = center / extentCm;
    const toPoint = ([x, y]: [number, number]) => `${(center + x * scale).toFixed(1)},${(center - y * scale).toFixed(1)}`;

    const gridPositions: number[] = [];
    for (let k = 1; k * step <= extentCm; k++) gridPositions.push(k * step * scale);

    return {
      center,
      gridPositions,
      layers: layers.map((layer) => ({
        key: layer.key,
        color: layer.color,
        trials: layer.shapes.map((shape) => ({
          path: shape.path.map(toPoint).join(' '),
          ellipse: ellipsePoints(shape.ellipse).map(toPoint).join(' '),
        })),
      })),
    };
  }, [layers, size]);

  const { center } = geometry;

  return (
    <Svg accessibilityLabel={label} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {geometry.gridPositions.flatMap((offset) => [
        <Line key={`v+${offset}`} x1={center + offset} y1={0} x2={center + offset} y2={size} stroke="#e3e8ef" strokeWidth={1} />,
        <Line key={`v-${offset}`} x1={center - offset} y1={0} x2={center - offset} y2={size} stroke="#e3e8ef" strokeWidth={1} />,
        <Line key={`h+${offset}`} x1={0} y1={center + offset} x2={size} y2={center + offset} stroke="#e3e8ef" strokeWidth={1} />,
        <Line key={`h-${offset}`} x1={0} y1={center - offset} x2={size} y2={center - offset} stroke="#e3e8ef" strokeWidth={1} />,
      ])}
      <Line x1={center} y1={0} x2={center} y2={size} stroke="#b9c4d1" strokeWidth={1} />
      <Line x1={0} y1={center} x2={size} y2={center} stroke="#b9c4d1" strokeWidth={1} />
      {geometry.layers.flatMap((layer) =>
        layer.trials.map((trial, index) => (
          <Polyline
            key={`${layer.key}-path-${index}`}
            points={trial.path}
            fill="none"
            stroke={layer.color}
            strokeOpacity={0.6}
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        )),
      )}
      {geometry.layers.flatMap((layer) =>
        layer.trials.map((trial, index) => (
          <Polygon
            key={`${layer.key}-ellipse-${index}`}
            points={trial.ellipse}
            fill={layer.color}
            fillOpacity={0.06}
            stroke={layer.color}
            strokeOpacity={0.9}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        )),
      )}
    </Svg>
  );
}
