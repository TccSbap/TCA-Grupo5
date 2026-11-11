CREATE TABLE IF NOT EXISTS ong_payment_accounts (
  ong_id INT UNSIGNED NOT NULL,
  seller_user_id VARCHAR(32) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  connected_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (ong_id),
  KEY idx_ong_payment_accounts_seller_user_id (seller_user_id),
  CONSTRAINT fk_ong_payment_accounts_ong
    FOREIGN KEY (ong_id) REFERENCES ongs (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
