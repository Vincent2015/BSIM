function YYIMConnectDaemon(){
	/**
	 * 最后接收的报文的时间
	 * @Type {Number}
	 */
	this.lastPongTime;

	/**
	 * 循环发送ping包的interval
	 * @Type {Number}
	 */
	this.pingInterval;

	/**
	 * 判断发送ping包是否超时的timeout
	 * @Type {Number}
	 */
	this.pingTimeout;

};

/**
 * 向服务器轮询发送ping包， 判断自己是否掉线
 */
YYIMConnectDaemon.prototype.startPing = function() {
	if (YYIMConnection.getInstance().connected()) {
		this.pingInterval = setInterval(this.ping.bind(this), YYIMConfiguration.PING.INTERVAL);
	}
};

/**
 * 清除发送ping包的定时器
 */
YYIMConnectDaemon.prototype.stopPing = function() {
	clearTimeout(this.pingTimeout);
	clearInterval(this.pingInterval);
};

/**
 * 向服务器发送ping包，如果服务器在指定时间SNSConnectService.pingTimeout内未返回，则进行重连
 */
YYIMConnectDaemon.prototype.ping = function() {
	var curTime = new Date().getTime();
	// 指定时间段内已经接受到了服务器的包 则不再发送ping包判断
	if (curTime - this.lastPongTime < YYIMConfiguration.PING.DURATION) {
		return;
	}
	
	var pingPacket = new JumpPacket(null, OPCODE.PING.SEND);
	try {
		YYIMConnection.getInstance().send(pingPacket);
		
		this.pingTimeout = setTimeout(this.timeoutHandler.bind(this), YYIMConfiguration.PING.TIMEOUT);

	} catch (e) {
		_logger.log("SNSConnectService.ping", 0, e);
		this.stopPing();
		YYIMManager.getInstance().onConnectError({
			errorCode : 408,
			message : '连接失败'
		});
		return;
	}
	
};

/**
 * 更新最后收到的ping包的时间
 * @param packet
 */
YYIMConnectDaemon.prototype.pong = function() {
	this.lastPongTime = new Date().getTime();
	clearTimeout(this.pingTimeout);
};


YYIMConnectDaemon.prototype.timeoutHandler = function() {
	this.stopPing();
	YYIMManager.getInstance().onConnectError({
		errorCode : 408,
		message : '连接失败'
	});
};