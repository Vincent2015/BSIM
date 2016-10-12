angular.module('IMChat.Controller', ["IMChat.groupSetupController","CommonService"])

.controller('personSearchController', ['$rootScope', '$scope', '_', '$state','SearchService',function($rootScope, $scope, _, $state,SearchService) {
	//被选择人员对象
	
	$scope.someGroupFn = function(item){
		   if(item.chatType == 'groupchat'){
		   		return '群组';
		   }else if(item.chatType == 'pubaccount'){
		   		return '公众号';	
		   }else{
		   		return '联系人';
		   }
	 };
	  
	$scope.searchList = [];
	
	$scope.keyword = null;
	
	$scope.refreshPersons = function(keyword) {
		$scope.searchList.length = 0;
		
		if(!keyword) return;
		$scope.keyword = keyword;
		
		// 搜索联系人
		SearchService.roster({
			keyword: keyword,
			success:function(data){
				$scope.searchList.length = 0;	
				if(!!$scope.keyword && data && data.items && data.items.length){
					for(var x in data.items){
						if(data.items[x].id && data.items[x].id != YYIMChat.getUserID()){
							$scope.searchList.push({
								id: data.items[x].id,
								name: data.items[x].name,
								email: data.items[x].email,
								office: data.items[x].office,
								mobile: data.items[x].mobile,
								chatType: 'chat',
								telephone: data.items[x].telephone
							});
						}
					}
					
				}
			}
		});
		
		// 搜索群组
//		SearchService.group({
//			keyword: keyword,
//			success:function(data){
//				if(data && data.items && data.items.length){
//					for(var x in data.items){
//						if(data.items[x].id){
//							$scope.searchList.push({
//								id: data.items[x].id,
//								name: data.items[x].name,
//								chatType: 'groupchat'
//							});
//						}
//					}
//				}
//			}
//		});
//		
//		// 搜索公众号
//		SearchService.pubaccount({
//			keyword: keyword,
//			success:function(data){
//				if(data && data.items && data.items.length){
//					for(var x in data.items){
//						if(data.items[x].id){
//							$scope.searchList.push({
//								id: data.items[x].id,
//								name: data.items[x].name,
//								chatType: 'pubaccount',
//								type:data.items[x].type
//							});
//						}
//					}
//				}
//			}
//		});
	};
	$scope.goToMessage_Search = function(item,e) {
		e.preventDefault();
		e.stopPropagation();
		
		if(item.id !== YYIMChat.getUserID()){
			YYIMCacheRecentManager.getInstance().updateCache({
				id: item.id,
				name: item.name,
				type: item.chatType,
				sort: true
			});
		}
		
		jQuery('.IMChat-search .dropdown-menu').scrollTop(0);
		$state.go("imhome.message", {
			personId: item.id,
			personName: item.name,
			chatType: item.chatType
		});
		
		$scope.$emit("chatHistoryListChange_toparent", item);
	};
}])

.controller('personController', ['$rootScope', '$scope', "$state", function($rootScope, $scope, $state) {
	
}])

.controller('confirmController', ['$rootScope', 'ngDialog','$scope', "$state", function($rootScope,ngDialog, $scope, $state) {
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
}])

.controller('personcardController', ['$rootScope', 'ngDialog', 'toaster','$scope', "$state",'NWKeyService', function($rootScope, ngDialog, toaster, $scope, $state,NWKeyService) {
	$scope.ismac = NWKeyService.ismac;
	$scope.iswin = NWKeyService.iswin;
	
	$scope.roster = YYIMCacheRosterManager.getInstance().updateCache({id: $scope.ngDialogData.id});
	$scope.personCardInfo = $scope.roster.vcard;
	$scope.enableVCardFields = YYIMCacheRosterManager.getInstance().enableVCardFields;

	$scope.copyOriginal = function(e,mode){
		$scope.original = $scope.original || {}; 
		$scope.original[mode] = $scope.personCardInfo[mode];
	}
	
	$scope.saveMyInfo = function(e,mode){
		var arg = {
			success:function(){
			}
		};
		
		if(!$scope.personCardInfo['name']){
			arg.vcard = arg.vcard || {};
			arg.vcard.name = $scope.personCardInfo['name'] = $scope.personCardInfo['id'];
		}
		
		if($scope.personCardInfo[mode] !== $scope.original[mode]){
			arg.vcard = arg.vcard || {};
			arg.vcard[mode=='name'? 'nickname':mode] = $scope.personCardInfo[mode];
			YYIMCacheRosterManager.getInstance().setVCard(arg);
		}
	};
	
	$scope.goToMessageChat = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		
		YYIMCacheRecentManager.getInstance().updateCache({
			id: item.id,
			name: item.name,
			type: 'chat',
			sort: true
		});
		
		$rootScope.$broadcast("chatlistmessage");
		
		$state.go("imhome.message", {
			personId: item.id,
			personName: item.name,
			chatType: 'chat'
		});
		
		$scope.closeWin();
	};
	
	$scope.closeWin = function(){
		ngDialog.close();
	};
	
	//添加好友
	$scope.addFriend = function(item,e){
		if(item && item.id){
			ngDialog.open({
				template: 'message/angular/template/confirm-dialog.htm',
				controller: 'confirmController',
				className: '',
				data: {
					title: '添加好友',
					message: '确定要添加'+ item.name +'为好友吗？',
					confirmText: '确定',
					fun: function(e){
						YYIMCacheRosterManager.getInstance().addRoster(item.id);
						ngDialog.close();
						toaster.pop({
							title: '添加好友请求已发送！',
							type: 'success'
						});
					}
				},
				showClose: false
			});
		}
	};
	
	//同意好友请求
	$scope.approveFriend = function(item,e){
		if(item && item.id){
			ngDialog.open({
				template: 'message/angular/template/confirm-dialog.htm',
				controller: 'confirmController',
				className: '',
				data: {
					title: '同意添加好友请求',
					message: '确定要同意添加'+ item.name +'为好友吗？',
					confirmText: '确定',
					fun: function(e){
						YYIMCacheRosterManager.getInstance().approveRoster(item.id);
						ngDialog.close();
						toaster.pop({
							title: item.name + '已成为你的好友！',
							type: 'success'
						});
					}
				},
				showClose: false
			});
		}
	};
	
	//删除好友
	$scope.removeFriend = function(item,e){
		if(item && item.id){
			ngDialog.open({
				template: 'message/angular/template/confirm-dialog.htm',
				controller: 'confirmController',
				className: '',
				data: {
					title: '删除好友',
					message: '确定要删除'+ item.name +'这个好友？',
					confirmText: '确定',
					fun: function(e){
						YYIMCacheRosterManager.getInstance().deleteRoster({
							id:item.id,success:function(){
								ngDialog.close();
								toaster.pop({
									title: item.name + '已成功删除！',
									type: 'success'
								});
							}
						});
					}
				},
				showClose: false
			});
		}
	};
	
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
		
		$rootScope.$broadcast("chatlistmessage");
		
		$state.go("imhome.message", {
			personId: item.id,
			personName: item.name,
			chatType: 'pubaccount'
		});
	};
	
}])
