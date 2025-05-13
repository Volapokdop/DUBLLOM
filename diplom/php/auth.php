<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        registerUser();
        break;
    case 'login':
        loginUser();
        break;
    case 'logout':
        logoutUser();
        break;
    case 'check':
        checkAuth();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
}

function registerUser() {
    global $pdo;

    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Валидация
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Все поля обязательны для заполнения']);
        return;
    }

    if (strlen($username) < 3) {
        echo json_encode(['success' => false, 'message' => 'Имя пользователя должно содержать минимум 3 символа']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Некорректный email']);
        return;
    }

    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Пароль должен содержать минимум 6 символов']);
        return;
    }

    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Пользователь с таким именем или email уже существует']);
        return;
    }

    // Хеширование пароля
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Создание пользователя
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $result = $stmt->execute([$username, $email, $passwordHash]);

    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка при регистрации']);
    }
}

function loginUser() {
    global $pdo;

    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Все поля обязательны для заполнения']);
        return;
    }

    // Поиск пользователя
    $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Неверное имя пользователя или пароль']);
        return;
    }

    // Установка сессии
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];

    echo json_encode(['success' => true]);
}

function logoutUser() {
    session_unset();
    session_destroy();
    echo json_encode(['success' => true]);
}

function checkAuth() {
    if (isset($_SESSION['user_id'], $_SESSION['username'])) {
        echo json_encode([
            'loggedIn' => true,
            'username' => $_SESSION['username']
        ]);
    } else {
        echo json_encode(['loggedIn' => false]);
    }
}
?>
