# 實作計畫：Arc 風格報到系統 (Check-in System)

## 第一階段：分析與設計 (Phase 1)
- [x] PRD 需求定案
- [x] 建立技術規格文件 (`SPEC.md`) - **已更新 Schema 與 ID 邏輯**

## 第二階段：後端實作 (Phase 2)
- [ ] **任務 1：Google Apps Script 後端開發**
    - 撰寫 `doPost` 處理邏輯。
    - 實作 `handleQuery` (**手機查詢**)：回傳完整學員資料 (含 ID, 課程類別)。
    - 實作 `handleCheckIn` (**ID 報到**)：利用 ID 鎖定並更新狀態。
    - 部署為 Web App。

## 第三階段：前端實作 (Phase 3)
- [ ] **任務 2：專案骨架與 Arc 風格系統**
    - 建立 `index.html`, `style.css`, `script.js`。
    - 定義 CSS 變數 (Arc 配色、磨砂玻璃效果)。
- [ ] **任務 3：搜尋介面實作**
    - UI：手機號碼輸入框。
    - 邏輯：Mock API 查詢功能 (測試資料需包含 ID 與課程類別)。
- [ ] **任務 4：確認介面實作**
    - UI：學員資料卡片 (顯示 **ID**、姓名、**課程日期**、**課程類別**)。
    - 邏輯：點擊報到按鈕時，傳送 **ID** 進行處理。
- [ ] **任務 5：成功介面與狀態管理**
    - UI：報到成功訊息/動畫。
    - 邏輯：完成完整的 View State Machine (狀態機)。

## 第四階段：整合測試 (Phase 4)
- [ ] **任務 6：真實 API 串接**
    - 將 Mock API 替換為真實的 GAS `fetch` 呼叫。
    - 處理 CORS 與錯誤狀況 (Error Handling)。