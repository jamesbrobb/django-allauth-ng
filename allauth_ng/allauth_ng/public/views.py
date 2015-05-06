from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie




class IndexView(TemplateView):
    template_name = 'ng/index.html'
    
index = ensure_csrf_cookie(IndexView.as_view())
    
    
class ProfileView(TemplateView):
    template_name = 'ng/public/profile.html'        
    


    
      
    
        
    
    
    
    
    
    
    