'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { 
  Camera, 
  Plus, 
  X, 
  Upload, 
  User, 
  ChevronLeft, 
  ChevronRight,
  FileImage,
  Trash2,
} from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { FullscreenCameraModal } from './FullscreenCameraModal'
import { cn } from '@/lib/utils'

export interface Student {
  id: string
  name: string
  photos: string[]
}

export interface SubmissionUploaderProps {
  onSubmit?: (students: Student[]) => void
  maxStudents?: number
  maxPhotosPerStudent?: number
  className?: string
}

type ViewMode = 'closed' | 'camera' | 'preview'

export function SubmissionUploader({
  onSubmit,
  maxStudents = 10,
  maxPhotosPerStudent = 5,
  className
}: SubmissionUploaderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('closed')
  const [students, setStudents] = useState<Student[]>([])
  const [activeStudentIndex, setActiveStudentIndex] = useState(0)
  const [newStudentName, setNewStudentName] = useState('')
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const addStudent = useCallback((name: string) => {
    if (students.length >= maxStudents) return

    const newStudent: Student = {
      id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim() || `Student ${students.length + 1}`,
      photos: []
    }

    setStudents(prev => [...prev, newStudent])
    setActiveStudentIndex(students.length)
    setNewStudentName('')
    setShowAddStudent(false)
  }, [students.length, maxStudents])

  // Initialize with first student if none exist
  useEffect(() => {
    if (students.length === 0) {
      addStudent('Student 1')
    }
  }, [students.length, addStudent])

  const removeStudent = useCallback((studentId: string) => {
    setStudents(prev => {
      const newStudents = prev.filter(s => s.id !== studentId)
      
      // Adjust active index if needed
      if (activeStudentIndex >= newStudents.length && newStudents.length > 0) {
        setActiveStudentIndex(newStudents.length - 1)
      } else if (newStudents.length === 0) {
        setActiveStudentIndex(0)
        // Add default student
        setTimeout(() => addStudent('Student 1'), 0)
      }
      
      return newStudents
    })
  }, [activeStudentIndex, addStudent])

  const addPhotoToStudent = useCallback((studentIndex: number, photoDataUrl: string) => {
    setStudents(prev => prev.map((student, index) => {
      if (index === studentIndex && student.photos.length < maxPhotosPerStudent) {
        return {
          ...student,
          photos: [...student.photos, photoDataUrl]
        }
      }
      return student
    }))
  }, [maxPhotosPerStudent])

  const removePhotoFromStudent = useCallback((studentIndex: number, photoIndex: number) => {
    setStudents(prev => prev.map((student, index) => {
      if (index === studentIndex) {
        return {
          ...student,
          photos: student.photos.filter((_, i) => i !== photoIndex)
        }
      }
      return student
    }))
  }, [])


  const scrollToStudent = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return

    const scrollAmount = 200
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }, [])

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit(students)
    }
  }, [students, onSubmit])

  const activeStudent = students[activeStudentIndex]
  const canAddMoreStudents = students.length < maxStudents

  // Closed view - initial state
  if (viewMode === 'closed') {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Upload Student Work</h3>
            <p className="text-sm text-gray-600 mt-1">
              Take photos or upload files for multiple students
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCameraModal(true)}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button 
              variant="outline"
              onClick={() => setViewMode('preview')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Header with student navigation */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Student Submissions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('closed')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Student navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToStudent('left')}
              disabled={students.length <= 3}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex-1 overflow-hidden">
              <div 
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto pb-2"
              >
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={cn(
                      'flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-colors min-w-[120px]',
                      index === activeStudentIndex 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    )}
                    onClick={() => setActiveStudentIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <User className="w-4 h-4 text-gray-500" />
                      {students.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeStudent(student.id)
                          }}
                          className="w-4 h-4 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">{student.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {student.photos.length} photos
                    </Badge>
                  </div>
                ))}

                {/* Add student button */}
                {canAddMoreStudents && (
                  <div className="flex-shrink-0 min-w-[120px]">
                    {showAddStudent ? (
                      <div className="p-3 rounded-lg border bg-white">
                        <Input
                          placeholder="Student name"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newStudentName.trim()) {
                              addStudent(newStudentName)
                            }
                            if (e.key === 'Escape') {
                              setShowAddStudent(false)
                              setNewStudentName('')
                            }
                          }}
                          className="mb-2"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => newStudentName.trim() && addStudent(newStudentName)}
                            disabled={!newStudentName.trim()}
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowAddStudent(false)
                              setNewStudentName('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-[88px] flex flex-col items-center justify-center"
                        onClick={() => setShowAddStudent(true)}
                      >
                        <Plus className="w-4 h-4 mb-1" />
                        <span className="text-xs">Add Student</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToStudent('right')}
              disabled={students.length <= 3}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main content area */}
      <div className="grid gap-4">
        {viewMode === 'preview' && (
          <div className="space-y-4">
            {/* File upload area */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3">
                  Upload Files for {activeStudent?.name}
                </h3>
                <ImageUpload
                  onFilesChange={(uploadedFiles) => {
                    uploadedFiles.forEach(uploadedFile => {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const result = e.target?.result as string
                        if (result && activeStudent) {
                          addPhotoToStudent(activeStudentIndex, result)
                        }
                      }
                      reader.readAsDataURL(uploadedFile.file)
                    })
                  }}
                  maxFiles={maxPhotosPerStudent - (activeStudent?.photos.length || 0)}
                  acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                />
              </CardContent>
            </Card>

            {/* Photo preview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Photos ({activeStudent?.photos.length || 0})
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCameraModal(true)}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>

                {activeStudent?.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {activeStudent.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removePhotoFromStudent(activeStudentIndex, index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Badge className="absolute top-2 left-2 text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileImage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No photos yet</p>
                    <p className="text-sm">Take a photo or upload files to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit button */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Total: {students.reduce((sum, s) => sum + s.photos.length, 0)} photos 
                    from {students.length} students
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={students.every(s => s.photos.length === 0)}
                    className="min-w-[120px]"
                  >
                    Submit All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Fullscreen Camera Modal */}
      <FullscreenCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(photoDataUrl) => {
          if (activeStudent) {
            addPhotoToStudent(activeStudentIndex, photoDataUrl)
          }
        }}
        students={students}
        activeStudentIndex={activeStudentIndex}
        onStudentChange={setActiveStudentIndex}
        maxPhotosPerStudent={maxPhotosPerStudent}
      />
    </div>
  )
}