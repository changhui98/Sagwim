import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { useAuth } from './context/AuthContext'
import { useDevToolsProtection } from './hooks/useDevToolsProtection'
import { usePageTracking } from './hooks/usePageTracking'
import { HomePage } from './pages/HomePage'
import { SignUpPage } from './pages/SignUpPage'
import { PostListPage } from './pages/PostListPage'
import { UserGridPage } from './pages/UserGridPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProfileEditPage } from './pages/ProfileEditPage'
import { ProfileEditNicknamePage } from './pages/ProfileEditNicknamePage'
import { ProfileEditGenderPage } from './pages/ProfileEditGenderPage'
import { ProfileEditBirthDatePage } from './pages/ProfileEditBirthDatePage'
import { ProfileEditAddressPage } from './pages/ProfileEditAddressPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminChartsPage } from './pages/admin/AdminChartsPage'
import { AdminUserListPage } from './pages/admin/AdminUserListPage'
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage'
import { AdminGroupsPage } from './pages/admin/AdminGroupsPage'
import { AdminGroupDetailPage } from './pages/admin/AdminGroupDetailPage'
import { AdminPostListPage } from './pages/admin/AdminPostListPage'
import { AdminImageListPage } from './pages/admin/AdminImageListPage'
import { AdminLogPage } from './pages/admin/AdminLogPage'
import { AdminReportListPage } from './pages/admin/AdminReportListPage'
import { AdminInquiryListPage } from './pages/admin/AdminInquiryListPage'
import { AdminForbiddenWordsPage } from './pages/admin/AdminForbiddenWordsPage'
import { PostCreatePage } from './pages/PostCreatePage'
import { GroupListPage } from './pages/GroupListPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { GroupJoinRequestPage } from './pages/GroupJoinRequestPage'
import { GroupSettingsPage } from './pages/GroupSettingsPage'
import { GroupCreatePage } from './pages/GroupCreatePage'
import { NewGroupsPage } from './pages/NewGroupsPage'
import { PopularGroupsPage } from './pages/PopularGroupsPage'
import { AllGroupsPage } from './pages/AllGroupsPage'
import { DeadlineGroupsPage } from './pages/DeadlineGroupsPage'
import { ThisWeekGroupsPage } from './pages/ThisWeekGroupsPage'
import { PostDetailPage } from './pages/PostDetailPage'
import { MessagesPage } from './pages/MessagesPage'
import { SettingsPage } from './pages/SettingsPage'
import { WithdrawPage } from './pages/WithdrawPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { SearchPage } from './pages/SearchPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { MyActivityPage } from './pages/MyActivityPage'

function App() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  useDevToolsProtection()
  usePageTracking()

  return (
    <div className="page-transition">
    <Routes location={location}>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <HomePage />}
      />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<GroupListPage />} />
        <Route path="/app/posts" element={<PostListPage />} />
        <Route path="/app/posts/new" element={<PostCreatePage />} />
        <Route path="/app/posts/:postId" element={<PostDetailPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/app/users" element={<UserGridPage />} />
        </Route>
        <Route path="/app/groups" element={<GroupListPage />} />
        <Route path="/app/groups/all" element={<AllGroupsPage />} />
        <Route path="/app/groups/new" element={<GroupCreatePage />} />
        <Route path="/app/groups/recent" element={<NewGroupsPage />} />
        <Route path="/app/groups/popular" element={<PopularGroupsPage />} />
        <Route path="/app/groups/deadline" element={<DeadlineGroupsPage />} />
        <Route path="/app/groups/thisweek" element={<ThisWeekGroupsPage />} />
        <Route path="/app/groups/:groupId" element={<GroupDetailPage />} />
        <Route path="/app/groups/:groupId/join" element={<GroupJoinRequestPage />} />
        <Route path="/app/groups/:groupId/settings" element={<GroupSettingsPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/profile/edit" element={<ProfileEditPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
        <Route path="/app/settings/change-password" element={<ChangePasswordPage />} />
        <Route path="/app/settings/withdraw" element={<WithdrawPage />} />
        <Route path="/app/search" element={<SearchPage />} />
        <Route path="/app/notifications" element={<NotificationsPage />} />
        <Route path="/app/activity" element={<MyActivityPage />} />
        <Route path="/app/profile/edit/nickname" element={<ProfileEditNicknamePage />} />
        <Route path="/app/profile/edit/gender" element={<ProfileEditGenderPage />} />
        <Route path="/app/profile/edit/birthdate" element={<ProfileEditBirthDatePage />} />
        <Route path="/app/profile/edit/address" element={<ProfileEditAddressPage />} />
        <Route path="/app/profile/:username" element={<ProfilePage />} />
        <Route path="/app/messages" element={<MessagesPage />} />
        <Route path="/app/messages/:roomId" element={<MessagesPage />} />
        <Route path="/app/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="charts" element={<AdminChartsPage />} />
          <Route path="users" element={<AdminUserListPage />} />
          <Route path="users/:username" element={<AdminUserDetailPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="groups/:groupId" element={<AdminGroupDetailPage />} />
          <Route path="posts" element={<AdminPostListPage />} />
          <Route path="images" element={<AdminImageListPage />} />
          <Route path="reports" element={<AdminReportListPage />} />
          <Route path="forbidden-words" element={<AdminForbiddenWordsPage />} />
          <Route path="inquiries" element={<AdminInquiryListPage />} />
          <Route path="logs" element={<AdminLogPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  )
}

export default App
