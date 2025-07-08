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

interface GatheringCardSquareProps {
  gathering: Gathering;
  onPress: () => void;
  useSquareImage?: boolean;
}

export default function GatheringCardSquare({ gathering, onPress, useSquareImage = false }: GatheringCardSquareProps) {
  // Format date for display - caps without day
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Get RSVP display with maroon color for "no"
  const getRSVPDisplay = () => {
    switch (gathering.rsvp_status) {
      case 'yes':
        return { text: 'Yes', color: theme.colors.status.success, bgColor: 'rgba(76, 175, 80, 0.1)' };
      case 'no':
        return { text: 'No', color: '#A52A2A', bgColor: 'rgba(165, 42, 42, 0.1)' };
      default:
        return { text: '?', color: theme.colors.text.tertiary, bgColor: 'rgba(153, 153, 153, 0.1)' };
    }
  };

  const rsvpInfo = getRSVPDisplay();
  const isMentoring = gathering.experience_type.toLowerCase() === 'mentoring';
  const dateAndType = `${formatDate(gathering.start_time)} • ${gathering.experience_type.toUpperCase()}`;

  // Use square image for mentoring examples
  const imageSource = useSquareImage 
    ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
    : gathering.image;

  return (
    <Card style={styles.card} mode="elevated">
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {/* Top image */}
        <Image 
          source={{ uri: imageSource }} 
          style={useSquareImage ? styles.squareImage : styles.rectangularImage}
          resizeMode="cover"
        />
        
        {/* Content section with same structure as vertical cards */}
        <View style={styles.content}>
          {/* Header row: Date & Type | RSVP Status */}
          <View style={styles.headerRow}>
            <Text style={styles.dateTypeText} numberOfLines={1}>
              {dateAndType}
            </Text>
            <View style={[styles.rsvpContainer, { backgroundColor: rsvpInfo.bgColor }]}>
              <Text style={[styles.rsvpText, { color: rsvpInfo.color }]}>
                {rsvpInfo.text}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {gathering.title}
          </Text>

          {/* Mentor or host info */}
          {isMentoring && gathering.mentor_name ? (
            <Text style={styles.thirdLineText} numberOfLines={2}>
              with {gathering.mentor_name} • {gathering.mentor_company}
            </Text>
          ) : (
            <Text style={styles.thirdLineText} numberOfLines={2}>
              Hosted by {gathering.host_names.join(' & ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 240,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    elevation: 2,
    borderRadius: 8,
  },
  rectangularImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  squareImage: {
    width: '100%',
    height: 90,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  content: {
    padding: theme.spacing.md,
    height: 140, // Fixed height for content area
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  dateTypeText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.3,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  rsvpContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rsvpText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    marginVertical: theme.spacing.sm,
  },
  thirdLineText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
}); 