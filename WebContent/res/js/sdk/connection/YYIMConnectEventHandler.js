function YYIMConnectEventHandler() {
	this._inited = false;
};

YYIMConnectEventHandler.prototype._init = function() {
	
	_logger.log("YYIMConnectEventHandler.prototype.registerHandler", 3);
	
	if(this._inited){
		return;
	}
	
	var conn = YYIMConnection.getInstance();

	conn.registerHandler('onConnect', this.onConnected);
	//conn.registerHandler('onError', this.onConnectError);
	conn.registerHandler('onDisconnect', this.onDisConnect);
	conn.registerHandler("onStatusChanged", this.connectStatusChangeHandler);

	conn.registerHandler(OPCODE.STREAM_ERROR.KEY, this.onStreamError);
	conn.registerHandler(OPCODE.PACKET_ERROR.KEY, this.onPacketError);
	
	// 注册packet_in监听器， 以记录最后报文的到达时间
	//conn.registerHandler("packet_in", conn.getDaemon().pong);
	
	this._inited = true;
};

/**
 * 连接成功
 */
YYIMConnectEventHandler.prototype.onConnected = function(){
	YYIMManager.getInstance().onOpened();
	YYIMConnection.getInstance().getDaemon().startPing();
};

/**
 * 连接失败时, 触发全局事件CONNECT_FAILED， 附加参数：[errorCode, message]
 * @param e 错误信息
 */
YYIMConnectEventHandler.prototype.onConnectError = function(e) {
	_logger.log("YYIMConnectEventHandler.prototype.onConnectError ", 0, e);
	errorCode = e.getAttribute("code");

	YYIMConnection.getInstance().getDaemon().stopPing();
	
	if(errorCode == 401 || errorCode/10 == 401){
		YYIMManager.getInstance().onAuthError({
			errorCode : 401,
			message : '用户名或密码错误'
		});
	}else {
		YYIMManager.getInstance().onConnectError({
			errorCode : errorCode,
			message : '连接失败'
		});
	}
};

YYIMConnectEventHandler.prototype.onStreamError = function(packet) {
	_logger.log("YYIMConnectEventHandler.prototype.onPacketError ", 0, packet);
	YYIMConnection.getInstance().getDaemon().stopPing();
	
	if(packet.code == 401 || packet.code/10 == 401){
		YYIMManager.getInstance().onAuthError({
			errorCode : 401,
			message : '用户名或密码错误'
		});
	}else {
		YYIMManager.getInstance().onConnectError({
			errorCode : packet.code,
			message : packet.message
		});
	}
	
};

YYIMConnectEventHandler.prototype.onPacketError = function(packet) {
	_logger.log("YYIMConnectEventHandler.prototype.onPacketError ", 0, packet);
};

/**
 * 连接关闭
 */
YYIMConnectEventHandler.prototype.onDisConnect = function(){
	YYIMManager.getInstance().onClosed();
	
	YYIMConnection.getInstance().getDaemon().stopPing();
};

/**
 * 连接状态改变时将调用此事件, 触发ON_CONNECT_STATUS_CHANGE全局事件，参数status, 可能的值为：
 * <ul>
 * <li>'initializing' ... well
 * <li>'connecting' if connect() was called
 * <li>'resuming' if resume() was called
 * <li>'processing' if it's about to operate as normal
 * <li>'onerror_fallback' if there was an error with the request object
 * <li>'protoerror_fallback' if there was an error at the http binding protocol flow (most likely that's where you interested in)
 * <li>'internal_server_error' in case of an internal server error
 * <li>'suspending' if suspend() is being called
 * <li>'aborted' if abort() was called
 * <li>'disconnecting' if disconnect() has been called
 * </ul>
 */
YYIMConnectEventHandler.prototype.connectStatusChangeHandler = function(status) {
	_logger.log("connectStatusChangeHandler", 3, status);
	YYIMManager.getInstance().onStatusChanged(status);
};