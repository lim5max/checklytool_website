#!/usr/bin/env node

/**
 * Скрипт для прохождения теста T-Bank №6 (рекуррентные платежи)
 *
 * ПРАВИЛЬНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ согласно требованиям T-Bank:
 * 1. Создать родительский CC-платеж с Recurrent=Y и CustomerKey → получить RebillId
 * 2. Создать дочерний COF-платеж БЕЗ Recurrent и CustomerKey → получить PaymentId
 * 3. Вызвать Charge с PaymentId (из COF) и RebillId (из CC)
 *
 * ИНСТРУКЦИЯ:
 * 1. Оплатите подписку через сайт (тест №5) → получите RebillId
 * 2. Посмотрите логи на сервере:
 *    pm2 logs checklytool | grep -E "RebillId" | tail -10
 * 3. Найдите RebillId из оплаты
 * 4. Вставьте RebillId ниже в константу
 * 5. Запустите: node tbank_test_6_correct.js
 * 6. Нажмите "Проверить" в тестах T-Bank
 */

const crypto = require('crypto')

// Конфигурация T-Bank
const TERMINAL_KEY = '1757689436304DEMO'
const PASSWORD = 'WFgr%waXvmeK3n%j'
const API_URL = 'https://securepay.tinkoff.ru/v2'

// ===== ЗАМЕНИТЕ ЭТО ЗНАЧЕНИЕ =====
// RebillId из webhook (из логов после оплаты через сайт)
const REBILL_ID = '1761673723009' // ← ЗАМЕНИТЕ!
// ==================================

// Параметры тестового платежа
const AMOUNT = 10000 // 100 рублей в копейках
const ORDER_ID = `TEST_CHARGE_${Date.now()}`
const DESCRIPTION = 'Тестовое автосписание - Тест №6'

/**
 * Генерация токена для T-Bank API
 */
function generateToken(params) {
	const paramsWithPassword = { ...params, Password: PASSWORD }

	const values = Object.keys(paramsWithPassword)
		.filter(key =>
			key !== 'Token' &&
			key !== 'Receipt' &&
			key !== 'DATA' &&
			paramsWithPassword[key] != null
		)
		.sort()
		.map(key => paramsWithPassword[key])
		.join('')

	return crypto.createHash('sha256').update(values).digest('hex')
}

/**
 * Шаг 1: Создать COF-платеж через Init (БЕЗ Recurrent и CustomerKey)
 */
async function createCOFPayment() {
	console.log('\n' + '='.repeat(60))
	console.log('ШАГ 1: Создание COF-платежа (Init без Recurrent/CustomerKey)')
	console.log('='.repeat(60))

	const params = {
		TerminalKey: TERMINAL_KEY,
		Amount: AMOUNT,
		OrderId: ORDER_ID,
		Description: DESCRIPTION,
		// ВАЖНО: НЕ передаем Recurrent и CustomerKey - это COF-платеж!
	}

	const token = generateToken(params)
	const body = { ...params, Token: token }

	console.log('\n[Init Request]')
	console.log(JSON.stringify(body, null, 2))
	console.log('')

	const response = await fetch(`${API_URL}/Init`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	const data = await response.json()

	console.log('[Init Response]')
	console.log(JSON.stringify(data, null, 2))
	console.log('')

	if (!data.Success) {
		console.error('❌ ОШИБКА в Init:', data.Message || data.ErrorCode)
		throw new Error(`Init failed: ${data.ErrorCode}`)
	}

	console.log('✅ COF-платеж создан успешно')
	console.log(`PaymentId: ${data.PaymentId}`)
	console.log('')

	return data.PaymentId
}

/**
 * Шаг 2: Выполнить Charge с PaymentId и RebillId
 */
async function chargePayment(paymentId) {
	console.log('\n' + '='.repeat(60))
	console.log('ШАГ 2: Вызов Charge с PaymentId и RebillId')
	console.log('='.repeat(60))

	const params = {
		TerminalKey: TERMINAL_KEY,
		PaymentId: paymentId,
		RebillId: REBILL_ID,
	}

	const token = generateToken(params)
	const body = { ...params, Token: token }

	console.log('\n[Charge Request]')
	console.log(JSON.stringify(body, null, 2))
	console.log('')

	const response = await fetch(`${API_URL}/Charge`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	const data = await response.json()

	console.log('[Charge Response]')
	console.log(JSON.stringify(data, null, 2))
	console.log('')

	if (!data.Success) {
		console.error('❌ ОШИБКА в Charge:', data.Message || data.ErrorCode)
		console.error('')
		console.error('Возможные причины:')
		console.error('1. RebillId не существует или неверный')
		console.error('2. Недостаточно средств на карте')
		console.error('3. Карта заблокирована или истек срок действия')
		console.error('')
		throw new Error(`Charge failed: ${data.ErrorCode}`)
	}

	return data
}

/**
 * Главная функция
 */
async function main() {
	console.log('\n' + '='.repeat(60))
	console.log('ТЕСТ T-BANK №6: Рекуррентные платежи (COF)')
	console.log('='.repeat(60))
	console.log(`RebillId: ${REBILL_ID}`)
	console.log(`Amount: ${AMOUNT / 100} руб.`)
	console.log(`OrderId: ${ORDER_ID}`)
	console.log('')

	try {
		// Шаг 1: Создать COF-платеж
		const paymentId = await createCOFPayment()

		// Шаг 2: Вызвать Charge
		const chargeResult = await chargePayment(paymentId)

		// Успех!
		console.log('='.repeat(60))
		console.log('✅ ТЕСТ №6 ПРОЙДЕН УСПЕШНО!')
		console.log('='.repeat(60))
		console.log(`Status: ${chargeResult.Status}`)
		console.log(`PaymentId: ${chargeResult.PaymentId}`)
		console.log(`Amount: ${chargeResult.Amount / 100} руб.`)
		console.log('')
		console.log('Теперь нажмите "Проверить" в тестах T-Bank!')
		console.log('')
	} catch (error) {
		console.error('\n❌ ТЕСТ НЕ ПРОЙДЕН')
		console.error('Ошибка:', error.message)
		console.error('')
		console.error('Проверьте:')
		console.error('1. RebillId корректный (из логов после оплаты на сайте)')
		console.error('2. Карта активна и имеет достаточно средств')
		console.error('3. Логи выше для деталей ошибки')
		console.error('')
		process.exit(1)
	}
}

// Запуск
main()
