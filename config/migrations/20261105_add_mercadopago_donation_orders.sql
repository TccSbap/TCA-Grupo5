ALTER TABLE donations
  MODIFY COLUMN payment_method ENUM('cartao', 'pix', 'boleto') NULL DEFAULT NULL,
  MODIFY COLUMN status ENUM('pendente', 'confirmada', 'cancelada', 'reembolsada') NOT NULL DEFAULT 'pendente',
  ADD COLUMN mercadopago_order_id VARCHAR(64) NULL,
  ADD COLUMN mercadopago_payment_id VARCHAR(64) NULL,
  ADD COLUMN mercadopago_status VARCHAR(40) NULL,
  ADD UNIQUE KEY uq_donations_mercadopago_order_id (mercadopago_order_id);
