'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Submission {
  id: string
  created_at: string
  student_name?: string
  checks?: { title: string }
  status: string
}

export default function TestAIPage() {
  const [submissionId, setSubmissionId] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    loadRecentSubmissions()
  }, [])

  const loadRecentSubmissions = async () => {
    setIsLoadingSubmissions(true)
    try {
      const response = await fetch('/api/recent-submissions')
      const data = await response.json()
      
      if (response.ok) {
        setRecentSubmissions(data.submissions || [])
      } else {
        toast.error(data.error || 'Failed to load submissions')
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  const createTestSubmission = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/create-test-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test submission')
      }

      toast.success('Test submission created successfully!')
      setSubmissionId(data.submission.id)
      loadRecentSubmissions()
      
    } catch (error) {
      console.error('Create error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create test submission')
    } finally {
      setIsCreating(false)
    }
  }

  const testEvaluation = async () => {
    if (!submissionId) {
      toast.error('Please enter a submission ID')
      return
    }

    setIsTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submissionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed')
      }

      setResult(data)
      toast.success('AI evaluation completed successfully!')
      
    } catch (error) {
      console.error('Test error:', error)
      toast.error(error instanceof Error ? error.message : 'Evaluation failed')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>AI Evaluation Test</CardTitle>
          <CardDescription>
            Test the Gemini Flash AI evaluation system for student submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              id="submissionId"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="Enter submission ID to evaluate"
              disabled={isTesting}
              className="flex-1"
            />
            <Button 
              onClick={createTestSubmission}
              disabled={isCreating}
              variant="outline"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create Test'
              )}
            </Button>
          </div>

          <Button 
            onClick={testEvaluation} 
            disabled={isTesting || !submissionId}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              'Test AI Evaluation'
            )}
          </Button>

          {result && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Evaluation Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            Select a submission to test AI evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : recentSubmissions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No recent submissions found</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div 
                  key={submission.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSubmissionId(submission.id)}
                >
                  <div>
                    <div className="font-medium">{submission.checks?.title || 'Unknown Check'}</div>
                    <div className="text-sm text-gray-500">
                      {submission.student_name || 'Unknown Student'} • {new Date(submission.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {submission.status}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSubmissionId(submission.id)
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={loadRecentSubmissions}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}