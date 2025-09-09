// GoldenSign - Tournament & Course Inscription Platform
// JavaScript functionality for data management and UI interactions

// Data Storage
class DataManager {
    constructor() {
        this.events = this.loadEvents();
        this.inscriptions = this.loadInscriptions();
    }

    // Events Management
    createEvent(eventData) {
        const event = {
            id: this.generateId(),
            ...eventData,
            createdAt: new Date().toISOString(),
            inscriptions: []
        };
        this.events.push(event);
        this.saveEvents();
        return event;
    }

    getEvent(id) {
        return this.events.find(event => event.id === id);
    }

    getEvents() {
        return this.events;
    }

    deleteEvent(id) {
        this.events = this.events.filter(event => event.id !== id);
        this.inscriptions = this.inscriptions.filter(inscription => inscription.eventId !== id);
        this.saveEvents();
        this.saveInscriptions();
    }

    // Inscriptions Management
    createInscription(inscriptionData) {
        const inscription = {
            id: this.generateId(),
            ...inscriptionData,
            createdAt: new Date().toISOString(),
            status: 'accepted'
        };
        this.inscriptions.push(inscription);
        this.saveInscriptions();
        return inscription;
    }

    getInscriptionsForEvent(eventId) {
        return this.inscriptions.filter(inscription => inscription.eventId === eventId);
    }

    getInscription(id) {
        return this.inscriptions.find(inscription => inscription.id === id);
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Local Storage
    saveEvents() {
        localStorage.setItem('goldensign_events', JSON.stringify(this.events));
    }

    loadEvents() {
        const stored = localStorage.getItem('goldensign_events');
        return stored ? JSON.parse(stored) : [];
    }

    saveInscriptions() {
        localStorage.setItem('goldensign_inscriptions', JSON.stringify(this.inscriptions));
    }

    loadInscriptions() {
        const stored = localStorage.getItem('goldensign_inscriptions');
        return stored ? JSON.parse(stored) : [];
    }

    // URL Generation
    generateEventUrl(eventId) {
        return `${window.location.origin}/inscription.html?id=${eventId}`;
    }

    generateConfirmationUrl(inscriptionId) {
        return `${window.location.origin}/confirmation.html?id=${inscriptionId}`;
    }
}

// Initialize Data Manager
const dataManager = new DataManager();

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28A745' : '#DC3545'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Home Page Functions
function joinFromLink() {
    const linkInput = document.getElementById('joinLink');
    const link = linkInput.value.trim();
    
    if (!link) {
        showNotification('Please enter a valid invitation link', 'error');
        return;
    }
    
    // Extract event ID from URL
    const url = new URL(link);
    const eventId = url.searchParams.get('id');
    
    if (!eventId) {
        showNotification('Invalid invitation link format', 'error');
        return;
    }
    
    // Redirect to inscription page
    window.location.href = `inscription.html?id=${eventId}`;
}

// Manager Page Functions
let currentEventType = 'tournament';
let currentTab = 'create';

function toggleEventType(type) {
    currentEventType = type;
    
    // Update button states
    document.getElementById('tournamentBtn').classList.toggle('active', type === 'tournament');
    document.getElementById('courseBtn').classList.toggle('active', type === 'course');
    
    // Update form placeholder
    const titleInput = document.getElementById('eventTitle');
    titleInput.placeholder = type === 'tournament' 
        ? 'Enter tournament title (e.g., "Summer Chess Championship")'
        : 'Enter course title (e.g., "Web Development Bootcamp")';
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('createTab').classList.toggle('active', tab === 'create');
    document.getElementById('communitiesTab').classList.toggle('active', tab === 'communities');
    
    // Show/hide sections
    document.getElementById('createSection').style.display = tab === 'create' ? 'block' : 'none';
    document.getElementById('eventsSection').style.display = tab === 'create' ? 'block' : 'none';
    document.getElementById('communitiesSection').style.display = tab === 'communities' ? 'block' : 'none';
    
    // Update communities data when switching to communities tab
    if (tab === 'communities') {
        updateCommunitiesList();
    }
}

function handleEventFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        maxParticipants: parseInt(formData.get('maxParticipants')),
        date: formData.get('date'),
        type: currentEventType
    };
    
    // Validate form
    if (!eventData.title || !eventData.description || !eventData.maxParticipants || !eventData.date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (eventData.maxParticipants < 1) {
        showNotification('Maximum participants must be at least 1', 'error');
        return;
    }
    
    if (new Date(eventData.date) < new Date()) {
        showNotification('Event date must be in the future', 'error');
        return;
    }
    
    // Create event
    const newEvent = dataManager.createEvent(eventData);
    
    // Show success message and open modal
    showNotification(`${currentEventType.charAt(0).toUpperCase() + currentEventType.slice(1)} created successfully!`);
    
    // Reset form
    event.target.reset();
    
    // Update events list
    updateEventsList();
    
    // Show event details modal
    showEventModal(newEvent);
}

