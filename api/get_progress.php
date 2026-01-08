<?php
require_once '../config/db.php';

// 定義 6 大單元及其包含的原始小類
$ui_categories = [
    '資安法規與標準' => ['標準與法規類', '資料安全類'],
    '資安基礎知識' => ['基礎知識類'],
    '資安實務應用' => ['實務應用類'],
    '攻擊防禦與加密' => ['攻擊與防禦類', '加密與認證類'],
    '網路與雲端安全' => ['網路安全類', '雲端安全類'],
    '系統安全技術' => ['系統安全類']
];

$progress = [];

foreach ($ui_categories as $ui_name => $sub_cats) {
    $cat_list = "'" . implode("','", $sub_cats) . "'";
    
    // 統計該 UI 單元的總題數
    $sql_total = "SELECT COUNT(*) as total FROM questions WHERE category IN ($cat_list)";
    $total = $pdo->query($sql_total)->fetch()['total'];
    
    // 統計該 UI 單元已精通的題數 (正確次數 > 0)
    $sql_mastered = "SELECT COUNT(*) as mastered FROM questions q 
                     JOIN question_stats s ON q.id = s.question_id 
                     WHERE q.category IN ($cat_list) AND s.correct_count > 0";
    $mastered = $pdo->query($sql_mastered)->fetch()['mastered'];
    
    $progress[] = [
        'category' => $ui_name,
        'mastered' => intval($mastered),
        'total' => intval($total),
        'percent' => ($total > 0) ? round(($mastered / $total) * 100, 1) : 0
    ];
}

header('Content-Type: application/json');
echo json_encode($progress);