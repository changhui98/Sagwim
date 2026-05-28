import React, { useMemo, useRef, useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { radius, spacing, fontSize } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

interface Props extends TextInputProps {
  label?: string
  error?: string
  /** true면 눈 아이콘 토글 표시 (비밀번호 입력) */
  isPassword?: boolean
  /** 유효성 상태 테두리 피드백 (success | error | undefined) */
  validationState?: 'success' | 'error'
  /**
   * wrapper View(바깥 컨테이너)에 적용할 스타일.
   * inlineRow 안에서 flex:1 배분이 필요할 때 사용.
   * 기존 style prop은 TextInput에 그대로 전달됨.
   */
  containerStyle?: ViewStyle
}

export function TextField({
  label,
  error,
  isPassword,
  validationState,
  style,
  containerStyle,
  editable = true,
  ...rest
}: Props) {
  const { colors } = useTheme()
  // useRef로 관리: state 변경 시 컴포넌트 리렌더를 유발하지 않아
  // iOS New Architecture에서 secureTextEntry 필드의 포커스 소실 방지.
  // setNativeProps로 TextInput에 직접 주입.
  const showPasswordRef = useRef(false)
  const [showPasswordLabel, setShowPasswordLabel] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const handleTogglePassword = () => {
    const next = !showPasswordRef.current
    showPasswordRef.current = next
    setShowPasswordLabel(next)
    // setNativeProps로 secureTextEntry를 직접 변경 — 리렌더 없이 네이티브에 전달
    inputRef.current?.setNativeProps({ secureTextEntry: !next })
  }

  const styles = useMemo(() => StyleSheet.create({
    wrapper: { marginBottom: spacing.sp4 },
    label: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.sp2 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderRadius: radius.md,
      minHeight: 48,
      paddingHorizontal: spacing.sp3,
    },
    input: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: spacing.sp3 },
    inputDisabled: { backgroundColor: colors.surface3, opacity: 0.7 },
    eyeBtn: { paddingLeft: spacing.sp2 },
    eyeText: { fontSize: fontSize.xs, color: colors.textMuted },
    error: { fontSize: fontSize.xs, color: colors.error, marginTop: spacing.sp1 },
  }), [colors])

  const borderColor =
    validationState === 'success'
      ? colors.success
      : validationState === 'error'
        ? colors.error
        : colors.borderStrong

  // shadow style을 항상 포함하되 opacity로만 토글.
  // style object의 추가/제거가 View 재렌더 → 포커스 소실을 유발하므로
  // 항상 동일한 style 구조를 유지.
  const successShadowOpacity = validationState === 'success' ? 0.25 : 0
  const errorShadowOpacity = validationState === 'error' ? 0.25 : 0

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputRow,
          { borderColor },
          !editable && styles.inputDisabled,
          {
            shadowColor:
              validationState === 'success'
                ? colors.success
                : validationState === 'error'
                  ? colors.error
                  : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: successShadowOpacity || errorShadowOpacity,
            shadowRadius: 4,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          // 초기값만 secureTextEntry로 설정. 이후 토글은 setNativeProps로 처리.
          secureTextEntry={isPassword}
          editable={editable}
          autoCorrect={false}
          spellCheck={false}
          importantForAutofill="no"
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{showPasswordLabel ? '숨기기' : '보기'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

