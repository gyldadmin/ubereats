import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import EventDateTimePicker from './EventDateTimePicker';
import { theme } from '../../styles/theme';
import { supabase } from '../../services/supabase';

// Types for the new functionality
interface MonthData {
  month: Date;
  monthLabel: string;
  isAvailable: boolean;
  gatherings?: Array<{
    mentorName: string;
    gatheringDate: string;
  }>;
}

interface DateTimeSliderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    startTime: Date;
    endTime: Date;
  }) => Promise<void>;
  initialData?: {
    startTime?: Date;
    endTime?: Date;
  };
  // New props for mentoring mode
  gatheringDetail?: any;
  gyldGatherings?: any[];
  mentoring?: boolean;
}

export const DateTimeSlider: React.FC<DateTimeSliderProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  gatheringDetail,
  gyldGatherings = [],
  mentoring = false,
}) => {
  // Set default times: start time is 6 PM today, end time is 7:30 PM today
  const getDefaultStartTime = () => {
    const today = new Date();
    today.setHours(18, 0, 0, 0); // 6 PM
    return today;
  };
  
  const defaultStartTime = getDefaultStartTime();
  const defaultEndTime = new Date(defaultStartTime.getTime() + 1.5 * 60 * 60 * 1000);

  const [formData, setFormData] = useState({
    startTime: initialData?.startTime || defaultStartTime,
    endTime: initialData?.endTime || defaultEndTime,
  });

  const [saving, setSaving] = useState(false);

  // New state for mentoring mode
  const [currentView, setCurrentView] = useState<'month' | 'datetime'>('datetime');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [pressedDateIndex, setPressedDateIndex] = useState<string | null>(null);

  // Generate 9 months of data (current month + 8 future months)
  const generateMonthsData = useCallback(async () => {
    if (!mentoring) return;
    
    setLoadingMonths(true);
    const months: MonthData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 9; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthLabel = month.toLocaleDateString('en-US', { month: 'short' }); // Remove .toUpperCase()
      
      // Find existing mentoring gatherings in this month
      const mentoringGatherings = gyldGatherings.filter(gathering => {
        if (gathering.experience_type_label?.toLowerCase() !== 'mentoring') return false;
        if (gathering.gathering_status_label?.toLowerCase() !== 'launched') return false;
        if (gathering.id === gatheringDetail?.gathering?.id) return false; // Exclude current gathering
        
        if (gathering.start_time) {
          const gatheringDate = new Date(gathering.start_time);
          return gatheringDate.getMonth() === month.getMonth() && 
                 gatheringDate.getFullYear() === month.getFullYear();
        }
        return false;
      });

      if (mentoringGatherings.length > 0) {
        // Month is taken - get mentor names and dates for all gatherings
        const gatheringInfos = await Promise.all(
          mentoringGatherings.map(async (gathering) => {
            // Log gathering data for debugging
            console.log('🔍 DateTimeSlider - Processing gathering:', {
              id: gathering.id,
              title: gathering.title,
              gatheringDisplay: gathering.gatheringDisplay,
              mentor: gathering.gatheringDisplay?.mentor
            });
            
            const mentorId = gathering.gatheringDisplay?.mentor?.[0];
            
            let mentorName = 'Unknown Mentor';
            if (mentorId) {
              console.log('🔍 DateTimeSlider - Found mentorId:', mentorId);
              
              try {
                // Look up mentor name from mentor_satellites - using same query as working hooks
                const { data: mentorData, error } = await supabase
                  .from('mentors')
                  .select(`
                    *,
                    mentor_satellites(*)
                  `)
                  .eq('id', mentorId)
                  .single();
                
                console.log('🔍 DateTimeSlider - Mentor query result:', {
                  error,
                  mentorData,
                  mentor_satellites: mentorData?.mentor_satellites
                });
                
                if (!error && mentorData?.mentor_satellites) {
                  // mentor_satellites could be an array or object, handle both cases
                  const satelliteData = Array.isArray(mentorData.mentor_satellites) 
                    ? mentorData.mentor_satellites[0] 
                    : mentorData.mentor_satellites;
                    
                  console.log('🔍 DateTimeSlider - Satellite data:', satelliteData);
                    
                  if (satelliteData?.full_name) {
                    mentorName = satelliteData.full_name;
                    console.log('✅ DateTimeSlider - Found mentor name:', mentorName);
                  } else {
                    console.log('❌ DateTimeSlider - No full_name in satellite data');
                  }
                } else {
                  console.log('❌ DateTimeSlider - Mentor query failed:', error);
                }
              } catch (err) {
                console.error('❌ DateTimeSlider - Error fetching mentor name:', err);
              }
            } else {
              console.log('❌ DateTimeSlider - No mentorId found in gatheringDisplay');
            }

            const gatheringDate = new Date(gathering.start_time);
            const formattedDate = `${gatheringDate.toLocaleDateString('en-US', { month: 'short' })} ${gatheringDate.getDate()}`;

            console.log('📋 DateTimeSlider - Final result for gathering:', {
              mentorName,
              gatheringDate: formattedDate
            });

            return { mentorName, gatheringDate: formattedDate };
          })
        );

        // Store gatherings as separate entries for line-by-line display
        months.push({
          month,
          monthLabel,
          isAvailable: false,
          gatherings: gatheringInfos,
        });
      } else {
        // Month is available
        months.push({
          month,
          monthLabel,
          isAvailable: true,
        });
      }
    }
    
    setMonthsData(months);
    setLoadingMonths(false);
  }, [mentoring, gyldGatherings, gatheringDetail?.gathering?.id]);

  // Generate recommended dates for selected month
  const generateRecommendedDates = useCallback((month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const monthName = month.toLocaleDateString('en-US', { month: 'long' });
    
    // Special handling for January and July
    const isJanuary = monthIndex === 0;
    const isJuly = monthIndex === 6;
    
    const dates: Date[] = [];
    
    if (isJanuary || isJuly) {
      // Start from second Tuesday for January and July
      const secondTuesday = getSecondTuesday(year, monthIndex);
      const thirdTuesday = getThirdTuesday(year, monthIndex);
      
      // Add second week: Tue, Wed, Thu
      dates.push(secondTuesday);
      dates.push(new Date(secondTuesday.getTime() + 24 * 60 * 60 * 1000)); // Wed
      dates.push(new Date(secondTuesday.getTime() + 2 * 24 * 60 * 60 * 1000)); // Thu
      
      // Add third week: Tue, Wed, Thu
      dates.push(thirdTuesday);
      dates.push(new Date(thirdTuesday.getTime() + 24 * 60 * 60 * 1000)); // Wed
      dates.push(new Date(thirdTuesday.getTime() + 2 * 24 * 60 * 60 * 1000)); // Thu
    } else {
      // Normal months: start from first Tuesday
      const firstTuesday = getFirstTuesday(year, monthIndex);
      
      // Add three weeks of Tue, Wed, Thu
      for (let week = 0; week < 3; week++) {
        const weekOffset = week * 7 * 24 * 60 * 60 * 1000;
        dates.push(new Date(firstTuesday.getTime() + weekOffset)); // Tue
        dates.push(new Date(firstTuesday.getTime() + weekOffset + 24 * 60 * 60 * 1000)); // Wed
        dates.push(new Date(firstTuesday.getTime() + weekOffset + 2 * 24 * 60 * 60 * 1000)); // Thu
      }
    }
    
    return dates;
  }, []);

  // Helper functions for finding specific Tuesdays
  const getFirstTuesday = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7;
    return new Date(year, month, 1 + daysUntilTuesday);
  };

  const getSecondTuesday = (year: number, month: number) => {
    const firstTuesday = getFirstTuesday(year, month);
    return new Date(firstTuesday.getTime() + 7 * 24 * 60 * 60 * 1000);
  };

  const getThirdTuesday = (year: number, month: number) => {
    const firstTuesday = getFirstTuesday(year, month);
    return new Date(firstTuesday.getTime() + 14 * 24 * 60 * 60 * 1000);
  };

  // Initialize months data when component becomes visible
  useEffect(() => {
    if (visible && mentoring) {
      generateMonthsData();
      setCurrentView('month');
    } else if (visible && !mentoring) {
      setCurrentView('datetime');
    }
  }, [visible, mentoring, generateMonthsData]);

  // Update form data when initialData changes
  useEffect(() => {
    if (visible) {
      setFormData({
        startTime: initialData?.startTime || defaultStartTime,
        endTime: initialData?.endTime || defaultEndTime,
      });
    }
  }, [visible, initialData]);

  // Check if current data has unsaved changes
  const hasUnsavedChanges = () => {
    const initialStart = initialData?.startTime || defaultStartTime;
    const initialEnd = initialData?.endTime || defaultEndTime;
    
    return (
      formData.startTime.getTime() !== initialStart.getTime() ||
      formData.endTime.getTime() !== initialEnd.getTime()
    );
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges() || saving) return;
    
    setSaving(true);
    try {
      await onSave({
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      onClose();
    } catch (error) {
      console.error('Error saving date/time:', error);
      // Keep modal open on error so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset to initial data on close
    setFormData({
      startTime: initialData?.startTime || defaultStartTime,
      endTime: initialData?.endTime || defaultEndTime,
    });
    setCurrentView(mentoring ? 'month' : 'datetime');
    setSelectedMonth(null);
    onClose();
  };

  const handleStartTimeChange = (date: Date) => {
    setFormData(prev => ({
      ...prev,
      startTime: date,
    }));
  };

  const handleEndTimeChange = (date: Date) => {
    setFormData(prev => ({
      ...prev,
      endTime: date,
    }));
  };

  // Handle month selection
  const handleMonthSelect = (monthData: MonthData) => {
    setSelectedMonth(monthData.month);
    setCurrentView('datetime');
  };

  // Handle back button in mentoring mode
  const handleBack = () => {
    if (mentoring && currentView === 'datetime') {
      setCurrentView('month');
    } else {
      handleClose();
    }
  };

  // Handle recommended date selection
  const handleRecommendedDateSelect = (date: Date) => {
    // Set the date to 6 PM
    const newStartTime = new Date(date);
    newStartTime.setHours(18, 0, 0, 0);
    const newEndTime = new Date(newStartTime.getTime() + 1.5 * 60 * 60 * 1000);
    
    setFormData({
      startTime: newStartTime,
      endTime: newEndTime,
    });
  };

  if (!visible) {
    return null;
  }

  // Get current title based on view
  const getTitle = () => {
    if (mentoring && currentView === 'month') {
      return 'Choose a Month';
    }
    return 'Date & Time';
  };

  // Get recommended dates if in mentoring mode datetime view
  const recommendedDates = mentoring && currentView === 'datetime' && selectedMonth 
    ? generateRecommendedDates(selectedMonth)
    : [];

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Header with X button and centered title */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            {/* Left spacer to balance the X button */}
            <View style={styles.headerSpacer} />
            
            {/* Centered title */}
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            
            {/* X button */}
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content with scrolling capability */}
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Month Selection View (Mentoring Mode Only) */}
            {mentoring && currentView === 'month' && (
              <View style={styles.monthSelectionContainer}>
                {loadingMonths ? (
                  <Text style={styles.loadingText}>Loading months...</Text>
                ) : (
                  monthsData.map((monthData, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.monthRow}
                      activeOpacity={0.7}
                      onPress={() => handleMonthSelect(monthData)}
                    >
                      {/* Month Label Column */}
                      <View style={styles.monthLabelColumn}>
                        <Text style={styles.monthLabel}>{monthData.monthLabel}</Text>
                      </View>

                      {/* Status/Mentor Names Column */}
                      <View style={styles.monthStatusColumn}>
                        {monthData.isAvailable ? (
                          <Text style={styles.monthAvailable}>available</Text>
                        ) : (
                          monthData.gatherings?.map((gathering, gatheringIndex) => (
                            <Text key={gatheringIndex} style={styles.monthTaken}>
                              {gathering.mentorName}
                            </Text>
                          ))
                        )}
                      </View>

                      {/* Dates Column */}
                      <View style={styles.monthDateColumn}>
                        {!monthData.isAvailable && monthData.gatherings?.map((gathering, gatheringIndex) => (
                          <Text key={gatheringIndex} style={styles.monthDate}>
                            {gathering.gatheringDate}
                          </Text>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Date & Time View */}
            {currentView === 'datetime' && (
              <>
                {/* EventDateTimePicker component */}
                <EventDateTimePicker
                  label="Event Date & Time"
                  startTime={formData.startTime}
                  endTime={formData.endTime}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                />

                {/* Recommended Dates Section (Mentoring Mode Only) */}
                {mentoring && selectedMonth && (() => {
                  const now = new Date();
                  return !(selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear());
                })() && (
                  <View style={styles.recommendedDatesContainer}>
                    {(() => {
                      const isJanuaryOrJuly = selectedMonth.getMonth() === 0 || selectedMonth.getMonth() === 6;
                      
                      return (
                        <>
                          {/* First Group */}
                          <Text style={styles.recommendedRowTitle}>
                            {isJanuaryOrJuly ? 'Recommended Dates' : 'Recommended Dates: First Week of Month'}
                          </Text>
                          <View style={styles.recommendedRow}>
                            {recommendedDates.slice(0, 3).map((date, index) => {
                              const dateKey = `group1-${index}`;
                              const isPressed = pressedDateIndex === dateKey;
                              return (
                                <TouchableOpacity
                                  key={index}
                                  style={styles.recommendedDate}
                                  activeOpacity={1}
                                  onPress={() => handleRecommendedDateSelect(date)}
                                  onPressIn={() => setPressedDateIndex(dateKey)}
                                  onPressOut={() => setPressedDateIndex(null)}
                                >
                                  <Text style={[
                                    styles.recommendedDateText,
                                    isPressed && styles.recommendedDateTextPressed
                                  ]}>
                                    {date.toLocaleDateString('en-US', { month: 'short' })} {date.getDate()}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* Second Group */}
                          <Text style={styles.recommendedRowTitle}>Next Best</Text>
                          <View style={styles.recommendedRow}>
                            {recommendedDates.slice(3, 6).map((date, index) => {
                              const dateKey = `group2-${index}`;
                              const isPressed = pressedDateIndex === dateKey;
                              return (
                                <TouchableOpacity
                                  key={index}
                                  style={styles.recommendedDate}
                                  activeOpacity={1}
                                  onPress={() => handleRecommendedDateSelect(date)}
                                  onPressIn={() => setPressedDateIndex(dateKey)}
                                  onPressOut={() => setPressedDateIndex(null)}
                                >
                                  <Text style={[
                                    styles.recommendedDateText,
                                    isPressed && styles.recommendedDateTextPressed
                                  ]}>
                                    {date.toLocaleDateString('en-US', { month: 'short' })} {date.getDate()}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* Third Group (only if not January/July) */}
                          {recommendedDates.length > 6 && (
                            <>
                              <Text style={styles.recommendedRowTitle}>Next Best</Text>
                              <View style={styles.recommendedRow}>
                                {recommendedDates.slice(6, 9).map((date, index) => {
                                  const dateKey = `group3-${index}`;
                                  const isPressed = pressedDateIndex === dateKey;
                                  return (
                                    <TouchableOpacity
                                      key={index}
                                      style={styles.recommendedDate}
                                      activeOpacity={1}
                                      onPress={() => handleRecommendedDateSelect(date)}
                                      onPressIn={() => setPressedDateIndex(dateKey)}
                                      onPressOut={() => setPressedDateIndex(null)}
                                    >
                                      <Text style={[
                                        styles.recommendedDateText,
                                        isPressed && styles.recommendedDateTextPressed
                                      ]}>
                                        {date.toLocaleDateString('en-US', { month: 'short' })} {date.getDate()}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </View>
                )}
              </>
            )}

            {/* Extra padding at bottom for floating buttons */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>

        {/* Fixed bottom buttons - only show in datetime view */}
        {currentView === 'datetime' && (
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleBack}
            >
              <Text style={styles.cancelButtonText}>
                {mentoring ? 'Back' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !hasUnsavedChanges() && styles.saveButtonInactive
              ]}
              onPress={handleSave}
              disabled={!hasUnsavedChanges() || saving}
            >
              <Text style={[
                styles.saveButtonText,
                !hasUnsavedChanges() && styles.saveButtonTextInactive
              ]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal styles - matching TitleAndHostsSlider exactly
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  modalHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 24 + (theme.spacing.sm * 2), // Same width as close button + padding
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  contentContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingTop: 16, // Space for floating labels
    paddingBottom: 120, // Extra space for floating buttons
    gap: theme.spacing.input_spacing, // Same spacing as TitleAndHostsSlider
  },
  bottomPadding: {
    height: 20,
  },

  // Month Selection Styles
  monthSelectionContainer: {
    gap: 2,
    marginHorizontal: 8, // Add 8px margin on either side
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center', // Changed back to 'center' to align all columns to each other's center
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 5,
    minHeight: 50, // Changed from fixed height to minHeight for multi-line support
    paddingHorizontal: theme.spacing.md + 8, // Add extra 8px padding on left and right (was 5px, now 8px)
    paddingVertical: theme.spacing.sm, // Add vertical padding for better spacing
  },
  monthLabelColumn: {
    width: 40,
    justifyContent: 'center', // Center the month label vertically
  },
  monthLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary, // Changed from primary to text.primary
  },
  monthStatusColumn: {
    flex: 1,
    marginLeft: 15, // 15px margin between first and second column (was 10px + 5px extra)
    justifyContent: 'center', // Center content vertically
  },
  monthAvailable: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.tertiary,
    lineHeight: theme.typography.sizes.md * 1.2, // Consistent line height
  },
  monthTaken: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.sizes.md * 1.2, // Consistent line height
  },
  monthDateColumn: {
    justifyContent: 'center', // Center dates vertically
    alignItems: 'flex-end', // Align dates to the right
  },
  monthDate: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.sizes.md * 1.2, // Consistent line height
  },
  loadingText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },

  // Recommended Dates Styles
  recommendedDatesContainer: {
    marginBottom: theme.spacing.lg,
  },
  recommendedRowTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.sm, // Align with EventDateTimePicker content padding
  },
  recommendedRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg, // Increased gap since we removed backgrounds
    marginBottom: theme.spacing.sm + 15, // Added extra 15px bottom margin
    justifyContent: 'center', // Center the dates horizontally
  },
  recommendedDate: {
    flex: 1,
    // Removed gray background and rounded corners
    paddingVertical: theme.spacing.sm,
    alignItems: 'center', // Center align since we're now centering the row
    justifyContent: 'center',
  },
  recommendedDateText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.tertiary, // Changed to tertiary color
  },
  recommendedDateTextPressed: {
    fontWeight: theme.typography.weights.bold, // Increased font weight on press (more pronounced)
    color: theme.colors.primary, // Change to primary color on press
  },

  // Fixed bottom buttons - floating over scrolling content
  modalButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.spacing.lg + 20,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInactive: {
    backgroundColor: 'rgba(19, 190, 199, 0.35)',
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
  saveButtonTextInactive: {
    color: theme.colors.text.secondary,
  },
}); 