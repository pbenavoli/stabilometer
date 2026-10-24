import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { commonStyles } from '@/components/commonStyles';
import { OptionStepper } from '@/components/OptionStepper';
import { ReadoutRow } from '@/components/ReadoutRow';
import { SwayPlot } from '@/components/SwayPlot';
import { useAppState } from '@/context/AppStateProvider';
import { useDeviceMotion } from '@/hooks/useDeviceMotion';
import {
  DURATION_STEP_S,
  MAX_DURATION_S,
  MAX_DEFAULT_LABEL_LENGTH,
  MAX_TRIALS,
  MIN_DURATION_S,
  MIN_TRIALS,
} from '@/hooks/useMeasurementOptions';
import { useMotionSession } from '@/hooks/useMotionSession';
import type { MeasurementCondition } from '@/hooks/useSeriesHistory';
import { useSessionSounds } from '@/hooks/useSessionSounds';
import { strongBuzz } from '@/lib/haptics';
import { aggregateTrials, computeStabilityMetrics, type StabilityMetrics } from '@/lib/stability';

export default function MeasureScreen() {
  const { status, subscribe } = useDeviceMotion();
  const { options, updateOptions, saveSeries, setIsMeasuring } = useAppState();
  const { playStart, playEnd } = useSessionSounds();
  const [trials, setTrials] = useState<StabilityMetrics[]>([]);
  const [condition, setCondition] = useState<MeasurementCondition>('Without orthosis');
  const [showOptions, setShowOptions] = useState(false);
  const session = useMotionSession(subscribe, {
    durationMs: options.durationS * 1000,
    onRecordingStart: () => playStart(trials.length + 1),
    onRecordingStop: () => {
      playEnd();
      setIsMeasuring(false);
    },
  });

  const handleStart = () => {
    Keyboard.dismiss();
    strongBuzz();
    setIsMeasuring(true);
    session.start();
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    session.stop();
  };

  const metrics = useMemo(
    () => (session.state === 'done' ? computeStabilityMetrics(session.samples) : null),
    [session.state, session.samples],
  );

  const recordedThisTrialRef = useRef(false);

  // Append the trial's metrics to the series exactly once when a recording finishes.
  useEffect(() => {
    if (session.state === 'done' && metrics && !recordedThisTrialRef.current) {
      recordedThisTrialRef.current = true;
      setTrials((prev) => [...prev, metrics]);
    }
    if (session.state !== 'done') {
      recordedThisTrialRef.current = false;
    }
  }, [session.state, metrics]);

  const seriesComplete = trials.length >= options.trialsPerSeries;
  const aggregate = useMemo(() => (seriesComplete ? aggregateTrials(trials) : null), [seriesComplete, trials]);
  const savedSeriesRef = useRef(false);

  useEffect(() => {
    if (seriesComplete && aggregate && !savedSeriesRef.current) {
      savedSeriesRef.current = true;
      void saveSeries(condition, aggregate, trials, options.durationS, options.defaultLabel).catch((error: unknown) =>
        console.warn('[series history] Could not save series:', error),
      );
    }
    if (!seriesComplete) {
      savedSeriesRef.current = false;
    }
  }, [aggregate, condition, options.defaultLabel, options.durationS, saveSeries, seriesComplete, trials]);

  const startNewSeries = () => {
    setTrials([]);
    session.reset();
  };

  if (showOptions) {
    return (
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.container}>
        <Text style={commonStyles.title}>Options</Text>
        <OptionStepper
          label="Trials per series"
          valueText={`${options.trialsPerSeries}`}
          canDecrease={options.trialsPerSeries > MIN_TRIALS}
          canIncrease={options.trialsPerSeries < MAX_TRIALS}
          onDecrease={() => updateOptions({ ...options, trialsPerSeries: options.trialsPerSeries - 1 })}
          onIncrease={() => updateOptions({ ...options, trialsPerSeries: options.trialsPerSeries + 1 })}
        />
        <OptionStepper
          label="Trial duration"
          valueText={`${options.durationS} s`}
          canDecrease={options.durationS > MIN_DURATION_S}
          canIncrease={options.durationS < MAX_DURATION_S}
          onDecrease={() => updateOptions({ ...options, durationS: options.durationS - DURATION_STEP_S })}
          onIncrease={() => updateOptions({ ...options, durationS: options.durationS + DURATION_STEP_S })}
        />
        <Pressable style={commonStyles.button} onPress={() => setShowOptions(false)}>
          <Text style={commonStyles.buttonText}>Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      alwaysBounceVertical={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <Text style={commonStyles.title}>Stabilometer</Text>
      <Text style={commonStyles.subtitle}>Sensor status: {status}</Text>

      {status === 'unavailable' && (
        <Text style={styles.warning}>Motion sensors are not available on this device.</Text>
      )}
      {status === 'denied' && (
        <Text style={styles.warning}>
          Motion permission was denied. Enable it in Settings to continue.
        </Text>
      )}

      {status === 'ready' && session.state === 'idle' && (
        <>
          {trials.length === 0 ? (
            <View style={styles.conditionPicker}>
              <Text style={styles.conditionLabel}>Measurement condition</Text>
              <View style={styles.segmentedControl}>
                {(['Without orthosis', 'With orthosis'] as const).map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: condition === option }}
                    style={[styles.segment, condition === option && styles.segmentSelected]}
                    onPress={() => setCondition(option)}>
                    <Text style={[styles.segmentText, condition === option && styles.segmentTextSelected]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.conditionLabel}>Default series label</Text>
              <TextInput
                accessibilityLabel="Default series label"
                maxLength={MAX_DEFAULT_LABEL_LENGTH}
                placeholder="Optional, applied to the new series"
                returnKeyType="done"
                style={styles.labelInput}
                value={options.defaultLabel}
                onChangeText={(defaultLabel) => updateOptions({ ...options, defaultLabel })}
              />
            </View>
          ) : (
            <Text style={styles.conditionStatus}>
              {options.defaultLabel.trim() ? `${condition} · ${options.defaultLabel.trim()}` : condition}
            </Text>
          )}
          <Pressable
            style={styles.bigButton}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            onPress={handleStart}>
            <Text style={styles.bigButtonText}>
              {trials.length === 0
                ? 'Tap anywhere below\nto start new series'
                : `Tap anywhere below\nto start trial ${trials.length + 1} of ${options.trialsPerSeries}`}
            </Text>
          </Pressable>
          {trials.length === 0 && (
            <Pressable accessibilityRole="button" style={styles.optionsButton} onPress={() => setShowOptions(true)}>
              <Text style={styles.optionsButtonText}>
                Options: {options.trialsPerSeries} × {options.durationS} s
              </Text>
            </Pressable>
          )}
        </>
      )}

      {session.state === 'countdown' && (
        <View style={styles.readout}>
          <Text style={styles.countdown}>{Math.ceil(session.remainingMs / 1000)}</Text>
          <Text style={commonStyles.subtitle}>Get ready — place the phone against your belly button.</Text>
        </View>
      )}

      {session.state === 'recording' && (
        <View style={styles.readout}>
          <Text style={styles.countdown}>{Math.ceil(session.remainingMs / 1000)}s</Text>
          <Text style={commonStyles.subtitle}>Hold the phone steady against your belly button.</Text>
          <Pressable style={[styles.bigButton, styles.stopButton]} onPress={handleStop}>
            <Text style={styles.bigButtonText}>Tap anywhere below{'\n'}to stop</Text>
          </Pressable>
        </View>
      )}

      {session.state === 'done' && !seriesComplete && (
        <View style={styles.readout}>
          <Text style={commonStyles.subtitle}>
            Trial {trials.length} of {options.trialsPerSeries} complete
          </Text>
          {metrics && (
            <>
              <ReadoutRow label="Sway area (95%)" value={`${metrics.swayAreaCm2.toFixed(1)} cm²`} />
              <ReadoutRow
                label="Estimated cumulative path length"
                value={`${(metrics.pathLengthCm * 10).toFixed(0)} mm`}
              />
              <ReadoutRow label="Mean sway speed" value={`${metrics.meanVelocityCmPerS.toFixed(2)} cm/s`} />
              <ReadoutRow label="Stability index" value={metrics.stabilityIndex.toFixed(1)} />
              <SwayPlot points={metrics.points} />
            </>
          )}
          <Pressable style={commonStyles.button} onPress={session.reset}>
            <Text style={commonStyles.buttonText}>Continue to trial {trials.length + 1}</Text>
          </Pressable>
          <Pressable style={styles.textButton} onPress={startNewSeries}>
            <Text style={styles.textButtonLabel}>Restart series</Text>
          </Pressable>
        </View>
      )}

      {session.state === 'done' && seriesComplete && aggregate && (
        <View style={styles.readout}>
          <Text style={commonStyles.subtitle}>All {options.trialsPerSeries} trials complete</Text>
          <ReadoutRow label="Mean sway area" value={`${aggregate.meanSwayAreaCm2.toFixed(1)} cm²`} />
          <ReadoutRow label="Area SD across trials" value={`${aggregate.sdSwayAreaCm2.toFixed(1)} cm²`} />
          <ReadoutRow label="Area consistency (CV)" value={`${aggregate.cvPercent.toFixed(0)}%`} />
          <ReadoutRow label="Stability index" value={aggregate.meanStabilityIndex.toFixed(1)} />
          <ReadoutRow
            label="Mean estimated path length"
            value={`${aggregate.meanPathLengthMm.toFixed(0)} mm`}
          />
          <ReadoutRow label="Path SD across trials" value={`${aggregate.sdPathLengthMm.toFixed(1)} mm`} />
          <ReadoutRow
            label="Path consistency (CV)"
            value={`${aggregate.cvPathLengthPercent.toFixed(0)}%`}
          />
          {trials.map((trial, index) => (
            <View key={index}>
              <ReadoutRow label={`Trial ${index + 1} area`} value={`${trial.swayAreaCm2.toFixed(1)} cm²`} />
              <ReadoutRow
                label={`Trial ${index + 1} path`}
                value={`${(trial.pathLengthCm * 10).toFixed(0)} mm`}
              />
            </View>
          ))}
          <Pressable style={commonStyles.button} onPress={startNewSeries}>
            <Text style={commonStyles.buttonText}>Start new series</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  conditionPicker: {
    alignSelf: 'stretch',
    marginTop: 16,
    gap: 8,
  },
  labelInput: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderColor: '#b9c4d1',
    borderWidth: 1,
    borderRadius: 6,
    color: '#202733',
    fontSize: 16,
  },
  conditionLabel: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderColor: '#2f6fed',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentSelected: {
    backgroundColor: '#2f6fed',
  },
  segmentText: {
    color: '#2f6fed',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: '#fff',
  },
  conditionStatus: {
    alignSelf: 'center',
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    fontSize: 14,
    color: '#b00020',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  textButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  textButtonLabel: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  readout: {
    marginTop: 16,
    gap: 4,
    alignSelf: 'stretch',
  },
  optionsButton: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    borderColor: '#2f6fed',
    borderWidth: 1,
    borderRadius: 8,
  },
  optionsButtonText: {
    color: '#2f6fed',
    fontSize: 15,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#b00020',
  },
  bigButton: {
    marginTop: 24,
    alignSelf: 'stretch',
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: '#2f6fed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  countdown: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
