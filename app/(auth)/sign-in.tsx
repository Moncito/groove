import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SignInScreen(): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-md">
        <Text
          style={{ fontFamily: 'Inter_900Black' }}
          className="text-wordmark text-ink tracking-[-1px]"
        >
          GROOVE
        </Text>
        <Text
          style={{ fontFamily: 'Inter_400Regular' }}
          className="text-body text-ink-secondary mt-sm"
        >
          Sign In — coming in Phase 1
        </Text>
      </View>
    </SafeAreaView>
  )
}
