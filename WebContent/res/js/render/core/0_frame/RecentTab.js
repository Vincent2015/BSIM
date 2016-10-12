var SNSRecentTab = function() {
	this.name = "recent";
	this.headSelector = "#snsim_tab_recent_head";
	this.contentSelector = "#snsim_tab_recent_content";
	this.containerSelector = "#snsim_tab_recent_container";

	this.rosterTemplate = 
		'<li id="snsim_tab_recent_roster_##{{getID()}}" class="snsim_recent_roster_item clearfix sns_roster_list_wide_item">'
	    	+'<div class="snsim_list_head webim_head_30 sns_roster_list_wide_head">'
	          		+'<span class="head_pic">'
	          			+'<img width="31" height="31" src="##{{getPhotoUrl()}}" class="snsim_user_item_img" onerror="YYIMChat.defaultImg(this)">'
	          		+'</span>'
	          		+'<span class="snsim_roster_presence W_chat_stat snsim_##{{presence.status}}"></span>'
	          		+'<span class="WBIM_icon_new" node-type="snsNewMsgIcon"></span>'
	      +'</div>'
	      +'<div class="snsim_list_name">'
	      		+'<span class="user_name" title="##{{name}}">##{{name}}</span>'
			+'</div>'
		+'</li>';
	
	this.headTemplate = 
		'<li title="最近联系人" id="snsim_tab_recent_head" class="snsim_tab_head snsim_tab_recent_head clearfix">'
	        +'<a href="javascript:void(0);">'
	        	+'<span class=" snsim_icon_tab snsim_icontab_last"></span>'
	        +'</a>'
        +'</li>';
	
	this.contentTemplate = 
		'<div id="snsim_tab_recent_content" class="snsim_tab_content snsim_tab_recent_content snsRecentsScroll">'
	        +'<div class="snsim_list_con">'
		        +'<div class="list_box clearfix">'
			        +'<div class="list_content">'
				        +'<ul id="snsim_tab_recent_container" class="list_content_li">'
				        +'</ul>'
			        +'</div>'
		        +'</div>'
	        +'</div>'
        +'</div>';
};

SNSRecentTab.prototype = new SNSTab();

SNSRecentTab.prototype._init = function() {

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ADD_TO_RENCENT, false,
			this.updateRecent, this);

	var _self = this;
	jQuery(this.headSelector).bind("click", function() {
		SNSIMWindow.getInstance().getWideWindow().changeTabTo(_self);
	});
};



SNSRecentTab.prototype.updateRecent = function() {
	var recentList = SNSApplication.getInstance().getUser().recentList;
	var recent = recentList.getFirstItem();
	var dom = this.getContentDom().find("#snsim_tab_recent_roster_"+recent.id);
	
	var container = jQuery(this.containerSelector);
	if(dom.length>0){
		container.prepend(dom);
	}else{
		var html = TemplateUtil.genHtml(this.rosterTemplate, [SNSApplication.getInstance().getUser().getRosterOrChatRoom(recent.id),recent.message]);
		container.prepend(html);
		this._bindRosterDomEvent(recent);
	}

	var items = this.getContentDom().find("li[id^='snsim_tab_recent_roster_']");
	if(items.length>SNSConfig.RECENT.MAX_SIZE){
		this.getContentDom().find("li[id^='snsim_tab_recent_roster_']:last").remove();
	}
	
};

SNSRecentTab.prototype._bindRosterDomEvent =function(recent){
	this.getContentDom().find("#snsim_tab_recent_roster_"+recent.id).bind("click", {id:recent.id},function(event,id){
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.id);
	});
};

/**
 * 返回头部模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSRecentTab.prototype.getHeadTemplate = function(){
	return this.headTemplate;
};

/**
 * 返回内容模板，用于屏蔽不同Tab的模板声明的不同
 * @returns {String}
 * @Abstract
 */
SNSRecentTab.prototype.getContentTemplate = function(){
	return this.contentTemplate;
};
