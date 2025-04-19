<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$title = $input['title'] ?? 'Новая книга';
$content = $input['content'] ?? '';
$userId = $_SESSION['user_id'];

try {
    // 1. Создаём книгу
    $stmt = $conn->prepare("INSERT INTO user_books (user_id, title) VALUES (?, ?)");
    $stmt->bind_param("is", $userId, $title);

    if (!$stmt->execute()) {
        throw new Exception("Ошибка создания книги");
    }
    $bookId = $stmt->insert_id;

    // 2. Добавляем первую главу
    $stmt = $conn->prepare("INSERT INTO book_chapters (book_id, title, content) VALUES (?, 'Глава 1', ?)");
    $stmt->bind_param("is", $bookId, $content);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success",
            "bookId" => $bookId,
            "message" => "Книга создана"
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
