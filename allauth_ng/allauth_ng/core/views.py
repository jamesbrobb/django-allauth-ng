import json

from django.http import HttpResponse




def csrf_failure(request, reason=""):
    return HttpResponse(json.dumps({'csrf': reason}),
                        status=403,
                        content_type='application/json')