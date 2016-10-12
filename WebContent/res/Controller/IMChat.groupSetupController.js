angular.module('IMChat.groupSetupController', ["IMChat.ChatHistory.ServiceV2"])

.controller('confirmMessageController', ['$rootScope', '$scope', 'urlParseService', 'ngDialog', function($rootScope, $scop, ngDialog) {

	$scope.NO_Click = function() {
		ngDialog.close();
	}

	$scope.OK_Click = function() {
		console.log($scope.ngDialogData.group.groupId + "----" + $scope.ngDialogData.person.id);
		//         YYIMChat.delGroupMember($scope.ngDialogData.group.groupId, $scope.ngDialogData.person.id,success: function(data) {
		//			console.log(data);
		//            ngDialog.close();
		//		 });
	}

	//群成员删除按钮
	$scope.deleteGroupMember_Click = function(per) {
		console.log(per);
		ngDialog.open({
			template: 'WebContent/res/templete/ConfirmMessage.htm',
			controller: 'groupSetupController',
			className: '',
			showClose: false
		});
	}
}])

.controller('groupSetupController', ['$rootScope', '$scope', 'personService', 'urlParseService', '_', '$stateParams', '$state', "IMChathistoryServiceV2", 'ngDialog', "toaster","followService", function($rootScope, $scope, personService, urlParseService, _, $stateParams, $state, IMChathistoryServiceV2, ngDialog, toaster,followService) {

	var groupSetupCtrl = $scope.groupSetupCtrl = {

		init: function(str_groupid, str_groupname) {
			YYIMChat.getGroupMembers({
				id: str_groupid, // 群的id
				success: function(memberList) {
					var list = JSON.parse(memberList);
					console.log(list);
					var a = _.where(list, {
						affiliation: "owner"
					});
					var groupOwnerId = "";
					var groupOwnerName = "";
					if (a.length <= 0) {

						groupOwnerId = list[0].id;
						groupOwnerName = list[0].name;



					} else {
						groupOwnerId = _.where(list, {
							affiliation: "owner"
						})[0].id;
						groupOwnerName = _.where(list, {
							affiliation: "owner"
						})[0].name;
                        
                  
					}


					console.log(b);
					$scope.groupSetupInfo = {
						groupId: str_groupid,
						groupName: str_groupname,
						groupOwnerId: groupOwnerId,
						groupOwnerName: groupOwnerName,
						groupNumberCount: list.length,
						groupNumberList: list
					}
					$scope.currentPerson = urlParseService;
					console.log($scope.groupSetupInfo);
					console.log($scope.currentPerson);
				},
				error: function(errorInfo) {}
			});
		}
	}


	$scope.quitEnable = function() {

		if ($scope.groupSetupInfo) {

			if ($scope.groupSetupInfo.groupNumberCount) {

				return $scope.groupSetupInfo.groupNumberCount < 2;
			}

		}

		return false;
	}

	//监听群按钮事件
	$scope.$on("groupSetup_Change", function(name, data) {
		console.log("----------------------------------------------------------------")
		groupSetupCtrl.init(data.id, data.name);

	});

	$scope.NO_Click = function() {
		ngDialog.close();
	}

	$scope.OK_Click = function() {
		console.log($scope.ngDialogData.group.groupId + "----" + $scope.ngDialogData.person.id);
		//         YYIMChat.delGroupMember($scope.ngDialogData.group.groupId, $scope.ngDialogData.person.id,success: function(data) {
		//			console.log(data);
		//            ngDialog.close();
		//		 });

		/// 删除人员调用
		console.info("人员信息删除")
		IMChatUser.getInstance().kickGroupMember({
			id: $scope.ngDialogData.group.groupId,
			member: $scope.ngDialogData.person.id,
			success: function(data) {

				toaster.pop({
					title: '删除人员成功！',
					type: 'success'
				});

				ngDialog.close();

			},
			error: function() {

				toaster.pop({
					title: '删除人员失败,请重试！',
					type: 'warn'
				});

				ngDialog.close();
			}
		})
	}
	$scope.$on("ngDialog.closed", function(e, $dialog) {



		console.log(e);

		console.log($dialog);

		jQuery('.IMChat-group-slide').addClass('beforeHide');
		setTimeout(function() {
			jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden')
		}, 500);

	})
   
   $scope.goToPersonInfo_group=function(item,e){
     	e.preventDefault();
		e.stopPropagation();
//		personService.PersonCard_Get(item.id).success(function(PersonInfo) {
//			$rootScope.personCardInfo = PersonInfo.response;
//			//判断是否本人卡片以及是否关注此人
//			followService.Follow_Exit(item.id).success(function(data) {
//				
//				var isuser = $rootScope.personCardInfo.uid == YYIMChat.getUserID() ? true : false;
//				var isattention = data.response.attentionStatus;
//				$rootScope.isOperator = {
//					isuser: isuser,
//					isattention: isattention
//				};
//				jQuery('.IMChat-group-slide').addClass('beforeHide');
//				setTimeout(function() {
//					jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden')
//				}, 500);
//				jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
//				
//			});
//		});
   	
   	
   }
	$scope.$on("addGroupMember_DialogChange_togroupsetup", function(name, data) {
		console.log(data);
		groupSetupCtrl.init(data.str_groupid, data.str_groupname);

	});



	$scope.exit_Click = function() {


		console.log("goup info " + $scope.ngDialogData.group.groupId);

		IMChatUser.getInstance().exitChatGroup({
			id: $scope.ngDialogData.group.groupId,
			success: function(data) {


				console.log(data);
				IMChathistoryServiceV2.remove($scope.ngDialogData.group.groupId);

				toaster.pop({
					title: '解散群组成功！',
					type: 'success'
				});
				jQuery('.IMChat-group-slide').addClass('beforeHide');
				setTimeout(function() {
					jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden')
				}, 500);
				ngDialog.close();
				$state.go("home");
			},
			error: function() {

				toaster.pop({
					title: '解散群组失败,请重试！',
					type: 'warn'
				});

				ngDialog.close();
			}

		})


	}
	$scope.quit_Click = function() {


		console.log("goup info " + $scope.ngDialogData.group.groupId);

		IMChatUser.getInstance().exitChatGroup({
			id: $scope.ngDialogData.group.groupId,
			success: function(data) {


				console.log(data);
				IMChathistoryServiceV2.remove($scope.ngDialogData.group.groupId);

				toaster.pop({
					title: '退群成功！',
					type: 'success'
				});
				jQuery('.IMChat-group-slide').addClass('beforeHide');
				setTimeout(function() {
					jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden')
				}, 500);
				ngDialog.close();
				$state.go("home");
			},
			error: function() {

				toaster.pop({
					title: '退群失败,请重试！',
					type: 'warn'
				});

				ngDialog.close();
			}

		})

	}
	$scope.quitChatGroup = function() {
		ngDialog.open({
			template: 'WebContent/res/templete/quitGroupConfirmMessage.htm',
			controller: 'groupSetupController',
			className: '',
			data: {
				Message: "是否退出群，下次进入需要群主添加？",
				group: $scope.groupSetupInfo
			},
			showClose: false
		});
	}
	$scope.exitChatGroup = function() {
			ngDialog.open({
				template: 'WebContent/res/templete/exitGroupConfirmMessage.htm',
				controller: 'groupSetupController',
				className: '',
				data: {
					Message: "是否解散群组，此群将不存在？",
					group: $scope.groupSetupInfo
				},
				showClose: false
			});
		}
		//群成员添加按钮
	$scope.addGroupMember_Click = function() {
			ngDialog.open({
				template: 'WebContent/res/templete/temp-GroupMember-Add.htm',
				controller: 'addGroupMemberController',
				className: '',
				showClose: false,
				data: {
					group: $scope.groupSetupInfo
				}
			});

		}
		//编辑群名称
	$scope.editGroupName = function(item, e) {
		var target = jQuery(e.target),
			related_input = target.siblings('input');
		var isEditing = '确定' == target.html() ? true : false;



		console.info("群组信息");
		console.log(item)
			/*TODO*/
		if (isEditing) {
			related_input.attr('readonly', 'true');


			var newgroupname = jQuery("#editgroupname").val();

			console.log(newgroupname);

			if (newgroupname != item.groupName) {
				IMChatUser.getInstance().modifyChatGroupInfo({
					id: item.groupId,
					name: newgroupname,
					success: function(data) {
						IMChathistoryServiceV2.addorupdate(item.groupId, "groupchat", newgroupname);
						toaster.pop({
							title: '改群昵称成功！',
							type: 'success'
						});
						jQuery('.IMChat-group-slide').addClass('beforeHide');
						setTimeout(function() {
							jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden')
						}, 500);
						/// 更新聊天历史列表


					},
					error: function() {

						toaster.pop({
							title: '修改群昵称失败，请重试！',
							type: 'warn'
						});
					}
				})

			}
			console.log(item);


		} else {
			related_input.removeAttr('readonly');


		}
		target.html(isEditing ? '修改' : '确定')
	}


	//群成员删除按钮
	$scope.deleteGroupMember_Click = function(per,e) {
		console.log(per);
		e.preventDefault();
		e.stopPropagation();
		ngDialog.open({
			template: 'WebContent/res/templete/delMemberConfirmMessage.htm',
			controller: 'groupSetupController',
			className: '',
			data: {
				Message: "是否把" + per.name + "移出群？",
				group: $scope.groupSetupInfo,
				person: per
			},
			showClose: false
		});

	}



}])

