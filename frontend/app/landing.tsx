import React, { useState, useMemo } from 'react';
import { View, Text, Image, Dimensions, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Marquee } from '@animatereactnative/marquee';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import SignInForm from '@/components/SignInForm';
import RegisterForm from '@/components/RegisterForm';

const { width, height } = Dimensions.get('window');

type AuthMode = 'signin' | 'register';

export default function LandingScreen() {
  const [authDialogShown, setAuthDialogShown] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const contentTop = useSharedValue(0);
  const dialogTranslateY = useSharedValue(-height);
  const dialogOpacity = useSharedValue(0);

  const randomColor = () =>
    `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')}`;
  const randomChar = () => String.fromCharCode(33 + Math.floor(Math.random() * 94));
  const randomFontSize = () => 40 + Math.floor(Math.random() * 200);

  const ROW_HEIGHT = 120;
  const NUM_ROWS = Math.ceil(height / ROW_HEIGHT) + 1;

  const backgroundRows = useMemo(() => {
    return Array.from({ length: NUM_ROWS }).map((_, rowIndex) => {
      const chars = Array.from({ length: 60 }, () => randomChar());
      const colors = Array.from({ length: 60 }, () => randomColor());
      const fontSizes = Array.from({ length: 60 }, () => randomFontSize());
      const speed = 0.3 + (rowIndex % 4) * 0.25;
      const reverse = rowIndex % 2 === 0;
      return { chars, colors, fontSizes, speed, reverse };
    });
  }, []);

  const handleButtonPress = () => {
    setAuthMode('signin');
    // Mount the dialog first with opacity 0
    setAuthDialogShown(true);
    
    // Use a small delay to ensure the component is mounted before animating
    setTimeout(() => {
      contentTop.value = withTiming(-60, { duration: 240 });
      dialogOpacity.value = withTiming(1, { duration: 200 });
      dialogTranslateY.value = withTiming(0, { duration: 300 });
    }, 16); // One frame delay
  };

  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  const handleSwitchToSignIn = () => {
    setAuthMode('signin');
  };

  const closeDialog = () => {
    dialogOpacity.value = withTiming(0, { duration: 200 });
    contentTop.value = withTiming(0, { duration: 240 });
    dialogTranslateY.value = withTiming(-height, { 
      duration: 300,
    }, () => {
      // Unmount after animation completes
      runOnJS(setAuthDialogShown)(false);
    });
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    top: contentTop.value,
  }));

  const animatedDialogStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dialogTranslateY.value }],
    opacity: dialogOpacity.value,
  }));

  const getDialogHeight = () => {
    return authMode === 'signin' ? 560 : 640;
  };

  const getDialogTitle = () => {
    return authMode === 'signin' ? 'Welcome Back' : 'Create Account';
  };

  const getDialogDescription = () => {
    return authMode === 'signin'
      ? 'Sign in to access your income and expense reports, budgets, and insights.'
      : 'Create your account to start managing your finances smarter.';
  };

  return (
    <View className='bg-[#101820]' style={{ flex: 1 }}>
      {/* Background image */}
      <View
        className="absolute left-[100px] bottom-[200px]"
        style={{ width: width * 1.7 }}
      >
        <Image
          source={require('../assets/backgrounds/spline.png')}
          className="w-full"
          resizeMode="contain"
          style={{ opacity: 0.18 }}
        />
      </View>

      {/* Blur the background image slightly */}
      <BlurView intensity={20} tint='prominent' style={{ position: 'absolute', inset: 0 }} pointerEvents="none" />

      {/* Full-page marquee background */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        {backgroundRows.map((row, rIdx) => (
          <View
            key={rIdx}
            style={{ height: ROW_HEIGHT, overflow: 'hidden', justifyContent: 'center' }}
          >
            <Marquee speed={row.speed} spacing={20} reverse={row.reverse}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {row.chars.map((char, i) => (
                  <Text
                    key={`${rIdx}-${i}`}
                    style={{
                      fontSize: row.fontSizes[i],
                      opacity: 0.5,
                      marginRight: 6,
                      includeFontPadding: false,
                      fontFamily: 'Poppins',
                      color: row.colors[i],
                      lineHeight: row.fontSizes[i],
                      fontWeight: '700',
                    }}
                  >
                    {char}{' '}
                  </Text>
                ))}
              </View>
            </Marquee>
          </View>
        ))}
      </View>

      {/* Add extra blur layer for contrast */}
      <BlurView intensity={65} tint="prominent" style={{ position: 'absolute', inset: 0 }} pointerEvents="none" />

      {/* Main content */}
      <Animated.View
        style={[{ position: 'absolute', left: 0, height: height, width: width }, animatedContentStyle]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 32, flex: 1 }}>
            <View style={{ flex: 1 }} />

            {/* Title section */}
            <View style={{ width: 280 }}>
              <Text className='color-white' style={{ fontSize: 45, fontWeight: '700', lineHeight: 48, fontFamily: 'Poppins-Bold' }}>
                Your Money, Simplified
              </Text>
              <View style={{ height: 20 }} />
              <Text className='color-slate-400' style={{ fontSize: 16 }}>
                Track income, monitor expenses, and stay in control of your finances — all in one smart dashboard.
              </Text>
            </View>

            <View style={{ flex: 2 }} />

            {/* Get Started button */}
            <TouchableOpacity
            className='bg-purple-500/35 border-purple-500/50'
              style={{ borderRadius: 10, padding: 16 }}
              onPress={handleButtonPress}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
                Get Started
              </Text>
            </TouchableOpacity>

            {/* Footer text */}
            <View style={{ paddingVertical: 24 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', fontFamily: 'Poppins' }}>
                Take charge of your spending habits and reach your financial goals effortlessly.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Auth Dialog */}
      {authDialogShown && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              inset: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
            },
            animatedDialogStyle,
          ]}
        >
          {/* Add extra blur layer for contrast */}
          <BlurView intensity={90} tint="prominent" style={{ position: 'absolute', inset: 0 }} pointerEvents="none" />
          
          <View
            style={{
              height: getDialogHeight(),
              marginHorizontal: 16,
              paddingVertical: 32,
              paddingHorizontal: 24,
              backgroundColor: '#E5E7EB',
              borderRadius: 40,
              overflow: 'hidden',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={{ fontSize: 34, fontWeight: '700', textAlign: 'center', fontFamily: 'Poppins' }}>
                {getDialogTitle()}
              </Text>
              <View style={{ paddingVertical: 16 }}>
                <Text style={{ textAlign: 'center', color: '#6b7280' }}>
                  {getDialogDescription()}
                </Text>
              </View>

              {authMode === 'signin' ? (
                <SignInForm onClose={closeDialog} onSwitchToRegister={handleSwitchToRegister} />
              ) : (
                <RegisterForm onClose={closeDialog} onSwitchToSignIn={handleSwitchToSignIn} />
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
                <Text style={{ paddingHorizontal: 10, color: '#4b5563' }}>
                  {authMode === 'signin' ? 'New Here?' : 'Already have an account?'}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
              </View>

              <View style={{ paddingTop: 10, paddingHorizontal: 8 }}>
                <Text style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', fontFamily: 'Poppins' }}>
                  {authMode === 'signin'
                    ? "Don't have an account yet? Create one to start managing your finances smarter."
                    : "Already have an account? Sign in to access your financial dashboard."}
                </Text>
              </View>

              {/* Switch mode button */}
              <TouchableOpacity
                onPress={authMode === 'signin' ? handleSwitchToRegister : handleSwitchToSignIn}
                style={{ marginTop: 16 }}
              >
                <Text style={{ textAlign: 'center', color: '#4a30ca', fontWeight: '600', fontSize: 16 }}>
                  {authMode === 'signin' ? 'Create an Account' : 'Sign In to Existing Account'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Close button */}
          <View style={{ position: 'absolute', alignSelf: 'center', bottom: height / 2 - getDialogHeight() / 2 - 16 }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={closeDialog}
            >
              <Ionicons name="close" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}