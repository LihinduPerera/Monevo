import React, { useState } from 'react';
import { View, Text, Image, Dimensions, SafeAreaView, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Marquee } from '@animatereactnative/marquee';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import SignInForm from '@/components/SignInForm';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const [isSignInDialogShown, setIsSignInDialogShown] = useState(false);

  const contentTop = useSharedValue(0);
  const dialogTranslateY = useSharedValue(-height);

  // Generate random characters for background marquee animations
  const generateRandomChars = (length: number) => {
    return Array.from({ length }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join(' ');
  };

  const randomChars1 = generateRandomChars(50);
  const randomChars2 = generateRandomChars(50);

  const handleButtonPress = () => {
    contentTop.value = withTiming(-50, { duration: 240 });
    dialogTranslateY.value = withTiming(0, { duration: 300 });
    setIsSignInDialogShown(true);
  };

  const closeDialog = () => {
    contentTop.value = withTiming(0, { duration: 240 });
    dialogTranslateY.value = withTiming(-height, { duration: 300 });
    setTimeout(() => setIsSignInDialogShown(false), 300);
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    top: contentTop.value,
  }));

  const animatedDialogStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dialogTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background image
      <View style={[styles.backgroundImageContainer, { width: width * 1.7 }]}>
        <Image
        //   source={require('../../assets/backgrounds/spline.png')} // Assume asset exists; adjust path if needed?
          style={styles.backgroundImage}
          resizeMode="contain"
        />
      </View> */}

      {/* Marquee for random character animations in background (layer 1) */}
      <Marquee speed={0.5} spacing={20} style={StyleSheet.absoluteFillObject}>
        <Text style={styles.marqueeText}>{randomChars1}</Text>
      </Marquee>

      {/* Marquee for random character animations in background (layer 2, reverse for unique look) */}
      <Marquee speed={0.8} spacing={20} reverse={true} style={StyleSheet.absoluteFillObject}>
        <Text style={[styles.marqueeText, { fontSize: 80, color: '#87A4E3' }]}>{randomChars2}</Text>
      </Marquee>

      {/* Blur effect over background */}
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />

      {/* Main content */}
      <Animated.View style={[styles.mainContent, animatedContentStyle]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.contentPadding}>
            <View style={{ flex: 1 }} />
            {/* Title section */}
            <View style={styles.titleSection}>
              <Text style={styles.titleText}>Connected & Organized</Text>
              <View style={{ height: 20 }} />
              <Text style={styles.descriptionText}>
                Join live sessions, share notes, and watch past recordings — all in one place. Simple, fast, and built for your class.
              </Text>
            </View>
            <View style={{ flex: 2 }} />
            {/* Sign In button */}
            <TouchableOpacity style={styles.signInButton} onPress={handleButtonPress}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            {/* Footer text */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                No more missed updates or scattered resources — everything you need is right here.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Sign In Dialog */}
      {isSignInDialogShown && (
        <Animated.View style={[styles.dialogOverlay, animatedDialogStyle]}>
          <View style={styles.dialogContainer}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={styles.dialogTitle}>Sign In</Text>
              <View style={styles.dialogDescriptionContainer}>
                <Text style={styles.dialogDescription}>Sign in to stay connected with your classes and resources</Text>
              </View>
              <SignInForm onClose={closeDialog} />
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Don't Have An Account?</Text>
                <View style={styles.divider} />
              </View>
              <View style={styles.noteContainer}>
                <Text style={styles.noteText}>
                  Need an account? Please contact your teacher to receive your login details.
                </Text>
              </View>
            </ScrollView>
          </View>
          {/* Close button */}
          <View style={styles.closeButtonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={closeDialog}>
              <Ionicons name="close" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImageContainer: {
    position: 'absolute',
    left: 100,
    bottom: 200,
  },
  backgroundImage: {
    width: '100%',
  },
  marqueeText: {
    fontSize: 100,
    opacity: 0.2,
    color: 'gray',
  },
  mainContent: {
    position: 'absolute',
    left: 0,
    height: height,
    width: width,
  },
  contentPadding: {
    paddingHorizontal: 32,
    flex: 1,
  },
  titleSection: {
    width: 260,
  },
  titleText: {
    fontSize: 40,
    fontFamily: 'Poppins-Bold', // Assume font loaded; replace with actual font family if needed
    fontWeight: '800',
    lineHeight: 40 * 1.2,
  },
  descriptionText: {
    fontSize: 16, // Approximate
  },
  signInButton: {
    backgroundColor: '#57A4E3', // FromARGB(255, 87, 164, 227)
    borderRadius: 10,
    padding: 16,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins', // Assume font loaded
    color: 'gray',
    textAlign: 'center',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dialogContainer: {
    height: 560,
    marginHorizontal: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 40,
    overflow: 'hidden',
  },
  dialogTitle: {
    fontSize: 34,
    fontFamily: 'Poppins', // Assume font loaded
    fontWeight: '700',
    textAlign: 'center',
  },
  dialogDescriptionContainer: {
    paddingVertical: 16,
  },
  dialogDescription: {
    textAlign: 'center',
    color: 'gray',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'lightgray',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: 'darkgray',
  },
  noteContainer: {
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  noteText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'gray',
    fontFamily: 'Poppins', // Assume font loaded
  },
  closeButtonContainer: {
    position: 'absolute',
    bottom: height / 2 - 280 - 16, // Approximate centering below dialog
    alignSelf: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});