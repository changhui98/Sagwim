export type UserRole = 'USER' | 'MANAGER' | 'ADMIN'

export interface UserResponse {
  id: string
  username: string
  nickname: string
  userEmail: string
  address: string
  profileImageUrl?: string | null
  provider?: OAuthProvider
  role?: UserRole
  isDeleted?: boolean
  createdDate?: string | null
  modifiedDate?: string | null
}

export type OAuthProvider = 'LOCAL' | 'KAKAO' | 'GOOGLE'

export interface UserDetailResponse {
  id: string
  username: string
  nickname: string
  userEmail: string
  address: string
  role: string
  profileImageUrl?: string | null
  provider?: OAuthProvider
  createdAt: string
  modifiedAt: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface UserUpdateRequest {
  nickname: string
  address: string
  currentPassword: string
  newPassword: string
  profileImageUrl?: string | null
}

export interface EmailChangeRequest {
  newEmail: string
}

export interface EmailChangeConfirmRequest {
  newEmail: string
  code: string
}

export interface ChangeUserRoleRequest {
  role: UserRole
}
