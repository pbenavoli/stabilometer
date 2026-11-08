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

import { Platform, StyleSheet, Text, View } from 'react-native';

export function ReadoutRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readoutRow}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readoutLabel: {
    fontSize: 14,
    color: '#444',
  },
  readoutValue: {
    fontSize: 14,
    minWidth: 140,
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});
