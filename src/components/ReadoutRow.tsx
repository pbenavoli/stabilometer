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
