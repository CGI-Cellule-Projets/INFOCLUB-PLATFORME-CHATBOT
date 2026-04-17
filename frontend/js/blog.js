/**
 * InfoClub Blog Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const loadingDiv = document.getElementById('posts-loading');
    const emptyDiv = document.getElementById('posts-empty');

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    const fetchPosts = async () => {
        try {
            // Note: backend endpoint is /blogs/
            const posts = await window.api.request('/blogs/');
            loadingDiv.style.display = 'none';

            if (posts && posts.length > 0) {
                renderPosts(posts);
                postsContainer.style.display = 'grid';
            } else {
                emptyDiv.style.display = 'block';
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            loadingDiv.innerHTML = `<p style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> ${err.message}</p>`;
        }
    };

    const renderPosts = (posts) => {
        const isAuth = window.api.isAuthenticated();
        postsContainer.innerHTML = posts.map(post => `
            <article class="post-card" onclick="if(!event.target.closest('button') && !event.target.closest('a')) window.location.href='blog_detail.html?id=${post.id}'" style="cursor: pointer;">
                <div class="post-img" style="background-image: url('${post.image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80'}');"></div>
                <div class="post-body">
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.created_at)}</span>
                        <span><i class="fas fa-eye"></i> ${post.views_count} vues</span>
                    </div>
                    <p style="color: var(--muted); font-size: 0.95rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 4.5rem;">
                        ${post.content}
                    </p>
                </div>
                <div class="post-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                   ${isAuth ? `
                       <button class="like-btn" data-id="${post.id}" style="background: none; border: none; color: var(--muted); cursor: pointer; transition: color 0.3s ease;">
                            <i class="fas fa-heart"></i> <span class="like-count">${post.likes_count}</span>
                       </button>
                   ` : `
                       <a href="login.html" class="login-to-like" style="font-size: 0.75rem; color: var(--muted); text-decoration: none;">
                            <i class="fas fa-lock"></i> Connectez-vous
                       </a>
                   `}
                   <a href="blog_detail.html?id=${post.id}" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; width: auto; text-decoration: none;">
                     Lire la suite <i class="fas fa-chevron-right" style="margin-left: 0.5rem;"></i>
                   </a>
                </div>
            </article>
        `).join('');

        // Attach Like events
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = e.target.closest('.like-btn').dataset.id;
                if (!window.api.isAuthenticated()) {
                    window.location.href = 'login.html';
                    return;
                }

                try {
                    const data = await window.api.request(`/blogs/${postId}/like`, {
                        method: 'POST'
                    });
                    const countSpan = btn.querySelector('.like-count');
                    countSpan.textContent = data.likes_count;
                    btn.classList.add('active');
                } catch (err) {
                    console.error('Like error:', err);
                }
            });
        });
    };

    fetchPosts();
});
