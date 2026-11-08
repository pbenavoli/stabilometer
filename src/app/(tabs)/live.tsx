import { useFocusEffect } from 'expo-router';
import type { DeviceMotionMeasurement } from 'expo-sensors';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { commonStyles } from '@/components/commonStyles';
import { ReadoutRow } from '@/components/ReadoutRow';
import { useAppState } from '@/context/AppStateProvider';
import { useDeviceMotion } from '@/hooks/useDeviceMotion';
import { gravityOf, leanDegrees, tiltSines } from '@/lib/orientation';

const DISPLAY_INTERVAL_MS = 100;
const LEVEL_FULL_SCALE_DEG = 5;
const LEVEL_DOT_SIZE = 18;
const RAD_TO_DEG = 180 / Math.PI;

const direction = (deg: number, positive: string, negative: string) =>
  `${Math.abs(deg).toFixed(1)}° ${deg >= 0 ? positive : negative}`;

const degrees = (radians: number | undefined) => (radians === undefined ? '—' : `${(radians * RAD_TO_DEG).toFixed(1)}°`);

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export default function LiveScreen() {
  const { status, subscribe } = useDeviceMotion();
  const { options } = useAppState();
  const { width } = useWindowDimensions();
  const [reading, setReading] = useState<DeviceMotionMeasurement | null>(null);
  const latestRef = useRef<DeviceMotionMeasurement | null>(null);

  // Stream only while this tab is focused, and repaint at a calm rate rather than at the sensor rate.
  useFocusEffect(
    useCallback(() => {
      if (status !== 'ready') return undefined;
      const unsubscribe = subscribe((measurement) => {
        latestRef.current = measurement;
      });
      const timer = setInterval(() => setReading(latestRef.current), DISPLAY_INTERVAL_MS);
      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    }, [status, subscribe]),
  );

  const gravity = reading ? gravityOf(reading) : null;
  const lean = gravity ? leanDegrees(gravity) : null;
  const tilt = gravity ? tiltSines(gravity.x, gravity.y, gravity.z) : null;

  const levelSize = Math.min(width - 96, 280);
  const travel = levelSize / 2 - LEVEL_DOT_SIZE / 2;
  const dotLeft = levelSize / 2 - LEVEL_DOT_SIZE / 2 + (lean ? clamp(lean.lateralDeg / LEVEL_FULL_SCALE_DEG) * travel : 0);
  const dotTop = levelSize / 2 - LEVEL_DOT_SIZE / 2 - (lean ? clamp(lean.forwardDeg / LEVEL_FULL_SCALE_DEG) * travel : 0);

  return (
    <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.content}>
      <Text style={commonStyles.title}>Live angles</Text>
      <Text style={styles.hint}>
        Hold the phone upright against your abdomen, screen facing out, then lean to check each direction.
      </Text>

      {status !== 'ready' ? (
        <Text style={styles.warning}>
          {status === 'checking' ? 'Checking motion sensors…' : 'Motion sensors are unavailable or access was denied.'}
        </Text>
      ) : (
        <>
          <View
            accessibilityLabel={
              lean
                ? `Level. ${direction(lean.lateralDeg, 'right', 'left')}, ${direction(lean.forwardDeg, 'forward', 'back')}`
                : 'Level, waiting for sensor data'
            }
            style={[styles.level, { width: levelSize, height: levelSize }]}>
            <View style={styles.levelVertical} />
            <View style={styles.levelHorizontal} />
            <Text style={[styles.levelLabel, styles.levelFront]}>Front</Text>
            <Text style={[styles.levelLabel, styles.levelBack]}>Back</Text>
            <Text style={[styles.levelLabel, styles.levelLeft]}>Left</Text>
            <Text style={[styles.levelLabel, styles.levelRight]}>Right</Text>
            <View style={[styles.levelDot, { left: dotLeft, top: dotTop }]} />
          </View>
          <Text style={styles.hint}>Full scale is ±{LEVEL_FULL_SCALE_DEG}° of lean.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lean used for the chart</Text>
            <ReadoutRow label="Left / right" value={lean ? direction(lean.lateralDeg, 'right', 'left') : '—'} />
            <ReadoutRow label="Front / back" value={lean ? direction(lean.forwardDeg, 'forward', 'back') : '—'} />
            <ReadoutRow
              label={`Sway at ${options.pivotHeightCm} cm: left / right`}
              value={tilt ? `${(options.pivotHeightCm * tilt.right).toFixed(2)} cm` : '—'}
            />
            <ReadoutRow
              label={`Sway at ${options.pivotHeightCm} cm: front / back`}
              value={tilt ? `${(options.pivotHeightCm * tilt.forward).toFixed(2)} cm` : '—'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gravity in the phone frame</Text>
            <ReadoutRow label="x (screen right)" value={gravity ? `${gravity.x.toFixed(2)} m/s²` : '—'} />
            <ReadoutRow label="y (screen up)" value={gravity ? `${gravity.y.toFixed(2)} m/s²` : '—'} />
            <ReadoutRow label="z (out of screen)" value={gravity ? `${gravity.z.toFixed(2)} m/s²` : '—'} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Raw yaw / pitch / roll</Text>
            <ReadoutRow label="Yaw (α, about z)" value={degrees(reading?.rotation.alpha)} />
            <ReadoutRow label="Pitch (β, about x)" value={degrees(reading?.rotation.beta)} />
            <ReadoutRow label="Roll (γ, about y)" value={degrees(reading?.rotation.gamma)} />
            <Text style={styles.hint}>
              Shown for reference only. With the phone upright, pitch sits near 90° and these angles become
              unreliable, so the app does not use them for sway.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 48,
    gap: 8,
  },
  hint: {
    alignSelf: 'stretch',
    color: '#666',
    fontSize: 13,
  },
  warning: {
    color: '#b00020',
    fontSize: 14,
    textAlign: 'center',
  },
  level: {
    marginTop: 12,
    borderColor: '#b9c4d1',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  levelVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: '#d5dce5',
  },
  levelHorizontal: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: '50%',
    height: 1,
    backgroundColor: '#d5dce5',
  },
  levelLabel: {
    position: 'absolute',
    color: '#344955',
    fontSize: 12,
    fontWeight: '700',
  },
  levelFront: {
    top: 4,
    alignSelf: 'center',
  },
  levelBack: {
    bottom: 4,
    alignSelf: 'center',
  },
  levelLeft: {
    left: 6,
    top: '50%',
    marginTop: 6,
  },
  levelRight: {
    right: 6,
    top: '50%',
    marginTop: 6,
  },
  levelDot: {
    position: 'absolute',
    width: LEVEL_DOT_SIZE,
    height: LEVEL_DOT_SIZE,
    borderRadius: LEVEL_DOT_SIZE / 2,
    backgroundColor: '#2f6fed',
  },
  section: {
    alignSelf: 'stretch',
    marginTop: 16,
    gap: 4,
  },
  sectionTitle: {
    color: '#202733',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
});
