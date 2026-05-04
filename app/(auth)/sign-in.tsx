import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { colors, typography, spacing } from '@/theme/tokens'
import { signInSchema, type SignInSchema } from '@/lib/validation'
import { signInWithOAuth } from '@/lib/oauth'

export default function SignInScreen(): React.JSX.Element {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSignIn = async (data: SignInSchema) => {
    setIsLoading(true)
    try {
      const { error, data: signInData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        Alert.alert('Error', error.message)
      } else if (signInData.session) {
        router.replace('/(tabs)')
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setIsLoading(false)
    }
  }


  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    try {
      await signInWithOAuth(provider)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Editorial Header */}
          <View style={styles.header}>
            <Text style={[styles.number, { fontFamily: typography.fontFamily.black }]}>
              03.
            </Text>
            <Text style={[styles.title, { fontFamily: typography.fontFamily.black }]}>
              WELCOME{'\n'}BACK
            </Text>
            <View style={styles.accentLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>
                EMAIL
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { fontFamily: typography.fontFamily.regular },
                      errors.email && styles.inputError,
                    ]}
                    placeholder="hello@example.com"
                    placeholderTextColor={colors.inkTertiary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}
              />
              {errors.email && (
                <Text style={[styles.errorText, { fontFamily: typography.fontFamily.medium }]}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>
                PASSWORD
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { fontFamily: typography.fontFamily.regular },
                      errors.password && styles.inputError,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.inkTertiary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                  />
                )}
              />
              {errors.password && (
                <Text style={[styles.errorText, { fontFamily: typography.fontFamily.medium }]}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.ink }]}
              onPress={handleSubmit(onSignIn)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { fontFamily: typography.fontFamily.bold, color: colors.background },
                  ]}
                >
                  SIGN IN
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text
              style={[
                styles.dividerText,
                { fontFamily: typography.fontFamily.medium, color: colors.inkTertiary },
              ]}
            >
              OR CONTINUE WITH
            </Text>
            <View style={styles.line} />
          </View>

          {/* OAuth Options */}
          <View style={styles.oauthRow}>
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={() => handleOAuthSignIn('google')}
            >
              <Text style={[styles.oauthText, { fontFamily: typography.fontFamily.bold }]}>
                GOOGLE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={() => handleOAuthSignIn('github')}
            >
              <Text style={[styles.oauthText, { fontFamily: typography.fontFamily.bold }]}>
                GITHUB
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { fontFamily: typography.fontFamily.regular, color: colors.inkSecondary },
              ]}
            >
              Don't have an account?{' '}
              <Link href="/(auth)/sign-up">
                <Text style={{ color: colors.accent, fontFamily: typography.fontFamily.bold }}>
                  JOIN THE GROOVE
                </Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
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
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.inkSecondary,
    letterSpacing: 1,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: spacing.sm,
    fontSize: 18,
    color: colors.ink,
  },
  inputError: {
    borderBottomColor: colors.accent,
  },
  errorText: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 2,
  },
  submitButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    fontSize: 16,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
    gap: spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  oauthButton: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oauthText: {
    fontSize: 14,
    letterSpacing: 1,
    color: colors.ink,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
})
