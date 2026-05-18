import { View, Text, StyleSheet } from 'react-native'
import { colors, fontSize } from '../../../src/constants/theme'

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>메시지</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
})
