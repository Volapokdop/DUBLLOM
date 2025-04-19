<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$bookId = $_GET['id'];

$sql = "SELECT * FROM books WHERE id = $bookId";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $book = $result->fetch_assoc();
    echo json_encode($book);
} else {
    echo json_encode(["status" => "error", "message" => "Книга не найдена"]);
}

$conn->close();
?>
