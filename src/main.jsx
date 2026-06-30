import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './components/notificationToast.jsx'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import VineAttendancePage from './pages/VineAttendancePage'
import DashboardPage from './pages/DashboardPage'
import MemberSystemPage from './pages/MemberSystemPage'
import SidebarLayout from './layouts/SidebarLayout.jsx'
import CalendarPage from './pages/CalendarPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route element={<SidebarLayout />}>
          
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vine-attendance" element={<VineAttendancePage />} />
            <Route path="/member-system" element={<MemberSystemPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            
          </Route>
          <Route path="/vine-attendanceForm" element={<VineAttendancePage />} />
        </Routes>
      </Router>
    
    </NotificationProvider>
  </StrictMode>
)
