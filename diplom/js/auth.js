document.addEventListener('DOMContentLoaded', checkAuthState);

document.getElementById('registerPHP')?.addEventListener('submit', async (e) => {
e.preventDefault();
const formData = new FormData(e.target);
const username = formData.get('username');

try {
    const response = await fetch('php/auth/register.php', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error('Network error');

    const data = await response.json();

    if (data.status === "success") {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', username);
        checkAuthState();
        allHide();
        location.reload();
    } else {
        alert(data.message || 'Ошибка регистрации');
    }
} catch (error) {
    console.error('Registration error:', error);
    alert('Ошибка соединения');
}
});

document.getElementById('loginPHP').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const username = formData.get('username');

    fetch('php/auth/login.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', username);
            checkAuthState();
            location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

document.getElementById('registerLink').addEventListener('click', (e) => {
    e.preventDefault();
    allHide();
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
});

document.getElementById('loginLink').addEventListener('click', (e) => {
    e.preventDefault();
    allHide();
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
});

document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    checkAuthState();
    allHide();
    location.reload();
});

function checkAuthState() {
    const isLoggedIn = localStorage.getItem('username') !== null;

    if (isLoggedIn) {
        const username = localStorage.getItem('username');
        document.getElementById('userName').textContent = username;
        document.getElementById('userName').classList.remove('hidden');
        document.getElementById('logoutButton').classList.remove('hidden');
        document.getElementById('loginLink').classList.add('hidden');
        document.getElementById('registerLink').classList.add('hidden');
        document.getElementById('showAddBookForm').classList.remove('hidden');
        document.getElementById('showCharacters').classList.remove('hidden');
        document.getElementById('showEvents').classList.remove('hidden');
        document.getElementById('showLocations').classList.remove('hidden');
        document.getElementById('showMyLibrary').classList.remove('hidden');
        document.getElementById('showEditor').classList.remove('hidden');
    } else {
        document.getElementById('userName').classList.add('hidden');
        document.getElementById('logoutButton').classList.add('hidden');
        document.getElementById('loginLink').classList.remove('hidden');
        document.getElementById('registerLink').classList.remove('hidden');
        document.getElementById('showAddBookForm').classList.add('hidden');
    }
}

function allHide(){
    document.getElementById('characters').classList.add('hidden');
    document.getElementById('myLibrary').classList.add('hidden');
    document.getElementById('showAddBookForm').classList.add('hidden');
    document.getElementById('events').classList.add('hidden');
    document.getElementById('characters').classList.add('hidden');
    document.getElementById('locations').classList.add('hidden');
    document.getElementById('books').classList.add('hidden');
}
