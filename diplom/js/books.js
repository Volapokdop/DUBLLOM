let editingIndex = null;

document.getElementById('bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById('bookForm'));
    const username = localStorage.getItem('username');
    formData.append('addedBy', username);

    fetch('php/add_book.php', { method: 'POST', body: formData })
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

function updateBookList() {
    fetch('php/get_books.php')
        .then(response => response.json())
        .then(books => {
            document.getElementById('bookList').innerHTML = books.map(book => `
                <li>
                    ${book.title} - ${book.author}
                    ${book.cover ? `<img src="${book.cover}" alt="Обложка книги ${book.title}" style="width: 100px; height: auto;">` : ''}
                    ${book.file ? `<a href="${book.file}" style="display: block;">Скачать текстовый файл</a>` : ''}
                    ${book.addedBy ? `Добавил: ${book.addedBy}` : ''}
                    <button onclick="addToLibrary(${book.id})">Добавить в библиотеку</button>
                    <button onclick="deleteBook(${book.id})">Удалить</button>
                </li>
            `).join('');
        })
        .catch(error => console.error('Ошибка при загрузке книг:', error));
}

function deleteBook(bookId) {
    const addedBy = localStorage.getItem('username');

    if (confirm("Вы уверены, что хотите удалить эту книгу?")) {
        fetch('php/delete_book.php', {
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
    const userId = localStorage.getItem('userId');

    fetch('php/add_to_library.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId, bookId: bookId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
}

function loadMyLibrary() {
    const userId = localStorage.getItem('userId');

    fetch(`php/get_my_library.php?userId=${userId}`)
        .then(response => response.json())
        .then(books => {
            const myLibraryList = document.getElementById('myLibraryList');
            myLibraryList.innerHTML = books.map(book => `
                <li>
                    ${book.title} - ${book.author}
                    ${book.cover ? `<img src="${book.cover}" alt="Обложка книги ${book.title}" style="width: 100px; height: auto;">` : ''}
                    ${book.file ? `<a href="${book.file}" style="display: block;">Скачать текстовый файл</a>` : ''}
                </li>
            `).join('');
        })
        .catch(error => console.error('Ошибка:', error));
}

function editBook(index) {
    editingIndex = index;
    const book = books[index];
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editCover').value = "";
    document.getElementById('editForm').classList.remove('hidden');
}

function saveEdit() {
    const title = document.getElementById('editTitle').value;
    const author = document.getElementById('editAuthor').value;
    const coverFile = document.getElementById('editCover').files[0];
    const textFile = document.getElementById('editFile').files[0];

    if (title && author) {
        const readerCover = new FileReader();
        const readerText = new FileReader();

        readerCover.onload = (e) => {
            readerText.onload = (e2) => {
                books[editingIndex] = { title, author, cover: e.target.result, file: e2.target.result };
                updateBookList();
                cancelEdit();
            };
            readerText.readAsText(textFile);
        };
        readerCover.readAsDataURL(coverFile);
    } else {
        alert("Пожалуйста, заполните название и автора.");
    }
}

function cancelEdit() {
    document.getElementById('editForm').classList.add('hidden');
    editingIndex = null;
}
