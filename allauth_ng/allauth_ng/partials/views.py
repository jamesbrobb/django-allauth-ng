import re

from django.views.generic import TemplateView
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import cache_control

#from .urls import partials


class ProfileView(TemplateView):
    
    @method_decorator(login_required)
    @method_decorator(cache_control(must_revalidate=True, no_cache=True, no_store=True, max_age=0, expires=-1))
    def get(self, request, *args, **kwargs):
        return super(ProfileView, self).get(request, *args, **kwargs)


"""
class PartialsView(TemplateView):
    
    def get(self, request, *args, **kwargs):
        pt = re.compile('^.+?' + self.kwargs['partial'] + '$')
        for partial in partials:
            match = pt.match(partial)
            if match:
                template_name = match
                break
        super(PartialsView, self).get(request, *args, **kwargs)
"""