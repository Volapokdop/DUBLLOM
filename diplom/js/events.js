document.getElementById('eventFormContainer').addEventListener('click', () => {
    loadCharactersForEventForm();
});

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const participants = Array.from(
        document.querySelectorAll('#participantsList input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    const formData = new FormData(this);
    participants.forEach(id => formData.append('participants[]', id));

    fetch('php/event/add_event.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            this.reset();
            loadEvents();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

function loadCharactersForEventForm() {
    fetch('php/character/get_characters.php')
        .then(response => response.json())
        .then(characters => {
            loadCheckboxes('participantsList', characters, 'participant');
        })
        .catch(error => console.error('Ошибка:', error));
}

function loadEvents() {
    fetch('php/event/get_events.php')
        .then(response => response.json())
        .then(events => {
            document.getElementById('eventList').innerHTML = events.map(event => `
                <li class="event-item">
                    <h4>${event.title}</h4>
                    <img src="${event.image}" alt="${event.title}" class="event-image">
                    <p>${event.description}</p>
                    <div class="participants-container">
                        <h5>Участники:</h5>
                        <div class="participants-grid">
                            ${event.participants.map(p => `
                                <div class="participant">
                                    <img src="${p.image}" alt="${p.name}" class="participant-avatar">
                                    <span>${p.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="deleteEvent(${event.id})" class="delete-btn">Удалить</button>
                </li>
            `).join('');
        })
        .catch(error => console.error('Ошибка:', error));
}

document.getElementById('showEvents').addEventListener('click', function(e) {
    e.preventDefault();
    allHide();
    loadEvents();
    loadCharactersForEventForm();
    document.getElementById('events').classList.remove('hidden');
    document.getElementById('eventFormContainer').classList.remove('hidden');
});

function deleteEvent(eventId) {
    if (confirm('Вы уверены, что хотите удалить это событие?')) {
        fetch('php/event/delete_event.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eventId: eventId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                alert(data.message);
                loadEvents();
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Ошибка:', error));
    }
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
        const storageKey = `checkbox_${userId}_${checkbox.id}`;
        const savedState = localStorage.getItem(storageKey);

        if (savedState === 'true') {
            checkbox.checked = true;
        }

        checkbox.addEventListener('change', (e) => {
            localStorage.setItem(storageKey, e.target.checked.toString());
        });
    });
}
