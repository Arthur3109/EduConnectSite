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
        estudanteAtual: 'educonnect_estudante_atual'
    });

    const EVENT_NAME = 'educonnect:data-change';

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
        return write(KEYS.estudanteAtual, {
            tipo: 'aluno',
            uid: student.uid,
            codigo: student.codigo,
            nome: student.nome,
            turma: student.turma,
            serie: student.serie
        });
    }

    function getAcademicRecords() {
        return readArray(KEYS.academico).map((record) => ({
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
            tipo: String(record.tipo ?? '').trim(),
            gravidade: String(record.gravidade ?? '').trim(),
            descricao: String(record.descricao ?? '').trim(),
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
        const match = pathname.match(/(?:^|\/)(\d+[A-Z])\/notas\.html$/i);
        return match ? match[1].toUpperCase() : '';
    }

    function migrateStaticTableRows({ table, buildRecord, key }) {
        const existing = getAcademicRecords();
        if (existing.some((record) => record.__seedKey === key)) return existing;

        const seeded = [];
        table?.querySelectorAll(':scope > tbody > tr').forEach((row) => {
            const record = buildRecord(row);
            if (!record) return;
            seeded.push({
                ...record,
                __seedKey: key,
                criadoEm: nowIso(),
                atualizadoEm: nowIso()
            });
        });

        if (!seeded.length) return existing;
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
        parseOptionValue,
        extractBimestre,
        classCodeFromPath,
        migrateStaticTableRows,
        parseDateTimePtBR
    });
})();
