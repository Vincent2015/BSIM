var YYIMMessage = (function(){
	var receivedMsgIds = new SNSBaseList();
	/**
	 * 监控message包
	 */
	function monitor() {
		var _conn = YYIMConnection.getInstance();
		
		_conn.registerHandler(OPCODE.USER_MESSAGE.KEY, function(packet) {
			parseMessage(packet, 'chat');
		});
		_conn.registerHandler(OPCODE.CHATGROUP_MESSAGE.KEY, function(packet) {
			parseMessage(packet, 'groupchat');
		});
		_conn.registerHandler(OPCODE.PUBACCOUNT_MESSAGE.KEY, function(packet) {
			parseMessage(packet, 'chat');
		});
		
		
	};
	
	// 长连接接收到的消息
	function parseMessage(packet, chatType) {
		
		if(packet.content == undefined){
			console.error('packetContent_error:');
			return;
		}else{
			console.log('packetContent:',packet.content);
		}
		
		if(receivedMsgIds.get(packet.id) === true){
			return;
		}
		
		receivedMsgIds.add(packet.id, true);
		// TODO to zhangxin0@server/android web端也会收到
		if(packet.from === YYIMManager.getInstance().getUserFullJID())
			return;
		
		var packetContent = packet.content;
		try {
			// 图片消息、文件、分享类消息，需要解析
			packetContent = JSON.parse(packet.content);
		} catch (e) {}
		
		var body = {
				content: packetContent.content,
				contentType: packet.contentType,
				dateline: packet.dateline,
				receiptsbody:{
					type:YYIMConfiguration.PACKETTYPE.LONGCONNECT,
					receipts:packet.receipts,
					arg:{from:packet.from,id:packet.id}
				},
				extend: (packetContent && packetContent.extend)? packetContent.extend:undefined 	//扩展
			},
			from = (chatType == CHAT_TYPE.CHAT) ? 
					YYIMJIDUtil.getID(packet.from): {
													room: YYIMJIDUtil.getID(packet.from), 
													roster: YYIMJIDUtil.getID(YYIMJIDUtil.getResource(packet.from))
												},
			arg = {
				id: packet.id,
				type: chatType,
				from: from,
				data: body,
			};
		
		if(chatType == CHAT_TYPE.CHAT) {
			arg.resource = YYIMJIDUtil.getResource(packet.from);
		}
		else if(chatType == CHAT_TYPE.GROUP_CHAT && from.roster == YYIMManager.getInstance().getUserID()) {
			return;
		}
		// 我的设备
//				if(user.deviceList.get(packet.getFromJID().toString())){
//					arg.from = packet.getFromJID().getResource();
//					arg.type = CHAT_TYPE.DEVICE;
//					onDeviceMessage(arg);
//				}
		if(body.contentType == MESSAGE_CONTENT_TYPE.TEXT){ //text message
			if(packetContent.style) {
				arg.data.style = packetContent.style;
			}
			//if(arg.data && typeof arg.data.style == 'string') {
			//	arg.data.style = JSON.parse(arg.data.style);
			//}
			try{
				YYIMManager.getInstance().onTextMessage(arg);
			}catch(e){}
		}else if(body.contentType == MESSAGE_CONTENT_TYPE.IMAGE){ //image message
			if(arg.data && arg.data.content && arg.data.content.path)
				arg.data.content.path = YYIMChat.getFileUrl(arg.data.content.path);
			try{
				YYIMManager.getInstance().onPictureMessage(arg);
			}catch(e){}
		}else if(body.contentType == MESSAGE_CONTENT_TYPE.FILE){ //file message
			if(arg.data && arg.data.content && arg.data.content.path)
				arg.data.content.path = YYIMChat.getFileUrl(arg.data.content.path);
			try{
				YYIMManager.getInstance().onFileMessage(arg);
			}catch(e){}
		}else if(body.contentType == MESSAGE_CONTENT_TYPE.SHARE){ //share message
			try{
				YYIMManager.getInstance().onShareMessage(arg);
			}catch(e){}
		}
		
		if(packet.receipts === true && YYIMConfiguration.RECEIPTSPACKET_AUTO){
			sendReceiptsPacket({from:packet.from,id:packet.id});
		}
		
	}
	
	/**
	 * 发送回执
	 *  @param arg {
	 *  	from:,	//报文的来源
	 * 		id: 	//报文id
	 * }
	 */
	function sendReceiptsPacket(arg){
		var receiptsPacket = new JumpPacket({
			to: arg.from,
			dateline: new Date().getTime(),
			id: arg.id
		}, OPCODE.RECEIPTS.SEND);
		YYIMConnection.getInstance().send(receiptsPacket);
	}
	
	/**
	 * 发送已读回执
	 *  @param arg {
	 *  	from:,	//报文的来源
	 * 		id: 	//报文id
	 * }
	 */
	function sendReadedReceiptsPacket(arg){
		var receiptsPacket = new JumpPacket({
			to: arg.from,
			dateline: new Date().getTime(),
			id: arg.id,
			state:2
		}, OPCODE.RECEIPTS.SEND);
		YYIMConnection.getInstance().send(receiptsPacket);
	}
	
	/**
	 * 发送消息
	 * @param arg {id, to: jid, type: "groupchat"|"chat"|"pubaccount",body:object, success:function, error:function}
	 */
	 function sendMessage(arg) {
		var to,
			body = arg.body || {},
			msgBody = {
    			id 			: arg.id,
    			type 		: arg.type,
    			//receipts 	: '1',
    			contentType	: body.contentType || MESSAGE_CONTENT_TYPE.TEXT,
    			dateline	: body.dateline,
    			content 	: {
    				extend  : body.extend,
    				content : body.content
    			}
			},
			opcode = OPCODE.USER_MESSAGE.SEND;
		if(arg.type == 'chat'){
			msgBody.receipts = '1';
			if(arg.resource){
				if(arg.resource.toLowerCase() == 'anonymous') {
					to = YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getID(arg.to), arg.resource.toUpperCase());
				}
				// 给自己的其他端发
				else if(arg.to == YYIMChat.getUserID()) {
					to = YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(arg.to), arg.resource);
				}else{
					to = YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(arg.to));
				}
			}else{
				to = YYIMJIDUtil.buildUserJID(YYIMJIDUtil.getNode(arg.to));
			}
		}else if(arg.type == 'groupchat'){
			to = YYIMJIDUtil.buildChatGroupJID(YYIMJIDUtil.getNode(arg.to));
			opcode = OPCODE.CHATGROUP_MESSAGE.SEND;
			
		}else if(arg.type == 'pubaccount'){
			to = YYIMJIDUtil.buildPubAccountJID(YYIMJIDUtil.getNode(arg.to));
			opcode = OPCODE.PUBACCOUNT_MESSAGE.SEND;
			
		}
		msgBody.to = to;
		
		// 样式添加到扩展属性，可能会有其他扩展属性，因此扩展属性为k-v格式
		if(arg.style) {
			msgBody.content.style = arg.style;
		}
		
		// YYIMManager.getInstance().onMessageOut(msgBody);
		var msgPacket = new JumpPacket(msgBody, opcode);
		YYIMConnection.getInstance().send(msgPacket, function(receipts) {
			YYIMManager.getInstance().onReceipts(receipts.id);
		});
		
		arg.success && arg.success(arg);
		
		// TODO 发送多久没回执认为失败
		// arg.error && arg.error(arg);
	}
	
	/**
	 * 邀请加群
	 * @param roomJid
	 * @param jids {Array<String>}
	 */
	function addGroupMember(roomJid, jids) {
		YYIMConnection.getInstance().send(new JumpPacket({
			to : roomJid,
			invites : jids
		}, OPCODE.INVITE_USERS.SEND));
	}
	
	/**
	 * 获取历史记录 
	 * @param arg {id: 对方ID, resource: 对方资源 为anonymous时表示匿名用户, chatType: 'chat' | 'groupchat', start: number, num: number, success: function, error: function}
	 */
	function getHistoryMessage(arg) {
		var requestUrl = YYIMConfiguration.SERVLET.HISTORY_MESSAGE_SERVLET + YYIMConfiguration.MULTI_TENANCY.ETP_KEY + '/' + YYIMConfiguration.MULTI_TENANCY.APP_KEY + '/'+ YYIMChat.getUserID() +"?token="+ YYIMManager.getInstance().getToken() + "&start=" + arg.start + "&size=" + arg.num + "&type=1&peer=";
		if(arg.resource && arg.resource == "anonymous") {
			requestUrl += arg.id;
		} else {
			requestUrl += YYIMJIDUtil.getNode(arg.id);
		}
		if(YYIMCommonUtil.isStringAndNotEmpty(arg.chatType)){
			requestUrl += "&fromUser=" + YYIMManager.getInstance().getUserNode();
		}
		YYIMManager.getInstance().log("历史记录：request URL",	2,requestUrl);
		jQuery.ajax({
			url: requestUrl,
			dataType: "json",
			success: function(data) {
				_historyMessageProcessor(data, arg);
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){  
				YYIMManager.getInstance().log("ajax error", 3, XMLHttpRequest.status+XMLHttpRequest.readyState+XMLHttpRequest.responseText);
			}
		});
	};
	
	/**
	 * 客户端首次登陆获取版本号
	 */
	function getVersion(arg){
		var requestUrl = YYIMConfiguration.SERVLET.OFFLINE_MESSAGE_SERVLET + YYIMConfiguration.MULTI_TENANCY.ETP_KEY + '/' + YYIMConfiguration.MULTI_TENANCY.APP_KEY + '/' + arg.id + '/version?resource=' + YYIMConfiguration.RESOURCE + '&token=' + YYIMManager.getInstance().getToken();
		
		jQuery.ajax({
			url: requestUrl,
			dataType: "json",
			success: function(data) {
				YYIMCookieUtil.setcookie('offline_version_'+arg.id, data, 60*24, '/');
				arg.version = data;
				getOfflineMessage(arg);
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){  
				YYIMManager.getInstance().log("getOfflineMessage ajax error", 3, XMLHttpRequest.status + XMLHttpRequest.readyState + XMLHttpRequest.responseText);
			}
		});
	}
	
	/**
	 * 获取离线消息  rongqb 20150806
	 * @param arg {version: 客户端当前的版本号, 客户端首次安装可以设置为-1，服务端自动判断版本号, start: 消息列表的分页参数，起始值，默认0, size: 消息列表的分页参数，分页参数，默认100}
	 */
	function getOfflineMessage(arg){
		if(!arg.start) arg.start = 0;
		if(!arg.size) arg.size = 100;
		
		var requestUrl = YYIMConfiguration.SERVLET.OFFLINE_MESSAGE_SERVLET + YYIMConfiguration.MULTI_TENANCY.ETP_KEY + '/' + YYIMConfiguration.MULTI_TENANCY.APP_KEY + '/' + arg.id + '?version=' + arg.version + '&start=' + arg.start + '&size=' + arg.size + '&resource=' + YYIMConfiguration.RESOURCE + '&token=' + YYIMManager.getInstance().getToken();
		
		jQuery.ajax({
			url: requestUrl,
			dataType: "json",
			success: function(data) {
				if(data.version > arg.version){
					_offlineMessageProcessor(data, arg); //解析离线消息
				}else if(data.version < arg.version && data.version >= -1){
					getVersion(arg);
				}
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){  
				YYIMManager.getInstance().log("getOfflineMessage ajax error", 3, XMLHttpRequest.status + XMLHttpRequest.readyState + XMLHttpRequest.responseText);
			}
		});
	}
	
	/**
	 * 通知服务器离线消息已经处理  rongqb 20150806
	 * @param data ajax 返回的数据
	 * @param arg {oldversion: 标记版本号的起始值, version: 标记版本号的结束值}
	 */
	function _offlineMessagehandleAfter(data, arg){
		var requestUrl = YYIMConfiguration.SERVLET.OFFLINE_MESSAGE_SERVLET + YYIMConfiguration.MULTI_TENANCY.ETP_KEY + '/' + YYIMConfiguration.MULTI_TENANCY.APP_KEY + '/' + arg.id + '/ack?oldversion=' + arg.version + '&version=' + data.version + '&resource=' + YYIMConfiguration.RESOURCE + '&token=' + YYIMManager.getInstance().getToken();
		
		jQuery.ajax({
			url: requestUrl,
			dataType: "json",
			type:'put',
			statusCode:{
				200: function() {
					YYIMCookieUtil.setcookie('offline_version_'+arg.id, data.version, 60*24, '/');
				}
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){  
				YYIMManager.getInstance().log("_offlineMessagehandleAfter ajax error", 3, XMLHttpRequest.status + XMLHttpRequest.readyState + XMLHttpRequest.responseText);
			}
		});
	}
	
	
	/**
	 * 解析离线消息  rongqb 20150806
	 * @param data ajax 返回的数据
	 * {
		    "packets": [{
		        "body": "{报文的body, json字符串}",
		        "opcode": "EDA="//报文的OpCode进行base64编码后的字符串
		    }],
		    "version": 1 //获取当前消息后，客户端需要更新到的版本号
		    "count" : 10,
		    "start" : 0,
		    "size" : 100	
		}
	 * @param arg {id: 当前登录人ID, etpId: , appId: ,version: 客户端当前的版本号, 客户端首次安装可以设置为-1，服务端自动判断版本号, start: 消息列表的分页参数，起始值，默认0, size: 消息列表的分页参数，分页参数，默认100, resource: 客户端的资源标识字段}}
	 */
	var packets = [];
	function _offlineMessageProcessor(data, arg){
		
		if(data.packets && data.packets.length){
			for(var x in data.packets){
				var packetitem = data.packets[x];
				var opcodeArr = b64decode(packetitem.opcode);
				var opcode = '0x';
				for(var n=0;n<opcodeArr.length;n++){
					var code = opcodeArr[n].charCodeAt().toString(16);
					opcode += (code.length==1)? '0'+code:code; 
				}
				/**
				 * 转opcode格式
				 *  opcode= /...  
				 */
				var packet = JSON.parse(packetitem.body);
				packet.opcode = opcode;
				packets.unshift(packet);
			}
			packets.sort(YYIMCookieUtil.createComparisonFunction("dateline")); //按照dateline 升序排列离线数组
			
			if(data.packets.length >= data.size){
				getOfflineMessage({id:arg.id,version:arg.version,start:data.start+data.size});
			}else{
				handleOfflinePackets(data, arg);
			}
			
		}else if(!data.packets || !data.packets.length){
			handleOfflinePackets(data, arg);
		}
	};
	
	/**
	 * 处理离线消息缓存
	 */
	function handleOfflinePackets(data, arg){
		if(packets.length){
			for(var y in packets){
				switch(packets[y].opcode){
					case '0x'+OPCODE.PRESENCE.SEND.toString(16):  //opcode == 0x3001,客户端改变自己的在线状态，或者服务器通知用户联系人的状态改变的报文
						YYIMManager.getInstance().onSubscribe({
							from: YYIMJIDUtil.getID(packets[y].from),
							type: packets[y].type
						});
						break;
					case '0x'+OPCODE.USER_MESSAGE.SEND.toString(16):;
					case '0x'+OPCODE.CHATGROUP_MESSAGE.SEND.toString(16): //opcode == 0x1010/0x1030,用户/群组
						parseMessage(packets[y],packets[y].type);
						break;
					case '0x'+OPCODE.PUBACCOUNT_MESSAGE.SEND.toString(16): //opcode == 0x1050,公众号消息
						parseMessage(packets[y],'chat');
						break;
					default:
						YYIMManager.getInstance().log('unHandle_Packet:',3,packets[y]);break;
				}
			}
			packets = [];
			_offlineMessagehandleAfter(data, arg); //处理完离线消息通知服务器端
		}
	}
	
	/**
	 * 解析历史消息
	 * 
	 * @param data ajax返回的数据
	 * @param arg {id: 对方ID, resource: 对方资源 为anonymous时表示匿名用户, chatType: 'chat' | 'groupchat', start: number, num: number, success: function, error: function}
	 */
	function _historyMessageProcessor(data, arg){
		YYIMChat.log("历史记录：data", 2, data);
		var hisMsgArr = [];
		for(var i = 0; i < data.result.length; i++){
			var hisMsgItem = {
				fromId : YYIMJIDUtil.getID(data.result[i].sender),
				toId : YYIMJIDUtil.getID(data.result[i].receiver),
				msgId : parseId(data.result[i])
			};
			if(arg.chatType && arg.chatType == 'groupchat'){
				hisMsgItem.memberId = parseResource(data.result[i]);
			}
			
			if(data.result[i].content){
				hisMsgItem.body = parseContent(data.result[i].content);
				hisMsgItem.body.dateline = data.result[i].ts;
				if(hisMsgItem.body.content && hisMsgItem.body.contentType && (hisMsgItem.body.contentType == MESSAGE_CONTENT_TYPE.IMAGE || hisMsgItem.body.contentType == MESSAGE_CONTENT_TYPE.FILE)){
					hisMsgItem.body.content.path = hisMsgItem.body.content.path ? YYIMChat.getFileUrl(hisMsgItem.body.content.path) : null;
				}
				hisMsgArr.push(hisMsgItem);
			}
		}
		
		if(YYIMCommonUtil.isFunction(arg.success)){
			arg.success({
				count: Number(data.count),
				result: hisMsgArr
			});
		}
		return;
		/**
		 * 从消息条目中获取messageID
		 */
		function parseId(item){
			if(!item.stanza)
				return item.messageID;
			var id = jQuery(item.stanza).attr('id');
			return id? id : Math.uuid();
		}
		
		/**
		 * 从历史消息中取出发送者的resource(用于群聊时获取成员的id)
		 */
		function parseResource(item){
			if(!item.stanza)
				return null;
			var _from = jQuery(item.stanza).attr('from');
			return _from? YYIMJIDUtil.getResource(_from) : null;
		}
		
		function parseContent(content) {
			if (content) {
				var body = JSON.parse(content);
				try{
					if(isNaN(Number(body.content))){ //非数字字符串继续转换 rongqb 20151014
						body.content = JSON.parse(body.content);
						if(body.content.style) {
							body.style = body.content.style;
							delete body.content.style;
						}
						if (body.content.content) {
							body.content = body.content.content;
						}
					}
				} catch (e) {
					
				}
				return body;
			}else {
				return null;
			}
		}
	};
	
	return {
		monitor : monitor,
		sendMessage : sendMessage,
		addGroupMember : addGroupMember,
		getHistoryMessage : getHistoryMessage,
		getOfflineMessage : getOfflineMessage,
		getVersion : getVersion,
		sendReceiptsPacket: sendReceiptsPacket,
		sendReadedReceiptsPacket:sendReadedReceiptsPacket
	};
})();