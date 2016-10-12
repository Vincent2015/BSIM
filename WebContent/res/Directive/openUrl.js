angular.module("IMChatOpenUrl", []).directive("imopenurl", [
	function() {
		return {
			restrict: "AE",
			link: function(e, t) {
				var r = function(e, t) {
					var isnw=false;
					if(require)
					{
						var  ob=require("nw.gui");
						
						if(ob)
						{
							
							isnw=true;
						}
						
					}
					
			 
					if (isnw) {
						var r = $(e).attr("href"),
							i = $(e).attr("download");
                        var    j = $(e).attr("noopen");
                       if(!j)
                       {
                       	
                       	if (!r || "http" !== r.slice(0, 4) && "//" !== r.slice(0, 2) && "mailto:" !== r.slice(0, 7)) 
						return void
						t.preventDefault();
						 
						if (!i && r) {
							t.preventDefault();
							var a =require("nw.gui");
							a.Shell.openExternal(r)
						}
                       }
						
					 
						
					}
				};
				t[0] && t[0].addEventListener("click", function(e) {
					e.target instanceof HTMLAnchorElement && r(e.target, e)
				}, !1)
			}
		}
	}
])
