import React, { useMemo } from 'react'
import { View, ScrollView, TouchableWithoutFeedback, GestureResponderEvent, Text } from 'react-native'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { GridDay, generateGridData, getIntensityColor } from '@/lib/grid'
import { colors } from '@/theme/tokens'

interface HabitGridProps {
  checkInDates?: string[] // Legacy support for simple string arrays
  checkIns?: { date: string; count: number }[]
  onPressDay?: (day: GridDay) => void
  themeColor?: string
}

const CELL_SIZE = 10
const GAP = 2
const ROWS = 7
const WEEKS = 53
const GRID_HEIGHT = (CELL_SIZE + GAP) * ROWS
const GRID_WIDTH = (CELL_SIZE + GAP) * WEEKS

export const HabitGrid = React.memo(({ 
  checkInDates = [], 
  checkIns = [], 
  onPressDay,
  themeColor
}: HabitGridProps): React.JSX.Element => {

  // Transform checkInDates into the expected checkIns format if needed
  // We MUST normalize dates to YYYY-MM-DD format for the grid to match them
  const normalizedCheckIns = useMemo(() => {
    const counts: Record<string, number> = {}

    const normalize = (dateVal: string | Date): string => {
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal
      }
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
      // Use local date parts to avoid timezone shifts
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Process string array (e.g. ISO strings from Supabase)
    if (checkInDates && checkInDates.length > 0) {
      checkInDates.forEach(date => {
        if (typeof date === 'string') {
          const dateOnly = normalize(date)
          counts[dateOnly] = (counts[dateOnly] || 0) + 1
        }
      })
    }
    
    // Process existing checkIns array if any
    if (checkIns && checkIns.length > 0) {
      checkIns.forEach(ci => {
        const dateOnly = normalize(ci.date)
        counts[dateOnly] = (counts[dateOnly] || 0) + ci.count
      })
    }

    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  }, [checkInDates, checkIns])

  const data = useMemo(() => generateGridData(normalizedCheckIns), [normalizedCheckIns])

  // Entry animation value using Reanimated
  const scale = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }))

  React.useEffect(() => {
    scale.value = 0
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 120,
    })
  }, [data, scale])

  const handlePress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent
    
    if (typeof locationX !== 'number' || typeof locationY !== 'number') return

    const col = Math.floor(locationX / (CELL_SIZE + GAP))
    const row = Math.floor(locationY / (CELL_SIZE + GAP))
    const index = col * ROWS + row

    if (data && index >= 0 && index < data.length) {
      const day = data[index]
      if (day) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onPressDay?.(day)
      }
    }
  }

  if (!data || data.length === 0) {
    return <View style={{ height: GRID_HEIGHT }} />
  }

  return (
    <View className="py-2">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        <View>
          {/* Month Labels */}
          <View className="flex-row mb-2" style={{ height: 16 }}>
            {data.map((day, i) => (
              day.monthLabel ? (
                <Text 
                  key={`month-${i}`}
                  className="text-[10px] font-bold text-ink-tertiary uppercase absolute"
                  style={{ left: Math.floor(i / ROWS) * (CELL_SIZE + GAP) }}
                >
                  {day.monthLabel}
                </Text>
              ) : null
            ))}
          </View>

          <TouchableWithoutFeedback onPress={handlePress}>
            <Animated.View style={animatedStyle}>
              <Canvas style={{ width: GRID_WIDTH, height: GRID_HEIGHT }}>
                <Group>
                  {data.map((day, index) => {
                    const col = Math.floor(index / ROWS)
                    const row = index % ROWS
                    const x = col * (CELL_SIZE + GAP)
                    const y = row * (CELL_SIZE + GAP)

                    const cellColor = themeColor 
                      ? (day.intensity === 0 ? colors.gridEmpty : themeColor)
                      : getIntensityColor(day.intensity)
                    
                    const cellOpacity = (themeColor && day.intensity > 0)
                      ? 0.3 + (day.intensity * 0.175)
                      : 1

                    return (
                      <Rect
                        key={day.dateString || `day-${index}`}
                        x={x}
                        y={y}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        color={cellColor}
                        opacity={cellOpacity}
                        r={3}
                      />
                    )
                  })}
                </Group>
              </Canvas>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </ScrollView>
    </View>
  )
})

