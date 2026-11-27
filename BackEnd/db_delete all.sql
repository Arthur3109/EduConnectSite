
USE db_eduConnect;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE tb_boletim_item;
TRUNCATE TABLE tb_boletim_aluno;
TRUNCATE TABLE tb_anexo;
TRUNCATE TABLE tb_fechamento_periodo;
TRUNCATE TABLE tb_resumo_frequencia;
TRUNCATE TABLE tb_nota;
TRUNCATE TABLE tb_envio_comunicado;
TRUNCATE TABLE tb_comunicado_destinatario;
TRUNCATE TABLE tb_usuario_papel;
TRUNCATE TABLE tb_comunicado;
TRUNCATE TABLE tb_auditoria;
TRUNCATE TABLE tb_ocorrencia;
TRUNCATE TABLE tb_atestado;
TRUNCATE TABLE tb_lote_boletim;
TRUNCATE TABLE tb_avaliacao;
TRUNCATE TABLE tb_matricula;
TRUNCATE TABLE tb_atribuicao_docente;
TRUNCATE TABLE tb_turma;
TRUNCATE TABLE tb_profissional;
TRUNCATE TABLE tb_professor;
TRUNCATE TABLE tb_aluno;
TRUNCATE TABLE tb_usuario_acesso;

TRUNCATE TABLE tb_grupo_destinatario;
TRUNCATE TABLE tb_periodo_letivo;
TRUNCATE TABLE tb_disciplina;
TRUNCATE TABLE tb_sala;
TRUNCATE TABLE tb_serie;
TRUNCATE TABLE tb_departamento;
TRUNCATE TABLE tb_papel;
TRUNCATE TABLE tb_pessoa;

SET FOREIGN_KEY_CHECKS = 1;
