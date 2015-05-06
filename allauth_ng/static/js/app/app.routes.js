


angular
	.module('app')
	.constant('appStates', appStates())
	.config(configureSettings)
	.config(configure404Redirect)
	.config(configureRoutes)

	
	
	
function appStates() {
	
	return Object.freeze({
		
		ROOT: 'app',
		HOME: 'app.home',
		LOGIN: 'app.login',
		REGISTER: 'app.register',		
		VERIFY_EMAIL: 'app.verify',
		FORGOTTEN: 'app.forgotten',
		FORGOTTEN_DONE: 'app.forgotten.done',
		PROFILE: 'app.profile'
	});
}


function configureSettings(startUpManagerProvider,
						   $urlMatcherFactoryProvider) {
	
	startUpManagerProvider.activate();
	
	$urlMatcherFactoryProvider.caseInsensitive(true);
	$urlMatcherFactoryProvider.strictMode(false);
}


function configure404Redirect($urlRouterProvider) {
	
	$urlRouterProvider.otherwise(function($injector, $location) {
		
		var $state = $injector.get("$state"),
			utils = $injector.get("routeStateUtils"),
			appStates = $injector.get("appStates"),
			current = $state.current;

		/*
		 * this occurs when you enter the app without a #
		 */
		if( $location.$$url !== '' &&
			$location.$$path !== '' ) {
			
			// display 404 message
		} 
		
		if(utils.isRoot(current)) {
			
			$state.go(appStates.HOME);
			
		}else{
			
			$state.go(current);
		}
		
	});
}


function configureRoutes($stateProvider, $urlRouterProvider, appStates) {
	
	$stateProvider
	
		.state( appStates.ROOT, {
			url:'',
			abstract: true,
			views: {
				'header': {
					templateUrl: 'partials/partial-header-view.html',
					controller: 'NavCtrl',
					controllerAs: 'navCtrl'
				},
				'footer': {
					templateUrl: 'partials/partial-footer-view.html',
				}
			}
		})
	
		.state( appStates.HOME, {
				url: '/',
				views: {
					'@': {
						templateUrl: 'partials/partial-home.html'
					}
				}
		})
		
		.state( appStates.LOGIN, {
				url: stateNameToURL(appStates.LOGIN),
				data: {
					isAuthState: true
				},
				views: {
					'@': {
						templateUrl: 'partials/partial-login.html',
						controller: 'SignInCtrl',
						controllerAs: 'signinCtrl'
					}
				}
		})
		
		.state( appStates.REGISTER, {
				url: stateNameToURL(appStates.REGISTER),
				data: {
					isAuthState: true
				},
				views: {
					'@': {
						templateUrl: 'partials/partial-signup.html',
						controller: 'SignUpCtrl',
						controllerAs: 'signupCtrl'
					}
				}
		})
		
		.state( appStates.VERIFY_EMAIL, {
			url: stateNameToURL(appStates.VERIFY_EMAIL),
			data: {
				isAuthState: true
			},
			views: {
				'@': {
					templateUrl: 'partials/partial-verify-email.html'
				}
			}
		})
		
		.state( appStates.FORGOTTEN, {
				url: stateNameToURL(appStates.FORGOTTEN),
				data: {
					isAuthState: true
				},
				views: {
					'@': {
						templateUrl: 'partials/partial-password-reset.html',
						controller: 'PasswordResetCtrl',
						controllerAs: 'pResetCtrl'
					}
				}
		})
		
		.state( appStates.FORGOTTEN_DONE, {
				url: stateNameToURL(appStates.FORGOTTEN_DONE),
				data: {
					isAuthState: true
				},
				views: {
					'@': {
						templateUrl: 'partials/partial-password-reset-done.html'
					}
				}
		})
		
		.state( appStates.PROFILE, {
				url: stateNameToURL(appStates.PROFILE),
				data: {
					requiresAuth: true
				},
				views: {
					'@': {
						templateUrl: 'partials/partial-profile.html',
						controller: 'ProfileCtrl',
						controllerAs: 'profCtrl'
					}
				}
		})
}


function stateNameToURL(state) {
	state = state.split('.')
	state.shift();
	state = state.join('.');
	
	var ind = state.indexOf('.') + 1;
	var url = state.substring(ind);

	return state = '/' + url.split('.').join('/');
}



