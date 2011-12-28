function SensorContainer() 
{
	var NESW = new Array();
	var name;
	var gmlName;
	var description;
	var varList = new Array();
	var startTime;
	var endTime;
	var dateFormatter;
	//var dateFormatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm Z");
	var selected = false;
	var responseFormats = new Array();
	//var tz = TimeZone.getTimeZone("GMT");
    //dateFormatter.setTimeZone(tz);
}

SensorContainer.prototype = 
{
	contructor: SensorContainer,
	
	getVarList: function() {
		return this.varList;
	},

	getStartTime: function() {
		return this.startTime;
	},

	setStartTime: function(startTime) {
		this.startTime = startTime;
	},

	getEndTime: function() {
		return this.endTime;
	},

	setEndTime: function(endTime) {
		this.endTime = endTime;
	},

	getDescription: function() {
		return this.description;
	},

	setDescription: function(description) {
		this.description = description;
	},

	addVariable: function(Var) {
		this.varList.push(Var);
	},

	getNumVars: function() {
		return this.varList.length;
	},

	getNESW: function() {
		// if (NESW != null) {
		return this.NESW;
		// }
	},

	setNESW: function(NESW) {
		this.NESW = NESW.slice(0);
	},

	getName: function() {
		return this.name;
	},

	setName: function(name) {
		this.name = name;
	},

	setSelected: function(selected) {
		this.selected = selected;
	},

	isSelected: function() {
		return this.selected;
	},

	setGmlName: function(gmlName) {
		this.gmlName = gmlName;
	},

	getGmlName: function() {
		return this.gmlName;
	},

	setResponseFormats: function(formats) {
		responseFormats = formats;
	},

	getResponseFormats: function() {
		return this.responseFormats;
	}
}