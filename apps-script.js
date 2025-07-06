// Google Apps Script 代碼
// 請將此代碼複製到 Google Apps Script 編輯器中

// 請在這裡填入您的 Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

// 主要的 HTTP 請求處理函數
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'search':
        return searchPlaces(e.parameter);
      case 'details':
        return getPlaceDetails(e.parameter);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({error: '無效的操作'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 搜索地點
function searchPlaces(params) {
  const { lat, lng, query, openNow } = params;
  
  if (!lat || !lng || !query) {
    return ContentService
      .createTextOutput(JSON.stringify({error: '缺少必要參數'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 構建 Google Places API 請求 URL
  const radius = 2000; // 2公里半徑
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`;
  
  if (openNow === 'true') {
    url += '&opennow=true';
  }

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.status === 'OK') {
      // 限制結果數量並添加距離計算
      const results = data.results.slice(0, 20).map(place => {
        const distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          place.geometry.location.lat, 
          place.geometry.location.lng
        );
        
        return {
          place_id: place.place_id,
          name: place.name,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          geometry: place.geometry,
          formatted_address: place.formatted_address,
          distance: distance
        };
      });
      
      return ContentService
        .createTextOutput(JSON.stringify({status: 'OK', results: results}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({status: data.status, error: data.error_message || '搜索失敗'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: '搜索請求失敗: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取地點詳情
function getPlaceDetails(params) {
  const { placeId } = params;
  
  if (!placeId) {
    return ContentService
      .createTextOutput(JSON.stringify({error: '缺少地點ID'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,reviews';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.status === 'OK') {
      // 處理照片 URL
      if (data.result.photos) {
        data.result.photos = data.result.photos.map(photo => ({
          photo_reference: photo.photo_reference,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=300&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        }));
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({status: 'OK', result: data.result}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({status: data.status, error: data.error_message || '獲取詳情失敗'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: '詳情請求失敗: ' + error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 計算兩點間距離（公尺）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半徑（公尺）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// 測試函數（可選）
function testSearchPlaces() {
  const params = {
    lat: '25.0330',
    lng: '121.5654',
    query: '餐廳',
    openNow: 'false'
  };
  const result = searchPlaces(params);
  console.log(result.getContent());
}

function testGetPlaceDetails() {
  const params = {
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' // 示例 place_id
  };
  const result = getPlaceDetails(params);
  console.log(result.getContent());
} 