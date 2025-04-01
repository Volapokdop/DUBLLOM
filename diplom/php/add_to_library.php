<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['userId'];
$bookId = $data['bookId'];

error_log("Полученные данные: userId = $userId, bookId = $bookId");

$checkBookSql = "SELECT id FROM books WHERE id = $bookId";
$checkBookResult = $conn->query($checkBookSql);

if ($checkBookResult->num_rows > 0) {
    $checkLibrarySql = "SELECT id FROM user_library WHERE user_id = $userId AND book_id = $bookId";
    $checkLibraryResult = $conn->query($checkLibrarySql);

    if ($checkLibraryResult->num_rows === 0) {
        $insertSql = "INSERT INTO user_library (user_id, book_id) VALUES ($userId, $bookId)";
        if ($conn->query($insertSql)) {
            echo json_encode(["status" => "success", "message" => "Книга добавлена в библиотеку"]);
        }
        else {
            error_log("Ошибка SQL: " . $conn->error);
            echo json_encode(["status" => "error", "message" => "Ошибка: " . $conn->error]);
        }
    }
    else {
        echo json_encode(["status" => "error", "message" => "Книга уже в вашей библиотеке"]);
    }
}
else {
    echo json_encode(["status" => "error", "message" => "Книга не найдена"]);
}

$conn->close();
?>
