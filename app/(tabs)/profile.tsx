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
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Dimensions
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useProfileById } from '@/lib/queries/useProfile'
import { useHabits } from '@/lib/queries/useHabits'
import { useAllCheckIns } from '@/lib/queries/useCheckIns'
import { colors, typography, spacing, radius } from '@/theme/tokens'
import { HabitGrid } from '@/components/HabitGrid'
import { calculateStreak } from '@/lib/streak'
import { ProfileHeader } from '@/components/ProfileHeader'
import * as Haptics from 'expo-haptics'
import { calculateProfileStats } from '@/lib/stats'

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const insets = useSafeAreaInsets()
  
  const userId = user?.id ?? ''
  
  const scrollRef = React.useRef<ScrollView>(null)
  const [selectedDay, setSelectedDay] = React.useState<any>(null)
  const [isModalVisible, setIsModalVisible] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'habits' | 'activity' | 'circles'>('habits')
  const screenWidth = Dimensions.get('window').width

  const { data: profile, isLoading: isProfileLoading } = useProfileById(userId)
  const { data: habits, isLoading: isHabitsLoading } = useHabits(userId)
  const { data: allCheckIns, isLoading: isAllCheckInsLoading } = useAllCheckIns(userId)

  const { mosaicCheckIns, habitStats, profileStats } = React.useMemo(() => {
    if (!allCheckIns || !habits || !profile) {
      return { mosaicCheckIns: [], habitStats: {}, profileStats: { totalDays: 0, totalCheckIns: 0, completionRate: 0 } }
    }
    
    const habitColorMap = habits.reduce((acc, h) => {
      acc[h.id] = h.color
      return acc
    }, {} as Record<string, string>)

    const stats: Record<string, { dates: string[]; total: number; streak: number }> = {}
    const dateHabitsMap: Record<string, { count: number; habits: string[] }> = {}

    allCheckIns.forEach((ci) => {
      const date = ci.checked_date

      if (!dateHabitsMap[date]) {
        dateHabitsMap[date] = { count: 0, habits: [] }
      }
      dateHabitsMap[date].count += 1
      dateHabitsMap[date].habits.push(ci.habit_id)

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

    const mosaic = Object.entries(dateHabitsMap).map(([date, data]) => ({
      date,
      count: data.count,
      color: habitColorMap[data.habits.sort()[0]] || colors.accent
    }))

    const pStats = calculateProfileStats(profile.created_at, allCheckIns, habits.length)

    return { mosaicCheckIns: mosaic, habitStats: stats, profileStats: pStats }
  }, [allCheckIns, habits, profile])

  const handleTabPress = (tab: typeof activeTab, index: number) => {
    setActiveTab(tab)
    scrollRef.current?.scrollTo({ x: index * screenWidth, animated: true })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

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

  if (!user || !profile) {
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[
          { paddingBottom: spacing.xxl + insets.bottom }
        ]} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
        {/* 01. PROFILE IDENTITY */}
        <View className="px-lg">
          <ProfileHeader 
            profile={profile}
            isOwnProfile={true}
            currentUserId={userId}
            stats={profileStats}
          />
        </View>

        {/* 02. UNIFIED MOSAIC GRID (HERO) */}
        <View style={[styles.section, { paddingHorizontal: spacing.lg }]}>
          <View className="flex-row items-center justify-between mb-md">
            <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black, marginBottom: 0 }]}>
              CONSISTENCY — UNIFIED
            </Text>
            <View className="flex-row items-center gap-xs">
              <View className="w-2 h-2 rounded-full bg-accent" />
              <Text style={[styles.sectionTitle, { fontSize: 9, marginBottom: 0 }]}>LIVE MOSAIC</Text>
            </View>
          </View>
          <View style={styles.gridCard}>
            <HabitGrid 
              checkIns={mosaicCheckIns} 
              onPressDay={handleDayPress}
            />
          </View>
        </View>

        {/* 03. TAB SELECTOR */}
        <View className="bg-background border-b border-border px-lg">
          <View className="flex-row">
            {(['habits', 'activity', 'circles'] as const).map((tab, idx) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab, idx)}
                className="flex-1 items-center pt-md pb-lg"
              >
                <Text 
                  style={{ 
                    fontFamily: activeTab === tab ? typography.fontFamily.black : typography.fontFamily.bold,
                    color: activeTab === tab ? colors.ink : colors.inkTertiary,
                    letterSpacing: 1.5,
                    fontSize: 11
                  }}
                >
                  {tab.toUpperCase()}
                </Text>
                {activeTab === tab && (
                  <View className="absolute bottom-[-1] w-full h-[3px] bg-ink" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 04. TAB CONTENT (HORIZONTAL SLIDER) */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false} // Only allow navigation via tab bar for stability
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* TAB 01: HABITS */}
          <View style={{ width: screenWidth }}>
            <View style={[styles.habitList, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
              {!habits || habits.length === 0 ? (
                <View className="py-xxxl items-center">
                  <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.bold }]}>NO HABITS TRACKED YET</Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/habit/create')}
                    className="mt-lg h-12 px-xl rounded-md bg-ink justify-center items-center"
                  >
                    <Text className="color-white font-inter-bold text-label-sm tracking-widest">START TRACKING</Text>
                  </TouchableOpacity>
                </View>
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

          {/* TAB 02: ACTIVITY */}
          <View style={{ width: screenWidth }}>
            <View className="py-xxxl items-center px-lg">
              <Feather name="camera" size={48} color={colors.gridEmpty} />
              <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.bold, marginTop: spacing.lg, textAlign: 'center' }]}>
                NO EVIDENCE POSTED YET
              </Text>
              <Text style={[styles.emptyText, { fontSize: 13, marginTop: spacing.xs, textAlign: 'center' }]}>
                Share proof to build your social credibility.
              </Text>
            </View>
          </View>

          {/* TAB 03: CIRCLES */}
          <View style={{ width: screenWidth }}>
            <View className="py-xxxl items-center px-lg">
              <Feather name="users" size={48} color={colors.gridEmpty} />
              <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.bold, marginTop: spacing.lg, textAlign: 'center' }]}>
                NO CIRCLES JOINED
              </Text>
              <Text style={[styles.emptyText, { fontSize: 13, marginTop: spacing.xs, textAlign: 'center' }]}>
                Connect with others tracking similar goals.
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/explore')}
                className="mt-lg h-12 px-xl rounded-md bg-ink justify-center items-center"
              >
                <Text className="color-white font-inter-bold text-label-sm tracking-widest">FIND CIRCLES</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* 05. ACTIONS */}
        <View className="px-lg">
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: colors.ink, marginTop: spacing.xxxl }]} 
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.ink, fontFamily: typography.fontFamily.bold }]}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
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
