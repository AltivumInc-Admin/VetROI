import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { awsConfig } from './aws-config'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import WelcomePage from './components/welcome/WelcomePage.tsx'
import { DD214InsightsView } from './components/DD214InsightsView.tsx'
import './styles/index.css'
import './styles/DarkTheme.css'

// Configure Amplify
Amplify.configure(awsConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/app" element={<App />} />
          <Route path="/dd214-insights/:documentId" element={<DD214InsightsView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)