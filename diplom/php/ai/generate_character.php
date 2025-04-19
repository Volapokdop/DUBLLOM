<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

// Получаем промпт от пользователя
$data = json_decode(file_get_contents('php://input'), true);
$prompt = trim($data['prompt']);

if (empty($prompt)) {
    echo json_encode(["status" => "error", "message" => "Запрос не может быть пустым"]);
    exit;
}

// URL вашего локального сервера Ollama
$ollamaUrl = 'http://localhost:11434/api/generate';

// Подготовка запроса для Ollama
$requestData = [
    'model' => 'gemma3:1b',
    'prompt' => "Сгенерируй персонажа для книги на основе следующего описания: $prompt.
                Ответ должен быть в формате JSON строго с полями: name, age, birthday, gender, description, biography.
                Возраст - число. Дата рождения в формате 'DD.MM.YYYY'. Пол только 'male' или 'female'.
                Пример ответа: {\"name\":\"John\",\"age\":30,\"birthday\":\"15.05.1993\",\"gender\":\"male\",\"description\":\"Высокий брюнет\",\"biography\":\"Родился в маленьком городке\"}",
    'stream' => false,
    'format' => 'json'
];

// Отправка запроса к Ollama
$ch = curl_init($ollamaUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($requestData)
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($httpCode !== 200) {
    echo json_encode([
        "status" => "error",
        "message" => "Ошибка при обращении к Ollama API",
        "details" => curl_error($ch)
    ]);
    exit;
}

curl_close($ch);

// Обработка ответа от Ollama
$responseData = json_decode($response, true);

if (!isset($responseData['response'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Некорректный ответ от Ollama",
        "response" => $responseData
    ]);
    exit;
}

// Парсим JSON ответ от модели
$characterData = json_decode($responseData['response'], true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "status" => "error",
        "message" => "Модель вернула некорректный JSON",
        "raw_response" => $responseData['response']
    ]);
    exit;
}

// Проверка обязательных полей
$requiredFields = ['name', 'age', 'birthday', 'gender', 'description', 'biography'];
foreach ($requiredFields as $field) {
    if (!isset($characterData[$field])) {
        echo json_encode([
            "status" => "error",
            "message" => "В ответе отсутствует обязательное поле: $field",
            "data" => $characterData
        ]);
        exit;
    }
}

// Возвращаем сгенерированного персонажа
echo json_encode(["status" => "success", "character" => $characterData]);
?>
