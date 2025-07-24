import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, Modal, Linking } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, layout, shadows, theme, typography, globalStyles } from '../../../styles';
import { useGatheringDetail, useContentTemplate } from '../../../hooks';
import { ContentTemplateDisplay } from '../../../components/ui';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../services/supabase';
import type { GatheringCardData } from '../../../hooks/useHomeGatherings';

interface EventDetailScreenRouteParams {
  gatheringData: GatheringCardData;
  previewMode?: boolean; // Optional flag to disable RSVP in preview mode
}



export default function EventDetailScreen() {
  const route = useRoute();
  const { gatheringData, previewMode = false } = route.params as EventDetailScreenRouteParams;
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
  const [showScribeRoleModal, setShowScribeRoleModal] = useState(false);
  const [showAllAttendeesModal, setShowAllAttendeesModal] = useState(false);
  const [showRSVPConfirmation, setShowRSVPConfirmation] = useState(false);
  const [showPotluckModal, setShowPotluckModal] = useState(false);
  
  // Track failed image loads
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // State for user's gyld type @ field
  const [userGyldTypeSymbol, setUserGyldTypeSymbol] = useState<string>('');
  
  // Potluck state
  const [potluckData, setPotluckData] = useState<Array<{id: string, user_name: string, contribution: string}>>([]);
  const [potluckContribution, setPotluckContribution] = useState<string>('');
  const [potluckLoading, setPotluckLoading] = useState(false);
  const [showPotluckSuccess, setShowPotluckSuccess] = useState(false);
  
  // Get current user's gyld from auth store
  const { userGyld, user } = useAuthStore();

  // Fetch user's gyld type @ field
  React.useEffect(() => {
    const fetchUserGyldType = async () => {
      if (!userGyld) {
        console.log('No userGyld found, skipping gyld type fetch');
        return;
      }
      
      try {
        console.log('Fetching gyld type for userGyld:', userGyld);
        
        // First get the gyld record to get the gyld_type ID
        const { data: gyldData, error: gyldError } = await supabase
          .from('gyld')
          .select('*')
          .eq('id', userGyld)
          .single();

        if (gyldError) {
          console.error('Error fetching gyld:', gyldError);
          return;
        }

        console.log('Gyld data:', gyldData);

        if (!gyldData?.gyld_type || gyldData.gyld_type.length === 0) {
          console.log('No gyld_type found in gyld data, using fallback');
          // Fallback: try to derive from gyld name or use default
          const gyldName = gyldData.name?.toLowerCase() || '';
          let fallbackSymbol = '';
          
          if (gyldName.includes('product')) {
            fallbackSymbol = 'product management';
          } else if (gyldName.includes('engineering') || gyldName.includes('tech')) {
            fallbackSymbol = 'engineering';
          } else if (gyldName.includes('design')) {
            fallbackSymbol = 'design';
          } else if (gyldName.includes('marketing')) {
            fallbackSymbol = 'marketing';
          } else {
            fallbackSymbol = 'mentoring'; // Default fallback
          }
          
          console.log('Using fallback gyld type symbol:', fallbackSymbol);
          setUserGyldTypeSymbol(fallbackSymbol);
          return;
        }

        // Get the first gyld_type from the array
        const firstGyldTypeId = gyldData.gyld_type[0];
        console.log('Using first gyld_type ID:', firstGyldTypeId);

        // Then get the gyld_type record to get the @ field
        const { data: gyldTypeData, error: gyldTypeError } = await supabase
          .from('gyld_type')
          .select('"@"')
          .eq('id', firstGyldTypeId)
          .single();

        if (gyldTypeError) {
          console.error('Error fetching gyld type:', gyldTypeError);
          // Fallback if gyld_type lookup fails
          setUserGyldTypeSymbol('mentoring');
          return;
        }

        console.log('Gyld type data:', gyldTypeData);

        // Extract the @ field from the gyld_type and make it lowercase
        const gyldTypeSymbol = (gyldTypeData?.['@'] || 'mentoring').toLowerCase();
        console.log('Setting gyld type symbol:', gyldTypeSymbol);
        setUserGyldTypeSymbol(gyldTypeSymbol);
      } catch (err) {
        console.error('Error in fetchUserGyldType:', err);
      }
    };

    fetchUserGyldType();
  }, [userGyld]);
  
  // Use content template for mentoring how it works
  const { 
    contentTemplate: mentoringHowItWorksTemplate,
    loading: templateLoading,
    error: templateError
  } = useContentTemplate(
    'mentoring_how_it_works',
    'display',
    {
      'gyld_type_@': userGyldTypeSymbol || 'mentoring'
    }
  );

  // Use content template for scribe role (no dynamic variables)
  const { 
    contentTemplate: scribeRoleTemplate,
    loading: scribeTemplateLoading,
    error: scribeTemplateError
  } = useContentTemplate('mentoring_scribe_role', 'display', {});

  // Fetch potluck data when gathering detail is available
  React.useEffect(() => {
    if (gatheringDetail?.gathering?.id && gatheringDetail?.gatheringOther?.potluck) {
      fetchPotluckData();
    }
  }, [gatheringDetail?.gathering?.id, gatheringDetail?.gatheringOther?.potluck]);

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

  // Check if current user is a scribe
  const isCurrentUserScribe = () => {
    if (!user?.id || !gatheringDetail?.gatheringDisplay?.scribe) return false;
    return gatheringDetail.gatheringDisplay.scribe.includes(user.id);
  };

  // Get first name from full name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // Get host message for RSVP confirmation
  const getHostMessage = () => {
    if (gatheringDetail?.hostNames && gatheringDetail.hostNames.length > 0) {
      const firstName = getFirstName(gatheringDetail.hostNames[0]);
      return `If your plans change, ${firstName} would appreciate if you'd remember to change your RSVP.`;
    }
    return "If your plans change, we'd appreciate if you'd remember to change your RSVP.";
  };

  // Fetch potluck data for this gathering
  const fetchPotluckData = async () => {
    if (!gatheringDetail?.gathering?.id) return;
    
    try {
      // Get potluck records for this gathering
      const { data: potluckRecords, error: potluckError } = await supabase
        .from('potluck')
        .select('id, user_id, contribution')
        .eq('gathering_id', gatheringDetail.gathering.id);

      if (potluckError) {
        console.error('Error fetching potluck data:', potluckError);
        return;
      }

      if (!potluckRecords || potluckRecords.length === 0) {
        setPotluckData([]);
        return;
      }

      // Get user names for all contributors
      const userIds = potluckRecords.map(record => record.user_id);
      const { data: userProfiles, error: profileError } = await supabase
        .from('users_public')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching user profiles for potluck:', profileError);
        return;
      }

      // Combine potluck data with user names
      const potluckWithNames = potluckRecords.map(record => {
        const userProfile = userProfiles?.find(profile => profile.user_id === record.user_id);
        return {
          id: record.id,
          user_name: userProfile?.full_name || 'Anonymous',
          contribution: record.contribution || ''
        };
      });

      setPotluckData(potluckWithNames);
    } catch (error) {
      console.error('Error in fetchPotluckData:', error);
    }
  };

  // Handle potluck contribution submission
  const handlePotluckSubmit = async () => {
    if (!user?.id || !gatheringDetail?.gathering?.id || !potluckContribution.trim()) {
      return;
    }

    setPotluckLoading(true);

    try {
      // Check if user already has a potluck entry for this gathering
      const { data: existingRecord, error: checkError } = await supabase
        .from('potluck')
        .select('id')
        .eq('user_id', user.id)
        .eq('gathering_id', gatheringDetail.gathering.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing potluck record:', checkError);
        throw checkError;
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('potluck')
          .update({ contribution: potluckContribution.trim() })
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('Error updating potluck record:', updateError);
          throw updateError;
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('potluck')
          .insert({
            user_id: user.id,
            gathering_id: gatheringDetail.gathering.id,
            contribution: potluckContribution.trim()
          });

        if (insertError) {
          console.error('Error creating potluck record:', insertError);
          throw insertError;
        }
      }

      // Show success feedback
      setShowPotluckSuccess(true);
      setTimeout(() => {
        setShowPotluckSuccess(false);
        setShowPotluckModal(false);
        setPotluckContribution('');
      }, 1500);

      // Refresh potluck data
      await fetchPotluckData();

    } catch (error) {
      console.error('Error in handlePotluckSubmit:', error);
    } finally {
      setPotluckLoading(false);
    }
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

  // Get data for display
  const { date, time } = formatDateTime(gatheringDetail.gathering.start_time, gatheringDetail.gathering.end_time);
  const location = getLocationInfo();
  const howItWorks = getHowItWorks();

  return (
    <View style={styles.container}>
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
                  name="school" 
                  size={24} 
                  style={[
                    styles.infoIcon,
                    { color: '#000000' }
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

          {/* Scribe Role Section - only show if current user is a scribe */}
          {isCurrentUserScribe() && (
            <View style={styles.scribeRoleSection}>
              <Text style={styles.sectionTitleWithSpacing}>Your Role: Salon Scribe</Text>
              
              {/* Display content template or loading/error state */}
              {scribeTemplateLoading ? (
                <Text style={styles.scribeRoleDescription}>Loading...</Text>
              ) : scribeTemplateError ? (
                <Text style={styles.scribeRoleDescription}>
                  As scribe, you're the steward of knowledge created in the salon. You'll record the most important insights that come out of the overall discussion.
                </Text>
              ) : scribeRoleTemplate ? (
                <ContentTemplateDisplay 
                  contentTemplate={scribeRoleTemplate}
                  primaryTextStyle={styles.scribeRoleDescription}
                  showSecondaryText={false}
                  showTertiaryText={false}
                />
              ) : (
                <Text style={styles.scribeRoleDescription}>
                  As scribe, you're the steward of knowledge created in the salon. You'll record the most important insights that come out of the overall discussion.
                </Text>
              )}
              
              <TouchableOpacity 
                style={styles.learnMoreButton}
                onPress={() => setShowScribeRoleModal(true)}
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
              
              {/* Display content template or loading/error state */}
              {templateLoading ? (
                <Text style={styles.howItWorksDescription}>Loading...</Text>
              ) : templateError ? (
                <Text style={styles.howItWorksDescription}>
                  Join us for an engaging mentoring experience focused on practical insights and career growth. 
                  Connect with industry experts and expand your professional network in a supportive environment.
                </Text>
              ) : mentoringHowItWorksTemplate ? (
                <ContentTemplateDisplay 
                  contentTemplate={mentoringHowItWorksTemplate}
                  primaryTextStyle={styles.howItWorksDescription}
                  showSecondaryText={false}
                  showTertiaryText={false}
                />
              ) : (
                <Text style={styles.howItWorksDescription}>
                  Join us for an engaging mentoring experience focused on practical insights and career growth. 
                  Connect with industry experts and expand your professional network in a supportive environment.
                </Text>
              )}
              
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

          {/* Payment Information - only show if payment_for and payment_amount exist */}
          {gatheringDetail.gatheringOther?.payment_for && gatheringDetail.gatheringOther?.payment_amount && (
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitleWithSpacing}>Payment</Text>
              
              <Text style={styles.paymentText}>
                ${gatheringDetail.gatheringOther.payment_amount} for {gatheringDetail.gatheringOther.payment_for.toLowerCase()}{gatheringDetail.gatheringOther.payment_venmo ? `. Please Venmo: ${gatheringDetail.gatheringOther.payment_venmo}` : ''}
              </Text>
            </View>
          )}

          {/* Potluck Section - only show if gathering is a potluck */}
          {gatheringDetail.gatheringOther?.potluck && (
            <View style={styles.potluckSection}>
              <Text style={styles.sectionTitleWithSpacing}>Potluck</Text>
              
              {/* List of contributions */}
              {potluckData.length > 0 && (
                <View style={styles.potluckList}>
                  {potluckData.map((item) => (
                    <View key={item.id} style={styles.potluckItem}>
                      <Text style={styles.potluckContributorName}>{item.user_name}</Text>
                      <Text style={styles.potluckContribution}>{item.contribution}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Bring Something link */}
              <TouchableOpacity 
                style={styles.learnMoreButton}
                onPress={() => setShowPotluckModal(true)}
              >
                <Text style={styles.learnMoreText}>Bring Something</Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: spacing.lg + insets.bottom }]}>
        {previewMode ? (
          /* Preview Mode - Show non-interactive message */
          <View style={styles.previewModeContainer}>
            <Text style={styles.previewModeText}>Preview Mode - RSVP not available</Text>
          </View>
        ) : (
          <>
            {/* State 1: No RSVP (pending) - Show Yes/No buttons */}
            {rsvpStatus === 'pending' && (
              <View style={styles.rsvpContainer}>
                <Text style={styles.rsvpLabel}>RSVP:</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.rsvpNoButton}
                    onPress={() => updateRSVP('no')}
                  >
                    <Text style={styles.rsvpNoButtonText}>Regrets</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.rsvpYesButton}
                    onPress={() => {
                      updateRSVP('yes');
                      setShowRSVPConfirmation(true);
                    }}
                  >
                    <Text style={styles.rsvpYesButtonText}>Attend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* State 2: RSVP Yes - Show green "RSVP: Yes" button */}
            {rsvpStatus === 'yes' && (
              <TouchableOpacity 
                style={styles.rsvpConfirmedYesButton}
                onPress={() => updateRSVP('no')}
              >
                <Text style={styles.rsvpConfirmedYesButtonText}>RSVP: Yes</Text>
              </TouchableOpacity>
            )}

            {/* State 3: RSVP No - Show maroon "RSVP: No" button */}
            {rsvpStatus === 'no' && (
              <TouchableOpacity 
                style={styles.rsvpConfirmedNoButton}
                onPress={() => updateRSVP('yes')}
              >
                <Text style={styles.rsvpConfirmedNoButtonText}>RSVP: No</Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
            {/* Display content template secondary text or fallback */}
            {mentoringHowItWorksTemplate && mentoringHowItWorksTemplate.processed_secondary_text ? (
              <ContentTemplateDisplay 
                contentTemplate={mentoringHowItWorksTemplate}
                secondaryTextStyle={styles.modalText}
                showPrimaryText={false}
                showSecondaryText={true}
                showTertiaryText={false}
              />
            ) : (
              /* Fallback to original hardcoded steps */
              getHowItWorks().map((step, index) => (
                <View key={index} style={styles.modalStep}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.modalStepContent}>
                    <Text style={styles.modalStepTitle}>{step.title}</Text>
                    <Text style={styles.modalStepDescription}>{step.description}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Scribe Role Modal */}
      <Modal
        visible={showScribeRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScribeRoleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mentoring Scribe Role</Text>
            <TouchableOpacity 
              onPress={() => setShowScribeRoleModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {/* Display content template secondary text or fallback */}
            {scribeRoleTemplate && scribeRoleTemplate.processed_secondary_text ? (
              <ContentTemplateDisplay 
                contentTemplate={scribeRoleTemplate}
                secondaryTextStyle={styles.modalText}
                showPrimaryText={false}
                showSecondaryText={true}
                showTertiaryText={false}
              />
            ) : (
              <Text style={styles.modalText}>
                Scribes take knowledge generated from the salon and make it part of their gyld's broader knowledge base. They also recognize members who make valuable contributions to the discussion.
              </Text>
            )}
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

      {/* RSVP Confirmation Modal */}
      <Modal
        visible={showRSVPConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRSVPConfirmation(false)}
      >
        <TouchableOpacity 
          style={styles.rsvpModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowRSVPConfirmation(false)}
        >
          <View style={styles.rsvpConfirmationContainer}>
            <Text style={styles.rsvpConfirmationTitle}>✓ You're Going</Text>
            <Text style={styles.rsvpConfirmationMessage}>
              {getHostMessage()}
            </Text>
            
            <TouchableOpacity 
              style={styles.rsvpConfirmButton}
              onPress={() => setShowRSVPConfirmation(false)}
            >
              <Text style={styles.rsvpConfirmButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Potluck Contribution Modal */}
      <Modal
        visible={showPotluckModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPotluckModal(false)}
      >
        <View style={styles.potluckModalOverlay}>
          <View style={styles.potluckModalContainer}>
            {!showPotluckSuccess ? (
              <>
                <Text style={styles.potluckModalTitle}>What You'll Bring</Text>
                
                <TextInput
                  mode="outlined"
                  value={potluckContribution}
                  onChangeText={setPotluckContribution}
                  placeholder="e.g., Caesar salad, chocolate chip cookies"
                  style={styles.potluckInput}
                  multiline={true}
                  disabled={potluckLoading}
                />
                
                <View style={styles.potluckModalButtons}>
                  <TouchableOpacity 
                    style={styles.potluckCancelButton}
                    onPress={() => {
                      setShowPotluckModal(false);
                      setPotluckContribution('');
                    }}
                    disabled={potluckLoading}
                  >
                    <Text style={styles.potluckCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.potluckSubmitButton,
                      (!potluckContribution.trim() || potluckLoading) && styles.potluckSubmitButtonDisabled
                    ]}
                    onPress={handlePotluckSubmit}
                    disabled={!potluckContribution.trim() || potluckLoading}
                  >
                    <Text style={styles.potluckSubmitButtonText}>
                      {potluckLoading ? 'Adding...' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.potluckSuccessContainer}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={64} 
                  color={colors.status.success} 
                />
                <Text style={styles.potluckSuccessText}>Added to potluck!</Text>
              </View>
            )}
          </View>
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
    flex: 1,
  },
  rsvpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rsvpLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    minWidth: 50,
  },
  rsvpYesButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpYesButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  rsvpNoButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpNoButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  
  // State 2: RSVP Yes confirmed (light green)
  rsvpConfirmedYesButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpConfirmedYesButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
  },
  
  // State 3: RSVP No confirmed (light maroon)
  rsvpConfirmedNoButton: {
    backgroundColor: 'rgba(165, 42, 42, 0.1)',
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpConfirmedNoButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#A52A2A',
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
  
  // Scribe Role Section
  scribeRoleSection: {
    // Removed marginBottom to prevent compound spacing
  },
  scribeRoleDescription: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.md,
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
  
  // Payment Section
  paymentSection: {
    // Removed marginBottom to prevent compound spacing
  },
  paymentText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
  },
  
  // Potluck Section
  potluckSection: {
    // Removed marginBottom to prevent compound spacing
  },
  potluckList: {
    marginBottom: spacing.md,
  },
  potluckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  potluckContributorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  potluckContribution: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    flex: 2,
  },
  potluckEmptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
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
  
  // RSVP Confirmation Modal Styles
  rsvpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rsvpConfirmationContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.lg,
    width: 320,
    height: 240,
    elevation: 8,
    justifyContent: 'space-between',
  },
  rsvpConfirmationTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  rsvpConfirmationMessage: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  rsvpConfirmButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  rsvpConfirmButtonText: {
    color: colors.status.success,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  
  // Potluck Contribution Modal Styles
  potluckModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  potluckModalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  potluckModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  potluckInput: {
    marginBottom: spacing.lg,
    // Let React Native Paper theme handle the styling
    // The theme will automatically use the brand color for focused state
  },
  potluckModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  potluckCancelButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  potluckCancelButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  potluckSubmitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  potluckSubmitButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  potluckSubmitButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  potluckSuccessContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  potluckSuccessText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
    marginTop: spacing.md,
  },
  previewModeContainer: {
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewModeText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
}); 