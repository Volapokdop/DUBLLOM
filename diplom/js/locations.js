document.getElementById('locationFormContainer').addEventListener('click', () => {
    loadEventsForLocationForm();
});

document.getElementById('locationForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const events = Array.from(
        document.querySelectorAll('#eventsList input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    const formData = new FormData(this);
    events.forEach(id => formData.append('events[]', id));

    fetch('php/location/add_location.php', {
        method: 'POST',
        body: formData,
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

function loadLocations() {
    fetch('php/location/get_locations.php')
        .then(response => response.json())
        .then(locations => {
            document.getElementById('locationList').innerHTML = locations.map(location => `
                <li class="location-item">
                    <h4>${location.title}</h4>
                    ${location.image ? `<img src="${location.image}" alt="${location.title}" class="event-image">` : ''}
                    <p>${location.description}</p>
                    ${location.events?.length ? `
                    <div class="participants-container">
                        <h5>Связанные события:</h5>
                        <div class="participants-grid">
                            ${location.events.map(event => `
                                <div class="participant">
                                    ${event.image ? `<img src="${event.image}" alt="${event.title}" class="participant-avatar">` : ''}
                                    <span>${event.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}
                    <button onclick="deleteLocation(${location.id})" class="delete-btn">Удалить</button>
                </li>
            `).join('');
        })
        .catch(error => console.error('Ошибка:', error));
}

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
