import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PublicProfileScreen(): React.JSX.Element {
  const { username } = useLocalSearchParams<{ username: string }>()

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: 'Inter_900Black' }} className="text-h2-sm text-ink">
          @{username}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular' }} className="text-body text-ink-secondary mt-sm">
          Public profile — coming in Phase 1
        </Text>
      </View>
    </SafeAreaView>
  )
}
