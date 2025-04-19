<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

if (!isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "Не указан ID локации"]);
    exit;
}

$locationId = (int)$_GET['id'];
$userId = (int)$_SESSION['user_id'];

// Проверяем права доступа
$checkStmt = $conn->prepare("SELECT * FROM locations WHERE id = ? AND user_id = ?");
$checkStmt->bind_param("ii", $locationId, $userId);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Локация не найдена или нет прав доступа"]);
    exit;
}

$oldData = $checkResult->fetch_assoc();
$oldImage = $oldData['image'];

// Обработка нового изображения
$newImage = $oldImage;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = "../../uploads/locations/";
    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $newImagePath = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $newImagePath)) {
        $newImage = $newImagePath;
        // Удаляем старое изображение
        if ($oldImage && file_exists($oldImage)) {
            unlink($oldImage);
        }
    }
}

try {
    // Обновление основной информации
    $stmt = $conn->prepare("UPDATE locations SET
                          title = ?,
                          image = ?,
                          description = ?
                          WHERE id = ?");
    $stmt->bind_param("sssi",
        $_POST['title'],
        $newImage,
        $_POST['description'],
        $locationId
    );

    if ($stmt->execute()) {
        // Обновление связанных событий
        $conn->query("DELETE FROM location_events WHERE location_id = $locationId");

        if (!empty($_POST['events'])) {
            $insertStmt = $conn->prepare("INSERT INTO location_events (location_id, event_id) VALUES (?, ?)");
            foreach ($_POST['events'] as $eventId) {
                $insertStmt->bind_param("ii", $locationId, $eventId);
                $insertStmt->execute();
            }
        }

        echo json_encode(["status" => "success", "message" => "Локация обновлена"]);
    } else {
        if ($newImage !== $oldImage && file_exists($newImage)) {
            unlink($newImage);
        }
        echo json_encode(["status" => "error", "message" => "Ошибка обновления: " . $stmt->error]);
    }
} catch (Exception $e) {
    if ($newImage !== $oldImage && file_exists($newImage)) {
        unlink($newImage);
    }
    echo json_encode(["status" => "error", "message" => "Ошибка: " . $e->getMessage()]);
}

$conn->close();
?>