function updateEventsList() {
    const eventsList = document.getElementById('eventsList');
    const events = dataManager.getEvents();
    const eventsCount = document.getElementById('eventsCount');
    
    eventsCount.textContent = `${events.length} event${events.length !== 1 ? 's' : ''}`;
    
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No events yet</h3>
                <p>Create your first tournament or course to get started!</p>
            </div>
        `;
        return;
    }
    
    eventsList.innerHTML = events.map(event => {
        const inscriptions = dataManager.getInscriptionsForEvent(event.id);
        const availableSlots = event.maxParticipants - inscriptions.length;
        
        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-card-header">
                    <div>
                        <h3 class="event-title">${event.title}</h3>
                        <div class="event-type-badge">${event.type}</div>
                    </div>
                </div>
                <p class="event-description">${event.description}</p>
                <div class="event-details">
                    <div class="event-detail">
                        <span class="event-detail-icon">📅</span>
                        <span>${formatDate(event.date)}</span>
                    </div>
                    <div class="event-detail">
                        <span class="event-detail-icon">👥</span>
                        <span>${inscriptions.length}/${event.maxParticipants} participants</span>
                    </div>
                    <div class="event-detail">
                        <span class="event-detail-icon">${availableSlots > 0 ? '✅' : '❌'}</span>
                        <span>${availableSlots > 0 ? `${availableSlots} slots available` : 'Full'}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn btn-primary" onclick="showEventModal('${event.id}')">
                        <span class="btn-icon">👁️</span>
                        View Details
                    </button>
                    <button class="btn btn-secondary" onclick="copyEventLink('${event.id}')">
                        <span class="btn-icon">📋</span>
                        Copy Link
                    </button>
                    <button class="btn btn-secondary" onclick="viewInscriptions('${event.id}')">
                        <span class="btn-icon">👥</span>
                        View Inscriptions
                    </button>
                    <button class="btn btn-secondary" onclick="deleteEvent('${event.id}')" style="color: var(--danger); border-color: var(--danger);">
                        <span class="btn-icon">🗑️</span>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showEventModal(eventId) {
    const event = typeof eventId === 'string' ? dataManager.getEvent(eventId) : eventId;
    if (!event) return;
    
    const modal = document.getElementById('eventModal');
    const modalEventInfo = document.getElementById('modalEventInfo');
    const inscriptions = dataManager.getInscriptionsForEvent(event.id);
    const availableSlots = event.maxParticipants - inscriptions.length;
    
    const eventUrl = dataManager.generateEventUrl(event.id);
    
    modalEventInfo.innerHTML = `
        <div class="event-details">
            <h3>${event.title}</h3>
            <div class="event-type-badge">${event.type}</div>
            <p><strong>Description:</strong> ${event.description}</p>
            <p><strong>Date:</strong> ${formatDate(event.date)}</p>
            <p><strong>Max Participants:</strong> ${event.maxParticipants}</p>
            <p><strong>Current Registrations:</strong> ${inscriptions.length}</p>
            <p><strong>Available Slots:</strong> ${availableSlots}</p>
            <p><strong>Status:</strong> ${availableSlots > 0 ? 'Open for registration' : 'Full'}</p>
            <div class="event-url-section">
                <label><strong>Registration Link:</strong></label>
                <div class="url-display">
                    <input type="text" value="${eventUrl}" readonly class="url-input" id="eventUrlInput">
                    <button onclick="copyUrlFromInput()" class="btn btn-secondary btn-small">
                        <span class="btn-icon">📋</span>
                        Copy
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Store current event ID for modal actions
    modal.dataset.eventId = event.id;
    
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

function copyEventLink(eventId) {
    const event = dataManager.getEvent(eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }
    
    const url = dataManager.generateEventUrl(eventId);
    
    navigator.clipboard.writeText(url).then(() => {
        showNotification(`Event link copied to clipboard!`);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification(`Event link copied to clipboard!`);
        } catch (err) {
            showNotification('Failed to copy link. Please copy manually: ' + url, 'error');
        }
        
        document.body.removeChild(textArea);
    });
}

