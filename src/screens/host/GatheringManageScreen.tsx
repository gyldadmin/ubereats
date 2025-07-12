import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { NavigationListItem } from '../../components/ui';

export default function GatheringManageScreen() {
  const navigation = useNavigation();

  const handleNavigateToPromote = () => {
    (navigation as any).navigate('GatheringPromote');
  };

  const handleNavigateToResources = () => {
    (navigation as any).navigate('GatheringResources');
  };

  const handleViewGuestList = () => {
    // TODO: Navigate to guest list screen
    console.log('Navigate to guest list');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Manage Your Gathering
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Dashboard for your active gathering - view RSVPs, communicate with guests, and track details
        </Text>
      </View>

      <View style={styles.navigationSection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        
        <NavigationListItem
          icon="users"
          title="View Guest List"
          onPress={handleViewGuestList}
          showTopDivider={true}
        />
        
        <NavigationListItem
          icon="megaphone"
          title="Promote Gathering"
          onPress={handleNavigateToPromote}
        />
        
        <NavigationListItem
          icon="help-circle"
          title="Tips & Resources"
          onPress={handleNavigateToResources}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  navigationSection: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
}); 