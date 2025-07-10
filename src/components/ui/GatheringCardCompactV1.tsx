import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface Gathering {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  experience_type: string;
  address: string;
  image: string;
  description: string;
  host_names: string[];
  mentor_name?: string;
  mentor_company?: string;
  participant_count: number;
  max_participants: number;
  rsvp_status?: 'yes' | 'no' | 'pending';
  userRole?: {
    isHost: boolean;
    isScribe: boolean;
    rsvpStatus: 'yes' | 'no' | 'pending';
  };
}

interface GatheringCardCompactV1Props {
  gathering: Gathering;
  onPress: () => void;
  onRSVPPress?: () => void;
  onRSVPSelect?: (status: 'yes' | 'no') => void;
}

export default function GatheringCardCompactV1({ gathering, onPress, onRSVPPress, onRSVPSelect }: GatheringCardCompactV1Props) {
  const [showRSVPDropdown, setShowRSVPDropdown] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Format date for display - caps without day
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Get first name from full name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // Get first host's first name or fallback message
  const getHostMessage = () => {
    if (gathering.host_names && gathering.host_names.length > 0) {
      const firstName = getFirstName(gathering.host_names[0]);
      return `If your plans change, ${firstName} would appreciate if you'd remember to change your RSVP.`;
    }
    return "If your plans change, we'd appreciate if you'd remember to change your RSVP.";
  };

  // Format host names with truncation
  const formatHostNames = (hostNames: string[]) => {
    if (!hostNames || hostNames.length === 0) return 'Unknown Host';
    
    if (hostNames.length === 1) {
      return hostNames[0];
    } else if (hostNames.length === 2) {
      return hostNames.join(' & ');
    } else {
      // For 3+ hosts, show first two and add "..."
      return `${hostNames.slice(0, 2).join(', ')}...`;
    }
  };

  // Get RSVP display with user role handling
  const getRSVPDisplay = () => {
    const userRole = gathering.userRole;
    
    // Check if user is host or scribe
    if (userRole?.isHost) {
      return { text: 'Host', color: theme.colors.status.success, bgColor: 'rgba(76, 175, 80, 0.1)' };
    }
    
    if (userRole?.isScribe) {
      return { text: 'Scribe', color: theme.colors.status.success, bgColor: 'rgba(76, 175, 80, 0.1)' };
    }
    
    // Regular RSVP status
    const rsvpStatus = userRole?.rsvpStatus || gathering.rsvp_status || 'pending';
    switch (rsvpStatus) {
      case 'yes':
        return { text: 'RSVP: Yes', color: theme.colors.status.success, bgColor: 'rgba(76, 175, 80, 0.1)' };
      case 'no':
        return { text: 'RSVP: No', color: '#A52A2A', bgColor: 'rgba(165, 42, 42, 0.1)' };
      default:
        return { text: 'RSVP: ?', color: theme.colors.text.tertiary, bgColor: 'rgba(153, 153, 153, 0.1)' };
    }
  };

  const rsvpInfo = getRSVPDisplay();
  const isMentoring = gathering.experience_type.toLowerCase() === 'mentoring';
  const dateAndType = `${formatDate(gathering.start_time)} • ${gathering.experience_type.toUpperCase()}`;
  const currentRSVPStatus = gathering.userRole?.rsvpStatus || gathering.rsvp_status || 'pending';

  // Handle RSVP button press
  const handleRSVPPress = () => {
    // If status is pending, show dropdown
    if (currentRSVPStatus === 'pending') {
      setShowRSVPDropdown(true);
    } else {
      // For yes/no, use cycling behavior
      if (onRSVPPress) {
        onRSVPPress();
      }
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (status: 'yes' | 'no') => {
    console.log('🎯 Modal: handleDropdownSelect called with:', status);
    
    // Always call RSVP update immediately when button is pressed
    if (onRSVPSelect) {
      onRSVPSelect(status);
    }
    
    if (status === 'yes') {
      // Show confirmation screen for 'yes'
      setShowRSVPDropdown(false);
      setShowConfirmation(true);
    } else {
      // Close modal for 'no'
      setShowRSVPDropdown(false);
    }
  };

  // Handle confirmation close (when thumbs up is pressed)
  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    if (onRSVPSelect) {
      onRSVPSelect('yes'); // Actually update the RSVP to 'yes'
    }
  };

  return (
    <>
      <Card style={styles.card} mode="elevated">
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <View style={styles.container}>
            {/* Left side - Large image with equal margins */}
            <Image 
              source={{ uri: gathering.image }} 
              style={styles.image}
              resizeMode="cover"
            />

            {/* Right side - Content with three evenly spaced lines */}
            <View style={styles.rightSection}>
              {/* Line 1: Date & Type | RSVP Status */}
              <View style={styles.headerRow}>
                <Text variant="bodySmall" style={styles.dateTypeText}>
                  {dateAndType}
                </Text>
                {/* RSVP with background shading - interactive for all users */}
                <TouchableOpacity 
                  onPress={handleRSVPPress}
                  disabled={!onRSVPPress && !onRSVPSelect}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rsvpContainer, { backgroundColor: rsvpInfo.bgColor }]}>
                    <Text variant="bodySmall" style={[styles.rsvpText, { color: rsvpInfo.color }]}>
                      {rsvpInfo.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Line 2: Title */}
              <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                {gathering.title}
              </Text>

              {/* Line 3: Mentor or host info - same color for both */}
              {isMentoring && gathering.mentor_name ? (
                <Text variant="bodySmall" style={styles.thirdLineText} numberOfLines={1}>
                  with {gathering.mentor_name}
                  {gathering.mentor_company && ` • ${gathering.mentor_company}`}
                </Text>
              ) : (
                <Text variant="bodySmall" style={styles.thirdLineText} numberOfLines={1}>
                  Hosted by {formatHostNames(gathering.host_names)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      {/* RSVP Dropdown Modal */}
      <Modal
        visible={showRSVPDropdown || showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowRSVPDropdown(false);
          setShowConfirmation(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => {
            setShowRSVPDropdown(false);
            setShowConfirmation(false);
          }}
        >
          <View style={styles.dropdownContainer}>
            {showRSVPDropdown && (
              <>
                <Text style={styles.dropdownTitle}>{gathering.title}</Text>
                
                <TouchableOpacity 
                  style={[styles.dropdownOption, styles.yesOption]}
                  onPress={() => handleDropdownSelect('yes')}
                >
                  <Text style={styles.yesOptionText}>Yes, I'll attend</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dropdownOption, styles.noOption]}
                  onPress={() => handleDropdownSelect('no')}
                >
                  <Text style={styles.noOptionText}>No, I can't attend</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dropdownOption, styles.cancelOption]}
                  onPress={() => setShowRSVPDropdown(false)}
                >
                  <Text style={styles.cancelOptionText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {showConfirmation && (
              <>
                <Text style={styles.confirmationTitle}>✓ You're Going</Text>
                <Text style={styles.confirmationMessage}>
                  {getHostMessage()}
                </Text>
                
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => {
                    setShowConfirmation(false);
                    setShowRSVPDropdown(false);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    elevation: 2,
  },
  container: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 8,
    marginRight: theme.spacing.lg,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTypeText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  rsvpContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 68,
    alignItems: 'center',
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    lineHeight: 22,
    marginVertical: theme.spacing.xs,
  },
  // Combined style for both mentor and host text - same color
  thirdLineText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    width: 320,
    height: 240,
    elevation: 8,
    justifyContent: 'space-between',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  dropdownOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    marginVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  yesOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  yesOptionText: {
    color: theme.colors.status.success,
    fontWeight: '600',
    fontSize: 16,
  },
  noOption: {
    backgroundColor: 'rgba(165, 42, 42, 0.1)',
  },
  noOptionText: {
    color: '#A52A2A',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelOption: {
    backgroundColor: 'rgba(153, 153, 153, 0.1)',
    marginTop: theme.spacing.sm,
  },
  cancelOptionText: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 16,
  },
  confirmationMessage: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  confirmationSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  confirmButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: theme.colors.status.success,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.status.success,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
}); 