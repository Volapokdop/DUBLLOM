<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$uploadDir = "../uploads/locations/"; // Добавлен ../ в начало пути

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['image'])) {
    $imageName = basename($_FILES['image']['name']);
    $imagePath = $uploadDir . $imageName;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
        $title = $_POST['title'];
        $description = $_POST['description'];
        $userId = $_SESSION['user_id'];

        $stmt = $conn->prepare("INSERT INTO locations (title, image, description, user_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $title, $imagePath, $description, $userId);

        if ($stmt->execute()) {
            $locationId = $stmt->insert_id;

            if (isset($_POST['events']) && is_array($_POST['events'])) {
                $stmtEvents = $conn->prepare("INSERT INTO location_events (location_id, event_id) VALUES (?, ?)");

                foreach ($_POST['events'] as $eventId) {
                    if (!empty($eventId)) { // Проверка на пустое значение
                        $stmtEvents->bind_param("ii", $locationId, $eventId);
                        if (!$stmtEvents->execute()) {
                            error_log("Ошибка при добавлении связи локации и события: " . $stmtEvents->error);
                        }
                    }
                }

                $stmtEvents->close();
            }

            echo json_encode(["status" => "success", "message" => "Локация успешно добавлена"]);
        } else {
            unlink($imagePath); // Удаляем загруженное изображение при ошибке
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
