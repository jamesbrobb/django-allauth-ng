from django.conf.urls import patterns, url, include
from django.contrib import admin

from . import views

admin.autodiscover()



urlpatterns = patterns('',
    url(r'^$', views.index, name='public-index'),
)
