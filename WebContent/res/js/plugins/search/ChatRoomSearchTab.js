var SNSChatroomSearchTab = function(){
	
	this.name="chatroomSearchTab";
	
	this.headSelector = "#snsim_chatroom_search_tab_head";
	this.contentSelector = "#snsim_chatroom_search_tab_content";
	
	this.containerSelector = "#snsim_chatroom_search_tab_container";
	this.searchBtn = ".multi_search_btn";
	this.searchResultHeadSelector = ".search_result_head";
	
	this.searchInputBox = ".multi_search_input";
	
	this.chatroomTemplate =
	 	'<li>'
			+ '<div class="head_icon">'
				+ '<img src="##{{photo}}">'
			+ '</div>'
			+ '<div class="item_info">'
				+ '<span class="name" style="width: 150px;">##{{name}}</span>'
				+ '<a class="btn" style="color:##{{color}};" title="##{{title}}" onclick="##{{clickFunc}}">##{{info}}</a>'
			+ '</div>'
		+ '</li>';
};

SNSChatroomSearchTab.prototype = new SNSTab();

SNSChatroomSearchTab.prototype._init = function(){
	this.getContainerDom().parent().perfectScrollbar();
	this._bindDomEvent();
};

SNSChatroomSearchTab.prototype._bindDomEvent = function(){
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

SNSChatroomSearchTab.prototype.sendSearchRequest = function(){
	YYIMChat.queryChatGroup({
		keyword: this.getSearchText(), 
		success: jQuery.proxy(this.showSearchResult, this)
	});
};

SNSChatroomSearchTab.prototype.showSearchResult = function(resultObj){
	var result = resultObj.items;
	this.getContainerDom().empty();
	this.getContentDom().find(this.searchResultHeadSelector).show();
	var html = "";
	var friendHtml = "";
	var strangerHtml = "";
	for(var i=0; i<result.length;i++){
		var room = SNSApplication.getInstance().getUser().getRoom(result[i].id);
		if(room){
			friendHtml += TemplateUtil.genHtml(this.chatroomTemplate, 
				{
					photo: room.getPhotoUrl(),
					name: room.name? room.name : room.getID(),
					clickFunc: "SNSIMWindow.getInstance().getChatWindow().openChatWith('"+ room.getID() +"')", 
					title: "聊天", 
					info: "聊天",
					color: "#36c048"
				}
			);
		}else{
			strangerHtml += TemplateUtil.genHtml(this.chatroomTemplate, 
				{
					photo: SNSConfig.CHAT_ROOM.DEFAULT_AVATAR,
					name: result[i].name, 
					clickFunc: "SNSIMWindow.getInstance().getChatRoomController().joinChatRoom('"+ result[i].id +"', '" + result[i].name + "')", 
					title: "加入", 
					info: "加入",
					color: "#ffa00a"
				}
			);
		}
	}
	this.getContainerDom().append(friendHtml + strangerHtml);
};

SNSChatroomSearchTab.prototype.getSearchText = function(){
	return this.getContentDom().find(this.searchInputBox).val().trim();
};