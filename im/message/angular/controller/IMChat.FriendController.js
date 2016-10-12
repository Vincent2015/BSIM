angular.module("IMChat.Friend.Controller", [])


.controller("friendController", ["$scope", "$state", "$rootScope", "_", "$interval", function($scope, $state, $rootScope, _, $interval) {

	var followCtrl = $scope.followCtrl = {
		init: function() {
			$scope.followList = YYIMCacheRosterManager.getInstance().getRostersList("friend");
		}
	}
	
	
	
	$scope.statename = $rootScope.$state;
	$scope.userStates = [];
	$scope.getUserCurrentState = function(item) {

		var isonline = false;
		for (var j = 0; j < $scope.userStates.length; j++) {

			if ($scope.userStates[j].userid == item.id)
				for (var i = 0; i < $scope.userStates[j].presence.length; i++) {

					if ($scope.userStates[j].presence[i].available == 1) {
						isonline = true;

						break;

					}
				};


		}
		return isonline;

	}

	$interval(function() {

		if ($scope.statename.current.name == "contacts.follow") {
			var ids = _.pluck($scope.followList, 'id');
			if (ids.length > 0) {
				YYIMChat.getRostersPresence({
					username: ids,
					success: function(data) {
						$scope.userStates = data;
					}
				});

			}

		}

	}, 6000);
	followCtrl.init();

	//我的关注列表,点击进入聊天界面
	$scope.goToMessage_follow = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		
		YYIMCacheRecentManager.getInstance().updateCache({
			id: item.id,
			name: item.name,
			type: 'chat',
			sort: true
		});
		
		$state.go("imhome.message", {
			personId: item.id,
			personName: item.name,
			chatType: 'chat'
		});

	}

	//我的关注列表,点击进入个人详情
	$scope.goToPersonInfo_follow = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		$rootScope.personCardInfo = YYIMCacheRosterManager.getInstance().get(item.id).vcard;;
		//判断是否本人卡片以及是否关注此人
		var isuser = item.id == YYIMChat.getUserID() ? true : false;
//		var isattention = data.response.attentionStatus;
		$rootScope.isOperator = {
//			isattention: isattention,
			isuser: isuser
		};
		jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
	}
}]);
