var SNSReconnectPanel = function() {
	this.selector = "#snsim_list_relink";
	this.relinkCountDownPanel = "#snsim_connecting_wait";
	this.relinkCountDownText = "#snsim_relink_wait_seconds";

	this.connectingPanel = "#snsim_relink_connecting";
	this.cancelConnectingBtn = "#snsim_relink_cancel_connect";

	this.connectFailPanel = "#snsim_relink_connecting_fail";
	this.connectBtn = "#snsim_relink_connect_imm, #snsim_relink_reconnect_imm";

	/**
	 * 自动重连的倒计时
	 * @Type {Number}
	 */
	this.reconnectTimer = SNSConfig.CONNECTION.RECONNECT_TIMER;

	/**
	 * 自动重连倒计时的interval
	 * @Type {Number}
	 */
	this.reconnectInterval;
	
	this.reconnecting = false;
};

SNSReconnectPanel.prototype = new SNSFloatPanel();

SNSReconnectPanel.prototype._init = function() {
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.CONNECT_FAILED, false,
			this.startReconnectCount, this);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_CONNECT, true,
			this.onConnected, this);
	
	this._bindDomEvent();

};

SNSReconnectPanel.prototype._bindDomEvent = function() {
	// 立即连接按钮
	jQuery(this.connectBtn).bind("click",{self:this}, function(event) {
		event.data.self.reconnectImmedately();
	});

	// 取消按钮
	jQuery(this.cancelConnectingBtn).bind("click", {self:this}, function(event) {
		event.data.self.cancelReconnect();
	});
};

/**
 * 自动重连机制
 */
SNSReconnectPanel.prototype.startReconnectCount = function(event) {
	YYIMChat.log("SNSConnectDaemon.prototype.startReconnectCount", 2);
	if (this.reconnecting || !event.errorCode || event.errorCode == 401)
		return;
	this.reconnecting = true;
	this.reconnectInterval = setInterval(jQuery.proxy(this._doReconnect, this), 1000);
};

SNSReconnectPanel.prototype._doReconnect = function() {
	YYIMChat.log("SNSConnectDaemon.prototype._doReconnect ", 2);
	if (this.reconnectTimer > 0) {
		this.setCountDownNum(this.reconnectTimer--);
		this.showRelinkCountDown();
		this.getDom().show();
	} else {
		this.reconnectImmedately();
	}
};

/**
 * 取消自动重连的倒计时
 */
SNSReconnectPanel.prototype.cancelReconnect = function() {
	clearInterval(this.reconnectInterval);
	this.showConnectFailedPanel();
};

/**
 * 清除发送ping包的定时器
 */
SNSReconnectPanel.prototype.clearReconnectInterval = function() {
	clearInterval(this.reconnectInterval);
	this.reconnecting = false;
};

/**
 * 取消自动重连的倒计时，并立即进行连接
 */
SNSReconnectPanel.prototype.reconnectImmedately = function() {
	this.showRelinkPanel();
	YYIMChat.disConnect();
	YYIMChat.connect();
	
	clearInterval(this.reconnectInterval);
	this.reconnecting = false;
	this.reconnectTimer = SNSConfig.CONNECTION.RECONNECT_TIMER;
};

SNSReconnectPanel.prototype.onConnected = function() {
	this.clearReconnectInterval();
	this.getDom().hide();
};

SNSReconnectPanel.prototype.showRelinkPanel = function() {
	jQuery(this.relinkCountDownPanel).hide();
	jQuery(this.connectingPanel).show();
};

SNSReconnectPanel.prototype.showRelinkCountDown = function() {
	jQuery(this.connectingPanel).hide();
	jQuery(this.relinkCountDownPanel).show();
};

SNSReconnectPanel.prototype.setCountDownNum = function(num) {
	jQuery(this.relinkCountDownText).text(num);
};

SNSReconnectPanel.prototype.showConnectFailedPanel = function() {
	jQuery(this.connectingPanel).hide();
	jQuery(this.connectFailPanel).show();
};