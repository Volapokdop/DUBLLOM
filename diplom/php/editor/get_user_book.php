<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id']) || !isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "Неверные параметры"]);
    exit;
}

$bookId = $_GET['id'];
$userId = $_SESSION['user_id'];

try {
    // Проверяем права доступа к книге
    $stmt = $conn->prepare("SELECT id, title FROM user_books WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $bookId, $userId);
    $stmt->execute();
    $book = $stmt->get_result()->fetch_assoc();

    if (!$book) {
        throw new Exception("Книга не найдена или нет доступа");
    }

    // Получаем главы книги
    $stmt = $conn->prepare("SELECT id, title FROM book_chapters WHERE book_id = ? ORDER BY created_at ASC");
    $stmt->bind_param("i", $bookId);
    $stmt->execute();
    $chapters = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'id' => $book['id'],
        'title' => $book['title'],
        'chapters' => $chapters
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$stmt->close();
$conn->close();
?>
