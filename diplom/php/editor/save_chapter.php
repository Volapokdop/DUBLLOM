<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$chapterId = $input['chapterId'] ?? null;
$content = $input['content'] ?? '';
$userId = $_SESSION['user_id'];

try {
    // Проверка прав доступа
    $stmt = $conn->prepare("SELECT c.id
                           FROM book_chapters c
                           JOIN user_books b ON c.book_id = b.id
                           WHERE c.id = ? AND b.user_id = ?");
    $stmt->bind_param("ii", $chapterId, $userId);
    $stmt->execute();

    if (!$stmt->get_result()->fetch_assoc()) {
        throw new Exception("Нет доступа к главе");
    }

    // Сохранение контента
    $stmt = $conn->prepare("UPDATE book_chapters SET content = ? WHERE id = ?");
    $stmt->bind_param("si", $content, $chapterId); // "s" поддерживает большие строки

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Глава сохранена"]);
    } else {
        throw new Exception("Ошибка сохранения: " . $conn->error);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$stmt->close();
$conn->close();
?>
