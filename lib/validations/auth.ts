import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Введите email')
    .email('Некорректный email'),
  password: z
    .string()
    .min(1, 'Введите пароль')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Введите email')
    .email('Некорректный email'),
  password: z
    .string()
    .min(1, 'Введите пароль')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
  confirmPassword: z
    .string()
    .min(1, 'Подтвердите пароль'),
  fullName: z
    .string()
    .min(1, 'Введите полное имя')
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя слишком длинное'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Введите email')
    .email('Некорректный email'),
})

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Введите новый пароль')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
  confirmPassword: z
    .string()
    .min(1, 'Подтвердите новый пароль'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>