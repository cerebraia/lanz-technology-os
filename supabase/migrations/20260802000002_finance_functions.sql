-- =============================================================================
-- Migration 022: Funciones auxiliares del sistema financiero
-- =============================================================================

-- Ajusta el saldo de una cuenta financiera por un delta (positivo o negativo).
-- Usada desde server actions al registrar transacciones vinculadas a una cuenta.
CREATE OR REPLACE FUNCTION public.adjust_account_balance(
  p_account_id uuid,
  p_delta      numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.financial_accounts
  SET    balance = balance + p_delta
  WHERE  id = p_account_id;
END;
$$;

COMMENT ON FUNCTION public.adjust_account_balance IS
  'Incrementa o decrementa el saldo de una cuenta financiera. Solo para uso interno desde server actions.';
