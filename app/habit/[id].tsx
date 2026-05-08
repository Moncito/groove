import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useHabit } from '@/lib/queries/useHabits'
import { useCheckIns } from '@/lib/queries/useCheckIns'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { friendlyDate } from '@/lib/dates'
import { calculateStreak, calculateBestStreak } from '@/lib/streak'
import { HabitGrid } from '@/components/HabitGrid'
import * as Haptics from 'expo-haptics'
import { subDays, isAfter, parseISO } from 'date-fns'

export default function HabitDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  
  const { data: habit, isLoading: isHabitLoading } = useHabit(id)
  const { data: checkIns, isLoading: isCheckInsLoading } = useCheckIns(id)

  const handleBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (e) {}
    router.back()
  }

  const handleSettings = () => {
    Alert.alert('Settings', 'Edit/Delete functionality coming soon!')
  }

  if (isHabitLoading || isCheckInsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </View>
    )
  }

  if (!habit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.medium }]}>Habit not found</Text>
      </View>
    )
  }

  const checkInDates = checkIns?.map(c => c.checked_date) || []
  const streak = calculateStreak(checkInDates)
  const bestStreak = calculateBestStreak(checkInDates)
  const totalChecks = checkInDates.length
  
  // Only count checks from the last 30 days for completion rate
  const thirtyDaysAgo = subDays(new Date(), 30)
  const recentChecks = checkInDates.filter(d => isAfter(parseISO(d), thirtyDaysAgo))
  const completionRate = Math.min(100, Math.round((recentChecks.length / 30) * 100))

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color={colors.ink} />
          <Text style={[styles.backText, { fontFamily: typography.fontFamily.bold }]}>BACK</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Feather name="more-horizontal" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xxl + insets.bottom }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: habit.color }]}>
            <Feather name={habit.icon as any} size={48} color="white" />
          </View>
          
          <Text style={[styles.name, { fontFamily: typography.fontFamily.black }]}>
            {habit.name.toUpperCase()}
          </Text>

          {/* Main Stats Area */}
          <View style={styles.streakInfo}>
            <Text style={[styles.streakCount, { fontFamily: typography.fontFamily.black }]}>
              {streak}
            </Text>
            <Text style={[styles.streakEmoji]}>🔥</Text>
          </View>
          <Text style={[styles.streakLabel, { fontFamily: typography.fontFamily.bold }]}>
            DAY STREAK
          </Text>

          {/* Detailed Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: typography.fontFamily.bold }]}>{totalChecks}</Text>
              <Text style={[styles.statLabel, { fontFamily: typography.fontFamily.medium }]}>TOTAL</Text>
            </View>
            <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { fontFamily: typography.fontFamily.bold }]}>{completionRate}%</Text>
              <Text style={[styles.statLabel, { fontFamily: typography.fontFamily.medium }]}>RATE</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily: typography.fontFamily.bold }]}>{bestStreak}</Text>
              <Text style={[styles.statLabel, { fontFamily: typography.fontFamily.medium }]}>BEST</Text>
            </View>
          </View>
        </View>

        {/* Consistency Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
              CONSISTENCY
            </Text>
            <Feather name="calendar" size={14} color={colors.inkTertiary} />
          </View>
          <View style={styles.gridContainer}>
            <HabitGrid 
              checkInDates={checkInDates} 
              themeColor={habit.color}
            />
          </View>
        </View>

        {/* History Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
              HISTORY
            </Text>
            <Text style={[styles.countBadge, { fontFamily: typography.fontFamily.bold, backgroundColor: habit.color + '20', color: habit.color }]}>
              {totalChecks}
            </Text>
          </View>
          
          <View style={styles.historyList}>
            {checkIns?.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Feather name="clock" size={32} color={colors.border} />
                <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.medium }]}>
                  No entries yet
                </Text>
              </View>
            ) : (
              [...checkIns!].reverse().map((checkIn) => (
                <View key={checkIn.id} style={styles.historyItem}>
                  <View style={styles.historyTop}>
                    <View>
                      <Text style={[styles.historyDate, { fontFamily: typography.fontFamily.bold }]}>
                        {friendlyDate(checkIn.checked_date)}
                      </Text>
                      {checkIn.proof_url && (
                        <View style={styles.proofBadge}>
                          <Feather name="camera" size={10} color={habit.color} />
                          <Text style={[styles.proofLabel, { fontFamily: typography.fontFamily.bold, color: habit.color }]}>
                            PROOF ATTACHED
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: habit.color }]}>
                      <Feather name="check" size={14} color="white" />
                    </View>
                  </View>
                  
                  {checkIn.proof_url && (
                    <Image 
                      source={{ uri: checkIn.proof_url }} 
                      style={styles.proofImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  {checkIn.note && (
                    <View style={styles.noteContainer}>
                      <Text style={[styles.note, { fontFamily: typography.fontFamily.medium }]}>
                        {checkIn.note}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  backText: {
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 2,
    marginLeft: -spacing.xs,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  name: {
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakCount: {
    fontSize: 80,
    color: colors.ink,
    letterSpacing: -4,
  },
  streakEmoji: {
    fontSize: 40,
    marginTop: -20,
  },
  streakLabel: {
    fontSize: 12,
    color: colors.inkTertiary,
    letterSpacing: 3,
    marginTop: -12,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    color: colors.ink,
  },
  statLabel: {
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: colors.inkTertiary,
    textTransform: 'uppercase',
  },
  countBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gridContainer: {
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  historyList: {
    gap: spacing.md,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyDate: {
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  proofLabel: {
    fontSize: 9,
    letterSpacing: 1,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofImage: {
    width: '100%',
    height: 300,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
  },
  noteContainer: {
    marginTop: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderColor: colors.border,
  },
  note: {
    fontSize: 15,
    color: colors.inkSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.inkTertiary,
    textAlign: 'center',
  },
})
