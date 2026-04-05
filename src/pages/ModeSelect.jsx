import { useNavigate } from 'react-router-dom'

export default function ModeSelect() {
  const navigate = useNavigate()

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/parse/', { method: 'POST', body: formData })
    const data = await res.json()

    navigate('/practice', { state: { mode: 'upload', script: data.text } })
  }

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center px-8">
      <h1 className="text-white text-4xl font-bold mb-2">How do you want to practice?</h1>
      <p className="text-gray-400 mb-12">Choose your mode to get started</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">

        {/* Upload */}
        <label className="cursor-pointer border border-gray-700 hover:border-white rounded-2xl p-8 flex flex-col items-center gap-4 transition-all">
          <span className="text-5xl">📁</span>
          <h2 className="text-white text-xl font-semibold">Upload My Script</h2>
          <p className="text-gray-400 text-sm text-center">Upload a PDF, DOCX, or TXT file of your speech</p>
          <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
        </label>

        {/* Generate */}
        <button
          onClick={() => navigate('/practice', { state: { mode: 'generate' } })}
          className="border border-gray-700 hover:border-white rounded-2xl p-8 flex flex-col items-center gap-4 transition-all"
        >
          <span className="text-5xl">🤖</span>
          <h2 className="text-white text-xl font-semibold">Generate a Script</h2>
          <p className="text-gray-400 text-sm text-center">Tell us your topic and we'll write a speech for you to practice</p>
        </button>

        {/* Free speak */}
        <button
          onClick={() => navigate('/practice', { state: { mode: 'free' } })}
          className="border border-gray-700 hover:border-white rounded-2xl p-8 flex flex-col items-center gap-4 transition-all"
        >
          <span className="text-5xl">🎙️</span>
          <h2 className="text-white text-xl font-semibold">Free Speak</h2>
          <p className="text-gray-400 text-sm text-center">Just start talking — we'll analyze whatever you say</p>
        </button>

      </div>
    </div>
  )
}