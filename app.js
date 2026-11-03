// WebLinkSnap - 免 Token 網址去追蹤、分類書籤庫、多雲端備援分享與 Obsidian 轉換器

const DEFAULT_CATEGORIES = [
  "未分類",
  "AI 工具",
  "程式開發",
  "工作資源",
  "設計靈感",
  "學習筆記",
  "日常實用"
];

const STORAGE_KEYS = {
  BOOKMARKS: "weblink_obsidian_bookmarks_v2",
  LEGACY_HISTORY: "weblink_obsidian_history",
  CATEGORIES: "weblink_obsidian_categories"
};

// 常見追蹤參數黑名單
const TRACKING_PARAMS_EXACT = new Set([
  "fbclid", "gclid", "gclsrc", "dclid", "msclkid", "twclid", "ttclid", "yclid",
  "wickedid", "rb_clickid", "s_kwcid", "mc_cid", "mc_eid", "mkt_tok", "vero_id",
  "oly_enc_id", "oly_anon_id", "guccounter", "guce_referrer", "guce_referrer_sig",
  "igshid", "igsh", "ref", "ref_src", "ref_url", "rdt", "share_id", "isappinstalled", "from",
  "si", "feature", "pp", "ab_channel", "spm_id_from", "vd_source",
  "share_source", "share_medium", "share_plat", "share_session_id", "share_tag", "share_times", "unique_k",
  "spm", "scm", "sp_atk", "xptdk", "mmp_pid", "uls_trackid",
  "pd_rd_r", "pd_rd_w", "pd_rd_wg", "pf_rd_p", "pf_rd_r", "pf_rd_s", "pf_rd_t", "pf_rd_i", "pf_rd_m",
  "qid", "sr", "crid", "sprefix", "dib", "dib_tag", "psc", "smid", "spLa", "linkCode", "camp", "creative", "creativeASIN"
]);

const TRACKING_PARAM_PREFIXES = [
  "utm_", "hsa_", "mtm_", "pk_", "matomo_", "_ga", "_gl", "_hs"
];

const state = {
  id: "",
  url: "",
  title: "",
  category: "未分類",
  description: "",
  capturedAt: "",
  timestamp: 0,
  sources: {
    screenshot: "",
    og: "",
    mshots: "",
    custom: ""
  },
  activeSource: "none",   // 預設不擷取圖片
  base64Data: "",
  currentImageUrl: "",
  imageMode: "base64",
  template: "standard",   // 預設為標準 Markdown
  // 書籤與版面狀態
  filterCategory: "ALL",
  searchQuery: "",
  sortBy: "newest",
  viewMode: "stream",
  categories: [],
  bookmarks: [],
  // 分享檢視模式狀態
  isViewingShared: false,
  sharedBookmarks: []
};

// DOM 元素
const layoutToggleBtn = document.getElementById("layoutToggleBtn");
const viewModeToggleBtn = document.getElementById("viewModeToggleBtn");
const sharedViewBanner = document.getElementById("sharedViewBanner");
const sharedBannerTitle = document.getElementById("sharedBannerTitle");
const sharedBannerMeta = document.getElementById("sharedBannerMeta");
const importSharedBtn = document.getElementById("importSharedBtn");
const exitSharedViewBtn = document.getElementById("exitSharedViewBtn");

