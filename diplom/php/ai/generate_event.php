<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Необходима авторизация"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$prompt = trim($data['prompt']);
$participantIds = $data['participant_ids'] ?? [];

if (empty($prompt)) {
    echo json_encode(["status" => "error", "message" => "Запрос не может быть пустым"]);
    exit;
}

// Получаем информацию о выбранных участниках из базы данных
$participantsInfo = [];
if (!empty($participantIds)) {
    $placeholders = implode(',', array_fill(0, count($participantIds), '?'));
    $stmt = $conn->prepare("SELECT id, name, description FROM characters WHERE id IN ($placeholders)");
    $stmt->bind_param(str_repeat('i', count($participantIds)), ...$participantIds);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $participantsInfo[] = $row;
    }
    $stmt->close();
}

// Формируем детальный промпт для нейросети
$participantsText = '';
foreach ($participantsInfo as $participant) {
    $participantsText .= "Персонаж {$participant['name']}: {$participant['description']}\n";
}

$fullPrompt = "Сгенерируй событие для книги на основе следующего описания:\n\n" .
              "Участники:\n{$participantsText}\n" .
              "Дополнительное описание: {$prompt}\n\n" .
              "Ответ должен быть в формате JSON строго с полями: title, description.\n" .
              "Пример ответа: {\"title\":\"Битва при Черной горе\",\"description\":\"Эпическое сражение между орками и людьми у подножия Черной горы\"}";

$ollamaUrl = 'http://localhost:11434/api/generate';

$requestData = [
    'model' => 'gemma3:1b',
    'prompt' => $fullPrompt,
    'stream' => false,
    'format' => 'json'
];

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

$responseData = json_decode($response, true);

if (!isset($responseData['response'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Некорректный ответ от Ollama",
        "response" => $responseData
    ]);
    exit;
}

$eventData = json_decode($responseData['response'], true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "status" => "error",
        "message" => "Модель вернула некорректный JSON",
        "raw_response" => $responseData['response']
    ]);
    exit;
}

$requiredFields = ['title', 'description'];
foreach ($requiredFields as $field) {
    if (!isset($eventData[$field])) {
        echo json_encode([
            "status" => "error",
            "message" => "В ответе отсутствует обязательное поле: $field",
            "data" => $eventData
        ]);
        exit;
    }
}

// Добавляем ID участников в ответ
$eventData['participant_ids'] = $participantIds;

echo json_encode(["status" => "success", "event" => $eventData]);
?>
