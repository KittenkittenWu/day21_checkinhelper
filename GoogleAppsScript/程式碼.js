/**
 * Arc 風格報到系統後端
 * 
 * @file Code.gs
 * @description 處理查詢與報到的 API 請求。
 */

// --- 設定 ---
const SHEET_NAME = "Attendees";
const CACHE_KEY = "SHEET_DATA";
const CACHE_DURATION = 600; // 快取 10 分鐘

// 欄位索引 (從 0 開始)
const COL_ID = 0;          // A: id (學員編號)
const COL_PHONE = 1;       // B: phone (電話)
const COL_NAME = 2;        // C: name (姓名)
const COL_COURSE_NAME = 3; // D: course_name (課程名稱)
const COL_COURSE_DATE = 4; // E: course_date (課程日期)
const COL_COURSE_TYPE = 5; // F: course_type (課程類型)
const COL_STATUS = 6;      // G: status (狀態)
const COL_CHECK_IN_TIME = 7; // H: check_in_time (報到時間)

/**
 * POST 請求的進入點。
 * @param {Object} e - 事件物件。
 * @returns {TextOutput} JSON 回應。
 */
function doPost(e) {
  // CORS 與錯誤處理包裝
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("無效請求：未收到資料。");
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    let result;

    switch (action) {
      case "query":
        result = handleQuery(payload);
        break;
      case "checkin":
        result = handleCheckIn(payload);
        break;
      default:
        throw new Error(`未知動作：${action}`);
    }

    return createJSONOutput(result);

  } catch (error) {
    return createJSONOutput({
      success: false,
      message: error.toString()
    });
  }
}

/**
 * 處理 'query' (查詢) 動作。
 * 透過電話號碼搜尋使用者。
 * 
 * @param {Object} payload - { phone: "..." }
 * @returns {Object} 成功或錯誤物件。
 */
function handleQuery(payload) {
  const phone = payload.phone;
  if (!phone) throw new Error("缺少參數：phone");

  // 改用 loadData() 讀取資料 (含快取)
  const data = loadData();

  // 跳過標題列 (索引 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // 使用寬鬆比對電話號碼，以處理字串/數字差異
    if (String(row[COL_PHONE]) === String(phone)) {
      return {
        success: true,
        data: {
          id: row[COL_ID],
          phone: row[COL_PHONE],
          name: row[COL_NAME],
          course_name: row[COL_COURSE_NAME],
          course_date: formatDate(row[COL_COURSE_DATE]), // 確保日期格式
          course_type: row[COL_COURSE_TYPE],
          status: row[COL_STATUS]
        }
      };
    }
  }

  return {
    success: false,
    message: "找不到使用者。"
  };
}

/**
 * 處理 'checkin' (報到) 動作。
 * 透過 ID 更新使用者狀態為 'CheckedIn'。
 * 
 * @param {Object} payload - { id: "..." }
 * @returns {Object} 成功或錯誤物件。
 */
function handleCheckIn(payload) {
  const id = payload.id;
  if (!id) throw new Error("缺少參數：id");

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 跳過標題列 (索引 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[COL_ID]) === String(id)) {

      const currentStatus = String(row[COL_STATUS]).trim();
      Logger.log(`Found ID: ${id}, Current Status: '${currentStatus}'`);

      // 檢查是否已報到
      if (currentStatus === 'CheckedIn') {
        return {
          success: false,
          message: "您已完成報到，無需重複操作。",
          debugStatus: currentStatus
        };
      }

      // 特殊邏輯：測試帳號 (0987654321) 不寫入資料庫，永遠保持未報到狀態
      // 注意：這裡我們比對的是 row[COL_PHONE]，需要轉成字串
      if (String(row[COL_PHONE]) === '0987654321') {
        Logger.log(`Test account check-in intercepted for ID: ${id}`);
        return {
          success: true,
          timestamp: new Date().toISOString(),
          message: "測試帳號報到成功 (模擬)"
        };
      }

      const timestamp = new Date().toISOString();

      // 更新試算表
      // 列索引為 i + 1，因為試算表列數從 1 開始
      sheet.getRange(i + 1, COL_STATUS + 1).setValue("CheckedIn");
      sheet.getRange(i + 1, COL_CHECK_IN_TIME + 1).setValue(timestamp);

      // 重要：更新成功後，清除快取，確保下次查詢能讀到最新狀態
      invalidateCache();

      return {
        success: true,
        timestamp: timestamp
      };
    }
  }

  return {
    success: false,
    message: "找不到使用者 ID。"
  };
}

/**
 * 讀取資料：優先從快取讀取，若無則讀取試算表並寫入快取。
 */
function loadData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);

  if (cached) {
    Logger.log("Hit Cache!");
    return JSON.parse(cached);
  }

  Logger.log("Miss Cache. Loading from Sheet...");
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 嘗試寫入快取 (簡單版，假設資料量 < 100KB)
  try {
    cache.put(CACHE_KEY, JSON.stringify(data), CACHE_DURATION);
  } catch (e) {
    Logger.log("Cache put failed (likely too big): " + e);
  }

  return data;
}

/**
 * 清除快取
 */
function invalidateCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
  Logger.log("Cache Invalidated.");
}

/**
 * 輔助函式：取得使用中的工作表。
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`找不到工作表 "${SHEET_NAME}"。`);
  return sheet;
}

/**
 * 輔助函式：建立帶有 CORS 標頭的 JSON 輸出。
 */
function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 輔助函式：必要時將日期物件格式化為字串
 */
function formatDate(dateInput) {
  if (dateInput instanceof Date) {
    return Utilities.formatDate(dateInput, Session.getScriptTimeZone(), "yyyy/MM/dd");
  }
  return dateInput;
}

/**
 * 初始設定：執行此函式一次以建立標題。
 */
function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // 設定標題
  const headers = [
    "id", "phone", "name", "course_name", "course_date", "course_type", "status", "check_in_time"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 可選：凍結標題列
  sheet.setFrozenRows(1);

  Logger.log("設定完成。工作表 'Attendees' 已建立/更新。");
}

測試佈署