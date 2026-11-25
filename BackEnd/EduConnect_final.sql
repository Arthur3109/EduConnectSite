-- EduConnect | SQL de integração. Base do ZIP de 13/11/2026. UTF-8.
-- Instalação NOVA, incluindo dados fictícios. Interromper na primeira falha.
SET NAMES utf8mb4;
CREATE DATABASE educonnect_integracao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE educonnect_integracao;

-- 1. tabelas somente pk

create table tb_pessoa (
    cd_pessoa int not null auto_increment,
    nm_completo varchar(255) not null,
    ds_cpf varchar(11) unique,
    ds_email varchar(255),
    ds_telefone varchar(20),
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_pessoa primary key (cd_pessoa)
) engine=InnoDB;

create table tb_papel (
    cd_papel int not null auto_increment,
    ds_codigo varchar(50) not null unique,
    constraint pk_papel primary key (cd_papel)
) engine=InnoDB;

create table tb_departamento (
    cd_departamento int not null auto_increment,
    nm_departamento varchar(100) not null unique,
    ic_ativo boolean not null,
    constraint pk_departamento primary key (cd_departamento)
) engine=InnoDB;

create table tb_serie (
    cd_serie int not null auto_increment,
    nm_serie varchar(100) not null,
    ds_etapa varchar(50) not null,
    qt_ordem int not null,
    ic_ativo boolean not null,
    constraint pk_serie primary key (cd_serie)
) engine=InnoDB;

create table tb_sala (
    cd_sala int not null auto_increment,
    ds_codigo varchar(50) not null unique,
    nm_sala varchar(100) not null,
    qt_capacidade int not null,
    ds_unidade_capacidade varchar(50),
    ds_tipo varchar(50),
    ic_permite_turma boolean not null,
    ic_ativo boolean not null,
    constraint pk_sala primary key (cd_sala)
) engine=InnoDB;

create table tb_disciplina (
    cd_disciplina int not null auto_increment,
    ds_codigo varchar(50) not null unique,
    nm_disciplina varchar(100) not null,
    qt_carga_horaria int not null,
    ic_ativa boolean not null,
    constraint pk_disciplina primary key (cd_disciplina)
) engine=InnoDB;

create table tb_periodo_letivo (
    cd_periodo int not null auto_increment,
    qt_ano_letivo smallint not null,
    qt_numero_bimestre smallint not null,
    nm_periodo varchar(100) not null,
    dt_inicio date not null,
    dt_fim date not null,
    ds_status varchar(50) not null,
    constraint pk_periodo_letivo primary key (cd_periodo)
) engine=InnoDB;

create table tb_grupo_destinatario (
    cd_grupo int not null auto_increment,
    ds_codigo varchar(50) not null unique,
    constraint pk_grupo_destinatario primary key (cd_grupo)
) engine=InnoDB;


-- 2. tabelas de pk e e fk

create table tb_usuario_acesso (
    cd_usuario int not null auto_increment,
    cd_pessoa int not null,
    ds_identificador varchar(100) not null unique,
    ds_credencial_hash varchar(255) not null,
    ic_ativo boolean not null,
    dt_criado datetime not null default current_timestamp,
    dt_ultimo_acesso datetime,
    constraint pk_usuario_acesso primary key (cd_usuario),
    constraint fk_usuario_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa)
) engine=InnoDB;

create table tb_aluno (
    cd_aluno int not null auto_increment,
    cd_pessoa int not null unique,
    ds_matricula varchar(50) not null unique,
    ds_status varchar(50) not null,
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_aluno primary key (cd_aluno),
    constraint fk_aluno_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa)
) engine=InnoDB;

create table tb_professor (
    cd_professor int not null auto_increment,
    cd_pessoa int not null unique,
    ds_registro_funcional varchar(50) not null unique,
    ds_status varchar(50) not null,
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_professor primary key (cd_professor),
    constraint fk_professor_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa)
) engine=InnoDB;

create table tb_profissional (
    cd_profissional int not null auto_increment,
    cd_pessoa int not null unique,
    ds_registro_funcional varchar(50) not null unique,
    ds_cargo varchar(100) not null,
    cd_departamento int not null,
    ds_status varchar(50) not null,
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_profissional primary key (cd_profissional),
    constraint fk_profissional_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa),
    constraint fk_profissional_departamento foreign key (cd_departamento) references tb_departamento(cd_departamento)
) engine=InnoDB;

create table tb_turma (
    cd_turma int not null auto_increment,
    ds_codigo varchar(50) not null unique,
    nm_turma varchar(100) not null,
    cd_serie int not null,
    ds_turno varchar(50) not null,
    cd_sala int not null,
    qt_capacidade int not null,
    ic_ativa boolean not null,
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_turma primary key (cd_turma),
    constraint fk_turma_serie foreign key (cd_serie) references tb_serie(cd_serie),
    constraint fk_turma_sala foreign key (cd_sala) references tb_sala(cd_sala)
) engine=InnoDB;

create table tb_matricula (
    cd_matricula int not null auto_increment,
    cd_aluno int not null,
    cd_turma int not null,
    qt_ano_letivo smallint not null,
    dt_inicio date not null,
    dt_fim date,
    ds_status varchar(50) not null,
    constraint pk_matricula primary key (cd_matricula),
    constraint fk_matricula_aluno foreign key (cd_aluno) references tb_aluno(cd_aluno),
    constraint fk_matricula_turma foreign key (cd_turma) references tb_turma(cd_turma)
) engine=InnoDB;

create table tb_atribuicao_docente (
    cd_atribuicao int not null auto_increment,
    cd_professor int not null,
    cd_disciplina int not null,
    cd_turma int not null,
    qt_ano_letivo smallint not null,
    ds_status varchar(50) not null,
    dt_criado datetime not null default current_timestamp,
    constraint pk_atribuicao_docente primary key (cd_atribuicao),
    constraint fk_atribuicao_professor foreign key (cd_professor) references tb_professor(cd_professor),
    constraint fk_atribuicao_disciplina foreign key (cd_disciplina) references tb_disciplina(cd_disciplina),
    constraint fk_atribuicao_turma foreign key (cd_turma) references tb_turma(cd_turma)
) engine=InnoDB;

