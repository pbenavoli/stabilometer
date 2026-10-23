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
