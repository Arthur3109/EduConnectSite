-- Banco de Dados Educonnect

show databases;
create database db_eduConnect;
use db_eduConnect;


-- 1. tabelas somente pk

create table tb_pessoa (
    cd_pessoa int not null,
    nm_completo varchar(255) not null,
    ds_cpf varchar(11) not null unique,
    ds_email varchar(255),
    ds_telefone varchar(20),
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_pessoa primary key (cd_pessoa)
);

create table tb_papel (
    cd_papel int not null,
    ds_codigo varchar(50) not null unique,
    constraint pk_papel primary key (cd_papel)
);

create table tb_departamento (
    cd_departamento int not null,
    nm_departamento varchar(100) not null unique,
    ic_ativo boolean not null,
    constraint pk_departamento primary key (cd_departamento)
);

create table tb_serie (
    cd_serie int not null,
    nm_serie varchar(100) not null,
    ds_etapa varchar(50) not null,
    qt_ordem int not null,
    ic_ativo boolean not null,
    constraint pk_serie primary key (cd_serie)
);

create table tb_sala (
    cd_sala int not null,
    ds_codigo varchar(50) not null unique,
    nm_sala varchar(100) not null,
    qt_capacidade int not null,
    ds_unidade_capacidade varchar(50),
    ds_tipo varchar(50),
    ic_permite_turma boolean not null,
    ic_ativo boolean not null,
    constraint pk_sala primary key (cd_sala)
);

create table tb_disciplina (
    cd_disciplina int not null,
    ds_codigo varchar(50) not null unique,
    nm_disciplina varchar(100) not null,
    qt_carga_horaria int not null,
    ic_ativa boolean not null,
    constraint pk_disciplina primary key (cd_disciplina)
);

create table tb_periodo_letivo (
    cd_periodo int not null,
    qt_ano_letivo smallint not null,
    qt_numero_bimestre smallint not null,
    nm_periodo varchar(100) not null,
    dt_inicio date not null,
    dt_fim date not null,
    ds_status varchar(50) not null,
    constraint pk_periodo_letivo primary key (cd_periodo)
);

create table tb_grupo_destinatario (
    cd_grupo int not null,
    ds_codigo varchar(50) not null unique,
    constraint pk_grupo_destinatario primary key (cd_grupo)
);


-- 2. tabelas de pk e e fk

create table tb_usuario_acesso (
    cd_usuario int not null,
    cd_pessoa int not null,
    ds_identificador varchar(100) not null unique,
    ds_credencial_hash varchar(255) not null,
    ic_ativo boolean not null,
    dt_criado datetime not null,
    dt_ultimo_acesso datetime,
    constraint pk_usuario_acesso primary key (cd_usuario),
    constraint fk_usuario_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa)
);

create table tb_aluno (
    cd_aluno int not null,
    cd_pessoa int not null unique,
    ds_matricula varchar(50) not null unique,
    ds_status varchar(50) not null,
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_aluno primary key (cd_aluno),
    constraint fk_aluno_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa)
);

create table tb_professor (
    cd_professor int not null,
    cd_pessoa int not null unique,
    ds_registro_funcional varchar(50) not null unique,
    ds_status varchar(50) not null,
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_professor primary key (cd_professor),
    constraint fk_professor_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa)
);

create table tb_profissional (
    cd_profissional int not null,
    cd_pessoa int not null unique,
    ds_registro_funcional varchar(50) not null unique,
    ds_cargo varchar(100) not null,
    cd_departamento int not null,
    ds_status varchar(50) not null,
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_profissional primary key (cd_profissional),
    constraint fk_profissional_pessoa foreign key (cd_pessoa) references tb_pessoa(cd_pessoa),
    constraint fk_profissional_departamento foreign key (cd_departamento) references tb_departamento(cd_departamento)
);

create table tb_turma (
    cd_turma int not null,
    ds_codigo varchar(50) not null unique,
    nm_turma varchar(100) not null,
    cd_serie int not null,
    ds_turno varchar(50) not null,
    cd_sala int not null,
    qt_capacidade int not null,
    ic_ativa boolean not null,
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_turma primary key (cd_turma),
    constraint fk_turma_serie foreign key (cd_serie) references tb_serie(cd_serie),
    constraint fk_turma_sala foreign key (cd_sala) references tb_sala(cd_sala)
);

