<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$uploadDir = "../../uploads/characters/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Проверяем и преобразуем дату
$birthday = $_POST['birthday'] ?? '';
if (strpos($birthday, '.') !== false) {
    // Преобразуем из DD.MM.YYYY в YYYY-MM-DD
    $parts = explode('.', $birthday);
    if (count($parts) === 3) {
        $birthday = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
    }
}

// Проверяем, загружено ли изображение
$imagePath = null;
if (isset($_FILES['image'])) {
    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = uniqid() . '.' . $extension;
    $imagePath = $uploadDir . $imageName;

    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($_FILES['image']['type'], $allowedTypes)) {
        echo json_encode(["status" => "error", "message" => "Допустимы только изображения JPG, PNG или GIF"]);
        exit;
    }

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
        echo json_encode(["status" => "error", "message" => "Ошибка при загрузке изображения"]);
        exit;
    }
}

try {
    $stmt = $conn->prepare("INSERT INTO characters (name, age, birthday, gender, image, description, biography, user_id)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->bind_param("sisssssi",
        $_POST['name'],
        $_POST['age'],
        $birthday, // Используем преобразованную дату
        $_POST['gender'],
        $imagePath,
        $_POST['description'],
        $_POST['biography'],
        $_SESSION['user_id']
    );

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Персонаж успешно добавлен"]);
    } else {
        if ($imagePath && file_exists($imagePath)) {
            unlink($imagePath);
        }
        echo json_encode(["status" => "error", "message" => "Ошибка: " . $stmt->error]);
    }
    $stmt->close();
} catch (Exception $e) {
    if ($imagePath && file_exists($imagePath)) {
        unlink($imagePath);
    }
    echo json_encode(["status" => "error", "message" => "Ошибка: " . $e->getMessage()]);
}

$conn->close();
?>
