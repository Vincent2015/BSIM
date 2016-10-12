var SNSApplication = function(code) {
	if (!code || code !== "SNSApplication cannot be new, use SNSApplication.getInstance() instead.") {
		throw "SNSApplication cannot be new, use SNSApplication.getInstance() instead.";
	}

	this._id = Math.uuid();
	this._loginName;
	this._user = new SNSUser();
	
	this._messageInBox = new SNSMessageInBox();
	this._messageOutBox = new SNSMessageOutBox();

};

SNSApplication.version = '2.1';

SNSApplication.getInstance = function() {
	if (!SNSApplication._instance) {
		SNSApplication._instance = new SNSApplication("SNSApplication cannot be new, use SNSApplication.getInstance() instead.");
		for ( var i in SNSApplication._instance) {
			var prop = SNSApplication._instance[i];
			if (prop && prop._init && typeof prop._init == "function") {
				prop._init();
			}
		}
		
		SNSApplication._instance.getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.AFTER_LOAD, []);
		SNSIMWindow.getInstance();
	}
	return SNSApplication._instance;
};

SNSApplication.prototype.getID = function() {
	return this._id;
};

SNSApplication.prototype.getUser = function() {
	return this._user;
};

SNSApplication.prototype.getDomain = function() {
	if(this._user && this._user.jid){
		return this._user.jid.getDomain();
	}
	return YYIMChat.getServerName();
};

SNSApplication.prototype.getGlobalEventManager = function() {
	return SNSGlobalEventManager.getInstance();
};

SNSApplication.prototype.getTemplateManager = function() {
	return this._templateManager;
};

SNSApplication.prototype.getMessageInBox = function() {
	return this._messageInBox;
};

SNSApplication.prototype.getMessageOutBox = function() {
	return this._messageOutBox;
};

/**
 * 注册接收到消息的过滤器， 处理顺序按照filter.priority从小到大处理
 * @param filter {SNSMessageFilter}
 */
SNSApplication.prototype.registerMessgeInFilter = function(filter){
	SNSApplication.getInstance().getMessageInBox().filter.registerFilter(filter);
};

/**
 * 注册发送消息的过滤器， 处理顺序按照filter.priority从小到大处理
 * @param filter {SNSMessageFilter}
 */
SNSApplication.prototype.registerMessgeOutFilter = function(filter){
	SNSApplication.getInstance().getMessageOutBox().filter.registerFilter(filter);
};

/**
 * 
 * @param username
 * @param password
 * @param isToken {boolean}password是否已经是token,若是,则不需要再ajax请求
 */
SNSApplication.prototype.login = function(username, password, isToken){
	if(!SNSCommonUtil.isStringAndNotEmpty(username) && YYIMChat.enableAnonymous()) {
		YYIMChat.login(null, "anonymous",new Date().getTime() + 14 * (24 * 60 * 60 * 1000));
		return;
	}
	if (!username  || username.isEmpty() || !password|| password.isEmpty()) {
		//throw '用户名或密码为空';
	}
	
	this._loginName = username;
	parseName(username);
	username = username.replace(/@/g,YYIMChat.getTenancy().SEPARATOR);

	if(DEVELOP_MODE){
		YYIMChat.login(username, $.md5(password).toUpperCase());
		return;
	}
	if(isToken && isToken == true)
		YYIMChat.login(username, password);
	else
		this.getToken(username, password);
	
	function parseName(){
		var atIndex = username.indexOf("@");
		var dotIndex = username.indexOf(".");
		if(atIndex < 0 && dotIndex < 0){
			//YYIMChat.getTenancy().ENABLE = false;
		}else{
			// 输入用户名格式为name@app.etp，其余格式均认为错误
			if(atIndex >= 0 && dotIndex >= 0 && atIndex < dotIndex){
				YYIMChat.initSDK(username.substring(atIndex+1, dotIndex), username.substring(dotIndex+1))
			}else{
				throw '多租户格式错误, 正确格式为:name@app.etp';
			}
		}
	};
};

