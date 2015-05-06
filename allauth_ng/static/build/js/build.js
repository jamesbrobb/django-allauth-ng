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


function authStateObserverConfiguration(userAuthEvents,
    authStateObserverProvider) {

    authStateObserverProvider.configureEvents(
        userAuthEvents.USER_AUTHED,
        userAuthEvents.USER_UNAUTHED
    );

    authStateObserverProvider.responders = ['authStateObserverRouteStateProcessor'];
}
authStateObserverConfiguration.$inject = ["userAuthEvents", "authStateObserverProvider"];

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
stateAuthRequirementChecker.$inject = ["UserModel", "nextStateRedirectService", "routeStateUtils", "appStates"];


function authStateObserverRouteStateProcessor($state, $urlRouter, routeStateUtils, appStates) {

    return {
        processAuthed: processAuthed,
        processUnAuthed: processUnAuthed
    }

    /* ------------------------- */

    function processAuthed() {

        if (_isRootState()) {

            $urlRouter.sync();

        } else if (_isAuthState()) {

            $state.go(appStates.PROFILE);
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
authStateObserverRouteStateProcessor.$inject = ["$state", "$urlRouter", "routeStateUtils", "appStates"];


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

            return userService
                .get()
                .then(nextStateRedirectService.go);
        } else {

            $state.go(appStates.VERIFY_EMAIL);
        }
    }

    function signupSuccess(response, form) {

        if (response.AUTHENTICATED) {

            return userService
                .get()
                .then(nextStateRedirectService.go);
        } else {

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
        return userService.get()
            .then(_notifySocialComplete)
            .then(nextStateRedirectService.go);
    };

    function error(response) {
        notificationManager.notify('error', {
            title: 'Error',
            message: response
        });
    };

    function denied(response) {
        notificationManager.notify('warning', {
            title: 'Access Denied',
            message: response
        });
    };

    function closed(response) {
        notificationManager.notify('info', {
            title: 'Closed',
            message: response
        });
    };

    function _notifySocialComplete() {
        //notificationManager.notify('info', socialMessages.SIGNUP_COMPLETE)
    }
}
socialLoginResponder.$inject = ["userService", "notificationManager", "nextStateRedirectService"];


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
        if (error.status === 403) {
            clear();
        }
    };
}
userService.$inject = ["$http", "UserModel", "apiEndpoints"];


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
(function(){
"use strict";
angular.module('app.allauth', [
    'app.allauth.constants',
    'app.allauth.services',
    'app.allauth.directives'
]);

angular
    .module('app.allauth.services', [
        'app.allauth.constants',
        'app.common',
    ])
    .provider('authService', authService)
    .provider('socialAuthService', socialAuthService)
    .factory('authResponsePreProcessor', authResponsePreProcessor)




function authService() {

    var _endpoints,
        _responder,
        _responsePreprocessor;

    $get.$inject = ["dependencyResolver", "formServiceFactory", "formServiceResponderFactory", "authEndpoints"];
    return {
        /**
         * @param value Object literal containing the optional values:
         *
         * BASE
         * LOGIN
         * SIGNUP
         * PASSWORD_RESET
         * LOGOUT
         */
        set endpoints(value) {
            _endpoints = value;
        },
        /**
         * @param value The string name of a service to process the response object
         *
         *  It should implement the following optional interface
         *
         *  - type + Success - i.e loginSuccess
         *  - type + Error - i.e loginError
         *
         * or the generic response handlers
         *
         * - formSuccess
         * - formError
         *
         * Types are as follows:
         *
         * - login
         * - signUp
         * - resetPassword
         * - logout
         *
         * The signature for all methods is:
         *
         *  methodName(response, form)
         *
         */
        set responder(value) {
            _responder = value;
        },
        /**
         * @param value The string name of a service to preprocess the response object
         *
         *  It should implement the following interface
         *
         *  - process(response, type);
         */
        set responsePreprocessor(value) {
            _responsePreprocessor = value;
        },
        $get: $get
    }


    function $get(dependencyResolver, formServiceFactory, formServiceResponderFactory, authEndpoints) {

        var _service;

        _configureResponder();
        _configureResponsePreprocessor();
        _configureEndpoints();
        _initialiseService();

        return {
            login: login,
            signup: signup,
            resetPassword: resetPassword,
            logout: logout
        }

        /* ===================================== */

        function login(data, form) {

            return _service.post(
                _endpoints.LOGIN,
                data,
                form,
                'login'
            );
        }

        function signup(data, form) {

            return _service.post(
                _endpoints.SIGNUP,
                data,
                form,
                'signup'
            );
        }

        function resetPassword(data, form) {

            return _service.post(
                _endpoints.PASSWORD_RESET,
                data,
                form,
                'resetPassword'
            );
        }

        function logout() {

            return _service.post(
                _endpoints.LOGOUT, {}, {},
                'logout'
            );
        }

        /* ===================================== */

        function _configureResponder() {
            if (_responder) {
                _responder = dependencyResolver.resolve(
                    _responder,
                    'AuthService::Configuring responder: There is no %dependency% service'
                );
            }
        }

        function _configureResponsePreprocessor() {
            if (_responsePreprocessor) {
                var name = _responsePreprocessor;
                _responsePreprocessor = dependencyResolver.resolve(
                    _responsePreprocessor,
                    'AuthService::Configuring response preprocessor: There is no %dependency% service'
                );
                if (!angular.isFunction(_responsePreprocessor.process))
                    throw new Error('The ' + name + ' preprocessor does not implement a \'process\' method');
            }
        }

        function _configureEndpoints() {
            _endpoints = angular.extend({}, authEndpoints, _endpoints);
        }

        function _initialiseService() {
            var service = formServiceFactory.getInstance();
            service.baseURL = _endpoints.BASE;

            _service = formServiceResponderFactory.getInstance(service);
            _service.responder = _responder;
            _service.responsePreprocessor = _responsePreprocessor;
        }
    }
}


function socialAuthService() {

    var _responders,
        _ignoreFragments;

    $get.$inject = ["$q", "dependencyResolver", "popupService", "extractQueryParams"];
    return {
        /**
         * @param value An object literal whose keys represent
         * the process type - login or connect - and whose
         * values are the names of the responders to process that type
         *
         * e.g
         *
         * {
         * 	   login: 'myLoginResponderService',
         *	   connect: 'myConnectResponderService'
         * {
         *
         * Responders should implement the following interface
         *
         *  - error(response)
         *  - denied(response)
         *  - closed(response)
         *  - success(response)
         *
         */
        set responders(value) {
            _responders = value;
        },
        /**
         * @param value A string url fragment or array of string fragments,
         * that prevent the pop up auth window from being processed
         * and therefore closed
         *
         * e.g '/accounts/login/'
         */
        set ignoreFragments(value) {
            _ignoreFragments = _ignoreFragments || []
            _ignoreFragments = _ignoreFragments.concat(value);
        },
        $get: $get
    }

    function $get($q, dependencyResolver, popupService, extractQueryParams) {

        var _responder;

        return {
            open: open
        }

        /* ====================== */

        function open(url, processType, width, height) {

            _responder = _configureResponder(processType);

            return popupService.open(
                url,
                width || 1000,
                height || 600,
                _ignoreFragments,
                true)

            .then(_handleResponse)
                .catch(_handleError);
        }


        function _configureResponder(type) {
            if (_responders && _responders[type]) {
                return dependencyResolver.resolve(
                    _responders[type],
                    'SocialAuthService::Configuring responders: There is no %dependency% service'
                );
            }
        }

        function _handleResponse(response) {

            if (_responder) {

                var params = extractQueryParams(response);

                if (_windowClosed(response)) {

                    _responder.closed('The social auth window was closed before authentication was completed.');

                } else if (_hasError(response, params)) {

                    _handleError('An error occurred while attempting to login via your social network account.');

                } else if (_accessDenied(response, params)) {

                    _responder.denied(response);

                } else {

                    _responder.success(response);
                }
            }

            return response;
        }

        function _handleError(error) {

            if (_responder)
                _responder.error(error);

            return $q.reject(error);
        }

        function _windowClosed(response) {
            return response === 'closed';
        }

        function _hasError(response, params) {

            /*
             * TODO - check out other possible error values
             */
            var error = params.error || params.error_message;

            return ((error && error !== 'access_denied') || response.indexOf('login/error/') !== -1);
        }

        function _accessDenied(response, params) {

            var error = params.error

            //occurs through OAuth2 signup when the user chooses not to accept
            if (error === 'access_denied')
                return true;

            //occurs through OAuth1 signup when the user chooses not to accept
            if (response.indexOf('login/cancelled/') !== -1)
                return true;

            return false;
        }
    }
}


function authResponsePreProcessor(authRedirects) {

    return {
        process: process
    }

    /* ====================== */

    function process(response, type) {

        if (response.status >= 400)
            return _processError(response, type);

        return _processSuccess(response, type);
    }

    function _processSuccess(response, type) {

        if (response.data) {

            var loc = response.data.location;

            if (loc) {

                response = {};

                switch (loc) {

                    case authRedirects.HOME:

                        if (type === 'logout')
                            response.AUTHENTICATED = false;

                        break;

                    case authRedirects.PROFILE:

                        if (['login', 'signup'].indexOf(type) != -1)
                            response.AUTHENTICATED = true;

                        break;

                    case authRedirects.CONFIRM_EMAIL:

                        response.CONFIRM = true;
                        break;

                    case authRedirects.PASSWORD_RESET_DONE:

                        response.RESET_DONE = true;
                        break;
                }
            }
        }

        return response;
    }

    function _processError(response, type) {

        return response;
    }
}
authResponsePreProcessor.$inject = ["authRedirects"];

angular
    .module('app.allauth.directives', [
        'app.allauth.services'
    ])
    .directive('logoutBtn', logoutBtn)
    .controller('LogoutBtnCtrl', LogoutBtnCtrl)
    .directive('socialAuthBtn', socialAuthBtn)
    .controller('SocialAuthBtnCtrl', SocialAuthBtnCtrl);




function logoutBtn() {
    return {
        restrict: "A",
        controller: 'LogoutBtnCtrl',
        link: function($scope, $element, $attrs, ctrl) {

            function clickHandler() {
                ctrl.logout();
            }

            $element.bind("click", clickHandler);

            $element.on('$destroy', function() {
                $element.unbind("click", clickHandler);
            });
        }
    }
}


function LogoutBtnCtrl(authService) {

    var vm = this;

    vm.logout = function() {
        authService.logout();
    };
}
LogoutBtnCtrl.$inject = ["authService"];


function socialAuthBtn() {
    return {
        restrict: 'A',
        controller: 'SocialAuthBtnCtrl',
        link: function($scope, $element, $attrs, ctrl) {

            function clickHandler() {
                ctrl.open($attrs.socialAuthBtn, $attrs.socialAuthType);
            }

            $element.bind("click", clickHandler);

            $element.on('$destroy', function() {
                $element.unbind("click", clickHandler);
            });
        }
    }
}


function SocialAuthBtnCtrl(socialAuthService) {

    var vm = this;

    vm.open = function(url, type) {
        socialAuthService.open(url, type);
    };
}
SocialAuthBtnCtrl.$inject = ["socialAuthService"];

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

})();
(function(){
"use strict";
angular.module('app.common', [
    'app.common.http',
    'app.common.router',
    'app.common.services',
    'app.common.utils'
]);

angular
    .module('app.common.utils', [])
    .factory('objectUtils', objectUtils)
    .factory('formUtils', formUtils)
    .factory('routeStateUtils', routeStateUtils)
    .factory('dependencyResolver', dependencyResolver)
    .factory('extractQueryParams', extractQueryParams)





function objectUtils() {

    return {
        isPromise: isPromise,
        isHttpPromise: isHttpPromise
    }

    /* ---------------- */

    function isPromise(obj) {
        return (!!obj.then && typeof obj.then === 'function') &&
            (!!obj.catch && typeof obj.catch === 'function') &&
            (!!obj.finally && typeof obj.finally === 'function');
    }

    function isHttpPromise(obj) {
        return isPromise(obj) &&
            (!!obj.success && typeof obj.success === 'function') &&
            (!!obj.error && typeof obj.error === 'function');

    }
}


function formUtils() {

    return {
        isControl: isControl
    }

    function isControl(value, prop) {
        if (!angular.isObject(value))
            return false;

        if (prop &&
            prop.indexOf('$$') === 0)
            return false;

        return (!!value.$setPristine && typeof value.$setPristine === 'function') &&
            (!!value.$rollbackViewValue && typeof value.$rollbackViewValue === 'function') &&
            (!!value.$commitViewValue && typeof value.$commitViewValue === 'function');
    }
}


function routeStateUtils() {

    return {
        isRoot: isRoot
    }

    function isRoot(state) {
        return state.name === "" && state.url === '^' && state.abstract;
    }
}


function dependencyResolver($injector) {

    return {
        resolve: resolve
    }

    /**
     * @param dependency A string
     */
    function resolve(dependency, message) {
        if (angular.isArray(dependency))
            return _resolveMultiple(dependency, message);

        return _resolve(dependency, message)
    }

    function _resolveMultiple(dependencies, message) {
        var i = 0,
            len = dependencies.length,
            res = [];

        for (; i < len; i++) {
            res.push(_resolve(dependencies[i], message));
        }

        return res;
    }

    function _resolve(dependency, message) {
        if ($injector.has(dependency)) {
            return angular.isString(dependency) ? $injector.get(dependency) : $injector.invoke(dependency);
        } else {
            throw new Error(message.replace('%dependency%', dependency));
        }
    }
}
dependencyResolver.$inject = ["$injector"];


function extractQueryParams() {

    function extract(url) {
        if (url.indexOf("?") === -1)
            return {};

        var queryParams = {};
        var queryParamsString = url.split('?')[1];
        var queryParamsArray = queryParamsString.split("&");
        var i = 0,
            len = queryParamsArray.length,
            keyValue;

        for (; i < len; i++) {
            keyValue = queryParamsArray[i].split("=");
            queryParams[keyValue[0]] = keyValue[1];
        }

        return queryParams;
    }

    return extract
}

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

    $get.$inject = ["dependencyResolver", "$rootScope"];
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
            if (_responders) {
                _responders = dependencyResolver.resolve(
                    _responders,
                    'authStateObserver::Configuring responder: There is no %dependency% service'
                );
            }
        }

        function _processResponders(fn) {
            if (_responders) {
                var i = 0,
                    len = _responders.length,
                    responder,
                    ret;

                for (; i < len; i++) {
                    responder = _responders[i];
                    if (angular.isFunction(responder[fn])) {
                        ret = responder[fn]();
                        if (ret)
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
        if (!domain)
            return;

        if (domain === true) {

            $window.document.domain = $location.host().replace("www.", "");

        } else {

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
        if (!popup) {
            deferred.reject('error');
            cleanUp();
            return;
        }

        /*
         * The user has closed the popup
         */
        if (popup && popup.closed) {
            deferred.resolve('closed');
            cleanUp();
            return;
        }

        try {

            var href = popup.location.href;
            console.log('href: ', href)
            if (popupIsComplete(href)) {
                //a redirect has occurred
                deferred.resolve(href);
                popup.close();
                cleanUp();
                return;
            }

        } catch (err) {
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

        for (; i < len; i++) {
            if (url.indexOf(ignore_frags[i]) !== -1)
                return false
        }

        return true
    }

    function cleanUp() {
        popup = null;
        deferred = null;
    }
}
popupService.$inject = ["$window", "$document", "$location", "$timeout", "$q"];

angular
    .module('app.common.router', [
        'app.common.utils',
        'ui.router'
    ])
    .provider('startUpManager', startUpManager)
    .provider('routeStateChangeObserver', routeStateChangeObserver)
    .factory('nextStateRedirectService', nextStateRedirectService)




/**
 *
 * @param $q
 * @param $rootScope
 * @param $urlRouter
 *
 * Listens for initial $stateChangeStart event and calls prevent default
 * to stop navigation.
 *
 * Once all supplied handlers have been resolved, $urlRouter.sync()
 * is called to continue
 *
 */

function startUpManager($urlRouterProvider) {

    var _activated = false;

    $get.$inject = ["$q", "$rootScope", "$urlRouter"];
    return {
        activate: activate,
        $get: $get
    }

    /* ---------------------- */

    function activate() {

        if (_activated)
            return;

        _activated = true;

        $urlRouterProvider.deferIntercept();
    }

    function $get($q, $rootScope, $urlRouter) {

        var _listener,
            _handlers,
            _completeHandlers;

        if (_activated)
            _initialise();

        return {
            /**
             *
             */
            set handlers(value) {
                _handlers = _handlers || [];
                _handlers = _handlers.concat(value);
            },
            /**
             *
             */
            set completeHandlers(value) {
                _completeHandlers = _completeHandlers || [];
                _completeHandlers = _completeHandlers.concat(value);
            }
        }

        /* ---------------- */

        function _initialise() {

            _listener = $rootScope.$on('$locationChangeSuccess', _initialLocationChangeHandler);
            $urlRouter.listen();
        }

        function _initialLocationChangeHandler(event) {

            _removeListener();

            event.preventDefault();

            if (_handlers) {

                var promises = _executeHandlers();

                $q.all(promises).then(function() {
                    _complete();
                })

            } else {

                _complete();
            }
        }

        function _removeListener() {
            _listener();
        }

        function _executeHandlers() {

            var i = 0,
                len = _handlers.length,
                promises = [],
                sequence,
                handler;

            for (; i < len; i++) {

                handler = _handlers[i];

                if (handler.sequential) {

                    sequence = sequence ? sequence.then(handler.run) : handler.run();

                } else {

                    promises.push(handler.run());
                }
            }

            if (sequence)
                promises.push(sequence);

            return promises;
        }

        function _complete() {

            if (_completeHandlers) {

                var i = 0,
                    len = _completeHandlers.length;

                for (; i < len; i++) {
                    _completeHandlers[i].run();
                }
            }

            $urlRouter.sync();
        }
    }
}
startUpManager.$inject = ["$urlRouterProvider"];


function routeStateChangeObserver() {

    var _responders;

    $get.$inject = ["$rootScope", "$state", "dependencyResolver"];
    return {
        /**
         * @param value
         *
         * A responder object or array of responder objects implementing the following interface:
         *
         * - processStateChange(toState, toParams, fromState, fromParams)
         *
         * Which should return either:
         *
         *  - a string value representing a valid state name to transition to
         *  - a valid state object
         *  - an object literal with the following properties
         *
         *     - {name: string, params: string}
         */
        set responders(value) {
            _responders = _responders || []
            _responders = _responders.concat(value);
        },
        $get: $get
    }

    /* -------------------------- */

    function $get($rootScope, $state, dependencyResolver) {

        return {
            initialise: initialise
        }

        /* -------------------------- */

        function initialise() {

            _configureResponders();

            $rootScope.$on(
                '$stateChangeStart',
                _processChange
            );
        }

        function _configureResponders() {
            if (_responders) {
                _responders = dependencyResolver.resolve(
                    _responders,
                    'routeStateChangeObserver::Configuring responder: There is no %dependency% service'
                );
            }
        }

        function _processChange(event, toState, toParams,
            fromState, fromParams) {

            if (event.defaultPrevented ||
                !_responders ||
                _responders.length === 0)
                return;

            var i = 0,
                len = _responders.length,
                responder,
                response;

            for (; i < len; i++) {
                responder = _responders[i];
                response = responder.processStateChange(toState,
                    toParams,
                    fromState,
                    fromParams);
                if (_responseIsValid(response)) {

                    event.preventDefault();

                    if (_containsName(response)) {
                        $state.go(response.name, response.params);
                    } else {
                        $state.go(response);
                    }

                    break;
                }
            }
        }

        function _responseIsValid(state) {

            if (angular.isString(state))
                return true;

            if (_containsName(state))
                return true;

            return false
        }

        function _containsName(obj) {
            return angular.isObject(obj) && obj.name;
        }
    }
}


function nextStateRedirectService($state) {

    var _next;

    return {
        set next(value) {
            _next = value;
        },
        processStateChange: processStateChange,
        go: go
    }

    /* ---------------- */

    function processStateChange(toState, toParams, fromState, fromParams) {
        _clear();
    }

    function go() {
        if (_next && $state.current.name !== _next) {
            $state.go(_next);
        }
        _clear();
    }

    function _clear() {
        _next = null;
    }
}
nextStateRedirectService.$inject = ["$state"];

angular
    .module('app.common.http', [
        'app.common.utils'
    ])
    .provider('responseErrorInterceptor', responseErrorInterceptor)
    .factory('formPostConfig', formPostConfig)
    .factory('formServiceFactory', formServiceFactory)
    .factory('formServiceResponderFactory', formServiceResponderFactory)




function responseErrorInterceptor() {

    var _handlers,
        _hasCreated = false;

    $get.$inject = ["dependencyResolver", "$q"];
    return {
        /**
         * @param handler The name of a service to be resolved by the $injector
         *
         * The service must implement the interface
         *
         * - process(response)
         */
        set handlers(value) {
            _handlers = _handlers || [];
            _handlers = _handlers.concat(value);
        },
        $get: $get
    }

    /* ---------------------- */

    function $get(dependencyResolver, $q) {

        return {

            responseError: responseError
        }

        /* ---------------------- */

        function responseError(response) {
            if (_handlers) {
                /*
                 * this is here to prevent circular dependencies on $http.
                 *
                 * Which is caused by any handler having $http as a dependency.
                 */
                if (!_hasCreated)
                    _createHandlers();

                _processHandlers(response);
            }

            return $q.reject(response);
        }

        function _createHandlers() {
            _handlers = dependencyResolver.resolve(_handlers);
            _hasCreated = true;
        }

        function _processHandlers(response) {
            var i = 0,
                len = _handlers.length;
            for (; i < len; i++) {
                _handlers[i].process(response);
            }
        }
    }
}


function formPostConfig() {

    return {
        create: create
    }

    /* ------------------ */

    function create() {
        return {
            transformRequest: serialize,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            }
        }
    }

    function serialize(data) {

        // If this is not an object, defer to native stringification.
        if (!angular.isObject(data)) {
            return ((data === null) ? "" : data.toString());
        }

        var buffer = [];

        // Serialize each key in the object.
        for (var name in data) {

            if (!data.hasOwnProperty(name)) {
                continue;
            }

            var value = data[name];

            buffer.push(
                encodeURIComponent(name) +
                "=" +
                encodeURIComponent((value === null) ? "" : value)
            );
        }

        // Serialize the buffer and clean it up for transportation.
        var source = buffer
            .join("&")
            .replace(/%20/g, "+");

        return (source);
    }
}


function formServiceFactory($http, formPostConfig) {

    return {
        getInstance: function() {
            return new FormService($http, formPostConfig);
        }
    }

    /* --------------------- */

    function FormService($http, formPostConfig) {

        var _baseURL;

        return {
            set baseURL(value) {
                _baseURL = value;
            },
            post: post
        }

        /* ------------- */

        function post(slug, data) {

            return $http.post(
                (_baseURL || '') + slug,
                data,
                formPostConfig.create());
        }
    }
}
formServiceFactory.$inject = ["$http", "formPostConfig"];


function formServiceResponderFactory($q) {

    return {
        /**
         * @param service An object that implements a <code>post</code> method
         * that returns a promise and has the following signature:
         *
         * post(url, data)
         */
        getInstance: function(service) {
            return new FormServiceResponder($q, service);
        }
    }

    /* --------------------- */

    function FormServiceResponder($q, service) {

        var _service = service,
            _responder,
            _responsePreprocessor;

        return {

            set responder(value) {
                _responder = value;
            },
            set responsePreprocessor(value) {
                _responsePreprocessor = value;
            },
            post: post
        }

        /* --------------------- */

        function post(endpoint, data, form, type) {

            form.submitting = true;

            return _service.post(
                    endpoint,
                    data
                )
                .then(function(response) {

                    form.submitting = false;

                    return _handleResponse(
                        _preProcessResponse(response, type),
                        form,
                        type,
                        'Success'
                    );
                })
                .catch(function(error) {

                    form.submitting = false;

                    return $q.reject(
                        _handleResponse(
                            _preProcessResponse(error, type),
                            form,
                            type,
                            'Error'
                        )
                    );
                });
        }

        function _preProcessResponse(response, type) {
            if (_responsePreprocessor)
                response = _responsePreprocessor.process(response, type);

            return response;
        }

        function _handleResponse(response, form, type, responseType) {
            if (_hasResponder()) {
                var responseMethod = _getResponderFunction(type, responseType);
                if (responseMethod) {
                    var res = responseMethod(response, form);
                    if (res)
                        return res;
                }
            }
            return response
        }

        function _hasResponder() {
            return _responder !== undefined && _responder !== null;
        }

        function _getResponderFunction(type, responseType) {
            var method = _responder[type + responseType] || _responder['form' + responseType]
            if (angular.isFunction(method))
                return method;
            return null;
        }

    }
}
formServiceResponderFactory.$inject = ["$q"];

})();