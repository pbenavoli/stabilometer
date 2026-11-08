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