const captureForm = document.getElementById("captureForm");
const urlInput = document.getElementById("urlInput");
const pasteBtn = document.getElementById("pasteBtn");
const fetchBtn = document.getElementById("fetchBtn");
const cleanUrlToggle = document.getElementById("cleanUrlToggle");
const cleanResultBadge = document.getElementById("cleanResultBadge");
const cleanUrlDisplay = document.getElementById("cleanUrlDisplay");
const copyCleanUrlBtn = document.getElementById("copyCleanUrlBtn");
const statusBar = document.getElementById("statusBar");
const statusSpinner = document.getElementById("statusSpinner");
const statusText = document.getElementById("statusText");
const resultSection = document.getElementById("resultSection");
const sourceBadge = document.getElementById("sourceBadge");
const siteTitleInput = document.getElementById("siteTitle");
const siteCategorySelect = document.getElementById("siteCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const siteDescriptionInput = document.getElementById("siteDescription");
const sourceTabs = document.getElementById("sourceTabs");
const imageExtraContainer = document.getElementById("imageExtraContainer");
const previewImg = document.getElementById("previewImg");
const imageLoadingOverlay = document.getElementById("imageLoadingOverlay");
const imageLoadingText = document.getElementById("imageLoadingText");
const imgSizeBadge = document.getElementById("imgSizeBadge");
const imgWidthSelect = document.getElementById("imgWidthSelect");
const imgQualitySelect = document.getElementById("imgQualitySelect");
const compressionControls = document.getElementById("compressionControls");
const saveBookmarkBtn = document.getElementById("saveBookmarkBtn");
const saveStatusHint = document.getElementById("saveStatusHint");
const modeBase64Card = document.getElementById("modeBase64Card");
const modeUrlCard = document.getElementById("modeUrlCard");
const templateSelect = document.getElementById("templateSelect");
const copyBtn = document.getElementById("copyBtn");
const openObsidianBtn = document.getElementById("openObsidianBtn");
const markdownOutput = document.getElementById("markdownOutput");
const charCount = document.getElementById("charCount");

// 書籤庫與分享 DOM
const totalBookmarkCount = document.getElementById("totalBookmarkCount");
const shareProviderSelect = document.getElementById("shareProviderSelect");
const shareFilteredBtn = document.getElementById("shareFilteredBtn");
const shareResultBar = document.getElementById("shareResultBar");
const shareProviderBadge = document.getElementById("shareProviderBadge");
const shareUrlOutput = document.getElementById("shareUrlOutput");
const copyShareUrlBtn = document.getElementById("copyShareUrlBtn");
const nativeShareBtn = document.getElementById("nativeShareBtn");

const bookmarkSearchInput = document.getElementById("bookmarkSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const bookmarkSortSelect = document.getElementById("bookmarkSortSelect");
const categoryFilterBar = document.getElementById("categoryFilterBar");
const bookmarkList = document.getElementById("bookmarkList");
const emptyBookmarkState = document.getElementById("emptyBookmarkState");
const emptyStateText = document.getElementById("emptyStateText");
const exportMarkdownAllBtn = document.getElementById("exportMarkdownAllBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const importJsonInput = document.getElementById("importJsonInput");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const hiddenCanvas = document.getElementById("hiddenCanvas");
const toastEl = document.getElementById("toast");

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
  loadCategories();
  loadBookmarks();
  renderCategorySelect();
  renderBookmarkLibrary();
  bindEvents();
  await checkIncomingShareLink();
});

function bindEvents() {
  // 頂部版面切換：手機長條單欄 vs 寬螢幕雙欄
  layoutToggleBtn.addEventListener("click", () => {
    const isStream = document.body.classList.toggle("mobile-stream-mode");
    layoutToggleBtn.textContent = isStream ? "🖥️ 切換寬版雙欄" : "📱 切換長條單欄";
  });

  // 書籤庫檢視切換：長條閱讀清單 vs 縮圖網格
  viewModeToggleBtn.addEventListener("click", () => {
    state.viewMode = state.viewMode === "stream" ? "grid" : "stream";
    bookmarkList.className = state.viewMode === "stream" ? "bookmark-stream" : "bookmark-grid";
    viewModeToggleBtn.textContent = state.viewMode === "stream" ? "🗂️ 切換網格檢視" : "📱 切換長條清單";
  });

  // 分享檢視模式：匯入全部 / 返回自己的書籤庫
  importSharedBtn.addEventListener("click", () => {
    if (!state.sharedBookmarks.length) return;
    let count = 0;
    state.sharedBookmarks.forEach((item) => {
      if (!item.url) return;
      if (item.category && !state.categories.includes(item.category)) {
        state.categories.push(item.category);
      }
      const idx = state.bookmarks.findIndex((b) => b.url === item.url);
      if (idx >= 0) {
        state.bookmarks[idx] = { ...state.bookmarks[idx], ...item };
      } else {
        state.bookmarks.unshift(item);
      }
      count++;
    });
    saveCategories();
    persistBookmarks();
    exitSharedMode();
    showToast(`📥 已成功將 ${count} 筆分享書籤收進您的書籤庫！`);
  });

  exitSharedViewBtn.addEventListener("click", () => {
    exitSharedMode();
  });

  // 產生目前篩選清單的雲端分享連結
  shareFilteredBtn.addEventListener("click", async () => {
    const items = getFilteredBookmarks();
    if (!items.length) {
      showToast("目前沒有可分享的書籤！");
      return;
    }
    const titleLabel =
      state.filterCategory === "ALL"
        ? `WebLinkSnap 書籤精選 (${items.length} 筆)`
        : `「${state.filterCategory}」分類書籤 (${items.length} 筆)`;
    await createAndShowShareLink(items, titleLabel);
  });

  // 複製分享連結
  copyShareUrlBtn.addEventListener("click", async () => {
    const url = shareUrlOutput.value;
    if (!url) return;
    await copyTextToClipboard(url);
    showToast("🔗 已複製分享連結！可直接貼給朋友");
  });

  // 手機/系統原生分享選單
  nativeShareBtn.addEventListener("click", async () => {
    const url = shareUrlOutput.value;
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WebLinkSnap 網站書籤分享",
          text: "這是我整理好的網站書籤清單，點開即可直接瀏覽與搜尋：",
          url
        });
      } catch {}
    } else {
      await copyTextToClipboard(url);
      showToast("🔗 已複製分享連結！");
    }
  });

  // 表單送出擷取網址
  captureForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) return;
    await processUrl(rawUrl);
  });

  // 貼上網址按鈕
  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        await processUrl(text.trim());
      }
    } catch {
      urlInput.focus();
      showStatus("請在輸入框按 Ctrl+V 貼上網址", false);
    }
  });

  // 僅複製乾淨網址按鈕
  copyCleanUrlBtn.addEventListener("click", async () => {
    const u = cleanUrlDisplay.value || state.url;
    if (!u) return;
    await copyTextToClipboard(u);
    showToast("🔗 已複製乾淨網址！");
  });

  // 網站標題、分類、說明變更時即時更新 Markdown 並同步至書籤庫
  siteTitleInput.addEventListener("input", () => {
    state.title = siteTitleInput.value;
    updateMarkdownOutput();
    autoSyncCurrentBookmark();
  });

  siteCategorySelect.addEventListener("change", () => {
    state.category = siteCategorySelect.value;
    updateMarkdownOutput();
    autoSyncCurrentBookmark();
  });

  siteDescriptionInput.addEventListener("input", () => {
    state.description = siteDescriptionInput.value;
    updateMarkdownOutput();
    autoSyncCurrentBookmark();
  });

  // 新增自訂分類
  addCategoryBtn.addEventListener("click", () => {
    const newCat = prompt("請輸入新分類名稱（例如：投資理財、影視娛樂、開源專案）：");
    if (!newCat || !newCat.trim()) return;
    const cleaned = newCat.trim();
    if (!state.categories.includes(cleaned)) {
      state.categories.push(cleaned);
      saveCategories();
    }
    state.category = cleaned;
    renderCategorySelect();
    siteCategorySelect.value = cleaned;
    updateMarkdownOutput();
    autoSyncCurrentBookmark();
    renderBookmarkLibrary();
    showToast(`已新增並套用分類「${cleaned}」`);
  });

  // 手動點擊儲存 / 更新書籤
  saveBookmarkBtn.addEventListener("click", () => {
    upsertCurrentToBookmarks();
    showToast("⭐ 已儲存更新至書籤庫！");
  });

  // 切換圖片/截圖來源
  sourceTabs.addEventListener("click", async (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    const sourceKey = btn.dataset.source;
    await selectImageSource(sourceKey);
    autoSyncCurrentBookmark();
  });

  // 調整 Base64 壓縮尺寸與畫質
  imgWidthSelect.addEventListener("change", async () => {
    await refreshBase64FromCurrentImage();
    autoSyncCurrentBookmark();
  });
  imgQualitySelect.addEventListener("change", async () => {
    await refreshBase64FromCurrentImage();
    autoSyncCurrentBookmark();
  });

  // 切換圖片保存模式
  document.querySelectorAll('input[name="imageMode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.imageMode = e.target.value;
      modeBase64Card.classList.toggle("active", state.imageMode === "base64");
      modeUrlCard.classList.toggle("active", state.imageMode === "url");
      compressionControls.style.opacity = state.imageMode === "base64" ? "1" : "0.45";
      updateMarkdownOutput();
    });
  });

  // 切換 Obsidian 模板
  templateSelect.addEventListener("change", () => {
    state.template = templateSelect.value;
    updateMarkdownOutput();
  });

  // 一鍵複製 Markdown
  copyBtn.addEventListener("click", async () => {
    const text = markdownOutput.value;
    if (!text) return;
    await copyTextToClipboard(text);
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = "✅ 已複製！現在可切到 Obsidian 貼上";
    showToast("📋 已複製 Obsidian Markdown！");
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2200);
  });

  // 傳送到 Obsidian
  openObsidianBtn.addEventListener("click", () => {
    const safeTitle = (state.title || "網站書籤").replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 60);
    const content = markdownOutput.value;
    if (content.length > 15000) {
      copyTextToClipboard(content);
      alert("由於 Base64 圖片文字較長，已自動為您複製到剪貼簿！\n開啟 Obsidian 後直接按 Ctrl+V 貼上即可。");
      window.location.href = `obsidian://new?name=${encodeURIComponent(safeTitle)}`;
    } else {
      window.location.href = `obsidian://new?name=${encodeURIComponent(safeTitle)}&content=${encodeURIComponent(content)}`;
    }
  });

  // 支援直接按 Ctrl+V 貼上自己截的圖片
  window.addEventListener("paste", async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleCustomImagePaste(file);
        }
        return;
      }
    }
  });

  // 書籤搜尋與清除
  bookmarkSearchInput.addEventListener("input", () => {
    state.searchQuery = bookmarkSearchInput.value.trim();
    clearSearchBtn.classList.toggle("hidden", !state.searchQuery);
    renderBookmarkLibrary();
  });

  clearSearchBtn.addEventListener("click", () => {
    bookmarkSearchInput.value = "";
    state.searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    renderBookmarkLibrary();
  });

  // 書籤排序
  bookmarkSortSelect.addEventListener("change", () => {
    state.sortBy = bookmarkSortSelect.value;
    renderBookmarkLibrary();
  });

  // 整批複製目前篩選的書籤清單為 Obsidian Markdown
  exportMarkdownAllBtn.addEventListener("click", async () => {
    const filtered = getFilteredBookmarks();
    if (!filtered.length) {
      showToast("目前沒有符合條件的書籤可複製");
      return;
    }
    const batchMd = generateBatchObsidianMarkdown(filtered);
    await copyTextToClipboard(batchMd);
    showToast(`📝 已將 ${filtered.length} 筆書籤整理成 Obsidian 格式並複製！`);
  });

  // 匯出 JSON 備份
  exportJsonBtn.addEventListener("click", () => {
    if (!state.bookmarks.length) {
      showToast("目前還沒有書籤可供匯出");
      return;
    }
    const payload = {
      exportedAt: formatNow(),
      categories: state.categories,
      bookmarks: state.bookmarks
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weblinksnap-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📤 已下載書籤備份檔 (.json)");
  });

  // 匯入 JSON 備份
  importJsonInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const importedList = Array.isArray(data) ? data : data.bookmarks;
        if (!Array.isArray(importedList)) throw new Error("格式不正確");

        if (Array.isArray(data.categories)) {
          data.categories.forEach((c) => {
            if (c && !state.categories.includes(c)) state.categories.push(c);
          });
        }

        importedList.forEach((item) => {
          if (!item.url) return;
          if (item.category && !state.categories.includes(item.category)) {
            state.categories.push(item.category);
          }
          const existingIdx = state.bookmarks.findIndex((b) => b.url === item.url);
          if (existingIdx >= 0) {
            state.bookmarks[existingIdx] = { ...state.bookmarks[existingIdx], ...item };
          } else {
            state.bookmarks.push(item);
          }
        });

        saveCategories();
        persistBookmarks();
        renderCategorySelect();
        renderBookmarkLibrary();
        showToast(`📥 匯入成功！共處理 ${importedList.length} 筆書籤`);
      } catch {
        alert("匯入失敗：請確認選擇的是正確的 JSON 備份檔。");
      }
      importJsonInput.value = "";
    };
    reader.readAsText(file);
  });

  // 清空所有書籤紀錄
  clearHistoryBtn.addEventListener("click", () => {
    if (!state.bookmarks.length) return;
    if (!confirm("確定要清空所有儲存的網站書籤嗎？（建議可先點「備份」）")) return;
    state.bookmarks = [];
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);
    renderBookmarkLibrary();
    showToast("🗑️ 已清空所有書籤");
  });
}

