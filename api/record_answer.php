<?php
require_once '../config/db.php';

$qid = isset($_POST['qid']) ? intval($_POST['qid']) : 0;
$status = isset($_POST['status']) ? $_POST['status'] : '';

if ($qid > 0 && ($status == 'correct' || $status == 'wrong')) {
    try {
        // SQLite 的 UPSERT 語法 (需要 question_id 有 UNIQUE 約束，我們在 db.php 已經設定了)
        if ($status == 'correct') {
            $sql = "INSERT INTO question_stats (question_id, correct_count) VALUES (?, 1) 
                    ON CONFLICT(question_id) DO UPDATE SET correct_count = correct_count + 1";
        } else {
            $sql = "INSERT INTO question_stats (question_id, wrong_count) VALUES (?, 1) 
                    ON CONFLICT(question_id) DO UPDATE SET wrong_count = wrong_count + 1";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$qid]);

        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error"]);
}
?>