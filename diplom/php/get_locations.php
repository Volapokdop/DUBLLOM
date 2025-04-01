<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$userId = $_SESSION['user_id'];
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

$sql = "SELECT * FROM locations WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$locations = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $locationId = $row['id'];
        $events = [];

        $sqlEvents = "SELECT e.id, e.title, e.image, e.description
                     FROM location_events le
                     JOIN events e ON le.event_id = e.id
                     WHERE le.location_id = ?";
        $stmtEvents = $conn->prepare($sqlEvents);
        $stmtEvents->bind_param("i", $locationId);
        $stmtEvents->execute();
        $eventsResult = $stmtEvents->get_result();

        while ($event = $eventsResult->fetch_assoc()) {
            if (!empty($event['image'])) {
                $cleanPath = str_replace(['./', '../'], '', $event['image']);
                $event['image'] = '/uploads/events/' . basename($cleanPath);
            }
            $events[] = $event;
        }

        $row['events'] = $events;

        if (!empty($row['image'])) {
            $cleanPath = str_replace(['./', '../'], '', $row['image']);
            $row['image'] = '/uploads/locations/' . basename($cleanPath);
        }

        $locations[] = $row;
        $stmtEvents->close();
    }
}

echo json_encode($locations);

$stmt->close();
$conn->close();
?>
