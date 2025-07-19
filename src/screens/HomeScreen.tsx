import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { GatheringCardCompactV1 } from '../components/ui';
import { useHomeGatherings } from '../hooks/useHomeGatherings';
import type { GatheringCardData } from '../hooks/useHomeGatherings';
import { 
  Input, 
  TextArea, 
  MultiSelect, 
  SegmentedInput, 
  ChipSelection, 
  Checkbox, 
  Toggle,
  NativeDateTimePicker,
  PaperDropdown,
  SearchableDropdown,
  EventDateTimePicker 
} from '../components/inputs';
import { ImageUpload } from '../components/ui';

// Constants for expandable list behavior
const INITIAL_VISIBLE_COUNT = 3;

export default function HomeScreen() {
  const navigation = useNavigation();
  const { gatherings, loading, error, refresh, updateRSVP } = useHomeGatherings();
  
  // State for show more/less functionality
  const [isExpanded, setIsExpanded] = useState(false);

  // Refresh data when screen comes into focus (e.g., returning from detail screen)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

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

  // Handle card press navigation based on user role
  const handleGatheringPress = (gatheringData: GatheringCardData) => {
    // Check if user is host of this gathering
    if (gatheringData.userRole.isHost) {
      // Navigate to GatheringManage for hosts
      (navigation as any).navigate('GatheringManage', { gatheringId: gatheringData.gathering.id });
    } else {
      // Navigate to EventDetailScreen for non-hosts
      (navigation as any).navigate('EventDetail', { 
        gatheringData: gatheringData 
      });
    }
  };

  // Handle RSVP button press (for non-hosts and non-scribes)
  const handleRSVPPress = (gatheringId: string, currentStatus: string) => {
    // Find the gathering data
    const gatheringData = gatherings.find(g => g.gathering.id === gatheringId);
    if (!gatheringData) {
      return;
    }
    
    // If user is host or scribe, treat like card press
    if (gatheringData.userRole.isHost || gatheringData.userRole.isScribe) {
      handleGatheringPress(gatheringData);
      return;
    }
    
    // For regular users, handle RSVP logic
    if (currentStatus === 'pending') {
      // Show RSVP options dropdown (existing behavior)
      return;
    }
    
    // Toggle RSVP status
    const newStatus = currentStatus === 'yes' ? 'no' : 'yes';
    updateRSVP(gatheringId, newStatus);
  };

  // Handle RSVP selection from dropdown
  const handleRSVPSelect = (gatheringId: string, status: 'yes' | 'no') => {
    updateRSVP(gatheringId, status);
  };

  // Handle plan gathering navigation
  const handlePlanGathering = () => {
    navigation.navigate('Roles' as never);
  };

  // Transform data for the existing card component
  const transformGatheringData = (cardData: GatheringCardData) => {
    const { gathering, gatheringDisplay, userRole, displayImage, formattedDate, experienceTypeLabel, hostNames, mentorInfo } = cardData;



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
      max_participants: cardData.gatheringOther?.cap || 0,
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
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
                  onPress={() => handleGatheringPress(gatheringData)}
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

        {/* TEMPORARY: Host Screens Testing Section */}
        <View style={styles.tempTestingSection}>
          <Text style={styles.tempTestingTitle}>🚧 TEMP: Host Screens Testing</Text>
          <View style={styles.tempButtonGrid}>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringSetup', { mentoring: true })}
            >
              <Text style={styles.tempButtonText}>Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringManage')}
            >
              <Text style={styles.tempButtonText}>Manage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringPromote')}
            >
              <Text style={styles.tempButtonText}>Promote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringResources')}
            >
              <Text style={styles.tempButtonText}>Resources</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('MentoringCalendar')}
            >
              <Text style={styles.tempButtonText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('MentorFinder')}
            >
              <Text style={styles.tempButtonText}>Find Mentor</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TEMPORARY: Input Components Testing Section */}
        <InputTestingSection />

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

