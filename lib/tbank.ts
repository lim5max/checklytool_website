import crypto from 'crypto'

// Типы для Т-Банк API
export interface TBankInitPaymentRequest {
	Amount: number // Сумма в копейках
	OrderId: string // Уникальный ID заказа
	Description: string // Описание платежа
	DATA?: Record<string, string> // Дополнительные данные
	Receipt?: TBankReceipt // Чек для ФЗ-54
	SuccessURL?: string // URL для редиректа после успешной оплаты
	FailURL?: string // URL для редиректа после неудачной оплаты
	NotificationURL?: string // URL для webhook уведомлений
}

export interface TBankReceipt {
	Email: string
	Phone?: string
	Taxation: 'osn' | 'usn_income' | 'usn_income_outcome' | 'envd' | 'esn' | 'patent'
	Items: TBankReceiptItem[]
}

export interface TBankReceiptItem {
	Name: string
	Price: number // в копейках
	Quantity: number
	Amount: number // в копейках
	Tax: 'none' | 'vat0' | 'vat10' | 'vat20' | 'vat110' | 'vat120'
	PaymentMethod?: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment'
	PaymentObject?: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'another'
	MeasurementUnit?: string
}

export interface TBankInitPaymentResponse {
	Success: boolean
	ErrorCode?: string
	Message?: string
	Details?: string
	TerminalKey: string
	Status: string
	PaymentId: string
	OrderId: string
	Amount: number
	PaymentURL?: string
}

export interface TBankPaymentStatus {
	Success: boolean
	ErrorCode?: string
	Message?: string
	TerminalKey: string
	Status: 'NEW' | 'FORM_SHOWED' | 'AUTHORIZING' | 'CONFIRMING' | 'AUTHORIZED' | 'CONFIRMED' | 'REVERSING' | 'PARTIAL_REVERSED' | 'REVERSED' | 'REFUNDING' | 'PARTIAL_REFUNDED' | 'REFUNDED' | 'REJECTED' | 'DEADLINE_EXPIRED' | 'CANCELED' | 'ATTEMPTS_EXPIRED' | 'AUTH_FAIL'
	PaymentId: string
	OrderId: string
	Amount: number
}

export interface TBankWebhookPayload {
	TerminalKey: string
	OrderId: string
	Success: boolean
	Status: string
	PaymentId: string
	ErrorCode: string
	Amount: number
	CardId?: string
	Pan?: string
	ExpDate?: string
	Token: string
}

// Конфигурация
function getTBankConfig() {
	const mode = process.env.TBANK_MODE || 'test'
	const isTest = mode === 'test'

	return {
		terminalKey: isTest
			? process.env.TBANK_TEST_TERMINAL_KEY!
			: process.env.TBANK_TERMINAL_KEY!,
		password: isTest
			? process.env.TBANK_TEST_PASSWORD!
			: process.env.TBANK_PASSWORD!,
		apiUrl: 'https://securepay.tinkoff.ru/v2/',
		isTest,
	}
}

/**
 * Генерация токена безопасности для запросов к Т-Банк API
 * Документация: https://developer.tbank.ru/eacq/api/api_process
 */
export function generateToken(params: Record<string, unknown>): string {
	const config = getTBankConfig()

	// Добавляем Password в параметры
	const paramsWithPassword = {
		...params,
		Password: config.password,
	}

	// Сортируем ключи по алфавиту и конкатенируем значения
	const sortedKeys = Object.keys(paramsWithPassword).sort()
	const concatenatedValues = sortedKeys
		.map((key) => (paramsWithPassword as Record<string, unknown>)[key])
		.join('')

	// Вычисляем SHA-256 хеш
	const token = crypto.createHash('sha256').update(concatenatedValues).digest('hex')

	return token
}

/**
 * Инициализация платежа в Т-Банк
 * POST /Init
 */
