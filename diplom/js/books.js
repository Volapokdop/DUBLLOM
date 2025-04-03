let editingIndex = null;

document.getElementById('bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById('bookForm'));
    const username = localStorage.getItem('username');
    formData.append('addedBy', username);

    fetch('php/book/add_book.php', { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.status === "success") updateBookList();
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

    fetch(`php/check_book_in_library.php?userId=${userId}&bookId=${bookId}`)
        .then(response => response.json())
        .then(data => callback(data.inLibrary))
        .catch(() => callback(false));
}

function updateBookList() {
    const userId = localStorage.getItem('userId');
    fetch(`php/get_books_with_library_status.php?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            const allBooks = data.books;
            const userLibrary = data.library;

            document.getElementById('bookList').innerHTML = allBooks.map(book => {
                const inLibrary = userLibrary.some(libBook => libBook.id === book.id);

                return `
                    <li>
                        ${book.title} - ${book.author}
                        ${book.cover ? `<img src="${book.cover}" alt="Обложка" style="width:100px;">` : ''}
                        ${book.file ? `<a href="${book.file}" download>Скачать</a>` : ''}
                        <button onclick="toggleLibrary(${book.id}, this)"
                                class="${inLibrary ? 'in-library' : ''}">
                            ${inLibrary ? 'Удалить из библиотеки' : 'В библиотеку'}
                        </button>
                    </li>
                `;
            }).join('');
        })
        .catch(error => console.error('Ошибка:', error));
}

function deleteBook(bookId) {
    const addedBy = localStorage.getItem('username');

    if (confirm("Вы уверены, что хотите удалить эту книгу?")) {
        fetch('php/book/delete_book.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bookId: bookId, addedBy: addedBy }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                alert(data.message);
                updateBookList();
            } else {
                alert(data.message);
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

function toggleLibrary(bookId, button) {
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

            if (books.length === 0) {
                libraryList.innerHTML = '<p>Ваша библиотека пуста</p>';
                return;
            }

            libraryList.innerHTML = books.map(book => `
                <li class="library-book">
                    <div class="book-cover">
                        ${book.cover ? `<img src="${book.cover}" alt="${book.title}">` : ''}
                    </div>
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p>Автор: ${book.author}</p>
                        ${book.file ? `<a href="${book.file}" class="download-btn">Скачать</a>` : ''}
                        <button onclick="removeFromLibrary(${book.id})" class="remove-btn">
                            Удалить из библиотеки
                        </button>
                    </div>
                </li>
            `).join('');
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
