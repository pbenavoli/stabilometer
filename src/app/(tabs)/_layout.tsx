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

import { Tabs } from 'expo-router';
import { useAppState } from '@/context/AppStateProvider';

export default function TabLayout() {
  const { isMeasuring } = useAppState();

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarIcon: () => null,
        tabBarLabelPosition: 'beside-icon',
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
        // Hidden mid-trial so the screen can't be left by accident.
        tabBarStyle: isMeasuring ? { display: 'none' } : undefined,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Measure', headerTitle: 'Stabilometer' }} />
      <Tabs.Screen name="series" options={{ title: 'Series', headerTitle: 'Saved series' }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart', headerTitle: 'Stability chart' }} />
      <Tabs.Screen name="live" options={{ title: 'Live', headerTitle: 'Live angles' }} />
      <Tabs.Screen name="about" options={{ title: 'About', headerTitle: 'About' }} />
    </Tabs>
  );
}
