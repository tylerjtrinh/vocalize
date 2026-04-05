const getCategory = (score) => {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400' }
  if (score >= 75) return { label: 'Good', color: 'text-blue-400' }
  if (score >= 60) return { label: 'Fair', color: 'text-yellow-400' }
  if (score >= 40) return { label: 'Needs Work', color: 'text-orange-400' }
  return { label: 'Poor', color: 'text-red-400' }
}

export default function ScoreBar({ label, score }) {
  const category = getCategory(score)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${category.color}`}>{category.label}</span>
          <span className="text-white font-semibold">{score}/100</span>
        </div>
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