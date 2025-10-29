#!/usr/bin/env node

/**
 * Скрипт для прохождения теста T-Bank №6
 * ВАЖНО: Выполняет ТОЛЬКО Charge, БЕЗ Init!
 *
 * ИНСТРУКЦИЯ:
 * 1. Оплатите подписку через сайт (тест №5)
 * 2. Посмотрите логи на сервере:
 *    pm2 logs checklytool | grep -E "(PaymentId|RebillId)" | tail -10
 * 3. Найдите PaymentId и RebillId из ОДНОЙ оплаты
 * 4. Вставьте их ниже в константы
 * 5. Запустите: node tbank_test_charge_v2.js
 * 6. Нажмите "Проверить" в тестах T-Bank
 */

const crypto = require('crypto');

// Конфигурация T-Bank
const TERMINAL_KEY = '1757689436304DEMO';
const PASSWORD = 'WFgr%waXvmeK3n%j';
const API_URL = 'https://securepay.tinkoff.ru/v2';

// ===== ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ =====
// PaymentId из Init запроса (из логов сайта)
const PAYMENT_ID = '7283512345'; // ← ЗАМЕНИТЕ!

// RebillId из webhook (из логов после оплаты)
const REBILL_ID = '1761749792954'; // ← ЗАМЕНИТЕ!
// ==================================

/**
 * Генерация токена для T-Bank API
 */
function generateToken(params) {
	const paramsWithPassword = { ...params, Password: PASSWORD };

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

	return crypto.createHash('sha256').update(values).digest('hex');
}

/**
 * Выполнение Charge запроса
 */
async function chargePayment() {
	console.log('\n' + '='.repeat(60));
	console.log('ТЕСТ T-BANK №6: Charge с существующим PaymentId');
	console.log('='.repeat(60));

	console.log('\n[Параметры]');
	console.log(`PaymentId: ${PAYMENT_ID}`);
	console.log(`RebillId: ${REBILL_ID}`);
	console.log('');

	const params = {
		TerminalKey: TERMINAL_KEY,
		PaymentId: PAYMENT_ID,
		RebillId: REBILL_ID,
	};

	const token = generateToken(params);
	const body = { ...params, Token: token };

	console.log('[Request]');
	console.log(JSON.stringify(body, null, 2));
	console.log('');

	const response = await fetch(`${API_URL}/Charge`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

	const data = await response.json();

	console.log('[Response]');
	console.log(JSON.stringify(data, null, 2));
	console.log('');

	if (!data.Success) {
		console.error('❌ ОШИБКА:', data.Message || data.ErrorCode);
		console.error('');
		console.error('Возможные причины:');
		console.error('1. PaymentId не существует или неверный');
		console.error('2. RebillId не принадлежит этому PaymentId');
		console.error('3. Платеж уже был Charge-нут ранее');
		console.error('');
		console.error('Убедитесь, что:');
		console.error('- PaymentId и RebillId из ОДНОЙ оплаты');
		console.error('- Вы еще НЕ делали Charge для этого PaymentId');
		process.exit(1);
	}

	console.log('='.repeat(60));
	console.log('✅ CHARGE УСПЕШЕН!');
	console.log('='.repeat(60));
	console.log(`Status: ${data.Status}`);
	console.log(`PaymentId: ${data.PaymentId}`);
	console.log(`Amount: ${data.Amount / 100} руб.`);
	console.log('='.repeat(60));
	console.log('');
	console.log('Теперь нажмите "Проверить" в тестах T-Bank!');
	console.log('');
}

// Запуск
chargePayment().catch(error => {
	console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
	console.error(error);
	process.exit(1);
});
