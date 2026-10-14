# 匹克球教練本：給 Claude 的專案說明

## 溝通方式
- 使用者看不懂英文，**所有回覆一律使用繁體中文（台灣用語）**，包含說明、提問與 commit 訊息摘要。
- 使用者不是工程師：說明改了什麼、怎麼驗收，少談程式細節。

## 這是什麼
給匹克球教練用的學生、課表、收費與學習歷程管理網頁（PWA）。
- 每位教練用自己的 Google 帳號登入，資料存在**教練自己的 Google 雲端硬碟**「匹克球教練本/coach-data.json」。
- 沒有後端伺服器；網站以 GitHub Pages 從 `docs/` 資料夾發布。
- 有「試用模式」：不登入、使用範例資料、只存在瀏覽器 localStorage。

## 檔案結構
- `src/` 原始碼（**只改這裡**）
  - `core.js`：設定（CONFIG，含 GOOGLE_CLIENT_ID）、常數、資料模型、計算（剩餘堂數、待收款、到期）、Google 登入與雲端硬碟同步
  - `views.js`：各分頁畫面（今日、行事曆、學生、收支、更多：LINE 訊息／潛在客群／分析／設定）
  - `sheets.js`：新增／編輯表單、匯出（ics、CSV、JSON 備份）、範例資料
  - `main.js`：登入畫面、事件處理、啟動
  - `style.css`、`body.html`
- `build.py`：把 `src/` 組合成 `docs/index.html`
- `docs/`：發布的網站（`index.html` 由 build 產生，**不要手動改**；`privacy.html`、`sw.js`、`manifest.webmanifest`、圖示可直接改）
- `設定教學.md`：Google Cloud 與 GitHub Pages 設定步驟

## 修改流程（每次都要做）
1. 修改 `src/` 裡的檔案。
2. 執行 `python3 build.py`，再執行 `node --check check.js` 確認沒有語法錯誤。
3. 把 `src/` 和 `docs/` 一起 commit 並推送到 `main`，GitHub Pages 約 1～2 分鐘後更新。
4. 若修改了 `docs/sw.js` 快取的檔案清單或想強制更新快取，把 `sw.js` 第一行的 `pcb-v1` 版號加一。
5. 同時把 `src/core.js` 的 `CONFIG.VERSION` 版號加一。

## 資料模型（重要，修改時保持相容）
`D = {schema, settings, students, lessons, payments, logs, leads}`，每個集合都是 `{id: record}` 物件。
- 每筆紀錄都有 `updatedAt`；刪除是寫入 `{id, deleted:true, updatedAt}` 墓碑，90 天後自動清掉。
- 一律透過 `put(col,id,data)`、`del(col,id)`、`putSettings()` 寫入，它們會更新時間、存本機、排程同步。
- 同步：`sync()` 比對雲端檔案 `version`，不同就下載並用 `merge()` 逐筆以 `updatedAt` 較新者為準，再上傳。
- 新增欄位時要有預設值，讓舊資料也能正常顯示；不要改名或移除既有欄位。
- `settings` 新欄位加到 `DEFAULT_SETTINGS`。

## 功能重點
- 課程價目表：`settings.prices={normal:{1,2,3,4},trial:{1,2,3,4}}`，每人每堂價格由「課程性質（一般課／體驗課）× 上課人數（1對1～1對4）」決定；格子留 0 代表沿用人數較少的價格。課程有 `feeKind`（normal/trial）與 `payHeads`（收費人數，0＝依學生人數）。學生的 `price` 是個人專屬單價，優先於價目表。`singlePrice` 保留為最後的備援值，儲存設定時會同步成一般課 1對1 的價格。
- 課程包（payments.type='package'，kind 首購/續約/加購，sessions、expiry），點名出席或未到時扣堂；可設定依時數扣堂。
- 單堂制學生（billing='perLesson'）：計算待收款。
- 提醒：續約（剩餘 ≤ lowAt）、到期、待收款、太久沒上課。
- 學習紀錄：8 項技術 1–5 分、雷達圖、學習歷程時間軸。
- LINE 訊息產生器：`https://line.me/R/share?text=` 分享。
- 潛在客群與各來源成交率、分析頁。

## 注意事項
- Google OAuth 權限只用 `drive.file`（只能存取本程式建立的檔案），不要擴大權限範圍。
- 介面文字一律繁體中文，配色用 CSS 變數，支援深色模式，手機寬度（約 390px）優先。
- 不要把任何教練或學生的真實資料寫進程式碼。
- 收費／訂閱功能目前**暫不實作**（使用者需先確認工作單位的兼職規定）。