create table tb_matricula (
    cd_matricula int not null,
    cd_aluno int not null,
    cd_turma int not null,
    qt_ano_letivo smallint not null,
    dt_inicio date not null,
    dt_fim date,
    ds_status varchar(50) not null,
    constraint pk_matricula primary key (cd_matricula),
    constraint fk_matricula_aluno foreign key (cd_aluno) references tb_aluno(cd_aluno),
    constraint fk_matricula_turma foreign key (cd_turma) references tb_turma(cd_turma)
);

create table tb_atribuicao_docente (
    cd_atribuicao int not null,
    cd_professor int not null,
    cd_disciplina int not null,
    cd_turma int not null,
    qt_ano_letivo smallint not null,
    ds_status varchar(50) not null,
    dt_criado datetime not null,
    constraint pk_atribuicao_docente primary key (cd_atribuicao),
    constraint fk_atribuicao_professor foreign key (cd_professor) references tb_professor(cd_professor),
    constraint fk_atribuicao_disciplina foreign key (cd_disciplina) references tb_disciplina(cd_disciplina),
    constraint fk_atribuicao_turma foreign key (cd_turma) references tb_turma(cd_turma)
);

create table tb_comunicado (
    cd_comunicado int not null,
    nm_titulo varchar(255) not null,
    ds_tipo varchar(50) not null,
    ds_texto text not null,
    ds_status varchar(50) not null,
    cd_autor_usuario int not null,
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_comunicado primary key (cd_comunicado),
    constraint fk_comunicado_autor foreign key (cd_autor_usuario) references tb_usuario_acesso(cd_usuario)
);

create table tb_auditoria (
    cd_auditoria int not null,
    cd_usuario int,
    nm_usuario_snapshot varchar(255),
    ds_modulo varchar(100) not null,
    ds_acao varchar(100) not null,
    ds_descricao text,
    ds_origem_cliente varchar(100),
    dt_ocorrido datetime not null,
    constraint pk_auditoria primary key (cd_auditoria),
    constraint fk_auditoria_usuario foreign key (cd_usuario) references tb_usuario_acesso(cd_usuario)
);

create table tb_avaliacao (
    cd_avaliacao int not null,
    cd_atribuicao int not null,
    cd_periodo int not null,
    nm_avaliacao varchar(100) not null,
    vl_peso decimal(5,2) not null,
    vl_nota_maxima decimal(5,2) not null,
    qt_ordem smallint not null,
    constraint pk_avaliacao primary key (cd_avaliacao),
    constraint fk_avaliacao_atribuicao foreign key (cd_atribuicao) references tb_atribuicao_docente(cd_atribuicao),
    constraint fk_avaliacao_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo)
);

create table tb_ocorrencia (
    cd_ocorrencia int not null,
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
    dt_criado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_ocorrencia primary key (cd_ocorrencia),
    constraint fk_ocorrencia_aluno foreign key (cd_aluno) references tb_aluno(cd_aluno),
    constraint fk_ocorrencia_turma foreign key (cd_turma) references tb_turma(cd_turma),
    constraint fk_ocorrencia_autor foreign key (cd_autor_usuario) references tb_usuario_acesso(cd_usuario)
);

create table tb_atestado (
    cd_atestado int not null,
    cd_aluno int not null,
    cd_professor int,
    ds_motivo text not null,
    dt_inicio date not null,
    dt_fim date not null,
    ds_observacoes text,
    ds_status varchar(50) not null,
    dt_criado datetime not null,
    constraint pk_atestado primary key (cd_atestado),
    constraint fk_atestado_aluno foreign key (cd_aluno) references tb_aluno(cd_aluno),
    constraint fk_atestado_professor foreign key (cd_professor) references tb_professor(cd_professor)
);

create table tb_lote_boletim (
    cd_lote int not null,
    cd_turma int not null,
    cd_periodo int not null,
    ds_status varchar(50) not null,
    qt_alunos int not null,
    cd_gerado_por int not null,
    dt_criado datetime not null,
    constraint pk_lote_boletim primary key (cd_lote),
    constraint fk_lote_turma foreign key (cd_turma) references tb_turma(cd_turma),
    constraint fk_lote_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo),
    constraint fk_lote_usuario foreign key (cd_gerado_por) references tb_usuario_acesso(cd_usuario)
);

