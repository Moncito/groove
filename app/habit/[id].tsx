import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useHabit } from '@/lib/queries/useHabits'
import { useCheckIns } from '@/lib/queries/useCheckIns'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { friendlyDate } from '@/lib/dates'
import { calculateStreak } from '@/lib/streak'

export default function HabitDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  
  const { data: habit, isLoading: isHabitLoading } = useHabit(id)
  const { data: checkIns, isLoading: isCheckInsLoading } = useCheckIns(id)

  if (isHabitLoading || isCheckInsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    )
  }

  if (!habit) return null

  const streak = calculateStreak(checkIns?.map(c => c.checked_date) || [])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { fontFamily: typography.fontFamily.bold }]}>← BACK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Habit Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: habit.color + '20' }]}>
            <Text style={{ fontSize: 48 }}>{habit.icon}</Text>
          </View>
          <Text style={[styles.name, { fontFamily: typography.fontFamily.black }]}>
            {habit.name}
          </Text>
          <View style={styles.streakBadge}>
            <Text style={[styles.streakText, { fontFamily: typography.fontFamily.black }]}>
              🔥 {streak} DAY STREAK
            </Text>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
            CHECK-IN HISTORY
          </Text>
          
          <View style={styles.historyList}>
            {checkIns?.length === 0 ? (
              <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.regular }]}>
                No check-ins yet. Time to start!
              </Text>
            ) : (
              [...checkIns!].reverse().map((checkIn) => (
                <View key={checkIn.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyDate, { fontFamily: typography.fontFamily.bold }]}>
                      {friendlyDate(checkIn.checked_date)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.grid2 }]}>
                      <Text style={[styles.statusText, { fontFamily: typography.fontFamily.bold }]}>DONE</Text>
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
                    <Text style={[styles.note, { fontFamily: typography.fontFamily.regular }]}>
                      "{checkIn.note}"
                    </Text>
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
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 32,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  streakBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  streakText: {
    color: colors.accent,
    fontSize: 14,
    letterSpacing: 1,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.inkTertiary,
    marginBottom: spacing.lg,
  },
  historyList: {
    gap: spacing.lg,
  },
  historyItem: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyDate: {
    fontSize: 16,
    color: colors.ink,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 10,
    color: colors.background,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.inkSecondary,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: colors.inkTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
