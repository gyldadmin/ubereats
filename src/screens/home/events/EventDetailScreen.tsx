import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, Modal, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useContent } from '../../../hooks/useContent';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, layout, shadows, theme, typography } from '../../../styles';
import { useGatheringDetail } from '../../../hooks';
import type { GatheringCardData } from '../../../hooks/useHomeGatherings';

interface EventDetailScreenRouteParams {
  gatheringData: GatheringCardData;
}



export default function EventDetailScreen() {
  const route = useRoute();
  const { gatheringData } = route.params as EventDetailScreenRouteParams;
  const insets = useSafeAreaInsets();
  
  // Use the comprehensive gathering detail hook
  const { 
    gatheringDetail,
    loading,
    error,
    updateRSVP,
    attendees,
    attendeeCounts,
    isHost,
    isScribe,
    rsvpStatus
  } = useGatheringDetail(gatheringData?.gathering?.id || '');
  
  // State for modal sliders
  const [showMentorBioModal, setShowMentorBioModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showAllAttendeesModal, setShowAllAttendeesModal] = useState(false);
  
  // Track failed image loads
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Get mentoring content
  const mentoringContent = useContent('mentoring_how_it_works');
  
  // Debug what we're getting from useContent
  console.log('🎯 EventDetailScreen mentoringContent:', mentoringContent);
  
  // Temporary debug section - we'll remove this after testing
  const debugContentRendering = () => {
    if (!mentoringContent) {
      return (
        <View style={{ backgroundColor: 'red', padding: 10, margin: 10 }}>
          <Text style={{ color: 'white' }}>❌ mentoringContent is null/undefined</Text>
        </View>
      );
    }
    
    return (
      <View style={{ backgroundColor: 'green', padding: 10, margin: 10 }}>
        <Text style={{ color: 'white' }}>✅ mentoringContent loaded!</Text>
        <Text style={{ color: 'white' }}>Description: {mentoringContent.description?.substring(0, 50)}...</Text>
        <Text style={{ color: 'white' }}>Content: {mentoringContent.content?.substring(0, 50)}...</Text>
      </View>
    );
  };
  
  // Debug logging to understand what's happening
  console.log('🔍 EventDetailScreen Debug:', {
    mentoringContent,
    hasDescription: !!mentoringContent?.description,
    hasContent: !!mentoringContent?.content
  });

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  // No data state
  if (!gatheringDetail) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No gathering data found</Text>
        </View>
      </View>
    );
  }

  // Helper functions for formatting data
  const formatDateTime = (startTime?: string, endTime?: string) => {
    if (!startTime) return { date: '', time: '' };
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    
    const date = start.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const startTimeStr = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const endTimeStr = end ? end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : null;
    
    const time = endTimeStr ? `${startTimeStr} - ${endTimeStr}` : startTimeStr;
    
    return { date, time };
  };

  // Image error handling
  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
  };

  // Check if image should show placeholder
  const shouldShowPlaceholder = (imageUrl?: string) => {
    return !imageUrl || failedImages.has(imageUrl);
  };

  // Helper function to truncate mentor bio for preview
  const truncateBio = (bio: string, wordLimit: number = 30): { truncated: string; needsMore: boolean } => {
    const words = bio.split(' ');
    if (words.length <= wordLimit) {
      return { truncated: bio, needsMore: false };
    }
    return { 
      truncated: words.slice(0, wordLimit).join(' ') + '...', 
      needsMore: true 
    };
  };

  // Location display logic with 4 different states
  const getLocationInfo = () => {
    const now = new Date();
    const startTime = gatheringDetail.gathering.start_time ? new Date(gatheringDetail.gathering.start_time) : null;
    const sixHoursBeforeStart = startTime ? new Date(startTime.getTime() - (6 * 60 * 60 * 1000)) : null;
    const isWithinSixHours = startTime && now >= sixHoursBeforeStart;

    if (gatheringDetail.gatheringOther.remote) {
      if (isWithinSixHours) {
        // State 1: Virtual Event - Less than 6 hours before start
        return {
          type: 'remote-ready',
          icon: 'video' as const,
          text: 'Virtual Event',
          subtext: null,
          showJoinButton: true,
          meetingLink: gatheringDetail.gatheringDisplay?.meeting_link
        };
      } else {
        // State 2: Virtual Event - More than 6 hours before start
        return {
          type: 'remote-waiting',
          icon: 'video' as const,
          text: 'Virtual Event',
          subtext: 'Link available here before event',
          showJoinButton: false
        };
      }
    } else {
      if (gatheringDetail.gatheringDisplay?.address) {
        // State 3: Physical Location - Address provided
        return {
          type: 'in-person',
          icon: 'map-pin' as const,
          text: gatheringDetail.gatheringDisplay.address,
          subtext: gatheringDetail.gatheringDisplay?.location_instructions || null,
          showJoinButton: false
        };
      } else {
        // State 4: Physical Location - Address not provided
        return {
          type: 'in-person-tbd',
          icon: 'map-pin' as const,
          text: 'Location TBD',
          subtext: null,
          showJoinButton: false
        };
      }
    }
  };





  const getHowItWorks = () => {
    return [
      {
        title: 'Join the Session',
        description: 'Check in and get comfortable in our welcoming environment'
      },
      {
        title: 'Learn from Expert',
        description: 'Engage with industry mentor in focused discussion'
      },
      {
        title: 'Ask Questions',
        description: 'Participate in Q&A and share your challenges'
      },
      {
        title: 'Connect & Follow Up',
        description: 'Network with peers and access follow-up resources'
      }
    ];
  };

  // Handle RSVP button press
  const handleRSVP = async (status: 'yes' | 'no') => {
    try {
      await updateRSVP(status);
      console.log(`✅ RSVP ${status} updated successfully`);
    } catch (err) {
      console.error(`❌ Failed to update RSVP:`, err);
    }
  };

  // Get data for display
  const { date, time } = formatDateTime(gatheringDetail.gathering.start_time, gatheringDetail.gathering.end_time);
  const location = getLocationInfo();
  const howItWorks = getHowItWorks();

  // Get RSVP button state
  const getRSVPButtonState = () => {
    return {
      status: rsvpStatus,
      showYesNo: rsvpStatus === 'pending' || !rsvpStatus
    };
  };

  const rsvpButtonState = getRSVPButtonState();

  return (
    <View style={styles.container}>
      {/* Debug Section - Remove after testing */}
      {debugContentRendering()}
      
      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Image 
              source={{ uri: gatheringDetail.displayImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroType}>
                {gatheringDetail.experienceTypeLabel?.toUpperCase() || 'EVENT'}
              </Text>
              <Text style={styles.heroTitle}>
                {gatheringDetail.gathering.title || 'Event'}
              </Text>
            </View>
          </View>


          {/* Join Now Button for Virtual Events (if within 6 hours) */}
          {location.showJoinButton && location.meetingLink && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => {
                // Open meeting link
                Linking.openURL(location.meetingLink);
              }}
            >
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          )}

          {/* Details Section */}
          <Text style={styles.sectionTitleWithSpacing}>Details</Text>
          
          <View style={styles.essentialInfo}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={24} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>{date}</Text>
                <Text style={styles.infoSubtext}>{time}</Text>
              </View>
            </View>
            
            <View style={[
              styles.infoRow,
              // Remove bottom margin if this is the last row (Rep section is hidden)
              !gatheringDetail.gatheringDisplay?.learning_topic && styles.infoRowLast
            ]}>
              <Feather name={location.icon} size={24} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>{location.text}</Text>
                {location.subtext && (
                  <Text style={styles.infoSubtext}>{location.subtext}</Text>
                )}
              </View>
            </View>
            
            {/* Rep Section - only show if learning_topic exists */}
            {gatheringDetail.gatheringDisplay?.learning_topic && (
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Ionicons 
                  name="shield-half-sharp" 
                  size={24} 
                  style={[
                    styles.infoIcon,
                    { color: gatheringDetail.gatheringDisplay.learning_topic?.color || '#000000' }
                  ]} 
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoText}>Rep</Text>
                  <Text style={styles.infoSubtext}>
                    {gatheringDetail.gatheringDisplay.learning_topic?.label || 'Learning Topic'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Mentor Section - only show if mentor array is not empty */}
          {gatheringDetail.gatheringDisplay?.mentor && gatheringDetail.gatheringDisplay.mentor.length > 0 && (
            <View style={styles.mentorSection}>
              <Text style={styles.sectionTitleWithSpacing}>Your Mentor</Text>
              
              <View style={styles.mentorCard}>
                {gatheringDetail.mentorInfo?.mentor_satellite?.profpic ? (
                  <Image 
                    source={{ uri: gatheringDetail.mentorInfo.mentor_satellite.profpic }}
                    style={styles.mentorAvatar}
                  />
                ) : (
                  <View style={styles.mentorAvatar}>
                    <Ionicons 
                      name="person" 
                      size={40} 
                      color={colors.text.tertiary}
                      style={{ alignSelf: 'center', marginTop: 30 }}
                    />
                  </View>
                )}
                
                <View style={styles.mentorInfo}>
                  <View style={styles.mentorTextContainer}>
                    <Text style={styles.mentorName}>
                      {gatheringDetail.mentorInfo?.mentor_satellite?.full_name || 'Mentor Name'}
                    </Text>
                    
                    {/* Only show title if it exists */}
                    {gatheringDetail.mentorInfo?.mentor_satellite?.title && (
                      <Text style={styles.mentorTitle}>
                        {gatheringDetail.mentorInfo.mentor_satellite.title}
                      </Text>
                    )}
                    
                    {/* Only show company if it exists */}
                    {gatheringDetail.mentorInfo?.employer_info?.name && (
                      <Text style={styles.mentorCompany}>
                        {gatheringDetail.mentorInfo.employer_info.name}
                      </Text>
                    )}
                    
                    {/* Show nonprofit text if nonprofit_name exists */}
                    {gatheringDetail.mentorInfo?.mentor_satellite?.nonprofit_name && (
                      <Text style={styles.mentorNonprofit}>
                        Mentoring for {gatheringDetail.mentorInfo.mentor_satellite.nonprofit_name}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Bio link moved below the photo with Learn More format */}
              {gatheringDetail.mentorInfo?.mentor_satellite?.bio && (
                <TouchableOpacity 
                  style={styles.learnMoreButton}
                  onPress={() => setShowMentorBioModal(true)}
                >
                  <Text style={styles.learnMoreText}>Bio</Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* About Section - only show if description exists */}
          {gatheringDetail.gatheringDisplay?.description && (
            <View style={styles.valueSection}>
              <Text style={styles.sectionTitleWithSpacing}>About</Text>
              
              <Text style={styles.description}>
                {gatheringDetail.gatheringDisplay.description}
              </Text>
            </View>
          )}

          {/* Attendees Section - only show if 4 or more people attending */}
          {attendeeCounts.yes >= 4 && (
            <View style={styles.attendeesSection}>
              <Text style={styles.sectionTitleWithSpacing}>Attending</Text>
              
              <View style={styles.attendeesGrid}>
                {attendees
                  .filter(attendee => attendee.part_gath_status?.label === 'yes')
                  .slice(0, 9)
                  .map((attendee) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    {!shouldShowPlaceholder(attendee.user_profile?.profpic) ? (
                      <Image 
                        source={{ uri: attendee.user_profile!.profpic }}
                        style={styles.attendeeAvatar}
                        onError={() => handleImageError(attendee.user_profile!.profpic!)}
                      />
                    ) : (
                      <View style={[styles.attendeeAvatar, styles.attendeePlaceholder]}>
                        <Ionicons name="person" size={24} color={colors.text.tertiary} />
                      </View>
                    )}
                    <Text style={styles.attendeeName}>
                      {attendee.user_profile?.first || 'Anonymous'}
                    </Text>
                  </View>
                ))}
                
                {attendeeCounts.yes > 9 && (
                  <TouchableOpacity 
                    style={styles.attendeeItem}
                    onPress={() => setShowAllAttendeesModal(true)}
                  >
                    <View style={styles.attendeeMore}>
                      <Text style={styles.attendeeMoreText}>+{attendeeCounts.yes - 9}</Text>
                    </View>
                    <Text style={styles.attendeeName}>more</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* How It Works Section - only show for mentoring */}
          {gatheringDetail.experienceTypeLabel?.toLowerCase() === 'mentoring' && (
            <View style={styles.howItWorksSection}>
              <Text style={styles.sectionTitleWithSpacing}>How Mentoring Sessions Work</Text>
              <Text style={styles.howItWorksDescription}>
                {mentoringContent?.description || 'Join us for an engaging mentoring experience focused on practical insights and career growth.'}
              </Text>
              <TouchableOpacity 
                style={styles.learnMoreButton}
                onPress={() => setShowHowItWorksModal(true)}
              >
                <Text style={styles.learnMoreText}>Learn More</Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Host Information - only show if hosts exist */}
          {gatheringDetail.gathering.host && gatheringDetail.gathering.host.length > 0 && (
            <View style={styles.socialSection}>
              <Text style={styles.sectionTitleWithSpacing}>Host</Text>
              
              <View style={styles.hostInfoCard}>
                {gatheringDetail.hostData && gatheringDetail.hostData.length > 0 && gatheringDetail.hostData[0].profpic ? (
                  <Image 
                    source={{ uri: gatheringDetail.hostData[0].profpic }}
                    style={styles.hostCircleAvatar}
                  />
                ) : (
                  <View style={styles.hostCircleAvatar}>
                    <Ionicons name="person" size={24} color={colors.text.tertiary} />
                  </View>
                )}
                <View style={styles.hostTextInfo}>
                  <Text style={styles.hostNameText}>
                    {gatheringDetail.hostNames.join(', ')}
                  </Text>
                  <Text style={styles.hostRoleText}>
                    Gyld Member
                  </Text>
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: spacing.lg + insets.bottom }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => {/* Share functionality */}}
          >
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          
          {/* RSVP Buttons based on status */}
          {rsvpButtonState.status === 'yes' ? (
            <TouchableOpacity 
              style={[styles.rsvpButton, styles.rsvpYesButton]}
              onPress={() => handleRSVP('no')}
            >
              <Text style={styles.rsvpButtonText}>You're Going</Text>
            </TouchableOpacity>
          ) : rsvpButtonState.status === 'no' ? (
            <TouchableOpacity 
              style={styles.rsvpButton}
              onPress={() => handleRSVP('yes')}
            >
              <Text style={styles.rsvpButtonText}>You're Not Going</Text>
            </TouchableOpacity>
          ) : rsvpButtonState.showYesNo ? (
            <>
              <TouchableOpacity 
                style={styles.rsvpButton}
                onPress={() => handleRSVP('yes')}
              >
                <Text style={styles.rsvpButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => handleRSVP('no')}
              >
                <Text style={styles.secondaryButtonText}>No</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.rsvpButton}
              onPress={() => handleRSVP('yes')}
            >
              <Text style={styles.rsvpButtonText}>RSVP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Mentor Bio Modal */}
      <Modal
        visible={showMentorBioModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMentorBioModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {gatheringDetail?.mentorInfo?.mentor_satellite?.full_name || 'Mentor'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowMentorBioModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>
              {gatheringDetail?.mentorInfo?.mentor_satellite?.bio || 'Mentor bio not available.'}
            </Text>
          </ScrollView>
        </View>
      </Modal>
      
      {/* How It Works Modal */}
      <Modal
        visible={showHowItWorksModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHowItWorksModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>How Mentoring Sessions Work</Text>
            <TouchableOpacity 
              onPress={() => setShowHowItWorksModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>
              {mentoringContent?.content || getHowItWorks().map((step, index) => `${index + 1}. ${step.title}\n${step.description}`).join('\n\n')}
            </Text>
          </ScrollView>
        </View>
      </Modal>
      
      {/* All Attendees Modal */}
      <Modal
        visible={showAllAttendeesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAllAttendeesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Attendees ({attendeeCounts.yes})</Text>
            <TouchableOpacity 
              onPress={() => setShowAllAttendeesModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.allAttendeesGrid}>
              {attendees
                .filter(attendee => attendee.part_gath_status?.label === 'yes')
                .map((attendee) => (
                                 <View key={attendee.id} style={styles.modalAttendeeItem}>
                   {!shouldShowPlaceholder(attendee.user_profile?.profpic) ? (
                     <Image 
                       source={{ uri: attendee.user_profile!.profpic }}
                       style={styles.modalAttendeeAvatar}
                       onError={() => handleImageError(attendee.user_profile!.profpic!)}
                     />
                   ) : (
                     <View style={[styles.modalAttendeeAvatar, styles.attendeePlaceholder]}>
                       <Ionicons name="person" size={32} color={colors.text.tertiary} />
                     </View>
                   )}
                  <Text style={styles.modalAttendeeName}>
                    {attendee.user_profile?.first || 'Anonymous'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  
  // Fixed spacing constants for consistent title spacing
  // No need to define these in StyleSheet, they'll be used in the actual styles below
  
  // Hero Section
  heroSection: {
    height: 200,
    position: 'relative',
    borderRadius: layout.borderRadius.md,
    overflow: 'hidden',
    marginBottom: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    padding: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  heroType: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.lg, // Add consistent spacing after hero image
    paddingBottom: 120, // Space for action buttons
  },
  
  // Essential Info Block
  essentialInfo: {
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl + spacing.sm,
    marginBottom: spacing.md,
  },
  joinButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.md,
    color: colors.text.primary, // Changed to black instead of primary brand color
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  
  // Host/Mentor Spotlight
  hostSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionTitleWithSpacing: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 32, // Fixed pixels above titles
    marginBottom: 16, // Fixed pixels below titles
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: colors.border.light,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  hostTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  hostCompany: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  trustBadge: {
    backgroundColor: colors.primaryAlpha,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  trustBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Value Proposition
  valueSection: {
    // Removed marginBottom to prevent compound spacing
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  
  // Social Context
  socialSection: {
    // Removed marginBottom to prevent compound spacing
  },
  rsvpStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rsvpIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.md,
  },
  rsvpText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  capacity: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  
  // Action Buttons
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rsvpButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  rsvpYesButton: {
    backgroundColor: colors.status.success,
  },
  
  // Mentor Bio Section
  mentorBioSection: {
    marginTop: spacing.md,
  },
  mentorBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  mentorBioIcon: {
    marginRight: spacing.md,
  },
  mentorBioButtonText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  mentorBioExpanded: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  mentorBioText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
  },
  
  // Attendees Section
  attendeesSection: {
    // Removed marginBottom to prevent compound spacing
  },
  attendeesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attendeeItem: {
    alignItems: 'center',
    width: 60,
  },
  attendeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: spacing.xs,
  },
  attendeePlaceholder: {
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  attendeeMore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  attendeeMoreText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  
  // How It Works Section
  howItWorksSection: {
    // Removed marginBottom to prevent compound spacing
  },
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
  },
  howItWorksButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  howItWorksExpanded: {
    marginTop: spacing.sm,
  },
  howItWorksStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  howItWorksStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  howItWorksStepNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  howItWorksStepContent: {
    flex: 1,
  },
  howItWorksStepTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  howItWorksStepDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  
  // Enhanced location styles
  locationDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.status.error,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    textAlign: 'center',
  },
  
  // New Mentor Section Styles
  mentorSection: {
    // Removed marginBottom to prevent compound spacing
  },
  mentorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  mentorAvatar: {
    width: 100,
    height: 100,
    borderRadius: layout.borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.border.light,
  },
  mentorInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 100, // Match image height as minimum, allow growth
  },
  mentorTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xs, // Use gap instead of marginBottom for cleaner spacing
  },
  mentorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  mentorTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  mentorCompany: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  mentorNonprofit: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  mentorBioLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  mentorBioLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // How It Works Section Styles
  howItWorksDescription: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  learnMoreText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    marginRight: spacing.xs,
  },
  
  // Host Section Styles
  hostInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  hostCircleAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  hostTextInfo: {
    flex: 1,
  },
  hostNameText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  hostRoleText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
  },
  modalStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  modalStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  modalStepNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  modalStepContent: {
    flex: 1,
  },
  modalStepTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modalStepDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  
  // All Attendees Modal Styles
  allAttendeesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
  modalAttendeeItem: {
    alignItems: 'center',
    width: 80,
    marginBottom: spacing.md,
  },
  modalAttendeeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.sm,
  },
  modalAttendeeName: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
}); 