'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyCheckState } from '@/components/checks/EmptyCheckState'
import { StudentResultsList } from '@/components/checks/StudentResultsList'
import NavigationHeader from '@/components/NavigationHeader'
import { toast } from 'sonner'

interface StudentResult {
  id: string
  name: string
  grade: number
}

interface CheckData {
  id: string
  title: string
  results: StudentResult[]
}

interface CheckPageProps {
  params: Promise<{ id: string }>
}

export default function CheckPage({ params }: CheckPageProps) {
  const router = useRouter()
  const [checkData, setCheckData] = useState<CheckData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkId, setCheckId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (checkId) {
      loadCheckData()
    }
  }, [checkId])

  const loadCheckData = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/checks/${checkId}`)
      
      if (!response.ok) {
        throw new Error('Проверочная работа не найдена')
      }

      const data = await response.json()
      
      // Check if there are any results from the API
      // For now, assuming results come from the API response
      const results = data.check.results || []
      
      setCheckData({
        id: data.check.id,
        title: data.check.title,
        results: results
      })
      
    } catch (error) {
      console.error('Error loading check data:', error)
      toast.error('Не удалось загрузить данные')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!checkData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
          <p className="text-gray-600">Возможно, работа была удалена или у вас нет прав доступа</p>
        </div>
      </div>
    )
  }

  const hasResults = checkData.results && checkData.results.length > 0

  return (
    <div className="min-h-screen bg-white">
      {hasResults ? (
        <div>
          <NavigationHeader 
            title={checkData.title}
            showCloseButton={true}
          />
          <div className="px-4 pb-6">
            <div className="max-w-md mx-auto">
              <StudentResultsList results={checkData.results} />
            </div>
          </div>
        </div>
      ) : (
        <EmptyCheckState title={checkData.title} />
      )}
    </div>
  )
}