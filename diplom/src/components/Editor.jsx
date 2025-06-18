// Editor.jsx

import React, { useState, useEffect } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon } from './Icons';
import Typo from 'typo-js';

// Компонент чата
const ChatPanel = ({ darkMode, aiContext, generateTextWithAI, onClose }) => {
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
              content: `
                Вы — талантливый литературный консультант, говорящий на русском языке.
                Помогайте пользователю обсуждать его произведение.
                Предлагайте идеи, анализируйте персонажей, сюжет и стиль.
                Отвечайте креативно, вежливо и исключительно на русском языке.
                Если вы получите запрос на другом языке — переведите его и ответьте на русском.
                Контекст текста пользователя: "${aiContext}"
              `,
            },
            {
              role: 'user',
              content: `Пожалуйста, отвечайте только на русском языке.\n\n${prompt}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3
        }),
      });

      if (!response.ok) throw new Error('Ошибка API');

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Не удалось получить ответ от модели.';

      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: aiResponse }
      ]);
    } catch (error) {
      console.error("Ошибка:", error);
      setChatHistory([...newHistory, { role: 'assistant', content: 'Произошла ошибка при подключении к ИИ.' }]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-96 shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-0 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h4 className="font-semibold">Литературный консультант</h4>
          <button onClick={onClose} className="text-xl">×</button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatHistory.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Здесь появится ваш диалог с ИИ.</p>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-right text-blue-800' : 'bg-green-100 text-left text-green-800'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Area with Fixed Footer */}
        <div className="p-4 border-t">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Спросите что-то о произведении..."
            rows="3"
            className={`w-full p-2 rounded border mb-2 resize-none ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className={`w-full px-4 py-2 rounded-md text-white ${
              generating || !prompt.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {generating ? 'Генерация...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Editor({
  text,
  setText,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  textColor,
  setTextColor,
  bgColor,
  setBgColor,
  darkMode,
  setDarkMode,
  currentWork,
  cardsData,
  contentPlan,
  setContentPlan,
  dailyGoal,
  setDailyGoal,
  wordCountHistory,
  showPomodoro,
  setShowPomodoro,
  pomodoroTime,
  formatTime,
  isPomodoroRunning,
  togglePomodoro,
  resetPomodoro,
  setIsPodoroRunning,
  setPomodoroTime,
  // AI Props
  aiContext,
  setAiContext,
  showModal,
  setShowModal,
  prompt,
  setPrompt,
  generating,
  aiError,
  generatedText,
  generateTextWithAI
}) {
  const wordCount = text ? String(text).trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text ? String(text).length : 0;
  const [viewMode, setViewMode] = useState('edit');
  const [showCardReference, setShowCardReference] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState('characters');
  const [showChat, setShowChat] = useState(false); // <-- Новое состояние для чата

  const [dictionary, setDictionary] = useState(null);
  const [highlightedText, setHighlightedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const [summary, setSummary] = useState(() => {
    const workId = currentWork?.id || 'default';
    return localStorage.getItem(`summary_${workId}`) || '';
  });

  // Инициализация словаря
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const typo = new Typo('ru', false, false, {
          dictionaryPath: '/dictionaries'
        });
        setDictionary(typo);
      } catch (err) {
        console.error("Ошибка загрузки словаря:", err);
      }
    };

    loadDictionary();
  }, []);

  // Обработка текста для подсветки ошибок
  useEffect(() => {
    if (!dictionary || !text) return;

    const words = text.split(/\b/);
    const result = words.map(word => ({
      word,
      correct: dictionary.check(word),
    }));

    setHighlightedText(
      result
        .map(({ word, correct }) =>
          !correct && word.match(/\w+/)
            ? `<span class="misspelled">${word}</span>`
            : word
        )
        .join('')
    );
  }, [text, dictionary]);



  const generateSummary = (text, wordLimit = 100) => {
    if (!text || text.trim() === '') return '';

    const words = text.split(/\s+/);
    if (words.length <= wordLimit) return text;

    // Простой алгоритм: берем первые N слов + последние N слов
    const start = words.slice(0, wordLimit / 2).join(' ');
    const end = words.slice(-wordLimit / 2).join(' ');

    return `${start} ... ${end}`;
  };

  const generateSummaryWithAI = async (text) => {
    if (!text || text.trim() === '') return '';

    const workId = currentWork?.id || 'default';

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
              content: `
                Вы — талантливый литературный консультант, говорящий на русском языке.
                Создайте краткое содержание текста, используя не более 150 слов.
                Сохраните ключевые моменты: персонажи, конфликт, развитие действия.
                ВАЖНО: Завершите последнюю мысль целиком. Не останавливайтесь на полуслове.
                Отвечайте только на русском языке.
              `,
            },
            {
              role: 'user',
              content: `Кратко перескажите следующий текст:\n\n${text}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        }),
      });

      if (!response.ok) throw new Error('Ошибка API');

      const data = await response.json();
      let summary = data.choices[0]?.message?.content || '';

      // Пост-обработка: завершаем незаконченное предложение
      if (summary && !/[.!?]$/.test(summary.trim())) {
        summary += '...';
      }

      // Сохраняем в localStorage
      localStorage.setItem(`summary_${workId}`, summary);

      setSummary(summary);
      return summary;
    } catch (error) {
      console.error("Ошибка при генерации пересказа:", error);
      return 'Не удалось создать пересказ.';
    }
  };

  // Автозамена: первая буква — заглавная
  const capitalizeFirstLetter = (input) => {
    if (!input) return input;

    // Разделяем на абзацы по двойному переносу (\n\n)
    const paragraphs = input.split('\n\n');

    const processedParagraphs = paragraphs.map(paragraph => {
      // Каждое предложение начинается с заглавной буквы
      return paragraph.replace(/([.!?]\s+|^)(\w)/g, (match, p1, p2) => {
        return p1 + p2.toUpperCase();
      });
    });

    return processedParagraphs.join('\n\n');
  };

  // Обработчик ввода
  const handleInput = (e) => {
    const newText = e.currentTarget.innerText;
    const formattedText = capitalizeFirstLetter(newText);
    setText(formattedText);

    // Обновляем подсветку ошибок
    if (!dictionary || !formattedText) return;
    const words = formattedText.split(/\b/);
    const result = words.map(word => ({
      word,
      correct: dictionary.check(word),
    }));
    setHighlightedText(
      result
        .map(({ word, correct }) =>
          !correct && word.match(/\w+/)
            ? `<span class="misspelled">${word}</span>`
            : word
        )
        .join('')
    );
  };

  const applyFormat = (format) => {
    const textarea = document.getElementById('editor-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let selectedText = text.substring(start, end);
    if (!selectedText) return;
    let newText = '';
    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'underline':
        newText = `__${selectedText}__`;
        break;
      default:
        newText = selectedText;
    }
    setText(text.slice(0, start) + newText + text.slice(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + newText.length);
    }, 0);
  };

  const renderPreview = () => {
    let content = text;
    content = text ? text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') : '';
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    content = content.replace(/__(.+?)__/g, '<u>$1</u>');
    return <div
      contentEditable
      onInput={handleInput}
      onBlur={() => {
        const editable = document.getElementById('editable');
        const rawText = editable?.innerText || '';
        const formattedText = capitalizeFirstLetter(rawText);
        setText(formattedText);
      }}
      id="editable"
      className="p-6 rounded-lg shadow-xl border bg-transparent focus:outline-none min-h-[300px]"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        color: textColor,
        backgroundColor: bgColor
      }}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
    />;
  };

  const updateContentPlanItem = (index, field, value) => {
    setContentPlan(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addContentPlanItem = () => {
    setContentPlan(prev => [
      ...prev,
      { id: Date.now(), title: `Новый пункт`, completed: false }
    ]);
  };

  const removeContentPlanItem = (index) => {
    setContentPlan(prev => prev.filter((_, i) => i !== index));
  };

  const getDailyProgress = () => {
    const today = new Date().toISOString().split('T')[0];
    const wordsToday = wordCountHistory[today] || 0;
    return Math.min(Math.round((wordsToday / dailyGoal) * 100), 100);
  };

  return (
    <section className="animate-fadeIn">
      <h2 className="text-3xl font-bold mb-6">Литературный редактор</h2>
      <p className="mb-4">
        Вы работаете над: <strong>{currentWork?.title || 'Неизвестное произведение'}</strong>
      </p>
      {/* Toolbar */}
      <div className={`mb-4 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className={`px-3 py-2 rounded border ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="'Courier New'">Courier New</option>
            <option value="'Georgia'">Georgia</option>
          </select>
          <input
            type="range"
            min="12"
            max="32"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="col-span-2 w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => applyFormat('bold')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              <BoldIcon />
            </button>
            <button
              onClick={() => applyFormat('italic')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white"
            >
              <ItalicIcon />
            </button>
            <button
              onClick={() => applyFormat('underline')}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white"
            >
              <UnderlineIcon />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm">Цвет текста:</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm">Цвет фона:</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
      {/* View Toggle */}
      <div className="flex mb-4">
        <button
          onClick={() => setViewMode('edit')}
          className={`px-4 py-2 rounded-l-md ${
            viewMode === 'edit'
              ? 'bg-blue-600 text-white'
              : darkMode
              ? 'bg-gray-700 text-gray-300'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Редактировать
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`px-4 py-2 rounded-r-md ${
            viewMode === 'preview'
              ? 'bg-blue-600 text-white'
              : darkMode
              ? 'bg-gray-700 text-gray-300'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Предпросмотр
        </button>
      </div>
      {/* Editor Area */}
      <div
        className={`p-6 rounded-lg shadow-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          color: textColor,
          backgroundColor: bgColor
        }}
      >
        {viewMode === 'edit' ? (
          <textarea
            id="editor-textarea"
            value={text}
            onChange={(e) => {
              const newText = e.target.value;
              const formattedText = capitalizeFirstLetter(newText);
              setText(formattedText);
              // Обновляем подсветку ошибок
              if (!dictionary || !formattedText) return;
              const words = formattedText.split(/\b/);
              const result = words.map(word => ({
                word,
                correct: dictionary.check(word),
              }));
              setHighlightedText(
                result
                  .map(({ word, correct }) =>
                    !correct && word.match(/\w+/)
                      ? `<span class="misspelled">${word}</span>`
                      : word
                  )
                  .join('')
              );
            }}
            placeholder="Начните писать вашу историю..."
            className="w-full h-96 bg-transparent focus:outline-none resize-none"
            style={{ fontFamily, fontSize: `${fontSize}px`, color: textColor }}
          />
        ) : (
          <div className="h-96 overflow-y-scroll" style={{ fontFamily, fontSize: `${fontSize}px` }}>
            {renderPreview()}
          </div>
        )}
      </div>
      {/* AI Button */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => {
            setAiContext(text); // <-- передаем текущий текст как контекст
            setShowModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        >
          Новый текст с AI
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          {showChat ? 'Скрыть чат' : 'Открыть чат'}
        </button>
      </div>
      {/* AI Buttons */}
      <div className="mt-6 flex space-x-4">
        {!generatedText ? (
          <button
            onClick={() => generateTextWithAI()}
            disabled={generating}
            className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors ${
              generating ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {generating ? 'Генерация...' : 'Начать текст'}
          </button>
        ) : (
          <button
            onClick={() => generateTextWithAI(aiContext)}
            disabled={generating}
            className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors ${
              generating ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {generating ? 'Продолжение...' : 'Продолжить'}
          </button>
        )}
      </div>
      {/* Stats */}
      <div
        className={`mt-4 p-3 rounded ${
          darkMode ? 'bg-gray-800' : 'bg-gray-200'
        } text-sm`}
      >
        <span>Слов: {wordCount}</span> | <span>Символов: {charCount}</span>
      </div>
      {/* Actions */}
      <div className="mt-4 flex justify-end space-x-2">
        <button
          className={`px-4 py-2 rounded-md ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'
          }`}
        >
          Сохранить черновик
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors">
          Экспортировать
        </button>
      </div>
      {/* Additional Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Writing Goal */}
        <div
          className={`rounded-lg shadow-md border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3`}
          >
            <h3 className="font-semibold">Ежедневная цель</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="goal" className="block text-sm font-medium">
                Установите дневную цель слов:
              </label>
              <input
                type="number"
                id="goal"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
                className={`w-24 p-2 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Прогресс за сегодня</span>
                <span>{getDailyProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${getDailyProgress()}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Сегодня вы написали{' '}
              {wordCountHistory[new Date().toISOString().split('T')[0]] || 0} слов
            </p>
          </div>
        </div>
        {/* Content Plan */}
        <div
          className={`rounded-lg shadow-md border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 flex justify-between items-center`}
          >
            <h3 className="font-semibold">План произведения</h3>
            <button
              onClick={addContentPlanItem}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + Добавить пункт
            </button>
          </div>
          <div className="p-4 space-y-3">
            {contentPlan.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) =>
                    updateContentPlanItem(index, 'completed', e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <input
                  value={item.title}
                  onChange={(e) =>
                    updateContentPlanItem(index, 'title', e.target.value)
                  }
                  className={`flex-1 p-2 rounded border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                />
                <button
                  onClick={() => removeContentPlanItem(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Pomodoro Timer */}
        <div
          className={`rounded-lg shadow-md border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 flex justify-between items-center`}
          >
            <h3 className="font-semibold">Таймер Pomodoro</h3>
            <button
              onClick={() => setShowPomodoro(!showPomodoro)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              {showPomodoro ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {showPomodoro && (
            <div className="p-4">
              <div className="flex justify-center mb-4">
                <div className="text-4xl font-mono">{formatTime(pomodoroTime)}</div>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={togglePomodoro}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  {isPomodoroRunning ? 'Пауза' : 'Старт'}
                </button>
                <button
                  onClick={resetPomodoro}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Сброс
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500 text-center">
                Используйте Pomodoro для повышения продуктивности: 25 минут работы, затем 5 минут перерыва
              </p>
            </div>
          )}
        </div>
        {/* Reference Cards */}
        <div
          className={`rounded-lg shadow-md border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <div
            className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-3 flex justify-between items-center`}
          >
            <h3 className="font-semibold">Справочные карточки</h3>
            <button
              onClick={() => setShowCardReference(!showCardReference)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              {showCardReference ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {showCardReference && (
            <div className="p-4">
              <select
                value={selectedCardType}
                onChange={(e) => setSelectedCardType(e.target.value)}
                className={`mb-4 w-full p-2 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="characters">Персонажи</option>
                <option value="locations">Локации</option>
                <option value="events">События</option>
              </select>
              <div className="max-h-64 overflow-y-auto">
                {cardsData[selectedCardType]?.map(card => (
                  <div
                    key={card.id}
                    className={`p-3 rounded border mb-2 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h4 className="font-bold">{card.name}</h4>
                    <div className="text-xs text-gray-500">
                      {card.fields.slice(0, 2).map((f, i) => (
                        <div key={i}>
                          <span className="uppercase text-xs text-gray-400">
                            {f.label || 'Поле'}:
                          </span>
                          <p>{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* AI Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className={`relative w-full max-w-lg rounded-lg shadow-xl p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">Генератор текста на основе ИИ</h3>
            <textarea
              placeholder="Введите запрос для генерации текста..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`w-full p-3 mb-4 border rounded resize-none ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
              rows="4"
            />
            <div className="flex space-x-2">
              <button
                onClick={generateTextWithAI}
                disabled={generating || !prompt.trim()}
                className={`px-4 py-2 rounded-md text-white ${
                  generating || !prompt.trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {generating ? 'Генерация...' : 'Сгенерировать'}
              </button>
              <button
                onClick={() => {
                  setText(prev => prev + '\n' + generatedText);
                  setShowModal(false);
                }}
                disabled={!generatedText}
                className={`px-4 py-2 rounded-md text-white ${
                  !generatedText
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Вставить в текст
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Отмена
              </button>
            </div>
            {aiError && <p className="text-red-500 mt-3">{aiError}</p>}
            {generatedText && (
              <div
                className={`mt-4 max-h-60 overflow-y-auto p-3 rounded border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <h4 className="font-medium mb-2">Сгенерированный текст:</h4>
                <p className="whitespace-pre-wrap">{generatedText}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Интеграция чата */}
      {showChat && (
        <>
          <ChatPanel
            darkMode={darkMode}
            aiContext={text}
            generateTextWithAI={generateTextWithAI}
            onClose={() => setShowChat(false)}
          />
        </>
      )}

      {/* Summary Section */}
      <div className={`mt-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Краткое содержание:</h4>
          <button
            onClick={async () => {
              if (!text.trim()) {
                alert('Невозможно создать пересказ: текст пустой');
                return;
              }

              const words = text.split(/\s+/);
              let newSummary = '';

              if (words.length <= 100) {
                newSummary = text;
              } else {
                newSummary = await generateSummaryWithAI(text);
              }

              setSummary(newSummary);
            }}
            disabled={!text.trim()}
            className={`text-xs px-2 py-1 rounded ${
              !text.trim()
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Обновить пересказ
          </button>
        </div>
        {summary ? (
          <p className="whitespace-pre-wrap">{summary}</p>
        ) : (
          <p className="text-sm text-gray-500 italic">Нажмите "Обновить пересказ", чтобы увидеть краткое содержание.</p>
        )}
      </div>
    </section>
  );
}
