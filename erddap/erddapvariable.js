function ErddapVariable(erd, name, type, values, k, min, max) 
{
	this.min;
	this.max;
	this.name;
	this.units;
	this.description;
	this.longname;
	this.axis;
	this.type;
	this.values = new Array();
	this.erd;

	//These are constants, defined by ERDDAP. See http://coastwatch.pfeg.noaa.gov/erddap/tabledap/documentation.html. Section "Special Variables"
	this.TAXIS = "time";
	this.ZAXIS = "altitude";
	this.XAXIS = "longitude";
	this.YAXIS = "latitude";
	this.CDM_TYPES = new Array();

	this.double_types = new Array();

	if (min == undefined && max == undefined){ // first constructor
		this.erd = erd;
		this.name = name;
		this.axis = name;
		this.type = type;
		this.min = "";
		this.max = "";
		this.values = new Array();
		this.CDM_TYPES.push("timeseries_id");
		this.CDM_TYPES.push("trajectory_id");
		this.initDoubleTypes();
		if (values)
		{
			this.getConstraints(k);
		}
	}
	else{ // second constructor
		this.erd = erd;
		this.name = name;
		this.axis = name;
		this.type = type;
		this.min = min;
		this.max = max;
		this.values = new Array();
		this.CDM_TYPES.push("timeseries_id");
		this.CDM_TYPES.push("trajectory_id");
		this.initDoubleTypes();
	}
}

ErddapVariable.prototype = 
{
	contructor: ErddapVariable,
	
	initDoubleTypes: function(){
		var dblTypes = new Array(4);
		dblTypes.push("double");
		dblTypes.push("float");
		dblTypes.push("short");
		dblTypes.push("byte");
		this.double_types = dblTypes;
	},
	
	getConstraints: function(k){
		try {
			var url = 'proxy.php?u=' + encodeURIComponent(this.erd.getTabledap() + '.json?' + this.name + '&distinct()');
			OpenLayers.Request.issue({
				method  : 'GET',
				url		: url,
				scope	: this,
				callback : function(r) {
					var json = new OpenLayers.Format.JSON().read(r.responseText);
					var tempValues = new Array();
					var v = "";
					for (i = 0; i < json.table.rows.length; i++){
						v = json.table.rows[i];
						//v = ar.getJSONArray(i).getString(0);
						if (typeof(v) == 'string'){
							v = "\"" + v + "\"";
						}
						tempValues.push(v);
					}
					if (this.min == ''){
						this.min = tempValues[0];
					}
					if (this.max == ''){
						this.max = tempValues[tempValues.length - 1];
					}
					this.values = tempValues;
					dsVariableCheck(k);
				}
			});
		}
		catch (err) {
			alert("Exception: " + err);
		}
	},
	
	setMin: function(min) {
		this.min = min;
	},

	hasMax: function() {
		return ((this.max !== "") && (this.max != null) && (this.max.toUpperCase() !== "NAN"));
		//return !this.max.isEmpty() && this.max != null && !this.max.equalsIgnoreCase("NaN");
	},

	hasMin: function() {
		return ((this.min !== "") && (this.min != null) && (this.min.toUpperCase() !== "NAN"));
		//return !this.min.isEmpty() && this.min != null && !this.min.equalsIgnoreCase("NaN");
	},

	setMax: function(max) {
		this.max = max;
	},

	setLongname: function(longname) {
		this.longname = longname;
	},

	setUnits: function(units){
		this.units = units;
	},

	setAxis: function(axis) {
		this.axis = axis;
	},

	setDescription: function(description) {
		this.description = description;
	},

	getTitle: function() {
		if ((this.getLongname() === null) || (this.getLongname() === ""))
		{
			return this.getName();
		} 
		else 
		{
			return this.getLongname();
		}
	},

	getLongname: function() {
		return this.longname;
	},

	getName: function() {
		return this.name;
	},

	getUnits: function() {
		return this.units;
	},

	getMax: function(){
		return this.max;
	},

	getMin: function(){
		return this.min;
	},

	getDescription: function() {
		return this.description;
	},

	getValues: function() {
		return this.values;
	},

	isX: function() {
		return (this.axis == this.XAXIS);
		//return axis.equals(XAXIS);
	},

	isY: function(){
		return (this.axis == this.YAXIS);
		//return axis.equals(YAXIS);
	},

	isTime: function() {
		return (this.axis == this.TAXIS);
		//return axis.equals(TAXIS);
	},

	isZ: function(){
		return (this.axis == this.ZAXIS);
		//return axis.equals(ZAXIS);
	},

	isCdm: function() {
		return (this.CDM_TYPES.indexOf(this.axis) != -1);
		//return CDM_TYPES.contains(axis);
	},

	isSingleValue: function(){
		return ((this.min == this.max) && !(this.min == ""));
		//return min.equals(max) && !min.isEmpty();
	},

	hasNoRange: function() {
		return (((this.min == "") && (this.max == "")) || (this.min == "NAN") && (this.max == "NAN"));
	},

	isString: function() {
		return (this.type.toUpper() === "STRING");
	},

	isDouble: function() {
		if (this.double_types.indexOf(this.type) > -1){
			return true;
		} 
		else {
			if ((typeof this.min == "number") && (typeof this.max == "number")){
				if (this.values.length != 0) {
					for (i = 0; i < this.values.length; i++) {
						if (typeof this.values[i] != "number"){
							return false;
						} 
					}
				}
			}
			else{
				return false;
			}
		}
		return true;		
	},

	getSliderValues: function() {
		if (isDouble()) 
		{
			var ds = new arr(values.size());
			for (i = 0; i < values.size(); i++) 
			{
				ds[i] = Double.parseDouble(values.get(i));
			}
			return ds;
		}
		return null;
	}
}