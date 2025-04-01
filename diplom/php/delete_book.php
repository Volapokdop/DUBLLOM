<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$bookId = $data['bookId'];
$addedBy = $data['addedBy'];

error_log("Полученные данные: bookId = $bookId, addedBy = $addedBy");

$sql = "SELECT addedBy FROM books WHERE id = $bookId";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    if ($row['addedBy'] === $addedBy) {
        $deleteSql = "DELETE FROM books WHERE id = $bookId";
        if ($conn->query($deleteSql)) {
            echo json_encode(["status" => "success", "message" => "Книга успешно удалена"]);
        } else {
            error_log("Ошибка SQL: " . $conn->error);
            echo json_encode(["status" => "error", "message" => "Ошибка при удалении книги: " . $conn->error]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Вы не можете удалить чужую книгу"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Книга не найдена"]);
}

$conn->close();
?>
