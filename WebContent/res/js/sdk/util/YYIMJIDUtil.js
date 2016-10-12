/**
 * jid相关的工具类，包含处理jid的相关静态方法
 * 
 * @Class YYIMJIDUtil
 */
var YYIMJIDUtil = {};

/**
 * 返回bareJid
 * 如果是设备（node同user的node），则返回全jid
 * 
 * @deprecated since version 2.0, use YYIMJIDUtil.buildUserJID or YYIMJIDUtil.buildChatGroupJID instead
 * 
 * @param {string | JSJaCJID|SNSRoster} 被处理的jid
 * @throws JSJaCJIDInvalidException Thrown if jid is not valid
 */
YYIMJIDUtil.getBareJID = function(jid) {
	var userBareJid = YYIMManager.getInstance().getUserBareJID();
	var tmpJid;
	if (jid) {
		if (jid instanceof JSJaCJID) {
			if(jid.getBareJID() == userBareJid)
				return jid.toString();
			return jid.getBareJID();
		} else if (typeof jid == "string") {
			tmpJid = new JSJaCJID(jid);
			if(tmpJid.getBareJID() == userBareJid)
				return tmpJid.toString();
			return tmpJid.getBareJID();
		} else if (jid.jid && jid.jid instanceof JSJaCJID) {
			tmpJid = jid.jid;
			if(tmpJid.getBareJID() == userBareJid)
				return tmpJid.toString();
			return tmpJid.getBareJID();
		}
	}
	throw new JSJaCJIDInvalidException("invalid jid: " + jid);
};

/**
 * 根据id或node或jid获取id
 */
YYIMJIDUtil.getID = function(jid) {
	var appkey, tmp, index;
	return YYIMCommonUtil.isStringAndNotEmpty(jid)? 
			(appkey = YYIMManager.getInstance().getAppkey(), index = jid.indexOf('@'), index != -1 ? 
				(tmp = jid.substring(0, index), tmp.indexOf(appkey) > 0 ?
						tmp.replace(appkey,'') 
						: tmp )/*全的jid*/ 
				: (jid.indexOf(appkey) > 0 ? 
						jid.replace(appkey,'') 
						: jid)/*node或id*/) 
			: null;
};

/**
 * 根据id或node或jid获取node
 */
YYIMJIDUtil.getNode = function(jid) {
	var appkey;
	return YYIMCommonUtil.isStringAndNotEmpty(jid)?
			(appkey = YYIMManager.getInstance().getAppkey(), jid.indexOf('@') != -1 ?
					/*全的jid*/jid.substring(0, jid.indexOf('@')) 
					: /*node或id*/(jid.indexOf(appkey) > 0 ?
							jid 
							: jid + appkey))
			: null;
};

/**
 * 根据jid获取resource
 */
YYIMJIDUtil.getResource = function(jid) {
	return YYIMCommonUtil.isStringAndNotEmpty(jid) ?
			(jid.indexOf('/') != -1?
					jid.substring(jid.indexOf('/') + 1) 
					: null) 
			: null;
};

/**
 * 根据用户的id/node/jid和resource获取新的jid
 * 
 * @param idOrJid id, node, jid (e.g. yuenoqun, yuenoqun.app.etp@server)
 * @param resource e.g. pc
 * 
 * @returns yuenoqun.app.etp@server/pc or yuenoqun.app.etp@server when resource is null
 */
YYIMJIDUtil.buildUserJID = function(idOrJid, resource) {
	return YYIMCommonUtil.isStringAndNotEmpty(idOrJid)? 
			(idOrJid.indexOf('@') != -1? 
					idOrJid 
					: idOrJid + '@' + YY_IM_DOMAIN + (
							resource? 
									'/' + resource 
									: '')) 
			: null;
};

/**
 * 根据jid返回域
 */
YYIMJIDUtil.getDomain = function(jid) {
	return YYIMCommonUtil.isStringAndNotEmpty(jid) ? 
			(jid.indexOf('@') != -1? 
					jid.substring(jid.indexOf('@') + 1) 
					: null)
			: null;
};

/**
 * 根据群组的id/node/jid获取新的jid
 * 
 * @param idOrJid id, node, jid (e.g. huashan, huashan.app.etp, huashan.app.etp@conference.server)
 * 
 * @returns huashan.app.etp@conference.server
 */
YYIMJIDUtil.buildChatGroupJID = function(idOrJid) {
	return YYIMCommonUtil.isStringAndNotEmpty(idOrJid)? 
			(idOrJid.indexOf('@') != -1? 
					idOrJid 
					: idOrJid + '@' + YYIMConfiguration.DOMAIN.CHATROOM) 
			: null;
};

/**
 * 根据公共号的id/node/jid获取新的jid
 * 
 * @param idOrJid id, node, jid (e.g. huashan, huashan.app.etp, huashan.app.etp@pubaccount.server)
 * 
 * @returns huashan.app.etp@pubaccount.server
 */
YYIMJIDUtil.buildPubAccountJID = function(idOrJid) {
	return YYIMCommonUtil.isStringAndNotEmpty(idOrJid)? 
			(idOrJid.indexOf('@') != -1? 
					idOrJid 
					: idOrJid + '@' + YYIMConfiguration.DOMAIN.PUBACCOUNT) 
			: null;
};