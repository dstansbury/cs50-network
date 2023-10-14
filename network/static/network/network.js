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
// HELPER FUNCTION - TIME/DATE
// ----------------------------------------------
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    let formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    
    // Remove the comma that comes just after the year
    formattedDate = formattedDate.replace(/(\d{4}),/, '$1');
    return formattedDate;
}

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
        console.log('Fetched profile data for username:', userProfileData);
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
    
    // Get the active user from the posts array
    const activeUser = posts[posts.length - 1].activeUser;

    // Filter out posts in the returned array with the key "activeUser"
    posts = posts.filter(post => !post.hasOwnProperty('activeUser'));

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

        // Add the post's HTML to the postDiv
        postDiv.innerHTML = `
            <div class="post-poster" id="post-poster-${post.id}">
                <a href="/profile/${post.posterID}">
                    ${post.poster}
                </a>
            </div>
            <div class="post-body" id="post-body-${post.id}">${post.body}</div>
            <div class="post-timestamp" id="post-timestamp-${post.id}"></div>
            <div class="post-edit" id="post-edit-${post.id}"></div>
            <div class="post-likes" id="post-likes-${post.id}">❤️ ${post.likes_count}</div>`;

        // Check if the post has already been edited
        if (post.edited) {
            postDiv.querySelector(`#post-timestamp-${post.id}`).innerHTML = ` (Edited) ${formatDate(new Date(post.edited_timestamp))}`;
        }
        else {
            postDiv.querySelector(`#post-timestamp-${post.id}`).innerHTML = ` ${formatDate(new Date(post.timestamp))}`;
        };
        
        // add the post inside the Post Container that are passed in to the DOM
        singlePostContainer.appendChild(postDiv);

        //
        // Edit post logic
        //
        
        // Check if the post is from the active user
        if (post.poster === activeUser) {
            const editLink = document.createElement('a');
            editLink.href = `#`;
            editLink.id = `edit-btn-${post.id}`;
            editLink.textContent = 'Edit post';
            editLink.onclick = (event) => {
                event.preventDefault();
                openEditForm(post.id, post.body);
            };
            postDiv.querySelector(`#post-edit-${post.id}`).appendChild(editLink);
        }

        // 
        // Like / Unlike button logic
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

//
// PROFILE PAGE
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
            </div>`;
        
        // check if the user is on their own profile page
        // if so, do nothing
        if (userProfileData.activeUser === userProfileData.userName) {
        }
        
        // check if the user is already following the profile
        // if so, add an unfollow button
        else if(userProfileData.activeUserFollows) {
            const unfollowBtn = document.createElement('button');
            unfollowBtn.className = 'btn btn-outline-primary';
            unfollowBtn.id = `followtoggle-btn-${userID}`;
            unfollowBtn.innerText = `Unfollow ${userProfileData.userName}`;
            unfollowBtn.onclick = () => unfollowUser(userID, userProfileData.userName);

            // Add the unfollow button to the DOM
            profileInformation.appendChild(unfollowBtn);
        } 
        
        // if not, add a follow button
        else {
            const followBtn = document.createElement('button');
            followBtn.className = 'btn btn-primary';
            followBtn.innerText = `Follow ${userProfileData.userName}`;
            followBtn.id = `followtoggle-btn-${userID}`;
            followBtn.onclick = () => followUser(userID, userProfileData.userName);

            // Add the follow button to the DOM
            profileInformation.appendChild(followBtn);
        }

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

// ----------------------------------------------
// FOLLOW / UNFOLLOW FUNCTIONS
// ----------------------------------------------

function followUser(userID, username) {
    fetch(`/follow/${userID}`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
    })
    .then(response => response.json())
    .then(data => {
        // Update follow button to unfollow button
        updateFollowButton(userID, username, true, data.follower_count);
    })
    .catch(error => {
        console.error('Error liking post:', error);
    });
}

function unfollowUser(userID, username) {
    fetch(`/unfollow/${userID}`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
    })
    .then(response => response.json())
    .then(data => {
        // Update unfollow button to follow button
        updateFollowButton(userID, username, false, data.follower_count);
    })
    .catch(error => {
        console.error('Error unliking post:', error);
    });
}

function updateFollowButton(userID, username, followed, follower_count) {
    document.querySelector(`#profile-followers`).innerHTML = `<strong>Followers: </strong>${follower_count}`;

    const currentButton = document.querySelector(`#followtoggle-btn-${userID}`);
    const newButton = document.createElement('button');
    
    if (followed) {
        newButton.className = 'btn btn-outline-primary';
        newButton.innerText = `Unfollow ${username}`;
        newButton.onclick = () => unfollowUser(userID, username);
    } else {
        newButton.className = 'btn btn-primary';
        newButton.innerText = `Follow ${username}`;
        newButton.onclick = () => followUser(userID, username);
    }

    newButton.id = `followtoggle-btn-${userID}`;
    currentButton.parentNode.replaceChild(newButton, currentButton); 
}

// ----------------------------------------------
// EDIT POST FUNCTIONS
// ----------------------------------------------

// Create a form to edit the post
function openEditForm(postID, currentBody) {
    const postBody = document.getElementById(`post-body-${postID}`);

    // Create and populate the form
    const edit_form = document.createElement('form');
    edit_form.id = `edit-form-${postID}`;
    edit_form.className = 'edit-form';
    edit_form.method = 'POST';

    const edit_form_body = document.createElement('textarea');
    edit_form_body.className = 'form-control';
    edit_form_body.id = `edit-form-${postID}`;
    edit_form_body.value = currentBody;

    const submitEditButton = document.createElement('button');
    submitEditButton.type = 'submit';
    submitEditButton.className = 'btn btn-primary';
    submitEditButton.innerText = 'Confirm edits';

    // Add event listener for form submission
    edit_form.addEventListener('submit', function(event) {
        event.preventDefault();
        const new_post_body = edit_form_body.value; 
        update_post(postID, new_post_body);  
    });

    // Replace the post content with the edit form
    edit_form.appendChild(edit_form_body);
    edit_form.appendChild(submitEditButton);
    postBody.innerHTML = '';
    postBody.appendChild(edit_form);

    // Hide the edit button
    document.getElementById(`edit-btn-${postID}`).style.display = 'none';
}

// Update the post on the page
function update_post(postID, new_post_body) {
    // Update server
    // Construct the data to send to the server
    const postData = {
        "new-post-body": new_post_body
    };

    // Use fetch to send the POST request to the server
    fetch(`/edit/${postID}`, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // If there's an error in the response data, alert the user
            alert(data.error);
        }
        // If needed, you can add more handling logic here based on the response
    })
    .catch(error => {
        console.error('Error updating post:', error);
    });

    // Update page without reload
    // Remove the edit form and replace it with the updated post body
    document.getElementById(`post-body-${postID}`).innerHTML = new_post_body;;
    
    // Add information on the edit time
    document.getElementById(`post-timestamp-${postID}`).innerHTML = ` (Edited) ${formatDate(new Date())}`

    // Unhide the edit button
    document.getElementById(`edit-btn-${postID}`).style.display = 'block';
}