SNSApplication.prototype.getToken = function(username, password){
	var tenancy = YYIMChat.getTenancy();
	var data = 'username=' + username + '&password=' + password;
	if(tenancy.ENABLE){
		data += '&app=' + tenancy.APP_KEY;
		data += '&etp=' + tenancy.ETP_KEY;
	}
	
	jQuery.support.cors = true;
	jQuery.ajax({
		url: SNS_REST_SERVER.TOKEN + "?" + data,
		dataType: 'json',
		type: "get",
		success: function(data, status, obj){
			YYIMChat.log("get token success", 3, arguments);
			SNSApplication.saveLoginInfo({
				username: SNSApplication.getInstance()._loginName,
				token: data.token,
				expiration: data.expiration
			});
			YYIMChat.login(username, data.token, data.expiration);
		},
		error: function(data){
			SNSApplication.getInstance().tokenErrorHandler(data);
		}
	});
};

SNSApplication.prototype.tokenErrorHandler = function(data, msg){
	YYIMChat.log("get token error", 2, arguments);
	var msg = {};
	if(data.responseText){
		try{
			msg = JSON.parse(data.responseText);
		}catch(e){
			YYIMChat.log(e, 0);
		}
	}
	YYIMChat.onAuthError({
		errorCode : data.status,
		message : msg.message || 'get token error'
	});
	this._afterLogout();
};

SNSApplication.prototype.logout = function(){
	YYIMChat.logout();
	SNSStorage.removeLocal("chatTabs#" + YYIMChat.getUserBareJID());
	SNSStorage.removeLocal("activeChatTab#" + YYIMChat.getUserBareJID());
	this._afterLogout();
};

SNSApplication.prototype._afterLogout = function(){
	SNSApplication.resetCookie('token');
	SNSApplication.resetCookie('expiration');
	window.location.href = getSNSBasePath();
};


SNSApplication.saveLoginInfo = function(data){
	var usernameExpdate = new Date();
	usernameExpdate.setTime(usernameExpdate.getTime() + 14 * (24 * 60 * 60 * 1000));
	SNSApplication.setCookie("username", data.username, usernameExpdate);
	
	var tokenExpdate = new Date();
	tokenExpdate.setTime(data.expiration);
	if(data && data.token && data.expiration){
		SNSApplication.setCookie("token", data.token, tokenExpdate);
		SNSApplication.setCookie("expiration", data.expiration, tokenExpdate);
		
		setTimeout(function(){
			alert('会话过期，请重新登录');
			SNSApplication.getInstance()._afterLogout();
		}, Number(data.expiration) - new Date().getTime());
	}
};

SNSApplication.setCookie = function(name, value, expires) {
    var argv = arguments;
    var argc = arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : null;
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : false;
    document.cookie = name + "=" + escape(value) + ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) + (path ? "/" : ("; path=" + path)) + ((domain == null) ? "" : ("; domain=" + domain)) + ((secure == true) ? "; secure" : "");
};

SNSApplication.getCookie = function(name) {
	var cookieArr = document.cookie.split(';');
	for(var i=0; i<cookieArr.length; i++){
		var _temp = cookieArr[i].split('=');
		var _name = _temp[0].replace(/(^\s*)|(\s$)/g, '');
		if(name == _name){
			return unescape(_temp[1]);
		}
	}
	return null;
};

SNSApplication.getCookieVal = function(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1) endstr = document.cookie.length;
    return unescape(document.cookie.substring(offset, endstr));
};

SNSApplication.resetCookie = function(name) {
    if(name){
    	var expdate = new Date();
    	SNSApplication.setCookie(name, null, expdate);
    }
};

var isSupportHtml5Upload = !!window.FormData && Object.prototype.toString.call(FormData) === '[object Function]';
//var isSupportHtml5Upload = false;