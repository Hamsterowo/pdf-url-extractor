# PDF Viewer Link Extractor (PDF 連結搜尋器)

> **⚠️ 聲明 / Disclaimer**
>
> 本專案的所有程式碼、邏輯架構，皆由 **Google Gemini AI** 協助生成。
> This repository, including code and documentation, was generated with the assistance of Google Gemini AI.

## 📝 專案簡介

這是一個 **Tampermonkey (油猴)** 使用者腳本 (UserScript)。

用於偵測網頁中隱藏或嵌入的 PDF 閱讀器連結（特徵為 `pdf-viewer?file=`），將其擷取出來並自動進行 URL 解碼。

此腳本特別針對 **複雜的網頁結構** 進行改良，能夠穿透 **Shadow DOM** 以及 **巢狀 iframe (Nested Frames)**，並將所有分散在不同區塊的結果整合在同一個視窗中顯示，避免彈出多個視窗干擾使用者。

## ✨ 主要功能

* **🔍 深度掃描**：自動偵測頁面中的 `<a>`, `<iframe>`, `embed` 標籤，甚至掃描 HTML 原始碼。
* **🔓 URL 自動解碼**：將原本亂碼般的 `%E6%AA%94%E6%A1%88.pdf` 自動轉還原為可讀的文字。
* **🧅 穿透 Shadow DOM**：支援現代網頁架構，可讀取封裝在 Shadow Root 內的連結。
* **🤝 跨 Frame 整合 (V3)**：
    * 利用 `postMessage` 建立通訊網。
    * 無論網頁有多少個 iframe，腳本會自動協調，將所有結果**匯總到最上層視窗**。
    * **單一視窗顯示**，不再被多個彈跳視窗轟炸。
* **📋 一鍵複製**：提供按鈕直接將所有連結複製到剪貼簿。

### 方法一：直接點擊安裝 (推薦)
1.  **[點此安裝腳本](https://raw.githubusercontent.com/Hamsterowo/pdf-url-extractor/main/script.user.js)**
    * *(請確保連結指向你 GitHub 倉庫中 `script.user.js` 的 Raw 地址)*
2.  Tampermonkey 應會自動跳出安裝確認頁面，點擊 **「安裝 (Install)」** 即可。

> **⚠️ 注意：**
> 如果點擊連結後是其它腳本軟體，請改用下方的「方法二」。

### 方法二：手動複製貼上 (若方法一失敗)
1.  開啟 [腳本原始碼頁面 (Raw)](https://raw.githubusercontent.com/Hamsterowo/pdf-url-extractor/main/script.user.js)。
2.  全選程式碼 (`Ctrl + A`) 並複製 (`Ctrl + C`)。
3.  點擊瀏覽器右上角的 **Tampermonkey 圖示** -> **「添加新腳本 (Create a new script)」**。
4.  刪除編輯器內所有預設文字，貼上剛剛複製的程式碼。
5.  按下 `Ctrl + S` 儲存即可。

### 方法三：拖曳安裝
1.  在腳本連結上按右鍵 -> **「另存連結為...」**，將 `.user.js` 檔案下載到電腦。
2.  點擊 Tampermonkey 圖示 -> 進入 **「管理面板 (Dashboard)」**。
3.  將下載的檔案直接 **拖曳 (Drag & Drop)** 進管理面板列表中，即可觸發安裝。

## 📖 使用教學

1.  進入任何你想要抓取 PDF 連結的目標網頁。
2.  點擊瀏覽器右上角的 **Tampermonkey 圖示**。
3.  在選單中點擊 **「🔍 掃描全頁面 PDF 連結 (整合版)」**。
4.  腳本會自動掃描所有框架，並在網頁右上角彈出一個視窗，列出所有找到的檔案路徑。
5.  點擊 **「複製全部」** 即可。

## 🛠️ 開發與更新

如果你是開發者或想要修改此腳本：

1.  程式碼位於 `script.user.js`。
2.  本腳本支援 **自動更新** 機制。
3.  若要發布新版本，請修改程式碼中的 `// @version` 版號（例如 `3.0` -> `3.1`），並 Push 到 GitHub，使用者的瀏覽器便會自動偵測更新。

## 📄 授權

本專案由 AI 生成，可隨意取用。