document.getElementById('eventFormContainer').addEventListener('click', () => {
    loadCharactersForEventForm();
});

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generateEventBtn';
    generateBtn.textContent = 'Сгенерировать событие (Gemma 3B)';
    generateBtn.style.margin = '10px 0';
    document.getElementById('eventFormContainer').prepend(generateBtn);

    generateBtn.addEventListener('click', showGenerateEventModal);
});

document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const participants = Array.from(
        document.querySelectorAll('#participantsList input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    const formData = new FormData(this);
    participants.forEach(id => formData.append('participants[]', id));

    const isEditMode = this.dataset.editMode === 'true';
    const eventId = this.dataset.eventId;

    const url = isEditMode
        ? `php/event/update_event.php?id=${eventId}`
        : 'php/event/add_event.php';

    fetch(url, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            loadEvents();
            if (isEditMode) {
                cancelEditEvent();
            } else {
                this.reset();
            }
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
                <li class="event-item" data-event-id="${event.id}">
                    <div class="event-header">
                        <h4>${event.title}</h4>
                        <div class="event-actions">
                            <button class="edit-btn" data-id="${event.id}">Редактировать</button>
                            <button class="delete-btn" data-id="${event.id}">Удалить</button>
                        </div>
                    </div>
                    <img src="${event.image}" alt="${event.title}" class="event-image">
                    <p>${event.description}</p>
                    <div class="participants-container">
                        <h5>Участники:</h5>
                        <div class="participants-grid">
                            ${event.participants.map(p => `
                                <div class="participant">
                                    ${p.image ? `<img src="${p.image}" alt="${p.name}" class="participant-avatar">` : ''}
                                    <span>${p.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </li>
            `).join('');

            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    deleteEvent(this.dataset.id);
                });
            });

            // Добавляем обработчики для кнопок редактирования
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', function() {
                    showEditEventForm(this.dataset.id);
                });
            });
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

function showEditEventForm(eventId) {
    fetch(`php/event/get_event.php?id=${eventId}`)
        .then(response => response.json())
        .then(event => {
            // Заполняем форму редактирования
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDescription').value = event.description;

            // Сохраняем ID события для редактирования
            const form = document.getElementById('eventForm');
            form.dataset.editMode = 'true';
            form.dataset.eventId = eventId;

            // Изменяем текст кнопки
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Обновить событие';

            // Показываем кнопку отмены, если её нет
            if (!form.querySelector('#cancelEditEvent')) {
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.id = 'cancelEditEvent';
                cancelButton.textContent = 'Отмена';
                cancelButton.addEventListener('click', cancelEditEvent);
                form.appendChild(cancelButton);
            }

            // Прокручиваем к форме
            document.getElementById('eventFormContainer').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные события');
        });
}

function showGenerateEventModal() {
    // Проверяем, есть ли выбранные участники
    const selectedParticipants = Array.from(
        document.querySelectorAll('#participantsList input[type="checkbox"]:checked')
    ).map(checkbox => {
        const label = checkbox.nextElementSibling;
        return {
            id: checkbox.value,
            name: label.textContent.trim(),
            image: label.querySelector('img')?.src
        };
    });

    if (selectedParticipants.length === 0) {
        alert('Пожалуйста, выберите хотя бы одного участника события');
        return;
    }

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '500px';
    modalContent.style.maxWidth = '90%';

    // Показываем выбранных участников
    const participantsHTML = selectedParticipants.map(p => `
        <div class="participant" style="display: flex; align-items: center; gap: 8px; margin: 5px 0;">
            ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width: 30px; height: 30px; border-radius: 50%;">` : ''}
            <span>${p.name}</span>
        </div>
    `).join('');

    modalContent.innerHTML = `
        <h3>Генератор событий (Gemma 3B)</h3>
        <div style="margin-bottom: 15px;">
            <h4>Участники:</h4>
            <div>${participantsHTML}</div>
        </div>
        <p>Дополните описание события (необязательно):</p>
        <textarea id="aiPrompt" style="width: 100%; height: 100px; margin: 10px 0;"
                  placeholder="Пример: эпическая битва на закате"></textarea>
        <div style="display: flex; justify-content: space-between;">
            <button id="generateBtn" style="padding: 8px 16px;">Сгенерировать</button>
            <button id="cancelGenerateBtn" style="padding: 8px 16px;">Отмена</button>
        </div>
        <div id="generationResult" style="margin-top: 20px;"></div>
        <div id="ollamaStatus" style="font-size: 12px; color: #666; margin-top: 10px;">
            Используется локальная модель Gemma 3B через Ollama
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Обработчики кнопок
    modalContent.querySelector('#generateBtn').addEventListener('click', () => {
        generateEvent(selectedParticipants);
    });
    modalContent.querySelector('#cancelGenerateBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    function generateEvent(participants) {
        const prompt = document.getElementById('aiPrompt').value.trim();
        const participantsNames = participants.map(p => p.name).join(', ');

        const fullPrompt = `Участники: ${participantsNames}. ${prompt ? 'Дополнительное описание: ' + prompt : ''}`;

        const resultDiv = document.getElementById('generationResult');
        resultDiv.innerHTML = '<p>Генерация события (может занять 10-20 секунд)...</p>';

        fetch('php/ai/generate_event.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: fullPrompt,
                participant_ids: participants.map(p => p.id)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                const event = data.event;
                resultDiv.innerHTML = `
                    <h4>Результат генерации:</h4>
                    <p><strong>Название:</strong> ${event.title}</p>
                    <p><strong>Описание:</strong> ${event.description}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button id="useEventBtn">Использовать это событие</button>
                        <button id="saveEventBtn">Сохранить событие</button>
                    </div>
                `;

                document.getElementById('useEventBtn').addEventListener('click', () => {
                    document.getElementById('eventTitle').value = event.title;
                    document.getElementById('eventDescription').value = event.description;
                    document.body.removeChild(modal);
                });

                document.getElementById('saveEventBtn').addEventListener('click', () => {
                    saveGeneratedEvent(event, participants.map(p => p.id));
                });
            } else {
                resultDiv.innerHTML = `
                    <p style="color: red;">Ошибка: ${data.message}</p>
                    ${data.details ? `<p>Детали: ${data.details}</p>` : ''}
                `;
            }
        })
        .catch(error => {
            resultDiv.innerHTML = `
                <p style="color: red;">Ошибка сети: ${error.message}</p>
                <p>Убедитесь, что Ollama сервер запущен</p>
            `;
        });
    }
}

function saveGeneratedEvent(event, participantIds = []) {
    const formData = new FormData();
    formData.append('title', event.title);
    formData.append('description', event.description);

    // Добавляем участников
    participantIds.forEach(id => {
        formData.append('participants[]', id);
    });

    fetch('php/event/add_event.php', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert('Событие успешно сохранено в базе данных');
            loadEvents();
            document.querySelector('.modal')?.remove();
        } else {
            alert('Ошибка при сохранении события: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при сохранении события');
    });
}

function cancelEditEvent() {
    const form = document.getElementById('eventForm');
    form.reset();
    delete form.dataset.editMode;
    delete form.dataset.eventId;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Добавить событие';

    const cancelButton = form.querySelector('#cancelEditEvent');
    if (cancelButton) {
        cancelButton.remove();
    }
}