// TEMPORARY: Input Components Testing Section
const InputTestingSection = () => {
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [nativeDateValue, setNativeDateValue] = useState<Date>(new Date());

  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);
  const [segmentedValue, setSegmentedValue] = useState<string>('');
  const [chipSelectionValue, setChipSelectionValue] = useState<string[]>([]);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);

  // Native dropdown state
  const [paperDropdownValue, setPaperDropdownValue] = useState<string>('');
  
  // Searchable dropdown state
  const [searchableDropdownValue, setSearchableDropdownValue] = useState<string>('');

  // Event date time picker state
  const createDefaultStartTime = () => {
    const now = new Date();
    now.setHours(18, 0, 0, 0); // 6 PM today
    return now;
  };
  
  const createDefaultEndTime = () => {
    const start = createDefaultStartTime();
    const end = new Date(start);
    end.setHours(start.getHours() + 1, start.getMinutes() + 30, 0, 0); // Add 1.5 hours
    return end;
  };

  const [eventStartTime, setEventStartTime] = useState<Date>(createDefaultStartTime());
  const [eventEndTime, setEventEndTime] = useState<Date>(createDefaultEndTime());
  const [imageValue, setImageValue] = useState<string | null>(null);

  // Remove these dropdown picker state variables:
  // const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [dropdownItems, setDropdownItems] = useState([...]);

  // Remove the searchableDropdownOptions array:
  // const searchableDropdownOptions = [...];

  const multiSelectOptions = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
    { value: 'item3', label: 'Item 3' },
  ];

  const segmentedOptions = [
    { value: 'opt1', label: 'Opt 1' },
    { value: 'opt2', label: 'Opt 2' },
    { value: 'opt3', label: 'Opt 3' },
  ];

  const chipOptions = [
    { value: 'chip1', label: 'Chip 1' },
    { value: 'chip2', label: 'Chip 2' },
    { value: 'chip3', label: 'Chip 3' },
  ];

  const searchableDropdownOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Lemon', value: 'lemon' },
    { label: 'Mango', value: 'mango' },
    { label: 'Orange', value: 'orange' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Quince', value: 'quince' },
    { label: 'Raspberry', value: 'raspberry' },
    { label: 'Strawberry', value: 'strawberry' },
  ];

  // Remove the entire DropDownPicker section
  //

  return (
    <View style={styles.inputTestingSection}>
      <Text style={styles.inputTestingTitle}>🧪 TEMP: Input Components Testing</Text>
      
      <EventDateTimePicker
        label="Event Date & Time"
        startTime={eventStartTime}
        endTime={eventEndTime}
        onStartTimeChange={setEventStartTime}
        onEndTimeChange={setEventEndTime}
      />
      
      <ImageUpload
        label="Image Upload"
        value={imageValue}
        onValueChange={setImageValue}
        placeholder="Add an image"
      />
      
      <Input
        label="label"
        value={inputValue}
        onValueChange={setInputValue}
        placeholder="Type here..."
      />
      
      <TextArea
        label="Multi Line Input"
        value={textAreaValue}
        onValueChange={setTextAreaValue}
        placeholder="Type your message..."
        maxLength={200}
      />
      
      <MultiSelect
                        label="Multi-Select"
        options={multiSelectOptions}
        selectedValues={multiSelectValue}
        onSelectionChange={setMultiSelectValue}
        title="Multi Select"
      />
      
      <SegmentedInput
        label="Segmented Input"
        value={segmentedValue}
        onValueChange={setSegmentedValue}
        options={segmentedOptions}
      />
      
      <ChipSelection
        label="Chip Selection"
        value={chipSelectionValue}
        onValueChange={setChipSelectionValue}
        options={chipOptions}
        multiSelect={true}
      />
      
      <Checkbox
        label="Checkbox"
        value={checkboxValue}
        onValueChange={setCheckboxValue}
      />
      
      <Toggle
        label="Toggle"
        value={toggleValue}
        onValueChange={setToggleValue}
      />
      
      <NativeDateTimePicker
        label="Native DateTimePicker"
        value={nativeDateValue}
        onValueChange={setNativeDateValue}
        mode="datetime"
        minuteInterval={15}
      />

      <PaperDropdown
        label="Paper Dropdown"
        value={paperDropdownValue}
        onValueChange={setPaperDropdownValue}
        options={multiSelectOptions}
        placeholder="Select an option"
      />

      <SearchableDropdown
                        label="Searchable Dropdown"
        options={searchableDropdownOptions}
        value={searchableDropdownValue}
        onValueChange={setSearchableDropdownValue}
        placeholder="Search fruits..."
      />

      {/* Remove the duplicate EventDateTimePicker from here */}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
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
    color: theme.colors.status.error,
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
  // Temporary testing styles
  tempTestingSection: {
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  tempTestingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  tempButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  tempButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    minWidth: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tempButtonText: {
    color: theme.colors.background.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputTestingSection: {
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  inputTestingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

});
