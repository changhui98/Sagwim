import * as SecureStore from 'expo-secure-store'

// FE의 localStorage 키 'sagwim_access_token' 과 일치시킴
export const TOKEN_KEY = 'sagwim_access_token'

/**
 * 저장된 액세스 토큰을 반환합니다.
 * 토큰이 없거나 읽기 실패 시 null을 반환합니다.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch (e) {
    console.warn('[SecureStore] getToken 실패:', e)
    return null
  }
}

/**
 * 액세스 토큰을 Keychain/Keystore에 저장합니다.
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  } catch (e) {
    console.warn('[SecureStore] setToken 실패:', e)
  }
}

/**
 * 저장된 액세스 토큰을 삭제합니다.
 * 로그아웃 또는 401 응답 시 호출합니다.
 */
export const deleteToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch (e) {
    console.warn('[SecureStore] deleteToken 실패:', e)
  }
}
