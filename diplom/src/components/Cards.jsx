import React, { useState, useRef, useEffect } from 'react';
import { createCard } from './utils/cardUtils';
import { generateCardWithAI } from './aiCardGenerator';
import { BoardModal } from './BoardModal';
import { CardsList } from './cardsList';

export default function Cards({
  works,
  cardsData,
  setCardsData,
  currentWorkId,
  setCurrentWorkId,
  darkMode
}) {
  const [newCardType, setNewCardType] = useState('characters');
  const [newCardName, setNewCardName] = useState('');
  const [newFields, setNewFields] = useState([{ label: '', value: '' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('alphabetical');
  const [draggingCard, setDraggingCard] = useState(null);
  const boardRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState('characters');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [generatedCard, setGeneratedCard] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const currentWork = works.find(work => work.id === currentWorkId);

  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [currentBoardCard, setCurrentBoardCard] = useState(null);

  const openBoardView = (card) => {
    setCurrentBoardCard(card);
    setBoardModalOpen(true);
  };

  const cardTypeLabels = {
    characters: 'Персонаж',
    locations: 'Локация',
    events: 'Событие'
  };

  // Drag & Drop handlers
  const handleMouseMove = (e) => {
    if (!draggingCard) return;
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;
    const newX = e.clientX - boardRect.left;
    const newY = e.clientY - boardRect.top;
    setCardsData((prev) => {
      const currentWork = prev[currentWorkId];
      const card = currentWork[draggingCard.cardType]?.find(c => c.id === draggingCard.cardId);
      if (!card) return prev;
      return {
        ...prev,
        [currentWorkId]: {
          ...prev[currentWorkId],
          [draggingCard.cardType]: prev[currentWorkId][draggingCard.cardType].map(c =>
            c.id === draggingCard.cardId ? { ...c, position: { x: newX, y: newY } } : c
          )
        }
      };
    });
  };

  const handleMouseUp = () => {
    setDraggingCard(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingCard]);

  // Save new card
  const saveNewCard = () => {
    if (!newCardName.trim()) return;
    const newCard = createCard(newCardType, newCardName, newFields, currentWorkId);
    setCardsData(prev => ({
      ...prev,
      [currentWorkId]: {
        ...prev[currentWorkId],
        [newCardType]: [...(prev[currentWorkId]?.[newCardType] || []), newCard]
      }
    }));
    setNewCardName('');
    setNewFields([{ label: '', value: '' }]);
  };

  // Update card property
  const updateCard = (cardType, cardId, field, value) => {
    setCardsData(prev => {
      const updated = prev[currentWorkId][cardType].map(card =>
        card.id === cardId ? { ...card, [field]: value } : card
      );
      return {
        ...prev,
        [currentWorkId]: {
          ...prev[currentWorkId],
          [cardType]: updated
        }
      };
    });
  };

  // Update field in card
  const updateField = (cardType, cardId, index, key, value) => {
    setCardsData(prev => {
      const updated = prev[currentWorkId][cardType].map(card => {
        if (card.id === cardId) {
          const updatedFields = [...card.fields];
          updatedFields[index] = { ...updatedFields[index], [key]: value };
          return {
            ...card,
            fields: updatedFields
          };
        }
        return card;
      });
      return {
        ...prev,
        [currentWorkId]: {
          ...prev[currentWorkId],
          [cardType]: updated
        }
      };
    });
  };

  // Delete card
  const deleteCard = (cardType, cardId) => {
    setCardsData(prev => {
      const updated = prev[currentWorkId][cardType].filter(c => c.id !== cardId);
      // Remove connections to this card
      Object.values(prev[currentWorkId]).forEach(cards => {
        cards.forEach(card => {
          if (card.connections) {
            card.connections = card.connections.filter(
              conn => !(conn.type === cardType && conn.id === cardId)
            );
          }
        });
      });
      return {
        ...prev,
        [currentWorkId]: {
          ...prev[currentWorkId],
          [cardType]: updated
        }
      };
    });
  };

  const addFieldToCard = (cardType, cardId) => {
    setCardsData(prev => {
      const updated = prev[currentWorkId][cardType].map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            fields: [...card.fields, { label: '', value: '' }]
          };
        }
        return card;
      });
      return {
        ...prev,
        [currentWorkId]: {
          ...prev[currentWorkId],
          [cardType]: updated
        }
      };
    });
  };

  const removeFieldFromCard = (cardType, cardId, fieldIndex) => {
    setCardsData(prev => {
      const updated = prev[currentWorkId][cardType].map(card => {
        if (card.id === cardId) {
          const newFields = [...card.fields];
          newFields.splice(fieldIndex, 1);
          return {
            ...card,
            fields: newFields
          };
        }
        return card;
      });
      return {
        ...prev,
        [currentWorkId]: {
          ...prev[currentWorkId],
          [cardType]: updated
        }
      };
    });
  };


  // Add new field to card creation form
  const addField = () => {
    setNewFields([...newFields, { label: '', value: '' }]);
  };



  const handleCardMouseDown = (cardType, cardId, e) => {
    e.stopPropagation();
    setDraggingCard({ cardType, cardId, startX: e.clientX, startY: e.clientY });
  };



  // Generate card with AI
  const handleGenerateCard = async () => {
    if (!currentWork) return;
    setGenerating(true);
    setAiError('');
    setGeneratedCard(null);
    try {
      const newCard = await generateCardWithAI(selectedCardType, currentWork.title, customPrompt);
      if (newCard) {
        setCardsData(prev => ({
          ...prev,
          [currentWorkId]: {
            ...prev[currentWorkId],
            [selectedCardType]: [...prev[currentWorkId][selectedCardType], newCard]
          }
        }));
        setGeneratedCard(newCard);
      } else {
        setAiError('Не удалось сгенерировать карточку. Попробуйте еще раз.');
      }
    } catch (error) {
      setAiError('Произошла ошибка при генерации карточки. Проверьте подключение или попробуйте позже.');
    } finally {
      setGenerating(false);
    }
  };

  const openGenerateModal = (type) => {
    setSelectedCardType(type);
    setCustomPrompt('');
    setGeneratedCard(null);
    setAiError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };


  return (
    <>
      {/* Генерация карточки */}
      {/* Генерация карточки */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => openGenerateModal('characters')}
          disabled={generating}
          className={`px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors ${
            generating ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {generating ? 'Генерация...' : 'Сгенерировать персонажа'}
        </button>
        <button
          onClick={() => openGenerateModal('locations')}
          disabled={generating}
          className={`px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors ${
            generating ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {generating ? 'Генерация...' : 'Сгенерировать локацию'}
        </button>
        <button
          onClick={() => openGenerateModal('events')}
          disabled={generating}
          className={`px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition-colors ${
            generating ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {generating ? 'Генерация...' : 'Сгенерировать событие'}
        </button>
      </div>

      {/* Модальное окно для генерации */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div
            className={`relative w-full max-w-lg rounded-lg shadow-xl p-6 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
            style={{
              maxHeight: '90vh', // Ограничиваем высоту окна
              overflowY: 'auto', // Включаем прокрутку внутри
            }}
          >
            <h3 className="text-xl font-semibold mb-4">Генератор карточки</h3>
            <p className="mb-4">
              Тип карточки: <strong>{cardTypeLabels[selectedCardType]}</strong>
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Ваш запрос:</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Опишите, что вы хотите получить..."
                rows="4"
                className={`w-full p-2 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            {aiError && <p className="text-red-500 mb-4">{aiError}</p>}
            {generatedCard ? (
              <div className="space-y-3 mb-4">
                <h4 className="font-medium">Сгенерированная карточка:</h4>
                <div
                  className={`p-4 border rounded ${
                    darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <h5 className="font-bold">{generatedCard.name}</h5>
                  <div className="mt-2 space-y-2 text-sm">
                    {generatedCard.fields.map((field, index) => (
                      <div key={index}>
                        <span className="uppercase text-xs text-gray-500">{field.label}:</span>
                        <p>{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : generating ? (
              <div className="text-center py-4">Генерация карточки...</div>
            ) : (
              <p className="text-center py-4">Нажмите "Сгенерировать", чтобы создать карточку.</p>
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleGenerateCard}
                disabled={generating}
                className={`px-4 py-2 rounded-md text-white ${
                  generating ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {generating ? 'Генерация...' : 'Сгенерировать'}
              </button>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Форма добавления новой карточки */}
      <div className={`mb-8 p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-xl font-semibold mb-4">Добавить новую карточку</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={newCardType}
            onChange={(e) => setNewCardType(e.target.value)}
            className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          >
            <option value="characters">Персонаж</option>
            <option value="locations">Локация</option>
            <option value="events">Событие</option>
          </select>
          <input
            type="text"
            placeholder="Название карточки"
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
            className={`p-2 rounded border col-span-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <ul className="space-y-3 mb-4">
          {newFields.map((field, index) => (
            <li key={index} className="grid grid-cols-2 gap-4">
              <input
                placeholder="Название поля"
                value={field.label}
                onChange={(e) => {
                  const updated = [...newFields];
                  updated[index].label = e.target.value;
                  setNewFields(updated);
                }}
                className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              <input
                placeholder="Значение"
                value={field.value}
                onChange={(e) => {
                  const updated = [...newFields];
                  updated[index].value = e.target.value;
                  setNewFields(updated);
                }}
                className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </li>
          ))}
        </ul>
        <button
          onClick={addField}
          className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          + Добавить поле
        </button>
        <button
          onClick={saveNewCard}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Сохранить карточку
        </button>
      </div>

      {/* Search and Sort */}
      <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Поиск по карточкам..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          >
            <option value="alphabetical">По алфавиту</option>
            <option value="recent">Сначала новые</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      <CardsList
        cardsData={cardsData}
        currentWorkId={currentWorkId}
        darkMode={darkMode}
        updateCard={updateCard}
        updateField={updateField}
        removeFieldFromCard={removeFieldFromCard}
        deleteCard={deleteCard}
        addFieldToCard={addFieldToCard}
        openBoardView={openBoardView}
        searchTerm={searchTerm}
        sortOption={sortOption}
      />

      {boardModalOpen && currentBoardCard && (
        <BoardModal
          isOpen={boardModalOpen}
          onClose={() => setBoardModalOpen(false)}
          card={currentBoardCard}
          allCards={{
            characters: cardsData[currentWorkId]?.characters || [],
            locations: cardsData[currentWorkId]?.locations || [],
            events: cardsData[currentWorkId]?.events || []
          }}
          onSaveConnection={(fromId, toId, name) => {
            console.log('Сохранить связь:', fromId, '→', toId, ':', name);
          }}
          darkMode={darkMode}
        />
      )}

    </>
  );
}