// ==================================================
// 多重雲端暫存空間分享系統 (防單一故障自動切換)
// ==================================================
const SHARE_PROVIDERS = {
  // 1. Pastes.dev (支援大檔案與縮圖，Cloudflare CDN)
  pastesdev: {
    name: "Pastes.dev 雲端",
    prefix: "p_",
    async upload(payloadObj) {
      const res = await fetch("https://api.pastes.dev/post", {
        method: "POST",
        headers: { "Content-Type": "text/json" },
        body: JSON.stringify(payloadObj)
      });
      if (!res.ok) throw new Error(`Pastes.dev HTTP ${res.status}`);
      const data = await res.json();
      if (!data.key) throw new Error("Pastes.dev 未回傳 key");
      return `p_${data.key}`;
    },
    async download(key) {
      const res = await fetch(`https://api.pastes.dev/${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("無法從 Pastes.dev 讀取分享資料");
      return await res.json();
    }
  },

  // 2. dpaste.com (支援 365 天長效保存)
  dpaste: {
    name: "dpaste (365天長效)",
    prefix: "d_",
    async upload(payloadObj) {
      const bodyParams = new URLSearchParams();
      bodyParams.set("content", JSON.stringify(payloadObj));
      bodyParams.set("syntax", "json");
      bodyParams.set("expiry_days", "365");

      const res = await fetch("https://dpaste.com/api/v2/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString()
      });
      if (!res.ok) throw new Error(`dpaste HTTP ${res.status}`);
      const textUrl = (await res.text()).trim();
      const id = textUrl.split("/").filter(Boolean).pop();
      if (!id) throw new Error("dpaste 未回傳有效 ID");
      return `d_${id}`;
    },
    async download(id) {
      const res = await fetch(`https://dpaste.com/${encodeURIComponent(id)}.txt`);
      if (!res.ok) throw new Error("無法從 dpaste 讀取分享資料");
      return await res.json();
    }
  },

  // 3. JSONBlob (3 天短效暫存)
  jsonblob: {
    name: "JSONBlob (3天暫存)",
    prefix: "j_",
    async upload(payloadObj) {
      const res = await fetch("https://jsonblob.com/api/jsonBlob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payloadObj)
      });
      if (!res.ok) throw new Error(`JSONBlob HTTP ${res.status}`);
      const loc = res.headers.get("Location") || res.headers.get("X-jsonblob") || "";
      const id = loc.split("/").filter(Boolean).pop();
      if (!id) throw new Error("JSONBlob 未回傳 ID");
      return `j_${id}`;
    },
    async download(id) {
      const res = await fetch(`https://jsonblob.com/api/jsonBlob/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("無法從 JSONBlob 讀取分享資料（可能已超過 3 天期限）");
      return await res.json();
    }
  }
};

// 產生分享連結 (支援指定空間或 auto 自動容錯切換)
async function createAndShowShareLink(items, packTitle = "WebLinkSnap 書籤分享") {
  const mode = shareProviderSelect.value || "auto";
  shareFilteredBtn.disabled = true;
  const origBtnText = shareFilteredBtn.innerHTML;
  shareFilteredBtn.innerHTML = "⏳ 正在上傳產生分享連結...";

  // 建立精簡版分享資料結構
  const payload = {
    title: packTitle,
    sharedAt: formatNow(),
    items: items.map((b) => ({
      id: b.id,
      url: b.url,
      title: b.title,
      category: b.category || "未分類",
      description: b.description || "",
      capturedAt: b.capturedAt || "",
      timestamp: b.timestamp || Date.now(),
      thumb: mode === "urlhash" ? "" : b.thumb || ""
    }))
  };

  const baseUrl = window.location.origin === "null" || window.location.protocol === "file:"
    ? "https://etsaycood.github.io/WebLinkSnap/"
    : `${window.location.origin}${window.location.pathname}`;

  try {
    if (mode === "urlhash") {
      const encoded = encodeUtf8Base64(JSON.stringify(payload));
      const shareUrl = `${baseUrl}#share=${encoded}`;
      displayGeneratedShareUrl(shareUrl, "網址內嵌 (永久有效)");
      return;
    }

    // 決定嘗試順序：若選 auto，依序嘗試 pastesdev -> dpaste -> jsonblob；若選特定空間失敗時也會自動備援！
    const order =
      mode === "auto"
        ? ["pastesdev", "dpaste", "jsonblob"]
        : [mode, ...["pastesdev", "dpaste", "jsonblob"].filter((k) => k !== mode)];

    let lastErr = null;
    for (const providerKey of order) {
      const provider = SHARE_PROVIDERS[providerKey];
      try {
        // dpaste 免費版對超大請求有限制，若選 dpaste 且含大量 Base64 縮圖超過 250KB，自動建立無縮圖輕量版
        let toSend = payload;
        if (providerKey === "dpaste" && JSON.stringify(payload).length > 240000) {
          toSend = {
            ...payload,
            items: payload.items.map((it) => ({ ...it, thumb: "" }))
          };
        }
        const code = await provider.upload(toSend);
        const shareUrl = `${baseUrl}?s=${code}`;
        const usedFallback = mode !== "auto" && providerKey !== mode;
        const label = usedFallback
          ? `已自動備援切換至：${provider.name}`
          : `存放空間：${provider.name}`;
        displayGeneratedShareUrl(shareUrl, label);
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    // 萬一所有外部 API 都無法連線，終極保底使用網址直接編碼
    const stripThumbPayload = {
      ...payload,
      items: payload.items.slice(0, 40).map((it) => ({ ...it, thumb: "" }))
    };
    const encoded = encodeUtf8Base64(JSON.stringify(stripThumbPayload));
    const shareUrl = `${baseUrl}#share=${encoded}`;
    displayGeneratedShareUrl(shareUrl, "已自動切換為網址內嵌備援");
  } finally {
    shareFilteredBtn.disabled = false;
    shareFilteredBtn.innerHTML = origBtnText;
  }
}

function displayGeneratedShareUrl(url, providerLabel) {
  shareResultBar.classList.remove("hidden");
  shareProviderBadge.textContent = providerLabel;
  shareUrlOutput.value = url;
  copyTextToClipboard(url);
  showToast(`🔗 分享連結已產生並自動複製！(${providerLabel})`);
}

// 檢查網址是否帶有 ?s=xxxx 或 #share=xxxx 分享參數
async function checkIncomingShareLink() {
  const params = new URLSearchParams(window.location.search);
  const shareCode = params.get("s");
  const hash = window.location.hash || "";

  if (!shareCode && !hash.startsWith("#share=")) return;

  showStatus("正在載入他人分享的網站書籤包...", true);

  try {
    let data = null;

    if (hash.startsWith("#share=")) {
      const raw = hash.slice("#share=".length);
      data = JSON.parse(decodeUtf8Base64(raw));
    } else if (shareCode) {
      if (shareCode.startsWith("p_")) {
        data = await SHARE_PROVIDERS.pastesdev.download(shareCode.slice(2));
      } else if (shareCode.startsWith("d_")) {
        data = await SHARE_PROVIDERS.dpaste.download(shareCode.slice(2));
      } else if (shareCode.startsWith("j_")) {
        data = await SHARE_PROVIDERS.jsonblob.download(shareCode.slice(2));
      }
    }

    if (data && Array.isArray(data.items)) {
      state.isViewingShared = true;
      state.sharedBookmarks = data.items;
      sharedViewBanner.classList.remove("hidden");
      sharedBannerTitle.textContent = `📬 ${data.title || "收到分享的網站書籤包"}`;
      sharedBannerMeta.textContent = `共 ${data.items.length} 筆網站（分享於 ${data.sharedAt || "近期"}）・您可直接瀏覽搜尋，或一鍵收進自己的書籤庫`;
      renderBookmarkLibrary();
      window.scrollTo({ top: sharedViewBanner.offsetTop - 12, behavior: "smooth" });
      showToast(`📬 已載入 ${data.items.length} 筆分享書籤！`);
    }
  } catch (err) {
    alert("無法載入此分享連結，可能該暫存連結已過期或代號不正確。");
  } finally {
    hideStatus();
  }
}

function exitSharedMode() {
  state.isViewingShared = false;
  state.sharedBookmarks = [];
  sharedViewBanner.classList.add("hidden");
  // 清除網址上的 ?s= 與 #share=
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
  renderBookmarkLibrary();
}

function encodeUtf8Base64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode("0x" + p1)));
}

