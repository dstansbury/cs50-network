# Generated by Django 4.2.5 on 2023-10-12 16:01

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0003_post_postlikes'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='postLikes',
        ),
        migrations.AlterField(
            model_name='like',
            name='post',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes_of_post', to='network.post'),
        ),
    ]
