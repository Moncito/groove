import React, { useEffect, useState } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, typography } from '@/theme/tokens'

interface SplashScreenProps {
  onFinish?: () => void
}

export default function CustomSplashScreen({ onFinish }: SplashScreenProps): React.JSX.Element {
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFinish) onFinish()
    })
  }, [fadeAnim, onFinish])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Top Left Number */}
          <View style={styles.topSection}>
            <Text
              style={[
                styles.number,
                {
                  fontFamily: typography.fontFamily.black,
                  color: colors.ink,
                },
              ]}
            >
              01.
            </Text>
          </View>

          {/* Center Wordmark */}
          <View style={styles.centerSection}>
            <Text
              style={[
                styles.wordmark,
                {
                  fontFamily: typography.fontFamily.black,
                  color: colors.ink,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              GROOVE
            </Text>
            
            {/* Decorative Asterisk */}
            <Text
              style={[
                styles.asterisk,
                {
                  fontFamily: typography.fontFamily.black,
                  color: colors.accent,
                },
              ]}
            >
              *
            </Text>
          </View>

          {/* Bottom Tagline */}
          <View style={styles.bottomSection}>
            <Text
              style={[
                styles.tagline,
                {
                  fontFamily: typography.fontFamily.regular,
                  color: colors.inkSecondary,
                },
              ]}
            >
              Stop thinking, start doing.
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    marginHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  topSection: {
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: -60, // Shift up slightly for editorial balance
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  number: {
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -2,
  },
  wordmark: {
    fontSize: 100, // Large base size, will scale to fit width
    lineHeight: 100,
    letterSpacing: -4,
    width: '100%',
    textTransform: 'uppercase',
  },
  asterisk: {
    fontSize: 48,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'lowercase', // Editorial style
  },
})
