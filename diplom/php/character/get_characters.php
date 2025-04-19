<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Пользователь не авторизован"]);
    exit;
}

$userId = $_SESSION['user_id'];
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

// В части, где формируется запрос к Ollama, укажите нужный формат даты:
$requestData = [
    'model' => 'gemma3:1b',
    'prompt' => "Сгенерируй персонажа для книги на основе следующего описания: $prompt.
                Ответ должен быть в формате JSON строго с полями: name, age, birthday, gender, description, biography.
                Возраст - число. Дата рождения в формате 'YYYY-MM-DD'. Пол только 'male' или 'female'.
                Пример ответа: {\"name\":\"John\",\"age\":30,\"birthday\":\"1993-05-15\",\"gender\":\"male\",\"description\":\"Высокий брюнет\",\"biography\":\"Родился в маленьком городке\"}",
    'stream' => false,
    'format' => 'json'
];

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
