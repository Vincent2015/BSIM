function SNSBaseList(){
	this._list;
	this._size = 0;
}

SNSBaseList.prototype.size = function() {
	return this._size;
};

SNSBaseList.prototype._get = function(key) {
	return this.get(key);
}

SNSBaseList.prototype._add = function(key, item) {
	return this.add(key,item);
}

SNSBaseList.prototype._update = function(key, item) {
	this.update(key,item);
}

SNSBaseList.prototype._remove = function(key) {
	return this.remove(key);
}

SNSBaseList.prototype._contains = function(key) {
	return this.contains(key);
}


SNSBaseList.prototype.add = function(key, item) {
	if (this._contains(key)) {
		this._list[key] = item;
		return false;
	}
	this._size++;
	if (!this._list || this._list==null) {
		this._list = new Object();
	}
	this._list[key] = item;
	return true;
};

SNSBaseList.prototype.update = function(key, item) {
	if (!this._contains(key)) {
		this.add(key, item);
		return true;
	}
	this._list[key] = item;
};

SNSBaseList.prototype.contains = function(key) {
	return this._list != undefined && this._list[key] != undefined;
};

SNSBaseList.prototype.get = function(key) {
	if (!this._list || this._list==null) {
		return;
	}
	return this._list[key];
};

SNSBaseList.prototype.remove = function(key) {
	if (this._contains(key)) {
		delete this._list[key];
		this._size--;
		return true;
	}
};

SNSBaseList.prototype.removeAll = function(key) {
	this._list = new Object();
	this._size = 0;
};

SNSBaseList.prototype.toArray = function() {
	var results = [];
	for ( var item in this._list) {
		if (this._list[item] && typeof this._list[item] != "function") {
			results.push(this._list[item]);
		}
	}
	return results;
};
