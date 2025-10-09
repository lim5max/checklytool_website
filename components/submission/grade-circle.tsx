'use client'

interface GradeCircleProps {
	grade: number
	maxGrade?: number
	size?: 'sm' | 'md' | 'lg'
}

export function GradeCircle({ grade, maxGrade = 5, size = 'lg' }: GradeCircleProps) {
	// Определяем цвет на основе оценки
	const getGradeColor = () => {
		const percentage = (grade / maxGrade) * 100

		if (percentage >= 80) {
			return 'from-green-400 to-emerald-600'
		} else if (percentage >= 60) {
			return 'from-yellow-400 to-orange-500'
		} else {
			return 'from-red-400 to-rose-600'
		}
	}

	// Определяем размеры
	const sizeClasses = {
		sm: 'w-16 h-16 text-2xl',
		md: 'w-24 h-24 text-4xl',
		lg: 'w-32 h-32 text-5xl'
	}

	const gradientColor = getGradeColor()

	return (
		<div className="flex items-center justify-center">
			<div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradientColor} p-1 shadow-lg transform transition-transform hover:scale-105`}>
				<div className="w-full h-full bg-white rounded-full flex items-center justify-center">
					<span className={`font-nunito font-black bg-gradient-to-br ${gradientColor} bg-clip-text text-transparent`}>
						{grade}
					</span>
				</div>
			</div>
		</div>
	)
}
