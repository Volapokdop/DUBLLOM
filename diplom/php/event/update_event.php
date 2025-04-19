<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

if (!isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "Не указан ID события"]);
    exit;
}

$eventId = (int)$_GET['id'];
$userId = (int)$_SESSION['user_id'];

// Проверяем, принадлежит ли событие пользователю
$checkStmt = $conn->prepare("SELECT id, image FROM events WHERE id = ? AND user_id = ?");
$checkStmt->bind_param("ii", $eventId, $userId);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Событие не найдено или нет прав доступа"]);
    exit;
}

$event = $checkResult->fetch_assoc();
$oldImagePath = $event['image'];

// Обработка загрузки нового изображения
$imagePath = $oldImagePath;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = "../../uploads/events/";
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $imageName = uniqid() . '.' . $extension;
    $newImagePath = $uploadDir . $imageName;

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
    // Обновляем основную информацию о событии
    $stmt = $conn->prepare("UPDATE events SET
                          title = ?,
                          image = ?,
                          description = ?
                          WHERE id = ?");

    $stmt->bind_param("sssi",
        $_POST['title'],
        $imagePath,
        $_POST['description'],
        $eventId
    );

    if ($stmt->execute()) {
        // Обновляем участников события
        // Сначала удаляем всех старых участников
        $deleteStmt = $conn->prepare("DELETE FROM event_participants WHERE event_id = ?");
        $deleteStmt->bind_param("i", $eventId);
        $deleteStmt->execute();
        $deleteStmt->close();

        // Добавляем новых участников
        if (!empty($_POST['participants'])) {
            $insertStmt = $conn->prepare("INSERT INTO event_participants (event_id, character_id) VALUES (?, ?)");
            foreach ($_POST['participants'] as $characterId) {
                $insertStmt->bind_param("ii", $eventId, $characterId);
                $insertStmt->execute();
            }
            $insertStmt->close();
        }

        echo json_encode(["status" => "success", "message" => "Событие успешно обновлено"]);
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