export async function initPayment(
	request: TBankInitPaymentRequest
): Promise<TBankInitPaymentResponse> {
	const config = getTBankConfig()

	// Подготовка параметров для токена (без DATA - оно не участвует в подписи)
	// ВАЖНО: Receipt (вложенный объект) НЕ участвует в генерации токена согласно документации
	const paramsForToken: Record<string, unknown> = {
		TerminalKey: config.terminalKey,
		Amount: request.Amount,
		OrderId: request.OrderId,
		Description: request.Description,
	}

	// SuccessURL, FailURL, NotificationURL и Receipt НЕ участвуют в генерации токена
	// но должны быть включены в запрос

	// Генерация токена
	const token = generateToken(paramsForToken)

	// Полные параметры для отправки (включая DATA и URLs)
	const params: Record<string, unknown> = {
		...paramsForToken,
		...(request.DATA && { DATA: request.DATA }),
		...(request.SuccessURL && { SuccessURL: request.SuccessURL }),
		...(request.FailURL && { FailURL: request.FailURL }),
		...(request.NotificationURL && { NotificationURL: request.NotificationURL }),
	}

	const requestBody = {
		...params,
		Token: token,
	}

	console.log('[T-Bank Init] Request:', JSON.stringify(requestBody, null, 2))

	// Отправка запроса
	const response = await fetch(`${config.apiUrl}Init`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	})

	if (!response.ok) {
		const errorText = await response.text()
		console.error('[T-Bank Init] HTTP Error:', response.status, errorText)
		throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`)
	}

	const data: TBankInitPaymentResponse = await response.json()

	console.log('[T-Bank Init] Response:', JSON.stringify(data, null, 2))

	if (!data.Success) {
		console.error('[T-Bank Init] API Error:', {
			ErrorCode: data.ErrorCode,
			Message: data.Message,
			Details: data.Details,
		})
		throw new Error(
			`T-Bank payment init failed: ${data.ErrorCode} - ${data.Message}${data.Details ? ` (${data.Details})` : ''}`
		)
	}

	return data
}

/**
 * Получение статуса платежа
 * POST /GetState
 */
export async function getPaymentState(
	paymentId: string
): Promise<TBankPaymentStatus> {
	const config = getTBankConfig()

	const params = {
		TerminalKey: config.terminalKey,
		PaymentId: paymentId,
	}

	const token = generateToken(params)

	const response = await fetch(`${config.apiUrl}GetState`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			...params,
			Token: token,
		}),
	})

	if (!response.ok) {
		throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`)
	}

	const data: TBankPaymentStatus = await response.json()

	return data
}

/**
 * Подтверждение платежа
 * POST /Confirm
 */
export async function confirmPayment(
	paymentId: string,
	amount?: number
): Promise<{ Success: boolean; ErrorCode?: string; Message?: string }> {
	const config = getTBankConfig()

	const params: Record<string, unknown> = {
		TerminalKey: config.terminalKey,
		PaymentId: paymentId,
	}

	if (amount) {
		params.Amount = amount
	}

	const token = generateToken(params)

	const response = await fetch(`${config.apiUrl}Confirm`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			...params,
			Token: token,
		}),
	})

	if (!response.ok) {
		throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`)
	}

	const data = await response.json()

	return data
}

/**
 * Проверка токена webhook от Т-Банк
 */
export function verifyWebhookToken(payload: TBankWebhookPayload): boolean {
	// Создаем объект с параметрами без Token
	const { Token: receivedToken, ...params } = payload

	// Генерируем ожидаемый токен
	const expectedToken = generateToken(params)

	// Сравниваем токены
	return receivedToken === expectedToken
}

/**
 * Создание чека для ФЗ-54
 */
export function createReceipt(
	email: string,
	planName: string,
	amount: number
): TBankReceipt {
	return {
		Email: email,
		Phone: '+79168803493', // Контактный телефон компании для чеков
		Taxation: 'usn_income', // УСН доход
		Items: [
			{
				Name: `Подписка ${planName}`,
				Price: amount,
				Quantity: 1,
				Amount: amount,
				Tax: 'none', // Без НДС для УСН
				PaymentMethod: 'full_prepayment', // Полная предоплата
				PaymentObject: 'service', // Услуга (подписка)
			},
		],
	}
}
