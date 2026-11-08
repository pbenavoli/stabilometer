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

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TrashIcon } from '@/components/TrashIcon';

/** Contextual bar shown while series are being selected, in the style of a mail app's multi-select. */
export function SelectionBar({
  count,
  allSelected,
  onCancel,
  onToggleAll,
  onDelete,
}: {
  count: number;
  allSelected: boolean;
  onCancel: () => void;
  onToggleAll: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel selection" style={styles.iconButton} onPress={onCancel}>
        <Text style={styles.cancelGlyph}>✕</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.count}>
        {count} selected
      </Text>
      <Pressable accessibilityRole="button" style={styles.textButton} onPress={onToggleAll}>
        <Text style={styles.textButtonLabel}>{allSelected ? 'None' : 'All'}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${count} selected series`}
        style={styles.iconButton}
        onPress={onDelete}>
        <TrashIcon color="#b00020" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomColor: '#c9d6ec',
    borderBottomWidth: 1,
    backgroundColor: '#e8f0fe',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelGlyph: {
    color: '#202733',
    fontSize: 20,
  },
  count: {
    flex: 1,
    color: '#202733',
    fontSize: 17,
    fontWeight: '600',
  },
  textButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textButtonLabel: {
    color: '#2f6fed',
    fontSize: 16,
    fontWeight: '600',
  },
});
