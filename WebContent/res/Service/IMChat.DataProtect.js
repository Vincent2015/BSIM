
///  数据加密处理

///  rongfl 


angular.module("IMChat.DataProtect",[])
.factory("dataProtectService",[function(){
	
//	var crypto = require('crypto');
//   var gui = require('nw.gui');
//   var maifile= gui.App.manifest;
//   var key=maifile;
//   var passkey=key.passkey;
//   var buffinfo=new Buffer([18,52,86,120,144,171,205,239]); 
//	function cipher(algorithm, key,iv, buf){
//	    var encrypted = "";
//	    var cip = crypto.createCipheriv(algorithm,key,iv);
//		 cip.setAutoPadding(true);
//	    encrypted += cip.update(buf, 'utf8', 'base64');
//	    encrypted += cip.final('base64');
//	    
//	   return encrypted;
//	}
//	//解密
//	function decipher(algorithm, key,iv, encrypted){
//	    var decrypted = "";
//	    var decipher = crypto.createDecipheriv(algorithm, key,iv);
//		decipher.setAutoPadding(true);
//	    decrypted += decipher.update(encrypted, 'base64', 'utf8');
//	    decrypted += decipher.final('utf8');
//	    return  decrypted;
//	}
    return  {
  	  DESEncrypt:function(inputtext){
  	    return 	"";
  	  },
  	  DESDecrypt:function(inputtext){
  	  	
  	    return  "";
  	  }
  }
	
	
}])
