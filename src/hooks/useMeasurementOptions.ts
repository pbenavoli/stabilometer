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

import Storage from 'expo-sqlite/kv-store';
import { useEffect, useRef, useState } from 'react';
import { DEFAULT_PIVOT_HEIGHT_CM } from '@/lib/stability';

const STORAGE_KEY = 'stabilometer.measurement-options.v1';

export const MIN_TRIALS = 1;
export const MAX_TRIALS = 5;
export const MIN_DURATION_S = 5;
export const MAX_DURATION_S = 120;
export const DURATION_STEP_S = 5;
export const MAX_DEFAULT_LABEL_LENGTH = 60;

export interface MeasurementOptions {
  trialsPerSeries: number;
  durationS: number;
  pivotHeightCm: number;
  /** Label given to each newly saved series; may be empty. */
  defaultLabel: string;
}

export const DEFAULT_MEASUREMENT_OPTIONS: MeasurementOptions = {
  trialsPerSeries: 3,
  durationS: 30,
  pivotHeightCm: DEFAULT_PIVOT_HEIGHT_CM,
  defaultLabel: '',
};

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function sanitize(value: Partial<MeasurementOptions>): MeasurementOptions {
  return {
    trialsPerSeries: clampInteger(
      value.trialsPerSeries,
      MIN_TRIALS,
      MAX_TRIALS,
      DEFAULT_MEASUREMENT_OPTIONS.trialsPerSeries,
    ),
    durationS: clampInteger(
      value.durationS,
      MIN_DURATION_S,
      MAX_DURATION_S,
      DEFAULT_MEASUREMENT_OPTIONS.durationS,
    ),
    pivotHeightCm:
      typeof value.pivotHeightCm === 'number' && Number.isFinite(value.pivotHeightCm) && value.pivotHeightCm > 0
        ? value.pivotHeightCm
        : DEFAULT_PIVOT_HEIGHT_CM,
    defaultLabel:
      typeof value.defaultLabel === 'string'
        ? value.defaultLabel.slice(0, MAX_DEFAULT_LABEL_LENGTH)
        : DEFAULT_MEASUREMENT_OPTIONS.defaultLabel,
  };
}

function parseOptions(value: string | null): MeasurementOptions {
  if (!value) return DEFAULT_MEASUREMENT_OPTIONS;

  try {
    return sanitize(JSON.parse(value) as Partial<MeasurementOptions>);
  } catch {
    return DEFAULT_MEASUREMENT_OPTIONS;
  }
}

export function useMeasurementOptions() {
  const [options, setOptions] = useState<MeasurementOptions>(DEFAULT_MEASUREMENT_OPTIONS);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const stored = await Storage.getItem(STORAGE_KEY);
      if (isMounted) setOptions(parseOptions(stored));
    }

    loadOptions().catch((error: unknown) => console.warn('[measurement options] Could not load:', error));
    return () => {
      isMounted = false;
    };
  }, []);

  function updateOptions(next: MeasurementOptions) {
    const sanitized = sanitize(next);
    setOptions(sanitized);
    writeQueueRef.current = writeQueueRef.current
      .then(() => Storage.setItem(STORAGE_KEY, JSON.stringify(sanitized)))
      .catch((error: unknown) => console.warn('[measurement options] Could not save:', error));
  }

  return { options, updateOptions };
}
