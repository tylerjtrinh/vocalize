import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-center px-8">
      <h1 className="text-white text-7xl font-bold mb-4">SpeakIQ</h1>
      <p className="text-gray-400 text-xl mb-12 max-w-lg">
        Your AI-powered public speaking coach. Record, analyze, and improve your speaking with personalized feedback.
      </p>
      <button
        onClick={() => navigate('/start')}
        className="bg-white text-black font-semibold text-lg px-10 py-4 rounded-full hover:bg-gray-200 transition-all"
      >
        Start Practicing →
      </button>
    </div>
  )
}