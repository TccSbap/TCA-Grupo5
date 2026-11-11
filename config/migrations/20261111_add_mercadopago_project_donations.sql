ALTER TABLE donations
  MODIFY COLUMN ong_id INT UNSIGNED NULL,
  ADD COLUMN recipient_type ENUM('ong', 'projeto') NOT NULL DEFAULT 'ong' AFTER ong_id,
  MODIFY COLUMN status ENUM('pendente', 'confirmada', 'cancelada', 'reembolsada', 'parcialmente_reembolsada', 'contestada') NOT NULL DEFAULT 'pendente';
