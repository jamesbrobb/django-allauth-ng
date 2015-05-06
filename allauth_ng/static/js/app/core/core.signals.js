

angular
	.module('app.core.signals',[])
	.constant('userAuthEvents', userAuthEvents())
	.factory('userAuthSignal', userAuthSignal);




function userAuthEvents() {
	
	return Object.freeze({
		
		USER_AUTHED: 'userAuthEvent.USER_AUTHED',
		USER_UNAUTHED: 'userAuthEvent.USER_UNAUTHED'
	})
}



function userAuthSignal($rootScope, userAuthEvents) {
	
	return {
		
		userAuthenticated: userAuthenticated,
		onUserAuthenticated: onUserAuthenticated,
		userUnauthenticated: userUnauthenticated,
		onUserUnauthenticated: onUserUnauthenticated
	}
	
	/* --------------------- */
	
	function userAuthenticated() {
		
		$rootScope.$broadcast(userAuthEvents.USER_AUTHED);
	}
	
	function onUserAuthenticated(scope, handler) {
		
		scope.$on(userAuthEvents.USER_AUTHED, function (event) {
            handler();
        });
	}
	
	function userUnauthenticated() {
		
		$rootScope.$broadcast(userAuthEvents.USER_UNAUTHED);
	}
	
	function onUserUnauthenticated(scope, handler) {
		
		scope.$on(userAuthEvents.USER_UNAUTHED, function (event) {
            handler();
        });
	}
}