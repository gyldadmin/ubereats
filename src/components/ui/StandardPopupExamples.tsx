import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { StandardPopup } from './StandardPopup';
import { theme } from '../../styles/theme';

/**
 * StandardPopup Usage Examples
 * This file demonstrates all the different ways to use the StandardPopup component
 */

export const StandardPopupExamples: React.FC = () => {
  // State for different popup examples
  const [showBasicPopup, setShowBasicPopup] = useState(false);
  const [showTwoButtonPopup, setShowTwoButtonPopup] = useState(false);
  const [showDestructivePopup, setShowDestructivePopup] = useState(false);
  const [showCustomStylePopup, setShowCustomStylePopup] = useState(false);
  const [showNoOverlayClosePopup, setShowNoOverlayClosePopup] = useState(false);
  const [showNoXButtonPopup, setShowNoXButtonPopup] = useState(false);

  const renderDemoButton = (title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.demoButton} onPress={onPress}>
      <Text style={styles.demoButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>StandardPopup Examples</Text>
      
      {/* Basic one-button popup */}
      {renderDemoButton('Basic Popup (1 Button)', () => setShowBasicPopup(true))}
      <StandardPopup
        visible={showBasicPopup}
        onClose={() => setShowBasicPopup(false)}
        title="Success!"
        message="Your gathering has been saved successfully."
        buttons={1}
        primaryButton={{
          text: "OK",
          onPress: () => setShowBasicPopup(false)
        }}
      />

      {/* Two-button confirmation popup */}
      {renderDemoButton('Two Button Confirmation', () => setShowTwoButtonPopup(true))}
      <StandardPopup
        visible={showTwoButtonPopup}
        onClose={() => setShowTwoButtonPopup(false)}
        title="Save Changes"
        message="You have unsaved changes. What would you like to do?"
        buttons={2}
        primaryButton={{
          text: "Save",
          onPress: () => {
            console.log('Save action');
            setShowTwoButtonPopup(false);
          }
        }}
        secondaryButton={{
          text: "Discard",
          onPress: () => {
            console.log('Discard action');
            setShowTwoButtonPopup(false);
          }
        }}
      />

      {/* Destructive action popup */}
      {renderDemoButton('Destructive Action', () => setShowDestructivePopup(true))}
      <StandardPopup
        visible={showDestructivePopup}
        onClose={() => setShowDestructivePopup(false)}
        title="Delete Gathering"
        message="Are you sure you want to delete this gathering? This action cannot be undone."
        buttons={2}
        primaryButton={{
          text: "Delete",
          onPress: () => {
            console.log('Delete action');
            setShowDestructivePopup(false);
          },
          style: "destructive"
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => setShowDestructivePopup(false),
          style: "secondary"
        }}
      />

      {/* Custom button styles */}
      {renderDemoButton('Custom Button Styles', () => setShowCustomStylePopup(true))}
      <StandardPopup
        visible={showCustomStylePopup}
        onClose={() => setShowCustomStylePopup(false)}
        title="Choose Action"
        message="Select what you'd like to do with this gathering."
        buttons={2}
        primaryButton={{
          text: "Launch Now",
          onPress: () => {
            console.log('Launch action');
            setShowCustomStylePopup(false);
          },
          style: "primary"
        }}
        secondaryButton={{
          text: "Save Draft",
          onPress: () => {
            console.log('Save draft action');
            setShowCustomStylePopup(false);
          },
          style: "secondary"
        }}
      />

      {/* No overlay close */}
      {renderDemoButton('No Overlay Close', () => setShowNoOverlayClosePopup(true))}
      <StandardPopup
        visible={showNoOverlayClosePopup}
        onClose={() => setShowNoOverlayClosePopup(false)}
        title="Important"
        message="This popup can only be closed with the X button or action buttons, not by tapping outside."
        buttons={1}
        primaryButton={{
          text: "Got It",
          onPress: () => setShowNoOverlayClosePopup(false)
        }}
        closeOnOverlayTap={false}
      />

      {/* No X button */}
      {renderDemoButton('No X Button', () => setShowNoXButtonPopup(true))}
      <StandardPopup
        visible={showNoXButtonPopup}
        onClose={() => setShowNoXButtonPopup(false)}
        title="Required Action"
        message="You must choose one of the options below to continue."
        buttons={2}
        primaryButton={{
          text: "Continue",
          onPress: () => {
            console.log('Continue action');
            setShowNoXButtonPopup(false);
          }
        }}
        secondaryButton={{
          text: "Go Back",
          onPress: () => setShowNoXButtonPopup(false)
        }}
        showCloseButton={false}
        closeOnOverlayTap={false}
      />

      <Text style={styles.sectionTitle}>Usage Patterns</Text>
      
      <View style={styles.codeExample}>
        <Text style={styles.codeTitle}>Basic Usage:</Text>
        <Text style={styles.codeText}>{`<StandardPopup
  visible={showPopup}
  onClose={() => setShowPopup(false)}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  buttons={1}
  primaryButton={{
    text: "OK",
    onPress: handleAction
  }}
/>`}</Text>
      </View>

      <View style={styles.codeExample}>
        <Text style={styles.codeTitle}>Two Buttons with Styles:</Text>
        <Text style={styles.codeText}>{`<StandardPopup
  visible={showPopup}
  onClose={() => setShowPopup(false)}
  title="Delete Item"
  message="This action cannot be undone."
  buttons={2}
  primaryButton={{
    text: "Delete",
    onPress: handleDelete,
    style: "destructive"
  }}
  secondaryButton={{
    text: "Cancel",
    onPress: () => setShowPopup(false),
    style: "secondary"
  }}
/>`}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  demoButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  demoButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  codeExample: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  codeTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  codeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

export default StandardPopupExamples; 