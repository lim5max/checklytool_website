#!/usr/bin/env node

/**
 * Скрипт для прохождения теста T-Bank №6
 * Выполняет Init → Charge последовательность
 *
 * Использование:
 * node tbank_test_charge.js
 */

const crypto = require('crypto');

// Конфигурация T-Bank
const TERMINAL_KEY = '1757689436304DEMO';
const PASSWORD = 'WFgr%waXvmeK3n%j';
const API_URL = 'https://securepay.tinkoff.ru/v2';

// RebillId полученный из предыдущего теста
const REBILL_ID = '1761673723009';

/**
 * Генерация токена для T-Bank API
 */
function generateToken(params) {
	// Добавляем Password
	const paramsWithPassword = { ...params, Password: PASSWORD };

	// Фильтруем и сортируем ключи
	const values = Object.keys(paramsWithPassword)
		.filter(key =>
			key !== 'Token' &&
			key !== 'Receipt' &&
			key !== 'DATA' &&
			paramsWithPassword[key] != null
		)
		.sort()
		.map(key => paramsWithPassword[key])
		.join('');

	// Генерируем SHA-256 хеш
	return crypto.createHash('sha256').update(values).digest('hex');
}

/**
 * Выполнение Init запроса
 */
async function initPayment() {
	console.log('\n[1] Выполняем Init запрос...\n');

	const orderId = `TEST_ORDER_${Date.now()}`;

	const params = {
		TerminalKey: TERMINAL_KEY,
		Amount: 10000, // 100 рублей
		OrderId: orderId,
		Description: 'Test payment for recurrent charge',
		Recurrent: 'Y',
		CustomerKey: `test_customer_${Date.now()}`,
	};

	const token = generateToken(params);
	const body = { ...params, Token: token };

	console.log('Request:', JSON.stringify(body, null, 2));

	const response = await fetch(`${API_URL}/Init`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

	const data = await response.json();

	console.log('\nResponse:', JSON.stringify(data, null, 2));

	if (!data.Success) {
		throw new Error(`Init failed: ${data.Message || data.ErrorCode}`);
	}

	console.log('\n✅ Init успешен!');
	console.log(`PaymentId: ${data.PaymentId}`);
	console.log(`PaymentURL: ${data.PaymentURL}`);

	return data.PaymentId;
}

/**
 * Выполнение Charge запроса
 */
async function chargePayment(paymentId) {
	console.log('\n[2] Выполняем Charge запрос...\n');

	const params = {
		TerminalKey: TERMINAL_KEY,
		PaymentId: paymentId,
		RebillId: REBILL_ID,
	};

	const token = generateToken(params);
	const body = { ...params, Token: token };

	console.log('Request:', JSON.stringify(body, null, 2));

	const response = await fetch(`${API_URL}/Charge`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

	const data = await response.json();

	console.log('\nResponse:', JSON.stringify(data, null, 2));

	if (!data.Success) {
		throw new Error(`Charge failed: ${data.Message || data.ErrorCode}`);
	}

	console.log('\n✅ Charge успешен!');
	console.log(`Status: ${data.Status}`);
	console.log(`PaymentId: ${data.PaymentId}`);
	console.log(`Amount: ${data.Amount}`);

	return data;
}

/**
 * Главная функция
 */
async function main() {
	try {
		console.log('='.repeat(60));
		console.log('ТЕСТ T-BANK №6: Init → Charge');
		console.log('='.repeat(60));

		// Шаг 1: Init
		const paymentId = await initPayment();

		// Небольшая пауза
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Шаг 2: Charge
		await chargePayment(paymentId);

		console.log('\n' + '='.repeat(60));
		console.log('🎉 ТЕСТ ПРОЙДЕН УСПЕШНО!');
		console.log('='.repeat(60));
		console.log('\nТеперь можете отправить результаты в T-Bank:');
		console.log(`- PaymentId: ${paymentId}`);
		console.log(`- RebillId: ${REBILL_ID}`);
		console.log('='.repeat(60) + '\n');

	} catch (error) {
		console.error('\n❌ ОШИБКА:', error.message);
		console.error('\nПодробности:', error);
		process.exit(1);
	}
}

// Запуск
main();
