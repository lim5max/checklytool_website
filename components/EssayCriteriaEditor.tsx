'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Edit2 } from 'lucide-react'

interface EssayCriteria {
  id: string
  grade: 2 | 3 | 4 | 5
  title: string
  description: string
  min_errors?: number
  max_errors?: number
}

interface EssayCriteriaEditorProps {
  criteria: EssayCriteria[]
  onCriteriaChange: (criteria: EssayCriteria[]) => void
  isReadOnly?: boolean
}

const defaultCriteria: EssayCriteria[] = [
  {
    id: '5-default',
    grade: 5,
    title: 'Отлично',
    description: 'структура соблюдена, логика ясная, ошибок мало или совсем нет (не более двух грамматических ошибок)',
    min_errors: 0,
    max_errors: 2,
  },
  {
    id: '4-default',
    grade: 4,
    title: 'Хорошо',
    description: 'структура есть, логика в целом понятна, ошибок немного (от 3 до 6 грамматических и синтаксических)',
    min_errors: 3,
    max_errors: 6,
  },
  {
    id: '3-default',
    grade: 3,
    title: 'Удовлетворительно',
    description: 'структура нарушена (например, нет заключения), логика местами сбивается, ошибок достаточно много (более 6 ошибок грамматических и синтаксических)',
    min_errors: 7,
    max_errors: undefined,
  },
  {
    id: '2-default',
    grade: 2,
    title: 'Неудовлетворительно',
    description: 'структура отсутствует, логики почти нет, ошибок очень много, текст трудно читать',
    min_errors: undefined,
    max_errors: undefined,
  }
]

export default function EssayCriteriaEditor({
  criteria = defaultCriteria,
  onCriteriaChange,
  isReadOnly = false
}: EssayCriteriaEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const updateCriteria = (id: string, updates: Partial<EssayCriteria>) => {
    const updated = criteria.map(c => c.id === id ? { ...c, ...updates } : c)
    onCriteriaChange(updated)
  }

  const deleteCriteria = (id: string) => {
    const updated = criteria.filter(c => c.id !== id)
    onCriteriaChange(updated)
  }

  const addNewCriteria = () => {
    const newCriteria: EssayCriteria = {
      id: `custom-${Date.now()}`,
      grade: 3,
      title: 'Новый критерий',
      description: 'Описание критерия оценки',
      min_errors: 0,
      max_errors: 10
    }
    onCriteriaChange([...criteria, newCriteria])
    setEditingId(newCriteria.id)
  }

  const resetToDefault = () => {
    onCriteriaChange(defaultCriteria)
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-nunito font-bold text-lg text-slate-800">
          Критерии оценки сочинений
        </h3>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Свернуть' : 'Настроить'}
            </Button>
            {isExpanded && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewCriteria}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                >
                  По умолчанию
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {criteria.sort((a, b) => b.grade - a.grade).map((criterion) => (
          <Card key={criterion.id} className={`border-l-4 ${
            criterion.grade === 5 ? 'border-l-green-500' :
            criterion.grade === 4 ? 'border-l-blue-500' :
            criterion.grade === 3 ? 'border-l-yellow-500' :
            'border-l-red-500'
          }`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                    criterion.grade === 5 ? 'bg-green-500' :
                    criterion.grade === 4 ? 'bg-blue-500' :
                    criterion.grade === 3 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {criterion.grade}
                  </span>
                  {editingId === criterion.id ? (
                    <Input
                      value={criterion.title}
                      onChange={(e) => updateCriteria(criterion.id, { title: e.target.value })}
                      className="h-8 text-base"
                    />
                  ) : (
                    criterion.title
                  )}
                </CardTitle>

                {!isReadOnly && (isExpanded || editingId === criterion.id) && (
                  <div className="flex items-center gap-1">
                    {editingId === criterion.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Готово
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(criterion.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}

                    {!criterion.id.includes('default') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCriteria(criterion.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {editingId === criterion.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={criterion.description}
                    onChange={(e) => updateCriteria(criterion.id, { description: e.target.value })}
                    placeholder="Описание критерия оценки"
                    className="min-h-[80px]"
                  />

                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Мин. ошибок:</label>
                      <Input
                        type="number"
                        value={criterion.min_errors ?? ''}
                        onChange={(e) => updateCriteria(criterion.id, {
                          min_errors: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-20 h-8"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Макс. ошибок:</label>
                      <Input
                        type="number"
                        value={criterion.max_errors ?? ''}
                        onChange={(e) => updateCriteria(criterion.id, {
                          max_errors: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-20 h-8"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Оценка:</label>
                      <select
                        value={criterion.grade}
                        onChange={(e) => updateCriteria(criterion.id, {
                          grade: parseInt(e.target.value) as 2 | 3 | 4 | 5
                        })}
                        className="h-8 px-2 border border-slate-300 rounded text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={4}>4</option>
                        <option value={3}>3</option>
                        <option value={2}>2</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-700">{criterion.description}</p>
                  {(criterion.min_errors !== undefined || criterion.max_errors !== undefined) && (
                    <p className="text-xs text-slate-500 mt-2">
                      Ошибки: {criterion.min_errors !== undefined ? `от ${criterion.min_errors}` : 'от 0'}
                      {criterion.max_errors !== undefined ? ` до ${criterion.max_errors}` : ' и более'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!isExpanded && criteria.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>Критерии оценки не настроены</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(true)}
            className="mt-2"
          >
            Добавить критерии
          </Button>
        </div>
      )}
    </div>
  )
}