function decodeUtf8Base64(b64) {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(b64), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

// ===============================
// 網址正規化與「去除追蹤參數」引擎
// ===============================
function normalizeAndCleanUrl(rawInput) {
  let text = rawInput.trim();

  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlMatch) {
    text = urlMatch[0];
  } else if (!/^https?:\/\//i.test(text)) {
    text = "https://" + text;
  }

  if (!cleanUrlToggle.checked) {
    cleanResultBadge.classList.add("hidden");
    return text;
  }

  try {
    const parsed = new URL(text);
    const removedParams = [];
    const host = parsed.hostname.toLowerCase();

    for (const key of Array.from(parsed.searchParams.keys())) {
      const lowerKey = key.toLowerCase();
      const isPrefixMatch = TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix));
      const isExactMatch = TRACKING_PARAMS_EXACT.has(lowerKey);
      const isTwitterShare = (host.includes("twitter.com") || host.includes("x.com")) && (lowerKey === "s" || lowerKey === "t");

      if (isPrefixMatch || isExactMatch || isTwitterShare) {
        parsed.searchParams.delete(key);
        removedParams.push(key);
      }
    }

    if (host.includes("amazon.") && parsed.pathname.includes("/ref=")) {
      parsed.pathname = parsed.pathname.replace(/\/ref=[^/]*$/, "");
      removedParams.push("ref");
    }

    const cleanedUrl = parsed.toString();

    if (removedParams.length > 0) {
      const previewList = removedParams.slice(0, 3).join(", ") + (removedParams.length > 3 ? "..." : "");
      cleanResultBadge.textContent = `🧹 已清除 ${removedParams.length} 個追蹤碼 (${previewList})`;
      cleanResultBadge.classList.remove("hidden");
    } else {
      cleanResultBadge.textContent = "✨ 網址乾淨無追蹤碼";
      cleanResultBadge.classList.remove("hidden");
    }

    return cleanedUrl;
  } catch {
    cleanResultBadge.classList.add("hidden");
    return text;
  }
}

