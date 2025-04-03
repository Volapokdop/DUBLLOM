document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const userNameElement = document.getElementById('userName');
    allHide();
    if (username) {
        userName.textContent = username;
    }
    document.getElementById('books').classList.remove('hidden');
    document.getElementById('showAddBookForm').classList.add('hidden');
    document.getElementById('bookSection').classList.remove('hidden');

    const checkboxes = document.querySelectorAll('.checkbox-container input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const storageKey = `checkbox_${localStorage.getItem('userId')}_${checkbox.id}`;
        const savedState = localStorage.getItem(storageKey);

        if (savedState === 'true') {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', (e) => {
            localStorage.setItem(storageKey, e.target.checked.toString());
        });
    });

    updateBookList();
});

function allHide() {
    document.getElementById('characters').classList.add('hidden');
    document.getElementById('myLibrary').classList.add('hidden');
    document.getElementById('showAddBookForm').classList.add('hidden');
    document.getElementById('bookSection').classList.add('hidden');
    document.getElementById('events').classList.add('hidden');
    document.getElementById('locations').classList.add('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('editor').classList.add('hidden');
}

function showMainPage() {
    allHide();
    document.getElementById('books').classList.remove('hidden');
    document.getElementById('showAddBookForm').classList.remove('hidden');
    document.getElementById('bookSection').classList.remove('hidden');
}

function showMyLibrary() {
    allHide();
    document.getElementById('myLibrary').classList.remove('hidden');
    loadMyLibrary();
}

function loadCheckboxes(containerId, data, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = data.map(item => `
        <div class="checkbox-item">
            <input type="checkbox" id="${type}_${item.id}" name="${type}[]" value="${item.id}">
            <label for="${type}_${item.id}">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" class="checkbox-avatar">` : ''}
                ${item.name || item.title}
            </label>
        </div>
    `).join('');

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const userId = localStorage.getItem('userId');

    checkboxes.forEach(checkbox => {
        checkbox.replaceWith(checkbox.cloneNode(true));

        const newCheckbox = container.querySelector(`#${checkbox.id}`);
        const storageKey = `checkbox_${userId}_${checkbox.id}`;
        const savedState = localStorage.getItem(storageKey);

        if (savedState === 'true') {
            newCheckbox.checked = true;
        }

        newCheckbox.addEventListener('change', function(e) {
            localStorage.setItem(storageKey, e.target.checked.toString());
        });
    });
}
