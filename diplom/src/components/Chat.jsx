import React, { useState } from 'react';

const Chat = ({ darkMode, currentWork, aiContext, generateTextWithAI }) => {
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
      setChatHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error("Ошибка:", error);
      setChatHistory([...newHistory, { role: 'assistant', content: 'Произошла ошибка при подключении к ИИ.' }]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className="text-xl font-semibold mb-4">Литературный консультант</h3>
      <p className="mb-4">
        Обсудите своё произведение "<strong>{currentWork.title}</strong>" или запросите помощь в написании:
      </p>

      {/* Chat History */}
      <div className="h-80 overflow-y-auto mb-4 border rounded p-3 space-y-3" style={{ maxHeight: '30rem' }}>
        {chatHistory.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Здесь появится ваш диалог с ИИ.</p>
        ) : (
          chatHistory.map((msg, index) => (
            <div key={index} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-right text-blue-800' : 'bg-green-100 text-left text-green-800'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Prompt Input */}
      <div className="flex gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Спросите что-то о произведении, персонажах или попросите помочь с главой..."
          className={`flex-1 p-3 rounded border resize-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          rows="3"
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className={`px-4 py-2 rounded-md text-white ${
            generating || !prompt.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {generating ? 'Генерация...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
};

export default Chat;
