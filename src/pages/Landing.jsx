import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="bg-black min-h-screen text-white antialiased">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-36 px-7">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-6">AI Speech Coach</p>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-7 max-w-3xl">
            Become a confident,<br />compelling speaker.
          </h1>
          <p className="text-lg text-gray-400 max-w-md leading-relaxed mb-10">
            Record yourself and get an in-depth analysis of your delivery — tone, pacing, emotion, clarity, and more. Know exactly what to improve.
          </p>
          <button
            onClick={() => navigate('/start')}
            className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:opacity-85 transition-all text-sm"
          >
            Get Started
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-7"><hr className="border-white/10" /></div>

      {/* What we analyze */}
      <section className="py-28 px-7">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">Analysis</p>
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-5">
                Six dimensions.<br />One complete picture.
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Most feedback tools measure one thing. Vocalize analyzes your entire performance simultaneously — giving you a score and actionable insight for each dimension of your speaking.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-0">
              {[
                'Speech pacing and rhythm',
                'Filler word detection',
                'Emotional tone analysis',
                'Clarity and articulation',
                'Confidence scoring',
                'AI coaching feedback',
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-4 px-4 border-b border-white/10 text-sm font-medium">
                  <span>{item}</span>
                  <span className="text-gray-500 text-xs font-medium">{String(i + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-7"><hr className="border-white/10" /></div>

      {/* How it works */}
      <section className="py-28 px-7">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">How it works</p>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">Four steps to better speaking.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { num: '01', title: 'Choose your mode', desc: 'Upload a script, generate one with AI, or jump straight into free speaking — whatever fits your goal.' },
              { num: '02', title: 'Record your speech', desc: 'Hit record and speak naturally. Vocalize captures your audio and transcribes it in real time.' },
              { num: '03', title: 'AI analyzes everything', desc: 'AI evaluates your pacing, tone, clarity, confidence, filler words, and emotional range simultaneously.' },
              { num: '04', title: 'Get personalized feedback', desc: 'Receive targeted coaching built around your performance with clear scores and actionable next steps.' },
            ].map((step) => (
              <div key={step.num}>
                <p className="text-4xl font-extrabold text-white-800 tracking-tight mb-4">{step.num}</p>
                <h3 className="text-sm font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-7"><hr className="border-white/10" /></div>

      {/* Bottom CTA */}
      <section className="py-36 px-7">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-extrabold tracking-tight leading-tight max-w-lg mb-6">
            Start improving your speaking today.
          </h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed mb-10">
            Record your speech and receive your full analysis in under a minute.
          </p>
          <button
            onClick={() => navigate('/start')}
            className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:opacity-85 transition-all text-sm"
          >
            Get Started
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-7"><hr className="border-white/10" /></div>

      {/* Powered by */}
      <div className="py-16 px-7 text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-gray-600 mb-7">Powered by</p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {['Gemini', 'ElevenLabs', 'TwelveLabs', 'FastAPI'].map((logo) => (
            <span key={logo} className="text-sm font-medium text-gray-600 hover:text-gray-300 transition-all cursor-default">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}