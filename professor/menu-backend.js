/* =========================================================
 * 1. ESCOPO DO MÓDULO E MODO ESTRITO
 * ========================================================= */
/**
 * Sincroniza indicadores e atribuições exibidas no menu do professor com o armazenamento local.
 * A função autoexecutável isola nomes auxiliares para não poluir window.
 */
(() => {
    // O modo estrito transforma alguns erros silenciosos em erros explícitos,
    // ajudando a identificar atribuições inválidas durante o desenvolvimento.
    'use strict';

    /* =========================================================
     * 2. LEITURA DA TABELA E MONTAGEM DAS ATRIBUIÇÕES
     * ========================================================= */
    function init() {
        // O backend é uma dependência compartilhada publicada em window; sem
        // ele, a rotina encerra com segurança em vez de chamar métodos ausentes.
        const backend = window.EduConnectBackend;
        if (!backend) return;

        // querySelector seleciona a tabela que já existe no HTML. O encadeamento
        // opcional e o valor alternativo tornam a leitura segura se faltar tabela.
        const table = document.querySelector('.darkTable');
        const rows = [...(table?.querySelectorAll('tbody > tr') ?? [])];
        // map transforma cada linha visual em um objeto de dados, mantendo
        // alinhados os índices das células com as colunas da tabela.
        const assignments = rows.map((row) => {
            // HTMLCollection não é um array; a sintaxe de espalhamento cria um
            // array para poder usar o mesmo estilo de leitura e indexação.
            const cells = [...row.cells];
            return {
                // Template literal combina o código da turma encontrado na URL
                // com um identificador, evitando IDs iguais entre atribuições.
                id: `${backend.classCodeFromPath()}-${backend.createId('assignment')}`,
                // ?. protege células ausentes; ?? fornece texto vazio sem trocar
                // valores válidos que apenas sejam falsy, como a string "0".
                turma: cells[0]?.textContent?.trim() ?? '',
                disciplina: cells[1]?.textContent?.trim() ?? '',
                // parseInt converte o conteúdo numérico da tabela; a base 10 evita
                // interpretações dependentes de formatos antigos de números.
                alunos: Number.parseInt(cells[2]?.textContent ?? '0', 10) || 0,
                status: cells[3]?.textContent?.trim() ?? ''
            };
        // Linhas sem nome de turma não representam atribuições utilizáveis.
        }).filter((item) => item.turma);

        /* =========================================================
         * 3. INICIALIZAÇÃO NÃO DESTRUTIVA DO ARMAZENAMENTO
         * ========================================================= */
        // A tabela estática serve de carga inicial; só grava quando há dados e
        // ainda não há vínculos salvos, preservando alterações anteriores.
        if (assignments.length && !backend.read(backend.keys.vinculosTurmas, null)) {
            backend.write(backend.keys.vinculosTurmas, assignments);
        }

        /* =========================================================
         * 4. ATUALIZAÇÃO DOS CARDS INDICADORES
         * ========================================================= */
        // reduce soma a quantidade de alunos de todas as turmas em um único
        // valor; length fornece a quantidade de linhas válidas como total.
        const cards = [...document.querySelectorAll('.cards .card')];
        const totalStudents = assignments.reduce((sum, item) => sum + item.alunos, 0);
        const totalClasses = assignments.length;
        // map localiza o nó de valor em cada card, aceitando as três estruturas
        // usadas pelo HTML do projeto sem acoplar o script a uma única tag.
        const values = cards.map((card) => card.querySelector('h1, .valor, strong'));
        // A checagem evita erro quando o HTML tem menos cards; textContent recebe
        // strings para atualizar apenas o conteúdo, sem interpretar marcação HTML.
        if (values[0]) values[0].textContent = String(totalStudents || 0);
        if (values[1]) values[1].textContent = String(totalClasses || 0);
    }

    /* =========================================================
     * 5. INICIALIZAÇÃO APÓS A LEITURA DO HTML
     * ========================================================= */
    // O evento garante que tabela e cards já existam quando init consultar o DOM,
    // independentemente de pequenas mudanças na posição do script na página.
    document.addEventListener('DOMContentLoaded', init);
})();
