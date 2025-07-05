document.addEventListener('DOMContentLoaded', () => {
    // Views
    const glassContainer = document.querySelector('.glass-container');
    const handleBar = document.querySelector('.handle-bar-container');
    const settingsView = document.getElementById('settings-view');
    const resultsView = document.getElementById('results-view');
    const views = [settingsView, resultsView];

    // Buttons
    const settingsBtn = document.getElementById('settings-btn');
    const searchBtn = document.getElementById('search-btn');
    const randomBtn = document.getElementById('random-btn');
    const saveAndSearchBtn = document.getElementById('save-and-search-btn');
    const backFromSettingsBtn = document.getElementById('back-from-settings-btn');
    const backFromResultsBtn = document.getElementById('back-from-results-btn');

    // Form Elements & Containers
    const apiKeyInput = document.getElementById('api-key');
    const radiusSlider = document.getElementById('radius');
    const radiusValue = document.getElementById('radius-value');
    const openNowCheckbox = document.getElementById('open-now');
    const resultsContainer = document.getElementById('results-container');
    const googleMapsScript = document.getElementById('google-maps-script');
    
    let map, marker, service;
    let currentResults = [];
    let lastView = null; // To track the view before settings

    // --- View Management ---
    function showView(viewToShow) {
        lastView = document.querySelector('.view.active');

        if (viewToShow) {
            glassContainer.classList.add('is-visible');
            views.forEach(view => {
                view.classList.remove('active');
            });
            viewToShow.classList.add('active');
        } else {
            glassContainer.classList.remove('is-visible');
        }
        
        const apiKeyExists = !!localStorage.getItem('googleMapsApiKey');
        const isSettings = viewToShow === settingsView;
        const isResults = viewToShow === resultsView;

        // Control FAB visibility
        settingsBtn.style.display = isSettings || isResults ? 'none' : 'flex';
        searchBtn.style.display = isSettings || !apiKeyExists || isResults ? 'none' : 'flex';
        randomBtn.style.display = (viewToShow === resultsView && currentResults.length > 0) ? 'block' : 'none';
    }

    // --- Event Listeners ---
    settingsBtn.addEventListener('click', () => showView(settingsView));

    searchBtn.addEventListener('click', () => {
        showView(resultsView);
        search();
    });

    saveAndSearchBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            alert('請輸入您的 Google Maps API 金鑰');
            return;
        }
        localStorage.setItem('googleMapsApiKey', apiKey);
        localStorage.setItem('searchRadius', radiusSlider.value);
        localStorage.setItem('openNow', openNowCheckbox.checked);
        const placeTypes = Array.from(document.querySelectorAll('input[name="place-type"]:checked')).map(cb => cb.value);
        localStorage.setItem('placeTypes', JSON.stringify(placeTypes));

        showView(null);
        if (!map) {
            loadGoogleMap(); // Will search after init
        }
    });

    backFromSettingsBtn.addEventListener('click', () => {
        // Go back to the view that was active before settings, or default to map view
        showView(null); // Always go back to map view
    });

    backFromResultsBtn.addEventListener('click', () => {
        showView(null);
        resultsContainer.style.padding = ""; // Reset padding
    });

    radiusSlider.addEventListener('input', () => radiusValue.textContent = radiusSlider.value);

    // --- Settings Persistence ---
    function loadSettings() {
        const savedApiKey = localStorage.getItem('googleMapsApiKey');
        const savedRadius = localStorage.getItem('searchRadius');
        const savedPlaceTypes = JSON.parse(localStorage.getItem('placeTypes'));

        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
            loadGoogleMap();
            showView(null); // Show map only if API key exists
        } else {
            showView(settingsView); // Show settings if no API key
        }

        if (savedRadius) {
            radiusSlider.value = savedRadius;
            radiusValue.textContent = savedRadius;
        }
        if (savedPlaceTypes) {
            document.querySelectorAll('input[name="place-type"]').forEach(cb => cb.checked = false);
            savedPlaceTypes.forEach(type => {
                const checkbox = document.querySelector(`input[name="place-type"][value="${type}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    // --- Google Maps Integration ---
    function loadGoogleMap() {
        const apiKey = localStorage.getItem('googleMapsApiKey');
        if (googleMapsScript.src || !apiKey) return; 

        googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        googleMapsScript.onload = initMap;
    }
    
    function initMap() {
        if (!navigator.geolocation) {
            alert('您的瀏覽器不支援地理位置定位');
            return;
        }
        navigator.geolocation.getCurrentPosition(position => {
            const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            map = new google.maps.Map(document.getElementById('map'), {
                center: userLocation,
                zoom: 15,
                disableDefaultUI: true,
                gestureHandling: 'greedy'
            });
            marker = new google.maps.Marker({ position: userLocation, map: map, draggable: true });
            map.addListener('click', (e) => marker.setPosition(e.latLng));
            service = new google.maps.places.PlacesService(map);
            
            // If user just saved settings and is now initializing, run a search
            if (document.querySelector('.view.active')?.id === 'results-view') {
                search();
            }
        }, () => {
            alert('無法獲取您的位置。請允許位置存取權限。');
        });
    }

    // --- Search & Display Logic ---
    function search() {
        if (!service || !marker) {
            if (!map && localStorage.getItem('googleMapsApiKey')) {
                loadGoogleMap();
                return;
            }
            alert('地圖尚未初始化，請稍候...');
            return;
        }
        
        const placeTypes = JSON.parse(localStorage.getItem('placeTypes') || '["餐廳"]');
        if (placeTypes.length === 0) {
            resultsContainer.innerHTML = '<p>請在設定中至少選擇一種店家類型。</p>';
            currentResults = [];
            showView(resultsView);
            return;
        }

        const center = marker.getPosition();
        const radius = parseInt(localStorage.getItem('searchRadius') || '1000', 10);
        const circle = new google.maps.Circle({ center: center, radius: radius });
        const openNow = localStorage.getItem('open-now');
        const request = {
            query: placeTypes.join(' '),
            bounds: circle.getBounds(),
            openNow: openNow
        };

        service.textSearch(request, (results, status) => {
            resultsContainer.innerHTML = ''; // Clear previous results
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                currentResults = results.slice(0, 20);
                displayResults(currentResults);
            } else {
                resultsContainer.innerHTML = '<p>找不到符合條件的店家。</p>';
                currentResults = [];
            }
            showView(resultsView);
        });
    }

    function displayResults(results) {
        resultsContainer.innerHTML = '';
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>找不到正在營業的店家。</p>';
            return;
        }
        const origin = marker.getPosition();
        results.forEach(place => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const distance = google.maps.geometry.spherical.computeDistanceBetween(origin, place.geometry.location);
            const distanceText = distance < 1000 ? `${Math.round(distance)} 公尺` : `${(distance / 1000).toFixed(1)} 公里`;

            card.innerHTML = `
                <h3>${place.name}</h3>
                <p>⭐ ${place.rating || '無評分'} (${place.user_ratings_total || 0} 則評論)</p>
                <p>📍 ${distanceText}</p>
            `;
            card.addEventListener('click', () => {
                const query = encodeURIComponent(`${place.name}, ${place.formatted_address}`);
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                window.open(url, '_blank');
            });
            resultsContainer.appendChild(card);
        });
    }

    // --- Randomizer ---
    randomBtn.addEventListener('click', () => {
        resultsContainer.style.padding = "20px 10px"; // Add padding for animation
        const cards = resultsContainer.querySelectorAll('.card');
        if (cards.length === 0) return;

        let intervalCount = 0;
        const totalSpins = 15 + Math.floor(Math.random() * 15);

        const interval = setInterval(() => {
            cards.forEach(card => card.classList.remove('selected'));
            
            const currentIndex = intervalCount % cards.length;
            const currentCard = cards[currentIndex];
            currentCard.classList.add('selected');
            currentCard.scrollIntoView({ behavior: 'instant', block: 'center' });
            
            intervalCount++;

            if (intervalCount > totalSpins) {
                clearInterval(interval);
                
                const finalIndex = Math.floor(Math.random() * cards.length);
                cards.forEach(card => card.classList.remove('selected'));
                const finalCard = cards[finalIndex];
                finalCard.scrollIntoView({ behavior: 'instant', block: 'center' });
                
                let blinkCount = 0;
                const blinkInterval = setInterval(() => {
                    finalCard.classList.toggle('selected');
                    blinkCount++;
                    if (blinkCount >= 6) {
                        clearInterval(blinkInterval);
                        finalCard.classList.add('selected');
                        finalCard.scrollIntoView({ behavior: 'instant', block: 'center' });
                    }
                }, 200);
            }
        }, 100);
    });

    // --- Initial Load ---
    loadSettings();
});
