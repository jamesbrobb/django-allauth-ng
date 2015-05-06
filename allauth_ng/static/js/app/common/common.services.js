

angular
	.module('app.common.services', [
	    'app.common.utils'
	])
	.provider('authStateObserver', authStateObserver)
	.service('popupService', popupService)
	


	
function authStateObserver() {
	
	var _authedEvent,
		_unauthedEvent,
		_responders;
	
	return {
		/**
		 * @param authedEvent
		 * @param unauthedEvent
		 */
		configureEvents: configureEvents,
		/**
		 * @param value A string or array of strings representing the names of services to process the events
		 * 
		 * They must implement the optional interface
		 * 
		 * - processAuthed()
		 * - processUnAuthed()
		 * 
		 * both methods can return a truthy value if they wish to halt processing
		 */
		set responders(value) {
			_responders = _responders || [];
			_responders = _responders.concat(value);
		},
		$get: $get
	}
	
	
	/* ----------------------- */
	
	
	function configureEvents(authedEvent, unauthedEvent) {
		
		_authedEvent = authedEvent;
		_unauthedEvent = unauthedEvent;
	}
	
	function $get(dependencyResolver, $rootScope) {
		
		return {
			initialise: initialise
		}
		
		/* --------------------- */
		
		function initialise() {
			
			_configureResponders();
			
			$rootScope.$on(_authedEvent, _handleAuthedEvent);
			$rootScope.$on(_unauthedEvent, _handleUnauthedEvent);
		}
		
		function _handleAuthedEvent() {
			_processResponders('processAuthed');
		}
		
		function _handleUnauthedEvent() {
			_processResponders('processUnAuthed');
		}
		
		function _configureResponders() {
			if(_responders) {
				_responders = dependencyResolver.resolve(
					_responders,
					'authStateObserver::Configuring responder: There is no %dependency% service'
				);
			}
		}
		
		function _processResponders(fn) {
			if(_responders) {
				var i = 0,
					len = _responders.length,
					responder,
					ret;
				
				for(; i < len; i++) {
					responder = _responders[i];
					if(angular.isFunction(responder[fn])) {
						ret = responder[fn]();
						if(ret)
							return;
					}
				}
			}
		}
	}
}


/*
 * TODO - need to look at what happens if a popup's opened whilst ones already open.
 * Do we need to clean up anything?
 */
function popupService($window, $document, $location, $timeout, $q) {
	
	var popup,
		ignore_frags,
		deferred,
		promise;
	
	this.open = function(url, width, height, ignore, domain) {
		deferred = $q.defer();
		ignore_frags = ignore || [];
		
		setDocumentDomain(domain);
		openWindow(url, width, height);
		
		$timeout(watchWindow, 250);
		
		return deferred.promise;
	};
	
	function setDocumentDomain(domain) {
		/*
		 * If the parent host is not an exact match to the window host
		 * 
		 * i.e this host is 'example.com' and the window host is 'www.example.com'
		 * 
		 * calling popup.location.href will throw a 'permission denied' error
		 * as it's considered a 'document domain'/'same origin policy' issue
		 * 
		 * so we need to modify the document.domain in both the parent and window
		 * to ensure that they're exactly the same
		 * 
		 * @see https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript
		 * @see https://developer.mozilla.org/en-US/docs/DOM/document.domain
		 */
		if(!domain)
			return;
		
		if(domain === true) {
			
			$window.document.domain = $location.host().replace("www.", "");
			
		}else{
			
			$window.document.domain = domain;
		}
	}
	
	function openWindow(url, width, height) {
		/*
		 * popup blockers cause window.open to return null. Obviously.
		 * 
		 * So the window is only opened once the user allows it, at which point we've
		 * lost the reference and this code stops working
		 */
		popup = $window.open(url, "popupWin", "width=" + width + ", height=" + height);
	}
	
	function watchWindow() {
		/*
		 * Known instances of this issue occurring are when a popup
		 * blocker prevents/delays the popup window from opening
		 */
		if(!popup) {
			deferred.reject('error');
			cleanUp();
			return;
		}
		
		/*
		 * The user has closed the popup
		 */
		if(popup && popup.closed) {
			deferred.resolve('closed');
			cleanUp();
			return;
		}
		
		try {

			var href = popup.location.href;
			console.log('href: ', href)
			if(popupIsComplete(href)) {	
				//a redirect has occurred
				deferred.resolve(href);
				popup.close();
				cleanUp();
				return;
			}
			
		}catch(err){
			//console.log(err);
		}
		
		$timeout(watchWindow, 250);
	}
	
	function popupIsComplete(href) {
		return !!(hrefIsNotBlank(href) &&
				  domainIsSet() &&
				  domainIsSame(href) &&
				  shouldNotIgnoreUrl(href));
	}
	
	function hrefIsNotBlank(href) {
		return href !== "about:blank"
	}
	
	function domainIsSet() {
		return $window.document.domain !== "";
	}
	
	function domainIsSame(href) {
		return href.indexOf($window.document.domain) !== -1;
	}
	
	function shouldNotIgnoreUrl(url) {
		var i = 0,
			len = ignore_frags.length;
		
		for(; i < len; i++) {
			if(url.indexOf(ignore_frags[i]) !== -1)
				return false
		}
		
		return true
	}
	
	function cleanUp() {
		popup = null;
		deferred = null;
	}
}
