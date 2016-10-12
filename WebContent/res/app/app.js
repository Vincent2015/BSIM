var app = angular.module("app", ["ui.router", 'ui.select', 'IMChat.Controller', 'IMChat.Service', 'IMChat.ThirdPlug', "ngSanitize", "IMChatUrl.Service", "IMChat.Group.Controller", "IMChat.Friend.Controller", "IMChatMessage.Service", "IMChat.ExpressionFilter", "infiniteScroll", "IMChat.cutStringFilter",
	"ngStorage", "IMChat.ChatHistory.ServiceV2", "toaster", "ngAnimate", "ngCookies", "ngDialog", "IMChatOpenUrl", "IMChatOnImgError", "IMChat.AudioPlay", "IMChat.NWKeyService", "IMChat.DataProtect", "IMChat.AppService",
	"imageCropper", "IMChat.FileCaptureService", "IMChat.FileConvertService", "IMChat.UpdateService","IMChat.NWKeyService"

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

app.config(function($stateProvider, $urlRouterProvider,$compileProvider) {
	
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|sms|app):/);
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|app):/);
	
	$stateProvider
		.state("home", {
			url: "/home",
			templateUrl: "WebContent/res/templete/menu-pannel-messagetemp.htm",

			controller: "chatListctrl"
		})
		.state("home.message", {
			url: "/message",
			params: {
				'personId': '',
				'personName': '',
				'chatType': ''
			},
			templateUrl: "WebContent/res/templete/list-content-temp.htm",

			controller: "messageController"


		})
		.state("home.message2", {
			url: "/message2",
			params: {
				'personId': '',
				'personName': '',
				'chatType': ''
			},
			templateUrl: "WebContent/res/templete/list-content-temp2.htm",
			controller: "messageController"
		}).state("day", {
			url: "/day",
			templateUrl: "WebContent/res/templete/menu-pannel-messagetempday.htm",

			controller: "dayctrl"

		})
		.state("home.message3", {
			url: "/message3",
			params: {
				'personId': '',
				'personName': '',
				'chatType': ''
			},
			templateUrl: "WebContent/res/templete/list-content-tempPub.htm",

			controller: "messageController"


		})
		.state("home.message4", {
			url: "/message4",
			params: {
				'appid': '',
				'appname':''
			},
			templateUrl: "WebContent/res/templete/app-display.htm",

			controller: "appCenterController"


		})
		.state("contacts", {
			url: "/contacts",
			templateUrl: "WebContent/res/templete/menu-pannel-contacts.htm",
		})
//		.state("contacts.follow", {
//			url: "/follow",
//			templateUrl: "WebContent/res/templete/list-content-follow.htm",
//			controller: "followController"
//		})
		.state("contacts.friend", {
			url: "/friend",
			templateUrl: "WebContent/res/templete/list-content-friend.htm",
			controller: "friendController"
		})
		.state("contacts.dept", {
			url: "/dept",
			templateUrl: "WebContent/res/templete/list-content-dep.htm",
			controller: "personController"
		})
		.state("contacts.group", {
			url: "/group",
			templateUrl: "WebContent/res/templete/list-content-group.htm",
			controller: "groupController"
		})
		.state("contacts.pubAcc", {
			url: "/pubAcc",
			templateUrl: "WebContent/res/templete/list-content-pubAcc.htm",
			controller: "publicAccountController"
		})
		.state("contacts.supTeam", {
			url: "/supTeam",
			templateUrl: "WebContent/res/templete/list-content-supTeam.htm",
			controller: "supTeamController"
		})
		.state("contacts.usuTel", {
			url: "/usuTel",
			templateUrl: "WebContent/res/templete/list-content-freqTel.htm",
			controller: ""
		})
		.state("app", {
			url: "/app",
			templateUrl: "WebContent/res/templete/menu-pannel-app.htm",
			controller: ""
		})
		.state("app.appCenter", {
			url: "/appCenter",
			templateUrl: "WebContent/res/templete/list-content-appCenter.htm",
			controller: "appCenterController"
		})
		.state("app.myApp", {
			url: "/myApp",
			templateUrl: "WebContent/res/templete/list-content-myApp.htm",
			controller: ""
		})
		.state("social", {
			url: "/social",
			templateUrl: "WebContent/res/templete/list-content-social.htm",

		})
	$urlRouterProvider.otherwise('/home');

});


app.filter('getFirstLetter', function() {
	return function(input) {
		return getFirstLetter(input);
	}
})

app.config(function($sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
		// Allow same origin resource loads.
		'self',
		// Allow loading from our assets domain.  Notice the difference between * and **.
		'http://h.yonyou.com/**', "http://y.yonyou.com/**", "https://h.yonyou.com/**"
	]);
})
app.controller("dayctrl", function($scope, $rootScope) {

})



