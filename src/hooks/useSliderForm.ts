import { useState, useMemo } from 'react';

/**
 * Custom hook for managing slider form state with save button logic
 * Handles tracking changes, save states, and unsaved changes detection
 */
export const useSliderForm = <T>(
  initialData: T,
  onSave: (data: T) => Promise<void>
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [savedData, setSavedData] = useState<T>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if there are unsaved changes by comparing current form data with saved data
  const hasUnsavedChanges = useMemo(() => 
    JSON.stringify(formData) !== JSON.stringify(savedData), 
    [formData, savedData]
  );
  
  // Handle saving with loading state
  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      setSavedData(formData); // Mark current data as saved
    } catch (error) {
      console.error('Error saving form data:', error);
      throw error; // Re-throw so slider can handle error display
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset form to last saved state
  const resetChanges = () => {
    setFormData(savedData);
  };
  
  // Update specific field in form data
  const updateField = (field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return {
    formData,
    setFormData,
    updateField,
    hasUnsavedChanges,
    isSaving,
    handleSave,
    resetChanges,
    savedData
  };
}; 