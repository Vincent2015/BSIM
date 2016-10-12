/**
 * 包头大小
 */
var PACKET_HEADER_SIZE = 13;

/**
 * 由opcode得到包的key
 */
var OPCODE_MAP = {
	RECV : new SNSBaseList(),
	SEND : new SNSBaseList()
};

/**
 * [start, end)
 */
function _Range(start, end) {
	this.START = start;
	this.END = end;
	this.SIZE = end - start;
}

/**
 * 操作码, 每新增一个同时会向OPCODE_MAP中更新
 */
function _Opcode(key, send, recv) {
	this.KEY = key;
	this.SEND = send;
	this.RECV = !!recv? recv : send;
	OPCODE_MAP.SEND.add(this.SEND, this.KEY);
	OPCODE_MAP.RECV.add(this.RECV, this.KEY);
}

/**
 * 操作码
 */
var OPCODE = {
	/**
	 * 认证
	 * @type {_Opcode}
	 */
	AUTH : new _Opcode('auth', 0x0001),
	/**
	 * @type {_Opcode}
	 */
	PING : new _Opcode('ping', 0x0002),
	
	/**
	 * 发送&接收消息回执
	 * @type {_Opcode}
	 */
	RECEIPTS : new _Opcode('receipts', 0x1002),
	
	/**
	 * 发送&接收好友消息
	 * @type {_Opcode}
	 */
	USER_MESSAGE : new _Opcode('userMessage', 0x1010),

	/**
	 * 发送&接收群组消息
	 * @type {_Opcode}
	 */
	CHATGROUP_MESSAGE : new _Opcode('chatGroupMessage', 0x1030),
	
	/**
	 * 发送&接收公共号消息
	 * @type {_Opcode}
	 */
	PUBACCOUNT_MESSAGE : new _Opcode('pubaccountMessage', 0x1050),
	
	/**
	 * 发送&接收回执
	 * @type {_Opcode}
	 */
	RECEIPTS : new _Opcode('receipts', 0x1002),
	
	/**
	 * 接收新消息通知
	 * @type {_Opcode}
	 */
	NOTIFY_MESSAGE : new _Opcode('notifyMessage', 0x1003),
	
	/**
	 * 邀请用户加入群组
	 * @type {_Opcode}
	 */
	INVITE_USERS : new _Opcode('inviteUsers', 0x1301),
	
	/**
	 * 请求&返回VCard
	 * @type {_Opcode}
	 */
	VCARD : new _Opcode('vcard', 0x2011),
	
	/**
	 * 请求&返回所有好友的VCard
	 * @type {_Opcode}
	 */
	VCARDS : new _Opcode("vcards", 0x2011, 0x2012),
	
	/**
	 * IQ请求的结果报文
	 * @type {_Opcode}
	 */
	IQ_RESULT : new _Opcode('iqResult', 0x2021),
	
	/**
	 * 搜索用户&搜索结果
	 * @type {_Opcode}
	 */
	QUERY_USER : new _Opcode('queryUser', 0x2110, 0x2111),
	
	/**
	 * 搜索群组&搜索结果
	 * @type {_Opcode}
	 */
	QUERY_CHATGROUP : new _Opcode('queryChatGroup', 0x2130, 0x2131),

	/**
	 * 搜索公共号&搜索结果
	 * @type {_Opcode}
	 */
	QUERY_PUBACCOUNT : new _Opcode('queryPubaccount', 0x2150, 0x2151),
	
	/**
	 * 请求&返回好友列表
	 * @type {_Opcode}
	 */
	ROSTER_LIST : new _Opcode('rosterList', 0x2220, 0x2221),
	
	/**
	 * 请求&返回群组列表
	 * @type {_Opcode}
	 */
	CHATGROUP_LIST : new _Opcode('chatGroupList', 0x2230, 0x2231),
	
	/**
	 * 请求&返回群成员列表
	 * @type {_Opcode}
	 */
	CHATGROUP_MEMBER_LIST : new _Opcode('chatGroupMemberList', 0x2240, 0x2241),
	
	/**
	 * 请求&返回公共号列表
	 * @type {_Opcode}
	 */
	PUBACCOUNT_LIST : new _Opcode('pubaccountList', 0x2250, 0x2251),
	
	/**
	 * 请求&返回群组信息
	 * @type {_Opcode}
	 */
	CHATGROUP_INFO : new _Opcode('chatGroupInfo', 0x2330, 0x2331),
	
	CHATGROUP_SHARED_FILES : new _Opcode('chatGroupSharedFiles', 0x2332, 0x2333),
	
	/**
	 * 更新好友&更新结果
	 * @type {_Opcode}
	 */
	UPDATE_ROSTER : new _Opcode('updateRoster', 0x2520),
	
	/**
	 * 修改群组配置&修改结果
	 * @type {_Opcode}
	 */
	CONFIG_CHATGROUP : new _Opcode('chatGroupConfig', 0x2530, 0x2531),

	/**
	 * 全量同步好友列表
	 * @type {_Opcode}
	 */
	FULL_SYNC_ROSTER : new _Opcode('fullSyncRoster', 0x2720),
	
	/**
	 * 增量同步好友列表
	 * @type {_Opcode}
	 */
	DELTA_SYNC_ROSTER : new _Opcode('deltaSyncRoster', 0x2722),
	
	/**
	 * 全量同步群组列表
	 * @type {_Opcode}
	 */
	FULL_SYNC_CHATGROUP : new _Opcode('fullSyncChatGroup', 0x2730),
	
	/**
	 * 增量同步群组列表
	 * @type {_Opcode}
	 */
	DELTA_SYNC_CHATGROUP : new _Opcode('deltaSyncChatGroup', 0x2732),
	
	/**
	 * [二合一]出席信息&订阅
	 * @type {_Opcode}
	 */
	PRESENCE : new _Opcode("presence", 0x3001),
	
	/**
	 * 加入群组&退出群租&创建群组第一步
	 * @type {_Opcode}
	 */
	CHATGROUP : new _Opcode("chatGroup", 0x3301, 0x3302),
	
	/**
	 * 群主删除群成员
	 * @type {_Opcode}
	 */
	DEL_GROUPMEMBER : new _Opcode('delGroupMember', 0x2640),
	
	/**
	 * packet error
	 * @type {_Opcode}
	 */
	PACKET_ERROR : new _Opcode('packetError', 0x4000),

	/**
	 * stream error
	 * @type {_Opcode}
	 */
	STREAM_ERROR : new _Opcode('streamError', 0x4100),
	
	/**
	 * 消息包的范围
	 * @type {_Range}
	 */
	MESSAGE_RANGE : new _Range(0x1000, 0x2000),
	
	/**
	 * IQ包的范围
	 * @type {_Range}
	 */
	IQ_RANGE : new _Range(0x2000, 0x3000),
	
	/**
	 * Presence包的范围
	 * @type {_Range}
	 */
	PRESENCE_RANGE : new _Range(0x3000, 0x4000)
};

/**
 * 包结构: 每个片段所在位置
 */
var PACKET_STRUCT = {
	/**
	 * 控制帧
	 */
	CONSOLE_FRAME : new _Range(0, 1),
	
	/**
	 * 操作码 {@see OPCODE}
	 */
	OPCODE : new _Range(1, 3),
	
	/**
	 * 包的长度
	 */
	PACKET_LEN : new _Range(3, 7),
	
	/**
	 * 版本
	 */
	VERSION : new _Range(7, 9),
	
	/**
	 * 序列号
	 */
	SEQ_ID : new _Range(9, 13)
};
