/**
 * 本地存储数据时，将数据封装到该对象中存储 id为本页面id, 防止浏览器对storage事件的不同处理的影响
 */
var SNSStroageItem = function(val){
	this.user = YYIMChat.getUserNode();
	this.id = SNSStorage.id;
	this.timestamp = new Date().getTime(),
	this.val = val;
};

/**
 * 本地存储服务， 封装了存储常用的方法， 和应用相关的存储逻辑
 */
var SNSStorage = {
		TYPE:{
			SESSION:"session",
			LOCAL:"local"
		}
};

SNSStorage.id = Math.uuid();

SNSStorage.setLocal = function(key, val){
	this._set(this.TYPE.LOCAL, key, val);
};

SNSStorage.appendLocal = function(key, val){
	this._append(this.TYPE.LOCAL, key, val);
};

SNSStorage.deleteLocalItem = function(key, val){
	this._deleteItem(this.TYPE.LOCAL, key, val);
};

/**
 * 获取存储对象
 * 
 * @return Object
 */
SNSStorage.getLocal = function(key, val){
	return	this._get(this.TYPE.LOCAL, key, val);
};

/**
 * 获取存储对象中的字符串值
 * 
 * @return string
 */
SNSStorage.getLocalVal = function(key, val){
	var result = this.getLocal(key, val);
	if(result){
		if(result.val){
			return result.val;
		}else{
			if(typeof result == "string"){
				return result;
			}else{
				return val;
			}
		}
	} 
};

SNSStorage.removeLocal = function(key){
	this._remove(this.TYPE.LOCAL, key);
};

SNSStorage.clearLocal = function(){
	this._clear(this.TYPE.LOCAL);
};


SNSStorage.setSession = function(key, val){
	this._set(this.TYPE.SESSION, key, val);
};

SNSStorage.getSession = function(key, val){
	return this._get(this.TYPE.SESSION, key, val);
};

SNSStorage.removeSession = function(key){
	this._remove(this.TYPE.SESSION, key);
};

SNSStorage.clearSession = function(){
	this._clear(this.TYPE.SESSION);
};


SNSStorage._set = function(type, key, val){
	 
	switch(type){
		case this.TYPE.LOCAL:
			store.set(key, JSON.stringify(new SNSStroageItem(val)));
			break;
		case this.TYPE.SESSION:
			sessionStorage.setItem(key, JSON.stringify(new SNSStroageItem(val)));
			break;
		default:
			YYIMChat.log("invalid storage type", 0, type);
		return;
	}
};

/**
 * 以字符串存储的数组数据中添加条目， 目前以|分隔开 TODO 将数组的存储结构改为数组，替代当前的字符串分隔符形式
 */
SNSStorage._append = function(type, key, val){
	 
	YYIMChat.log("append storage", 3, key, val);
	if(typeof val != "string"){
		YYIMChat.log("append storage: invalid val", 3, val);
		return;
	}
	var old = this._get(type, key);
	if(old){
		old = old.val;
		if(old.indexOf(val)==-1){
			this._set(type, key, old+"|"+val);
		}
	}else{
		this._set(type, key, "|"+val);
	}
	
	return this._get(type, key);
}

/**
 * 删除以字符串存储的数组数据中的条目 TODO 将数组的存储结构改为数组，替代当前的字符串分隔符形式
 */
SNSStorage._deleteItem = function( type, key, val){
	 
	if(typeof val != "string"){
		YYIMChat.log("_deleteItem storage: invalid val", 3, val);
		return;
	}
	var old = this._get(type, key).val;
	if(old){
		this._set(type, key, old.replace("|"+val,""));
	}
	return this._get(type, key);
}

SNSStorage._get = function(type,key, val){
	 
	var obj;
	switch(type){
		case this.TYPE.LOCAL:
			obj =  JSON.parse(store.get(key))
			break;
		case this.TYPE.SESSION:
			obj =  JSON.parse(sessionStorage.getItem(key));
			break;
		default:
			YYIMChat.log("invalid storage type", 0, type);
	}
	return obj==null?val:obj;
};

SNSStorage._remove = function(type, key){
	try{
		switch(type){
		case this.TYPE.LOCAL:
			store.remove(key);
			break;
		case this.TYPE.SESSION:
			sessionStorage.removeItem(key);
			break;
		default:
			YYIMChat.log("invalid storage type", 0, type);
		return;
		}
	}catch(e){
		YYIMChat.log("Storage remove error : "+e, 1, type);
	}
};

SNSStorage._clear = function(type){
	 
	YYIMChat.log("clear storage", 1, type);
	switch(type){
		case this.TYPE.LOCAL:
			store.clear();
			break;
		case this.TYPE.SESSION:
			sessionStorage.clear();
			break;
		default:
			YYIMChat.log("invalid storage type", 0, type);
		return;
	}
};