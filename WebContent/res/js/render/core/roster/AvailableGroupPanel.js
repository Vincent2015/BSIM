/**
 * 可用分组的显示面板, 在选择移动或者复制好友时显示
 * @Class SNSAvailableGroupPanel
 */
var SNSAvailableGroupPanel = function() {
	this.selector = "#snsim_roster_operation_available_panel";

	this.triggerSelector = "#snsim_move_roster_btn, #snsim_copy_roster_btn";

	this.containerSelector = this.selector + " ul";

	/**
	 * 可用的分组的显示模板
	 */
	this.groupTemplate = '<li class="snsim_available_groups" style="width:70px;" groupname="##{{name}}" title="##{{name}}">' + '<a class="setting_cho">'
			+ '<span class="setting_txt">##{{name}}</span>' + '</a>' + '</li>';

	/**
	 * 保存要显示的分组
	 */
	this.groups;

	/**
	 * 点击界面，该浮动面板的隐藏情况
	 * @{Number} SNSComponent.HIDE_TYPE.HIDE
	 */
	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE;
};

SNSAvailableGroupPanel.prototype = new SNSFloatPanel();

SNSAvailableGroupPanel.prototype._init = function() {

	SNSFloatPanel.prototype._init.call(this);
};

/**
 * 设置要显示的分组
 * @param groups {SNSGroup[]}
 */
SNSAvailableGroupPanel.prototype.setGroups = function(groups) {
	this.groups = groups;
};

/**
 * 在界面显示之前，确定该浮动面板的位置
 */
SNSAvailableGroupPanel.prototype.beforeShow = function() {
	this.getContainerDom().empty();
	
	var html = "";
	for ( var i in this.groups) {
		if (this.groups[i] instanceof SNSGroup) {
			html += TemplateUtil.genHtml(this.groupTemplate, this.groups[i]);
		}
	}
	this.getContainerDom().append(html);

	var operationPanel = SNSIMWindow.getInstance().getRosterOperationPanel();
	var offset = operationPanel.getDom().offset();
	this.getDom().css("top", offset.top);
	this.getDom().css("left", offset.left - 80);

	this._bindClickEvent(operationPanel);
};

SNSAvailableGroupPanel.prototype._bindClickEvent = function(operationPanel) {
	this.getDom().find(".snsim_available_groups").bind("click", {
		panel : operationPanel
	}, function(event) {
		var operationPanel = event.data.panel;
		
		var curGroup = operationPanel.getCurrentGroup();
		var roster = operationPanel.getCurrentRoster();
		var operation = operationPanel.getCurrentOperation();
		
		var groupList = SNSApplication.getInstance().getUser().getGroupList();
		
		var targetGroup = groupList.getGroup(jQuery(this).attr("groupname"));
		
		groupList.moveRoster(roster, operation, curGroup, targetGroup);
		
		var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
		
		if (operation == SNS_MOVE_ROSTER_TYPE.MOVE) {
			rosterTab.moveRosterBetweenGroups(roster, curGroup, targetGroup);
		} else if (operation == SNS_MOVE_ROSTER_TYPE.COPY) {
			rosterTab.addRosterToGroup(roster, targetGroup);
		}
		
	});
};
