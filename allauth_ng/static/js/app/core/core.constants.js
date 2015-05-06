

angular
	.module('app.core.constants', [])
	.constant('apiEndpoints', apiEndpoints())
	
	
	
function apiEndpoints(){

	return Object.freeze({
		
		BASE: '/api/',
		USER: 'users/current/'
	})
}