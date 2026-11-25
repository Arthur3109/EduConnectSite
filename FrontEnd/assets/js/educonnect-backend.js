/**
 * Núcleo do back-end simulado do EduConnect.
 * Centraliza persistência local, normalização, eventos e operações comuns de dados.
 */
(() => {
    'use strict';

    const KEYS = Object.freeze({
        alunos: 'educonnect_usuarios_alunos',
        professores: 'educonnect_usuarios_professores',
        profissionais: 'educonnect_usuarios_profissionais',
        turmas: 'educonnect_turmas',
        salas: 'educonnect_salas',
        disciplinas: 'educonnect_disciplinas',
        vinculosTurmas: 'educonnect_professor_assignments',
        matriculas: 'educonnect_matriculas',
        academico: 'educonnect_registros_academicos',
        ocorrencias: 'educonnect_ocorrencias',
        comunicados: 'educonnect_comunicados',
        boletins: 'educonnect_boletins',
        auditoria: 'educonnect_auditoria',
        atestados: 'educonnect_atestados',
        notasFrequencia: 'educonnect_notas_frequencia',
        estudanteAtual: 'educonnect_estudante_atual'
    });

    const EVENT_NAME = 'educonnect:data-change';
    const INITIAL_DATA = Object.freeze({
        alunos: [
            { codigo: '20260001', nome: 'Ana Exemplo', turma: '3º Ano A', serie: '3º ano', status: 'Ativo' },
            { codigo: '20260002', nome: 'Bruno Exemplo', turma: '3º Ano A', serie: '3º ano', status: 'Ativo' },
            { codigo: '20260003', nome: 'Lia Exemplo', turma: '6º Ano A', serie: '6º ano', status: 'Ativo' }
        ],
        professores: [
            { codigo: 'PROF2026001', nome: 'Caio Exemplo', disciplina: 'Matemática e Língua Portuguesa', turmas: '3º Ano A, 6º Ano A', status: 'Ativo' }
        ],
        profissionais: [
            { codigo: 'EMP2026001', nome: 'Clara Exemplo', cargo: 'Secretária', departamento: 'Secretaria escolar', status: 'Ativo' }
        ],
        turmas: [
            { codigo: '3A-EM', nome: '3º Ano A', serie: '3º ano', turno: 'Matutino', salaId: 'sala-101', capacidade: 40, alunos: 2, ativa: true },
            { codigo: '6A', nome: '6º Ano A', serie: '6º ano', turno: 'Matutino', salaId: 'sala-102', capacidade: 40, alunos: 1, ativa: true },
            { codigo: '6B', nome: '6º Ano B', serie: '6º ano', turno: 'Vespertino', salaId: 'sala-102', capacidade: 40, alunos: 0, ativa: true },
            { codigo: '7A', nome: '7º Ano A', serie: '7º ano', turno: 'Matutino', salaId: 'sala-103', capacidade: 35, alunos: 0, ativa: true },
            { codigo: '7D', nome: '7º Ano D', serie: '7º ano', turno: 'Vespertino', salaId: 'sala-103', capacidade: 35, alunos: 0, ativa: true },
            { codigo: '8C', nome: '8º Ano C', serie: '8º ano', turno: 'Matutino', salaId: 'sala-104', capacidade: 30, alunos: 0, ativa: true }
        ],
        salas: [
            { id: 'sala-101', nome: 'Sala 101', capacidade: 40, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
            { id: 'sala-102', nome: 'Sala 102', capacidade: 40, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
            { id: 'sala-103', nome: 'Sala 103', capacidade: 35, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
            { id: 'sala-104', nome: 'Sala 104', capacidade: 30, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
            { id: 'laboratorio-a', nome: 'Laboratório A', capacidade: 30, unidade: 'computadores', tipo: 'Laboratório', permiteTurma: false }
        ],
        disciplinas: [
            { codigo: 'MAT-101', nome: 'Matemática', cargaHoraria: 100, turmas: ['3º Ano A', '6º Ano A'], professores: ['Caio Exemplo'] },
            { codigo: 'PORT-202', nome: 'Língua Portuguesa', cargaHoraria: 150, turmas: ['3º Ano A'], professores: ['Caio Exemplo'] }
        ],
        academico: [
            { id: '3º-ano-a|20260001|matematica|1º-bimestre', alunoId: 'aluno-20260001', matricula: '20260001', alunoNome: 'Ana Exemplo', turma: '3º Ano A', disciplina: 'Matemática', bimestre: '1º Bimestre', n1: 8.5, n2: 7, n3: 9, media: 8.2, aulasDadas: 40, presencas: 38, faltas: 2, frequencia: 95, situacao: 'Aprovado', fechado: true },
            { id: '3º-ano-a|20260002|matematica|1º-bimestre', alunoId: 'aluno-20260002', matricula: '20260002', alunoNome: 'Bruno Exemplo', turma: '3º Ano A', disciplina: 'Matemática', bimestre: '1º Bimestre', n1: 5.5, n2: 6, n3: 4.5, media: 5.3, aulasDadas: 40, presencas: 31, faltas: 9, frequencia: 77.5, situacao: 'Recuperação', fechado: true },
            { id: '3º-ano-a|20260001|lingua-portuguesa|1º-bimestre', alunoId: 'aluno-20260001', matricula: '20260001', alunoNome: 'Ana Exemplo', turma: '3º Ano A', disciplina: 'Língua Portuguesa', bimestre: '1º Bimestre', n1: 8, n2: 7, n3: 9, media: 8, aulasDadas: 40, presencas: 40, faltas: 0, frequencia: 100, situacao: 'Aprovado', fechado: true },
            { id: '3º-ano-a|20260002|lingua-portuguesa|1º-bimestre', alunoId: 'aluno-20260002', matricula: '20260002', alunoNome: 'Bruno Exemplo', turma: '3º Ano A', disciplina: 'Língua Portuguesa', bimestre: '1º Bimestre', n1: 4, n2: 3.5, n3: 5, media: 4.2, aulasDadas: 40, presencas: 29, faltas: 11, frequencia: 72.5, situacao: 'Reprovado', fechado: true }
        ],
        ocorrencias: [
            { id: 'db-OCO-DEMO-001', protocolo: 'OCO-DEMO-001', alunoId: 'aluno-20260001', aluno: 'Ana Exemplo', turma: '3º Ano A', data: '18/03/2026', tipo: 'Pedagógica', gravidade: 'Baixa', descricao: 'Acompanhamento de atividade.', status: 'Pendente', autor: 'Caio Exemplo' }
        ],
        atestados: [
            { id: 'db-atestado-1', tipo: 'aluno', alunoNome: 'Ana Exemplo', motivo: 'Ausência justificada no exemplo', dataInicio: '2026-03-19', dataFim: '2026-03-20', status: 'Recebido' }
        ],
        comunicados: [
            { id: 'db-comunicado-1', titulo: 'Reunião do bimestre', tipo: 'Aviso', texto: 'Exemplo de convite para a reunião escolar.', status: 'Rascunho', destinatarios: ['Responsáveis'] }
        ]
    });

    const COLLECTION_KEYS = Object.freeze([
        'alunos',
        'professores',
        'profissionais',
        'turmas',
        'salas',
        'disciplinas',
        'vinculosTurmas',
        'matriculas',
        'academico',
        'ocorrencias',
        'comunicados',
        'boletins',
        'auditoria',
        'atestados',
        'notasFrequencia'
    ]);
    const SQL_DEMO_MIGRATION_KEY = 'educonnect_sql_demo_v1';
    const LEGACY_DEMO_IDS = Object.freeze({
        alunos: ['20240001', '20240002', '20230142', '20240003', '20220311', '20240004', '20260005'],
        professores: ['PROF202101', 'PROF201915', 'PROF202208', 'PROF201804', 'PROF202302', 'PROF202117'],
        profissionais: ['EMP202005', 'EMP202112', 'EMP201903', 'EMP202245', 'EMP202011', 'EMP202310'],
        turmas: ['3A-EM', '3B-EM'],
        salas: ['sala-101', 'sala-102', 'sala-103', 'sala-104', 'sala-105', 'sala-106', 'laboratorio-a'],
        disciplinas: ['MAT-101', 'PORT-202'],
        ocorrencias: ['OC-2026-0001', 'OC-2026-0002', 'OC-2026-0003', 'OC-2026-0004', 'OC-2026-0005'],
        atestados: [],
        comunicados: []
    });

    function clone(value) {
        return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function read(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return clone(fallback);
            return JSON.parse(raw);
        } catch (error) {
            console.error(`EduConnect: não foi possível ler a chave ${key}.`, error);
            return clone(fallback);
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent(EVENT_NAME, {
                detail: { key, value: clone(value) }
            }));
            return true;
        } catch (error) {
            console.error(`EduConnect: não foi possível salvar a chave ${key}.`, error);
            window.alert('Não foi possível salvar os dados neste navegador.');
            return false;
        }
    }

    function readArray(key, fallback = []) {
        const value = read(key, fallback);
        return Array.isArray(value) ? value : clone(fallback);
    }

    function normalizeText(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLocaleLowerCase('pt-BR');
    }

    function numberFrom(value) {
        if (value === '' || value == null) return null;
        const normalized = String(value).trim().replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function round(value, decimals = 1) {
        if (!Number.isFinite(value)) return null;
        const factor = 10 ** decimals;
        return Math.round((value + Number.EPSILON) * factor) / factor;
    }

    function formatNumber(value, decimals = 1) {
        if (!Number.isFinite(Number(value))) return '—';
        return Number(value).toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function createId(prefix = 'id') {
        if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function normalizeStatus(value, fallback = 'Ativo') {
        const normalized = normalizeText(value);
        if (normalized === 'inativo') return 'Inativo';
        if (normalized === 'ativo') return 'Ativo';
        return fallback;
    }

    function normalizeStudent(record) {
        const codigo = String(record?.codigo ?? record?.matricula ?? record?.id ?? '').trim();
        return {
            ...record,
            uid: String(record?.uid ?? `aluno-${codigo}`),
            codigo,
            nome: String(record?.nome ?? record?.nomeCompleto ?? '').trim(),
            cpf: String(record?.cpf ?? '').trim(),
            turma: String(record?.turma ?? '').trim(),
            serie: String(record?.serie ?? '').trim(),
            status: normalizeStatus(record?.status)
        };
    }

    function normalizeTeacher(record) {
        const codigo = String(record?.codigo ?? record?.id ?? '').trim();
        return {
            ...record,
            uid: String(record?.uid ?? `professor-${codigo}`),
            codigo,
            nome: String(record?.nome ?? record?.nomeCompleto ?? '').trim(),
            disciplina: String(record?.disciplina ?? '').trim(),
            turmas: Array.isArray(record?.turmas)
                ? record.turmas
                : String(record?.turmas ?? '').split(',').map((item) => item.trim()).filter(Boolean),
            status: normalizeStatus(record?.status)
        };
    }

    function getCollection(key) {
        return readArray(key);
    }

    function getStudents() {
        return getCollection(KEYS.alunos).map(normalizeStudent);
    }

    function getTeachers() {
        return getCollection(KEYS.professores).map(normalizeTeacher);
    }

    function getStaff() {
        return getCollection(KEYS.profissionais);
    }

    function getClasses() {
        return getCollection(KEYS.turmas).map((record) => ({
            ...record,
            codigo: String(record?.codigo ?? '').trim(),
            nome: String(record?.nome ?? '').trim(),
            serie: String(record?.serie ?? '').trim(),
            turno: String(record?.turno ?? '').trim(),
            alunos: Number(record?.alunos ?? 0),
            capacidade: Number(record?.capacidade ?? 0),
            ativa: record?.ativa !== false
        }));
    }

    function getDisciplines() {
        return getCollection(KEYS.disciplinas).map((record) => ({
            ...record,
            codigo: String(record?.codigo ?? record?.id ?? '').trim(),
            nome: String(record?.nome ?? record?.nomeDisciplina ?? '').trim(),
            cargaHoraria: Number(record?.cargaHoraria ?? record?.horas ?? 0),
            turmas: Array.isArray(record?.turmas) ? record.turmas.map(String) : [],
            professores: Array.isArray(record?.professores) ? record.professores.map(String) : []
        }));
    }

    function saveCollection(key, records) {
        return write(key, Array.isArray(records) ? records : []);
    }

    function getCurrentActor() {
        const actor = read(KEYS.estudanteAtual, null);
        if (actor && typeof actor === 'object') return actor;
        return {
            tipo: 'local',
            uid: 'local-user',
            nome: 'Usuário local'
        };
    }

    function setCurrentStudent(student) {
        if (!student) return write(KEYS.estudanteAtual, null);
        return setCurrentActor({
            tipo: 'aluno',
            uid: student.uid,
            codigo: student.codigo,
            nome: student.nome,
            turma: student.turma,
            serie: student.serie
        });
    }

    function setCurrentActor(actor) {
        if (!actor || typeof actor !== 'object') return write(KEYS.estudanteAtual, null);
        return write(KEYS.estudanteAtual, {
            tipo: String(actor.tipo ?? 'local'),
            uid: String(actor.uid ?? 'local-user'),
            nome: String(actor.nome ?? 'Usuário local'),
            identificador: String(actor.identificador ?? ''),
            codigo: String(actor.codigo ?? ''),
            turma: String(actor.turma ?? ''),
            serie: String(actor.serie ?? '')
        });
    }

    function getAcademicRecords() {
        return readArray(KEYS.academico).map((record) => ({
            // Campos adicionais, como marcadores de migração e fechamento,
            // precisam sobreviver à leitura usada por todos os módulos.
            ...record,
            id: String(record?.id ?? ''),
            alunoId: String(record?.alunoId ?? '').trim(),
            alunoNome: String(record?.alunoNome ?? '').trim(),
            matricula: String(record?.matricula ?? '').trim(),
            turma: String(record?.turma ?? '').trim(),
            disciplina: String(record?.disciplina ?? '').trim(),
            bimestre: String(record?.bimestre ?? '').trim(),
            n1: numberFrom(record?.n1),
            n2: numberFrom(record?.n2),
            n3: numberFrom(record?.n3),
            media: numberFrom(record?.media),
            aulasDadas: Number.isFinite(Number(record?.aulasDadas)) ? Number(record.aulasDadas) : null,
            presencas: Number.isFinite(Number(record?.presencas)) ? Number(record.presencas) : null,
            faltas: Number.isFinite(Number(record?.faltas)) ? Number(record.faltas) : null,
            frequencia: numberFrom(record?.frequencia),
            situacao: String(record?.situacao ?? '').trim(),
            fechado: record?.fechado === true,
            criadoEm: String(record?.criadoEm ?? '').trim(),
            atualizadoEm: String(record?.atualizadoEm ?? '').trim()
        }));
    }

    function buildAcademicId({ alunoId, matricula, alunoNome, turma, disciplina, bimestre }) {
        const studentKey = alunoId || matricula || normalizeText(alunoNome);
        return [turma, studentKey, disciplineKey(disciplina), bimestre]
            .map((item) => normalizeText(item).replace(/\s+/g, '-'))
            .join('|');
    }

    function disciplineKey(value) {
        return String(value ?? '').trim();
    }

    function calculateAverage(n1, n2, n3) {
        const values = [n1, n2, n3].map(numberFrom);
        if (values.some((value) => value == null)) return null;
        return round(values.reduce((sum, value) => sum + value, 0) / values.length, 1);
    }

    function calculateFrequency(aulasDadas, presencas, faltas) {
        let aulas = Number(aulasDadas);
        let presencasNum = Number(presencas);
        let faltasNum = Number(faltas);

        if (!Number.isFinite(aulas) || aulas < 0) aulas = null;
        if (aulas != null && (!Number.isFinite(presencasNum) || presencasNum < 0)) presencasNum = null;
        if (aulas != null && presencasNum != null) {
            faltasNum = Math.max(0, aulas - presencasNum);
            return {
                aulasDadas: aulas,
                presencas: presencasNum,
                faltas: faltasNum,
                frequencia: aulas === 0 ? null : round((presencasNum / aulas) * 100, 1)
            };
        }

        if (Number.isFinite(faltasNum) && aulas != null) {
            presencasNum = Math.max(0, aulas - faltasNum);
            return {
                aulasDadas: aulas,
                presencas: presencasNum,
                faltas: Math.max(0, faltasNum),
                frequencia: aulas === 0 ? null : round((presencasNum / aulas) * 100, 1)
            };
        }

        return {
            aulasDadas: Number.isFinite(aulas) ? aulas : null,
            presencas: Number.isFinite(presencasNum) ? presencasNum : null,
            faltas: Number.isFinite(faltasNum) ? faltasNum : null,
            frequencia: null
        };
    }

    function upsertAcademicRecord(patch) {
        const records = getAcademicRecords();
        const id = patch.id || buildAcademicId(patch);
        const existingIndex = records.findIndex((record) => record.id === id);
        const existing = existingIndex >= 0 ? records[existingIndex] : null;

        const next = {
            ...(existing ?? {}),
            ...patch,
            id,
            atualizadoEm: nowIso(),
            criadoEm: existing?.criadoEm || nowIso()
        };

        next.media = calculateAverage(next.n1, next.n2, next.n3);
        const frequency = calculateFrequency(next.aulasDadas, next.presencas, next.faltas);
        Object.assign(next, frequency);

        if (existingIndex >= 0) records[existingIndex] = next;
        else records.push(next);

        return saveCollection(KEYS.academico, records) ? next : null;
    }

    function findAcademicRecord(filters) {
        const records = getAcademicRecords();
        return records.find((record) => (
            (!filters.id || record.id === filters.id)
            && (!filters.alunoId || record.alunoId === filters.alunoId)
            && (!filters.matricula || record.matricula === filters.matricula)
            && (!filters.alunoNome || normalizeText(record.alunoNome) === normalizeText(filters.alunoNome))
            && (!filters.turma || normalizeText(record.turma) === normalizeText(filters.turma))
            && (!filters.disciplina || normalizeText(record.disciplina) === normalizeText(filters.disciplina))
            && (!filters.bimestre || normalizeText(record.bimestre) === normalizeText(filters.bimestre))
        ));
    }

    function deleteAcademicRecord(id) {
        const records = getAcademicRecords().filter((record) => record.id !== id);
        return saveCollection(KEYS.academico, records);
    }

    function getOccurrences() {
        return readArray(KEYS.ocorrencias);
    }

    function saveOccurrences(records) {
        return saveCollection(KEYS.ocorrencias, records);
    }

    function nextOccurrenceProtocol() {
        const year = new Date().getFullYear();
        const records = getOccurrences();
        const prefix = `OC-${year}-`;
        const max = records.reduce((largest, record) => {
            if (!String(record.protocolo ?? '').startsWith(prefix)) return largest;
            const suffix = Number(String(record.protocolo).slice(prefix.length));
            return Number.isFinite(suffix) ? Math.max(largest, suffix) : largest;
        }, 0);
        return `${prefix}${String(max + 1).padStart(4, '0')}`;
    }

    function addOccurrence(record) {
        const records = getOccurrences();
        const next = {
            id: createId('ocorrencia'),
            protocolo: record.protocolo || nextOccurrenceProtocol(),
            criadoEm: nowIso(),
            data: record.data || new Date().toLocaleDateString('pt-BR'),
            aluno: String(record.aluno ?? '').trim(),
            // Campos opcionais enriquecem novas ocorrências sem alterar registros antigos.
            alunoId: String(record.alunoId ?? '').trim(),
            matricula: String(record.matricula ?? '').trim(),
            turma: String(record.turma ?? '').trim(),
            tipo: String(record.tipo ?? '').trim(),
            gravidade: String(record.gravidade ?? '').trim(),
            descricao: String(record.descricao ?? '').trim(),
            autor: String(record.autor ?? '').trim(),
            status: String(record.status ?? 'Aberta').trim()
        };
        records.unshift(next);
        if (!saveOccurrences(records)) return null;
        addAudit({ modulo: 'Ocorrências', acao: 'Criação', descricao: `Registrou ocorrência ${next.protocolo}.` });
        return next;
    }

    function getCommunications() {
        return readArray(KEYS.comunicados);
    }

    function saveCommunications(records) {
        return saveCollection(KEYS.comunicados, records);
    }

    function addCommunication(record) {
        const records = getCommunications();
        const now = new Date();
        const status = record.status || 'Rascunho';
        const next = {
            id: createId('comunicado'),
            criadoEm: nowIso(),
            enviadoEm: status === 'Enviado' ? nowIso() : null,
            titulo: String(record.titulo ?? '').trim(),
            tipo: String(record.tipo ?? 'Informativo').trim(),
            destinatarios: String(record.destinatarios ?? 'Todos').trim(),
            texto: String(record.texto ?? '').trim(),
            status,
            autor: String(record.autor ?? 'Usuário local').trim()
        };
        records.unshift(next);
        if (!saveCommunications(records)) return null;
        addAudit({ modulo: 'Comunicados', acao: 'Criação', descricao: `Criou o comunicado "${next.titulo}".` });
        return next;
    }

    function updateCommunication(id, patch) {
        const records = getCommunications();
        const index = records.findIndex((record) => record.id === id);
        if (index < 0) return null;

        records[index] = {
            ...records[index],
            ...patch,
            atualizadoEm: nowIso()
        };

        if (!saveCommunications(records)) return null;
        addAudit({ modulo: 'Comunicados', acao: 'Edição', descricao: `Editou o comunicado "${records[index].titulo}".` });
        return records[index];
    }

    function resendCommunication(id) {
        const records = getCommunications();
        const record = records.find((item) => item.id === id);
        if (!record) return null;

        record.status = 'Enviado';
        record.enviadoEm = nowIso();
        record.atualizadoEm = nowIso();
        if (!saveCommunications(records)) return null;
        addAudit({ modulo: 'Comunicados', acao: 'Envio', descricao: `Reenviou o comunicado "${record.titulo}".` });
        return record;
    }

    function getAudit() {
        return readArray(KEYS.auditoria);
    }

    function saveAudit(records) {
        return saveCollection(KEYS.auditoria, records);
    }

    function addAudit(entry) {
        const records = getAudit();
        const actor = getCurrentActor();
        const next = {
            id: createId('audit'),
            dataHora: nowIso(),
            usuario: String(entry.usuario ?? actor.nome ?? 'Usuário local'),
            modulo: String(entry.modulo ?? 'Sistema'),
            acao: String(entry.acao ?? 'Ação'),
            descricao: String(entry.descricao ?? '').trim(),
            ip: String(entry.ip ?? 'cliente')
        };
        records.unshift(next);
        saveAudit(records.slice(0, 500));
        return next;
    }

    function getGeneratedReports() {
        return readArray(KEYS.boletins);
    }

    function saveGeneratedReports(records) {
        return saveCollection(KEYS.boletins, records);
    }

    function addGeneratedReport(record) {
        const records = getGeneratedReports();
        const next = {
            id: createId('boletim'),
            criadoEm: nowIso(),
            status: 'Gerado',
            ...record
        };
        records.unshift(next);
        if (!saveGeneratedReports(records)) return null;
        addAudit({ modulo: 'Boletins', acao: 'Geração', descricao: `Gerou boletins para ${next.turma || 'a turma selecionada'}.` });
        return next;
    }

    function initializeLocalData() {
        COLLECTION_KEYS.forEach((collection) => {
            const key = KEYS[collection];
            try {
                if (localStorage.getItem(key) !== null) return;
            } catch (error) {
                console.error(`EduConnect: não foi possível verificar a chave ${key}.`, error);
                return;
            }
            const initialRecords = INITIAL_DATA[collection] ?? [];
            saveCollection(key, initialRecords);
        });
        migrateSqlDemoData();
    }

    function migrateSqlDemoData() {
        try {
            if (localStorage.getItem(SQL_DEMO_MIGRATION_KEY) === 'true') return;
        } catch (error) {
            console.error('EduConnect: não foi possível verificar a atualização dos dados de demonstração.', error);
            return;
        }

        const identityFields = {
            alunos: 'codigo',
            professores: 'codigo',
            profissionais: 'codigo',
            turmas: 'codigo',
            salas: 'id',
            disciplinas: 'codigo',
            ocorrencias: 'protocolo',
            atestados: 'id',
            comunicados: 'id'
        };
        let migrated = true;

        Object.entries(identityFields).forEach(([collection, identityField]) => {
            const key = KEYS[collection];
            const records = readArray(key).filter((record) =>
                !LEGACY_DEMO_IDS[collection].includes(String(record?.[identityField] ?? ''))
            );
            const existingIds = new Set(records.map((record) => String(record?.[identityField] ?? '')));
            const replacements = (INITIAL_DATA[collection] ?? []).filter((record) =>
                !existingIds.has(String(record[identityField]))
            );
            if (!saveCollection(key, [...records, ...replacements])) migrated = false;
        });

        const legacyStudentIds = new Set(LEGACY_DEMO_IDS.alunos);
        const academic = readArray(KEYS.academico).filter((record) =>
            !legacyStudentIds.has(String(record?.matricula ?? ''))
        );
        const academicIds = new Set(academic.map((record) => String(record?.id ?? '')));
        const sqlAcademic = INITIAL_DATA.academico.filter((record) => !academicIds.has(record.id));
        if (!saveCollection(KEYS.academico, [...academic, ...sqlAcademic])) migrated = false;

        const legacyNotes = readArray(KEYS.notasFrequencia).filter((record) =>
            !legacyStudentIds.has(String(record?.matricula ?? ''))
        );
        const noteIds = new Set(legacyNotes.map((record) => String(record?.id ?? '')));
        const sqlNotes = INITIAL_DATA.academico.filter((record) => !noteIds.has(record.id));
        if (!saveCollection(KEYS.notasFrequencia, [...legacyNotes, ...sqlNotes])) migrated = false;

        const audit = readArray(KEYS.auditoria).filter((record) =>
            record?.__seedKey !== 'dashboard-fixture-2026'
        );
        if (!saveCollection(KEYS.auditoria, audit)) migrated = false;

        if (!migrated) return;
        try {
            localStorage.setItem(SQL_DEMO_MIGRATION_KEY, 'true');
        } catch (error) {
            console.error('EduConnect: não foi possível concluir a atualização dos dados de demonstração.', error);
        }
    }

    function parseOptionValue(select, prefix) {
        if (!select) return '';
        const text = select.options[select.selectedIndex]?.textContent?.trim() ?? '';
        if (!prefix) return text;
        return text.replace(new RegExp(`^${prefix}\\s*`, 'i'), '').trim();
    }

    function extractBimestre(text) {
        const match = String(text ?? '').match(/([1-4])\s*[º°]?\s*Bimestre/i);
        return match ? `${match[1]}º Bimestre` : String(text ?? '').trim();
    }

    function classCodeFromPath(pathname = location.pathname) {
        const match = pathname.match(/(?:^|\/)(\d+[A-Z](?:-[A-Z]+)?)\/notas\.html$/i);
        return match ? match[1].toUpperCase() : '';
    }

    function migrateStaticTableRows({ table, buildRecord, key }) {
        const existing = getAcademicRecords();
        if (existing.some((record) => record.__seedKey === key)) return existing;

        const seeded = [];
        const existingIds = new Set(existing.map((record) => record.id));
        table?.querySelectorAll(':scope > tbody > tr').forEach((row) => {
            const record = buildRecord(row);
            if (!record || existingIds.has(record.id)) return;
            existingIds.add(record.id);
            seeded.push({
                ...record,
                __seedKey: key,
                criadoEm: nowIso(),
                atualizadoEm: nowIso()
            });
        });

        if (!seeded.length) return existing;
        // Identificadores iguais nunca geram linhas duplicadas nem substituem
        // valores acadêmicos que já tenham sido lançados pelo professor.
        const merged = [...existing, ...seeded];
        saveCollection(KEYS.academico, merged);
        return merged;
    }

    function parseDateTimePtBR(value) {
        const match = String(value ?? '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(\d{2}):(\d{2}))?/);
        if (!match) return null;
        const [, day, month, year, hour = '00', minute = '00'] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    }

    window.addEventListener('storage', (event) => {
        if (!Object.values(KEYS).includes(event.key)) return;
        window.dispatchEvent(new CustomEvent(EVENT_NAME, {
            detail: { key: event.key, value: read(event.key) }
        }));
    });

    window.EduConnectBackend = Object.freeze({
        keys: KEYS,
        eventName: EVENT_NAME,
        clone,
        read,
        write,
        readArray,
        normalizeText,
        numberFrom,
        round,
        formatNumber,
        nowIso,
        createId,
        normalizeStudent,
        normalizeTeacher,
        getCollection,
        getStudents,
        getTeachers,
        getStaff,
        getClasses,
        getDisciplines,
        saveCollection,
        getCurrentActor,
        setCurrentActor,
        setCurrentStudent,
        getAcademicRecords,
        buildAcademicId,
        calculateAverage,
        calculateFrequency,
        upsertAcademicRecord,
        findAcademicRecord,
        deleteAcademicRecord,
        getOccurrences,
        saveOccurrences,
        nextOccurrenceProtocol,
        addOccurrence,
        getCommunications,
        saveCommunications,
        addCommunication,
        updateCommunication,
        resendCommunication,
        getAudit,
        saveAudit,
        addAudit,
        getGeneratedReports,
        saveGeneratedReports,
        addGeneratedReport,
        initializeLocalData,
        parseOptionValue,
        extractBimestre,
        classCodeFromPath,
        migrateStaticTableRows,
        parseDateTimePtBR
    });

    initializeLocalData();
})();
