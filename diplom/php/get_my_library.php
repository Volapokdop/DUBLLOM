<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$userId = $_GET['userId'];

$sql = "
    SELECT b.id, b.title, b.author, b.cover, b.file
    FROM books b
    JOIN user_library ul ON b.id = ul.book_id
    WHERE ul.user_id = $userId
";
$result = $conn->query($sql);

$books = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $books[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'author' => $row['author'],
            'cover' => $row['cover'],
            'file' => $row['file'],
        ];
    }
}

echo json_encode($books);

$conn->close();
?>
