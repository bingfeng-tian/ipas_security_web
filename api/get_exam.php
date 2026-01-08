<?php
require_once '../config/db.php';

$type = isset($_GET['type']) ? $_GET['type'] : 'full';

// 欄位對應
$cols = "id, category, question, A as option_a, B as option_b, C as option_c, D as option_d, answer, explanation as 'explain', photo as image";

if ($type === 'mini') {
    // 小測驗隨機 20 題
    $sql = "SELECT $cols FROM questions ORDER BY RANDOM() LIMIT 20";
} else {
    // 全真模考：管理組 (科目一) 25 題，技術組 (科目二) 25 題
    $mgmt_list = "'標準與法規類','資料安全類','基礎知識類'";
    $tech_list = "'實務應用類','攻擊與防禦類','加密與認證類','網路安全類','雲端安全類','系統安全類'";

    $sql = "
        SELECT * FROM (SELECT $cols FROM questions WHERE category IN ($mgmt_list) ORDER BY RANDOM() LIMIT 25)
        UNION ALL
        SELECT * FROM (SELECT $cols FROM questions WHERE category IN ($tech_list) ORDER BY RANDOM() LIMIT 25)
    ";
}

try {
    $stmt = $pdo->query($sql);
    $questions = $stmt->fetchAll();
    header('Content-Type: application/json');
    echo json_encode($questions);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}