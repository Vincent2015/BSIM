var SNSPresenceRender = function() {
	this.userPresenceSelector = ".snsim_user_presence";
	this.userPresenceTextSelector = ".snsim_user_presence_text";
	this.rosterPresenceSelector = ".snsim_roster_presence";
	this.allStatusClass = (function() {
		var classstr = "";
		for ( var i in SNS_STATUS) {
			if (SNS_STATUS[i] && typeof SNS_STATUS[i] == "string") {
				classstr += " snsim_" + SNS_STATUS[i];
			}
		}
		return classstr;
	})();

	this.presencePanel = new SNSPresencePanel();
};

SNSPresenceRender.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_CONNECT, true,
			this.presencePanel._init, this.presencePanel);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_USER_PRESENCE_CHANGE, true,
			this.updateUserPresence, this);
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ROSTER_PRESENCE_CHANGE, true,
			this.updateRosterPresence, this);
};

SNSPresenceRender.prototype.onConnected = function() {
	var user = SNSApplication.getInstance().getUser();
	if (user.presence.status == SNS_STATUS.UNAVAILABLE) {
		jQuery.when(user.setPresence(SNS_STATUS.AVAILABLE, true)).done(jQuery.proxy(this.updateUserPresence, this)).fail(function() {
			YYIMChat.log("change user presence fail");
		});
		this.updateUserPresence();
	}
};

SNSPresenceRender.prototype.updateUserPresence = function() {
	var userPresence = SNSApplication.getInstance().getUser().presence;

	jQuery(this.userPresenceTextSelector).text(SNS_ONLINE_SHOW[userPresence.status.toUpperCase()]);

	var userPresenceDom = jQuery(this.userPresenceSelector);

	userPresenceDom.removeClass(this.allStatusClass);
	userPresenceDom.addClass("snsim_" + userPresence.status);
};

SNSPresenceRender.prototype.updateRosterPresence = function(event, oArg) {

	var roster = oArg.target;
	var presence = roster.presence;

	var presenceDoms = jQuery("li[id$='_" + roster.getID() + "'] " + this.rosterPresenceSelector);
	presenceDoms.removeClass(this.allStatusClass);
	presenceDoms.addClass("snsim_" + presence.status);
	
	var narrowContainer = jQuery("#narrow_roster_container");
	if(roster.groups.length>0){
		  for(var i = 0;i<roster.groups.length;i++){
			 var html = jQuery("#grouproster_"+roster.groups[i].name+"_"+roster.id);
			 var container = jQuery("#list_content_"+roster.groups[i].name);
			 container.prepend(html);
		  }	
		}
	var narrowHtml = jQuery("#narrow_roster_"+roster.id);
	narrowContainer.prepend(narrowHtml);
	
	// 更新分组人数
	SNSIMWindow.getInstance().getWideWindow().getTab("roster").updateGroupsInfo();
};