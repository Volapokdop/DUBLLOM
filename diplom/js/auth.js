document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const goToEditorBtn = document.getElementById('go-to-editor');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const closeButtons = document.querySelectorAll('.close');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');

    // Проверка авторизации при загрузке
    checkAuth();

    // Открытие модальных окон
    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    registerBtn.addEventListener('click', () => registerModal.style.display = 'block');

    // Закрытие модальных окон
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });

    // Закрытие при клике вне окна
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) loginModal.style.display = 'none';
        if (event.target === registerModal) registerModal.style.display = 'none';
    });

    // Обработка формы входа
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        loginUser(username, password);
    });

    // Обработка формы регистрации
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            document.getElementById('register-error').textContent = 'Пароли не совпадают';
            return;
        }

        registerUser(username, email, password);
    });

    // Выход из системы
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }

    // Переход в редактор
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', () => {
            window.location.href = 'editor.html';
        });
    }

    // Функция проверки авторизации
    function checkAuth() {
        fetch('php/auth.php?action=check')
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    authButtons.style.display = 'none';
                    userInfo.style.display = 'flex';
                    usernameDisplay.textContent = data.username;
                } else {
                    authButtons.style.display = 'flex';
                    userInfo.style.display = 'none';
                }
            });
    }

    // Функция входа пользователя
    function loginUser(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        fetch('php/auth.php?action=login', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loginModal.style.display = 'none';
                checkAuth();
            } else {
                document.getElementById('login-error').textContent = data.message;
            }
        });
    }

    // Функция регистрации пользователя
    function registerUser(username, email, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);

        fetch('php/auth.php?action=register', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                registerModal.style.display = 'none';
                document.getElementById('register-error').textContent = '';
                document.getElementById('login-username').value = username;
                document.getElementById('register-form').reset();
                loginModal.style.display = 'block';
            } else {
                document.getElementById('register-error').textContent = data.message;
            }
        });
    }

    // Функция выхода пользователя
    function logoutUser() {
        fetch('php/auth.php?action=logout')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    checkAuth();
                }
            });
    }
});
