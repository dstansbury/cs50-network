import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Post, Follow, Like

""" 
GET_POSTS HELPER FUNCTION

    Get posts. If userID is provided, it filters the posts by that user.
    Returns serialized posts.
    
"""
def get_posts(userID=None):
   
    # returns the posts in reverse chronological order
    if userID:
        posts = Post.objects.filter(poster=userID).order_by('-timestamp')
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
    
    #grab all the posts from the DB and return them as JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        
        allPosts = get_posts()

        return JsonResponse(allPosts, safe=False)
        
    #If it's not an AJAX request, render the index page
    else:
        return render(request, "network/index.html")


"""
PROFILE PAGE FUNCTION
"""  
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