// ===============================
// 分類管理與自動智慧分類推測
// ===============================
function loadCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || "null");
    if (Array.isArray(saved) && saved.length) {
      state.categories = saved;
    } else {
      state.categories = [...DEFAULT_CATEGORIES];
    }
  } catch {
    state.categories = [...DEFAULT_CATEGORIES];
  }
}

function saveCategories() {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
  } catch {}
}

function renderCategorySelect() {
  siteCategorySelect.innerHTML = "";
  state.categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    siteCategorySelect.appendChild(opt);
  });
  if (state.categories.includes(state.category)) {
    siteCategorySelect.value = state.category;
  }
}

function guessCategory(url, title = "", desc = "") {
  const text = `${url} ${title} ${desc}`.toLowerCase();
  if (/openai|chatgpt|claude|gemini|anthropic|huggingface|perplexity|midjourney|cursor|copilot|\bai\b|人工智慧|大模型/.test(text)) {
    return state.categories.includes("AI 工具") ? "AI 工具" : "未分類";
  }
  if (/github\.com|gitlab|stackoverflow|npmjs|developer\.|docs\.|api|react|vue|python|javascript|typescript|rust|docker|程式碼|開發/.test(text)) {
    return state.categories.includes("程式開發") ? "程式開發" : "未分類";
  }
  if (/figma|dribbble|behance|canva|unsplash|pinterest|color|font|ui|ux|設計|配色|素材/.test(text)) {
    return state.categories.includes("設計靈感") ? "設計靈感" : "未分類";
  }
  if (/notion|obsidian|hackmd|coursera|udemy|medium\.com|vocus|wiki|tutorial|教學|筆記|課程|學習/.test(text)) {
    return state.categories.includes("學習筆記") ? "學習筆記" : "未分類";
  }
  return "未分類";
}

// ===============================
// 擷取網站資訊（預設僅抓文字，不抓截圖，速度最快）
// ===============================
function showStatus(msg, loading = true) {
  statusBar.classList.remove("hidden");
  statusSpinner.classList.toggle("hidden", !loading);
  statusText.textContent = msg;
}

function hideStatus() {
  statusBar.classList.add("hidden");
}

async function processUrl(rawInput) {
  const targetUrl = normalizeAndCleanUrl(rawInput);
  urlInput.value = targetUrl;
  cleanUrlDisplay.value = targetUrl;

  fetchBtn.disabled = true;
  showStatus("正在快速取得網站標題與說明（已自動去除追蹤碼）...", true);

  state.id = "bm_" + Date.now();
  state.url = targetUrl;
  state.capturedAt = formatNow();
  state.timestamp = Date.now();
  state.base64Data = "";
  state.currentImageUrl = "";
  state.sources = {
    screenshot: "",
    og: "",
    mshots: `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=1200&h=675`,
    custom: ""
  };

  try {
    const microlinkEndpoint = `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(microlinkEndpoint);
    const json = await res.json();

    if (json && json.status === "success" && json.data) {
      const d = json.data;
      state.title = d.title || extractDomainName(targetUrl);
      state.description = d.description || "";
      state.sources.og = d.image?.url || d.logo?.url || "";
      sourceBadge.textContent = "免金鑰快速擷取成功";
    } else {
      throw new Error("切換備援方案");
    }
  } catch {
    showStatus("正在使用備援通道擷取網站標題與說明...", true);
    await fetchFallbackMetadata(targetUrl);
    sourceBadge.textContent = "備援通道擷取完成";
  }

  const existing = state.bookmarks.find((b) => b.url === targetUrl);
  if (existing) {
    state.id = existing.id;
    state.category = existing.category || guessCategory(targetUrl, state.title, state.description);
    if (existing.description && !state.description) {
      state.description = existing.description;
    }
  } else {
    state.category = guessCategory(targetUrl, state.title, state.description);
  }

  siteTitleInput.value = state.title;
  renderCategorySelect();
  siteCategorySelect.value = state.category;
  siteDescriptionInput.value = state.description;
  resultSection.classList.remove("hidden");

  await selectImageSource("none");
  upsertCurrentToBookmarks();

  hideStatus();
  fetchBtn.disabled = false;
  showToast("✅ 已去除追蹤碼並存入書籤！");
}

async function fetchFallbackMetadata(targetUrl) {
  state.title = extractDomainName(targetUrl);
  state.description = "";
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data && data.contents) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, "text/html");
      const titleText =
        doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
        doc.querySelector("title")?.textContent;
      if (titleText) state.title = titleText.trim();

      const descText =
        doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        doc.querySelector('meta[name="description"]')?.getAttribute("content");
      if (descText) state.description = descText.trim();

      const ogImg =
        doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
        doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");
      if (ogImg) {
        state.sources.og = new URL(ogImg, targetUrl).href;
      }
    }
  } catch {}
}

// ===============================
// 按需載入圖片與轉成 Base64
// ===============================
async function selectImageSource(sourceKey) {
  state.activeSource = sourceKey;

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.source === sourceKey);
  });

  if (sourceKey === "none") {
    state.base64Data = "";
    state.currentImageUrl = "";
    imageExtraContainer.classList.add("hidden");
    imgSizeBadge.textContent = "純文字模式（無圖片）";
    updateMarkdownOutput();
    return;
  }

  imageExtraContainer.classList.remove("hidden");

  if (sourceKey === "screenshot" && !state.sources.screenshot && state.url) {
    imageLoadingOverlay.classList.remove("hidden");
    imageLoadingText.textContent = "正在即時拍攝網頁截圖（約需 3~5 秒）...";
    imgSizeBadge.textContent = "拍攝截圖中...";
    try {
      const shotEndpoint = `https://api.microlink.io/?url=${encodeURIComponent(state.url)}&screenshot=true`;
      const res = await fetch(shotEndpoint);
      const json = await res.json();
      if (json?.status === "success" && json?.data?.screenshot?.url) {
        state.sources.screenshot = json.data.screenshot.url;
      }
    } catch {}
  }

  let chosenUrl = state.sources[sourceKey];
  if (!chosenUrl) {
    if (sourceKey === "screenshot") {
      chosenUrl = state.sources.mshots;
    } else if (sourceKey === "og") {
      chosenUrl = state.sources.screenshot || state.sources.mshots;
    }
  }

  state.currentImageUrl = chosenUrl;
  await convertImageUrlToBase64(chosenUrl);
}

