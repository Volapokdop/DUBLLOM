document.getElementById('characterForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch('php/character/add_character.php', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert(data.message);
            loadCharacters();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

document.getElementById('characterForm').innerHTML = `
    <label for="characterBirthday">День рождения:</label>
    <input type="text" id="characterBirthday" name="birthday" required>
`;

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
            characterList.innerHTML = characters.map(character => `
                <li data-character-id="${character.id}">
                    <h4>${character.name}</h4>
                    <p>Возраст: ${character.age}</p>
                    <p>День рождения: ${character.birthday}</p>
                    <p>Пол: ${character.gender === 'male' ? 'Мужской' : 'Женский'}</p>
                    <img src="${character.image}" alt="${character.name}" style="width: 100px; height: auto;">
                    <p>Описание: ${character.description}</p>
                    <p>Биография: ${character.biography}</p>
                    <button class="delete-cel" data-id="${character.id}">Удалить</button>
                </li>
            `).join('');

            document.querySelectorAll('.delete-cel').forEach(button => {
                button.addEventListener('click', deleteCharacter);
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
