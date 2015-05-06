from django.conf.urls import patterns, url, include
from django.contrib import admin
from django.contrib.auth.views import logout
from django.views.decorators.http import require_POST

from . import views

admin.autodiscover()

urlpatterns = patterns('',
                       
    url(r'^logout/$', views.logout),
    url(r'^login/$', views.login),   
    url(r'^signup/$', views.signup),
    url(r'^password/reset/$', views.reset_password),
    
    url(r'^social/signup/$', views.SocialSignupView.as_view()),
    url(r'^social/auth/complete/$', views.SocialAuthCompleteView.as_view(), name='socialaccount_auth_complete'),
    
    url(r'', include('allauth.urls')),
)