import { StyleSheet, View } from 'react-native';
import type { StabilityMetrics } from '@/lib/stability';

const MAX_PLOT_POINTS = 120;

export function SwayPlot({ points }: Pick<StabilityMetrics, 'points'>) {
  if (points.length === 0) return null;

  const step = Math.max(1, Math.ceil(points.length / MAX_PLOT_POINTS));
  const plotPoints = points.filter((_, index) => index % step === 0);
  const xValues = plotPoints.map((point) => point.x);
  const yValues = plotPoints.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const xRange = Math.max(maxX - minX, 0.1);
  const yRange = Math.max(maxY - minY, 0.1);
  const padding = 8;

  return (
    <View accessibilityLabel="Sway path chart" style={styles.plot}>
      <View style={styles.plotVerticalAxis} />
      <View style={styles.plotHorizontalAxis} />
      {plotPoints.map((point, index) => {
        const left = padding + ((point.x - minX) / xRange) * (100 - padding * 2);
        const top = padding + ((maxY - point.y) / yRange) * (100 - padding * 2);
        return <View key={index} style={[styles.plotPoint, { left: `${left}%`, top: `${top}%` }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    aspectRatio: 1.8,
    marginTop: 16,
    borderColor: '#b9c4d1',
    borderWidth: 1,
    backgroundColor: '#f7f9fc',
    overflow: 'hidden',
  },
  plotVerticalAxis: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: '#d5dce5',
  },
  plotHorizontalAxis: {
    position: 'absolute',
    right: 0,
    bottom: '50%',
    left: 0,
    height: 1,
    backgroundColor: '#d5dce5',
  },
  plotPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    marginLeft: -2,
    marginTop: -2,
    borderRadius: 2,
    backgroundColor: '#2f6fed',
  },
});
