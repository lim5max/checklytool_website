'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ResultsDisplay } from '@/components/results/ResultsDisplay'
import { toast } from 'sonner'

interface CheckInfo {
  id: string
  title: string
  description?: string
  subject?: string
  class_level?: string
  variant_count: number
  total_questions?: number
}

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checkInfo, setCheckInfo] = useState<CheckInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkId, setCheckId] = useState<string>('')
  
  const highlightSubmissionId = searchParams.get('highlight')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (checkId) {
      loadCheckInfo()
    }
  }, [checkId])

  const loadCheckInfo = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/checks/${checkId}`)
      
      if (!response.ok) {
        throw new Error('Проверочная работа не найдена')
      }

      const data = await response.json()
      setCheckInfo(data.check)
      
    } catch (error) {
      console.error('Error loading check info:', error)
      toast.error('Не удалось загрузить информацию о работе')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!checkInfo) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
            <Button onClick={() => router.push('/dashboard')}>
              Вернуться к списку
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/checks/${checkId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Результаты проверки</h1>
            <p className="text-gray-600 mt-1">{checkInfo.title}</p>
          </div>
        </div>

        {/* Results Display */}
        <ResultsDisplay 
          checkId={checkId}
          checkTitle={checkInfo.title}
          highlightSubmissionId={highlightSubmissionId || undefined}
        />
      </div>
    </div>
  )
}