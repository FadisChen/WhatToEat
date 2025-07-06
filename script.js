document.addEventListener('DOMContentLoaded', () => {
    const appsScriptUrl = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
    // Views
    const glassContainer = document.querySelector('.glass-container');
    const handleBar = document.querySelector('.handle-bar-container');
    const settingsView = document.getElementById('settings-view');
    const resultsView = document.getElementById('results-view');
    const detailsView = document.getElementById('details-view');
    const views = [settingsView, resultsView, detailsView];

    // Buttons
    const settingsBtn = document.getElementById('settings-btn');
    const searchBtn = document.getElementById('search-btn');
    const randomBtn = document.getElementById('random-btn');
    const saveAndSearchBtn = document.getElementById('save-and-search-btn');
    const backFromSettingsBtn = document.getElementById('back-from-settings-btn');
    const backFromResultsBtn = document.getElementById('back-from-results-btn');
    const backFromDetailsBtn = document.getElementById('back-from-details-btn');
    const customPlaceType = document.getElementById('custom-place-type');
    // Form Elements & Containers
    const openNowCheckbox = document.getElementById('open-now');
    const resultsContainer = document.getElementById('results-container');
    const detailsContent = document.getElementById('details-content');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    let map, marker;
    let currentResults = [];
    let currentPlace = null;
    let lastView = null;
    let userLocation = null;

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
        
        const isSettings = viewToShow === settingsView;
        const isResults = viewToShow === resultsView;
        const isDetails = viewToShow === detailsView;

        // Control FAB visibility
        settingsBtn.style.display = (isSettings || isResults || isDetails) ? 'none' : 'flex';
        searchBtn.style.display = (isSettings || isResults || isDetails) ? 'none' : 'flex';
    }

    // --- Event Listeners ---
    settingsBtn.addEventListener('click', () => showView(settingsView));

    searchBtn.addEventListener('click', () => {
        showView(resultsView);
        search();
    });

    saveAndSearchBtn.addEventListener('click', () => {               
        localStorage.setItem('openNow', openNowCheckbox.checked);
        let placeTypes = Array.from(document.querySelectorAll('input[name="place-type"]:checked')).map(cb => cb.value);
        
        if (customPlaceType.value && placeTypes.includes('自定義')) {
            placeTypes.push(customPlaceType.value);
        }
        localStorage.setItem('placeTypes', JSON.stringify(placeTypes));

        showView(null);
        if (!map) {
            initMap();
        }
    });

    customPlaceType.addEventListener('focus', () => {
        document.querySelector('input[name="place-type"][value="自定義"]').checked = true;
    });

    backFromSettingsBtn.addEventListener('click', () => {
        showView(null);
        randomBtn.style.display = 'none'; // 隱藏骰子按鈕
    });

    backFromResultsBtn.addEventListener('click', () => {
        showView(null);
        resultsContainer.style.padding = "";
        randomBtn.style.display = 'none'; // 隱藏骰子按鈕
    });

    backFromDetailsBtn.addEventListener('click', () => {
        showView(resultsView);
    });

    // --- Settings Persistence ---
    function loadSettings() {
        const savedPlaceTypes = JSON.parse(localStorage.getItem('placeTypes'));
        const savedOpenNow = localStorage.getItem('openNow') === 'true';

        initMap();
        showView(null);
        
        if (savedOpenNow) {
            openNowCheckbox.checked = savedOpenNow;
        }

        if (savedPlaceTypes) {
            document.querySelectorAll('input[name="place-type"]').forEach(cb => cb.checked = false);
            savedPlaceTypes.forEach(type => {
                const checkbox = document.querySelector(`input[name="place-type"][value="${type}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    // --- Leaflet Map Integration ---
    function initMap() {
        if (!navigator.geolocation) {
            alert('您的瀏覽器不支援地理位置定位');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            
            // 初始化 Leaflet 地圖
            map = L.map('map').setView([userLocation.lat, userLocation.lng], 15);
            
            // 添加地圖圖層 (使用 OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // 添加可拖拽的標記
            marker = L.marker([userLocation.lat, userLocation.lng], {
                draggable: true
            }).addTo(map);
            
            // 監聽地圖點擊事件
            map.on('click', (e) => {
                marker.setLatLng(e.latlng);
            });
            
            // 如果用戶剛保存設定，執行搜索
            if (document.querySelector('.view.active')?.id === 'results-view') {
                search();
            }
        }, () => {
            alert('無法獲取您的位置。請允許位置存取權限。');
        });
    }

    // --- Search & Display Logic ---
    async function search() {
        if (!marker) {
            if (!map) {
                initMap();
                return;
            }
            alert('地圖尚未初始化，請稍候...');
            return;
        }
        
        showLoading();
        
        const placeTypes = JSON.parse(localStorage.getItem('placeTypes') || '["餐廳"]');
        if (placeTypes.length === 0) {
            resultsContainer.innerHTML = '<p>請在設定中至少選擇一種店家類型。</p>';
            currentResults = [];
            randomBtn.style.display = 'none'; // 隱藏骰子按鈕
            hideLoading();
            showView(resultsView);
            return;
        }

        const markerPos = marker.getLatLng();
        const openNow = localStorage.getItem('openNow') === 'true';
        
        const params = new URLSearchParams({
            action: 'search',
            lat: markerPos.lat.toString(),
            lng: markerPos.lng.toString(),
            query: placeTypes.join(' '),
            openNow: openNow.toString()
        });

        try {
            const response = await fetch(`${appsScriptUrl}?${params}`);
            const data = await response.json();
            
            resultsContainer.innerHTML = '';
            resultsContainer.scrollTop = 0;
            hideLoading();
            
            if (data.status === 'OK' && data.results) {
                currentResults = data.results;
                displayResults(currentResults);
                randomBtn.style.display = 'flex'; // 顯示骰子按鈕
            } else {
                resultsContainer.innerHTML = `<p>找不到符合條件的店家。${data.error ? '錯誤：' + data.error : ''}</p>`;
                currentResults = [];
                randomBtn.style.display = 'none'; // 隱藏骰子按鈕
            }
            showView(resultsView);
        } catch (error) {
            hideLoading();
            resultsContainer.innerHTML = '<p>搜索失敗，請檢查網路連接或 Apps Script URL。</p>';
            currentResults = [];
            randomBtn.style.display = 'none'; // 隱藏骰子按鈕
            showView(resultsView);
            console.error('搜索錯誤:', error);
        }
    }

    function displayResults(results) {
        resultsContainer.innerHTML = '';
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>找不到正在營業的店家。</p>';
            return;
        }
        
        results.forEach(place => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const distance = place.distance;
            const distanceText = distance < 1000 ? `${distance} 公尺` : `${(distance / 1000).toFixed(1)} 公里`;

            card.innerHTML = `
                <h3>${place.name}</h3>
                <p>⭐ ${place.rating || '無評分'} (${place.user_ratings_total || 0} 則評論)</p>
                <p>📍 ${distanceText}</p>
            `;
            card.addEventListener('click', () => {
                showPlaceDetails(place);
            });
            resultsContainer.appendChild(card);
        });
    }

    // --- Place Details ---
    async function showPlaceDetails(place) {
        showLoading();
        currentPlace = place;
        
        const params = new URLSearchParams({
            action: 'details',
            placeId: place.place_id
        });

        try {
            const response = await fetch(`${appsScriptUrl}?${params}`);
            const data = await response.json();
            
            hideLoading();
            
            if (data.status === 'OK' && data.result) {
                currentPlace = data.result;
                displayPlaceDetails(data.result);
                detailsContent.scrollTop = 0;
                showView(detailsView);
            } else {
                alert('無法載入店家詳細資訊：' + (data.error || '未知錯誤'));
            }
        } catch (error) {
            hideLoading();
            alert('載入店家詳細資訊失敗，請檢查網路連接。');
            console.error('詳情載入錯誤:', error);
        }
    }

    function displayPlaceDetails(place) {
        let photosHtml = '';
        if (place.photos && place.photos.length > 0) {
            photosHtml = `<img src="${place.photos[0].url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 15px;">`;
        }

        let openingHoursHtml = '';
        if (place.opening_hours && place.opening_hours.weekday_text) {
            openingHoursHtml = `
                <div style="margin-bottom: 15px;">
                    <strong>營業時間：</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        ${place.opening_hours.weekday_text.map(day => `<li>${day}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        let reviewsHtml = '';
        if (place.reviews && place.reviews.length > 0) {
            reviewsHtml = `
                <div style="margin-bottom: 15px;">
                    <strong>評論：</strong>
                    ${place.reviews.slice(0, 3).map(review => `
                        <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.3); border-radius: 8px;">
                            <div style="margin-bottom: 5px;">
                                <strong>${review.author_name}</strong>
                                <span style="color: #ff6b35;">★</span> ${review.rating}
                            </div>
                            <p style="margin: 0; font-size: 14px; color: #666;">${review.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        detailsContent.innerHTML = `
            ${photosHtml}
            <h3 style="margin-top: 0;">${place.name}</h3>
            <p><strong>地址：</strong>${place.formatted_address}</p>
            ${place.formatted_phone_number ? `<p><strong>電話：</strong><a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a></p>` : ''}
            ${place.website ? `<p><strong>網站：</strong><a href="${place.website}" target="_blank">${place.website}</a></p>` : ''}
            <p><strong>評分：</strong>⭐ ${place.rating || '無評分'} (${place.user_ratings_total || 0} 則評論)</p>
            ${openingHoursHtml}
            ${reviewsHtml}
            <div style="margin-top: 20px;">
                <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.formatted_address)}', '_blank')" 
                        style="width: 100%; padding: 12px; background: rgba(255,255,255,0.8); border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    在 Google 地圖中查看
                </button>
            </div>
        `;
    }

    // --- Randomizer ---
    randomBtn.addEventListener('click', () => {
        resultsContainer.style.padding = "20px 10px";
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

    // --- Utility Functions ---
    function showLoading() {
        loadingOverlay.classList.add('show');
    }

    function hideLoading() {
        loadingOverlay.classList.remove('show');
    }

    // --- Initial Load ---
    loadSettings();
});
