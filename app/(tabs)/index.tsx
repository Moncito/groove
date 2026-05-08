/**
 * GROOVE — TODAY SCREEN
 * -----------------------------------------------------------------------------
 * Modernized: May 2026
 * 
 * DESIGN SYSTEM:
 * - Editorial Typography (Black, Bold, Medium)
 * - Brutalist Color Palette (High contrast Ink/Background)
 * - Premium Components (Glassmorphic cards, Haptic feedback)
 * 
 * REFACTOR LOG:
 * 1. Migrated to react-native-safe-area-context for stable notched layout.
 * 2. Integrated Skia-powered HabitGrid (Mini & Full versions).
 * 3. Hardened Supabase schema interop (Activity vs Output types).
 * 4. Implemented Optimistic Updates for zero-latency habit tracking.
 * 5. Added 'Undo' capability for mistaken check-ins.
 */
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
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { Feather } from '@expo/vector-icons'
import { useAuthStore } from '@/store/auth'
import { useHabits, type Habit } from '@/lib/queries/useHabits'
import { useTodayCheckIns, useAllCheckIns } from '@/lib/queries/useCheckIns'
import { useCheckIn, useUnCheck } from '@/lib/mutations/useCheckIn'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { format } from 'date-fns'
import { calculateStreak } from '@/lib/streak'
import HabitGrid from '@/components/HabitGrid'

interface HabitCardProps {
  habit: Habit
  isChecked: boolean
  isMutating: boolean
  onCheck: (photoUri?: string) => void
  onUnCheck: () => void
}

