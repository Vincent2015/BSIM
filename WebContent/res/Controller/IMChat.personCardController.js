angular.module('IMChat.personCardController', ["IMChat.ChatHistory.ServiceV2"])

.controller('personcardController', ['$rootScope', '$scope', 'personService', 'followService', '_', '$stateParams', '$state', "IMChathistoryServiceV2", function($rootScope, $scope, personService, followService, _, $stateParams, $state, IMChathistoryServiceV2, NWKeyService) {

	//个人卡片  点击进行聊天
	$scope.goToMessageChat = function(e) {
		jQuery('.IMChat-model-cover').addClass('hidden');
		jQuery(e.target).closest('.IMChat-model-bd').addClass('hidden');

		IMChathistoryServiceV2.addorupdate($rootScope.personCardInfo.uid, "chat", $rootScope.personCardInfo.name);
		jQuery('.list-wrapper').scrollTop(0);
		$state.go("home.message2", {
			personId: $rootScope.personCardInfo.uid.toLowerCase(),
			personName: $rootScope.personCardInfo.name,
			chatType: 'chat'
		});

	};

	//个人卡片   点击加关注
	$scope.add_attention = function(e) {
		e.preventDefault();
		e.stopPropagation();
		followService.Follow_Add($rootScope.personCardInfo.uid).success(function(resultinfo) {
			$rootScope.isOperator.isattention = true;
		})
	};

	//个人卡片   点击取消关注
	$scope.cancel_attention = function(e) {
		e.preventDefault();
		e.stopPropagation();
		followService.Follow_Delete($rootScope.personCardInfo.uid).success(function(resultinfo) {
			$rootScope.isOperator.isattention = false;
		})
	};

}])
