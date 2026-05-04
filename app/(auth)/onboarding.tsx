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
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Notifications from 'expo-notifications'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { profileSchema, habitSchema, type ProfileSchema, type HabitSchema } from '@/lib/validation'
import { useUpdateProfile } from '@/lib/mutations/useUpdateProfile'
import { useCreateHabit } from '@/lib/mutations/useCreateHabit'
import { DEFAULT_HABIT_ICONS, DEFAULT_HABIT_COLORS } from '@/constants/habits'

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const updateProfile = useUpdateProfile()
  const createHabit = useCreateHabit()

  // --- Step 1: Profile Form ---
  const profileForm = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      display_name: '',
      bio: '',
      avatar_url: '',
    },
  })

  // --- Step 2: Habit Form ---
  const habitForm = useForm<HabitSchema>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      icon: DEFAULT_HABIT_ICONS[0],
      color: DEFAULT_HABIT_COLORS[0],
      frequency: 'daily',
    },
  })

  const onProfileSubmit = async (data: ProfileSchema) => {
    try {
      await updateProfile.mutateAsync(data)
      setStep(1)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile')
    }
  }

  const onHabitSubmit = async (data: HabitSchema) => {
    try {
      await createHabit.mutateAsync(data)
      setStep(2)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create habit')
    }
  }

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Notifications',
        'You can always enable notifications later in your device settings.'
      )
    }
    // Finish onboarding
    router.replace('/(tabs)')
  }

  const renderStep0 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={[styles.number, { fontFamily: typography.fontFamily.black }]}>01.</Text>
        <Text style={[styles.title, { fontFamily: typography.fontFamily.black }]}>
          CREATE YOUR{'\n'}IDENTITY
        </Text>
        <View style={styles.accentLine} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>USERNAME</Text>
          <Controller
            control={profileForm.control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, profileForm.formState.errors.username && styles.inputError]}
                placeholder="johndoe"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
              />
            )}
          />
          {profileForm.formState.errors.username && (
            <Text style={styles.errorText}>{profileForm.formState.errors.username.message}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>DISPLAY NAME</Text>
          <Controller
            control={profileForm.control}
            name="display_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, profileForm.formState.errors.display_name && styles.inputError]}
                placeholder="John Doe"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {profileForm.formState.errors.display_name && (
            <Text style={styles.errorText}>{profileForm.formState.errors.display_name.message}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>BIO</Text>
          <Controller
            control={profileForm.control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, profileForm.formState.errors.bio && styles.inputError]}
                placeholder="Tell us about yourself..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.ink }]}
          onPress={profileForm.handleSubmit(onProfileSubmit)}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background, fontFamily: typography.fontFamily.bold }]}>
              CONTINUE
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={[styles.number, { fontFamily: typography.fontFamily.black }]}>02.</Text>
        <Text style={[styles.title, { fontFamily: typography.fontFamily.black }]}>
          START YOUR{'\n'}FIRST HABIT
        </Text>
        <View style={styles.accentLine} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>HABIT NAME</Text>
          <Controller
            control={habitForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, habitForm.formState.errors.name && styles.inputError]}
                placeholder="Morning Meditation"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {habitForm.formState.errors.name && (
            <Text style={styles.errorText}>{habitForm.formState.errors.name.message}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>ICON</Text>
          <Controller
            control={habitForm.control}
            name="icon"
            render={({ field: { onChange, value } }) => (
              <FlatList
                data={DEFAULT_HABIT_ICONS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => onChange(item)}
                    style={[
                      styles.iconOption,
                      value === item && { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>COLOR</Text>
          <Controller
            control={habitForm.control}
            name="color"
            render={({ field: { onChange, value } }) => (
              <View style={styles.colorGrid}>
                {DEFAULT_HABIT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => onChange(color)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      value === color && styles.colorOptionSelected,
                    ]}
                  />
                ))}
              </View>
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.ink }]}
          onPress={habitForm.handleSubmit(onHabitSubmit)}
          disabled={createHabit.isPending}
        >
          {createHabit.isPending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background, fontFamily: typography.fontFamily.bold }]}>
              CREATE HABIT
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={[styles.stepContainer, { justifyContent: 'center' }]}>
      <View style={styles.header}>
        <Text style={[styles.number, { fontFamily: typography.fontFamily.black }]}>03.</Text>
        <Text style={[styles.title, { fontFamily: typography.fontFamily.black }]}>
          STAY ON{'\n'}TRACK
        </Text>
        <View style={styles.accentLine} />
      </View>

      <Text style={[styles.description, { fontFamily: typography.fontFamily.regular }]}>
        Enable notifications to get daily reminders and see when your friends are crushing it.
      </Text>

      <View style={styles.form}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.ink }]}
          onPress={requestNotifications}
        >
          <Text style={[styles.buttonText, { color: colors.background, fontFamily: typography.fontFamily.bold }]}>
            ENABLE NOTIFICATIONS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={[styles.secondaryButtonText, { fontFamily: typography.fontFamily.bold }]}>
            MAYBE LATER
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  stepContainer: {
    flex: 1,
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
  description: {
    fontSize: 18,
    color: colors.inkSecondary,
    marginBottom: spacing.xxl,
    lineHeight: 24,
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
    fontFamily: typography.fontFamily.regular,
  },
  inputError: {
    borderBottomColor: colors.accent,
  },
  errorText: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 2,
    fontFamily: typography.fontFamily.medium,
  },
  primaryButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 1,
  },
  secondaryButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  secondaryButtonText: {
    fontSize: 14,
    letterSpacing: 1,
    color: colors.ink,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.ink,
  },
})