async function convertImageUrlToBase64(imgUrl) {
  if (!imgUrl) return;

  imageLoadingOverlay.classList.remove("hidden");
  imageLoadingText.textContent = "正在將圖片壓縮並轉換為純文字編碼...";
  imgSizeBadge.textContent = "轉換文字編碼中...";

  const targetWidth = parseInt(imgWidthSelect.value, 10) || 640;
  const quality = parseFloat(imgQualitySelect.value) || 0.7;

  try {
    let loadedImg;
    try {
      loadedImg = await loadImageElement(imgUrl, true);
    } catch {
      const proxyImgUrl = `https://wsrv.nl/?url=${encodeURIComponent(imgUrl)}&w=${targetWidth}&output=webp`;
      loadedImg = await loadImageElement(proxyImgUrl, true);
    }

    const base64 = drawImageToBase64(loadedImg, targetWidth, quality);
    state.base64Data = base64;
    previewImg.src = base64;
    updateBase64SizeBadge(base64);
  } catch {
    const fallbackBase64 = generateFallbackCardBase64(state.title, state.url, targetWidth);
    state.base64Data = fallbackBase64;
    previewImg.src = fallbackBase64;
    updateBase64SizeBadge(fallbackBase64, "已使用自動文字卡片預覽");
  } finally {
    imageLoadingOverlay.classList.add("hidden");
    updateMarkdownOutput();
  }
}

async function refreshBase64FromCurrentImage() {
  if (state.activeSource === "none") return;
  if (state.activeSource === "custom" && state.sources.custom) {
    const img = await loadImageElement(state.sources.custom, false);
    const targetWidth = parseInt(imgWidthSelect.value, 10) || 640;
    const quality = parseFloat(imgQualitySelect.value) || 0.7;
    state.base64Data = drawImageToBase64(img, targetWidth, quality);
    previewImg.src = state.base64Data;
    updateBase64SizeBadge(state.base64Data);
    updateMarkdownOutput();
  } else if (state.currentImageUrl) {
    await convertImageUrlToBase64(state.currentImageUrl);
  }
}

async function handleCustomImagePaste(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const rawDataUrl = e.target.result;
    state.sources.custom = rawDataUrl;
    state.activeSource = "custom";

    if (!state.url) {
      state.id = "bm_" + Date.now();
      state.url = normalizeAndCleanUrl(urlInput.value.trim() || "https://");
      cleanUrlDisplay.value = state.url;
      state.title = siteTitleInput.value.trim() || "自訂截圖書籤";
      state.category = siteCategorySelect.value || "未分類";
      state.capturedAt = formatNow();
      state.timestamp = Date.now();
      siteTitleInput.value = state.title;
      resultSection.classList.remove("hidden");
    }

    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    imageExtraContainer.classList.remove("hidden");
    sourceBadge.textContent = "已套用剪貼簿貼上的截圖";

    await refreshBase64FromCurrentImage();
    upsertCurrentToBookmarks();
    showToast("🖼️ 已套用剪貼簿截圖並更新書籤！");
  };
  reader.readAsDataURL(file);
}

function loadImageElement(src, useCors = true) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) img.crossOrigin = "anonymous";
    const timer = setTimeout(() => reject(new Error("圖片載入逾時")), 12000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = (err) => {
      clearTimeout(timer);
      reject(err);
    };
    img.src = src;
  });
}

