-- EduConnect | SQL de integração. Base do ZIP de 13/11/2026. UTF-8.
-- Atualização ÚNICA de uma cópia do banco criado pelo SQL de 13/11. Faça backup e pare as gravações.
-- Não reaplica os INSERTs de demonstração. Execução sem --force.
SET NAMES utf8mb4;
USE educonnect_completo;
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

