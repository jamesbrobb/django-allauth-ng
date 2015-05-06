import re
import json

from django.core.urlresolvers import reverse
from django.http import HttpResponse

from allauth.account.adapter import DefaultAccountAdapter



class AccountAdaptor(DefaultAccountAdapter):
    
    def get_login_redirect_url(self, request):
        url = super(AccountAdaptor, self).get_login_redirect_url(request)
        """ we're completing a social signup/login, so modify redirect url """        
        if re.match('/accounts/.*?/login/callback/', request.path) or \
           re.match('/accounts/social/signup/', request.path):
            url = reverse('socialaccount_auth_complete')
        return url
        
    def ajax_response(self, request, response, redirect_to=None, form=None):
        data = {}
        if redirect_to:
            status = 200
            data['location'] = redirect_to
        if form:
            if form.is_valid():
                status = 200
            else:
                status = 400
                data['form_errors'] = form._errors
            
        return HttpResponse(json.dumps(data),
                            status=status,
                            content_type='application/json')


