from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    poster = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    postLikes = models.ManyToManyField("User", through="Like", related_name="liked_posts")

    def serialize(self):
        return {
            "id": self.id,
            "poster": self.poster.username,
            "posterID": self.poster.id,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes_count": self.postLikes.count()
        }
    
class Follow(models.Model):
    follower = models.ForeignKey("User", on_delete=models.CASCADE, related_name="following")
    follows = models.ForeignKey("User", on_delete=models.CASCADE, related_name="followers")
    
class Like(models.Model):
    liker = models.ForeignKey("User", on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="likes_of_post")
    
    def serialize(self):
        return {
            "liker": self.liker.username,
            "post": self.post.poster.username
        }
