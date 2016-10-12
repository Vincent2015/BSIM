/**
 * 宽版窗口中显示联系人列表的tab页
 * @Class SNSRosterTab
 * @Singleton
 */
var SNSRosterTab = function() {
	this.name = "roster";
	this.selector = "#snsim_wide_tab_container";
	this.headSelector = "#snsim_tab_head_roster";
	this.contentSelector = "#snsim_tab_content_roster";
	this.groupContainerSelector = "#grouproster_container";
	
	this.operateBtnSelector = ".snsim_operation_panel_trigger_btn";
	this.unreadMsgNumSelector = ".snsim_unread_msg_num";
	
	this.currentOperationRoster;

	this.rosterTemplate = 
		'<li id="grouproster_##{{groupname}}_##{{id}}" groupname="##{{groupname}}" rosterId="##{{getID()}}" class="clearfix sns_roster_list_wide_item">'
			+ '<div class="snsim_list_head sns_roster_list_wide_head">'
				+ '<span class="head_pic">'
					+ '<img src="##{{getPhotoUrl()}}" rosterId="##{{getID()}}" class="snsim_roster_photo" onerror="YYIMChat.defaultImg(this)">'
				+ '</span>'
				+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{presence.status}}"></span>'
				+ '<span class="WBIM_icon_new" node-type="snsNewMsgIcon"></span>'
			+ '</div>'
			+ '<div class="snsim_list_name">'
				+ '<span class="user_name" title="##{{name}}">##{{name}}</span>'
			+ '</div>'
			// 好友操作
			+ '<div style="float:right; margin: 16px 10px 0 0; cursor: pointer;">'
				+ '<a class="snsim_operation_panel_trigger_btn snsim_list_opt"></a>'
				+ '<span class="snsim_unread_msg_num">0</span>'
			+ '</div>'

			+ '<div>' 
				+ '<p class="sns_roster_list_wide_menu_btn" onclick="SNSRosterRender.showMemu()"></p>' 
			+ '</div>' 
		+ '</li>';

	this.groupTempalte = '<div id="' + SNSRosterTab.groupPrefixId + '##{{name}}" class="list_box list_box_unfold clearfix">'
			+ '<div id="title_container_##{{name}}" class="list_title">' + ' <p class="title_cate">'
			+ '<a class="list_title_a" href="javascript:void(0);" title="##{{name}}">' + ' <span class="sns_snsim_arrow">' + '</span>'
			+ '<span id="title_node_##{{name}}">##{{name}}</span>(<span id="online_count_##{{name}}">0/0</span>)' + '</a>' + '</p>' + '</div>'
			+ '<div class="list_content">' + '<ul id="list_content_##{{name}}" class="list_content_li">' + '</ul>' + '</div>' + '</div>';
};
SNSRosterTab.groupPrefixId = "snsim_tab_roster_group_";
SNSRosterTab.prototype = new SNSTab();

/**
 * 初始化本对象，包括添加默认未分组, tab标签的单击事件
 */
SNSRosterTab.prototype._init = function() {

	this._addGroupNone();
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ADD_ROSTER, false, function(data) {
		this.addRoster(data.newValue);
	}, this);
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_REMOVE_ROSTER, false, function(data) {
		this.removeRoster(data.roster);
	}, this);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ROSTER_PHOTO_CHANGE, false, function(data) {
		this.changeRosterPhoto(data.photo, data.rosterId);
	}, this);
	
	var _self = this;
	jQuery(this.headSelector).bind("click", function() {
//		jQuery(SNSIMWindow.getInstance().getChatWindow().showChatroomMembersSelector).hide();
		SNSIMWindow.getInstance().getWideWindow().changeTabTo(_self);
	});

};

/**
 * 添加默认分组到Dom节点中
 * @returns {jQueryDom} 默认分组的Dom节点
 */
SNSRosterTab.prototype._addGroupNone = function() {
	var groupNone = SNSApplication.getInstance().getUser().groupList.groupNone;
	return this.addGroup(groupNone);
};

/**
 * 将满足条件的联系人渲染到界面列表中， 若好友存在多个分组，则依次渲染每个分组 条件主要指订阅关系，只有被订阅的联系人会被显示， 即从用户角度看，订阅关系为BOTH或者TO
 * @param roster {SNSRoster}
 */
SNSRosterTab.prototype.addRoster = function(roster) {
	if (roster && roster instanceof SNSRoster) {
		if ((roster.subscription == SNS_SUBSCRIBE.BOTH || roster.subscription == SNS_SUBSCRIBE.TO)) {

			if (roster.groups.length > 0) {
				for (var i = 0; i < roster.groups.length; i++) {
					this.addRosterToGroup(roster, roster.groups[i]);
				}
			} else {
				var groupNone = SNSApplication.getInstance().getUser().groupList.groupNone;

				this.addRosterToGroup(roster, groupNone);
			}
			//roster.whenVCardDone(this, this.renderRosterPhoto, [ roster ]);
			this.updateGroupsInfo();
		}
	}
};

