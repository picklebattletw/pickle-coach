# 匹克球教練筆記：給 Claude 的專案說明

## 溝通方式
- 使用者看不懂英文，**所有回覆一律使用繁體中文（台灣用語）**，包含說明、提問與 commit 訊息摘要。
- 使用者不是工程師：說明改了什麼、怎麼驗收，少談程式細節。

## 這是什麼
給匹克球教練用的學生、課表、收費與學習歷程管理網頁（PWA）。
- 每位教練用自己的 Google 帳號登入，資料存在**教練自己的 Google 雲端硬碟**「匹克球教練筆記/coach-data.json」（舊名「匹克球教練本」仍相容，見 `CONFIG.LEGACY_FOLDERS`）。
- 沒有後端伺服器；網站以 GitHub Pages 從 `docs/` 資料夾發布。
- 有「試用模式」：不登入、使用範例資料、只存在瀏覽器 localStorage。

## 檔案結構
- `src/` 原始碼（**只改這裡**）
  - `core.js`：設定（CONFIG，含 GOOGLE_CLIENT_ID）、常數、資料模型、計算（剩餘堂數、待收款、到期）、Google 登入與雲端硬碟同步
  - `views.js`：各分頁畫面（今日、行事曆＝整月月曆、學生、收支、更多：LINE 訊息／潛在客群／分析／設定）。`lessonState(l)` 回傳 off／paid／unpaid／done／todo，課表標籤與月曆圓點都用它。
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
- **只有單堂計費，沒有課程包／續約／扣堂。**
- 課程價目表：`settings.prices={normal:{1,2,3,4},trial:{4,5,6,7,8}}`，存的是**一堂課的總價**（不是每人）。一般課依 1對1～1對4，體驗課依 4～8 人（`PRICEHEADS`），人數超出級距會夾到最近的級距；格子留 0 會沿用相鄰人數的價格。課程有 `feeKind`（normal/trial）、`payHeads`（收費人數，0＝依學生人數）與 `feeTotal`（本堂總價，0＝依價目表；舊欄位 `unitPrice` 是每人價格，會自動換算）。
- 一鍵完成：課程畫面最上方有「完成課程（已收費）／（尚未收費）」兩顆按鈕（`finish-lesson`），會把還沒點名的人記成出席（已標請假／未到的保留）、狀態設為已完成，並依按鈕決定要不要同時建立收款。
- 當場收費：點名列有「已收」勾選，儲存時會自動建立／更新／刪除一筆 `payments`（`type='single'`、帶 `lessonId` 與 `studentId`，金額＝`studentFee`），`lessonPayOf(lid,sid)` 可查。請假不能勾。沒有指定學生的課（例如體驗課）改成整堂一個「已收」，建立的收款 `studentId=''`、金額＝`lessonFee`。
- 待收款 `owed(s)`＝已點名計費的課（`counted`：出席或未到，且課程的 `deduct!==false`）應收總和 − 該學生 `type='single'` 的收款；每堂應收優先順序：課程 `feeTotal` > 學生 `price`（個人單價）> 價目表總價 ÷ 人數。負數代表學生已預繳。
- 常用上課地點：`settings.places`（字串陣列，在設定頁管理）。排課的地點欄下面會列出可點選的膠囊按鈕，也可以手動輸入。`defaultLocation` 自動同步成 `places[0]`，供新課程預設值與體驗課邀約訊息使用。
- 提醒：待收款、太久沒上課（`inactiveDays`）。
- 上課歷程與筆記：學生頁列出每一堂課（含請假、未到、還沒點名）與對應筆記；筆記含今天教了什麼／上課狀況／回家作業，技術評分 8 項 1–5 分為選填，有雷達圖。
- LINE 訊息產生器：`https://line.me/R/share?text=` 分享（課前提醒、本週課表、課後回饋、收款提醒、學習報告、體驗課邀約、自訂公告）。
- 潛在客群與各來源成交率、分析頁。

## 注意事項
- Google OAuth 權限只用 `drive.file`（只能存取本程式建立的檔案），不要擴大權限範圍。
- 介面文字一律繁體中文，配色用 CSS 變數，支援深色模式，手機寬度（約 390px）優先。
- 不要把任何教練或學生的真實資料寫進程式碼。
- 收費／訂閱功能目前**暫不實作**（使用者需先確認工作單位的兼職規定）。
