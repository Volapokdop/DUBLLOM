import React, { useState, useRef, useEffect } from 'react';

export const BoardModal = ({
  isOpen,
  onClose,
  card,
  allCards,
  onSaveConnection,
  darkMode
}) => {
  const [cardsOnBoard, setCardsOnBoard] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  // Добавление главной карточки в центр при открытии
  useEffect(() => {
    if (isOpen && card) {
      setCardsOnBoard([
        {
          ...card,
          position: { x: 400, y: 200 },
          isMain: true
        }
      ]);
      setConnections([]);
    }
  }, [isOpen, card]);

  // Перетаскивание карточки
  const startDragging = (e, cardId) => {
    e.preventDefault();
    if (e.button !== 0) return;

    const card = cardsOnBoard.find(c => c.id === cardId);
    if (!card || card.isMain) return;

    const offsetX = e.clientX - card.position.x;
    const offsetY = e.clientY - card.position.y;

    const onMouseMove = (moveEvent) => {
      setCardsOnBoard(prev =>
        prev.map(c =>
          c.id === cardId
            ? {
                ...c,
                position: {
                  x: moveEvent.clientX - offsetX,
                  y: moveEvent.clientY - offsetY
                }
              }
            : c
        )
      );
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Выбор карточки для связи ПКМ
  const handleRightClick = (e, cardId) => {
    e.preventDefault();
    if (!selectedCardId) {
      setSelectedCardId(cardId);
    } else {
      const connectionName = prompt('Введите название связи:');
      if (connectionName) {
        setConnections(prev => [
          ...prev,
          {
            from: selectedCardId,
            to: cardId,
            name: connectionName
          }
        ]);
        setSelectedCardId(null);
      }
    }
  };

  // Добавление новой карточки на доску
  const addCardToBoard = (newCard) => {
    const randomX = Math.floor(Math.random() * 400) + 100;
    const randomY = Math.floor(Math.random() * 300) + 100;

    setCardsOnBoard((prev) => [
      ...prev,
      {
        ...newCard,
        position: { x: randomX, y: randomY },
        isMain: false
      }
    ]);
    setShowAddMenu(false);
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Сохранение связей
  const saveConnections = () => {
    connections.forEach(conn => {
      onSaveConnection(conn.from, conn.to, conn.name);
    });
    onClose();
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div
        className={`relative w-full max-w-6xl h-[80vh] rounded-lg shadow-xl overflow-hidden ${
          darkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        {/* Заголовок */}
        <div
          className={`flex justify-between items-center px-4 py-3 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <h3 className="text-lg font-bold">Доска связей: {card.name}</h3>
          <button
            onClick={onClose}
            className={`px-3 py-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            ✕
          </button>
        </div>

        {/* Контент доски */}
        <div className="relative w-full h-full p-4 overflow-auto" style={{ minHeight: '500px' }}>
          {/* Кнопка добавления карточки в левом верхнем углу */}
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md"
            >
              Добавить карточку
            </button>
          </div>

          {/* Выпадающее меню */}
          {showAddMenu && (
            <div
              ref={addMenuRef}
              className={`absolute top-16 left-4 w-64 max-h-80 overflow-y-auto z-50 rounded-md shadow-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <div className="p-2 text-sm font-medium">Персонажи</div>
              {allCards.characters.length > 0 ? (
                allCards.characters.map(c => (
                  <div
                    key={c.id}
                    onClick={() => addCardToBoard(c)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">Нет персонажей</div>
              )}

              <div className="p-2 text-sm font-medium mt-2">Локации</div>
              {allCards.locations.length > 0 ? (
                allCards.locations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => addCardToBoard(c)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">Нет локаций</div>
              )}

              <div className="p-2 text-sm font-medium mt-2">События</div>
              {allCards.events.length > 0 ? (
                allCards.events.map(c => (
                  <div
                    key={c.id}
                    onClick={() => addCardToBoard(c)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {c.name}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">Нет событий</div>
              )}
            </div>
          )}

          {/* Карточки на доске */}
          {cardsOnBoard.map(c => (
            <div
              key={c.id}
              className={`absolute cursor-move border rounded-lg shadow-md p-3 text-sm transition-transform transform hover:scale-105 ${
                selectedCardId === c.id ? 'ring-2 ring-blue-500' : ''
              } ${c.isMain ? 'bg-indigo-100 border-indigo-500' : 'bg-white border-gray-300'}`}
              style={{
                left: `${c.position.x}px`,
                top: `${c.position.y}px`,
                width: '200px',
                zIndex: c.id === selectedCardId ? 10 : 1
              }}
              onContextMenu={(e) => handleRightClick(e, c.id)}
              onMouseDown={(e) => startDragging(e, c.id)}
            >
              <strong>{c.name}</strong>
            </div>
          ))}

          {/* Линии связей */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            {connections.map((conn, idx) => {
              const from = cardsOnBoard.find(c => c.id === conn.from);
              const to = cardsOnBoard.find(c => c.id === conn.to);
              if (!from || !to) return null;

              const x1 = from.position.x + 100;
              const y1 = from.position.y + 20;
              const x2 = to.position.x + 100;
              const y2 = to.position.y + 20;

              return (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={darkMode ? '#6366f1' : '#3b82f6'}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2}
                    fill={darkMode ? '#fff' : '#000'}
                    fontSize="12"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {conn.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Инструменты */}
        <div
          className={`p-4 border-t flex gap-2 ${
            darkMode ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          {/* Кнопка "Добавить карточку" */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Добавить карточку
            </button>

            {/* Выпадающее меню */}
            {showAddMenu && (
              <div
                className={`absolute mt-2 w-64 max-h-60 overflow-y-auto z-50 rounded-md shadow-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}
              >
                <div className="p-2 text-sm font-medium">Персонажи</div>
                {allCards.characters.length > 0 ? (
                  allCards.characters.map(c => (
                    <div
                      key={c.id}
                      onClick={() => addCardToBoard(c)}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {c.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">Нет персонажей</div>
                )}

                <div className="p-2 text-sm font-medium mt-2">Локации</div>
                {allCards.locations.length > 0 ? (
                  allCards.locations.map(c => (
                    <div
                      key={c.id}
                      onClick={() => addCardToBoard(c)}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {c.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">Нет локаций</div>
                )}

                <div className="p-2 text-sm font-medium mt-2">События</div>
                {allCards.events.length > 0 ? (
                  allCards.events.map(c => (
                    <div
                      key={c.id}
                      onClick={() => addCardToBoard(c)}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {c.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">Нет событий</div>
                )}
              </div>
            )}
          </div>

          {/* Кнопка сохранения */}
          <button
            onClick={saveConnections}
            className="ml-auto px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            Сохранить связи
          </button>
        </div>
      </div>
    </div>
  );
};
