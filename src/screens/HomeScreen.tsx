import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { theme } from '../styles/theme';
import { 
  GatheringCardCompactV1, 
  GatheringCardSquare 
} from '../components/ui';
import { useAuthStore } from '../stores';

// Sample gathering data with RSVP status
const sampleGatherings = [
  {
    id: '1',
    title: '1:1 Product Mentoring Session',
    start_time: '2025-08-08T18:00:00Z',
    end_time: '2025-08-08T19:30:00Z',
    experience_type: 'Mentoring',
    address: 'Remote via Zoom',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    description: 'Join us for personalized 1:1 mentoring focused on advancing your product management career.',
    host_names: ['Alex Chen'],
    mentor_name: 'Alex Chen',
    mentor_company: 'Google',
    participant_count: 0,
    max_participants: 1,
    rsvp_status: 'pending' as const,
  },
  {
    id: '2',
    title: 'Product Professional Happy Hour',
    start_time: '2025-08-22T18:00:00Z',
    end_time: '2025-08-22T20:30:00Z',
    experience_type: 'Happy Hour',
    address: 'The Hub Boston, 25 Court St, Boston, MA 02108',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    description: 'Network with fellow product professionals in a relaxed setting.',
    host_names: ['Alex Chen', 'Jordan Rivera'],
    participant_count: 12,
    max_participants: 25,
    rsvp_status: 'yes' as const,
  },
  {
    id: '3',
    title: 'Product Leaders Supper Club',
    start_time: '2025-09-05T18:00:00Z',
    end_time: '2025-09-05T20:30:00Z',
    experience_type: 'Supper Club',
    address: 'North End Italian Restaurant, 123 Hanover St, Boston, MA 02113',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    description: 'Intimate dinner gathering for senior product leaders to discuss industry trends.',
    host_names: ['Jordan Rivera'],
    participant_count: 12,
    max_participants: 12,
    rsvp_status: 'no' as const,
  },
  {
    id: '4',
    title: 'Advanced Product Mentoring Workshop',
    start_time: '2025-08-15T18:00:00Z',
    end_time: '2025-08-15T19:30:00Z',
    experience_type: 'Mentoring',
    address: 'Remote via Zoom',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    description: 'Deep-dive mentoring workshop covering advanced product management techniques.',
    host_names: ['Jordan Rivera'],
    mentor_name: 'Jordan Rivera',
    mentor_company: 'Anthropic',
    participant_count: 1,
    max_participants: 1,
    rsvp_status: 'yes' as const,
  },
  {
    id: '5',
    title: 'Product Strategy Coworking',
    start_time: '2025-08-29T18:00:00Z',
    end_time: '2025-08-29T20:00:00Z',
    experience_type: 'Coworking',
    address: 'WeWork Boston, 745 Atlantic Ave, Boston, MA 02111',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
    description: 'Collaborative working session where product managers work on strategic initiatives together.',
    host_names: ['Alex Chen'],
    participant_count: 5,
    max_participants: 8,
    rsvp_status: 'pending' as const,
  },
];

export default function HomeScreen() {
  // Get auth store values for debugging
  const { user, userName, userGyld, isOrganizer, isLoading, isInitialized, signOut } = useAuthStore();

  const handleGatheringPress = (gatheringId: string) => {
    console.log('Gathering pressed:', gatheringId);
    // TODO: Navigate to gathering detail screen
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* DEBUG: Auth Store Values */}
      <View style={styles.debugSection}>
        <Text variant="titleMedium" style={styles.debugTitle}>
           DEBUG: Auth Store Values
        </Text>
        <Text style={styles.debugText}>
          Initialized: {isInitialized ? ' Yes' : ' No'}
        </Text>
        <Text style={styles.debugText}>
          Loading: {isLoading ? ' Yes' : ' No'}
        </Text>
        <Text style={styles.debugText}>
          User: {user ? `${user.email || 'No email'} (${user.id})` : ' Not logged in'}
        </Text>
        <Text style={styles.debugText}>
          User Name: {userName || ' No name'}
        </Text>
        <Text style={styles.debugText}>
          User Gyld: {userGyld || ' No gyld'}
        </Text>
        <Text style={styles.debugText}>
          Is Organizer: {isOrganizer ? ' Yes' : ' No'}
        </Text>
        
        {/* Logout Button for Testing */}
        <TouchableOpacity style={styles.debugButton} onPress={signOut}>
          <Text style={styles.debugButtonText}> Logout (Test Auth Flow)</Text>
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>
          Gathering Card Designs
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Refined vertical and horizontal layouts with photo variations
        </Text>
      </View>

      {/* Refined Compact Cards - Vertical List */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          1. Refined Compact Cards (Vertical List)
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Polished design with consistent bullets, unified colors, and enhanced RSVP visibility
        </Text>
        {sampleGatherings.slice(0, 3).map((gathering) => (
          <GatheringCardCompactV1
            key={`v1-${gathering.id}`}
            gathering={gathering}
            onPress={() => handleGatheringPress(gathering.id)}
          />
        ))}
      </View>

      <Divider style={styles.divider} />

      {/* Square Cards - Horizontal Scroll */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          2. Square Cards (Horizontal Scroll)
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Full information in square format - includes example with square photo (mentor profile pic)
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {sampleGatherings.map((gathering, index) => (
            <GatheringCardSquare
              key={`square-${gathering.id}`}
              gathering={gathering}
              onPress={() => handleGatheringPress(gathering.id)}
              useSquareImage={index === 1} // Second card shows square image example
            />
          ))}
        </ScrollView>
        <Text variant="bodySmall" style={styles.photoNote}>
           The second card shows how it looks with a square mentor profile photo
        </Text>
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
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  horizontalScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  photoNote: {
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: theme.spacing.xl,
    backgroundColor: theme.colors.border.light,
  },
  debugSection: {
    backgroundColor: '#fff3cd',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  debugTitle: {
    color: '#8b5000',
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  debugText: {
    color: '#8b5000',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  debugButton: {
    backgroundColor: '#d32f2f',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    height: theme.spacing.xl,
  },
});
