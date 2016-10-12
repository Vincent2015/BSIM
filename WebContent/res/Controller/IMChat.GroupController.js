/// <reference path="../../../angular/angular.min.js.map" />
/// <reference path="../../../angular/angular.min.js" />

/// <reference path="../js/YYIMSDK.js" />

///   获取聊天好友信息
///   使用方法  调用  IMChatChatSDK.Service  模块中的YYChat  rongfl  2015-10-28



angular.module("IMChat.Group.Controller", ["IMChat.ChatHistory.ServiceV2"])


.controller("groupController", ["$scope", "IMChathistoryServiceV2", "$state", function($scope, IMChathistoryServiceV2, $state) {

	///  调用格式如下:
	//    YYIMChat.getRosterItems({
	//        success: function (roomList) {
	//            // 群列表为如下JSON格式
	//            /*
	//            [
	//            {
	//            "id" : "111",
	//            "name" : "华山派",
	//            "photo" : "res/avatar/huashan.jpg",
	//            },
	//            {
	//            "id" : "222",
	//            "name" : "林威镖局",
	//            "photo" : "res/avatar/biao.jpg",
	//            }
	//            ]
	//            */
	//            // 通过JSON.parse(roomList)进行转换
	//            // var list = JSON.parse(roomList);
	//        },
	//        error: function (errorInfo) {
	//        }
	//    });

	YYIMChat.getChatGroups({
		success: function(rosterList) {

			var list = JSON.parse(rosterList);

			$scope.groupList = list;

			console.log(list);
			console.log("组信息");
			$scope.$apply(function() {
				$scope.groupList = list;
			});


			console.log($scope);
			console.log($scope.groupList);

			// $rootScope.$apply();
		},
		error: function(errorInfo) {


		}
	});

	$scope.goToMessage_group = function(item, e) {

		e.preventDefault();
		e.stopPropagation();
		IMChathistoryServiceV2.addorupdate(item.id, "groupchat", item.name);
		$state.go("home.message2", {
			personId: item.id.toLowerCase(),
			personName: item.name,
			chatType: 'groupchat'
		});
	};

}])
