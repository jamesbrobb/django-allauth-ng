(function(){
"use strict";
angular.module('app', [
    /* THIRD PARTY */
    'ui.router',
    'ng.django.forms',
    'django.messages',
    'toastr',
    /* APP */
    'app.common',
    'app.core',
    'app.allauth'
]);

angular
    .module('app')
    .run(setUpHttp)
    .run(setUpStartUpManager);




function setUpHttp($http) {
    $http.defaults.xsrfCookieName = 'csrftoken'
    $http.defaults.xsrfHeaderName = 'X-CSRFToken'
    $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}
setUpHttp.$inject = ["$http"];


function setUpStartUpManager(startUpManager,
    initialAuthCheckHandler,
    observerInitialiser) {

    startUpManager.handlers = [initialAuthCheckHandler];
    startUpManager.completeHandlers = [observerInitialiser];
}
setUpStartUpManager.$inject = ["startUpManager", "initialAuthCheckHandler", "observerInitialiser"];

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
configureSettings.$inject = ["startUpManagerProvider", "$urlMatcherFactoryProvider"];


function configure404Redirect($urlRouterProvider) {

    $urlRouterProvider.otherwise(function($injector, $location) {

        var $state = $injector.get("$state"),
            utils = $injector.get("routeStateUtils"),
            appStates = $injector.get("appStates"),
            current = $state.current;

        /*
         * this occurs when you enter the app without a #
         * so we guard against it causing a 404
         */
        if ($location.$$url !== '' &&
            $location.$$path !== '') {

            // display 404 message
        }

        if (utils.isRoot(current)) {

            $state.go(appStates.HOME);

        } else {

            $state.go(current);
        }

    });
}
configure404Redirect.$inject = ["$urlRouterProvider"];


function configureRoutes($stateProvider, $urlRouterProvider, appStates) {

    $stateProvider

    .state(appStates.ROOT, {
        url: '',
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

    .state(appStates.HOME, {
        url: '/',
        views: {
            '@': {
                templateUrl: 'partials/partial-home.html'
            }
        }
    })

    .state(appStates.LOGIN, {
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

    .state(appStates.REGISTER, {
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

    .state(appStates.VERIFY_EMAIL, {
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

    .state(appStates.FORGOTTEN, {
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

    .state(appStates.FORGOTTEN_DONE, {
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

    .state(appStates.PROFILE, {
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
configureRoutes.$inject = ["$stateProvider", "$urlRouterProvider", "appStates"];


function stateNameToURL(state) {
    state = state.split('.')
    state.shift();
    state = state.join('.');

    var ind = state.indexOf('.') + 1;
    var url = state.substring(ind);

    return state = '/' + url.split('.').join('/');
}

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
httpInterceptorConfiguration.$inject = ["responseErrorInterceptorProvider", "$httpProvider"];


function routeStateChangeObserverConfiguration(routeStateChangeObserverProvider) {

    routeStateChangeObserverProvider.responders = [

        'nextStateRedirectService',
        'stateAuthRequirementChecker'
    ];
}
routeStateChangeObserverConfiguration.$inject = ["routeStateChangeObserverProvider"];


function authServiceConfiguration(authServiceProvider) {

    authServiceProvider.responder = 'authResponderService';
    authServiceProvider.responsePreprocessor = 'authResponsePreProcessor';
}
authServiceConfiguration.$inject = ["authServiceProvider"];


function socialAuthServiceConfiguration(socialAuthServiceProvider) {

    socialAuthServiceProvider.responders = {
        login: 'socialLoginResponder'
    };
    socialAuthServiceProvider.ignoreFragments = ['/accounts/social/signup/'];
}
socialAuthServiceConfiguration.$inject = ["socialAuthServiceProvider"];


function authStateObserverConfiguration(authStateObserverProvider) {

    authStateObserverProvider.responders = ['authStateObserverRouteStateProcessor'];
}
authStateObserverConfiguration.$inject = ["authStateObserverProvider"];

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
toastrConfiguration.$inject = ["toastrConfig"];

angular.module('app.core', [
    'app.core.constants',
    'app.core.controllers',
    'app.core.models',
    'app.core.services',
    'app.core.signals',
    'app.core.http'
]);

angular
    .module('app.core.signals', [])
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

        scope.$on(userAuthEvents.USER_AUTHED, function(event) {
            handler();
        });
    }

    function userUnauthenticated() {

        $rootScope.$broadcast(userAuthEvents.USER_UNAUTHED);
    }

    function onUserUnauthenticated(scope, handler) {

        scope.$on(userAuthEvents.USER_UNAUTHED, function(event) {
            handler();
        });
    }
}
userAuthSignal.$inject = ["$rootScope", "userAuthEvents"];

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

        if (_isAuthenticated) {

            userService.get().then(function() {
                defer.resolve(true);
            });

        } else {

            defer.resolve(true);
        }

        return defer.promise;
    }
}
initialAuthCheckHandler.$inject = ["$q", "userService"];


function stateAuthRequirementChecker(UserModel,
    nextStateRedirectService,
    routeStateUtils,
    appStates) {

    return {
        processStateChange: processStateChange
    }

    /* ----------------------- */

    function processStateChange(toState, toParams, fromState, fromParams) {

        if (UserModel.authenticated) {

            if (_isAuthState(toState)) {

                // TODO - should this show a message?

                return _isRootState(fromState) ? appStates.PROFILE : fromState;
            }

        } else {

            if (_isRequiredAuthState(toState)) {

                nextStateRedirectService.next = toState.name;

                return appStates.LOGIN;
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
stateAuthRequirementChecker.$inject = ["UserModel", "nextStateRedirectService", "routeStateUtils", "appStates"];


function authStateObserverRouteStateProcessor($state,
    $urlRouter,
    routeStateUtils,
    appStates,
    nextStateRedirectService) {

    return {
        processAuthed: processAuthed,
        processUnAuthed: processUnAuthed
    }

    /* ------------------------- */

    function processAuthed() {

        if (_isRootState()) {

            $urlRouter.sync();

        } else if (_isAuthState()) {

            $state.go(nextStateRedirectService.next || appStates.PROFILE);
        }
    }

    function processUnAuthed() {

        if (_isRootState()) {

            $urlRouter.sync();

        } else if (_isRequiredAuthState()) {

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
authStateObserverRouteStateProcessor.$inject = ["$state", "$urlRouter", "routeStateUtils", "appStates", "nextStateRedirectService"];


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
observerInitialiser.$inject = ["authStateObserver", "routeStateChangeObserver", "messagesManager"];


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

        if (response.AUTHENTICATED) {

            return userService.get();

        } else {

            $state.go(appStates.VERIFY_EMAIL);
        }
    }

    function signupSuccess(response, form) {

        if (response.AUTHENTICATED) {

            return userService.get();

        } else {

            $state.go(appStates.VERIFY_EMAIL);
        }
    }

    function resetPasswordSuccess(response, form) {

        $state.go(appStates.FORGOTTEN_DONE);
    }

    function logoutSuccess(response) {
        userService.clear();
    }

    function formError(error, form) {
        if (error.data && error.data.form_errors) {
            djangoForm.setErrors(form, error.data.form_errors);
        } else {
            return error;
        }
    }
}
authResponderService.$inject = ["$state", "appStates", "userService", "notificationManager", "nextStateRedirectService", "djangoForm"];


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
        return userService.get();
    }

    function error(response) {
        notificationManager.notify('error', {
            title: 'Error',
            message: response
        });
    }

    function denied(response) {
        notificationManager.notify('warning', {
            title: 'Access Denied',
            message: response
        });
    }

    function closed(response) {
        notificationManager.notify('info', {
            title: 'Closed',
            message: response
        });
    }
}
socialLoginResponder.$inject = ["userService", "notificationManager", "nextStateRedirectService"];


function userService($rootScope,
    $http,
    UserModel,
    authStateObserver,
    apiEndpoints,
    userAuthSignal) {

    _initialise();

    return {
        get: get,
        clear: clear
    }

    /* ----------------------- */

    function get() {
        return $http.get(apiEndpoints.BASE + apiEndpoints.USER)
            .then(_handleResponse)
            .catch(_handleError);
    }

    function clear() {
        UserModel.clear();
    }

    function _initialise() {
        userAuthSignal.onUserAuthenticated($rootScope, _handleAuthentication);
        userAuthSignal.onUserUnauthenticated($rootScope, _handleUnauthentication);
    }

    function _handleResponse(response) {
        UserModel.setUser(response.data);
        return response;
    }

    function _handleError(error) {
        if (error.status === 403) {
            clear();
        }
    }

    function _handleAuthentication() {
        authStateObserver.processAuthed();
    }

    function _handleUnauthentication() {
        authStateObserver.processUnauthed();
    }
}
userService.$inject = ["$rootScope", "$http", "UserModel", "authStateObserver", "apiEndpoints", "userAuthSignal"];


function notificationManager(toastr) {

    return {
        notify: notify
    }

    /* ------------------ */

    function notify(type, note, options) {
        toastr[type](note.message, note.title, options);
    }
}
notificationManager.$inject = ["toastr"];


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

        for (; i < len; i++) {
            message = messages[i];
            notificationManager.notify(message.type, {
                message: message.message,
                title: message.type.charAt(0).toUpperCase() + message.type.slice(1)
            });
        }
    }
}
messagesManager.$inject = ["$rootScope", "notificationManager", "djangoMessagesSignal"];

angular
    .module('app.core.models', [])
    .factory('UserModel', UserModel);



function UserModel(userAuthSignal) {

    var _user;

    return {

        get authenticated() {
            return _user !== undefined;
        },
        get username() {
            return _user.username;
        },
        get email() {
            return _user.email;
        },
        get verified() {
            return _user.verified;
        },
        get hasPassword() {
            return !_user.social_only;
        },
        setUser: setUser,
        clear: clear
    }

    function setUser(data) {
        _user = data;
        userAuthSignal.userAuthenticated();
    }

    function clear() {
        _user = undefined;
        userAuthSignal.userUnauthenticated();
    }
}
UserModel.$inject = ["userAuthSignal"];

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
        if (response.status === 500) {
            notificationManager.notify(
                'error', {
                    title: 'Sorry, a server error occurred.',
                    message: 'Please try again.'
                }, {
                    closeButton: true,
                    timeOut: 10000
                });
        }
    }
}
server500ResponseHandler.$inject = ["notificationManager"];


function csrfResponseHandler(userService, notificationManager) {

    return {
        process: process
    }

    /* ---------------- */

    function process(response) {
        if (response.data && response.data.csrf) {
            userService.clear();

            notificationManager.notify(
                'error', {
                    title: 'Sorry, it appears your session has ended.',
                    message: 'Please refresh your browser.'
                }, {
                    closeButton: true,
                    timeOut: 10000
                });
        }
    }
}
csrfResponseHandler.$inject = ["userService", "notificationManager"];

angular
    .module('app.core.controllers', [])
    .controller('AppCtrl', AppCtrl)
    .controller('NavCtrl', NavCtrl)
    .controller('SignInCtrl', SignInCtrl)
    .controller('SignUpCtrl', SignUpCtrl)
    .controller('PasswordResetCtrl', PasswordResetCtrl)
    .controller('ProfileCtrl', ProfileCtrl)




function AppCtrl(initialAuthCheckHandler) {

    var vm = this;

    vm.initialize = function(isAuthenticated) {

        initialAuthCheckHandler.isAuthenticated = isAuthenticated;
    }
}
AppCtrl.$inject = ["initialAuthCheckHandler"];


function NavCtrl(UserModel) {

    var vm = this;

    vm.isAuthenticated = function() {
        return UserModel.authenticated;
    };
}
NavCtrl.$inject = ["UserModel"];


function SignInCtrl(authService) {

    var vm = this;

    vm.submit = function(data, form) {
        authService.login(data, form);
    };
}
SignInCtrl.$inject = ["authService"];


function SignUpCtrl(authService) {

    var vm = this;

    vm.submit = function(data, form) {
        authService.signup(data, form);
    };
}
SignUpCtrl.$inject = ["authService"];


function PasswordResetCtrl(authService) {

    var vm = this;

    vm.submit = function(data, form) {
        authService.resetPassword(data, form);
    };
}
PasswordResetCtrl.$inject = ["authService"];


function ProfileCtrl(UserModel) {

    var vm = this;

    vm.userProps = ['username', 'email', 'verified', 'hasPassword'];
    vm.user = UserModel;
}
ProfileCtrl.$inject = ["UserModel"];

angular
    .module('app.core.constants', [])
    .constant('apiEndpoints', apiEndpoints())



function apiEndpoints() {

    return Object.freeze({

        BASE: '/api/',
        USER: 'users/current/'
    })
}

})();