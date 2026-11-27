-- Dados ficticios sincronizados com o LocalStorage do FrontEnd.
-- Execute este arquivo apenas depois de criar db_eduConnect e as tabelas.
use db_eduConnect;

start transaction;

insert into tb_pessoa (cd_pessoa, nm_completo, ds_cpf, ds_email, ds_telefone, dt_criado, dt_atualizado)
values
    (1, 'Ana Lima', '00000000001', 'ana@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (2, 'Bruno Reis', '00000000002', 'bruno@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (3, 'Lia Santos', '00000000003', 'lia@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (4, 'Miguel Costa', '00000000004', 'miguel@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (5, 'Sofia Oliveira', '00000000005', 'sofia@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (6, 'Davi Mendes', '00000000006', 'davi@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (7, 'Helena Souza', '00000000007', 'helena@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (8, 'Lucas Pereira', '00000000008', 'lucas@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (9, 'Caio Silva', '00000000009', 'caio@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (10, 'Beatriz Rocha', '00000000010', 'beatriz@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (11, 'Rafael Nunes', '00000000011', 'rafael@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (12, 'Clara Dias', '00000000012', 'clara@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (13, 'Marcos Almeida', '00000000013', 'marcos@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (14, 'Paula Ferreira', '00000000014', 'paula@example.invalid', null, '2026-02-02 08:00:00', '2026-02-02 08:00:00');

insert into tb_papel (cd_papel, ds_codigo)
values
    (1, 'Professor'),
    (2, 'Secretaria'),
    (3, 'Aluno'),
    (4, 'Coordenacao'),
    (5, 'Direcao');

insert into tb_departamento (cd_departamento, nm_departamento, ic_ativo)
values
    (1, 'Secretaria escolar', 1),
    (2, 'Coordenacao pedagogica', 1),
    (3, 'Direcao', 1);

insert into tb_serie (cd_serie, nm_serie, ds_etapa, qt_ordem, ic_ativo)
values
    (1, '3º ano', 'Ensino Medio', 3, 1),
    (2, '6º ano', 'Ensino Fundamental II', 6, 1),
    (3, '7º ano', 'Ensino Fundamental II', 7, 1),
    (4, '8º ano', 'Ensino Fundamental II', 8, 1);

insert into tb_sala (cd_sala, ds_codigo, nm_sala, qt_capacidade, ds_unidade_capacidade, ds_tipo, ic_permite_turma, ic_ativo)
values
    (1, '101', 'Sala 101', 40, 'alunos', 'Sala de aula', 1, 1),
    (2, '102', 'Sala 102', 40, 'alunos', 'Sala de aula', 1, 1),
    (3, '103', 'Sala 103', 35, 'alunos', 'Sala de aula', 1, 1),
    (4, '104', 'Sala 104', 30, 'alunos', 'Sala de aula', 1, 1),
    (5, '105', 'Sala 105', 35, 'alunos', 'Sala de aula', 1, 1),
    (6, 'LAB-A', 'Laboratorio A', 30, 'computadores', 'Laboratorio', 0, 1);

insert into tb_disciplina (cd_disciplina, ds_codigo, nm_disciplina, qt_carga_horaria, ic_ativa)
values
    (1, 'MAT-101', 'Matematica', 100, 1),
    (2, 'PORT-202', 'Lingua Portuguesa', 150, 1),
    (3, 'CIEN-303', 'Ciencias', 120, 1),
    (4, 'HIST-404', 'Historia', 100, 1);

insert into tb_periodo_letivo (cd_periodo, qt_ano_letivo, qt_numero_bimestre, nm_periodo, dt_inicio, dt_fim, ds_status)
values
    (1, 2026, 1, '1º bimestre', '2026-02-02', '2026-04-17', 'Fechado'),
    (2, 2026, 2, '2º bimestre', '2026-04-20', '2026-07-10', 'Aberto'),
    (3, 2026, 3, '3º bimestre', '2026-07-20', '2026-09-30', 'Planejado'),
    (4, 2026, 4, '4º bimestre', '2026-10-01', '2026-12-15', 'Planejado');

insert into tb_grupo_destinatario (cd_grupo, ds_codigo)
values
    (1, 'Alunos'),
    (2, 'Professores'),
    (3, 'Responsaveis'),
    (4, 'Todos');

insert into tb_usuario_acesso (cd_usuario, cd_pessoa, ds_identificador, ds_credencial_hash, ic_ativo, dt_criado, dt_ultimo_acesso)
values
    (1, 9, 'caio@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null),
    (2, 12, 'clara@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null),
    (3, 1, 'ana@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null),
    (4, 10, 'beatriz@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null),
    (5, 11, 'rafael@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null),
    (6, 13, 'marcos@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null),
    (7, 14, 'paula@example.invalid', '$2y$10$Z1PD58D1ChubScgnvpUuU.x3DzajjaPRL5eH2H.wqMD8uYeMPrQ2S', 1, '2026-02-02 08:00:00', null);

insert into tb_usuario_papel (cd_usuario, cd_papel)
values
    (1, 1), (4, 1), (5, 1),
    (2, 2), (6, 4), (7, 5),
    (3, 3);

insert into tb_aluno (cd_aluno, cd_pessoa, ds_matricula, ds_status, dt_criado, dt_atualizado)
values
    (1, 1, '20260001', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (2, 2, '20260002', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (3, 3, '20260003', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (4, 4, '20260004', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (5, 5, '20260005', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (6, 6, '20260006', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (7, 7, '20260007', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (8, 8, '20260008', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00');

insert into tb_professor (cd_professor, cd_pessoa, ds_registro_funcional, ds_status, dt_criado, dt_atualizado)
values
    (1, 9, 'PROF2026001', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (2, 10, 'PROF2026002', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (3, 11, 'PROF2026003', 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00');

insert into tb_profissional (cd_profissional, cd_pessoa, ds_registro_funcional, ds_cargo, cd_departamento, ds_status, dt_criado, dt_atualizado)
values
    (1, 12, 'EMP2026001', 'Secretaria', 1, 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (2, 13, 'EMP2026002', 'Coordenador Pedagogico', 2, 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (3, 14, 'EMP2026003', 'Diretora', 3, 'Ativo', '2026-02-02 08:00:00', '2026-02-02 08:00:00');

insert into tb_turma (cd_turma, ds_codigo, nm_turma, cd_serie, ds_turno, cd_sala, qt_capacidade, ic_ativa, dt_criado, dt_atualizado)
values
    (1, '3A-EM', '3º Ano A', 1, 'Matutino', 1, 40, 1, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (2, '6A', '6º Ano A', 2, 'Matutino', 2, 40, 1, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (3, '6B', '6º Ano B', 2, 'Vespertino', 2, 40, 1, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (4, '7A', '7º Ano A', 3, 'Matutino', 3, 35, 1, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (5, '7D', '7º Ano D', 3, 'Vespertino', 3, 35, 1, '2026-02-02 08:00:00', '2026-02-02 08:00:00'),
    (6, '8C', '8º Ano C', 4, 'Matutino', 4, 30, 1, '2026-02-02 08:00:00', '2026-02-02 08:00:00');

insert into tb_matricula (cd_matricula, cd_aluno, cd_turma, qt_ano_letivo, dt_inicio, dt_fim, ds_status)
values
    (1, 1, 1, 2026, '2026-02-02', null, 'Ativa'),
    (2, 2, 1, 2026, '2026-02-02', null, 'Ativa'),
    (3, 3, 2, 2026, '2026-02-02', null, 'Ativa'),
    (4, 4, 2, 2026, '2026-02-02', null, 'Ativa'),
    (5, 5, 3, 2026, '2026-02-02', null, 'Ativa'),
    (6, 6, 4, 2026, '2026-02-02', null, 'Ativa'),
    (7, 7, 5, 2026, '2026-02-02', null, 'Ativa'),
    (8, 8, 6, 2026, '2026-02-02', null, 'Ativa');

insert into tb_atribuicao_docente (cd_atribuicao, cd_professor, cd_disciplina, cd_turma, qt_ano_letivo, ds_status, dt_criado)
values
    (1, 1, 1, 1, 2026, 'Ativa', '2026-02-02 08:00:00'),
    (2, 1, 1, 2, 2026, 'Ativa', '2026-02-02 08:00:00'),
    (3, 2, 2, 1, 2026, 'Ativa', '2026-02-02 08:00:00'),
    (4, 2, 2, 3, 2026, 'Ativa', '2026-02-02 08:00:00'),
    (5, 3, 3, 4, 2026, 'Ativa', '2026-02-02 08:00:00'),
    (6, 3, 4, 6, 2026, 'Ativa', '2026-02-02 08:00:00');

insert into tb_avaliacao (cd_avaliacao, cd_atribuicao, cd_periodo, nm_avaliacao, vl_peso, vl_nota_maxima, qt_ordem)
values
    (1, 1, 1, 'N1', 1, 10, 1),
    (2, 1, 1, 'N2', 1, 10, 2),
    (3, 1, 1, 'N3', 1, 10, 3),
    (4, 3, 1, 'N1', 1, 10, 1),
    (5, 3, 1, 'N2', 1, 10, 2),
    (6, 3, 1, 'N3', 1, 10, 3);

insert into tb_nota (cd_nota, cd_avaliacao, cd_matricula, vl_nota, cd_registrado_por, dt_registrado, dt_atualizado)
values
    (1, 1, 1, 8.5, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (2, 2, 1, 7.0, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (3, 3, 1, 9.0, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (4, 1, 2, 5.5, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (5, 2, 2, 6.0, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (6, 3, 2, 4.5, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (7, 1, 3, 3.5, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (8, 2, 3, 4.0, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00'),
    (9, 3, 3, 5.0, 1, '2026-04-17 10:00:00', '2026-04-17 10:00:00');

insert into tb_resumo_frequencia (cd_frequencia, cd_matricula, cd_atribuicao, cd_periodo, qt_aulas_dadas, qt_presencas, qt_faltas, vl_frequencia_pct)
values
    (1, 1, 1, 1, 40, 38, 2, 95),
    (2, 2, 1, 1, 40, 31, 9, 77.5),
    (3, 3, 2, 1, 40, 28, 12, 70),
    (4, 4, 2, 2, 20, 18, 2, 90);

insert into tb_fechamento_periodo (cd_fechamento, cd_atribuicao, cd_periodo, ic_fechado, cd_fechado_por, dt_fechado)
values
    (1, 1, 1, 1, 1, '2026-04-17 16:00:00'),
    (2, 3, 1, 1, 4, '2026-04-17 16:00:00');

insert into tb_lote_boletim (cd_lote, cd_turma, cd_periodo, ds_status, qt_alunos, cd_gerado_por, dt_criado)
values
    (1, 1, 1, 'Gerado', 2, 2, '2026-04-17 18:00:00');

insert into tb_boletim_aluno (cd_boletim_aluno, cd_lote, cd_matricula, nm_snapshot)
values
    (1, 1, 1, 'Ana Lima'),
    (2, 1, 2, 'Bruno Reis');

insert into tb_boletim_item (cd_item, cd_boletim_aluno, cd_disciplina, nm_disciplina_snapshot, vl_n1_snapshot, vl_n2_snapshot, vl_n3_snapshot, vl_media_snapshot, qt_faltas_snapshot, vl_frequencia_snapshot, ds_situacao_snapshot, ic_fechado_snapshot)
values
    (1, 1, 1, 'Matematica', 8.5, 7, 9, 8.2, 2, 95, 'Aprovado', 1),
    (2, 1, 2, 'Lingua Portuguesa', 8, 7, 9, 8, 0, 100, 'Aprovado', 1),
    (3, 2, 1, 'Matematica', 5.5, 6, 4.5, 5.3, 9, 77.5, 'Recuperacao', 1),
    (4, 2, 2, 'Lingua Portuguesa', 4, 3.5, 5, 4.2, 11, 72.5, 'Reprovado', 1);

insert into tb_ocorrencia (cd_ocorrencia, ds_protocolo, cd_aluno, cd_turma, dt_ocorrencia, ds_tipo, ds_gravidade, ds_descricao, ds_status, cd_autor_usuario, nm_autor_snapshot, dt_criado, dt_atualizado)
values
    (1, 'OCO-DEMO-001', 1, 1, '2026-03-18', 'Pedagogica', 'Baixa', 'Acompanhamento de atividade.', 'Aberta', 1, 'Caio Silva', '2026-03-18 09:00:00', '2026-03-18 09:00:00'),
    (2, 'OCO-DEMO-002', 2, 1, '2026-03-20', 'Comportamental', 'Media', 'Conversar com o responsavel sobre atrasos.', 'Pendente', 4, 'Beatriz Rocha', '2026-03-20 09:00:00', '2026-03-20 09:00:00'),
    (3, 'OCO-DEMO-003', 3, 2, '2026-03-22', 'Frequencia', 'Alta', 'Retorno escolar acompanhado pela equipe.', 'Resolvida', 5, 'Rafael Nunes', '2026-03-22 09:00:00', '2026-03-22 12:00:00');

insert into tb_atestado (cd_atestado, cd_aluno, cd_professor, ds_motivo, dt_inicio, dt_fim, ds_observacoes, ds_status, dt_criado)
values
    (1, 1, null, 'Consulta medica', '2026-03-19', '2026-03-20', 'Documento apresentado pela familia.', 'Recebido', '2026-03-18 16:00:00'),
    (2, 3, null, 'Afastamento por saude', '2026-03-21', '2026-03-23', 'Retorno autorizado pela equipe escolar.', 'Aceito', '2026-03-21 09:00:00');

insert into tb_anexo (cd_anexo, cd_atestado, nm_original, ds_mime_type, qt_tamanho_bytes, ds_storage_key, dt_criado)
values
    (1, 1, 'atestado-ana.pdf', 'application/pdf', 1200, 'atestados/atestado-ana.pdf', '2026-03-18 16:10:00'),
    (2, 2, 'atestado-lia.pdf', 'application/pdf', 1500, 'atestados/atestado-lia.pdf', '2026-03-21 09:10:00');

insert into tb_comunicado (cd_comunicado, nm_titulo, ds_tipo, ds_texto, ds_status, cd_autor_usuario, dt_criado, dt_atualizado)
values
    (1, 'Reuniao do bimestre', 'Aviso', 'Convite para a reuniao de responsaveis.', 'Rascunho', 2, '2026-04-16 14:00:00', '2026-04-16 14:00:00'),
    (2, 'Entrega dos boletins', 'Informativo', 'Os boletins do primeiro bimestre estao disponiveis.', 'Enviado', 2, '2026-04-17 11:00:00', '2026-04-17 12:00:00'),
    (3, 'Feira de Ciencias', 'Evento', 'Cronograma das apresentacoes da Feira de Ciencias.', 'Enviado', 2, '2026-04-18 09:00:00', '2026-04-18 12:00:00');

insert into tb_comunicado_destinatario (cd_comunicado, cd_grupo)
values
    (1, 3),
    (2, 1),
    (2, 3),
    (3, 1),
    (3, 2),
    (3, 3);

insert into tb_envio_comunicado (cd_envio, cd_comunicado, dt_enviado, cd_enviado_por, ds_resultado)
values
    (1, 2, '2026-04-17 12:00:00', 2, 'Enviado'),
    (2, 3, '2026-04-18 12:00:00', 2, 'Enviado');

insert into tb_auditoria (cd_auditoria, cd_usuario, nm_usuario_snapshot, ds_modulo, ds_acao, ds_descricao, ds_origem_cliente, dt_ocorrido)
values
    (1, 2, 'Clara Dias', 'Boletins', 'Emissao', 'Emissao dos boletins do 3º Ano A.', 'Secretaria', '2026-04-17 18:05:00'),
    (2, 2, 'Clara Dias', 'Usuarios', 'Cadastro', 'Cadastro de novos alunos ficticios.', 'Secretaria', '2026-04-16 10:20:00'),
    (3, 1, 'Caio Silva', 'Notas', 'Lancamento', 'Lancamento de notas do primeiro bimestre.', 'Professor', '2026-04-17 10:30:00'),
    (4, 4, 'Beatriz Rocha', 'Comunicados', 'Envio', 'Envio do comunicado sobre boletins.', 'Secretaria', '2026-04-17 12:01:00');

commit;
