import { ProfileEditNicknameForm } from '../../components/profile/edit/ProfileEditNicknameForm'
import { ProfileEditGenderForm } from '../../components/profile/edit/ProfileEditGenderForm'
import { ProfileEditBirthDateForm } from '../../components/profile/edit/ProfileEditBirthDateForm'
import { ProfileEditAddressForm } from '../../components/profile/edit/ProfileEditAddressForm'
import styles from '../SettingsPage.module.css'

// 설정 우측 패널 안에서 인라인으로 열리는 편집 화면 래퍼.
// 사이드바를 유지한 채 <Outlet/> 위치에서만 폼으로 전환된다.
const RETURN_TO = '/app/settings/profile'
const BACK_LABEL = '‹ 뒤로'

export function SettingsProfileEditNickname() {
  return (
    <div className={styles.editPanelCard}>
      <ProfileEditNicknameForm returnTo={RETURN_TO} backLabel={BACK_LABEL} />
    </div>
  )
}

export function SettingsProfileEditGender() {
  return (
    <div className={styles.editPanelCard}>
      <ProfileEditGenderForm returnTo={RETURN_TO} backLabel={BACK_LABEL} />
    </div>
  )
}

export function SettingsProfileEditBirthDate() {
  return (
    <div className={styles.editPanelCard}>
      <ProfileEditBirthDateForm returnTo={RETURN_TO} backLabel={BACK_LABEL} />
    </div>
  )
}

export function SettingsProfileEditAddress() {
  return (
    <div className={styles.editPanelCard}>
      <ProfileEditAddressForm returnTo={RETURN_TO} backLabel={BACK_LABEL} />
    </div>
  )
}
