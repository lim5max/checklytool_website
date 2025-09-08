'use client'

interface StudentResult {
  id: string
  name: string
  grade: number
}

interface StudentResultsListProps {
  results: StudentResult[]
  className?: string
}

function getGradeColor(grade: number): string {
  switch (grade) {
    case 5:
      return 'text-[#319f43]' // green
    case 4:
      return 'text-[#319f43]' // green  
    case 3:
      return 'text-[#e33629]' // red
    case 2:
      return 'text-[#e33629]' // red
    default:
      return 'text-slate-800'
  }
}

export function StudentResultsList({ results, className = '' }: StudentResultsListProps) {
  return (
    <div className={`flex flex-col gap-2.5 items-center justify-start relative shrink-0 w-full ${className}`}>
      {results.map((result) => (
        <div
          key={result.id}
          className="bg-slate-50 flex flex-col gap-2.5 items-start justify-start px-6 py-[18px] relative rounded-[24px] shrink-0 w-full"
        >
          <div className="flex items-center justify-between relative shrink-0 w-full">
            <div className="flex gap-3 items-center justify-start relative shrink-0">
              <div className="font-medium text-slate-800 text-[18px] leading-[1.6]">
                <p>{result.name}</p>
              </div>
            </div>
            <div className={`font-extrabold text-[20px] leading-[1.2] ${getGradeColor(result.grade)}`}>
              <p>{result.grade}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}