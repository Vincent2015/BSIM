var SNSSearchWindow = function() {
	this.selector = "#snsim_multi_search_window";

	this.closeBtnSelector = ".multi_search_window_close";
	
	// 鼠标可拖动部分
	this.dragComponentSelector = '.multi_search_window_menu';

	this.tabs = new SNSTabContainer();

	this.headContainerSelector = this.selector + " .snsim_tab_head_container";
	this.contentContainerSelector = this.selector + ".snsim_tab_content_container";
	
	this.rosterSearchTab;
	this.chatroomSearchTab;
	this.publicAccountSearchTab;
	
	// 打开时其他窗口禁止操作
	this.maskOthers = true;
};

SNSSearchWindow.prototype = new SNSFloatPanel();

SNSSearchWindow.prototype._init = function() {
	SNSFloatPanel.prototype._init.call(this);
	
	this.tabs.selector = this.selector;
	this.tabs.headContainerSelector = this.headContainerSelector;
	this.tabs.contentContainerSelector = this.contentContainerSelector;

	this.tabs._init();
	
	this.rosterSearchTab = new SNSRosterSearchTab();
	this.tabs.addTab(this.rosterSearchTab);

	this.chatroomSearchTab = new SNSChatroomSearchTab();
	this.tabs.addTab(this.chatroomSearchTab);
	
	this.publicAccountSearchTab = new SNSPublicAccountSearchTab();
	this.tabs.addTab(this.publicAccountSearchTab);
	
	this.enableMove();
	this._bindDomEvent();
};

/**
 * 添加好友
 * @param id
 */
SNSSearchWindow.prototype.addFriend = function(id){
	YYIMChat.addRosterItem(id);
	SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.ALERT, SNS_I18N.confirm_add_friend, function(){
		SNSIMWindow.getInstance().getDialog().hide();
	});
	SNSIMWindow.getInstance().getDialog().show();
};

/**
 * 关注公共号
 * @param id
 */
SNSSearchWindow.prototype.addPublicAccount = function(id, name){
	YYIMChat.addPubaccount({
		id : id,
		success : function() {
			SNSApplication.getInstance().getUser().addRoster(new SNSPublicAccountRoster(id, name));
		}
	});
	SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.ALERT, SNS_I18N.confirm_subscribe_pubaccount, function(){
		SNSIMWindow.getInstance().getDialog().hide();
	});
	SNSIMWindow.getInstance().getDialog().show();
};

/**
 * @Override
 */
SNSSearchWindow.prototype.show = function() {
	/**
		left: 50%;
		top: 50%;
		margin-left: -300px;
		margin-top: -200px;
	 */
	var dom = this.getDom(),
		top = document.body.clientHeight / 2 - jQuery('#snsim_multi_search_window').height() / 2,
		left = document.body.clientWidth / 2 - jQuery('#snsim_multi_search_window').width() / 2;
	
	dom.css('left', left);
	dom.css('top', top);
	
	SNSFloatPanel.prototype.show.call(this);
};


/**
 * @Override
 */
SNSSearchWindow.prototype.hide = function(){
	jQuery(this.selector).hide(function() {
		$(this).find('#snsim_roster_search_tab_container').empty();
	});
}

/**
 * @Override
 * 
 * 当前鼠标点击位置是否触发拖动
 * @param event
 * @returns {Boolean}
 */
SNSSearchWindow.prototype.validateMovability = function(event){
	var idSelector;
	if(!!event && event.target) {
		idSelector = "#" + jQuery(event.target).attr("id");
	} else {
		idSelector = "#" + jQuery(window.event.srcElement).attr("id");
	}
	
	if(idSelector == this.closeBtnSelector){
		return false;
	}
	return true;
};

/**
 * @Override
 * 
 * 拖动的部分
 */
SNSSearchWindow.prototype.getDragComponentSelector = function(){
	return this.selector + ' ' + this.dragComponentSelector;
};

/**
 * @Override
 * 
 * 移动的部分
 */
SNSSearchWindow.prototype.getMoveComponentSelector = function(){
	return this.selector;
};