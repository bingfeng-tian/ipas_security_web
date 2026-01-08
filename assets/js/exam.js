let examQuestions = [], currentIndex = 0, userAnswers = [], timeLeft = 0, timerInterval = null, totalQuestions = 0;

async function initExam() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'full';
    let apiUrl = '';

    if (type === 'custom') {
        const cats = urlParams.get('cats');
        const limit = urlParams.get('limit') || 10;
        timeLeft = parseInt(urlParams.get('time') || 40) * 60;
        apiUrl = `api/get_custom_exam.php?cats=${encodeURIComponent(cats)}&limit=${limit}`;
    } else if (type === 'mini') {
        timeLeft = 15 * 60; 
        apiUrl = 'api/get_exam.php?type=mini';
    } else {
        // [修改 1] 全真模考時間改為 60 分鐘 (符合 IPAS 50 題 60 分鐘標準)
        timeLeft = 60 * 60; 
        apiUrl = 'api/get_exam.php?type=full';
    }

    try {
        const res = await fetch(apiUrl);
        examQuestions = await res.json();
        
        if (!examQuestions || examQuestions.length === 0) {
            alert("題目載入失敗或範圍內無題目！"); window.location.href = 'index.php'; return;
        }

        totalQuestions = examQuestions.length;
        renderQuestion();
        startTimer();
    } catch (e) {
        console.error("API 錯誤:", e);
        alert("無法連接伺服器");
    }
}

function renderQuestion() {
    const q = examQuestions[currentIndex];
    
    document.querySelectorAll('.opt-btn').forEach(btn => {
        btn.style.background = ''; 
        btn.style.color = '';
        btn.style.border = '';
    });

    document.getElementById('category').innerText = q.category;
    document.getElementById('exam-progress').innerText = `題號 ${currentIndex + 1} / ${totalQuestions}`;
    document.getElementById('question').innerText = q.question;
    
    const imgContainer = document.getElementById('q-image-container');
    const imgTag = document.getElementById('q-image');
    if (q.image && q.image.trim() !== "") {
        imgTag.src = `assets/images/${q.image}`;
        imgContainer.style.display = 'block';
    } else {
        imgContainer.style.display = 'none';
    }

    document.getElementById('optA').innerText = "A. " + q.option_a;
    document.getElementById('optB').innerText = "B. " + q.option_b;
    document.getElementById('optC').innerText = "C. " + q.option_c;
    document.getElementById('optD').innerText = "D. " + q.option_d;

    if (userAnswers[currentIndex]) {
        highlightSelection(userAnswers[currentIndex]);
    }
}

function selectOption(choice) {
    if (userAnswers[currentIndex] === choice) {
        goToNextQuestion();
    } else {
        userAnswers[currentIndex] = choice;
        highlightSelection(choice);
    }
}

function goToNextQuestion() {
    if (currentIndex < totalQuestions - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        finishExam();
    }
}

function highlightSelection(choice) {
    document.querySelectorAll('.opt-btn').forEach(btn => {
        btn.style.background = ''; 
        btn.style.color = '';
        btn.style.border = '';
    });

    const map = { 'A': 'optA', 'B': 'optB', 'C': 'optC', 'D': 'optD' };
    const selectedBtn = document.getElementById(map[choice]);
    if (selectedBtn) {
        selectedBtn.style.background = '#007AFF';
        selectedBtn.style.color = 'white';
        selectedBtn.style.border = '2px solid #005bb5';
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) { clearInterval(timerInterval); finishExam(); return; }
        timeLeft--;
        const min = Math.floor(timeLeft / 60), sec = timeLeft % 60;
        document.getElementById('timer').innerText = `${min}:${sec < 10 ? '0'+sec : sec}`;
        if(timeLeft < 180) document.getElementById('timer').style.color = 'red';
    }, 1000);
}

function finishExam() {
    clearInterval(timerInterval);
    let correctCount = 0, reviewHtml = '';
    
    // ... (中間迴圈統計分數與產生 HTML 保持不變) ...

    const card = document.getElementById('exam-card');
    const panel = document.getElementById('result-panel');
    const reviewList = document.getElementById('review-list');
    
    if (panel && reviewList) {
        card.style.display = 'none';
        panel.style.display = 'block';
        document.getElementById('result-score').innerText = `${correctCount} / ${totalQuestions}`;
        reviewList.innerHTML = reviewHtml;
        
        // [修改 2] 及格標準改為 70% (IPAS 標準)
        const isPassed = correctCount >= Math.ceil(totalQuestions * 0.70);
        
        const statusEl = document.getElementById('result-status');
        statusEl.innerText = isPassed ? "🎉 恭喜及格！" : "❌ 尚未及格";
        statusEl.style.color = isPassed ? "#34C759" : "#FF3B30";
        window.scrollTo(0, 0);
    } else {
        console.error("找不到 result-panel");
        alert("測驗結束，但無法顯示結果面板");
    }
}

/**
 * 產生 Prompt 並呼叫 utils.js 中的 copyToClipboard
 */
function copyAndAskAI_Exam(q, a, b, c, d, userAns, correctAns) {
    // [修改 3] 更新 AI 提示詞 Context
    const prompt = `我正在檢討 IPAS 資訊安全初級考試錯題，請幫我解析：\n\n題目：${q}\n選項：\nA. ${a}\nB. ${b}\nC. ${c}\nD. ${d}\n\n正確答案：${correctAns}\n我的選擇：${userAns}\n\n請解釋為什麼答案是 ${correctAns}，以及為什麼我選的答案不正確。`;
    copyToClipboard(prompt);
}

document.addEventListener('DOMContentLoaded', initExam);