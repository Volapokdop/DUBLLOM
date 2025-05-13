// main.js - Управление навигацией между страницами

document.addEventListener('DOMContentLoaded', function() {
    // Универсальный обработчик для всех кнопок навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetPage = this.id.replace('go-to-', '');
            window.location.href = targetPage + '.html';
        });
    });

    // Обработчик для кнопки выхода
    document.getElementById('logout-btn').addEventListener('click', logoutUser);

    // Проверка авторизации для защищенных страниц
    checkAuthForPages();
});

function setupNavigation() {
    // Обработчики для всех страниц
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const target = btn.id.replace(/^(go-to-|go-to-.+-from-.+)/, '');
        let page = '';

        switch(target) {
            case 'editor':
                page = 'editor.html';
                break;
            case 'cards':
                page = 'cards.html';
                break;
            case 'main':
            case 'main-from-cards':
            case 'main-from-editor':
                page = 'index.html';
                break;
            default:
                console.warn(`Unknown navigation target: ${target}`);
                return;
        }

        btn.addEventListener('click', () => {
            window.location.href = page;
        });
    });

    // Обработчик для кнопки выхода
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', logoutUser);
    });
}

function checkAuthForPages() {
    // Для страниц, требующих авторизации
    const protectedPages = ['editor.html', 'cards.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        checkAuth();
    }
}

function checkAuth() {
    fetch('php/auth.php?action=check')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
            window.location.href = 'index.html';
        });
}

function logoutUser() {
    fetch('php/auth.php?action=logout')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('Ошибка при выходе:', error);
            window.location.href = 'index.html';
        });
}
