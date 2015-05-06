from django.conf import settings
from django.core.urlresolvers import reverse, resolve, Resolver404
from django.utils.decorators import decorator_from_middleware

from .helpers import process_response, is_not_valid_type




class AjaxDjangoMessagesMiddleware(object):

    def process_response(self, request, response):
        if is_not_valid_type(request, response):
            return response
        if self._is_debug_toolbar(request.path):
            return response
        return process_response(request, response)

    def _is_debug_toolbar(self, path):
        return settings.DEBUG and path.startswith("/__debug__")