function HabitCard({ habit, isChecked, isMutating, onCheck, onUnCheck }: HabitCardProps) {
  const router = useRouter()

  const handleCardPress = async () => {
    if (isMutating) return

    if (!isChecked) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } catch (e) {}
      onCheck()
    } else {
      // Direct navigation when already checked
      router.push(`/habit/${habit.id}`)
    }
  }

  const handleUndoPress = async () => {
    if (isMutating || !isChecked) return
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } catch (e) {}
    onUnCheck()
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
    <View style={{ marginBottom: spacing.md }}>
      <Pressable
        onPress={handleCardPress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.habitCard,
          { 
            borderColor: isChecked ? habit.color : colors.border,
            borderWidth: isChecked ? 2 : 1,
            opacity: pressed ? 0.9 : 1,
          }
        ]}
      >
        {/* Main Content Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={[styles.habitIconBox, { backgroundColor: habit.color, marginRight: spacing.md }]}>
            <Feather name={habit.icon as any} size={24} color="white" />
          </View>

          <View style={styles.habitInfo}>
            <Text style={[styles.habitName, { fontFamily: typography.fontFamily.bold }]} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={[styles.habitFrequency, { fontFamily: typography.fontFamily.medium }]}>
              {habit.frequency === 'daily' ? 'Daily' : 'Custom'}
            </Text>
          </View>
          
          <View style={styles.rightAction}>
            {isMutating ? (
              <ActivityIndicator size="small" color={habit.color} />
            ) : (
              <View style={styles.actionIcons}>
                {habit.type === 'output' && !isChecked && (
                  <Feather name="camera" size={18} color={colors.inkTertiary} style={{ marginRight: spacing.sm }} />
                )}
                <TouchableOpacity 
                  onPress={handleUndoPress}
                  disabled={!isChecked}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <View style={[
                    styles.checkIndicator, 
                    { 
                      borderColor: isChecked ? habit.color : colors.border,
                      backgroundColor: isChecked ? habit.color : 'transparent'
                    }
                  ]}>
                    {isChecked && <Feather name="check" size={16} color="white" />}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  )
}

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const checkInMutation = useCheckIn()
  const unCheckMutation = useUnCheck()
  const insets = useSafeAreaInsets()
  
  const { 
    data: habits, 
    isLoading: isHabitsLoading, 
    refetch: refetchHabits,
    isRefetching: isRefetchingHabits 
  } = useHabits(userId)
  
  const { 
    data: todayCheckIns, 
    isLoading: isCheckInsLoading,
    refetch: refetchCheckIns,
    isRefetching: isRefetchingCheckIns
  } = useTodayCheckIns(userId)

  const { data: allCheckIns } = useAllCheckIns(userId)

  const onRefresh = React.useCallback(() => {
    refetchHabits()
    refetchCheckIns()
  }, [refetchHabits, refetchCheckIns])

  const isLoading = isHabitsLoading || isCheckInsLoading
  const isRefreshing = isRefetchingHabits || isRefetchingCheckIns

  const todayHabits = habits || []
  const completedCount = todayCheckIns?.length || 0
  const totalCount = todayHabits.length

  const streak = React.useMemo(() => {
    if (!allCheckIns) return 0
    const dates = allCheckIns.map(c => c.checked_date)
    return calculateStreak(dates)
  }, [allCheckIns])

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
            {format(new Date(), 'EEEE, MMMM do').toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/habit/create')}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xxxl + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.ink} />
        }
      >
        {/* Progress Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.ink }]}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={[styles.summaryLabel, { fontFamily: typography.fontFamily.black, color: colors.inkTertiary }]}>
                CURRENT PROGRESS
              </Text>
              <View style={styles.progressValueRow}>
                <Text style={[styles.progressCount, { fontFamily: typography.fontFamily.black, color: 'white' }]}>
                  {completedCount}
                </Text>
                <Text style={[styles.progressSlash, { fontFamily: typography.fontFamily.black, color: colors.inkTertiary }]}>
                  /
                </Text>
                <Text style={[styles.progressTotal, { fontFamily: typography.fontFamily.black, color: colors.inkSecondary }]}>
                  {totalCount}
                </Text>
              </View>
            </View>
            <View style={[styles.streakPill, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakCount, { fontFamily: typography.fontFamily.black, color: 'white' }]}>
                {streak}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
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
              HOLD FOR PHOTO
            </Text>
          </View>
          
          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather name="target" size={32} color={colors.inkTertiary} />
              </View>
              <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.bold }]}>
                YOUR JOURNEY STARTS HERE
              </Text>
              <Text style={[styles.emptySub, { fontFamily: typography.fontFamily.medium }]}>
                You haven't tracked any habits for today.
              </Text>
              <TouchableOpacity 
                style={[styles.emptyButton, { backgroundColor: colors.ink }]}
                onPress={() => router.push('/habit/create')}
              >
                <Text style={[styles.emptyButtonText, { fontFamily: typography.fontFamily.black }]}>
                  CREATE FIRST HABIT
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayHabits.map((habit) => {
              const isChecked = todayCheckIns?.some((ci) => ci.habit_id === habit.id)
              const isMutating = 
                (checkInMutation.isPending && checkInMutation.variables?.habitId === habit.id) ||
                (unCheckMutation.isPending && unCheckMutation.variables === habit.id)
                
              return (
                <HabitCard 
                  key={habit.id}
                  habit={habit}
                  isChecked={!!isChecked}
                  isMutating={isMutating}
                  onCheck={(photoUri) => checkInMutation.mutate({ habitId: habit.id, photoUri })}
                  onUnCheck={() => unCheckMutation.mutate(habit.id)}
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
  },
  wordmark: {
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -1.5,
  },
  date: {
    fontSize: 11,
    color: colors.inkSecondary,
    letterSpacing: 1,
    marginTop: -2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  summaryCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  progressValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  progressCount: {
    fontSize: 48,
    letterSpacing: -2,
  },
  progressSlash: {
    fontSize: 24,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  progressTotal: {
    fontSize: 24,
    letterSpacing: -1,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakCount: {
    fontSize: 18,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  habitsSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: colors.inkTertiary,
  },
  hintText: {
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'white',
    borderRadius: radius.xl,
    gap: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  habitIconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
    gap: 2,
  },
  habitName: {
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  habitFrequency: {
    fontSize: 11,
    color: colors.inkSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.inkSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 12,
    letterSpacing: 1,
  },
})
