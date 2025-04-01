<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$uploadDir = "../uploads/events/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (isset($_FILES['image'])) {
    $imageName = basename($_FILES['image']['name']);
    $imagePath = $uploadDir . $imageName;

    if (move_uploaded_file($_FILES['image']['tmp_name'], $imagePath)) {
        $stmt = $conn->prepare("INSERT INTO events (title, image, description, user_id) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("sssi", $_POST['title'], $imagePath, $_POST['description'], $_SESSION['user_id']);

        if ($stmt->execute()) {
            $eventId = $stmt->insert_id;

            // Добавляем участников
            if (!empty($_POST['participants'])) {
                $stmtParticipants = $conn->prepare("INSERT INTO event_participants (event_id, character_id) VALUES (?, ?)");

                foreach ($_POST['participants'] as $characterId) {
                    $stmtParticipants->bind_param("ii", $eventId, $characterId);
                    $stmtParticipants->execute();
                }
                $stmtParticipants->close();
            }

            echo json_encode(["status" => "success", "message" => "Событие успешно добавлено"]);
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
