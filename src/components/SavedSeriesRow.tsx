import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ReadoutRow } from '@/components/ReadoutRow';
import type { SavedSeries } from '@/hooks/useSeriesHistory';
import { SWAY_MODEL_VERSION } from '@/lib/stability';

export function SavedSeriesRow({
  series,
  selectionMode,
  selected,
  onToggleSelected,
  onStartSelection,
  onLabelChange,
}: {
  series: SavedSeries;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onStartSelection: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
}) {
  const [label, setLabel] = useState(series.label ?? '');
  const title = label.trim() || series.condition;

  return (
    <View style={styles.row}>
      {selectionMode && (
        <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      <View style={[styles.historyItem, selected && styles.historyItemSelected]}>
        <View style={styles.seriesHeader}>
          <TextInput
            accessibilityLabel="Series label"
            editable={!selectionMode}
            maxLength={60}
            placeholder="Add a label"
            returnKeyType="done"
            style={styles.seriesLabelInput}
            value={label}
            onChangeText={setLabel}
            onEndEditing={() => {
              void onLabelChange(series.id, label);
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} series details`}
          accessibilityHint="Long press to select series for removal"
          delayLongPress={500}
          disabled={selectionMode}
          style={styles.seriesDetails}
          onLongPress={() => onStartSelection(series.id)}>
          <Text style={styles.historyCondition}>{series.condition}</Text>
          <Text style={styles.historyDate}>{new Date(series.recordedAt).toLocaleString()}</Text>
          {series.swayModel !== SWAY_MODEL_VERSION && (
            <Text style={styles.outdatedNote}>
              Recorded with an earlier, inaccurate sway model. Values are not comparable with newer series.
            </Text>
          )}
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
      {selectionMode && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={title}
          accessibilityState={{ checked: selected }}
          style={StyleSheet.absoluteFill}
          onPress={() => onToggleSelected(series.id)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#8a99a6',
    borderWidth: 2,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#2f6fed',
    backgroundColor: '#2f6fed',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  historyItem: {
    flex: 1,
    padding: 16,
    borderColor: '#d5dce5',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  historyItemSelected: {
    borderColor: '#2f6fed',
    borderWidth: 2,
    backgroundColor: '#f1f6ff',
  },
  seriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  outdatedNote: {
    color: '#b00020',
    fontSize: 13,
  },
});
