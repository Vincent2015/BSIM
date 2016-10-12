angular.module("IMChat.NWKeyService",[])
.factory("NWKeyService",[function(){
     var useragent=window.navigator.userAgent;
     var ismac=  window.navigator.userAgent.indexOf('Mac')>-1 ?true:false;
     var iswin=window.navigator.userAgent.indexOf('Windows')>-1 ?true:false;
     var islinux=window.navigator.userAgent.toLowerCase().indexOf('linux')>-1 ?true:false;
    return  {
	  	 ismac:ismac,
	  	 iswin:iswin,
	  	 islinux:(!iswin)&&(!ismac),
	  	 useragent:useragent
  }
}])
