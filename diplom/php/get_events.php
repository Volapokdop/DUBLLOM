<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$userId = $_SESSION['user_id'];
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

$sql = "SELECT * FROM events WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$events = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $eventId = $row['id'];
        $participants = [];

        $sqlParticipants = "SELECT c.id, c.name, c.image
                          FROM event_participants ep
                           JOIN characters c ON ep.character_id = c.id
                           WHERE ep.event_id = ?";
        $stmtParticipants = $conn->prepare($sqlParticipants);
        $stmtParticipants->bind_param("i", $eventId);
        $stmtParticipants->execute();
        $resultParticipants = $stmtParticipants->get_result();

        while ($participant = $resultParticipants->fetch_assoc()) {
            if (!empty($participant['image'])) {
                $cleanPath = str_replace(['./', '../'], '', $participant['image']);
                $participant['image'] ='../uploads/characters/' . basename($cleanPath);
            }
            $participants[] = $participant;
        }

        $row['participants'] = $participants;

        if (!empty($row['image'])) {
            $cleanPath = str_replace(['./', '../'], '', $row['image']);
            $row['image'] ='../uploads/events/' . basename($cleanPath);
        }

        $events[] = $row;
        $stmtParticipants->close();
    }
}

echo json_encode($events);

$stmt->close();
$conn->close();
?>
