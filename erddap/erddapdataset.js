
//Class for ERDDAP DataSets

function ErddapDataset(myID)
{
	this.erddapServer = new ErddapServer("");
	this.id = myID;
	this.title;
	this.summary;
	this.background_info;
	this.insitution;
	this.cdm_data_type;
	this.griddap;
	this.tabledap;
	this.subset;	this.wms;
	this.timeVariable;
	this.yVariable;
	this.xVariable;
	this.zVariable;
	this.cdmVariable;
	this.variables = new Array();
	this.locations = new Array();
	this.variableCount = 0;
}

ErddapDataset.prototype = 
{
	contructor: ErddapDataset,

	setTitle: function(title){
		this.title = title;
	},

	setBackgroundInfo: function(background_info) {
		this.background_info = background_info;
	},

	setSummary: function(summary) {
		this.summary = summary;
	},

	setInstitution: function(institution) {
		this.institution = institution;
	},

	setErddapServer: function(erddapServer) {
		this.erddapServer = erddapServer;
	},

	setGriddap: function(griddap) {
		this.griddap = griddap;
	},

	setSubset: function(subset) {
		this.subset = subset;
	},

	setTabledap: function(tabledap) {
		this.tabledap = tabledap;
	},

	setWMS: function(wms) {
		this.wms = wms;
	},

	isGriddap: function() {
		return this.griddap;
	},

	isSubset: function() {
		return this.subset;
	},

	isTabledap: function() {
		return this.tabledap;
	},

	isWms: function() {
		return this.wms;
	},

	isGraph: function() {
		return (this.isTabledap() || this.isGriddap());
	},

	getID: function() {
		return this.id;
	},

	getInstitution: function() {
		return this.institution;
	},

	getTitle: function() {
		return this.title;
	},

	getErddapServer: function() {
		return this.erddapServer;
	},

	getBackgroundInfo: function() {
		return this.background_info;
	},

	getSummary: function() {
		return this.summary;
	},

	getInfo: function() {
		return this.erddapServer.getURL() + "info/" + this.id + "/index.json";
	},

	getRSS: function() {
		return this.erddapServer.getURL() + "rss/" + this.id + ".rss";
	},

	getEmail: function() {
		return this.erddapServer.getURL() + "subscriptions/add.html?datasetID=" + this.id + "&showErrors=false&email=";
	},

	getGriddap: function() {
		if (this.isGriddap()) 
		{
			return this.erddapServer.getURL() + "griddap/" + this.id;
		}
		return null;
	},

	hasX: function() {
		return (typeof this.getX() != 'undefined');
	},

	getX: function() {
		return this.xVariable;
	},

	hasY: function() {
		return (typeof this.getY() != 'undefined');
	},
	  
	getY: function() {
		return this.yVariable;
	},

	hasZ: function() {
		return (typeof this.getZ() != 'undefined');
	},

	getZ: function() {
		return this.zVariable;
	},

	hasCdmAxis: function() {
		return (typeof this.getCdmAxis() != 'undefined');
	},

	getCdmAxis: function() {
		return this.cdmVariable;
	},

	hasLocations: function() {
		return (typeof this.getLocations() != 'undefined');
	},
	  
	getLocations: function() {
		return this.locations;
	},

	hasTime: function() {
		return (typeof this.getTime() != 'undefined');
	},

	getTime: function() {
		return this.timeVariable;
	},

	hasCdmDataType: function() {
		return (typeof this.getCdmDataType() != 'undefined');
	},

	getCdmDataType: function() {
		return this.cdm_data_type;
	},

	getSubset: function() {
		if (this.isSubset())
		{
			return this.getTabledap() + ".subset";
		}
		return null;
	},

	getTabledap: function() {
		if (this.isTabledap()) 
		{
			return this.erddapServer.getURL() + "tabledap/" + this.id;
		}
		return null;
	},

	getTabledapHtml: function(){
		if (this.isTabledap()) 
		{
			return this.getTabledap() + ".html";
		}
		return null;
	},

	getWms: function() {
		if (this.isWms())
		{
			return this.erddapServer.getURL() + "wms/" + this.id + "/request";
		}
		return null;
	},

	getGraph: function() {
		if (this.isTabledap()) 
		{
			return this.getTabledap() + ".graph";
		} 
		else 
		{
			if (this.isGriddap()) 
			{
				return this.getGriddap() + ".graph";
			}
		}
		return null;
	},
	  
	getVariables: function(){
		return this.variables;
	},

	buildVariables: function(callback, k){
		try {
			var subsetVars = new Array();
			var edv = null;
			var frst;
			var scnd;
			OpenLayers.Request.issue({
				method  : 'GET',
				url     : 'proxy.php?u=' + encodeURIComponent(this.getInfo()),
				scope: this,
				callback : function(r) {
					var json = new OpenLayers.Format.JSON().read(r.responseText);
					this.variableCount = 0;
					for (i = 0 ; i < json.table.rows.length; i++) {
						if (json.table.rows[i][2] == "subsetVariables"){
							subsetVars = json.table.rows[i][4].split(",");
							for (j = 0 ; j < subsetVars.length ; j++) {
								subsetVars[j] = subsetVars[j].trim();
							}
							continue;
						}
						
						if (json.table.rows[i][2] == "cdm_data_type"){
							this.cdm_data_type = json.table.rows[i][4];
							continue;
						}

						if (json.table.rows[i][0] == "variable"){
							if (edv != null) {
								this.setAxis(edv);
								this.variables.push(edv);
							}					
							edv = new ErddapVariable(this, json.table.rows[i][1], json.table.rows[i][3], (subsetVars.indexOf($.trim(json.table.rows[i][1])) > -1), k);
							if (subsetVars.indexOf($.trim(json.table.rows[i][1])) > -1){
								this.variableCount++;
							}
							continue;
						}

						if (json.table.rows[i][0] == "attribute") {
							if (json.table.rows[i][2] == "actual_range"){
								// The range is not always going to be in the correct order
								frst = $.trim(json.table.rows[i][4].split(",")[0]);
								scnd = $.trim(json.table.rows[i][4].split(",")[1]);
								if (frst == "NaN" || scnd == "NaN"){
									edv.setMin(frst);
									edv.setMax(scnd);
								}
								else{
									edv.setMin(Math.min(frst,scnd));
									edv.setMax(Math.max(frst,scnd));
								}
							}
							else if (json.table.rows[i][2] == "long_name"){
								edv.setLongname($.trim(json.table.rows[i][4]));
							}
							else if (json.table.rows[i][2] == "units"){
								edv.setUnits($.trim(json.table.rows[i][4]));
							} 
							else if (json.table.rows[i][2] == "cf_role"){
								edv.setAxis($.trim(json.table.rows[i][4]));
							}
							else if (json.table.rows[i][2].toUpperCase() == "DESCRIPTION"){
								edv.setDescription($.trim(json.table.rows[i][4]));
							}
						}
					}
					// Get the last iteration's edv variable
					if (edv != null){
						this.variables.push(edv);
					}

					// Does this dataset have points we can strip out?
					// latitude and longitude also need to be subsetVariables or
					// this might be a long and hard query (from Bob Simmons).
					if (this.hasX() && this.hasY()){
						this.variableCount++;
						this.buildLocations(k);
					}
				}
			});
		} 
		catch (err){
			alert("Exception: " + err);
		}		
	},
	
	buildLocations: function(k){
		try 
		{
			OpenLayers.Request.issue
			({
				method  : 'GET',
				url     : 'proxy.php?u=' + encodeURIComponent(this.getTabledap() + '.json?' + this.getX().getName() + ',' + this.getY().getName() + '&distinct()'),
				scope	: this,
				callback : function(r) 
				{
					var json = new OpenLayers.Format.JSON().read(r.responseText);
					var locations = new Array(json.table.rows.length);
					//var senc = new SensorContainer();
					//var loc = new Array(4);
					for (i = 0; i < json.table.rows.length; i++) 
					{
						if (i >= 50){
							this.locations = [];
							this.locations.push("error");
							break;
						}
						var loc = new Array(2);
						loc[0] = json.table.rows[i][0];
						loc[1] = json.table.rows[i][1];
						this.locations.push(loc);
					}
					dsVariableCheck(k);
				}
			});
		}
		catch (err)
		{
			alert("Exception: " + err);
		}
	},
	
	setAxis: function(erv) {
		if (erv.isTime()) {
			this.timeVariable = erv;
		} 
		else if (erv.isX()) {
			this.xVariable = erv;
		} 
		else if (erv.isY()) {
			this.yVariable = erv;
		}
		else if (erv.isZ()) {
			this.zVariable = erv;
		} 
		else if (erv.isCdm()) {
			this.cdmVariable = erv;
		}
	}
}