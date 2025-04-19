document.getElementById('locationFormContainer').addEventListener('click', () => {
    loadEventsForLocationForm();
});

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generateLocationBtn';
    generateBtn.textContent = 'Сгенерировать локацию (Gemma 3B)';
    generateBtn.style.margin = '10px 0';
    document.getElementById('locationFormContainer').prepend(generateBtn);

    generateBtn.addEventListener('click', showGenerateLocationModal);
});

document.getElementById('locationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const events = Array.from(document.querySelectorAll('#eventsList input:checked')).map(x => x.value);
    events.forEach(id => formData.append('events[]', id));

    const isEditMode = this.dataset.editMode === 'true';
    const eventId = this.dataset.eventId;

    const url = this.dataset.editMode
        ? `php/location/update_location.php?id=${this.dataset.locationId}`
        : 'php/location/add_location.php';

    fetch(url, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            loadLocations();
            if (isEditMode) {
                cancelEditLocation();
            } else {
                this.reset();
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

document.getElementById('showLocations').addEventListener('click', function (e) {
    e.preventDefault();
    allHide();
    loadLocations();
    document.getElementById('locations').classList.remove('hidden');
    document.getElementById('locationFormContainer').classList.remove('hidden');
});

function loadEventsForLocationForm() {
    fetch('php/event/get_events.php')
        .then(response => response.json())
        .then(events => {
            loadCheckboxes('eventsList', events, 'character');
        })
        .catch(error => console.error('Ошибка:', error));
}

// Обновляем функцию loadLocations
function loadLocations() {
    fetch('php/location/get_locations.php')
        .then(response => response.json())
        .then(locations => {
            document.getElementById('locationList').innerHTML = locations.map(location => `
                <li class="location-item" data-location-id="${location.id}">
                    <div class="location-header">
                        <h4>${location.title}</h4>
                        <div class="location-actions">
                            <button class="edit-btn" data-id="${location.id}">Редактировать</button>
                            <button class="delete-btn" data-id="${location.id}">Удалить</button>
                        </div>
                    </div>
                    ${location.image ? `<img src="${location.image}" class="location-image">` : ''}
                    <p>${location.description}</p>
                    ${location.events?.length ? `
                    <div class="events-container">
                        <h5>Связанные события:</h5>
                        <div class="events-grid">
                            ${location.events.map(event => `
                                <div class="event">
                                    ${event.image ? `<img src="${event.image}" class="event-thumbnail">` : ''}
                                    <span>${event.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}
                </li>
            `).join('');

            // Добавляем обработчики
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', showEditLocationForm);
            });
        });
}

// Функция показа формы редактирования
function showEditLocationForm(e) {
    const locationId = e.target.dataset.id;

    fetch(`php/location/get_location.php?id=${locationId}`)
        .then(response => response.json())
        .then(location => {
            // Заполняем форму
            document.getElementById('locationTitle').value = location.title;
            document.getElementById('locationDescription').value = location.description;

            // Устанавливаем режим редактирования
            const form = document.getElementById('locationForm');
            form.dataset.editMode = 'true';
            form.dataset.locationId = locationId;

            // Обновляем кнопку
            form.querySelector('button[type="submit"]').textContent = 'Обновить локацию';

            // Добавляем кнопку отмены
            if (!form.querySelector('#cancelEdit')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.id = 'cancelEdit';
                cancelBtn.textContent = 'Отмена';
                cancelBtn.onclick = cancelEditLocation;
                form.appendChild(cancelBtn);
            }

            // Загружаем и отмечаем события
            loadEventsForLocationForm().then(() => {
                location.events.forEach(eventId => {
                    const checkbox = document.querySelector(`input[value="${eventId}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            });
        });
}

// Отмена редактирования
function cancelEditLocation() {
    const form = document.getElementById('locationForm');
    form.reset();
    delete form.dataset.editMode;
    delete form.dataset.locationId;
    form.querySelector('button[type="submit"]').textContent = 'Добавить локацию';
    const cancelBtn = form.querySelector('#cancelEdit');
    if (cancelBtn) cancelBtn.remove();
}

// Обновляем обработчик формы
document.getElementById('locationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const events = Array.from(document.querySelectorAll('#eventsList input:checked')).map(x => x.value);
    events.forEach(id => formData.append('events[]', id));

    const url = this.dataset.editMode
        ? `php/location/update_location.php?id=${this.dataset.locationId}`
        : 'php/location/add_location.php';

    fetch(url, {
        method: 'POST',
        body: formData
    }).then(/* обработка ответа */);
});

function deleteLocation(locationId) {
    if (confirm('Вы уверены, что хотите удалить эту локацию?')) {
        fetch('php/location/delete_location.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locationId: locationId }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                alert(data.message);
                loadLocations();
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

function showEditLocationForm(e) {
    const locationId = e.target.dataset.id;

    fetch(`php/location/get_location.php?id=${locationId}`)
        .then(response => response.json())
        .then(location => {
            // Заполняем форму
            document.getElementById('locationTitle').value = location.title;
            document.getElementById('locationDescription').value = location.description;

            // Устанавливаем режим редактирования
            const form = document.getElementById('locationForm');
            form.dataset.editMode = 'true';
            form.dataset.locationId = locationId;

            // Обновляем кнопку
            form.querySelector('button[type="submit"]').textContent = 'Обновить локацию';

            // Добавляем кнопку отмены
            if (!form.querySelector('#cancelEdit')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.id = 'cancelEdit';
                cancelBtn.textContent = 'Отмена';
                cancelBtn.onclick = cancelEditLocation;
                form.appendChild(cancelBtn);
            }
        });
}

// Отмена редактирования
function cancelEditLocation() {
    const form = document.getElementById('locationForm');
    form.reset();
    delete form.dataset.editMode;
    delete form.dataset.locationId;
    form.querySelector('button[type="submit"]').textContent = 'Добавить локацию';
    const cancelBtn = form.querySelector('#cancelEdit');
    if (cancelBtn) cancelBtn.remove();
}

function showGenerateLocationModal() {
    // Проверяем, есть ли выбранные события
    const selectedEvents = Array.from(
        document.querySelectorAll('#eventsList input[type="checkbox"]:checked')
    ).map(checkbox => {
        const label = checkbox.nextElementSibling;
        return {
            id: checkbox.value,
            title: label.textContent.trim(),
            image: label.querySelector('img')?.src
        };
    });

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

    // Показываем выбранные события
    const eventsHTML = selectedEvents.length > 0
        ? selectedEvents.map(e => `
            <div class="event" style="display: flex; align-items: center; gap: 8px; margin: 5px 0;">
                ${e.image ? `<img src="${e.image}" alt="${e.title}" style="width: 30px; height: 30px; border-radius: 4px;">` : ''}
                <span>${e.title}</span>
            </div>
        `).join('')
        : '<p>События не выбраны</p>';

    modalContent.innerHTML = `
        <h3>Генератор локаций (Gemma 3B)</h3>
        <div style="margin-bottom: 15px;">
            <h4>Связанные события:</h4>
            <div>${eventsHTML}</div>
        </div>
        <p>Опишите локацию, которую хотите создать:</p>
        <textarea id="aiPrompt" style="width: 100%; height: 100px; margin: 10px 0;"
                  placeholder="Пример: древний лес с высокими деревьями"></textarea>
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
        generateLocation(selectedEvents);
    });
    modalContent.querySelector('#cancelGenerateBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    function generateLocation(events) {
        const prompt = document.getElementById('aiPrompt').value.trim();
        const eventsText = events.length > 0
            ? `Связанные события: ${events.map(e => e.title).join(', ')}. `
            : '';

        const fullPrompt = `${eventsText}${prompt}`;

        const resultDiv = document.getElementById('generationResult');
        resultDiv.innerHTML = '<p>Генерация локации (может занять 10-20 секунд)...</p>';

        fetch('php/ai/generate_location.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: fullPrompt,
                event_ids: events.map(e => e.id)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                const location = data.location;
                resultDiv.innerHTML = `
                    <h4>Результат генерации:</h4>
                    <p><strong>Название:</strong> ${location.title}</p>
                    <p><strong>Описание:</strong> ${location.description}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button id="useLocationBtn">Использовать эту локацию</button>
                        <button id="saveLocationBtn">Сохранить локацию</button>
                    </div>
                `;

                document.getElementById('useLocationBtn').addEventListener('click', () => {
                    document.getElementById('locationTitle').value = location.title;
                    document.getElementById('locationDescription').value = location.description;
                    document.body.removeChild(modal);
                });

                document.getElementById('saveLocationBtn').addEventListener('click', () => {
                    saveGeneratedLocation(location, events.map(e => e.id));
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

function saveGeneratedLocation(location, eventIds = []) {
    const formData = new FormData();
    formData.append('title', location.title);
    formData.append('description', location.description);

    // Добавляем связанные события
    eventIds.forEach(id => {
        formData.append('events[]', id);
    });

    fetch('php/location/add_location.php', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert('Локация успешно сохранена в базе данных');
            loadLocations();
            document.querySelector('.modal')?.remove();
        } else {
            alert('Ошибка при сохранении локации: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при сохранении локации');
    });
}
