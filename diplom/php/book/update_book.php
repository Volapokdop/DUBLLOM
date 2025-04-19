<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$uploadDir = "uploads/";
$bookId = $_GET['id'];

// Получаем текущие данные книги
$sql = "SELECT * FROM books WHERE id = $bookId";
$result = $conn->query($sql);
$book = $result->fetch_assoc();

// Подготовка данных
$title = $_POST['title'] ?? $book['title'];
$author = $_POST['author'] ?? $book['author'];
$genre = $_POST['genre'] ?? $book['genre'];
$language = $_POST['language'] ?? $book['language'];
$annotation = $_POST['annotation'] ?? $book['annotation'];
$ageRestriction = $_POST['age_restriction'] ?? $book['age_restriction'];
$copyright = $_POST['copyright'] ?? $book['copyright'];
$addedBy = $_POST['addedBy'] ?? $book['addedBy'];

// Обработка обложки
$coverPath = $_POST['currentCover'] ?? $book['cover'];
if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
    $coverName = basename($_FILES['cover']['name']);
    $coverPath = $uploadDir . $coverName;
    move_uploaded_file($_FILES['cover']['tmp_name'], $coverPath);
}

// Обработка файла
$filePath = $_POST['currentFile'] ?? $book['file'];
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $fileName = basename($_FILES['file']['name']);
    $filePath = $uploadDir . $fileName;
    move_uploaded_file($_FILES['file']['tmp_name'], $filePath);
}

$stmt = $conn->prepare("UPDATE books SET
    title = ?,
    author = ?,
    genre = ?,
    language = ?,
    cover = ?,
    file = ?,
    annotation = ?,
    age_restriction = ?,
    copyright = ?,
    addedBy = ?
    WHERE id = ?");

$stmt->bind_param("ssssssssssi", $title, $author, $genre, $language, $coverPath,
                 $filePath, $annotation, $ageRestriction, $copyright, $addedBy, $bookId);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Книга успешно обновлена"]);
} else {
    echo json_encode(["status" => "error", "message" => "Ошибка: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
