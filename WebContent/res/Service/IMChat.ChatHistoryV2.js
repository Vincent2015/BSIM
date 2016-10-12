/// <reference path="../../../angular/angular.min.js.map" />
/// <reference path="../../../angular/angular.min.js" />



///  聊天历史列表   rongfl


///  默认获取的就是当前用户的数据



///  chatlist  的数据模型应该为如下：

///    {
//           id："groupid   personid  subid"

//           name:"groupname  person name  subname"

//           type："group person subname",

// 			 index: default 1  ++

//             dateline
             
//             lastmess
//       }
///
///
///
///
///


angular.module("IMChat.ChatHistory.ServiceV2", ["IMChatUrl.Service", "ngStorage"])


.factory("IMChathistoryServiceV2", ["$localStorage", "urlParseService",
	function($localStorage, urlParseService) {




		if (urlParseService.pid !== undefined || urlParseService.tk != undefined) {


			if (!$localStorage["chatlist" + urlParseService.pid]) {
				$localStorage["chatlist" + urlParseService.pid] = [];
			}

		}

		var data = $localStorage["chatlist" + urlParseService.pid];
		var db = data ? db = TAFFY(data) : db = TAFFY();

		var historyChatinfo = {


			db: db,
			///  数据列表
			chatlist: db().get(),

			///  添加
			add: function(id, type, name) {

               var 	idinfo=id.toLowerCase();
				var maxindex = 1;
				if (db().max("index")) {

					maxindex = db().max("index") + 1
				}
				 
				var model = {
					id: idinfo,
					type: type,
					name: name,
					index: maxindex
				};
				
				if(id)
				{
				 db.insert(model);
				 var list = db().get();
				 
				 $localStorage["chatlist" + urlParseService.pid] = list;
				}

			},
             
            //  添加消息消息提醒
            addtimeinfo: function(id, type, name,datetime,lastmessage) {


				var maxindex = 1;
				if (db().max("index")) {

					maxindex = db().max("index") + 1
				}
				 
				var  lastinfo="文件";
				 if(lastmessage.name)
				 {
			        lastinfo="文件";
				 }
				
				else
				{
					
					lastinfo=lastmessage;
				}
			    var 	idinfo=id.toLowerCase();
				var model = {
					id: idinfo,
					type: type,
					name: name,
					index: maxindex,
					datetime:datetime,
					lastmessage:lastinfo
					
				};
				console.log(model);
				
				if(idinfo)
				{
					
					db.insert(model);
			     	var list = db().get();
				 
				    $localStorage["chatlist" + urlParseService.pid] = list;
					
				}
				

			},
			///  删除
			remove: function(id) {

				db({
					id: id
				}).remove();
				var list = db().get();
				 
				 console.log(db().get());
				$localStorage["chatlist" + urlParseService.pid] = list;

			},

			updateindex: function(id) {

				db({
					id: id
				}).update({
					index: db().max("index") + 1
				});
				var list = db().get();
				$localStorage["chatlist" + urlParseService.pid] = list;

			},
            addinfoorupdate:function(id,type,name,datetime,lastmessage){
            	 
        	   var  lastinfo="文件";
				 if(lastmessage.name)
				 {
			        lastinfo="文件";
				 }
				
				else
				{
					lastinfo=lastmessage;
				}
				
				var idinfo=id.toLowerCase();
            	 var info = db({
					id: idinfo
				}).count();
				if (info > 0) {
 
					console.log("update")
					console.log("update dd")
				    console.log(name,datetime,lastinfo);
					db({id:id}).update({name:name,datetime:datetime,lastmessage:lastinfo});
					this.updateindex(id);
					console.log("update dd")
					 
				} else {
					console.log("add")
					this.addtimeinfo(id, type, name,datetime,lastinfo);
				}
            	
           },
           
           updatetype:function(id,type,name){
           	   var info = db({
					id: id
				}).count();
				if (info > 0) {
					  console.log("update")
					  db({id:id}).update({name:name,type:type});
					  this.updateindex(id);
				}
           },
            updatepubname:function(id,name){
           	   var info = db({
					id: id
				}).count();
				if (info > 0) {
					 
					 if(name)
					 {
					  console.log("update")
					  db({id:id}).update({name:name,type:"pubaccount"});
					 	
					 }
					
					 
				}
           },
			addorupdate: function(id, type, name) {
				
				var idinfo=id.toLowerCase();
				var info = db({
					id: idinfo
				}).count();
				if (info > 0) {
 
					console.log("update")
					if(name.indexOf("未知")==-1)
					{
					 db({id:id}).update({name:name});
					 this.updateindex(id);
					}
					else
					{
					 this.updateindex(id);
					}
				} else {
					console.log("add")
					
					var idinfo=id.toLowerCase();
					this.add(idinfo, type, name);
				}
			},
			save: function() {


			}
		};

		return historyChatinfo;



	}
])