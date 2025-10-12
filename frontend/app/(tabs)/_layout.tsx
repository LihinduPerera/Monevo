import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Animated, Pressable } from "react-native";
import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={20}
            style={styles.blurBackground}
          />
        ),
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarButton: (props) => (
          <AnimatedTabButton {...props} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <GlassIcon 
              name={focused ? "home" : "home-outline"} 
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <GlassIcon 
              name={focused ? "card" : "card-outline"} 
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <GlassIcon 
              name={focused ? "person" : "person-outline"} 
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Animated Tab Button with Haptics
const AnimatedTabButton = (props: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Scale down animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    // Scale back to normal
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePress = () => {
    // Trigger selection haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    props.onPress?.();
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {props.children}
      </Animated.View>
    </Pressable>
  );
};

// Glass Morphism Icon Component
const GlassIcon = ({ name, focused }: { name: any, focused: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Trigger haptic feedback when tab becomes active
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Multi-stage animation sequence
      Animated.sequence([
        // Initial pop
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.25,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Settle
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulsing glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animations when unfocused
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [focused]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={styles.glassWrapper}>
      <Animated.View 
        style={[
          styles.glassContainer,
          focused && styles.glassActive,
          { 
            transform: [
              { scale: scaleAnim },
              { rotate: rotation }
            ] 
          }
        ]}
      >
        {focused && (
          <Animated.View 
            style={[
              styles.glowRing,
              { opacity: glowOpacity }
            ]} 
          />
        )}
        <BlurView
          intensity={focused ? 40 : 20}
          tint="light"
          style={styles.glassBlur}
        >
          <Ionicons 
            name={name} 
            size={24} 
            color={focused ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} 
          />
        </BlurView>
        {focused && (
          <Animated.View 
            style={[
              styles.glassIndicator,
              { 
                transform: [{ scale: scaleAnim }]
              }
            ]} 
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    height: 100,
    paddingBottom: 15,
    paddingTop: 25,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: 'rgba(139, 92, 246, 0.3)',
    borderTopWidth: 1,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Glass morphism styles
  glassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  glassContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 14,
  },
  glassActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.6)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  glassBlur: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  glassIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#8b5cf6',
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
});