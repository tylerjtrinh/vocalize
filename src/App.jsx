import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ModeSelect from './pages/ModeSelect'
import Practice from './pages/Practice'
import Results from './pages/Results'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<ModeSelect />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}