import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { theme } from '../../styles/theme';

interface ExperienceType {
  id: string;
  label: string;
  image_square: string;
  priority: boolean;
  social: boolean;
}

interface GatheringTypeSliderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: {
    experienceType?: string;
  };
  onSave: (data: { experienceType: string }) => Promise<void>;
}

export const GatheringTypeSlider: React.FC<GatheringTypeSliderProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
}) => {
  const [experienceTypes, setExperienceTypes] = useState<ExperienceType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(initialData?.experienceType || null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      console.log('🚀 GatheringTypeSlider opened, initialData:', initialData);
      console.log('🎯 Modal visible prop:', visible);
      setError(null);
      setLoading(true);
      fetchExperienceTypes();
      setSelectedType(initialData?.experienceType || null);
    }
  }, [visible, initialData]);

  const fetchExperienceTypes = async () => {
    try {
      console.log('🔍 Starting to fetch experience types...');

      // Query database to get social experience types ordered by priority
      const { data, error } = await supabase
        .from('experience_type')
        .select('id, label, image_square, priority, social')
        .eq('social', true)
        .order('priority', { ascending: false })
        .order('label', { ascending: true });

      if (error) {
        console.error('❌ Database error:', error);
        setError(`Database error: ${error.message}`);
        return;
      }

      console.log('📊 Raw data received:', data);
      console.log('📈 Data count:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('⚠️ No experience types found');
        setError('No social experience types found in database');
        return;
      }

      // Custom sort to ensure "Other" appears last
      const sortedData = data.sort((a, b) => {
        // If one is "Other", put it last
        if (a.label.toLowerCase() === 'other') return 1;
        if (b.label.toLowerCase() === 'other') return -1;
        
        // Otherwise maintain the existing sort order (priority desc, then label asc)
        if (a.priority !== b.priority) {
          return b.priority ? 1 : -1; // priority items first
        }
        return a.label.localeCompare(b.label); // alphabetical by label
      });

      setExperienceTypes(sortedData);
      console.log('✅ Experience types set successfully with Other last:', sortedData.length);

    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(`Fetch error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter priority and non-priority types for display logic
  const priorityTypes = experienceTypes.filter(type => type.priority);
  const nonPriorityTypes = experienceTypes.filter(type => !type.priority);
  
  // Display logic: show priority types first, then non-priority if showAll is true
  const displayedTypes = showAll 
    ? experienceTypes 
    : priorityTypes;

  console.log('📋 Component state:', {
    visible,
    loading,
    error,
    experienceTypesCount: experienceTypes.length,
    priorityTypesCount: priorityTypes.length,
    nonPriorityTypesCount: nonPriorityTypes.length,
    displayedTypesCount: displayedTypes.length,
    showAll,
    selectedType,
    themeColors: theme.colors ? 'Available' : 'Missing'
  });

  const hasUnsavedChanges = selectedType !== null && selectedType !== initialData?.experienceType;

  const handleSave = async () => {
    if (!selectedType) return;
    
    setSaving(true);
    try {
      console.log('💾 Saving experience type:', selectedType);
      await onSave({ experienceType: selectedType });
      console.log('✅ Save completed, closing modal');
      onClose();
    } catch (error) {
      console.error('❌ Error saving gathering type:', error);
      setError(`Save error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 GatheringTypeSlider handleClose called');
    onClose();
  };

  const handleTypeSelection = (typeId: string) => {
    console.log('🎯 Type selected:', typeId);
    setSelectedType(typeId);
  };

  const renderCard = (type: ExperienceType) => {
    console.log('🔧 Rendering card for:', type.label);
    const isSelected = selectedType === type.id;
    
    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.card,
          isSelected && styles.cardSelected
        ]}
        onPress={() => handleTypeSelection(type.id)}
      >
        <Image 
          source={{ uri: type.image_square }} 
          style={styles.cardImage}
          onError={(e) => console.log('❌ Image load error:', e.nativeEvent.error)}
          onLoad={() => console.log('✅ Image loaded for:', type.label)}
        />
        <Text style={[
          styles.cardLabel,
          isSelected && styles.cardLabelSelected
        ]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const toggleShowAll = () => {
    console.log('🔄 Toggling show all from:', showAll, 'to:', !showAll);
    setShowAll(!showAll);
  };

  console.log('🎨 About to render component, visible:', visible);

  if (!visible) {
    console.log('❌ Component not visible, returning null');
    return null;
  }

  console.log('✅ Component is visible, rendering...');

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
            <Text style={styles.headerTitle}>Gathering Type</Text>
            
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading experience types...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchExperienceTypes} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.cardsContainer}>
                  {displayedTypes.map(renderCard)}
                </View>
                
                {displayedTypes.length === 0 && (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      No experience types found. Check database and filters.
                    </Text>
                  </View>
                )}
                
                {nonPriorityTypes.length > 0 && (
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={toggleShowAll}
                  >
                    <Text style={styles.toggleButtonText}>
                      {showAll ? 'Fewer' : 'More'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Extra padding at bottom to ensure content doesn't get hidden behind floating buttons */}
                <View style={styles.bottomPadding} />
              </>
            )}
          </ScrollView>
        </View>

        {/* Fixed bottom buttons - floating over scrolling content */}
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              !hasUnsavedChanges && styles.saveButtonInactive
            ]}
            onPress={handleSave}
            disabled={!hasUnsavedChanges || saving}
          >
            <Text style={[
              styles.saveButtonText,
              !hasUnsavedChanges && styles.saveButtonTextInactive
            ]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal Styles
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
    paddingBottom: 120, // Extra space for floating buttons
  },

  // Experience type cards - updated design with larger size
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    marginTop: 15, // Extra 15px margin above cards
  },
  card: {
    width: 140,
    marginBottom: 20,
    margin: 3, // Compensating margin for unselected cards (equals selected border width)
    backgroundColor: theme.colors?.background?.tertiary || '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: theme.colors?.primary || '#13bec7',
    borderWidth: 3,
    margin: 2, // Reduced margin when selected (was 5px, now 2px = 5px - 3px outline width)
    marginBottom: 17, // Keep bottom margin consistent (20px - 3px base margin = 17px)
    backgroundColor: 'rgba(19, 190, 199, 0.1)', // Light brand color background
  },
  cardImage: {
    width: 140,
    height: 140,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors?.text?.primary || '#333333',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  cardLabelSelected: {
    color: theme.colors?.primary || '#13bec7',
    fontWeight: '800', // Increased font weight when selected
  },
  toggleButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent', // Remove gray background
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  toggleButtonText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors?.text?.secondary || '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors?.status?.error || '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors?.primary || '#13bec7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors?.text?.inverse || '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors?.text?.secondary || '#666666',
    textAlign: 'center',
  },

  // Fixed bottom buttons - floating over scrolling content
  modalButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg + 20,
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
