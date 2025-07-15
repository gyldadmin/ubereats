import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import StandardSlider from './StandardSlider';
import SingleLineInput from './SingleLineInput';
import { MultiSelect } from './AdvancedMultiSelect';
import SingleChoiceSelector from './SingleChoiceSelector';
import { useGyldMembers } from '../../hooks/useGyldMembers';
import { typography, colors, spacing } from '../../styles/theme';

interface TitleAndHostsSliderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    hosts: string[];
    scribe?: string;
  }) => Promise<void>;
  experienceType?: string;
  initialData?: {
    title?: string;
    hosts?: string[];
    scribe?: string;
  };
}

export const TitleAndHostsSlider: React.FC<TitleAndHostsSliderProps> = ({
  visible,
  onClose,
  onSave,
  experienceType,
  initialData,
}) => {
  const theme = useTheme();
  const { members: gyldMembers, loading: membersLoading } = useGyldMembers();
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    hosts: initialData?.hosts || [],
    scribe: initialData?.scribe || '',
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      title: initialData?.title || '',
      hosts: initialData?.hosts || [],
      scribe: initialData?.scribe || '',
    });
  }, [initialData]);

  // Prepare options for member selectors
  // Transform gyldMembers to the format expected by MultiSelect
  const hostOptions = (gyldMembers || []).map(member => ({
    value: member.user_id,
    label: member.full_name,
  }));

  // Debug logging
  console.log('🎯 TitleAndHostsSlider debug:');
  console.log('- gyldMembers count:', gyldMembers?.length || 0);
  console.log('- gyldMembers sample:', gyldMembers?.slice(0, 2) || []);
  console.log('- membersLoading:', membersLoading);
  console.log('- hostOptions count:', hostOptions.length);
  console.log('- hostOptions sample:', hostOptions.slice(0, 2));

  // Prepare options for scribe selector (single choice)
  const scribeOptions = (gyldMembers || []).map(member => ({
    value: member.user_id,
    label: member.full_name,
  }));

  // Check if current data has unsaved changes
  const hasUnsavedChanges = () => {
    return (
      formData.title !== (initialData?.title || '') ||
      JSON.stringify(formData.hosts.sort()) !== JSON.stringify((initialData?.hosts || []).sort()) ||
      formData.scribe !== (initialData?.scribe || '')
    );
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    
    if (formData.title.length > 32) {
      errors.push('Title must be 32 characters or less');
    }
    
    if (formData.hosts.length === 0) {
      errors.push('At least one host is required');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    await onSave({
      title: formData.title.trim(),
      hosts: formData.hosts,
      scribe: formData.scribe || undefined,
    });
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
    }));
  };

  const handleHostsChange = (selectedHosts: string[]) => {
    setFormData(prev => ({
      ...prev,
      hosts: selectedHosts,
    }));
  };

  const handleScribeChange = (selectedScribe: string) => {
    setFormData(prev => ({
      ...prev,
      scribe: selectedScribe,
    }));
  };

  // Show scribe field only for Mentoring experience type
  const showScribeField = experienceType === 'Mentoring';

  return (
    <StandardSlider
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      hasUnsavedChanges={hasUnsavedChanges()}
      title="Title"
    >
      <View>
        {/* Title input */}
        <SingleLineInput
          label="Title"
          value={formData.title}
          onValueChange={handleTitleChange}
          placeholder="Type gathering title..."
          maxLength={32}
          required
        />

        {/* Hosts section label */}
        <Text style={styles.sectionLabel}>Hosts</Text>
        
        {/* Hosts selection */}
        <MultiSelect
          title="Select Hosts"
          options={hostOptions}
          selectedValues={formData.hosts}
          onSelectionChange={handleHostsChange}
          placeholder="Choose hosts..."
          disabled={membersLoading}
        />

        {/* Scribe selection - only for Mentoring */}
        {showScribeField && (
          <SingleChoiceSelector
            label="Scribe (Optional)"
            options={scribeOptions}
            selectedValue={formData.scribe}
            onValueChange={handleScribeChange}
            placeholder="Choose scribe..."
            disabled={membersLoading}
          />
        )}
      </View>
    </StandardSlider>
  );
};

const styles = {
  sectionLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 32, // Fixed pixels above titles
    marginBottom: 16, // Fixed pixels below titles
  },
}; 