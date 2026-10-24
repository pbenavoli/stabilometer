import { useCallback, useEffect, useState } from 'react';
import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';

export const SENSOR_UPDATE_INTERVAL_MS = 20; // ~50 Hz

export type DeviceMotionStatus = 'checking' | 'unavailable' | 'denied' | 'ready';

interface UseDeviceMotionResult {
  status: DeviceMotionStatus;
  /** Subscribes to sensor updates; call the returned cleanup to unsubscribe. */
  subscribe: (onMeasurement: (m: DeviceMotionMeasurement) => void) => () => void;
}

export function useDeviceMotion(): UseDeviceMotionResult {
  const [status, setStatus] = useState<DeviceMotionStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        if (!cancelled) setStatus('unavailable');
        return;
      }

      const { granted, canAskAgain, status: permStatus } = await DeviceMotion.getPermissionsAsync();
      let isGranted = granted;
      if (!isGranted && canAskAgain) {
        const req = await DeviceMotion.requestPermissionsAsync();
        isGranted = req.granted;
      } else if (!isGranted) {
        console.warn('DeviceMotion permission not granted:', permStatus);
      }

      if (cancelled) return;

      if (!isGranted) {
        setStatus('denied');
        return;
      }

      DeviceMotion.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
      setStatus('ready');
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback((onMeasurement: (m: DeviceMotionMeasurement) => void) => {
    DeviceMotion.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
    const subscription = DeviceMotion.addListener(onMeasurement);
    return () => subscription.remove();
  }, []);

  return { status, subscribe };
}
