var SNSSpaceApplication = {
	SERVLET: getSNSBasePath() + 'space',
	REST_BASE: 'http://172.20.5.201:94/service/'
};

SNSSpaceApplication.initProvider = function(){
	YYIMChat.setRosterProvider(new SNSSpaceRosterProvider());
	YYIMChat.setChatGroupProvider(new SNSSpaceChatGroupProvider());
	YYIMChat.setChatGroupMemberProvider(new SNSSpaceChatGroupMemberProvider());
};

// 登录方法重写, ajax请求, 在获取到token后使用YYIMChat.login进行登录
if(0){
	SNSSpaceApplication.initProvider();
	SNSApplication.prototype.getToken = function(username, password){
		jQuery.ajax({
			url: SNSSpaceApplication.REST_BASE + "im/login/user/" + username + "/pwd/" + password,
			dataType: 'jsonp',
			type: "get",
			success: function(data, status, obj){
				if(data.code == false){
					SNSApplication.getInstance().tokenErrorHandler({
						errorCode: 401,
						message: data.message
					});
				}
				YYIMChat.log("get token success", 3, arguments);
				YYIMChat.login(data.id, data.token, data.expiration);
			},
			error: function(data){
				SNSApplication.getInstance().tokenErrorHandler(JSON.parse(data));
			}
		});
	};
}