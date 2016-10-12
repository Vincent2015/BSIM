/// <reference path="../../../angular/angular.min.js.map" />
/// <reference path="../../../angular/angular.min.js" />

/// <reference path="../js/YYIMSDK.js" />

///   获取聊天好友信息
///   使用方法  调用  IMChatChatSDK.Service  模块中的YYChat  rongfl  2015-10-28



angular.module("IMChat.Follow.Controller", ["IMChat.ChatHistory.ServiceV2"])


.controller("followController", ["$scope", "$state", "$rootScope", "personService", "followService", "IMChathistoryServiceV2", "_", "$interval", function($scope, $state, $rootScope, personService, followService, IMChathistoryServiceV2, _, $interval) {

	var followCtrl = $scope.followCtrl = {
		init: function() {
			followService.Follow_List().success(function(data) {
				$scope.followList = data.response.list;
			});
		}
	}
	
	$scope.statename = $rootScope.$state;
	console.log($scope.statename);
	$scope.userStates = [];
	$scope.getUserCurrentState = function(item) {

		var isonline = false;
		for (var j = 0; j < $scope.userStates.length; j++) {

			if ($scope.userStates[j].userid == item.uid)
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
			var ids = _.pluck($scope.followList, 'uid');
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
		IMChathistoryServiceV2.addorupdate(item.uid, "chat", item.name);
		$state.go("home.message2", {
			personId: item.uid.toLowerCase(),
			personName: item.name,
			chatType: 'chat'
		});

	}

	//我的关注列表,点击进入个人详情
	$scope.goToPersonInfo_follow = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		personService.PersonCard_Get(item.uid).success(function(PersonInfo) {
			$rootScope.personCardInfo = PersonInfo.response;
			//判断是否本人卡片以及是否关注此人
			followService.Follow_Exit(item.uid).success(function(data) {
				var isuser = $rootScope.personCardInfo.uid == YYIMChat.getUserID() ? true : false;
				var isattention = data.response.attentionStatus;
				$rootScope.isOperator = {
					isuser: isuser,
					isattention: isattention
				};
				jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
			});
		});
	}
}]);
