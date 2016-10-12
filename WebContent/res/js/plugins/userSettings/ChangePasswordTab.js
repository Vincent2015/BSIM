var SNSChangePasswordTab = function(){
	this.name="changePasswordTab";
	
	this.headSelector = "#snsim_change_pasword_head";
	this.contentSelector = "#snsim_change_pasword_content";
	
	// input
	this.oldPswInputSelector = "#oldpassword";
	this.newPswInputSelector = "#newpassword";
	this.newPsw2InputSelector = "#newpassword2";
	
	this.errorMessageSpanSelector = ".sns_psw_change_error_msg";
	
	this.submitChangePsdSelector = ".sns_psw_change_btn";
	this.cancelChangePsdSelector = ".sns_psw_change_btn_cancel";
};

SNSChangePasswordTab.prototype = new SNSTab();

SNSChangePasswordTab.prototype._init = function(){
	this._bindDomEvent();
	SNSTab.prototype._init.call(this);
};

SNSChangePasswordTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.submitChangePsdSelector).bind("click", jQuery.proxy(function(){
		var newPsw = jQuery(this.newPswInputSelector).val();
		var newPsw2 = jQuery(this.newPsw2InputSelector).val();
		var old = jQuery(this.oldPswInputSelector).val();
		if(old && old.notEmpty() && newPsw && newPsw.notEmpty() && newPsw == newPsw2 && old !=newPsw){
			this.changePassword({oldPsw:old,newPsw:newPsw});
		}
	},this));
	
	this.getContentDom().find(this.cancelChangePsdSelector).bind("click", function(){
		var settingsWindow = SNSSettingsPlugin.getInstance().settingsWindow;
		settingsWindow.getDom().find(settingsWindow.closeBtnSelector).trigger("click");
	});
};

SNSChangePasswordTab.prototype.clearPswChangeInput = function() {
	jQuery(this.oldPswInputSelector).val("");
	jQuery(this.newPswInputSelector).val("");
	jQuery(this.newPsw2InputSelector).val("");
};

SNSChangePasswordTab.prototype.showPswChangeError = function(message) {
	this.getContentDom().find(this.errorMessageSpanSelector).html(message);
};

SNSChangePasswordTab.prototype.changePassword = function(oArg){
	var packet = new JSJaCIQ();
	packet.setType(SNS_TYPE.SET);
	var query  = packet.buildNode("query",{xmlns:NS_REGISTER});
	var username = packet.buildNode("username",{},{value:SNSApplication.getInstance().getUser().name});
	var password = packet.buildNode("password",{},{value:oArg.newPsw});
	query.appendChild(username);
	query.appendChild(password);
	packet.appendNode(query);
	YYIMChat.send(packet, jQuery.proxy(this.onChangePasswordForm, this), oArg);
};

SNSChangePasswordTab.prototype.onChangePasswordForm = function(packet){
	if(packet.isError()){
		this.showPswChangeError("error");
	}else{
		this.clearPswChangeInput();
	}
};