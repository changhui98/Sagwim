const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

const apiOrigin = (() => {
  const match = API_BASE.match(/^(https?:\/\/[^/]+)/)
  return match ? match[1] : ''
})()

/**
 * 서버가 상대경로(/images/...)로 내려주는 이미지 URL에 API origin을 붙여 절대 URL로 변환한다.
 * 이미 절대 URL이면 그대로 반환.
 */
export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  if (!apiOrigin) return imageUrl
  return `${apiOrigin}${imageUrl}`
}
