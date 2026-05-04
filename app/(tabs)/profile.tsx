import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useProfile } from '@/lib/queries/useProfile'
import { useHabits } from '@/lib/queries/useHabits'
import { colors, typography, spacing, radius } from '@/theme/tokens'

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  
  // We need to fetch the profile using the user's ID or username.
  // The useProfile hook currently expects a username. 
  // We'll extract the username from the user metadata if available.
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || ''
  const { data: profile, isLoading: isProfileLoading } = useProfile(username)
  const { data: habits, isLoading: isHabitsLoading } = useHabits(user?.id ?? '')

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      // Navigation redirect is handled in _layout.tsx
    }
  }

  if (isProfileLoading || isHabitsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={[styles.avatarText, { fontFamily: typography.fontFamily.black }]}>
              {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={[styles.displayName, { fontFamily: typography.fontFamily.black }]}>
            {profile?.display_name || 'Anonymous'}
          </Text>
          <Text style={[styles.username, { fontFamily: typography.fontFamily.medium }]}>
            @{profile?.username}
          </Text>
          {profile?.bio && (
            <Text style={[styles.bio, { fontFamily: typography.fontFamily.regular }]}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: typography.fontFamily.black }]}>
            HABITS
          </Text>
          <View style={styles.habitsList}>
            {habits?.length === 0 ? (
              <Text style={[styles.emptyText, { fontFamily: typography.fontFamily.regular }]}>
                No habits yet. Start something new!
              </Text>
            ) : (
              habits?.map((habit) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                    <Text style={{ fontSize: 24 }}>{habit.icon}</Text>
                  </View>
                  <Text style={[styles.habitName, { fontFamily: typography.fontFamily.bold }]}>
                    {habit.name}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.accent }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { fontFamily: typography.fontFamily.bold, color: colors.accent }]}>
              SIGN OUT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: colors.ink,
  },
  avatarText: {
    fontSize: 40,
    color: colors.ink,
  },
  displayName: {
    fontSize: 24,
    color: colors.ink,
  },
  username: {
    fontSize: 16,
    color: colors.inkSecondary,
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: 15,
    color: colors.inkSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.inkTertiary,
    marginBottom: spacing.md,
  },
  habitsList: {
    gap: spacing.sm,
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
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  habitName: {
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontSize: 14,
    color: colors.inkTertiary,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: spacing.xl,
  },
  logoutButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  logoutButtonText: {
    fontSize: 14,
    letterSpacing: 1,
  },
})