create table tb_envio_comunicado (
    cd_envio int not null,
    cd_comunicado int not null,
    dt_enviado datetime not null,
    cd_enviado_por int not null,
    ds_resultado varchar(100) not null,
    constraint pk_envio_comunicado primary key (cd_envio),
    constraint fk_envio_comunicado foreign key (cd_comunicado) references tb_comunicado(cd_comunicado),
    constraint fk_envio_usuario foreign key (cd_enviado_por) references tb_usuario_acesso(cd_usuario)
);

create table tb_nota (
    cd_nota int not null,
    cd_avaliacao int not null,
    cd_matricula int not null,
    vl_nota decimal(5,2) not null,
    cd_registrado_por int not null,
    dt_registrado datetime not null,
    dt_atualizado datetime not null,
    constraint pk_nota primary key (cd_nota),
    constraint fk_nota_avaliacao foreign key (cd_avaliacao) references tb_avaliacao(cd_avaliacao),
    constraint fk_nota_matricula foreign key (cd_matricula) references tb_matricula(cd_matricula),
    constraint fk_nota_usuario foreign key (cd_registrado_por) references tb_usuario_acesso(cd_usuario)
);

create table tb_resumo_frequencia (
    cd_frequencia int not null,
    cd_matricula int not null,
    cd_atribuicao int not null,
    cd_periodo int not null,
    qt_aulas_dadas int not null,
    qt_presencas int not null,
    qt_faltas int not null,
    vl_frequencia_pct decimal(5,2) not null,
    constraint pk_resumo_frequencia primary key (cd_frequencia),
    constraint fk_freq_matricula foreign key (cd_matricula) references tb_matricula(cd_matricula),
    constraint fk_freq_atribuicao foreign key (cd_atribuicao) references tb_atribuicao_docente(cd_atribuicao),
    constraint fk_freq_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo)
);

create table tb_fechamento_periodo (
    cd_fechamento int not null,
    cd_atribuicao int not null,
    cd_periodo int not null,
    ic_fechado boolean not null,
    cd_fechado_por int not null,
    dt_fechado datetime not null,
    constraint pk_fechamento_periodo primary key (cd_fechamento),
    constraint fk_fech_atribuicao foreign key (cd_atribuicao) references tb_atribuicao_docente(cd_atribuicao),
    constraint fk_fech_periodo foreign key (cd_periodo) references tb_periodo_letivo(cd_periodo),
    constraint fk_fech_usuario foreign key (cd_fechado_por) references tb_usuario_acesso(cd_usuario)
);

create table tb_anexo (
    cd_anexo int not null,
    cd_atestado int not null,
    nm_original varchar(255) not null,
    ds_mime_type varchar(100) not null,
    qt_tamanho_bytes bigint not null,
    ds_storage_key varchar(255) not null,
    dt_criado datetime not null,
    constraint pk_anexo primary key (cd_anexo),
    constraint fk_anexo_atestado foreign key (cd_atestado) references tb_atestado(cd_atestado)
);

create table tb_boletim_aluno (
    cd_boletim_aluno int not null,
    cd_lote int not null,
    cd_matricula int not null,
    nm_snapshot varchar(255) not null,
    constraint pk_boletim_aluno primary key (cd_boletim_aluno),
    constraint fk_bol_lote foreign key (cd_lote) references tb_lote_boletim(cd_lote),
    constraint fk_bol_matricula foreign key (cd_matricula) references tb_matricula(cd_matricula)
);

create table tb_boletim_item (
    cd_item int not null,
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
);


-- 3. tabelas somente fk

create table tb_usuario_papel (
    cd_usuario int not null,
    cd_papel int not null,
    constraint pk_usuario_papel primary key (cd_usuario, cd_papel),
    constraint fk_up_usuario foreign key (cd_usuario) references tb_usuario_acesso(cd_usuario),
    constraint fk_up_papel foreign key (cd_papel) references tb_papel(cd_papel)
);

create table tb_comunicado_destinatario (
    cd_comunicado int not null,
    cd_grupo int not null,
    constraint pk_comunicado_destinatario primary key (cd_comunicado, cd_grupo),
    constraint fk_cd_comunicado foreign key (cd_comunicado) references tb_comunicado(cd_comunicado),
    constraint fk_cd_grupo foreign key (cd_grupo) references tb_grupo_destinatario(cd_grupo)
);