

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
			if(_handlers) {
				/*
				 * this is here to prevent circular dependencies on $http.
				 * 
				 * Which is caused by any handler having $http as a dependency.
				 */
				if(!_hasCreated)
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
			for(; i < len; i++) {
				_handlers[i].process(response);
			}
		}
	}
}


function formPostConfig() {
	
	return {
		create:create
	}
	
	/* ------------------ */
	
	function create() {
		return {
			transformRequest: serialize,
			headers: {'Content-Type':'application/x-www-form-urlencoded; charset=utf-8'}
		}
	}
	
	function serialize(data) {
		
		// If this is not an object, defer to native stringification.
		if ( ! angular.isObject( data ) ) {
			return( ( data === null ) ? "" : data.toString() );
		}
		 
		var buffer = [];
		 
		// Serialize each key in the object.
		for ( var name in data ) {
		 
			if ( ! data.hasOwnProperty( name ) ) {
				continue;
			}
		 
			var value = data[ name ];
		 
			buffer.push(
					encodeURIComponent( name ) +
					"=" +
					encodeURIComponent( ( value === null ) ? "" : value )
			);
		}

		// Serialize the buffer and clean it up for transportation.
		var source = buffer
		.join( "&" )
		.replace( /%20/g, "+" );
		 
		return( source );
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
			if(_responsePreprocessor)
				response = _responsePreprocessor.process(response, type);
			
			return response;
		}
		
		function _handleResponse(response, form, type, responseType){
			if(_hasResponder()) {
				var responseMethod = _getResponderFunction(type, responseType);
				if(responseMethod) {
					var res = responseMethod(response, form);
					if(res)
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
			if(angular.isFunction(method))
				return method;
			return null;
		}
		
	}
}