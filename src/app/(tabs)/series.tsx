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

import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { commonStyles } from '@/components/commonStyles';
import { SavedSeriesRow } from '@/components/SavedSeriesRow';
import { SelectionBar } from '@/components/SelectionBar';
import { useAppState } from '@/context/AppStateProvider';

export default function SeriesScreen() {
  const { history, isLoading, clearHistory, updateSeriesLabel, deleteSeries } = useAppState();
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  // Ignore ids of series that no longer exist.
  const selectedIds = history.filter((series) => pickedIds.includes(series.id)).map((series) => series.id);
  const selectionMode = selectedIds.length > 0;
  const allSelected = history.length > 0 && selectedIds.length === history.length;

  const startSelection = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPickedIds([id]);
  };

  const toggleSelected = (id: string) => {
    void Haptics.selectionAsync();
    setPickedIds(selectedIds.includes(id) ? selectedIds.filter((picked) => picked !== id) : [...selectedIds, id]);
  };

  const toggleAll = () => setPickedIds(allSelected ? [] : history.map((series) => series.id));

  const confirmDeleteSelected = () => {
    const count = selectedIds.length;
    Alert.alert(`Remove ${count} series?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteSeries(selectedIds)
            .then(() => setPickedIds([]))
            .catch((error: unknown) => console.warn('[series history] Could not delete series:', error));
        },
      },
    ]);
  };

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

  return (
    <View style={styles.screen}>
      {selectionMode && (
        <SelectionBar
          count={selectedIds.length}
          allSelected={allSelected}
          onCancel={() => setPickedIds([])}
          onToggleAll={toggleAll}
          onDelete={confirmDeleteSelected}
        />
      )}
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
            selectionMode={selectionMode}
            selected={selectedIds.includes(savedSeries.id)}
            onToggleSelected={toggleSelected}
            onStartSelection={startSelection}
            onLabelChange={updateSeriesLabel}
          />
        ))}
        {history.length > 0 && !selectionMode && (
          <Pressable style={styles.destructiveButton} onPress={confirmClearHistory}>
            <Text style={commonStyles.buttonText}>Remove all saved series</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
