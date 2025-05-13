document.addEventListener('DOMContentLoaded', function() {
    // Основные элементы
    const usernameDisplay = document.getElementById('username-display');
    const cardsList = document.getElementById('cards-list');
    const cardView = document.getElementById('card-view');
    const noCardSelected = document.getElementById('no-card-selected');
    const cardTitle = document.getElementById('card-title');
    const cardType = document.getElementById('card-type');
    const cardContent = document.getElementById('card-content');
    const relationsList = document.getElementById('relations-list');
    const saveCardBtn = document.getElementById('save-card-btn');
    const deleteCardBtn = document.getElementById('delete-card-btn');
    const addCardBtn = document.getElementById('add-card-btn');
    const addRelationBtn = document.getElementById('add-relation-btn');
    const cardsTypeFilter = document.getElementById('cards-type-filter');
    const cardsSearch = document.getElementById('cards-search');

    // Модальные окна
    const newCardModal = document.getElementById('new-card-modal');
    const relationModal = document.getElementById('relation-modal');
    const newCardForm = document.getElementById('new-card-form');
    const relationForm = document.getElementById('relation-form');
    const relationTargetCard = document.getElementById('relation-target-card');
    const relationTypeInput = document.getElementById('relation-type');
    const relationNotes = document.getElementById('relation-notes');

    let currentCardId = null;
    let allCards = [];

    // Инициализация
    checkAuth();
    loadCards();

    // Проверка авторизации
    function checkAuth() {
        fetch('php/auth.php?action=check')
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    if (usernameDisplay ) {
                        usernameDisplay .textContent = data.username;
                    }
                } else {
                    window.location.href = 'index.html'; // Перенаправление, если не авторизован
                }
            })
            .catch(error => {
                console.error('Ошибка проверки авторизации:', error);
                window.location.href = 'index.html';
            });
    }

    // Загрузка списка карточек
    function loadCards() {
        fetch('php/cards.php?action=list')
            .then(response => response.json())
            .then(data => {
                allCards = data;
                renderCardsList(data);
            });
    }

    // Отображение списка карточек
    function renderCardsList(cards) {
        cardsList.innerHTML = '';

        const typeFilter = cardsTypeFilter.value;
        const searchQuery = cardsSearch.value.toLowerCase();

        cards.forEach(card => {
            if ((!typeFilter || card.type === typeFilter) &&
                (card.title.toLowerCase().includes(searchQuery) ||
                 (card.content && card.content.toLowerCase().includes(searchQuery)))) {
                const cardElement = document.createElement('div');
                cardElement.className = `card-item ${card.type}`;
                cardElement.textContent = card.title;
                cardElement.dataset.id = card.id;

                cardElement.addEventListener('click', () => {
                    loadCard(card.id);
                });

                cardsList.appendChild(cardElement);
            }
        });
    }

    // Загрузка конкретной карточки
    function loadCard(cardId) {
        if (!cardId || isNaN(cardId)) {
            console.error('Invalid card ID:', cardId);
            return;
        }

        fetch(`php/cards.php?action=get&id=${cardId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                currentCardId = data.id;
                cardTitle.textContent = data.title;
                cardType.textContent = getTypeName(data.type);
                cardType.className = `type-badge ${data.type}`;
                cardContent.innerHTML = data.content || '';
                renderRelations(data.relations || []);
                cardView.style.display = 'block';
                noCardSelected.style.display = 'none';
            })
            .catch(error => {
                console.error('Error loading card:', error);
            });
    }

    // Отображение списка связей
    function renderRelations(relations) {
        relationsList.innerHTML = '';

        if (!relations || relations.length === 0) {
            relationsList.innerHTML = '<p>Нет связей</p>';
            return;
        }

        relations.forEach(relation => {
            const relationElement = document.createElement('div');
            relationElement.className = 'relation-item';

            const relationText = document.createElement('div');
            relationText.innerHTML = `
                <span class="relation-type">${relation.relation_type}</span>:
                <span class="relation-card" data-id="${relation.id}">${relation.title}</span>
            `;

            if (relation.notes) {
                const notesElement = document.createElement('div');
                notesElement.className = 'relation-notes';
                notesElement.textContent = relation.notes;
                relationText.appendChild(notesElement);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'delete-relation-btn';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRelation(relation.id);
            });

            relationElement.appendChild(relationText);
            relationElement.appendChild(deleteBtn);
            relationsList.appendChild(relationElement);
        });

        // Добавляем обработчики для клика по связанным карточкам
        document.querySelectorAll('.relation-card').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                loadCard(item.dataset.id);
            });
        });
    }

    // Удаление связи
    function deleteRelation(relationId) {
        if (!confirm('Удалить эту связь?')) return;

        fetch(`php/cards.php?action=remove-relation&id=${relationId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadCard(currentCardId);
                } else {
                    alert(data.message);
                }
            });
    }

    // Получение читаемого названия типа
    function getTypeName(type) {
        const types = {
            'character': 'Персонаж',
            'location': 'Локация',
            'event': 'Событие',
            'other': 'Другое'
        };
        return types[type] || type;
    }

    // Сохранение карточки
    function saveCard() {
        if (!currentCardId) return;

        const formData = new FormData();
        formData.append('id', currentCardId);
        formData.append('title', cardTitle.textContent);
        formData.append('content', cardContent.innerHTML);

        fetch('php/cards.php?action=save', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCards();
            } else {
                alert(data.message);
            }
        });
    }

    // Удаление карточки
    function deleteCard() {
        if (!currentCardId || !confirm('Вы уверены, что хотите удалить эту карточку? Все связанные связи также будут удалены.')) {
            return;
        }

        fetch(`php/cards.php?action=delete&id=${currentCardId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    currentCardId = null;
                    cardView.style.display = 'none';
                    noCardSelected.style.display = 'block';
                    loadCards(); // Обновляем список карточек
                    showNotification('Карточка успешно удалена', 'success');
                } else {
                    throw new Error(data.message || 'Ошибка при удалении карточки');
                }
            })
            .catch(error => {
                console.error('Error deleting card:', error);
                showNotification(error.message, 'error');
            });
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Создание новой карточки
    function createNewCard(type, title) {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('title', title);
        formData.append('content', '');
        formData.append('fields', JSON.stringify({}));

        fetch('php/cards.php?action=save', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Create card response:', data);
            if (data.success) {
                newCardModal.style.display = 'none';
                newCardForm.reset();
                loadCards();

                if (data.id && !isNaN(data.id)) {
                    loadCard(data.id);
                } else {
                    console.error('Invalid card ID in response:', data.id);
                }
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Произошла ошибка при создании карточки');
        });
    }

    // Добавление связи между карточками
    function addRelation(cardFrom, cardTo, relationType, notes) {
        const formData = new FormData();
        formData.append('card_from', cardFrom);
        formData.append('card_to', cardTo);
        formData.append('relation_type', relationType);
        formData.append('notes', notes);

        fetch('php/cards.php?action=add-relation', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                relationModal.style.display = 'none';
                relationForm.reset();
                loadCard(currentCardId);
            } else {
                alert(data.message);
            }
        });
    }

    // Заполнение списка карточек для выбора в модальном окне связей
    function populateRelationTargets(excludeId) {
        relationTargetCard.innerHTML = '<option value="">Выберите карточку</option>';

        allCards.forEach(card => {
            if (card.id != excludeId) {
                const option = document.createElement('option');
                option.value = card.id;
                option.textContent = `${card.title} (${getTypeName(card.type)})`;
                relationTargetCard.appendChild(option);
            }
        });
    }

    // Обработчики событий
    saveCardBtn.addEventListener('click', saveCard);
    deleteCardBtn.addEventListener('click', deleteCard);

    addCardBtn.addEventListener('click', () => {
        newCardModal.style.display = 'block';
    });

    addRelationBtn.addEventListener('click', () => {
        if (!currentCardId) {
            alert('Сначала выберите карточку');
            return;
        }

        populateRelationTargets(currentCardId);
        relationModal.style.display = 'block';
    });

    newCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('new-card-type').value;
        const title = document.getElementById('new-card-title').value.trim();

        if (title) {
            createNewCard(type, title);
        }
    });

    relationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const targetCardId = relationTargetCard.value;
        const relationType = relationTypeInput.value.trim();

        if (targetCardId && relationType) {
            addRelation(currentCardId, targetCardId, relationType, relationNotes.value);
        }
    });

    cardsTypeFilter.addEventListener('change', () => {
        renderCardsList(allCards);
    });

    cardsSearch.addEventListener('input', () => {
        renderCardsList(allCards);
    });

    // Закрытие модальных окон
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});
