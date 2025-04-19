document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const userNameElement = document.getElementById('userName');
    allHide();
    initNotifications();
    checkWritingReminder();
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
    document.getElementById('myLibrary').classList.add('hidden');
    document.getElementById('showAddBookForm').classList.add('hidden');
    document.getElementById('bookSection').classList.add('hidden');
    document.getElementById('characters').classList.add('hidden');
    document.getElementById('events').classList.add('hidden');
    document.getElementById('locations').classList.add('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('editor').classList.add('hidden');
    document.getElementById('books').classList.add('hidden');

    // Удаляем контейнер с текстом книги, если он существует
    const bookTextContainer = document.getElementById('bookTextContainer');
    if (bookTextContainer) {
        bookTextContainer.remove();
    }
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

function initNotifications() {
    const username = localStorage.getItem('username');
    const notificationsContainer = document.getElementById('notificationsContainer');

    if (username) {
        notificationsContainer.classList.remove('hidden');

        // Обработчики для звоночка
        document.getElementById('notificationBell').addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('notificationsDropdown').classList.toggle('hidden');
        });

        document.getElementById('clearNotifications').addEventListener('click', function() {
            clearAllNotifications();
        });

        // Закрытие при клике вне области
        document.addEventListener('click', function(e) {
            if (!notificationsContainer.contains(e.target)) {
                document.getElementById('notificationsDropdown').classList.add('hidden');
            }
        });
    }
}

function checkWritingReminder() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const lastWritingDate = localStorage.getItem(`lastWritingDate_${userId}`);
    const charsWrittenToday = parseInt(localStorage.getItem(`charsWrittenToday_${userId}`)) || 0;

    if (lastWritingDate) {
        const lastDate = new Date(lastWritingDate);
        const today = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Если последнее письмо было более 2 дней назад или сегодня написано меньше 3600 символов
        if (lastDate < twoDaysAgo || (isToday(lastDate) && charsWrittenToday < 3600)) {
            addNotification(
                'Напоминание',
                `Вы сегодня написали ${charsWrittenToday} из 3600 символов. Продолжайте писать!`,
                'warning'
            );
        }
    } else {
        // Если пользователь ещё никогда не писал
        addNotification(
            'Добро пожаловать!',
            'Начните писать сегодня хотя бы 3600 символов для развития навыков.',
            'warning'
        );
    }
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function addNotification(title, message, type = 'info') {
    const notificationsList = document.getElementById('notificationsList');
    const notificationId = Date.now();

    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${type}`;
    notificationItem.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
        <div class="notification-time">${new Date().toLocaleTimeString()}</div>
    `;

    notificationsList.prepend(notificationItem);
    updateNotificationCount();

    // Сохраняем уведомление в localStorage
    const notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    notifications.unshift({
        id: notificationId,
        title,
        message,
        type,
        time: new Date().toISOString()
    });
    localStorage.setItem('userNotifications', JSON.stringify(notifications));
}

function updateNotificationCount() {
    const count = document.getElementById('notificationsList').children.length;
    const badge = document.getElementById('notificationCount');

    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function clearAllNotifications() {
    document.getElementById('notificationsList').innerHTML = '';
    localStorage.removeItem('userNotifications');
    updateNotificationCount();
}

function loadSavedNotifications() {
    const notifications = JSON.parse(localStorage.getItem('userNotifications') || '[]');
    const notificationsList = document.getElementById('notificationsList');

    notificationsList.innerHTML = '';
    notifications.forEach(notif => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notif.type}`;
        notificationItem.innerHTML = `
            <strong>${notif.title}</strong>
            <p>${notif.message}</p>
            <div class="notification-time">${new Date(notif.time).toLocaleTimeString()}</div>
        `;
        notificationsList.appendChild(notificationItem);
    });

    updateNotificationCount();
}
