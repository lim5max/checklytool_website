-- Исправление функции deduct_check_credits для поддержки written_work
-- Проблема: функция не поддерживала тип 'written_work' и выбрасывала exception
-- Решение: добавить case для 'written_work' с множителем 2.0

CREATE OR REPLACE FUNCTION public.deduct_check_credits(
	p_user_id text,
	p_check_id uuid,
	p_submission_id uuid,
	p_check_type text,
	p_pages_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
	v_credits_to_deduct NUMERIC;
	v_current_balance NUMERIC;
	v_new_balance NUMERIC;
BEGIN
	-- Рассчитываем количество проверок для списания
	IF p_check_type = 'test' THEN
		v_credits_to_deduct := p_pages_count * 0.5;
	ELSIF p_check_type = 'essay' THEN
		v_credits_to_deduct := p_pages_count * 1.0;
	ELSIF p_check_type = 'written_work' THEN
		v_credits_to_deduct := p_pages_count * 2.0;
	ELSE
		RAISE EXCEPTION 'Invalid check type: %', p_check_type;
	END IF;

	-- Получаем текущий баланс
	SELECT check_balance INTO v_current_balance
	FROM user_profiles
	WHERE user_id = p_user_id;

	-- Проверяем достаточность средств
	IF v_current_balance < v_credits_to_deduct THEN
		RETURN jsonb_build_object(
			'success', false,
			'error', 'Insufficient credits',
			'required', v_credits_to_deduct,
			'available', v_current_balance
		);
	END IF;

	-- Списываем проверки
	UPDATE user_profiles
	SET check_balance = check_balance - v_credits_to_deduct,
		updated_at = NOW()
	WHERE user_id = p_user_id
	RETURNING check_balance INTO v_new_balance;

	-- Записываем в историю
	INSERT INTO check_usage_history (
		user_id, check_id, submission_id, check_type,
		pages_count, credits_used
	) VALUES (
		p_user_id, p_check_id, p_submission_id, p_check_type,
		p_pages_count, v_credits_to_deduct
	);

	RETURN jsonb_build_object(
		'success', true,
		'credits_deducted', v_credits_to_deduct,
		'new_balance', v_new_balance
	);
END;
$function$;
