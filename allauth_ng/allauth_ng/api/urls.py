from django.conf.urls import patterns, url, include
from . import views



urlpatterns = patterns('',
    url(r'^users/current/$', views.UserView.as_view(), name='user-view'),                   
)