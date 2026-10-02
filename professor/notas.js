/* =========================================================
 * 1. ESCOPO DO MÓDULO E MODO ESTRITO
 * ========================================================= */
/**
 * Implementa o lançamento de notas nas páginas de turma do professor.
 * Funciona tanto em /professor/{turma}/notas.html quanto nas cópias legadas /{turma}/notas.html.
 * A função autoexecutável isola as funções auxiliares e evita criar variáveis globais.
 */
(() => {
    // O modo estrito ajuda a encontrar erros como variáveis não declaradas,
    // deixando explícitas falhas que poderiam passar despercebidas no navegador.
    'use strict';

    /* =========================================================
     * 2. ACESSO AO BACKEND COMPARTILHADO
     * ========================================================= */
    function getBackend() {
        // O backend centraliza persistência, normalização e cálculos para que
        // a página de notas não implemente regras divergentes por turma.
        return window.EduConnectBackend;
    }

    /* =========================================================
     * 3. CONSULTA DOS ELEMENTOS DA PÁGINA
     * ========================================================= */
    function getElements() {
        // A tabela é o requisito mínimo para operar; se não existir, retornar
        // null permite que init encerre sem tentar acessar linhas inexistentes.
        const table = document.querySelector('.darkTable');
        if (!table) return null;
        // O método find percorre os botões e seleciona o que representa a ação
        // de fechar o bimestre, sem depender da posição dele no documento.
        const button = [...document.querySelectorAll('button.btn')]
            .find((item) => /fechar bimestre/i.test(item.textContent));
        return {
            table,
            // O seletor limita a busca ao corpo da tabela para ignorar cabeçalhos.
            rows: [...table.querySelectorAll('tbody > tr')],
            closeButton: button,
            // O título fornece o texto do bimestre exibido na página.
            title: document.querySelector('h1')
        };
    }

    /* =========================================================
     * 4. IDENTIFICAÇÃO DO BIMESTRE E DO ALUNO
     * ========================================================= */
    function getBimestre(title) {
        // A expressão regular aceita ordinal com º ou °, além de espaços
        // opcionais; String e ?? toleram título ausente sem quebrar a busca.
        const match = String(title ?? '').match(/([1-4])\s*[º°]?\s*Bimestre/i);
        // O template literal normaliza o rótulo para uma forma consistente no
        // armazenamento; sem correspondência, o texto explicita a ausência.
        return match ? `${match[1]}º Bimestre` : 'Bimestre não definido';
    }

    function studentFromRow(row) {
        // A tabela contém o nome visível. O optional chaining evita erro se a
        // linha estiver incompleta e trim remove espaços de formatação do HTML.
        const name = row.cells[0]?.textContent?.trim() ?? '';
        // Busca os estudantes persistidos comparando nomes normalizados; isso
        // permite encontrar equivalências sem diferença de caixa ou acentuação.
        const student = getBackend().getStudents().find((item) => getBackend().normalizeText(item.nome) === getBackend().normalizeText(name));
        return {
            // O operador ?. produz undefined se não houver cadastro; ?? converte
            // essa ausência em string vazia para manter um formato previsível.
            alunoId: student?.uid ?? '',
            matricula: student?.codigo ?? '',
            alunoNome: name
        };
    }

    /* =========================================================
     * 5. LOCALIZAÇÃO DO REGISTRO ACADÊMICO
     * ========================================================= */
    function recordForRow(row, turma, bimestre) {
        const backend = getBackend();
        // Primeiro tenta a identificação mais forte (UID e matrícula), pois
        // nomes iguais podem existir para estudantes diferentes.
        const base = studentFromRow(row);
        return backend.findAcademicRecord({
            alunoId: base.alunoId,
            matricula: base.matricula,
            alunoNome: base.alunoNome,
            turma,
            bimestre,
            disciplina: ''
        // O segundo filtro serve de compatibilidade para registros antigos que
        // ainda não possuam UID ou matrícula associados.
        }) || backend.findAcademicRecord({
            alunoNome: base.alunoNome,
            turma,
            bimestre,
            disciplina: ''
        });
    }

    /* =========================================================
     * 6. VALIDAÇÃO DOS VALORES DIGITADOS
     * ========================================================= */
    function validateNote(value) {
        const backend = getBackend();
        // Campo vazio representa nota ainda não lançada, por isso não é erro;
        // numberFrom também interpreta vírgula decimal conforme o uso local.
        if (value === '') return '';
        const number = backend.numberFrom(value);
        // O retorno vazio indica validade. Uma mensagem textual pode ser
        // associada ao controle nativo por setCustomValidity.
        if (number == null || number < 0 || number > 10) return 'A nota deve estar entre 0 e 10.';
        return '';
    }

    /* =========================================================
     * 7. RENDERIZAÇÃO DO ESTADO DE UMA LINHA
     * ========================================================= */
    function renderRow(row, record) {
        const backend = getBackend();
        // O seletor por prefixo encontra as avaliações mesmo que haja outros
        // campos na linha; spread converte NodeList em array para forEach.
        const inputs = [...row.querySelectorAll('input[name^="nota"]')];
        const media = row.querySelector('.media');
        const frequencia = row.querySelector('.frequencia');
        // O array deixa explícita a correspondência entre os campos do HTML e
        // as propriedades do registro acadêmico.
        const values = [record?.n1, record?.n2, record?.n3];

        // forEach atualiza cada campo usando seu índice para obter a nota correta;
        // as propriedades nativas melhoram teclado, validação e estado de edição.
        inputs.forEach((input, index) => {
            const value = values[index];
            input.value = value == null ? '' : String(value);
            // inputMode sugere teclado decimal em dispositivos móveis. min, max
            // e step documentam o intervalo e a precisão permitidos no controle.
            input.inputMode = 'decimal';
            input.min = '0';
            input.max = '10';
            input.step = '0.1';
            // Limpa mensagens antigas antes da próxima validação e bloqueia a
            // edição quando o backend registra o bimestre como fechado.
            input.setCustomValidity('');
            input.disabled = record?.fechado === true;
        });

        // Ausência de registro é mostrada como travessão, e valores existentes
        // passam pelo formatador central para usar o padrão numérico pt-BR.
        if (media) media.textContent = record?.media == null ? '—' : backend.formatNumber(record.media, 1);
        if (frequencia) frequencia.textContent = record?.frequencia == null ? '—' : `${backend.formatNumber(record.frequencia, 1)}%`;
    }

    /* =========================================================
     * 8. VALIDAÇÃO E SALVAMENTO DAS NOTAS
     * ========================================================= */
    function saveInputs(row, turma, bimestre) {
        const backend = getBackend();
        const inputs = [...row.querySelectorAll('input[name^="nota"]')];
        const base = studentFromRow(row);
        // map gera uma mensagem para cada campo na mesma posição; isso permite
        // atualizar todas as validações e localizar o primeiro erro depois.
        const errors = inputs.map((input) => validateNote(input.value));

        // A Constraint Validation API mostra uma mensagem nativa e impede que
        // valores fora da faixa sejam persistidos.
        inputs.forEach((input, index) => input.setCustomValidity(errors[index]));
        const firstError = inputs.find((input) => input.validationMessage);
        if (firstError) {
            // reportValidity solicita que o navegador informe o primeiro campo
            // inválido e retorna antes de qualquer gravação.
            firstError.reportValidity();
            return;
        }

        // Preservar o registro anterior mantém propriedades que não estão neste
        // formulário; os novos campos sobrescrevem somente a linha atual.
        const existing = recordForRow(row, turma, bimestre);
        const patch = {
            ...(existing ?? {}),
            ...base,
            turma,
            bimestre,
            disciplina: '',
            n1: backend.numberFrom(inputs[0]?.value),
            n2: backend.numberFrom(inputs[1]?.value),
            n3: backend.numberFrom(inputs[2]?.value)
        };
        // upsert insere ou atualiza o registro usando a chave acadêmica; o backend
        // recalcula média/frequência e dispara seu evento de mudança de dados.
        const saved = backend.upsertAcademicRecord(patch);
        // A interface reflete a resposta persistida, não apenas o texto digitado,
        // para manter média, frequência e bloqueio coerentes com o armazenamento.
        if (saved) renderRow(row, saved);
    }

    /* =========================================================
     * 9. FECHAMENTO DO BIMESTRE
     * ========================================================= */
    function closeBimestre(elements, turma, bimestre) {
        const backend = getBackend();
        // Páginas sem controle de fechamento continuam podendo exibir notas;
        // não há ação a executar sem o botão correspondente.
        if (!elements.closeButton) return;

        // confirm é uma decisão síncrona do navegador. O cancelamento preserva
        // o estado; só a confirmação autoriza bloquear os registros da turma.
        if (!window.confirm(`Fechar o ${bimestre} da turma ${turma}? Os campos desta página ficarão bloqueados nesta simulação.`)) return;

        // Cada linha recebe o indicador fechado sem descartar as notas já salvas;
        // upsert mantém os demais campos e renderRow atualiza o controle visual.
        elements.rows.forEach((row) => {
            const existing = recordForRow(row, turma, bimestre);
            const base = studentFromRow(row);
            const saved = backend.upsertAcademicRecord({
                ...(existing ?? {}),
                ...base,
                turma,
                bimestre,
                disciplina: '',
                fechado: true
            });
            if (saved) renderRow(row, saved);
        });

        // Desativar o botão reduz cliques repetidos e torna o novo estado legível.
        elements.closeButton.textContent = 'Bimestre fechado';
        elements.closeButton.disabled = true;
        // O registro de auditoria é necessário para deixar rastreável a ação
        // administrativa junto com os demais eventos do sistema.
        backend.addAudit({
            modulo: 'Notas',
            acao: 'Fechamento',
            descricao: `Fechou o ${bimestre} da turma ${turma}.`
        });
    }

    /* =========================================================
     * 10. INICIALIZAÇÃO E ASSOCIAÇÃO DOS EVENTOS
     * ========================================================= */
    function init() {
        const backend = getBackend();
        // Verificar a dependência antes de consultar dados evita uma falha em
        // cascata e informa qual script precisa ser carregado primeiro.
        if (!backend) {
            console.error('EduConnect: educonnect-backend.js precisa ser carregado antes de professor/notas.js.');
            return;
        }

        const elements = getElements();
        // Sem tabela, não há linhas para preencher nem eventos para associar.
        if (!elements) return;

        // A turma vem da rota para que o mesmo script sirva a diferentes páginas;
        // o título visível fornece o bimestre que será usado na chave do registro.
        const turma = backend.classCodeFromPath() || 'Turma não definida';
        const bimestre = getBimestre(elements.title?.textContent);

        // Primeiro hidrata cada linha com o estado salvo; em seguida associa input
        // para salvar durante a edição e blur como confirmação ao sair do campo.
        elements.rows.forEach((row) => {
            renderRow(row, recordForRow(row, turma, bimestre));

            row.querySelectorAll('input[name^="nota"]').forEach((input) => {
                // Arrow functions preservam o contexto léxico e capturam a linha,
                // a turma e o bimestre correspondentes ao controle editado.
                input.addEventListener('input', () => saveInputs(row, turma, bimestre));
                input.addEventListener('blur', () => saveInputs(row, turma, bimestre));
            });
        });

        // Registros fechados podem ter sido salvos antes desta visita; consultar
        // todos impede que o botão reapareça como ação disponível por engano.
        const hasClosedRecord = elements.rows.some((row) => recordForRow(row, turma, bimestre)?.fechado === true);
        if (hasClosedRecord && elements.closeButton) {
            elements.closeButton.textContent = 'Bimestre fechado';
            elements.closeButton.disabled = true;
        }

        // O evento click permite cancelar a navegação padrão do botão dentro de
        // um link e encaminha o fluxo para a confirmação e gravação do fechamento.
        elements.closeButton?.addEventListener('click', (event) => {
            event.preventDefault();
            closeBimestre(elements, turma, bimestre);
        });

        // O evento customizado do backend atualiza a tela quando os dados
        // acadêmicos mudam por outro fluxo. Filtrar pela chave evita redesenhos
        // causados por alterações de módulos sem relação com notas.
        window.addEventListener(backend.eventName, (event) => {
            if (event.detail?.key !== backend.keys.academico) return;
            elements.rows.forEach((row) => renderRow(row, recordForRow(row, turma, bimestre)));
        });
    }

    /* =========================================================
     * 11. PONTO DE ENTRADA DO DOCUMENTO
     * ========================================================= */
    // DOMContentLoaded é disparado quando o HTML foi analisado. Assim, os
    // seletores de tabela e campos funcionam sem esperar imagens e outros recursos.
    document.addEventListener('DOMContentLoaded', init);
})();
