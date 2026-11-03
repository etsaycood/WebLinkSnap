# 📎 WebLinkSnap — 網址去追蹤、分類書籤庫與 Obsidian 轉換器

👉 **線上立即使用 (GitHub Pages)**：**https://etsaycood.github.io/WebLinkSnap/**

**WebLinkSnap** 是一個**完全免 Token / API Key、免註冊**的純前端網址整理、去追蹤、分類書籤庫與 Obsidian Markdown 轉換工具。支援手機長條垂直閱讀，並內建多重雲端暫存分享機制（防單點故障）。

---

## ✨ 核心功能

### 1. 🧹 自動去除網址追蹤參數 (URL Tracking Cleaner)
貼上網址（或從手機 App 直接複製帶有介紹文字的分享內容）時，會自動提取純網址並清除常見追蹤碼：
- **通用行銷與分析追蹤**：`utm_*`、`fbclid`、`gclid`、`dclid`、`msclkid`、`_ga`、`_gl`、`mc_cid` 等。
- **社群平台追蹤**：Instagram / Threads (`igshid`, `igsh`)、X / Twitter (`s`, `t`)、Reddit (`rdt`, `share_id`)。
- **影音平台追蹤**：YouTube / Spotify (`si`, `feature`, `pp`, `ab_channel`)、Bilibili (`spm_id_from`, `vd_source`, `share_*`)。
- **電商平台追蹤**：蝦皮 (`sp_atk`, `xptdk`)、淘寶 (`spm`, `scm`)、Amazon（移除 `/ref=...` 路徑與搜尋追蹤碼）。

---

### 2. ⚡ 免金鑰快速擷取網站資訊 ＆ 按需載圖
- **預設不擷取圖片（極速純文字模式）**：貼上網址後約 0.5 秒內自動取得**網站標題 (`title`)** 與 **網站簡介 (`description`)**。
- **需要時再點選載入圖片**：
  - 🖼️ **網站封面 (OG Image)**：抓取網站原生的高畫質社群預覽圖。
  - 🖥️ **擷取網頁截圖**：透過免費 Microlink API 即時拍攝網頁畫面。
  - ⚡ **WP 備援截圖**：透過 WordPress mShots 免費無限額度截圖服務。
  - 📋 **手動貼上截圖 (`Ctrl + V`)**：遇到需登入的私人網站，可自行截圖後直接按 `Ctrl + V` 貼入網頁。
- **📦 Base64 純文字圖片內嵌**：透過 HTML5 Canvas 自動將圖片壓縮為輕量 WebP Base64 字串，直接將圖片變成文字貼進 Obsidian，**永久離線可用、永不破圖**。

---

### 3. 📝 一鍵複製 Obsidian Markdown
- **預設輸出「標準 Markdown」**，並支援切換多種排版格式：
  1. **📝 標準 Markdown（預設）**：標題連結 ＋ 分類標籤 (`#分類`) ＋ 網址 ＋ 網站說明 ＋ 記錄時間（若有選圖片則自動附上圖片）。
  2. **📱 手機精簡條列**：適合手機快速瀏覽的緊湊清單。
  3. **🗂️ Obsidian 卡片區塊 (Callout)**：使用 `> [!bookmark]` 摺疊卡片語法。
  4. **🧹 乾淨參考連結式 (Reference Link)**：將長串 Base64 圖片編碼收納在筆記最底部（`[shot-xxx]: data:image/...`），在編輯模式時保持內文乾淨。
- 支援 **「📋 一鍵複製 Markdown」** 與 **「💎 傳送到 Obsidian (`obsidian://new`)」**。

---

### 4. 📚 分類書籤庫（支援手機垂直長條閱讀 ＆ 即時搜尋）
- **智慧分類 ＋ 自訂分類**：內建常用分類（`AI 工具`、`程式開發`、`工作資源`、`設計靈感`、`學習筆記`、`日常實用`），會根據網址與標題自動推測分類，亦可點擊 **「＋新增」** 建立自訂分類。
- **即時關鍵字搜尋**：可同時針對 **網站名稱、網站說明/筆記、分類名稱、網址** 進行即時檢索。
- **手機長條閱讀流（預設）**：針對手機單手上下滑動最佳化，分類標籤支援橫向滑動；在桌機上亦可一鍵切換為 **「🖥️ 寬版雙欄」** 與 **「🗂️ 網格檢視」**。

