import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors, typography, spacing } from '@/theme/tokens'

export default function AuthIndex(): React.JSX.Element {
  const router = useRouter()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Editorial Header */}
        <View style={styles.header}>
          <Text style={[styles.number, { fontFamily: typography.fontFamily.black }]}>
            02.
          </Text>
          <Text style={[styles.title, { fontFamily: typography.fontFamily.black }]}>
            GET IN{'\n'}THE RHYTHM
          </Text>
          <View style={styles.accentLine} />
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.description,
              { fontFamily: typography.fontFamily.regular, color: colors.inkSecondary },
            ]}
          >
            Groove is a community-based habit tracker designed for those who want to stop
            thinking and start doing.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.ink }]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { fontFamily: typography.fontFamily.bold, color: colors.background },
              ]}
            >
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.ink }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { fontFamily: typography.fontFamily.bold, color: colors.ink },
              ]}
            >
              SIGN IN
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { fontFamily: typography.fontFamily.mono, color: colors.inkTertiary },
            ]}
          >
            v1.0.0 — PHASE 1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  number: {
    fontSize: 48,
    color: colors.ink,
    letterSpacing: -2,
  },
  title: {
    fontSize: 48,
    lineHeight: 48,
    color: colors.ink,
    letterSpacing: -2,
    marginTop: -spacing.xs,
  },
  accentLine: {
    width: 40,
    height: 6,
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: spacing.xxxl,
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    letterSpacing: 1,
  },
  secondaryButton: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    letterSpacing: 1,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
