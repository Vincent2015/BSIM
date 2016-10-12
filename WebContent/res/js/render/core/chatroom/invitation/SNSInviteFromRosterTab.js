var SNSInviteFromRosterTab = function(){
	this.name = "inviteFromRoster";

	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_invite_from_roster";
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_invite_from_roster";
	
	this.rosterListSelector = "#snsim_invite_roster_List";
	this.groupInfoSelector = ".group_info";
	this.groupToggleBtnSelector = ".invite_window_group_name";
	this.addWholeGroupSelector = ".add_whole_group";
	
	// group arrow
	this.groupArraySelector = ".group_arrow";
	this.rightArrowClass = "group_arrow_right";
	this.bottomArrowClass = "group_arrow_bottom";
	
	// 需排除的组
	this.excludeGroups = [SNSConfig.GROUP.GROUP_PUB_ACCOUNT, SNSConfig.GROUP.GROUP_DEVICE];
	
	this.rosterTemplate = 
		'<li rosterId="##{{getID()}}" name="##{{name}}" class="invite_from_roster_item" onclick="SNSIMWindow.getInstance().getInvitationWindow().selectToInvite(this)">'
			+ '<span class="user_name">##{{name}}</span>'
		+ '</li>';
	
	this.groupTempalte = 
		'<div id="' + SNSInviteFromRosterTab.groupItemIdPrefix + '##{{name}}" style="margin-bottom: 14px;">'
			+'<div class="group_info">'
				+ '<span class="group_arrow"></span>'
				+ '<a class="invite_window_group_name" name="##{{name}}">##{{name}}</a>' 
				+ '<span class="add_whole_group hide" name="##{{name}}"></span>'
			+ '</div>'
			+ '<ul>' 
			+ '</ul>' 
		+ '</div>';
	
};

SNSInviteFromRosterTab.groupItemIdPrefix = "snsim_invite_group_item_";

SNSInviteFromRosterTab.prototype = new SNSTab();

SNSInviteFromRosterTab.getInstance = function(){
	return SNSInviteFromRosterTab._instance;
};

SNSInviteFromRosterTab.prototype._init = function(){
	SNSInviteFromRosterTab._instance = this;
	
	jQuery(this.contentSelector).perfectScrollbar({suppressScrollX:true});
	YYIMChat.log("SNSInviteFromRosterTab.prototype._init",3);
};

SNSInviteFromRosterTab.prototype.getGroupIdSelector = function(groupName){
	return "#" + SNSInviteFromRosterTab.groupItemIdPrefix + groupName;
};

SNSInviteFromRosterTab.prototype.show = function(){
	jQuery(this.rosterListSelector).empty();
	this.showRosterList();
};
/**
 * 当前组展开或者收缩
 * @param groupName
 */
SNSInviteFromRosterTab.prototype.toggle = function(event, groupName){
	var groupArrow = jQuery(event.target).siblings(this.groupArraySelector);
	var rosterListNode = jQuery(this.getGroupIdSelector(groupName) + " ul");
	if(rosterListNode.is(":visible")){
		rosterListNode.hide();
		groupArrow.removeClass(this.bottomArrowClass);
		groupArrow.addClass(this.rightArrowClass);
	}else{
		rosterListNode.show();
		groupArrow.removeClass(this.rightArrowClass);
		groupArrow.addClass(this.bottomArrowClass);
	}
};

/**
 * 选取整个组
 * @param groupName
 */
SNSInviteFromRosterTab.prototype.selectWholeGroup = function(event, groupName){
	jQuery(this.getGroupIdSelector(groupName)).find("ul li").trigger("click");
};

/**
 * 显示当前好友列表
 */
SNSInviteFromRosterTab.prototype.showRosterList = function(){
	var groupList = SNSApplication.getInstance().getUser().getGroupList().toArray();
	for(var item in groupList){
		var group = groupList[item];
		if(group && group instanceof SNSGroup){
			this.showGroup(group);
		}
	}
};

/**
 * 显示用户组及组内成员
 * @param group
 */
SNSInviteFromRosterTab.prototype.showGroup = function(group){
	if(YYIMChat.getArrayUtil().contains(this.excludeGroups,group.name))
		return;
	jQuery(this.rosterListSelector).append(TemplateUtil.genHtml(this.groupTempalte, group));
	var rosterList = SNSApplication.getInstance().getUser().getRosterListByGroup(group).toArray();
	for(var item in rosterList){
		if(rosterList[item] && rosterList[item] instanceof SNSRoster){
			jQuery(this.getGroupIdSelector(group.name) + " ul").append(TemplateUtil.genHtml(this.rosterTemplate, rosterList[item]));
		}
	}
	
	this.bindGroupEvent(group.name);
};

SNSInviteFromRosterTab.prototype.bindGroupEvent = function(groupName){
	// 组信息
	jQuery(this.getGroupIdSelector(groupName) + " " + this.groupInfoSelector).bind("mouseenter", {groupName: groupName}, jQuery.proxy(function(event){
		jQuery(this.getGroupIdSelector(event.data.groupName) + " " + this.addWholeGroupSelector).show();
	},this));
	jQuery(this.getGroupIdSelector(groupName) + " " + this.groupInfoSelector).bind("mouseleave", {groupName: groupName}, jQuery.proxy(function(event){
		jQuery(this.getGroupIdSelector(event.data.groupName) + " " + this.addWholeGroupSelector).hide();
	},this));
	
	// 组展开，折叠
	jQuery(this.getGroupIdSelector(groupName) + " " + this.groupToggleBtnSelector).bind("click", jQuery.proxy(function(event){
		this.toggle(event, event.target.name);
	},this));
	
	// 选择整组
	jQuery(this.getGroupIdSelector(groupName) + " " + this.addWholeGroupSelector).bind("click", {groupName: groupName}, jQuery.proxy(function(event){
		this.selectWholeGroup(event, event.data.groupName);
	},this));
};
