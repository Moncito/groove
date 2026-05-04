import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProfile } from '@/lib/queries/useProfile'
import { useHabits } from '@/lib/queries/useHabits'
import { colors, typography, spacing, radius } from '@/theme/tokens'

export default function PublicProfileScreen(): React.JSX.Element {
  const { username } = useLocalSearchParams<{ username: string }>()
  const router = useRouter()
  
  const { data: profile, isLoading: isProfileLoading } = useProfile(username)
  const { data: habits, isLoading: isHabitsLoading } = useHabits(profile?.id ?? '')

  if (isProfileLoading || isHabitsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.ink} />
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: typography.fontFamily.bold, color: colors.ink }}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.accent }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { fontFamily: typography.fontFamily.bold }]}>← BACK</Text>
        </TouchableOpacity>

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
                This user hasn't created any habits yet.
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 1,
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
})
