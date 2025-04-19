document.addEventListener('DOMContentLoaded', () => {
    initEditor();
});

function initEditor() {
    setupToolbar();
    loadBooks();
    setupEditorEventListeners();
    setupImageUpload();
    setupCharCounter(); // Теперь здесь инициализируется и прогресс
}

function setupToolbar() {
    document.querySelectorAll('#toolbar button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.getAttribute('data-command');
            const value = this.getAttribute('value');

            if (command === 'insertImage') {
                document.getElementById('imageUpload').click();
            } else if (command === 'createLink') {
                const url = prompt('Введите URL ссылки:', 'http://');
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, value);
            }

            document.getElementById('editorContent').focus();
        });
    });
}

function setupImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'imageUpload';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', function() {
        if (this.files.length) {
            const file = this.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                document.execCommand('insertImage', false, e.target.result);
            };

            reader.readAsDataURL(file);
            this.value = '';
        }
    });
}

function setupCharCounter() {
    const editor = document.getElementById('editorContent');
    const counter = document.querySelector('.char-counter');
    const progressFill = document.getElementById('writingProgress');
    const progressText = document.getElementById('progressText');

    editor.addEventListener('input', function() {
        const text = this.innerText;
        const charCount = text.length;
        counter.textContent = `${charCount}/5000`;

        // Обновляем индикатор прогресса (норма - 3600 символов)
        const progress = Math.min(100, Math.floor((charCount / 3600) * 100));
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${charCount}/3600 (${progress}%)`;

        // Меняем цвет в зависимости от прогресса
        if (progress >= 100) {
            progressFill.style.backgroundColor = '#4CAF50'; // Зеленый
        } else if (progress >= 50) {
            progressFill.style.backgroundColor = '#FFC107'; // Желтый
        } else {
            progressFill.style.backgroundColor = '#F44336'; // Красный
        }

        if (text.length > 5000) {
            counter.style.color = 'red';
        } else {
            counter.style.color = '#999';
        }

        // Обновляем данные для уведомлений
        updateWritingStats(charCount);
    });

    // Инициализируем прогресс при загрузке
    const initialText = editor.innerText;
    const initialCount = initialText.length;
    const initialProgress = Math.min(100, Math.floor((initialCount / 3600) * 100));
    progressFill.style.width = `${initialProgress}%`;
    progressText.textContent = `${initialCount}/3600 (${initialProgress}%)`;
}

function loadBooks() {
    showLoader();
    fetch('php/editor/get_user_books.php')
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(books => {
            const selector = document.getElementById('bookSelector');
            selector.innerHTML = '<option value="new">Новая книга</option>';

            books.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = book.title;
                selector.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки книг:', error);
            alert('Ошибка загрузки книг: ' + error.message);
        })
        .finally(hideLoader);
}

function setupEditorEventListeners() {
    document.getElementById('bookSelector').addEventListener('change', function(e) {
        if (e.target.value === 'new') {
            createNewBook();
        } else {
            loadBook(e.target.value);
        }
    });

    document.getElementById('addChapter').addEventListener('click', function() {
        const title = document.getElementById('chapterTitle').value.trim();
        if (title) {
            addChapter(title);
        } else {
            alert('Введите название главы');
        }
    });

    document.getElementById('saveBook').addEventListener('click', saveCurrentBook);

    document.getElementById('showEditor').addEventListener('click', function(e) {
        e.preventDefault();
        allHide();
        document.getElementById('editor').classList.remove('hidden');
    });

    document.getElementById('previewBtn').addEventListener('click', showPreview);
}

function createNewBook() {
    document.getElementById('editorContent').innerHTML = '';
    document.getElementById('chaptersList').innerHTML = '';
}

function showPreview() {
    const content = document.getElementById('editorContent').innerHTML;
    const preview = window.open('', '_blank');
    preview.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Предпросмотр</title>
            <style>
                body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
                img { max-width: 100%; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    preview.document.close();
}

function loadBook(bookId) {
    showLoader();
    fetch(`php/editor/get_user_book.php?id=${bookId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(book => {
            renderChaptersList(book.chapters);
            if (book.chapters.length > 0) {
                loadChapter(book.chapters[0].id);
            } else {
                document.getElementById('editorContent').innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки книги:', error);
            alert('Ошибка загрузки книги: ' + error.message);
        })
        .finally(hideLoader);
}

function loadChapter(chapterId) {
    showLoader();
    fetch(`php/editor/get_chapter.php?id=${chapterId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(chapter => {
            document.getElementById('editorContent').innerHTML = chapter.content;
            updateActiveChapter(chapterId);
        })
        .catch(error => {
            console.error('Ошибка загрузки главы:', error);
            alert('Ошибка загрузки главы: ' + error.message);
        })
        .finally(hideLoader);
}

function updateActiveChapter(chapterId) {
    document.querySelectorAll('#chaptersList li').forEach(li => {
        li.classList.toggle('active', li.dataset.chapterId == chapterId);
    });
}

function addChapter(title) {
    const bookId = document.getElementById('bookSelector').value;
    if (bookId === 'new') {
        alert('Сначала сохраните книгу');
        return;
    }

    showLoader();
    fetch('php/editor/add_chapter.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bookId: bookId,
            title: title
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.json();
    })
    .then(data => {
        if (data.status === "success") {
            loadBook(bookId);
            document.getElementById('chapterTitle').value = '';
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка добавления главы: ' + error.message);
    })
    .finally(hideLoader);
}

function renderChaptersList(chapters) {
    const list = document.getElementById('chaptersList');
    list.innerHTML = '';

    chapters.forEach(chapter => {
        const li = document.createElement('li');
        li.textContent = chapter.title;
        li.dataset.chapterId = chapter.id;
        li.addEventListener('click', () => loadChapter(chapter.id));
        list.appendChild(li);
    });
}

function saveCurrentBook() {
    const bookId = document.getElementById('bookSelector').value;
    const content = document.getElementById('editorContent').innerHTML; // Берём весь HTML
    const activeChapter = document.querySelector('#chaptersList li.active');

    if (bookId === 'new') {
        saveNewBook(content);
        return;
    }

    if (!activeChapter) {
        alert('Выберите главу для сохранения');
        return;
    }

    showLoader();
    fetch('php/editor/save_chapter.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chapterId: activeChapter.dataset.chapterId,
            content: content // Отправляем весь HTML
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert('Глава сохранена');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        alert('Ошибка: ' + error.message);
    })
    .finally(hideLoader);
}

function saveNewBook(content) {
    const title = prompt('Введите название книги:', 'Новая книга') || 'Новая книга';

    showLoader();
    fetch('php/editor/add_editor_book.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.json();
    })
    .then(data => {
        if (data.status === "success") {
            // Добавляем первую главу
            return fetch('php/editor/add_chapter.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bookId: data.bookId,
                    title: 'Глава 1',
                    content: content
                })
            });
        } else {
            throw new Error(data.message);
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.json();
    })
    .then(data => {
        if (data.status === "success") {
            loadBooks();
            document.getElementById('bookSelector').value = data.bookId;
            alert('Книга создана и сохранена');
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка создания книги: ' + error.message);
    })
    .finally(hideLoader);
}

function showLoader() {
    document.getElementById('editorContent').style.opacity = '0.5';
}

function hideLoader() {
    document.getElementById('editorContent').style.opacity = '1';
}

document.getElementById('deleteBook').addEventListener('click', function() {
    const bookId = document.getElementById('bookSelector').value;
    if (bookId === 'new') {
        alert('Нечего удалять - книга еще не создана');
        return;
    }

    if (confirm('Вы уверены, что хотите удалить эту книгу со всеми главами?')) {
        fetch('php/editor/delete_book.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                alert(data.message);
                loadBooks();
                createNewBook();
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Ошибка:', error));
    }
});

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        const editor = document.getElementById('editorContent');
        if (document.activeElement === editor) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold', false, null);
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic', false, null);
                    break;
                case 'u':
                    e.preventDefault();
                    document.execCommand('underline', false, null);
                    break;
                case 'k':
                    e.preventDefault();
                    const url = prompt('Введите URL ссылки:', 'http://');
                    if (url) document.execCommand('createLink', false, url);
                    break;
            }
        }
    }
});

async function updateWritingStats(charCount) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch('php/user/update_writing_stats.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, charCount })
        });

        const data = await response.json();
        if (data.status !== "success") console.error("Ошибка сохранения статистики");
    } catch (error) {
        console.error("Ошибка сети:", error);
    }
}

function checkDailyGoal(charCount) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const goalReached = localStorage.getItem(`dailyGoalReached_${userId}`);
    const today = new Date().toLocaleDateString();

    if (charCount >= 3600 && goalReached !== today) {
        // Норма выполнена впервые сегодня
        localStorage.setItem(`dailyGoalReached_${userId}`, today);
        addNotification(
            'Поздравляем!',
            'Вы выполнили дневную норму в 3600 символов. Так держать!',
            'success'
        );
    }
}

function removeWritingReminder() {
    const notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    const updatedNotifications = notifications.filter(notif =>
        !notif.message.includes('не написали 2 страницы')
    );

    if (notifications.length !== updatedNotifications.length) {
        localStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
        loadSavedNotifications();
    }
}

async function loadUserStats() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`php/user/get_writing_stats.php?userId=${userId}`);
        const data = await response.json();

        if (data.status === "success") {
            const editor = document.getElementById('editorContent');
            const charCount = data.totalChars || 0;

            // Обновляем счётчик
            updateWritingStats(charCount); // Используем функцию из прошлого примера
        }
    } catch (error) {
        console.error("Ошибка загрузки статистики:", error);
    }
}

// Вызываем при инициализации редактора
loadUserStats();

// Вызываем функцию отслеживания при загрузке редактора
updateWritingStats();
