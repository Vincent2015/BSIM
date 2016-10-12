angular.module('IMChat.Controller', ["IMChat.personCardController", "IMChat.ChatHistory.ServiceV2", "IMChat.groupSetupController"])

.controller('personSearchController', ['$rootScope', '$scope', 'personService', 'IMChathistoryServiceV2', '_', '$state',function($rootScope, $scope, personService, IMChathistoryServiceV2, _, $state) {
	//被选择人员对象
	$scope.multipleDemo = {};
	//  $scope.multipleDemo.selectedPeopleWithGroupBy = [];
	$scope.multipleDemo.selectedPeopleWithGroupBy = null;

	
	$scope.someGroupFn = function (item){
	    if (item.chatType == 'chat')
	        return '联系人：';

	    if (item.chatType == 'groupchat')
	        return '群组：';
	    
	    if (item.chatType == 'pubaccount')
	        return '公众号：';
	  };
	  
	 $scope.relations = {}; 
	 $scope.judgeRelation = function(id,type){ //判断
		 if(typeof id === 'undefined') return;
		 type = typeof type === 'undefined'? 'chat':type;
		 
		 var relation = {
				 type:type,
				 sign:false
		 };
		 
		 if(!$scope.relations[id]){
			 switch(type){
			 case 'chat':
				var roster = IMChatUser.getInstance().get('roster',id);
				if(roster){
					if(roster._subscription === 'both'){
						relation.sign = true; //表示好友
					}else if(roster._subscription === 'none' && roster._ask === 1){
						relation.ask = true;//请求中
					}else if(roster._subscription === 'none' && roster._recv === 1){
						relation.recv = true;//接受中
					}
				}
				$scope.relations[id] = relation;
				break;
			 case 'groupchat':
				if(IMChatUser.getInstance().getChatRoom(id)){
						relation.sign = true; //表示所属群组
				}
				$scope.relations[id] = relation;
				break;
			 case 'pubaccount':
				if(IMChatUser.getInstance().getPubAccount(id)){
						relation.sign = true; //表示已关注公众号
				}
				$scope.relations[id] = relation;
				break;
			 default:break;
			}
		 }
		 console.log('relation:',$scope.relations);
		 return $scope.relations[id];
	};  
	
	$scope.searchList = [];
	$scope.refreshPersons = function(personSearch) {
		$scope.searchList.length = 0;
		
		YYIMChat.queryRosterItem({keyword:personSearch,success:function(data){
			if(data && data.items && data.items.length){
				for(var x in data.items){
					data.items[x].chatType = 'chat';
					data.items[x].checktype = false;
					
					var relation = $scope.judgeRelation(data.items[x].id,data.items[x].chatType);
					if(relation && relation.sign === true){
						data.items[x].action = '聊天';
					}else if(relation && relation.ask === true){
						data.items[x].action = '请求中';
						data.items[x].className = 'nouse';
					}else if(relation && relation.recv === true){
						data.items[x].action = '接受请求';
					}else{
						data.items[x].action = '加好友';
					}
					
				}
				
				$scope.searchList = $scope.searchList.concat(data.items);
			}
		}});
		
		YYIMChat.queryChatGroup({keyword:personSearch,success:function(data){
			if(data && data.items && data.items.length){
				for(var x in data.items){
					data.items[x].chatType = 'groupchat';
					data.items[x].checktype = false;

					var relation = $scope.judgeRelation(data.items[x].id,data.items[x].chatType);
					if(relation && relation.sign === true){
						data.items[x].action = '进入群';
					}else{
						data.items[x].action = '添加群';
					}
										
				}
				$scope.searchList = $scope.searchList.concat(data.items);
			}
		}});
		
		YYIMChat.queryPubaccount({keyword:personSearch,success:function(data){
			if(data && data.items && data.items.length){
				for(var x in data.items){
					data.items[x].chatType = 'pubaccount';
					data.items[x].checktype = false;

					var relation = $scope.judgeRelation(data.items[x].id,data.items[x].chatType);
					if(relation && relation.sign === true){
						data.items[x].action = '进入';
					}else{
						data.items[x].action = '加关注';
					}
					
				}
				$scope.searchList = $scope.searchList.concat(data.items);
			}
		}});
		
		
		
	};

	$scope.goToMessage_Search = function(item,e) {
		e.preventDefault();
		e.stopPropagation();
		
		IMChathistoryServiceV2.addorupdate(item.id, item.chatType, item.name);
		var relation = $scope.judgeRelation(item.id,item.chatType);
		
		switch(item.chatType){
			case 'chat':
				jQuery('.IMChat-search .dropdown-menu').scrollTop(0);
				
				if(relation && relation.sign === true){
					$state.go("home.message2", {
						personId: item.id,
						personName: item.name,
						chatType: item.chatType
					});
				}else if(relation && relation.ask === true){ //请求中
					
				}else if(relation && relation.recv === true){ //接受请求
					YYIMChat.approveSubscribe(item.id);
				}else{ //加好友
					IMChatUser.getInstance().addRoster(item.id);
				}
				
				break;
			case 'groupchat':
				jQuery('.IMChat-search .dropdown-menu').scrollTop(0);
				if(relation && relation.sign === true){
					$state.go("home.message2", {
						personId: item.id,
						personName: item.name,
						chatType: item.chatType
					});
				}else{
					
				}
				break;
			case 'pubaccount':
				jQuery('.IMChat-search .dropdown-menu').scrollTop(0);
				if(relation && relation.sign === true){
					$state.go("home.message3", {
						personId: item.id,
						personName: item.name,
						chatType: item.chatType
					});
				}else{
					YYIMChat.addPubaccount(item.id);
				}
				break;
		}
		
		$scope.$emit("chatHistoryListChange_toparent", item);
	};
	
	$scope.goToPersoninfo_Search = function(item) {
		$rootScope.personCardInfo = IMChatUser.getInstance().getVCard(item._id);
		//判断是否本人卡片以及是否关注此人
		var isuser = (userid == YYIMChat.getUserID()) ? true : false;
		$rootScope.isOperator = {
			isuser: isuser,
			isattention: isattention
		};
		jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
	};

}])




