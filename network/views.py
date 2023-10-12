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

from .models import User, Post, Follow, Like

""" 
GET_POSTS HELPER FUNCTION

    Get posts. If there is a userID object, it checks whether it is a list or QuerySet, 
    or a single ID and it filters the posts by that user(s). If nothing is provided,
    it returns all the posts.
    
    Returns serialized posts, with the order reversed so newest posts appear first.
    
"""
def get_posts(userID=None):
    
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

    """
        ADD LOGIC ABOUT WHETHER A USER HAS LIKED A POST
    """
    
    serialized_posts = [post.serialize() for post in posts]
    
    return serialized_posts
   
"""
MAIN INDEX PAGE FUNCTION
"""
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
            print(f"following_users are {following_users}")
            posts = get_posts(following_users)
            print(f"posts are {posts}")
        
        # otherwise, get all the posts
        else:
            posts = get_posts()

        return JsonResponse(posts, safe=False)
        
    #If it's not an AJAX request, render the index page
    else:
        return render(request, "network/index.html")


"""
PROFILE PAGE FUNCTIONS
"""  
# Correct path
def profile(request, userID):
    print(f"Profile view accessed with userID: {userID}")
    # Check if the user is logged in
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))
    
    #grab all the user's posts from the DB, and their follower and follows counts
    # and return them as JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        
        userPosts = get_posts(userID)
        userName = User.objects.get(id=userID).username  
        numFollowers = Follow.objects.filter(follows=userID).count()
        numFollows = Follow.objects.filter(follower=userID).count()

        # Return data in structured format
        userProfileData = {
            "userName": userName,
            "userPosts": userPosts,
            "numFollowers": numFollowers,
            "numFollows": numFollows
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
