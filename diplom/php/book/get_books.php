<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$sql = "SELECT id, title, author, genre, language, cover, file, annotation,
               age_restriction, copyright, addedBy, status, views
        FROM books";
$result = $conn->query($sql);

$books = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $books[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'author' => $row['author'],
            'genre' => $row['genre'],
            'language' => $row['language'],
            'cover' => $row['cover'],
            'file' => $row['file'],
            'annotation' => $row['annotation'],
            'age_restriction' => $row['age_restriction'],
            'copyright' => $row['copyright'],
            'addedBy' => $row['addedBy'],
            'status' => $row['status'],
            'views' => $row['views']
        ];
    }
}

echo json_encode($books);

$conn->close();
?>
