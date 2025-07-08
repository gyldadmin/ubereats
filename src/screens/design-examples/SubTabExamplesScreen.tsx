import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, SegmentedButtons, Divider } from 'react-native-paper';
import { CustomSegmentedButtons, TabButtons, SubtleTabButtons, MinimalTabButtons, FacebookStyleTabs, FacebookTopNavTabs } from '../../components/ui';
import { theme } from '../../styles/theme';

export default function SubTabExamplesScreen() {
  const [selectedTab1, setSelectedTab1] = useState('members');
  const [selectedTab2, setSelectedTab2] = useState('members');
  const [selectedTab3, setSelectedTab3] = useState('members');
  const [selectedTab4, setSelectedTab4] = useState('members');
  const [selectedTab5, setSelectedTab5] = useState('members');
  const [selectedTab6, setSelectedTab6] = useState('members');
  const [selectedTab7, setSelectedTab7] = useState('members');

  const tabButtons = [
    { value: 'members', label: 'Members' },
    { value: 'mentors', label: 'Mentors' },
    { value: 'knowledge', label: 'Knowledge' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Sub-Tab Design Options
      </Text>

      {/* Current Design (Default Paper) */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Current Design (Default Paper)
        </Text>
        <SegmentedButtons
          value={selectedTab1}
          onValueChange={setSelectedTab1}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Uses React Native Paper's default theme colors (light purple).
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Option 1: Custom Pill Style */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Option 1: Pill Style with Brand Colors
        </Text>
        <CustomSegmentedButtons
          value={selectedTab2}
          onValueChange={setSelectedTab2}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Rounded pill design using your brand color #13bec7 with subtle shadows.
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Option 2: Tab Style with Underlines */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Option 2: Tab Style with Underlines
        </Text>
        <TabButtons
          value={selectedTab3}
          onValueChange={setSelectedTab3}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Traditional tab design with underline indicators using your brand color.
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Option 3: Subtle Background Style */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Option 3: Subtle Background Style
        </Text>
        <SubtleTabButtons
          value={selectedTab4}
          onValueChange={setSelectedTab4}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Very subtle background tint with minimal contrast using brand color.
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Option 4: Minimal Text-Only Style */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Option 4: Minimal Text-Only Style
        </Text>
        <MinimalTabButtons
          value={selectedTab5}
          onValueChange={setSelectedTab5}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Ultra-minimal design with only text color and tiny dot indicators.
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Option 5: Facebook Style */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Option 5: Facebook Style Tabs
        </Text>
        <FacebookStyleTabs
          value={selectedTab6}
          onValueChange={setSelectedTab6}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Clean Facebook-style design with proper spacing, readable text, and clear underline indicators.
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Option 6: Facebook Top Nav (Actual) */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Option 6: Facebook Top Nav (Actual Design)
        </Text>
        <FacebookTopNavTabs
          value={selectedTab7}
          onValueChange={setSelectedTab7}
          buttons={tabButtons}
          style={styles.tabComponent}
        />
        <Text variant="bodyMedium" style={styles.description}>
          Exact Facebook design with light rounded background highlight for selected tab.
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* Color Information */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Brand Color Information
        </Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
          <Text variant="bodyMedium">Primary: #13bec7</Text>
        </View>
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primaryLight }]} />
          <Text variant="bodyMedium">Light: #4dd0d7</Text>
        </View>
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primaryLighter }]} />
          <Text variant="bodyMedium">Lighter: #7dd3d9</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  tabComponent: {
    marginBottom: theme.spacing.md,
  },
  description: {
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: theme.spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
}); 