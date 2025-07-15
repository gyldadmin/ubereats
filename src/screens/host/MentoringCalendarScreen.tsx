import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { NavigationListItem } from '../../components/ui';

export default function MentoringCalendarScreen() {
  const navigation = useNavigation();

  const handleLearnMoreAboutSalons = () => {
    (navigation as any).navigate('GatheringResources');
  };

  const handleFindAMentor = () => {
    (navigation as any).navigate('GatheringPromote');
  };

  const handlePlanYourSalon = () => {
    (navigation as any).navigate('GatheringSetup');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Mentoring Calendar
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Starting point for planning your mentoring event - view schedules and coordinate sessions
        </Text>
      </View>
      
      <View style={styles.navigationSection}>
        <NavigationListItem
          icon="help-circle"
          title="Learn More about Salons"
          onPress={handleLearnMoreAboutSalons}
          showTopDivider={true}
        />
        
        <NavigationListItem
          icon="help-circle"
          title="Find a Mentor"
          onPress={handleFindAMentor}
        />
        
        <NavigationListItem
          icon="edit"
          title="Plan Your Salon"
          onPress={handlePlanYourSalon}
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
}); 