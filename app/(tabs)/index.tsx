import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useAuthStore } from '@/store/auth'
import { useHabits, type Habit } from '@/lib/queries/useHabits'
import { useTodayCheckIns } from '@/lib/queries/useCheckIns'
import { useCheckIn } from '@/lib/mutations/useCheckIn'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { format } from 'date-fns'

interface HabitCardProps {
  habit: Habit
  isChecked: boolean
  isMutating: boolean
  onCheck: (photoUri?: string) => void
}

function HabitCard({ habit, isChecked, isMutating, onCheck }: HabitCardProps) {
  const router = useRouter()

  const handlePress = async () => {
    if (isMutating) return

    if (!isChecked) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } catch (e) {}
      onCheck()
    } else {
      router.push(`/habit/${habit.id}`)
    }
  }

  const handleLongPress = async () => {
    if (isChecked || isMutating) return

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') return

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })

      if (!result.canceled) {
        onCheck(result.assets[0].uri)
      }
    } catch (err) {}
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[
        styles.habitCard,
        { 
          borderColor: isChecked ? colors.accent : colors.border,
          borderWidth: isChecked ? 3 : 2
        }
      ]}
    >
      <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
        <Text style={{ fontSize: 24 }}>{habit.icon}</Text>
      </View>
      <View style={styles.habitInfo}>
        <Text style={[styles.habitName, { fontFamily: typography.fontFamily.bold }]}>
          {habit.name}
        </Text>
        <Text style={[styles.habitFrequency, { fontFamily: typography.fontFamily.medium }]}>
          {habit.frequency === 'daily' ? 'Daily' : 'Custom'}
        </Text>
      </View>
      
      <View style={styles.rightAction}>
        {isMutating ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <View style={[
            styles.checkIndicator, 
            { 
              backgroundColor: isChecked ? colors.accent : 'transparent',
              borderColor: isChecked ? colors.accent : colors.border
            }
          ]}>
            {isChecked && <Text style={styles.checkIcon}>✓</Text>}
          </View>
        )}
      </View>
    </Pressable>
  )
}

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const checkInMutation = useCheckIn()
  
  const { 
    data: habits, 
    isLoading: isHabitsLoading, 
    refetch: refetchHabits,
    isRefetching: isRefetchingHabits 
  } = useHabits(userId)
  
  const { 
    data: checkIns, 
    isLoading: isCheckInsLoading,
    refetch: refetchCheckIns,
    isRefetching: isRefetchingCheckIns
  } = useTodayCheckIns(userId)

  const onRefresh = React.useCallback(() => {
    refetchHabits()
    refetchCheckIns()
  }, [refetchHabits, refetchCheckIns])

  const isLoading = isHabitsLoading || isCheckInsLoading
  const isRefreshing = isRefetchingHabits || isRefetchingCheckIns

  const todayHabits = habits || []
  const completedCount = checkIns?.length || 0
  const totalCount = todayHabits.length

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.wordmark, { fontFamily: typography.fontFamily.black }]}>
            GROOVE
          </Text>
          <Text style={[styles.date, { fontFamily: typography.fontFamily.medium }]}>
            {format(new Date(), 'EEEE, MMMM do')}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/habit/create')}
        >
          <Text style={[styles.addButtonText, { fontFamily: typography.fontFamily.bold }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.ink} />
        }
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.ink }]}>
          <Text style={[styles.summaryTitle, { fontFamily: typography.fontFamily.black, color: colors.background }]}>
            TODAY'S PROGRESS
          </Text>
          <View style={styles.progressRow}>
            <Text style={[styles.progressCount, { fontFamily: typography.fontFamily.black, color: colors.background }]}>
              {completedCount}/{totalCount}
            </Text>
            <Text style={[styles.progressLabel, { fontFamily: typography.fontFamily.medium, color: colors.inkTertiary }]}>
              HABITS DONE
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: colors.accent 
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
              MY HABITS
            </Text>
            <Text style={[styles.hintText, { fontFamily: typography.fontFamily.medium }]}>
              Hold for photo
            </Text>
          </View>
          
          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.regular }]}>
                No habits for today.
              </Text>
              <TouchableOpacity onPress={() => router.push('/habit/create')}>
                <Text style={[styles.createLink, { fontFamily: typography.fontFamily.bold }]}>
                  Create your first habit
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayHabits.map((habit) => {
              const isChecked = checkIns?.some((ci) => ci.habit_id === habit.id)
              const isMutating = checkInMutation.isPending && checkInMutation.variables?.habitId === habit.id
              
              return (
                <HabitCard 
                  key={habit.id}
                  habit={habit}
                  isChecked={!!isChecked}
                  isMutating={isMutating}
                  onCheck={(photoUri) => checkInMutation.mutate({ habitId: habit.id, photoUri })}
                />
              )
            })
          )}
        </View>
      </ScrollView>
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
  wordmark: {
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -1,
  },
  date: {
    fontSize: 12,
    color: colors.inkSecondary,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 24,
    marginTop: -2,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressCount: {
    fontSize: 32,
  },
  progressLabel: {
    fontSize: 12,
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  habitsSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.inkTertiary,
  },
  hintText: {
    fontSize: 10,
    color: colors.inkTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  habitIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    color: colors.ink,
  },
  habitFrequency: {
    fontSize: 12,
    color: colors.inkSecondary,
    textTransform: 'uppercase',
  },
  rightAction: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIndicator: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: colors.background,
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.inkSecondary,
  },
  createLink: {
    fontSize: 16,
    color: colors.accent,
  },
})
