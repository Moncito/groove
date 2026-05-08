/**
 * GROOVE — HABIT GRID ENGINE
 * -----------------------------------------------------------------------------
 * Powered by: React Native Skia
 * 
 * CAPABILITIES:
 * - High-performance 2D rendering of consistency data.
 * - Dynamic intensity mapping (shading based on activity count).
 * - Multi-theme support (shades from themeColor to gridEmpty).
 * - Flexible layout (weeks, cellSize, cellGap).
 */
import React, { useMemo } from 'react'
import { View, ScrollView, TouchableWithoutFeedback, GestureResponderEvent, Text, StyleSheet } from 'react-native'
import { Canvas, Rect, Group } from '@shopify/react-native-skia'
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { GridDay, generateGridData, getIntensityColor } from '@/lib/grid'
import { colors, radius, spacing } from '@/theme/tokens'

interface HabitGridProps {
  checkInDates?: string[] // Legacy support for simple string arrays
  checkIns?: { date: string; count: number; color?: string }[]
  onPressDay?: (day: GridDay) => void
  themeColor?: string
}

export const HabitGrid = React.memo(({ 
  checkInDates = [], 
  checkIns = [], 
  onPressDay,
  themeColor,
  cellSize = 10,
  cellGap = 2,
  weeks = 53
}: HabitGridProps & { cellSize?: number; cellGap?: number; weeks?: number }): React.JSX.Element => {

  const ROWS = 7
  const GRID_HEIGHT = (cellSize + cellGap) * ROWS
  const GRID_WIDTH = (cellSize + cellGap) * weeks

  // Transform checkInDates into the expected checkIns format if needed
  const normalizedCheckIns = useMemo(() => {
    const counts: Record<string, { count: number; color?: string }> = {}

    const normalize = (dateVal: string | Date): string => {
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal
      }
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Process existing checkIns array if any (now supporting color)
    if (checkIns && checkIns.length > 0) {
      checkIns.forEach(ci => {
        const dateOnly = normalize(ci.date)
        if (!counts[dateOnly]) {
          counts[dateOnly] = { count: 0, color: ci.color }
        }
        counts[dateOnly].count += ci.count
      })
    } else if (checkInDates && checkInDates.length > 0) {
      checkInDates.forEach(date => {
        if (typeof date === 'string') {
          const dateOnly = normalize(date)
          if (!counts[dateOnly]) {
            counts[dateOnly] = { count: 0 }
          }
          counts[dateOnly].count += 1
        }
      })
    }

    return Object.entries(counts).map(([date, data]) => ({ 
      date, 
      count: data.count,
      color: data.color 
    }))
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

    const col = Math.floor(locationX / (cellSize + cellGap))
    const row = Math.floor(locationY / (cellSize + cellGap))
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
    <View style={styles.gridWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        <View>
          {/* Month Labels */}
          <View style={{ height: 16, marginBottom: 8 }}>
            {data.map((day, i) => (
              day.monthLabel ? (
                <Text 
                  key={`month-${i}`}
                  style={[
                    styles.monthLabel,
                    { left: Math.floor(i / ROWS) * (cellSize + cellGap) }
                  ]}
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
                    const x = col * (cellSize + cellGap)
                    const y = row * (cellSize + cellGap)

                    const cellBaseColor = day.color || themeColor || colors.accent
                    const cellColor = day.intensity === 0 ? colors.gridEmpty : cellBaseColor
                    
                    const cellOpacity = (day.intensity > 0)
                      ? 0.4 + (Math.min(day.intensity, 3) * 0.2)
                      : 1

                    return (
                      <Rect
                        key={day.dateString || `day-${index}`}
                        x={x}
                        y={y}
                        width={cellSize}
                        height={cellSize}
                        color={cellColor}
                        opacity={cellOpacity}
                        r={radius.sm / 2}
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

const styles = StyleSheet.create({
  gridWrapper: {
    paddingVertical: spacing.xs,
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.inkTertiary,
    textTransform: 'uppercase',
    position: 'absolute',
  },
})

export default HabitGrid


