import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../../styles/theme';

export default function CourseBrowseScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Browse Courses</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    textAlign: 'center',
  },
}); 