.controller('addGroupMemberController', ['$rootScope', '$scope', 'personService', 'urlParseService', '_', '$stateParams', '$state', "IMChathistoryServiceV2", 'ngDialog', "toaster", function($rootScope, $scope, personService, urlParseService, _, $stateParams, $state, IMChathistoryServiceV2, ngDialog, NWKeyService, toaster) {

	//部门人员列表
	$scope.personListDept = [];

	var groupMemberAddCtrl = $scope.groupMemberAddCtrl = {
		init: function() {
			//获取当前登录人部门人员信息
			personService.PersonDept_Get().success(function(Persons) {
				$scope.personListDept = Persons.response.list;

				console.log('9999999999999999999999999999999999999999999999999999999999999')
				console.log($scope.ngDialogData.group);
				console.log($scope.personListDept);
				if ($scope.ngDialogData.group) {
					for (var i = 0; i < $scope.personListDept.length; i++) {
						//判断用户是否在群组
						$scope.personListDept[i].checktype = false;
						$scope.personListDept[i].enable = true;
						$scope.personListDept[i].uid = $scope.personListDept[i].uid.toLowerCase();
						for (var j = 0; j < $scope.ngDialogData.group.groupNumberList.length; j++) {
							if ($scope.personListDept[i].uid == $scope.ngDialogData.group.groupNumberList[j].id) {
								$scope.personListDept[i].checktype = true;
								$scope.personListDept[i].enable = false;
							}
						}

					}
				}
			});
		}
	}
	groupMemberAddCtrl.init();

	//部门人员列表和我的好友列表显示标识
	$scope.tabShowFlag = true;


	$scope.multipleDemo = {};
	//  $scope.multipleDemo.selectedPeopleWithGroupBy = [];
	$scope.multipleDemo.selectedPeopleWithGroupBy = null;

	$scope.PersonList = [];

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
	$scope.refreshPersons = function(personSearch) {
		return personService.PersonList_Get(personSearch).success(function(result) {
			if (result.response.list.length > 0 && $scope.multipleDemo.selectedPeopleWithGroupBy != null && $scope.multipleDemo.selectedPeopleWithGroupBy.length > 0) {
				//已选择的人员数组
				var selectedPsncode = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'uid');
				//查询出的人员数组
				var searchPsncode = result.response.list;
				//过滤查询出的人员数组，排除已选择人员
				$scope.PersonList = _.filter(searchPsncode, function(obj) {
					return !(_.contains(selectedPsncode, obj.uid))
				})
			} else {
				$scope.PersonList = result.response.list;
			}
			for (var i = 0; i < $scope.PersonList.length; i++) {
				$scope.PersonList[i].checktype = false;
			}
		})
	};

	$scope.seleteDeptAllFlag = false;
	$scope.selectDeptAll = function(e) {
		console.log("1");
		if ($scope.seleteDeptAllFlag) {
			for (var i = 0; i < $scope.personListDept.length; i++) {
				var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
					uid: $scope.personListDept[i].uid
				});
				if ($scope.personListDept[i].enable) {
					$scope.personListDept[i].checktype = false;
					if (selectPerpleFilter.length == 0) {

					} else {

						$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
							return obj.uid != $scope.personListDept[i].uid;
						});
					}
				}
			}
			$scope.seleteDeptAllFlag = false;
		} else {
			for (var i = 0; i < $scope.personListDept.length; i++) {
				var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
					uid: $scope.personListDept[i].uid
				});
				if ($scope.personListDept[i].enable) {
					$scope.personListDept[i].checktype = true;
					if (selectPerpleFilter.length == 0) {

						$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
						$scope.multipleDemo.selectedPeopleWithGroupBy.push($scope.personListDept[i]);

					} else {

					}
				}
			}
			$scope.seleteDeptAllFlag = true;
		}
	}

	$scope.closeAddGroupMemberDialog = function() {
		ngDialog.close();
	}

	$scope.addGroupMember = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var persons = $scope.multipleDemo.selectedPeopleWithGroupBy;


		var groupId = _.pluck($scope.ngDialogData.group.groupNumberList, 'id');


		var selectedId = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'uid');

		var newids = _.difference(selectedId, groupId);

		if (newids.length > 0) {

			///  添加群成员 使用新SDK 方法


			IMChatUser.getInstance().inviteGroupMember({

				id: $scope.ngDialogData.group.groupId,

				members: newids,

				success: function(data) {

					toaster.pop({
						title: '群添加人员成功！',
						type: 'success'
					});

				},

				error: function() {
					toaster.pop({
						title: '群添加人员失败,请重试！',
						type: 'warn'
					});

				}
			})

			///  旧方法
			//              	
			//              	
			//                  YYIMChat.addGroupMember({
			//                      roomId: $scope.ngDialogData.group.groupId,
			//                      ids: newids
			//                  });
		}

		ngDialog.close();
	}

	$scope.safeApply = function(fn) {
		var phase = $scope.$$phase;
		if (phase == "$apply" || phase == "$digest") {
			if (fn && (typeof(fn) === "function")) {
				fn();
			}
		} else {
			$scope.$applyAsync(fn);
		}
	};
	$scope.addPerson = function(item, model, type) {
		if (model.enable) {
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

	}

}])

