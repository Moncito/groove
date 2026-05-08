import 'react-native-gesture-handler'
import '../global.css'
import 'react-native-reanimated'

import React, { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter'

import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react-native'
// import PostHog, { PostHogProvider } from 'posthog-react-native'
import { SENTRY_DSN } from '@/constants/config'
// import { POSTHOG_API_KEY, POSTHOG_HOST } from '@/constants/config'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { colors } from '@/theme/tokens'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import CustomSplashScreen from '@/components/SplashScreen'

// ---------------------------------------------------------------------------
// Keep splash visible until fonts are loaded
// ---------------------------------------------------------------------------
SplashScreen.preventAutoHideAsync()

// ---------------------------------------------------------------------------
// Sentry
// ---------------------------------------------------------------------------
Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
})

// ---------------------------------------------------------------------------
// TanStack Query
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
})

// ---------------------------------------------------------------------------
// Navigation component — handles routing based on session
// ---------------------------------------------------------------------------
function Navigation(): React.JSX.Element {
  const { session, isLoading } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // User is not signed in, redirect to login
      router.replace('/(auth)')
    } else if (session && inAuthGroup) {
      // User is signed in, redirect to tabs
      router.replace('/(tabs)')
    }
  }, [session, isLoading, segments, router])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="[username]" />
      <Stack.Screen name="habit/[id]" />
      <Stack.Screen name="habit/create" />
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
function RootLayout(): React.JSX.Element | null {
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)

  const [showSplash, setShowSplash] = useState(true)

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    SpaceMono_400Regular,
  })

  // Listen for Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
      })
      .finally(() => {
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      },
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [setSession, setLoading])

  // Hide splash once fonts are ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  if (showSplash) {
    return (
      <CustomSplashScreen
        onFinish={() => setShowSplash(false)}
      />
    )
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" backgroundColor={colors.background} />
          {showSplash ? (
            <CustomSplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <Navigation />
          )}
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(RootLayout)