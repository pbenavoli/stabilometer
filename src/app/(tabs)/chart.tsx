import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { commonStyles } from '@/components/commonStyles';
import { type ChartLayer, getChartScale, OverlayChart } from '@/components/OverlayChart';
import { useAppState } from '@/context/AppStateProvider';
import type { MeasurementCondition, SavedSeries } from '@/hooks/useSeriesHistory';
import { SWAY_MODEL_VERSION } from '@/lib/stability';

const CONDITIONS = ['Without orthosis', 'With orthosis'] as const;
const CONDITION_COLORS: Record<MeasurementCondition, string> = {
  'Without orthosis': '#d32f2f',
  'With orthosis': '#2e9e4f',
};
const MAX_CHART_SIZE = 520;

const isChartable = (series: SavedSeries) =>
  Boolean(series.trialShapes?.length) &&
  typeof series.durationS === 'number' &&
  series.swayModel === SWAY_MODEL_VERSION;

const seriesName = (series: SavedSeries) => series.label?.trim() || new Date(series.recordedAt).toLocaleString();

const seriesSummary = (series: SavedSeries) =>
  `${series.aggregate.count} trials · ${series.durationS} s · mean area ${series.aggregate.meanSwayAreaCm2.toFixed(1)} cm²`;

export default function ChartScreen() {
  const { history, chartSelection, setChartSeries, clearChart } = useAppState();
  const { width } = useWindowDimensions();
  const [showPicker, setShowPicker] = useState(false);

  const selectedWithout = history.find((series) => series.id === chartSelection['Without orthosis']) ?? null;
  const selectedWith = history.find((series) => series.id === chartSelection['With orthosis']) ?? null;
  const selected: Record<MeasurementCondition, SavedSeries | null> = {
    'Without orthosis': selectedWithout,
    'With orthosis': selectedWith,
  };

  const layers: ChartLayer[] = CONDITIONS.flatMap((condition) => {
    const series = selected[condition];
    return series?.trialShapes
      ? [{ key: condition, color: CONDITION_COLORS[condition], shapes: series.trialShapes }]
      : [];
  });

  const chartSize = Math.min(width - 48, MAX_CHART_SIZE);
  const scale = getChartScale(layers);
  const chartLabel = `Sway paths chart. ${CONDITIONS.filter((condition) => selected[condition])
    .map((condition) => `${condition}: mean sway area ${selected[condition]?.aggregate.meanSwayAreaCm2.toFixed(1)} square centimetres`)
    .join('. ')}`;

  if (showPicker) {
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={commonStyles.title}>Configure stability chart</Text>
        <Text style={styles.hint}>
          Pick one series per condition. Once one is picked, the other must have the same trial duration.
        </Text>
        {CONDITIONS.map((condition) => {
          const other = CONDITIONS.find((item) => item !== condition)!;
          const lockedDurationS = selected[other]?.durationS ?? null;
          const ofCondition = history.filter((series) => series.condition === condition);
          const chartable = ofCondition.filter(isChartable);
          const unavailableCount = ofCondition.length - chartable.length;

          return (
            <View key={condition} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.swatch, { backgroundColor: CONDITION_COLORS[condition] }]} />
                <Text style={styles.sectionTitle}>{condition}</Text>
              </View>
              {chartable.map((series) => {
                const isSelected = chartSelection[condition] === series.id;
                const isLocked = lockedDurationS !== null && series.durationS !== lockedDurationS;
                return (
                  <Pressable
                    key={series.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: isLocked }}
                    disabled={isLocked}
                    style={[
                      styles.option,
                      isSelected && { borderColor: CONDITION_COLORS[condition], borderWidth: 2 },
                      isLocked && styles.optionDisabled,
                    ]}
                    onPress={() => setChartSeries(condition, isSelected ? null : series.id)}>
                    <Text style={styles.optionTitle}>
                      {isSelected ? '✓ ' : ''}
                      {seriesName(series)}
                    </Text>
                    <Text style={styles.optionDetail}>{seriesSummary(series)}</Text>
                    {isLocked && <Text style={styles.optionDetail}>Needs {lockedDurationS} s to match the other series</Text>}
                  </Pressable>
                );
              })}
              {unavailableCount > 0 && (
                <Text style={styles.hint}>
                  {unavailableCount} older series recorded with the earlier sway model cannot be charted.
                </Text>
              )}
            </View>
          );
        })}
        <Pressable style={commonStyles.button} onPress={() => setShowPicker(false)}>
          <Text style={commonStyles.buttonText}>Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={commonStyles.title}>Stability chart</Text>
      {layers.length === 0 ? (
        <Text style={commonStyles.subtitle}>No series selected. Use Configure chart to pick series to compare.</Text>
      ) : (
        <>
          <View
            accessibilityLabel={`Chart axes: front at the top, back at the bottom, left on the left, right on the right. Grid unit is ${scale.gridStepCm} centimetres.`}
            style={[styles.chartFrame, { width: chartSize, height: chartSize }]}>
            <Text style={[styles.axisPositionLabel, styles.axisFront]}>Front</Text>
            <Text style={[styles.axisPositionLabel, styles.axisBack]}>Back</Text>
            <Text style={[styles.axisPositionLabel, styles.axisLeft]}>Left</Text>
            <Text style={[styles.axisPositionLabel, styles.axisRight]}>Right</Text>
            <Text style={[styles.axisPositionLabel, styles.unitLabel]}>Unit: {scale.gridStepCm} cm</Text>
            <View style={[styles.chartPlot, { width: chartSize, height: chartSize }]}>
              <OverlayChart layers={layers} size={chartSize} label={chartLabel} />
            </View>
          </View>
          <Text style={styles.hint}>
            Estimated sway in cm, grid every {scale.gridStepCm} cm. Each trial is centred on its own mean; solid lines
            are paths, dashed outlines are 95% sway ellipses.
          </Text>
          {CONDITIONS.map((condition) => {
            const series = selected[condition];
            if (!series) return null;
            return (
              <View key={condition} style={styles.legendRow}>
                <View style={[styles.swatch, { backgroundColor: CONDITION_COLORS[condition] }]} />
                <View style={styles.legendText}>
                  <Text style={styles.optionTitle}>
                    {condition}: {seriesName(series)}
                  </Text>
                  <Text style={styles.optionDetail}>{seriesSummary(series)}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
      <Pressable accessibilityRole="button" style={commonStyles.button} onPress={() => setShowPicker(true)}>
        <Text style={commonStyles.buttonText}>Configure chart</Text>
      </Pressable>
      {layers.length > 0 && (
        <Pressable accessibilityRole="button" style={styles.clearButton} onPress={clearChart}>
          <Text style={styles.clearButtonText}>Clear chart</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
    gap: 8,
  },
  chartFrame: {
    position: 'relative',
    marginTop: 8,
  },
  chartPlot: {
    position: 'absolute',
    borderColor: '#b9c4d1',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  axisPositionLabel: {
    position: 'absolute',
    zIndex: 1,
    color: '#344955',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  axisFront: {
    top: 4,
    alignSelf: 'center',
  },
  axisBack: {
    bottom: 4,
    alignSelf: 'center',
  },
  axisLeft: {
    top: '50%',
    left: -4,
    marginTop: -9,
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  axisRight: {
    top: '50%',
    right: -4,
    marginTop: -9,
    textAlign: 'center',
    transform: [{ rotate: '90deg' }],
  },
  unitLabel: {
    bottom: 4,
    left: 4,
  },
  hint: {
    alignSelf: 'stretch',
    color: '#666',
    fontSize: 13,
  },
  section: {
    alignSelf: 'stretch',
    marginTop: 12,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#202733',
    fontSize: 17,
    fontWeight: '700',
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  option: {
    minHeight: 56,
    padding: 12,
    gap: 2,
    borderColor: '#d5dce5',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionTitle: {
    color: '#202733',
    fontSize: 15,
    fontWeight: '600',
  },
  optionDetail: {
    color: '#666',
    fontSize: 13,
  },
  legendRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendText: {
    flex: 1,
  },
  clearButton: {
    marginTop: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderColor: '#b00020',
    borderWidth: 1,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#b00020',
    fontSize: 16,
    fontWeight: '600',
  },
});
