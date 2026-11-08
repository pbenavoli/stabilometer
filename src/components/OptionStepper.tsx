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

export function OptionStepper({
  label,
  valueText,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: {
  label: string;
  valueText: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          disabled={!canDecrease}
          style={[styles.stepperButton, !canDecrease && styles.stepperButtonDisabled]}
          onPress={onDecrease}>
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text accessibilityLabel={`${label}: ${valueText}`} style={styles.stepperValue}>
          {valueText}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          disabled={!canIncrease}
          style={[styles.stepperButton, !canIncrease && styles.stepperButtonDisabled]}
          onPress={onIncrease}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    alignSelf: 'stretch',
    marginTop: 16,
    gap: 8,
  },
  optionLabel: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 64,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2f6fed',
  },
  stepperButtonDisabled: {
    backgroundColor: '#b9c4d1',
  },
  stepperButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
