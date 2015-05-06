from django.conf.urls import patterns, url
from django.contrib import admin
from django.views.generic import TemplateView

from allauth.account.views import password_reset_done, email_verification_sent

from account.views import LoginView, SignupView, PasswordResetView

from .views import ProfileView

admin.autodiscover()



urlpatterns = patterns('',
                       
    url(r'^partial-header-view.html$',
        TemplateView.as_view(template_name='ng/public/snippets/partial-header-view.html'),
        name='partial_header_view'),
                       
    url(r'^partial-footer-view.html$',
        TemplateView.as_view(template_name='ng/public/snippets/partial-footer-view.html'),
        name='partial_footer_view'),
                       
    url(r'^partial-home.html$',
        TemplateView.as_view(template_name='ng/public/partial-home.html'),
        name='partial_home'),
                                         
    url(r'^partial-login.html$', LoginView.as_view(), name='partial_login'),
    url(r'^partial-signup.html$', SignupView.as_view(), name='partial_register'),
    url(r'^partial-verify-email.html$', email_verification_sent, name='partial_verify_email'),
    url(r'^partial-password-reset.html$', PasswordResetView.as_view(), name='partial_reset_password'),
    url(r'^partial-password-reset-done.html$', password_reset_done, name='partial_reset_password_done'),
    
    url(r'^partial-profile.html$',
        ProfileView.as_view(template_name='ng/account/partial-profile.html'),
        name='partial_profile'),
)


"""
partials = (
    'ng/public/snippets/partial-header-view.html',
    'ng/public/snippets/partial-footer-view.html',
    'ng/public/partial-home.html',
    'ng/public/partial-login.html',
    'ng/public/partial-signup.html',
    'ng/public/partial-password-reset.html',
)


urlpatterns = patterns('',
                       
    url(r'^(?P<partial>.*\.html)$', PartialsView.as_view(), name='partials_view'),
)
"""

