document.addEventListener('DOMContentLoaded', function() {
    document.querySelector("#new-post-form").addEventListener("submit", function(event) {
        // Your form submission logic goes here
        event.preventDefault();  // Prevent the default form submission behavior

        // After posting, you may want to reload the posts
        load_posts();
    });    

    // Load posts initially
    load_posts();
});

// gets all the posts from the DB using an AJAX request
function fetchPostsData() {
    return fetch(`/`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(response => response.json())
        .then(posts => {
            console.log('Fetched posts data:', posts);
            return posts;  // Return the posts data
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            throw error;  // Re-throw the error for proper error handling
        });
};

function add_posts(posts) {
    const postsContainer = document.getElementById('existing-posts');
    postsContainer.innerHTML = '';  // Clear existing content before appending new posts

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'postDiv';
        postDiv.innerHTML = `
            <div id="post-poster">${post.poster}</div>
            <div id="post-body">${post.body}</div>
            <div id="post-timestamp">${post.timestamp}</div>`;

        postsContainer.appendChild(postDiv);
    });
};

function load_posts() {
    fetchPostsData()
        .then(posts => {
            add_posts(posts);
        });
};
