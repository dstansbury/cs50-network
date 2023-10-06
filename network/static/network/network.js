document.addEventListener('DOMContentLoaded', function() {
    // logic for the new post form submission
    document.querySelector("#new-post-form").addEventListener("submit", function(event))
    });

// gets all the posts from the DB
function load_posts() {
      
    // get all the existing posts from the DB
    fetch(`/posts`)
    .then(response => response.json())
    .then(posts => {
          
        // Print the posts to the console for debugging
        console.log(posts);
      
        // loop through the posts and create a new div element for each post
        posts.forEach(post => {
            add_post(post);
        });
    });
}



function add_post(post) {
    // set up a new div for each new element
    const postDiv = document.createElement('div');
      
    // give the new div a class name so we can style it in the CSS file
    postDiv.className = 'postDiv';
    // POSSIBLY NOT NECESSARY? postDiv.idName = 'postDiv';

    postDiv.innerHTML = `
        <div id="post-poster"><h3>${post.poster}</h3></div>
        <div id="post-body">${post.body}</div>
        <div id="post-timestamp">${post.timestamp}</div>`
        ;})
};