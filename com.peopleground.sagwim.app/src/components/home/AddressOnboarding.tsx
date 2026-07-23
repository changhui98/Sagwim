import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { PrimaryButton } from '../PrimaryButton'
import { fontSize, radius, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

const sagwimIconSvg = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="strokeA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A8C0E0"/>
      <stop offset="55%" stop-color="#91A8D0"/>
      <stop offset="100%" stop-color="#6E88BE"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="248" height="248" rx="56"
        fill="none" stroke="#91A8D0" stroke-width="4"/>
  <g stroke="url(#strokeA)" stroke-width="26" stroke-linecap="round" fill="none">
    <path d="M128 78 L72 184"/>
    <path d="M128 78 L184 184"/>
  </g>
  <circle cx="128" cy="78" r="4" fill="#FFFFFF" opacity="0.8"/>
</svg>`

interface AddressOnboardingProps {
  onPressSetAddress: () => void
}

const ANIM_DURATION = 550
const DELAYS = [1200, 2400, 3200, 4000, 4800]
const TRANSLATE_Y_FROM = 14

function useFadeSlideUp(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(TRANSLATE_Y_FROM)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIM_DURATION,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { opacity, transform: [{ translateY }] }
}

/**
 * 주소가 없는 사용자에게 표시되는 온보딩 카드.
 * 웹 GroupListPage 와 동일한 흐름 — 주소 설정 페이지로 보낸다.
 * 웹의 fadeSlideUp(opacity 0→1, translateY 14px→0, 0.55s)을 요소별 순차 지연으로 재현.
 */
export function AddressOnboarding({ onPressSetAddress }: AddressOnboardingProps) {
  const { colors } = useTheme()
  const iconAnim = useFadeSlideUp(DELAYS[0])
  const titleAnim = useFadeSlideUp(DELAYS[1])
  const subtitleAnim = useFadeSlideUp(DELAYS[2])
  const hintAnim = useFadeSlideUp(DELAYS[3])
  const buttonAnim = useFadeSlideUp(DELAYS[4])

  const styles = useMemo(() => StyleSheet.create({
    wrap: { flex: 1, paddingHorizontal: spacing.sp5, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.sp8,
      alignItems: 'center',
      width: '100%',
    },
    iconWrap: { marginBottom: spacing.sp6 },
    title: {
      fontSize: fontSize.xl2,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sp2,
      textAlign: 'center',
    },
    titleHighlight: { color: colors.accent },
    subtitle: {
      fontSize: fontSize.base,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sp6,
    },
    hint: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sp6,
    },
    buttonWrap: { width: '100%' },
    button: { width: '100%' },
  }), [colors])

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Animated.View style={[styles.iconWrap, iconAnim]}>
          <SvgXml xml={sagwimIconSvg} width={72} height={72} />
        </Animated.View>
        <Animated.Text style={[styles.title, titleAnim]}>
          <Text style={styles.titleHighlight}>사귐</Text>은 동네에서 시작돼요
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, subtitleAnim]}>
          먼저 우리 동네를 알려주세요.
        </Animated.Text>
        <Animated.Text style={[styles.hint, hintAnim]}>
          내 동네를 등록하면 가까운 모임이 열려요
        </Animated.Text>
        <Animated.View style={[styles.buttonWrap, buttonAnim]}>
          <PrimaryButton
            label="등록하기"
            onPress={onPressSetAddress}
            style={styles.button}
          />
        </Animated.View>
      </View>
    </View>
  )
}

