

angular
	.module('app.core.http', [])
	.factory('server500ResponseHandler', server500ResponseHandler)
	.factory('csrfResponseHandler', csrfResponseHandler)
	
	

function server500ResponseHandler(notificationManager) {
	
	return {
		process: process
	}
	
	/* ---------------- */
	
	function process(response) {
		if(response.status === 500) {
			notificationManager.notify(
					'error',
					{
						title: 'Sorry, a server error occurred.',
						message: 'Please try again.'
					},
					{closeButton: true, timeOut:10000});
		}
	}
}


function csrfResponseHandler(userService, notificationManager) {
	
	return {
		process: process
	}
	
	/* ---------------- */
	
	function process(response) {
		if(response.data && response.data.csrf) {
			userService.clear();
			
			notificationManager.notify(
					'error',
					{
						title: 'Sorry, it appears your session has ended.',
						message: 'Please refresh your browser.'
					},
					{closeButton: true, timeOut:10000});
		}
	}
}