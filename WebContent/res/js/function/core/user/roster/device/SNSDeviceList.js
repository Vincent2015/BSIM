var SNSDeviceList = function() {
};

SNSDeviceList.prototype = new SNSBaseRosterList();

SNSDeviceList.prototype.get = function(id){
	if(!id)
		throw "id is null!";
	if(!this._list)
		return;
	
	var key = id;
	if(typeof id != "string" && id.getID())
		key = id.getID();
	return this._list[key]? this._list[key] : null;
};