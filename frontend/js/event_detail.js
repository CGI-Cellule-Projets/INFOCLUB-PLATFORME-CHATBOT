/**
 * InfoClub Event Detail Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId) {
        window.location.href = 'events.html';
        return;
    }

    const loadingDiv = document.getElementById('detail-loading');
    const errorDiv = document.getElementById('detail-error');
    const contentDiv = document.getElementById('detail-content');

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

    const fetchEventDetail = async () => {
        try {
            const [event, user] = await Promise.all([
                window.api.request(`/events/${eventId}`),
                window.api.getUser()
            ]);

            const isParticipating = user ? user.attendances.some(a => a.event_id === event.id) : false;

            renderDetail(event, isParticipating);
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
        } catch (err) {
            console.error(err);
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    };

    const renderDetail = (event, isParticipating) => {
        document.getElementById('d-title').textContent = event.title;
        document.getElementById('d-tag').textContent = event.event_type || 'Événement';
        document.getElementById('d-header-info').innerHTML = `<i class="fas fa-map-marker-alt" style="color: var(--accent);"></i> ${event.location || 'En ligne / À définir'}`;
        document.getElementById('d-date').textContent = formatDate(event.starts_at);
        document.getElementById('d-seats').textContent = event.max_attendees ? `${event.max_attendees} places au total` : 'Places illimitées';
        document.getElementById('d-desc').textContent = event.description || 'Pas de description supplémentaire pour cet événement.';

        const banner = document.getElementById('d-banner');
        if (event.image_url) {
            banner.style.backgroundImage = `url('${event.image_url}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center';
            banner.innerHTML = ''; // Remove the icon
        }

        const rsvpBtn = document.getElementById('rsvp-btn');
        if (rsvpBtn) {
            if (isParticipating) {
                const container = document.getElementById('d-action-container');
                container.innerHTML = `
                    <div style="color: #10b981; font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0; justify-content:center;">
                         Vous participez à cet événement
                    </div>
                `;
                return;
            }

            if (!window.api.isAuthenticated()) {
                const container = document.getElementById('d-action-container');
                container.innerHTML = `
                    <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: var(--radius); border: 1px dashed var(--border);">
                        <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 1rem;">Connectez-vous pour postuler à cet événement.</p>
                        <a href="login.html?redirect=event_detail.html?id=${event.id}" class="btn btn-primary" style="width: auto;">Se Connecter</a>
                    </div>
                `;
                return;
            }

            rsvpBtn.addEventListener('click', async () => {
                if (!window.api.isAuthenticated()) {
                    window.location.href = `login.html?redirect=event_detail.html?id=${event.id}`;
                    return;
                }

                rsvpBtn.disabled = true;
                rsvpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';

                try {
                    await window.api.request(`/events/${eventId}/attend`, {
                        method: 'POST',
                        body: JSON.stringify({ event_id: parseInt(eventId), status: 'going' })
                    });
                    rsvpBtn.innerHTML = '<i class="fas fa-check"></i> Vous êtes inscrit !';
                    rsvpBtn.style.background = '#10b981';
                } catch (err) {
                    alert(err.message);
                    rsvpBtn.disabled = false;
                    rsvpBtn.innerHTML = 'S\'inscrire maintenant';
                }
            });
        }
    };

    fetchEventDetail();
});
