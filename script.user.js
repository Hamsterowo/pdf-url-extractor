// ==UserScript==
// @name         PDF Viewer 搜尋器
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  掃描 PDF 連結
// @author       Ray
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// 
// @updateURL    https://raw.githubusercontent.com/Hamsterowo/pdf-url-extractor/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/Hamsterowo/pdf-url-extractor/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    const MSG_ID = "PDF_EXTRACTOR_V3_";
    const TARGET_PATTERN = "pdf-viewer?file=";

    // 註冊選單 (所有 Frame 都會有這個按鈕，但點擊後都會交由 Top 處理)
    GM_registerMenuCommand("🔍 掃描 PDF 連結", triggerScan);

    // --- 訊息監聽系統 ---
    window.addEventListener("message", function(event) {
        if (typeof event.data !== "string" || !event.data.startsWith(MSG_ID)) return;

        const payload = JSON.parse(event.data.substring(MSG_ID.length));

        // 情況 A: 收到掃描指令 (只有 Top 會發送這個，或由子 Frame 轉發給 Top)
        if (payload.type === "CMD_SCAN_REQUEST") {
            performLocalScan();
        }

        // 情況 B: 收到掃描結果 (Top 負責收集)
        if (payload.type === "CMD_SCAN_REPORT" && window === window.top) {
            collectResults(payload.urls);
        }

        // 情況 C: 子 Frame 收到「啟動」指令 -> 轉發給 Top (如果使用者是在 iframe 裡點選單)
        if (payload.type === "CMD_TRIGGER_START") {
            if (window === window.top) {
                startCoordination();
            } else {
                window.top.postMessage(MSG_ID + JSON.stringify({ type: "CMD_TRIGGER_START" }), "*");
            }
        }
    });

    // --- 使用者觸發 ---
    function triggerScan() {
        // 發送訊號給 Top (如果自己就是 Top，直接開始；如果是 iframe，透過 postMessage 叫 Top 開始)
        if (window === window.top) {
            startCoordination();
        } else {
            window.top.postMessage(MSG_ID + JSON.stringify({ type: "CMD_TRIGGER_START" }), "*");
        }
    }

    // --- Top Window 的協調邏輯 ---
    let gatheredUrls = new Set();
    let collectTimer = null;

    function startCoordination() {
        console.log("[Top] 開始協調掃描...");
        gatheredUrls.clear(); // 清空舊結果

        // 1. 廣播給所有 Frames (包含自己) 要求掃描
        // 注意：基於安全性，我們只能廣播給 window.frames，但無法保證一定能送達跨域 frame，
        // 不過 postMessage '*' 允許跨域傳遞。
        const msg = MSG_ID + JSON.stringify({ type: "CMD_SCAN_REQUEST" });

        // 通知自己
        window.postMessage(msg, "*");

        // 通知所有 iframe
        const frames = window.frames;
        for (let i = 0; i < frames.length; i++) {
            frames[i].postMessage(msg, "*");
        }

        // 2. 設定一個計時器，等待所有 Frame 回報 (例如 500ms 後結算)
        if (collectTimer) clearTimeout(collectTimer);
        collectTimer = setTimeout(finalizeAndShow, 600);
    }

    function collectResults(urls) {
        urls.forEach(url => gatheredUrls.add(url));
    }

    function finalizeAndShow() {
        showModal(Array.from(gatheredUrls));
    }

    // --- 各個 Frame 的掃描邏輯 ---
    function performLocalScan() {
        const foundLocal = new Set();

        // 1. 檢查當前網址
        if (window.location.href.includes(TARGET_PATTERN)) {
            processUrl(window.location.href, foundLocal);
        }

        // 2. 掃描 DOM
        const elements = document.querySelectorAll(`[href*="${TARGET_PATTERN}"], [src*="${TARGET_PATTERN}"], [data-src*="${TARGET_PATTERN}"]`);
        elements.forEach(el => {
            const url = el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('data-src');
            if (url) processUrl(url, foundLocal);
        });

        // 3. 掃描原始碼 (Regex)
        const regex = /pdf-viewer\?file=([^"'\s&]+)/g;
        const html = document.body.innerHTML;
        let match;
        while ((match = regex.exec(html)) !== null) {
             // 模擬完整 URL 格式讓 processUrl 處理
             processUrl("prefix" + match[0], foundLocal);
        }

        // 回報結果給 Top
        if (foundLocal.size > 0) {
            window.top.postMessage(MSG_ID + JSON.stringify({
                type: "CMD_SCAN_REPORT",
                urls: Array.from(foundLocal)
            }), "*");
        }
    }

    function processUrl(fullUrl, setObj) {
        const splitIndex = fullUrl.indexOf(TARGET_PATTERN);
        if (splitIndex !== -1) {
            const rawContent = fullUrl.substring(splitIndex + TARGET_PATTERN.length);
            try {
                // 這裡可以根據需要決定是否要切掉 '&' 後面的參數
                // let cleanContent = rawContent.split('&')[0];
                const decodedContent = decodeURIComponent(rawContent);
                setObj.add(decodedContent);
            } catch (e) {}
        }
    }

    // --- 顯示介面 (只會在 Top 執行) ---
    function showModal(urls) {
        const oldModal = document.getElementById('pdf-extractor-v3-modal');
        if (oldModal) oldModal.remove();

        if (urls.length === 0) {
            // 如果完全沒找到，只有在是由 Top 自己觸發的掃描才顯示 Alert，避免干擾
            // 這裡簡單處理：如果結果為 0，顯示一個自動消失的提示
            const toast = document.createElement('div');
            toast.textContent = "掃描完成：未發現相關連結";
            toast.style.cssText = "position:fixed; top:20px; right:20px; background:#333; color:#fff; padding:10px; z-index:99999; border-radius:5px;";
            document.body.appendChild(toast);
            setTimeout(()=>toast.remove(), 2000);
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'pdf-extractor-v3-modal';
        modal.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 450px; max-height: 80vh;
            background: #fff; border: 2px solid #673AB7; box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            z-index: 2147483647; padding: 20px; border-radius: 10px; font-family: sans-serif;
            display: flex; flex-direction: column; color: #333;
        `;

        const header = document.createElement('div');
        header.innerHTML = `<strong style="font-size:16px; color:#673AB7;">📦 整合報告：找到 ${urls.length} 個結果</strong>`;
        header.style.marginBottom = '15px';

        const textarea = document.createElement('textarea');
        textarea.value = urls.join('\n');
        textarea.style.cssText = `
            width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd;
            margin-bottom: 15px; font-size: 13px; line-height: 1.5; white-space: pre; overflow-x: auto;
            background: #fdfdfd; border-radius: 4px;
        `;

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'flex-end';
        btnContainer.style.gap = '10px';

        const createBtn = (text, bg, action) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `padding: 8px 15px; cursor: pointer; background: ${bg}; color: white; border: none; border-radius: 4px; font-weight: bold;`;
            btn.onclick = action;
            return btn;
        };

        const copyBtn = createBtn('複製全部', '#4CAF50', () => {
            GM_setClipboard(textarea.value);
            copyBtn.textContent = '已複製！';
            setTimeout(()=> copyBtn.textContent = '複製全部', 1000);
        });

        const closeBtn = createBtn('關閉', '#f44336', () => modal.remove());

        btnContainer.appendChild(copyBtn);
        btnContainer.appendChild(closeBtn);
        modal.appendChild(header);
        modal.appendChild(textarea);
        modal.appendChild(btnContainer);

        document.body.appendChild(modal);
    }
})();