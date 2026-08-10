-- =============================================================================
-- Migration 021: Sistema financiero central de Lanz Technology
--
-- Módulo 1 — Movimientos financieros (financial_transactions)
-- Módulo 2 — Cuentas financieras (financial_accounts)
-- Módulo 3 — Cuentas por pagar (accounts_payable)
-- Módulo 4 — Cuentas por cobrar (accounts_receivable)
--
-- Principios:
--   - Los costos y la rentabilidad son información de acceso restringido.
--   - Los registros financieros históricos nunca se eliminan.
--   - Los errores contables se corrigen con registros compensatorios.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FINANCIAL_ACCOUNTS — cuentas de activo líquido
-- El saldo (balance) se actualiza manualmente o via transacciones confirmadas.
-- Tipos: cash|bank|paypal|zelle|binance|other
-- -----------------------------------------------------------------------------
CREATE TABLE public.financial_accounts (
  id         uuid          NOT NULL DEFAULT gen_random_uuid(),
  name       text          NOT NULL,
  type       text          NOT NULL,
  currency   char(3)       NOT NULL DEFAULT 'USD',
  balance    numeric(15,2) NOT NULL DEFAULT 0,
  is_active  boolean       NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT financial_accounts_pkey        PRIMARY KEY (id),
  CONSTRAINT financial_accounts_name_unique UNIQUE (name),
  CONSTRAINT financial_accounts_type_check  CHECK (type IN ('cash','bank','paypal','zelle','binance','other'))
);

CREATE TRIGGER financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_financial_accounts_type      ON public.financial_accounts(type);
CREATE INDEX idx_financial_accounts_is_active ON public.financial_accounts(is_active);

COMMENT ON TABLE  public.financial_accounts         IS 'Cuentas de activo líquido (efectivo, banco, digital). Acceso restringido.';
COMMENT ON COLUMN public.financial_accounts.balance IS 'Saldo actual. Actualizado via transacciones o manualmente.';

-- -----------------------------------------------------------------------------
-- FINANCIAL_TRANSACTIONS — ledger de movimientos monetarios
--
-- type: income | expense | adjustment | transfer
-- category: depende del type (ver CHECK abajo)
-- amount: siempre positivo; el type determina el sentido del flujo
-- account_id: cuenta afectada (opcional para compatibilidad)
-- reference_type/id: entidad que origina el movimiento (purchase_order, import, order…)
-- -----------------------------------------------------------------------------
CREATE TABLE public.financial_transactions (
  id               uuid          NOT NULL DEFAULT gen_random_uuid(),
  account_id       uuid,
  type             text          NOT NULL,
  category         text          NOT NULL,
  amount           numeric(15,2) NOT NULL,
  currency         char(3)       NOT NULL DEFAULT 'USD',
  description      text          NOT NULL,
  reference_type   text,
  reference_id     uuid,
  transaction_date date          NOT NULL DEFAULT CURRENT_DATE,
  notes            text,
  created_by       uuid,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT financial_transactions_pkey         PRIMARY KEY (id),
  CONSTRAINT financial_transactions_account_fk   FOREIGN KEY (account_id)  REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  CONSTRAINT financial_transactions_created_fk   FOREIGN KEY (created_by)  REFERENCES public.profiles(id)           ON DELETE SET NULL,
  CONSTRAINT financial_transactions_type_check   CHECK (type IN ('income','expense','adjustment','transfer')),
  CONSTRAINT financial_transactions_amount_check CHECK (amount > 0),
  CONSTRAINT financial_transactions_category_check CHECK (
    (type = 'income'  AND category IN ('sales','services','other')) OR
    (type = 'expense' AND category IN ('purchases','imports','transport','marketing','payroll','taxes','services','other')) OR
    (type IN ('adjustment','transfer') AND category IN ('internal','correction','other'))
  )
);

