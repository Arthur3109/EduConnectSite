/* =========================================================
   EDUCONNECT
   MAPA INTERATIVO COM LEAFLET.JS
   ETEC DE PRAIA GRANDE - EXTENSÃO
   ========================================================= */


/* =========================================================
   1. AGUARDA O CARREGAMENTO DO HTML
   ---------------------------------------------------------
   O código será executado somente depois que o documento
   HTML estiver carregado.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {


    /* =====================================================
       2. VERIFICA SE O LEAFLET.JS FOI CARREGADO
       -----------------------------------------------------
       A biblioteca Leaflet disponibiliza a variável "L".
       Caso ela não exista, o mapa não poderá ser criado.
       ===================================================== */

    if (typeof L === 'undefined') {

        console.error(
            'EduConnect: Leaflet.js não foi carregado.'
        );

        return;
    }


    /* =====================================================
       3. LOCALIZA O CONTAINER DO MAPA
       -----------------------------------------------------
       O Leaflet será inicializado dentro do elemento HTML:

           <div id="map"></div>

       ===================================================== */

    const mapElement = document.getElementById('map');


    /* =====================================================
       4. VERIFICA SE O CONTAINER EXISTE
       -----------------------------------------------------
       Caso o elemento #map não esteja presente na página,
       interrompemos a execução para evitar erros.
       ===================================================== */

    if (!mapElement) {

        console.error(
            'EduConnect: o elemento #map não foi encontrado.'
        );

        return;
    }


    /* =====================================================
       5. LOCALIZAÇÃO DA ETEC DE PRAIA GRANDE - EXTENSÃO
       -----------------------------------------------------
       Endereço utilizado:

       Av. Dr. Roberto de Almeida Vinhas, 10.119
       Balneário Maracanã
       Praia Grande - SP
       CEP 11705-320

       As coordenadas abaixo representam a localização
       aproximada da unidade no bairro Balneário Maracanã.

       Latitude:  -24.0200
       Longitude: -46.4550

       Essas coordenadas serão utilizadas tanto para
       centralizar o mapa quanto para posicionar o único
       marcador.
       ===================================================== */

    const etecExtensaoLocation = [
        -24.032454958426655, 
        -46.506657082660844
    ];


    /* =====================================================
       6. INICIALIZAÇÃO DO MAPA
       -----------------------------------------------------
       O mapa é criado dentro do elemento #map.

       O método setView() recebe:

       - As coordenadas da ETEC de Praia Grande - Extensão
       - O nível de zoom 17

       O zoom 17 proporciona uma visualização próxima
       ao nível de rua, mantendo o marcador como ponto
       principal da visualização.
       ===================================================== */

    const map = L.map('map').setView(
        etecExtensaoLocation,
        17
    );


    /* =====================================================
       7. CAMADA DE TILES DO OPENSTREETMAP
       -----------------------------------------------------
       Utilizamos os tiles públicos do OpenStreetMap.

       URL:

       https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

       Essa camada não utiliza API Key.

       O Leaflet substitui automaticamente:

       {s} = servidor dos tiles
       {z} = nível de zoom
       {x} = posição horizontal
       {y} = posição vertical

       ===================================================== */

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            /* Créditos obrigatórios do OpenStreetMap. */
            attribution:
                '&copy; OpenStreetMap contributors',

            /* Limite máximo de aproximação do mapa. */
            maxZoom: 19

        }
    ).addTo(map);


    /* =====================================================
       8. CRIAÇÃO DO ÚNICO MARCADOR
       -----------------------------------------------------
       Aqui é criado somente UM marcador.

       O marcador utiliza exatamente a mesma variável de
       coordenadas utilizada na centralização do mapa.

       Não existem outros pins ou marcadores neste script.
       ===================================================== */

    const etecMarker = L.marker(
        etecExtensaoLocation
    );


    /* =====================================================
       9. ADICIONA O MARCADOR AO MAPA
       -----------------------------------------------------
       O marcador é inserido na camada principal do mapa.
       ===================================================== */

    etecMarker.addTo(map);


    /* =====================================================
       10. POPUP DO MARCADOR
       -----------------------------------------------------
       Ao clicar no único marcador, será exibido um popup
       identificando a unidade do EduConnect.

       O popup contém somente o nome da unidade.
       ===================================================== */

    etecMarker.bindPopup(
        '<strong>EduConnect - ETEC de Praia Grande Extensão</strong>'
    );


    /* =====================================================
       11. ABRE O POPUP AUTOMATICAMENTE
       -----------------------------------------------------
       O popup será aberto automaticamente após o marcador
       ser adicionado ao mapa.
       ===================================================== */

    etecMarker.openPopup();


    /* =====================================================
       12. ATUALIZA O TAMANHO DO MAPA
       -----------------------------------------------------
       O Leaflet pode precisar recalcular o tamanho do mapa
       depois que todos os elementos da página forem
       renderizados.

       invalidateSize() força essa atualização e ajuda a
       evitar problemas de renderização dos tiles.
       ===================================================== */

    setTimeout(function () {

        map.invalidateSize();

    }, 200);

});

// Pega o botão do Dark Mode pelo ID
const themeToggle = document.getElementById("themeToggle");


// Adiciona um evento de clique no botão
themeToggle.addEventListener("click", () => {

    // Adiciona ou remove a classe "dark-mode" do body
    // Se não tiver, adiciona
    // Se já tiver, remove
    document.body.classList.toggle("dark-mode");


    // Verifica se o Dark Mode está ativado
    if (document.body.classList.contains("dark-mode")) {

        // Salva "dark" no navegador
        // Assim, a preferência do usuário fica guardada
        localStorage.setItem("theme", "dark");

    } else {

        // Salva "light" no navegador
        // Isso significa que o usuário está usando o modo claro
        localStorage.setItem("theme", "light");
    }
});


// Verifica se existe um tema salvo no navegador
if (localStorage.getItem("theme") === "dark") {

    // Se o tema salvo for "dark",
    // adiciona a classe "dark-mode" ao body
    document.body.classList.add("dark-mode");
}