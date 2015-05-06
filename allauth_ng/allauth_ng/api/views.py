import json

from django.http import HttpResponse
from django.views.generic import View
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required

from core.models import User


class UserView(View):
    
    @method_decorator(login_required)
    def get(self, request, *args, **kwargs):
        user = User.objects.get(username=request.user.username)
        data = {'id': user.id,
                'username': user.username,
                'email': user.email,
                'verified': user.verified,
                'social-only': user.social_only}
        
        return HttpResponse(json.dumps(data),
                            status=200,
                            content_type='application/json')