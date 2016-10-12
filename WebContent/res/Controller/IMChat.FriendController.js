///   获取聊天好友信息
///   使用方法  调用  IMChatChatSDK.Service  模块中的YYChat  rongqb  2015-12-31



angular.module("IMChat.Friend.Controller", ["IMChat.ChatHistory.ServiceV2"])


.controller("friendController", ["$scope", "$state", "$rootScope", "IMChathistoryServiceV2", "_", "$interval", function($scope, $state, $rootScope, IMChathistoryServiceV2, _, $interval) {

	var followCtrl = $scope.followCtrl = {
		init: function() {
			$scope.followList = IMChatUser.getInstance().getFriendList();
		}
	}
	
	$scope.statename = $rootScope.$state;
	console.log($scope.statename);
	$scope.userStates = [];
	$scope.getUserCurrentState = function(item) {

		var isonline = false;
		for (var j = 0; j < $scope.userStates.length; j++) {

			if ($scope.userStates[j].userid == item._id)
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
			var ids = _.pluck($scope.followList, '_id');
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
		IMChathistoryServiceV2.addorupdate(item._id, "chat", item._vcard.nickname);
		$state.go("home.message2", {
			personId: item._id.toLowerCase(),
			personName: item._vcard.nickname,
			chatType: 'chat'
		});

	}

	//我的关注列表,点击进入个人详情
	$scope.goToPersonInfo_follow = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		$rootScope.personCardInfo = IMChatUser.getInstance().getVCard(item._id);
		//判断是否本人卡片以及是否关注此人
		var isuser = item._id == YYIMChat.getUserID() ? true : false;
//		var isattention = data.response.attentionStatus;
		$rootScope.isOperator = {
//			isattention: isattention,
			isuser: isuser
		};
		jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
	}
}]);
