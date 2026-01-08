<?php
require_once '../config/db.php';

$cats = isset($_GET['cats']) ? $_GET['cats'] : '';
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

$cols = "id, category, question, 
         A as option_a, B as option_b, C as option_c, D as option_d, 
         answer, explanation as 'explain', photo as image";

$catList = [];
if (!empty($cats)) {
    $catList = explode(',', $cats);
}

if (empty($catList)) {
    $sql = "SELECT $cols FROM questions ORDER BY RANDOM() LIMIT $limit";
    $params = [];
} else {
    $placeholders = implode(',', array_fill(0, count($catList), '?'));
    $sql = "SELECT $cols FROM questions WHERE category IN ($placeholders) ORDER BY RANDOM() LIMIT $limit";
    $params = $catList;
}

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $questions = $stmt->fetchAll();

    header('Content-Type: application/json');
    echo json_encode($questions);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>