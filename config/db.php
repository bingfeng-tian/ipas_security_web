<?php
// config/db.php
// 指定 SQLite 檔案路徑
$db_file = __DIR__ . '/../data/newdata_0424.db';

try {
    $pdo = new PDO("sqlite:" . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // 自動建立統計表 (因為您的檔案裡原本只有題目，沒有統計表)
    $pdo->exec("CREATE TABLE IF NOT EXISTS question_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER UNIQUE,
        correct_count INTEGER DEFAULT 0,
        wrong_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (PDOException $e) {
    die("資料庫連線失敗: " . $e->getMessage());
}
?>