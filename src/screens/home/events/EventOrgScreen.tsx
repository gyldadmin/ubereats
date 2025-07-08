import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { FacebookTopNavTabs } from '../../../components/ui';
import { theme } from '../../../styles/theme';

export default function EventOrgScreen() {
  const [selectedTab, setSelectedTab] = useState('plan');

  const renderContent = () => {
    switch (selectedTab) {
      case 'plan':
        return <Text variant="bodyLarge">Plan Content</Text>;
      case 'resources':
        return <Text variant="bodyLarge">Resources Content</Text>;
      case 'edit':
        return <Text variant="bodyLarge">Edit Content</Text>;
      default:
        return <Text variant="bodyLarge">Plan Content</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Event Organization</Text>
      
      <FacebookTopNavTabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        buttons={[
          { value: 'plan', label: 'Plan' },
          { value: 'resources', label: 'Resources' },
          { value: 'edit', label: 'Edit' },
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