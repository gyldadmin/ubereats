import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { GatheringCardCompactV1 } from '../components/ui';
import { useHomeGatherings } from '../hooks/useHomeGatherings';
import type { GatheringCardData } from '../hooks/useHomeGatherings';

// Constants for expandable list behavior
const INITIAL_VISIBLE_COUNT = 3;

export default function HomeScreen() {
  const navigation = useNavigation();
  const { gatherings, loading, error, refresh, updateRSVP } = useHomeGatherings();
  
  // State for show more/less functionality
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to get visible gatherings based on expansion state
  const getVisibleGatherings = () => {
    if (isExpanded || gatherings.length <= INITIAL_VISIBLE_COUNT) {
      return gatherings;
    }
    return gatherings.slice(0, INITIAL_VISIBLE_COUNT);
  };

  // Helper function to determine if toggle button should be shown
  const shouldShowToggle = () => {
    return gatherings.length > INITIAL_VISIBLE_COUNT;
  };

  // Handle toggle expansion
  const handleToggleExpansion = () => {
    console.log(`📝 Toggling gathering list: ${isExpanded ? 'collapsing' : 'expanding'}`);
    setIsExpanded(!isExpanded);
  };

  // Handle card press navigation
  const handleGatheringPress = (gatheringId: string) => {
    console.log('Gathering pressed:', gatheringId);
    // TODO: Navigate to gathering detail screen
    // navigation.navigate('GatheringDetail', { gatheringId });
  };

  // Handle RSVP press (for cycling behavior on yes/no)
  const handleRSVPPress = (gatheringId: string, currentStatus: 'yes' | 'no' | 'pending') => {
    // Only handle cycling for non-pending statuses
    if (currentStatus !== 'pending') {
      let newStatus: 'yes' | 'no';
      if (currentStatus === 'yes') {
        newStatus = 'no';
      } else {
        newStatus = 'yes'; // From no back to yes
      }
      
      updateRSVP(gatheringId, newStatus);
    }
  };

  // Handle RSVP dropdown selection (for pending status)
  const handleRSVPSelect = (gatheringId: string, status: 'yes' | 'no') => {
    console.log('🎯 HomeScreen: handleRSVPSelect called with:', { gatheringId, status });
    updateRSVP(gatheringId, status);
  };

  // Handle plan gathering navigation
  const handlePlanGathering = () => {
    navigation.navigate('Roles' as never);
  };

  // Transform data for the existing card component
  const transformGatheringData = (cardData: GatheringCardData) => {
    const { gathering, gatheringDisplay, userRole, displayImage, formattedDate, experienceTypeLabel, hostNames, mentorInfo } = cardData;

    // Debug logging for mentor info
    if (experienceTypeLabel.toLowerCase() === 'mentoring') {
      console.log('🔄 Transforming mentoring gathering:', gathering.title);
      console.log('👤 mentorInfo:', mentorInfo);
      console.log('📝 mentor_satellite:', mentorInfo?.mentor_satellite);
      console.log('🏢 employer_info:', mentorInfo?.employer_info);
      console.log('🏷️ mentor_name:', mentorInfo?.mentor_satellite?.full_name);
      console.log('🏢 mentor_company:', mentorInfo?.employer_info?.name);
    }

    return {
      id: gathering.id,
      title: gathering.title || 'Untitled Gathering',
      start_time: gathering.start_time || '',
      end_time: gathering.end_time || '',
      experience_type: experienceTypeLabel,
      address: gatheringDisplay?.address || 'Location TBD',
      image: displayImage,
      description: gatheringDisplay?.description || 'No description available',
      host_names: hostNames,
      mentor_name: mentorInfo?.mentor_satellite?.full_name,
      mentor_company: mentorInfo?.employer_info?.name,
      participant_count: 0, // TODO: Calculate from participation_gatherings
      max_participants: gatheringDisplay?.cap || 0,
      rsvp_status: userRole.rsvpStatus,
      userRole: userRole,
    };
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading gatherings...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading gatherings</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Upcoming Gatherings
        </Text>
      </View>

      <View style={styles.section}>
        {gatherings.length === 0 ? (
          // No gatherings state
          <View style={styles.noGatheringsContainer}>
            <Text style={styles.noGatheringsTitle}>No gatherings on the calendar</Text>
            <Text style={styles.noGatheringsSubtitle}>
              Please come back soon or{' '}
              <TouchableOpacity onPress={handlePlanGathering}>
                <Text style={styles.planLink}>plan one</Text>
              </TouchableOpacity>
            </Text>
          </View>
        ) : (
          <>
            {/* Gatherings list with expandable functionality */}
            {getVisibleGatherings().map((gatheringData) => (
              <GatheringCardCompactV1
                key={gatheringData.gathering.id}
                gathering={transformGatheringData(gatheringData)}
                onPress={() => handleGatheringPress(gatheringData.gathering.id)}
                onRSVPPress={() => handleRSVPPress(
                  gatheringData.gathering.id,
                  gatheringData.userRole.rsvpStatus
                )}
                onRSVPSelect={(status) => handleRSVPSelect(gatheringData.gathering.id, status)}
              />
            ))}

            {/* Show More/Show Less toggle button */}
            {shouldShowToggle() && (
              <TouchableOpacity 
                style={styles.toggleButton} 
                onPress={handleToggleExpansion}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {isExpanded ? 'Show Fewer' : 'Show More'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  footer: {
    height: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
  noGatheringsContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noGatheringsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  noGatheringsSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  planLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  toggleButton: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
