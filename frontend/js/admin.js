/**
 * InfoClub Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- AUTH CHECK ---
    const isAuthorized = await window.api.isAdmin();
    if (!isAuthorized) {
        window.location.href = 'index.html';
        return;
    }

    const user = await window.api.getUser();
    const isHead = user && user.role === 'head';

    // --- TAB SWITCHING ---
    const tabs = document.querySelectorAll('.admin-nav-item');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            panes.forEach(pane => {
                pane.style.display = pane.id === `tab-${tabId}` ? 'block' : 'none';
            });

            // Load data for the tab
            if (tabId === 'members') fetchMembers();
            if (tabId === 'events') fetchEvents();
            if (tabId === 'posts') fetchPosts();
        });
    });

    // --- MODAL UTILS ---
    window.openModal = (id) => document.getElementById(id).classList.add('active');
    window.closeModal = (id) => document.getElementById(id).classList.remove('active');

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // --- MEMBERS MANAGEMENT ---
    const fetchMembers = async () => {
        const tbody = document.getElementById('members-tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Chargement...</td></tr>';

        try {
            const members = await window.api.request('/members/');
            renderMembers(members);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="color: #ef4444; text-align: center;">${err.message}</td></tr>`;
        }
    };

    const renderMembers = (members) => {
        const tbody = document.getElementById('members-tbody');
        document.getElementById('member-stats').textContent = `${members.length} membres inscrits`;

        tbody.innerHTML = members.map(m => `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--text);">${m.full_name}</div>
                    <div style="font-size: 0.8rem; color: var(--muted);">${m.email}</div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;">${m.major || 'Filière N/A'} • ${m.year_of_study ? m.year_of_study + 'A' : 'Année N/A'}</div>
                    <div style="font-size: 0.75rem; color: var(--muted);">
                        <i class="fas fa-phone" style="font-size: 0.7rem;"></i> ${m.phone || 'Non renseigné'}
                    </div>
                </td>
                <td><span class="badge badge-${m.status}">${m.status}</span></td>
                <td><span style="font-size: 0.9rem; font-weight: 600;">${m.role}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        ${m.status === 'pending' ? `
                            <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #10b981;" onclick="memberAction(${m.id}, '/approve')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #ef4444;" onclick="memberAction(${m.id}, '/reject')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${isHead && m.role !== 'head' ? `
                            <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Toggle Mod Role" onclick="memberAction(${m.id}, '/assign-mod')">
                                <i class="fas fa-user-shield"></i>
                            </button>
                            <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #ef4444;" onclick="deleteMember(${m.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    };

    window.memberAction = async (id, endpoint) => {
        try {
            await window.api.request(`/members/${id}${endpoint}`, { method: 'POST' });
            fetchMembers();
        } catch (err) { alert(err.message); }
    };

    window.deleteMember = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer ce membre ?')) return;
        try {
            await window.api.request(`/members/${id}`, { method: 'DELETE' });
            fetchMembers();
        } catch (err) { alert(err.message); }
    };

    // --- EVENTS MANAGEMENT ---
    const fetchEvents = async () => {
        const tbody = document.getElementById('events-tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i></td></tr>';

        try {
            const events = await window.api.request('/events/');
            renderEvents(events);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" style="color: #ef4444; text-align: center;">${err.message}</td></tr>`;
        }
    };

    const renderEvents = (events) => {
        const tbody = document.getElementById('events-tbody');
        tbody.innerHTML = events.map(e => `
            <tr>
                <td style="font-weight: 600;">${e.title}</td>
                <td style="font-size: 0.85rem;">${new Date(e.starts_at).toLocaleDateString('fr-FR')}</td>
                <td style="font-size: 0.85rem;">${e.location || 'N/A'}</td>
                <td><span class="event-tag" style="margin:0; font-size: 0.65rem;">${e.event_type}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Voir Inscrits" onclick="viewAttendees(${e.id}, '${e.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-users-viewfinder"></i>
                        </button>
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Modifier" onclick="openEditEventModal(${JSON.stringify(e).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #ef4444;" title="Supprimer" onclick="deleteEvent(${e.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    window.deleteEvent = async (id) => {
        if (!confirm('Supprimer cet événement ?')) return;
        try {
            await window.api.request(`/events/${id}`, { method: 'DELETE' });
            fetchEvents();
        } catch (err) { alert(err.message); }
    };

    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('ev-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

        try {
            // Handle image upload first
            const fileInput = document.getElementById('ev-file');
            let imageUrl = document.getElementById('ev-image').value;

            if (fileInput.files.length > 0) {
                imageUrl = await uploadImage(fileInput.files[0]);
            }

            const data = {
                title: document.getElementById('ev-title').value,
                starts_at: document.getElementById('ev-start').value,
                location: document.getElementById('ev-location').value,
                event_type: document.getElementById('ev-type').value,
                max_attendees: document.getElementById('ev-max').value ? parseInt(document.getElementById('ev-max').value) : null,
                image_url: imageUrl,
                description: document.getElementById('ev-desc').value
            };

            const eventId = document.getElementById('ev-id').value;
            const method = eventId ? 'PATCH' : 'POST';
            const endpoint = eventId ? `/events/${eventId}` : '/events/';

            await window.api.request(endpoint, { method, body: JSON.stringify(data) });
            closeModal('event-modal');
            fetchEvents();
        } catch (err) {
            alert(err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = document.getElementById('ev-id').value ? "Enregistrer les modifications" : "Enregistrer l'événement";
        }
    });

    // --- POSTS MANAGEMENT ---
    const fetchPosts = async () => {
        const tbody = document.getElementById('posts-tbody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i></td></tr>';

        try {
            // "all" endpoint includes drafts
            const posts = await window.api.request('/blogs/all');
            renderPosts(posts);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" style="color: #ef4444; text-align: center;">${err.message}</td></tr>`;
        }
    };

    const renderPosts = (posts) => {
        const tbody = document.getElementById('posts-tbody');
        tbody.innerHTML = posts.map(p => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${p.title}</div>
                    <div style="font-size: 0.75rem; color: var(--muted);">${new Date(p.created_at).toLocaleDateString()}</div>
                </td>
                <td>
                    <span class="badge" style="background: ${p.is_published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${p.is_published ? '#10b981' : '#f59e0b'};">
                        ${p.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                </td>
                <td style="font-size: 0.85rem; color: var(--muted);">
                    <i class="fas fa-eye"></i> ${p.views_count} | <i class="fas fa-heart"></i> ${p.likes_count}
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="openEditPostModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: #ef4444;" onclick="deletePost(${p.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    window.deletePost = async (id) => {
        if (!confirm('Supprimer cet article ?')) return;
        try {
            await window.api.request(`/blogs/${id}`, { method: 'DELETE' });
            fetchPosts();
        } catch (err) { alert(err.message); }
    };

    document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('p-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

        try {
            // Handle image upload first
            const fileInput = document.getElementById('p-file');
            let imageUrl = document.getElementById('p-image').value;

            if (fileInput.files.length > 0) {
                imageUrl = await uploadImage(fileInput.files[0]);
            }

            const data = {
                title: document.getElementById('p-title').value,
                image_url: imageUrl,
                content: document.getElementById('p-content').value,
                is_published: document.getElementById('p-published').checked
            };

            const postId = document.getElementById('p-id').value;
            const method = postId ? 'PATCH' : 'POST';
            const endpoint = postId ? `/blogs/${postId}` : '/blogs/';

            await window.api.request(endpoint, { method, body: JSON.stringify(data) });
            closeModal('post-modal');
            fetchPosts();
        } catch (err) {
            alert(err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = document.getElementById('p-id').value ? "Enregistrer les modifications" : "Publier l'article";
        }
    });

    // --- MODAL POPULATION ---
    window.openEditEventModal = (event) => {
        document.getElementById('event-modal-title').textContent = "Modifier l'événement";
        document.getElementById('ev-submit').textContent = "Enregistrer les modifications";
        document.getElementById('ev-id').value = event.id;
        document.getElementById('ev-title').value = event.title;
        document.getElementById('ev-start').value = new Date(event.starts_at).toISOString().slice(0, 16);
        document.getElementById('ev-location').value = event.location || '';
        document.getElementById('ev-type').value = event.event_type || 'workshop';
        document.getElementById('ev-max').value = event.max_attendees || '';
        document.getElementById('ev-image').value = event.image_url || '';
        document.getElementById('ev-desc').value = event.description || '';
        window.openModal('event-modal');
    };

    window.openEditPostModal = (post) => {
        document.getElementById('post-modal-title').textContent = "Modifier l'article";
        document.getElementById('p-submit').textContent = "Enregistrer les modifications";
        document.getElementById('p-id').value = post.id;
        document.getElementById('p-title').value = post.title;
        document.getElementById('p-image').value = post.image_url || '';
        document.getElementById('p-content').value = post.content || '';
        document.getElementById('p-published').checked = post.is_published;
        window.openModal('post-modal');
    };

    // Reset modals for Create
    const originalOpenModal = window.openModal;
    window.openModal = (id) => {
        if (id === 'event-modal' && !document.getElementById('ev-id').value) {
            document.getElementById('event-modal-title').textContent = "Créer un événement";
            document.getElementById('ev-submit').textContent = "Enregistrer l'événement";
            document.getElementById('event-form').reset();
            document.getElementById('ev-id').value = '';
        }
        if (id === 'post-modal' && !document.getElementById('p-id').value) {
            document.getElementById('post-modal-title').textContent = "Publier un article";
            document.getElementById('p-submit').textContent = "Publier l'article";
            document.getElementById('post-form').reset();
            document.getElementById('p-id').value = '';
        }
        originalOpenModal(id);
    };

    // --- ATTENDEES VIEW ---
    window.viewAttendees = async (eventId, eventTitle) => {
        document.getElementById('attendees-title').textContent = `${eventTitle}`;
        const container = document.getElementById('attendees-list');
        const csvBtn = document.getElementById('download-csv-btn');

        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>';
        csvBtn.style.display = 'none';
        window.openModal('attendees-modal');

        try {
            const attendees = await window.api.request(`/events/${eventId}/attendees`);
            if (attendees.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--muted);">Aucun participant inscrit pour le moment.</p>';
            } else {
                csvBtn.style.display = 'block';
                csvBtn.onclick = () => exportToCSV(attendees, eventTitle);

                container.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="text-align: left; border-bottom: 1px solid var(--border);">
                                <th style="padding: 0.75rem;">Nom</th>
                                <th style="padding: 0.75rem;">Email</th>
                                <th style="padding: 0.75rem;">Inscrit le</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendees.map(a => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 0.75rem; font-weight: 600;">${a.member ? a.member.full_name : 'N/A'}</td>
                                    <td style="padding: 0.75rem; font-size: 0.85rem;">${a.member ? a.member.email : 'N/A'}</td>
                                    <td style="padding: 0.75rem; font-size: 0.75rem; color: var(--muted);">${new Date(a.registered_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        } catch (err) {
            container.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 2rem;">${err.message}</p>`;
        }
    };

    const exportToCSV = (attendees, title) => {
        const headers = ["Nom", "Email", "Date d'inscription"];
        const rows = attendees.map(a => [
            a.member ? a.member.full_name : "N/A",
            a.member ? a.member.email : "N/A",
            new Date(a.registered_at).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(r => r.join(";"))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `Inscriptions_${title.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- HELPER: UPLOAD IMAGE ---
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('infoclub_token');
        const response = await fetch('http://127.0.0.1:8000/media/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Erreur lors de l\'upload de l\'image');
        }

        const res = await response.json();
        return res.url;
    };

    // Initial load
    fetchMembers();
});
