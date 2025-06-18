/**
 * Генерирует карточку через ИИ на основе типа, названия произведения и пользовательского запроса
 */
export const generateCardWithAI = async (cardType, currentWorkTitle, customPrompt) => {
  const promptContent = `
    Создайте уникальную карточку для произведения "${currentWorkTitle}".
    Тип карточки: ${cardType}.
    Пользовательский запрос: ${customPrompt || 'Обычная карточка'}

    Если тип "персонаж", то укажите: имя, внешность, мотивацию и биографию.
    Если тип "локация", то укажите: название, описание, атмосферу и детали.
    Если тип "событие", то укажите: дату, описание, участников и последствия.
  `.trim();

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
              Вы — помощник по созданию литературных карточек.
              Следуйте заданному формату:
              - Персонаж: Имя, Внешность, Мотивация, Биография
              - Локация: Название, Описание, Атмосфера, Детали
              - Событие: Дата, Описание, Участники, Последствия
              Каждое поле должно быть в формате "Поле: значение" на новой строке.
              Не добавляйте ничего лишнего.
              Отвечайте СТРОГО на русском языке.
            `,
          },
          { role: 'user', content: promptContent },
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
      }),
    });

    if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) throw new Error('Пустой ответ от модели.');

    return parseAICardResponse(aiResponse, cardType);
  } catch (error) {
    console.error('Ошибка генерации карточки:', error);
    return null;
  }
};

/**
 * Парсит ответ от ИИ и возвращает структурированный объект карточки
 */
export const parseAICardResponse = (response, cardType) => {
  const lines = response.split('\n').map(line => line.trim());
  const fields = {};
  let currentLabel = '';
  let buffer = '';

  const labelMap = {
    characters: ['Имя', 'Внешность', 'Мотивация', 'Биография'],
    locations: ['Название', 'Описание', 'Атмосфера', 'Детали'],
    events: ['Дата', 'Описание', 'Участники', 'Последствия'],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const matchedLabel = labelMap[cardType].find(label => line.startsWith(label + ':'));

    if (matchedLabel) {
      if (currentLabel && buffer.trim()) {
        fields[currentLabel] = buffer.trim();
        buffer = '';
      }

      const parts = line.split(':');
      currentLabel = parts[0];
      buffer = parts.slice(1).join(':').trim();
    } else if (line !== '') {
      buffer += ' ' + line;
    }
  }

  if (currentLabel && buffer.trim()) {
    fields[currentLabel] = buffer.trim();
  }

  switch (cardType) {
    case 'characters':
      return {
        id: Date.now(),
        name: fields['Имя'] || 'Новый персонаж',
        fields: [
          { label: 'Внешность', value: fields['Внешность'] || '' },
          { label: 'Мотивация', value: fields['Мотивация'] || '' },
          { label: 'Биография', value: fields['Биография'] || '' },
        ],
      };
    case 'locations':
      return {
        id: Date.now(),
        name: fields['Название'] || 'Новая локация',
        fields: [
          { label: 'Описание', value: fields['Описание'] || '' },
          { label: 'Атмосфера', value: fields['Атмосфера'] || '' },
          { label: 'Детали', value: fields['Детали'] || '' },
        ],
      };
    case 'events':
      return {
        id: Date.now(),
        name: fields['Дата'] || 'Новое событие',
        fields: [
          { label: 'Описание', value: fields['Описание'] || '' },
          { label: 'Участники', value: fields['Участники'] || '' },
          { label: 'Последствия', value: fields['Последствия'] || '' },
        ],
      };
    default:
      return null;
  }
};
