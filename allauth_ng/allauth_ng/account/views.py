import json

from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect, HttpResponsePermanentRedirect
from django.views.generic import TemplateView
from django.views.decorators.http import require_POST

from allauth.account.views import (LogoutView as all_auth_logout_view,
                                   LoginView as all_auth_login_view,
                                   SignupView as all_auth_signup_view,
                                   PasswordResetView as all_auth_reset_view,
                                   _ajax_response)

from allauth.socialaccount.views import SignupView as all_auth_social_signup_view

from .forms import LoginForm, SignupForm, PasswordResetForm



class AuthenticatedUserRedirectMixin(object):
    
    def dispatch(self, request, *args, **kwargs):
        response = super(AuthenticatedUserRedirectMixin, self).dispatch(request, *args, **kwargs)
        """ catches redirect from RedirectAuthenticatedUserMixin if user's already authenticated """
        if self._is_redirect(response):
            response = _ajax_response(request, response)
        return response
    
    def _is_redirect(self, response):
        return type(response) in (HttpResponseRedirect, HttpResponsePermanentRedirect,)


class LogoutView(all_auth_logout_view):
    
    def dispatch(self, request, *args, **kwargs):
        response = super(LogoutView, self).dispatch(request, *args, **kwargs)
        return _ajax_response(request, response)


class LoginView(AuthenticatedUserRedirectMixin, all_auth_login_view):
    form_class = LoginForm 


class SignupView(AuthenticatedUserRedirectMixin, all_auth_signup_view):
    form_class = SignupForm


class PasswordResetView(all_auth_reset_view):
    form_class = PasswordResetForm
    

logout = require_POST(LogoutView.as_view())
login = require_POST(LoginView.as_view())
signup = require_POST(SignupView.as_view())
reset_password = require_POST(PasswordResetView.as_view())


""" SOCIAL VIEWS """


class SocialSignupView(all_auth_social_signup_view):
    
    def get_context_data(self, **kwargs):
        ret = super(SocialSignupView, self).get_context_data(**kwargs)
        is_already_user = False
        if self.sociallogin.user.email:
            if get_user_model().objects.filter(email=self.sociallogin.user.email).exists():
                is_already_user = True
        ret.update({'is_already_user': is_already_user,
                    'provider_name': self.sociallogin.account.get_provider().name})
        return ret
    

class SocialAuthCompleteView(TemplateView):
    template_name = 'socialaccount/auth_complete.html'



