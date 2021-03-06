﻿var app = angular.module("app", ["ui.router", 'ui.select', 'IMChat.Controller', 'IMChat.ThirdPlug', "ngSanitize", "IMChatUrl.Service", "IMChat.Group.Controller", "IMChat.Friend.Controller", "IMChat.ExpressionFilter", "IMChat.atMsgFilter", "infiniteScroll", "IMChat.cutStringFilter",
	"ngStorage", "toaster", "ngAnimate", "ngCookies", "ngDialog", "IMChatOpenUrl", "IMChatOnImgError", "IMChat.AudioPlay", "IMChat.NWKeyService",
	"imageCropper", "IMChat.FileCaptureService", "IMChat.FileConvertService", "IMChat.UpdateService", "IMChat.NWKeyService"
]);

app.filter('photoname', function() {
	return function(input) {
		var result = "";
		if (input) {
			switch (input.length) {
				case "0":
				case "1":
				case "2":
					result = input;
					break;
				default:
					result = input.substr(input.length - 2, 2);
					break;
			}
		}
		return result;
	}
});

app.filter('getFirstLetter', function() {
	return function(input) {
		return getFirstLetter(input);
	}
});

/**
 * 根据场景获取相应界面组件的权限  rongqb 20160412
 */
app.filter('getSpectacle', ['$rootScope', function($rootScope) {
	return function(input) {
		var spectacle = $rootScope.$stateParams.spectacle.toUpperCase();
		var power = YYIMAngularConfig['SPECTACLE'][spectacle] || YYIMAngularConfig['SPECTACLE']['MESSAGE'];
		return power[input.toString().toUpperCase()];
	}
}]);

app.config(function($stateProvider, $urlRouterProvider, $compileProvider) {

	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|sms|app):/);
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|app):/);

	$stateProvider
		.state("imhome", {
			url: "/imhome",
			params: {
				'spectacle': 'MESSAGE'
			},
			templateUrl: "message/angular/template/menu-pannel-imhome.htm",
			controller: "chatListctrl"
		})
		.state("imhome.message", {
			url: "/message",
			params: {
				'personId': '',
				'personName': '',
				'chatType': '',
				'spectacle': 'MESSAGE',
				'author': ''
			},
			templateUrl: "message/angular/template/list-content-message.htm",
			controller: "messageController"
		})
		.state("imhome.messsidebar", {
			url: "/messsidebar",
			params: {
				'personId': '',
				'personName': '',
				'chatType': '',
				'spectacle': 'MESSAGE'
			},
			templateUrl: "message/angular/template/list-content-sidebar.htm",
			controller: "messageController"
		})
		.state("contacts", {
			url: "/contacts",
			templateUrl: "message/angular/template/menu-pannel-contacts.htm",
		})
		.state("contacts.friend", {
			url: "/friend",
			templateUrl: "message/angular/template/list-content-friend.htm",
			controller: "friendController"
		})
		.state("contacts.group", {
			url: "/group",
			templateUrl: "message/angular/template/list-content-group.htm",
			controller: "groupController"
		})
		.state("contacts.pubAcc", {
			url: "/pubAcc",
			templateUrl: "message/angular/template/list-content-pubAcc.htm",
			controller: "publicAccountController"
		})

	//	$urlRouterProvider.otherwise('/imhome');
});

app.config(function($sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
		// Allow same origin resource loads.
		'self',
		// Allow loading from our assets domain.  Notice the difference between * and **.
		'http://h.yonyou.com/**', "http://y.yonyou.com/**", "https://h.yonyou.com/**"
	]);
})


