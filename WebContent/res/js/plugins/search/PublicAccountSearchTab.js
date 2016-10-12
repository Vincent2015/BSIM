var SNSPublicAccountSearchTab = function(){
	
	this.name="publicAccountSearchTab";
	
	this.headSelector = "#snsim_pulic_account_search_tab_head";
	this.contentSelector = "#snsim_public_account_search_tab_content";
	
	this.containerSelector = "#snsim_public_account_search_tab_container";
	this.searchBtn = ".multi_search_btn";
	this.searchResultHeadSelector = ".search_result_head";
	
	this.searchInputBox = ".multi_search_input";
	
	this.publicAccountTemplate =
		'<li>'
			+ '<div class="head_icon">'
				+ '<img src="##{{photo}}">'
			+ '</div>'
			+ '<div class="item_info">'
				+ '<span class="name">##{{name}}</span>'
				+ '<a class="btn" style="color:##{{color}};" title="##{{title}}" onclick="##{{clickFunc}}">##{{info}}</a>'
				+ '<div class="info">##{{name}}</div>'
			+ '</div>'
		+ '</li>';
};

SNSPublicAccountSearchTab.prototype = new SNSTab();

SNSPublicAccountSearchTab.prototype._init = function(){
	this.getContainerDom().parent().perfectScrollbar();
	this._bindDomEvent();
};

SNSPublicAccountSearchTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.searchInputBox).bind("keydown",{self:this}, function(event){
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			event.data.self.sendSearchRequest();
		};
	});
	
	this.getContentDom().find(this.searchInputBox).bind("keyup",jQuery.proxy(function(event){
		var keyword = this.getSearchText();
		if(!keyword){
			this.getContainerDom().empty();
			this.getContentDom().find(this.searchResultHeadSelector).hide();
		}
	}, this));
	
	this.getContentDom().find(this.searchBtn).bind("click", {self:this},function(event){
		event.data.self.sendSearchRequest();
	});
};

SNSPublicAccountSearchTab.prototype.sendSearchRequest = function(){
	YYIMChat.queryPubaccount({
		keyword: this.getSearchText(), 
		success: jQuery.proxy(this.showSearchResult, this)
	});
};

SNSPublicAccountSearchTab.prototype.showSearchResult = function(resultObj){
	var result = resultObj.items;
	this.getContainerDom().empty();
	this.getContentDom().find(this.searchResultHeadSelector).show();
	var friendHtml = "";
	var strangerHtml = "";
	for(var i=0; i<result.length;i++){
		var pubaccount = SNSApplication.getInstance().getUser().getRoster(result[i].id);
		if(pubaccount) {
			friendHtml += TemplateUtil.genHtml(this.publicAccountTemplate, 
				{
					name: pubaccount.name? pubaccount.name : pubaccount.getID(),
					photo: pubaccount.getPhotoUrl(),
					clickFunc: "SNSIMWindow.getInstance().getChatWindow().openChatWith('"+ pubaccount.getID() +"')", 
					title: "聊天", 
					info: "聊天",
					color: "#36c048"
				}
			);
		}
		else {
			strangerHtml += TemplateUtil.genHtml(this.publicAccountTemplate, 
				{
					name: result[i].name,
					photo: SNSConfig.ROSTER.PUB_ACCOUNT_DEFAULT_AVATAR,
					clickFunc: "SNSPlugin.pluginList.get('searchPlugin').searchWindow.addPublicAccount('"+ result[i].id +"', '" + result[i].name + "')", 
					title: "关注", 
					info: "关注",
					color: "#ffa00a"
				}
			);
		}
	}
	this.getContainerDom().append(friendHtml + strangerHtml);
};

SNSPublicAccountSearchTab.prototype.getSearchText = function(){
	return this.getContentDom().find(this.searchInputBox).val().trim();
};