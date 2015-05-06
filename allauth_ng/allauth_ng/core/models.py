from django.contrib.auth.models import User as dj_user
from django.utils.functional import cached_property

from allauth.account.models import EmailAddress




class User(dj_user):
    
    class Meta:
        proxy = True
    
    @property
    def verified(self):
        return EmailAddress.objects.filter(user=self, verified=True).exists()
    
    @property
    def social_only(self):
        return not self.has_usable_password()