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
