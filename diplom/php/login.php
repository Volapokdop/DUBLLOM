<?php
header('Content-Type: application/json');
require_once '../config/database.php';

$inputUsername = $_POST['username'];
$inputPassword = $_POST['password'];

if (empty($inputUsername) || empty($inputPassword)) {
    echo json_encode(["status" => "error", "message" => "Пожалуйста, заполните все поля."]);
    exit;
}

$sql = "SELECT * FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $inputUsername);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();

    if (password_verify($inputPassword, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        error_log("User ID saved in session: " . $_SESSION['user_id']);
        echo json_encode(["status" => "success", "message" => "Вход выполнен успешно!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Неверный пароль."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Пользователь не найден."]);
}

$stmt->close();
$conn->close();
?>
