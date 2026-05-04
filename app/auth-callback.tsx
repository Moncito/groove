import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        let timeoutId: ReturnType<typeof setTimeout> | null = null

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                if (timeoutId) clearTimeout(timeoutId)
                if (mounted) {
                    router.replace('/(tabs)')
                }
            }
        })

        // Timeout fallback: if SIGNED_IN doesn't fire within 10s, show error
        timeoutId = setTimeout(() => {
            if (mounted) {
                setError('Authentication timeout. Please try again.')
            }
        }, 10000)

        return () => {
            mounted = false
            if (timeoutId) clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [])

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        marginBottom: 20,
        color: '#c41e3a',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderRadius: 6,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
})