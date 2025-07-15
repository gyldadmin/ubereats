import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { NavigationListItem } from '../../components/ui';

export default function RoleOverviewScreen() {
  const navigation = useNavigation();

  const handlePlanMentoringSalon = () => {
    (navigation as any).navigate('MentoringCalendar');
  };

  const handlePlanSocialGathering = () => {
    (navigation as any).navigate('GatheringSetup');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
      <Text variant="headlineLarge" style={styles.title}>Role Overview</Text>
    </View>
      
      <View style={styles.navigationSection}>
        <NavigationListItem
          icon="lightbulb"
          title="Plan a mentoring salon"
          onPress={handlePlanMentoringSalon}
          showTopDivider={true}
        />
        
        <NavigationListItem
          icon="users"
          title="Plan a social gathering"
          onPress={handlePlanSocialGathering}
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
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  navigationSection: {
    marginTop: theme.spacing.md,
  },
}); 