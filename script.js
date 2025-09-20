/*
 * Common JavaScript utilities for Ravenof static web app.
 *
 * This file defines helper functions to interact with localStorage,
 * manage cards and admin sessions, and provide dynamic functionality
 * for the various pages (index.html, admin.html, card_form.html, deck.html).
 */

// Default admin credentials. Change these values to secure your app.
// Updated admin credentials
const ADMIN_USERNAME = 'Dlietuvnikas';
const ADMIN_PASSWORD = 'Mandarinas123';

// Retrieve an array of card objects from localStorage. This synchronous
// function is used by admin operations and card editing. Cards stored in
// localStorage are the source of truth during editing sessions.
function getCards() {
    const data = localStorage.getItem('cards');
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse cards from localStorage', e);
        return [];
    }
}

// Load cards from a JSON file located in the data folder, falling back to
// localStorage if the file is unavailable or malformed. This asynchronous
// function is intended for the public-facing card list/deck builder. When
// hosted on a static site, the file data/cards.json provides a shared
// roster for all visitors.
async function loadCards() {
    try {
        const response = await fetch('data/cards.json', { cache: 'no-store' });
        if (response.ok) {
            const json = await response.json();
            if (Array.isArray(json)) {
                return json;
            }
        }
    } catch (err) {
        // Ignore errors: fallback to localStorage
    }
    return getCards();
}

// Save an array of card objects to localStorage.
function saveCards(cards) {
    localStorage.setItem('cards', JSON.stringify(cards));
}

// Generate a new unique ID for a card. IDs are stored in localStorage.
function generateCardId() {
    let nextId = parseInt(localStorage.getItem('nextCardId') || '1', 10);
    localStorage.setItem('nextCardId', String(nextId + 1));
    return nextId;
}

// Check if the admin is logged in.
function isAdminLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

// Perform admin login. Returns true if credentials are correct.
function login(username, password) {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        return true;
    }
    return false;
}

// Log out the admin.
function logout() {
    localStorage.removeItem('adminLoggedIn');
}

// Add a new card to the database.
function addCard(card) {
    const cards = getCards();
    card.id = generateCardId();
    cards.push(card);
    saveCards(cards);
    return card;
}

// Update an existing card. Card must contain an id property.
function updateCard(updated) {
    const cards = getCards();
    const idx = cards.findIndex(c => c.id === updated.id);
    if (idx >= 0) {
        cards[idx] = updated;
        saveCards(cards);
        return true;
    }
    return false;
}

// Delete a card by ID.
function deleteCard(id) {
    const cards = getCards();
    const filtered = cards.filter(c => c.id !== id);
    saveCards(filtered);
}

// Utility to parse comma‑separated numeric or string values.
function parseFilterValues(str) {
    const trimmed = str.trim();
    if (trimmed === '') return null;
    return trimmed.split(',').map(s => s.trim());
}

// Apply search and filter criteria to the list of cards.
function filterCards(cards, criteria) {
    return cards.filter(card => {
        let match = true;
        // search by name
        if (criteria.search) {
            const name = (card.name || '').toLowerCase();
            if (!name.includes(criteria.search.toLowerCase())) match = false;
        }
        // faction
        if (criteria.faction) {
            const cardFaction = (card.faction || '').toLowerCase();
            if (!cardFaction.includes(criteria.faction.toLowerCase())) match = false;
        }
        // rarity
        if (criteria.rarity) {
            const cardRarity = (card.rarity || '').toLowerCase();
            if (!cardRarity.includes(criteria.rarity.toLowerCase())) match = false;
        }
        // type
        if (criteria.type) {
            const cardType = (card.type || '').toLowerCase();
            if (!cardType.includes(criteria.type.toLowerCase())) match = false;
        }
        // cost, attack, hp: handle arrays of values or single value
        function checkNumeric(field, values) {
            const cardVal = card[field];
            const valStr = cardVal !== null && cardVal !== undefined ? String(cardVal) : 'N/A';
            if (values && !values.includes(valStr)) {
                return false;
            }
            return true;
        }
        if (!checkNumeric('cost', criteria.cost)) match = false;
        if (!checkNumeric('attack', criteria.attack)) match = false;
        if (!checkNumeric('hp', criteria.hp)) match = false;
        return match;
    });
}

// Create or update Chart.js bar chart. See deck.html for usage.
function createOrUpdateBarChart(chartInstance, ctxId, entries, axisLabel) {
    const labels = entries.map(item => item[0]);
    const values = entries.map(item => item[1]);
    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = values;
        chartInstance.update();
        return chartInstance;
    } else {
        const ctx = document.getElementById(ctxId).getContext('2d');
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: axisLabel,
                    data: values,
                    backgroundColor: 'rgba(212, 175, 55, 0.6)', // gold tone
                    borderColor: 'rgba(212, 175, 55, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#f5f2e9' },
                        grid: { color: 'rgba(245, 242, 233, 0.2)' },
                        title: {
                            display: true,
                            text: 'Kortų kiekis',
                            color: '#f5f2e9'
                        }
                    },
                    x: {
                        ticks: { color: '#f5f2e9' },
                        grid: { color: 'rgba(245, 242, 233, 0.2)' },
                        title: {
                            display: true,
                            text: axisLabel,
                            color: '#f5f2e9'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `${axisLabel} pasiskirstymas`,
                        color: '#d4af37'
                    }
                }
            }
        });
    }
}