app.controller("appCenterController", ["$scope", "ngDialog", "appopenService", "NWKeyService", "$state","$stateParams", function($scope, ngDialog, appopenService,$state,$stateParams) {
   IMChatMessageCache.getInstance().getAllMessage($stateParams.appid);
	$scope.$emit("unreadchatmessagechange", "change");
	$scope.goback=function(){
		
		console.log("回退")
		console.log(window.history.length)
		if(window.history.length>1)
		{		
			window.history.back()
			
		}

		
	}
	

	$scope.ok_click = function() {
		$(".capturecontrl").remove();
		ngDialog.close();

	}
	$scope.ismac = NWKeyService.ismac;
	$scope.iswin = NWKeyService.iswin;
	
	$scope.islinux=NWKeyService.islinux;
	$scope.opengz = function() {
		var url = appopenService.navUrl("YIT_03_00007");
		var appinfo = {
			appurl: url,

			appname: "工资查询"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.openzz = function() {
		var url = appopenService.navUrl("YIT_03_00016");
		var appinfo = {
			appurl: url,

			appname: "员工自助"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.opensp = function() {
		var url = appopenService.navUrl("YIT_03_00001");
		var appinfo = {
			appurl: url,

			appname: "审批中心"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.openrw = function() {
		var url = appopenService.navUrl("YIT_03_00003");
		var appinfo = {
			appurl: url,

			appname: "我的任务"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.opengs = function() {
		var url = appopenService.navUrl("YIT_03_00004");
		var appinfo = {
			appurl: url,

			appname: "项目工时"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.openzy = function() {
		var url = appopenService.navUrl("YIT_03_00005");
		var appinfo = {
			appurl: url,

			appname: "资源申请"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.openykt = function() {
		var url = appopenService.navUrl("YIT_03_00006");
		var appinfo = {
			appurl: url,

			appname: "友学堂"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.opengzp = function() {
		var url = appopenService.navUrl("YIT_03_00008");
		var appinfo = {
			appurl: url,

			appname: "工资+"
		}
		$scope.openAppH5(appinfo);
	}
	$scope.opendd = function() {
		var url = appopenService.navUrl("YIT_03_00011");
		var appinfo = {
			appurl: url,

			appname: "嘟嘟"
		}
		$scope.openAppH5(appinfo);
	}

	$scope.openywyd = function() {
		var url = appopenService.navUrl("YIT_03_00012");
		var appinfo = {
			appurl: url,

			appname: "友问友答"
		}
		$scope.openAppH5(appinfo);
	}

	$scope.NO_Click = function() {
		ngDialog.close();
	}

	$scope.gotoUDN = function() {


		var a = require("nw.gui");
		a.Shell.openExternal("http://udn.yyuap.com")
		ngDialog.close();
	}
	$scope.openudn = function() {

		ngDialog.open({
			template: 'WebContent/res/templete/goToUDNConfirmMessage.htm',
			controller: 'appCenterController',
			className: '',
			showClose: false

		});


	}

	$scope.openAppH5 = function(appinfo) {
		$(".capturecontrl").remove();
		ngDialog.open({
			template: 'WebContent/res/templete/app-Dialog.htm',
			controller: 'appCenterController',
			className: '',
			showClose: false,
			closeByEscape: false,
			data: {
				appinfo: appinfo
			}
		});

	}


}])
app.controller("supTeamController", ["IMChathistoryServiceV2", "$scope", "$state", function(IMChathistoryServiceV2, $scope, $state) {
	$scope.goToMessageChatITService1 = function() {
		IMChathistoryServiceV2.addorupdate("gz00000546", "chat", "IT服务台806");
		$state.go("home.message2", {
			personId: "gz00000546",
			personName: "IT服务台806",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatITService = function() {
		IMChathistoryServiceV2.addorupdate("gz00036800", "chat", "IT服务台");
		$state.go("home.message2", {
			personId: "gz00036800",
			personName: "IT服务台",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatITService2 = function() {
		IMChathistoryServiceV2.addorupdate("gz00001201", "chat", "IT服务台805");
		$state.go("home.message2", {
			personId: "gz00001201",
			personName: "IT服务台805",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatITService3 = function() {
		IMChathistoryServiceV2.addorupdate("gz00008002", "chat", "IT服务台808");
		$state.go("home.message2", {
			personId: "gz00008002",
			personName: "IT服务台808",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatITService4 = function() {
		IMChathistoryServiceV2.addorupdate("gz00014006", "chat", "IT服务台802");
		$state.go("home.message2", {
			personId: "gz00014006",
			personName: "IT服务台802",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatITService5 = function() {
		IMChathistoryServiceV2.addorupdate("gz00014007", "chat", "IT服务台801");
		$state.go("home.message2", {
			personId: "gz00014007",
			personName: "IT服务台801",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatMobile = function() {

		IMChathistoryServiceV2.addorupdate("0000057552", "chat", "史金城");
		$state.go("home.message2", {
			personId: "0000057552",
			personName: "史金城",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatPC = function() {
		IMChathistoryServiceV2.addorupdate("0000060667", "chat", "荣锋亮");
		$state.go("home.message2", {
			personId: "0000060667",
			personName: "荣锋亮",
			chatType: 'chat'
		});
	}
	$scope.goToMessageChatFunction = function() {
		IMChathistoryServiceV2.addorupdate("0000013252", "chat", "陈怀海");
		$state.go("home.message2", {
			personId: "0000013252",
			personName: "陈怀海",
			chatType: 'chat'
		});


	}

}]);
app.controller("mainCtrl", ['$rootScope', '$scope', 'personService', '$cookies', '$interval', "ngDialog", "NWKeyService", "updateService",
	function($rootScope, $scope, personService, $cookies, $interval, ngDialog, NWKeyService, updateService) {
		

        $scope.reconnect=function(e){
        	
        	e.preventDefault();
		    e.stopPropagation();
		    YYIMChat.disConnect();
		    YYIMChat.connect();
		    }


		
        
        $scope.$on("initmyVCard",function(name,data){
        	$scope.currentPersonInfo = data;
        });
        
	

		$scope.$on("userstateChange", function(name, data) {
			console.info("用户状态广播事件")
			if (data.status == "chat") {
				$rootScope.userState.isonline = true;
				snsLoginConflict = false;
				$rootScope.islogout=false;
				console.log($rootScope);
			} else {
				console.log($rootScope);
				$rootScope.userState.isonline = false;
			}

		})
		$scope.ismac = NWKeyService.ismac;
		$scope.iswin = NWKeyService.iswin;
//		$scope.currentPersonInfo = {};



		
		$scope.showCurrentPersonCard = function() {
			$rootScope.personCardInfo = $scope.currentPersonInfo;
			var isuser = true;
			$rootScope.isOperator = {
				isuser: isuser
			};
			jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
		}

		$scope.logout = function() {
			YYIMChat.logout();
			$cookies.token = "";
			$cookies.expiration = "";
			$cookies.token2 = "";
			$cookies.expiration2 = "";
			$cookies.isLogining = 'no';
			
			if ($scope.ismac) {
				tray.remove();
				tray = null;
			}
			
			location.reload(true);
			
		}

		$scope.logoutWithoutClear = function() {
			YYIMChat.logout();
			$cookies.token = "";
			$cookies.expiration = "";
			$cookies.token2 = "";
			$cookies.expiration2 = "";
			$cookies.isLogining = 'no';
			if ($scope.ismac) {
				tray.remove();
				tray = null;
			}
			location.reload(true);
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
		$scope.gotoSendWeibo = function() {
			var url = "http://y.yonyou.com/t/m/add.html?from=feed&user_code=" + $rootScope.userLoginParames.pid;
			var appinfo = {
				appurl: url,
				appname: "发动态"
			}
			$scope.openAppH5(appinfo);
		}
		$scope.openAppH5 = function(appinfo) {

			ngDialog.open({
				template: 'WebContent/res/templete/app-Dialog.htm',
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
		$scope.appstartinfo = function() {
			ngDialog.open({
				template: 'WebContent/res/templete/LogoutConfirmMessage.htm',
				controller: 'mainCtrl',
				className: '',
				showClose: false,
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
		$scope.hisMsgs = [];

		$scope.maxItems = 400;
		$scope.pullHistory = function() {
			var obj = {
				cont: "加一条" + ($scope.hisMsgs.length + 1)
			};
			$scope.hisMsgs = jQuery.merge([obj], $scope.hisMsgs);
		}
		$scope.handleClick = function(event) {
			var _target = jQuery(event.target);
			if (!_target.hasClass('expression-tool')) {
				$scope.expressionShow.show = false;
			}
		}

		$scope.AllUnReadCounts = 0;


		$scope.opendownload = function() {


			var a = require("nw.gui");
			a.Shell.openExternal("http://h.yonyou.com")

		}

		$scope.gotopart = function() {

			var a = require("nw.gui");
			a.Shell.openExternal("http://y.yonyou.com")
			ngDialog.close();

		}

		$scope.gotopartalert = function() {
			ngDialog.open({
				template: 'WebContent/res/templete/goTopartConfirmMessage.htm',
				controller: 'mainCtrl',
				className: '',
				showClose: false,
			});


		}
		$scope.$on("unreadchatmessage", function(name, data) {


			console.log("收到未读消息列表");
			var length = IMChatMessageCache.getInstance().getAllUnreadedMessageLendth();
			var lengthinfo = length > 99 ? "99+" : length;
			$scope.AllUnReadCounts = lengthinfo;
		})

		$scope.$on("unreadchatmessagechange", function(name, data) {

			console.log(" unreadchatmessagechange 广播的事件");
			var length = IMChatMessageCache.getInstance().getAllUnreadedMessageLendth();
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
		}

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

		/*app设置*/
		$scope.openAppSetup = function() {
			ngDialog.open({
				template: 'WebContent/res/templete/app-setup.htm',
				controller: '',
				className: '',
				showClose: false,
			});
		}

		$scope.scanePic = function(e) {
			var target = jQuery(e.target);
			if (target.hasClass('chat-img')) {
				ngDialog.open({
					template: 'WebContent/res/templete/img-viewer.htm',
					controller: 'mainCtrl',
					className: '',
					showClose: false,
					data: {
						imgSrc: target.attr('src')
					}
				});
			}
		}
	}
]);

app.controller("messageController", ["$scope", "$stateParams", "$state", "messageHandler", "$rootScope", "_", "$interval", "IMChathistoryServiceV2", "toaster", "ngDialog", "fileCaptureService", "NWKeyService", "fileConvertService", function($scope, $stateParams, $state, messageHandler, $rootScope, _, $interval, IMChathistoryServiceV2, toaster, personService, ngDialog, fileCaptureService, NWKeyService, fileConvertService) {
	console.log($stateParams.personId + "---" + $stateParams.personName + "---" + $stateParams.chatType);

	///  接受消息以及发送消息的处理
	///  首次可能没有数据使用

	$(".capturecontrl").remove();
	var span = $('<span  class="capturecontrl"></span>');
	console.log(span)
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
	$scope.chatiteminfo = {

		id: $stateParams.personId,

		name: $stateParams.personName,

		type: $stateParams.chatType

	};
	if ($stateParams.chatType == "tixing") {

		$scope.chatiteminfo.type = "chat";
	}

	if ($stateParams.chatType == "pubaccount") {
		$scope.chatiteminfo.type = "chat";

	}
	console.log("首次执行");
	$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);
	console.info("获取的历史数据信息");
	if ($scope.chatMessages.length < 11) {
		IMChatHandler.getInstance().getHistoryMessage({
			id: $scope.chatiteminfo.id,
			chatType: $scope.chatiteminfo.type,
			success: function() {

				console.log("id");
				console.log($scope.chatiteminfo);
				$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);
			}
		});
	}
	$scope.$emit("unreadchatmessagechange", "change");
	$scope.$on("chatmessage", function(name, data) {

		if ($rootScope.$stateParams.personId) {
			console.log("参数信息");
			console.log($rootScope.$stateParams);
			console.log("获取聊天数据");
			var scrollDis = jQuery('.message-entity').height() - jQuery('.IMChat-entity-display').scrollTop();
			if ($rootScope.$stateParams.personId.toLowerCase() == data._from) {
				if (scrollDis > (jQuery('.IMChat-entity-display').height() + 200)) {
					$scope.latest_btn.show = true;
				} else {
					$scope.checkLatest(data);
				}
			}
			$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);
			console.log("the height info:");
			$scope.$emit("unreadchatmessagechange", "change");
		}
	})
	$scope.$on("groupchatmessage", function(name, data) {

		if ($rootScope.$stateParams.personId) {
			console.log("群组参数信息");
			console.log($rootScope.$stateParams);
			console.log("获取群组聊天数据");
			$scope.$apply(function() {
				$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);

			})
			console.log("the height info:");
			var scrollDis = jQuery('.message-entity').height() - jQuery('.IMChat-entity-display').scrollTop();
			if ($rootScope.$stateParams.personId.toLowerCase() == data._from) {
				if (scrollDis > (jQuery('.IMChat-entity-display').height() + 200)) {
					$scope.latest_btn.show = true;
				} else {
					$scope.checkLatest(data);
				}
			}

			$scope.$emit("unreadchatmessagechange", "change");
		}

	})

	$scope.chattype = {

		chattype: $rootScope.$stateParams.chatType
	};
	
	  $scope.getfileurl=function(thumbId){        
        	
         return YYIMChat.getFileUrl(thumbId);

	 }
	 $scope.openwebsiteinfo=function(url,e){
	 	
	 	e.preventDefault();
		e.stopPropagation();
		var a = require("nw.gui");
		a.Shell.openExternal(url);
		
	 }
	 
	 $scope.openmicroApp=function(url,e)
	 {
	    e.preventDefault();
		e.stopPropagation();
        
        console.log(url)
		$rootScope.micappinfo.appurl=url;
		$rootScope.micappinfo.apptitle="微应用"
		jQuery('.IMChat-group-slide').removeClass('hidden');
	 	
	 }
	 
	 $scope.issinglepicture=function(iteminfo){
	 	
	 	if(iteminfo._data&&iteminfo._data.thumbId)
	 	{
	 		
	 		return true;
	 		
	 	}
	 	return false;
	 	
	 };
	 $scope.ismultinfo = function(iteminfo){
    	if(YYIMArrayUtil.isArray(iteminfo._data))
    	{
    		
    		return true;
    	}
        return false;
    };
	$scope.handleKeyup = function(e) {
		var _inputBox = jQuery('#IMChat_msg_cont');
		if (jQuery.trim(_inputBox.text()) && !jQuery('.IMChat-send-btn').hasClass('active')) {
			jQuery('.IMChat-send-btn').addClass('active');
		} else {
			jQuery('.IMChat-send-btn').removeClass('active');
		}
	}
	$scope.presskey = function(e) {
			if (e.keyCode == 13) {
				if ($(".textedit-box").val().trim()) {
					$scope.sendMessage();
					e.preventDefault();
					e.stopPropagation();
				} else {
					e.preventDefault();
					e.stopPropagation();
				}
			}
		}
		///  点击用户名称获取
	$scope.goToPersonInfo_title = function(e) {
		e.preventDefault();
		e.stopPropagation();
		var userid = $scope.chatiteminfo.id;
		$rootScope.personCardInfo = IMChatUser.getInstance().getVCard(userid);
		//判断是否本人卡片以及是否关注此人
		var isuser = (userid == YYIMChat.getUserID()) ? true : false;
		$rootScope.isOperator = {
			isuser: isuser,
			isattention: isattention
		};
		jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
			
	};
	$scope.goToPersonInfo_chat = function(item, e) {
		e.preventDefault();
		e.stopPropagation();
		var userid = "";
		if (item._type == "chat") {
			userid = item._from;
		} else if (item._type == "groupchat") {
			if (item._sendType == "send") {
				userid = item._fromRoster
			} else {
				userid = item._fromRoster;
			}
		}
		
		var isuser = (userid == YYIMChat.getUserID()) ? true : false;
		$rootScope.isOperator = {
			isuser: isuser,
			isattention: isattention
		};
		jQuery('.IMChat-model-cover,.IMChat-model-bd.IMChat-set-vcard').removeClass('hidden');
		
	};
	$scope.canLoad = true;
	$scope.pullHistoryMessage = function() {
		console.log("執行獲取");
		jQuery('.loading-animation').removeClass('hidden');
		IMChatHandler.getInstance().getHistoryMessage({
			id: $rootScope.$stateParams.personId,
			chatType: $scope.chatiteminfo.type,
			success: function() {
				$scope.safeApply(function() {
					console.log("id")
					console.log($rootScope.$stateParams.personId);
					$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);
					jQuery('.loading-animation').addClass('hidden');
					jQuery('.IMChat-entity-display').scrollTop('400');
				})
			}
		});

	}
	$scope.filename = {

		file: ""

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
			console.log($scope.filename.file);
			if (photofile) {
				var index = photofile.name.lastIndexOf('.');
				var strtype = photofile.name.substr(index + 1, 3);
				strtype = strtype.toLowerCase();
				console.log(strtype);
				console.log(jQuery.inArray(strtype, IMAGE_TYPES))
				if (jQuery.inArray(strtype, IMAGE_TYPES) >= 0) {
					IMChatHandler.getInstance().sendPicMessage({
						fileInputId: "file_upload_input",
						to: $rootScope.$stateParams.personId,
						type: $rootScope.$stateParams.chatType,
						success: function(data) {
							$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);

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
			console.log($scope.filename.file)
		}

	}



	$rootScope.captureData = {


		b64data: ""

	};
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
				$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);
				$scope.checkLatest();
				$state.transitionTo("home.message2", {
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
	$scope.islinux=NWKeyService.islinux;
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
			console.log(photofile);


			if (photofile) {

				if (photofile.size <= 50000000) {
					// IMChatHandler.getInstance().sendFileMessage({fileInputId:"file_upload_inputfile",to:$rootScope.$stateParams.personId,success:function(data){
					IMChatHandler.getInstance().sendFileMessage({

						fileInputId: "file_upload_inputfile",
						to: $rootScope.$stateParams.personId,
						type: $rootScope.$stateParams.chatType,
						success: function(data) {

							$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);

							// $(".textedit-box").text("");
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
					})


				} else {
					toaster.pop({
						title: ' 文件大小仅限50M！',
						type: 'warn',
						showCloseButton: true

					});
				}



			}
			console.log($scope.filename.file)

		}

	}


	$scope.getfileinfo = function() {


		console.log($scope.filename.file)

	}

	$scope.sendgroupmessage = function() {

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能发送消息，请退出重试！',
				type: 'warn'
			});

		} else {

			var text = $(".textedit-box").val().trim();
			console.log("send" + $rootScope.$stateParams);
			console.log($scope);
			IMChatHandler.getInstance().sendTextMessage(

				{

					to: $rootScope.$stateParams.personId,
					msg: text,
					type: "groupchat",
					success: function() {

						$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);

						// $(".textedit-box").text("");

						$(".textedit-box").html("");
						jQuery('.IMChat-send-btn').removeClass('active').attr('disabled', 'true');

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
						console.log("发送失败" + $rootScope.$stateParams.personId + $rootScope.$stateParams);

					}


				})

		}


	}




	$scope.sendMessage = function() {
		/**
		 * 发送文字信息
		 * arg{
		 * 		to:'yinjie',
		 *  	msg:'4545',
		 *  	type:'chat/groupchat/pubaccount',
		 *  	style:{
		 * 			font:'',
		 *      	color:'',
		 * 			size:'',
		 * 			biu:''
		 *  	},
		 *  	success:function,
		 *  	error:function
		 * }
		 */

		if (!$rootScope.userState.isonline) {
			toaster.pop({
				title: '您已经离线,不能发送消息，请退出重试！',
				type: 'warn'
			});

		} else {
			var chattype = $rootScope.$stateParams.chatType;

			console.log("type");

			console.log(chattype);
			var text = $scope.htmlEscape($(".textedit-box").val().trim());
			console.log("send" + $rootScope.$stateParams);
			console.log($scope);
			IMChatHandler.getInstance().sendTextMessage(

				{

					to: $rootScope.$stateParams.personId,
					msg: text,
					type: chattype,

					success: function() {

						var datatime = new Date().valueOf().toString();
						messageinfo = text;
						//IMChathistoryServiceV2.addorupdate($scope.chatiteminfo.id,$scope.chatiteminfo.type,$scope.chatiteminfo.name);
						IMChathistoryServiceV2.addinfoorupdate($scope.chatiteminfo.id, $scope.chatiteminfo.type, $scope.chatiteminfo.name, datatime, messageinfo);

						$scope.chatMessages = IMChatMessageCache.getInstance().getAllMessage($rootScope.$stateParams.personId);

						//  $(".textedit-box").text("");

						$(".textedit-box").val("");
						jQuery('.IMChat-send-btn').removeClass('active').attr('disabled', 'true');
						jQuery('.list-wrapper').scrollTop(0); // 最近聊天的显示头部
						jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height());
						console.log("the height info:");
						setTimeout(function() {

							jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height())

						}, 50);
					},
					error: function() {


						toaster.pop({
							title: '消息发送失败,请重试！',
							type: 'warn'
						});

						console.log("发送失败" + $rootScope.$stateParams.personId + $rootScope.$stateParams);

					}


				});

			



		}


	}

   $scope.htmlEscape=function(html) {
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
	//-----------------岳振华添加--------------------
	//消息面板右上角  群组点击事件
	$scope.groupSetup_Click = function() {
		$scope.$broadcast("groupSetup_Change", $scope.chatiteminfo);
	}


	//消息面板右上角  单聊转群聊点击事件
	$scope.personSetup_Click = function() {

		ngDialog.open({
			template: 'WebContent/res/templete/add-groupchat.htm',
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
		//jQuery('.IMChat-entity-display').scrollTop(jQuery('.message-entity').height())
		jQuery('.IMChat-entity-display.message').addClass('fadeIn')

	}, 160);

}])



app.controller("chatListctrl", ["$rootScope", "$scope", "IMChathistoryServiceV2", "$state", "$interval", "appopenService", "ngDialog", "toaster", "_","urlParseService",
	function($rootScope, $scope, IMChathistoryServiceV2, $state, $interval, appopenService, ngDialog, toaster, _,urlParseService) {

		$scope.db = IMChathistoryServiceV2.db;
		$scope.getUserCurrentState = function(item) {
			if (item.type == "chat") {
				var isonline = false;
				for (var j = 0; j < $rootScope.userStatesList.length; j++) {
					if ($rootScope.userStatesList[j].userid == item.id)
						for (var i = 0; i < $rootScope.userStatesList[j].presence.length; i++) {
							if ($rootScope.userStatesList[j].presence[i].available == 1) {
								isonline = true;
								break;
							}
						};
				}
			}
			return isonline;
		}

		$scope.chatHistoryList = IMChathistoryServiceV2.chatlist;

		$scope.$on('chatHistoryListChange_toparent', function(name, data) {
			$scope.chatHistoryList = IMChathistoryServiceV2.chatlist;
			$scope.db = IMChathistoryServiceV2.db;
		});

		///  添加用户在线状态的处理

		$scope.istoday = function(datetime) {

			var infodate = new Date(Number(datetime));

			var today = new Date();

			if ((infodate.getDay() != today.getDay()) || (infodate.getMonth() != today.getMonth()) || (infodate.getFullYear() != today.getFullYear())) {

				return false;
			}

			return true;

		}
		$scope.$on("chatlistmessage", function(name, data) {

			$scope.chatHistoryList = IMChathistoryServiceV2.chatlist;
			$scope.db = IMChathistoryServiceV2.db;

		})
		$scope.getchattypename = function(id, type) {
			return "未知";
		}
		$scope.$on('chatHistoryListChange_tochild', function(name, data) {
			$scope.chatHistoryList = IMChathistoryServiceV2.chatlist;
			$scope.db = IMChathistoryServiceV2.db;
		});
		$scope.getRosterVcard = function(rosterId) {
			return IMChatUser.getInstance().getUserVcard(rosterId);
		}
		$scope.$on("unreadchatmessage", function(name, data) {

			console.log("获取未读消息");

			///  校验客户的信息 

			/*

			  1. 校验客户的信息 

			  2. 存在在列表中，以及不存在列表中的数据  


			  3. 展示需要的信息  {未读消息：消息数    }
			*/
		})

		///  获取用户未读的消息

		$scope.getunReadmessageCounts = function(rosterId) {
			var length = IMChatMessageCache.getInstance().getUnreadedMessageLendth(rosterId);
			return length > 99 ? "99+" : length;

		}

		$scope.openAppH5 = function(appinfo) {
			ngDialog.open({
				template: 'WebContent/res/templete/app-Dialog.htm',
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

		$scope.goToMessage = function(item) {
			//  此处会改进为：switch 
			switch (item.type) {
				case constant.CHAT_TYPE.CHAT:

					//  单聊消息处理
					if (!item.name) {

						item.name = item.id;
					}
					console.log(item);

					$state.go("home.message2", {
						personId: item.id,
						personName: item.name,
						chatType: item.type
					});
					break; //普通消息
				case constant.CHAT_TYPE.GROUP_CHAT:

					//  群聊消息处理
					if (!item.name) {

						item.name = item.id;
					}
					console.log(item);
					$state.go("home.message2", {
						personId: item.id,
						personName: item.name,
						chatType: item.type
					});

					break; //群聊消息
				case constant.CHAT_TYPE.DEVICE:
					break; //设备消息

				case constant.CHAT_TYPE.SHENPI:
					$(".capturecontrl").remove();
					if (item.type == "shenpi") {
						var url = appopenService.navUrl("YIT_03_00001");
						var appinfo = {
							appurl: url,
							appname: "审批中心"
						}
						IMChatMessageCache.getInstance().getAllMessage(item.id);
						$scope.$emit("unreadchatmessagechange", "change");
                        $state.go("home.message4", {
							appid: "YIT_03_00001",
							appname:"审批中心"
							 
						});

					}

					break; //审批
				case constant.CHAT_TYPE.TIXING:
					if (item.type == "tixing") {
						if (!item.name) {

							item.name = item.id;
						}
						console.log(item);
						$state.go("home.message", {
							personId: item.id,
							personName: item.name,
							chatType: item.type
						});
					}
					break; //提醒
				case constant.CHAT_TYPE.PUB_ACCOUNT:

					if (item.id == "yyit_approval_center") {
						$(".capturecontrl").remove();
						var url = appopenService.navUrl("YIT_03_00001");
						var appinfo = {
							appurl: url,
							appname: "审批中心"
						}
						IMChatMessageCache.getInstance().getAllMessage(item.id);
						$scope.$emit("unreadchatmessagechange", "change");
						$state.go("home.message4", {
							appid: "YIT_03_00001",
							appname:"审批中心"
							 
						});
//						if(urlParseService.pid=="0000060667")
//						{
//							$state.go("home.message4", {
//							appid: "YIT_03_00001",
//							appname:"审批中心"
//							 
//						});
//							
//						}
//						else
//						{
//						
//						IMChatMessageCache.getInstance().getAllMessage(item.id);
//						$scope.$emit("unreadchatmessagechange", "change");
//						$scope.openAppH5(appinfo);
//							
//						}                        
					} else {
						if (!item.name) {

							item.name = item.id;
						}
						console.log(item);
						$state.go("home.message3", {
							personId: item.id,
							personName: item.name,
							chatType: item.type
						});

					}

					//   公众号处理 

					break; //公众号消息	  
				default:
					YYIMChat.log("未处理消息类型", 3, arg.type);
					break; //漏掉的消息类型
			}
		}

		$scope.removeitem = function(item, e) {

			e.preventDefault();
			e.stopPropagation();
			//  广播消息进行消息显示数的更新
			IMChatMessageCache.getInstance().setUnreadedMessageToNull(item.id);
			$scope.$emit("unreadchatmessagechange", "我的测试");
			IMChathistoryServiceV2.remove(item.id);

			$state.go("home");

		}
	}
])

app.run(["$rootScope", "urlParseService", "$state", "$stateParams", "messageHandler", "toaster", "IMChathistoryServiceV2",

	"$cookies", "ngDialog", "audioPlayService", "dataProtectService", "appopenService", "updateService", "$interval", 
	function($rootScope, urlParseService, $state, $stateParams, messageHandler, toaster, IMChathistoryServiceV2, $cookies, ngDialog, audioPlayService, dataProtectService, appopenService, updateService, $interval) {
		$rootScope.userLoginParames = urlParseService;
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
		console.log($rootScope.userLoginParames);
		$rootScope.chatMessages = [];
		var snsLoginConflict = false;
		$rootScope.SendMessages = [];
		$rootScope.db = IMChathistoryServiceV2.db;
		$rootScope.userStatesList = [];
		console.log($rootScope.userLoginParames.pid);
		console.log($rootScope.userLoginParames.tk);
		$rootScope.islogout = false;
		$rootScope.issnsLoginConflict=false;
		$rootScope.userState = {
			isonline: false,
			isfirst:true
		};
		$rootScope.historyUserList = IMChatMessageCache.getInstance()._unreadedList;
		//updateService.showupdateinfo(window.newversion); //版本更新更新提示

		console.log("执行快捷键注册");
//		shortCutService.unregisterHotKey();
//		shortCutService.registerHotKey();
		YYIMChat.initSDK("udn", "yonyou");
		/* 初始化SDK */
		YYIMChat.init({
			onOpened: onOpened,
			onClosed: function(arg) {
				console.info("连接关闭")
				console.log(arg)
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
				console.info("onGroupUpdate");
				console.log(arg);
				IMChatUser.getInstance().updateChatRoom(arg);
			},
			onKickedOutGroup: function(arg) {
				var groupinfo = IMChatUser.getInstance()._userCache.chatroom[arg.from];
				var groupname = "";
				if (groupinfo) {
					groupname = groupinfo._name;
				}
				var notification = new window.Notification("新消息通知", {
					body: "您被移除群" + groupname,
					icon: "logo.png"
				});
				console.info("onKickedOutGroup");
				console.log(arg);
				///  此处需要进行历史消息的处理
				IMChatMessageCache.getInstance().setUnreadedMessageToNull(arg.from);
				$rootScope.$broadcast("unreadchatmessagechange", "我的测试");
				IMChatUser.getInstance().kickedByGroup(arg.from);
				IMChathistoryServiceV2.remove(arg.from);
				$state.go("home");

			},

			onStatusChanged: function(status) {

				console.log("status method");

				console.log(status);

				if (!status)
					return;

				//debugger
				if (status && status.errorCode == 409) {

					snsLoginConflict = true;
					YYIMChat.logout();
					$rootScope.issnsLoginConflict=true;
					ngDialog.open({
						template: 'WebContent/res/templete/MessageInfo.htm',
						controller: 'mainCtrl',
						className: '',
						showClose: false,
						closeByEscape: false,
						closeByDocument: false
					});
				}

			},
			onConnectError: function(status) {
				console.log("connect  method");
				console.log(status);
				if (!status)
					return;
				console.info("状态改变")

				if (snsLoginConflict) {
					YYIMChat.logout();
					ngDialog.open({
						template: 'WebContent/res/templete/MessageInfo.htm',
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
					$rootScope.issnsLoginConflict=true;
					ngDialog.open({
						template: 'WebContent/res/templete/MessageInfo.htm',
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
					if(!$rootScope.issnsLoginConflict)
					 {
					 	if (!$rootScope.userState.isonline) {
					 		YYIMChat.disConnect();
					        YYIMChat.logout();
					 		YYIMChat.connect();
					 }
					
				     }
			      }
			},
			onUserBind: function(arg) {},
			onPresence: function(arg) {

				console.info("用户状态改变");
				console.log(arg)
				if (arg.from == YYIMChat.getUserID()) {
                      console.log("用户在线状态")
                      console.log(arg)
						if (arg.resource.indexOf('web') > -1) {

							$rootScope.$broadcast("userstateChange", arg);

							if (arg.status != "chat") {

								toaster.pop({
									title: '连接失败，正在重试！',
									type: 'warn'
								});
								snsLoginConflict = false;
							}

							if (arg.status == "chat") {
								// / 在线状态对于已经不是群组成员的处理
								// / 进行聊天历史列表信息的删除
								// var IMChathistoryServiceV2.db().select("id");
								var chatidlist = [];
                                $rootScope.userState.isonline=true;
								snsLoginConflict = false;
								for (var item in IMChatUser.getInstance()._userCache.chatroom) {
									chatidlist.push(item);
								}
								var chathistorylist = IMChathistoryServiceV2.db({
									type: "groupchat"
								}).select("id");
								var pubhsitorylist = IMChathistoryServiceV2.db().select("id");
								console.log(chathistorylist);
								var removelist = _.difference(chathistorylist, chatidlist);
								console.log(removelist);
								console.info("移除数据");
								for (var k = 0; k < removelist.length; k++) {
									IMChathistoryServiceV2.remove(removelist[k]);
								}
								// / 进行公众号名称信息的更新
								for (var p = 0; p < pubhsitorylist.length; p++) {

									if (IMChatUser.getInstance()._userCache.pubaccount[pubhsitorylist[p]]) {
										IMChathistoryServiceV2.updatepubname(pubhsitorylist[p], IMChatUser.getInstance()._userCache.pubaccount[pubhsitorylist[p]]._name);
									}

								}

							}
						}
						
					}
			},
			onSubscribe: function(arg) {

				console.info("dingyue");
				console.log(arg);
			},
			onRosterUpdateded: function(arg) {
				console.info("onRosterUpdateded");
				console.log(arg);

			},
			onRosterDeleted: function(arg) {

				console.info("onRosterDeleted");
				console.log(arg);
			},
			onRoomMemerPresence: function(arg) {
				console.info("onRoomMemerPresence");
				console.log(arg);
			},
			onReceipts: function(arg) {
				if (arg.state == 2 && arg.to == YYIMChat.getUserID()) { //发送的消息对方已读
					console.log(arg);
					IMChatMessageCache.getInstance().batchMarkReaded({
						rosterid: arg.from,
						messageid: arg.id
					});
				}

			},
			onTextMessage: analysisReceiveMessage1,
			onPictureMessage: analysisReceiveMessage1,
			onFileMessage: analysisReceiveMessage1,
			onShareMessage: function(arg) {},
			onMessageout: function(arg) {},
			onAudoMessage: function(arg) {
				analysisReceiveMessage1(arg);
			},
			onSystemMessage: function(arg){
				console.log(arg);
			    analysisReceiveMessage3(arg);
				
				
			}, //接收到单图文消息
            onPublicMessage: function(arg){
            	
             analysisReceiveMessage2(arg);
             
            }, //接收到多图文消息
			onPubaccountUpdate: function(arg) {
				if (arg && arg.length) {
					for (var z in arg) {
						var pubaccount = IMChatUser.getInstance().getPubAccount(arg[z].id);
						if (!pubaccount) {
							pubaccount = new IMChatPubAccount(arg[z]);
							IMChatUser.getInstance().push('pubaccount', pubaccount._id, pubaccount);
						} else {
							pubaccount.construct(arg[z]);
						}
					}
				}
			}
		});

//		YYIMChat.login($rootScope.userLoginParames.pid, $rootScope.userLoginParames.tk);
		YYIMChat.login('rongqb.udn.yonyou', 'e1b279e5-6794-4bd9-a751-24b988ac6d73');
        
        function analysisReceiveMessage2(arg)
        {
        	console.log(arg)
            	if (arg.type == constant.CHAT_TYPE.GROUP_CHAT) { // 群聊时 服务反射消息给所有房客，自己也会收到发送的消息，需排除
				if (arg.from.roster == YYIMChat.getUserID()) {
					return;
				}
			}
			var message = new IMChatMessage(arg);
			message._to = YYIMChat.getUserID();
			message._toVcard = IMChatUser.getInstance().getVCard();
            message._data=arg.data.content;
			jQuery.when(IMChatUser.getInstance().getEntityVcard(message._from))
				.done(function() {
					console.info("聊天通知");
					
					 message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
					 
					///  聊天界面的時候不需要顯示通知
 	 			    if (message && message._type) {
						switch (message._type) {
							
						 case constant.CHAT_TYPE.CHAT:
						 
						    break;
						    
						 case constant.CHAT_TYPE.GROUP_CHAT:
						 
						    break;
						 case constant.CHAT_TYPE.PUB_ACCOUNT:
						 
						    
								if (!!message._fromVcard && !!message._fromVcard._name) {

									var newinfo = "消息:" + message._fromVcard._name + ":" + "公众号推送广播信息";


									console.log(newinfo)
								}
								else
								{
									var newinfo =info;
								}
								var notification = new window.Notification("新消息通知", {
										body: newinfo,
										icon: "logo.png"
									});
									console.log("提示信息2015");
									console.log(newinfo)
									notification.onclick = function() {

										win.show();
									}
 
								IMChatMessageCache.getInstance().pushUnreadedMessage(message._from, message);
								console.log("获取的消息信息为数据:")
								console.log(message);
								var datetime = message.dateline;
								var messageinfo = message._data[0].title;
								console.info("数据类型");
								console.log("收到聊天消息");
								if (!message._fromVcard) {
									console.log("shujv");
									if (message._from == "yyit_approval_center") {
										console.log("审批");
										IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);
									} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {
										IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
									} else {
										IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._from, datetime, messageinfo);
									}

									//IMChathistoryServiceV2.addorupdate(message._from, message._type, message._from);
								} else {
									if (!message._fromVcard._name) {
										console.info("xieri");
										console.info("kpong");
										console.log(message);
										console.log("沒有數據")
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);

										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._from, datetime, messageinfo);

										}

									} else {
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._name, datetime, messageinfo);
										}
									}
								}
								console.log("数据写入")
								console.log(audioPlayService);
								audioPlayService.play();
								$rootScope.$broadcast("chatlistmessage", message);
								$rootScope.$broadcast("unreadchatmessage", message);
								$rootScope.$broadcast("chatmessage", message);
								console.log(message);

								break; //公众号消息	  
						 
						    
						 
						}
					}
 	 			    });
        	
        	
        	
        }
        
        
        function analysisReceiveMessage3(arg)
        {
        	console.log(arg)
            	if (arg.type == constant.CHAT_TYPE.GROUP_CHAT) { // 群聊时 服务反射消息给所有房客，自己也会收到发送的消息，需排除
				if (arg.from.roster == YYIMChat.getUserID()) {
					return;
				}
			}
			var message = new IMChatMessage(arg);
			message._to = YYIMChat.getUserID();
			message._data=arg.data.content;
			message._toVcard = IMChatUser.getInstance().getVCard();

			jQuery.when(IMChatUser.getInstance().getEntityVcard(message._from))
				.done(function() {
					console.info("聊天通知");
					
					 message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
					 
					///  聊天界面的時候不需要顯示通知
 	 			    if (message && message._type) {
						switch (message._type) {
							
						 case constant.CHAT_TYPE.CHAT:
						 
						    break;
						    
						 case constant.CHAT_TYPE.GROUP_CHAT:
						 
						    break;
						 case constant.CHAT_TYPE.PUB_ACCOUNT:
						 
						    
								if (!!message._fromVcard && !!message._fromVcard._name) {

									var newinfo = "消息:" + message._fromVcard._name + ":" + "公众号推送广播信息";


									console.log(newinfo)
								}
								else
								{
									var newinfo =info;
								}
								var notification = new window.Notification("新消息通知", {
										body: newinfo,
										icon: "logo.png"
									});
									console.log("提示信息2015");
									console.log(newinfo)
									notification.onclick = function() {

										win.show();
									}
 
								IMChatMessageCache.getInstance().pushUnreadedMessage(message._from, message);
								console.log("获取的消息信息为数据:")
								console.log(message);
								var datetime = message.dateline;
								var messageinfo = message._data.title;
								console.info("数据类型");
								console.log("收到聊天消息");
								if (!message._fromVcard) {
									console.log("shujv");
									if (message._from == "yyit_approval_center") {
										console.log("审批");
										IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);
									} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {
										IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
									} else {
										IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._from, datetime, messageinfo);
									}

									//IMChathistoryServiceV2.addorupdate(message._from, message._type, message._from);
								} else {
									if (!message._fromVcard._name) {
										console.info("xieri");
										console.info("kpong");
										console.log(message);
										console.log("沒有數據")
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);

										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._from, datetime, messageinfo);

										}

									} else {
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._name, datetime, messageinfo);
										}
									}
								}
								console.log("数据写入")
								console.log(audioPlayService);
								audioPlayService.play();
								$rootScope.$broadcast("chatlistmessage", message);
								$rootScope.$broadcast("unreadchatmessage", message);
								$rootScope.$broadcast("chatmessage", message);
								console.log(message);

								break; //公众号消息	  
						 
						    
						 
						}
					}
 	 			    });
        	
        	
        	
        }
		function analysisReceiveMessage1(arg) {
			if (arg.type == constant.CHAT_TYPE.GROUP_CHAT) { // 群聊时 服务反射消息给所有房客，自己也会收到发送的消息，需排除
				if (arg.from.roster == YYIMChat.getUserID()) {
					return;
				}
			}
			var message = new IMChatMessage(arg);
			message._to = YYIMChat.getUserID();
			message._toVcard = IMChatUser.getInstance().getVCard();

			jQuery.when(IMChatUser.getInstance().getEntityVcard(message._from))
				.done(function() {
					console.info("聊天通知");
					var notifinfp = message._data.content.name || message._data.content;
					var info = notifinfp.substr(0, 30);

					///  聊天界面的時候不需要顯示通知

					var isnewtperson = false;

					if ($rootScope.$stateParams.personId) {

						if (($rootScope.$stateParams.personId).toLowerCase() != message._from) {
							isnewtperson = true;
						}

					}
					console.info("获取的消息信息为数据:")
					console.log(message);
					if (message && message._type) {
						switch (message._type) {
							case constant.CHAT_TYPE.CHAT:
							
								message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
 
								IMChatMessageCache.getInstance().pushUnreadedMessage(message._from, message);

								console.info("播放")

								if (!!message._fromVcard && !!message._fromVcard.nickname) {

									var newinfo = message._fromVcard.nickname + " : " + info;

								}
								else
								{
									var newinfo =info;
								}
								var notification = new window.Notification("新消息通知", {
										body: newinfo,
										icon: "logo.png"
									});
									console.log("提示信息2015");
									console.log(newinfo)
									notification.onclick = function() {

										win.show();
									}

								console.log("获取的消息信息为数据:")
								console.log(message);

								var datetime = message._data.dateline;

								var messageinfo = message._data.content;
								console.info("数据类型");
								console.log("收到聊天消息");

								if (!message._fromVcard) {


									console.log("shujv");
									if (message._from == "yyit_approval_center") {
										console.log("审批");

										IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);
									} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

										IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);

									} else {
										IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._from, datetime, messageinfo);
									}


								} else {
									if (!message._fromVcard.nickname) {
										console.info("xieri");
										console.info("kpong");
										console.log(message);
										console.log("沒有數據")
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);

										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard.userId, datetime, messageinfo);

										}

									} else {

										console.log("執行獲取2015")
										console.info("xieri");
										console.log(message);

										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard.nickname, datetime, messageinfo);
										}
									}

								}
								console.log("数据写入")
								console.log(audioPlayService);
								audioPlayService.play();
								$rootScope.$broadcast("chatlistmessage", message);
								$rootScope.$broadcast("unreadchatmessage", message);
								$rootScope.$broadcast("chatmessage", message);
								console.log(message);
								break; //普通消息
							case constant.CHAT_TYPE.GROUP_CHAT:

								YYIMChat.getChatGroupInfo({
									id: message._from,
									success: function(data) {
										var info2 = {

											id: message._from,
											name: data.name
										};
										var chatroom = new IMChatRoom(info2);

										console.info("获取群组信息2015");
										console.log(chatroom);
										//	message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
										message._fromVcard = chatroom;
										console.log(message._fromRoster);
										YYIMChat.getVCard({
											id: message._fromRoster,
											success: function(data) {
												var uservcardinfo = data;

												console.log(uservcardinfo);

												console.info("获取群组人员信息2015");
												console.log(uservcardinfo);

												var roomvcard = {

													name: uservcardinfo.nickname,

													id: uservcardinfo.userId
												}

												var vcardinfo = new IMChatRoomMVcard(roomvcard);
												message._fromRosterVcard = vcardinfo;
												IMChatMessageCache.getInstance().pushUnreadedMessage(message._from, message);
												console.log("收到群组聊天消息");
												console.log($stateParams.personId)
												console.info("群组信息");
												console.log(message._fromVcard);
												var datetime2 = message._data.dateline;
												if (!!message._fromRosterVcard.nickname && !!message._fromRosterVcard.nickname) {

													var newinfo = "群:" + message._fromRosterVcard.nickname + ":" + info;


													console.log(newinfo)
												}
												else
												{
													var newinfo =info;
												}
												
												var notification = new window.Notification("新消息通知", {
													body: newinfo,
													icon: "logo.png"
												});
												console.log("提示信息2015");
												console.log(newinfo)
												notification.onclick = function() {
			
													win.show();
												}
 
												var messageinfo2 = message._data.content;
												if (!message._fromVcard._name) {
													console.info("xieri");
													console.info("kpong");
													console.log(message);
													IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._id, datetime2, messageinfo2);
												} else {
													console.info("xieri");
													console.log(message);
													IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._name, datetime2, messageinfo2);
												}
												console.log("数据写入")
												audioPlayService.play();
												$rootScope.$broadcast("chatlistmessage", message);
												$rootScope.$broadcast("unreadchatmessage", message);
												$rootScope.$broadcast("groupchatmessage", message);
												console.log(message);
											}
										})
									}
								})

								break; //群聊消息
							case constant.CHAT_TYPE.DEVICE:
								break; //设备消息
							case constant.CHAT_TYPE.PUB_ACCOUNT:

								//  此处需要添加的功能  

								//  1. 更新已经为 tixing shenpi=>pubaccout

								//  2. 消息的处理  获取历史的消息

								//  3. 界面信息显示

								//  4. 
								console.log("公众号")

								 
								message._fromVcard = IMChatUser.getInstance().getVCard(message._from);
 

								if (!!message._fromVcard && !!message._fromVcard._name) {

									var newinfo = "消息:" + message._fromVcard._name + ":" + info;


									console.log(newinfo)
								}
								else
								{
									var newinfo =info;
								}
								var notification = new window.Notification("新消息通知", {
										body: newinfo,
										icon: "logo.png"
									});
									console.log("提示信息2015");
									console.log(newinfo)
									notification.onclick = function() {

										win.show();
									}
 
								IMChatMessageCache.getInstance().pushUnreadedMessage(message._from, message);
								console.log("获取的消息信息为数据:")
								console.log(message);
								var datetime = message._data.dateline;
								var messageinfo = message._data.content;
								console.info("数据类型");
								console.log("收到聊天消息");
								if (!message._fromVcard) {
									console.log("shujv");
									if (message._from == "yyit_approval_center") {
										console.log("审批");
										IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);
									} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {
										IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
									} else {
										IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._from, datetime, messageinfo);
									}

									//IMChathistoryServiceV2.addorupdate(message._from, message._type, message._from);
								} else {
									if (!message._fromVcard._name) {
										console.info("xieri");
										console.info("kpong");
										console.log(message);
										console.log("沒有數據")
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);

										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._from, datetime, messageinfo);

										}

									} else {
										if (message._from == "yyit_approval_center") {
											console.log("审批");
											IMChathistoryServiceV2.addinfoorupdate(message._from, "shenpi", "审批中心", datetime, messageinfo);

										} else if (message._from.indexOf("yyit_schedule_reminder") > -1) {

											IMChathistoryServiceV2.addinfoorupdate(message._from, "tixing", "日程提醒", datetime, messageinfo);
										} else {
											IMChathistoryServiceV2.addinfoorupdate(message._from, message._type, message._fromVcard._name, datetime, messageinfo);
										}
									}
								}
								console.log("数据写入")
								console.log(audioPlayService);
								audioPlayService.play();
								$rootScope.$broadcast("chatlistmessage", message);
								$rootScope.$broadcast("unreadchatmessage", message);
								$rootScope.$broadcast("chatmessage", message);
								console.log(message);

								break; //公众号消息	  
							default:
								YYIMChat.log("未处理消息类型", 3, arg.type);
								break; //漏掉的消息类型
						}
					}
 
				});


		}

		function onOpened() {
			snsLoginConflict = false; // 连接后, 不冲突, 自动登录
			toaster.pop({
				title: '消息服务器连接成功！',
				type: 'success'
			});
			$cookies.token = $rootScope.userLoginParames.tk;
			$cookies.expiration = $rootScope.userLoginParames.ts;
			IMChatHandler.getInstance().init();
			
			var initmyVCard = setInterval(function(){
				var card = IMChatUser.getInstance().getVCard();
				if(card){
					clearInterval(initmyVCard);
					$rootScope.$broadcast("initmyVCard", card);
//					jQuery('#login-container').hide();
					jQuery('#container').show();
				}
			},100);
		}

		$interval(function() {

			var ids = $rootScope.db({
				type: "chat"
			}).select("id");

			if ($rootScope.userState.isonline&&ids.length > 0&&!$rootScope.issnsLoginConflict) {
				YYIMChat.getRostersPresence({
					username: ids,
					success: function(data) {
						$rootScope.userStatesList = data;
						$rootScope.islogout=false;
					},
					error: function() {

						$rootScope.userStatesList = [];
						$rootScope.userState.isonline = false;
					}

				});
			}

		}, 10000);
		///  处理重连问题
//		setInterval(function() {
//			if (!$rootScope.userState.isonline) {
//				if (!$rootScope.islogout) {
//					YYIMChat.logout();
//				} else {
//					YYIMChat.connect();
//				}
//			}
//
//		}, 5000);


//		///  处理会话过期的情况
//		setTimeout(function() {
//			ngDialog.open({
//				template: 'WebContent/res/templete/sessioTimeout.htm',
//				controller: 'mainCtrl',
//				className: '',
//				showClose: false,
//				closeByEscape: false
//			});
//
//
//		}, Number(parseInt($rootScope.userLoginParames.ts)) - new Date().getTime());
//
	}
]);
