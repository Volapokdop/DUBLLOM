import React, { useState } from 'react';


export const sortedAndFilteredCards = (cards, searchTerm, sortOption) => {
  let filtered = cards.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortOption === 'alphabetical') {
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === 'recent') {
    return filtered.sort((a, b) => b.id - a.id);
  }

  return filtered;
};

export const CardsList = ({
  cardsData,
  currentWorkId,
  darkMode,
  updateCard,
  updateField,
  removeFieldFromCard,
  deleteCard,
  addFieldToCard,
  openBoardView,
  searchTerm,
  sortOption,
}) => {
  const [expandedCards, setExpandedCards] = useState({});

  // Переключение состояния свёрнутой/развёрнутой карточки
  const toggleCard = (type, id) => {
    setExpandedCards(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  if (!cardsData[currentWorkId]) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {['characters', 'locations', 'events'].map(type => (
        <div
          key={type}
          className={`rounded-lg overflow-hidden shadow-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3`}
          >
            <h3 className="font-semibold capitalize">{type}</h3>
          </div>
          <div className="p-4 space-y-4">
            {sortedAndFilteredCards(
              cardsData[currentWorkId]?.[type] || [],
              searchTerm,
              sortOption
            ).map((card) => {
              const isExpanded = expandedCards[`${type}-${card.id}`];

              return (
                <div
                  key={card.id}

                  className={`p-3 rounded border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  } relative transition-all duration-200 ease-in-out`}
                >
                  {/* Имя карточки всегда видно */}
                  <button
                    onClick={() => toggleCard(type, card.id)}
                    className="w-full text-left font-bold mb-2"
                  >
                    {card.name}
                  </button>

                  {/* Содержимое карточки — скрытое при сворачивании */}
                  <div className={`${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 ease-in-out`}>
                    <input
                      value={card.name}
                      onChange={(e) => updateCard(type, card.id, 'name', e.target.value)}
                      className={`w-full mb-3 p-2 rounded border ${
                        darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'
                      }`}
                    />
                    <button
                      onClick={() => openBoardView(card)}
                      className="absolute top-1 right-1 text-xs text-blue-500 hover:underline"
                    >
                      Открыть доску
                    </button>
                    <ul className="text-sm space-y-3">
                      {card.fields.map((f, i) => (
                        <li key={i} className="space-y-1 relative group">
                          <button
                            onClick={() => removeFieldFromCard(type, card.id, i)}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                          >
                            ×
                          </button>
                          <input
                            placeholder="Название поля"
                            value={f.label}
                            onChange={(e) =>
                              updateField(type, card.id, i, 'label', e.target.value)
                            }
                            className={`w-full px-2 py-1 rounded border mb-1 ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-300'
                                : 'bg-gray-50 border-gray-300'
                            } font-semibold`}
                          />
                          <textarea
                            value={f.value}
                            onChange={(e) =>
                              updateField(type, card.id, i, 'value', e.target.value)
                            }
                            rows="2"
                            className={`w-full p-2 rounded border resize-none ${
                              darkMode
                                ? 'bg-gray-600 border-gray-500'
                                : 'bg-white border-gray-300'
                            }`}
                          />
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => addFieldToCard(type, card.id)}
                      className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                    >
                      + Добавить поле
                    </button>
                    <div className="mt-2 flex justify-between items-center">
                      <button
                        onClick={() => deleteCard(type, card.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Удалить
                      </button>
                      <div className="text-xs text-gray-500">
                        Связей: {card.connections?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
