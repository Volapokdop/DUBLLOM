<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_GET['id'])) {
    echo json_encode(["error" => "Не указан ID персонажа"]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Пользователь не авторизован"]);
    exit;
}

$characterId = (int)$_GET['id'];
$userId = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT * FROM characters WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $characterId, $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Персонаж не найден или нет прав доступа"]);
    exit;
}

$character = $result->fetch_assoc();

// Очищаем путь к изображению для безопасности
$character['image'] = str_replace(['./', '../'], '', $character['image']);
$character['image'] = 'uploads/characters/' . basename($character['image']);

echo json_encode($character);

$stmt->close();
$conn->close();
?>
