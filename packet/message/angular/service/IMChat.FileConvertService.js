///  支持文件转换

///  rongfl 
angular.module("IMChat.FileConvertService", [])
	.factory("fileConvertService", [function() {
			return {
				b64ToFile: function(data, filetype, filename) {
					for (var t = window.atob(data), n = new Uint8Array(t.length), a = 0; a < t.length; a++) n[a] = t.charCodeAt(a);
					var l = new Blob([n], {
						type: filetype
					});
					return l.name = filename, l;
				}
			}

		}
])