//Class for ERDDAP Servers
function ErddapServer(myURL)
{
	this.url = myURL;
	this.searchURL = "";
	this.serviceLinks;
	this.datasets = new Array();
	this.html;
	this.datasetConnection;
	
	if (this.url.indexOf("?") != -1){
		this.url = this.url.substring(0, this.url.indexOf("?"));
	}
}

ErddapServer.prototype = {
	contructor: ErddapServer,
	getURL: function(){
		return this.url;
	},
	
	getSearchURL: function(){
		return this.searchURL;
	},
	
	getDataSets: function(){
		return this.datasets;
	},
	
	processDataSets: function(callback){
		var newERDDAP = this;
		var serviceLinks = "";
		var datasets = new Array();
		var searchLink = "";
		OpenLayers.Request.issue({
			method  : 'GET',
			url     : 'proxy.php?u=' + encodeURIComponent(this.url + 'index.json'),
			callback : function(r) {
				var json = new OpenLayers.Format.JSON().read(r.responseText);
				for (i = 0; i < json.table.rows.length; i++){
					if (json.table.rows[i][0] == "info")
						serviceLinks = json.table.rows[i][1];
					else  if (json.table.rows[i][0] == "search")
						newERDDAP.searchURL = json.table.rows[i][1];
				}
				
				OpenLayers.Request.issue({
				method  : 'GET',
					url     : 'proxy.php?u=' + encodeURIComponent(serviceLinks),
					callback : function(r) {
						var json = new OpenLayers.Format.JSON().read(r.responseText);
						for (i = 0; i < json.table.rows.length; i++){
							var ds = new ErddapDataset(json.table.rows[i][12]);
							ds.setTitle(json.table.rows[i][5]);
							ds.setSummary(json.table.rows[i][6]);
							ds.setBackgroundInfo(json.table.rows[i][8]);
							ds.setInstitution(json.table.rows[i][11]);
							ds.setErddapServer(newERDDAP);
							ds.setGriddap((json.table.rows[i][0]) != "");
							ds.setSubset((json.table.rows[i][1]) != "");
							ds.setTabledap((json.table.rows[i][2]) != "");
							ds.setWMS((json.table.rows[i][4]) != "");
							datasets.push(ds);
						}
						newERDDAP.datasets = datasets;
						callback();
					}
				});
			}
		});
	},

	processSearchDataSets: function(criteria, callback){
		var newERDDAP = this;
		var datasets = new Array();
		OpenLayers.Request.issue({
			method  : 'GET',
			url     : 'proxy.php?u=' + encodeURIComponent(this.getSearchURL() + criteria),
			callback : function(r) {
				var json = new OpenLayers.Format.JSON().read(r.responseText);
				for (i = 0; i < json.table.rows.length; i++){
					var ds = new ErddapDataset(json.table.rows[i][12]);
					ds.setTitle(json.table.rows[i][5]);
					ds.setSummary(json.table.rows[i][6]);
					ds.setBackgroundInfo(json.table.rows[i][8]);
					ds.setInstitution(json.table.rows[i][11]);
					ds.setErddapServer(newERDDAP);
					ds.setGriddap((json.table.rows[i][0]) != "");
					ds.setSubset((json.table.rows[i][1]) != "");
					ds.setTabledap((json.table.rows[i][2]) != "");
					ds.setWMS((json.table.rows[i][4]) != "");
					datasets.push(ds);
					
				}
				newERDDAP.datasets = datasets;
				callback();
			}
		});
	}
}
