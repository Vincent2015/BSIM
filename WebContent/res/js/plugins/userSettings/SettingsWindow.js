var SNSSettingsWindow = function() {
	this.selector = "#snsim_settings_window";

	this.closeBtnSelector = ".snsim_settings_window_close";

	this.tabs = new SNSTabContainer();

	this.headContainerSelector = this.selector + " .snsim_tab_head_container";
	this.contentContainerSelector = this.selector + ".snsim_tab_content_container";
	
	this.triggerBtnSelector = "#snsim_settings_trigger_btn";
	
	this.userInfoTab;
	this.systemConfigTab;
	this.changePasswordTab;
	
};

SNSSettingsWindow.prototype = new SNSWindow();

SNSSettingsWindow.prototype._init = function() {
	
	this.tabs.selector = this.selector;
	this.tabs.headContainerSelector = this.headContainerSelector;
	this.tabs.contentContainerSelector = this.contentContainerSelector;

	this.tabs._init();
	
	this.userInfoTab = new SNSUserInfoTab();
	this.tabs.addTab(this.userInfoTab);
	
	this.systemConfigTab = new SNSSystemConfigTab();
	this.tabs.addTab(this.systemConfigTab);
	
	this.changePasswordTab = new SNSChangePasswordTab();
	this.tabs.addTab(this.changePasswordTab);

	this._bindDomEvent();
};

SNSSettingsWindow.prototype._bindDomEvent = function(){
	jQuery(this.triggerBtnSelector).bind("click",jQuery.proxy(function(){
		this.userInfoTab.renderUserInfo();
	},this));
	SNSWindow.prototype._bindDomEvent.call(this);
};