<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$uploadDir = "uploads/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['cover']) && isset($_FILES['file'])) {
    $title = $_POST['title'];
    $author = $_POST['author'];
    $addedBy = $_POST['addedBy'];

    $coverName = basename($_FILES['cover']['name']);
    $coverPath = $uploadDir . $coverName;

    if (move_uploaded_file($_FILES['cover']['tmp_name'], $coverPath)) {
        $fileName = basename($_FILES['file']['name']);
        $filePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $filePath)) {
            $sql = "INSERT INTO books (title, author, cover, file, addedBy) VALUES ('$title', '$author', '$coverPath', '$filePath', '$addedBy')";

            if ($conn->query($sql) === TRUE) {
                echo json_encode(["status" => "success", "message" => "Книга успешно добавлена"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Ошибка: " . $sql . "<br>" . $conn->error]);
            }
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
