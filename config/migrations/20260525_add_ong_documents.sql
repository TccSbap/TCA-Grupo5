-- Migration para alinhar o schema de ONGs aos campos usados pelo front-end e pelo back-end.
-- Execute este arquivo com um usuário MySQL com permissão de ALTER.

ALTER TABLE ongs
  ADD COLUMN cnpj VARCHAR(18) NULL AFTER contact_email,
  ADD COLUMN rg VARCHAR(20) NULL AFTER cnpj;
