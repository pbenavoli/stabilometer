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
import type { StabilityMetrics, TrialAggregate, TrialShape } from '@/lib/stability';
import { DEFAULT_PIVOT_HEIGHT_CM, SWAY_MODEL_VERSION, toTrialShape } from '@/lib/stability';

const STORAGE_KEY = 'stabilometer.series-history.v1';

export type MeasurementCondition = 'Without orthosis' | 'With orthosis';

export interface SavedSeries {
  id: string;
  recordedAt: string;
  condition: MeasurementCondition;
  label?: string;
  aggregate: TrialAggregate;
  trialAreasCm2: number[];
  trialPathLengthsMm?: number[];
  durationS?: number;
  /** Older series were recorded using the fixed 100 cm height. */
  pivotHeightCm?: number;
  /** Centred paths and ellipses used by the chart; absent on series saved before charting existed. */
  trialShapes?: TrialShape[];
  /** Version of the sway maths used; absent or older means the values came from the flawed Euler-angle model. */
  swayModel?: number;
}

export const seriesPivotHeightCm = (series: SavedSeries) => series.pivotHeightCm ?? DEFAULT_PIVOT_HEIGHT_CM;

function parseHistory(value: string | null): SavedSeries[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SavedSeries[]) : [];
  } catch {
    return [];
  }
}

export function useSeriesHistory() {
  const [history, setHistory] = useState<SavedSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  function updateHistory(transform: (current: SavedSeries[]) => SavedSeries[]) {
    const operation = writeQueueRef.current.then(async () => {
      const stored = await Storage.getItem(STORAGE_KEY);
      const nextHistory = transform(parseHistory(stored));
      if (nextHistory.length === 0) {
        await Storage.removeItem(STORAGE_KEY);
      } else {
        await Storage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
      }
      setHistory(nextHistory);
    });
    writeQueueRef.current = operation.catch(() => undefined);
    return operation;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const stored = await Storage.getItem(STORAGE_KEY);
        if (isMounted) setHistory(parseHistory(stored));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  async function saveSeries(
    condition: MeasurementCondition,
    aggregate: TrialAggregate,
    trials: StabilityMetrics[],
    durationS: number,
    pivotHeightCm: number,
    label?: string,
  ) {
    const trimmedLabel = label?.trim();
    const savedSeries: SavedSeries = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      recordedAt: new Date().toISOString(),
      condition,
      ...(trimmedLabel ? { label: trimmedLabel } : {}),
      aggregate,
      trialAreasCm2: trials.map((trial) => trial.swayAreaCm2),
      trialPathLengthsMm: trials.map((trial) => trial.pathLengthCm * 10),
      durationS,
      pivotHeightCm,
      trialShapes: trials.map(toTrialShape),
      swayModel: SWAY_MODEL_VERSION,
    };

    await updateHistory((current) => [savedSeries, ...current]);
  }

  async function clearHistory() {
    await updateHistory(() => []);
  }

  async function updateSeriesLabel(id: string, label: string) {
    await updateHistory((current) => current.map((series) => (series.id === id ? { ...series, label } : series)));
  }

  async function deleteSeries(ids: string[]) {
    await updateHistory((current) => current.filter((series) => !ids.includes(series.id)));
  }

  return { history, isLoading, saveSeries, clearHistory, updateSeriesLabel, deleteSeries };
}