app.controller("mainCtrl", ['$rootScope', '$scope', "$stateParams", "$state", '$cookies', '$interval', "ngDialog", "NWKeyService", "updateService", "$compile","toaster",
	function($rootScope, $scope, $stateParams, $state, $cookies, $interval, ngDialog, NWKeyService, updateService, $compile,toaster) {

		$scope.$on("currentPersonInfo", function(name, data) {
			$scope.currentPersonInfo = YYIMCacheRosterManager.getInstance().getRostersList('myself')[0];
		});

		$scope.ismac = NWKeyService.ismac;
		$scope.iswin = NWKeyService.iswin;

		$scope.reconnect = function(e) {
			YYIMChat.disConnect();
			YYIMChat.connect();
			return false;
		}

		$scope.$on("userstateChange", function(name, data) {

			if (data.status == "chat") {
				$rootScope.userState.isonline = true;
				snsLoginConflict = false;
				$rootScope.islogout = false;
			} else {
				$rootScope.userState.isonline = false;
			}
		});

		$scope.logout = function() {
			YYIMChat.logout();
			location.reload();
		}

		$scope.NO_Click = function() {
			ngDialog.close();
		}

		$scope.OK_Click = function() {
			$scope.logout();
		}

		$scope.logoutConfirm = function() {
			$scope.logout();
		}

		$scope.compileservice = function(ele, scope) {
			return $compile(ele)(scope);
		}

		$scope.safeApply = function(fn) {
			var phase = $scope.$$phase;
			if (phase == "$apply" || phase == "$digest") {
				if (fn && (typeof(fn) === "function")) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};

		/**
		 * iframe 打开应用
		 * @param {Object} appinfo
		 */
		$scope.openAppH5 = function(appinfo) {
			ngDialog.open({
				template: 'message/angular/template/app-Dialog.htm',
				controller: 'appCenterController',
				className: '',
				showClose: false,
				closeByEscape: false,
				closeByDocument: true,
				data: {
					appinfo: appinfo
				}
			});
		}

		$scope.safeApply = function(fn) {
			var phase = $scope.$$phase;
			if (phase == "$apply" || phase == "$digest") {
				if (fn && (typeof(fn) === "function")) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};

		$interval(function() {
			$scope.safeApply(function() {});
		}, 400);

		$scope.exps = SNSExpressionData.DEFAULT;

		$scope.expressionShow = {
			show: false
		};

		$scope.addFace = function(index) {
			$scope.expressionShow.show = false;
			jQuery('#IMChat_msg_cont').val(jQuery('#IMChat_msg_cont').val().trim() + $scope.exps.data[index].actionData);
			jQuery('#IMChat_msg_cont').trigger('click').focus();
			$scope.handleInputMsg();
		}

		$scope.handleClick = function(event) {
			var _target = jQuery(event.target);
			if (!_target.hasClass('expression-tool')) {
				$scope.expressionShow.show = false;
			}
		}

		$scope.AllUnReadCounts = 0;

		$scope.$on("unreadchatmessage", function(name, data) {
			var length = YYIMCacheMessageManager.getInstance().unReadedNum;
			var lengthinfo = length > 99 ? "99+" : length;
			$scope.AllUnReadCounts = lengthinfo;
		})

		$scope.$on("unreadchatmessagechange", function(name, data) {
			var length = YYIMCacheMessageManager.getInstance().unReadedNum;
			var lengthinfo = length > 99 ? "99+" : length;
			$scope.AllUnReadCounts = lengthinfo;
		})

		$scope.handleInputMsg = function(e) {
			var _inputBox = jQuery('#IMChat_msg_cont');
			if (jQuery.trim(_inputBox.val()) && !jQuery('.IMChat-send-btn').hasClass('active')) {
				jQuery('.IMChat-send-btn').removeAttr('disabled', '');
				jQuery('.IMChat-send-btn').addClass('active');

			} else if (!jQuery.trim(_inputBox.val())) {
				jQuery('.IMChat-send-btn').removeClass('active').attr('disabled', 'true');
			}
			$scope.$broadcast("AtSomeOne", e);
		}

		$scope.keyDown = function(e) {
			if (e.keyCode === 8 || e.keyCode === 46) {
				$scope.$broadcast("deleteEdit", e, e.keyCode);
			}
		};

		$scope.modelVis = {
			cover: true,
			offlined: true,
			delGroupMem: false
		};

		$scope.doConfirm = function() {
			$scope.modelVis.cover = false;
			$scope.modelVis.offlined = false;
			$scope.modelVis.delGroupMem = false;
		}

		$scope.scanePic = function(e) {
			var target = jQuery(e.target);
			if (target.hasClass('chat-img')) {
				ngDialog.open({
					template: 'message/angular/template/img-viewer.htm',
					controller: 'mainCtrl',
					className: '',
					showClose: false,
					data: {
						imgSrc: target.attr('src')
					}
				});
			}
		}

		$scope.createGroupChat = function(e) {
			ngDialog.open({
				template: 'message/angular/template/add-groupchat.htm',
				controller: 'addGroupChatController',
				className: '',
				showClose: false,
				data: {
					chatinfo: $scope.chatiteminfo
				}
			});
		};

		$scope.detailGroupChat = function(e) {
			ngDialog.open({
				template: 'message/angular/template/group-setup.htm',
				controller: 'groupSetupController',
				className: '',
				showClose: false,
				overlay: false,
				data: {
					chatinfo: $scope.chatiteminfo
				}
			});

		};
		$scope.goToHashPosition = function(e, messagePrompt) {
			e.preventDefault();
			e.stopPropagation();

			if ($stateParams.personId != messagePrompt.personId) {
				$state.go("imhome.message", {
					personId: messagePrompt.personId,
					personName: messagePrompt.personName,
					chatType: messagePrompt.chatType,
					author: messagePrompt.author
				});
			} else {
				window.location.hash = messagePrompt.author;
				jQuery('body').scrollTop(0);
			}

			jQuery('#message-prompt').addClass('beforeHide');
			setTimeout(function() {
				$scope.messagePrompt.show = false;
				jQuery('#message-prompt').hide().removeClass('beforeHide');
			}, 500);
		};

		$scope.messagePrompt = {
			show: false
		};

		var atTimeouter = null;
		$scope.$on('atBySomeOne', function(name, message) {
			var type = YYIMAngularConstant.CHAT_TYPE.CHAT;
			var target = (message.from.id == message.opposite) ? message.from : message.to;
			if (target instanceof YYIMCacheGroup) {
				type = YYIMAngularConstant.CHAT_TYPE.GROUP_CHAT;
			} else if (target instanceof YYIMCachePubAccount) {
				type = YYIMAngularConstant.CHAT_TYPE.GROUP_CHAT;
			}

			$scope.messagePrompt = {
				author: message.id,
				show: true,
				title: message.from.name,
				atContent: message.data.content,
				name: !!message.fromRoster ? message.fromRoster.name : message.from.name,
				dateline: message.data.dateline,
				personId: target.id,
				personName: target.name || target.id,
				chatType: type
			};
			jQuery('#message-prompt').show();

			if (!!atTimeouter) clearTimeout(atTimeouter);
			atTimeouter = setTimeout(function() {
				jQuery('#message-prompt').addClass('beforeHide');
				setTimeout(function() {
					$scope.messagePrompt.show = false;
					jQuery('#message-prompt').hide().removeClass('beforeHide');
				}, 500);
			}, 10000)
		});
		
		//发起电话会议
		$scope.multiPartyCall = function(e,targetMobile){
			var handle;
			
			var myself = YYIMCacheRosterManager.getInstance().getRostersList("myself")[0];
			if(!YYIMRegularUtil.mobile.test(targetMobile)){
				handle = {
					title: '电话会议',
					message: '对方手机号码未设置！！'
				};
			}else if(!YYIMRegularUtil.mobile.test(myself.vcard.mobile)){
				handle = {
					title: '电话会议',
					message: '发起人手机号码未设置！！'
				};
			}else{
				handle = {
					title: '电话会议',
					message: '确定发起电话会议？',
					confirmText: '确定',
					fun: function(e){
						YYIMChat.multiPartyCall({
							caller: myself.vcard.mobile,
							phones: [targetMobile],
							accountMmanaged:true,
							success:function(){
								toaster.pop({
									title: '电话会议发起成功，请稍候！！',
									type: 'success'
								});
								ngDialog.close();
							},error:function(){
								toaster.pop({
									title: '你尚未开通电话会议的权限！！',
									type: 'warn'
								});
								ngDialog.close();
							}
						});
					}
				};
			}
			
			ngDialog.open({
				template: 'message/angular/template/confirm-dialog.htm',
				controller: 'confirmController',
				className: '',
				data: handle,
				showClose: false
			});
			
		};
		
		//查看某人信息
		$scope.checkRosterInfo = function(e,id) {
			e.preventDefault();
			e.stopPropagation();
			
			ngDialog.open({
				template: 'message/angular/template/user-info.htm',
				controller: 'personcardController',
				className: '',
				data: {
					id: id || YYIMChat.getUserID()
				},
				showClose: false
			});
		}
	}
]);

app.controller("messageController", ["$scope", "$stateParams", "$state", "$rootScope", "_", "$interval", "toaster", "ngDialog", "fileCaptureService", "NWKeyService", "fileConvertService", "SearchService", function($scope, $stateParams, $state, $rootScope, _, $interval, toaster, ngDialog, fileCaptureService, NWKeyService, fileConvertService, SearchService) {
	console.log($stateParams.personId + "---" + $stateParams.personName + "---" + $stateParams.chatType);

	$(".capturecontrl").remove();
	var span = $('<span  class="capturecontrl"></span>');
	span.html('<embed id="screenshotPlugin" wmode="opaque" width="0" height="0" type="application/x-dingscreenshot-plugin"></embed>');
	$("body").append(span);

	$scope.safeApply = function(fn) {
		var phase = $scope.$$phase;
		if (phase == "$apply" || phase == "$digest") {
			if (fn && (typeof(fn) === "function")) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};

	$interval(function() {
		$scope.safeApply(function() {});
	}, 400);

	var manager = null;
	switch ($stateParams.chatType) {
		case 'groupchat':
			manager = YYIMCacheGroupManager.getInstance();
			break;
		case 'pubaccount':
			manager = YYIMCachePubAccountManager.getInstance();
			break;
		default:
			manager = YYIMCacheRosterManager.getInstance();
			break;
	}

	$scope.entity = manager.get($stateParams.personId);

	YYIMCacheRecentManager.getInstance().updateCache({
		id: $scope.entity.id,
		isHaveAt: false
	});


	$scope.chatiteminfo = {
		id: $stateParams.personId,
		name: $scope.entity ? $scope.entity.name : $stateParams.personName,
		type: $stateParams.chatType
	};


	$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
		id: $rootScope.$stateParams.personId,
		condition: 'all'
	});

	if ($scope.chatMessages.length < 10) {
		YYIMCacheMessageManager.getInstance().getHistoryMessage({
			id: $scope.chatiteminfo.id,
			chatType: $scope.chatiteminfo.type,
			present: $scope.chatMessages.length,
			success: function() {
				$rootScope.$broadcast("chatlistmessage");
				$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
					id: $rootScope.$stateParams.personId,
					condition: 'all'
				});
			}
		});
	}

	$scope.$emit("unreadchatmessagechange", "change");

	$scope.$on("chatmessage", function(name, data) {
		if ($rootScope.$stateParams.personId) {
			$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
				id: $rootScope.$stateParams.personId,
				condition: 'all'
			});
			var scrollDis = jQuery('.message-entity').height() - jQuery('.IMChat-entity-display').scrollTop();
			if (scrollDis > (jQuery('.IMChat-entity-display').height() + 200)) {
				$scope.latest_btn.show = true;
			} else {
				$scope.checkLatest(data);
			}
		} else {
			$scope.$emit("unreadchatmessagechange", "change");
		}
	});

	$scope.$on("groupchatmessage", function(name, data) {
		if ($rootScope.$stateParams.personId) {
			$scope.$apply(function() {
				$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
					id: $rootScope.$stateParams.personId,
					condition: 'all'
				});
			})
			var scrollDis = jQuery('.message-entity').height() - jQuery('.IMChat-entity-display').scrollTop();
			if ($rootScope.$stateParams.personId.toLowerCase() == data.from.id) {
				if (scrollDis > (jQuery('.IMChat-entity-display').height() + 200)) {
					$scope.latest_btn.show = true;
				} else {
					$scope.checkLatest(data);
				}
			}
			$scope.$emit("unreadchatmessagechange", "change");
		}

	})

	$scope.atSomeOne = function(e) {
		var cursorIndex = $scope.AtHandler.getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
		var temp = '';
		var inputContent = jQuery('#IMChat_msg_cont').val();
		temp += inputContent.slice(0, cursorIndex) + '@';
		temp += inputContent.slice(cursorIndex);
		jQuery('#IMChat_msg_cont').val(temp);
		$scope.AtHandler.setCaretPosition(jQuery('#IMChat_msg_cont')[0], cursorIndex + 1);
		$scope.$emit("AtSomeOne", e);
	};

	//编辑框内容
	$scope.EditBox = {
		content: ''
	};

	$scope.AtHandler = (function() {
		/**
		 * 获取光标的位置
		 * @param {Object} ctrl
		 */
		function getCursortPosition(ctrl) {
			var CaretPos = 0; // IE Support
			if (document.selection) {
				ctrl.focus();
				var Sel = document.selection.createRange();
				Sel.moveStart('character', -ctrl.value.length);
				CaretPos = Sel.text.length;
			}
			// Firefox support
			else if (ctrl.selectionStart || ctrl.selectionStart == '0')
				CaretPos = ctrl.selectionStart;
			return (CaretPos);
		}

		/**
		 * 设置光标的位置
		 * @param {Object} ctrl
		 * @param {Object} pos
		 */
		function setCaretPosition(ctrl, pos) {
			if (ctrl.setSelectionRange) {
				ctrl.focus();
				ctrl.setSelectionRange(pos, pos);
			} else if (ctrl.createTextRange) {
				var range = ctrl.createTextRange();
				range.collapse(true);
				range.moveEnd('character', pos);
				range.moveStart('character', pos);
				range.select();
			}
		}

		function appendAtUnit(member) {
			var temp = '';
			var str = jQuery('#IMChat_msg_cont').val();

			var cursorIndex = getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
			var atIndex = str.lastIndexOf('@', cursorIndex - 1);

			var unit = '@' + member.name + ' ';
			temp = str.slice(0, atIndex);
			temp += unit;
			temp += str.slice(cursorIndex);

			var selectPerpleFilter = _.where(YYIMCacheMessageManager.getInstance().atUserList, {
				id: member.id
			});

			if (selectPerpleFilter.length == 0) {
				YYIMCacheMessageManager.getInstance().atUserList.push({
					id: member.id,
					name: member.name,
					start: atIndex,
					end: atIndex + unit.length
				});
			}

			return temp;
		}

		function getAtStr() {
			var temp = '';
			var str = jQuery('#IMChat_msg_cont').val();

			var cursorIndex = getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
			setCaretPosition(jQuery('#textedit-box-hide .cont')[0], cursorIndex);

			var atIndex = str.lastIndexOf('@', cursorIndex - 1);
			var backIndex = str.indexOf(' ', atIndex);

			if (atIndex > -1) {
				temp = str.slice(atIndex, cursorIndex);
				return (backIndex >= cursorIndex || backIndex == -1) ? temp : '';
			}

		}

		function deleteAtStrLeft() {
			var temp = '';
			var str = jQuery('#IMChat_msg_cont').val();

			var cursorIndex = getCursortPosition(jQuery('#IMChat_msg_cont')[0]);

			var atIndex = str.lastIndexOf('@', cursorIndex - 1);
			var backIndex = str.indexOf(' ', atIndex);

			if (atIndex > -1 && backIndex > -1) {
				temp += str.slice(0, atIndex);
				temp += str.slice(cursorIndex);

				if (backIndex == cursorIndex - 1) {
					var deleteName = str.slice(atIndex + 1, backIndex);

					var done = false;
					_.each(YYIMCacheMessageManager.getInstance().atUserList, function(item, index, atuser) {
						if (item.name == deleteName && item.start == atIndex) {
							YYIMCacheMessageManager.getInstance().atUserList = _.filter(YYIMCacheMessageManager.getInstance().atUserList, function(obj) {
								return obj.name != deleteName;
							});
							done = true;
						}
					});
					return done ? temp : str;
				}
			}
			return str;
		}

		function deleteAtStrRight() {
			var temp = '';
			var str = jQuery('#IMChat_msg_cont').val();

			var cursorIndex = getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
			var atIndex = str.indexOf('@', cursorIndex);
			var backIndex = str.indexOf(' ', atIndex);

			if (atIndex > -1 && backIndex > -1) {
				temp += str.slice(0, atIndex);
				temp += str.slice(backIndex + 1);

				if (atIndex == cursorIndex) {
					var deleteName = str.slice(atIndex + 1, backIndex);
					var done = false;

					_.each(YYIMCacheMessageManager.getInstance().atUserList, function(item, index, atuser) {
						if (item.name == deleteName && item.start == atIndex) {
							YYIMCacheMessageManager.getInstance().atUserList = _.filter(YYIMCacheMessageManager.getInstance().atUserList, function(obj) {
								return obj.name != deleteName;
							});
							done = true;
						}
					});

					return done ? temp : str;
				}
			}
			return str;
		}

		function onCursorMove(e) {
			if (e.keyCode >= 37 && e.keyCode <= 40 || e.which == 1) {
				var temp = '';
				var str = jQuery('#IMChat_msg_cont').val();

				var cursorIndex = getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
				var atIndex = str.lastIndexOf('@', cursorIndex - 1);
				var backIndex = str.indexOf(' ', atIndex);

				if (atIndex > -1 && backIndex >= cursorIndex) {
					temp = str.slice(cursorIndex, backIndex);
					if (temp.indexOf('@') == -1) {
						var deleteName = str.slice(atIndex + 1, backIndex);
						var isTarget = false;

						_.each(YYIMCacheMessageManager.getInstance().atUserList, function(item, index, atuser) {
							if (item.name == deleteName && item.start == atIndex) {
								isTarget = true;
							}
						});

						if (isTarget) {
							var target = atIndex;
							if (e.keyCode == 39) {
								target = backIndex + 1;
							}
							setCaretPosition(jQuery('#IMChat_msg_cont')[0], target);
						}
						return !isTarget;
					}
				}
			}
			return true;
		}

		return {
			getCursortPosition: getCursortPosition,
			setCaretPosition: setCaretPosition,
			appendAtUnit: appendAtUnit,
			getAtStr: getAtStr,
			deleteAtStrLeft: deleteAtStrLeft,
			deleteAtStrRight: deleteAtStrRight,
			onCursorMove: onCursorMove
		};
	})();

	$scope.$on('AtSomeOne', function(name, e) {
		if ($stateParams.chatType == 'groupchat') {
			var _inputBox = jQuery('#IMChat_msg_cont');
			if (!!e) {
				var atStr = ''
				if ($scope.AtHandler.onCursorMove(e)) {
					atStr = $scope.AtHandler.getAtStr();
				}
				if (!!atStr) {
					$scope.showAtBox(atStr.replace('@', ''));
				} else {
					jQuery('.IMChat-entity-list').addClass('hidden');
				}
			}
			$scope.EditBox.content = _inputBox.val();
		}
	});

	$scope.$watch("EditBox.content", function(newValue, oldValue) {
		newValue = jQuery.trim(newValue);
		oldValue = jQuery.trim(oldValue);

		if (newValue !== oldValue) {
			var atUserList = YYIMCacheMessageManager.getInstance().atUserList;
			var cursorIndex = $scope.AtHandler.getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
			for (var x in atUserList) {
				if (!!atUserList[x].id && atUserList[x].start >= (cursorIndex - (newValue.length - oldValue.length))) {
					atUserList[x].start += (newValue.length - oldValue.length) || 0;
					atUserList[x].end += (newValue.length - oldValue.length) || 0;
				}
			}
		}
	});

	$scope.handleClick = function(e) {
		$scope.AtHandler.onCursorMove(e);
	};

	$scope.$on('deleteEdit', function(name, e, keyCode) {
		if ($stateParams.chatType == 'groupchat') {
			var _inputBox = jQuery('#IMChat_msg_cont');
			var inputCont = _inputBox.val();
			if (keyCode == 8) {
				var deleteAtStr = $scope.AtHandler.deleteAtStrLeft();
			} else if (keyCode == 46) {
				var deleteAtStr = $scope.AtHandler.deleteAtStrRight();
			}

			if (deleteAtStr != inputCont) {
				e.preventDefault();
				e.stopPropagation();
				var cursorIndex = $scope.AtHandler.getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
				$scope.EditBox.content = deleteAtStr;
				_inputBox.val(deleteAtStr);
				$scope.groupMembers.length = 0;
				if (keyCode == 8) {
					$scope.AtHandler.setCaretPosition(jQuery('#IMChat_msg_cont')[0], cursorIndex - (inputCont.length - deleteAtStr.length));
				} else if (keyCode == 46) {
					$scope.AtHandler.setCaretPosition(jQuery('#IMChat_msg_cont')[0], cursorIndex);
				}
			}

		}
	});

	$scope.getMemberTimeouter = null;
	$scope.showAtBox = function(searchStr) {
		var _inputBox = jQuery('#IMChat_msg_cont');
		var inputCont = _inputBox.val();
		var cursorIndex = $scope.AtHandler.getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
		jQuery('#textedit-box-hide .cont').html(inputCont.slice(0, cursorIndex));

		clearTimeout($scope.getMemberTimeouter);
		$scope.getMemberTimeouter = setTimeout(function() {
			$scope.groupMembers = $scope.groupMembers || [];
			$scope.groupMembers.length = 0;
			for (var x in $scope.entity.members) {
				if (!!$scope.entity.members[x].id && $scope.entity.members[x].id != YYIMChat.getUserID()) {
					var selectPerpleFilter = _.where(YYIMCacheMessageManager.getInstance().atUserList, {
						id: $scope.entity.members[x].id
					});

					if (selectPerpleFilter.length == 0 && (!searchStr || (!!$scope.entity.members[x].name && $scope.entity.members[x].name.indexOf(searchStr) > -1) || (!!$scope.entity.members[x].email && $scope.entity.members[x].email.indexOf(searchStr) > -1))) {
						$scope.groupMembers.push($scope.entity.members[x]);
					}
				}
			}

			if ($scope.groupMembers.length) {
				jQuery('.IMChat-entity-list').css({
					left: jQuery('#textedit-box-hide .cursor').position().left - 10,
					bottom: jQuery('.textedit-box-container').height() - jQuery('#textedit-box-hide .cursor').position().top + 10
				}).removeClass('hidden');
			}
		}, 200);
	};

	$scope.appendToAt = function(e, member) {
		var _inputBox = jQuery('#IMChat_msg_cont');
		var inputCont = _inputBox.val();
		if (member.id) {
			var cursorIndex = $scope.AtHandler.getCursortPosition(jQuery('#IMChat_msg_cont')[0]);
			var finaStr = $scope.AtHandler.appendAtUnit(member);
			$scope.EditBox.content = finaStr;
			_inputBox.val(finaStr);
			$scope.groupMembers.length = 0;
			$scope.AtHandler.setCaretPosition(jQuery('#IMChat_msg_cont')[0], cursorIndex + finaStr.length - inputCont.length);
			jQuery('.IMChat-entity-list').addClass('hidden');
		}
	}

	$scope.chattype = {
		chattype: $rootScope.$stateParams.chatType
	};

	$scope.getfileurl = function(thumbId) {
		return YYIMChat.getFileUrl(thumbId);
	};

	$scope.handleKeyup = function(e) {
		var _inputBox = jQuery('#IMChat_msg_cont');
		if (jQuery.trim(_inputBox.text()) && !jQuery('.IMChat-send-btn').hasClass('active')) {
			jQuery('.IMChat-send-btn').addClass('active');
		} else {
			jQuery('.IMChat-send-btn').removeClass('active');
		}
	};

	$scope.presskey = function(e) {
		if (e.keyCode == 13) {
			if ($(".textedit-box").val().trim()) {
				$scope.sendMessage();
			}
			e.preventDefault();
			e.stopPropagation();
		}
	};

	$scope.canLoad = true;

	$scope.pullHistoryMessage = function() {
		jQuery('.loading-animation').removeClass('hidden');
		YYIMCacheMessageManager.getInstance().getHistoryMessage({
			id: $rootScope.$stateParams.personId,
			chatType: $scope.chatiteminfo.type,
			success: function() {
				$scope.safeApply(function() {
					$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
						id: $rootScope.$stateParams.personId,
						condition: 'all'
					});
					jQuery('.loading-animation').addClass('hidden');
					jQuery('.IMChat-entity-display').scrollTop('5');
				})
			}
		});
	}

	/**
	 * 获取文档 转换情况
	 * @param {Object} e
	 * @param {Object} attach
	 */
	$scope.getTransformResult = function(e, attach) {
		YYIMChat.getTransformFileList({
			attachId: attach.attachId,
			success: function(data) {
				if (!!data && data.result) {
					$scope.openWhiteBoard(data.result || []);
				} else {
					toaster.pop({
						title: '该文档不能预览！',
						type: 'warn'
					});
				}
			}
		});
	};

	/**
	 * 发送白板消息 20160329 
	 * @param {Object} e
	 */
	$scope.sendWhiteBoard = function(text) {
		YYIMCacheMessageManager.getInstance().sendWhiteBoardMessage({
			to: $rootScope.$stateParams.personId,
			type: $rootScope.$stateParams.chatType,
			content: {
				wid: window.currentWhiteBoard.wid,
				name: window.currentWhiteBoard.name,
				text: text
			},
			success: function(message) {
				YYIMCacheRecentManager.getInstance().updateCache({
					id: message.opposite,
					dateline: message.dateline,
					latestState: message.data,
					type: message.type,
					contentType: message.data.contentType,
					sort: true
				});
				$rootScope.$broadcast("chatlistmessage");

				$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
					id: $rootScope.$stateParams.personId,
					condition: 'all'
				});
				jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height());
				$scope.checkLatest();
			},
			error: function(err) {
				toaster.pop({
					title: '白板发送失败，请重试！',
					type: 'error',
					showCloseButton: true
				});
			}
		});
	};

	/**
	 * 监听白板  20160329
	 * @param {Object} content
	 * @param {Object} e
	 */
	$scope.listenToWhiteBorad = function(content, e) {

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能打开白板，请退出重试！',
				type: 'warn'
			});
			return false;
		}


		var origin = YYIMChat.getUserID();
		if ($rootScope.$stateParams.chatType == 'groupchat') {
			origin = $rootScope.$stateParams.personId;
		}

		YYIMChat.operateWhiteBoard({
			wid: content.wid,
			origin: origin,
			operation: 'listen',
			success: function(data) {
				if (!!data.wid) {
					window.currentWhiteBoard = {
						wid: data.wid,
						name: data.name
					};

					if (jQuery('#whiteBoradCover > *').length < 2) {
						jQuery.get('message/whiteboard/whiteboard.html').done(function(data) {
							jQuery('#whiteBoradCover').append(data);
						});
					}
					setTimeout(function() {
						resizeHandler()
					}, 500)
					jQuery('#whiteBoradCover').show();
					svgCanvas.undoMgr.resetUndoStack();
					window.temVar.loadFromString("" + decodeURIComponent(data.data.replace(/&amp;/g, '&')));
					//					window.temVar.loadFromString(""+(data.data));
				}
			},
			error: function() {
				toaster.pop({
					title: '您刚刚监听白板：' + window.currentWhiteBoard + '失败了！',
					type: 'error',
					showCloseButton: true
				});
			}
		});
	};

	/**
	 * 关闭白板 20160329
	 * @param {Object} e
	 */
	$rootScope.closeWhiteBoard = function(e) {

		jQuery('#whiteBoradCover').hide();

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能发送关闭消息，请退出重试！',
				type: 'warn'
			});
			return false;
		}

		var origin = YYIMChat.getUserID();
		if ($rootScope.$stateParams.chatType == 'groupchat') {
			origin = $rootScope.$stateParams.personId;
		}

		if (window.svgCanvas.undoMgr.undoStack.length > 1) {
			$scope.sendWhiteBoard(YYIMCacheRosterManager.getInstance().getRostersList('myself')[0].name + '标注了一个白板');
		}

		YYIMChat.operateWhiteBoard({
			wid: window.currentWhiteBoard.wid,
			origin: origin,
			operation: 'end',
			success: function(data) {

			},
			error: function() {}
		});
	};

	/**
	 * 新建白板 20160329 
	 * @param {Object} e
	 */
	$scope.openWhiteBoard = function(files) {

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能创建白板，请退出重试！',
				type: 'warn'
			});
			return false;
		}


		var origin = YYIMChat.getUserID();
		if ($rootScope.$stateParams.chatType == 'groupchat') {
			origin = $rootScope.$stateParams.personId;
		}

		var whiteName = '白板';

		YYIMChat.operateWhiteBoard({
			name: whiteName,
			origin: origin,
			operation: 'create',
			success: function(data) {
				if (!!data.wid) {
					window.currentWhiteBoard = {
						wid: data.wid,
						name: whiteName,
						files: files
					};

					$scope.sendWhiteBoard(YYIMCacheRosterManager.getInstance().getRostersList('myself')[0].name + '创建了一个白板');

					if (jQuery('#whiteBoradCover > *').length < 2) {
						jQuery.get('message/whiteboard/whiteboard.html').done(function(data) {
							jQuery('#whiteBoradCover').append(data);
						});
					}
					setTimeout(function() {
						resizeHandler()
					}, 500)
					jQuery('#whiteBoradCover').show();
					svgCanvas.undoMgr.resetUndoStack();
					window.temVar.loadFromString('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="980" height="800"><g><title>Layer 1</title></g></svg>');
				}
			},
			error: function() {
				toaster.pop({
					title: '白板创建失败！',
					type: 'error',
					showCloseButton: true
				});
			}
		});
	};

	//  文件發送  
	$scope.sendpicFile = function(e) {

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能发送消息，请退出重试！',
				type: 'warn'
			});
		} else {
			var photofile = e.files[0];
			var IMAGE_TYPES = ["png", "gif", "jpg", "jpeg", "bmp"];

			if (photofile) {

				if (photofile.size > 104857600) {
					toaster.pop({
						title: ' 文件大小仅限100M！',
						type: 'warn',
						showCloseButton: true
					});
					return;
				}

				var index = photofile.name.lastIndexOf('.');
				var strtype = photofile.name.substr(index + 1, 3);
				strtype = strtype.toLowerCase();

				if (jQuery.inArray(strtype, IMAGE_TYPES) >= 0) {
					YYIMCacheMessageManager.getInstance().sendPicMessage({
						fileInputId: "file_upload_input",
						to: $rootScope.$stateParams.personId,
						type: $rootScope.$stateParams.chatType,
						success: function(message) {
							YYIMCacheRecentManager.getInstance().updateCache({
								id: message.opposite,
								dateline: message.dateline,
								latestState: message.data,
								type: message.type,
								contentType: message.data.contentType,
								sort: true
							});
							$rootScope.$broadcast("chatlistmessage");

							$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
								id: $rootScope.$stateParams.personId,
								condition: 'all'
							});
							jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height());
							$scope.checkLatest();
							toaster.pop({
								title: '图片发送成功！',
								type: 'success',
								showCloseButton: true
							});
						},
						error: function(err) {
							toaster.pop({
								title: '图片发送失败，请重试！',
								type: 'error',
								showCloseButton: true
							});
						}
					})

				} else {
					toaster.pop({
						title: '图片格式不支持！',
						type: 'warn'
					});
				}
			}
		}
	}

	$scope.OK_Click = function() {
		var formdata = new FormData();
		var file = fileConvertService.b64ToFile($scope.ngDialogData.picdata, "image/png", "capture.png")
		formdata.append("file", file);
		IMChatHandler.getInstance().sendFormMessage({
			to: $rootScope.$stateParams.personId,
			file: {
				name: "capture.png",
				size: file.size
			},
			mediaType: 1,
			type: $rootScope.$stateParams.chatType,
			data: formdata,
			success: function(data) {

				toaster.pop({
					title: '截图发送成功！',
					type: 'success',
					showCloseButton: true
				});
				$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
					id: $rootScope.$stateParams.personId,
					condition: 'all'
				});
				$scope.checkLatest();
				$state.transitionTo("imhome.message", {
					personId: $scope.chatiteminfo.id,
					personName: $scope.chatiteminfo.name,
					chatType: $scope.chatiteminfo.type
				}, {
					location: true,
					inherit: true,
					notify: true,
					reload: true
				});
				ngDialog.close();
			},
			error: function() {
				toaster.pop({
					title: ' 图片发送失败，请重试！',
					type: 'error',
					showCloseButton: true
				});
				ngDialog.close();
			}
		})

	}
	$scope.NO_Click = function() {
			ngDialog.close();
		}
		/// 此处是解决页面打开iframe奇特的滚动问题  
	$scope.ismac = NWKeyService.ismac;
	$scope.iswin = NWKeyService.iswin;
	$scope.islinux = NWKeyService.islinux;
	$(window).on("keydown", function(e) {
		var shift = e.shiftKey;
		if (shift) {
			window.shiftpress = true;
		}
	});
	//  发送文件
	$scope.sendFile = function(e) {

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能发送消息，请退出重试！',
				type: 'warn'
			});

		} else {

			var photofile = e.files[0];
			if (photofile) {
				if (photofile.size <= 104857600) {
					YYIMCacheMessageManager.getInstance().sendFileMessage({
						fileInputId: "file_upload_inputfile",
						to: $rootScope.$stateParams.personId,
						type: $rootScope.$stateParams.chatType,
						transform: true,
						success: function(message) {
							YYIMCacheRecentManager.getInstance().updateCache({
								id: message.opposite,
								dateline: message.dateline,
								latestState: message.data.content,
								type: message.type,
								contentType: message.data.contentType,
								sort: true
							});

							$rootScope.$broadcast("chatlistmessage");
							$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
								id: $rootScope.$stateParams.personId,
								condition: 'all'
							});
							$scope.checkLatest();
							toaster.pop({
								title: '文件发送成功！',
								type: 'success',
								showCloseButton: true
							});
						},
						error: function() {
							toaster.pop({
								title: ' 文件发送失败，请重试！',
								type: 'error',
								showCloseButton: true
							});
						}
					});

				} else {
					toaster.pop({
						title: ' 文件大小仅限100M！',
						type: 'warn',
						showCloseButton: true
					});
				}

			}
		}
	}


	$scope.sendMessage = function() {
		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能发送消息，请退出重试！',
				type: 'warn'
			});
		} else {
			var chattype = $rootScope.$stateParams.chatType;
			var text = $scope.htmlEscape($(".textedit-box").val().trim());
			YYIMCacheMessageManager.getInstance().sendTextMessage({
				to: $rootScope.$stateParams.personId,
				msg: text,
				type: chattype,
				success: function(message) {

					YYIMCacheRecentManager.getInstance().updateCache({
						id: message.opposite,
						dateline: message.dateline,
						latestState: message.data,
						contentType: message.data.contentType,
						type: message.type,
						sort: true
					});
					$rootScope.$broadcast("chatlistmessage");

					$scope.chatMessages = YYIMCacheMessageManager.getInstance().showMessageList({
						id: $rootScope.$stateParams.personId,
						condition: 'all'
					});
					$(".textedit-box").val("");
					jQuery('.IMChat-send-btn').removeClass('active').attr('disabled', 'true');
					jQuery('.list-wrapper').scrollTop(0); // 最近聊天的显示头部
					jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height());
					setTimeout(function() {
						jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height())
					}, 50);
				},
				error: function() {
					toaster.pop({
						title: '消息发送失败,请重试！',
						type: 'warn'
					});
				}
			});
		}
	}

	$scope.htmlEscape = function(html) {
		return html.replace(/[<>"&]/g, function(match, pos, origin) {
			switch (match) {
				case "<":
					return "&lt";
					break;
				case ">":
					return "&gt";
					break;
				case "&":
					return "&amp";
				case "\"":
					return "&quot";
					break;
			}
		})
	}

	//消息面板右上角  单聊转群聊点击事件
	$scope.personSetup_Click = function() {
		ngDialog.open({
			template: 'message/angular/template/add-groupchat.htm',
			controller: 'addGroupChatController',
			className: '',
			showClose: false,
			data: {
				chatinfo: $scope.chatiteminfo
			}
		});
	}

	/* 聊天窗口新消息提醒 by yangjz0*/
	$scope.latest_btn = {
		show: false
	};

	var scrollClock = false;
	$scope.checkLatest = function(data) {
		if (scrollClock) clearTimeout(scrollClock)
		scrollClock = setTimeout(function() {
			jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height() + 10000)
		}, 400)
	}

	//-----------------岳振华添加--------------------
	$scope.checkLatest();
	setTimeout(function() {
		jQuery('#IMChat_msg_cont').val('').trigger('click').focus();
		jQuery('.IMChat-entity-display.message').addClass('fadeIn')
	}, 160);

	var author = $stateParams.author;
	if (!!author) {
		setTimeout(function() {
			window.location.hash = author;
			jQuery('body').scrollTop(0);
		}, 1500)
	}
}])


