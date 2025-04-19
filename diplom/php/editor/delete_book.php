<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$bookId = $input['bookId'] ?? null;
$userId = $_SESSION['user_id'];

try {
    // Проверяем права доступа к книге
    $stmt = $conn->prepare("SELECT id FROM user_books WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $bookId, $userId);
    $stmt->execute();

    if (!$stmt->get_result()->fetch_assoc()) {
        throw new Exception("Нет доступа к книге");
    }

    // Удаляем книгу (главы удалятся каскадно)
    $stmt = $conn->prepare("DELETE FROM user_books WHERE id = ?");
    $stmt->bind_param("i", $bookId);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success",
            "message" => "Книга удалена"
        ]);
    } else {
        throw new Exception("Ошибка удаления книги");
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$stmt->close();
$conn->close();
?>
