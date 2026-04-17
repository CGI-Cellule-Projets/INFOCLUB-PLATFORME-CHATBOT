/**
 * InfoClub Events Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const eventsContainer = document.getElementById('events-container');
    const loadingDiv = document.getElementById('events-loading');
    const emptyDiv = document.getElementById('events-empty');

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const fetchEvents = async () => {
        try {
            // Fetch both events and current user (for participation status)
            const [events, user] = await Promise.all([
                window.api.request('/events/'),
                window.api.getUser()
            ]);

            const userEventIds = user ? user.attendances.map(a => a.event_id) : [];
            
            loadingDiv.style.display = 'none';

            if (events && events.length > 0) {
                renderEvents(events, userEventIds);
                eventsContainer.style.display = 'grid';
            } else {
                emptyDiv.style.display = 'block';
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            loadingDiv.innerHTML = `<p style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> ${err.message}</p>`;
        }
    };

    const renderEvents = (events, userEventIds) => {
        eventsContainer.innerHTML = events.map(event => {
            const isParticipating = userEventIds.includes(event.id);
            
            return `
            <div class="event-card" onclick="if(!event.target.closest('button')) window.location.href='event_detail.html?id=${event.id}'" style="cursor: pointer;">
                ${event.image_url ? `
                <div style="height: 180px; background-image: url('${event.image_url}'); background-size: cover; background-position: center; border-bottom: 1px solid var(--border);"></div>
                ` : ''}
                <div class="event-body">
                    <span class="event-tag">${event.event_type || 'Général'}</span>
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-info">
                        <i class="fas fa-calendar-day"></i>
                        <span>${formatDate(event.starts_at)}</span>
                    </div>
                    <div class="event-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location || 'En ligne / À définir'}</span>
                    </div>
                    <p style="color: var(--muted); font-size: 0.9rem; margin-top: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.8rem;">
                        ${event.description || 'Apprends, Crée et Innove avec nous lors de cette session passionnante.'}
                    </p>
                    <a href="event_detail.html?id=${event.id}" style="color: var(--accent); font-size: 0.8rem; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 0.5rem;">
                        En savoir plus <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                <div class="event-footer">
                    <span style="font-size: 0.8rem; color: var(--muted);">
                        <i class="fas fa-user-friends" style="color: var(--accent);"></i> 
                        ${event.max_attendees ? `${event.max_attendees} places` : 'Illimité'}
                    </span>
                    ${isParticipating ? `
                        <div style="color: #10b981; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-check-circle"></i> Participé
                        </div>
                    ` : `
                        ${window.api.isAuthenticated() ? `
                            <button class="btn btn-primary rsvp-btn" data-id="${event.id}" 
                                style="width: auto; padding: 0.5rem 1rem; font-size: 0.875rem;">
                                RSVP <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <a href="login.html?redirect=events.html" class="btn btn-outline" 
                                style="width: auto; padding: 0.5rem 1rem; font-size: 0.875rem;">
                                Se connecter
                            </a>
                        `}
                    `}
                </div>
            </div>
            `;
        }).join('');

        // Attach RSVP events
        document.querySelectorAll('.rsvp-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const eventId = e.target.closest('.rsvp-btn').dataset.id;
                if (!window.api.isAuthenticated()) {
                    window.location.href = 'login.html';
                    return;
                }

                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

                try {
                    await window.api.request(`/events/${eventId}/attend`, {
                        method: 'POST',
                        body: JSON.stringify({ event_id: parseInt(eventId), status: 'going' })
                    });
                    btn.innerHTML = '<i class="fas fa-check"></i> Inscrit !';
                    btn.style.background = '#10b981';
                } catch (err) {
                    alert(err.message);
                    btn.disabled = false;
                    btn.innerHTML = 'Participer <i class="fas fa-check"></i>';
                }
            });
        });
    };

    fetchEvents();
});
