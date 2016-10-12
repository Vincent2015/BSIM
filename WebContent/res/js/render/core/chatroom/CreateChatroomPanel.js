var SNSCreateChatroomPanel = function() {
	this.triggerSelector = ".snsim_create_chatroom_btn";
	this.selector = ".sns_chatroom_name_div";
	this.submitBtn = ".sns_chatroom_name_btn";
	this.inputBox = ".sns_chatroom_name_input";

	this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;

};

SNSCreateChatroomPanel.prototype = new SNSComponent();

SNSCreateChatroomPanel.prototype._init = function() {

	// 创建群组
	jQuery(this.triggerSelector).bind("click", jQuery.proxy(function(event) {
		jQuery(this.selector).toggle();
	}, this));

	// 创建群组输入名称回车事件
	jQuery(this.inputBox).bind("keydown", jQuery.proxy(function(event) {
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			jQuery(this.submitBtn).trigger("click");
		}
	}, this));

	// 创建群组输入名称后点击确定
	jQuery(this.submitBtn).on(
			"click",
			jQuery.proxy(function() {
				var name = jQuery(this.inputBox).val().substr(0,8);
				if (name.notEmpty()) {
					var node = Math.uuid().replace(/\-/g, "").toLowerCase().substr(0, 8);
					YYIMChat.addChatGroup({
						name: name,
						node: node,
						//nickName: SNSApplication.getInstance().getUser().getID(),
						success: jQuery.proxy(function(arg) {
							var room = SNSApplication.getInstance().getUser().chatRoomList.createRoomHandler(arg);
							SNSIMWindow.getInstance().getChatWindow().openChatWith(room);
							this.hide();
						}, this)
					});
					jQuery(this.inputBox).val('');
				}
			}, this));

	SNSComponent.prototype._init.call(this);
}