var YYIMCommonUtil = {
	isFunction : function(func){
		return typeof func == 'function';
	},
	isStringAndNotEmpty : function(str){
		if(typeof str == 'string')
			return str.notEmpty();
		return false;
	},
	chatNumInString : function(str1, str2) {
		if(typeof str1 == 'string' && typeof str2 == 'string'){
			var r = new RegExp('\\' + str2, "gi");
			var m = str1.match(r);
			if(m)
				return m.length;
		}
		return 0;
	},
	isNumber : function(num) {
		return Object.prototype.toString.call(num) === '[object Number]';
	}
};

/**
 * @deprecated since version 2.0, use YYIMCommonUtil instead.
 */
var SNSCommonUtil = {
	/**
	 * @deprecated since version 2.0, use YYIMCommonUtil.isFunction instead.
	 */
	isFunction : YYIMCommonUtil.isFunction,
	/**
	 * @deprecated since version 2.0, use YYIMCommonUtil.isStringAndNotEmpty instead.
	 */
	isStringAndNotEmpty : YYIMCommonUtil.isStringAndNotEmpty,
	/**
	 * @deprecated since version 2.0, use YYIMCommonUtil.chatNumInString instead.
	 */
	chatNumInString : YYIMCommonUtil.chatNumInString,
	/**
	 * @deprecated since version 2.0, use YYIMCommonUtil.isNumber instead.
	 */
	isNumber : YYIMCommonUtil.isNumber
};

var YYIMArrayUtil = {
	contains : function(arr, val) {
		if(Object.prototype.toString.call(arr) === '[object Array]'){
			for(var i=0;i<arr.length;i++){
		        if(arr[i] === val){  
		        	return true;  
		        }  
		    }
			return false;
		}

		// 不是数组
		return false;
	},
	isArray : function(arr){
		return Object.prototype.toString.call(arr) === '[object Array]';
	},
	unique : function(array){
		array.sort();
		var re = [array[0]];
		for(var i =1; i<array.length;i++){
			if(array[i] !==re[re.length-1]){
				re.push(array[i]);
			}
		}
		return re;
	},
	insert : function(arr, index, item){
		arr.splice(index, 0, item);
	}
};

/**
 * @deprecated since version 2.0, use YYIMArrayUtil instead.
 */
var SNSArrayUtil = {
	/**
	 * @deprecated since version 2.0, use YYIMArrayUtil.contains instead.
	 */
	contains : YYIMArrayUtil.contains,
	/**
	 * @deprecated since version 2.0, use YYIMArrayUtil.isArray instead.
	 */
	isArray : YYIMArrayUtil.isArray,
	/**
	 * @deprecated since version 2.0, use YYIMArrayUtil.unique instead.
	 */
	unique : YYIMArrayUtil.unique,
	/**
	 * @deprecated since version 2.0, use YYIMArrayUtil.insert instead.
	 */
	insert : YYIMArrayUtil.insert
};

var YYIMCookieUtil = { //rongqb 20151013
		getcookie:function(name){  //获取cookie
		    var str_cookies = document.cookie;  
		    var arr_cookies = str_cookies.split(';');  
		    var num_cookies = arr_cookies.length;  
		    for(var i = 0; i < num_cookies; i++){  
		         var arr = arr_cookies[i].split("=");  
		         if(arr[0].replace(/(^\s+)|(\s+$)/g,"") == name) return unescape(arr[1]);  
		    }  
		    return null;  
		},
		setcookie:function(name, value, minutes, path, domain, secure){   //设置cookie
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
		delcookie:function(name, path, domain){  //删除cookie
		    if(get_cookie(name)){  
		        var cookie = name + '=;expires=Fri, 02-Jan-1970 00:00:00 GMT';  
		        if (path) cookie += ';path=' + path;  
		        if (domain) cookie += ';domain=' + domain;  
		        document.cookie = cookie;  
		    }  
		},
		createComparisonFunction:function(propertyName){ //用于给对象排序
			return function(object1,object2){
				var value1 = object1[propertyName];
				var value2 = object2[propertyName];
				return value1 - value2;
			};
		}		
};