create table tb_comunicado (
    cd_comunicado int not null auto_increment,
    nm_titulo varchar(255) not null,
    ds_tipo varchar(50) not null,
    ds_texto text not null,
    ds_status varchar(50) not null,
    cd_autor_usuario int not null,
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_comunicado primary key (cd_comunicado),
    constraint fk_comunicado_autor foreign key (cd_autor_usuario) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_auditoria (
    cd_auditoria int not null auto_increment,
    cd_usuario int,
    nm_usuario_snapshot varchar(255),
    ds_modulo varchar(100) not null,
    ds_acao varchar(100) not null,
    ds_descricao text,
    ds_origem_cliente varchar(100),
    dt_ocorrido datetime not null default current_timestamp,
    constraint pk_auditoria primary key (cd_auditoria),
    constraint fk_auditoria_usuario foreign key (cd_usuario) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_avaliacao (
    cd_avaliacao int not null auto_increment,
    cd_atribuicao int not null,
    cd_periodo int not null,
    nm_avaliacao varchar(100) not null,
    vl_peso decimal(5,2) not null,
    vl_nota_maxima decimal(5,2) not null,
    qt_ordem smallint not null,
    constraint pk_avaliacao primary key (cd_avaliacao),
    constraint fk_avaliacao_atribuicao foreign key (cd_atribuicao) references tb_atribuicao_docente(cd_atribuicao),
    constraint fk_avaliacao_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo)
) engine=InnoDB;

create table tb_ocorrencia (
    cd_ocorrencia int not null auto_increment,
    ds_protocolo varchar(50) not null unique,
    cd_aluno int not null,
    cd_turma int not null,
    dt_ocorrencia date not null,
    ds_tipo varchar(50) not null,
    ds_gravidade varchar(50) not null,
    ds_descricao text not null,
    ds_status varchar(50) not null,
    cd_autor_usuario int not null,
    nm_autor_snapshot varchar(255),
    dt_criado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_ocorrencia primary key (cd_ocorrencia),
    constraint fk_ocorrencia_aluno foreign key (cd_aluno) references tb_aluno(cd_aluno),
    constraint fk_ocorrencia_turma foreign key (cd_turma) references tb_turma(cd_turma),
    constraint fk_ocorrencia_autor foreign key (cd_autor_usuario) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_atestado (
    cd_atestado int not null auto_increment,
    cd_aluno int not null,
    cd_professor int,
    ds_motivo text not null,
    dt_inicio date not null,
    dt_fim date not null,
    ds_observacoes text,
    ds_status varchar(50) not null,
    dt_criado datetime not null default current_timestamp,
    constraint pk_atestado primary key (cd_atestado),
    constraint fk_atestado_aluno foreign key (cd_aluno) references tb_aluno(cd_aluno),
    constraint fk_atestado_professor foreign key (cd_professor) references tb_professor(cd_professor)
) engine=InnoDB;

create table tb_lote_boletim (
    cd_lote int not null auto_increment,
    cd_turma int not null,
    cd_periodo int not null,
    ds_status varchar(50) not null,
    qt_alunos int not null,
    cd_gerado_por int not null,
    dt_criado datetime not null default current_timestamp,
    constraint pk_lote_boletim primary key (cd_lote),
    constraint fk_lote_turma foreign key (cd_turma) references tb_turma(cd_turma),
    constraint fk_lote_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo),
    constraint fk_lote_usuario foreign key (cd_gerado_por) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_envio_comunicado (
    cd_envio int not null auto_increment,
    cd_comunicado int not null,
    dt_enviado datetime not null default current_timestamp,
    cd_enviado_por int not null,
    ds_resultado varchar(100) not null,
    constraint pk_envio_comunicado primary key (cd_envio),
    constraint fk_envio_comunicado foreign key (cd_comunicado) references tb_comunicado(cd_comunicado),
    constraint fk_envio_usuario foreign key (cd_enviado_por) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_nota (
    cd_nota int not null auto_increment,
    cd_avaliacao int not null,
    cd_matricula int not null,
    vl_nota decimal(5,2) not null,
    cd_registrado_por int not null,
    dt_registrado datetime not null default current_timestamp,
    dt_atualizado datetime not null default current_timestamp on update current_timestamp,
    constraint pk_nota primary key (cd_nota),
    constraint fk_nota_avaliacao foreign key (cd_avaliacao) references tb_avaliacao(cd_avaliacao),
    constraint fk_nota_matricula foreign key (cd_matricula) references tb_matricula(cd_matricula),
    constraint fk_nota_usuario foreign key (cd_registrado_por) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_resumo_frequencia (
    cd_frequencia int not null auto_increment,
    cd_matricula int not null,
    cd_atribuicao int not null,
    cd_periodo int not null,
    qt_aulas_dadas int not null,
    qt_presencas int not null,
    qt_faltas int not null,
    vl_frequencia_pct decimal(5,2) generated always as (round(100.0 * qt_presencas / nullif(qt_aulas_dadas, 0), 2)) stored,
    constraint pk_resumo_frequencia primary key (cd_frequencia),
    constraint fk_freq_matricula foreign key (cd_matricula) references tb_matricula(cd_matricula),
    constraint fk_freq_atribuicao foreign key (cd_atribuicao) references tb_atribuicao_docente(cd_atribuicao),
    constraint fk_freq_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo)
) engine=InnoDB;

create table tb_fechamento_periodo (
    cd_fechamento int not null auto_increment,
    cd_atribuicao int not null,
    cd_periodo int not null,
    ic_fechado boolean not null,
    cd_fechado_por int not null,
    dt_fechado datetime not null,
    constraint pk_fechamento_periodo primary key (cd_fechamento),
    constraint fk_fech_atribuicao foreign key (cd_atribuicao) references tb_atribuicao_docente(cd_atribuicao),
    constraint fk_fech_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo),
    constraint fk_fech_usuario foreign key (cd_fechado_por) references tb_usuario_acesso(cd_usuario)
) engine=InnoDB;

create table tb_anexo (
    cd_anexo int not null auto_increment,
    cd_atestado int not null,
    nm_original varchar(255) not null,
    ds_mime_type varchar(100) not null,
    qt_tamanho_bytes bigint not null,
    ds_storage_key varchar(255) not null,
    dt_criado datetime not null default current_timestamp,
    constraint pk_anexo primary key (cd_anexo),
    constraint fk_anexo_atestado foreign key (cd_atestado) references tb_atestado(cd_atestado)
) engine=InnoDB;

create table tb_boletim_aluno (
    cd_boletim_aluno int not null auto_increment,
    cd_lote int not null,
    cd_matricula int not null,
    nm_snapshot varchar(255) not null,
    constraint pk_boletim_aluno primary key (cd_boletim_aluno),
    constraint fk_bol_lote foreign key (cd_lote) references tb_lote_boletim(cd_lote),
    constraint fk_bol_matricula foreign key (cd_matricula) references tb_matricula(cd_matricula)
) engine=InnoDB;

create table tb_boletim_item (
    cd_item int not null auto_increment,
    cd_boletim_aluno int not null,
    cd_disciplina int not null,
    nm_disciplina_snapshot varchar(100) not null,
    vl_n1_snapshot decimal(5,2),
    vl_n2_snapshot decimal(5,2),
    vl_n3_snapshot decimal(5,2),
    vl_media_snapshot decimal(5,2),
    qt_faltas_snapshot int,
    vl_frequencia_snapshot decimal(5,2),
    ds_situacao_snapshot varchar(50),
    ic_fechado_snapshot boolean,
    constraint pk_boletim_item primary key (cd_item),
    constraint fk_item_boletim foreign key (cd_boletim_aluno) references tb_boletim_aluno(cd_boletim_aluno),
    constraint fk_item_disciplina foreign key (cd_disciplina) references tb_disciplina(cd_disciplina)
) engine=InnoDB;


-- 3. tabelas somente fk

create table tb_usuario_papel (
    cd_usuario int not null,
    cd_papel int not null,
    constraint pk_usuario_papel primary key (cd_usuario, cd_papel),
    constraint fk_up_usuario foreign key (cd_usuario) references tb_usuario_acesso(cd_usuario),
    constraint fk_up_papel foreign key (cd_papel) references tb_papel(cd_papel)
) engine=InnoDB;

create table tb_comunicado_destinatario (
    cd_comunicado int not null,
    cd_grupo int not null,
    constraint pk_comunicado_destinatario primary key (cd_comunicado, cd_grupo),
    constraint fk_cd_comunicado foreign key (cd_comunicado) references tb_comunicado(cd_comunicado),
    constraint fk_cd_grupo foreign key (cd_grupo) references tb_grupo_destinatario(cd_grupo)
) engine=InnoDB;
-- Restrições dos cadastros e dos lançamentos.
ALTER TABLE tb_usuario_acesso ADD UNIQUE (cd_pessoa);
ALTER TABLE tb_sala ADD CHECK (qt_capacidade > 0);
ALTER TABLE tb_turma ADD CHECK (qt_capacidade > 0),
  ADD COLUMN cd_sala_em_uso INT GENERATED ALWAYS AS (CASE WHEN ic_ativa THEN cd_sala END) STORED,
  ADD UNIQUE (cd_sala_em_uso, ds_turno);
ALTER TABLE tb_disciplina ADD CHECK (qt_carga_horaria > 0);
ALTER TABLE tb_periodo_letivo ADD UNIQUE (qt_ano_letivo, qt_numero_bimestre),
  ADD CHECK (qt_numero_bimestre BETWEEN 1 AND 4 AND dt_inicio <= dt_fim);
ALTER TABLE tb_matricula ADD UNIQUE (cd_aluno, qt_ano_letivo, dt_inicio),
  ADD CHECK (dt_fim IS NULL OR dt_fim >= dt_inicio);
ALTER TABLE tb_atribuicao_docente ADD UNIQUE (cd_turma, qt_ano_letivo, cd_disciplina);
ALTER TABLE tb_avaliacao ADD UNIQUE (cd_atribuicao, cd_periodo, qt_ordem),
  ADD CHECK (qt_ordem BETWEEN 1 AND 3 AND vl_peso > 0 AND vl_nota_maxima = 10);
ALTER TABLE tb_nota ADD UNIQUE (cd_avaliacao, cd_matricula), ADD CHECK (vl_nota BETWEEN 0 AND 10);
ALTER TABLE tb_resumo_frequencia ADD UNIQUE (cd_matricula, cd_atribuicao, cd_periodo),
  ADD CHECK (qt_presencas >= 0 AND qt_faltas >= 0 AND qt_aulas_dadas = qt_presencas + qt_faltas);
ALTER TABLE tb_fechamento_periodo ADD UNIQUE (cd_atribuicao, cd_periodo);
ALTER TABLE tb_atestado ADD CHECK (dt_inicio <= dt_fim);
ALTER TABLE tb_anexo ADD CHECK (qt_tamanho_bytes >= 0), ADD UNIQUE (ds_storage_key);
ALTER TABLE tb_boletim_aluno ADD UNIQUE (cd_lote, cd_matricula);
ALTER TABLE tb_boletim_item ADD UNIQUE (cd_boletim_aluno, cd_disciplina);

-- Um responsável pode acompanhar irmãos e um aluno pode ter vários responsáveis.
CREATE TABLE tb_aluno_responsavel (
  cd_aluno INT NOT NULL,
  cd_pessoa INT NOT NULL,
  PRIMARY KEY (cd_aluno, cd_pessoa),
  FOREIGN KEY (cd_aluno) REFERENCES tb_aluno(cd_aluno),
  FOREIGN KEY (cd_pessoa) REFERENCES tb_pessoa(cd_pessoa)
) ENGINE=InnoDB;

CREATE VIEW vw_destinatario_grupo AS
SELECT DISTINCT g.cd_grupo, p.cd_pessoa, p.nm_completo, p.ds_email
FROM tb_grupo_destinatario g
JOIN tb_pessoa p ON p.ds_email IS NOT NULL
WHERE (g.ds_codigo IN ('Todos','Alunos') AND EXISTS
       (SELECT 1 FROM tb_aluno a WHERE a.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'))
   OR (g.ds_codigo IN ('Todos','Professores') AND EXISTS
       (SELECT 1 FROM tb_professor a WHERE a.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'))
   OR (g.ds_codigo IN ('Todos','Responsáveis') AND EXISTS
       (SELECT 1 FROM tb_aluno_responsavel r JOIN tb_aluno a ON a.cd_aluno=r.cd_aluno
        WHERE r.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'))
   OR (g.ds_codigo='Todos' AND EXISTS
       (SELECT 1 FROM tb_profissional a WHERE a.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'));

-- As matrículas aparecem no diário mesmo quando ainda faltam notas.
CREATE VIEW vw_diario_base AS
SELECT m.cd_matricula, m.cd_aluno, m.cd_turma, m.qt_ano_letivo,
       a.cd_atribuicao, a.cd_disciplina, p.cd_periodo, p.qt_numero_bimestre,
       MAX(CASE WHEN v.qt_ordem=1 THEN n.vl_nota END) AS n1,
       MAX(CASE WHEN v.qt_ordem=2 THEN n.vl_nota END) AS n2,
       MAX(CASE WHEN v.qt_ordem=3 THEN n.vl_nota END) AS n3,
       CASE WHEN COUNT(n.cd_nota)=3 THEN ROUND(SUM(n.vl_nota*v.vl_peso)/SUM(v.vl_peso),1) END AS media
FROM tb_matricula m
JOIN tb_atribuicao_docente a ON a.cd_turma=m.cd_turma AND a.qt_ano_letivo=m.qt_ano_letivo
JOIN tb_periodo_letivo p ON p.qt_ano_letivo=m.qt_ano_letivo AND m.dt_inicio<=p.dt_fim
     AND (m.dt_fim IS NULL OR m.dt_fim>=p.dt_inicio)
LEFT JOIN tb_avaliacao v ON v.cd_atribuicao=a.cd_atribuicao AND v.cd_periodo=p.cd_periodo
LEFT JOIN tb_nota n ON n.cd_avaliacao=v.cd_avaliacao AND n.cd_matricula=m.cd_matricula
GROUP BY m.cd_matricula,m.cd_aluno,m.cd_turma,m.qt_ano_letivo,a.cd_atribuicao,a.cd_disciplina,p.cd_periodo,p.qt_numero_bimestre;

CREATE VIEW vw_diario AS
SELECT b.*, pe.nm_completo, d.nm_disciplina, t.nm_turma, f.qt_aulas_dadas,
       f.qt_presencas, f.qt_faltas, f.vl_frequencia_pct, COALESCE(c.ic_fechado,0) AS ic_fechado,
       CASE WHEN b.media IS NULL THEN 'Pendente' WHEN b.media>=7 THEN 'Aprovado'
            WHEN b.media>=5 THEN 'Recuperação' ELSE 'Reprovado' END AS situacao
FROM vw_diario_base b
JOIN tb_aluno al ON al.cd_aluno=b.cd_aluno JOIN tb_pessoa pe ON pe.cd_pessoa=al.cd_pessoa
JOIN tb_turma t ON t.cd_turma=b.cd_turma JOIN tb_disciplina d ON d.cd_disciplina=b.cd_disciplina
LEFT JOIN tb_resumo_frequencia f ON f.cd_matricula=b.cd_matricula AND f.cd_atribuicao=b.cd_atribuicao AND f.cd_periodo=b.cd_periodo
LEFT JOIN tb_fechamento_periodo c ON c.cd_atribuicao=b.cd_atribuicao AND c.cd_periodo=b.cd_periodo;

CREATE VIEW vw_boletim_publicado AS
SELECT l.cd_lote,l.cd_turma,l.cd_periodo,l.dt_criado,al.cd_aluno,b.cd_matricula,b.nm_snapshot AS aluno,
       i.nm_disciplina_snapshot AS disciplina,i.vl_n1_snapshot AS n1,i.vl_n2_snapshot AS n2,i.vl_n3_snapshot AS n3,
       i.vl_media_snapshot AS media,i.qt_faltas_snapshot AS faltas,i.vl_frequencia_snapshot AS frequencia,
       i.ds_situacao_snapshot AS situacao
FROM tb_lote_boletim l JOIN tb_boletim_aluno b ON b.cd_lote=l.cd_lote
JOIN tb_matricula al ON al.cd_matricula=b.cd_matricula JOIN tb_boletim_item i ON i.cd_boletim_aluno=b.cd_boletim_aluno;

CREATE VIEW vw_medias_bimestrais AS
SELECT cd_matricula, cd_disciplina, qt_ano_letivo,
 MAX(CASE WHEN qt_numero_bimestre=1 THEN media END) AS b1,
 MAX(CASE WHEN qt_numero_bimestre=2 THEN media END) AS b2,
 MAX(CASE WHEN qt_numero_bimestre=3 THEN media END) AS b3,
 MAX(CASE WHEN qt_numero_bimestre=4 THEN media END) AS b4
FROM vw_diario WHERE ic_fechado=1 GROUP BY cd_matricula, cd_disciplina, qt_ano_letivo;

DELIMITER $$
CREATE PROCEDURE sp_validar_sala(IN sala INT, IN capacidade INT, IN ativa BOOLEAN)
BEGIN
  DECLARE limite INT;
  DECLARE permite BOOLEAN;
  SELECT qt_capacidade,(ic_ativo AND ic_permite_turma) INTO limite,permite FROM tb_sala WHERE cd_sala=sala FOR UPDATE;
  IF ativa AND (COALESCE(permite,0)=0 OR capacidade>limite) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Sala indisponível ou menor que a capacidade da turma';
  END IF;
END$$
CREATE TRIGGER tr_turma_insert BEFORE INSERT ON tb_turma FOR EACH ROW
BEGIN
  CALL sp_validar_sala(NEW.cd_sala,NEW.qt_capacidade,NEW.ic_ativa);
END$$
CREATE TRIGGER tr_turma_update BEFORE UPDATE ON tb_turma FOR EACH ROW
BEGIN
  CALL sp_validar_sala(NEW.cd_sala,NEW.qt_capacidade,NEW.ic_ativa);
END$$

CREATE PROCEDURE sp_validar_matricula(IN id INT, IN aluno INT, IN turma INT, IN ano INT, IN inicio DATE, IN fim DATE)
BEGIN
  DECLARE limite,trava,ocupadas,conflitos INT;
  SELECT cd_aluno INTO trava FROM tb_aluno WHERE cd_aluno=aluno FOR UPDATE;
  SELECT qt_capacidade INTO limite FROM tb_turma WHERE cd_turma=turma AND ic_ativa FOR UPDATE;
  IF limite IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Turma inativa ou inexistente'; END IF;
  SELECT COUNT(*) INTO conflitos FROM tb_matricula m WHERE m.cd_aluno=aluno AND m.qt_ano_letivo=ano
    AND m.cd_matricula<>id AND m.dt_inicio<=COALESCE(fim,'9999-12-31')
    AND COALESCE(m.dt_fim,'9999-12-31')>=inicio;
  IF conflitos>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Já existe matrícula vigente para esse aluno nas datas informadas'; END IF;
  -- Verifica cada data em que a ocupação pode aumentar dentro do intervalo.
  SELECT COALESCE(MAX((SELECT COUNT(*) FROM tb_matricula m WHERE m.cd_turma=turma AND m.qt_ano_letivo=ano
    AND m.cd_matricula<>id AND m.dt_inicio<=datas.dia AND (m.dt_fim IS NULL OR m.dt_fim>=datas.dia))),0)
    INTO ocupadas FROM (SELECT inicio AS dia UNION SELECT dt_inicio FROM tb_matricula
      WHERE cd_turma=turma AND qt_ano_letivo=ano AND dt_inicio BETWEEN inicio AND COALESCE(fim,'9999-12-31')) datas;
  IF ocupadas>=limite THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Turma sem vaga no intervalo solicitado'; END IF;
END$$
CREATE TRIGGER tr_matricula_insert BEFORE INSERT ON tb_matricula FOR EACH ROW
BEGIN
  CALL sp_validar_matricula(0,NEW.cd_aluno,NEW.cd_turma,NEW.qt_ano_letivo,NEW.dt_inicio,NEW.dt_fim);
END$$
CREATE TRIGGER tr_matricula_update BEFORE UPDATE ON tb_matricula FOR EACH ROW
BEGIN
  IF NEW.cd_turma<>OLD.cd_turma OR NEW.cd_aluno<>OLD.cd_aluno OR NEW.qt_ano_letivo<>OLD.qt_ano_letivo THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Encerre a matrícula e crie outra para transferir o aluno';
  END IF;
  CALL sp_validar_matricula(OLD.cd_matricula,NEW.cd_aluno,NEW.cd_turma,NEW.qt_ano_letivo,NEW.dt_inicio,NEW.dt_fim);
END$$
CREATE PROCEDURE sp_validar_ocorrencia(IN aluno INT, IN turma INT, IN dia DATE)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tb_matricula WHERE cd_aluno=aluno AND cd_turma=turma
      AND dia>=dt_inicio AND (dt_fim IS NULL OR dia<=dt_fim)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Aluno fora da turma na data da ocorrência';
  END IF;
END$$
CREATE TRIGGER tr_ocorrencia_ins BEFORE INSERT ON tb_ocorrencia FOR EACH ROW
BEGIN
  CALL sp_validar_ocorrencia(NEW.cd_aluno,NEW.cd_turma,NEW.dt_ocorrencia);
END$$
CREATE TRIGGER tr_ocorrencia_upd BEFORE UPDATE ON tb_ocorrencia FOR EACH ROW
BEGIN
  CALL sp_validar_ocorrencia(NEW.cd_aluno,NEW.cd_turma,NEW.dt_ocorrencia);
END$$
DELIMITER ;

DELIMITER $$
-- Lançamentos e fechamento serializam pela turma da atribuição.
CREATE PROCEDURE sp_validar_contexto(IN atrib INT, IN periodo INT, IN matricula INT)
BEGIN
  DECLARE turma INT DEFAULT NULL;
  DECLARE trava INT;
  DECLARE fechado INT DEFAULT 0;
  SELECT a.cd_turma INTO turma FROM tb_atribuicao_docente a
    JOIN tb_periodo_letivo p ON p.qt_ano_letivo=a.qt_ano_letivo
    WHERE a.cd_atribuicao=atrib AND p.cd_periodo=periodo;
  IF turma IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Atribuição e período devem pertencer ao mesmo ano'; END IF;
  SELECT cd_turma INTO trava FROM tb_turma WHERE cd_turma=turma FOR UPDATE;
  SELECT ic_fechado INTO fechado FROM tb_fechamento_periodo
    WHERE cd_atribuicao=atrib AND cd_periodo=periodo FOR UPDATE;
  IF fechado=1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Bimestre já fechado'; END IF;
  IF matricula IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM tb_matricula m JOIN tb_periodo_letivo p ON p.qt_ano_letivo=m.qt_ano_letivo
    WHERE m.cd_matricula=matricula AND m.cd_turma=turma AND p.cd_periodo=periodo
      AND m.dt_inicio<=p.dt_fim AND (m.dt_fim IS NULL OR m.dt_fim>=p.dt_inicio)
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Matrícula fora da turma ou do período'; END IF;
END$$

CREATE PROCEDURE sp_validar_nota(IN avaliacao INT, IN matricula INT, IN nota DECIMAL(5,2))
BEGIN
  DECLARE atrib, periodo INT;
  DECLARE maxima DECIMAL(5,2);
  SELECT cd_atribuicao,cd_periodo,vl_nota_maxima INTO atrib,periodo,maxima
    FROM tb_avaliacao WHERE cd_avaliacao=avaliacao;
  IF maxima IS NULL OR nota NOT BETWEEN 0 AND maxima THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Avaliação inexistente ou nota fora da escala';
  END IF;
  CALL sp_validar_contexto(atrib,periodo,matricula);
END$$

CREATE TRIGGER tr_avaliacao_insert BEFORE INSERT ON tb_avaliacao FOR EACH ROW
BEGIN
  CALL sp_validar_contexto(NEW.cd_atribuicao,NEW.cd_periodo,NULL);
END$$
CREATE TRIGGER tr_avaliacao_update BEFORE UPDATE ON tb_avaliacao FOR EACH ROW
BEGIN
  IF NEW.cd_atribuicao<>OLD.cd_atribuicao OR NEW.cd_periodo<>OLD.cd_periodo THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Crie outra avaliação para mudar o período ou a atribuição';
  END IF;
  CALL sp_validar_contexto(OLD.cd_atribuicao,OLD.cd_periodo,NULL);
END$$
CREATE TRIGGER tr_avaliacao_delete BEFORE DELETE ON tb_avaliacao FOR EACH ROW
BEGIN
  CALL sp_validar_contexto(OLD.cd_atribuicao,OLD.cd_periodo,NULL);
END$$

-- Chamar as duas rotinas públicas abaixo fora de transação. Cada uma controla o próprio COMMIT.
CREATE PROCEDURE sp_fechar_bimestre(IN atrib INT, IN periodo INT, IN usuario INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  CALL sp_validar_contexto(atrib,periodo,NULL);
  IF NOT EXISTS (
    SELECT 1 FROM tb_usuario_acesso u JOIN tb_usuario_papel up ON up.cd_usuario=u.cd_usuario
    JOIN tb_papel p ON p.cd_papel=up.cd_papel
    WHERE u.cd_usuario=usuario AND u.ic_ativo AND (p.ds_codigo='Secretaria' OR (p.ds_codigo='Professor'
    AND EXISTS (SELECT 1 FROM tb_atribuicao_docente a JOIN tb_professor pr ON pr.cd_professor=a.cd_professor
                WHERE a.cd_atribuicao=atrib AND pr.cd_pessoa=u.cd_pessoa)))
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Usuário sem permissão de fechamento'; END IF;
  IF NOT EXISTS (SELECT 1 FROM vw_diario WHERE cd_atribuicao=atrib AND cd_periodo=periodo)
     OR EXISTS (SELECT 1 FROM vw_diario WHERE cd_atribuicao=atrib AND cd_periodo=periodo
     AND (media IS NULL OR vl_frequencia_pct IS NULL)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Preencha três notas e a frequência de cada matrícula antes de fechar';
  END IF;
  INSERT INTO tb_fechamento_periodo(cd_atribuicao,cd_periodo,ic_fechado,cd_fechado_por,dt_fechado)
    VALUES(atrib,periodo,1,usuario,CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE ic_fechado=1, cd_fechado_por=usuario,dt_fechado=CURRENT_TIMESTAMP;
  INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao)
    VALUES(usuario,'Notas','Fechamento',CONCAT('Atribuição ',atrib,', período ',periodo));
  COMMIT;
END$$

CREATE PROCEDURE sp_gerar_boletins(IN turma INT, IN periodo INT, IN usuario INT)
BEGIN
  DECLARE trava,lote,total INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  SELECT cd_turma INTO trava FROM tb_turma WHERE cd_turma=turma FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM tb_usuario_papel up JOIN tb_papel p ON p.cd_papel=up.cd_papel
      JOIN tb_usuario_acesso u ON u.cd_usuario=up.cd_usuario
      WHERE up.cd_usuario=usuario AND u.ic_ativo AND p.ds_codigo='Secretaria') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Somente a secretaria pode emitir lotes';
  END IF;
  SELECT COUNT(DISTINCT cd_matricula) INTO total FROM vw_diario WHERE cd_turma=turma AND cd_periodo=periodo;
  IF total=0 OR EXISTS (SELECT 1 FROM vw_diario WHERE cd_turma=turma AND cd_periodo=periodo
    AND (ic_fechado=0 OR media IS NULL OR vl_frequencia_pct IS NULL)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='A turma precisa ter diário completo e todas as disciplinas fechadas';
  END IF;
  INSERT INTO tb_lote_boletim(cd_turma,cd_periodo,ds_status,qt_alunos,cd_gerado_por)
    VALUES(turma,periodo,'Gerado',total,usuario);
  SET lote=LAST_INSERT_ID();
  INSERT INTO tb_boletim_aluno(cd_lote,cd_matricula,nm_snapshot)
    SELECT DISTINCT lote,cd_matricula,nm_completo FROM vw_diario WHERE cd_turma=turma AND cd_periodo=periodo;
  INSERT INTO tb_boletim_item(cd_boletim_aluno,cd_disciplina,nm_disciplina_snapshot,vl_n1_snapshot,
    vl_n2_snapshot,vl_n3_snapshot,vl_media_snapshot,qt_faltas_snapshot,vl_frequencia_snapshot,ds_situacao_snapshot,ic_fechado_snapshot)
    SELECT b.cd_boletim_aluno,d.cd_disciplina,d.nm_disciplina,d.n1,d.n2,d.n3,d.media,d.qt_faltas,
      d.vl_frequencia_pct,d.situacao,d.ic_fechado FROM vw_diario d
      JOIN tb_boletim_aluno b ON b.cd_matricula=d.cd_matricula AND b.cd_lote=lote
      WHERE d.cd_turma=turma AND d.cd_periodo=periodo;
  INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao)
    VALUES(usuario,'Boletins','Emissão',CONCAT('Lote ',lote,', turma ',turma,', período ',periodo));
  COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER tr_nota_insert BEFORE INSERT ON tb_nota
FOR EACH ROW
BEGIN
  CALL sp_validar_nota(NEW.cd_avaliacao, NEW.cd_matricula, NEW.vl_nota);
END$$
CREATE TRIGGER tr_resumo_frequencia_insert BEFORE INSERT ON tb_resumo_frequencia
FOR EACH ROW
BEGIN
  CALL sp_validar_contexto(NEW.cd_atribuicao, NEW.cd_periodo, NEW.cd_matricula);
END$$
CREATE TRIGGER tr_nota_update BEFORE UPDATE ON tb_nota
FOR EACH ROW
BEGIN
  IF NEW.cd_avaliacao <> OLD.cd_avaliacao OR NEW.cd_matricula <> OLD.cd_matricula THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Para mudar o vínculo, remova o lançamento aberto e cadastre novamente';
  END IF;
  CALL sp_validar_nota(NEW.cd_avaliacao, NEW.cd_matricula, NEW.vl_nota);
END$$
CREATE TRIGGER tr_resumo_frequencia_update BEFORE UPDATE ON tb_resumo_frequencia
FOR EACH ROW
BEGIN
  IF NEW.cd_atribuicao <> OLD.cd_atribuicao OR NEW.cd_periodo <> OLD.cd_periodo OR NEW.cd_matricula <> OLD.cd_matricula THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Para mudar o vínculo, remova o lançamento aberto e cadastre novamente';
  END IF;
  CALL sp_validar_contexto(NEW.cd_atribuicao, NEW.cd_periodo, NEW.cd_matricula);
END$$
CREATE TRIGGER tr_nota_delete BEFORE DELETE ON tb_nota
FOR EACH ROW
BEGIN
  CALL sp_validar_nota(OLD.cd_avaliacao, OLD.cd_matricula, OLD.vl_nota);
END$$
CREATE TRIGGER tr_resumo_frequencia_delete BEFORE DELETE ON tb_resumo_frequencia
FOR EACH ROW
BEGIN
  CALL sp_validar_contexto(OLD.cd_atribuicao, OLD.cd_periodo, OLD.cd_matricula);
END$$
DELIMITER ;

-- Carga fictícia. IDs explícitos tornam o exemplo fácil de acompanhar.
START TRANSACTION;
INSERT INTO tb_papel(cd_papel,ds_codigo) VALUES (1,'Secretaria'),(2,'Professor'),(3,'Aluno');
INSERT INTO tb_grupo_destinatario(cd_grupo,ds_codigo) VALUES (1,'Todos'),(2,'Alunos'),(3,'Professores'),(4,'Responsáveis');
INSERT INTO tb_departamento(cd_departamento,nm_departamento,ic_ativo) VALUES (1,'Secretaria escolar',1);
INSERT INTO tb_serie(cd_serie,nm_serie,ds_etapa,qt_ordem,ic_ativo) VALUES
  (1,'3º ano','Ensino Médio',3,1),(2,'6º ano','Ensino Fundamental',6,1),
  (3,'7º ano','Ensino Fundamental',7,1),(4,'8º ano','Ensino Fundamental',8,1);
INSERT INTO tb_sala(cd_sala,ds_codigo,nm_sala,qt_capacidade,ds_unidade_capacidade,ds_tipo,ic_permite_turma,ic_ativo) VALUES
  (1,'101','Sala 101',40,'alunos','Sala de aula',1,1),(2,'102','Sala 102',40,'alunos','Sala de aula',1,1),
  (3,'103','Sala 103',35,'alunos','Sala de aula',1,1),(4,'104','Sala 104',30,'alunos','Sala de aula',1,1),
  (5,'LAB-A','Laboratório A',30,'computadores','Laboratório',0,1);
INSERT INTO tb_turma(cd_turma,ds_codigo,nm_turma,cd_serie,ds_turno,cd_sala,qt_capacidade,ic_ativa) VALUES
  (1,'3A-EM','3º Ano A',1,'Matutino',1,40,1),(2,'6A','6º Ano A',2,'Matutino',2,40,1),
  (3,'6B','6º Ano B',2,'Vespertino',2,40,1),(4,'7A','7º Ano A',3,'Matutino',3,35,1),
  (5,'7D','7º Ano D',3,'Vespertino',3,35,1),(6,'8C','8º Ano C',4,'Matutino',4,30,1);
INSERT INTO tb_disciplina(cd_disciplina,ds_codigo,nm_disciplina,qt_carga_horaria,ic_ativa) VALUES
  (1,'MAT-101','Matemática',100,1),(2,'PORT-202','Língua Portuguesa',150,1);
INSERT INTO tb_periodo_letivo(cd_periodo,qt_ano_letivo,qt_numero_bimestre,nm_periodo,dt_inicio,dt_fim,ds_status) VALUES
  (1,2026,1,'1º Bimestre','2026-02-02','2026-04-17','Encerrado'),
  (2,2026,2,'2º Bimestre','2026-04-20','2026-06-30','Aberto'),
  (3,2026,3,'3º Bimestre','2026-08-03','2026-09-30','Planejado'),
  (4,2026,4,'4º Bimestre','2026-10-01','2026-12-18','Planejado');
INSERT INTO tb_pessoa(cd_pessoa,nm_completo,ds_email) VALUES
  (1,'Clara Exemplo','secretaria@example.invalid'),(2,'Caio Exemplo','professor@example.invalid'),
  (3,'Ana Exemplo','aluno@example.invalid'),(4,'Bruno Exemplo','bruno@example.invalid'),
  (5,'Rita Exemplo','responsavel@example.invalid'),(6,'Lia Exemplo','lia@example.invalid');
INSERT INTO tb_usuario_acesso(cd_usuario,cd_pessoa,ds_identificador,ds_credencial_hash,ic_ativo) VALUES
  (1,1,'secretaria@example.invalid','$2y$10$SSlM5XHeZ2xJI6lfQZdhbeFf93c9pJsOB5FNlcJpY6SDVVVnN5EaC',1),(2,2,'professor@example.invalid','$2y$10$SSlM5XHeZ2xJI6lfQZdhbeFf93c9pJsOB5FNlcJpY6SDVVVnN5EaC',1),
  (3,3,'aluno@example.invalid','$2y$10$SSlM5XHeZ2xJI6lfQZdhbeFf93c9pJsOB5FNlcJpY6SDVVVnN5EaC',1);
INSERT INTO tb_usuario_papel(cd_usuario,cd_papel) VALUES (1,1),(2,2),(3,3);
INSERT INTO tb_profissional(cd_profissional,cd_pessoa,ds_registro_funcional,ds_cargo,cd_departamento,ds_status)
  VALUES (1,1,'EMP2026001','Secretária',1,'Ativo');
INSERT INTO tb_professor(cd_professor,cd_pessoa,ds_registro_funcional,ds_status) VALUES (1,2,'PROF2026001','Ativo');
INSERT INTO tb_aluno(cd_aluno,cd_pessoa,ds_matricula,ds_status) VALUES
  (1,3,'20260001','Ativo'),(2,4,'20260002','Ativo'),(3,6,'20260003','Ativo');
INSERT INTO tb_aluno_responsavel(cd_aluno,cd_pessoa) VALUES (1,5);
INSERT INTO tb_matricula(cd_matricula,cd_aluno,cd_turma,qt_ano_letivo,dt_inicio,ds_status) VALUES
  (1,1,1,2026,'2026-02-02','Ativa'),(2,2,1,2026,'2026-02-02','Ativa'),(3,3,2,2026,'2026-02-02','Ativa');
INSERT INTO tb_atribuicao_docente(cd_atribuicao,cd_professor,cd_disciplina,cd_turma,qt_ano_letivo,ds_status)
  VALUES (1,1,1,1,2026,'Ativo'),(2,1,2,1,2026,'Ativo'),(3,1,1,2,2026,'Ativo');
INSERT INTO tb_avaliacao(cd_avaliacao,cd_atribuicao,cd_periodo,nm_avaliacao,vl_peso,vl_nota_maxima,qt_ordem) VALUES
  (1,1,1,'N1',1,10,1),(2,1,1,'N2',1,10,2),(3,1,1,'N3',1,10,3),
  (4,2,1,'N1',1,10,1),(5,2,1,'N2',1,10,2),(6,2,1,'N3',1,10,3),
  (7,1,2,'N1',1,10,1),(8,1,2,'N2',1,10,2),(9,1,2,'N3',1,10,3);
INSERT INTO tb_nota(cd_avaliacao,cd_matricula,vl_nota,cd_registrado_por) VALUES
  (1,1,8.5,2),(2,1,7,2),(3,1,9,2),(4,1,8,2),(5,1,7,2),(6,1,9,2),
  (1,2,5.5,2),(2,2,6,2),(3,2,4.5,2),(4,2,4,2),(5,2,3.5,2),(6,2,5,2);
INSERT INTO tb_resumo_frequencia(cd_matricula,cd_atribuicao,cd_periodo,qt_aulas_dadas,qt_presencas,qt_faltas) VALUES
  (1,1,1,40,38,2),(2,1,1,40,31,9),(1,2,1,40,40,0),(2,2,1,40,29,11);
INSERT INTO tb_ocorrencia(ds_protocolo,cd_aluno,cd_turma,dt_ocorrencia,ds_tipo,ds_gravidade,ds_descricao,ds_status,cd_autor_usuario,nm_autor_snapshot)
  VALUES ('OCO-DEMO-001',1,1,'2026-03-18','Pedagógica','Baixa','Acompanhamento de atividade.','Pendente',2,'Caio Exemplo');
INSERT INTO tb_atestado(cd_atestado,cd_aluno,cd_professor,ds_motivo,dt_inicio,dt_fim,ds_status)
  VALUES (1,1,1,'Ausência justificada no exemplo','2026-03-19','2026-03-20','Recebido');
INSERT INTO tb_comunicado(cd_comunicado,nm_titulo,ds_tipo,ds_texto,ds_status,cd_autor_usuario)
  VALUES (1,'Reunião do bimestre','Aviso','Exemplo de convite para a reunião escolar.','Rascunho',1);
INSERT INTO tb_comunicado_destinatario(cd_comunicado,cd_grupo) VALUES (1,4);
COMMIT;

CALL sp_fechar_bimestre(1,1,2);
CALL sp_fechar_bimestre(2,1,2);
CALL sp_gerar_boletins(1,1,1);

-- Resultado da instalação: quatro linhas, duas disciplinas para cada uma das duas matrículas.
SELECT aluno,disciplina,n1,n2,n3,media,frequencia,situacao
FROM vw_boletim_publicado WHERE cd_lote=1 ORDER BY cd_matricula,disciplina;

-- Prática no segundo bimestre (retire o prefixo de comentário para executar).
-- INSERT INTO tb_nota(cd_avaliacao,cd_matricula,vl_nota,cd_registrado_por) VALUES(7,1,8,2);
-- SELECT * FROM vw_diario WHERE cd_turma=1 AND cd_periodo=2;
-- Para emitir outro lote completo, preencha também Português e a frequência,
-- feche cada disciplina com sp_fechar_bimestre e chame sp_gerar_boletins.
-- O anexo guarda metadados de um arquivo efetivamente enviado pela aplicação.
-- O histórico de envio deve ser gravado depois da tentativa real de comunicação.

CREATE OR REPLACE VIEW vw_diario AS
SELECT b.*, pe.nm_completo, d.nm_disciplina, t.nm_turma, f.qt_aulas_dadas,
       f.qt_presencas, f.qt_faltas, f.vl_frequencia_pct, COALESCE(c.ic_fechado,0) AS ic_fechado,
       CASE WHEN b.media IS NULL THEN 'Não definida' WHEN b.media>=7 THEN 'Aprovado'
            WHEN b.media>=5 THEN 'Recuperação' ELSE 'Reprovado' END AS situacao
FROM vw_diario_base b
JOIN tb_aluno al ON al.cd_aluno=b.cd_aluno JOIN tb_pessoa pe ON pe.cd_pessoa=al.cd_pessoa
JOIN tb_turma t ON t.cd_turma=b.cd_turma JOIN tb_disciplina d ON d.cd_disciplina=b.cd_disciplina
LEFT JOIN tb_resumo_frequencia f ON f.cd_matricula=b.cd_matricula AND f.cd_atribuicao=b.cd_atribuicao AND f.cd_periodo=b.cd_periodo
LEFT JOIN tb_fechamento_periodo c ON c.cd_atribuicao=b.cd_atribuicao AND c.cd_periodo=b.cd_periodo;

CREATE OR REPLACE VIEW vw_destinatario_grupo AS
SELECT DISTINCT g.cd_grupo, p.cd_pessoa, p.nm_completo, p.ds_email
FROM tb_grupo_destinatario g
CROSS JOIN tb_pessoa p
WHERE (g.ds_codigo IN ('Todos','Alunos') AND EXISTS
       (SELECT 1 FROM tb_aluno a WHERE a.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'))
   OR (g.ds_codigo IN ('Todos','Professores') AND EXISTS
       (SELECT 1 FROM tb_professor a WHERE a.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'))
   OR (g.ds_codigo IN ('Todos','Responsáveis') AND EXISTS
       (SELECT 1 FROM tb_aluno_responsavel r JOIN tb_aluno a ON a.cd_aluno=r.cd_aluno
        WHERE r.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'))
   OR (g.ds_codigo='Todos' AND EXISTS
       (SELECT 1 FROM tb_profissional a WHERE a.cd_pessoa=p.cd_pessoa AND a.ds_status='Ativo'));

DROP PROCEDURE sp_fechar_bimestre;
DELIMITER $$
CREATE PROCEDURE sp_fechar_bimestre(IN atrib INT, IN periodo INT, IN usuario INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
  START TRANSACTION;
  CALL sp_validar_contexto(atrib,periodo,NULL);
  IF NOT EXISTS (
    SELECT 1 FROM tb_usuario_acesso u JOIN tb_usuario_papel up ON up.cd_usuario=u.cd_usuario
    JOIN tb_papel p ON p.cd_papel=up.cd_papel
    WHERE u.cd_usuario=usuario AND u.ic_ativo AND (p.ds_codigo='Secretaria' OR (p.ds_codigo='Professor'
    AND EXISTS (SELECT 1 FROM tb_atribuicao_docente a JOIN tb_professor pr ON pr.cd_professor=a.cd_professor
                WHERE a.cd_atribuicao=atrib AND pr.cd_pessoa=u.cd_pessoa)))
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Usuário sem permissão de fechamento'; END IF;
  IF NOT EXISTS (SELECT 1 FROM vw_diario WHERE cd_atribuicao=atrib AND cd_periodo=periodo)
     OR EXISTS (SELECT 1 FROM vw_diario WHERE cd_atribuicao=atrib AND cd_periodo=periodo
     AND (media IS NULL OR vl_frequencia_pct IS NULL)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Preencha três notas e a frequência de cada matrícula antes de fechar';
  END IF;
  INSERT INTO tb_fechamento_periodo(cd_atribuicao,cd_periodo,ic_fechado,cd_fechado_por,dt_fechado)
    VALUES(atrib,periodo,1,usuario,CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE ic_fechado=1, cd_fechado_por=usuario,dt_fechado=CURRENT_TIMESTAMP;
  INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao)
    VALUES(usuario,'Notas','Fechamento',CONCAT('Atribuição ',atrib,', período ',periodo));
  COMMIT;
END$$
DELIMITER ;

-- Extensões do modelo de 13/11/2026. Executar uma vez no schema selecionado.
CREATE TABLE tb_versao_banco (
  versao VARCHAR(32) PRIMARY KEY, aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
ALTER TABLE tb_atestado MODIFY cd_aluno INT NULL,
  ADD COLUMN ds_titular ENUM('Aluno','Professor') NOT NULL DEFAULT 'Aluno',
  ADD CONSTRAINT ck_atestado_titular CHECK (
    (ds_titular='Aluno' AND cd_aluno IS NOT NULL) OR
    (ds_titular='Professor' AND cd_professor IS NOT NULL AND cd_aluno IS NULL));
-- O professor opcional dos atestados antigos de aluno permanece associado.
INSERT INTO tb_papel(ds_codigo)
SELECT perfis.codigo FROM (
  SELECT 'Coordenação' AS codigo UNION ALL SELECT 'Administração' UNION ALL SELECT 'Responsável'
  UNION ALL SELECT 'Orientação' UNION ALL SELECT 'Direção'
) perfis WHERE NOT EXISTS (SELECT 1 FROM tb_papel p WHERE p.ds_codigo=perfis.codigo);

CREATE TABLE tb_revisao_diario (
  cd_matricula INT NOT NULL, cd_atribuicao INT NOT NULL, cd_periodo INT NOT NULL,
  nr_revisao INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (cd_matricula,cd_atribuicao,cd_periodo),
  FOREIGN KEY (cd_matricula) REFERENCES tb_matricula(cd_matricula),
  FOREIGN KEY (cd_atribuicao) REFERENCES tb_atribuicao_docente(cd_atribuicao),
  FOREIGN KEY (cd_periodo) REFERENCES tb_periodo_letivo(cd_periodo)
) ENGINE=InnoDB;

CREATE TABLE tb_chamada (
  cd_matricula INT NOT NULL, cd_atribuicao INT NOT NULL, cd_periodo INT NOT NULL,
  dt_aula DATE NOT NULL, nr_aula SMALLINT UNSIGNED NOT NULL,
  ds_presenca ENUM('Presente','Falta','Justificada') NOT NULL,
  cd_usuario INT NOT NULL, dt_atualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cd_matricula,cd_atribuicao,cd_periodo,dt_aula,nr_aula),
  CHECK(nr_aula>0),
  FOREIGN KEY (cd_matricula,cd_atribuicao,cd_periodo) REFERENCES tb_revisao_diario(cd_matricula,cd_atribuicao,cd_periodo),
  FOREIGN KEY (cd_usuario) REFERENCES tb_usuario_acesso(cd_usuario)
) ENGINE=InnoDB;

ALTER TABLE tb_comunicado ADD COLUMN ic_urgente BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE tb_comunicado_turma (
  cd_comunicado INT NOT NULL, cd_turma INT NOT NULL, PRIMARY KEY(cd_comunicado,cd_turma),
  FOREIGN KEY(cd_comunicado) REFERENCES tb_comunicado(cd_comunicado),
  FOREIGN KEY(cd_turma) REFERENCES tb_turma(cd_turma)
) ENGINE=InnoDB;
CREATE TABLE tb_comunicado_leitura (
  cd_comunicado INT NOT NULL, cd_usuario INT NOT NULL, dt_lido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(cd_comunicado,cd_usuario), FOREIGN KEY(cd_comunicado) REFERENCES tb_comunicado(cd_comunicado),
  FOREIGN KEY(cd_usuario) REFERENCES tb_usuario_acesso(cd_usuario)
) ENGINE=InnoDB;
CREATE VIEW vw_caixa_comunicados AS
SELECT DISTINCT u.cd_usuario,c.cd_comunicado,c.nm_titulo,c.ds_texto,c.ds_tipo,c.ic_urgente,l.dt_lido
FROM tb_comunicado c JOIN tb_usuario_acesso u ON u.ic_ativo=1
LEFT JOIN tb_comunicado_leitura l ON l.cd_usuario=u.cd_usuario AND l.cd_comunicado=c.cd_comunicado
WHERE c.ds_status='Enviado' AND (
 EXISTS (SELECT 1 FROM tb_comunicado_destinatario g JOIN vw_destinatario_grupo d ON d.cd_grupo=g.cd_grupo
         WHERE g.cd_comunicado=c.cd_comunicado AND d.cd_pessoa=u.cd_pessoa)
 OR EXISTS (SELECT 1 FROM tb_comunicado_turma t JOIN tb_matricula m ON m.cd_turma=t.cd_turma JOIN tb_aluno a ON a.cd_aluno=m.cd_aluno
         WHERE t.cd_comunicado=c.cd_comunicado AND a.cd_pessoa=u.cd_pessoa AND CURRENT_DATE BETWEEN m.dt_inicio AND COALESCE(m.dt_fim,'9999-12-31')
         AND m.qt_ano_letivo=YEAR(CURRENT_DATE)));

CREATE TABLE tb_evento_escolar (
 cd_evento INT AUTO_INCREMENT PRIMARY KEY, cd_turma INT NULL, cd_usuario INT NOT NULL,
 nm_evento VARCHAR(160) NOT NULL, ds_tipo VARCHAR(40) NOT NULL, dt_inicio DATETIME NOT NULL, dt_fim DATETIME NOT NULL,
 CHECK(dt_fim>=dt_inicio), INDEX(cd_turma,dt_inicio),
 FOREIGN KEY(cd_turma) REFERENCES tb_turma(cd_turma), FOREIGN KEY(cd_usuario) REFERENCES tb_usuario_acesso(cd_usuario)
) ENGINE=InnoDB;
CREATE TABLE tb_atividade (
 cd_atividade INT AUTO_INCREMENT PRIMARY KEY, cd_atribuicao INT NOT NULL, nm_atividade VARCHAR(160) NOT NULL,
 ds_instrucoes TEXT, dt_prazo DATETIME NOT NULL, INDEX(cd_atribuicao,dt_prazo),
 FOREIGN KEY(cd_atribuicao) REFERENCES tb_atribuicao_docente(cd_atribuicao)
) ENGINE=InnoDB;
CREATE TABLE tb_entrega_atividade (
 cd_atividade INT NOT NULL, cd_matricula INT NOT NULL, dt_entrega DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(cd_atividade,cd_matricula), FOREIGN KEY(cd_atividade) REFERENCES tb_atividade(cd_atividade),
 FOREIGN KEY(cd_matricula) REFERENCES tb_matricula(cd_matricula)
) ENGINE=InnoDB;

CREATE VIEW vw_diario_integracao AS
SELECT d.*,al.ds_matricula AS matricula, t.ds_codigo AS codigo_turma, p.nm_periodo AS bimestre,
 COALESCE(r.nr_revisao,0) AS revisao,
 CASE WHEN vl_frequencia_pct IS NULL THEN 'Não definida' WHEN vl_frequencia_pct>=85 THEN 'Regular'
      WHEN vl_frequencia_pct>=75 THEN 'Atenção' ELSE 'Risco' END AS situacao_frequencia,
 CASE WHEN qt_aulas_dadas>0 AND qt_faltas*5>=qt_aulas_dadas THEN 1 ELSE 0 END AS alerta_faltas
FROM vw_diario d JOIN tb_aluno al ON al.cd_aluno=d.cd_aluno JOIN tb_turma t ON t.cd_turma=d.cd_turma
JOIN tb_periodo_letivo p ON p.cd_periodo=d.cd_periodo
LEFT JOIN tb_revisao_diario r ON r.cd_matricula=d.cd_matricula AND r.cd_atribuicao=d.cd_atribuicao AND r.cd_periodo=d.cd_periodo;
CREATE INDEX ix_lote_consulta ON tb_lote_boletim(cd_turma,cd_periodo,cd_lote);
CREATE VIEW vw_boletim_vigente AS
SELECT b.* FROM vw_boletim_publicado b
WHERE NOT EXISTS (SELECT 1 FROM tb_lote_boletim posterior
 WHERE posterior.cd_turma=b.cd_turma AND posterior.cd_periodo=b.cd_periodo AND posterior.cd_lote>b.cd_lote);
CREATE VIEW vw_acesso_diario AS
SELECT DISTINCT u.cd_usuario,d.cd_matricula,d.cd_atribuicao,d.cd_periodo
FROM tb_usuario_acesso u JOIN tb_usuario_papel up ON up.cd_usuario=u.cd_usuario
JOIN tb_papel p ON p.cd_papel=up.cd_papel JOIN vw_diario_base d ON 1=1
JOIN tb_aluno a ON a.cd_aluno=d.cd_aluno JOIN tb_atribuicao_docente ad ON ad.cd_atribuicao=d.cd_atribuicao
JOIN tb_professor pr ON pr.cd_professor=ad.cd_professor
WHERE u.ic_ativo=1 AND (p.ds_codigo IN ('Secretaria','Coordenação','Administração','Direção')
 OR (p.ds_codigo='Professor' AND pr.cd_pessoa=u.cd_pessoa AND pr.ds_status='Ativo')
 OR (p.ds_codigo='Aluno' AND a.cd_pessoa=u.cd_pessoa)
 OR (p.ds_codigo='Responsável' AND EXISTS(SELECT 1 FROM tb_aluno_responsavel ar WHERE ar.cd_aluno=a.cd_aluno AND ar.cd_pessoa=u.cd_pessoa)));


CREATE TABLE tb_encerramento_ano (
 qt_ano_letivo SMALLINT PRIMARY KEY, cd_diretor INT NOT NULL, dt_encerrado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(cd_diretor) REFERENCES tb_usuario_acesso(cd_usuario)
) ENGINE=InnoDB;

DELIMITER $$
-- Interna. A transação e a autorização pertencem a sp_editar_diario.
CREATE PROCEDURE sp_definir_nota(IN atrib INT, IN periodo INT, IN mat INT, IN ordem INT,
 IN valor DECIMAL(5,2), IN ator INT)
BEGIN
 DECLARE avaliacao INT;
 SELECT MAX(cd_avaliacao) INTO avaliacao FROM tb_avaliacao
 WHERE cd_atribuicao=atrib AND cd_periodo=periodo AND qt_ordem=ordem;
 IF valor IS NULL THEN
   DELETE FROM tb_nota WHERE cd_avaliacao=avaliacao AND cd_matricula=mat;
 ELSE
   IF avaliacao IS NULL THEN
     INSERT INTO tb_avaliacao(cd_atribuicao,cd_periodo,nm_avaliacao,vl_peso,vl_nota_maxima,qt_ordem)
     VALUES(atrib,periodo,CONCAT('N',ordem),1,10,ordem);
     SET avaliacao=LAST_INSERT_ID();
   END IF;
   INSERT INTO tb_nota(cd_avaliacao,cd_matricula,vl_nota,cd_registrado_por) VALUES(avaliacao,mat,valor,ator)
   ON DUPLICATE KEY UPDATE vl_nota=valor,cd_registrado_por=ator;
 END IF;
END$$

CREATE PROCEDURE sp_editar_diario(IN ator INT, IN mat INT, IN atrib INT, IN periodo INT, IN revisao_esperada INT,
 IN operacao VARCHAR(20), IN nota1 DECIMAL(5,2), IN nota2 DECIMAL(5,2), IN nota3 DECIMAL(5,2),
 IN aulas INT, IN presentes INT, IN dia DATE, IN numero_aula SMALLINT, IN presenca VARCHAR(20), IN motivo VARCHAR(500))
BEGIN
 DECLARE turma,ano,fechado,atual,docente,secretaria,gestor,diretor,trava,qtd,pres,detalhes INT DEFAULT 0;
 DECLARE anterior, posterior TEXT;
 DECLARE marca_antiga VARCHAR(20);
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
 START TRANSACTION;
 SELECT a.cd_turma,a.qt_ano_letivo INTO turma,ano FROM tb_atribuicao_docente a WHERE a.cd_atribuicao=atrib;
 SELECT cd_turma INTO trava FROM tb_turma WHERE cd_turma=turma FOR UPDATE;
 SELECT COALESCE(MAX(p.ds_codigo='Professor' AND EXISTS(SELECT 1 FROM tb_professor pr JOIN tb_atribuicao_docente a
   ON a.cd_professor=pr.cd_professor WHERE a.cd_atribuicao=atrib AND pr.cd_pessoa=u.cd_pessoa AND pr.ds_status='Ativo')),0),
 COALESCE(MAX(p.ds_codigo='Secretaria'),0), COALESCE(MAX(p.ds_codigo IN ('Administração','Coordenação','Direção')),0),
 COALESCE(MAX(p.ds_codigo='Direção'),0) INTO docente,secretaria,gestor,diretor
 FROM tb_usuario_acesso u JOIN tb_usuario_papel up ON up.cd_usuario=u.cd_usuario JOIN tb_papel p ON p.cd_papel=up.cd_papel
 WHERE u.cd_usuario=ator AND u.ic_ativo=1;
 IF docente+secretaria+gestor=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Sem permissão de escrita nesta atribuição'; END IF;
 IF EXISTS(SELECT 1 FROM tb_encerramento_ano WHERE qt_ano_letivo=ano) AND
   (diretor=0 OR NULLIF(TRIM(motivo),'') IS NULL) THEN
   SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Ano encerrado: correção exige direção e justificativa';
 END IF;
 IF mat IS NULL OR NOT EXISTS(SELECT 1 FROM vw_diario_base b WHERE b.cd_atribuicao=atrib AND b.cd_matricula=mat AND b.cd_periodo=periodo)
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Matrícula incompatível com turma, atribuição ou período'; END IF;
 IF EXISTS(SELECT 1 FROM tb_periodo_letivo WHERE cd_periodo=periodo AND ds_status='Planejado')
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Período planejado: abra o período antes de lançar'; END IF;
 IF EXISTS(SELECT 1 FROM tb_periodo_letivo WHERE cd_periodo=periodo AND ds_status='Encerrado')
 AND (gestor=0 OR NULLIF(TRIM(motivo),'') IS NULL)
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Bimestre fechado: correção exige gestão e justificativa'; END IF;
 SELECT ic_fechado INTO fechado FROM tb_fechamento_periodo WHERE cd_atribuicao=atrib AND cd_periodo=periodo FOR UPDATE;
 IF fechado=1 THEN
   IF gestor=0 OR NULLIF(TRIM(motivo),'') IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Bimestre fechado: correção exige gestão e justificativa'; END IF;
   UPDATE tb_fechamento_periodo SET ic_fechado=0 WHERE cd_atribuicao=atrib AND cd_periodo=periodo;
 END IF;
 CALL sp_validar_contexto(atrib,periodo,mat);
 INSERT INTO tb_revisao_diario(cd_matricula,cd_atribuicao,cd_periodo) VALUES(mat,atrib,periodo)
 ON DUPLICATE KEY UPDATE nr_revisao=nr_revisao;
 SELECT nr_revisao INTO atual FROM tb_revisao_diario WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo FOR UPDATE;
 IF revisao_esperada IS NULL OR atual<>revisao_esperada THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Registro alterado: recarregue o diário'; END IF;
 SELECT JSON_OBJECT('n1',n1,'n2',n2,'n3',n3,'aulas',qt_aulas_dadas,'presencas',qt_presencas) INTO anterior
 FROM vw_diario WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo;
 IF operacao='Notas' THEN
   IF fechado=1 AND (nota1 IS NULL OR nota2 IS NULL OR nota3 IS NULL) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Retificação deve manter as três notas'; END IF;
   CALL sp_definir_nota(atrib,periodo,mat,1,nota1,ator);
   CALL sp_definir_nota(atrib,periodo,mat,2,nota2,ator);
   CALL sp_definir_nota(atrib,periodo,mat,3,nota3,ator);
 ELSEIF operacao IN ('Frequência','Chamada') THEN
   SELECT COUNT(*) INTO detalhes FROM tb_chamada WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo;
   IF operacao='Frequência' THEN
     IF detalhes>0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Edite a chamada por aula para atualizar este total'; END IF;
     SET qtd=aulas, pres=presentes;
   ELSE
     IF dia IS NULL OR numero_aula IS NULL OR numero_aula<1 OR presenca IS NULL OR presenca NOT IN ('Presente','Falta','Justificada')
       OR NOT EXISTS(SELECT 1 FROM tb_matricula m JOIN tb_periodo_letivo p ON p.cd_periodo=periodo
         WHERE m.cd_matricula=mat AND dia BETWEEN p.dt_inicio AND p.dt_fim AND dia BETWEEN m.dt_inicio AND COALESCE(m.dt_fim,'9999-12-31'))
       THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Confira a data, número da aula, matrícula e presença'; END IF;
     IF detalhes=0 AND EXISTS(SELECT 1 FROM tb_resumo_frequencia WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo AND qt_aulas_dadas>0)
       THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Esta frequência já foi lançada como resumo; use o modo Frequência'; END IF;
     SELECT MAX(ds_presenca) INTO marca_antiga FROM tb_chamada WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo AND dt_aula=dia AND nr_aula=numero_aula;
     INSERT INTO tb_chamada(cd_matricula,cd_atribuicao,cd_periodo,dt_aula,nr_aula,ds_presenca,cd_usuario)
       VALUES(mat,atrib,periodo,dia,numero_aula,presenca,ator) ON DUPLICATE KEY UPDATE ds_presenca=presenca,cd_usuario=ator;
     SELECT COUNT(*),SUM(ds_presenca='Presente') INTO qtd,pres FROM tb_chamada
     WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo;
   END IF;
   IF qtd IS NULL OR pres IS NULL OR pres<0 OR qtd<pres OR (fechado=1 AND qtd=0) THEN
     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Totais de frequência inconsistentes'; END IF;
   INSERT INTO tb_resumo_frequencia(cd_matricula,cd_atribuicao,cd_periodo,qt_aulas_dadas,qt_presencas,qt_faltas)
     VALUES(mat,atrib,periodo,qtd,pres,qtd-pres) ON DUPLICATE KEY UPDATE qt_aulas_dadas=qtd,qt_presencas=pres,qt_faltas=qtd-pres;
 ELSE SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Operação de diário desconhecida'; END IF;
 IF fechado=1 THEN UPDATE tb_fechamento_periodo SET ic_fechado=1 WHERE cd_atribuicao=atrib AND cd_periodo=periodo; END IF;
 UPDATE tb_revisao_diario SET nr_revisao=atual+1 WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo;
 SELECT JSON_OBJECT('n1',n1,'n2',n2,'n3',n3,'aulas',qt_aulas_dadas,'presencas',qt_presencas) INTO posterior
 FROM vw_diario WHERE cd_matricula=mat AND cd_atribuicao=atrib AND cd_periodo=periodo;
 INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao)
 VALUES(ator,'Diário',IF(fechado,'Retificação',operacao),JSON_OBJECT('matricula',mat,'atribuicao',atrib,'periodo',periodo,
 'revisao',atual+1,'antes',JSON_EXTRACT(anterior,'$'),'depois',JSON_EXTRACT(posterior,'$'),'motivo',motivo,
 'dia',dia,'aula',numero_aula,'presencaAnterior',marca_antiga,'presencaNova',presenca));
 COMMIT;
END$$
DELIMITER ;


CREATE TABLE tb_limite_login (
 chave CHAR(64) CHARACTER SET ascii PRIMARY KEY,
 tentativas INT UNSIGNED NOT NULL, inicio DATETIME NOT NULL, INDEX(inicio)
) ENGINE=InnoDB;
CREATE VIEW vw_acesso_boletim AS
SELECT DISTINCT u.cd_usuario,b.cd_matricula,b.cd_lote
FROM tb_boletim_aluno b JOIN tb_matricula m ON m.cd_matricula=b.cd_matricula
JOIN tb_aluno a ON a.cd_aluno=m.cd_aluno JOIN tb_usuario_acesso u ON u.ic_ativo
JOIN tb_usuario_papel up ON up.cd_usuario=u.cd_usuario JOIN tb_papel p ON p.cd_papel=up.cd_papel
WHERE p.ds_codigo IN ('Secretaria','Administração','Coordenação','Direção')
 OR (p.ds_codigo='Aluno' AND a.cd_pessoa=u.cd_pessoa)
 OR (p.ds_codigo='Responsável' AND EXISTS(SELECT 1 FROM tb_aluno_responsavel ar WHERE ar.cd_aluno=a.cd_aluno AND ar.cd_pessoa=u.cd_pessoa));


DELIMITER $$
CREATE PROCEDURE sp_publicar_comunicado(IN ator INT, IN comunicado INT)
BEGIN
 DECLARE autor INT;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 START TRANSACTION;
 SELECT cd_autor_usuario INTO autor FROM tb_comunicado WHERE cd_comunicado=comunicado FOR UPDATE;
 IF autor IS NULL OR NOT EXISTS (SELECT 1 FROM tb_usuario_papel up JOIN tb_papel p ON p.cd_papel=up.cd_papel
 JOIN tb_usuario_acesso u ON u.cd_usuario=up.cd_usuario WHERE u.ic_ativo AND u.cd_usuario=ator
 AND (p.ds_codigo IN ('Secretaria','Direção','Administração','Coordenação') OR
 (p.ds_codigo='Professor' AND autor=ator AND NOT EXISTS (
 SELECT 1 FROM tb_comunicado_turma ct WHERE ct.cd_comunicado=comunicado AND NOT EXISTS (
 SELECT 1 FROM tb_atribuicao_docente a JOIN tb_professor pr ON pr.cd_professor=a.cd_professor
 WHERE a.cd_turma=ct.cd_turma AND a.qt_ano_letivo=YEAR(CURRENT_DATE) AND pr.cd_pessoa=u.cd_pessoa)))))
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Publicação sem permissão'; END IF;
 IF NOT EXISTS(SELECT 1 FROM tb_comunicado_destinatario WHERE cd_comunicado=comunicado)
 AND NOT EXISTS(SELECT 1 FROM tb_comunicado_turma WHERE cd_comunicado=comunicado)
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Escolha um grupo ou turma antes de publicar'; END IF;
 UPDATE tb_comunicado SET ds_status='Enviado' WHERE cd_comunicado=comunicado;
 INSERT INTO tb_envio_comunicado(cd_comunicado,cd_enviado_por,ds_resultado) VALUES(comunicado,ator,'Publicado no portal');
 INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao) VALUES(ator,'Comunicados','Publicação',CONCAT('Comunicado ',comunicado));
 COMMIT;
END$$
CREATE PROCEDURE sp_marcar_lido(IN ator INT, IN comunicado INT)
BEGIN
 IF NOT EXISTS(SELECT 1 FROM vw_caixa_comunicados WHERE cd_usuario=ator AND cd_comunicado=comunicado) THEN
 SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Comunicado indisponível para este usuário'; END IF;
 INSERT INTO tb_comunicado_leitura(cd_comunicado,cd_usuario) VALUES(comunicado,ator)
 ON DUPLICATE KEY UPDATE dt_lido=tb_comunicado_leitura.dt_lido;
END$$
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE sp_corrigir_ocorrencia(IN ator INT, IN ocorrencia INT, IN status_novo VARCHAR(50),
 IN descricao_nova TEXT, IN descricao_anterior TEXT, IN status_anterior VARCHAR(50), IN motivo VARCHAR(500))
BEGIN
 DECLARE anterior TEXT;
 DECLARE situacao VARCHAR(50);
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 START TRANSACTION;
 IF NOT EXISTS(SELECT 1 FROM tb_usuario_papel up JOIN tb_papel p ON p.cd_papel=up.cd_papel
   JOIN tb_usuario_acesso u ON u.cd_usuario=up.cd_usuario
   WHERE up.cd_usuario=ator AND u.ic_ativo AND p.ds_codigo IN ('Secretaria','Coordenação','Administração','Direção'))
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Sem permissão para corrigir ocorrência'; END IF;
 SELECT ds_descricao,ds_status INTO anterior,situacao FROM tb_ocorrencia WHERE cd_ocorrencia=ocorrencia FOR UPDATE;
 IF anterior IS NULL OR NOT(BINARY anterior <=> BINARY descricao_anterior) OR NOT(BINARY situacao <=> BINARY status_anterior)
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Ocorrência ausente ou alterada: recarregue'; END IF;
 IF NULLIF(TRIM(motivo),'') IS NULL OR NULLIF(TRIM(descricao_nova),'') IS NULL OR NULLIF(TRIM(status_novo),'') IS NULL THEN
 SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Informe descrição, situação e motivo'; END IF;
 UPDATE tb_ocorrencia SET ds_status=status_novo,ds_descricao=descricao_nova WHERE cd_ocorrencia=ocorrencia;
 INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao) VALUES(ator,'Ocorrências','Correção',
 JSON_OBJECT('ocorrencia',ocorrencia,'antes',anterior,'depois',descricao_nova,'statusAnterior',situacao,'statusNovo',status_novo,'motivo',motivo));
 COMMIT;
END$$

CREATE PROCEDURE sp_criar_conta(IN ator INT, IN pessoa INT, IN identificador VARCHAR(100), IN hash_senha VARCHAR(255), IN papel INT)
BEGIN
 DECLARE conta INT;
 DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
 START TRANSACTION;
 IF NOT EXISTS(SELECT 1 FROM tb_usuario_papel up JOIN tb_papel p ON p.cd_papel=up.cd_papel
   JOIN tb_usuario_acesso u ON u.cd_usuario=up.cd_usuario WHERE up.cd_usuario=ator AND u.ic_ativo AND p.ds_codigo='Secretaria')
 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Criação de contas reservada à secretaria'; END IF;
 IF NULLIF(TRIM(identificador),'') IS NULL OR hash_senha IS NULL OR CHAR_LENGTH(hash_senha)<59 OR
    (hash_senha NOT LIKE '$2%' AND hash_senha NOT LIKE '$argon2%') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Informe identificador e hash de senha gerado pela aplicação'; END IF;
 INSERT INTO tb_usuario_acesso(cd_pessoa,ds_identificador,ds_credencial_hash,ic_ativo) VALUES(pessoa,TRIM(identificador),hash_senha,1);
 SET conta=LAST_INSERT_ID();
 INSERT INTO tb_usuario_papel(cd_usuario,cd_papel) VALUES(conta,papel);
 INSERT INTO tb_auditoria(cd_usuario,ds_modulo,ds_acao,ds_descricao)
 VALUES(ator,'Usuários','Criação de conta',JSON_OBJECT('conta',conta,'papel',papel));
 COMMIT;
END$$
DELIMITER ;

CREATE VIEW vw_pendencias_atividades AS
SELECT m.cd_aluno,m.cd_matricula,a.cd_atividade,a.nm_atividade,a.dt_prazo,d.cd_disciplina
FROM tb_atividade a JOIN tb_atribuicao_docente d ON d.cd_atribuicao=a.cd_atribuicao
JOIN tb_matricula m ON m.cd_turma=d.cd_turma AND m.qt_ano_letivo=d.qt_ano_letivo AND DATE(a.dt_prazo)
 BETWEEN m.dt_inicio AND COALESCE(m.dt_fim,'9999-12-31')
LEFT JOIN tb_entrega_atividade e ON e.cd_atividade=a.cd_atividade AND e.cd_matricula=m.cd_matricula
WHERE e.cd_atividade IS NULL;
CREATE VIEW vw_resultado_anual AS
SELECT cd_matricula,cd_disciplina,qt_ano_letivo,b1,b2,b3,b4,ROUND((b1+b2+b3+b4)/4,1) AS media_anual
FROM vw_medias_bimestrais;
INSERT INTO tb_versao_banco(versao) VALUES('2026.11.integracao');
