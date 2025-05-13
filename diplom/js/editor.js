document.addEventListener('DOMContentLoaded', function() {
    // Основные элементы управления
    const usernameDisplay = document.getElementById('username-display');
    const newTextBtn = document.getElementById('new-text-btn');
    const saveTextBtn = document.getElementById('save-text-btn');
    const deleteTextBtn = document.getElementById('delete-text-btn');
    const textsList = document.getElementById('texts-list');
    const textTitle = document.getElementById('text-title');
    const chaptersContainer = document.getElementById('chapters-container');

    // Элементы форматирования
    const formattingTools = {
        boldBtn: document.getElementById('bold-btn'),
        italicBtn: document.getElementById('italic-btn'),
        underlineBtn: document.getElementById('underline-btn'),
        strikeBtn: document.getElementById('strike-btn'),
        fontFamily: document.getElementById('font-family'),
        fontSize: document.getElementById('font-size'),
        textColor: document.getElementById('text-color'),
        alignLeftBtn: document.getElementById('align-left-btn'),
        alignCenterBtn: document.getElementById('align-center-btn'),
        alignRightBtn: document.getElementById('align-right-btn'),
        insertLinkBtn: document.getElementById('insert-link-btn'),
        wordCountBtn: document.getElementById('word-count-btn'),
        nightModeBtn: document.getElementById('night-mode-btn'),
        scriptFormatBtn: document.getElementById('script-format-btn'),
        scriptFormatTools: document.getElementById('script-format-tools'),
        characterBtn: document.getElementById('character-btn'),
        dialogueBtn: document.getElementById('dialogue-btn'),
        parentheticalBtn: document.getElementById('parenthetical-btn')
    };

    // Элементы для работы с главами и заметками
    const chapterTools = {
        addChapterBtn: document.getElementById('add-chapter-btn'),
        addPageBtn: document.getElementById('add-page-btn'),
        toggleNotesBtn: document.getElementById('toggle-notes-btn'),
        notesSidebar: document.getElementById('notes-sidebar'),
        notesContainer: document.getElementById('notes-container'),
        addNoteBtn: document.getElementById('add-note-btn')
    };

    // Модальные окна
    const modals = {
        statsModal: document.getElementById('stats-modal'),
        linkModal: document.getElementById('link-modal'),
        linkUrl: document.getElementById('link-url'),
        linkText: document.getElementById('link-text'),
        insertLinkConfirm: document.getElementById('insert-link-confirm')
    };

    let currentTextId = localStorage.getItem('lastOpenedTextId') || null;
    let currentSelectedElement = null;
    let savedSelection = null;

    // Инициализация редактора
    initEditor();

    function initEditor() {
        checkAuth();
        loadTexts();
        setupCardLinking();
        setupEventListeners();
        checkNightMode();
    }

    function setupCardLinking() {
        // Создаем кнопку для связывания с карточками
        const insertCardLinkBtn = document.createElement('button');
        insertCardLinkBtn.id = 'insert-card-link-btn';
        insertCardLinkBtn.title = 'Связать с карточкой (Ctrl+Shift+K)';
        insertCardLinkBtn.innerHTML = '🃏';

        // Добавляем кнопку в панель инструментов после кнопки вставки ссылки
        const insertLinkBtn = document.getElementById('insert-link-btn');
        if (insertLinkBtn && insertLinkBtn.parentNode) {
            insertLinkBtn.parentNode.insertBefore(insertCardLinkBtn, insertLinkBtn.nextSibling);
        }

        // Сохраняем ссылку на кнопку
        formattingTools.insertCardLinkBtn = insertCardLinkBtn;

        // Создаем модальное окно для выбора карточки
        const cardLinkModal = document.createElement('div');
        cardLinkModal.id = 'card-link-modal';
        cardLinkModal.className = 'modal';
        cardLinkModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Связать с карточкой</h2>
                <div class="modal-controls">
                    <select id="card-link-type">
                        <option value="">Все типы</option>
                        <option value="character">Персонажи</option>
                        <option value="location">Локации</option>
                        <option value="event">События</option>
                    </select>
                    <input type="text" id="card-link-search" placeholder="Поиск карточки..." autocomplete="off">
                </div>
                <div id="card-link-list" class="card-link-list"></div>
            </div>
        `;
        document.body.appendChild(cardLinkModal);

        // Обработчик кликов по связанным карточкам в тексте
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('card-link')) {
                e.preventDefault();
                const cardId = e.target.dataset.cardId;
                showCardPreview(cardId);
            }
        });
    }

    function showCardPreview(cardId) {
        fetch(`php/cards.php?action=get&id=${cardId}`)
            .then(response => response.json())
            .then(card => {
                // Создаем overlay
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';

                // Создаем превью карточки
                const preview = document.createElement('div');
                preview.className = 'card-preview';
                preview.innerHTML = `
                    <div class="card-preview-header">
                        <h3>${card.title}</h3>
                        <span class="type-badge ${card.type}">${getTypeName(card.type)}</span>
                    </div>
                    <div class="card-preview-content">${card.content || '<em>Нет содержимого</em>'}</div>
                    ${card.fields ? renderCardFields(JSON.parse(card.fields)) : ''}
                    <div class="card-preview-footer">
                        <button class="btn close-preview">Закрыть</button>
                        <button class="btn open-card" data-id="${card.id}">Открыть карточку</button>
                    </div>
                `;

                // Обработчики кнопок
                preview.querySelector('.close-preview').addEventListener('click', () => {
                    overlay.remove();
                });

                preview.querySelector('.open-card').addEventListener('click', (e) => {
                    window.open(`cards.html#card-${card.id}`, '_blank');
                });

                overlay.appendChild(preview);
                document.body.appendChild(overlay);

                // Закрытие по клику на overlay
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки карточки:', error);
                alert('Не удалось загрузить информацию о карточке');
            });
    }

    function renderCardFields(fields) {
        if (!fields || Object.keys(fields).length === 0) return '';

        let html = '<div class="card-fields"><h4>Дополнительные поля</h4><dl>';
        for (const [key, value] of Object.entries(fields)) {
            if (value) {
                html += `<dt>${key}</dt><dd>${value}</dd>`;
            }
        }
        html += '</dl></div>';
        return html;
    }

    function getTypeName(type) {
        const types = {
            'character': 'Персонаж',
            'location': 'Локация',
            'event': 'Событие',
            'other': 'Другое'
        };
        return types[type] || type;
    }

    function saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            savedSelection = selection.getRangeAt(0);
        }
    }

    function restoreSelection() {
        if (savedSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
        }
    }

    function showCardLinkModal() {
        saveSelection(); // Сохраняем выделение перед открытием модального окна

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (!selection.toString().trim()) {
            alert('Выделите текст, который хотите связать с карточкой');
            return;
        }

        const modal = document.getElementById('card-link-modal');
        modal.style.display = 'block';

        // Показываем выделенный текст в заголовке модального окна
        const title = modal.querySelector('h2');
        title.textContent = `Связать "${selectedText}" с карточкой`;

        // Сброс поиска
        document.getElementById('card-link-search').value = '';
        document.getElementById('card-link-type').value = '';

        loadCardsForLinking();

        // Обработчики событий
        document.getElementById('card-link-search').addEventListener('input', (e) => {
            loadCardsForLinking(e.target.value, document.getElementById('card-link-type').value);
        });

        document.getElementById('card-link-type').addEventListener('change', (e) => {
            loadCardsForLinking(document.getElementById('card-link-search').value, e.target.value);
        });
    }

    function loadCardsForLinking(searchQuery = '', type = '') {
        let url = 'php/cards.php?action=list';
        if (searchQuery || type) {
            url += `&search=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(type)}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(cards => {
                const list = document.getElementById('card-link-list');
                list.innerHTML = '';

                if (cards.length === 0) {
                    list.innerHTML = '<div class="no-cards">Карточки не найдены</div>';
                    return;
                }

                cards.forEach(card => {
                    const cardElement = document.createElement('div');
                    cardElement.className = `card-link-item ${card.type}`;
                    cardElement.innerHTML = `
                        <div class="card-link-title">${card.title}</div>
                        <div class="card-link-type">${getTypeName(card.type)}</div>
                    `;
                    cardElement.dataset.id = card.id;

                    cardElement.addEventListener('click', () => {
                        linkTextToCard(card.id);
                    });

                    list.appendChild(cardElement);
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки карточек:', error);
                document.getElementById('card-link-list').innerHTML =
                    '<div class="error">Ошибка загрузки карточек</div>';
            });
    }

    function linkTextToCard(cardId) {
        restoreSelection(); // Восстанавливаем выделение перед связыванием

        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            alert('Выделение потеряно. Пожалуйста, выделите текст снова.');
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        if (!selectedText) {
            alert('Выделенный текст пуст');
            return;
        }

        // Создаем span с классом и data-атрибутом
        const span = document.createElement('span');
        span.className = 'card-link';
        span.dataset.cardId = cardId;
        span.textContent = selectedText;

        // Заменяем выделенный текст
        range.deleteContents();
        range.insertNode(span);

        // Закрываем модальное окно
        document.getElementById('card-link-modal').style.display = 'none';

        // Сохраняем изменения
        saveText();

        console.log(`Текст "${selectedText}" связан с карточкой ID: ${cardId}`);
    }

    function checkAuth() {
        fetch('php/auth.php?action=check')
            .then(handleResponse)
            .then(data => {
                if (data.loggedIn) {
                    if (usernameDisplay) {
                        usernameDisplay.textContent = data.username;
                    }
                } else {
                    window.location.href = 'index.html';
                }
            })
            .catch(handleError);
    }

    function loadTexts() {
        fetch('php/texts.php?action=list')
            .then(handleResponse)
            .then(data => {
                textsList.innerHTML = '<option value="">Выберите текст</option>';
                data.forEach(text => {
                    const option = document.createElement('option');
                    option.value = text.id;
                    option.textContent = text.title;
                    textsList.appendChild(option);
                });

                // Восстанавливаем последний открытый текст после загрузки списка
                if (currentTextId) {
                    textsList.value = currentTextId;
                    loadText(currentTextId);
                }
            })
            .catch(handleError);
    }

    function loadText(textId) {
        // Сохраняем ID текста в localStorage
        localStorage.setItem('lastOpenedTextId', textId);
        currentTextId = textId;

        fetch(`php/texts.php?action=get&id=${textId}`)
            .then(response => {
                if (!response.ok) {
                    // Если текст не найден, сбрасываем сохраненный ID
                    localStorage.removeItem('lastOpenedTextId');
                    currentTextId = null;
                    textsList.value = '';
                    throw new Error('Текст не найден');
                }
                return response.json();
            })
            .then(data => {
                currentTextId = data.id;
                textTitle.value = data.title;

                try {
                    const content = JSON.parse(data.content);
                    renderTextContent(content);
                } catch (e) {
                    // Для обратной совместимости
                    chaptersContainer.innerHTML = data.content || '<div class="chapter"><div class="chapter-content" contenteditable="true"><p>Начните писать здесь...</p></div></div>';
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки текста:', error);
                // Не показываем alert, так как это может быть нормальной ситуацией
                // при первом открытии редактора или после удаления текста
            });
    }

    function renderTextContent(content) {
        chaptersContainer.innerHTML = '';
        chapterTools.notesContainer.innerHTML = '';

        if (content.chapters && content.chapters.length > 0) {
            content.chapters.forEach(chapter => {
                // Для обратной совместимости - если нет pages, создаем одну страницу
                if (!chapter.pages || chapter.pages.length === 0) {
                    addChapterElement(chapter.id, chapter.title, chapter.content || '<p>Начните писать здесь...</p>');
                } else {
                    // Создаем главу с несколькими страницами
                    const chapterElement = document.createElement('div');
                    chapterElement.className = 'chapter';
                    chapterElement.id = chapter.id;

                    const titleElement = document.createElement('div');
                    titleElement.className = 'chapter-title';
                    titleElement.contentEditable = 'true';
                    titleElement.textContent = chapter.title || 'Новая глава';
                    chapterElement.appendChild(titleElement);

                    const contentElement = document.createElement('div');
                    contentElement.className = 'chapter-content';

                    chapter.pages.forEach(page => {
                        const pageElement = document.createElement('div');
                        pageElement.className = 'page';
                        pageElement.contentEditable = 'true';
                        pageElement.innerHTML = page.content || '<p>Начните писать здесь...</p>';
                        contentElement.appendChild(pageElement);
                    });

                    chapterElement.appendChild(contentElement);
                    chaptersContainer.appendChild(chapterElement);
                }
            });
        } else {
            // Добавляем пустую главу по умолчанию
            addChapterElement(`chapter-${Date.now()}`, 'Глава 1', '<p>Начните писать здесь...</p>');
        }

        if (content.notes && content.notes.length > 0) {
            content.notes.forEach(note => {
                addNoteElement(note.id, note.target, note.text);
            });
        }

        updateChapterNumbers();
    }

    function addChapterElement(id, title, content) {
        // Получаем текущее количество глав
        const chapterCount = document.querySelectorAll('.chapter').length + 1;
        const chapterTitle = title || `Глава ${chapterCount}`;

        const chapterHTML = `
            <div class="chapter" id="${id}">
                <div class="chapter-title" contenteditable="true">${chapterTitle}</div>
                <div class="chapter-content">
                    <div class="page" contenteditable="true">${content || '<p>Начните писать здесь...</p>'}</div>
                </div>
            </div>
        `;
        chaptersContainer.insertAdjacentHTML('beforeend', chapterHTML);

        // Назначаем обработчики для новой главы
        const chapterElement = document.getElementById(id);
        chapterElement.addEventListener('click', function(e) {
            if (e.target.classList.contains('chapter-title') ||
                e.target.classList.contains('page')) {
                currentSelectedElement = e.target;
            }
        });

        // Обновляем нумерацию всех глав
        updateChapterNumbers();
    }

    function updateChapterNumbers() {
        document.querySelectorAll('.chapter').forEach((chapter, index) => {
            const titleElement = chapter.querySelector('.chapter-title');
            if (titleElement) {
                // Сохраняем пользовательское название, если оно не стандартное
                const currentText = titleElement.textContent;
                if (!currentText.startsWith('Глава ')) return;

                titleElement.textContent = `Глава ${index + 1}`;
            }
        });
    }

    function addNoteElement(id, targetId, text) {
        const noteHTML = `
            <div class="note" id="${id}" data-target="${targetId}">
                <p>${text}</p>
            </div>
        `;
        chapterTools.notesContainer.insertAdjacentHTML('beforeend', noteHTML);

        // Восстанавливаем связь с элементом текста
        if (targetId) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.dataset.noteId = id;
            }
        }
    }

    async function saveText() {
        try {
            const title = textTitle.value.trim();
            if (!title) {
                throw new Error('Введите название произведения');
            }

            const content = {
                title: title,
                chapters: [],
                notes: [],
                cardLinks: [] // Добавляем массив для хранения связей с карточками
            };

            // Собираем данные о главах и страницах
            document.querySelectorAll('.chapter').forEach(chapter => {
                const chapterTitle = chapter.querySelector('.chapter-title').innerHTML;
                const pages = [];

                chapter.querySelectorAll('.page').forEach(page => {
                    pages.push({
                        content: page.innerHTML
                    });

                    // Собираем связи с карточками на этой странице
                    page.querySelectorAll('.card-link').forEach(link => {
                        content.cardLinks.push({
                            cardId: link.dataset.cardId,
                            text: link.textContent,
                            chapterId: chapter.id,
                            pageContent: page.innerHTML
                        });
                    });
                });

                content.chapters.push({
                    id: chapter.id,
                    title: chapterTitle,
                    pages: pages
                });
            });

            // Собираем заметки
            document.querySelectorAll('.note').forEach(note => {
                content.notes.push({
                    id: note.id,
                    target: note.dataset.target,
                    text: note.querySelector('p').innerHTML
                });
            });

            // Отправляем данные на сервер
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', JSON.stringify(content));
            if (currentTextId) formData.append('id', currentTextId);

            const response = await fetch('php/texts.php?action=save', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Ошибка сохранения');
            }

            loadTexts();
            if (!currentTextId) {
                currentTextId = data.id;
                textsList.value = data.id;
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка сохранения: ' + error.message);
        }
    }

    function deleteText() {
        if (!currentTextId) {
            alert('Не выбран текст для удаления');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этот текст?')) {
            return;
        }

        fetch(`php/texts.php?action=delete&id=${currentTextId}`)
            .then(handleResponse)
            .then(data => {
                if (data.success) {
                    currentTextId = null;
                    localStorage.removeItem('lastOpenedTextId'); // Удаляем ID при удалении текста
                    textTitle.value = '';
                    chaptersContainer.innerHTML = '';
                    chapterTools.notesContainer.innerHTML = '';
                    loadTexts();
                } else {
                    alert(data.message || 'Ошибка удаления');
                }
            })
            .catch(handleError);
    }

    function setupEventListeners() {
        // Основные кнопки
        newTextBtn.addEventListener('click', () => {
            currentTextId = null;
            localStorage.removeItem('lastOpenedTextId'); // Удаляем ID при создании нового текста
            textTitle.value = '';
            chaptersContainer.innerHTML = '';
            chapterTools.notesContainer.innerHTML = '';
            addChapterElement(`chapter-${Date.now()}`, 'Новая глава', '<p>Начните писать здесь...</p>');
        });

        saveTextBtn.addEventListener('click', saveText);
        deleteTextBtn.addEventListener('click', deleteText);

        // Работа с текстом
        textsList.addEventListener('change', function() {
            const textId = this.value;
            if (textId) loadText(textId);
        });

        // Форматирование текста
        formattingTools.boldBtn.addEventListener('click', () => execCommandOnSelection('bold'));
        formattingTools.italicBtn.addEventListener('click', () => execCommandOnSelection('italic'));
        formattingTools.underlineBtn.addEventListener('click', () => execCommandOnSelection('underline'));
        formattingTools.strikeBtn.addEventListener('click', () => execCommandOnSelection('strikeThrough'));

        formattingTools.fontFamily.addEventListener('change', function() {
            execCommandOnSelection('fontName', false, this.value);
        });

        formattingTools.fontSize.addEventListener('change', function() {
            execCommandOnSelection('fontSize', false, this.value);
        });

        formattingTools.textColor.addEventListener('input', function() {
            execCommandOnSelection('foreColor', false, this.value);
        });

        formattingTools.alignLeftBtn.addEventListener('click', () => execCommandOnSelection('justifyLeft'));
        formattingTools.alignCenterBtn.addEventListener('click', () => execCommandOnSelection('justifyCenter'));
        formattingTools.alignRightBtn.addEventListener('click', () => execCommandOnSelection('justifyRight'));

        // Формат сценария
        formattingTools.scriptFormatBtn.addEventListener('click', function() {
            formattingTools.scriptFormatTools.style.display =
                formattingTools.scriptFormatTools.style.display === 'none' ? 'flex' : 'none';
        });

        formattingTools.characterBtn.addEventListener('click', function() {
            execCommandOnSelection('formatBlock', false, 'h3');
            const blocks = document.querySelectorAll('.chapter-content h3');
            if (blocks.length > 0) {
                blocks[blocks.length - 1].classList.add('character');
            }
        });

        formattingTools.dialogueBtn.addEventListener('click', function() {
            execCommandOnSelection('formatBlock', false, 'div');
            const blocks = document.querySelectorAll('.chapter-content div');
            if (blocks.length > 0) {
                blocks[blocks.length - 1].classList.add('dialogue');
            }
        });

        formattingTools.parentheticalBtn.addEventListener('click', function() {
            execCommandOnSelection('formatBlock', false, 'div');
            const blocks = document.querySelectorAll('.chapter-content div');
            if (blocks.length > 0) {
                blocks[blocks.length - 1].classList.add('parenthetical');
            }
        });

        // Главы и заметки
        chapterTools.addChapterBtn.addEventListener('click', function() {
            addChapterElement(`chapter-${Date.now()}`, 'Новая глава', '<p>Начните писать здесь...</p>');
        });

        chapterTools.addPageBtn.addEventListener('click', function() {
            if (currentSelectedElement) {
                // Находим ближайший контейнер главы
                const chapterContent = currentSelectedElement.closest('.chapter-content');
                if (chapterContent) {
                    const pageCount = chapterContent.querySelectorAll('.page').length + 1;
                    const pageHTML = `<div class="page" contenteditable="true"><p>Страница ${pageCount}</p></div>`;
                    chapterContent.insertAdjacentHTML('beforeend', pageHTML);
                }
            } else {
                alert('Выберите главу, в которую хотите добавить страницу');
            }
        });

        chapterTools.toggleNotesBtn.addEventListener('click', function() {
            chapterTools.notesSidebar.classList.toggle('visible');
        });

        chapterTools.addNoteBtn.addEventListener('click', function() {
            if (!currentSelectedElement) {
                alert('Выберите текст, к которому хотите добавить заметку');
                return;
            }

            const noteText = prompt('Введите текст заметки:');
            if (noteText) {
                const noteId = 'note-' + Date.now();
                addNoteElement(noteId, currentSelectedElement.id, noteText);
                currentSelectedElement.dataset.noteId = noteId;
            }
        });

        // Связывание с карточками
        formattingTools.insertCardLinkBtn.addEventListener('click', showCardLinkModal);

        // Модальные окна
        formattingTools.insertLinkBtn.addEventListener('click', function() {
            modals.linkModal.style.display = 'block';
            modals.linkUrl.value = '';
            modals.linkText.value = '';
        });

        modals.insertLinkConfirm.addEventListener('click', function() {
            const url = modals.linkUrl.value.trim();
            const text = modals.linkText.value.trim() || url;

            if (url) {
                execCommandOnSelection('createLink', false, url);
                const selection = window.getSelection();
                if (selection.rangeCount && text !== url) {
                    const range = selection.getRangeAt(0);
                    if (range.startContainer.nodeName === 'A') {
                        range.startContainer.textContent = text;
                    } else if (range.startContainer.parentNode.nodeName === 'A') {
                        range.startContainer.parentNode.textContent = text;
                    }
                }
                modals.linkModal.style.display = 'none';
            }
        });

        formattingTools.wordCountBtn.addEventListener('click', showWordCount);

        // Ночной режим
        formattingTools.nightModeBtn.addEventListener('click', toggleNightMode);

        // Закрытие модальных окон
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });

        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Горячие клавиши
        document.addEventListener('keydown', handleHotkeys);
    }

    function execCommandOnSelection(command, showUI = false, value = null) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().length > 0) {
            document.execCommand(command, showUI, value);
        } else if (currentSelectedElement) {
            const range = document.createRange();
            range.selectNodeContents(currentSelectedElement);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand(command, showUI, value);
            selection.removeAllRanges();
        }
    }



    function showWordCount() {
        let totalWords = 0;
        let totalChars = 0;
        let totalCharsNoSpaces = 0;
        let paragraphs = 0;

        document.querySelectorAll('.chapter-content').forEach(chapter => {
            const text = chapter.innerText;
            totalWords += text.trim() ? text.trim().split(/\s+/).length : 0;
            totalChars += text.length;
            totalCharsNoSpaces += text.replace(/\s+/g, '').length;
            paragraphs += chapter.querySelectorAll('p').length;
        });

        modals.statsModal.style.display = 'block';
        document.getElementById('stats-content').innerHTML = `
            <p>Слов: ${totalWords}</p>
            <p>Символов: ${totalChars}</p>
            <p>Символов (без пробелов): ${totalCharsNoSpaces}</p>
            <p>Абзацев: ${paragraphs}</p>
            <p>Глав: ${document.querySelectorAll('.chapter').length}</p>
        `;
    }

    function toggleNightMode() {
        document.body.classList.toggle('night-mode');
        localStorage.setItem('nightMode', document.body.classList.contains('night-mode'));
    }

    function checkNightMode() {
        if (localStorage.getItem('nightMode') === 'true') {
            document.body.classList.add('night-mode');
        }
    }

    function logoutUser() {
        fetch('php/auth.php?action=logout')
            .then(handleResponse)
            .then(data => {
                if (data.success) {
                    window.location.href = 'index.html';
                }
            })
            .catch(handleError);
    }

    function handleHotkeys(e) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); formattingTools.boldBtn.click(); break;
                case 'i': e.preventDefault(); formattingTools.italicBtn.click(); break;
                case 'k':
                    if (e.shiftKey) {
                        e.preventDefault();
                        formattingTools.insertCardLinkBtn.click();
                    } else {
                        e.preventDefault();
                        formattingTools.insertLinkBtn.click();
                    }
                    break;
                case 's': e.preventDefault(); saveText(); break;
                case 'n': if (e.shiftKey) { e.preventDefault(); chapterTools.addNoteBtn.click(); } break;
                case 'h': e.preventDefault(); chapterTools.addChapterBtn.click(); break;
            }
        }
    }

    function handleResponse(response) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Неверный формат ответа от сервера');
        }
        return response.json();
    }

    function handleError(error) {
        console.error('Ошибка:', error);
        alert(error.message || 'Произошла ошибка при обращении к серверу');
    }

    // Автосохранение каждые 30 секунд
    setInterval(() => {
        if (currentTextId || textTitle.value.trim() !== '') {
            saveText();
        }
    }, 30000);
});
