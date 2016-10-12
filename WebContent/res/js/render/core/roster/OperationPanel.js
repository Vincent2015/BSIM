/**
 * 操作好友的浮动面板
 * @Class SNSRosterOperationPanel
 */
var SNSRosterOperationPanel = function() {

	this.selector = "#snsim_roster_operation_panel";

	/**
	 * 移动好友
	 */
	this.moveBtn = "#snsim_move_roster_btn";

	/**
	 * 复制好友
	 */
	this.copyBtn = "#snsim_copy_roster_btn";

	/**
	 * 删除好友
	 */
	this.deleteBtn = "#snsim_delete_roster_btn";

	/**
	 * 修改备注
	 */
	this.modifyNameBtn = "#snsim_modify_roster_name_btn";

	/**
	 * 新建分组
	 */
	this.createGroupBtn = "#snsim_create_group_btn";

	/**
	 * 可用组的展示面板，在移动和复制好友时
	 * @Field
	 */
	this.availableGroupsPanel = new SNSAvailableGroupPanel();

	/**
	 * 点击其他区域时，隐藏当前Panel
	 * @Type {Number} SNSComponent.HIDE_TYPE
	 */
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE;

	/**
	 * 触发显示当前面板的Dom节点，用来计算当前面板位置
	 * @Type jQueryDom
	 */
	this._triggerDom;

	/**
	 * 当前选中的操作， move或者是copy, 在availableGroupsPanel的事件绑定中判断用
	 */
	this._currentOperation;

};

SNSRosterOperationPanel.prototype = new SNSFloatPanel();

/**
 * 初始化面板，绑定点击事件，初始化可用组面板，并调用父类的初始化代码
 * @private
 */
SNSRosterOperationPanel.prototype._init = function() {
	this._bindDomEvent();
	this.availableGroupsPanel._init();
	SNSFloatPanel.prototype._init.call(this);
};

/**
 * 暂存触发显示的Dom节点，从中获取到用户和组信息
 * @param dom {DocumentNode} 触发操作的Dom节点
 */
SNSRosterOperationPanel.prototype.attachDom = function(dom) {
	this._triggerDom = jQuery(dom);
	var offset = this.getTriggerDom().offset();
	this.getDom().css("top", offset.top + 5);
	this.getDom().css("left", offset.left - 65);
};

/**
 * 获取点击操作的界面中的用户条目DOM
 * @returns {JQueryDom}
 */
SNSRosterOperationPanel.prototype.getCurRosterDom = function() {
	var rosterDom = this.getTriggerDom().parents("li.sns_roster_list_wide_item");

	return rosterDom;
};

/**
 * 获取当前操作的用户
 * @returns {SNSRoster}
 */
SNSRosterOperationPanel.prototype.getCurrentRoster = function() {
	var id = this.getCurRosterDom().attr("rosterId");
	var roster = SNSApplication.getInstance().getUser().getRoster(id);
	return roster;
};

/**
 * 获取当前操作的组的名字
 * @returns {String}
 */
SNSRosterOperationPanel.prototype.getCurrentGroup = function() {
	return SNSApplication.getInstance().getUser().getGroupList().getGroup(this.getCurRosterDom().attr("groupname"));
};

/**
 * 获取当前的操作
 * @returns {String} move | copy， 仅在这两项中记录
 */
SNSRosterOperationPanel.prototype.getCurrentOperation = function() {
	return this._currentOperation;
};

/**
 * 在显示之前调用， 如果是默认分组，则隐藏复制好友条目
 * 如果是公共帐号分组，则隐藏移动好友和复制条目
 */
SNSRosterOperationPanel.prototype.beforeShow = function() {
	var copyBtn = jQuery(this.copyBtn);
	var groupList = SNSApplication.getInstance().getUser().getGroupList();
	
	if (this.getCurrentGroup() == groupList.groupNone || this.getCurrentGroup() instanceof SNSPublicServiceGroup) {
		copyBtn.hide();
	} else {
		copyBtn.show();
	}
	
	var moveBtn = jQuery(this.moveBtn);
	
	if (this.getCurrentGroup() instanceof SNSPublicServiceGroup) {
		moveBtn.hide();
	} else {
		moveBtn.show();
	}
};

/**
 * 绑定操作条目绑定事件
 */
SNSRosterOperationPanel.prototype._bindDomEvent = function() {
	// 绑定移动好友事件
	jQuery(this.moveBtn).bind("click", jQuery.proxy(function(event) {
		var groups = SNSApplication.getInstance().getUser().groupList.availableGroups(this.getCurrentRoster());
		
		if (groups.length == 0) {
			return;
		}
		this.availableGroupsPanel.setGroups(groups);
		this._currentOperation = SNS_MOVE_ROSTER_TYPE.MOVE;
		this.availableGroupsPanel.show();
		event.stopPropagation();
		event.preventDefault();
	}, this));

	// 绑定复制好友事件
	jQuery(this.copyBtn).bind("click", jQuery.proxy(function(event) {
		var groups = SNSApplication.getInstance().getUser().groupList.availableGroups(this.getCurrentRoster());
		if (groups.length == 0) {
			return;
		}
		this.availableGroupsPanel.setGroups(groups);
		this._currentOperation =  SNS_MOVE_ROSTER_TYPE.COPY;
		this.availableGroupsPanel.show();
		event.stopPropagation();
		event.preventDefault();
	}, this));

	// 绑定删除好友事件
	jQuery(this.deleteBtn).bind("click", {_self : this}, function(event){
		SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.CONFIRM, SNS_I18N.subscribe_remove + event.data._self.getCurrentRoster().name,
			function(){
				var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
//				rosterTab.removeRoster(this.getCurrentRoster());
				SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_REMOVE_ROSTER, [ {roster:this.getCurrentRoster()} ]);
				SNSIMWindow.getInstance().getDialog().hide();
			}, event.data._self);
		SNSIMWindow.getInstance().getDialog().show();
	});
	
	// 绑定修改备注事件
	jQuery(this.modifyNameBtn).bind("click", {_self : this}, function(event){
		SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.PROMPT, SNS_I18N.roster_rename.replace("#", event.data._self.getCurrentRoster().name),
			function(){
				var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
				var roster = this.getCurrentRoster();
				var _name = SNSIMWindow.getInstance().getDialog().getInput();
				roster.name = _name.trim();
				rosterTab.renameRoster(roster);
				SNSIMWindow.getInstance().getDialog().hide();
			}, event.data._self);
		SNSIMWindow.getInstance().getDialog().show();
	});
	
	// 绑定新建分组事件
	jQuery(this.createGroupBtn).bind("click", {_self : this}, function(event){
		SNSIMWindow.getInstance().getDialog().set(DIALOG_TYPE.PROMPT, SNS_I18N.group_name,
			function(){
				var group = new SNSGroup(SNSIMWindow.getInstance().getDialog().getInput());
				SNSApplication.getInstance().getUser().groupList.addGroup(group);
				var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
				rosterTab.addGroup(group);
				SNSIMWindow.getInstance().getDialog().hide();
			}, event.data._self);
		SNSIMWindow.getInstance().getDialog().show();
	});
};