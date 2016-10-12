angular.module('IMChat.Controller', ["IMChat.groupSetupController"])

.controller('personSearchController', ['$rootScope', '$scope', '_', '$state',function($rootScope, $scope, _, $state) {
	//被选择人员对象
	$scope.multipleDemo = {};
	
	$scope.multipleDemo.selectedPeopleWithGroupBy = null;

	
	$scope.someGroupFn = function (item){
	    if (item.chatType == 'chat')
	        return '联系人：';
	  };
	  
	 $scope.relations = {}; 
	$scope.searchList = [];
	$scope.refreshPersons = function(personSearch) {
		$scope.searchList.length = 0;
		
		if(!personSearch) return;
		
		YYIMChat.queryRosterItem({keyword:personSearch,success:function(data){
			if(data && data.items && data.items.length){
				for(var x in data.items){
					
					$scope.searchList.push({
						id: data.items[x].imId || data.items[x].id,
						name: data.items[x].name,
						email: data.items[x].email,
						office: data.items[x].office,
						chatType: 'chat',
						type: 'chat',
						officePhone: data.items[x].officePhone,
						phoneticName: data.items[x].phoneticName,
						telephone: data.items[x].telephone,
						action:'聊天'
					});
					
				}
				
			}
		}});
		
	};

	$scope.goToMessage_Search = function(item,e) {
		e.preventDefault();
		e.stopPropagation();
		
		if(item.id !== YYIMChat.getUserID()){
			YYIMCacheRecentManager.getInstance().updateCache({
				id: item.id,
				name:  item.name,
				type: item.chatType
			});
		}
		
		switch(item.chatType){
			case 'chat':
				jQuery('.IMChat-search .dropdown-menu').scrollTop(0);
				$state.go("imhome.message", {
					personId: item.id,
					personName: item.name,
					chatType: item.chatType
				});break;
			default:break;
		}
		
		$scope.$emit("chatHistoryListChange_toparent", item);
	};
	
	$scope.goToPersoninfo_Search = function(item) {
		//判断是否本人卡片以及是否关注此人
		$rootScope.personCardInfo = YYIMCacheRosterManager.getInstance().get(item.id).vcard;
		
		//判断是否本人卡片以及是否关注此人
		var isuser = (userid == YYIMChat.getUserID()) ? true : false;
		$rootScope.isOperator = {
			isuser: isuser
		};
		
		jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
	};

}])




//人员控制类
.controller('personController', ['$rootScope', '$scope', 'urlParseService', '_', '$stateParams', '$state', "toaster", "$interval", function($rootScope, $scope, urlParseService, _, $stateParams, $state, NWKeyService, toaster, $interval) {

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
		jQuery('.list-wrapper').scrollTop(0);
		$state.go("imhome.message", {
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
		jQuery('.list-wrapper').scrollTop(0);
		$state.go("imhome.message", {
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
					$state.transitionTo("imhome.message", {
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


.controller('publicAccountController', ['$rootScope', '$scope', "$state", function($rootScope, $scope, $state) {

	$scope.publicAccountList = YYIMCachePubAccountManager.getInstance().list;

	$scope.tabShowFlag = true;

	$scope.goToMessage_pubaccount = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		
		YYIMCacheRecentManager.getInstance().updateCache({
			id: item.id,
			name: item.name,
			type: 'pubaccount',
			sort: true
		});
		
		$state.go("imhome.message", {
			personId: item.id,
			personName: item.name,
			chatType: 'pubaccount'
		});
	};
	
}])
