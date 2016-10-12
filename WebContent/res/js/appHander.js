var SNS_REST_SERVER = {
		TOKEN : 'http://im.yyuap.com/demo/token', // application 中使用. 和SDK无关
//		TOKEN : 'http://172.20.8.189/sysadmin/rest/demo/token', // application 中使用. 和SDK无关
		UPLOADSWFURL:'http://im.yyuap.com/demo/'
//		UPLOADSWFURL:'http://172.20.8.189/demo/'
	};


function AppHander(){
	this.username;
	this.token;
	this.expiration;
}

AppHander.getInstance = function(){
	if(!this._instance){
		this._instance = new AppHander(); 
	}
	return this._instance;
};

AppHander.prototype.login = function(username,password){
	if(typeof(username) === 'undefined' || typeof(password) === 'undefined'){
		return;
	}
	
	if(CookieUtil.getCookie('isLogining') === 'yes'){
		return;
	}
	
	CookieUtil.setCookie('isLogining','yes',7*24*60);
	
	CookieUtil.setCookie('username',username,7*24*60);
	
	username = this.parseUsername(username);
	
	this.getToken(username,password);
};

AppHander.prototype.parseUsername = function(username){
	var atIndex = username.lastIndexOf('@');
	var pIndex = username.lastIndexOf('.');
	
	if(atIndex === -1 || pIndex === -1 || atIndex > pIndex){
		return;
	}
	
	var etpId = username.slice(pIndex+1); 
	var appId = username.slice(atIndex+1,pIndex); 
	
	this.username = username.slice(0,atIndex);
	
	username = username.replace('@','.');
	
	YYIMChat.initSDK(appId,etpId);
	
	return username;
};

AppHander.prototype.getToken = function(username, password){
	var tenancy = YYIMChat.getTenancy();
	var data = 'username=' + username + '&password=' + password;
	if(tenancy.ENABLE){
		data += '&app=' + tenancy.APP_KEY;
		data += '&etp=' + tenancy.ETP_KEY;
	}

	jQuery.ajax({
		url: SNS_REST_SERVER.TOKEN + "?" + data,
		dataType: 'json',
		type: "get",
		success: function(data, status, obj){
			YYIMChat.log("get token success", 3, username);
			
			AppHander.getInstance().saveLoginInfo({
				token: data.token,
				expiration: data.expiration
			});
			YYIMChat.login(username, data.token, data.expiration);
		},
		error: function(data){
		}
	});
};


AppHander.prototype.saveLoginInfo = function(arg){
	if(arg && arg.token){
		this.token = arg.token;
		CookieUtil.setCookie('token2',arg.token,7*24*60);
	}
	
	if(arg && arg.expiration){
		this.expiration = arg.expiration;
		CookieUtil.setCookie('expiration2',arg.expiration,7*24*60);
	}
	
};


var CookieUtil = { //rongqb 20150225
		getCookie:function(name){  //获取cookie
		    var str_cookies = document.cookie;  
		    var arr_cookies = str_cookies.split(';');  
		    var num_cookies = arr_cookies.length;  
		    for(var i = 0; i < num_cookies; i++){  
		         var arr = arr_cookies[i].split("=");  
		         if(arr[0].replace(/(^\s+)|(\s+$)/g,"") == name) return unescape(arr[1]);  
		    }  
		    return null;  
		},
		setCookie:function(name, value, minutes, path, domain, secure){   //设置cookie
		    var cookie = name + '=' + escape(value);  
		    if (minutes){  
		        var expiration = new Date((new Date()).getTime() + minutes*60000);  
		        cookie += ';expires=' + expiration.toGMTString();  
		    }  
		    if (path) cookie += ';path=' + path;  
		    if (domain) cookie += ';domain=' + domain;  
		    if (secure) cookie += ';secure';  
		    document.cookie = cookie;  
		},
		delCookie:function(name, path, domain){  //删除cookie
		    if(get_cookie(name)){  
		        var cookie = name + '=;expires=Fri, 02-Jan-1970 00:00:00 GMT';  
		        if (path) cookie += ';path=' + path;  
		        if (domain) cookie += ';domain=' + domain;  
		        document.cookie = cookie;  
		    }  
		}	
};

