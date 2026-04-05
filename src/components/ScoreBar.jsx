export default function ScoreBar({ label, score }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full">
        <div
          className="h-2 bg-white rounded-full transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}