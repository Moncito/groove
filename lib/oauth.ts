import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'

WebBrowser.maybeCompleteAuthSession()

export const signInWithOAuth = async (provider: 'google' | 'github') => {
  const redirectTo = Linking.createURL('/auth-callback')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error) throw error

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

    if (result.type === 'success' && result.url) {
      // PKCE flow — exchange code for session
      const url = new URL(result.url)
      const code = url.searchParams.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url)
        if (exchangeError) throw exchangeError
      } else {
        // Fallback: implicit flow with tokens in hash
        const params = new URLSearchParams(url.hash.replace('#', ''))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          const { error: setSessionError } = await supabase.auth.setSession({ access_token, refresh_token })
          if (setSessionError) throw setSessionError
        } else {
          throw new Error('OAuth: Missing access token or refresh token in response')
        }
      }
    } else if (result.type === 'dismiss' || result.type === 'cancel') {
      throw new Error('OAuth: User cancelled authentication')
    } else {
      throw new Error(`OAuth: Unexpected result type: ${result.type}`)
    }
  }
}