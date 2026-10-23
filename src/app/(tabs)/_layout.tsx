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
        tabBarLabelStyle: { fontSize: 16, fontWeight: '600' },
        // Hidden mid-trial so the screen can't be left by accident.
        tabBarStyle: isMeasuring ? { display: 'none' } : undefined,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Measure', headerTitle: 'Stabilometer' }} />
      <Tabs.Screen name="series" options={{ title: 'Series', headerTitle: 'Saved series' }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart', headerTitle: 'Stability chart' }} />
    </Tabs>
  );
}
