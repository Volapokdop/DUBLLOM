import React, { useState, useEffect, useCallback } from 'react';
import Editor from './Editor';
import Cards from './Cards';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ScriptModule from './ScriptModule';
import Chat from './Chat';

// Firebase imports (заглушки)
import {
  auth,
  db,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc
} from './firebase';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Страницы
  const [activePage, setActivePage] = useState('editor');

  // Редактор
  const [fontFamily, setFontFamily] = useState('serif');
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(true);
  const [textColor, setTextColor] = useState('#e0e0e0');
  const [bgColor, setBgColor] = useState('#1a1a1a');

  // Данные произведений
  const [works, setWorks] = useState([{ id: 'default', title: 'Новое произведение' }]);
  const [currentWorkId, setCurrentWorkId] = useState('default');
  const [cardsData, setCardsData] = useState({
    default: { characters: [], locations: [], events: [] }
  });

  // Тексты для каждого произведения
  const [workTexts, setWorkTexts] = useState({
    default: ''
  });

  // Цели и Pomodoro
  const [dailyGoal, setDailyGoal] = useState(500);
  const [wordCountHistory, setWordCountHistory] = useState({});
  const [contentPlan, setContentPlan] = useState([
    { id: 1, title: 'Вступление', completed: false },
    { id: 2, title: 'Завязка', completed: false },
    { id: 3, title: 'Кульминация', completed: false },
    { id: 4, title: 'Развязка', completed: false }
  ]);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPodoroRunning] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  // Авторизация
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');

  // AI генерация
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiContext, setAiContext] = useState('');

  // Сцены
  const [scenes, setScenes] = useState([]);

  // Загрузка данных пользователя из Firestore
  const loadUserData = useCallback(async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setWorks(data.works || [{ id: 'default', title: 'Новое произведение' }]);
        setCardsData(data.cards || { default: { characters: [], locations: [], events: [] } });
        setContentPlan(data.contentPlan || [
          { id: 1, title: 'Вступление', completed: false },
          { id: 2, title: 'Завязка', completed: false },
          { id: 3, title: 'Кульминация', completed: false },
          { id: 4, title: 'Развязка', completed: false }
        ]);
        setDailyGoal(data.dailyGoal || 500);
        setWordCountHistory(data.wordCountHistory || {});
        setFontFamily(data.fontFamily || 'serif');
        setFontSize(data.fontSize || 16);
        setDarkMode(data.darkMode ?? true);
        setTextColor(data.textColor || '#e0e0e0');
        setBgColor(data.bgColor || '#1a1a1a');
        setCurrentWorkId(data.currentWorkId || 'default');
        setScenes(data.scenes || []);
        setWorkTexts(data.workTexts || { default: '' });
      } else {
        resetToDefault();
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  }, []);

  // Сохранение данных пользователя в Firestore
  const saveUserData = useCallback(async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        works,
        cards: cardsData,
        contentPlan,
        dailyGoal,
        wordCountHistory,
        fontFamily,
        fontSize,
        darkMode,
        textColor,
        bgColor,
        currentWorkId,
        scenes,
        workTexts
      }, { merge: true });
    } catch (error) {
      console.error("Ошибка сохранения данных:", error);
    }
  }, [
    user, works, cardsData, contentPlan, dailyGoal, wordCountHistory,
    fontFamily, fontSize, darkMode, textColor, bgColor, currentWorkId, scenes, workTexts
  ]);

  // Подписываемся на изменения пользователя
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
      } else {
        setUser(null);
        resetToDefault();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  // Сохраняем данные при изменении
  useEffect(() => {
    if (!loading && user) {
      saveUserData();
    }
  }, [
    loading,
    user,
    saveUserData,
    works, cardsData, contentPlan, dailyGoal, wordCountHistory,
    fontFamily, fontSize, darkMode, textColor, bgColor, currentWorkId, scenes, workTexts
  ]);

  const updateWorks = (updatedWorks) => {
    setWorks(updatedWorks);
  };

  // Сброс к дефолту
  const resetToDefault = () => {
    setWorks([{ id: 'default', title: 'Новое произведение' }]);
    setCardsData({
      default: { characters: [], locations: [], events: [] }
    });
    setContentPlan([
      { id: 1, title: 'Вступление', completed: false },
      { id: 2, title: 'Завязка', completed: false },
      { id: 3, title: 'Кульминация', completed: false },
      { id: 4, title: 'Развязка', completed: false }
    ]);
    setDailyGoal(500);
    setWordCountHistory({});
    setFontFamily('serif');
    setFontSize(16);
    setDarkMode(true);
    setTextColor('#e0e0e0');
    setBgColor('#1a1a1a');
    setCurrentWorkId('default');
    setScenes([]);
    setWorkTexts({
      default: ''
    });
  };

  // Выход
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  // Вход или регистрация
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // Генерация текста через ИИ
  const generateTextWithAI = async (continueFrom = '') => {
    // Получаем текущий текст произведения или продолжаем из continueFrom
    const rawContext = continueFrom || workTexts[currentWorkId];
    const context = typeof rawContext === 'string' ? rawContext : '';

    let promptContent = '';
    const finalPrompt = prompt.trim() || ''; // пользовательский запрос

    // Функция для получения краткого пересказа
    const getSummary = async (text) => {
      if (!text || text.length < 500) return text; // короткие тексты передаём полностью

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
                  Создайте краткое содержание текста, используя не более 100 слов.
                  Сохраните ключевые моменты: персонажи, конфликт, развитие действия.
                  Отвечайте только на русском языке.
                `,
              },
              {
                role: 'user',
                content: `Кратко перескажите следующий текст:\n\n${text}`,
              },
            ],
            temperature: 0.5,
            max_tokens: 150,
          }),
        });

        if (!response.ok) throw new Error('Ошибка API при создании пересказа');

        const data = await response.json();
        return data.choices[0]?.message?.content || context.slice(0, 500);
      } catch (error) {
        console.error('Ошибка создания пересказа:', error);
        return context.slice(0, 500); // fallback: первые 500 символов
      }
    };

    // Получаем краткий контекст (или весь текст)
    const summary = await getSummary(context);

    // Формируем промпт в зависимости от наличия контекста
    if (!context.trim()) {
      const workTitle = works.find(w => w.id === currentWorkId)?.title || 'Новое произведение';
      promptContent = `
        Начни писать художественный текст для произведения "${workTitle}".
        Тема: ${finalPrompt}
      `;
      setAiContext(promptContent);
    } else {
      const lastParagraph = context.split('\n').slice(-2).join('\n');
      promptContent = `
        Продолжи художественный текст: ${lastParagraph}.
        Учти следующий запрос пользователя: ${finalPrompt}
      `;
      setAiContext(context);
    }

    setGenerating(true);
    setAiError('');
    setGeneratedText('');

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
                Вы — талантливый автор художественных текстов, говорящий на русском языке.
                Пишите оригинальные, логичные и творческие продолжения текста.
                Следуйте жанру и стилю предыдущего текста.
                Избегайте повторений, бессмысленных слов и пустых конструкций.
                Контекст текста: "${summary}"
              `,
            },
            {
              role: 'user',
              content: `Пожалуйста, отвечайте только на русском языке.\n\n${promptContent}`
            }
          ],
          temperature: 0.7,
          max_tokens: 400,
          top_p: 0.95,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
        }),
      });

      if (!response.ok) throw new Error(`Ошибка API: ${response.statusText}`);
      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        let aiResponse = data.choices[0].message.content;

        // Очистка ответа от повторений и шума
        aiResponse = aiResponse.replace(/(\b\w+\b)(\s+\1)+/g, "$1");
        aiResponse = aiResponse.replace(/(И пыль…\s*){3,}/g, '');

        // Обновление текста и контекста
        setWorkTexts(prev => ({
          ...prev,
          [currentWorkId]: (prev[currentWorkId] || '') + '\n' + aiResponse
        }));
        setAiContext(prev => (typeof prev === 'string' ? prev : '') + '\n' + aiResponse);
        setGeneratedText(aiResponse);
      } else {
        throw new Error('Не удалось получить ответ от модели.');
      }
    } catch (error) {
      console.error("Ошибка генерации текста:", error);
      setAiError('Произошла ошибка при генерации текста. Проверьте API ключ и попробуйте снова.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Загрузка...
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {!user ? (
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
          <form onSubmit={handleAuth} className={`w-full max-w-md p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Вход' : 'Регистрация'}</h2>
            {authError && <p className="text-red-500 mb-4">{authError}</p>}
            <div className="mb-4">
              <label className="block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded bg-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
            >
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-500 hover:text-blue-700"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <Header
            activePage={activePage}
            setActivePage={setActivePage}
            darkMode={darkMode}
            onLogout={handleLogout}
          />

          <div className="flex container mx-auto px-4 py-8 gap-6">
            <Sidebar
              works={works}
              currentWorkId={currentWorkId}
              setCurrentWorkId={setCurrentWorkId}
              darkMode={darkMode}
              addNewWork={() => {
                const newWork = {
                  id: Date.now(),
                  title: `Произведение ${works.length + 1}`
                };
                setWorks(prev => [...prev, newWork]);
                setCardsData(prev => ({
                  ...prev,
                  [newWork.id]: {
                    characters: [],
                    locations: [],
                    events: []
                  }
                }));
                setWorkTexts(prev => ({
                  ...prev,
                  [newWork.id]: ''
                }));
                setCurrentWorkId(newWork.id);
              }}
              deleteWork={(id) => {
                const updatedWorks = works.filter(w => w.id !== id);
                const updatedCards = { ...cardsData };
                const updatedTexts = { ...workTexts };
                delete updatedCards[id];
                delete updatedTexts[id];
                setWorks(updatedWorks);
                setCardsData(updatedCards);
                setWorkTexts(updatedTexts);
                if (currentWorkId === id && updatedWorks.length > 0) {
                  setCurrentWorkId(updatedWorks[0].id);
                }
                if (updatedWorks.length === 0) {
                  const newWork = {
                    id: Date.now(),
                    title: 'Новое произведение'
                  };
                  setWorks([newWork]);
                  setCardsData({
                    [newWork.id]: {
                      characters: [],
                      locations: [],
                      events: []
                    }
                  });
                  setWorkTexts({
                    [newWork.id]: ''
                  });
                  setCurrentWorkId(newWork.id);
                }
              }}
              setWorks={updateWorks}
            />

            <main className="flex-1">
              {activePage === 'chat' && (
                <Chat
                  darkMode={darkMode}
                  currentWork={works.find(w => w.id === currentWorkId)}
                  aiContext={aiContext}
                  generateTextWithAI={generateTextWithAI}
                />
              )}
              {activePage === 'editor' && (
                <Editor
                  text={workTexts[currentWorkId]}
                  setText={(newText) => setWorkTexts(prev => ({ ...prev, [currentWorkId]: newText }))}
                  fontFamily={fontFamily}
                  setFontFamily={setFontFamily}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  textColor={textColor}
                  setTextColor={setTextColor}
                  bgColor={bgColor}
                  setBgColor={setBgColor}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  currentWork={works.find(w => w.id === currentWorkId)}
                  cardsData={cardsData[currentWorkId]}
                  contentPlan={contentPlan}
                  setContentPlan={setContentPlan}
                  dailyGoal={dailyGoal}
                  setDailyGoal={setDailyGoal}
                  wordCountHistory={wordCountHistory}
                  showPomodoro={showPomodoro}
                  setShowPomodoro={setShowPomodoro}
                  pomodoroTime={pomodoroTime}
                  formatTime={(seconds) => {
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  }}
                  isPomodoroRunning={isPomodoroRunning}
                  togglePomodoro={() => setIsPodoroRunning(!isPomodoroRunning)}
                  resetPomodoro={() => setPomodoroTime(25 * 60)}
                  setIsPodoroRunning={setIsPodoroRunning}
                  setPomodoroTime={setPomodoroTime}
                  // AI props
                  aiContext={aiContext}
                  setAiContext={setAiContext}
                  showModal={showModal}
                  setShowModal={setShowModal}
                  prompt={prompt}
                  setPrompt={setPrompt}
                  generating={generating}
                  aiError={aiError}
                  generatedText={generatedText}
                  generateTextWithAI={generateTextWithAI}
                />
              )}
              {activePage === 'cards' && (
                <Cards
                  works={works}
                  cardsData={cardsData}
                  setCardsData={setCardsData}
                  currentWorkId={currentWorkId}
                  setCurrentWorkId={setCurrentWorkId}
                  darkMode={darkMode}
                />
              )}
              {activePage === 'script' && (
                <ScriptModule
                  darkMode={darkMode}
                  scenes={scenes}
                  setScenes={setScenes}
                  cardsData={cardsData[currentWorkId]}
                  currentWorkId={currentWorkId}
                  setText={(newText) => setWorkTexts(prev => ({ ...prev, [currentWorkId]: newText }))}
                />
              )}
            </main>
          </div>

          <Footer darkMode={darkMode} />
        </>
      )}
    </div>
  );
}
