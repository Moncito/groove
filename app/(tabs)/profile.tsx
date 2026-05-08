/**
 * GROOVE — PROFILE & CONSISTENCY HUB
 * -----------------------------------------------------------------------------
 * Modernized: May 2026
 * 
 * FEATURES:
 * - Unified Mosaic Grid: Aggregated consistency view of all habits.
 * - Progress Detail: Per-habit mini-grids for historical tracking.
 * - Streak Engine: Real-time streak calculation across dates.
 */
import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native'
import { format } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useProfile } from '@/lib/queries/useProfile'
import { useHabits } from '@/lib/queries/useHabits'
import { useAllCheckIns } from '@/lib/queries/useCheckIns'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { HabitGrid } from '@/components/HabitGrid'
import { calculateStreak } from '@/lib/streak'

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const insets = useSafeAreaInsets()
  
  const userId = user?.id ?? ''
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || ''
  
  const [selectedDay, setSelectedDay] = React.useState<any>(null)
  const [isModalVisible, setIsModalVisible] = React.useState(false)

  const { data: profile, isLoading: isProfileLoading } = useProfile(username)
  const { data: habits, isLoading: isHabitsLoading } = useHabits(userId)
  const { data: allCheckIns, isLoading: isAllCheckInsLoading } = useAllCheckIns(userId)

  const { mosaicCheckIns, habitStats } = React.useMemo(() => {
    if (!allCheckIns || !habits) return { mosaicCheckIns: [], habitStats: {} }
    
    const habitColorMap = habits.reduce((acc, h) => {
      acc[h.id] = h.color
      return acc
    }, {} as Record<string, string>)

    const stats: Record<string, { dates: string[]; total: number; streak: number }> = {}
    const dateColorMap: Record<string, { count: number; color: string }> = {}

    allCheckIns.forEach((ci) => {
      const date = ci.checked_date
      const color = habitColorMap[ci.habit_id] || colors.accent

      if (!dateColorMap[date]) {
        dateColorMap[date] = { count: 0, color }
      }
      dateColorMap[date].count += 1
      // If multiple habits on same day, we keep the first color or could blend
      // Mosaic looks best with diverse colors, so first one is fine.

      if (!stats[ci.habit_id]) {
        stats[ci.habit_id] = { dates: [], total: 0, streak: 0 }
      }
      stats[ci.habit_id].dates.push(date)
      stats[ci.habit_id].total += 1
    })

    // Calculate streaks for each habit
    Object.keys(stats).forEach(id => {
      stats[id].streak = calculateStreak(stats[id].dates)
    })

    const mosaic = Object.entries(dateColorMap).map(([date, data]) => ({
      date,
      count: data.count,
      color: data.color
    }))

    return { mosaicCheckIns: mosaic, habitStats: stats }
  }, [allCheckIns, habits])

  const handleDayPress = (day: any) => {
    setSelectedDay(day)
    setIsModalVisible(true)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    }
  }

  if (isProfileLoading || isHabitsLoading || isAllCheckInsLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} size="large" />
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', padding: spacing.xl }]}>
        <Text style={[styles.title, { textAlign: 'center', marginBottom: spacing.md }]}>Session Expired</Text>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.ink }]}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Return to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { borderColor: colors.ink }]}>
            <Text style={[styles.avatarText, { fontFamily: typography.fontFamily.black }]}>
              {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={[styles.displayName, { fontFamily: typography.fontFamily.black }]}>
            {profile?.display_name || 'ANONYMOUS'}
          </Text>
          <Text style={[styles.username, { fontFamily: typography.fontFamily.medium }]}>
            @{profile?.username}
          </Text>
        </View>

        {/* UNIFIED MOSAIC GRID */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
            CONSISTENCY — UNIFIED
          </Text>
          <View style={styles.gridCard}>
            <HabitGrid 
              checkIns={mosaicCheckIns} 
              onPressDay={handleDayPress}
            />
          </View>
        </View>

        {/* INDIVIDUAL HABIT PROGRESS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
            HABITS — PROGRESS
          </Text>
          
          <View style={styles.habitList}>
            {!habits || habits.length === 0 ? (
              <Text style={styles.emptyText}>No habits yet.</Text>
            ) : (
              habits.map((habit) => {
                const stats = habitStats[habit.id] || { dates: [], total: 0, streak: 0 }
                
                return (
                  <TouchableOpacity 
                    key={habit.id} 
                    style={styles.habitProgressCard}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  >
                    <View style={styles.habitCardHeader}>
                      <View style={styles.habitCardInfo}>
                        <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
                          <Feather name={habit.icon as any} size={20} color="white" />
                        </View>
                        <View>
                          <View style={styles.habitNameRow}>
                            <Text style={[styles.habitName, { fontFamily: typography.fontFamily.black }]}>
                              {habit.name.toUpperCase()}
                            </Text>
                            {stats.streak > 0 && (
                              <View style={[styles.streakBadge, { backgroundColor: habit.color }]}>
                                <Text style={styles.streakBadgeText}>🔥 {stats.streak}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.habitTarget, { fontFamily: typography.fontFamily.bold }]}>
                            {habit.frequency.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.habitTotal}>
                        <Text style={[styles.totalCount, { fontFamily: typography.fontFamily.black }]}>
                          {stats.total}
                        </Text>
                        <Text style={[styles.totalLabel, { fontFamily: typography.fontFamily.bold }]}>
                          TOTAL
                        </Text>
                      </View>
                    </View>
                    
                    <HabitGrid 
                      checkInDates={stats.dates} 
                      themeColor={habit.color}
                      cellSize={8}
                    />
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutText, { fontFamily: typography.fontFamily.bold }]}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: selectedDay?.color || colors.accent }]}>
              <Text style={[styles.modalDay, { fontFamily: typography.fontFamily.black }]}>
                {selectedDay ? format(new Date(selectedDay.date), 'EEEE').toUpperCase() : ''}
              </Text>
              <Text style={[styles.modalDate, { fontFamily: typography.fontFamily.black }]}>
                {selectedDay ? format(new Date(selectedDay.date), 'MMM do, yyyy').toUpperCase() : ''}
              </Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalStatRow}>
                <View>
                  <Text style={[styles.modalStatLabel, { fontFamily: typography.fontFamily.black }]}>INTENSITY</Text>
                  <View style={styles.intensityRow}>
                    {[1, 2, 3].map(lvl => (
                      <View 
                        key={lvl}
                        style={[
                          styles.intensityBox,
                          { 
                            backgroundColor: selectedDay?.intensity >= lvl ? (selectedDay.color || colors.accent) : colors.gridEmpty,
                            opacity: selectedDay?.intensity >= lvl ? 1 : 0.3
                          }
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.modalStatLabel, { fontFamily: typography.fontFamily.black }]}>COMPLETED</Text>
                  <Text style={[styles.modalStatValue, { fontFamily: typography.fontFamily.black }]}>{selectedDay?.count || 0}</Text>
                </View>
              </View>

              <Text style={[styles.modalMessage, { fontFamily: typography.fontFamily.regular }]}>
                {selectedDay?.count > 0 
                  ? `You crushed ${selectedDay.count} habit${selectedDay.count > 1 ? 's' : ''} on this day. The mosaic grows!`
                  : "No activity recorded. Every day is a new start."
                }
              </Text>

              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.ink }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.modalCloseText, { fontFamily: typography.fontFamily.black }]}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 40,
    color: colors.ink,
  },
  displayName: {
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -1,
  },
  username: {
    fontSize: 16,
    color: colors.inkSecondary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.inkTertiary,
    marginBottom: spacing.md,
  },
  gridCard: {
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitList: {
    gap: spacing.md,
  },
  habitProgressCard: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  habitCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  habitName: {
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  streakBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  streakBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  habitTarget: {
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 1,
  },
  habitTotal: {
    alignItems: 'flex-end',
  },
  totalCount: {
    fontSize: 20,
    color: colors.ink,
  },
  totalLabel: {
    fontSize: 8,
    color: colors.inkTertiary,
    letterSpacing: 0.5,
  },
  logoutButton: {
    marginTop: spacing.xl,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.accent,
    letterSpacing: 2,
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.inkTertiary,
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.ink,
  },
  modalHeader: {
    padding: spacing.xl,
  },
  modalDay: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    letterSpacing: 1,
  },
  modalDate: {
    fontSize: 24,
    color: 'white',
  },
  modalBody: {
    padding: spacing.xl,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  modalStatLabel: {
    fontSize: 10,
    color: colors.inkTertiary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  modalStatValue: {
    fontSize: 32,
    color: colors.ink,
    marginTop: -4,
  },
  modalMessage: {
    fontSize: 15,
    color: colors.inkSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },
  modalCloseButton: {
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    color: colors.ink,
  },
})
