angular.module('CommonService', [])

.factory("SearchService", [function () {
	
	function queryParam(arg){
		return {
				keyword: arg.keyword,
				success:function(result){
					arg.success && arg.success(result);
				},
				error:function(){
					arg.error && arg.error();
				}
			};
	}
	
	
	return {
		'roster':function(arg){
			YYIMChat.queryRosterItem(queryParam(arg));
		},
		'group':function(arg){
			YYIMChat.queryChatGroup(queryParam(arg));
		},
		'pubaccount':function(arg){
			YYIMChat.queryPubaccount(queryParam(arg));
		},
	};
}])
