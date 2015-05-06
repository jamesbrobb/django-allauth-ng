

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
		if(!angular.isObject(value))
			return false;
		
		if(prop &&
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
		if(angular.isArray(dependency))
			return _resolveMultiple(dependency, message);
		
		return _resolve(dependency, message)
	}
	
	function _resolveMultiple(dependencies, message) {
		var i = 0,
			len = dependencies.length,
			res = [];
		
		for(; i < len; i++) {
			res.push(_resolve(dependencies[i], message));
		}
		
		return res;
	}
	
	function _resolve(dependency, message) {
		if($injector.has(dependency)) {
			return angular.isString(dependency) ? $injector.get(dependency) : $injector.invoke(dependency);
		}else{
			throw new Error(message.replace('%dependency%', dependency));
		}
	}
}


function extractQueryParams() {
	
	function extract( url ) {		
		if (url.indexOf( "?" ) === -1)
			return {};
		
		var queryParams = {};
		var queryParamsString = url.split('?')[ 1 ];
		var queryParamsArray = queryParamsString.split("&");
		var	i = 0,
			len = queryParamsArray.length,
			keyValue;
		
		for (; i < len; i++) {
			keyValue = queryParamsArray[i].split( "=" );
			queryParams[keyValue[0]] = keyValue[1];	
		}
		
		return queryParams;
	}
	
	return extract
}



