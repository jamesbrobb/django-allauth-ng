
	
angular
	.module('app')
	.config(httpInterceptorConfiguration)
	.config(routeStateChangeObserverConfiguration)
	.config(authServiceConfiguration)
	.config(socialAuthServiceConfiguration)
	.config(authStateObserverConfiguration)
	.config(toastrConfiguration)




function httpInterceptorConfiguration(responseErrorInterceptorProvider, 
									  $httpProvider) {
	
	responseErrorInterceptorProvider.handlers = ['server500ResponseHandler', 'csrfResponseHandler'];
	
	$httpProvider.interceptors.push('responseErrorInterceptor', 'djangoMessagesInterceptor');
}


function routeStateChangeObserverConfiguration(routeStateChangeObserverProvider) {
	
	routeStateChangeObserverProvider.responders = [
	                                               
	    'nextStateRedirectService', 
		'stateAuthRequirementChecker'
	];
}


function authServiceConfiguration(authServiceProvider) {
	
	authServiceProvider.responder = 'authResponderService';
	authServiceProvider.responsePreprocessor = 'authResponsePreProcessor';
}


function socialAuthServiceConfiguration(socialAuthServiceProvider) {
	
	socialAuthServiceProvider.responders = {login: 'socialLoginResponder'};
	socialAuthServiceProvider.ignoreFragments = ['/accounts/social/signup/'];
}


function authStateObserverConfiguration(authStateObserverProvider) {
	
	authStateObserverProvider.responders = ['authStateObserverRouteStateProcessor'];
}

/*
 * change styling to bootstrap
 */
function toastrConfiguration(toastrConfig) {
	
	angular.extend(toastrConfig, {
	    toastClass: 'alert',
	    iconClasses: {
	        error: 'alert-danger',
	        info: 'alert-info',
	        success: 'alert-success',
	        warning: 'alert-warning'
	    }
	});
}
		
		
