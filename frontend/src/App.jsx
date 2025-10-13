import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthPage from './components/AuthPage'
import Home from './components/Home'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
