# 今天吃什麼？

這是一個簡單的網頁應用程式，旨在幫助您決定今天要去哪裡用餐或喝飲料。它利用 Google Maps Places API 搜尋您當前位置附近的店家，並提供篩選和隨機選擇功能。

## 功能特色

*   **智能搜尋**：根據您的即時位置和自訂半徑，搜尋附近的餐廳、飲料店、咖啡廳或酒吧。
*   **營業中篩選**：自動過濾並僅顯示目前營業中的店家。
*   **距離顯示**：在搜尋結果中顯示每個店家與您的直線距離。
*   **隨機選擇**：如果您有選擇困難，可以使用「骰子」按鈕，讓應用程式為您隨機挑選一家店！
*   **詳細地圖資訊**：點擊任何店家卡片，即可在新分頁中直接開啟該店家的 Google Maps 頁面，查看詳細資訊和導航。
*   **API 金鑰管理**：支援在設定頁面中儲存您的 Google Maps API 金鑰，方便下次使用。

## 如何設定與執行

1.  **複製專案**：
    ```bash
    git clone <專案的 Git 儲存庫網址>
    cd WhatToEat
    ```

2.  **開啟 `index.html`**：
    這是一個靜態網頁應用程式。您只需使用任何現代瀏覽器直接開啟 `index.html` 檔案即可運行。

3.  **設定 Google Maps API 金鑰**：
    *   首次開啟應用程式時，會自動導向到設定頁面。
    *   在「Google Maps API 金鑰」欄位中輸入您的金鑰。
    *   調整「搜尋半徑」和「店家類型」等設定。
    *   點擊「儲存並搜尋」按鈕。

## 取得 Google Maps API 金鑰

1.  前往 [Google Cloud Console](https://console.cloud.google.com/) 並登入您的 Google 帳戶。
2.  建立一個新專案（如果尚未建立）。
3.  啟用以下 API 服務：
    *   **Maps JavaScript API**
    *   **Places API**
4.  導航到「API 和服務」>「憑證」頁面。
5.  點擊「建立憑證」>「API 金鑰」。
6.  **重要**：為了安全性，請限制您的 API 金鑰。建議將其限制為僅允許您的網域（如果您將其部署到伺服器）或僅允許 `http://localhost` 和 `file://` 協議（如果您是在本地開發）。
7.  複製您的 API 金鑰，並將其貼入應用程式的設定頁面中。

## 使用技術

*   HTML5
*   CSS3
*   JavaScript
*   Google Maps JavaScript API (包含 Places Library 和 Geometry Library)

## 授權

[選擇您的授權，例如 MIT 或 Apache 2.0] 