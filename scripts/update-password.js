/**
 * Скрипт для обновления пароля пользователя напрямую в базе данных
 * Использование: node scripts/update-password.js <email> <new-password>
 */

import bcrypt from 'bcryptjs'

async function generateHash(password) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

async function main() {
	const email = process.argv[2]
	const password = process.argv[3]

	if (!email || !password) {
		console.error('Usage: node scripts/update-password.js <email> <password>')
		process.exit(1)
	}

	const hash = await generateHash(password)

	console.log('\n=== SQL Query для обновления пароля ===\n')
	console.log(`UPDATE user_profiles`)
	console.log(`SET password_hash = '${hash}',`)
	console.log(`    updated_at = now()`)
	console.log(`WHERE email = '${email}';`)
	console.log('\n')
	console.log('=== Или используйте этот хеш ===')
	console.log(hash)
	console.log('\n')
}

main().catch(console.error)
