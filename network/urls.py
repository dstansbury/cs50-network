
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
    path("new-post", views.new_post, name="new_post"),
    path('like/<int:post_id>', views.like_post, name="like_post"),
    path('unlike/<int:post_id>', views.unlike_post, name="unlike_post"),
    path('follow/<int:userID>', views.follow_user, name="follow_user"),
    path('unfollow/<int:userID>', views.unfollow_user, name="unfollow_user"),
    path('edit/<int:post_id>', views.edit, name="edit"),
]
