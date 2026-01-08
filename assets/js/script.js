let currentAns = "", currentId = 0, isAnswered = false;
let sessionCorrect = 0, sessionTotal = 0;
let currentQuestionData = {}; 

// 1. 定義全新的 6 大資安練習單元
const allCategories = [
    '資安法規與標準', 
    '資安基礎知識', 
    '資安實務應用', 
    '攻擊防禦與加密', 
    '網路與雲端安全', 
    '系統安全技術'
];

// 2. 定義 UI 單元與資料庫原始標籤的映射關係
const categoryMap = {
    '資安法規與標準': ['標準與法規類', '資料安全類'],
    '資安基礎知識': ['基礎知識類'],
    '資安實務應用': ['實務應用類'],
    '攻擊防禦與加密': ['攻擊與防禦類', '加密與認證類'],
    '網路與雲端安全': ['網路安全類', '雲端安全類'],
    '系統安全技術': ['系統安全類']
};

function loadSettings() {
    document.getElementById('recordModeToggle').checked = (localStorage.getItem('isRecordMode') !== 'false');
    document.getElementById('weaknessModeToggle').checked = (localStorage.getItem('isWeaknessMode') === 'true');
    
    // 取得快取中的分類
    let savedCats = [];
    try {
        savedCats = JSON.parse(localStorage.getItem('selectedCats')) || [];
    } catch(e) { savedCats = []; }

    // 【強制重置邏輯】解決選單沒改變的問題
    // 檢查快取資料是否與新的 6 大類相符，如果不符則清空重置
    const isOldData = savedCats.length === 0 || !allCategories.includes(savedCats[0]);
    if (isOldData) {
        console.log("檢測到舊版數據，正在重置分類選單...");
        savedCats = allCategories;
        localStorage.setItem('selectedCats', JSON.stringify(allCategories));
    }

    renderCategoryFilters(savedCats);
    document.getElementById('customCount').value = localStorage.getItem('customCount') || "10";
    document.getElementById('customTime').value = localStorage.getItem('customTime') || "40";
}

function renderCategoryFilters(selectedCats) {
    const container = document.getElementById('categoryFilters');
    if(container) {
        container.innerHTML = allCategories.map(cat => `
            <div style="margin-bottom:6px; display:flex; align-items:center;">
                <input type="checkbox" class="cat-checkbox" value="${cat}" ${selectedCats.includes(cat) ? 'checked' : ''} onchange="saveSettings()"> 
                <span style="margin-left:8px;">${cat}</span>
            </div>`).join('');
    }
}

function saveSettings() {
    localStorage.setItem('isRecordMode', document.getElementById('recordModeToggle').checked);
    localStorage.setItem('isWeaknessMode', document.getElementById('weaknessModeToggle').checked);
    const checkedCats = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.value);
    localStorage.setItem('selectedCats', JSON.stringify(checkedCats));
}

async function fetchNext() {
    isAnswered = false;
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('ai-btn').style.display = 'none'; 
    
    const explainBox = document.getElementById('explain-box');
    if(explainBox) explainBox.style.display = 'none';

    document.querySelectorAll('.opt-btn').forEach(b => { 
        b.className = 'opt-btn'; 
        b.disabled = false; 
    });
    
    const selectedMainCats = JSON.parse(localStorage.getItem('selectedCats')) || allCategories;
    let subCats = [];
    selectedMainCats.forEach(main => {
        if(categoryMap[main]) subCats = subCats.concat(categoryMap[main]);
    });

    const params = new URLSearchParams({ 
        mode: localStorage.getItem('isWeaknessMode') === 'true' ? 'weakness' : 'all', 
        cats: subCats.join(',') 
    });

    try {
        const res = await fetch(`api/get_question.php?${params.toString()}`);
        const data = await res.json();
        
        if (data.status === "empty") {
            alert(data.message || "無題目資料"); return;
        }

        currentQuestionData = data;
        currentId = data.id; 
        // 【修正】確保答案為大寫且無空格
        currentAns = (data.answer || "").toString().trim().toUpperCase(); 
        
        document.getElementById('category').innerText = data.category;
        document.getElementById('q-num').innerText = `題號: ${data.id}`;
        document.getElementById('question').innerText = data.question;
        
        // 圖片處理
        const imgContainer = document.getElementById('q-image-container');
        const imgTag = document.getElementById('q-image');
        if (data.image && data.image.trim() !== "") {
            imgTag.src = `assets/images/${data.image}`;
            imgContainer.style.display = 'block';
        } else {
            imgContainer.style.display = 'none';
        }

        document.getElementById('optA').innerText = "A. " + data.option_a;
        document.getElementById('optB').innerText = "B. " + data.option_b;
        document.getElementById('optC').innerText = "C. " + data.option_c;
        document.getElementById('optD').innerText = "D. " + data.option_d;
    } catch (e) { console.error("擷取題目失敗:", e); }
}

