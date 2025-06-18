import React, { useState } from 'react';

export default function ScriptModule({ darkMode, scenes, setScenes, cardsData, currentWorkId, setText }) {
  const [selectedScene, setSelectedScene] = useState(null);
  const [sceneText, setSceneText] = useState('');
  const [lineTypes, setLineTypes] = useState({});
  const [cursorLineIndex, setCursorLineIndex] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [showChat, setShowChat] = useState(false); // Чат
  const [showAiModal, setShowAiModal] = useState(false); // Модальное окно ИИ
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [budgetEstimate, setBudgetEstimate] = useState('');
  const [timingEstimate, setTimingEstimate] = useState('');
  
  // Подсчёт слогов (для хронометража)
  const countSyllables = (text) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let total = 0;
    for (const word of words) {
      let count = 0;
      let vowels = 'аеёиоуыэюя';
      for (let i = 0; i < word.length; i++) {
        if (vowels.includes(word[i])) count++;
      }
      total += Math.max(1, count);
    }
    return total;
  };

  // Расчёт хронометража
  const calculateSceneTiming = () => {
    const lines = sceneText.split('\n');
    let dialogueLines = '';
    for (let i = 0; i < lines.length; i++) {
      if (lineTypes[i] === 'dialogue') {
        dialogueLines += lines[i].replace(/^— /, '') + ' ';
      }
    }

    if (!dialogueLines.trim()) {
      setTimingEstimate('Нет диалогов для расчёта');
      return;
    }

    const syllables = countSyllables(dialogueLines);
    const estimatedSeconds = Math.round(syllables * 0.4);
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    setTimingEstimate(`${minutes} мин ${seconds} сек`);
  };

  // Оценка бюджета
  const estimateSceneBudget = async () => {
    setAiLoading(true);
    try {
      const locationName = cardsData.locations.find(
        (l) => l.id === scenes.find((s) => s.id === selectedScene)?.location
      )?.name || 'Не указано';

      const characterCount = (scenes.find((s) => s.id === selectedScene)?.characters || [])
        .map(id => cardsData.characters.find(c => c.id === id)?.name)
        .filter(Boolean).length;

      const promptContent = `
        Вы — опытный продюсер кино.
        Оцените приблизительный бюджет этой сцены в долларах США.
        Рассмотрите следующие факторы:
        - Место действия: ${locationName}
        - Количество персонажей: ${characterCount}
        - Требуется ли спецэффекты или сложная съёмка
        - Наличие транспорта, животных, массовки
        - Время года и время суток
        - Сложность диалогов и действий

        Текст сцены:
        ${sceneText}
        `;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions',  {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-70b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Вы — кинопродюсер. Отвечайте на русском языке.'
            },
            {
              role: 'user',
              content: promptContent
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error(`Ошибка API: ${response.statusText}`);
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setBudgetEstimate(data.choices[0].message.content);
      } else {
        setBudgetEstimate("Не удалось получить оценку бюджета.");
      }
    } catch (error) {
      console.error("Ошибка генерации оценки:", error);
      setBudgetEstimate("Произошла ошибка при оценке бюджета.");
    } finally {
      setAiLoading(false);
    }
  };

  // Генерация текста через ИИ (в модальном окне)
  const generateSceneWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const prompt = `
Вы — опытный сценарист.
Помогите улучшить или дополнить эту сцену.
Текст сцены:
"${sceneText}"

Запрос пользователя:
"${aiPrompt}"
      `;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions',  {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-70b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Вы — сценарист и литературный консультант. Пишите на русском языке.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error('Ошибка API');

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setAiResponse(data.choices[0].message.content);
      } else {
        setAiResponse('Не удалось получить ответ от модели.');
      }
    } catch (error) {
      console.error("Ошибка генерации:", error);
      setAiResponse('Ошибка подключения к ИИ.');
    } finally {
      setAiLoading(false);
    }
  };

  // --- ОСНОВНЫЕ ФУНКЦИИ ---
  const addNewScene = () => {
    const newScene = {
      id: Date.now(),
      title: `Новая сцена ${scenes.length + 1}`,
      location: '',
      time: '',
      characters: [],
      rawText: ''
    };
    setScenes([...scenes, newScene]);
    setSelectedScene(newScene.id);
    setSceneText('');
    setLineTypes({});
  };

  const updateScene = (sceneId, field, value) => {
    setScenes(scenes.map(scene =>
      scene.id === sceneId ? { ...scene, [field]: value } : scene
    ));
  };

  const deleteScene = (sceneId) => {
    setScenes(scenes.filter(scene => scene.id !== sceneId));
    if (selectedScene === sceneId) {
      setSelectedScene(null);
      setSceneText('');
      setLineTypes({});
    }
  };

  const moveScene = (sceneId, direction) => {
    const index = scenes.findIndex(scene => scene.id === sceneId);
    if (direction === 'up' && index > 0) {
      const updatedScenes = [...scenes];
      [updatedScenes[index], updatedScenes[index - 1]] = [updatedScenes[index - 1], updatedScenes[index]];
      setScenes(updatedScenes);
    } else if (direction === 'down' && index < scenes.length - 1) {
      const updatedScenes = [...scenes];
      [updatedScenes[index], updatedScenes[index + 1]] = [updatedScenes[index + 1], updatedScenes[index]];
      setScenes(updatedScenes);
    }
  };

  const handleKeyDown = (e) => {
    const textarea = document.getElementById('scene-textarea');
    if (!textarea || e.key !== 'Tab') return;
    e.preventDefault();
    const start = textarea.selectionStart;
    const value = sceneText;
    const lines = value.split('\n');
    let cursorLineIndex = 0;
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= start) break;
      currentPos += lines[i].length + 1;
    }

    const currentLine = lines[cursorLineIndex];
    const currentType = lineTypes[cursorLineIndex] || 'remarque';
    let nextType = currentType;

    if (e.shiftKey) {
      switch (currentType) {
        case 'remarque': nextType = 'dialogue'; break;
        case 'character': nextType = 'remarque'; break;
        case 'dialogue': nextType = 'character'; break;
        default: nextType = 'remarque';
      }
    } else {
      switch (currentType) {
        case 'remarque': nextType = 'character'; break;
        case 'character': nextType = 'dialogue'; break;
        case 'dialogue': nextType = 'character'; break;
        default: nextType = 'remarque';
      }
    }

    let formattedCurrentLine = currentLine;
    switch (currentType) {
      case 'remarque':
        formattedCurrentLine = `( ${formattedCurrentLine.replace(/^\( | \)$/g, '').trim()} )`;
        break;
      case 'character':
        formattedCurrentLine = `${formattedCurrentLine.toUpperCase()}:`;
        break;
      case 'dialogue':
        formattedCurrentLine = `— ${formattedCurrentLine.trim()}`;
        break;
      default:
        break;
    }

    lines[cursorLineIndex] = formattedCurrentLine;
    if (!e.shiftKey) {
      lines.splice(cursorLineIndex + 1, 0, '');
    }

    const newValue = lines.join('\n');
    setSceneText(newValue);
    updateScene(selectedScene, 'rawText', newValue);

    const updatedLineTypes = { ...lineTypes };
    updatedLineTypes[cursorLineIndex] = currentType;
    if (!e.shiftKey) {
      updatedLineTypes[cursorLineIndex + 1] = nextType;
    }

    setLineTypes(updatedLineTypes);
    setCursorLineIndex(!e.shiftKey ? cursorLineIndex + 1 : cursorLineIndex);

    const newCursorPos = value.slice(0, value.indexOf('\n', currentPos))?.length + formattedCurrentLine.length + 1;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertSceneIntoEditor = () => {
    const scene = scenes.find(s => s.id === selectedScene);
    if (!scene) return;
    let script = `${scene.title.toUpperCase()}\n`;

    if (scene.location) {
      const locationCard = cardsData.locations.find(loc => loc.id === scene.location);
      if (locationCard) {
        script += `МЕСТО: ${locationCard.name}\n`;
        script += `ВРЕМЯ: ${scene.time || 'не указано'}\n`;
      }
    }

    if (scene.characters?.length > 0) {
      script += 'ПЕРСОНАЖИ:\n';
      scene.characters.forEach(charId => {
        const charCard = cardsData.characters.find(c => c.id === charId);
        if (charCard) {
          script += `- ${charCard.name}\n`;
        }
      });
      script += '\n';
    }

    const lines = sceneText.split('\n');
    script += lines.join('\n');
    setText(prev => prev + '\n' + script);
  };

  return (
    <section className="animate-fadeIn">
      <h2 className="text-3xl font-bold mb-6">Сценарий</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список сцен */}
        <div className={`rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 flex justify-between items-center`}>
            <h3 className="font-semibold">Сцены</h3>
            <button onClick={addNewScene} className="text-blue-500 hover:text-blue-700 text-sm">
              + Добавить сцену
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {scenes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Добавьте первую сцену.</p>
            ) : (
              <ul className="space-y-2">
                {scenes.map((scene) => (
                  <li key={scene.id}>
                    <div
                      className={`p-3 rounded border cursor-pointer ${
                        selectedScene === scene.id
                          ? darkMode ? 'bg-gray-700 border-blue-500' : 'bg-blue-50 border-blue-500'
                          : darkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedScene(scene.id);
                        setSceneText(scene.rawText || '');
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{scene.title}</span>
                        <div className="flex space-x-1">
                          <button onClick={(e) => { e.stopPropagation(); moveScene(scene.id, 'up'); }} className="text-gray-400 hover:text-gray-600">↑</button>
                          <button onClick={(e) => { e.stopPropagation(); moveScene(scene.id, 'down'); }} className="text-gray-400 hover:text-gray-600">↓</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); }} className="text-red-500 hover:text-red-700">×</button>
                        </div>
                      </div>
                      {scene.location && (
                        <div className="text-xs mt-1 text-gray-500">
                          {cardsData.locations.find(l => l.id === scene.location)?.name || 'Локация не выбрана'}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Редактор сцены */}
        <div className={`lg:col-span-2 rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
          {selectedScene ? (
            <>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 flex justify-between items-center`}>
                <h3 className="font-semibold">
                  {scenes.find(s => s.id === selectedScene)?.title || 'Детали сцены'}
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={() => setFullScreenMode(!fullScreenMode)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    {fullScreenMode ? 'Выход из полноэкранного режима' : 'Полноэкранный режим'}
                  </button>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    AI Помощник
                  </button>
                </div>
              </div>
              <div className={`p-4 ${fullScreenMode ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4' : ''}`}>
                <div className={`${fullScreenMode ? 'max-w-4xl w-full mx-auto' : ''}`}>
                  <div className="mb-4">
                    <label className="block mb-2">Название сцены</label>
                    <input
                      type="text"
                      value={scenes.find(s => s.id === selectedScene)?.title || ''}
                      onChange={(e) => updateScene(selectedScene, 'title', e.target.value)}
                      className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block mb-2">Локация</label>
                      <select
                        value={scenes.find(s => s.id === selectedScene)?.location || ''}
                        onChange={(e) => updateScene(selectedScene, 'location', e.target.value)}
                        className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      >
                        <option value="">Выберите локацию</option>
                        {cardsData.locations.map(location => (
                          <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2">Время</label>
                      <input
                        type="text"
                        value={scenes.find(s => s.id === selectedScene)?.time || ''}
                        onChange={(e) => updateScene(selectedScene, 'time', e.target.value)}
                        placeholder="например: вечер, день, ночь"
                        className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Персонажи в сцене</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                      {cardsData.characters.map(character => (
                        <div key={character.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(scenes.find(s => s.id === selectedScene)?.characters || []).includes(character.id)}
                            onChange={(e) => {
                              const currentCharacters = scenes.find(s => s.id === selectedScene)?.characters || [];
                              if (e.target.checked) {
                                updateScene(selectedScene, 'characters', [...currentCharacters, character.id]);
                              } else {
                                updateScene(selectedScene, 'characters', currentCharacters.filter(id => id !== character.id));
                              }
                            }}
                            className="mr-2"
                          />
                          <span>{character.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Текст сцены</label>
                    <div className="relative">
                      <textarea
                        id="scene-textarea"
                        value={sceneText}
                        onChange={(e) => {
                          setSceneText(e.target.value);
                          updateScene(selectedScene, 'rawText', e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        rows={fullScreenMode ? 30 : 12}
                        className={`w-full p-3 border rounded resize-none font-mono ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        placeholder="Пишите сцену здесь. Используйте Tab для автоматического форматирования."
                      />
                      <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {({
                          remarque: 'Ремарка',
                          character: 'Имя персонажа',
                          dialogue: 'Диалог'
                        }[lineTypes[cursorLineIndex] || 'remarque'])}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Используйте <kbd className="bg-gray-200 px-1 rounded">Tab</kbd> для переключения между типами строк
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-4">
                    <button
                      onClick={calculateSceneTiming}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                    >
                      Рассчитать хронометраж
                    </button>
                    <button
                      onClick={estimateSceneBudget}
                      disabled={aiLoading}
                      className={`px-4 py-2 rounded ${aiLoading ? 'bg-yellow-500 opacity-50' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                    >
                      {aiLoading ? 'Расчёт...' : 'Оценить бюджет'}
                    </button>
                  </div>
                  {timingEstimate && (
                    <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
                      Примерное время показа: <strong>{timingEstimate}</strong>
                    </div>
                  )}
                  {budgetEstimate && (
                    <div className="mt-4 p-3 bg-green-100 text-green-800 rounded whitespace-pre-line">
                      {budgetEstimate}
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={insertSceneIntoEditor}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Вставить в редактор
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">Выберите сцену из списка или добавьте новую.</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно ИИ-помощника */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-2xl rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">AI Помощник по сцене</h3>
              <button onClick={() => setShowAiModal(false)} className="text-xl">×</button>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Что вы хотите изменить или улучшить?</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows="4"
                className={`w-full p-3 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Например: 'Как сделать диалог более живым?', 'Улучши ремарку', 'Продолжи развитие конфликта'"
              />
            </div>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Текст сцены:</h4>
              <div className={`p-3 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} max-h-40 overflow-y-auto`}>
                <pre className="whitespace-pre-wrap">{sceneText}</pre>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={generateSceneWithAI}
                disabled={aiLoading || !aiPrompt.trim()}
                className={`px-4 py-2 rounded text-white ${aiLoading ? 'bg-gray-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {aiLoading ? 'Генерация...' : 'Сгенерировать'}
              </button>
              <button
                onClick={() => setShowAiModal(false)}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Закрыть
              </button>
            </div>
            {aiResponse && (
              <div className="mt-4 p-3 bg-gray-100 text-gray-800 rounded">
                <h4 className="font-semibold">Результат от ИИ:</h4>
                <p className="whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Боковой чат с ИИ */}
      {showChat && <ChatPanel darkMode={darkMode} onClose={() => setShowChat(false)} />}
    </section>
  );
}

// Компонент бокового чата
const ChatPanel = ({ darkMode, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const userMessage = { role: 'user', content: prompt };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setPrompt('');
    setGenerating(true);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions',  {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-70b-instruct',
          messages: [
            {
              role: 'system',
              content: `Вы — сценарист и литературный консультант. Помогайте пользователю анализировать, улучшать и развивать сценарии.`
            },
            ...newHistory
          ],
        }),
      });

      if (!response.ok) throw new Error('Ошибка API');
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Ошибка ответа ИИ.';
      setChatHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Ошибка связи с ИИ.' }]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-96 shadow-lg z-50 transform translate-x-0 transition-transform duration-300 ease-in-out ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-semibold">Сценарный консультант</h4>
          <button onClick={onClose} className="text-xl">×</button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatHistory.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Начните диалог с ИИ, чтобы обсудить сценарий.</p>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-right text-blue-800' : 'bg-green-100 text-left text-green-800'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Спросите совета по сценарию, диалогу или локации..."
            rows="3"
            className={`w-full p-2 rounded border mb-2 resize-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className={`w-full px-4 py-2 rounded-md text-white ${
              generating || !prompt.trim()
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {generating ? 'Генерация...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};
