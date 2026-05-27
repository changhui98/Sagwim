import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { fontSize } from '../../../src/constants/theme'
import { useTheme } from '../../../src/context/ThemeContext'

export default function MessagesScreen() {
  const { colors } = useTheme()

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
    text: {
      fontSize: fontSize.base,
      color: colors.textSecondary,
    },
  }), [colors])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>메시지</Text>
    </View>
  )
}
