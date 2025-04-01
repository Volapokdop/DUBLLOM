<?php
header('Content-Type: application/json');
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Пользователь не авторизован"]);
    exit;
}

$userId = $_SESSION['user_id'];
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

$stmt = $conn->prepare("SELECT * FROM characters WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$characters = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $cleanPath = str_replace(['./', '../'], '', $row['image']);
        $row['image'] ='uploads/characters/' . basename($cleanPath);
        $characters[] = $row;
    }
}

echo json_encode($characters);

$stmt->close();
$conn->close();
?>
