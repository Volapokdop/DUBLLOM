<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$characterId = (int)$data['characterId'];
$userId = (int)$_SESSION['user_id'];

$checkSql = "SELECT id, image FROM characters WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($checkSql);
$stmt->bind_param("ii", $characterId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Персонаж не найден или нет прав доступа"]);
    exit;
}

$character = $result->fetch_assoc();

if (!empty($character['image']) && file_exists($character['image'])) {
    unlink($character['image']);
}

$deleteSql = "DELETE FROM characters WHERE id = ?";
$stmt = $conn->prepare($deleteSql);
$stmt->bind_param("i", $characterId);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Персонаж успешно удален"]);
} else {
    echo json_encode(["status" => "error", "message" => "Ошибка при удалении: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
