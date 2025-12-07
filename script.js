/**
 * Arc Style Check-in System Frontend
 * 
 * @file script.js
 * @description Handles UI interactions and Real API logic.
 */

// --- Configuration ---
const API_URL = "https://script.google.com/macros/s/AKfycby0NXNkKujwTs974UtdpLpAA3MfxefO6wk263RBLedSFsBkCgerH_0U7xY0ar9ZZABz_w/exec";

// --- DOM Elements ---
const views = {
    search: document.getElementById('view-search'),
    confirm: document.getElementById('view-confirm'),
    success: document.getElementById('view-success'),
    loading: document.getElementById('view-loading')
};

const inputs = {
    phone: document.getElementById('input-phone')
};

const display = {
    id: document.getElementById('confirm-id'),
    name: document.getElementById('confirm-name'),
    course: document.getElementById('confirm-course'),
    date: document.getElementById('confirm-date'),
    date: document.getElementById('confirm-date'),
    successTime: document.getElementById('success-time'),
    // New headers
    title: document.getElementById('confirm-title'),
    desc: document.getElementById('confirm-desc')
};

const buttons = {
    search: document.getElementById('btn-search'),
    back: document.getElementById('btn-back'),
    checkin: document.getElementById('btn-checkin'),
    home: document.getElementById('btn-home')
};

// --- State ---
let currentUser = null;

// --- Event Listeners ---
buttons.search.addEventListener('click', handleSearch);
buttons.back.addEventListener('click', () => switchView('search'));
buttons.checkin.addEventListener('click', handleCheckIn);
buttons.home.addEventListener('click', resetApp);

// Allow "Enter" key to trigger search
inputs.phone.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// --- Functions ---

function switchView(viewName) {
    // Hide all views
    Object.values(views).forEach(el => {
        if (el.id !== 'view-loading') el.classList.add('hidden');
    });

    // Show target view
    views[viewName].classList.remove('hidden');
}

function toggleLoading(show) {
    if (show) views.loading.classList.remove('hidden');
    else views.loading.classList.add('hidden');
}

/**
 * Call Google Apps Script API
 * @param {string} action - 'query' or 'checkin'
 * @param {Object} payload - Data to send
 */
async function callAPI(action, payload) {
    const body = JSON.stringify({ action, ...payload });

    // Use text/plain to avoid CORS preflight (OPTIONS) which GAS doesn't handle well
    const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: body
    });

    return await response.json();
}

async function handleSearch() {
    // Sanitize phone input: remove all non-digit characters
    // This handles spaces, dashes, parentheses, etc.
    const phone = inputs.phone.value.replace(/\D/g, '');

    if (!phone) {
        alert("請輸入手機號碼");
        return;
    }

    toggleLoading(true);

    try {
        const result = await callAPI('query', { phone });

        if (result.success) {
            currentUser = result.data;
            renderConfirmView(currentUser);
            switchView('confirm');
        } else {
            alert(result.message || "找不到此手機號碼的報名資料");
        }
    } catch (error) {
        console.error(error);
        alert("連線錯誤，請稍後再試");
    } finally {
        toggleLoading(false);
    }
}

function renderConfirmView(user) {
    display.id.textContent = user.id;
    display.name.textContent = user.name;
    display.course.textContent = user.course_name;
    display.date.textContent = user.course_date;

    // Handle Already Checked In
    if (user.status === 'CheckedIn') {
        display.title.textContent = "已完成報到";
        display.desc.textContent = "您已完成報到，以下是您的報到資料";
        buttons.checkin.classList.add('hidden');
    } else {
        // Reset to default
        display.title.textContent = "確認資料";
        display.desc.textContent = "請確認以下資訊是否正確";
        buttons.checkin.classList.remove('hidden');
    }
}

async function handleCheckIn() {
    if (!currentUser) return;

    toggleLoading(true);

    try {
        const result = await callAPI('checkin', { id: currentUser.id });

        if (result.success) {
            const now = new Date();
            const timeString = now.toLocaleString('zh-TW', { hour12: false });
            display.successTime.textContent = `報到時間：${timeString}`;
            switchView('success');
        } else if (result.message && result.message.includes("已完成報到")) {
            // Handle duplicate check-in: Show success view directly
            alert(result.message); // Optional: Keep the alert or remove it

            // We might want to show the original check-in time if available, 
            // but for now we can just show "已完成" or current time.
            // Since we don't have the original time in the error response, 
            // let's just show a generic message or current time.
            display.successTime.textContent = "狀態：已完成報到";
            switchView('success');
        } else {
            alert(result.message || "報到失敗");
        }
    } catch (error) {
        console.error(error);
        alert("連線錯誤，請稍後再試");
    } finally {
        toggleLoading(false);
    }
}

function resetApp() {
    currentUser = null;
    inputs.phone.value = '';
    switchView('search');
}

// Init
console.log("App Initialized with Real API");
