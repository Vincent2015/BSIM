angular.module("IMChat.UpdateService", ["ngDialog"])
	.factory("updateService", ["ngDialog", function(ngDialog) {
		var oldversion = "0.0.1";
		var newversion = window.newversion;
		return {
			showupdateinfo: function(newversion) {
				if (oldversion != newversion) {
					ngDialog.open({
						template: 'message/angular/template/startConfirmMessage'+newversion+'.htm',
						controller: 'mainCtrl',
						className: '',
						showClose: false,
					});
				}
			},
			oldversion:oldversion,
			newversion:newversion
		}
	}])