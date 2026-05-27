-- Banco reconstruído a partir do projeto atual.
-- O app agora persiste usuários, ONGs, planos, notícias, doações, assinaturas, mensagens de contato, denúncias e respostas.

CREATE DATABASE IF NOT EXISTS agua_consiente
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE agua_consiente;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS denuncia_responses;
DROP TABLE IF EXISTS denuncias;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS plan_subscriptions;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS ongs;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash CHAR(60) NOT NULL,
  type ENUM('user', 'admin', 'ong') NOT NULL,
  ong_name VARCHAR(150) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_type (type),
  CONSTRAINT chk_users_ong_name
    CHECK (
      (type = 'ong' AND ong_name IS NOT NULL)
      OR
      (type = 'user' AND ong_name IS NULL)
      OR
      (type = 'admin' AND ong_name IS NULL)
    )
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ongs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NULL,
  rg VARCHAR(20) NULL,
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_ongs_name (name),
  UNIQUE KEY uq_ongs_user_id (user_id),
  KEY idx_ongs_contact_email (contact_email),
  CONSTRAINT fk_ongs_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE denuncias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  category ENUM('agua', 'esgoto', 'poluicao', 'geral') NOT NULL DEFAULT 'geral',
  status ENUM('pendente', 'em_andamento', 'resolvida') NOT NULL DEFAULT 'pendente',
  user_id INT UNSIGNED NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_denuncias_status (status),
  KEY idx_denuncias_category (category),
  KEY idx_denuncias_user_id (user_id),
  KEY idx_denuncias_created_at (created_at),
  CONSTRAINT fk_denuncias_user
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE denuncia_responses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  denuncia_id INT UNSIGNED NOT NULL,
  ong_id INT UNSIGNED NOT NULL,
  ong_name VARCHAR(150) NOT NULL,
  response_text TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_responses_denuncia_id (denuncia_id),
  KEY idx_responses_ong_id (ong_id),
  KEY idx_responses_created_at (created_at),
  CONSTRAINT fk_responses_denuncia
    FOREIGN KEY (denuncia_id) REFERENCES denuncias (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_responses_ong
    FOREIGN KEY (ong_id) REFERENCES ongs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plans (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  price VARCHAR(30) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  features_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  date_label VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  icon_class VARCHAR(80) NOT NULL DEFAULT 'fas fa-newspaper',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_news_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE donations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ong_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  donor_name VARCHAR(150) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  donor_phone VARCHAR(30) NOT NULL,
  donor_document VARCHAR(20) NOT NULL,
  donor_cep VARCHAR(20) NOT NULL,
  donor_street VARCHAR(255) NOT NULL,
  donor_number VARCHAR(20) NOT NULL,
  donor_neighborhood VARCHAR(120) NOT NULL,
  donor_city VARCHAR(120) NOT NULL,
  donor_state CHAR(2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT NULL,
  payment_method ENUM('cartao', 'pix', 'boleto') NOT NULL,
  status ENUM('pendente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendente',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_donations_ong_id (ong_id),
  KEY idx_donations_user_id (user_id),
  KEY idx_donations_status (status),
  CONSTRAINT fk_donations_ong
    FOREIGN KEY (ong_id) REFERENCES ongs (id),
  CONSTRAINT fk_donations_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plan_subscriptions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  plan_name VARCHAR(150) NOT NULL,
  plan_price VARCHAR(30) NOT NULL,
  subscriber_name VARCHAR(150) NOT NULL,
  subscriber_email VARCHAR(255) NOT NULL,
  subscriber_phone VARCHAR(30) NOT NULL,
  subscriber_document VARCHAR(20) NOT NULL,
  subscriber_cep VARCHAR(20) NOT NULL,
  subscriber_street VARCHAR(255) NOT NULL,
  subscriber_number VARCHAR(20) NOT NULL,
  subscriber_neighborhood VARCHAR(120) NOT NULL,
  subscriber_city VARCHAR(120) NOT NULL,
  subscriber_state CHAR(2) NOT NULL,
  payment_method ENUM('cartao', 'pix', 'boleto') NOT NULL,
  status ENUM('pendente', 'ativa', 'cancelada') NOT NULL DEFAULT 'pendente',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_plan_subscriptions_plan_id (plan_id),
  KEY idx_plan_subscriptions_user_id (user_id),
  KEY idx_plan_subscriptions_status (status),
  CONSTRAINT fk_plan_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES plans (id),
  CONSTRAINT fk_plan_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  newsletter TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('nova', 'respondida', 'arquivada') NOT NULL DEFAULT 'nova',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_contact_messages_status (status),
  KEY idx_contact_messages_user_id (user_id),
  CONSTRAINT fk_contact_messages_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

INSERT INTO users (id, name, email, password_hash, type, ong_name) VALUES
  (1, 'Admin ONG Água Limpa', 'admin@agualimpa.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'ONG Água Limpa'),
  (2, 'Admin Saneamento para Todos', 'admin@saneamento.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Saneamento para Todos'),
  (3, 'Admin Rios Vivos', 'admin@riosvivos.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Rios Vivos'),
  (4, 'Admin Água para a Vida', 'admin@aguavida.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Água para a Vida'),
  (5, 'Admin Cidadania e Saneamento', 'admin@cidadaniasaneamento.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Cidadania e Saneamento'),
  (6, 'Admin Planeta Água', 'admin@planetaagua.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Planeta Água'),
  (7, 'Admin Esgoto Zero', 'admin@esgotozero.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Esgoto Zero'),
  (8, 'Admin Saúde Hídrica', 'admin@saudehidrica.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Saúde Hídrica'),
  (9, 'Admin Água é Direito', 'admin@aguadireito.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Água é Direito'),
  (10, 'Admin Comunidade Sustentável', 'admin@comunidadesustentavel.org', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'ong', 'Comunidade Sustentável'),
  (11, 'João Silva', 'joao@email.com', '$2b$10$WhDPh76vwRfUxdgTmUs5QeWxHX/G/8wUCsaYKQF7DEuF/a54.z8/6', 'user', NULL);

INSERT INTO ongs (id, name, description, contact_email, phone, address, user_id) VALUES
  (1, 'ONG Água Limpa', 'Organização dedicada ao saneamento básico e acesso à água potável em comunidades carentes.', 'contato@agualimpa.org', '(11) 9999-1111', 'São Paulo, SP', 1),
  (2, 'Saneamento para Todos', 'Promovemos o acesso universal ao saneamento básico através de projetos comunitários e educação ambiental.', 'contato@saneamento.org', '(21) 9999-2222', 'Rio de Janeiro, RJ', 2),
  (3, 'Rios Vivos', 'Atuamos na preservação e recuperação de rios urbanos, combatendo a poluição hídrica.', 'contato@riosvivos.org', '(31) 9999-3333', 'Belo Horizonte, MG', 3),
  (4, 'Água para a Vida', 'Levamos água potável e saneamento para regiões remotas e comunidades vulneráveis.', 'contato@aguavida.org', '(85) 9999-4444', 'Fortaleza, CE', 4),
  (5, 'Cidadania e Saneamento', 'Defendemos o direito ao saneamento básico como direito fundamental através de advocacy e mobilização social.', 'contato@cidadaniasaneamento.org', '(71) 9999-5555', 'Salvador, BA', 5),
  (6, 'Planeta Água', 'Educação ambiental e projetos de conscientização sobre uso sustentável da água e saneamento.', 'contato@planetaagua.org', '(41) 9999-6666', 'Curitiba, PR', 6),
  (7, 'Esgoto Zero', 'Combatemos o esgoto a céu aberto através de denúncias, fiscalização e projetos de infraestrutura.', 'contato@esgotozero.org', '(81) 9999-7777', 'Recife, PE', 7),
  (8, 'Saúde Hídrica', 'Relacionamos saneamento e saúde pública, promovendo melhorias nas condições sanitárias das comunidades.', 'contato@saudehidrica.org', '(51) 9999-8888', 'Porto Alegre, RS', 8),
  (9, 'Água é Direito', 'Lutamos pelo reconhecimento e efetivação do direito humano à água e ao saneamento.', 'contato@aguadireito.org', '(61) 9999-9999', 'Brasília, DF', 9),
  (10, 'Comunidade Sustentável', 'Desenvolvemos soluções sustentáveis de saneamento em parceria com comunidades locais.', 'contato@comunidadesustentavel.org', '(92) 9999-0000', 'Manaus, AM', 10);

INSERT INTO plans (id, title, price, subtitle, features_json) VALUES
  (1, 'Plano Essencial', 'R$40/mês', 'Ideal para ONGs que estão começando e querem visibilidade', JSON_ARRAY('Página pública da ONG no site', 'Pode receber e responder denúncias', 'Inclusão nas listagens e mapas', 'Suporte por e-mail', 'Até 3 campanhas ou projetos ativos')),
  (2, 'Plano Avançado', 'R$80/mês', 'Para ONGs que desejam mais alcance e interação com o público', JSON_ARRAY('Todos os benefícios do plano Essencial', 'Destaque nas listagens', 'Até 10 campanhas ou projetos ativos', 'Estatísticas de engajamento', 'Suporte por chat ou WhatsApp')),
  (3, 'Plano Premium', 'R$120/mês', 'Para ONGs que querem impacto máximo e parcerias estratégicas', JSON_ARRAY('Todos os benefícios do plano Avançado', 'Selo de ONG Verificada', 'Relatórios mensais com dados de impacto', 'Páginas personalizadas', 'Suporte prioritário 24h'));

INSERT INTO news (id, title, date_label, description, image, url, icon_class, sort_order) VALUES
  (1, 'Mutirao leva agua filtrada para 12 comunidades', '12 de Janeiro de 2025', 'A acao conjunta entre ONGs e voluntarios instalou novos pontos de distribuicao e orientou moradores sobre uso consciente da agua.', '/images/agua-potavel.webp', '/noticias?destaque=1', 'fas fa-hand-holding-water', 1),
  (2, 'Plataforma reduz tempo medio de resposta das denuncias', '28 de Fevereiro de 2025', 'Com triagem automatica e repasse por regiao, as denuncias passaram a chegar mais rapido as organizacoes responsaveis.', '/images/saneamento.webp', '/noticias?destaque=2', 'fas fa-chart-line', 2),
  (3, 'Programa educativo alcanca 800 estudantes sobre saneamento', '14 de Marco de 2025', 'As oficinas abordaram higiene, economia de agua e prevencao de contaminacoes em escolas publicas parceiras.', '/images/agua-potavel.webp', '/noticias?destaque=3', 'fas fa-graduation-cap', 3),
  (4, 'Parceria comunitaria instala reservatorios em area rural', '02 de Abril de 2025', 'Moradores receberam reservatorios, filtros e treinamento para manutencao simples dos equipamentos.', '/images/saneamento.webp', '/noticias?destaque=4', 'fas fa-water', 4),
  (5, 'Novos planos solidarios ampliam apoio as ONGs locais', '20 de Maio de 2025', 'A adesao aos planos ajudou a financiar campanhas, materiais educativos e pequenas melhorias de infraestrutura.', '/images/WSlJfDPMch2v.png', '/noticias?destaque=5', 'fas fa-heart', 5),
  (6, 'Mapeamento colaborativo identifica pontos criticos de esgoto', '09 de Junho de 2025', 'Usuarios da plataforma registraram areas com descarte irregular, facilitando o planejamento das equipes de campo.', '/images/DDtf46EAazit.jpeg', '/noticias?destaque=6', 'fas fa-map-marked-alt', 6);

INSERT INTO denuncias (id, title, description, location, category, status, user_id, user_name, created_at) VALUES
  (1, 'Esgoto a céu aberto na Rua das Flores', 'Há mais de 2 meses existe um vazamento de esgoto na Rua das Flores, causando mau cheiro e risco à saúde dos moradores. Crianças brincam próximo ao local.', 'Rua das Flores, 123 - Centro, São Paulo/SP', 'esgoto', 'pendente', 11, 'João Silva', '2024-09-15 00:00:00'),
  (2, 'Falta de água há 5 dias no bairro', 'O bairro Jardim Esperança está sem abastecimento de água há 5 dias. Famílias estão comprando água mineral para consumo básico.', 'Jardim Esperança - Rio de Janeiro/RJ', 'agua', 'em_andamento', 11, 'João Silva', '2024-09-16 00:00:00'),
  (3, 'Rio poluído com descarte irregular', 'O Rio Verde está sendo usado para descarte irregular de resíduos industriais. A água está com coloração escura e forte odor.', 'Margem do Rio Verde - Belo Horizonte/MG', 'poluicao', 'resolvida', 11, 'João Silva', '2024-09-05 00:00:00'),
  (4, 'Caixa d''água comunitária contaminada', 'A caixa d''água da comunidade está com água turva e com gosto estranho. Várias pessoas apresentaram problemas gastrointestinais.', 'Comunidade Boa Vista - Fortaleza/CE', 'agua', 'pendente', 11, 'João Silva', '2024-09-18 00:00:00'),
  (5, 'Fossa séptica transbordando', 'A fossa séptica do condomínio está transbordando e o esgoto está escorrendo pela calçada, atingindo casas vizinhas.', 'Condomínio Solar do Atlântico - Salvador/BA', 'esgoto', 'em_andamento', 11, 'João Silva', '2024-09-18 00:00:00'),
  (6, 'Vazamento de água na rede pública', 'Grande vazamento na rede de distribuição está desperdiçando milhares de litros de água há semanas sem reparo.', 'Avenida Central, 456 - Curitiba/PR', 'agua', 'pendente', 11, 'João Silva', '2024-09-17 00:00:00'),
  (7, 'Esgoto sendo despejado na praia', 'Tubulação clandestina está despejando esgoto diretamente na praia. Banhistas relatam manchas e mau cheiro na água.', 'Praia de Boa Viagem - Recife/PE', 'poluicao', 'em_andamento', 11, 'João Silva', '2024-09-19 00:00:00'),
  (8, 'Água com coloração amarelada', 'A água que sai das torneiras está com cor amarelada e sedimentos. Moradores estão com receio de consumir.', 'Vila Nova - Porto Alegre/RS', 'agua', 'pendente', 11, 'João Silva', '2024-09-20 00:00:00'),
  (9, 'Falta de saneamento básico na comunidade', 'Comunidade inteira não possui rede de esgoto. Moradores usam fossas precárias que contaminam o lençol freático.', 'Comunidade Esperança - Brasília/DF', 'esgoto', 'pendente', 11, 'João Silva', '2024-09-21 00:00:00'),
  (10, 'Córrego entupido causando alagamentos', 'Córrego está entupido com lixo e esgoto, causando alagamentos constantes nas casas próximas quando chove.', 'Rua do Comércio - Manaus/AM', 'poluicao', 'resolvida', 11, 'João Silva', '2024-09-10 00:00:00'),
  (11, 'Poço artesiano contaminado', 'Análise da água do poço comunitário detectou contaminação por coliformes fecais. É a única fonte de água da região.', 'Zona Rural - Goiânia/GO', 'agua', 'em_andamento', 11, 'João Silva', '2024-09-21 00:00:00'),
  (12, 'Rede de esgoto rompida', 'Rede de esgoto rompeu e está vazando na rua. Moradores não conseguem sair de casa devido ao mau cheiro e risco à saúde.', 'Rua dos Trabalhadores, 789 - Campinas/SP', 'esgoto', 'pendente', 11, 'João Silva', '2024-09-22 00:00:00'),
  (13, 'Falta de tratamento de esgoto', 'Bairro inteiro não possui tratamento de esgoto. Dejetos são despejados diretamente no rio que corta a cidade.', 'Bairro Industrial - Natal/RN', 'esgoto', 'pendente', 11, 'João Silva', '2024-09-23 00:00:00'),
  (14, 'Água com forte odor de cloro', 'A água está chegando com odor muito forte de cloro, causando irritação na pele e nos olhos dos moradores.', 'Conjunto Habitacional Vitória - Vitória/ES', 'agua', 'em_andamento', 11, 'João Silva', '2024-09-23 00:00:00'),
  (15, 'Lagoa contaminada por esgoto', 'Lagoa do bairro está completamente contaminada por esgoto clandestino. Peixes mortos e mau cheiro insuportável.', 'Lagoa do Parque - Florianópolis/SC', 'poluicao', 'pendente', 11, 'João Silva', '2024-09-24 00:00:00'),
  (16, 'Pressão da água muito baixa', 'A pressão da água está extremamente baixa, impossibilitando uso de chuveiros e dificultando atividades básicas do dia a dia.', 'Morro da Esperança - São Luís/MA', 'agua', 'pendente', 11, 'João Silva', '2024-09-25 00:00:00');

INSERT INTO denuncia_responses (id, denuncia_id, ong_id, ong_name, response_text, created_at) VALUES
  (1, 2, 2, 'Saneamento para Todos', 'Estamos em contato com a concessionária local para resolver o problema. Previsão de normalização em 48h.', '2024-09-17 00:00:00'),
  (2, 3, 3, 'Rios Vivos', 'Fiscalização realizada. Empresa responsável foi autuada e iniciou processo de despoluição.', '2024-09-10 00:00:00'),
  (3, 5, 5, 'Cidadania e Saneamento', 'Equipe técnica agendada para avaliação amanhã às 9h. Providenciaremos solução emergencial.', '2024-09-19 00:00:00'),
  (4, 7, 7, 'Esgoto Zero', 'Denúncia encaminhada aos órgãos ambientais. Interdição da área solicitada até resolução.', '2024-09-20 00:00:00'),
  (5, 11, 4, 'Água para a Vida', 'Providenciando tratamento emergencial e busca por fonte alternativa de água potável.', '2024-09-22 00:00:00'),
  (6, 14, 8, 'Saúde Hídrica', 'Solicitamos análise da qualidade da água. Aguardando resultado dos testes laboratoriais.', '2024-09-24 00:00:00');

INSERT INTO donations (id, ong_id, user_id, donor_name, donor_email, donor_phone, donor_document, donor_cep, donor_street, donor_number, donor_neighborhood, donor_city, donor_state, amount, message, payment_method, status, created_at) VALUES
  (1, 1, 11, 'João Silva', 'joao@email.com', '(11) 99999-0000', '12345678901', '01001-000', 'Rua das Flores', '123', 'Centro', 'São Paulo', 'SP', 40.00, 'Obrigado pelo trabalho de vocês!', 'pix', 'confirmada', '2025-01-10 00:00:00'),
  (2, 3, 11, 'Mariana Souza', 'mariana@exemplo.com', '(21) 98888-1111', '98765432100', '20000-000', 'Avenida Central', '456', 'Botafogo', 'Rio de Janeiro', 'RJ', 80.00, 'Contem comigo para continuar a acao.', 'cartao', 'pendente', '2025-01-12 00:00:00'),
  (3, 7, 11, 'Carlos Pereira', 'carlos@exemplo.com', '(31) 97777-2222', '11122233344', '30100-000', 'Rua do Comercio', '789', 'Savassi', 'Belo Horizonte', 'MG', 120.00, 'Apoio ao projeto de despoluicao.', 'boleto', 'confirmada', '2025-01-15 00:00:00');

INSERT INTO plan_subscriptions (id, plan_id, user_id, plan_name, plan_price, subscriber_name, subscriber_email, subscriber_phone, subscriber_document, subscriber_cep, subscriber_street, subscriber_number, subscriber_neighborhood, subscriber_city, subscriber_state, payment_method, status, created_at) VALUES
  (1, 1, 1, 'Plano Essencial', 'R$40/mes', 'ONG Agua Limpa', 'contato@agualimpa.org', '(11) 9999-1111', '00011122233', '01000-000', 'Rua das Aguas', '100', 'Centro', 'Sao Paulo', 'SP', 'pix', 'ativa', '2025-01-03 00:00:00'),
  (2, 2, 2, 'Plano Avancado', 'R$80/mes', 'Saneamento para Todos', 'contato@saneamento.org', '(21) 9999-2222', '11122233344', '20000-000', 'Avenida Saude', '200', 'Centro', 'Rio de Janeiro', 'RJ', 'cartao', 'ativa', '2025-01-04 00:00:00'),
  (3, 3, 3, 'Plano Premium', 'R$120/mes', 'Rios Vivos', 'contato@riosvivos.org', '(31) 9999-3333', '22233344455', '30000-000', 'Rua da Preservacao', '300', 'Savassi', 'Belo Horizonte', 'MG', 'boleto', 'pendente', '2025-01-05 00:00:00');

INSERT INTO contact_messages (id, user_id, name, email, subject, message, newsletter, status, created_at) VALUES
  (1, NULL, 'Fernanda Lima', 'fernanda@exemplo.com', 'duvida', 'Gostaria de entender como funciona o acompanhamento das denuncias.', 1, 'nova', '2025-01-02 00:00:00'),
  (2, NULL, 'Ricardo Alves', 'ricardo@exemplo.com', 'parceria', 'Temos interesse em apoiar a plataforma com uma acao conjunta.', 0, 'nova', '2025-01-06 00:00:00'),
  (3, 11, 'João Silva', 'joao@email.com', 'sugestao', 'Seria interessante exibir noticias por regiao em destaque.', 1, 'respondida', '2025-01-08 00:00:00');

ALTER TABLE users AUTO_INCREMENT = 12;
ALTER TABLE ongs AUTO_INCREMENT = 11;
ALTER TABLE plans AUTO_INCREMENT = 4;
ALTER TABLE news AUTO_INCREMENT = 7;
ALTER TABLE donations AUTO_INCREMENT = 4;
ALTER TABLE plan_subscriptions AUTO_INCREMENT = 4;
ALTER TABLE contact_messages AUTO_INCREMENT = 4;
ALTER TABLE denuncias AUTO_INCREMENT = 17;
ALTER TABLE denuncia_responses AUTO_INCREMENT = 7;

COMMIT;
