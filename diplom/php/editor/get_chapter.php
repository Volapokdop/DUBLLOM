<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id']) || !isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "Неверные параметры"]);
    exit;
}

$chapterId = $_GET['id'];
$userId = $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("SELECT c.id, c.title, c.content
                           FROM book_chapters c
                           JOIN user_books b ON c.book_id = b.id
                           WHERE c.id = ? AND b.user_id = ?");
    $stmt->bind_param("ii", $chapterId, $userId);
    $stmt->execute();
    $chapter = $stmt->get_result()->fetch_assoc();

    if (!$chapter) {
        throw new Exception("Глава не найдена или нет доступа");
    }

    // Возвращаем весь контент, даже если он очень большой
    echo json_encode([
        'id' => $chapter['id'],
        'title' => $chapter['title'],
        'content' => $chapter['content'] // Важно: не обрезаем!
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$stmt->close();
$conn->close();
?>