function copyEventLinkFromModal() {
    const modal = document.getElementById('eventModal');
    const eventId = modal.dataset.eventId;
    if (eventId) {
        copyEventLink(eventId);
    } else {
        showNotification('No event selected', 'error');
    }
}

function copyUrlFromInput() {
    const urlInput = document.getElementById('eventUrlInput');
    if (urlInput) {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showNotification('URL copied to clipboard!');
        } catch (err) {
            // Fallback to clipboard API
            navigator.clipboard.writeText(urlInput.value).then(() => {
                showNotification('URL copied to clipboard!');
            }).catch(() => {
                showNotification('Failed to copy URL', 'error');
            });
        }
    }
}

function viewInscriptions(eventId) {
    const event = dataManager.getEvent(eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }
    
    const inscriptions = dataManager.getInscriptionsForEvent(eventId);
    const modal = document.getElementById('inscriptionsModal');
    const inscriptionsList = document.getElementById('inscriptionsList');
    
    // Update modal title with event name
    const modalTitle = modal.querySelector('h3');
    modalTitle.textContent = `Inscriptions for "${event.title}"`;
    
    if (inscriptions.length === 0) {
        inscriptionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>No registrations yet</h3>
                <p>Share the event link to start receiving registrations!</p>
            </div>
        `;
    } else {
        inscriptionsList.innerHTML = `
            <div class="inscriptions-header">
                <p><strong>Total Registrations:</strong> ${inscriptions.length} of ${event.maxParticipants}</p>
                <p><strong>Available Slots:</strong> ${event.maxParticipants - inscriptions.length}</p>
            </div>
            ${inscriptions.map((inscription, index) => `
                <div class="inscription-item">
                    <div class="inscription-number">#${index + 1}</div>
                    <div class="inscription-info">
                        <div class="inscription-name">${inscription.name}</div>
                        <div class="inscription-email">${inscription.email}</div>
                    </div>
                    <div class="inscription-date">${formatDateShort(inscription.createdAt)}</div>
                </div>
            `).join('')}
        `;
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function viewInscriptionsFromModal() {
    const modal = document.getElementById('eventModal');
    const eventId = modal.dataset.eventId;
    if (eventId) {
        // Close the event modal first
        closeModal();
        // Then open inscriptions modal
        setTimeout(() => {
            viewInscriptions(eventId);
        }, 300);
    } else {
        showNotification('No event selected', 'error');
    }
}

function closeInscriptionsModal() {
    const modal = document.getElementById('inscriptionsModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    
    dataManager.deleteEvent(eventId);
    updateEventsList();
    showNotification('Event deleted successfully');
}

// Communities Management Functions
function updateCommunitiesList() {
    const events = dataManager.getEvents();
    const communitiesList = document.getElementById('communitiesList');
    const totalEvents = document.getElementById('totalEvents');
    const totalParticipants = document.getElementById('totalParticipants');
    
    // Calculate total participants
    let totalParticipantsCount = 0;
    events.forEach(event => {
        const inscriptions = dataManager.getInscriptionsForEvent(event.id);
        totalParticipantsCount += inscriptions.length;
    });
    
    // Update stats
    totalEvents.textContent = `${events.length} Event${events.length !== 1 ? 's' : ''}`;
    totalParticipants.textContent = `${totalParticipantsCount} Participant${totalParticipantsCount !== 1 ? 's' : ''}`;
    
    if (events.length === 0) {
        communitiesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <h3>No communities yet</h3>
                <p>Create your first tournament or course to start building your community!</p>
            </div>
        `;
        return;
    }
    
    // Apply filters
    const filteredEvents = filterEvents(events);
    
    communitiesList.innerHTML = filteredEvents.map(event => {
        const inscriptions = dataManager.getInscriptionsForEvent(event.id);
        const availableSlots = event.maxParticipants - inscriptions.length;
        const eventDate = new Date(event.date);
        const now = new Date();
        const isPast = eventDate < now;
        const isFull = availableSlots <= 0;
        
        return `
            <div class="community-card" data-event-id="${event.id}">
                <div class="community-card-header">
                    <div>
                        <h3 class="community-title">${event.title}</h3>
                        <div class="community-type-badge">${event.type}</div>
                    </div>
                </div>
                
                <p class="community-description">${event.description}</p>
                
                <div class="community-stats">
                    <div class="community-stat">
                        <div class="community-stat-value">${inscriptions.length}</div>
                        <div class="community-stat-label">Participants</div>
                    </div>
                    <div class="community-stat">
                        <div class="community-stat-value">${event.maxParticipants}</div>
                        <div class="community-stat-label">Max Capacity</div>
                    </div>
                    <div class="community-stat">
                        <div class="community-stat-value">${availableSlots}</div>
                        <div class="community-stat-label">Available</div>
                    </div>
                    <div class="community-stat">
                        <div class="community-stat-value">${formatDateShort(event.date)}</div>
                        <div class="community-stat-label">Date</div>
                    </div>
                </div>
                
                <div class="community-participants">
                    <div class="participants-header">
                        <span class="participants-title">Participants (${inscriptions.length})</span>
                        ${inscriptions.length > 0 ? `
                            <button class="participants-toggle" onclick="toggleParticipants('${event.id}')">
                                <span id="toggleText-${event.id}">Show</span>
                            </button>
                        ` : ''}
                    </div>
                    
                    ${inscriptions.length > 0 ? `
                        <div id="participants-${event.id}" class="participants-list">
                            ${inscriptions.map((inscription, index) => `
                                <div class="participant-item">
                                    <div class="participant-info">
                                        <div class="participant-name">${inscription.name}</div>
                                        <div class="participant-email">${inscription.email}</div>
                                    </div>
                                    <div class="participant-date">${formatDateShort(inscription.createdAt)}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state" style="padding: 20px; text-align: center;">
                            <p>No participants yet. Share the event link to start receiving registrations!</p>
                        </div>
                    `}
                </div>
                
                <div class="community-actions">
                    <button class="btn btn-primary" onclick="copyEventLink('${event.id}')">
                        <span class="btn-icon">📋</span>
                        Copy Link
                    </button>
                    <button class="btn btn-secondary" onclick="viewInscriptions('${event.id}')">
                        <span class="btn-icon">👥</span>
                        View Details
                    </button>
                    <button class="btn btn-secondary" onclick="exportEventData('${event.id}')">
                        <span class="btn-icon">📊</span>
                        Export Data
                    </button>
                    <button class="btn btn-secondary" onclick="deleteEvent('${event.id}')" style="color: var(--danger); border-color: var(--danger);">
                        <span class="btn-icon">🗑️</span>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterEvents(events) {
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    return events.filter(event => {
        // Type filter
        if (typeFilter !== 'all' && event.type !== typeFilter) {
            return false;
        }
        
        // Status filter
        const inscriptions = dataManager.getInscriptionsForEvent(event.id);
        const availableSlots = event.maxParticipants - inscriptions.length;
        const eventDate = new Date(event.date);
        const now = new Date();
        const isPast = eventDate < now;
        const isFull = availableSlots <= 0;
        
        if (statusFilter === 'open' && (isFull || isPast)) {
            return false;
        }
        if (statusFilter === 'full' && !isFull) {
            return false;
        }
        if (statusFilter === 'past' && !isPast) {
            return false;
        }
        
        return true;
    });
}

function filterCommunities() {
    updateCommunitiesList();
}

function toggleParticipants(eventId) {
    const participantsList = document.getElementById(`participants-${eventId}`);
    const toggleText = document.getElementById(`toggleText-${eventId}`);
    
    if (participantsList.classList.contains('show')) {
        participantsList.classList.remove('show');
        toggleText.textContent = 'Show';
    } else {
        participantsList.classList.add('show');
        toggleText.textContent = 'Hide';
    }
}

function exportEventData(eventId) {
    const event = dataManager.getEvent(eventId);
    if (!event) return;
    
    const inscriptions = dataManager.getInscriptionsForEvent(eventId);
    
    // Create CSV content
    let csvContent = `Event: ${event.title}\n`;
    csvContent += `Type: ${event.type}\n`;
    csvContent += `Date: ${formatDate(event.date)}\n`;
    csvContent += `Max Participants: ${event.maxParticipants}\n`;
    csvContent += `Current Participants: ${inscriptions.length}\n\n`;
    csvContent += `Name,Email,Registration Date\n`;
    
    inscriptions.forEach(inscription => {
        csvContent += `"${inscription.name}","${inscription.email}","${formatDate(inscription.createdAt)}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_participants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Event data exported successfully!');
}

function exportCommunitiesData() {
    const events = dataManager.getEvents();
    if (events.length === 0) {
        showNotification('No events to export', 'error');
        return;
    }
    
    let csvContent = 'Event,Type,Date,Max Participants,Current Participants,Available Slots,Status\n';
    
    events.forEach(event => {
        const inscriptions = dataManager.getInscriptionsForEvent(event.id);
        const availableSlots = event.maxParticipants - inscriptions.length;
        const eventDate = new Date(event.date);
        const now = new Date();
        const isPast = eventDate < now;
        const isFull = availableSlots <= 0;
        
        let status = 'Open';
        if (isPast) status = 'Past';
        else if (isFull) status = 'Full';
        
        csvContent += `"${event.title}","${event.type}","${formatDate(event.date)}",${event.maxParticipants},${inscriptions.length},${availableSlots},"${status}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communities_overview_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Communities data exported successfully!');
}

// Inscription Page Functions
function loadEventFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        showNotFoundState();
        return;
    }
    
    const event = dataManager.getEvent(eventId);
    if (!event) {
        showNotFoundState();
        return;
    }
    
    displayEventDetails(event);
}

function showNotFoundState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('notFoundState').style.display = 'block';
}

function displayEventDetails(event) {
    const inscriptions = dataManager.getInscriptionsForEvent(event.id);
    const availableSlots = event.maxParticipants - inscriptions.length;
    
    // Check if event is full
    if (availableSlots <= 0) {
        showFullState();
        return;
    }
    
    // Update event details
    document.getElementById('eventTypeBadge').textContent = event.type;
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDescription').textContent = event.description;
    document.getElementById('eventDate').textContent = formatDate(event.date);
    document.getElementById('availableSlots').textContent = `${availableSlots} of ${event.maxParticipants} slots available`;
    
    // Show event details
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('eventDetails').style.display = 'block';
    
    // Store event ID for form submission
    document.getElementById('registrationForm').dataset.eventId = event.id;
}

function showFullState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('fullState').style.display = 'block';
}

function handleRegistrationForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const eventId = event.target.dataset.eventId;
    const eventObj = dataManager.getEvent(eventId);
    
    if (!eventObj) {
        showNotification('Event not found', 'error');
        return;
    }
    
    // Check if event is still available
    const inscriptions = dataManager.getInscriptionsForEvent(eventId);
    if (inscriptions.length >= eventObj.maxParticipants) {
        showNotification('Sorry, this event is now full', 'error');
        return;
    }
    
    // Check if email is already registered
    const existingInscription = inscriptions.find(inscription => 
        inscription.email.toLowerCase() === formData.get('email').toLowerCase()
    );
    
    if (existingInscription) {
        showNotification('This email is already registered for this event', 'error');
        return;
    }
    
    // Create inscription
    const inscriptionData = {
        eventId: eventId,
        name: formData.get('name'),
        email: formData.get('email')
    };
    
    const inscription = dataManager.createInscription(inscriptionData);
    
    // Show success state
    showSuccessState(eventObj, inscription);
}

function showSuccessState(event, inscription) {
    const successMessage = `You have successfully registered for "${event.title}"!`;
    document.getElementById('successMessage').textContent = successMessage;
    
    // Store inscription ID for confirmation page
    document.getElementById('successState').dataset.inscriptionId = inscription.id;
    
    document.getElementById('eventDetails').style.display = 'none';
    document.getElementById('successState').style.display = 'block';
}

function goToConfirmation() {
    const inscriptionId = document.getElementById('successState').dataset.inscriptionId;
    if (inscriptionId) {
        window.location.href = `confirmation.html?id=${inscriptionId}`;
    }
}

// Confirmation Page Functions
function loadConfirmationFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const inscriptionId = urlParams.get('id');
    
    if (!inscriptionId) {
        showConfirmationNotFound();
        return;
    }
    
    const inscription = dataManager.getInscription(inscriptionId);
    if (!inscription) {
        showConfirmationNotFound();
        return;
    }
    
    const event = dataManager.getEvent(inscription.eventId);
    if (!event) {
        showConfirmationNotFound();
        return;
    }
    
    displayConfirmationDetails(inscription, event);
}

