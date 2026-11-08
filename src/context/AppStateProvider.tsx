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

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { useMeasurementOptions } from '@/hooks/useMeasurementOptions';
import { type MeasurementCondition, useSeriesHistory } from '@/hooks/useSeriesHistory';

/** Saved-series id picked for each condition's chart slot. */
export type ChartSelection = Partial<Record<MeasurementCondition, string>>;

type AppState = ReturnType<typeof useSeriesHistory> &
  ReturnType<typeof useMeasurementOptions> & {
    /** True while a countdown or recording is running; the tab bar is hidden to avoid mid-trial navigation. */
    isMeasuring: boolean;
    setIsMeasuring: (isMeasuring: boolean) => void;
    chartSelection: ChartSelection;
    setChartSeries: (condition: MeasurementCondition, id: string | null) => void;
    clearChart: () => void;
  };

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const history = useSeriesHistory();
  const measurementOptions = useMeasurementOptions();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [chartSelection, setChartSelection] = useState<ChartSelection>({});

  const setChartSeries = useCallback((condition: MeasurementCondition, id: string | null) => {
    setChartSelection((previous) => {
      const next = { ...previous };
      if (id) next[condition] = id;
      else delete next[condition];
      return next;
    });
  }, []);

  const clearChart = useCallback(() => setChartSelection({}), []);

  return (
    <AppStateContext.Provider
      value={{
        ...history,
        ...measurementOptions,
        isMeasuring,
        setIsMeasuring,
        chartSelection,
        setChartSeries,
        clearChart,
      }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
