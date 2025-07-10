import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Easing,
  ScrollView,
  Image,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout, shadows, theme, typography } from '../../styles';
import { GatheringCardData } from '../../hooks/useHomeGatherings';

interface EventDetailSliderProps {
  gatheringData: GatheringCardData | null;
  isVisible: boolean;
  onClose: () => void;
  onRSVP: (gatheringId: string, status: 'yes' | 'no') => void;
}

interface RepInfo {
  name: string;
  icon: string;
  color: string;
  colorAlpha: string;
}

interface MentoringGatheringData {
  title: string;
  date: string;
  time: string;
  gathering_type: string;
  description: string;
  mentor: {
    image: string;
    name: string;
    title: string;
    employer: string;
    bio: string;
  };
  rep: RepInfo;
  location: {
    address: string;
    detail: string;
  };
  hostNames: string[];
  howItWorks: {
    title: string;
    description: string;
  }[];
  attendees: {
    id: string;
    image: string;
    name: string;
  }[];
}

// Rep configuration with unique colors and icons
const REP_CONFIG: Record<string, RepInfo> = {
  'AI': {
    name: 'AI',
    icon: 'hardware-chip',
    color: '#9333EA',
    colorAlpha: 'rgba(147, 51, 234, 0.15)'
  },
  'Product-Market Fit': {
    name: 'Product-Market Fit',
    icon: 'trending-up',
    color: '#059669',
    colorAlpha: 'rgba(5, 150, 105, 0.15)'
  },
  'Growth': {
    name: 'Growth',
    icon: 'rocket',
    color: '#DC2626',
    colorAlpha: 'rgba(220, 38, 38, 0.15)'
  },
  'Product Craft': {
    name: 'Product Craft',
    icon: 'construct',
    color: '#EA580C',
    colorAlpha: 'rgba(234, 88, 12, 0.15)'
  },
  'Leadership': {
    name: 'Leadership',
    icon: 'people',
    color: '#1D4ED8',
    colorAlpha: 'rgba(29, 78, 216, 0.15)'
  },
  'Fundraising': {
    name: 'Fundraising',
    icon: 'card',
    color: '#7C2D12',
    colorAlpha: 'rgba(124, 45, 18, 0.15)'
  }
};

