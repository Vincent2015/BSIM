var SNSDeviceRoster = function(resource, deviceName){
	if(!SNSCommonUtil.isStringAndNotEmpty(resource))
		throw "resource is null or empty!";
	this.id = SNSApplication.getInstance().getUser().getID();
	this.resource = resource;
	this.name = deviceName? deviceName:SNSApplication.getInstance().getUser().name;
	
	this.subscription = SNS_SUBSCRIBE.BOTH;
	
	this.vcard = SNSApplication.getInstance().getUser().vcard;
};

SNSDeviceRoster.prototype = new SNSRoster();

SNSDeviceRoster.prototype.getPhotoUrl = function(){
	return SNSConfig.ROSTER.MY_DEVICE_DEFAULT_AVATAR;
};

/**
 * 改变roster的在线状态信息， 同时发送全局事件通知ON_ROSTER_PRESENCE_CHANGE
 * @param {SNSPresence} presence 出席信息对象
 */
SNSDeviceRoster.prototype.setPresence = function(presence) {
	if (presence && presence instanceof SNSPresence && presence != this.presence) {
		if(!presence.resource || presence.resource != this.resource)
			return;
		var old = this.presence;
		this.presence = presence;

		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_ROSTER_PRESENCE_CHANGE, [ {
			target : this,
			newValue : this.presence,
			oldValue : old
		} ]);

	}
};