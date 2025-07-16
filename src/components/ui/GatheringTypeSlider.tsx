import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Modal } from 'react-native';
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

  useEffect(() => {
    if (visible) {
      fetchExperienceTypes();
      setSelectedType(initialData?.experienceType || null);
    }
  }, [visible, initialData]);

  const fetchExperienceTypes = async () => {
    try {
      // Query database to get social experience types ordered by priority
      const { data, error } = await supabase
        .from('experience_type')
        .select('*')
        .eq('social', true)
        .order('priority', { ascending: false })
        .order('label', { ascending: true });

      if (error) {
        console.error('Error fetching experience types:', error);
        return;
      }

      setExperienceTypes(data || []);
    } catch (error) {
      console.error('Error fetching experience types:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityTypes = experienceTypes.filter(type => type.priority);
  const nonPriorityTypes = experienceTypes.filter(type => !type.priority);
  const displayedTypes = showAll ? experienceTypes : priorityTypes;

  const handleSave = async () => {
    if (!selectedType) return;
    
    setSaving(true);
    try {
      await onSave({ experienceType: selectedType });
      onClose();
    } catch (error) {
      console.error('Error saving gathering type:', error);
      // TODO: Show error message to user
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = selectedType !== initialData?.experienceType;

  const renderCard = (type: ExperienceType) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.card,
        selectedType === type.id && styles.cardSelected
      ]}
      onPress={() => setSelectedType(type.id)}
    >
      <Image source={{ uri: type.image_square }} style={styles.cardImage} />
      <Text style={[
        styles.cardLabel,
        selectedType === type.id && styles.cardLabelSelected
      ]}>
        {type.label}
      </Text>
    </TouchableOpacity>
  );

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>What type of gathering?</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={!selectedType || saving}
            style={[
              styles.saveButton,
              (!selectedType || saving) && styles.saveButtonDisabled
            ]}
          >
            <Text style={[
              styles.saveButtonText,
              (!selectedType || saving) && styles.saveButtonTextDisabled
            ]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              <View style={styles.cardsContainer}>
                {displayedTypes.map(renderCard)}
              </View>
              
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
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.text.secondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.background.tertiary,
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  card: {
    width: '48%',
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  toggleButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 40,
  },
  toggleButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
