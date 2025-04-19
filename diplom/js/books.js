let editingIndex = null;

document.getElementById('bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById('bookForm'));
    const username = localStorage.getItem('username');
    formData.append('addedBy', username);

    const isEditing = document.getElementById('bookForm').dataset.editingId;
    const url = isEditing ? `php/book/update_book.php?id=${isEditing}` : 'php/book/add_book.php';

    if (isEditing && !formData.get('cover').name) {
        formData.append('currentCover', document.getElementById('bookForm').dataset.currentCover);
    }

    if (isEditing && !formData.get('file').name) {
        formData.append('currentFile', document.getElementById('bookForm').dataset.currentFile);
    }

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.status === "success") {
            document.getElementById('bookForm').reset();
            document.getElementById('addBookFormContainer').classList.add('hidden');
            document.getElementById('showAddBookForm').classList.remove('hidden');
            delete document.getElementById('bookForm').dataset.editingId;
            delete document.getElementById('bookForm').dataset.currentCover;
            delete document.getElementById('bookForm').dataset.currentFile;
            document.querySelector('#bookForm button[type="submit"]').textContent = 'Добавить';
            document.getElementById('bookCover').previousElementSibling.textContent = 'Обложка книги:';
            document.getElementById('bookFile').previousElementSibling.textContent = 'Текстовый файл:';

            updateBookList();
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

document.getElementById('showAddBookForm').addEventListener('click', () => {
    document.getElementById('addBookFormContainer').classList.remove('hidden');
    document.getElementById('showAddBookForm').classList.add('hidden');
});

document.getElementById('cancelAddBook').addEventListener('click', () => {
    document.getElementById('addBookFormContainer').classList.add('hidden');
    document.getElementById('showAddBookForm').classList.remove('hidden');
    document.getElementById('bookForm').reset();
});

function checkBookInLibrary(bookId, callback) {
    const userId = localStorage.getItem('userId');
    if (!userId) return callback(false);

    fetch(`php/book/check_book_in_library.php?userId=${userId}&bookId=${bookId}`)
        .then(response => response.json())
        .then(data => callback(data.inLibrary))
        .catch(() => callback(false));
}

function updateBookList() {
    const userId = localStorage.getItem('userId');
    const currentUsername = localStorage.getItem('username');

    fetch(`php/book/get_books_with_library_status.php?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            const allBooks = data.books;
            const userLibrary = data.library;
            const bookList = document.getElementById('bookList');
            bookList.innerHTML = '';

            allBooks.forEach(book => {
                const inLibrary = userLibrary.some(libBook => libBook.id === book.id);
                const isCurrentUserBook = book.addedBy === currentUsername;
                const template = document.getElementById('bookItemTemplate');
                const clone = template.content.cloneNode(true);
                const bookItem = clone.querySelector('.book-item');

                // Заполняем данные
                const titleElement = bookItem.querySelector('.book-title');
                titleElement.textContent = `${book.title} - ${book.author}`;
                titleElement.onclick = () => showBookText(book.id, book.file);

                const coverImg = bookItem.querySelector('.book-cover-img');
                if (book.cover) {
                    coverImg.src = book.cover;
                    coverImg.classList.remove('hidden');
                }

                bookItem.querySelector('.book-genre').textContent =
                    `Жанр: ${book.genre} | Язык: ${book.language}`;
                bookItem.querySelector('.book-annotation').textContent =
                    `Аннотация: ${book.annotation} | Возрастное ограничение: ${book.age_restriction} | ${book.copyright}`;
                bookItem.querySelector('.added-by').textContent = `Добавил: ${book.addedBy}`;

                const downloadLink = bookItem.querySelector('.download-link');
                if (book.file) {
                    downloadLink.href = book.file;
                    downloadLink.classList.remove('hidden');
                }

                const libraryBtn = bookItem.querySelector('.library-btn');
                libraryBtn.onclick = (e) => toggleLibrary(book.id, libraryBtn, e);
                if (inLibrary) {
                    libraryBtn.textContent = 'Удалить из библиотеки';
                    libraryBtn.classList.add('in-library');
                }

                if (isCurrentUserBook) {
                    const editBtn = bookItem.querySelector('.edit-btn');
                    editBtn.onclick = (e) => editBook(book.id, e);
                    editBtn.classList.remove('hidden');

                    const deleteBtn = bookItem.querySelector('.delete-btn');
                    deleteBtn.onclick = (e) => deleteBook(book.id, e);
                    deleteBtn.classList.remove('hidden');
                }

                bookList.appendChild(bookItem);
            });
        })
        .catch(error => console.error('Ошибка:', error));
}

function deleteBook(bookId, event) {
    if (event) event.stopPropagation();

    const currentUsername = localStorage.getItem('username');

    if (confirm("Вы уверены, что хотите удалить эту книгу?")) {
        fetch('php/book/delete_book.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bookId: bookId,
                addedBy: currentUsername
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.status === "success") {
                updateBookList();
            }
        })
        .catch(error => console.error('Ошибка:', error));
    }
}

function addToLibrary(bookId) {
    // Проверяем авторизацию
    if (!localStorage.getItem('userId')) {
        alert('Для добавления в библиотеку войдите в систему');
        return;
    }

    fetch('php/library/add_to_library.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId: bookId }) // user_id теперь берется из сессии
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.status === "success") {
            updateBookList();
            loadMyLibrary();
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка соединения');
    });
}

function toggleLibrary(bookId, button, event) {
    if (event) event.stopPropagation(); // Предотвращаем всплытие события

    const isInLibrary = button.classList.contains('in-library');
    const url = isInLibrary ? 'php/remove_from_library.php' : 'php/add_to_library.php';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId: bookId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            if (isInLibrary) {
                button.textContent = 'В библиотеку';
                button.classList.remove('in-library');
            } else {
                button.textContent = 'Удалить из библиотеки';
                button.classList.add('in-library');
            }
            loadMyLibrary();
        }
        alert(data.message);
    })
    .catch(error => console.error('Ошибка:', error));
}

function loadMyLibrary() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        document.getElementById('myLibraryList').innerHTML =
            '<p>Войдите в систему, чтобы просмотреть свою библиотеку</p>';
        return;
    }

    fetch(`php/library/get_my_library.php?userId=${userId}`)
        .then(response => response.json())
        .then(books => {
            const libraryList = document.getElementById('myLibraryList');
            libraryList.innerHTML = '';

            if (books.length === 0) {
                libraryList.innerHTML = '<p>Ваша библиотека пуста</p>';
                return;
            }

            const template = document.getElementById('libraryBookTemplate');

            books.forEach(book => {
                const clone = template.content.cloneNode(true);
                const bookItem = clone.querySelector('.library-book');

                // Заполняем обложку
                const coverImg = bookItem.querySelector('.book-cover img');
                if (book.cover) {
                    coverImg.src = book.cover;
                    coverImg.alt = book.title;
                    coverImg.classList.remove('hidden');
                }

                // Заполняем информацию о книге
                bookItem.querySelector('.book-title').textContent = book.title;
                bookItem.querySelector('.book-author span').textContent = book.author;

                // Заполняем ссылку для скачивания
                const downloadLink = bookItem.querySelector('.download-btn');
                if (book.file) {
                    downloadLink.href = book.file;
                    downloadLink.classList.remove('hidden');
                }

                // Добавляем обработчик для кнопки удаления
                const removeBtn = bookItem.querySelector('.remove-btn');
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeFromLibrary(book.id);
                };

                libraryList.appendChild(bookItem);
            });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            document.getElementById('myLibraryList').innerHTML =
                '<p>Ошибка загрузки библиотеки</p>';
        });
}

function removeFromLibrary(bookId) {
    const userId = localStorage.getItem('userId');

    fetch('php/library/remove_from_library.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, bookId })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.status === "success") {
            loadMyLibrary(); // Обновляем список после удаления
        }
    })
    .catch(error => console.error('Ошибка:', error));
}

// Добавьте эту функцию в books.js
function showBookText(bookId, filePath) {
    allHide();

    // Создаем контейнер для текста книги
    const bookTextContainer = document.createElement('div');
    bookTextContainer.id = 'bookTextContainer';
    bookTextContainer.className = 'book-text-container';

    // Добавляем кнопку возврата
    const backButton = document.createElement('button');
    backButton.textContent = 'Назад к списку';
    backButton.onclick = showMainPage;
    backButton.className = 'back-button';

    // Добавляем элемент для текста
    const textElement = document.createElement('div');
    textElement.id = 'bookTextContent';
    textElement.className = 'book-text-content';

    bookTextContainer.appendChild(backButton);
    bookTextContainer.appendChild(textElement);

    // Добавляем контейнер на страницу
    document.body.appendChild(bookTextContainer);

    // Загружаем текст книги
    fetch(filePath)
        .then(response => response.text())
        .then(text => {
            textElement.textContent = text;
        })
        .catch(error => {
            textElement.textContent = 'Не удалось загрузить текст книги.';
            console.error('Ошибка загрузки книги:', error);
        });
}

function editBook(bookId, event) {
    if (event) event.stopPropagation();

    fetch(`php/book/get_book.php?id=${bookId}`)
        .then(response => response.json())
        .then(book => {
            document.getElementById('addBookFormContainer').classList.remove('hidden');
            document.getElementById('showAddBookForm').classList.add('hidden');

            // Заполняем все поля формы
            document.getElementById('bookTitle').value = book.title;
            document.getElementById('bookAuthor').value = book.author;
            document.getElementById('bookGenre').value = book.genre;
            document.getElementById('bookLanguage').value = book.language;
            document.getElementById('bookAnnotation').value = book.annotation;
            document.getElementById('bookAgeRestriction').value = book.age_restriction;
            document.getElementById('bookCopyright').value = book.copyright;

            document.getElementById('bookForm').dataset.currentCover = book.cover;
            document.getElementById('bookForm').dataset.currentFile = book.file;
            document.getElementById('bookForm').dataset.editingId = bookId;

            document.querySelector('#bookForm button[type="submit"]').textContent = 'Сохранить изменения';
            document.getElementById('bookCover').previousElementSibling.innerHTML =
                `Обложка книги: <span class="current-file">(текущая: ${book.cover.split('/').pop()})</span>`;
            document.getElementById('bookFile').previousElementSibling.innerHTML =
                `Текстовый файл: <span class="current-file">(текущий: ${book.file.split('/').pop()})</span>`;
        })
        .catch(error => console.error('Ошибка:', error));
}
