

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
	
	return {
		activate: activate,
		$get: $get
	}
	
	/* ---------------------- */
	
	function activate() {
		
		if(_activated)
			return;
		
		_activated = true;
		
		$urlRouterProvider.deferIntercept();
	}

	function $get($q, $rootScope, $urlRouter) {
		
		var _listener,
			_handlers,
			_completeHandlers;
		
		if(_activated)
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
			
			if(_handlers) {
				
				var promises = _executeHandlers();
				
				$q.all(promises).then(function() {
					_complete();
				})
				
			}else{
				
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
		
			for(; i < len; i++) {
				
				handler = _handlers[i];
				
				if(handler.sequential) {
					
					sequence = sequence ? sequence.then(handler.run) : handler.run();
					
				}else{
					
					promises.push(handler.run());
				}
			}
			
			if(sequence)
				promises.push(sequence);
			
			return promises;
		}
		
		function _complete() {
			
			if(_completeHandlers) {
				
				var i = 0,
					len = _completeHandlers.length;
				
				for(; i < len; i++) {
					_completeHandlers[i].run();
				}
			}
			
			$urlRouter.sync();
		}
	}
}


function routeStateChangeObserver() {
	
	var _responders;
	
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
			if(_responders) {
				_responders = dependencyResolver.resolve(
					_responders,
					'routeStateChangeObserver::Configuring responder: There is no %dependency% service'
				);
			}
		}
		
		function _processChange(event, toState, toParams,
								fromState, fromParams) {
			
			if(event.defaultPrevented ||
			   !_responders ||
			   _responders.length === 0)
				return;
			
			var i = 0,
				len = _responders.length,
				responder,
				response;
			
			for(; i < len; i++) {
				responder = _responders[i];
				response = responder.processStateChange(toState,
														toParams,
														fromState,
														fromParams);
				if(_responseIsValid(response)) {
					
					event.preventDefault();
					
					if(_containsName(response)) {
						$state.go(response.name, response.params);
					}else{
						$state.go(response);
					}
					
					break;
				}
			}
		}
		
		function _responseIsValid(state) {
			
			if(angular.isString(state))
				return true;
			
			if(_containsName(state))
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
		if(_next && $state.current.name !== _next) {
			$state.go(_next);
		}
		_clear();
	}
	
	function _clear() {
		_next = null;
	}
}
