import React, { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DraggableRow({ 
  children, 
  isReorderMode, 
  index, 
  totalItems, 
  onDragStart,
  onDragEnd, 
  colors 
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const CARD_HEIGHT = 160; // Estimated card height including margins

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isReorderMode,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return isReorderMode && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        if (onDragStart) onDragStart();
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: new Animated.Value(0), dy: pan.y }],
        { useNativeDriver: false } // layout animation y-translations
      ),
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);
        
        // Calculate offset steps
        const offsetSteps = Math.round(gestureState.dy / CARD_HEIGHT);
        let targetIndex = index + offsetSteps;
        
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= totalItems) targetIndex = totalItems - 1;

        if (targetIndex !== index) {
          onDragEnd(index, targetIndex);
          pan.setValue({ x: 0, y: 0 });
        } else {
          // Snap back if dropped in same position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start(() => {
            if (onDragEnd) onDragEnd(index, index);
          });
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start(() => {
          if (onDragEnd) onDragEnd(index, index);
        });
      }
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: pan.y }],
          zIndex: isDragging ? 999 : 1,
          opacity: isDragging ? 0.85 : 1,
          ...isDragging && {
            shadowColor: colors.cyan,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }
        },
      ]}
    >
      {isReorderMode && (
        <View 
          {...panResponder.panHandlers} 
          style={[
            styles.dragHandle, 
            { 
              borderColor: isDragging ? colors.cyan : colors.border, 
              backgroundColor: isDragging ? colors.cyan + '10' : colors.cardBg 
            }
          ]}
        >
          <MaterialCommunityIcons 
            name="drag-vertical" 
            size={22} 
            color={isDragging ? colors.cyan : colors.textMuted} 
          />
        </View>
      )}
      <View style={styles.childContainer}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dragHandle: {
    paddingHorizontal: 6,
    paddingVertical: 50,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  childContainer: {
    flex: 1,
  },
});
