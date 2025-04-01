<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$uploadDir = "../uploads/characters/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['image'])) {
    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = uniqid() . '.' . $extension;
    $imagePath = $uploadDir . $imageName;

    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($_FILES['image']['type'], $allowedTypes)) {
        echo json_encode(["status" => "error", "message" => "Допустимы только изображения JPG, PNG или GIF"]);
        exit;
    }

    if (move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
        $stmt = $conn->prepare("INSERT INTO characters (name, age, birthday, gender, image, description, biography, user_id)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->bind_param("sisssssi",
            $_POST['name'],
            $_POST['age'],
            $_POST['birthday'],
            $_POST['gender'],
            $imagePath,
            $_POST['description'],
            $_POST['biography'],
            $_SESSION['user_id']
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Персонаж успешно добавлен"]);
        } else {
            unlink($imagePath);
            echo json_encode(["status" => "error", "message" => "Ошибка: " . $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Ошибка при загрузке изображения"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Изображение не загружено"]);
}

$conn->close();
?>
