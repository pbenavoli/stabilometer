import { useCallback, useRef, useState } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import type { DeviceMotionMeasurement } from 'expo-sensors';
import { toMotionSample } from '@/lib/orientation';
import type { MotionSample } from '@/types/motion';

export type SessionState = 'idle' | 'countdown' | 'recording' | 'done';

export const DEFAULT_SESSION_DURATION_MS = 30_000;
/** Delay before recording starts, so tapping the Start button doesn't disturb the reading. */
export const DEFAULT_COUNTDOWN_MS = 3_000;

const KEEP_AWAKE_TAG = 'stabilometer-session';
const TICK_MS = 100;

interface UseMotionSessionResult {
  state: SessionState;
  /** Milliseconds left in the current phase (countdown or recording). */
  remainingMs: number;
  samples: MotionSample[];
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

interface UseMotionSessionOptions {
  durationMs?: number;
  countdownMs?: number;
  /** Called the instant sample collection actually begins (after the countdown). */
  onRecordingStart?: () => void;
  /** Called the instant sample collection stops. */
  onRecordingStop?: () => void;
}

export function useMotionSession(
  subscribe: (onMeasurement: (m: DeviceMotionMeasurement) => void) => () => void,
  options: UseMotionSessionOptions = {},
): UseMotionSessionResult {
  const {
    durationMs = DEFAULT_SESSION_DURATION_MS,
    countdownMs = DEFAULT_COUNTDOWN_MS,
    onRecordingStart,
    onRecordingStop,
  } = options;
  const [state, setState] = useState<SessionState>('idle');
  const [remainingMs, setRemainingMs] = useState(countdownMs);
  const [samples, setSamples] = useState<MotionSample[]>([]);

  // Samples are buffered in a ref (not state) to avoid a re-render on every sensor tick.
  const samplesRef = useRef<MotionSample[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    clearTimer();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    setSamples(samplesRef.current);
    setRemainingMs(0);
    setState('done');
    onRecordingStop?.();
  }, [clearTimer, onRecordingStop]);

  const beginRecording = useCallback(() => {
    samplesRef.current = [];
    setSamples([]);
    startTimeRef.current = Date.now();
    setState('recording');
    setRemainingMs(durationMs);
    onRecordingStart?.();

    unsubscribeRef.current = subscribe((m) => {
      const sample = toMotionSample(m, Date.now() - startTimeRef.current);
      if (sample) samplesRef.current.push(sample);
    });

    clearTimer();
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, durationMs - (Date.now() - startTimeRef.current));
      setRemainingMs(remaining);
      if (remaining <= 0) stop();
    }, TICK_MS);
  }, [clearTimer, durationMs, onRecordingStart, stop, subscribe]);

  const start = useCallback(async () => {
    await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    setState('countdown');
    setRemainingMs(countdownMs);
    const countdownStart = Date.now();

    clearTimer();
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, countdownMs - (Date.now() - countdownStart));
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearTimer();
        beginRecording();
      }
    }, TICK_MS);
  }, [beginRecording, clearTimer, countdownMs]);

  const reset = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    clearTimer();
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    setState('idle');
    setSamples([]);
    samplesRef.current = [];
    setRemainingMs(countdownMs);
  }, [clearTimer, countdownMs]);

  return { state, remainingMs, samples, start, stop, reset };
}
