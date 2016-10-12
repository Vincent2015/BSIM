///  截图快捷键

///  rongfl 


angular.module("IMChat.ShortCut", ["ngDialog"])
	.factory("shortCutService", ["ngDialog", "$rootScope", function(ngDialog, $rootScope) {
 
         if($(".capturecontrl").length==0)
         {
         	
         var span=$('<span  class="capturecontrl"></span>');
		 console.log(span)
		 span.html('<embed id="screenshotPlugin" wmode="opaque" width="0" height="0" type="application/x-dingscreenshot-plugin"></embed>');
		 $("body").append(span);
         }
		
		 var gui = require('nw.gui');
		 var option = {
			key: "Ctrl+Alt+X",
			active: function() {
				console.log("Global desktop keyboard shortcut: " + this.key + " active.");
			},
			failed: function(msg) {
				// :(, fail to register the |key| or couldn't parse the |key|.
				console.log(msg);
				console.log("fail to register the ")
			}
		};
		// Create a shortcut with |option|.
		var shortcut = new gui.Shortcut(option);
		// You can also add listener to shortcut's active and failed event.
		shortcut.on('active', function() {
			console.log("Global desktop keyboard shortcut: " + this.key + " active.");
			
			 if($(".capturecontrl").length==0)
	         {
	         	
	         var span=$('<span  class="capturecontrl"></span>');
			 console.log(span)
			 span.html('<embed id="screenshotPlugin" wmode="opaque" width="0" height="0" type="application/x-dingscreenshot-plugin"></embed>');
			 $("body").append(span);
	         }
			var control = $("#screenshotPlugin")[0];
			var o = control;
			console.log(o);

			if (o) {
				o.onCaptureFail = function(err) {
					captureresult = "error";
					console.log("error");
					win.show();
					window.shiftpress = false;
				};
				var install = {
					isinstall: !!o.startCapture && hasScreenshotPlugin
				}
				console.log("install")
				console.log(install);
				o.onCaptureSuccess = function(arg) {
					window.shiftpress = false;
					win.show();
					captureresult = "success";
					console.log(arg);
					$rootScope.captureData.b64data = arg;
					if($rootScope.$stateParams.personId)
					{
						ngDialog.open({
						template: 'message/angular/template/filePreviewConfirmMessage.htm',
						controller: 'messageController',
						className: '',
						showClose: false,
						closeByEscape: false,
						closeByDocument: false,
						data: {
							picdata: $rootScope.captureData.b64data
						},
					});
						
					}
					

				};

			}
			console.log(o)
			if (o) {

				o.startCapture(0, 1, 1);
			}

		});

		shortcut.on('failed', function(msg) {
			console.log(msg);
		});

		// Register global desktop shortcut, which can work without focus.

		return {
			registerHotKey: function() {
				gui.App.registerGlobalHotKey(shortcut);


			},
			unregisterHotKey: function() {
				gui.App.unregisterGlobalHotKey(shortcut);
			}
		}


	}])