import React from 'react'
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
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Feather } from '@expo/vector-icons'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { habitSchema, type HabitSchema } from '@/lib/validation'
import { useCreateHabit } from '@/lib/mutations/useCreateHabit'
import { DEFAULT_HABIT_ICONS, DEFAULT_HABIT_COLORS } from '@/constants/habits'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function CreateHabitScreen(): React.JSX.Element {
  const router = useRouter()
  const createHabit = useCreateHabit()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HabitSchema>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      icon: DEFAULT_HABIT_ICONS[0],
      color: DEFAULT_HABIT_COLORS[0],
      frequency: 'daily',
      customDays: [],
      type: 'activity',
    },
  })

  const formValues = watch()
  const frequency = watch('frequency')
  const customDays = watch('customDays') || []
  const habitType = watch('type')

  const onSubmit = async (data: HabitSchema) => {
    try {
      await createHabit.mutateAsync(data)
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create habit')
    }
  }

  const toggleDay = (dayIndex: number) => {
    const newDays = customDays.includes(dayIndex)
      ? customDays.filter((d) => d !== dayIndex)
      : [...customDays, dayIndex].sort()
    setValue('customDays', newDays)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { fontFamily: typography.fontFamily.bold }]}>CANCEL</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: typography.fontFamily.black }]}>NEW HABIT</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Live Preview Card */}
          <View style={styles.previewContainer}>
            <View style={[styles.previewCard, { borderColor: formValues.color || colors.border }]}>
              <View style={[styles.previewIconBox, { backgroundColor: formValues.color || colors.border }]}>
                <Feather name={formValues.icon as any} size={24} color="white" />
              </View>
              <View style={styles.previewTextContent}>
                <Text style={[styles.previewName, { fontFamily: typography.fontFamily.bold }]} numberOfLines={1}>
                  {formValues.name || 'Habit Name'}
                </Text>
                <Text style={[styles.previewSub, { fontFamily: typography.fontFamily.medium }]}>
                  {formValues.frequency === 'daily' ? 'DAILY' : 'CUSTOM'} • {formValues.type.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.previewCheck, { borderColor: formValues.color || colors.border }]}>
                 <Feather name="check" size={16} color={formValues.color} />
              </View>
            </View>
          </View>

          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>NAME</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="e.g. Morning Run"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor={colors.inkTertiary}
                  />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            {/* Icon Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>ICON</Text>
              <Controller
                control={control}
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
                          { backgroundColor: formValues.color },
                          value !== item && { opacity: 0.3 }
                        ]}
                      >
                        <Feather name={item as any} size={24} color="white" />
                      </TouchableOpacity>
                    )}
                  />
                )}
              />
            </View>

            {/* Color Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>COLOR</Text>
              <Controller
                control={control}
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

            {/* Habit Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>HABIT TYPE</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    habitType === 'activity' && { backgroundColor: colors.ink },
                  ]}
                  onPress={() => setValue('type', 'activity')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { fontFamily: typography.fontFamily.bold },
                      habitType === 'activity' && { color: colors.background },
                    ]}
                  >
                    ACTIVITY
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    habitType === 'output' && { backgroundColor: colors.ink },
                  ]}
                  onPress={() => setValue('type', 'output')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { fontFamily: typography.fontFamily.bold },
                      habitType === 'output' && { color: colors.background },
                    ]}
                  >
                    OUTPUT
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.typeDesc}>
                {habitType === 'activity' 
                  ? 'Simple check-in to track consistency.' 
                  : 'Check-in with proof (photo, link, or attachment).'}
              </Text>
            </View>

            {/* Frequency Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: typography.fontFamily.medium }]}>FREQUENCY</Text>
              <View style={styles.frequencyRow}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'daily' && { backgroundColor: colors.ink },
                  ]}
                  onPress={() => setValue('frequency', 'daily')}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      { fontFamily: typography.fontFamily.bold },
                      frequency === 'daily' && { color: colors.background },
                    ]}
                  >
                    DAILY
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'custom' && { backgroundColor: colors.ink },
                  ]}
                  onPress={() => setValue('frequency', 'custom')}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      { fontFamily: typography.fontFamily.bold },
                      frequency === 'custom' && { color: colors.background },
                    ]}
                  >
                    CUSTOM
                  </Text>
                </TouchableOpacity>
              </View>

              {frequency === 'custom' && (
                <View style={styles.daysRow}>
                  {DAYS.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleDay(index)}
                      style={[
                        styles.dayCircle,
                        customDays.includes(index) && { backgroundColor: colors.ink },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { fontFamily: typography.fontFamily.bold },
                          customDays.includes(index) && { color: colors.background },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.ink }]}
              onPress={handleSubmit(onSubmit)}
              disabled={createHabit.isPending}
            >
              {createHabit.isPending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { fontFamily: typography.fontFamily.bold, color: colors.background },
                  ]}
                >
                  CREATE HABIT
                </Text>
              )}
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 12,
    color: colors.inkSecondary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  previewContainer: {
    marginBottom: spacing.xl,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  previewIconBox: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextContent: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    fontSize: 18,
    color: colors.ink,
  },
  previewSub: {
    fontSize: 12,
    color: colors.inkSecondary,
    letterSpacing: 0.5,
  },
  previewCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: spacing.xl,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 11,
    color: colors.inkSecondary,
    letterSpacing: 1.5,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: spacing.sm,
    fontSize: 20,
    color: colors.ink,
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
  iconOption: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.ink,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  typeButtonText: {
    fontSize: 12,
    letterSpacing: 1,
    color: colors.ink,
  },
  typeDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  frequencyButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  frequencyButtonText: {
    fontSize: 12,
    letterSpacing: 1,
    color: colors.ink,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  dayText: {
    fontSize: 12,
    color: colors.ink,
  },
  submitButton: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    borderRadius: radius.md,
  },
  submitButtonText: {
    fontSize: 16,
    letterSpacing: 1,
  },
})
