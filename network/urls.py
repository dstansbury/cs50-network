
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    #error handling path, in case no user ID is provided
    path("profile/", views.no_user_profile, name="no_user_profile"),
    #actual path to profile page
    path("profile/<int:userID>", views.profile, name="profile"),
    path("new-post", views.new_post, name="new_post")
]
