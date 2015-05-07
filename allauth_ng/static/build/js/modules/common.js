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

    var _responders;

    $get.$inject = ["dependencyResolver", "$rootScope"];
    return {

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

    function $get(dependencyResolver, $rootScope) {

        return {
            initialise: initialise,
            processAuthed: processAuthed,
            processUnauthed: processUnauthed
        }

        /* --------------------- */

        function initialise() {

            _configureResponders();
        }

        function processAuthed() {
            _processResponders('processAuthed');
        }

        function processUnauthed() {
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


function nextStateRedirectService() {

    var _next;

    return {
        set next(value) {
            _next = value;
        },
        get next() {
            return _next;
        },
        processStateChange: processStateChange
    }

    /* ---------------- */

    function processStateChange(toState, toParams, fromState, fromParams) {
        _next = null;
    }
}

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