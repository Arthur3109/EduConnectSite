/* =========================================================
   EDUCONNECT
   MAPA INTERATIVO COM LEAFLET.JS
   ETEC DE PRAIA GRANDE - EXTENSÃO
   ========================================================= */


/* =========================================================
   1. AGUARDA O CARREGAMENTO DO HTML
   ---------------------------------------------------------
   A inicialização do mapa só acontece depois que o documento
   estiver pronto para que seus elementos possam ser localizados.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

    /* =====================================================
       2. VERIFICA SE O LEAFLET.JS FOI CARREGADO
       -----------------------------------------------------
       A biblioteca Leaflet disponibiliza o objeto global L.
       Sem ele, não é possível criar nem controlar o mapa.
       ===================================================== */

    if (typeof L === 'undefined') {
        console.error('EduConnect: Leaflet.js não foi carregado.');
        return;
    }

    /* =====================================================
       3. LOCALIZA E VALIDA O CONTAINER DO MAPA
       -----------------------------------------------------
       O mapa precisa de um elemento HTML com id="map".
       Se ele não existir nesta página, encerramos somente a
       inicialização do mapa.
       ===================================================== */

    const mapElement = document.getElementById('map');

    if (!mapElement) {
        console.error('EduConnect: o elemento #map não foi encontrado.');
        return;
    }

    /* =====================================================
       4. COORDENADAS FIXAS DA ETEC DE PRAIA GRANDE - EXTENSÃO
       -----------------------------------------------------
       Latitude:  -24.032454958426655
       Longitude: -46.506657082660844

       Este ponto representa a unidade e permanece no mapa
       independentemente da disponibilidade do GPS do cliente.
       ===================================================== */

    const etecExtensaoLocation = [
        -24.032454958426655,
        -46.506657082660844
    ];

    /* =====================================================
       5. CRIA O MAPA E A CAMADA DE TILES
       -----------------------------------------------------
       O mapa começa focado na ETEC. Quando a posição do cliente
       for recebida, o enquadramento será ajustado para mostrar
       os dois locais simultaneamente.
       ===================================================== */

    const map = L.map('map').setView(etecExtensaoLocation, 17);

    L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }
    ).addTo(map);

    /* =====================================================
       6. ADICIONA O MARCADOR FIXO DA ETEC
       -----------------------------------------------------
       O popup identifica claramente a unidade. Ele permanece
       disponível mesmo se o navegador não fornecer o GPS.
       ===================================================== */

    const etecMarker = L.marker(etecExtensaoLocation)
        .addTo(map)
        .bindPopup('<strong>EduConnect - ETEC de Praia Grande Extensão</strong>');

    etecMarker.openPopup();

    /* =====================================================
       7. VERIFICA A DISPONIBILIDADE DA GEOLOCALIZAÇÃO
       -----------------------------------------------------
       A API pode não estar disponível em alguns navegadores.
       Ela também pode exigir uma conexão segura (HTTPS) e a
       autorização explícita do usuário.
       ===================================================== */

    if (!navigator.geolocation) {
        alert('A geolocalização não está disponível neste navegador. Você ainda pode consultar a localização da ETEC no mapa.');
        return;
    }

    /* =====================================================
       8. TRATA ERROS AO OBTER A POSIÇÃO DO CLIENTE
       -----------------------------------------------------
       Os códigos padronizados da API representam:
       1 = permissão negada; 2 = posição indisponível;
       3 = tempo limite excedido.
       ===================================================== */

    function handleGeolocationError(error) {
        let message;

        switch (error.code) {
            case 1:
                message = 'A permissão para acessar sua localização foi negada. A localização da ETEC continuará disponível no mapa.';
                break;
            case 2:
                message = 'Não foi possível determinar sua localização neste momento. Verifique o GPS ou a conexão e tente novamente.';
                break;
            case 3:
                message = 'A solicitação da sua localização excedeu o tempo limite. Tente novamente em alguns instantes.';
                break;
            default:
                message = 'Ocorreu um erro ao tentar obter sua localização. A localização da ETEC continuará disponível no mapa.';
        }

        alert(message);
    }

    /* =====================================================
       9. OBTÉM A POSIÇÃO ATUAL DO CLIENTE
       -----------------------------------------------------
       getCurrentPosition() solicita uma leitura única. O
       navegador pode apresentar uma confirmação de permissão;
       a posição só será desenhada após o retorno de sucesso.
       ===================================================== */

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const clientLocation = [
                position.coords.latitude,
                position.coords.longitude
            ];

            /* =============================================
               10. CALCULA E FORMATA A DISTÂNCIA
               ---------------------------------------------
               map.distance() retorna a distância geodésica
               aproximada em metros entre os dois pontos.
               ============================================= */

            const distanceInMeters = map.distance(
                etecExtensaoLocation,
                clientLocation
            );
            const formattedDistance = distanceInMeters >= 1000
                ? `${(distanceInMeters / 1000).toFixed(2)} km`
                : `${Math.round(distanceInMeters)} m`;

            /* =============================================
               11. MARCADOR VISUAL DA POSIÇÃO DO CLIENTE
               ---------------------------------------------
               O círculo azul com contorno branco se diferencia
               do marcador padrão da ETEC.
               ============================================= */

            L.circleMarker(clientLocation, {
                radius: 9,
                color: '#ffffff',
                weight: 3,
                fillColor: '#1687e8',
                fillOpacity: 1
            })
                .addTo(map)
                .bindPopup(
                    `<strong>Sua localização</strong><br>Distância até a ETEC: ${formattedDistance}`
                );

            /* =============================================
               12. DESENHA A CONEXÃO ENTRE OS LOCAIS
               ---------------------------------------------
               A linha tracejada evidencia a relação espacial
               entre o cliente e a unidade da ETEC.
               ============================================= */

            L.polyline(
                [clientLocation, etecExtensaoLocation],
                {
                    color: '#1687e8',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '8, 8'
                }
            ).addTo(map);

            /* =============================================
               13. ENQUADRA OS DOIS PONTOS NO MAPA
               ---------------------------------------------
               O padding mantém os marcadores afastados das
               bordas, enquanto maxZoom evita uma aproximação
               excessiva quando os pontos estão muito próximos.
               ============================================= */

            map.fitBounds(
                L.latLngBounds(etecExtensaoLocation, clientLocation),
                {
                    padding: [40, 40],
                    maxZoom: 17
                }
            );
        },
        handleGeolocationError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );

    /* =====================================================
       14. ATUALIZA AS DIMENSÕES DO MAPA
       -----------------------------------------------------
       O recálculo após a renderização inicial evita problemas
       de tiles quando o container é exibido ou dimensionado.
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