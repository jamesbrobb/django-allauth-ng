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