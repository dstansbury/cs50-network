// ----------------------------------------------
// EVENT LISTENERS AND PAGE-SPECIFIC FUNCTIONS
// ----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {

    // when page loads, if the new-post-form is there, add a listener for it
    if (document.querySelector("#new-post-form")) {
        document.querySelector("#new-post-form").addEventListener("submit", function(event) {    
            // Your form submission logic goes here
            event.preventDefault();  // Prevent the default form submission behavior
            // After posting, you may want to reload the posts
            load_all_posts();
            show_all_posts();
        });
    }

    // If the index page, load all posts
    if (document.querySelector("#index-container")) {
        load_all_posts();
    }

    // If the profile page, show the user's profile and load their posts
    if (document.querySelector("#profile-container")) {
        load_user_page(userID);
    }
});


// ----------------------------------------------
// FETCH FROM SERVER FUNCTIONS
// ----------------------------------------------

// gets all the posts from the DB
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
}

// gets a particular user's profile information from the DB
function fetchUserProfileInfo(userID) {
    return fetch(`/profile/${userID}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => response.json())
    .then(userProfileData => {
        console.log('Fetched profile data for username:', userProfileData.userName);
        return userProfileData;
    })
    .catch(error => {
        console.error('Error fetching profile information:', error);
        throw error;  // Re-throw the error for proper error handling
    });
}


// ----------------------------------------------
// POPULATE THE DOM FUNCTIONS
// ----------------------------------------------

// adds posts to the DOM
function add_posts(posts) {
    const postsContainer = document.getElementById('page-posts');
    postsContainer.innerHTML = '';  // Clear existing content before appending new posts

    // Sort the posts by timestamp in descending order (newest first)
    posts.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
    });

    posts.forEach(post => {
        const singlePostContainer = document.createElement('div');
        singlePostContainer.className = 'singlePostContainer';
        
        const postDiv = document.createElement('div');
        postDiv.className = 'postDiv';
        postDiv.innerHTML = `
            <div id="post-poster">
                <a class="btn btn-link" href="profile/${post.posterID}">
                    ${post.poster}
                </a>
            </div>
            <div id="post-body">${post.body}</div>
            <div id="post-timestamp">${post.timestamp}</div>
            <div id="post-likes" style="color: #d9534f">Num Likes</div>`;
        
        // Add a container for each post
        postsContainer.appendChild(singlePostContainer);

        // add the post inside the Post Container that are passed in to the DOM
        singlePostContainer.appendChild(postDiv);
    });
}

// ----------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------

// Loads all posts in the DB then adds them to the DOM.
// This function is run on index page load.
function load_all_posts() {
    // Get all posts then add them to the DOM
    fetchAllPostsData()
        .then(posts => {
            add_posts(posts);
        });
}

// This function is run on profile page load.
function load_user_page(userID) {
    // Get the user's profile information
    fetchUserProfileInfo(userID)
    .then(userProfileData => {    
        
        // Add the user's profile information
        const profileInformation = document.getElementById('user-profile-information');
        profileInformation.innerHTML = `
            <h3>${userProfileData.userName}</h3>
            <div class="postDiv">
                <div id="profile-followers"><strong>Followers: </strong>${userProfileData.numFollowers}</div>
                <div id="profile-following"><strong>Following: </strong>${userProfileData.numFollows}</div>
            </div>
            <button type="submit" class="btn btn-primary" id="follow-user-${userID}" formmethod="post">Follow ${userProfileData.userName}</button>`;
            // Add the user's posts to the DOM
        add_posts(userProfileData.userPosts);
    });
}
