/**
 * 窄版好友列表, 包含好友渲染等方法
 * @Class SNSNarrowWindow
 * @Singleton
 */
var SNSNarrowWindow = function() {
	this.selector = "#snsim_window_narrow";
	this.rosterContainerSelector = "#narrow_roster_container";
	this.rosterIdPrefix = "narrow_roster_";
	this.width;
	this.rosterTemplate = 
		'<li id="'+this.rosterIdPrefix +'##{{getID()}}" rosterId="##{{getID()}}" class="clearfix">' 
			+ '<div class="snsim_list_head snsim_head_30" style="padding:8px 8px 4px 8px;">'
				+ '<span class="head_pic">' 
					+ '<img class="snsim_roster_photo snsim_user_item_img" rosterId="##{{getID()}}" src="##{{getPhotoUrl()}}" alt="##{{name}}" jid="##{{jid.getBareJID()}}" onerror="YYIMChat.defaultImg(this)">'
				+ '</span>' 
				+ '<span node-type="statusNode" class="snsim_roster_presence W_chat_stat snsim_##{{presence.status}}"></span>'
			+ '</div>' 
		+ '</li>';
}

SNSNarrowWindow.prototype = new SNSWindow();

/**
 * 绑定全局事件AFTER_LOAD_ROSTER, 此类的入口
 * @private
 */
SNSNarrowWindow.prototype._init = function() {
	this.width = this.getDom().width();
	// 滚动条
	jQuery(this.rosterContainerSelector).parent().perfectScrollbar({suppressScrollX:true,setOffsetRight:true,offsetRight:0});
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_LOAD_ROSTER, false,
		function(data) {
			this.renderRosterList();
		}, 
	this);

};

/**
 * 根据user中的好友列表， 根据在线状态顺序渲染好友
 */
SNSNarrowWindow.prototype.renderRosterList = function() {
	var rosters = SNSApplication.getInstance().getUser().rosterList.sortByStatus();
	var container = jQuery(this.rosterContainerSelector);
	container.empty();
	for ( var i = 0; i < rosters.length; i++) {
		var roster = rosters[i];
		if (roster && roster instanceof SNSRoster) {
			this.addRoster(roster);
		}
	}
};

/**
 * 渲染好友的头像
 * @param roster {SNSRoster}
 */
SNSNarrowWindow.prototype.renderRosterPhoto = function(roster) {
	jQuery("li[id$='" + roster.getID() + "'] img.snsim_roster_photo").attr("src", roster.vcard.getPhotoUrl());
}

/**
 * 渲染指定的好友
 * @param roster {SNSRoster}
 */
SNSNarrowWindow.prototype.addRoster = function(roster) {
	var html = TemplateUtil.genHtml(this.rosterTemplate, roster);
	var container = jQuery(this.rosterContainerSelector);
	container.append(html);
	this._bindRosterClickEvent(roster);
	
	//roster.whenVCardDone(this, this.renderRosterPhoto, [ roster ]);
};

/**
 * 绑定好友列表条目的事件, 如展示浮动窗口， 单击事件
 * @param roster {SNSRoster}
 */
SNSNarrowWindow.prototype._bindRosterClickEvent = function(roster) {
	var rosterDoms = this.getDom().find("li#narrow_roster_" + roster.getID());
	rosterDoms.bind("click", {
		roster : roster
	}, function(event) {
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.roster);
	});
	
	//鼠标移到头像上， 展示VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseover",{roster:roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = true;
		vcardPanel.show(event.target);
	});
	
	//鼠标移出到头像外, 隐藏VCard
	this.getDom().find(".snsim_roster_photo[rosterId='" + roster.getID() + "']").bind("mouseout",{roster:roster}, function(event){
		var roster = event.data.roster;
		var vcardPanel = SNSVCardPanel.getInstance(roster);
		vcardPanel.mouseover = false;
		setTimeout(function(){
			if(!vcardPanel.mouseover){
				vcardPanel.hide();
			}
		},200);
	});
};
