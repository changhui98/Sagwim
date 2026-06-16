import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { PostCreateModalProvider } from './context/PostCreateModalContext'
import { PostListProvider } from './context/PostListContext'
import { NotificationCountProvider } from './context/NotificationCountContext'
import { MessageCountProvider } from './context/MessageCountContext'
import './styles/variables.css'
import './styles/base.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/animations.css'
import './styles/theme.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationCountProvider>
            <MessageCountProvider>
              <PostCreateModalProvider>
                <PostListProvider>
                  <App />
                </PostListProvider>
              </PostCreateModalProvider>
            </MessageCountProvider>
          </NotificationCountProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
