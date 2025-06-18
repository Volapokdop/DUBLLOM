// src/components/utils/cardUtils.js

// Простая функция генерации уникального ID
const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Создание новой карточки
const createCard = (type, name, fields, workId) => {
  return {
    id: generateId(),
    name,
    fields: fields || [],
    type,
    usedIn: [workId],
    connections: [],
    position: { x: 100, y: 100 }
  };
};

// Обновление позиции карточки
const updateCardPosition = (cards, cardId, newPosition) => {
  return cards.map(card =>
    card.id === cardId ? { ...card, position: newPosition } : card
  );
};

// Добавление связи между двумя карточками
const connectCards = (cards, cardId1, cardId2, type) => {
  return cards.map(card => {
    if (card.id === cardId1 && !card.connections.some(c => c.id === cardId2 && c.type === type)) {
      return {
        ...card,
        connections: [...card.connections, { id: cardId2, type }]
      };
    } else if (card.id === cardId2 && !card.connections.some(c => c.id === cardId1 && c.type === type)) {
      return {
        ...card,
        connections: [...card.connections, { id: cardId1, type }]
      };
    }
    return card;
  });
};

// Удаление связи по индексу
const disconnectCard = (cards, cardId, connectionIndex) => {
  return cards.map(card => {
    if (card.id === cardId) {
      const updatedConnections = [...card.connections];
      updatedConnections.splice(connectionIndex, 1);
      return {
        ...card,
        connections: updatedConnections
      };
    }
    return card;
  });
};

export { createCard, updateCardPosition, connectCards, disconnectCard };