CREATE TRIGGER financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_financial_transactions_type     ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_category ON public.financial_transactions(category);
CREATE INDEX idx_financial_transactions_date     ON public.financial_transactions(transaction_date DESC);
CREATE INDEX idx_financial_transactions_account  ON public.financial_transactions(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_financial_transactions_ref      ON public.financial_transactions(reference_type, reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE  public.financial_transactions               IS 'Ledger de movimientos monetarios. Acceso restringido. No eliminar registros históricos.';
COMMENT ON COLUMN public.financial_transactions.amount        IS 'Siempre positivo. El tipo determina si es entrada o salida.';
COMMENT ON COLUMN public.financial_transactions.account_id   IS 'Cuenta afectada (opcional). NULL = movimiento sin cuenta asignada.';

-- -----------------------------------------------------------------------------
-- ACCOUNTS_PAYABLE — cuentas por pagar a proveedores
-- status: pending | paid | overdue | cancelled
-- Los errores se corrigen con registros compensatorios, no eliminando.
-- -----------------------------------------------------------------------------
CREATE TABLE public.accounts_payable (
  id                  uuid          NOT NULL DEFAULT gen_random_uuid(),
  supplier_id         uuid,
  purchase_order_id   uuid,
  description         text          NOT NULL,
  amount              numeric(15,2) NOT NULL,
  currency            char(3)       NOT NULL DEFAULT 'USD',
  due_date            date,
  status              text          NOT NULL DEFAULT 'pending',
  notes               text,
  paid_at             timestamptz,
  cancelled_at        timestamptz,
  created_by          uuid,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT accounts_payable_pkey           PRIMARY KEY (id),
  CONSTRAINT accounts_payable_supplier_fk    FOREIGN KEY (supplier_id)       REFERENCES public.suppliers(id)        ON DELETE SET NULL,
  CONSTRAINT accounts_payable_po_fk          FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id)  ON DELETE SET NULL,
  CONSTRAINT accounts_payable_created_fk     FOREIGN KEY (created_by)        REFERENCES public.profiles(id)         ON DELETE SET NULL,
  CONSTRAINT accounts_payable_status_check   CHECK (status IN ('pending','paid','overdue','cancelled')),
  CONSTRAINT accounts_payable_amount_check   CHECK (amount > 0)
);

CREATE TRIGGER accounts_payable_updated_at
  BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_accounts_payable_status      ON public.accounts_payable(status);
CREATE INDEX idx_accounts_payable_due_date    ON public.accounts_payable(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_accounts_payable_supplier_id ON public.accounts_payable(supplier_id) WHERE supplier_id IS NOT NULL;

COMMENT ON TABLE public.accounts_payable IS 'Cuentas por pagar a proveedores. Acceso restringido.';

-- -----------------------------------------------------------------------------
-- ACCOUNTS_RECEIVABLE — cuentas por cobrar de clientes
-- status: pending | paid | overdue | cancelled
-- -----------------------------------------------------------------------------
CREATE TABLE public.accounts_receivable (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  customer_id   uuid,
  order_id      uuid,
  description   text          NOT NULL,
  amount        numeric(15,2) NOT NULL,
  currency      char(3)       NOT NULL DEFAULT 'USD',
  due_date      date,
  status        text          NOT NULL DEFAULT 'pending',
  notes         text,
  paid_at       timestamptz,
  cancelled_at  timestamptz,
  created_by    uuid,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT accounts_receivable_pkey         PRIMARY KEY (id),
  CONSTRAINT accounts_receivable_customer_fk  FOREIGN KEY (customer_id) REFERENCES public.customers(id)  ON DELETE SET NULL,
  CONSTRAINT accounts_receivable_order_fk     FOREIGN KEY (order_id)    REFERENCES public.orders(id)     ON DELETE SET NULL,
  CONSTRAINT accounts_receivable_created_fk   FOREIGN KEY (created_by)  REFERENCES public.profiles(id)   ON DELETE SET NULL,
  CONSTRAINT accounts_receivable_status_check CHECK (status IN ('pending','paid','overdue','cancelled')),
  CONSTRAINT accounts_receivable_amount_check CHECK (amount > 0)
);

CREATE TRIGGER accounts_receivable_updated_at
  BEFORE UPDATE ON public.accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_accounts_receivable_status      ON public.accounts_receivable(status);
CREATE INDEX idx_accounts_receivable_due_date    ON public.accounts_receivable(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_accounts_receivable_customer_id ON public.accounts_receivable(customer_id) WHERE customer_id IS NOT NULL;

COMMENT ON TABLE public.accounts_receivable IS 'Cuentas por cobrar de clientes. Acceso restringido.';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.financial_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable     ENABLE ROW LEVEL SECURITY;

CREATE POLICY fin_accounts_select     ON public.financial_accounts      FOR SELECT USING (public.has_permission('finance.accounts.read'));
CREATE POLICY fin_accounts_insert     ON public.financial_accounts      FOR INSERT WITH CHECK (public.has_permission('finance.accounts.manage'));
CREATE POLICY fin_accounts_update     ON public.financial_accounts      FOR UPDATE USING (public.has_permission('finance.accounts.manage'));

CREATE POLICY fin_tx_select           ON public.financial_transactions  FOR SELECT USING (public.has_permission('finance.read'));
CREATE POLICY fin_tx_insert           ON public.financial_transactions  FOR INSERT WITH CHECK (public.has_permission('finance.create'));
CREATE POLICY fin_tx_update           ON public.financial_transactions  FOR UPDATE USING (public.has_permission('finance.update'));

CREATE POLICY ap_select               ON public.accounts_payable        FOR SELECT USING (public.has_permission('finance.payables.read'));
CREATE POLICY ap_insert               ON public.accounts_payable        FOR INSERT WITH CHECK (public.has_permission('finance.payables.manage'));
CREATE POLICY ap_update               ON public.accounts_payable        FOR UPDATE USING (public.has_permission('finance.payables.manage'));

CREATE POLICY ar_select               ON public.accounts_receivable     FOR SELECT USING (public.has_permission('finance.receivables.read'));
CREATE POLICY ar_insert               ON public.accounts_receivable     FOR INSERT WITH CHECK (public.has_permission('finance.receivables.manage'));
CREATE POLICY ar_update               ON public.accounts_receivable     FOR UPDATE USING (public.has_permission('finance.receivables.manage'));

-- -----------------------------------------------------------------------------
-- PERMISOS
-- -----------------------------------------------------------------------------
INSERT INTO public.permissions (name, description) VALUES
  ('finance.read',               'Ver movimientos financieros'),
  ('finance.create',             'Registrar movimientos financieros'),
  ('finance.update',             'Editar movimientos financieros'),
  ('finance.accounts.read',      'Ver cuentas financieras y saldos'),
  ('finance.accounts.manage',    'Crear y editar cuentas financieras'),
  ('finance.payables.read',      'Ver cuentas por pagar'),
  ('finance.payables.manage',    'Registrar y gestionar cuentas por pagar'),
  ('finance.receivables.read',   'Ver cuentas por cobrar'),
  ('finance.receivables.manage', 'Registrar y gestionar cuentas por cobrar')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles       r
JOIN public.permissions p ON p.name LIKE 'finance.%'
WHERE r.name = 'administrator'
ON CONFLICT DO NOTHING;
