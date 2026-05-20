import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './components/notificationToast.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import VineAttendancePage from './pages/VineAttendancePage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/vine-attendance" element={<VineAttendancePage />} />
        </Routes>
      </Router>
    </NotificationProvider>
  </StrictMode>
)
