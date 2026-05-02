import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HabitDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: 'Inter_900Black' }} className="text-h2-sm text-ink">
          Habit Detail
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular' }} className="text-body text-ink-secondary mt-sm">
          ID: {id} — coming in Phase 1
        </Text>
      </View>
    </SafeAreaView>
  )
}
