<?php
require_once '../config/db.php';

$mode = isset($_GET['mode']) ? $_GET['mode'] : 'all';
$cats = isset($_GET['cats']) ? $_GET['cats'] : '';

$catList = [];
if ($cats) {
    $catList = explode(',', $cats);
}

// 欄位對應：將資料庫的 A, B, C, D 對應到前端預期的名稱
$cols = "id, category, question, 
         A as option_a, B as option_b, C as option_c, D as option_d, 
         answer, explanation as 'explain', photo as image";

if (!empty($catList)) {
    $placeholders = implode(',', array_fill(0, count($catList), '?'));
    
    if ($mode === 'weakness') {
        $sql = "SELECT $cols FROM questions q 
                JOIN question_stats s ON q.id = s.question_id 
                WHERE q.category IN ($placeholders) AND s.wrong_count > 0 
                ORDER BY RANDOM() LIMIT 1";
    } else {
        $sql = "SELECT $cols FROM questions WHERE category IN ($placeholders) ORDER BY RANDOM() LIMIT 1";
    }
} else {
    $sql = "SELECT $cols FROM questions ORDER BY RANDOM() LIMIT 1";
}

try {
    $stmt = $pdo->prepare($sql);
    if (!empty($catList)) {
        $stmt->execute($catList);
    } else {
        $stmt->execute();
    }
    
    $row = $stmt->fetch();

    header('Content-Type: application/json');
    if ($row) {
        // 補上前端預期但可能缺少的統計數據
        $row['correct_count'] = 0;
        $row['wrong_count'] = 0;
        echo json_encode($row);
    } else {
        echo json_encode(["status" => "empty", "message" => "該分類無題目"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>