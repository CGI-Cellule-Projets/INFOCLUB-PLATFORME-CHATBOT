/**
 * InfoClub Blog Detail Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        window.location.href = 'blog.html';
        return;
    }

    const loadingDiv = document.getElementById('post-loading');
    const errorDiv = document.getElementById('post-error');
    const contentArea = document.getElementById('post-content-area');

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    const fetchPostDetail = async () => {
        try {
            const post = await window.api.request(`/blogs/${postId}`);
            renderPost(post);
            loadingDiv.style.display = 'none';
            contentArea.style.display = 'block';
        } catch (err) {
            console.error(err);
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    };

    const renderPost = (post) => {
        document.getElementById('post-title').textContent = post.title;
        document.getElementById('post-date').innerHTML = `<i class="fas fa-calendar-alt"></i> ${formatDate(post.created_at)}`;
        document.getElementById('post-views').innerHTML = `<i class="fas fa-eye"></i> ${post.views_count} vues`;
        document.getElementById('post-banner').style.backgroundImage = `url('${post.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80'}')`;
        
        // Simple line break to paragraph conversion for content
        const bodyContent = post.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
        document.getElementById('post-body').innerHTML = bodyContent;

        const likeIconTop = document.getElementById('post-like-icon-top');
        const feedbackYesBtn = document.getElementById('feedback-yes-btn');
        const likeCount = document.getElementById('post-like-count');
        const isAuth = window.api.isAuthenticated();
        likeCount.textContent = post.likes_count;

        if (!isAuth) {
            // Hide specific feedback buttons and replace with login prompt
            const feedbackSection = document.querySelector('.post-feedback');
            if (feedbackSection) {
                feedbackSection.innerHTML = `
                    <p style="color: var(--muted); font-size: 0.9rem;">
                        <a href="login.html?redirect=blog_detail.html?id=${postId}" style="color: var(--accent); text-decoration: none; font-weight: 600;">Connectez-vous</a> pour aimer cet article et participer à la discussion.
                    </p>
                `;
            }
            // Disable top like icon visual
            if (likeIconTop) {
                likeIconTop.style.cursor = 'default';
                likeIconTop.title = 'Connectez-vous pour aimer';
            }
        }

        const handleLike = async () => {
            if (!window.api.isAuthenticated()) {
                window.location.href = `login.html?redirect=blog_detail.html?id=${postId}`;
                return;
            }

            try {
                const data = await window.api.request(`/blogs/${postId}/like`, { method: 'POST' });
                likeCount.textContent = data.likes_count;
                
                if (data.action === 'liked') {
                    likeIconTop.style.color = 'var(--accent)';
                    likeIconTop.style.background = 'rgba(99, 102, 241, 0.1)';
                    if (feedbackYesBtn) feedbackYesBtn.textContent = 'Aimé !';
                } else {
                    likeIconTop.style.color = 'var(--muted)';
                    likeIconTop.style.background = 'rgba(255,255,255,0.05)';
                    if (feedbackYesBtn) feedbackYesBtn.textContent = 'Oui, tout à fait !';
                }
            } catch (err) {
                console.error('Like error:', err);
            }
        };

        if (likeIconTop) likeIconTop.addEventListener('click', handleLike);
        if (feedbackYesBtn) feedbackYesBtn.addEventListener('click', handleLike);
    };

    fetchPostDetail();
});
