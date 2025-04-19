<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$uploadDir = "../../uploads/locations/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

try {
    $imagePath = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imageName = basename($_FILES['image']['name']);
        $imagePath = $uploadDir . $imageName;

        if (!move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
            throw new Exception("Ошибка при загрузке изображения");
        }
    }

    $stmt = $conn->prepare("INSERT INTO locations (title, image, description, user_id)
                           VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi",
        $_POST['title'],
        $imagePath,
        $_POST['description'],
        $_SESSION['user_id']
    );

    if ($stmt->execute()) {
        $locationId = $stmt->insert_id;

        // Добавляем связанные события
        if (!empty($_POST['events'])) {
            $stmtEvents = $conn->prepare("INSERT INTO location_events (location_id, event_id) VALUES (?, ?)");

            foreach ($_POST['events'] as $eventId) {
                $stmtEvents->bind_param("ii", $locationId, $eventId);
                $stmtEvents->execute();
            }
            $stmtEvents->close();
        }

        echo json_encode(["status" => "success", "message" => "Локация успешно добавлена"]);
    } else {
        if ($imagePath && file_exists($imagePath)) {
            unlink($imagePath);
        }
        echo json_encode(["status" => "error", "message" => "Ошибка: " . $stmt->error]);
    }
    $stmt->close();
} catch (Exception $e) {
    if (isset($imagePath) && $imagePath && file_exists($imagePath)) {
        unlink($imagePath);
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
