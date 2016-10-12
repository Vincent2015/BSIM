angular.module('IMChat.groupSetupController', ["CommonService"])

.controller('groupSetupController', ['$rootScope', '$scope', 'urlParseService', '_', '$stateParams', '$state', 'ngDialog', "toaster", function($rootScope, $scope, urlParseService, _, $stateParams, $state, ngDialog, toaster) {
	
	$scope.group = YYIMCacheGroupManager.getInstance().get($stateParams.personId);
	$scope.myself = YYIMCacheRosterManager.getInstance().getRostersList("myself")[0];
	
	if($scope.group.owner && $scope.group.owner.id == $scope.myself.id){
		$scope.isOwner = true;
	}
	
	var recent = YYIMCacheRecentManager.getInstance().get($scope.group.id);
	$scope.group.stick = recent.stick;
	
	//群组置顶
	$scope.$watch('group.stick',function(newValue,oldValue){
		if(newValue !== oldValue){
			YYIMCacheRecentManager.getInstance().updateCache({
				id:$scope.group.id,
				stick: newValue
			});
			$rootScope.$broadcast("chatlistmessage");
		}
	});
	
	var modifyTimer = null;
	var groupName = $scope.group.name;
	
	/**
	 * 保存群组信息 
	 * @param {Object} e
	 * @param {Object} mode
	 */
	$scope.saveProjectDetail = function(e,mode){
		var message = null;
		
		switch(mode){
			case 'name':
			if(!$scope.group.name ||  $scope.group.name == groupName){
				$scope.group.name = groupName;
				return;
			}
			message = '群组名称已更改！';
			groupName = $scope.group.name;
			$rootScope.$broadcast("chatlistmessage");
			break;
			default:break;
		}
			
		YYIMCacheGroupManager.getInstance().modifyChatGroupInfo({
			to:$scope.group.id,
			name:$scope.group.name,
			success:function(group){
				if(!!group){
					toaster.pop({
					 	title: message,
					 	type: 'success'
					});
				}
			}
		});
	};
	
	/**
	 * 时间控件 
	 * @param {Object} e
	 */
	$scope.openTimer = function(e){
		if($scope.isOwner){
			jQuery(e.target).datetimepicker({
			      lang:"ch",           //语言选择中文
			      format:"Y-m-d",      //格式化日期
			      timepicker:false,    //关闭时间选项
			      yearStart:2000,     //设置最小年份
			      yearEnd:2050,        //设置最大年份
			      todayButton:false    //关闭选择今天按钮
			});
			jQuery(e.target).datetimepicker('show');
		}
	};
	
	/**
	 *  打开添加群成员的窗口
	 */
	$scope.addGroupMember = function(){
		ngDialog.open({
				template: 'message/angular/template/add-groupchat.htm',
				controller: 'addGroupChatController',
				className: '',
				showClose: false,
				data: {
					mode: "addgroupmember",
					group: $scope.group
				}
			});
	};
	
	/**
	 * 关闭详情窗口 
	 */
	$scope.closeDetailDialog = function(e){
		jQuery('.IMChat-group-slide').addClass('beforeHide');
		setTimeout(function(){
			jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden');			
		},500);
		ngDialog.close();
	};
	
	/**
	 * 取消 
	 */
	$scope.cancel = function(){
		ngDialog.close();
	};
	
	/**
	 * 退出群聊 
	 */
	$scope.quitChatGroup = function(){
		$scope.closeDetailDialog();
		ngDialog.open({
			template: 'message/angular/template/confirm-dialog.htm',
			controller: 'groupSetupController',
			className: '',
			data: {
				title: '退出群组',
				message: '确定要退出群组吗？',
				group: $scope.group,
				confirmText: '确定',
				fun: function(e){
					alert('开发中，敬请期待！！');
				}
			},
			showClose: false
		});
	};
	
	/**
	 * 关闭群聊
	 */
	$scope.exitChatGroup = function() {
		ngDialog.open({
			template: 'message/angular/template/confirm-dialog.htm',
			controller: 'groupSetupController',
			className: '',
			data: {
				title: '关闭群组',
				message: '您确定要关闭群组吗？',
				group: $scope.group,
				confirmText: '确定',
				fun: function(e){
					alert('开发中，敬请期待！！');
				}
			},
			showClose: false
		});
	};
	
	//群成员删除按钮
	$scope.deleteGroupMember_Click = function(per, e) {
		e.preventDefault();
		e.stopPropagation();
		ngDialog.open({
			template: 'message/angular/template/delMemberConfirmMessage.htm',
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


.controller('addGroupChatController', ['$rootScope', '$scope', 'urlParseService', '_', '$stateParams', '$state', 'ngDialog', "toaster", 'SearchService', "$compile",function($rootScope, $scope, urlParseService, _, $stateParams, $state, ngDialog, toaster,SearchService,$compile) {
	$scope.PersonList = [];
	$scope.multipleDemo = {};
    $scope.multipleDemo.selectedPeopleWithGroupBy = [];	
    $scope.multipleDemo.originalSelectedPeople = [];
    
    $scope.showList = {
		'friend':{
			name:'我的好友',
			show:false,
			level:2,
			id:'friend',
			selectAll:false
		},'recent':{
			name:'最近联系人',
			show:true,
			level:2,
			id:'recent',
			selectAll:false
		}
	};

	/**
	 *  检查人员是否选中状态
	 */
	$scope.updateDepartMembersCheckType = function(){
		for(var x in $scope.showList){
			var entity = $scope.showList[x];
			if(entity.id && entity.members){
				for(var y in entity.members){
					entity.members[y].checktype = false;
					
					if($scope.ngDialogData.mode == 'addgroupmember'){
						var selectPerpleFilter = _.where($scope.multipleDemo.originalSelectedPeople.concat($scope.multipleDemo.selectedPeopleWithGroupBy), {
							id: entity.members[y].id
						});
						
					}else{
						var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
							id: entity.members[y].id
						});
					}
					
					if(selectPerpleFilter.length){
						entity.members[y].checktype = true;
					}
				}
			}
		}
	};
	
	$scope.showList["recent"].members = YYIMCacheRecentManager.getInstance().getListByChatType('chat',true);
	$scope.updateDepartMembersCheckType();
	
	if(!!$scope.ngDialogData.group){
		$scope.group = $scope.ngDialogData.group;
		
		_.each($scope.group.members,function(item,index){
//			$scope.multipleDemo.selectedPeopleWithGroupBy.push(item);
			$scope.multipleDemo.originalSelectedPeople.push(item);
		});
		$scope.updateDepartMembersCheckType();
	}
	
	/**
	 * 参与人
	 */
	$scope.$watch('multipleDemo.selectedPeopleWithGroupBy', function(newvalue, oldvalue) {
		if(newvalue && newvalue.length){
			var member = newvalue[newvalue.length-1];
			var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
				id: member.id
			});
			if (selectPerpleFilter.length > 1) {
				$scope.multipleDemo.selectedPeopleWithGroupBy.pop();
			}
		}
		$scope.updateDepartMembersCheckType();
		jQuery('.selectAffiliated input').attr('placeholder','搜索名称、拼音、手机号').trigger('focus');
	});
	
	/**
	 * 点击展开部门人员下拉列表
	 * @param {Object} e
	 * @param {Object} departId
	 */
	$scope.toggleDepartMembers = function(e,mode){
		$scope.showList[mode].show = !$scope.showList[mode].show;
		if(!!$scope.showList[mode].show){
			if(mode == "friend"){
				$scope.showList[mode].members = YYIMCacheRosterManager.getInstance().getRostersList("friend");
			}else if(mode == "recent"){
				$scope.showList[mode].members = YYIMCacheRecentManager.getInstance().getListByChatType('chat',true);
			}
			$scope.updateDepartMembersCheckType();
		}
	};
	
	/**
	 * 搜索 参与人
	 * @param {Object} personSearch
	 */
	$scope.refreshPersons = function(keyword,mode) {
		$scope.PersonList.length = 0;
		
		if(!keyword) return;
		
		SearchService.roster({
			keyword: keyword,
			success:function(data){
				if(data && data.items && data.items.length){
					for(var x in data.items){
						if(data.items[x].id){
							
							data.items[x].chatType = 'chat';
							if(mode == 'charge'){
								var selectPerpleFilter = _.where($scope.multipleDemo.selectedChargeWithGroupBy, {
									id: data.items[x].id
								});
							
								if (selectPerpleFilter.length == 0) {
									$scope.ChargeList.push(data.items[x]);
								}
								
							}else{
								var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
									id: data.items[x].id
								});
								
								var selectOriginalSPerpleFilter = _.where($scope.multipleDemo.originalSelectedPeople, {
									id: data.items[x].id
								});
							
								if (selectPerpleFilter.length == 0 && selectOriginalSPerpleFilter.length == 0) {
									$scope.PersonList.push(data.items[x]);
								}
							}
						}
					}
					
				}
			}
		});
		
	};
	
	/**
	 * 全选功能 rongqb 20160418 
	 */
	$scope.seleteDeptAllFlag = {};
	$scope.selectDeptAll = function(e,id) {
		for (var i in $scope.showList[id].members) {
			if(!$scope.showList[id].members[i].id) return;
			
			var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
				id: $scope.showList[id].members[i].id
			});
			
			if (!$scope.showList[id].selectAll && selectPerpleFilter.length != 0) {
				
				if($scope.ngDialogData.mode == 'addgroupmember'){
					var selectOriginalPerpleFilter = _.where($scope.multipleDemo.originalSelectedPeople, {
						id: $scope.showList[id].members[i].id
					});
					
					if(selectOriginalPerpleFilter.length == 0){
						$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
							return obj.id != $scope.showList[id].members[i].id;
						});
					}
				}else{
					$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
						return obj.id != $scope.showList[id].members[i].id;
					});
				}
			}else if($scope.showList[id].selectAll && selectPerpleFilter.length == 0) {
				
				if($scope.ngDialogData.mode == 'addgroupmember'){
					var selectOriginalPerpleFilter = _.where($scope.multipleDemo.originalSelectedPeople, {
						id: $scope.showList[id].members[i].id
					});
					
					if(selectOriginalPerpleFilter.length == 0){
						$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
						$scope.multipleDemo.selectedPeopleWithGroupBy.push($scope.showList[id].members[i]);
					}
				}else{
					$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
					$scope.multipleDemo.selectedPeopleWithGroupBy.push($scope.showList[id].members[i]);
				}
			}
			
			$rootScope.$broadcast("multipleDemo.selectedPeopleWithGroupBy");
			$scope.updateDepartMembersCheckType();
		}
	}
	
	/**
	 * 点击添加成员 
	 * @param {Object} e
	 * @param {Object} member
	 */
	$scope.addGroupLeaguer = function(e, member) {
		var selectPerpleFilter = _.where($scope.multipleDemo.selectedPeopleWithGroupBy, {
			id: member.id
		});
		
		if (selectPerpleFilter.length == 0) {
			
			if($scope.ngDialogData.mode == 'addgroupmember'){
				var selectOriginalPerpleFilter = _.where($scope.multipleDemo.originalSelectedPeople, {
					id:member.id
				});
				
				if(selectOriginalPerpleFilter.length == 0){
					$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
					$scope.multipleDemo.selectedPeopleWithGroupBy.push(member);
				}
			}else{
				$scope.multipleDemo.selectedPeopleWithGroupBy = $scope.multipleDemo.selectedPeopleWithGroupBy || [];
			$scope.multipleDemo.selectedPeopleWithGroupBy.push(member);
			}
			
			
		} else {
			if($scope.ngDialogData.mode == 'addgroupmember'){
				var selectOriginalPerpleFilter = _.where($scope.multipleDemo.originalSelectedPeople, {
					id: member.id
				});
				
				if(selectOriginalPerpleFilter.length == 0){
					$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
						return obj.id != member.id;
					});
				}
			}else{
				$scope.multipleDemo.selectedPeopleWithGroupBy = _.filter($scope.multipleDemo.selectedPeopleWithGroupBy, function(obj) {
					return obj.id != member.id;
				});
			}
		}
		
		$rootScope.$broadcast("multipleDemo.selectedPeopleWithGroupBy");
		$scope.updateDepartMembersCheckType();
	}
	
	
	/**
	 * 关闭创建窗口 
	 */
	$scope.closeCreateGroupChat = function() {
		ngDialog.close();
	}
	
	$scope.isCreateProjecting = false;
	
	$scope.createChatGroup = function(e){
		e.preventDefault();
		e.stopPropagation();
		
		if($scope.isCreateProjecting) return;
		
		
		if(!$scope.project_name){
			toaster.pop({
					title: '群组标题不能为空！',
					type: 'warn'
				});
				
			return;	
		}

		var affiliatedIdList = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'id');
		affiliatedIdList = _.difference(affiliatedIdList);
		
		YYIMCacheGroupManager.getInstance().createChatGroup({
			name:$scope.project_name,
			members:affiliatedIdList,
			success:function(group){
				if(!!group){
					ngDialog.close();
					
					toaster.pop({
					 	title: '群组创建成功！',
					 	type: 'success'
					});
					 
					YYIMCacheRecentManager.getInstance().updateCache({
						id: group.id,
						name: group.name,
						type: 'groupchat',
						sort: true
					});
					
					$state.go("imhome.message", {
						personId: group.id,
						personName: group.name,
						chatType: 'groupchat'
					});
				}
			}
		});
	};
	
	/**
	 * 添加 群成员 
	 */
	$scope.addMembers = function(groupId){
		
		if($scope.isCreateProjecting) return;
		$scope.isCreateProjecting = true;
		
		var affiliatedIdList = _.pluck($scope.multipleDemo.selectedPeopleWithGroupBy, 'id');
		affiliatedIdList = _.difference(affiliatedIdList);
		
		
		YYIMCacheGroupManager.getInstance().inviteGroupMember({
			to: $scope.group.id,
			members:affiliatedIdList,
			success:function(group){
				ngDialog.close();
				
				toaster.pop({
						title: '群组人员添加成功！',
						type: 'success'
					});
			}
		});
		
		
	};


}])