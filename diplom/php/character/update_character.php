<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

if (!isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "Не указан ID персонажа"]);
    exit;
}

$characterId = (int)$_GET['id'];
$userId = (int)$_SESSION['user_id'];

// Проверяем, принадлежит ли персонаж пользователю
$checkStmt = $conn->prepare("SELECT id, image FROM characters WHERE id = ? AND user_id = ?");
$checkStmt->bind_param("ii", $characterId, $userId);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Персонаж не найден или нет прав доступа"]);
    exit;
}

$character = $checkResult->fetch_assoc();
$oldImagePath = $character['image'];

// Проверяем и преобразуем дату
$birthday = $_POST['birthday'] ?? '';
if (strpos($birthday, '.') !== false) {
    // Преобразуем из DD.MM.YYYY в YYYY-MM-DD
    $parts = explode('.', $birthday);
    if (count($parts) === 3) {
        $birthday = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
    }
}

// Обработка загрузки нового изображения
$imagePath = $oldImagePath;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = "../../uploads/characters/";
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = uniqid() . '.' . $extension;
    $newImagePath = $uploadDir . $imageName;

    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($_FILES['image']['type'], $allowedTypes)) {
        echo json_encode(["status" => "error", "message" => "Допустимы только изображения JPG, PNG или GIF"]);
        exit;
    }

    if (move_uploaded_file($_FILES['image']['tmp_name'], $newImagePath)) {
        $imagePath = $newImagePath;
        // Удаляем старое изображение, если оно существует и это не то же самое изображение
        if ($oldImagePath && $oldImagePath !== $newImagePath && file_exists($oldImagePath)) {
            unlink($oldImagePath);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Ошибка при загрузке изображения"]);
        exit;
    }
}

try {
    $stmt = $conn->prepare("UPDATE characters SET
                          name = ?,
                          age = ?,
                          birthday = ?,
                          gender = ?,
                          image = ?,
                          description = ?,
                          biography = ?
                          WHERE id = ?");

    $stmt->bind_param("sisssssi",
        $_POST['name'],
        $_POST['age'],
        $birthday,
        $_POST['gender'],
        $imagePath,
        $_POST['description'],
        $_POST['biography'],
        $characterId
    );

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Персонаж успешно обновлен"]);
    } else {
        // Если было новое изображение, но запрос не выполнился - удаляем его
        if ($imagePath !== $oldImagePath && file_exists($imagePath)) {
            unlink($imagePath);
        }
        echo json_encode(["status" => "error", "message" => "Ошибка: " . $stmt->error]);
    }
    $stmt->close();
} catch (Exception $e) {
    // Если было новое изображение, но произошла ошибка - удаляем его
    if ($imagePath !== $oldImagePath && file_exists($imagePath)) {
        unlink($imagePath);
    }
    echo json_encode(["status" => "error", "message" => "Ошибка: " . $e->getMessage()]);
}

$conn->close();
?>