.controller('addGroupChatController', ['$rootScope', '$scope', 'personService', 'urlParseService', '_', '$stateParams', '$state', "IMChathistoryServiceV2", 'ngDialog', "toaster", function($rootScope, $scope, personService, urlParseService, _, $stateParams, $state, IMChathistoryServiceV2, ngDialog, toaster, NWKeyService) {

	//部门人员列表
	$scope.personListDept = [];

	/*var groupMemberAddCtrl = $scope.groupMemberAddCtrl = {
		init: function() {
			//获取当前登录人个人信息
			personService.PersonInfo_Get(urlParseService.pid).success(function(PersonInfo) {
				$scope.personInfo = PersonInfo.response.list;
				console.log('77777777777777777777777777777777777777')
				console.log($scope.personInfo);
			});
			//获取当前登录人部门人员信息
			personService.PersonDept_Get().success(function(Persons) {
				$scope.personListDept = Persons.response.list;

				console.log('8888888888888888888888888888888888888888888888888888888');

				if ($scope.ngDialogData.chatinfo) {
					for (var i = 0; i < $scope.personListDept.length; i++) {
						//判断用户是否在群组
						$scope.personListDept[i].checktype = false;
						$scope.personListDept[i].enable = true;
						$scope.personListDept[i].uid = $scope.personListDept[i].uid.toLowerCase();
						if ($scope.personListDept[i].uid == $scope.ngDialogData.chatinfo.id) {
							$scope.personListDept[i].checktype = true;
							$scope.personListDept[i].enable = false;
						}
						if ($scope.personListDept[i].uid == urlParseService.pid) {
							$scope.personListDept[i].checktype = true;
							$scope.personListDept[i].enable = false;
						}


					}
				}
				console.log($scope.ngDialogData.chatinfo);
				console.log($scope.personListDept);
			});
		}
	}
	groupMemberAddCtrl.init();
*/
	//部门人员列表和我的好友列表显示标识
	$scope.tabShowFlag = true;

	$scope.multipleDemo = {};
	//  $scope.multipleDemo.selectedPeopleWithGroupBy = [];
	$scope.multipleDemo.selectedPeopleWithGroupBy = null;

	$scope.PersonList = [];
    
	$scope.$watch('multipleDemo.selectedPeopleWithGroupBy', function(newvalue, oldvalue) {
		/*var newlength = 0;
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
*/

	});

	$scope.refreshPersons = function(personSearch) {
		$scope.PersonList.length = 0;
		
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
				$scope.PersonList = $scope.PersonList.concat(data.items);
			}
		}});
		
		
	};

	$scope.seleteDeptAllFlag = false;
	$scope.selectDeptAll = function(e) {
		if ($scope.seleteDeptAllFlag) {
			for (var i = 0; i < $scope.personListDept.length; i++) {
				var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
					uid: $scope.personListDept[i].uid
				});
				if ($scope.personListDept[i].enable) {
					$scope.personListDept[i].checktype = false;
					if (selectPerpleFilter.length == 0) {

					} else {

						$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
							return obj.uid != $scope.personListDept[i].uid;
						});
					}
				}
			}
			$scope.seleteDeptAllFlag = false;
		} else {
			for (var i = 0; i < $scope.personListDept.length; i++) {
				var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
					uid: $scope.personListDept[i].uid
				});
				if ($scope.personListDept[i].enable) {
					$scope.personListDept[i].checktype = true;
					if (selectPerpleFilter.length == 0) {

						$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
						$scope.multipleDemo.selectedPeopleWithGroupBy.push($scope.personListDept[i]);

					} else {

					}
				}
			}
			$scope.seleteDeptAllFlag = true;
		}
	}

	$scope.closeAddGroupMemberDialog = function() {
		ngDialog.close();
	}

	$scope.addGroupMember = function(e) {
		e.preventDefault();
		e.stopPropagation();

		var persons = $scope.multipleDemo.selectedPeopleWithGroupBy;

		var selectedId = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'uid');
		var selectedName = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'name');

		var groupid = [$scope.ngDialogData.chatinfo.id];
		var groupname = [$scope.ngDialogData.chatinfo.name];

		var newids = _.difference(_.union(selectedId, groupid), [urlParseService.pid]);
		var newnames = _.difference(_.union(selectedName, groupname));

		var newGroupId = Math.uuid(20, 10);
		var newGroupName = $scope.input_GroupName;
		if (!newGroupName) {
			newGroupName = $scope.personInfo[0].name;

			for (var j = 0; j < 2; j++) {
				if (j < newnames.length)
					newGroupName += "," + newnames[j];

			}
		}

		if (newids.length > 0) {
			//          YYIMChat.addChatGroup({
			//              name: newGroupName,
			//              node: newGroupId,
			//              success: function () {
			//                  YYIMChat.addGroupMember({
			//                      roomId: newGroupId,
			//                      ids: newids
			//                  });
			//                  IMChathistoryServiceV2.addorupdate(newGroupId, "groupchat", newGroupName);
			//                  $state.transitionTo("home.message2", { personId: newGroupId, personName: newGroupName, chatType: 'groupchat' }, { location: true, inherit: true, notify: true, reload: true });
			//
			//              },
			//              error: function (errorInfo) {
			//                  console.log('失败！' + errorInfo);
			//              }
			//          });

			IMChatUser.getInstance().createChatRoom({

				name: newGroupName,

				members: newids,
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
			ngDialog.close();
		}
	}

	$scope.addPerson = function(item, model, type) {
		if (model.enable) {
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

	}

}])