function drawImageToBase64(img, maxWidth, quality) {
  const ratio = img.height / img.width;
  const width = Math.min(img.width, maxWidth);
  const height = Math.round(width * ratio);

  hiddenCanvas.width = width;
  hiddenCanvas.height = height;

  const ctx = hiddenCanvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let dataUrl = hiddenCanvas.toDataURL("image/webp", quality);
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = hiddenCanvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

function generateFallbackCardBase64(title, url, width = 640) {
  const height = Math.round(width * 0.52);
  hiddenCanvas.width = width;
  hiddenCanvas.height = height;
  const ctx = hiddenCanvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText((title || "網站連結").slice(0, 28), 40, height / 2 - 10);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "15px monospace";
  ctx.fillText((url || "").slice(0, 52), 40, height / 2 + 28);

  return hiddenCanvas.toDataURL("image/webp", 0.8);
}

function updateBase64SizeBadge(base64, customLabel = "") {
  const kb = (base64.length / 1024).toFixed(1);
  imgSizeBadge.textContent = customLabel
    ? `${customLabel} (${kb} KB)`
    : `純文字圖片大小：約 ${kb} KB`;
}

// ===============================
// 產生給 Obsidian 的 Markdown 文字
// ===============================
function buildMarkdownForItem(item, template = state.template, imageMode = state.imageMode) {
  const title = (item.title || "未命名網站").replace(/[\[\]]/g, "");
  const url = item.url || "";
  const category = item.category || "未分類";
  const categoryTag = `#${category.replace(/\s+/g, "_")}`;
  const time = item.capturedAt || formatNow();
  const desc = item.description ? item.description.trim() : "";

  const hasImage =
    item.activeSource
      ? item.activeSource !== "none" && Boolean(item.base64Data || item.currentImageUrl)
      : Boolean(item.thumb);

  const imgValue = hasImage
    ? imageMode === "base64"
      ? item.thumb || item.base64Data || item.currentImageUrl
      : item.currentImageUrl || item.url
    : "";

  let md = "";

  if (template === "compact") {
    md += `- **[${title}](${url})** (${categoryTag})\n`;
    if (desc) md += `  - 說明：${desc.replace(/\n+/g, " ")}\n`;
    md += `  - 時間：${time}\n`;
    if (hasImage && imgValue) md += `  - ![${title}](${imgValue})\n`;
  } else if (template === "callout") {
    md += `> [!bookmark] [${title}](${url})\n`;
    md += `> - **分類**：${category} (${categoryTag})\n`;
    md += `> - **網址**：${url}\n`;
    if (desc) md += `> - **網站說明**：${desc.replace(/\n+/g, " ")}\n`;
    md += `> - **記錄時間**：${time}\n`;
    if (hasImage && imgValue) {
      md += `>\n`;
      md += `> ![${title}](${imgValue})\n`;
    }
  } else if (template === "reflink") {
    const refId = `shot-${(item.timestamp || Date.now()).toString().slice(-6)}`;
    md += `### [${title}](${url})\n`;
    md += `- **分類**：${category} (${categoryTag})\n`;
    md += `- **網址**：${url}\n`;
    if (desc) md += `- **網站說明**：${desc}\n`;
    md += `- **記錄時間**：${time}\n`;
    if (hasImage && imgValue) {
      md += `\n![${title}][${refId}]\n\n`;
      md += `[${refId}]: ${imgValue}\n`;
    }
  } else {
    md += `### [${title}](${url})\n`;
    md += `- **分類**：${category} (${categoryTag})\n`;
    md += `- **網址**：${url}\n`;
    if (desc) md += `- **網站說明**：${desc}\n`;
    md += `- **記錄時間**：${time}\n`;
    if (hasImage && imgValue) {
      md += `\n![${title}](${imgValue})\n`;
    }
  }

  return md;
}

function updateMarkdownOutput() {
  const md = buildMarkdownForItem(state, state.template, state.imageMode);
  markdownOutput.value = md;
  charCount.textContent = `共 ${md.length.toLocaleString()} 字元`;
}

function generateBatchObsidianMarkdown(items) {
  let out = `# 📚 WebLinkSnap 網站書籤總覽 (${formatNow()})\n\n`;
  const grouped = {};
  items.forEach((b) => {
    const cat = b.category || "未分類";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });

  Object.keys(grouped).forEach((cat) => {
    out += `## 📂 ${cat}\n\n`;
    grouped[cat].forEach((b) => {
      out += buildMarkdownForItem(b, state.template, state.imageMode) + "\n---\n\n";
    });
  });
  return out;
}

// ===============================
// 書籤庫管理
// ===============================
function loadBookmarks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || "null");
    if (Array.isArray(saved)) {
      state.bookmarks = saved;
      return;
    }
    const legacy = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY) || "[]");
    if (Array.isArray(legacy) && legacy.length) {
      state.bookmarks = legacy.map((item, idx) => ({
        id: "bm_" + (Date.now() - idx * 1000),
        url: item.url,
        title: item.title || item.url,
        category: guessCategory(item.url, item.title, ""),
        description: item.description || "",
        capturedAt: item.capturedAt || formatNow(),
        timestamp: Date.now() - idx * 1000,
        thumb: item.thumb || "",
        currentImageUrl: item.url
      }));
      persistBookmarks();
    }
  } catch {
    state.bookmarks = [];
  }
}

function persistBookmarks() {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(state.bookmarks));
  } catch {
    if (state.bookmarks.length > 40) {
      state.bookmarks = state.bookmarks.slice(0, 40);
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(state.bookmarks));
      } catch {}
    }
  }
}

function upsertCurrentToBookmarks() {
  if (!state.url) return;

  const entry = {
    id: state.id || "bm_" + Date.now(),
    url: state.url,
    title: state.title || extractDomainName(state.url),
    category: state.category || "未分類",
    description: state.description || "",
    capturedAt: state.capturedAt || formatNow(),
    timestamp: state.timestamp || Date.now(),
    thumb: state.activeSource === "none" ? "" : state.base64Data,
    currentImageUrl: state.activeSource === "none" ? "" : state.currentImageUrl,
    ogUrl: state.sources.og || ""
  };

  const existingIdx = state.bookmarks.findIndex((b) => b.url === state.url || (state.id && b.id === state.id));
  if (existingIdx >= 0) {
    state.bookmarks[existingIdx] = entry;
  } else {
    state.bookmarks.unshift(entry);
  }

  persistBookmarks();
  renderBookmarkLibrary();
  saveStatusHint.textContent = `✅ 已同步儲存至「${entry.category}」分類 (${formatNow().slice(11)})`;
}

let syncTimer = null;
function autoSyncCurrentBookmark() {
  if (!state.url) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    upsertCurrentToBookmarks();
  }, 350);
}

function getActiveBookmarkSourceList() {
  return state.isViewingShared ? state.sharedBookmarks : state.bookmarks;
}

