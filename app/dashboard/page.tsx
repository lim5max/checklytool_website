'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-nunito font-black text-slate-900 mb-2">
          Добро пожаловать в ChecklyTool
        </h1>
        <p className="text-lg text-slate-600 font-inter">
          Управляйте проверкой работ школьников с помощью ИИ
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>Загрузить работу</span>
            </CardTitle>
            <CardDescription>
              Загрузите новую работу школьника для проверки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/upload">
                Загрузить
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span>Мои работы</span>
            </CardTitle>
            <CardDescription>
              Просмотрите все загруженные и проверенные работы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/assignments">
                Просмотреть
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>Профиль</span>
            </CardTitle>
            <CardDescription>
              Управляйте настройками вашего аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/profile">
                Настройки
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Всего работ</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">Загружено работ для проверки</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Проверено</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">Работ успешно проверено</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>В обработке</CardDescription>
            <CardTitle className="text-3xl font-bold text-orange-600">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">Работ ожидают проверки</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Начало работы</CardTitle>
            <CardDescription>
              Следуйте этим шагам, чтобы начать использовать ChecklyTool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Загрузите работу</h4>
                <p className="text-sm text-slate-600">
                  Выберите файл с работой школьника (PDF, DOC, DOCX, изображения)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-slate-900">ИИ проверит работу</h4>
                <p className="text-sm text-slate-600">
                  Наша система автоматически проанализирует и оценит работу
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Получите результат</h4>
                <p className="text-sm text-slate-600">
                  Просмотрите оценку, баллы и подробный фидбек по работе
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button asChild>
                <Link href="/dashboard/upload">
                  Загрузить первую работу
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}