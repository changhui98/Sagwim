// FE com.peopleground.sagwim.fe/src/types/auth.ts 와 호환 유지
// packages/shared 분리 전까지 복붙 관리

export interface SignInRequest {
  username: string
  password: string
}

export interface SignUpRequest {
  username: string
  password: string
  nickname: string
  userEmail: string
}

export interface SocialSignInResponse {
  jwtToken: string
  isNewUser: boolean
  nickname: string
}

export interface EmailConflictData {
  code: string
  message: string
  accessToken: string
  provider: string
}
