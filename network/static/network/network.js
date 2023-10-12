// ----------------------------------------------
// EVENT LISTENERS AND PAGE-SPECIFIC FUNCTIONS
// ----------------------------------------------
document.addEventListener('DOMContentLoaded', function() {

    // If the index page, load all posts
    if (document.querySelector("#index-container")) {
        load_all_posts();
        if (window.location.search.includes("following=true")) {
            document.querySelector("#all-posts-title h1").innerHTML = "Following";
            document.querySelector("#new-post").style.display = "none";
        }
    }

    // If the profile page, show the user's profile and load their posts
    if (document.querySelector("#profile-container")) {
        load_user_page(userID);
    }
});

//----------------------------------------------
// CONSTANTS NEEDED ACROSS VARIOUS FUNCTIONS
//----------------------------------------------
const csrftoken = document.querySelector('[name=csrf-token]').content;

// ----------------------------------------------
// FETCH FROM SERVER FUNCTIONS
// ----------------------------------------------

// gets all the posts from the DB
function fetchAllPostsData() {
    // Check if the URL has the "following=true" parameter
    let url = "/";
    if (window.location.search.includes("following=true")) {
        url += "?following=true";
    }
    
    // fetch relevant posts from the DB based on the url
    return fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
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
    
    // Clear existing content before appending new posts
    postsContainer.innerHTML = '';  

    // Sort the posts by timestamp in descending order (newest first)
    posts.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
    });

    posts.forEach((post, index) => {
        const singlePostContainer = document.createElement('div');
        singlePostContainer.className = 'singlePostContainer';
        
        const postDiv = document.createElement('div');
        postDiv.className = 'postDiv';

        // If it's the first post, adjust the top margin
        if (index === 0) {
        postDiv.style.marginTop = "0px";
        }

        postDiv.innerHTML = `
            <div class="post-poster" id="post-poster-${post.id}">
                <a href="/profile/${post.posterID}">
                    ${post.poster}
                </a>
            </div>
            <div class="post-body" id="post-body-${post.id}">${post.body}</div>
            <div class="post-timestamp" id="post-timestamp-${post.id}">${post.timestamp}</div>
            <div class="post-likes" id="post-likes-${post.id}">❤️ ${post.likes_count}</div>`;

        // add the post inside the Post Container that are passed in to the DOM
        singlePostContainer.appendChild(postDiv);

        // 
        // LIKE / UNLIKE BUTTON LOGIC
        //
        
        if(post.user_liked) {
            const unlikeBtn = document.createElement('button');
            unlikeBtn.className = 'btn btn-outline-primary';
            unlikeBtn.id = `liketoggle-btn-${post.id}`;
            unlikeBtn.innerText = 'Unlike';
            unlikeBtn.onclick = () => unlikePost(post.id);

            // Add the like button to the singlePostContainer
            singlePostContainer.appendChild(unlikeBtn);
        } else {
            const likeBtn = document.createElement('button');
            likeBtn.className = 'btn btn-primary';
            likeBtn.innerText = 'Like';
            likeBtn.id = `liketoggle-btn-${post.id}`;
            likeBtn.onclick = () => likePost(post.id);
            
            // Add the unlike button to the singlePostContainer
            singlePostContainer.appendChild(likeBtn);
        }

        // Add a container for each post
        postsContainer.appendChild(singlePostContainer);
    });
}

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

// ----------------------------------------------
// LIKE / UNLIKE FUNCTIONS
// ----------------------------------------------
function likePost(postID) {
    fetch(`/like/${postID}`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
    })
    .then(response => response.json())
    .then(data => {
        // Update likes count on DOM and toggle button
        updateLikesOnDOM(postID, data.likes_count, true);
    })
    .catch(error => {
        console.error('Error liking post:', error);
    });
}

function unlikePost(postID) {
    const currentLikes = parseInt(document.querySelector(`#post-likes-${postID}`).textContent.trim().split(" ")[1]);
    if (currentLikes <= 0) {
        console.log("Cannot unlike a post with zero likes.");
        return;
    }
    fetch(`/unlike/${postID}`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
    })
    .then(response => response.json())
    .then(data => {
        // Update likes count on DOM and toggle button
        updateLikesOnDOM(postID, data.likes_count, false);
    })
    .catch(error => {
        console.error('Error unliking post:', error);
    });
}


function updateLikesOnDOM(postID, likesCount, liked) {
    document.querySelector(`#post-likes-${postID}`).textContent = `❤️ ${likesCount}`;
    
    const currentButton = document.querySelector(`#liketoggle-btn-${postID}`);
    let newButton;

    if (liked) {
        newButton = document.createElement('button');
        newButton.className = 'btn btn-outline-primary';
        newButton.innerText = 'Unlike';
        newButton.onclick = () => unlikePost(postID);
    } else {
        newButton = document.createElement('button');
        newButton.className = 'btn btn-primary';
        newButton.innerText = 'Like';
        newButton.onclick = () => likePost(postID);
    }

    newButton.id = `liketoggle-btn-${postID}`;
    
    currentButton.parentNode.replaceChild(newButton, currentButton);
}


