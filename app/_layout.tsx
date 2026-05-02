import '../global.css'

import { useEffect } from 'react'
import { Stack } from 'expo-router'
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
import PostHog, { PostHogProvider } from 'posthog-react-native'
import { SENTRY_DSN, POSTHOG_API_KEY, POSTHOG_HOST } from '@/constants/config'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { colors } from '@/theme/tokens'

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
// PostHog
// ---------------------------------------------------------------------------
const posthog = new PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })

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
// Root layout
// ---------------------------------------------------------------------------
function RootLayout(): React.JSX.Element | null {
  const setSession = useAuthStore((s) => s.setSession)
  const setLoading = useAuthStore((s) => s.setLoading)

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  // Hide splash once fonts are ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="[username]" />
          <Stack.Screen name="habit/[id]" />
        </Stack>
      </PostHogProvider>
    </QueryClientProvider>
  )
}

export default Sentry.wrap(RootLayout)
