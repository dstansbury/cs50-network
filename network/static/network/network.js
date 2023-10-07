document.addEventListener('DOMContentLoaded', function() {
    document.querySelector("#new-post-form").addEventListener("submit", function(event) {
        // Your form submission logic goes here
        event.preventDefault();  // Prevent the default form submission behavior

        // After posting, you may want to reload the posts
        load_all_posts();
        show_all_posts();
    });    

    // Load all posts initially then show all posts
    load_all_posts();
    show_all_posts();
});

// gets all the posts from the DB using an AJAX request
function fetchAllPostsData() {
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

// gets a particular user's profile information from the DB using an AJAX request
function fetchUserProfileData() {
    // to fill
};

// adds posts to the DOM
function add_posts(posts) {
    const postsContainer = document.getElementById('all-existing-posts');
    postsContainer.innerHTML = '';  // Clear existing content before appending new posts

    posts.forEach(post => {
        const singlePostContainer = document.createElement('div');
        singlePostContainer.className = 'singlePostContainer';
        
        const postDiv = document.createElement('div');
        postDiv.className = 'postDiv';
        console.log('Poster:', post.poster);
        postDiv.innerHTML = `
            <div id="post-poster">
                <button type="button" class="btn btn-link" onclick="show_user_page('${post.poster}')">
                    ${post.poster}
                </button>
            </div>
            <div id="post-body">${post.body}</div>
            <div id="post-timestamp">${post.timestamp}</div>
            <div id="post-likes" style="color: #d9534f">Num Likes</div>`;
        
        // Create a like button
        const likeButton = document.createElement('input');
        likeButton.className = 'btn btn-outline-danger';
        likeButton.type = 'submit';
        likeButton.id = `like-submit-${post.id}`;
        likeButton.formmethod = 'post';
        likeButton.value = 'Like';

        // Create an unlike button
        const unlikeButton = document.createElement('input');
        unlikeButton.className = 'btn btn-outline-secondary';
        unlikeButton.type = 'submit';
        unlikeButton.id = `unlike-submit-${post.id}`;
        unlikeButton.formmethod = 'post';
        unlikeButton.value = 'Unlike';

        // Add a container for each post
        postsContainer.appendChild(singlePostContainer);

        // add the post inside the Post Container that are passed in to the DOM
        singlePostContainer.appendChild(postDiv);
     
        // insert the if the user has not liked the post logic here
        singlePostContainer.appendChild(likeButton);

        // insert the else the user has liked the post logic here
        singlePostContainer.appendChild(unlikeButton);
    });
};

// Loads all posts in the DB then adds them to the DOM.
// This function is run on page load.
function load_all_posts() {
    // Get all posts then add them to the DOM
    fetchAllPostsData()
        .then(posts => {
            add_posts(posts);
        });
};

// Show all the posts that have been loaded
function show_all_posts() {
    document.querySelector('#all-posts-title').style.display = 'block';
    document.querySelector('#user-profile-page-title').style.display = 'none';
    document.querySelector('#new-post').style.display = 'block';
    document.querySelector('#all-existing-posts').style.display = 'block';
    document.querySelector('#user-profile-information').style.display = 'none';
    document.querySelector('#user-profile-posts').style.display = 'none';
     
};


// Show a user's profile information
function show_user_page(username) {
    // Show particular user's profile information and posts, and hide other views
    document.querySelector('#all-posts-title').style.display = 'none';
    document.querySelector('#user-profile-page-title').style.display = 'block';
    document.querySelector('#new-post').style.display = 'none';
    document.querySelector('#all-existing-posts').style.display = 'block';
    document.querySelector('#user-profile-information').style.display = 'block';

    // Add the user's profile name to the page title
    const profilePageTitle = document.getElementById('user-profile-page-title');
    profilePageTitle.innerHTML = `<h1>${username}\'s Profile Page</h1>`;

    // Get user's profile information then add them to the DOM
    //fetchUserProfileData()
      //  .then(user => {
        //    add_user_profile(user);
       // });
    
    // Show posts by the user and hide all others:
    // First get all post elements
    const allPosts = document.querySelectorAll('.singlePostContainer');  

    allPosts.forEach(post => {
        const poster_username = post.poster;
        
        allPosts.forEach(postContainer => {
            const postDiv = postContainer.querySelector('.postDiv');
            const postUsername = postDiv.querySelector('button').innerText;
    
            // Hide posts by users other than the profile we want to show
            if (username !== postUsername) {
                postContainer.style.display = 'none';  
            }
        });
    });
};




