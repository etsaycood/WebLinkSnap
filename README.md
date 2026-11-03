# 📎 WebLinkSnap

**WebLinkSnap** 是一個完全免 Token / API Key 的純前端網址整理與 Obsidian 轉換工具，可直接透過 GitHub Pages 使用。
🔗 線上展示網址：https://etsaycood.github.io/WebLinkSnap/

## ✨ 核心功能

1. **🧹 自動去除網址追蹤碼**：
   - 自動清除 `utm_*`、`fbclid`、`gclid`、IG/Threads (`igshid`, `igsh`)、YouTube (`si`, `feature`)、X/Twitter (`s`, `t`)、Bilibili、蝦皮與 Amazon 等常見分享追蹤參數。
   - 支援從手機 App 分享文字中自動提取乾淨網址。
2. **⚡ 免 Token 快速擷取**：
   - 貼上網址即可自動取得**網站標題**与**網站簡介說明**。
   - **預設不擷取圖片**（速度最快、版面最乾淨）；需要圖片時可按需點選「網站封面 (OG)」、「網頁實時截圖」或「WP 備援截圖」，亦支援直接 `Ctrl + V` 貼上剪貼簿截圖。
   - 支援將圖片壓縮轉為 **Base64 純文字內嵌**，貼入 Obsidian 後永久離線可用、不破圖。
3. **🏷️ 網站分類與智慧標籤**：
   - 內建常用分類並支援自動智慧分類推測與「＋新增」自訂分類。
4. **📚 手機長條閱讀書籤庫**：
   - 針對手機單手上下滑動最佳化的長條閱讀清單。
   - 支援依**分類篩選**與**關鍵字即時搜尋**（同時搜尋標題、網站說明、分類與網址）。
   - 支援 JSON 備份匯出/匯入，以及整批匯出為 Obsidian Markdown 總表。

