import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ScrollToTop } from './components/ScrollToTop'
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
import { AdminFaqPage } from './pages/admin/AdminFaqPage'
import { PostCreatePage } from './pages/PostCreatePage'
import { CreateSelectPage } from './pages/CreateSelectPage'
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
import { ServiceHomePage } from './pages/ServiceHomePage'
import { SettingsPage } from './pages/SettingsPage'
import { SettingsOverviewPage } from './pages/SettingsOverviewPage'
import { SettingsProfilePage } from './pages/SettingsProfilePage'
import { SettingsSupportPage } from './pages/SettingsSupportPage'
import {
  SettingsProfileEditNickname,
  SettingsProfileEditGender,
  SettingsProfileEditBirthDate,
  SettingsProfileEditAddress,
} from './pages/settings/SettingsProfileEditPanels'
import { WithdrawPage } from './pages/WithdrawPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { SearchPage } from './pages/SearchPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { MyActivityPage } from './pages/MyActivityPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { FaqPage } from './pages/FaqPage'

function App() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  useDevToolsProtection()
  usePageTracking()

  return (
    <div className="page-transition">
    <ScrollToTop />
    <Routes location={location}>
      <Route path="/" element={<ServiceHomePage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <HomePage />}
      />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/app" element={<ServiceHomePage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app/create" element={<CreateSelectPage />} />
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
        {/* 구 프로필 편집 화면은 설정의 프로필 편집으로 통합 — 직접 접근 시 리다이렉트 */}
        <Route path="/app/profile/edit" element={<Navigate to="/app/settings/profile" replace />} />
        <Route path="/app/settings" element={<SettingsPage />}>
          <Route index element={<SettingsOverviewPage />} />
          <Route path="profile" element={<SettingsProfilePage />} />
          <Route path="profile/nickname" element={<SettingsProfileEditNickname />} />
          <Route path="profile/gender" element={<SettingsProfileEditGender />} />
          <Route path="profile/birthdate" element={<SettingsProfileEditBirthDate />} />
          <Route path="profile/address" element={<SettingsProfileEditAddress />} />
          <Route path="support" element={<SettingsSupportPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
        </Route>
        <Route path="/app/search" element={<SearchPage />} />
        <Route path="/app/notifications" element={<NotificationsPage />} />
        <Route path="/app/activity" element={<MyActivityPage />} />
        <Route path="/app/profile/edit/nickname" element={<Navigate to="/app/settings/profile/nickname" replace />} />
        <Route path="/app/profile/edit/gender" element={<Navigate to="/app/settings/profile/gender" replace />} />
        <Route path="/app/profile/edit/birthdate" element={<Navigate to="/app/settings/profile/birthdate" replace />} />
        <Route path="/app/profile/edit/address" element={<Navigate to="/app/settings/profile/address" replace />} />
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
          <Route path="faqs" element={<AdminFaqPage />} />
          <Route path="logs" element={<AdminLogPage />} />
        </Route>
      </Route>
      <Route path="/about" element={<ComingSoonPage title="회사 소개" />} />
      <Route path="/notice" element={<ComingSoonPage title="공지사항" />} />
      <Route path="/support" element={<ComingSoonPage title="고객센터" />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/inquiry" element={<ComingSoonPage title="1:1 문의" />} />
      <Route path="/terms" element={<ComingSoonPage title="이용약관" />} />
      <Route path="/privacy" element={<ComingSoonPage title="개인정보처리방침" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  )
}

export default App
