/**
 * GROOVE — COMMUNITY FEED SCREEN
 * -----------------------------------------------------------------------------
 * Phase 1.4 — Full rewrite
 *
 * Features:
 *   - "GROOVE" wordmark left, search icon right
 *   - Animated search bar slide-down on icon tap
 *   - Infinite scroll feed with FlatList + useInfiniteQuery
 *   - Pull-to-refresh
 *   - Discovery mode: trending check-ins when following nobody
 *   - "New activity ↑" banner via Supabase Realtime
 *   - User search with results overlay
 */
import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated'
import { Feather } from '@expo/vector-icons'
import { useAuthStore } from '@/store/auth'
import { useFollowingIds } from '@/lib/queries/useSocial'
import { useFeed, type FeedItem } from '@/lib/queries/useFeed'
import { useTrendingFeed } from '@/lib/queries/useTrendingFeed'
import { useSearchUsers } from '@/lib/queries/useSearchUsers'
import { useFeedRealtime } from '@/lib/realtime'
import { FeedCard } from '@/components/FeedCard'
import { UserSearchBar } from '@/components/UserSearchBar'
import { UserSearchResult } from '@/components/UserSearchResult'
import { EmptyFeed } from '@/components/EmptyFeed'
import { colors, typography, spacing, radius } from '@/theme/tokens'

// ---------------------------------------------------------------------------
// New Activity Banner
// ---------------------------------------------------------------------------

interface NewActivityBannerProps {
  onPress: () => void
}

function NewActivityBanner({ onPress }: NewActivityBannerProps) {
  return (
    <Animated.View
      entering={SlideInUp.duration(300).springify()}
      exiting={FadeOut.duration(200)}
      style={styles.bannerContainer}
    >
      <Pressable onPress={onPress} style={styles.banner}>
        <Text style={styles.bannerText}>New activity ↑</Text>
      </Pressable>
    </Animated.View>
  )
}

// ---------------------------------------------------------------------------
// Community Screen
// ---------------------------------------------------------------------------

export default function CommunityScreen(): React.JSX.Element {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch following IDs to determine feed mode
  const { data: followingIds = [], isLoading: isFollowingLoading } = useFollowingIds(userId)

  const isDiscoveryMode = followingIds.length === 0

  // Feed data — either personal feed or trending
  const personalFeed = useFeed(followingIds, userId)
  const trendingFeed = useTrendingFeed(userId)

  const activeFeed = isDiscoveryMode ? trendingFeed : personalFeed

  // Search
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery)

  // Realtime
  const { hasNewActivity, refreshFeed } = useFeedRealtime({
    followingIds,
    enabled: !isDiscoveryMode,
  })

  // Flatten infinite query pages into a single array
  const feedItems: FeedItem[] = useMemo(() => {
    if (!activeFeed.data?.pages) return []
    return activeFeed.data.pages.flatMap((page) => page.items)
  }, [activeFeed.data?.pages])

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    activeFeed.refetch()
  }, [activeFeed])

  // Load more (infinite scroll)
  const handleEndReached = useCallback(() => {
    if (activeFeed.hasNextPage && !activeFeed.isFetchingNextPage) {
      activeFeed.fetchNextPage()
    }
  }, [activeFeed])

  // Toggle search
  const toggleSearch = useCallback(() => {
    setSearchVisible((v) => !v)
    if (searchVisible) {
      setSearchQuery('')
    }
  }, [searchVisible])

  // Render each feed card
  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <FeedCard item={item} index={index} />
    ),
    [],
  )

  const keyExtractor = useCallback((item: FeedItem) => item.id, [])

  // Loading state
  const isLoading = isFollowingLoading || activeFeed.isLoading

  const showSearchResults = searchVisible && searchQuery.trim().length >= 2

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>GROOVE</Text>
        <Pressable
          onPress={toggleSearch}
          hitSlop={12}
          style={styles.searchToggle}
        >
          <Feather
            name={searchVisible ? 'x' : 'search'}
            size={22}
            color={colors.ink}
          />
        </Pressable>
      </View>

      {/* Animated Search Bar */}
      {searchVisible && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <UserSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </Animated.View>
      )}

      {/* Search Results Overlay */}
      {showSearchResults && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.searchOverlay}
        >
          {isSearching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="small" color={colors.ink} />
            </View>
          ) : searchResults && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <UserSearchResult user={item} />}
              keyboardShouldPersistTaps="handled"
              style={styles.searchList}
            />
          ) : (
            <View style={styles.searchEmpty}>
              <Text style={styles.searchEmptyText}>No users found</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* New Activity Banner */}
      {hasNewActivity && !showSearchResults && (
        <NewActivityBanner onPress={refreshFeed} />
      )}

      {/* Feed Section Label */}
      {!showSearchResults && !isLoading && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {isDiscoveryMode ? 'DISCOVER' : 'YOUR FEED'}
          </Text>
          {!isDiscoveryMode && (
            <Text style={styles.sectionMeta}>
              Following {followingIds.length}
            </Text>
          )}
        </View>
      )}

      {/* Main Feed */}
      {!showSearchResults && (
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.ink} />
          </View>
        ) : (
          <FlatList
            data={feedItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={activeFeed.isRefetching}
                onRefresh={handleRefresh}
                tintColor={colors.ink}
              />
            }
            ListHeaderComponent={
              isDiscoveryMode && feedItems.length > 0 ? <EmptyFeed /> : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {isDiscoveryMode ? (
                  <EmptyFeed />
                ) : (
                  <View style={styles.emptyNoData}>
                    <Feather name="inbox" size={32} color={colors.inkTertiary} />
                    <Text style={styles.emptyText}>
                      No check-ins yet from people you follow.
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Pull down to refresh, or search for more people to follow.
                    </Text>
                  </View>
                )}
              </View>
            }
            ListFooterComponent={
              activeFeed.isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.inkTertiary} />
                </View>
              ) : null
            }
          />
        )
      )}
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  wordmark: {
    fontFamily: typography.fontFamily.black,
    fontSize: typography.size.wordmark,
    color: colors.ink,
    letterSpacing: typography.letterSpacing.wordmark,
  },
  searchToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },

  // Search overlay
  searchOverlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  searchList: {
    flex: 1,
  },
  searchLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  searchEmpty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  searchEmptyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.inkTertiary,
  },

  // New activity banner
  bannerContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 5,
    alignItems: 'center',
  },
  banner: {
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.black,
    fontSize: 11,
    color: colors.inkTertiary,
    letterSpacing: 2,
  },
  sectionMeta: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.inkTertiary,
    letterSpacing: 0.5,
  },

  // Feed
  feedContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: spacing.xl,
  },
  emptyNoData: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
})
