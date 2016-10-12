//  封装关于打开掌上用友应用的处理




angular.module("IMChat.AppService",["IMChat.DataProtect","IMChatUrl.Service"])

.factory("appopenService",["dataProtectService","urlParseService",function(dataProtectService,urlParseService){

  var  time=new Date();
  var  ts=time.getFullYear()+"-"+(time.getMonth()+1)+"-"+time.getDate();
  var  prefix="http://h.yonyou.com/pcim_app.aspx?p=";
  return  {
  	navUrl:function(appid){
  		 var  tep=appid+","+urlParseService.pid+","+ts;
  		 var  url=dataProtectService.DESEncrypt(tep);
  		 return prefix+url;
  	},
  	
  	canuseApp:[
  	{
  		appid:"",
  		
  		appname:"工资查询",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"审批中心",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"员工自助",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"项目工时",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"资源申请",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"友课堂",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"工资+",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"嘟嘟",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"我的任务",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"友问友答",
  		
  		imgsrc:"",
  	},
  	{
  		appid:"",
  		
  		appname:"UDN社区",
  		
  		imgsrc:"",
  	}
  	]
  	
  	
  }
}])



