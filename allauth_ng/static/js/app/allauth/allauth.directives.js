


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
			
			$element.on('$destroy', function(){
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


function socialAuthBtn() {
	return {
		restrict: 'A',
		controller: 'SocialAuthBtnCtrl',
		link: function($scope, $element, $attrs, ctrl) {
			
			function clickHandler() {
				ctrl.open($attrs.socialAuthBtn, $attrs.socialAuthType);
			}
			
			$element.bind("click", clickHandler);
			
			$element.on('$destroy', function(){
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


