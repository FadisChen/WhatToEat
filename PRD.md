#PRD文件

## 介面描述
- 主要介面
- 設定介面
- 列表介面
- 詳細介面

- 請規劃一個純前端網頁APP，開啟時會取得使用者GPS座標，並提供google map可讓使用者瀏覽操作決定搜尋點。
### 設定 emoji按鈕
- 點擊後彈出視窗可輸入google map apikey、設定距離範圍slider(100公尺~1000公尺)，設定搜尋目標checkbox(cafe, restaurant,bar,coffee_shop) 可參考 #https://developers.google.com/maps/documentation/places/web-service/place-types?hl=zh-tw#table-a

### 搜尋 emoji按鈕
- 點擊後彈出視窗，根據gps或使用者在地圖上釘選的座標，透過google map api 列出附近的標的，參數需參考設定的項目。將結果以卡片樣式排列，點擊後可察看標的的詳細資訊。
並在卡片列表的右下方出現"隨便"按鈕

#### "隨便"按鈕
- 只有出現在卡片列表時，在關閉列表或呈現詳細資訊時需隱藏
- 點擊後，會以紅框動態在卡片選項中移動，由快到慢，停止時須出現閃爍特效

