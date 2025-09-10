'use client'

import { SubmissionUploader, type Student } from '@/components/submission/SubmissionUploader'

export default function TestUploaderPage() {
  const handleSubmit = (students: Student[]) => {
    console.log('Students submitted:', students)
    alert(`Submitted ${students.length} students with ${students.reduce((sum, s) => sum + s.photos.length, 0)} total photos`)
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test SubmissionUploader Component</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800">This is a test page to verify the SubmissionUploader component works correctly.</p>
          <p className="text-yellow-800 text-sm mt-2">
            <strong>Note:</strong> Camera access requires HTTPS or localhost. Click Camera button to open fullscreen modal.
          </p>
        </div>

        <SubmissionUploader
          onSubmit={handleSubmit}
          maxStudents={5}
          maxPhotosPerStudent={3}
        />
      </div>
    </div>
  )
}