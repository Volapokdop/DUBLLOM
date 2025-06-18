// connectionUtils.js

// Добавление связи между произведением и карточкой
export const addWorkCardConnection = (setWorks, setCardsData, workId, cardType, cardId) => {
  // Добавляем карточку в произведение
  setWorks(prev => prev.map(work =>
    work.id === workId
      ? {
          ...work,
          usedCards: {
            ...work.usedCards,
            [cardType]: [...(work.usedCards[cardType] || []), cardId]
          }
        }
      : work
  ));

  // Добавляем произведение в карточку
  setCardsData(prev => {
    const updatedCards = { ...prev };
    if (updatedCards[workId]?.[cardType]) {
      updatedCards[workId][cardType] = updatedCards[workId][cardType].map(card =>
        card.id === cardId
          ? {
              ...card,
              usedIn: [...(card.usedIn || []), workId]
            }
          : card
      );
    }
    return updatedCards;
  });
};

// Удаление связи между произведением и карточкой
export const removeWorkCardConnection = (setWorks, setCardsData, workId, cardType, cardId) => {
  // Удаляем карточку из произведения
  setWorks(prev => prev.map(work =>
    work.id === workId
      ? {
          ...work,
          usedCards: {
            ...work.usedCards,
            [cardType]: work.usedCards[cardType].filter(id => id !== cardId)
          }
        }
      : work
  ));

  // Удаляем произведение из карточки
  setCardsData(prev => {
    const updatedCards = { ...prev };
    if (updatedCards[workId]?.[cardType]) {
      updatedCards[workId][cardType] = updatedCards[workId][cardType].map(card =>
        card.id === cardId
          ? {
              ...card,
              usedIn: card.usedIn.filter(id => id !== workId)
            }
          : card
      );
    }
    return updatedCards;
  });
};
