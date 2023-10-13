import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.db.models.query import QuerySet
from django.views.decorators.http import require_POST

from .models import User, Post, Follow, Like

""" 
GET_POSTS HELPER FUNCTION

    Get posts. If there is a userID object, it checks whether it is a list or QuerySet, 
    or a single ID and it filters the posts by that user(s). If nothing is provided,
    it returns all the posts.

    Returns serialized posts, with the order reversed so newest posts appear first.
    
"""
def get_posts(userID=None, active_user=None):
    
    # If userID is a list or a QuerySet, filter posts by multiple users
    # this is needed for the Following page
    if isinstance(userID, (list, QuerySet)):
        posts = Post.objects.filter(poster__in=userID).order_by('-timestamp')
    
    # If userID is a single integer, filter posts by that specific user
    # this is needed for the profile page
    elif isinstance(userID, int):
        posts = Post.objects.filter(poster=userID).order_by('-timestamp')
    
    # If no userID is provided, get all posts
    # this is needed for the all posts page
    else:
        posts = Post.objects.all().order_by('-timestamp')

    # Create a serialized list of posts
    # if there is a logged in user, add a check to see if the post has been liked
    # by the active user
    serialized_posts = []
    for post in posts:
        post_data = post.serialize()
        if active_user:
            post_data['user_liked'] = Like.objects.filter(post=post, liker=active_user).exists()
        post_data['likes_count'] = Like.objects.filter(post=post).count()
        serialized_posts.append(post_data)

    
    return serialized_posts
   
"""
MAIN INDEX PAGE FUNCTIONS
"""

# render the index page after getting necessary data
def index(request):
    # Check if the user is logged in
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))
    
    # Check if "following" query parameter is set to "true"
    following_only = request.GET.get('following') == 'true'
    
    #grab all the posts from the DB and return them as JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        
        # If the user is only interested in posts from people they follow
        # get only the posts from the users they follow
        if following_only:
            following_users = Follow.objects.filter(follower=request.user).values_list('follows', flat=True)
            posts = get_posts(following_users, request.user)
        
        # otherwise, get all the posts
        else:
            posts = get_posts(None, request.user)

        return JsonResponse(posts, safe=False)
        
    #If it's not an AJAX request, render the index page
    else:
        return render(request, "network/index.html")
    
# create a new post
@login_required
@require_POST
def new_post(request):
    if request.method=="POST":
         # Check if postBody is not empty
         
        if request.POST.get("new-post-body"): 
            newPost = Post.objects.create(
                poster=request.user, 
                body=request.POST["new-post-body"]
                )
            return HttpResponseRedirect(reverse("index"))
    else:
        messages.error(request, 'Cannot create empty post.')
        return HttpResponseRedirect(reverse("index"))
        
"""
LIKE / UNLIKE BUTTON FUNCTIONS
"""
@login_required
@require_POST
def like_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
        # Check if the like already exists
        existing_like = Like.objects.filter(liker=request.user, post=post)
        if existing_like.exists():
            return JsonResponse({"error": "Post already liked by user."}, status=400)
        
        else:
            # Create the like since it doesn't exist
            Like.objects.create(liker=request.user, post=post)
            return JsonResponse({"likes_count": Like.objects.filter(post=post).count()}, status=201)
    except:
        return JsonResponse({"error": "Unable to like post."}, status=400)

@login_required
@require_POST
def unlike_post(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
        if Like.objects.filter(post=post).count() <= 0:
            return JsonResponse({"error": "Cannot unlike a post with zero likes."}, status=400)
        else:
            like = Like.objects.filter(liker=request.user, post=post).first()
            if like:
                like.delete()
            else:
                return JsonResponse({"error": "Post not liked by user."}, status=400)
            return JsonResponse({"likes_count": Like.objects.filter(post=post).count()}, status=200)
    except:
        return JsonResponse({"error": "Unable to unlike post."}, status=400)


"""
PROFILE PAGE FUNCTIONS
"""  
# Correct path
def profile(request, userID):
    
    # Check if the user is logged in
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))
    
    #grab all the user's posts from the DB, and their follower and follows counts
    # and return them as JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        
        userPosts = get_posts(userID, request.user)
        userName = User.objects.get(id=userID).username  
        numFollowers = Follow.objects.filter(follows=userID).count()
        numFollows = Follow.objects.filter(follower=userID).count()
        activeUserFollows = Follow.objects.filter(follower=request.user, follows=userID).exists()

        # Return data in structured format
        userProfileData = {
            "userName": userName,
            "userPosts": userPosts,
            "numFollowers": numFollowers,
            "numFollows": numFollows,
            "activeUserFollows": activeUserFollows
        }
        
        return JsonResponse(userProfileData, safe=False)
    
    #If it's not an AJAX request, render the profile page
    else:
        return render(request, "network/profile.html", {"userID": userID})
    
# Error path
def no_user_profile(request):
    # create an error message
    messages.warning(request, 'Invalid profile access. Redirecting to the main page.')
    # redirect to the index page with the message to display.
    return HttpResponseRedirect('/') 

"""
FOLLOW AND UNFOLLOW FUNCTIONS
"""
@login_required
@require_POST
def follow_user(request, userID):
    try:
        user_to_follow = User.objects.get(pk=userID)

        # Check if the follow relationship already exists
        existing_follow = Follow.objects.filter(follower=request.user, follows=user_to_follow)
        
        if existing_follow.exists():
            return JsonResponse({"error": "Profile already followed by active user"}, status=400)
        
        else:
            # Create the follow relationship since it doesn't exist
            Follow.objects.create(follower=request.user, follows=user_to_follow)
            return JsonResponse({"activeUserFollows": True, "follower_count": Follow.objects.filter(follows=user_to_follow).count()}, status=201)
    
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    except Exception as e:
        print(e)  # Print out the actual error
        return JsonResponse({"error": "Unable to follow profile."}, status=400)
    
@login_required
@require_POST
def unfollow_user(request, userID):
    try:
        user_to_unfollow = User.objects.get(pk=userID)
        
        # Check if the follow already exists
        existing_follow = Follow.objects.filter(follower=request.user, follows=user_to_unfollow)
        
        if not existing_follow.exists():
            return JsonResponse({"error": "Profile already unfollowed by active user"}, status=400)
        
        else:
            # Unfollow the user
            existing_follow.delete()
            return JsonResponse({"activeUserFollows": False, "follower_count": Follow.objects.filter(follows=user_to_unfollow).count()}, status=201)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    except Exception as e:
        print(e)  # Print out the actual error
        return JsonResponse({"error": "Unable to unfollow profile."}, status=400)

    
"""
LOGIN PAGE FUNCTION
"""
def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")

"""
LOGOUT PAGE FUNCTION
"""
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

"""
REGISTER PAGE FUNCTION
"""
def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
