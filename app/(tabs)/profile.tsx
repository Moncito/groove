import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native'
import { format } from 'date-fns'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useProfile } from '@/lib/queries/useProfile'
import { useHabits } from '@/lib/queries/useHabits'
import { useAllCheckIns } from '@/lib/queries/useCheckIns'
import { colors } from '@/theme/tokens'
import { HabitGrid } from '@/components/HabitGrid'
import { calculateStreak } from '@/lib/grid'

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  
  const userId = user?.id ?? ''
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || ''
  
  const [selectedDay, setSelectedDay] = React.useState<any>(null)
  const [isModalVisible, setIsModalVisible] = React.useState(false)

  const { data: profile, isLoading: isProfileLoading } = useProfile(username)
  const { data: habits, isLoading: isHabitsLoading } = useHabits(userId)
  const { data: allCheckIns, isLoading: isAllCheckInsLoading } = useAllCheckIns(userId)

  // Memoize data to prevent crashes and infinite re-renders
  const { allCheckedDates, habitDatesMap } = React.useMemo(() => {
    if (!allCheckIns) return { allCheckedDates: [], habitDatesMap: {} }
    
    const hMap: Record<string, string[]> = {}
    const allDates: string[] = []

    allCheckIns.forEach((ci) => {
      // 1. Collect all dates for the unified grid
      allDates.push(ci.checked_date)

      // 2. Build map for individual habit grids
      if (!hMap[ci.habit_id]) hMap[ci.habit_id] = []
      hMap[ci.habit_id].push(ci.checked_date)
    })
    
    return { allCheckedDates: allDates, habitDatesMap: hMap }
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.ink} size="large" />
      </View>
    )
  }

  // Fallback for missing profile or authentication issues
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-xl font-bold text-ink mb-2">Session Expired</Text>
        <Text className="text-center text-ink-secondary mb-8">Please sign in again to view your profile.</Text>
        <TouchableOpacity
          className="bg-ink px-8 py-4 rounded-xl"
          onPress={() => supabase.auth.signOut()}
        >
          <Text className="text-surface font-bold">Return to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }



  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 rounded-full bg-surface items-center justify-center mb-4 border-4 border-ink">
            <Text className="text-4xl text-ink font-black uppercase">
              {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
            </Text>
          </View>
          
          <Text className="text-3xl font-black text-ink tracking-tight">
            {profile?.display_name || 'ANONYMOUS'}
          </Text>
          <Text className="text-base font-medium text-ink-secondary mb-3">
            @{profile?.username}
          </Text>
          
          {profile?.bio && (
            <Text className="text-center text-ink-secondary px-4 leading-5">
              {profile.bio}
            </Text>
          )}
        </View>

        {/* UNIFIED CONSISTENCY GRID */}
        <View className="mb-12">
          <Text className="text-xs font-medium tracking-widest text-ink-tertiary mb-4 uppercase">
            Consistency — Unified
          </Text>
          <View className="bg-surface-raised p-4 rounded-2xl border-2 border-border">
            <HabitGrid 
              checkInDates={allCheckedDates} 
              onPressDay={handleDayPress}
            />
          </View>
        </View>

        {/* INDIVIDUAL HABIT GRIDS */}
        <View className="mb-12">
          <Text className="text-xs font-medium tracking-widest text-ink-tertiary mb-4 uppercase">
            Habits — Progress
          </Text>
          
          <View className="gap-y-6">
            {!habits || habits.length === 0 ? (
              <Text className="text-sm italic text-ink-tertiary">
                No habits yet. Start something new!
              </Text>
            ) : (
              habits.map((habit) => {
                const habitCheckIns = habitDatesMap[habit.id] || []
                const totalCheckIns = habitCheckIns.length
                const streak = calculateStreak(habitCheckIns)
                
                return (
                  <View key={habit.id} className="bg-surface-raised p-6 rounded-3xl border-2 border-border shadow-sm">
                    <View className="flex-row items-center justify-between mb-6">
                      <View className="flex-row items-center flex-1">
                        <View 
                          className="w-12 h-12 rounded-2xl items-center justify-center mr-4 shadow-sm"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          <Text className="text-2xl">{habit.icon}</Text>
                        </View>
                        <View>
                          <View className="flex-row items-center">
                            <Text className="text-xl font-black text-ink uppercase tracking-tight mr-2">
                              {habit.name}
                            </Text>
                            {streak > 0 && (
                              <View className="bg-accent px-2 py-0.5 rounded-full">
                                <Text className="text-[10px] font-black text-surface uppercase">
                                  🔥 {streak}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs font-bold text-ink-tertiary uppercase tracking-widest">
                            Daily Target
                          </Text>
                        </View>
                      </View>
                      
                      <View className="items-end">
                        <Text className="text-lg font-black text-ink">
                          {totalCheckIns}
                        </Text>
                        <Text className="text-[10px] font-bold text-ink-tertiary uppercase">
                          Total
                        </Text>
                      </View>
                    </View>
                    
                    {/* Individual Grid for this Habit with dynamic theme color */}
                    <HabitGrid 
                      checkInDates={habitCheckIns} 
                      onPressDay={handleDayPress}
                      themeColor={habit.color}
                    />
                  </View>
                )
              })
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="mt-8">
          <TouchableOpacity
            className="h-14 items-center justify-center border-2 border-accent"
            onPress={handleLogout}
          >
            <Text className="text-sm font-bold tracking-widest text-accent uppercase">
              Sign Out
            </Text>
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
          className="flex-1 bg-ink/40 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            className="bg-surface w-full max-w-sm rounded-3xl border-4 border-ink overflow-hidden"
            onPress={e => e.stopPropagation()}
          >
            <View className="bg-accent p-6 border-b-4 border-ink">
              <Text className="text-sm font-black text-ink/60 uppercase tracking-widest mb-1">
                {selectedDay ? format(selectedDay.date, 'EEEE') : ''}
              </Text>
              <Text className="text-3xl font-black text-surface uppercase">
                {selectedDay ? format(selectedDay.date, 'MMM do, yyyy') : ''}
              </Text>
            </View>

            <View className="p-8">
              <View className="flex-row items-center justify-between mb-8">
                <View>
                  <Text className="text-xs font-black text-ink-tertiary uppercase tracking-tighter mb-1">
                    Intensity
                  </Text>
                  <View className="flex-row items-center">
                    {[1, 2, 3, 4].map(lvl => (
                      <View 
                        key={lvl}
                        className="w-4 h-4 rounded-sm mr-1"
                        style={{ 
                          backgroundColor: selectedDay?.intensity >= lvl ? colors.accent : colors.gridEmpty,
                          opacity: selectedDay?.intensity >= lvl ? 1 : 0.3
                        }}
                      />
                    ))}
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-xs font-black text-ink-tertiary uppercase tracking-tighter mb-1">
                    Check-ins
                  </Text>
                  <Text className="text-2xl font-black text-ink">
                    {selectedDay?.count || 0}
                  </Text>
                </View>
              </View>

              <Text className="text-base text-ink-secondary leading-6 mb-8 italic">
                {selectedDay?.count > 0 
                  ? `You crushed ${selectedDay.count} habit${selectedDay.count > 1 ? 's' : ''} on this day. Keep the momentum!`
                  : "No activity recorded for this day. Every day is a new chance to start again."
                }
              </Text>

              <TouchableOpacity
                className="bg-ink h-14 items-center justify-center rounded-xl"
                onPress={() => setIsModalVisible(false)}
              >
                <Text className="text-surface font-black uppercase tracking-widest">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}