function showConfirmationNotFound() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('notFoundState').style.display = 'block';
}

function displayConfirmationDetails(inscription, event) {
    // Update confirmation details
    document.getElementById('participantName').textContent = inscription.name;
    document.getElementById('participantEmail').textContent = inscription.email;
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventType').textContent = event.type;
    document.getElementById('eventDate').textContent = formatDate(event.date);
    document.getElementById('registrationId').textContent = inscription.id;
    
    // Show confirmation details
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('confirmationDetails').style.display = 'block';
}

function printConfirmation() {
    window.print();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification-icon {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize page-specific functionality
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'manager.html') {
        // Manager page initialization
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', handleEventFormSubmit);
        }
        
        // Set default date to tomorrow
        const dateInput = document.getElementById('eventDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().slice(0, 16);
        }
        
        // Initialize events list
        updateEventsList();
        
        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            const eventModal = document.getElementById('eventModal');
            const inscriptionsModal = document.getElementById('inscriptionsModal');
            
            if (event.target === eventModal) {
                closeModal();
            }
            if (event.target === inscriptionsModal) {
                closeInscriptionsModal();
            }
        });
        
    } else if (currentPage === 'inscription.html') {
        // Inscription page initialization
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.addEventListener('submit', handleRegistrationForm);
        }
        
        // Load event from URL
        loadEventFromUrl();
        
    } else if (currentPage === 'confirmation.html') {
        // Confirmation page initialization
        loadConfirmationFromUrl();
    }
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Global functions for HTML onclick handlers
window.joinFromLink = joinFromLink;
window.toggleEventType = toggleEventType;
window.switchTab = switchTab;
window.showEventModal = showEventModal;
window.closeModal = closeModal;
window.copyEventLink = copyEventLink;
window.copyEventLinkFromModal = copyEventLinkFromModal;
window.copyUrlFromInput = copyUrlFromInput;
window.viewInscriptions = viewInscriptions;
window.viewInscriptionsFromModal = viewInscriptionsFromModal;
window.closeInscriptionsModal = closeInscriptionsModal;
window.deleteEvent = deleteEvent;
window.filterCommunities = filterCommunities;
window.toggleParticipants = toggleParticipants;
window.exportEventData = exportEventData;
window.exportCommunitiesData = exportCommunitiesData;
window.goToConfirmation = goToConfirmation;
window.printConfirmation = printConfirmation;
