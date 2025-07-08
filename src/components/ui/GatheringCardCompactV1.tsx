import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
}

interface GatheringCardCompactV1Props {
  gathering: Gathering;
  onPress: () => void;
}

export default function GatheringCardCompactV1({ gathering, onPress }: GatheringCardCompactV1Props) {
  // Format date for display - caps without day
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Get RSVP display
  const getRSVPDisplay = () => {
    switch (gathering.rsvp_status) {
      case 'yes':
        return { text: 'RSVP: Yes', color: theme.colors.status.success, bgColor: 'rgba(76, 175, 80, 0.1)' };
      case 'no':
        return { text: 'RSVP: No', color: '#A52A2A', bgColor: 'rgba(165, 42, 42, 0.1)' }; // More maroon than red
      default:
        return { text: 'RSVP: ?', color: theme.colors.text.tertiary, bgColor: 'rgba(153, 153, 153, 0.1)' };
    }
  };

  const rsvpInfo = getRSVPDisplay();
  const isMentoring = gathering.experience_type.toLowerCase() === 'mentoring';
  // Changed ~ to • for consistency
  const dateAndType = `${formatDate(gathering.start_time)} • ${gathering.experience_type.toUpperCase()}`;

  return (
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
              {/* RSVP with background shading */}
              <View style={[styles.rsvpContainer, { backgroundColor: rsvpInfo.bgColor }]}>
                <Text variant="bodySmall" style={[styles.rsvpText, { color: rsvpInfo.color }]}>
                  {rsvpInfo.text}
                </Text>
              </View>
            </View>

            {/* Line 2: Title */}
            <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
              {gathering.title}
            </Text>

            {/* Line 3: Mentor or host info - same color for both */}
            {isMentoring && gathering.mentor_name ? (
              <Text variant="bodySmall" style={styles.thirdLineText} numberOfLines={1}>
                with {gathering.mentor_name} • {gathering.mentor_company}
              </Text>
            ) : (
              <Text variant="bodySmall" style={styles.thirdLineText} numberOfLines={1}>
                Hosted by {gathering.host_names.join(' & ')}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
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
}); 