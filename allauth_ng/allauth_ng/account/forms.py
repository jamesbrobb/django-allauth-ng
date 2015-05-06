from django import forms
from django.utils.translation import ugettext_lazy as _

from allauth.utils import set_form_field_order
from allauth.account.forms import (LoginForm as allauth_login_form,
                                   SignupForm as allauth_signup_form,
                                   ResetPasswordForm as allauth_password_reset_form)

from djangular.forms import NgFormValidationMixin, NgModelFormMixin
from djangular.styling.bootstrap3.forms import Bootstrap3Form




class BaseNgForm(NgModelFormMixin, NgFormValidationMixin, Bootstrap3Form):
    pass


"""
fix for this issue
https://github.com/jrief/django-angular/issues/133#issuecomment-64980658
""" 
class LoginFormFixer(allauth_login_form):
    
    login = forms.EmailField(label=_("E-mail"),
                             widget=forms.EmailInput(attrs={'placeholder':
                                    _('E-mail address'), 'autofocus': 'autofocus'}))
    
    def __init__(self, *args, **kwargs):
        super(allauth_login_form, self).__init__(*args, **kwargs)
        set_form_field_order(self,  ["login", "password", "remember"])


class LoginForm(BaseNgForm, LoginFormFixer):
    form_name = 'login_form'
    scope_prefix = 'signin'


class SignupForm(BaseNgForm, allauth_signup_form):
    form_name = 'signup_form'
    scope_prefix = 'signup'

 
class PasswordResetForm(BaseNgForm, allauth_password_reset_form):
    form_name = 'password_reset_form'
    scope_prefix = 'password_reset'

