var SNSInnerShareTab =  function(chatroom){
	this.name = "share";
//	this.selector = "#snsim_tab_head_share_"+chatroom.getID();
	this.chatroom = chatroom;
	
	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_share_"+chatroom.getID();
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_share_"+chatroom.getID();
	
	this.containerSelector = this.contentSelector+" .snsim_sharefile_container";
	
	this.fileBoxSelector = ".snsim_sharefile_box";
	this.refreshBtn = ".snsim_share_file_refresh_btn";
	this.fileNumSelector = ".snsim_share_file_num";
	
};

SNSInnerShareTab.fileTemplate = 
	'<li>'
	+ '<div style="display: inline-block; margin-top: 7px;vertical-align: top;">'
		+ '<img width="24" height="28" src="res/skin/default/icons/filetype/##{{type}}.png">'
	+ '</div>'
	+ '<div class="snsim_file_info">'
		+ '<span class="name">##{{name}}</span>'
		+ '<span class="size">##{{renderSize()}}</span>'
		//+ '<span class="downnum"> · ##{{downloads}}次下载</span>'
		+ '<span class="creator"> ##{{creator}}</span>'
		+ '<span class="time"> ##{{time}}</span>'
	+ '</div>'
	+ '<a class="download_btn" style="margin-top:13px;" href="##{{path}}" target="_blank">'
		+ '<span class="download_icon"></span><span class="download_info"></span>'
	+'</a>'
	+ '</li>',

	SNSInnerShareTab.noFileTips = "<span>当前群组没有被共享的文件。</span>"
	
SNSInnerShareTab.prototype = new SNSTab();


SNSInnerShareTab.prototype._init = function(){
	YYIMChat.log("SNSInnerShareTab.prototype._init ",3);
	this.getContentDom().find(this.fileBoxSelector).perfectScrollbar({suppressScrollX:true});
	this.getContentDom().find(this.refreshBtn).bind("click",jQuery.proxy( function(){
		var fileList = this.chatroom.fileList;
		jQuery.when(fileList.requestSharedFiles()).done(jQuery.proxy(this.showFiles,this));
	}, this));
};

SNSInnerShareTab.prototype.beforeSelect = function(){
	var fileList = this.chatroom.fileList;
	if(!fileList.hasRequested()){
		jQuery.when(fileList.requestSharedFiles()).done(jQuery.proxy(this.showFiles,this));
		return;
	}
	if(fileList.getList().length>0 && this.getContainerDom().html().isEmpty()){
		this.showFiles();
	}
};

SNSInnerShareTab.prototype.showFiles = function(){
	var container = this.getContainerDom();
	container.empty();
	
	var list =  this.chatroom.fileList.getList();
	this.getContentDom().find(this.fileNumSelector).text(list.length);
	if(list.length == 0){
		//container.append(SNSInnerShareTab.noFileTips);
		return;
	}
	
	for(var i in list){
		var item =  list[i];
		if(item && item instanceof SNSChatRoomFile){
			this.addShareFile(item);
		}
	}
	
};

SNSInnerShareTab.prototype.addShareFile = function(file){
	var html = TemplateUtil.genHtml(SNSInnerShareTab.fileTemplate, file);
	jQuery(this.containerSelector).prepend(html);
};