const EventDetailSlider: React.FC<EventDetailSliderProps> = ({
  gatheringData,
  isVisible,
  onClose,
  onRSVP,
}) => {
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  // Calculate 85% of the available height (excluding status bar)
  const availableHeight = SCREEN_HEIGHT - insets.top;
  const SLIDER_HEIGHT = availableHeight * 0.85;
  
  const translateY = useRef(new Animated.Value(SLIDER_HEIGHT)).current;
  
  // State for expandable sections
  const [showMentorBio, setShowMentorBio] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.animation.slider.show,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SLIDER_HEIGHT,
        duration: theme.animation.slider.hide,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > SLIDER_HEIGHT * 0.3 || gestureState.vy > 0.5) {
        onClose();
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: theme.animation.normal,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (!gatheringData) return null;

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

  const getLocationInfo = () => {
    if (gatheringData.gatheringOther.remote) {
      return {
        type: 'remote',
        icon: 'videocam' as const,
        text: 'Virtual Event',
        subtext: gatheringData.gatheringDisplay.meeting_link ? 'Meeting link provided' : 'Details will be shared'
      };
    }
    
    if (gatheringData.gatheringOther.location_tbd) {
      return {
        type: 'tbd',
        icon: 'location' as const,
        text: 'Location TBD',
        subtext: 'Details will be shared soon'
      };
    }
    
    return {
      type: 'physical',
      icon: 'location' as const,
      text: gatheringData.gatheringDisplay.address || 'Location provided after RSVP',
      subtext: gatheringData.gatheringDisplay.location_instructions || null
    };
  };

  const { date, time } = formatDateTime(
    gatheringData.gathering.start_time, 
    gatheringData.gathering.end_time
  );
  const location = getLocationInfo();
  
  // Helper function to get Rep info
  const getRepInfo = (repName?: string): RepInfo => {
    // For now, we'll use the learning_topic as the rep name
    const repKey = repName || gatheringData.gatheringDisplay.learning_topic || 'Leadership';
    return REP_CONFIG[repKey] || REP_CONFIG['Leadership'];
  };
  
  // Helper function to create mock attendees data
  const getMockAttendees = () => {
    return [
      { id: '1', image: 'https://i.pravatar.cc/150?img=1', name: 'Sarah Chen' },
      { id: '2', image: 'https://i.pravatar.cc/150?img=2', name: 'Mike Johnson' },
      { id: '3', image: 'https://i.pravatar.cc/150?img=3', name: 'Emma Wilson' },
      { id: '4', image: 'https://i.pravatar.cc/150?img=4', name: 'David Lee' },
      { id: '5', image: 'https://i.pravatar.cc/150?img=5', name: 'Lisa Zhang' },
    ];
  };
  
  // Helper function to create mock "How it works" data
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
  
  const repInfo = getRepInfo();
  const attendees = getMockAttendees();
  const howItWorks = getHowItWorks();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: SLIDER_HEIGHT,
      backgroundColor: colors.background.secondary,
      borderTopLeftRadius: layout.components.slider.borderRadius,
      borderTopRightRadius: layout.components.slider.borderRadius,
      ...shadows.xl,
    },
    dragBar: {
      height: layout.components.slider.headerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderTopLeftRadius: layout.components.slider.borderRadius,
      borderTopRightRadius: layout.components.slider.borderRadius,
    },
    dragBarIndicator: {
      width: layout.components.slider.dragBarWidth,
      height: layout.components.slider.dragBarHeight,
      backgroundColor: colors.border.medium,
      borderRadius: spacing.xs / 2,
    },
    
    // Hero Section
    heroSection: {
      height: 200,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      borderTopLeftRadius: layout.components.slider.borderRadius,
      borderTopRightRadius: layout.components.slider.borderRadius,
    },
    heroOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      padding: spacing.lg,
      borderTopLeftRadius: layout.components.slider.borderRadius,
      borderTopRightRadius: layout.components.slider.borderRadius,
    },
    heroTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text.inverse,
      marginBottom: spacing.xs,
    },
    heroType: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text.inverse,
      opacity: 0.9,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: 120, // Space for action buttons
    },
    
    // Essential Info Block
    essentialInfo: {
      backgroundColor: colors.background.tertiary,
      borderRadius: spacing.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
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
      color: colors.primary,
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
    hostCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.tertiary,
      borderRadius: spacing.md,
      padding: spacing.lg,
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
      marginBottom: spacing.lg,
    },
    description: {
      fontSize: typography.sizes.md,
      color: colors.text.primary,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    learningTopic: {
      backgroundColor: colors.primaryAlpha,
      borderRadius: spacing.md,
      padding: spacing.md,
    },
    learningTopicLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.primary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    learningTopicText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
      color: colors.text.primary,
    },
    
    // Social Context
    socialSection: {
      marginBottom: spacing.lg,
    },
    rsvpStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.tertiary,
      borderRadius: spacing.md,
      padding: spacing.lg,
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
      paddingBottom: spacing.lg + insets.bottom,
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
    closeButton: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    
    // Rep Section
    repSection: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: repInfo.colorAlpha,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: repInfo.color + '20',
    },
    repIcon: {
      width: 32,
      height: 32,
      marginRight: spacing.md,
      color: repInfo.color,
    },
    repTextContainer: {
      flex: 1,
    },
    repLabel: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      color: repInfo.color,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    repName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    repBadge: {
      backgroundColor: repInfo.color,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.xs,
      alignSelf: 'flex-start',
    },
    repBadgeText: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
      color: colors.text.inverse,
    },
    
    // Mentor Bio Section
    mentorBioSection: {
      marginTop: spacing.md,
    },
    mentorBioButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    mentorBioButtonText: {
      fontSize: typography.sizes.sm,
      color: colors.primary,
      marginRight: spacing.xs,
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
      marginBottom: spacing.lg,
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
      marginBottom: spacing.lg,
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
  });

  // Get Attend button state
  const getAttendButtonProps = () => {
    const { rsvpStatus } = gatheringData.userRole;
    
    switch (rsvpStatus) {
      case 'yes':
        return {
          text: 'You\'re Attending!',
          style: styles.rsvpYesButton,
          onPress: () => onRSVP(gatheringData.gathering.id, 'no'),
        };
      case 'no':
        return {
          text: 'Attend',
          style: styles.rsvpButton,
          onPress: () => onRSVP(gatheringData.gathering.id, 'yes'),
        };
      default:
        return {
          text: 'Attend',
          style: styles.rsvpButton,
          onPress: () => onRSVP(gatheringData.gathering.id, 'yes'),
        };
    }
  };

  const attendButtonProps = getAttendButtonProps();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Drag Bar */}
      <View style={styles.dragBar} {...panResponder.panHandlers}>
        <TouchableOpacity onPress={onClose} style={styles.dragBar}>
          <View style={styles.dragBarIndicator} />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={require('../../../assets/mentoring-session-hero.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>
            {gatheringData.gathering.title || 'Mentoring Session'}
          </Text>
          <Text style={styles.heroType}>
            {gatheringData.experienceTypeLabel || 'MENTORING'}
          </Text>
        </View>
        
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={18} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          
          {/* Rep Section - Prominent top placement */}
          <View style={styles.repSection}>
            <Ionicons name={repInfo.icon} size={32} style={styles.repIcon} />
            <View style={styles.repTextContainer}>
              <Text style={styles.repLabel}>Rep Focus</Text>
              <Text style={styles.repName}>{repInfo.name}</Text>
            </View>
            <View style={styles.repBadge}>
              <Text style={styles.repBadgeText}>REP</Text>
            </View>
          </View>

          {/* Essential Info Block */}
          <View style={styles.essentialInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={24} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>{date}</Text>
                <Text style={styles.infoSubtext}>{time}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name={location.icon} size={24} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>{location.text}</Text>
                {location.subtext && (
                  <Text style={styles.infoSubtext}>{location.subtext}</Text>
                )}
                <Text style={styles.locationDetail}>
                  Check in at the registration desk and go to the 25th floor
                </Text>
              </View>
            </View>
            
            {gatheringData.gatheringOther.cap && (
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Ionicons name="people" size={24} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoText}>
                    Capacity: {gatheringData.gatheringOther.cap} people
                  </Text>
                  <Text style={styles.infoSubtext}>Limited spaces available</Text>
                </View>
              </View>
            )}
          </View>

          {/* Mentor Spotlight */}
          {(gatheringData.hostNames.length > 0 || gatheringData.mentorInfo) && (
            <View style={styles.hostSection}>
              <Text style={styles.sectionTitle}>Your Mentor</Text>
              
              <View style={styles.hostCard}>
                {gatheringData.mentorInfo?.mentor_satellite?.profpic ? (
                  <Image 
                    source={{ uri: gatheringData.mentorInfo.mentor_satellite.profpic }}
                    style={styles.hostAvatar}
                  />
                ) : (
                  <View style={styles.hostAvatar}>
                    <Ionicons 
                      name="person" 
                      size={24} 
                      color={colors.text.tertiary}
                      style={{ alignSelf: 'center', marginTop: 13 }}
                    />
                  </View>
                )}
                
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>
                    {gatheringData.mentorInfo?.mentor_satellite?.full_name || 
                     gatheringData.hostNames[0] || 'Mentor Name'}
                  </Text>
                  
                  <Text style={styles.hostTitle}>
                    {gatheringData.mentorInfo?.mentor_satellite?.title || 'Senior Product Manager'}
                  </Text>
                  
                  <Text style={styles.hostCompany}>
                    {gatheringData.mentorInfo?.employer_info?.name || 'Technology Company'}
                  </Text>
                  
                  <View style={styles.trustBadge}>
                    <Text style={styles.trustBadgeText}>Verified Mentor</Text>
                  </View>
                </View>
              </View>
              
              {/* Mentor Bio Section */}
              <View style={styles.mentorBioSection}>
                <TouchableOpacity 
                  style={styles.mentorBioButton}
                  onPress={() => setShowMentorBio(!showMentorBio)}
                >
                  <Text style={styles.mentorBioButtonText}>
                    {showMentorBio ? 'Hide' : 'Read'} Mentor Bio
                  </Text>
                  <Ionicons 
                    name={showMentorBio ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
                
                {showMentorBio && (
                  <View style={styles.mentorBioExpanded}>
                    <Text style={styles.mentorBioText}>
                      With over 10 years of experience in product management and leadership, 
                      our mentor has successfully launched products that have reached millions of users. 
                      They specialize in product-market fit, growth strategies, and building high-performing teams. 
                      Previously at top tech companies, they're passionate about sharing insights and helping 
                      the next generation of product professionals.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* About this mentoring session */}
          <View style={styles.valueSection}>
            <Text style={styles.sectionTitle}>About this mentoring session</Text>
            
            <Text style={styles.description}>
              {gatheringData.gatheringDisplay.description || 
              'Join us for an engaging mentoring experience focused on practical insights and career growth. Connect with industry experts and expand your professional network in a supportive environment.'}
            </Text>
          </View>

          {/* Attendees Section */}
          <View style={styles.attendeesSection}>
            <Text style={styles.sectionTitle}>Who's attending ({attendees.length + 5})</Text>
            
            <View style={styles.attendeesGrid}>
              {attendees.slice(0, 5).map((attendee) => (
                <View key={attendee.id} style={styles.attendeeItem}>
                  <Image 
                    source={{ uri: attendee.image }}
                    style={styles.attendeeAvatar}
                  />
                  <Text style={styles.attendeeName}>{attendee.name}</Text>
                </View>
              ))}
              
              <View style={styles.attendeeItem}>
                <View style={styles.attendeeMore}>
                  <Text style={styles.attendeeMoreText}>+5</Text>
                </View>
                <Text style={styles.attendeeName}>more</Text>
              </View>
            </View>
          </View>

          {/* How It Works Section */}
          <View style={styles.howItWorksSection}>
            <TouchableOpacity 
              style={styles.howItWorksButton}
              onPress={() => setShowHowItWorks(!showHowItWorks)}
            >
              <Text style={styles.howItWorksButtonText}>How mentoring sessions work</Text>
              <Ionicons 
                name={showHowItWorks ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>
            
            {showHowItWorks && (
              <View style={styles.howItWorksExpanded}>
                {howItWorks.map((step, index) => (
                  <View key={index} style={styles.howItWorksStep}>
                    <View style={styles.howItWorksStepNumber}>
                      <Text style={styles.howItWorksStepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.howItWorksStepContent}>
                      <Text style={styles.howItWorksStepTitle}>{step.title}</Text>
                      <Text style={styles.howItWorksStepDescription}>{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Host Information */}
          {gatheringData.hostNames.length > 0 && (
            <View style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Session Host</Text>
              
              <View style={styles.rsvpStatus}>
                <Ionicons name="person-circle" size={24} style={styles.rsvpIcon} />
                <View>
                  <Text style={styles.rsvpText}>
                    Hosted by {gatheringData.hostNames.join(', ')}
                  </Text>
                  <Text style={styles.capacity}>
                    Gyld team member facilitating the session
                  </Text>
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => {/* Share functionality */}}
          >
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.rsvpButton, attendButtonProps.style]}
            onPress={attendButtonProps.onPress}
          >
            <Text style={styles.rsvpButtonText}>
              {attendButtonProps.text}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default EventDetailSlider; 