// Script principal para Proyecto Hiparco 24

(function() {
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        whatsappNumber: "51943373206", // ✅ Número actualizado
        whatsappMessage: "¡Hola! Me interesa el ciclo intensivo Proyecto Hiparco.",
        
        // ===== CONFIGURACIÓN DE YOUTUBE =====
        youtubeApiKey: "AIzaSyAkbRd29yCAXeLrh9fflAfxDQX-FQ01LAQ", // ✅ Tu API Key
        channelId: "UChFS-gNiEcjLjXSg0Fl-TUQ", // ✅ Channel ID de Proyecto Hiparco
        maxResults: 10 // Pedimos 10 para luego filtrar
    };

    // ===== FUNCIONES DE YOUTUBE =====
    async function fetchYouTubeVideos() {
    try {
        console.log("🔍 Buscando videos del canal...");
        
        // 1. Primero obtener SOLO VIDEOS del canal (no playlists)
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtubeApiKey}&channelId=${CONFIG.channelId}&part=snippet&order=date&maxResults=${CONFIG.maxResults}&type=video`;
        
        console.log("📡 URL de búsqueda:", searchUrl.replace(CONFIG.youtubeApiKey, "API_KEY_OCULTA"));
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`Error de API: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        console.log("📦 Datos recibidos:", searchData);
        
        if (!searchData.items || searchData.items.length === 0) {
            console.log("⚠️ No se encontraron videos");
            return [];
        }

        // 2. Obtener los IDs de los videos
        const videoIds = searchData.items
            .filter(item => item.id.kind === "youtube#video") // Asegurar que son videos
            .map(item => item.id.videoId)
            .join(',');
        
        console.log("🎬 Video IDs encontrados:", videoIds);

        if (!videoIds) {
            return [];
        }

        // 3. Obtener estadísticas (vistas) de los videos
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${CONFIG.youtubeApiKey}&id=${videoIds}&part=statistics,snippet`;
        
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();
        
        console.log("📊 Estadísticas recibidas:", statsData);

        // 4. Combinar la información
        const videos = statsData.items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            views: parseInt(item.statistics.viewCount),
            publishedAt: new Date(item.snippet.publishedAt),
            channelTitle: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id}`
        }));

        console.log("✅ Videos procesados:", videos.length);
        return videos;

        } catch (error) {
            console.error("❌ Error cargando videos:", error);
            throw error;
        }
    }

    function formatViews(views) {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'k';
        }
        return views.toString();
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `Hace ${interval} ${unit}${interval > 1 ? 's' : ''}`;
            }
        }
        return 'Hace unos momentos';
    }

    function createVideoCard(video) {
        const card = document.createElement('a');
        card.href = video.url;
        card.target = '_blank';
        card.className = 'video-card';
        
        card.innerHTML = `
            <div class="video-thumb">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="video-info">
                <h4>${video.title}</h4>
                <div class="video-meta">
                    <span><i class="fas fa-eye"></i> ${formatViews(video.views)} vistas</span>
                    <span><i class="fas fa-clock"></i> ${timeAgo(video.publishedAt)}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    async function loadVideos() {
        const recientesContainer = document.getElementById('recientes-container');
        const popularesContainer = document.getElementById('populares-container');
        
        try {
            // Mostrar loading
            recientesContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando videos...</div>';
            popularesContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando videos...</div>';
            
            // Obtener videos
            const videos = await fetchYouTubeVideos();
            
            // Ordenar: más recientes primero
            const recientes = [...videos]
                .sort((a, b) => b.publishedAt - a.publishedAt)
                .slice(0, 3);
            
            // Ordenar: más vistos primero
            const populares = [...videos]
                .sort((a, b) => b.views - a.views)
                .slice(0, 3);
            
            // Renderizar recientes
            recientesContainer.innerHTML = '';
            recientes.forEach(video => {
                recientesContainer.appendChild(createVideoCard(video));
            });
            
            // Renderizar populares
            popularesContainer.innerHTML = '';
            populares.forEach(video => {
                popularesContainer.appendChild(createVideoCard(video));
            });
            
        } catch (error) {
            const errorHtml = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar videos</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">
                        <i class="fas fa-sync-alt"></i> Reintentar
                    </button>
                </div>
            `;
            
            if (recientesContainer) recientesContainer.innerHTML = errorHtml;
            if (popularesContainer) popularesContainer.innerHTML = errorHtml;
        }
    }

    // ===== FUNCIONES DE WHATSAPP =====
    function openWhatsApp() {
        const phoneNumber = CONFIG.whatsappNumber;
        const message = encodeURIComponent(CONFIG.whatsappMessage);
        
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        console.log("📱 Abriendo WhatsApp con número:", phoneNumber);
    }

    // ===== INICIALIZACIÓN =====
    function initEventListeners() {
        // Botones de WhatsApp
        const contactBtn = document.getElementById('contactBtn');
        const pricingBtn = document.getElementById('pricingContactBtn');
        
        if (contactBtn) {
            contactBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openWhatsApp();
            });
        }

        if (pricingBtn) {
            pricingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openWhatsApp();
            });
        }

        // Tabs de videos
        const tabRecientes = document.getElementById('tab-recientes');
        const tabPopulares = document.getElementById('tab-populares');
        const recientesContainer = document.getElementById('recientes-container');
        const popularesContainer = document.getElementById('populares-container');

        if (tabRecientes && tabPopulares) {
            tabRecientes.addEventListener('click', () => {
                tabRecientes.classList.add('active');
                tabPopulares.classList.remove('active');
                recientesContainer.classList.add('active');
                popularesContainer.classList.remove('active');
            });

            tabPopulares.addEventListener('click', () => {
                tabPopulares.classList.add('active');
                tabRecientes.classList.remove('active');
                popularesContainer.classList.add('active');
                recientesContainer.classList.remove('active');
            });
        }
    }

    function initEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.info-card, .course-item, .video-card, .pricing-card').forEach(el => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            }
        });
    }

    // ===== INICIAR TODO =====
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Proyecto Hiparco 24 - Página cargada');
        console.log('📱 WhatsApp configurado:', CONFIG.whatsappNumber);
        console.log('🎬 YouTube API Key configurada');
        console.log('📺 Channel ID:', CONFIG.channelId);
        
        initEventListeners();
        initEffects();
        loadVideos(); // Cargar videos de YouTube automáticamente
    });

    // Exponer funciones globalmente
    window.ProyectoHiparco = {
        openWhatsApp: openWhatsApp,
        refreshVideos: loadVideos,
        config: CONFIG
    };

})();