/**
 * 在界面上从指定组中移除好友
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 */
SNSRosterTab.prototype.removeRosterFromGroup = function(roster, group) {
	var groupDom = this.addGroup(group);
	var rosterDom = groupDom.find("li[rosterId='" + roster.getID() + "']");
	rosterDom.remove();
	this.updateGroupsInfo();
};

/**
 * 在界面上从所有组中移除好友
 * @param roster {SNSRoster}
 */
SNSRosterTab.prototype.removeRoster = function(roster) {
	if(roster.subscription == SNS_SUBSCRIBE.NONE){
		var rosterDom = this.getDom().find("li[rosterId='" + roster.getID() + "']");
		if(rosterDom.length > 0)
			rosterDom.remove();
		
		var tab = SNSIMWindow.getInstance().getChatWindow().getTab(roster);
		if(tab)
			tab.getCloseBtnDom().trigger("click");
		return;
	}
	
	YYIMChat.deleteRosterItem({
		id: roster.getID(),
		success: jQuery.proxy(function(rosterId){
			var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
			SNSApplication.getInstance().getUser().removeRosterFromLocal(roster);
			var rosterDom = this.getDom().find("li[rosterId='" + roster.getID() + "']");
			if(rosterDom.length > 0)
				rosterDom.remove();
			
			var tab = SNSIMWindow.getInstance().getChatWindow().getTab(roster);
			if(tab)
				tab.getCloseBtnDom().trigger("click");
		},this)
	});
	this.updateGroupsInfo();
};

/**
 * 修改备注
 * @param roster
 */
SNSRosterTab.prototype.renameRoster = function(roster) {
	var self = this;
	jQuery.when(roster.update()).done(function() {
		var $nameText = self.getDom().find("li[rosterId='" + roster.getID() + "'] .user_name");
		if (roster.name) {
			$nameText.text(roster.name);
		}else{
			$nameText.text(roster.getID());
		}
	});
};

/**
 * 向界面上添加指定好友到分组
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 */
SNSRosterTab.prototype.addRosterToGroup = function(roster, group) {
	if (this.isRosterInGroup(roster, group)) {
		return;
	}

	var groupDom = this.addGroup(group);

	var html = TemplateUtil.genHtml(this.rosterTemplate, [ roster, {
		groupname : group.name
	} ]);

	var container = jQuery("#list_content_" + group.name);
	container.append(html);
	
	this._bindRosterEvent(roster, group);
	this.updateGroupsInfo();
};

/**
 * 将好友在组之间进行移动
 * @param roster {SNSRoster}
 * @param srcGroup {SNSGroup}
 * @param targetGroup {SNSGroup}
 */
SNSRosterTab.prototype.moveRosterBetweenGroups = function(roster, srcGroup, targetGroup) {
	var srcDom = this.addGroup(srcGroup);
	var rosterDom = srcDom.find("li[rosterId='" + roster.getID() + "']");
	
	var targetDom  = this.addGroup(targetGroup);
	
	rosterDom.appendTo( jQuery("#list_content_" + targetGroup.name));
	
	rosterDom.attr("groupname", targetGroup.name);
	rosterDom.attr("id", rosterDom.attr("id").replace("_"+srcGroup.name+"_", "_"+targetGroup.name+"_"));
	this.updateGroupsInfo();
};

/**
 * 渲染联系人的头像
 * @param roster {SNSRoster}
 */
SNSRosterTab.prototype.renderRosterPhoto = function(roster) {
	if (roster.vcard.hasPhoto()) {
		jQuery("li[id$='" + roster.getID() + "'] img.snsim_roster_photo").attr("src", roster.getPhotoUrl());
	}
};

/**
 * 绑定联系人列表的事件， 如单击， mouseover等
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 */
SNSRosterTab.prototype._bindRosterEvent = function(roster, group) {
	var rosterDoms = this.getDom().find("li[id$='"+group.name+"_" + roster.getID() + "']");

	// 单击联系人条目， 打开聊天窗口
	rosterDoms.bind("click", {
		roster : roster
	}, function(event) {
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.roster);
	});

	// 鼠标悬浮如有未读消息则隐藏操作按钮
	rosterDoms.bind("mouseenter", jQuery.proxy(function(e){
		if(jQuery(e.currentTarget).find(this.unreadMsgNumSelector).is(":visible")){
			jQuery(e.currentTarget).find(this.operateBtnSelector).hide();
		}else{
			var rosterId = jQuery(e.currentTarget).attr("rosterId");
			var curRoster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
			if(curRoster && curRoster instanceof SNSDeviceRoster){
				jQuery(e.currentTarget).find(this.operateBtnSelector).hide();
				return;
			}
			jQuery(e.currentTarget).find(this.operateBtnSelector).show();
		}
	},this));
	// 鼠标离开列表则隐藏操作按钮
	rosterDoms.bind("mouseleave", jQuery.proxy(function(e){
		jQuery(e.currentTarget).find(this.operateBtnSelector).hide();
	},this));
	
	// 打开操作面板
	rosterDoms.find(this.operateBtnSelector).bind("click", function(event) {
		var panel = SNSIMWindow.getInstance().getRosterOperationPanel();
		panel.attachDom(event.target);
		panel.show();
		event.stopPropagation();
	});

	// 鼠标移到头像上， 展示VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseover", function(event) {
		var rosterId = jQuery(this).attr("rosterId");
		var roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
		if(roster && roster instanceof SNSRoster){
			var vcardPanel = SNSVCardPanel.getInstance(rosterId);
			vcardPanel.mouseover = true;
			vcardPanel.show(event.target);
		}
	});

	// 鼠标移出到头像外, 隐藏VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseout", function(event) {
		var rosterId = jQuery(this).attr("rosterId");
		var roster = SNSApplication.getInstance().getUser().getRoster(rosterId);
		if(roster && roster instanceof SNSRoster){
			var vcardPanel = SNSVCardPanel.getInstance(rosterId);
			vcardPanel.mouseover = false;
			setTimeout(function() {
				if (!vcardPanel.mouseover) {
					vcardPanel.hide();
				}
			}, 200);
		}
	});
};

