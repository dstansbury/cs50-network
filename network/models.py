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
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "likes_count": self.postLikes.count()
        }
    
    def user_has_liked(self, user):
        return self.postLikes.filter(pk=user.pk).exists()
    
class Follow(models.Model):
    follower = models.ForeignKey("User", on_delete=models.CASCADE, related_name="following")
    follows = models.ForeignKey("User", on_delete=models.CASCADE, related_name="followers")
    
    def serialize(self):
        return {
            "follower": self.follower.user,
            "follows": self.follows.user 
        }
    
class Like(models.Model):
    liker = models.ForeignKey("User", on_delete=models.CASCADE, related_name="likes")
    post = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="likes")
    
    def serialize(self):
        return {
            "liker": self.liker.user,
            "post": self.post.user,
        }
