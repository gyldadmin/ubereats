import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { FacebookTopNavTabs } from '../components/ui';
import { theme } from '../styles/theme';

export default function YouScreen() {
  const [selectedTab, setSelectedTab] = useState('profile');

  const renderContent = () => {
    switch (selectedTab) {
      case 'profile':
        return <Text variant="bodyLarge">Profile Settings</Text>;
      case 'progress':
        return <Text variant="bodyLarge">Academic Progress</Text>;
      case 'settings':
        return <Text variant="bodyLarge">App Settings</Text>;
      default:
        return <Text variant="bodyLarge">Profile Settings</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>You</Text>
      
      <FacebookTopNavTabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        buttons={[
          { value: 'profile', label: 'Profile' },
          { value: 'progress', label: 'Progress' },
          { value: 'settings', label: 'Settings' },
        ]}
        style={styles.segmentedButtons}
      />

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 