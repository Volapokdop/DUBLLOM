<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

$uploadDir = "uploads/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['cover']) && isset($_FILES['file'])) {
    $title = $_POST['title'];
    $author = $_POST['author'];
    $genre = $_POST['genre'];
    $language = $_POST['language'];
    $annotation = $_POST['annotation'];
    $ageRestriction = $_POST['age_restriction'] ?? '0';
    $copyright = $_POST['copyright'] ?? 'Все права защищены';
    $addedBy = $_POST['addedBy'];

    $coverName = basename($_FILES['cover']['name']);
    $coverPath = $uploadDir . $coverName;

    if (move_uploaded_file($_FILES['cover']['tmp_name'], $coverPath)) {
        $fileName = basename($_FILES['file']['name']);
        $filePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
            $stmt = $conn->prepare("INSERT INTO books (title, author, genre, language, cover, file, annotation, age_restriction, copyright, addedBy)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssssssss", $title, $author, $genre, $language, $coverPath, $filePath,
                            $annotation, $ageRestriction, $copyright, $addedBy);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Книга успешно добавлена"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Ошибка: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["status" => "error", "message" => "Ошибка при загрузке текстового файла"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Ошибка при загрузке обложки"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Файлы не были загружены"]);
}

$conn->close();
?>
