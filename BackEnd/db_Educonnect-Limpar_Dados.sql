-- Remove todos os registros do banco de demonstracao sem apagar tabelas.
-- Execute somente se quiser limpar completamente db_eduConnect.
-- Depois, db_Educonnect-Insert pode ser executado novamente.
USE db_eduConnect;

START TRANSACTION;

DELETE FROM tb_boletim_item;
DELETE FROM tb_boletim_aluno;
DELETE FROM tb_anexo;
DELETE FROM tb_nota;
DELETE FROM tb_resumo_frequencia;
DELETE FROM tb_fechamento_periodo;
DELETE FROM tb_envio_comunicado;
DELETE FROM tb_comunicado_destinatario;
DELETE FROM tb_usuario_papel;
DELETE FROM tb_ocorrencia;
DELETE FROM tb_atestado;
DELETE FROM tb_auditoria;
DELETE FROM tb_lote_boletim;
DELETE FROM tb_avaliacao;
DELETE FROM tb_comunicado;
DELETE FROM tb_atribuicao_docente;
DELETE FROM tb_matricula;
DELETE FROM tb_profissional;
DELETE FROM tb_professor;
DELETE FROM tb_aluno;
DELETE FROM tb_turma;
DELETE FROM tb_usuario_acesso;
DELETE FROM tb_disciplina;
DELETE FROM tb_periodo_letivo;
DELETE FROM tb_departamento;
DELETE FROM tb_pessoa;
DELETE FROM tb_papel;
DELETE FROM tb_serie;
DELETE FROM tb_sala;
DELETE FROM tb_grupo_destinatario;

COMMIT;

SELECT 'tb_pessoa' AS tabela, COUNT(*) AS registros FROM tb_pessoa
UNION ALL SELECT 'tb_papel', COUNT(*) FROM tb_papel
UNION ALL SELECT 'tb_departamento', COUNT(*) FROM tb_departamento
UNION ALL SELECT 'tb_serie', COUNT(*) FROM tb_serie
UNION ALL SELECT 'tb_sala', COUNT(*) FROM tb_sala
UNION ALL SELECT 'tb_disciplina', COUNT(*) FROM tb_disciplina
UNION ALL SELECT 'tb_periodo_letivo', COUNT(*) FROM tb_periodo_letivo
UNION ALL SELECT 'tb_grupo_destinatario', COUNT(*) FROM tb_grupo_destinatario
UNION ALL SELECT 'tb_usuario_acesso', COUNT(*) FROM tb_usuario_acesso
UNION ALL SELECT 'tb_aluno', COUNT(*) FROM tb_aluno
UNION ALL SELECT 'tb_professor', COUNT(*) FROM tb_professor
UNION ALL SELECT 'tb_profissional', COUNT(*) FROM tb_profissional
UNION ALL SELECT 'tb_turma', COUNT(*) FROM tb_turma
UNION ALL SELECT 'tb_matricula', COUNT(*) FROM tb_matricula
UNION ALL SELECT 'tb_atribuicao_docente', COUNT(*) FROM tb_atribuicao_docente
UNION ALL SELECT 'tb_comunicado', COUNT(*) FROM tb_comunicado
UNION ALL SELECT 'tb_auditoria', COUNT(*) FROM tb_auditoria
UNION ALL SELECT 'tb_avaliacao', COUNT(*) FROM tb_avaliacao
UNION ALL SELECT 'tb_ocorrencia', COUNT(*) FROM tb_ocorrencia
UNION ALL SELECT 'tb_atestado', COUNT(*) FROM tb_atestado
UNION ALL SELECT 'tb_lote_boletim', COUNT(*) FROM tb_lote_boletim
UNION ALL SELECT 'tb_envio_comunicado', COUNT(*) FROM tb_envio_comunicado
UNION ALL SELECT 'tb_nota', COUNT(*) FROM tb_nota
UNION ALL SELECT 'tb_resumo_frequencia', COUNT(*) FROM tb_resumo_frequencia
UNION ALL SELECT 'tb_fechamento_periodo', COUNT(*) FROM tb_fechamento_periodo
UNION ALL SELECT 'tb_anexo', COUNT(*) FROM tb_anexo
UNION ALL SELECT 'tb_boletim_aluno', COUNT(*) FROM tb_boletim_aluno
UNION ALL SELECT 'tb_boletim_item', COUNT(*) FROM tb_boletim_item
UNION ALL SELECT 'tb_usuario_papel', COUNT(*) FROM tb_usuario_papel
UNION ALL SELECT 'tb_comunicado_destinatario', COUNT(*) FROM tb_comunicado_destinatario;
