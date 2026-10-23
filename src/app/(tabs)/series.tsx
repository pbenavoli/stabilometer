import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { commonStyles } from '@/components/commonStyles';
import { SavedSeriesRow } from '@/components/SavedSeriesRow';
import { useAppState } from '@/context/AppStateProvider';
import type { SavedSeries } from '@/hooks/useSeriesHistory';

export default function SeriesScreen() {
  const { history, isLoading, clearHistory, updateSeriesLabel, deleteSeries } = useAppState();

  const confirmClearHistory = () => {
    Alert.alert('Remove all saved series?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove all',
        style: 'destructive',
        onPress: () => {
          void clearHistory().catch((error: unknown) => console.warn('[series history] Could not clear history:', error));
        },
      },
    ]);
  };

  const confirmDeleteSeries = (series: SavedSeries) => {
    Alert.alert('Remove this series?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void deleteSeries(series.id).catch((error: unknown) =>
            console.warn('[series history] Could not delete series:', error),
          );
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={commonStyles.title}>Saved series</Text>
      {isLoading && <Text style={commonStyles.subtitle}>Loading saved series...</Text>}
      {!isLoading && history.length === 0 && (
        <Text style={commonStyles.subtitle}>Complete a series to save it here.</Text>
      )}
      {history.map((savedSeries) => (
        <SavedSeriesRow
          key={savedSeries.id}
          series={savedSeries}
          onLabelChange={updateSeriesLabel}
          onDelete={confirmDeleteSeries}
        />
      ))}
      {history.length > 0 && (
        <Pressable style={styles.destructiveButton} onPress={confirmClearHistory}>
          <Text style={commonStyles.buttonText}>Remove all saved series</Text>
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
  destructiveButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#b00020',
  },
});
