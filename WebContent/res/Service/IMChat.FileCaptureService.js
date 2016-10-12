///  支持屏幕截屏处理

///  rongfl 


angular.module("IMChat.FileCaptureService", [])
	.factory("fileCaptureService", [function() {
			var  b64string="";
			
			var  captureresult="error";
			
			function startCapture(a,b,c){
		    var  o=$("#screenshotPlugin")[0]; 	
		 	 o.onCaptureFail = function(err) {
				captureresult="error";
				console.log("error")
			 };
			 o.onCaptureSuccess = function(arg) {
				
				captureresult="success";
				b64string=arg;
				console.log("success")
				//console.log(b64string)
				
				
			}; 
			 o.startCapture(a,b,c);
			}
			return {
				 startCapture:function(a,b,c){
				 	
				 	startCapture(a,b,c);
				 },
				 capturefiledata:b64string,
				 captureresult:captureresult
			}

		}
	])