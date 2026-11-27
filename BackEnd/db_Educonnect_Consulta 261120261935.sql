use db_eduConnect;

-- 1. Quais disciplinas estão cadastradas?
select * from tb_disciplina;

-- 2. Quais alunos estão em cada turma?
select p.nm_completo as aluno, a.ds_matricula as matricula,
       t.nm_turma as turma, m.qt_ano_letivo as ano
from tb_matricula m
join tb_aluno a on a.cd_aluno = m.cd_aluno
join tb_pessoa p on p.cd_pessoa = a.cd_pessoa
join tb_turma t on t.cd_turma = m.cd_turma
order by ano, turma, aluno;

-- 3. Quem dá aula de cada disciplina?
select p.nm_completo as professor, d.nm_disciplina as disciplina, t.nm_turma as turma
from tb_atribuicao_docente ad
join tb_professor pr on pr.cd_professor = ad.cd_professor
join tb_pessoa p on p.cd_pessoa = pr.cd_pessoa
join tb_disciplina d on d.cd_disciplina = ad.cd_disciplina
join tb_turma t on t.cd_turma = ad.cd_turma
order by professor, turma, disciplina;

-- 4. Quanto cada aluno tirou em cada avaliação do primeiro período cadastrado?
select p.nm_completo as aluno, d.nm_disciplina as disciplina,
       av.nm_avaliacao as avaliacao, n.vl_nota as nota
from tb_nota n
join tb_avaliacao av on av.cd_avaliacao = n.cd_avaliacao
join tb_atribuicao_docente ad on ad.cd_atribuicao = av.cd_atribuicao
join tb_disciplina d on d.cd_disciplina = ad.cd_disciplina
join tb_matricula m on m.cd_matricula = n.cd_matricula
join tb_aluno a on a.cd_aluno = m.cd_aluno
join tb_pessoa p on p.cd_pessoa = a.cd_pessoa
where av.cd_periodo = 1
order by aluno, disciplina, av.qt_ordem;

-- 5. Quantas presenças e faltas cada aluno teve?
select p.nm_completo as aluno, d.nm_disciplina as disciplina, pl.nm_periodo as periodo,
       f.qt_aulas_dadas as aulas, f.qt_presencas as presencas,
       f.qt_faltas as faltas, f.vl_frequencia_pct as frequencia_percentual
from tb_resumo_frequencia f
join tb_matricula m on m.cd_matricula = f.cd_matricula
join tb_aluno a on a.cd_aluno = m.cd_aluno
join tb_pessoa p on p.cd_pessoa = a.cd_pessoa
join tb_atribuicao_docente ad on ad.cd_atribuicao = f.cd_atribuicao
join tb_disciplina d on d.cd_disciplina = ad.cd_disciplina
join tb_periodo_letivo pl on pl.cd_periodo = f.cd_periodo
order by aluno, disciplina, pl.dt_inicio;

-- 6. Qual foi o resultado registrado nos boletins do primeiro lote?
select b.nm_snapshot as aluno, i.nm_disciplina_snapshot as disciplina,
       i.vl_n1_snapshot as n1, i.vl_n2_snapshot as n2, i.vl_n3_snapshot as n3,
       i.vl_media_snapshot as media, i.ds_situacao_snapshot as situacao
from tb_boletim_aluno b
join tb_boletim_item i on i.cd_boletim_aluno = b.cd_boletim_aluno
where b.cd_lote = 1
order by aluno, disciplina;

-- 7. Para qual grupo foi enviado cada comunicado?
select c.nm_titulo as comunicado, g.ds_codigo as grupo, e.dt_enviado as data_envio
from tb_comunicado c
join tb_comunicado_destinatario dest on dest.cd_comunicado = c.cd_comunicado
join tb_grupo_destinatario g on g.cd_grupo = dest.cd_grupo
join tb_envio_comunicado e on e.cd_comunicado = c.cd_comunicado
order by data_envio, comunicado, grupo;
