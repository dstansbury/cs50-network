document.addEventListener('DOMContentLoaded', function() {
    // logic for the compose form submission
    document.querySelector("#new-post-form").addEventListener("submit", function(event)
    });


function load_posts() {
      
    // get the existing posts from the DB
    fetch(`/posts/`)
    .then(response => response.json())
    .then(posts => {
          
        // Print the emails to the console for debugging
        console.log(posts);
      
        // loop through the emails and create a new div element for each email
        posts.forEach(post => {
            add_post(post);
        });
    });
}

function add_post(post_id) {
    // grab the contents of the pose
    fetch(`/posts/${post_id}`)
    .then(response => response.json())
    .then(post => {
      // Print post to the log
      console.log(post);
    
    // set up a new div for each new element
    const postDiv = document.createElement('div');
      
    // give the new div a class name so we can style it in the CSS file
    postDiv.className = 'postDiv';
    // POSSIBLE NOT NECESSARY? postDiv.idName = 'postDiv';

    postDiv.innerHTML = `
        <div id="poster"><h3>${post.poster}</h3></div>
        <div id="post-body"><p>${post.body}</p></div>
        <div id="post-timestamp"><p>${post.timestamp}</p></div>
        <div id="post-likes"><p>${post.likes}</p></div>`
        //<div class ="email-action-block">
         // <button class="btn btn-sm btn-outline-primary" id="reply-button">Reply</button>
          //<button class="btn btn-sm btn-outline-primary" id="archive-button">Archive</button>
          //<button class="btn btn-sm btn-outline-primary" id="unarchive-button">Unarchive</button>
        //</div>
        ;}
};