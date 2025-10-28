# Инструкция по прохождению теста T-Bank для рекуррентных платежей

## Что требует тест

Тест №6 требует выполнить следующую последовательность:

1. ✅ **Получить RebillId из уведомления** - УЖЕ ВЫПОЛНЕНО
   - RebillId: `1761673723009`
   - Сохранен в базе данных для пользователя `sadsad@mail.ru`

2. **Выполнить запрос Init** и получить PaymentId

3. **Выполнить запрос Charge** с PaymentId из шага 2 и RebillId из шага 1

## Вариант 1: Через curl (рекомендуется)

### Шаг 1: Init запрос

```bash
curl -X POST https://securepay.tinkoff.ru/v2/Init \
  -H "Content-Type: application/json" \
  -d '{
    "TerminalKey": "1757689436304DEMO",
    "Amount": 10000,
    "OrderId": "TEST_ORDER_'$(date +%s)'",
    "Description": "Test payment for recurrent",
    "Recurrent": "Y",
    "CustomerKey": "test_customer_'$(date +%s)'",
    "Password": "WFgr%waXvmeK3n%j"
  }'
```

**Сохраните PaymentId из ответа!**

### Шаг 2: Charge запрос

Замените `YOUR_PAYMENT_ID` на полученный PaymentId:

```bash
curl -X POST https://securepay.tinkoff.ru/v2/Charge \
  -H "Content-Type: application/json" \
  -d '{
    "TerminalKey": "1757689436304DEMO",
    "PaymentId": "YOUR_PAYMENT_ID",
    "RebillId": "1761673723009",
    "Password": "WFgr%waXvmeK3n%j"
  }'
```

## Вариант 2: Через приложение (автоматизированно)

Создайте новый платеж через ваше приложение, затем выполните Charge:

### Шаг 1: Получить PaymentId

1. Зайдите на https://checklytool.com/dashboard
2. Нажмите "Пополнить баланс"
3. Выберите любой тарифный план
4. После редиректа на T-Bank смотрите в URL: `PaymentId=XXXXXXX`

### Шаг 2: Выполнить Charge через API

```bash
curl -X POST https://checklytool.com/api/payment/charge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUBSCRIPTION_RENEWAL_API_KEY" \
  -d '{
    "userId": "sadsad@mail.ru",
    "rebillId": "1761673723009",
    "amount": 29000
  }'
```

⚠️ **ВАЖНО**: Для этого варианта нужен API ключ из `.env.local` (`SUBSCRIPTION_RENEWAL_API_KEY`)

## Вариант 3: Через Postman/Insomnia

### Запрос 1: Init

**URL:** `https://securepay.tinkoff.ru/v2/Init`
**Method:** POST
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "TerminalKey": "1757689436304DEMO",
  "Amount": 10000,
  "OrderId": "TEST_ORDER_12345",
  "Description": "Test payment for recurrent",
  "Recurrent": "Y",
  "CustomerKey": "test_customer_12345",
  "Password": "WFgr%waXvmeK3n%j"
}
```

### Запрос 2: Charge

**URL:** `https://securepay.tinkoff.ru/v2/Charge`
**Method:** POST
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "TerminalKey": "1757689436304DEMO",
  "PaymentId": "<PaymentId из Init>",
  "RebillId": "1761673723009",
  "Password": "WFgr%waXvmeK3n%j"
}
```

## Формирование токена (если требуется)

Если T-Bank требует токен вместо пароля, используйте:

```javascript
const crypto = require('crypto');

function generateToken(params) {
  const values = Object.keys(params)
    .filter(key => key !== 'Token' && key !== 'Receipt' && key !== 'DATA')
    .sort()
    .map(key => params[key])
    .join('');

  return crypto.createHash('sha256').update(values).digest('hex');
}

// Для Init
const initParams = {
  TerminalKey: '1757689436304DEMO',
  Amount: 10000,
  OrderId: 'TEST_ORDER_12345',
  Description: 'Test payment for recurrent',
  Recurrent: 'Y',
  CustomerKey: 'test_customer_12345',
  Password: 'WFgr%waXvmeK3n%j'
};

console.log('Init Token:', generateToken(initParams));

// Для Charge
const chargeParams = {
  TerminalKey: '1757689436304DEMO',
  PaymentId: 'YOUR_PAYMENT_ID',
  RebillId: '1761673723009',
  Password: 'WFgr%waXvmeK3n%j'
};

console.log('Charge Token:', generateToken(chargeParams));
```

## Проверка результата

После успешного выполнения Charge вы должны получить ответ:

```json
{
  "Success": true,
  "Status": "CONFIRMED",
  "PaymentId": "...",
  "OrderId": "...",
  "Amount": 10000
}
```

Это означает, что тест пройден! ✅

## Troubleshooting

**Ошибка "Invalid signature"**
- Проверьте правильность пароля: `WFgr%waXvmeK3n%j`
- Убедитесь, что используете тестовый терминал: `1757689436304DEMO`

**Ошибка "RebillId not found"**
- Убедитесь, что RebillId `1761673723009` действительно существует
- Попробуйте сначала создать новый Init с Recurrent='Y' и получить свой RebillId

**Ошибка "PaymentId not found"**
- Убедитесь, что PaymentId корректен
- PaymentId должен быть получен из Init запроса
