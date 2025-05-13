<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    require_once 'db.php';

    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Требуется авторизация', 401);
    }

    $action = $_GET['action'] ?? '';
    $userId = $_SESSION['user_id'];

    switch ($action) {
        case 'list':
            $stmt = $pdo->prepare("SELECT id, title FROM texts WHERE user_id = ? ORDER BY updated_at DESC");
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'get':
            $textId = $_GET['id'] ?? 0;
            $stmt = $pdo->prepare("SELECT id, title, content FROM texts WHERE id = ? AND user_id = ?");
            $stmt->execute([$textId, $userId]);
            $text = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$text) {
                throw new Exception('Текст не найден', 404);
            }

            echo json_encode($text);
            break;

        case 'save':
            $title = trim($_POST['title'] ?? '');
            $content = $_POST['content'] ?? '';
            $textId = $_POST['id'] ?? null;

            if (empty($title)) {
                throw new Exception('Название не может быть пустым', 400);
            }

            if ($textId) {
                $stmt = $pdo->prepare("UPDATE texts SET title = ?, content = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
                $result = $stmt->execute([$title, $content, $textId, $userId]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO texts (user_id, title, content) VALUES (?, ?, ?)");
                $result = $stmt->execute([$userId, $title, $content]);
                $textId = $pdo->lastInsertId();
            }

            echo json_encode([
                'success' => $result,
                'id' => $textId,
                'message' => $result ? 'Текст сохранен' : 'Ошибка сохранения'
            ]);
            break;

        case 'delete':
            $textId = $_GET['id'] ?? 0;
            $stmt = $pdo->prepare("DELETE FROM texts WHERE id = ? AND user_id = ?");
            $result = $stmt->execute([$textId, $userId]);

            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Текст удален' : 'Ошибка удаления'
            ]);
            break;

        default:
            throw new Exception('Неизвестное действие', 400);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка базы данных: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code($e->getCode() >= 400 ? $e->getCode() : 500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
