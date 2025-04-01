<?php
// Убедимся, что сессия стартовала
if (session_status() === PHP_SESSION_NONE) {
    if (!session_start()) {
        die("Не удалось начать сессию");
    }
}

$servername = "localhost";
$username = "mysql";
$password = ""; // Замените на реальный пароль
$dbname = "booksbd";

// Подключение к серверу MySQL
$conn = new mysqli($servername, $username, $password);

// Проверка подключения
if ($conn->connect_error) {
    die("Ошибка подключения: " . $conn->connect_error);
}

// Проверка существования БД
if (!$conn->select_db($dbname)) {
    die("База данных не найдена: " . $conn->error);
}

// Установка кодировки
$conn->set_charset("utf8mb4");
?>
