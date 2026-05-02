import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function OnboardingScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-md">
        <Text
          style={{ fontFamily: 'Inter_900Black' }}
          className="text-caption text-ink-secondary mb-sm"
        >
          01.
        </Text>
        <Text style={{ fontFamily: 'Inter_900Black' }} className="text-h1-sm text-ink">
          What do you want to build?
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular' }} className="text-body text-ink-secondary mt-sm">
          Stop thinking, start doing.
        </Text>
      </View>
    </SafeAreaView>
  )
}
