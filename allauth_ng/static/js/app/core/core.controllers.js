
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


function NavCtrl(UserModel) {
	
	var vm = this;
	
	vm.isAuthenticated = function() {
		return UserModel.authenticated;
	};
}


function SignInCtrl(authService) {
	
	var vm = this;
	
	vm.submit = function(data, form) {
		authService.login(data, form);
	};
}


function SignUpCtrl(authService) {
	
	var vm = this;
	
	vm.submit = function(data, form) {
		authService.signup(data, form);
	};
}


function PasswordResetCtrl(authService) {
	
	var vm = this;
	
	vm.submit = function(data, form) {
		authService.resetPassword(data, form);
	};
}


function ProfileCtrl(UserModel) {
	
	var vm = this;
	
	vm.userProps = ['username', 'email', 'verified', 'hasPassword'];	
	vm.user = UserModel;
}

