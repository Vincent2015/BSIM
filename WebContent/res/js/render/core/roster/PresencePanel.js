var SNSPresencePanel = function() {
	this.selector = "#snsim_layer_presence_panel";
	this.triggerSelector = ".snsim_user_presence_btn";
	
	this.presenceItemSelector = "#snsim_layer_presence_panel li a.setting_cho";
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE;
};

SNSPresencePanel.prototype = new SNSFloatPanel();

SNSPresencePanel.prototype._init = function() {
	SNSFloatPanel.prototype._init.call(this);
	if(!this._isEventBound){
		this._bindPreseceBtnEvent();
		this._bindPresenceItemEvent();
		this._isEventBound = true;
	}
};

SNSPresencePanel.prototype._bindPreseceBtnEvent = function() {
	jQuery(this.triggerSelector).bind("click", jQuery.proxy(function(event) {
		var offset = jQuery(event.currentTarget).offset();
		if(SNSIMWindow.getInstance().getWideWindow().visible()){
			this.getDom().css("top",offset.top-111);
			this.getDom().css("left",offset.left-76);
		}else{
			this.getDom().css("top",offset.top+1);
			this.getDom().css("left",offset.left-66);
		}
		this.toggle();
	}, this));
};

SNSPresencePanel.prototype._bindPresenceItemEvent = function() {
	jQuery(this.presenceItemSelector).bind("click", function() {
		var dom = jQuery(this);
		var presence = dom.attr("presence");
		var user = SNSApplication.getInstance().getUser();
		user.setPresence(presence, true);
	});
};