app.controller("chatListctrl", ["$rootScope", "$scope", "$state", "$interval", "ngDialog", "toaster", "_", "urlParseService",
	function($rootScope, $scope, $state, $interval, ngDialog, toaster, _, urlParseService) {

		$scope.recentList = YYIMCacheRecentManager.getInstance().recentList;

		$scope.$on("chatlistmessage", function(name, data) {
			$scope.recentList = YYIMCacheRecentManager.getInstance().recentList;
		});

		$scope.removeitem = function(item, e) {
			e.preventDefault();
			e.stopPropagation();
			//  广播消息进行消息显示数的更新
			YYIMCacheRecentManager.getInstance().remove(item.id);
			$scope.recentList = YYIMCacheRecentManager.getInstance().recentList;
			$state.go("imhome");
		}

		$scope.getUserCurrentState = function(item) {
			var isonline = false;
			for (var j = 0; j < $rootScope.userStatesList.length; j++) {
				if ($rootScope.userStatesList[j].userid == item.id)
					for (var i = 0; i < $rootScope.userStatesList[j].presence.length; i++) {
						if ($rootScope.userStatesList[j].presence[i].available == 1) {
							isonline = true;
							return isonline;
						}
					};
			}
			return isonline;
		};

		///  添加用户在线状态的处理
		$scope.istoday = function(dateline) {
			var infodate = new Date(Number(dateline));
			var today = new Date();
			if ((infodate.getDay() != today.getDay()) || (infodate.getMonth() != today.getMonth()) || (infodate.getFullYear() != today.getFullYear())) {
				return false;
			}
			return true;
		}


		///  获取用户未读的消息
		$scope.getunReadmessageCounts = function(rosterId) {
			var length = YYIMCacheMessageManager.getInstance().getMessageList({
				id: rosterId,
				condition: 'unreaded'
			}).length;
			return length > 99 ? "99+" : length;
		}

		$scope.goToMessage = function(item) {
			switch (item.type) {
				case YYIMAngularConstant.CHAT_TYPE.CHAT:
					; //  单聊消息处理
				case YYIMAngularConstant.CHAT_TYPE.GROUP_CHAT:
					; //  群聊消息处理
				case YYIMAngularConstant.CHAT_TYPE.PUB_ACCOUNT: //公众号消息	  
					$state.go("imhome.message", {
						personId: item.id,
						personName: item.name || item.id,
						chatType: item.type
					});
					break;
				default: //漏掉的消息类型
					YYIMChat.log("未处理消息类型", 3, arg.type);
					break;
			}
		}

	}
])

