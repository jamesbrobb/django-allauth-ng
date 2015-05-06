

angular
	.module('app')
	.run(setUpHttp)
	.run(setUpStartUpManager);




function setUpHttp($http) {
	$http.defaults.xsrfCookieName = 'csrftoken'
	$http.defaults.xsrfHeaderName = 'X-CSRFToken'
	$http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}


function setUpStartUpManager(startUpManager,
							 initialAuthCheckHandler,
							 observerInitialiser) {
	
	startUpManager.handlers = [initialAuthCheckHandler];
	startUpManager.completeHandlers = [observerInitialiser];
}