<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$sql = "SELECT id, title, author, cover, file, addedBy FROM books";
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
            'addedBy' => $row['addedBy'],
        ];
    }
}

echo json_encode($books);

$conn->close();
?>