/**
 * 添加指定的分组到界面.
 * @param group {SNSGroup}
 * @returns {jQueryDom}
 */
SNSRosterTab.prototype.addGroup = function(group) {
	//把公共账号去掉的临时不靠谱方法
	if(group.name == '公共账号'){
		return;
	}
	if (group && group instanceof SNSGroup) {
		var groupDom = this.getGroupDom(group);
		if (!groupDom) {
			var html = TemplateUtil.genHtml(this.groupTempalte, [ group ]);
			var container = this.getDom().find(this.groupContainerSelector);
			container.append(html);
			return this._bindGroupFoldEvent(group);
		}
		return groupDom;
	}
	throw "invalid group, shoud be instanceof SNSGroup";
};

/**
 * 绑定分组的收起/展开事件
 * @param group {SNSGroup}
 * @returns {jQueryDom}
 */
SNSRosterTab.prototype._bindGroupFoldEvent = function(group) {
	var groupDom = this.getGroupDom(group).find("a.list_title_a");
	groupDom?groupDom.bind("click", function(event) {
		var _self = jQuery(this).parents("#snsim_tab_roster_group_" + group.name);
		if (_self.hasClass("list_box_fold")) {
			_self.removeClass("list_box_fold");
			_self.addClass("list_box_unfold");
		} else {
			_self.removeClass("list_box_unfold");
			_self.addClass("list_box_fold");
		}
		event.stopPropagation();
	}):null;
	return groupDom;
};

SNSRosterTab.prototype.getGroupDom = function(group) {

	var groupDom = this.getDom().find("#snsim_tab_roster_group_" + group.name);
	if (groupDom.length != 0) {
		return jQuery(groupDom[0]);
	}
};

/**
 * 指定好友是否已经在分组中显示
 * @param roster {SNSRoster}
 * @param group {SNSGroup}
 * @returns {Boolean} true表示已经渲染
 */
SNSRosterTab.prototype.isRosterInGroup = function(roster, group) {
	var groupDom = this.addGroup(group);

	var rosterDom = groupDom.find("li[rosterid='" + roster.id + "']");

	if (rosterDom.length > 0) {
		return true;// 该组已经拥有该好友
	}
};

/**
 * 显示未读消息数目
 * @param roster
 * @param num
 */
SNSRosterTab.prototype.renderUnreadMsgNum = function(roster, num){
	var rosterDoms = this.getDom().find("li[rosterId='" + roster.getID() + "']");
	if(roster instanceof SNSDeviceRoster){
		// rosterDoms = this.getDom().find("li[jid='" + roster.jid.toString() + "']");
	}
	rosterDoms.find(this.unreadMsgNumSelector).text(num);
	rosterDoms.find(this.unreadMsgNumSelector).show();
};

/**
 * 隐藏未读消息数目
 * @param roster
 */
SNSRosterTab.prototype.clearUnreadMsgNum = function(roster){
	this.getDom().find("li[rosterId='" + roster.getID() + "']").find(this.unreadMsgNumSelector).hide();
	// this.getDom().find("li[jid='" + roster.jid.toString() + "']").find(this.unreadMsgNumSelector).hide();
};

/**
 * 更新组内在线人数/总人数
 */
SNSRosterTab.prototype.updateGroupsInfo = function(){
	// 更新分组人数
	var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	var groups = SNSApplication.getInstance().getUser().groupList._list;
	for(var item in groups){
		rosterTab.getDom().find("#online_count_" + item).text(groups[item].getOnlineNumber() + "/" + groups[item].size());
	}
};

SNSRosterTab.prototype.changeRosterPhoto = function(photo, rosterId) {
	var rosterDom = this.getDom().find("li[rosterId='" + rosterId + "']");
	rosterDom.find('img[rosterid=' + rosterId + ']').attr('src', YYIMChat.getFileUrl(photo));
};