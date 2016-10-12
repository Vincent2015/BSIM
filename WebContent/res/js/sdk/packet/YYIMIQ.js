var YYIMIQ = (function(){
	// VCard相关的IQ包
	var vcardIQ = (function() {
		
		/**
		 * 请求自己或好友的VCard
		 * 
		 * @param arg
		 * 	{
		 * 		jid : 为空则请求自己的VCard,
		 * 		success : function,
		 * 		error : function,
		 * 		complete : function
		 *  }
		 */
		function getVCard(arg) {
			var iqBody = {
				type : TYPE.GET
			}
			
			YYIMCommonUtil.isStringAndNotEmpty(arg.jid)? iqBody.to = arg.jid : null;
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.VCARD.SEND), function(vcardResult, _arg) {
				_arg.complete && _arg.complete();
				var vcard = vcardResult.vcard || {};
				_arg.success && _arg.success({
					email : vcard.email,
					mobile : vcard.mobile,
					nickname : vcard.nickname,
					photo : vcard.photo,
					telephone: vcard.telephone,
					userId : YYIMJIDUtil.getID(vcard.username)
				});
			}, arg);
		}
		
		/**
		 * 请求自己所有好友的VCard
		 * 
		 * @param arg
		 * {
		 * 		success : function,
		 * 		error : function,
		 * 		complete : function
		 * }
		 */
		function getVCards(arg) {
			var iqBody = {
				type : 'roster'
			};
			
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.VCARDS.SEND), function(vcardsResult, _arg) {
				var results = vcardsResult.vcards || [];
					vcards = [],
					i = results.length;
				while(i--) {
					var vcard = results[i];
					vcards.push({
						email : vcard.email,
						mobile : vcard.mobile,
						nickname : vcard.nickname,
						photo : vcard.photo,
						userId : YYIMJIDUtil.getID(vcard.username)
					});
				}
				_arg.complete && _arg.complete();
				_arg.success && _arg.success(vcards);
			}, arg);
			
		}
		
		/**
		 * 修改当前用户的VCard
		 * @param arg {
		 * 		vcard : {
		 * 			nickname,
		 * 			photo,
		 * 			email,
		 * 			mobile,
		 * 			telephone
		 * 		},
		 * 		success : function,
		 * 		error : fcuntion
		 * }
		 */
		function setVCard(arg) {
			YYIMConnection.getInstance().send(new JumpPacket({
				type : TYPE.SET,
				vcard : arg.vcard
			}, OPCODE.VCARD.SEND), function(vcardResult, _arg) {
				_arg.complete && _arg.complete();
				_arg.success && _arg.success();
			}, arg);
		}
		
		return {
			getVCard : getVCard,
			setVCard : setVCard,
			getVCards : getVCards
		};
	})();
	
	// 好友相关的IQ包
	var rosterIQ = (function() {
		/**
		 * 请求好友列表
		 * @param arg {success: function, error: function, complete:function}
		 */
		function getRosterItems(arg) {
			var jumpPacket = new JumpPacket({}, OPCODE.ROSTER_LIST.SEND);

			YYIMConnection.getInstance().send(jumpPacket, function(rosterListPacket, _arg) {
				if(!_arg)
					return;
				
				_arg.complete && _arg.complete();
				
				// if error
				// _arg.error && _arg.error("获取好友列表失败");
				// return;
				// else
				
				var items = rosterListPacket.items;
				if((items && items.length || 0) === 0)
					return;
				var rosters = [], i = items.length;
				while(i--) {
					var item = items[i],
						jid = item.jid,
						roster = {
							id: YYIMJIDUtil.getID(jid),
							resource: YYIMJIDUtil.getResource(jid),
							ask: item.ask,
							name: item.name,
							photo: item.photo,
							subscription: item.subscription,
							group: item.groups
						};
					if(YYIMJIDUtil.getDomain(jid) !== YYIMConfiguration.DOMAIN.PUBACCOUNT)
						rosters.push(roster);
				}
				_arg.success && _arg.success(JSON.stringify(rosters));
			}, arg);
		}
		
		/**
		 * 删除好友, 需要合法的jid
		 * @param arg {jid: string, success: function, error: function,complete: function}
		 */
		function deleteRosterItem(arg) {
			var iqBody = {
				type : TYPE.SET,
				ns : NS_ROSTER,
				item : {
					jid : arg.jid,
					subscription : 'remove'
				}
			};
			
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.UPDATE_ROSTER.SEND), function(deleteResult, _arg) {
				_arg.complete && _arg.complete();
				_arg.success && _arg.success(YYIMJIDUtil.getID(_arg.jid));
			}, arg);
		}
		
		/**
		 * 更新好友
		 * @param arg {
		 * 		roster : {
		 * 			jid : 好友jid,
		 * 			name : 好友昵称,
		 * 			groups : ["group1","group2"] // 好友所在分组
		 * 		},
		 * 		success : function,
		 * 		error : function
		 * }
		 */
		function updateRosterItem(arg) {
			var roster = arg.roster,
				iqBody = {
					item : {
						jid :roster.jid, 
						name : YYIMCommonUtil.isStringAndNotEmpty(roster.name)? roster.name : YYIMJIDUtil.getID(roster.jid),
						groups : []
					}
				},
				groups = roster.groups,
				i = groups? groups.length : 0;
			while(i-- && YYIMCommonUtil.isStringAndNotEmpty(groups[i]))
				iqBody.item.groups = iqBody.item.groups.concat(groups[i]);
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.UPDATE_ROSTER.SEND), function(updateResult, _arg) {
				_arg.complete && _arg.complete();
				_arg.success && _arg.success();
			}, arg);
		}
		
		/**
		 * 查找好友[roster][包括好友和非好友]，查询字段：userName, name
		 * @param arg {keyword, start, size, success: function, error: function,complete: function}
		 */
		function queryRosterItem(arg) {
			var iqBody = {
				start : YYIMCommonUtil.isNumber(arg.start)? arg.start : 0,
				size : 	YYIMCommonUtil.isNumber(arg.size)? arg.size : 20,
				fields : ["Username","Name"],
				search : arg.keyword
			};
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.QUERY_USER.SEND), function(queryResult, _arg) {
				var items = queryResult.items || [], 
					result = [], 
					i = items.length; 
				while(i--) {
					var item = items[i],
						jid = item.jid;
					if(jid === YYIMManager.getInstance().getUserBareJID())
						continue;
					result.push({
						id : YYIMJIDUtil.getID(jid),
						name : YYIMCommonUtil.isStringAndNotEmpty(item.name)? item.name : YYIMJIDUtil.getID(jid),
						photo : item.photo,
						email : item.email
					});
				}
				_arg.complete && _arg.complete();
				_arg.success && _arg.success({
					start : queryResult.start,
					total : queryResult.total,
					items : result
				});
			}, arg);
			
		}
		
		return {
			getRosterItems : getRosterItems,
			deleteRosterItem : deleteRosterItem,
			queryRosterItem : queryRosterItem,
			updateRosterItem : updateRosterItem
		};
	})();
	
	// 群组相关的IQ包
	var chatGroupIQ = (function() {
		function getChatGroups(arg) {
			var jumpPacket = new JumpPacket({}, OPCODE.CHATGROUP_LIST.SEND);

			YYIMConnection.getInstance().send(jumpPacket, function(chatGroupListPacket, _arg) {
				if(!_arg)
					return;
				
				_arg.complete && _arg.complete();
				
				// if error
				// _arg.error && _arg.error("获取群列表失败");
				// return;
				// else
				var items = chatGroupListPacket.items;
				if((items && items.length || 0) === 0)
					return;
				var chatGroups = [], i = items.length;
				while(i--) {
					var item = items[i];
					var jid = item.jid;
					var chatGroup = {
						id: YYIMJIDUtil.getID(jid),
						name: item.name,
						photo: item.photo
					};
					chatGroups.push(chatGroup);
				}
				_arg.success && _arg.success(JSON.stringify(chatGroups));
			}, arg);
		}
		/**
		 * 查找群
		 * @param arg {keyword, start, size, success: function, error: function,complete: function}
		 */
		function queryChatGroup(arg) {
			var iqBody = {
				start : YYIMCommonUtil.isNumber(arg.start)? arg.start : 0,
				size : 	YYIMCommonUtil.isNumber(arg.size)? arg.size : 20,
				search : arg.keyword
			};
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.QUERY_CHATGROUP.SEND), function(queryResult, _arg) {
				var items = queryResult.items || [], 
					result = [], 
					i = items.length;
				while(i--) {
					var item = items[i],
						jid = item.jid;
					result.push({
						id : YYIMJIDUtil.getID(jid),
						name : YYIMCommonUtil.isStringAndNotEmpty(item.name)? item.name : YYIMJIDUtil.getID(jid)
					});
				}
				_arg.complete && _arg.complete();
				_arg.success && _arg.success({
					start : queryResult.start,
					total : queryResult.total,
					items : result
				});
			}, arg);
		}
		
		/**
		 * 群组表单配置, 需要合法的jid
		 * @param arg {name, desc[optional], jid, photo[optional],success: function, error: function, complete:function}
		 */
		function configChatGroup(arg) {
			var iqBody = {
				to : arg.jid,
				roomname : arg.name,
				roomdesc : arg.desc,
				persistent : 1,
				owners : [YYIMManager.getInstance().getUserBareJID()],
				etp : YYIMConfiguration.MULTI_TENANCY.ETP_KEY,
				app : YYIMConfiguration.MULTI_TENANCY.APP_KEY
			};
			if(YYIMCommonUtil.isStringAndNotEmpty(arg.photo)) {
				iqBody.photo = arg.photo;
			}
			

			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.CONFIG_CHATGROUP.SEND), function(configResult, _arg) {
				_arg.complete && _arg.complete();
				_arg.success && _arg.success();
			}, arg);

		}
		
		/**
		 * 获取群组信息
		 * @param arg {jid : 群组的jid, success : function, error : function}
		 */
		function getChatGroupInfo (arg) {
			var iqBody = {
				to : arg.jid,
				type : TYPE.GET,
				ns : NS_DISCO_INFO
			};
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.CHATGROUP_INFO.SEND), function(infoResult, _arg) {
				_arg.complete && _arg.complete();
				var name = infoResult.roomname? infoResult.roomname : YYIMJIDUtil.getID(_arg.jid),
					desc = infoResult.description;
				
				_arg.success && _arg.success({
					name : name,
					desc : desc
				});
			}, arg);
		}
		
		/**
		 * 获取指定群组的共享文件
		 * 
		 * @param arg {jid: 群组jid, start: int, size: int, success: function, error: function, complete: function}
		 */
		function getSharedFiles(arg) {
			var iqBody = {
				to : arg.jid,
				start : arg.start,
				size : arg.size
			};
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.CHATGROUP_SHARED_FILES.SEND), function(sharedFilesResult, _arg) {
				_arg.complete && _arg.complete();
				var returnObj = {
					start : sharedFilesResult.start,
					total : sharedFilesResult.total,
					files : []
				};
					files = sharedFilesResult.files || [],
					i = files.length;
					
				while(i--) {
					var file = files[i];
					returnObj.files.push({
						attachId : file.id,
						name : file.name,
						type : file.type,
						size : file.size,
						createTime : file.createTime,
						creator : YYIMJIDUtil.getID(file.creator),
						downloads : file.downloads
					});
				}
				
				_arg.success && _arg.success(returnObj);
			}, arg);
		}
	
		return {
			queryChatGroup : queryChatGroup,
			configChatGroup : configChatGroup,
			getChatGroups : getChatGroups,
			getChatGroupInfo : getChatGroupInfo,
			getSharedFiles : getSharedFiles
		};
	})();
	
	// 群成员相关的IQ包
	var chatGroupMemberIQ = (function(){
		/**
		 * 获取指定群的群成员[chatroom]
		 * @param arg {jid: string, success: function, error: function,complete: function}
		 */
		function getGroupMembers(arg) {
			YYIMConnection.getInstance().send(new JumpPacket({
				type : TYPE.GET,
				ns : NS_DISCO_ITEMS,
				to : arg.jid
			}, OPCODE.CHATGROUP_MEMBER_LIST.SEND), function(memberListResult, _arg) {
				if(!_arg)
					return;
				
				_arg.complete && _arg.complete();
				
				// if error
				// _arg.error && _arg.error("获取群成员列表失败");
				// return;
				// else
				var items = memberListResult.items;
				if((items && items.length || 0) === 0)
					return;
				var members = [], i = -1, size = items.length;
				while(++i < size) {
					var item = items[i],
						jid = item.jid;
					members.push({
						id: YYIMJIDUtil.getID(jid),
						name: item.name,
						photo: item.photo,
						affiliation : item.affiliation
					});
				}
				
				_arg.success && _arg.success(JSON.stringify(members));
			}, arg);
			
		}
		
		return {
			getGroupMembers : getGroupMembers
		};
	})();
	
	// 公共号相关的IQ包
	var pubaccountIQ = (function() {
		/**
		 * 查询自己所关注的公共号
		 * @param arg {success: function, error: function, complete:function}
		 */
		function getPubAccountItems(arg) {
			var jumpPacket = new JumpPacket({
				type : TYPE.GET,
				ns : NS_PUBACCOUNT,
				to : YYIMConfiguration.DOMAIN.PUBACCOUNT
			}, OPCODE.PUBACCOUNT_LIST.SEND);

			YYIMConnection.getInstance().send(jumpPacket, function(pubaccountListResult, _arg){
				if(!_arg)
					return;
				
				_arg.complete && _arg.complete();
				
				// if error
				// _arg.error && _arg.error('获取公共号列表失败');
				// return
				// else
				
				var items = pubaccountListResult.items;
				if((items && items.length || 0) === 0)
					return;
				var pubaccounts = [], i = items.length;
				while(i--) {
					var item = items[i];
					var jid = item.jid;
					var pubaccount = {
						id: YYIMJIDUtil.getID(jid),
						resource: YYIMJIDUtil.getResource(jid),
						name: item.name,
						photo: item.photo
					};
					pubaccounts.push(pubaccount);
				}
				
				_arg.success && _arg.success(JSON.stringify(pubaccounts));
			}, arg);
		}
		
		/**
		 * 查找公共号
		 * @param arg {keyword, start, size, success: function, error: function,complete: function}
		 */
		function queryPubaccount(arg) {
			var iqBody = {
				start : YYIMCommonUtil.isNumber(arg.start)? arg.start : 0,
				size : 	YYIMCommonUtil.isNumber(arg.size)? arg.size : 20,
				fields : ["Accountname","Name"],
				search : arg.keyword
			};
			YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.QUERY_PUBACCOUNT.SEND), function(queryResult, _arg) {
				var items = queryResult.items || [], 
					result = [], 
					i = items.length;
				while(i--) {
					var item = items[i],
						jid = item.jid;
					result.push({
						id : YYIMJIDUtil.getID(jid),
						name : YYIMCommonUtil.isStringAndNotEmpty(item.name)? item.name : YYIMJIDUtil.getID(jid)
					});
				}
				_arg.complete && _arg.complete();
				_arg.success && _arg.success({
					start : queryResult.start,
					total : queryResult.total,
					items : result
				});
			}, arg);
			
		}
		
		return {
			getPubAccountItems : getPubAccountItems,
			queryPubaccount : queryPubaccount
		};
	})();
	
	var syncIQ = (function () {
		
		/**
		 * 全量同步好友列表到IMServer
		 * 
		 * @param addList [{jid1, name2}, {jid2, name2} ,...]
		 */
		function fullSyncRoster(addList) {
			YYIMConnection.getInstance().send(new JumpPacket({
				submits : addList
			}, OPCODE.FULL_SYNC_ROSTER.SEND));
		}
		
		/**
		 * 增量同步好友列表到IMServer
		 * 
		 * @param removeList [jid1, jid2]
		 * @param addList [{jid3, name3}, {jid4, name4}, ...]
		 */
		function deltaSyncRoster(removeList, addList) {
			var iqBody ={};
			if(removeList.length > 0)
				iqBody.removes = removeList;
			if(addList.length > 0)
				iqBody.sets = addList;
			
			if(removeList.length > 0 || addList.length > 0) {
				YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.DELTA_SYNC_ROSTER.SEND));
			}
		}
		
		/**
		 * 全量同步群列表到IMServer
		 * 
		 * @param addList [{id1, name2}, {id2, name2} ,...]
		 */
		function fullSyncChatGroup(addList) {
			YYIMConnection.getInstance().send(new JumpPacket({
				submits : addList
			}, OPCODE.FULL_SYNC_CHATGROUP.SEND));
		}
		
		/**
		 * 增量同步群列表到IMServer
		 * 
		 * @param removeList [id1, id2]
		 * @param addList [{id3, name3}, {id4, name4}, ...]
		 */
		function deltaSyncChatGroup(removeList, addList) {
			var iqBody ={};
			if(removeList.length > 0)
				iqBody.removes = removeList;
			if(addList.length > 0)
				iqBody.sets = addList;
			
			if(removeList.length > 0 || addList.length > 0) {
				YYIMConnection.getInstance().send(new JumpPacket(iqBody, OPCODE.DELTA_SYNC_CHATGROUP.SEND));
			}
		}
		
		return {
			fullSyncRoster : fullSyncRoster,
			deltaSyncRoster : deltaSyncRoster,
			fullSyncChatGroup : fullSyncChatGroup,
			deltaSyncChatGroup : deltaSyncChatGroup
		};
	})();
	/**
	 * 监控iq包
	 */
	function monitor() {
		var _conn = YYIMConnection.getInstance();
		
		// 好友删除, 修改, 增加
		_conn.registerHandler(OPCODE.UPDATE_ROSTER.KEY, function(packet) {
			var item = packet.item, id = YYIMJIDUtil.getID(packet.item.jid);
			// 好友添加成功或好友信息更新
			if(item.subscription === 'both') {
				_logger.log('update or add: ' + JSON.stringify(item));
				YYIMManager.getInstance().onRosterUpdateded({
					id : id,
					name : item.name,
					groups : item.groups
				});
			}
			// 好友删除成功或被对方删除
			else if(item.subscription === 'none') {
				_logger.log('delete: ' + JSON.stringify(item));
				YYIMManager.getInstance().onRosterDeleted(id);
			}
			// 删除成功后会受到关系为none的包, remove无需再操作
			else if(item.subscription === 'remove') {
				// do nothing
			}
			
			///////// 为兼容旧DEMO, onSubscribe依然接受好友的更新删除增加等
			///////// TODO delete later
			/*YYIMManager.getInstance().onSubscribe({
				from: id,
				type: item.subscription,
				name: item.name,
				ask: item.ask,
				group: item.groups
			});*/
			
		});
	}
	
	return {
		monitor : monitor,
		
		// VCard
		getVCard : vcardIQ.getVCard,
		setVCard : vcardIQ.setVCard,
		getVCards : vcardIQ.getVCards,
		
		// roster
		getRosterItems : rosterIQ.getRosterItems,
		deleteRosterItem : rosterIQ.deleteRosterItem,
		queryRosterItem : rosterIQ.queryRosterItem,
		updateRosterItem : rosterIQ.updateRosterItem,
		
		// chatGroup
		queryChatGroup : chatGroupIQ.queryChatGroup,
		configChatGroup : chatGroupIQ.configChatGroup,
		getChatGroups : chatGroupIQ.getChatGroups,
		getChatGroupInfo : chatGroupIQ.getChatGroupInfo,
		getSharedFiles : chatGroupIQ.getSharedFiles,
		
		// chatGroupMember
		getGroupMembers : chatGroupMemberIQ.getGroupMembers,
		
		// pubaccount
		getPubAccountItems : pubaccountIQ.getPubAccountItems,
		queryPubaccount : pubaccountIQ.queryPubaccount,
		
		// sync
		fullSyncRoster : syncIQ.fullSyncRoster,
		deltaSyncRoster : syncIQ.deltaSyncRoster,
		fullSyncChatGroup : syncIQ.fullSyncChatGroup,
		deltaSyncChatGroup : syncIQ.deltaSyncChatGroup
	};
})();