//人员控制类
.controller('personController', ['$rootScope', '$scope', 'personService', 'urlParseService', 'IMChathistoryServiceV2', '_', '$stateParams', '$state', "toaster", "$interval", function($rootScope, $scope, personService, urlParseService, IMChathistoryServiceV2, _, $stateParams, $state, NWKeyService, toaster, $interval) {

	//部门人员列表
	$scope.personListDept = [];

	//人员多选框,已选择人员对象
	$scope.multipleDemo = {};
	$scope.multipleDemo.selectedPeopleWithGroupBy = null;




	///  参数变量  2015  传递的参数信息


	$scope.statename = $rootScope.$state;

	console.log($scope.statename);

	//人员多选框,查询人员列表
	$scope.PersonList = [];

	//我的部门人员列表，点击进入聊天窗体
	$scope.goToMessage_dept = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		IMChathistoryServiceV2.addorupdate(item.uid, "chat", item.name);
		jQuery('.list-wrapper').scrollTop(0);
		$state.go("home.message2", {
			personId: item.uid.toLowerCase(),
			personName: item.name,
			chatType: 'chat'
		});
	};

	//我的部门人员列表，点击进入个人详情
	$scope.goToPersonInfo_dept = function(item, e) {
		e.preventDefault();
		e.stopPropagation();

//		personService.PersonCard_Get(item.uid).success(function(PersonInfo) {
//			$rootScope.personCardInfo = PersonInfo.response;
//
//			//判断是否本人卡片以及是否关注此人
//			followService.Follow_Exit(item.uid).success(function(data) {
//				var isuser = $rootScope.personCardInfo.uid == YYIMChat.getUserID() ? true : false;
//				var isattention = data.response.attentionStatus;
//				$rootScope.isOperator = {
//					isuser: isuser,
//					isattention: isattention
//				};
//				jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
//			});
//		});

	};
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

	///  此处需要处理我的部门的信息  免得多次进行数据的拉取 服务器性能问题


//	$interval(function() {
//
//		if ($scope.statename.current.name == "contacts.dept") {
//			var ids = _.pluck($scope.personListDept, 'uid');
//
//			if (ids.length > 0) {
//				YYIMChat.getRostersPresence({
//					username: ids,
//					success: function(data) {
//						$scope.userStates = data;
//					},
//					error: function() {
//						$rootScope.userState.isonline = false;
//					}
//				});
//			}
//		}
//
//
//	}, 6000);
	var perCtrl = $scope.perCtrl = {
		init: function() {
			//获取当前登陆人个人信息----之前掌上用友接口-----使用中
//			$scope.personInfo = PersonInfo.response;
//			
//			//获取当前登录人部门人员信息
//			personService.PersonDept_Get().success(function(Persons) {
//				$scope.personListDept = Persons.response.list;
//				console.log("11111111111111111111111111111111111111111111111111111111111111111111111111111");
//				console.log($scope.personListDept);
//				for (var i = 0; i < $scope.personListDept.length; i++) {
//					$scope.personListDept[i].checktype = false;
//				}
//			});

			//获取当前登录人好友列表信息--暂时未使用

		}
	}

	//人员控制类初始化执行
	perCtrl.init();
	//搜索分组--未用
	$scope.someGroupFn = function(item) {
		if (item.name[0] >= 'A' && item.name[0] <= 'M')
			return 'From A - M';
		if (item.name[0] >= 'N' && item.name[0] <= 'Z')
			return 'From N - Z';
	};

	$scope.$watch('multipleDemo.selectedPeopleWithGroupBy', function(newvalue, oldvalue) {
		var newlength = 0;
		var oldlength = 0;
		if (newvalue) {
			newlength = newvalue.length;
		}
		if (oldlength) {
			oldlength = oldvalue.length;
		}
		var newvaluepid = _.pluck(newvalue, 'uid');
		var oldvaluepid = _.pluck(oldvalue, 'uid');

		if (newlength > oldlength) {
			//增加
			var pid = _.filter(newvalue, function(obj) {
				return !(_.contains(oldvaluepid, obj.uid))
			})
			for (var i = 0; i < $scope.personListDept.length; i++) {
				if ($scope.personListDept[i].uid == pid.uid)
					$scope.personListDept[i].checktype = true;
			}

		} else {
			//删除
			var pid = _.filter(oldvalue, function(obj) {
				return !(_.contains(newvaluepid, obj.uid))
			})
			for (var i = 0; i < $scope.personListDept.length; i++) {
				if ($scope.personListDept[i].uid == pid.uid)
					$scope.personListDept[i].checktype = false;
			}
		}


	});


	$scope.goToMessage = function(item, model) {
		IMChathistoryServiceV2.addorupdate(item.uid, "chat", item.name);
		jQuery('.list-wrapper').scrollTop(0);
		$state.go("home.message2", {
			personId: item.uid.toLowerCase(),
			personName: item.name,
			chatType: 'chat'
		});
	};

	$scope.refreshPersons = function(personSearch) {
		return null;
	};

	$scope.addGroup = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var persons = $scope.multipleDemo.selectedPeopleWithGroupBy;

		var selectedId = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'uid');
		var selectedName = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'name');

		selectedId = _.difference(selectedId, [urlParseService.pid]);
		selectedName = _.difference(selectedName, [$scope.personInfo.name]);


		var newGroupId = Math.uuid(20, 10);
		var newGroupName = $scope.input_GroupName;
		if (!newGroupName) {
			newGroupName = $scope.personInfo.name;
			for (var i = 0; i < 3; i++) {
				for (var j = 0; j < selectedName.length; j++) {
					if (i == j)
						newGroupName += "," + selectedName[j];
				}
			}
		}

		if (selectedId.length > 0) {

			console.info("选择的群人员信息")
			console.log(selectedId)

			IMChatUser.getInstance().createChatRoom({

				name: newGroupName,

				members: selectedId,


				success: function(data) {

					toaster.pop({
						title: '添加人员成功！',
						type: 'success'
					});


					var goupid = data.id;
					jQuery('.IMChat-model-cover').addClass('hidden');
					jQuery(e.target).closest('.IMChat-model-bd').addClass('hidden');
					// $scope.multipleDemo.selectedPeopleWithGroupBy = [];

					$scope.multipleDemo.selectedPeopleWithGroupBy = null;
					$scope.input_GroupName = "";
					$scope.seleteDeptAllFlag = false;
					for (var i = 0; i < $scope.personListDept.length; i++) {
						$scope.personListDept[i].checktype = false;
					}
					jQuery('.list-wrapper').scrollTop(0);
					IMChathistoryServiceV2.addorupdate(goupid, "groupchat", newGroupName);
					$state.transitionTo("home.message2", {
						personId: goupid,
						personName: newGroupName,
						chatType: 'groupchat'
					}, {
						location: true,
						inherit: true,
						notify: true,
						reload: true
					});
				},

				error: function() {

					toaster.pop({
						title: '添加人员失败,请重试！',
						type: 'warn'
					});

				}



			})

		}
		
	}

	$scope.seleteDeptAllFlag = false;
	$scope.selectDeptAll = function(e) {
		if ($scope.seleteDeptAllFlag) {
			for (var i = 0; i < $scope.personListDept.length; i++) {
				var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
					uid: $scope.personListDept[i].uid
				});

				$scope.personListDept[i].checktype = false;
				if (selectPerpleFilter.length == 0) {

				} else {

					$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
						return obj.uid != $scope.personListDept[i].uid;
					});
				}
			}
			$scope.seleteDeptAllFlag = false;
		} else {
			for (var i = 0; i < $scope.personListDept.length; i++) {
				var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
					uid: $scope.personListDept[i].uid
				});

				$scope.personListDept[i].checktype = true;
				if (selectPerpleFilter.length == 0) {

					$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
					$scope.multipleDemo.selectedPeopleWithGroupBy.push($scope.personListDept[i]);

				} else {

				}
			}
			$scope.seleteDeptAllFlag = true;
		}
	}


	$scope.addPerson = function(item, model, type) {
		if (type == "dept") {
			var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
				uid: model.uid
			});
			if (model.checktype) {
				model.checktype = false;
			} else {
				model.checktype = true;
			}
			if (selectPerpleFilter.length == 0) {

				$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
				$scope.multipleDemo.selectedPeopleWithGroupBy.push(model);
			} else {
				$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
					return obj.uid != model.uid;
				});
			}
		} else {
			var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
				uid: model.uid
			});
			if (model.checktype) {
				model.checktype = false;
			} else {
				model.checktype = true;
			}
			if (selectPerpleFilter.length == 0) {

				$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
				$scope.multipleDemo.selectedPeopleWithGroupBy.push(model);
			} else {
				$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
					return obj.uid != model.uid;
				});
			}
		}

	}
}])


.controller('publicAccountController', ['$rootScope', '$scope', "$state", 'publicAccountService',"IMChathistoryServiceV2", '_', function($rootScope, $scope, $state, publicAccountService, IMChathistoryServiceV2, _) {

	$scope.publicAccountList = [];
	$scope.tabShowFlag = true;
	
	var publicAccountCtrl = $scope.publicAccountCtrl = {
		init: function() {
			$scope.publicAccountList = IMChatUser.getInstance().getPubAccount();
		}
	};
	publicAccountCtrl.init();

	/**
	 * 关注公众号
	 */
	$scope.subscribePublicAccount = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		
		IMChatUser.getInstance().removePubAccount({
			id:item._id,
			success:function(data){
				console.log(data);
				$scope.publicAccountList = IMChatUser.getInstance().getPubAccount();
			}
		});	
	}
	
	//我的关注列表,点击进入聊天界面
	$scope.goToMessage_pubaccount = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		
//		IMChathistoryServiceV2.addorupdate(item._id, "pubaccount", item._name);
		$state.go("home.message3", {
			personId: item._id,
			personName: item._name,
			chatType: 'pubaccount'
		});

	}

}])
