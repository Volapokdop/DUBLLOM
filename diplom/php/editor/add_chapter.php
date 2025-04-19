<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$bookId = $input['bookId'] ?? null;
$title = $input['title'] ?? 'Новая глава';
$userId = $_SESSION['user_id'];

try {
    // Проверяем права доступа к книге
    $stmt = $conn->prepare("SELECT id FROM user_books WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $bookId, $userId);
    $stmt->execute();

    if (!$stmt->get_result()->fetch_assoc()) {
        throw new Exception("Нет доступа к книге");
    }

    // Добавляем главу
    $stmt = $conn->prepare("INSERT INTO book_chapters (book_id, title) VALUES (?, ?)");
    $stmt->bind_param("is", $bookId, $title);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success",
            "chapterId" => $stmt->insert_id,
            "message" => "Глава добавлена"
        ]);
    } else {
        throw new Exception("Ошибка добавления главы");
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$stmt->close();
$conn->close();
?>
