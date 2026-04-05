import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/90 backdrop-blur-md border-b border-white/10 flex items-center">
      <div className="max-w-6xl mx-auto px-7 flex items-center justify-between w-full">
        <button
          onClick={() => navigate('/')}
          className="text-white font-bold text-sm tracking-tight bg-none border-none"
        >
          Vocalize
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/start')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/start' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white'
            }`}
          >
            Practice
          </button>
        </div>

        <button
          onClick={() => navigate('/start')}
          className="bg-white text-black text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-80 transition-all"
        >
          Get Started
        </button>
      </div>
    </nav>
  )
}