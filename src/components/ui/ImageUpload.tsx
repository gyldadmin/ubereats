import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, Platform } from 'react-native';
import { Text, Button, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { theme } from '../../styles/theme';

interface ImageUploadProps {
  value?: string; // Current image URL
  onValueChange: (imageUrl: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  bucketName?: string; // Supabase bucket name
  folderPath?: string; // Optional folder path within bucket
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onValueChange,
  label = 'Image',
  placeholder = 'Add an image',
  disabled = false,
  bucketName = 'experience-images', // Default bucket
  folderPath = 'gathering-images', // Default folder
}) => {
  const paperTheme = useTheme();
  const [uploading, setUploading] = useState(false);

  // Request permissions for camera/gallery access
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to select an image.');
        return false;
      }
    }
    return true;
  };

  // Generate unique filename for uploaded image
  const generateFileName = (originalName?: string) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = originalName?.split('.').pop() || 'jpg';
    return `${folderPath}/${timestamp}-${randomString}.${extension}`;
  };

  // Upload image to Supabase storage
  const uploadToSupabase = async (uri: string, fileName: string) => {
    try {
      console.log('📤 Starting image upload to Supabase...');

      // Convert image to base64 first, then to arraybuffer
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      console.log('📁 Uploading to bucket:', bucketName, 'filename:', fileName);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      console.log('✅ Upload successful:', data);

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  };

  // Handle image selection from gallery
  const selectImage = async () => {
    if (disabled || uploading) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      console.log('📷 Opening image picker...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Good aspect ratio for gathering images
        quality: 0.8, // Compress for faster upload
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('📸 Image selected:', asset.uri);

        setUploading(true);

        // Generate filename and upload
        const fileName = generateFileName(asset.fileName);
        const uploadedUrl = await uploadToSupabase(asset.uri, fileName);

        // Update the value with the new URL
        onValueChange(uploadedUrl);
        console.log('✅ Image upload complete!');

      }
    } catch (error) {
      console.error('❌ Error selecting/uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle image removal
  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onValueChange(null)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={[styles.surface, disabled && styles.disabled]} elevation={0}>
        {value ? (
          // Show selected image with remove option
          <View style={styles.imageContainer}>
            <Image source={{ uri: value }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <Button
                mode="contained"
                onPress={removeImage}
                disabled={disabled || uploading}
                style={styles.removeButton}
                labelStyle={styles.removeButtonText}
                icon="close"
              >
                Remove
              </Button>
            </View>
          </View>
        ) : (
          // Show upload prompt
          <Button
            mode="text"
            onPress={selectImage}
            disabled={disabled || uploading}
            style={styles.uploadButton}
            labelStyle={styles.uploadButtonText}
            contentStyle={styles.uploadButtonContent}
            icon={() => (
              <View style={{ marginRight: -4 }}>
                {uploading ? 
                  <ActivityIndicator size={16} color={theme.colors.text.tertiary} /> :
                  <Ionicons name="add" size={16} color={theme.colors.text.tertiary} />
                }
              </View>
            )}
          >
            {uploading ? 'Uploading...' : placeholder}
          </Button>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  surface: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 130,
  },
  disabled: {
    opacity: 0.6,
  },
  imageContainer: {
    position: 'relative',
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  removeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
  },
  uploadButton: {
    marginVertical: 16,
    marginHorizontal: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  uploadButtonText: {
    color: theme.colors.text.tertiary,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  uploadButtonContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});

export default ImageUpload; 