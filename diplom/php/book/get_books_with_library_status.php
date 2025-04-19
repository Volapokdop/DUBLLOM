<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$userId = $_GET['userId'] ?? null;

// Получаем все книги с полной информацией
$booksQuery = $conn->query("
    SELECT
        id,
        title,
        author,
        genre,
        language,
        cover,
        file,
        annotation,
        age_restriction,
        copyright,
        addedBy,
        status,
        views,
        created_at
    FROM books
    WHERE status = 'published'
    ORDER BY created_at DESC
");
$books = [];
while ($row = $booksQuery->fetch_assoc()) {
    // Форматируем данные для вывода
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
        'views' => $row['views'],
        'created_at' => $row['created_at']
    ];
}

// Получаем книги пользователя из библиотеки
$userLibrary = [];
if ($userId) {
    $libraryQuery = $conn->prepare("
        SELECT
            b.id,
            b.title,
            b.author,
            b.genre,
            b.language,
            b.cover,
            b.file,
            b.addedBy
        FROM books b
        JOIN user_library ul ON b.id = ul.book_id
        WHERE ul.user_id = ?
        AND b.status = 'published'
    ");
    $libraryQuery->bind_param("i", $userId);
    $libraryQuery->execute();
    $result = $libraryQuery->get_result();

    while ($row = $result->fetch_assoc()) {
        $userLibrary[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'author' => $row['author'],
            'genre' => $row['genre'],
            'language' => $row['language'],
            'cover' => $row['cover'],
            'file' => $row['file'],
            'addedBy' => $row['addedBy']
        ];
    }
}

echo json_encode([
    'books' => $books,
    'library' => $userLibrary
], JSON_UNESCAPED_UNICODE);

$conn->close();
?>
