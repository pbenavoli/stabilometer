import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ReadoutRow } from '@/components/ReadoutRow';
import type { SavedSeries } from '@/hooks/useSeriesHistory';

export function SavedSeriesRow({
  series,
  onLabelChange,
  onDelete,
}: {
  series: SavedSeries;
  onLabelChange: (id: string, label: string) => void;
  onDelete: (series: SavedSeries) => void;
}) {
  const [label, setLabel] = useState(series.label ?? '');
  const [showRemoveMenu, setShowRemoveMenu] = useState(false);
  const callbacksRef = useRef({ onDelete, onLabelChange });

  useEffect(() => {
    callbacksRef.current = { onDelete, onLabelChange };
  }, [onDelete, onLabelChange]);

  return (
    <View style={styles.historyItem}>
      <View style={styles.seriesHeader}>
        <TextInput
          accessibilityLabel="Series label"
          maxLength={60}
          placeholder="Add a label"
          returnKeyType="done"
          style={styles.seriesLabelInput}
          value={label}
          onChangeText={setLabel}
          onEndEditing={() => {
            void callbacksRef.current.onLabelChange(series.id, label);
          }}
        />
        {showRemoveMenu && (
          <View style={styles.seriesActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label.trim() || series.condition} series`}
              style={styles.seriesRemoveButton}
              onPress={() => callbacksRef.current.onDelete(series)}>
              <Text style={styles.seriesRemoveButtonText}>Remove</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close series actions"
              style={styles.seriesDoneButton}
              onPress={() => setShowRemoveMenu(false)}>
              <Text style={styles.seriesDoneButtonText}>Done</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label.trim() || series.condition} series details`}
        accessibilityHint="Long press to show the remove action"
        delayLongPress={500}
        style={styles.seriesDetails}
        onLongPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowRemoveMenu(true);
        }}>
        <Text style={styles.historyCondition}>{series.condition}</Text>
        <Text style={styles.historyDate}>{new Date(series.recordedAt).toLocaleString()}</Text>
        <ReadoutRow label="Trials" value={`${series.aggregate.count}`} />
        {typeof series.durationS === 'number' && (
          <ReadoutRow label="Trial duration" value={`${series.durationS} s`} />
        )}
        <ReadoutRow label="Mean sway area" value={`${series.aggregate.meanSwayAreaCm2.toFixed(1)} cm²`} />
        <ReadoutRow label="Area SD across trials" value={`${series.aggregate.sdSwayAreaCm2.toFixed(1)} cm²`} />
        <ReadoutRow label="Area consistency (CV)" value={`${series.aggregate.cvPercent.toFixed(0)}%`} />
        <ReadoutRow label="Stability index" value={series.aggregate.meanStabilityIndex.toFixed(1)} />
        {typeof series.aggregate.meanPathLengthMm === 'number' ? (
          <>
            <ReadoutRow
              label="Mean estimated path length"
              value={`${series.aggregate.meanPathLengthMm.toFixed(0)} mm`}
            />
            <ReadoutRow
              label="Path SD across trials"
              value={`${series.aggregate.sdPathLengthMm.toFixed(1)} mm`}
            />
            <ReadoutRow
              label="Path consistency (CV)"
              value={`${series.aggregate.cvPathLengthPercent.toFixed(0)}%`}
            />
            {series.trialPathLengthsMm?.map((pathLengthMm, index) => (
              <ReadoutRow key={index} label={`Trial ${index + 1} path`} value={`${pathLengthMm.toFixed(0)} mm`} />
            ))}
          </>
        ) : (
          <ReadoutRow label="Path length" value="Unavailable for this saved series" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  historyItem: {
    alignSelf: 'stretch',
    padding: 16,
    borderColor: '#d5dce5',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  seriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seriesActions: {
    flexDirection: 'row',
    gap: 6,
  },
  seriesRemoveButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#b00020',
  },
  seriesRemoveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  seriesDoneButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderColor: '#b9c4d1',
    borderWidth: 1,
    borderRadius: 6,
  },
  seriesDoneButtonText: {
    color: '#444',
    fontSize: 14,
    fontWeight: '600',
  },
  seriesLabelInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    paddingVertical: 6,
    borderBottomColor: '#b9c4d1',
    borderBottomWidth: 1,
    color: '#202733',
    fontSize: 17,
    fontWeight: '700',
  },
  historyCondition: {
    color: '#202733',
    fontSize: 17,
    fontWeight: '700',
  },
  historyDate: {
    color: '#666',
    fontSize: 13,
    marginBottom: 4,
  },
  seriesDetails: {
    marginTop: 8,
    gap: 6,
  },
});
