import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { Restaurant } from '../../../types/restaurant';
import RestaurantDetail from './RestaurantDetail';
import { colors, spacing, layout, shadows, theme } from '../../styles';

interface RestaurantSliderProps {
  restaurant: Restaurant | null;
  isVisible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDER_HEIGHT = SCREEN_HEIGHT * layout.components.slider.heightPercentage;

const RestaurantSlider: React.FC<RestaurantSliderProps> = ({
  restaurant,
  isVisible,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(SLIDER_HEIGHT)).current;

  console.log('🎯 RestaurantSlider render:', { 
    restaurantName: restaurant?.name, 
    isVisible, 
    hasRestaurant: !!restaurant 
  });

  useEffect(() => {
    if (isVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.animation.slider.show,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SLIDER_HEIGHT,
        duration: theme.animation.slider.hide,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > SLIDER_HEIGHT * 0.3 || gestureState.vy > 0.5) {
        onClose();
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: theme.animation.normal,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (!restaurant) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.header} {...panResponder.panHandlers}>
        <TouchableOpacity onPress={onClose} style={styles.dragBar}>
          <View style={styles.dragBarIndicator} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <RestaurantDetail restaurant={restaurant} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SLIDER_HEIGHT,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: layout.components.slider.borderRadius,
    borderTopRightRadius: layout.components.slider.borderRadius,
    ...shadows.xl,
  },
  header: {
    height: layout.components.slider.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: layout.components.slider.borderRadius,
    borderTopRightRadius: layout.components.slider.borderRadius,
  },
  dragBar: {
    width: '100%',
    height: layout.components.slider.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragBarIndicator: {
    width: layout.components.slider.dragBarWidth,
    height: layout.components.slider.dragBarHeight,
    backgroundColor: colors.border.medium,
    borderRadius: spacing.xs / 2,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
});

export default RestaurantSlider; 