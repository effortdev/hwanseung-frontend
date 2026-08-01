import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

// const GOOGLE_CLIENT_ID = "970476509867-7l2au3i2f5qhsv69bi7hm7cicbbeebl5.apps.googleusercontent.com";
const GOOGLE_CLIENT_ID = "283175965771-j22rti4go8lilp5nlaa5dk5v4i2c2vca.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
)
