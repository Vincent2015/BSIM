/**
 * 聊天输入框的
 */
var SNSSendBox = function() {

	this._unCompleteMessage = new Object();
	
	this.selector = "#snsim_chat_sendbox";
	this.contentDomSelector = "#snsim_sendbox_content";
	this.characterCounterSelector = "#snsim_sendbox_available_num";
	this.sendBtnSelector = "#snsim_message_send_btn";
	
	this.expressionPattern = /<img[\w\W]+?node-type=\"expression\"[\w\W]+?>/ig;
	this.characterExceedClass = "snsim_message_character_exceed";
	
	
	this._init();
};

SNSSendBox.prototype = new SNSComponent();

SNSSendBox.prototype._init = function(){
	this._bindPasteEvent();
	this._bindSendEvent();
};

SNSSendBox.prototype._bindSendEvent = function(){
	var self = this;
	jQuery(this.sendBtnSelector).on("click",jQuery.proxy( this.send, this));
	jQuery(this.contentDomSelector).on('keydown', function(e){
		if(e.keyCode == SNS_KEY_CODE.ENTER){
			self.send();
			e.preventDefault();
		}
	});
	jQuery(this.contentDomSelector).on('keyup', function(e){
		if (self.getContentLength() > SNSConfig.MESSAGE.MAX_CHARACHER) {
			alert('消息超出长度限制');
			e.preventDefault();
		}else {
			self.updateContentLength();
		}
	});
};

SNSSendBox.prototype.send = function(){
	if(!this.getContent())
		return;
	if(this.getContentLength() > SNSConfig.MESSAGE.MAX_CHARACHER) {
		alert('消息超出长度限制');
		return;
	}
	
	var type = SNS_CHAT_TYPE.CHAT;
	var toRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	var to = toRoster.id;
	// public account
	if(toRoster instanceof SNSPublicAccountRoster){
		type = SNS_CHAT_TYPE.PUB_ACCOUNT;
		//to = toRoster.jid.getBareJID();
	}
	// room
	else if(toRoster instanceof SNSChatRoom){
		type = SNS_CHAT_TYPE.GROUP_CHAT;
		//to = toRoster.jid.getBareJID();
	}
	// device
	else if(toRoster instanceof SNSDeviceRoster){
		//to = toRoster.jid.toString();
	}
	var arg = {
		to: to,
		msg: this.getContent(),
		type: type,
		success: jQuery.proxy(function(msg){
			var message = new SNSOutMessage(msg);
			message.setText(msg.body.content);
			
			if(arg.style){
				message.body.style = new SNSMessageStyle(arg.style.font, arg.style.size, arg.style.color, arg.style.biu);
			}
			var recentList = SNSApplication.getInstance().getUser().recentList;
			recentList.addNew(message);
			SNSApplication.getInstance().getMessageInBox().filter.doFilter(message);
			var curTab = SNSIMWindow.getInstance().getChatWindow().getTab(message.to);
			curTab.addMessage(message);
			//curTab.scrollToBottom();
			
			this.clearContent();
		},this)
	};
	
	if(toRoster.resource){
		arg.resource = toRoster.resource;
	}
	if(SNSMessageStyle.used)
		arg.style = SNSMessageStyle.getInstance();
	
	YYIMChat.sendTextMessage(arg);
};

SNSSendBox.prototype.getContent = function() {
	var _cont = this.getContentDom().html();
	//去除前后空格
	_cont = _cont.replace(/(^(\s|&nbsp;)*)|((\s|&nbsp;)*$)/g,'');
	return this.html_decode(SNSExpressionOutFilter.genContent(_cont));
};

SNSSendBox.prototype.getContentDom = function(){
	return  jQuery(this.contentDomSelector);
}

SNSSendBox.prototype.clearContent = function() {
	jQuery(this.contentDomSelector).empty();
	jQuery(this.characterCounterSelector).text(SNSConfig.MESSAGE.MAX_CHARACHER);
};

SNSSendBox.prototype.updateContentLength = function() {
	var dom = jQuery(this.characterCounterSelector);
	var availableNum = SNSConfig.MESSAGE.MAX_CHARACHER - this.getContentLength();
	dom.text(availableNum > 0? availableNum : 0);
	if (availableNum <= 0) {
		dom.addClass(this.characterExceedClass);
	} else {
		dom.removeClass(this.characterExceedClass);
	}
};

SNSSendBox.prototype.getContentLength = function() {
	return this.getContent().replace(this.expressionPattern, " ").length;
};

SNSSendBox.prototype._bindPasteEvent = function() {
	jQuery(this.contentDomSelector).bind("beforepaste paste", function(e) {
		var _this = jQuery(this);
		setTimeout(function() {
			// TODO SNSExpressionOutFilter
			_this.html(_this.html().replace(SNSExpressionOutFilter.pattern, "$1"));
			_this.html(_this.html().replace(/<[^<]*>/g, ''));
			_this.html(SNSExpressionInFilter.decode(_this.html()));
		}, 0);
	});
};

SNSSendBox.prototype.insertHtmlContent = function(html) {
	var dthis = jQuery(this.contentDomSelector);
	var sel, range;
	if (window.getSelection) { // IE9 and non-IE
		sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			range = sel.getRangeAt(0);
			range.deleteContents();
			var el = document.createElement('div');
			el.innerHTML = html;
			var frag = document.createDocumentFragment(), node, lastNode;
			while ((node = el.firstChild)) {
				lastNode = frag.appendChild(node);
			}
			var parentElement = range.commonAncestorContainer.parentElement;
			if (parentElement && parentElement.contentEditable == "true") {
				range.insertNode(frag);
			} else {
				this.getContentDom().append(frag);
			}
			if (lastNode) {
				range = range.cloneRange();
				range.setStartAfter(lastNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	} else if (document.selection && document.selection.type != 'Control') {

		jQuery(dthis).focus(); // 在非标准浏览器中 要先让你需要插入html的div 获得焦点
		ierange = document.selection.createRange();// 获取光标位置
		ierange.pasteHTML(html); // 在光标位置插入html 如果只是插入text 则就是fus.text="..."
		jQuery(dthis).focus();

	}
	// 更新总字数

};

SNSSendBox.prototype.html_encode = function(str) {
	var s = "";
	if (str.length == 0)
		return "";
	s = str.replace(/&/g, "&gt;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/\s/g, "&nbsp;");
	s = s.replace(/\'/g, "&#39;");
	s = s.replace(/\"/g, "&quot;");
	s = s.replace(/\n/g, "<br>");
	return s;
};

SNSSendBox.prototype.html_decode = function(str) {
	var s = "";
	if (str.length == 0)
		return "";
	s = str.replace(/&gt;/g, "&");
	s = s.replace(/&lt;/g, "<");
	s = s.replace(/&gt;/g, ">");
	s = s.replace(/&nbsp;/g, " ");
	s = s.replace(/&#39;/g, "\'");
	s = s.replace(/&quot;/g, "\"");
	s = s.replace(/<br>/g, "\n");
	return s;
};