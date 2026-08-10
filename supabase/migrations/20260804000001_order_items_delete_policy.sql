-- =============================================================================
-- Migration: Política RLS DELETE para order_items en estado draft
--
-- El diseño original (migration 007) marcó order_items como inmutables para
-- proteger el historial de pedidos confirmados. Sin embargo, el dashboard admin
-- necesita poder eliminar líneas de pedidos que todavía están en borrador,
-- antes de que el pedido sea confirmado.
--
-- Esta política permite DELETE únicamente cuando:
--   1. El usuario tiene permiso orders.update
--   2. El pedido asociado está en estado 'draft'
--
-- Los pedidos confirmados/enviados/cancelados conservan sus items inmutables.
-- =============================================================================

CREATE POLICY "order_items_delete_draft" ON public.order_items
  FOR DELETE TO authenticated
  USING (
    has_permission('orders.update') AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND status = 'draft'
    )
  );
