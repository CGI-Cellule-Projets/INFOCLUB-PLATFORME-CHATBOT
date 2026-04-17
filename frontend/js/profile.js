/**
 * InfoClub Profile Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const profileForm = document.getElementById('profile-form');
    const msgElement = document.getElementById('profile-msg');
    let currentUser = null;

    const loadProfile = async () => {
        try {
            currentUser = await window.api.getCurrentUser();

            // Fill static info
            document.getElementById('profile-name').textContent = currentUser.full_name;
            document.getElementById('profile-initials').textContent = currentUser.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();

            document.getElementById('info-email').textContent = currentUser.email;
            document.getElementById('info-role').textContent = currentUser.role;
            const joinDate = new Date(currentUser.joined_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            document.getElementById('info-student-id').textContent = `${joinDate}`;

            const badge = document.getElementById('profile-status-badge');
            badge.className = `badge-status status-${currentUser.status}`;
            badge.textContent = currentUser.status === 'active' ? 'Membre Actif' : (currentUser.status === 'pending' ? 'En attente' : 'Inactif');

            // Fill form
            document.getElementById('p-name').value = currentUser.full_name;
            document.getElementById('p-phone').value = currentUser.phone || '';
            document.getElementById('p-major').value = currentUser.major || '';
            document.getElementById('p-year').value = currentUser.year_of_study || '1';

            // Load RSVPs (Note: This assumes the backend returns attendances with event details)
            // If the backend doesn't support a direct 'my-events' endpoint, we might need to filter manually
            // or just show a placeholder if the relationship isn't exposed yet.
            renderAttendances(currentUser.attendances || []);
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    };

    const renderAttendances = (attendances) => {
        const container = document.getElementById('my-events');
        if (!attendances || attendances.length === 0) {
            container.innerHTML = '<p>Vous n\'êtes inscrit à aucun événement pour le moment.</p>';
            return;
        }

        container.innerHTML = `<ul style="list-style: none; padding: 0;">
            ${attendances.map(a => `
                <li style="margin-bottom: 0.75rem;">
                    <a href="event_detail.html?id=${a.event_id}" style="text-decoration: none; display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: rgba(255,255,255,0.02); transition: all 0.3s ease; border-left: 3px solid var(--accent);" 
                       onmouseover="this.style.background='rgba(99, 102, 241, 0.05)'; this.style.borderColor='var(--accent)';" 
                       onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.borderColor='var(--border)';">
                        <div>
                            <div style="font-weight: 700; color: var(--text);">${a.event ? a.event.title : `Événement CGI`}</div>
                            <div style="font-size: 0.8rem; color: var(--muted); margin-top: 0.25rem;">
                                <i class="fas fa-calendar-day"></i> ${a.event ? new Date(a.event.starts_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                                <span style="margin-left: 1rem;"><i class="fas fa-map-marker-alt"></i> ${a.event ? a.event.location : 'À définir'}</span>
                            </div>
                        </div>
                        <div style="color: var(--accent); font-size: 0.9rem;">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </a>
                </li>
            `).join('')}
        </ul>`;
    };

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgElement.textContent = 'Mise à jour...';
        msgElement.style.color = 'var(--text)';

        const data = {
            full_name: document.getElementById('p-name').value,
            phone: document.getElementById('p-phone').value,
            major: document.getElementById('p-major').value,
            year_of_study: parseInt(document.getElementById('p-year').value)
        };

        try {
            await window.api.request(`/members/${currentUser.id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            msgElement.textContent = 'Profil mis à jour avec succès !';
            msgElement.style.color = '#10b981';
            loadProfile(); // Refresh
        } catch (err) {
            msgElement.textContent = err.message;
            msgElement.style.color = '#ef4444';
        }
    });

    loadProfile();
});
