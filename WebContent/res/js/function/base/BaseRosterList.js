var SNSBaseRosterList = function() {

}

SNSBaseRosterList.prototype = new SNSBaseList();

SNSBaseRosterList.prototype.add = function(roster) {
	if (roster && (roster instanceof SNSRoster || roster instanceof SNSChatRoom)) {
		var id = roster.id;
		if(roster instanceof SNSDeviceRoster)
			id = roster.id;
		return SNSBaseList.prototype.add.call(this, id, roster);
	}
};

SNSBaseRosterList.prototype.update = function(roster) {
	if (roster && (roster instanceof SNSRoster || roster instanceof SNSChatRoom)) {
		var id = roster.getID();
		SNSBaseList.prototype.update.call(this, id, roster);
	}
};

SNSBaseRosterList.prototype.contains = function(rosterOrId) {
	if(!rosterOrId)
		return;
	if(rosterOrId.id)
		return SNSBaseList.prototype.contains.call(this, rosterOrId.id);
	return SNSBaseList.prototype.contains.call(this, rosterOrId);;
};

SNSBaseRosterList.prototype.get = function(id) {
	return SNSBaseList.prototype.get.call(this, id);
};

SNSBaseRosterList.prototype.remove = function(rosterId) {
	return SNSBaseList.prototype.remove.call(this, rosterId);;
};

SNSBaseRosterList.prototype.toArray = function() {
	var results = [];
	for ( var i in this._list) {
		var item = this._list[i];
		if (item && (item instanceof SNSRoster || item instanceof SNSChatRoom)) {
			results.push(item);
		}
	}
	return results;
};
