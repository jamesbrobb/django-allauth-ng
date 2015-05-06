

angular
	.module('app.core.services', [])
	.factory('initialAuthCheckHandler', initialAuthCheckHandler)
	.factory('stateAuthRequirementChecker', stateAuthRequirementChecker)
	.factory('authStateObserverRouteStateProcessor', authStateObserverRouteStateProcessor)
	.factory('observerInitialiser', observerInitialiser)
	.factory('authResponderService', authResponderService)
	.factory('socialLoginResponder', socialLoginResponder)
	.factory('userService', userService)
	.factory('notificationManager', notificationManager)
	.factory('messagesManager', messagesManager)
	
	
	
function initialAuthCheckHandler($q, userService) {

	var _isAuthenticated = false,
		_sequential = true;
	
	return {
		set isAuthenticated(value) {
			_isAuthenticated = value;
		},
		get sequential() {
			return _sequential;
		},
		run: run
	}
	
	function run() {
		
		var defer = $q.defer();
		
		if(_isAuthenticated) {
			
			userService.get().then(function() {
				defer.resolve(true);
			});
			
		}else{
			
			defer.resolve(true);
		}
		
		return defer.promise;
	}
}


function stateAuthRequirementChecker(UserModel,
									 nextStateRedirectService,
									 routeStateUtils, 
									 appStates){
	
	return {
		processStateChange: processStateChange
	}
	
	/* ----------------------- */
	
	function processStateChange(toState, toParams, fromState, fromParams) {
		
		if(UserModel.authenticated) {
			
			if(_isAuthState(toState)) {
				
				// TODO - should this show a message?
				
				return _isRootState(fromState) ? appStates.PROFILE : fromState;
			}
			
		}else{
			
			if(_isRequiredAuthState(toState)) {
				
				nextStateRedirectService.next = toState.name;
				
				return _isRootState(fromState) ? appStates.HOME : fromState.name;
			}
		}
		
		return null;
	}
	
	function _isRootState(state) {
		return routeStateUtils.isRoot(state);
	}
	
	function _isAuthState(state) {
		return state.data && state.data.isAuthState
	}
	
	function _isRequiredAuthState(state) {
		return state.data && state.data.requiresAuth
	}
}


function authStateObserverRouteStateProcessor($state, $urlRouter, routeStateUtils, appStates) {
	
	return {
		processAuthed: processAuthed,
		processUnAuthed: processUnAuthed
	}
	
	/* ------------------------- */
	
	function processAuthed() {
		
		if(_isRootState()) {
			
			$urlRouter.sync();
			
		}else if(_isAuthState()) {
			
			$state.go(appStates.PROFILE);
		}
	}
	
	function processUnAuthed() {
		
		if(_isRootState()) {
			
			$urlRouter.sync();
			
		}else if(_isRequiredAuthState()) {
			
			$state.go(appStates.HOME);
		}
	}
	
	/*
	 * occurs when preventDefault has been
	 * called on the initial state change
	 */
	function _isRootState() {
		return routeStateUtils.isRoot($state.current);
	}
	
	function _isAuthState() {
		var current = $state.current
		return current.data && current.data.isAuthState
	}
	
	function _isRequiredAuthState() {
		var current = $state.current
		return current.data && current.data.requiresAuth
	}
}


function observerInitialiser(authStateObserver, routeStateChangeObserver, messagesManager) {
	
	return {
		run: run
	}
	
	/* ------------------ */
	
	function run() {
		authStateObserver.initialise();
		routeStateChangeObserver.initialise();
		messagesManager.initialise();
	}
}


function authResponderService($state,
							  appStates,
							  userService,
							  notificationManager,
							  nextStateRedirectService,
							  djangoForm) {

	return {
		loginSuccess: loginSuccess,
		signupSuccess: signupSuccess,
		resetPasswordSuccess: resetPasswordSuccess,
		logoutSuccess: logoutSuccess,
		formError: formError
	}
	
	/* ------------------ */
	
	function loginSuccess(response, form) {
		
		if(response.AUTHENTICATED) {
			
			return userService
					.get()
					.then(nextStateRedirectService.go);
		}else{
			
			$state.go(appStates.VERIFY_EMAIL);
		}
	}
	
	function signupSuccess(response, form) {
		
		if(response.AUTHENTICATED) {
			
			return userService
					.get()
					.then(nextStateRedirectService.go);
		}else{
			
			$state.go(appStates.VERIFY_EMAIL);
		}	
	}
	
	function resetPasswordSuccess(response, form) {
		
		$state.go(appStates.FORGOTTEN_DONE);
	}
	
	function logoutSuccess(response) {
		userService.clear();
		//notificationManager.notify('info', authMessages.LOGGED_OUT)
	}
	
	function formError(error, form) {
		if(error.data && error.data.form_errors) {
			djangoForm.setErrors(form, error.data.form_errors);
		}else{
			return error;
		}
	}
}


function socialLoginResponder(userService,
							  notificationManager,
							  nextStateRedirectService) {
	
	return {
		success: success,
		error: error,
		denied: denied,
		closed: closed
	}
	
	/* ====================== */
	
	function success(response) {
		return userService.get()
				.then(_notifySocialComplete)
				.then(nextStateRedirectService.go);
	};
	
	function error(response) {
		notificationManager.notify('error', {title: 'Error', message:response});
	};
	
	function denied(response) {
		notificationManager.notify('warning', {title: 'Access Denied', message:response});
	};
	
	function closed(response) {
		notificationManager.notify('info', {title: 'Closed', message:response});
	};
	
	function _notifySocialComplete() {
		//notificationManager.notify('info', socialMessages.SIGNUP_COMPLETE)
	}
}


function userService($http, UserModel, apiEndpoints) {
	
	return {
		get: get,
		clear: clear
	}
	
	/* ----------------------- */
	
	function get() {
		return $http.get(apiEndpoints.BASE + apiEndpoints.USER)
			   .then(_handleResponse)
			   .catch(_handleError);
	};
	
	function clear() {
		UserModel.clear();
	};
	
	function _handleResponse(response) {
		UserModel.setUser(response.data);
		return response;
	};
	
	function _handleError(error) {
		if(error.status === 403) {
			clear();
		}
	};
}


function notificationManager(toastr) {
	
	return {
		notify: notify
	}
	
	/* ------------------ */
	
	function notify(type, note, options) {
		toastr[type](note.message, note.title, options);
	}
}


function messagesManager($rootScope, notificationManager, djangoMessagesSignal) {
	
	return {
		initialise: initialise
	}
	
	/* --------------------- */
	
	function initialise() {
		djangoMessagesSignal.onMessagesUpdated($rootScope, _messagesUpdated);
	}

    function _messagesUpdated(model) {
    	
        var messages = model.getMessages(),
            i = 0,
            len = messages.length,
            message;
		
        for(; i < len; i++) {
            message = messages[i];
            notificationManager.notify(message.type,
            						   { message:message.message,
            						     title: message.type.charAt(0).toUpperCase() + message.type.slice(1)});
        }
    }
}

