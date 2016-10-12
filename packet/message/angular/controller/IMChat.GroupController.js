angular.module("IMChat.Group.Controller", [])


.controller("groupController", ["$scope","$rootScope", "$state", function($scope,$rootScope,$state) {


	$scope.groupList = YYIMCacheGroupManager.getInstance().list;

	$scope.goToMessage_group = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		
		YYIMCacheRecentManager.getInstance().updateCache({
			id: item.id,
			name: item.name,
			type: 'groupchat',
			sort: true
		});
		
		$rootScope.$broadcast("chatlistmessage");
		
		$state.go("imhome.message", {
			personId: item.id,
			personName: item.name,
			chatType: 'groupchat'
		});
	};

}])
