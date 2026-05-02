import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ExploreScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: 'Inter_900Black' }} className="text-h2-sm text-ink">
          Explore
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular' }} className="text-body text-ink-secondary mt-sm">
          Coming in Phase 2
        </Text>
      </View>
    </SafeAreaView>
  )
}
