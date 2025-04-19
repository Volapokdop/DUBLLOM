document.addEventListener('DOMContentLoaded', () => {
    // Добавляем кнопку генерации персонажа
    const generateBtn = document.createElement('button');
    generateBtn.id = 'generateCharacterBtn';
    generateBtn.textContent = 'Сгенерировать персонажа (Gemma 3B)';
    generateBtn.classList.add('generate-character-btn');
    document.getElementById('characterFormContainer').prepend(generateBtn);

    generateBtn.addEventListener('click', showGenerateCharacterModal);
});

document.getElementById('characterForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const isEditMode = this.dataset.editMode === 'true';
    const characterId = this.dataset.characterId;

    const url = isEditMode
        ? `php/character/update_character.php?id=${characterId}`
        : 'php/character/add_character.php';

    fetch(url, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            loadCharacters();
            if (isEditMode) {
                cancelEditCharacter();
            } else {
                this.reset();
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

document.getElementById('showCharacters').addEventListener('click', function (e) {
    e.preventDefault();
    allHide();
    loadCharacters();
    document.getElementById('characters').classList.remove('hidden');
    document.getElementById('characterFormContainer').classList.remove('hidden');
});

function loadCharacters() {
    fetch('php/character/get_characters.php')
        .then(response => response.json())
        .then(characters => {
            const characterList = document.getElementById('characterList');
            characterList.innerHTML = '';

            characters.forEach(character => {
                const template = document.getElementById('characterItemTemplate');
                const clone = template.content.cloneNode(true);
                const characterItem = clone.querySelector('.character-item');

                characterItem.dataset.characterId = character.id;
                characterItem.querySelector('h4').textContent = character.name;

                const editBtn = characterItem.querySelector('.edit-btn');
                editBtn.dataset.id = character.id;
                editBtn.addEventListener('click', showEditCharacterForm);

                const deleteBtn = characterItem.querySelector('.delete-cel');
                deleteBtn.dataset.id = character.id;
                deleteBtn.addEventListener('click', deleteCharacter);

                characterItem.querySelector('.character-age').textContent = character.age;
                characterItem.querySelector('.character-birthday').textContent = character.birthday;
                characterItem.querySelector('.character-gender').textContent =
                    character.gender === 'male' ? 'Мужской' : 'Женский';

                const img = characterItem.querySelector('.character-image');
                if (character.image) {
                    img.src = character.image;
                    img.alt = character.name;
                    img.classList.remove('hidden');
                }

                characterItem.querySelector('.character-description').textContent = character.description;
                characterItem.querySelector('.character-biography').textContent = character.biography;

                characterList.appendChild(characterItem);
            });
        })
        .catch(error => console.error('Ошибка:', error));
}

function loadCharactersForEventForm() {
    fetch('php/character/get_characters.php')
        .then(response => response.json())
        .then(characters => {
            loadCheckboxes('charactersContainer', characters, 'participant');
        })
        .catch(error => console.error('Ошибка:', error));
}

async function deleteCharacter(e) {
    const characterId = e.target.dataset.id;

    if (!confirm('Вы уверены, что хотите удалить этого персонажа?')) return;

    try {
        const response = await fetch('php/character/delete_character.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ characterId })
        });

        const data = await response.json();

        if (data.status === "success") {
            alert(data.message);
            document.querySelector(`li[data-character-id="${characterId}"]`)?.remove();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при удалении');
    }
}

function showGenerateCharacterModal() {
    const template = document.getElementById('generateCharacterModalTemplate');
    const clone = template.content.cloneNode(true);
    const modal = clone.querySelector('.modal-overlay');

    document.body.appendChild(modal);

    modal.querySelector('#generateBtn').addEventListener('click', generateCharacter);
    modal.querySelector('#cancelGenerateBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function generateCharacter() {
    const prompt = modal.querySelector('#aiPrompt').value.trim();
    if (!prompt) {
        alert('Пожалуйста, введите описание персонажа');
        return;
    }

    const resultDiv = modal.querySelector('#generationResult');

    // Показываем сообщение о загрузке
    const loadingTemplate = document.getElementById('generationLoadingTemplate');
    resultDiv.innerHTML = '';
    resultDiv.appendChild(loadingTemplate.content.cloneNode(true));

    fetch('php/ai/generate_character.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
    })
    .then(response => response.json())
    .then(data => {
        resultDiv.innerHTML = '';

        if (data.status === "success") {
            const character = data.character;
            const resultTemplate = document.getElementById('generatedCharacterResultTemplate');
            const resultClone = resultTemplate.content.cloneNode(true);

            // Заполняем шаблон данными
            resultClone.querySelector('.generated-name').textContent = character.name;
            resultClone.querySelector('.generated-age').textContent = character.age;
            resultClone.querySelector('.generated-birthday').textContent = character.birthday;
            resultClone.querySelector('.generated-gender').textContent =
                character.gender === 'male' ? 'Мужской' : 'Женский';
            resultClone.querySelector('.generated-description').textContent = character.description;
            resultClone.querySelector('.generated-biography').textContent = character.biography;

            // Добавляем обработчики событий
            resultClone.querySelector('#useCharacterBtn').addEventListener('click', () => {
                document.getElementById('characterName').value = character.name;
                document.getElementById('characterAge').value = character.age;
                document.getElementById('characterBirthday').value = character.birthday;
                document.getElementById('characterGender').value = character.gender;
                document.getElementById('characterDescription').value = character.description;
                document.getElementById('characterBiography').value = character.biography;
                document.body.removeChild(modal);
            });

            resultClone.querySelector('#saveCharacterBtn').addEventListener('click', () => {
                saveGeneratedCharacter(character);
                document.body.removeChild(modal);
            });

            resultDiv.appendChild(resultClone);
        } else {
            const errorTemplate = document.getElementById('generationErrorTemplate');
            const errorClone = errorTemplate.content.cloneNode(true);
            errorClone.querySelector('.error-message').textContent = `Ошибка: ${data.message}`;
            resultDiv.appendChild(errorClone);

            if (data.details) {
                const details = document.createElement('p');
                details.textContent = `Детали: ${data.details}`;
                resultDiv.appendChild(details);
            }
        }
    })
    .catch(error => {
        resultDiv.innerHTML = '';
        const errorTemplate = document.getElementById('generationErrorTemplate');
        const errorClone = errorTemplate.content.cloneNode(true);
        errorClone.querySelector('.error-message').textContent = `Ошибка сети: ${error.message}`;
        resultDiv.appendChild(errorClone);

        const tips = document.createElement('p');
        tips.innerHTML = `Убедитесь, что:
            <ul>
                <li>Ollama сервер запущен на localhost:11434</li>
                <li>Модель gemma:3b загружена</li>
            </ul>`;
        resultDiv.appendChild(tips);
    });
}

function saveGeneratedCharacter(character) {
    // Создаем FormData и заполняем данными персонажа
    const formData = new FormData();
    formData.append('name', character.name);
    formData.append('age', character.age);
    formData.append('birthday', character.birthday);
    formData.append('gender', character.gender);
    formData.append('description', character.description);
    formData.append('biography', character.biography);

    // Для изображения можно использовать дефолтное или оставить пустым
    // Если нужно дефолтное изображение, можно добавить его здесь

    fetch('php/character/add_character.php', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert('Персонаж успешно сохранен в базе данных');
            loadCharacters(); // Обновляем список персонажей
        } else {
            alert('Ошибка при сохранении персонажа: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при сохранении персонажа');
    });
}

function showEditCharacterForm(e) {
    const characterId = e.target.dataset.id;

    fetch(`php/character/get_character.php?id=${characterId}`)
        .then(response => response.json())
        .then(character => {
            // Заполняем форму редактирования
            document.getElementById('characterName').value = character.name;
            document.getElementById('characterAge').value = character.age;
            document.getElementById('characterBirthday').value = character.birthday;
            document.getElementById('characterGender').value = character.gender;
            document.getElementById('characterDescription').value = character.description;
            document.getElementById('characterBiography').value = character.biography;

            // Сохраняем ID персонажа для редактирования
            const form = document.getElementById('characterForm');
            form.dataset.editMode = 'true';
            form.dataset.characterId = characterId;

            // Изменяем текст кнопки
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Обновить персонажа';

            // Показываем кнопку отмены, если её нет
            if (!form.querySelector('#cancelEditCharacter')) {
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.id = 'cancelEditCharacter';
                cancelButton.textContent = 'Отмена';
                cancelButton.addEventListener('click', cancelEditCharacter);
                form.appendChild(cancelButton);
            }

            // Прокручиваем к форме
            document.getElementById('characterFormContainer').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить данные персонажа');
        });
}

function cancelEditCharacter() {
    const form = document.getElementById('characterForm');
    form.reset();
    delete form.dataset.editMode;
    delete form.dataset.characterId;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Добавить персонажа';

    const cancelButton = form.querySelector('#cancelEditCharacter');
    if (cancelButton) {
        cancelButton.remove();
    }
}
