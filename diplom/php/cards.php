<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    require_once 'db.php';

    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Требуется авторизация', 401);
    }

    $userId = $_SESSION['user_id'];
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'list':
            $stmt = $pdo->prepare("SELECT id, type, title FROM cards WHERE user_id = ? ORDER BY title");
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'get':
            $cardId = $_GET['id'] ?? 0;
            $stmt = $pdo->prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?");
            $stmt->execute([$cardId, $userId]);
            $card = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$card) {
                throw new Exception('Карточка не найдена', 404);
            }

            // Инициализируем массив связей, даже если запрос не вернет результатов
            $card['relations'] = [];

            // Только если карточка существует какое-то время, ищем связи
            if ($cardId > 0) {
                $relationsStmt = $pdo->prepare("
                    SELECT cr.relation_type, cr.notes, c.id, c.type, c.title
                    FROM card_relations cr
                    JOIN cards c ON cr.card_to = c.id
                    WHERE cr.card_from = ? AND cr.user_id = ?
                    UNION
                    SELECT cr.relation_type, cr.notes, c.id, c.type, c.title
                    FROM card_relations cr
                    JOIN cards c ON cr.card_from = c.id
                    WHERE cr.card_to = ? AND cr.user_id = ?
                ");
                $relationsStmt->execute([$cardId, $userId, $cardId, $userId]);
                $card['relations'] = $relationsStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode($card);
            break;

        case 'save':
            $cardId = $_POST['id'] ?? null;
            $type = $_POST['type'] ?? 'character';
            $title = trim($_POST['title'] ?? '');
            $content = $_POST['content'] ?? '';
            $fields = $_POST['fields'] ?? '{}'; // Добавлено получение fields

            if (empty($title)) {
                throw new Exception('Название не может быть пустым', 400);
            }

            if ($cardId) {
                $stmt = $pdo->prepare("UPDATE cards SET type = ?, title = ?, content = ?, fields = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
                $result = $stmt->execute([$type, $title, $content, $fields, $cardId, $userId]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO cards (user_id, type, title, content, fields) VALUES (?, ?, ?, ?, ?)");
                $result = $stmt->execute([$userId, $type, $title, $content, $fields]);
                $cardId = $pdo->lastInsertId();
            }

            echo json_encode([
                'success' => $result,
                'id' => (int)$cardId,
                'message' => $result ? 'Карточка сохранена' : 'Ошибка сохранения'
            ]);
            break;

        case 'delete':
            $cardId = $_GET['id'] ?? 0;
            $stmt = $pdo->prepare("DELETE FROM cards WHERE id = ? AND user_id = ?");
            $result = $stmt->execute([$cardId, $userId]);

            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Карточка удалена' : 'Ошибка удаления'
            ]);
            break;

        // В cards.php добавим в switch-case:
        case 'search':
            $query = $_GET['query'] ?? '';
            $type = $_GET['type'] ?? '';

            $sql = "SELECT id, type, title FROM cards WHERE user_id = ? AND title LIKE ?";
            $params = [$userId, "%$query%"];

            if ($type) {
                $sql .= " AND type = ?";
                $params[] = $type;
            }

            $sql .= " ORDER BY title LIMIT 20";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'add-relation':
            $cardFrom = $_POST['card_from'] ?? 0;
            $cardTo = $_POST['card_to'] ?? 0;
            $relationType = $_POST['relation_type'] ?? '';
            $notes = $_POST['notes'] ?? '';

            if (empty($relationType)) {
                throw new Exception('Тип связи не может быть пустым', 400);
            }

            $stmt = $pdo->prepare("INSERT INTO card_relations (user_id, card_from, card_to, relation_type, notes) VALUES (?, ?, ?, ?, ?)");
            $result = $stmt->execute([$userId, $cardFrom, $cardTo, $relationType, $notes]);

            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Связь добавлена' : 'Ошибка добавления связи'
            ]);
            break;

        case 'remove-relation':
            $relationId = $_GET['id'] ?? 0;
            $stmt = $pdo->prepare("DELETE FROM card_relations WHERE id = ? AND user_id = ?");
            $result = $stmt->execute([$relationId, $userId]);

            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Связь удалена' : 'Ошибка удаления связи'
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
