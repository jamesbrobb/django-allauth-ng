


angular
	.module('app.allauth.constants', [])
	.constant('authEndpoints', authEndpoints())
	.constant('authRedirects', authRedirects())




function authEndpoints() {
	
	return Object.freeze({
	
		BASE: '/accounts/',
		LOGIN: 'login/',
		SIGNUP: 'signup/',
		PASSWORD_RESET: 'password/reset/',
		LOGOUT: 'logout/'
	});
}


function authRedirects() {
	
	return Object.freeze({
		
		HOME: '/',
		PROFILE: '/accounts/profile/',
		CONFIRM_EMAIL: '/accounts/confirm-email/',
		PASSWORD_RESET_DONE: '/accounts/password/reset/done/'
	});
}








