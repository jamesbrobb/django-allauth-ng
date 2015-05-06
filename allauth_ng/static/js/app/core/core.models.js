

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