function checkAns(choice) {
    if (isAnswered) return;
    isAnswered = true; sessionTotal++;
    currentQuestionData.userChoice = choice;

    // 【除錯用】在瀏覽器主控台印出答案，方便確認資料庫內容
    console.log("正確答案是:", currentAns, "您的選擇是:", choice);

    const isCorrect = (choice === currentAns);
    
    // 強化對應表：支援 A/B/C/D 與 1/2/3/4
    const mapping = { 
        'A': 'optA', 'B': 'optB', 'C': 'optC', 'D': 'optD',
        '1': 'optA', '2': 'optB', '3': 'optC', '4': 'optD',
        'A.': 'optA', 'B.': 'optB', 'C.': 'optC', 'D.': 'optD'
    };
    
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

    // 取得點擊的按鈕與正確答案的按鈕
    const clickedBtn = document.getElementById(mapping[choice]);
    const correctBtn = document.getElementById(mapping[currentAns]);

    // 安全檢查：確保按鈕存在才執行 classList 操作，避免 TypeError
    if (clickedBtn) {
        clickedBtn.classList.add(isCorrect ? 'correct' : 'wrong');
    }
    
    // 如果答錯，亮起正確答案
    if (!isCorrect && correctBtn) {
        correctBtn.classList.add('correct');
    } else if (!isCorrect && !correctBtn) {
        // 如果還是亮不起來，顯示警告訊息
        console.error("找不到正確答案的按鈕，請檢查資料庫內容是否為 A,B,C,D 或 1,2,3,4");
    }

    // 顯示解析
    if (!isCorrect && currentQuestionData.explain && currentQuestionData.explain.trim() !== "") {
        let explainBox = document.getElementById('explain-box');
        if (!explainBox) {
            explainBox = document.createElement('div');
            explainBox.id = 'explain-box';
            explainBox.style = "margin-top:15px; padding:15px; background:#f0f7ff; border-radius:10px; border-left:5px solid #007aff; color:#333; font-size:0.9rem;";
            document.querySelector('.card').appendChild(explainBox);
        }
        explainBox.innerHTML = "<strong>💡 解析：</strong><br>" + currentQuestionData.explain;
        explainBox.style.display = 'block';
    }
    
    if (isCorrect) sessionCorrect++;
    document.getElementById('session-score').innerText = `對: ${sessionCorrect} | 總: ${sessionTotal}`;

    if (localStorage.getItem('isRecordMode') !== 'false') {
        const formData = new FormData();
        formData.append('qid', currentId);
        formData.append('status', isCorrect ? 'correct' : 'wrong');
        fetch('api/record_answer.php', { method: 'POST', body: formData }).then(() => updateProgressUI());
    }
    
    document.getElementById('next-btn').style.display = 'block';
    document.getElementById('ai-btn').style.display = 'block';
}
function copyAndAskAI_Single() {
    const prompt = `我正在練習 IPAS 資訊安全初級題目，請幫我解析這題：\n\n題目：${currentQuestionData.question}\n選項：\nA. ${currentQuestionData.option_a}\nB. ${currentQuestionData.option_b}\nC. ${currentQuestionData.option_c}\nD. ${currentQuestionData.option_d}\n\n正確答案：${currentAns}\n我的選擇：${currentQuestionData.userChoice}\n\n請解釋為什麼答案是 ${currentAns}，並說明相關資安觀念。`;
    copyToClipboard(prompt);
}

function toggleSettings() {
    const p = document.getElementById('settingsPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

function startCustomExam() {
    const selectedMainCats = JSON.parse(localStorage.getItem('selectedCats')) || allCategories;
    let subCats = [];
    selectedMainCats.forEach(main => {
        if(categoryMap[main]) subCats = subCats.concat(categoryMap[main]);
    });

    const params = new URLSearchParams({
        type: 'custom', 
        cats: subCats.join(','),
        limit: document.getElementById('customCount').value,
        time: document.getElementById('customTime').value
    });
    window.location.href = `exam.php?${params.toString()}`;
}

async function updateProgressUI() {
    try {
        const res = await fetch('api/get_progress.php');
        const data = await res.json();
        const container = document.getElementById('progressContent');
        if(container) {
            container.innerHTML = data.map(item => `
                <div class="progress-item">
                    <div class="progress-label"><span>${item.category}</span><span>${item.mastered}/${item.total}</span></div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${item.percent}%"></div></div>
                </div>`).join('');
        }
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => { loadSettings(); updateProgressUI(); fetchNext(); });