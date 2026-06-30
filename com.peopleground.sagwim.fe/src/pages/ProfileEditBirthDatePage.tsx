import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHandleUnauthorized } from '../hooks/useHandleUnauthorized'
import { useLogout } from '../hooks/useLogout'
import { Navbar } from '../components/Navbar'
import { Header } from '../components/Header'
import { ProfileEditBirthDateForm } from '../components/profile/edit/ProfileEditBirthDateForm'
import pageStyles from './ProfileEditPage.module.css'

export function ProfileEditBirthDatePage() {
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/app/profile/edit'
  const { meRole } = useAuth()
  useHandleUnauthorized()
  const handleLogout = useLogout()

  return (
    <>
      <Navbar role={meRole} onLogout={handleLogout} />
      <Header role={meRole} onLogout={handleLogout} />

      <main className={pageStyles.main}>
        <div className={pageStyles.container}>
          <ProfileEditBirthDateForm returnTo={returnTo} />
        </div>
      </main>
    </>
  )
}