---

## ☁️ 雲端分享連結 (`?s=xxxx`) 與資料存放位置說明

WebLinkSnap 支援將「單筆書籤」或「目前篩選的整批書籤清單」打包產生短網址分享給他人。為避免單一免費服務故障，內建 **4 種分享通道與自動容錯備援機制**：

| 分享空間選項 | 分享網址參數格式 | 資料實際存放位置（原始檔直連） | 保存期限與特性 |
| :--- | :--- | :--- | :--- |
| **🔄 自動智慧備援（預設）** | 自動依可用空間產生 | 依序嘗試 `Pastes.dev` ➔ `dpaste` ➔ `JSONBlob` ➔ `網址內嵌` | 遇單一服務故障時自動無感切換下一個空間 |
| **⚡ Pastes.dev 雲端** | `?s=p_代號` | 檢視：`https://pastes.dev/代號`<br>原始檔：`https://api.pastes.dev/代號` | 速度最快（Cloudflare CDN），支援大容量與壓縮縮圖 |
| **📅 dpaste.com 雲端** | `?s=d_代號` | 檢視：`https://dpaste.com/代號`<br>原始檔：`https://dpaste.com/代號.txt` | **長效保存 365 天** |
| **📦 JSONBlob 雲端** | `?s=j_代號` | 原始檔：`https://jsonblob.com/api/jsonBlob/代號` | 3 天短效暫存，最大 1MB |
| **🔗 網址直接編碼內嵌** | `#share=編碼字串` | 直接壓縮編碼於網址列本身，不經任何第三方伺服器 | **永久有效**（僅包含純文字資訊，不含縮圖） |

### 接收分享連結的方式
當朋友點開 `https://etsaycood.github.io/WebLinkSnap/?s=xxxx` 時：
1. 網頁頂部會自動跳出 **「📬 正在檢視分享的網站書籤包」** 橫幅。
2. 可直接在畫面上閱讀網站說明、依分類篩選或關鍵字搜尋。
3. 點擊 **「📥 全部收進我的書籤庫」** 即可一鍵匯入自己的瀏覽器書籤庫中。

---

## 💾 本機資料儲存位置與備份方式

1. **瀏覽器本機儲存 (`localStorage`)**：
   - 您日常新增的書籤預設儲存在您自己設備的瀏覽器 `localStorage`（鍵值為 `weblink_obsidian_bookmarks_v2` 與 `weblink_obsidian_categories`），**不會自動公開上傳，保障個人隱私**。
   - 可在瀏覽器按 `F12` ➔ `Application` ➔ `Local Storage` 直接檢視原始內容。
   - Windows 底層資料庫目錄：
     - **Chrome**：`%LocalAppData%\Google\Chrome\User Data\Default\Local Storage\leveldb`
     - **Edge**：`%LocalAppData%\Microsoft\Edge\User Data\Default\Local Storage\leveldb`
2. **實體 JSON 備份匯出 / 匯入**：
   - 點擊書籤庫右上角的 **「📤 備份」**，即可將所有分類、書籤與縮圖下載為獨立的 `weblinksnap-bookmarks-YYYY-MM-DD.json` 實體檔案保存於電腦或私人雲端硬碟。
   - 點擊 **「📥 匯入」** 即可隨時從 `.json` 備份檔完整還原。

---

## 🛠️ 專案檔案結構
- `index.html`：主頁面結構與響應式介面
- `style.css`：Obsidian 深色主題風格、手機長條閱讀流與雙欄切換樣式
- `app.js`：網址去追蹤引擎、免金鑰資訊擷取、Canvas WebP Base64 壓縮、書籤管理與多雲端分享系統
