# Отладка платежей Т-Банк

## Что было исправлено

### Проблема: "Неверные параметры" (ErrorCode 204)

**Причины:**
1. ❌ В Receipt не хватало обязательных полей: `PaymentMethod`, `PaymentObject`, `MeasurementUnit`
2. ❌ DATA не должно участвовать в генерации токена
3. ❌ Для тестового режима чек может быть необязательным

**Решение:**
1. ✅ Добавлены все обязательные поля в `TBankReceiptItem`:
   ```typescript
   PaymentMethod: 'full_prepayment'  // Полная предоплата
   PaymentObject: 'service'          // Услуга (подписка)
   MeasurementUnit: 'шт'             // Единица измерения
   ```

2. ✅ DATA теперь не участвует в генерации токена (только в отправке)

3. ✅ Для тестового режима (`TBANK_MODE=test`) чек не отправляется

## Как протестировать

1. **Убедитесь, что в `.env.local` установлен тестовый режим:**
   ```bash
   TBANK_MODE=test
   ```

2. **Перезапустите dev сервер:**
   ```bash
   npm run dev
   ```

3. **Откройте консоль браузера и консоль терминала** - там будут логи

4. **Попробуйте оплатить:**
   - Перейдите в Профиль
   - Нажмите "Выбрать Plus"
   - В консоли терминала вы увидите:
     ```
     [T-Bank Init] Request: {...}
     [T-Bank Init] Response: {...}
     ```

5. **Проверьте, что в Response:**
   ```json
   {
     "Success": true,
     "PaymentURL": "https://securepay.tinkoff.ru/...",
     "PaymentId": "...",
     "OrderId": "..."
   }
   ```

## Ожидаемый результат

✅ **Успешный запрос** - редирект на форму оплаты Т-Банк
✅ **Логи в консоли** показывают Success: true
✅ **PaymentURL присутствует** в ответе

## Если всё ещё ошибка

### Проверьте логи в терминале:

1. **Request должен содержать:**
   ```json
   {
     "TerminalKey": "1757689436304DEMO",
     "Amount": 29000,  // цена * 100
     "OrderId": "ORDER_...",
     "Description": "Подписка Plus - ChecklyTool",
     "Token": "..." // SHA-256 хеш
   }
   ```

2. **Без Receipt в тестовом режиме** (Receipt должен отсутствовать)

3. **С Receipt в продакшене** (когда TBANK_MODE=production)

### Частые проблемы:

| Проблема | Решение |
|----------|---------|
| "Неверные параметры" | Проверьте переменные окружения |
| "Invalid signature" | Проверьте TBANK_TEST_PASSWORD |
| Receipt ошибки | Убедитесь что TBANK_MODE=test |
| Timeout | Проверьте интернет соединение |

## Переход на продакшн

Когда будете готовы к реальным платежам:

1. Измените `.env.local`:
   ```bash
   TBANK_MODE=production
   TBANK_TERMINAL_KEY=1757689436544
   TBANK_PASSWORD=0SapHdSKrEQRQCN7
   ```

2. Тогда чек будет отправляться автоматически

3. Настройте webhook для продакшн домена

## Проверка данных в БД

После инициализации платежа проверьте таблицу:

```sql
SELECT * FROM payment_orders
WHERE user_id = 'ваш@email.com'
ORDER BY created_at DESC
LIMIT 1;
```

Должно быть:
- `status = 'pending'`
- `payment_url` заполнен
- `payment_id` заполнен