function getFilteredBookmarks() {
  const sourceList = getActiveBookmarkSourceList();
  const q = state.searchQuery.toLowerCase();

  const filtered = sourceList.filter((item) => {
    const matchCategory = state.filterCategory === "ALL" || (item.category || "未分類") === state.filterCategory;
    if (!matchCategory) return false;

    if (!q) return true;
    const haystack = `${item.title || ""} ${item.description || ""} ${item.category || ""} ${item.url || ""}`.toLowerCase();
    return haystack.includes(q);
  });

  filtered.sort((a, b) => {
    if (state.sortBy === "oldest") return (a.timestamp || 0) - (b.timestamp || 0);
    if (state.sortBy === "title") return (a.title || "").localeCompare(b.title || "", "zh-Hant");
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  return filtered;
}

function renderBookmarkLibrary() {
  const sourceList = getActiveBookmarkSourceList();
  totalBookmarkCount.textContent = state.bookmarks.length;

  const counts = { ALL: sourceList.length };
  const activeCats = [...state.categories];
  activeCats.forEach((c) => (counts[c] = 0));
  sourceList.forEach((b) => {
    const c = b.category || "未分類";
    counts[c] = (counts[c] || 0) + 1;
    if (!activeCats.includes(c)) activeCats.push(c);
  });

  categoryFilterBar.innerHTML = "";
  categoryFilterBar.appendChild(createCategoryPill("ALL", state.isViewingShared ? "分享包全部" : "全部書籤", counts.ALL));

  activeCats.forEach((cat) => {
    if (counts[cat] > 0 || !state.isViewingShared) {
      categoryFilterBar.appendChild(createCategoryPill(cat, cat, counts[cat] || 0));
    }
  });

  const filtered = getFilteredBookmarks();
  bookmarkList.innerHTML = "";

  if (!filtered.length) {
    emptyBookmarkState.classList.remove("hidden");
    if (sourceList.length === 0) {
      emptyStateText.textContent = "目前還沒有儲存的網站書籤，在上方貼上網址擷取後就會自動收納在這裡！";
    } else {
      emptyStateText.textContent = `找不到符合「${state.searchQuery || state.filterCategory}」的網站書籤。`;
    }
    return;
  }

  emptyBookmarkState.classList.add("hidden");

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className = "bookmark-card";

    const descHtml = item.description
      ? escapeHtml(item.description)
      : '<span style="opacity:0.45;">（尚無網站說明，點「編輯」可補充筆記）</span>';

    const thumbHtml = item.thumb
      ? `<img class="bm-stream-thumb" src="${item.thumb}" alt="${escapeHtml(item.title)}" title="點擊載入編輯" loading="lazy" />`
      : "";

    card.innerHTML = `
      <div class="bm-stream-top">
        <span class="bm-category-badge">🏷️ ${escapeHtml(item.category || "未分類")}</span>
        <div class="bm-meta-inline">
          <span>🌐 ${escapeHtml(extractDomainName(item.url))}</span>
          <span>•</span>
          <span>${escapeHtml((item.capturedAt || "").slice(0, 10))}</span>
        </div>
      </div>

      <div class="bm-stream-main">
        <div class="bm-stream-text">
          <a class="bookmark-title" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(item.title || item.url)}
          </a>
          <div class="bookmark-desc">${descHtml}</div>
        </div>
        ${thumbHtml}
      </div>

      <div class="bookmark-actions">
        <button type="button" class="bm-btn bm-btn-copy" data-action="copy" title="一鍵複製此網站的 Obsidian Markdown">
          📋 複製 Markdown
        </button>
        <button type="button" class="bm-btn" data-action="share-one" title="產生此單筆網站的分享連結">
          📤 分享連結
        </button>
        <button type="button" class="bm-btn" data-action="edit" title="載入上方編輯區修改分類、說明或補抓截圖">
          ✏️ 編輯
        </button>
        <a class="bm-btn" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
          🔗 開啟
        </a>
        <button type="button" class="bm-btn bm-btn-del" data-action="delete" title="刪除此書籤">
          🗑️
        </button>
      </div>
    `;

    const loadIntoEditor = () => {
      state.id = item.id;
      state.url = item.url;
      state.title = item.title;
      state.category = item.category || "未分類";
      state.description = item.description || "";
      state.capturedAt = item.capturedAt;
      state.timestamp = item.timestamp;
      state.base64Data = item.thumb || "";
      state.currentImageUrl = item.currentImageUrl || "";
      state.sources = {
        screenshot: "",
        og: item.ogUrl || "",
        mshots: `https://s0.wp.com/mshots/v1/${encodeURIComponent(item.url)}?w=1200&h=675`,
        custom: item.thumb || ""
      };

      urlInput.value = item.url;
      cleanUrlDisplay.value = item.url;
      siteTitleInput.value = item.title;
      renderCategorySelect();
      siteCategorySelect.value = state.category;
      siteDescriptionInput.value = state.description;

      if (item.thumb) {
        state.activeSource = "custom";
        previewImg.src = item.thumb;
        imageExtraContainer.classList.remove("hidden");
        updateBase64SizeBadge(item.thumb);
        document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      } else {
        state.activeSource = "none";
        imageExtraContainer.classList.add("hidden");
        imgSizeBadge.textContent = "純文字模式（無圖片）";
        document.querySelectorAll(".tab-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.source === "none");
        });
      }

      resultSection.classList.remove("hidden");
      updateMarkdownOutput();
      window.scrollTo({ top: resultSection.offsetTop - 16, behavior: "smooth" });
      showToast(`✏️ 已載入「${item.title}」`);
    };

    const thumbEl = card.querySelector(".bm-stream-thumb");
    if (thumbEl) thumbEl.addEventListener("click", loadIntoEditor);
    card.querySelector('[data-action="edit"]').addEventListener("click", loadIntoEditor);

    card.querySelector('[data-action="copy"]').addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const md = buildMarkdownForItem(item, state.template, state.imageMode);
      await copyTextToClipboard(md);
      const orig = btn.innerHTML;
      btn.innerHTML = "✅ 已複製";
      showToast(`📋 已複製「${item.title}」的 Markdown！`);
      setTimeout(() => (btn.innerHTML = orig), 1800);
    });

    // 單筆書籤產生分享連結
    card.querySelector('[data-action="share-one"]').addEventListener("click", async () => {
      await createAndShowShareLink([item], `分享網站：${item.title || item.url}`);
      window.scrollTo({ top: shareResultBar.offsetTop - 100, behavior: "smooth" });
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (state.isViewingShared) {
        state.sharedBookmarks = state.sharedBookmarks.filter((b) => b.id !== item.id && b.url !== item.url);
      } else {
        state.bookmarks = state.bookmarks.filter((b) => b.id !== item.id && b.url !== item.url);
        persistBookmarks();
      }
      renderBookmarkLibrary();
      showToast("🗑️ 已移除該筆書籤");
    });

    bookmarkList.appendChild(card);
  });
}

function createCategoryPill(catKey, label, count) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "category-pill" + (state.filterCategory === catKey ? " active" : "");
  btn.innerHTML = `<span>${escapeHtml(label)}</span><span class="pill-count">${count}</span>`;
  btn.addEventListener("click", () => {
    state.filterCategory = catKey;
    renderBookmarkLibrary();
  });
  return btn;
}

// ===============================
// 工具函式
// ===============================
async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    markdownOutput.value = text;
    markdownOutput.select();
    document.execCommand("copy");
  }
}

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 2500);
}

function extractDomainName(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}