app.run(["$rootScope", "$state", "$stateParams", "toaster",

	"$cookies", "ngDialog", "audioPlayService", "updateService", "$interval",
	function($rootScope, $state, $stateParams, toaster, $cookies, ngDialog, audioPlayService, updateService, $interval) {
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
		$rootScope.chatMessages = [];
		$rootScope.SendMessages = [];
		$rootScope.userStatesList = [];

		var snsLoginConflict = false;
		$rootScope.islogout = false;
		$rootScope.issnsLoginConflict = false;
		$rootScope.userState = {
			isonline: false,
			isfirst: true
		};
		//updateService.showupdateinfo(window.newversion); //版本更新更新提示

		YYIMChat.init({
			onOpened: function() {
				snsLoginConflict = false; // 连接后, 不冲突, 自动登录

				YYIMUtil['cookie']['set']('username', YYIMChat.getUserID());

				$rootScope.userState.isonline = true;

				/**
				 *  初始化缓存 rongqb 20160322 
、				 */
				YYIMChat.getRosterItems({
					success: function(data) {
						data = JSON.parse(data);
						for (var x in data) {
							YYIMCacheRosterManager.getInstance().updateCache(data[x]);
						}

						$rootScope.$broadcast("currentPersonInfo");
					},
					complete: function() {
						YYIMChat.getChatGroups({
							success: function(data) {
								data = JSON.parse(data);
								for (var x in data) {
									YYIMCacheGroupManager.getInstance().updateCache(data[x]);
								}
							},
							complete: function() {
								YYIMChat.getPubAccount({
									success: function(data) {
										data = JSON.parse(data);
										for (var x in data) {
											YYIMCachePubAccountManager.getInstance().updateCache(data[x]);
										}
										
										YYIMCacheRecentManager.getInstance().init();
										YYIMChat.getOfflineMessage({ //获取离线消息
											success: function() {
												$rootScope.$broadcast("chatlistmessage");
												$rootScope.$broadcast("unreadchatmessage");
											}
										});
										
										YYIMChat.setPresence(); //设置本人上线
										toaster.pop({
											title: '消息服务器连接成功！',
											type: 'success'
										});
										jQuery('#login-container').addClass('hidden');
										$rootScope.$broadcast("chatlistmessage");
									},
									complete: function() {
										
									}
								});
							}
						});
					}
				});

			},
			onClosed: function(arg) {
				console.info("连接关闭");
				$rootScope.islogout = true;
				snsLoginConflict = false;
				$rootScope.userState.isonline = false;
			},
			onAuthError: function() {
				toaster.pop({
					title: '消息服务器登录失败,请退出重试！',
					type: 'error'
				});
				$rootScope.islogout = true;
				snsLoginConflict = false;
				$rootScope.userState.isonline = false;
			},
			onGroupUpdate: function(arg) {
				/**
				 * 群组信息更新 rongqb 20160233 
				 */
				YYIMCacheGroupManager.getInstance().updateCache(arg);
			},
			onKickedOutGroup: function(arg) {
				/**
				 * 被群组踢出 rongqb 20160233 
				 */
				YYIMCacheGroupManager.getInstance().KickedOutByGroup(arg);

				var groupinfo = YYIMCacheGroupManager.getInstance().get(arg.from);
				if (groupinfo) {
					var groupname = groupinfo.name;
				}

				var notification = new window.Notification("新消息通知", {
					body: "您被移除群" + groupname,
					icon: "logo.png"
				});

				///  此处需要进行历史消息的处理
				$rootScope.$broadcast("unreadchatmessagechange", "我的测试");
				$state.go("imhome");
			},
			onStatusChanged: function(status) {
				//debugger
				if (status && status.errorCode == 409) {
					snsLoginConflict = true;
					YYIMChat.logout();
					$rootScope.issnsLoginConflict = true;
					ngDialog.open({
						template: 'message/angular/template/MessageInfo.htm',
						controller: 'mainCtrl',
						className: '',
						showClose: false,
						closeByEscape: false,
						closeByDocument: false
					});
				}
			},
			onConnectError: function(status) {
				if (!status)
					return;
				if (snsLoginConflict) {
					YYIMChat.logout();
					ngDialog.open({
						template: 'message/angular/template/MessageInfo.htm',
						controller: 'mainCtrl',
						className: '',
						showClose: false,
						closeByEscape: false,
						closeByDocument: false
					});
				}

				// debugger
				if (status && status.errorCode == 409) {
					YYIMChat.logout();
					$rootScope.issnsLoginConflict = true;
					ngDialog.open({
						template: 'message/angular/template/MessageInfo.htm',
						controller: 'mainCtrl',
						className: '',
						showClose: false,
						closeByEscape: false,
						closeByDocument: false
					});
				} else {
					$rootScope.userState.isonline = false;
					toaster.pop({
						title: '连接失败，正在重试！',
						type: 'warn'
					});
					var info = {
						status: "not on line"
					}
					$rootScope.$broadcast("userstateChange", info);
					if (!$rootScope.issnsLoginConflict) {
						if (!$rootScope.userState.isonline) {
							YYIMChat.connect();
						}
					}
				}
			},
			onUserBind: function(arg) {},
			onPresence: function(arg) {
				/**
				 * 联系人状态改变 rongqb 20160322 
				 */
				YYIMCacheRosterManager.getInstance().updatePresence(arg);
			},
			onSubscribe: function(arg) {
				/**
				 * 加好友请求 rongqb 20160322 
				 */
				if(arg.type === 'subscribe') {
					YYIMCacheRosterManager.getInstance().updateCache({
						id: arg.from,
						ask: -1,
						recv: 1,
						subscription: YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.NONE
					});
				}else if (arg.type === 'subscribed') {
					YYIMCacheRosterManager.getInstance().updateCache({
						id: arg.from,
						ask: -1,
						recv: -1,
						subscription: YYIMCacheConfig.ROSTER_SUBSCRIPTION_TYPE.BOTH
					});
				}
			},
			onRosterUpdateded: function(arg) {
				/**
				 * 联系人信息更新 rongqb 20160322 
				 */
				YYIMCacheRosterManager.getInstance().updateCache(arg);
			},
			onRosterDeleted: function(arg) {},
			onRoomMemerPresence: function(arg) {},
			onReceipts: function(arg) {
				/**
				 * 发送消息的回执 rongqb 20160322 
				 */
				if (arg && arg.id) {
					if (arg.state === 2 || arg.type === 'groupchat') {
						YYIMCacheMessageManager.getInstance().updateCache({
							id: arg.id,
							sendState: YYIMCacheConfig.SEND_STATE.READED
						});
					}
				}
			},
			onTextMessage: function(arg) {
				handleMessageFun(arg);
			},
			onPictureMessage: function(arg) {
				handleMessageFun(arg);
			},
			onFileMessage: function(arg) {
				handleMessageFun(arg);
			},
			onShareMessage: function(arg) {
				handleMessageFun(arg);
			},
			onMessageout: function(arg) {},
			onAudoMessage: function(arg) {
				handleMessageFun(arg);
			},
			onSystemMessage: function(arg) { //接收到单图文消息
				handleMessageFun(arg);
			},
			onPublicMessage: function(arg) { //接收到多图文消息
				handleMessageFun(arg);
			},
			onWhiteBoardMessage: function(arg) { //接收到白板消息
				handleMessageFun(arg);
			},
			onPubaccountUpdate: function(arg) {
				for (var x in arg) {
					YYIMCachePubAccountManager.getInstance().updateCache(arg[x]);
				}
			},
			onWhiteBoardUpdated: function(arg) {
				window.handleUpdateData(arg);
			}
		});

		/**
		 * 处理收到的消息
		 * @param {Object} arg
		 */
		var newInfoer;

		function handleMessageFun(arg) {
			var message = YYIMCacheMessageManager.getInstance().updateCache(arg);

			if (message.opposite == $stateParams.personId) {
				message.data.isHaveAt = false;
			}

			YYIMCacheRecentManager.getInstance().updateCache({
				id: message.opposite,
				dateline: message.dateline,
				latestState: message.data,
				type: message.type,
				contentType: message.data.contentType,
				sort: true,
				isHaveAt: message.data.isHaveAt
			});

			if (!!message.data.isHaveAt) {
				$rootScope.$broadcast("atBySomeOne", message);
			}

			if (!!NodeWebKitSupport && !!message.received) {
				var recent = YYIMCacheRecentManager.getInstance().get(message.opposite) || '';
				var newinfo = recent.latestState;
				var newinfo = newinfo.substr(0, 30);

				if (!!newInfoer) {
					clearTimeout(newInfoer);
				}

				newInfoer = setTimeout(function() {
					var notification = new window.Notification("新消息通知", {
						body: newinfo,
						icon: "logo.png"
					});

					notification.onclick = function() {
						win.show();
					}
				}, 50);
			}
			$rootScope.$broadcast("chatlistmessage", message);
			$rootScope.$broadcast("unreadchatmessage", message);
			$rootScope.$broadcast("chatmessage", message);
		}

		/**
		 * 拉取联系人在线状态  
		 */
		$interval(function() {
			var ids = Object.keys(YYIMCacheRosterManager.getInstance().list);

			if ($rootScope.userState.isonline && ids.length > 0 && !$rootScope.issnsLoginConflict) {
				YYIMChat.getRostersPresence({
					username: ids,
					success: function(data) {
						$rootScope.userStatesList = data;
						$rootScope.islogout = false;
					},
					error: function() {
						$rootScope.userStatesList = [];
					}
				});
			}
		}, 10000);
	}
]);