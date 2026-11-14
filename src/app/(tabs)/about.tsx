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

import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { commonStyles } from '@/components/commonStyles';
import MarkdownDocument from '@/components/MarkdownDocument';
import usageGuide from '../../../USAGE.md';

export default function AboutScreen() {
  const version = Constants.expoConfig?.version;
  const [showManual, setShowManual] = useState(false);

  return (
    <ScrollView alwaysBounceVertical={false} contentContainerStyle={styles.content}>
      {showManual ? (
        <>
          <Pressable
            accessibilityRole="button"
            style={commonStyles.button}
            onPress={() => setShowManual(false)}>
            <Text style={commonStyles.buttonText}>Back to About</Text>
          </Pressable>
          <MarkdownDocument markdown={usageGuide} />
        </>
      ) : (
        <>
          <Text style={commonStyles.title}>About Stabilometer</Text>
          <Text style={commonStyles.subtitle}>Version: {version || 'Unavailable'}</Text>
          <Text style={styles.licenseTitle}>License</Text>
          <Text style={styles.licenseText}>Copyright (C) 2026 Patrick Benavoli</Text>
          <Text style={styles.licenseText}>
            This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
            Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
            option) any later version.
          </Text>
          <Text style={styles.licenseText}>
            This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
            implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License
            for more details.
          </Text>
          <Text style={styles.licenseText}>
            You should have received a copy of the GNU General Public License along with this program. If not, see
            {' <https://gnu.org>.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={commonStyles.button}
            onPress={() => setShowManual(true)}>
            <Text style={commonStyles.buttonText}>Read user manual</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
    gap: 16,
  },
  licenseTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  licenseText: {
    color: '#202733',
    fontSize: 16,
    lineHeight: 24,
  },
});
