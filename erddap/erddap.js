Ext.QuickTips.init();
var dataserver;
var ds;
var map;
var polygonControl;
var tempVarCount = 0;
var rendered = false;
var drawBBBool = false;
var vectors = new OpenLayers.Layer.Vector("Boundary Box");
var datasets = new Array();
var datasetsArray =  new Array();
var operators = new Array(">=",">","=~","","!=","=","<","<=");
var datasetStore = new Ext.data.ArrayStore({
	fields: [
		{name: 'griddap', 			type: 'string'},
		{name: 'Subset', 			type: 'string'},
		{name: 'tabledap', 			type: 'string'},
		{name: 'Make A Graph', 		type: 'string'},
		{name: 'wms', 				type: 'string'},
		{name: 'Title', 			type: 'string'},
		{name: 'Summary', 			type: 'string'},
		{name: 'Info', 				type: 'string'},
		{name: 'Background Info', 	type: 'string'},
		{name: 'RSS', 				type: 'string'},
		{name: 'Email', 			type: 'string'},
		{name: 'Institution', 		type: 'string'},
		{name: 'Dataset ID', 		type: 'string'}
	]
});

var dataTypesArray = new Array(
	[".asc", "View an OPeNDAP-style comma-separated ASCII text file."],
	[".csv", "Download a .csv file with line 1: name (units). Times are ISO 8601 strings."],
	[".das", "View the data's metadata via an OPeNDAP Dataset Attribute Structure (DAS)."],
	[".dds", "View the data's structure via an OPeNDAP Dataset Descriptor Structure (DDS)."],
	[".esriCsv", "Download a .csv file for ESRI's ArcGIS (line 1: names; separate date and time columns)."],
	[".geoJson", "Download longitude,latitude, otherColumns data as a GeoJSON .json file."],
	[".json", "Download a table-like JSON file (missing value = 'null'; times are ISO 8601 strings)."],
	[".mat", "Download a MATLAB binary file."],
	[".nc", "Download a flat, table-like, NetCDF-3 binary file with COARDS/CF/THREDDS metadata."],
	[".ncHeader", "View the header (the metadata) for the NetCDF-3 file."],
	[".ncCF", "Download a structured, NetCDF-3 binary file using the new CF Discrete Sampling Geometries."],
	[".odvTxt", "Download longitude,latitude,time,otherColumns as an ODV Generic Spreadsheet File (.txt)."],
	[".tsv", "Download a tab-separated ASCII text table (line 1: names; line 2: units; ISO 8601 times)."],
	[".tsvp", "Download a .tsv file with line 1: name (units). Times are ISO 8601 strings."],
	[".xhtml", "View an XHTML (XML) file with the data in a table. Times are ISO 8601 strings."]
);
var dataTypesStore = new Ext.data.ArrayStore({fields: ['type', 'description'], data : dataTypesArray});
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
var locationLayer = new OpenLayers.Layer.Vector('Locations', {
	styleMap: new OpenLayers.StyleMap({
			pointRadius: "${type}", // based on feature.attributes.type
			fillColor: "#666666"
	}),
	renderers: renderer
});

//LAYOUT PANELS
var coordinatesPanel;
var dateSliderPanel;
var blankHolderPanel;
var datePanel;
var mapPanel;
var locationDatePanel;
var datasetInformationPanel;
var variablesAttributesPanel;
var datasetInfoPanel;
var datasetListingGridPanel;
var datasetListingPanel;
var submitPanel;
var mainPanel;

function erddapInit(){	
	map = new OpenLayers.Map('map');
	map.addLayers([new OpenLayers.Layer.OSM, vectors]);
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());
	polygonControl = new OpenLayers.Control.DrawFeature(vectors, OpenLayers.Handler.RegularPolygon, {handlerOptions: {sides: 4}});
	vectors.events.on({'beforefeatureadded': function(){vectors.removeAllFeatures()}});
	vectors.events.on({'featureadded': function(){
		polygonControl.deactivate();
		var topleft = new OpenLayers.Geometry.Point(vectors.features[0].geometry.getVertices()[0].x, vectors.features[0].geometry.getVertices()[0].y);
		var bottomright = new OpenLayers.Geometry.Point(vectors.features[0].geometry.getVertices()[2].x, vectors.features[0].geometry.getVertices()[2].y);
		var topleftLatLonPoint = topleft.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
		var bottomrightLatLonPoint = bottomright.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
		Ext.getCmp('NorthText').setValue(topleftLatLonPoint.y);
		Ext.getCmp('SouthText').setValue(bottomrightLatLonPoint.y);
		Ext.getCmp('WestText').setValue(topleftLatLonPoint.x);
		Ext.getCmp('EastText').setValue(bottomrightLatLonPoint.x);
		createRequestURL(ds);
	}});
	map.addControl(polygonControl);
	polygonControl.handler.setOptions({sides: parseInt(4)});
	polygonControl.handler.setOptions({snapAngle: parseFloat(90)});
	polygonControl.handler.setOptions({irregular: true});

	coordinatesPanel = new Ext.FormPanel({
		id: 'coordinatesPanel',
		title: 'Geographic Filter',
		autoScroll: true, 
		flex: 1,
		padding: 10,
		labelWidth: 50,
		items: [
			{xtype: 'textfield', id: 'NorthText', fieldLabel: 'North', width: 75, listeners: {change: function(){createRequestURL(i)}}},
			{xtype: 'textfield', id: 'SouthText', fieldLabel: 'South', width: 75, listeners: {change: function(){createRequestURL(i)}}},
			{xtype: 'textfield', id: 'WestText',  fieldLabel: 'West',  width: 75, listeners: {change: function(){createRequestURL(i)}}},
			{xtype: 'textfield', id: 'EastText',  fieldLabel: 'East',  width: 75, listeners: {change: function(){createRequestURL(i)}}},
			{xtype: 'button',	 id: 'bboxButton', text: 'Select bounding box on map', icon: 'img/cross_cursor.gif', width: 125, height: 30, listeners: {click: function(){polygonControl.activate()}}}
		]
	});
	var blankPaddingPanel = new Ext.Panel({
		id: 'blankPaddingPanel',
		width: 10,
		border: false
	});
	dateSliderPanel = new Ext.FormPanel({
		id: 'dateSliderPanel',
		title: 'Time Filter',
		autoScroll: true, 
		flex: 2,
		padding: 10,
		labelWidth: 75,
		items: 
		[
			{
				xtype: 'compositefield',
				fieldLabel: 'Start Date',
				items: [
					{
						xtype: 'datefield',
						id: 'startDate',
						name : 'startDate',
						dateFormat: 'd-m-Y', //display format
						selectOnFocus:true,
						listeners: {change: function(){createRequestURL(i)}}
					},
					{
						xtype: 'timefield',
						name : 'starttime',
						id: 'startTime',
						listeners: {change: function(){createRequestURL(i)}},
						width: 100
					}
				]
			},
			{
				xtype: 'compositefield',
				fieldLabel: 'End Date',
				//msgTarget : 'side',
				//anchor    : '-20',
				items: [
					{
						xtype: 'datefield',
						name : 'endDate',
						id: 'endDate',
						dateFormat: 'd-m-Y', //display format
						selectOnFocus:true,
						listeners: {change: function(){createRequestURL(i)}}
					},
					{
						xtype: 'timefield',
						name : 'endTime',
						id: 'endTime',
						listeners: {change: function(){createRequestURL(i)}},
						width: 100
					}
				]
			}
		]	
	});	
	blankHolderPanel = new Ext.Panel({
		id: 'blankHolderPanel',
		border: false,
		layout:'hbox',
		layoutConfig: {
			align : 'stretch',
			pack  : 'start',
		},
		flex: 1,
		items: [coordinatesPanel, blankPaddingPanel, dateSliderPanel]
	});
	datePanel = new Ext.Panel({
		id: 'datePanel',
		layout:'hbox',
		layoutConfig: {
			align : 'stretch',
			pack  : 'start',
		},
		flex: 2,
		padding: 10,
		items: [blankHolderPanel]
	});
	mapPanel = new GeoExt.MapPanel({
		id: 'mapPanel',
		layout: 'fit',
		flex: 5,
		map: map
	});
	locationDatePanel = new Ext.Panel({
		id: 'locationDatePanel',
		autoScroll: true, 
		layout: {
			type: 'vbox',
			pack: 'start',
			align: 'stretch'
		},
		padding: 10,
		flex: 1,
		items: [mapPanel, datePanel]
	});
	datasetInformationPanel = new Ext.FormPanel({
		id: 'datasetInformationPanel',
		autoScroll: true, 
		layout: {
			align: 'stretch',
			type: 'hbox'
		},
		flex: 1,
		padding: 10,
		border: false
	});	
	variablesAttributesPanel = new Ext.FormPanel({
			id: 'variablesAttributesPanel',
			layout: 'absolute',
			width: 880,
			autoScroll: true,
			flex: 1
	});
	datasetInfoPanel = new Ext.Panel({
		id: 'datasetInfoPanel',
		title: "Dataset Information", 
		region: "center", 
		autoScroll: true, 
		layout: {
			align: 'stretch',
			type: 'hbox'
		},
		items: [datasetInformationPanel, locationDatePanel, variablesAttributesPanel]
	});	
	datasetListingGridPanel = new Ext.grid.GridPanel({
		id: 'datasetListingGridPanel',
		region: 'west',
		store: datasetStore,
		autoScroll: true, 
		viewConfig: {
			forceFit:true,
			fitcontainer:true
		},
		columns: [{
				header: 'Dataset Title', 
				dataIndex: 'Title'
			}
		],
		sm: new Ext.grid.RowSelectionModel({
			singleSelect: true,
			listeners: {
				rowselect: function(sm, row, rec) {
					DisplayDatasetInformation(row);
					//TabledapGUI(row);
				}
			}
		}),
	});
	datasetListingPanel = new Ext.FormPanel({
		id: 'datasetListingPanel',
		title: "Dataset Listing", 
		region: "west", 
		layout: 'fit',
		autoScroll: true, 
		split: true,
		collapsible: true,
		width: 400,
		items: [datasetListingGridPanel],
		tbar: 
		{
			xtype: 'toolbar',
			id: 'searchToolbar',
			hidden: true,
			items: 
			[
				{
					xtype: 'tbtext',
					text: 'Search Datasets:',
					width: 90
				},
				{
					xtype: 'textfield',
					width: 240,
					id: 'txtSearch'
				},
				{
					xtype: 'button',
					text: 'Search',
					width: 45,
					icon: 'img/search_icon.gif',
					enableKeyEvents : true,
					listeners: {
						click: function(){
							searchDatasets(Ext.getCmp('txtSearch').getValue());
						}
					}
				}
			]
		}
	});	
	submitPanel = new Ext.Panel({
		id: 'submitPanel',
		title: "Submit",
		region: "south",
		layout: 'absolute',
		height: 70,
		collapsible: true,
		hidden : true,
		items: 
		[
			{
				xtype: 'combo', 
				tpl: '<tpl for="."><div ext:qtip="{description}" class="x-combo-list-item">{type}</div></tpl>',
				id: 'downloadTypeCombo', 
				triggerAction: 'all', 
				store: dataTypesStore,
				displayField:'type',
				mode: 'local',
				triggerAction: 'all',
				selectOnFocus:true,
				//applyTo: 'local-states-with-qtip'
				width: 150, 
				x: 9, 
				y: 10, 
				listeners: {change: function(){createRequestURL(ds)}}
			},
			{
				xtype: 'textfield',
				id: 'txtTabledapURL',
				width: 1300,
				style: 'font-size: 10px',
				x: 170,
				y: 10
			},
			{
				xtype: 'button',
				id: 'btnTabledapSubmit',
				text: 'Submit',
				x: 1480,
				y: 10,
				icon: 'img/submit.png',
				listeners: {click: function(){window.open(Ext.getCmp('txtTabledapURL').getValue())}}
			}
		]
	});
	mainPanel = new Ext.Panel({
		id: 'mainPanel',
		layout: 'border',
		border: false,
		items: [submitPanel, datasetListingPanel, datasetInfoPanel]
	});
	Ext.getCmp('locationDatePanel').hide();
	Ext.getCmp('variablesAttributesPanel').hide();
	Ext.getCmp('datasetInfoPanel').doLayout();
	Ext.getCmp('downloadTypeCombo').setValue(dataTypesArray[1][0]);
	blankServerContainerPanel.removeAll();
	blankServerContainerPanel.add('mainPanel');
	blankServerContainerPanel.doLayout();
}

function ErddapConnect(url){
	if (Ext.getCmp('txtERDDAP').getValue() != ''){
		Ext.MessageBox.show({
			msg: 'Connecting...',
			width:300,
			wait:true,
			buttons: Ext.MessageBox.CANCEL,
			waitConfig: {interval:200},
		});
		erddapInit();
		dataserver = new ErddapServer(url);
		dataserver.processDataSets(ErddapConnectCallback);
	}
}

function ErddapConnectCallback(){
	datasets = new Array();
	datasetsArray = new Array();
	datasets = dataserver.getDataSets();
	for (i = 0; i < datasets.length; i++){
		ds = new Array();
		ds[0] = datasets[i].getGriddap();
		ds[1] = datasets[i].getSubset();
		ds[2] = datasets[i].getTabledap();
		ds[3] = datasets[i].getGraph();
		ds[4] = datasets[i].getTitle();
		ds[5] = datasets[i].getTitle();
		ds[6] = datasets[i].getSummary();
		ds[7] = datasets[i].getInfo();
		ds[8] = datasets[i].getBackgroundInfo();
		ds[9] = datasets[i].getRSS();
		ds[10] = datasets[i].getEmail();
		ds[11] = datasets[i].getInstitution();
		ds[12] = datasets[i].getID();
		datasetsArray.push(ds);
	}
	datasetStore.loadData([], false);
	datasetStore.loadData(datasetsArray);
	Ext.getCmp('searchToolbar').show();
	Ext.MessageBox.hide();
}	

function DisplayDatasetInformation(i){
	Ext.getCmp('locationDatePanel').hide();
	Ext.getCmp('variablesAttributesPanel').hide();
	Ext.getCmp('datasetInformationPanel').show();
	
	var html = '';
		html += "<b>Title:</b> " + datasets[i].getTitle() + "<br><br>";
		html += "<b>Dataset ID:</b> " + datasets[i].getID() + "<br><br>";
		html += "<b>Insitution:</b> " + datasets[i].getInstitution() + "<br><br>";
		html += '<b>Background Info</b>: <a href="' + datasets[i].getBackgroundInfo() + '">' + datasets[i].getBackgroundInfo() + '</a><br><br>';
		html += "<b>Summary:</b> " + datasets[i].getSummary() + "<br><br>";
		html += "<b>ERDDAP Provided Web Services:</b><br>";
		if (datasets[i].isWms())
		{
			html += '<i>WMS GetCapabilities</i>: <a href="' + datasets[i].getWms() + '">' + datasets[i].getWms() + '</a><br>';
		}
		if (datasets[i].isTabledap())
		{
			html += '<i>DataAccess Web Form</i>: <a href="' + datasets[i].getTabledap() + '.html">' + datasets[i].getTabledap() + '.html</a><br>';
		}
		if (datasets[i].isGriddap())
		{
			html += '<i>DataAccess Web Form</i>: <a href="' + datasets[i].getGriddap() + '.html">' + datasets[i].getGriddap() + '.html</a><br>';
		}
		if (datasets[i].isSubset())
		{
			html += '<i>Subset Web Form</i>: <a href="' + datasets[i].getSubset() + '">' + datasets[i].getSubset() + '</a><br>';
		}
		if (datasets[i].isGraph())
		{
			html += '<i>Graphing Web Form</i>: <a href="' + datasets[i].getGraph() + '">' + datasets[i].getGraph() + '</a><br>';
		}
		
		html += '<br /><br /><center>';
		if (!datasets[i].isGriddap())
		{
			html += '<input type = "submit" class=".x-btn button" value = "Griddap" disabled = "true" onClick = "" />';
		}
		else
		{
			html += '<input type = "submit" class=".x-btn button" value = "Griddap" onClick = "griddap()" />';
		}
		if (!datasets[i].isTabledap())
		{
			html += '<input type = "submit" class=".x-btn button" value = "Tabledap" disabled = "true" onClick = "TabledapGUI(' + i + ')" />';
		}
		else
		{
			html += '<input type = "submit" class=".x-btn button" value = "Tabledap" onClick = "TabledapGUI(' + i + ')" />';
		}
		html += '</center>';
	
	Ext.getCmp('datasetInfoPanel').setTitle('Dataset Information');
	Ext.getCmp('datasetInformationPanel').update(html);
	Ext.getCmp('datasetInformationPanel').doLayout();
	Ext.getCmp('datasetInfoPanel').doLayout();
}

function TabledapGUI(i){
	Ext.MessageBox.show({
		msg: 'Connecting...',
		width:300,
		wait:true,
		buttons: Ext.MessageBox.CANCEL,
		waitConfig: {interval:200},
	});
	tempVarCount = 0;	
	datasets[i].buildVariables(TabledapGUICallback, i);
}

function TabledapGUICallback(i){
	var variables = datasets[i].getVariables();
	var tempTitle = new Array();
	var startTime;
	var endTime;
	var N, S, E, W;
	
	Ext.getCmp('variablesAttributesPanel').removeAll();

	locationLayer.removeAllFeatures();
	vectors.removeAllFeatures();
	ds = i;
	rendered = false;

	for (j = 0; j < variables.length; j++){
		var variableTitle = variables[j].getTitle();
		if (variables[j].getUnits()){
			variableTitle += ' (' + variables[j].getUnits() + ')';
		}
		if (variables[j].isTime()){
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label',  width: 280, text: variableTitle, disabled: true, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', checked: true, disabled: true, width: 362, x: 20, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', text: 'Time variable selected by default.', style: 'width: 835px; text-align: right; display: block; font: normal 12px arial, helvetica, sans-serif;', x: 20, y: (j *40 + 20)});
			//alert("Min: " + variables[j].getMin() + "\nMax: " + variables[j].getMax());
			if (variables[j].getMin() != "NaN"){
				startTime = new Date(variables[j].getMin()*1000);
				Ext.getCmp('startDate').setValue(formatDate(startTime));
				Ext.getCmp('startTime').setValue(formatTime(startTime));
			}
			else{
				startTime = new Date();
				Ext.getCmp('startDate').setValue(formatDate(startTime));
				Ext.getCmp('startTime').setValue(formatTime(startTime));
			}
			if (variables[j].getMax() != "NaN"){
				endTime = new Date(variables[j].getMax()*1000);
				Ext.getCmp('endDate').setValue(formatDate(endTime));
				Ext.getCmp('endTime').setValue(formatTime(endTime));
			}
			else{
				endTime = new Date();
				Ext.getCmp('endDate').setValue(formatDate(endTime));
				Ext.getCmp('endTime').setValue(formatTime(endTime));
			}
		}
		else if (variables[j].isX()){
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label', width: 280, text: variableTitle, disabled: true, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', checked: true, width: 362, disabled: true, x: 20, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', text: 'Geographic variable selected by default.', style: 'width: 835px; text-align: right; display: block; font: normal 12px arial, helvetica, sans-serif;', x: 20, y: (j *40 + 20)});
			W = new Number(variables[j].getMin());
			E = new Number(variables[j].getMax());
			Ext.getCmp('WestText').setValue(W);
			Ext.getCmp('EastText').setValue(E);
		}
		else if (variables[j].isY()){
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label', width: 280, text: variableTitle, disabled: true, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', checked: true, width: 362, disabled: true, x: 20, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', text: 'Geographic variable selected by default.', style: 'width: 835px; text-align: right; display: block; font: normal 12px arial, helvetica, sans-serif;', x: 20, y: (j *40 + 20)});
			S = new Number(variables[j].getMin());
			N = new Number(variables[j].getMax());
			Ext.getCmp('NorthText').setValue(N);
			Ext.getCmp('SouthText').setValue(S);
		}
		else if (variables[j].isSingleValue()){
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label', width: 280, text: variableTitle, disabled: true, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', checked: true, width: 362, disabled: true, x: 20, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', text: 'Only one value present in dataset: ' + variables[j].getMin(), style: 'width: 835px; text-align: right; display: block; font: normal 12px arial, helvetica, sans-serif;', x: 20, y: (j *40 + 20)});
		}
		else if (variables[j].hasNoRange()){
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label', width: 280, text: variableTitle, disabled: true, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', checked: true, width: 362, disabled: true, x: 20, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', id: variables[j].getTitle() + 'MinCombo', triggerAction: 'all', store: operators, width: 50, x: 330, y: (j *40 + 19), listeners: {select: function(){createRequestURL(i)}}});
			Ext.getCmp(variables[j].getTitle() + 'MinCombo').setValue(operators[0]);
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'textfield', id: variables[j].getTitle() + 'MinText', width: 125, x: 400, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', id: variables[j].getTitle() + 'MaxCombo', triggerAction: 'all', store: operators, width: 50, x: 545, y: (j *40 + 19), listeners: {select: function(){createRequestURL(i)}}});
			Ext.getCmp(variables[j].getTitle() + 'MaxCombo').setValue(operators[7]);
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'textfield', id: variables[j].getTitle() + 'MaxText', width: 125, x: 615, y: (j *40 + 20)});
			Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', text: 'No range.', style: 'width: 835px; text-align: right; display: block; font: normal 12px arial, helvetica, sans-serif;', x: 20, y: (j *40 + 19)});
		}
		else{
			if (variables[j].values.length > 0){
				if (variables[j].isDouble()){
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label', width: 280, text: variableTitle, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', width: 362, x: 20, y: (j *40 + 20), listeners: {change: function(){createRequestURL(i)}}});
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MinCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 545, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
					Ext.getCmp(variables[j].getTitle() + 'MinCombo').setValue(operators[0]);
					Ext.getCmp('variablesAttributesPanel').add(
						new Ext.slider.MultiSlider({
							decimalPrecision: 3,
							id: variables[j].getTitle() + 'Slider',
							minValue: variables[j].getMin(),
							maxValue: variables[j].getMax(),
							values  : [variables[j].getMin(), variables[j].getMax()],
							plugins : new Ext.slider.Tip(),
							width: 200,
							x: 605,
							y: (j *40 + 20),
							listeners: {change: function(){createRequestURL(i)}}
						})
					);
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MaxCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 810, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
					Ext.getCmp(variables[j].getTitle() + 'MaxCombo').setValue(operators[7]);
				}
				else{
					//create store
					var valueArray = new Array();
					
					for (k = 0; k < variables[j].values.length; k++){
						var tempArray = new Array();
						tempArray.push(variables[j].values[k]);
						tempArray.push(variables[j].values[k]);
						valueArray.push(tempArray);
					}
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', id: variables[j].getTitle() + 'Label', width: 145, text: variableTitle, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', width: 362, x: 20, y: (j *40 + 20), listeners: {check: function(){createRequestURL(i)}}});
					if (variables[j].isCdm()) {
						Ext.getCmp(variables[j].getTitle() + 'Checkbox').setValue(true);
						Ext.getCmp(variables[j].getTitle() + 'Checkbox').setDisabled(true);
						Ext.getCmp(variables[j].getTitle() + 'Label').setDisabled(true);
					}
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MinCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 195, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
					Ext.getCmp(variables[j].getTitle() + 'MinCombo').setValue(operators[0]);
					
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'textfield', 	id: variables[j].getTitle() + 'MinValueText', width: 175,	x: 255, y: (j *40 + 19), listeners: {change: function(){createRequestURL(i)}}});
					
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MaxCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 440, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
					Ext.getCmp(variables[j].getTitle() + 'MaxCombo').setValue(operators[7]);
					
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'textfield', 	id: variables[j].getTitle() + 'MaxValueText', width: 175,	x: 500, y: (j *40 + 19), listeners: {change: function(){createRequestURL(i)}}});
					tempTitle[j] = variables[j].getTitle();
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'ValuesCombo', triggerAction: 'all', store: valueArray, 	width: 175,	x: 685, y: (j *40 + 19), editable: false, listeners: {select: function(){populateMinWithValue(tempTitle[j], i)}}});
				}
			} 
			else if (variables[j].isZ()) {
				Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', width: 280, text: variableTitle, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
				Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', 	id: variables[j].getTitle() + 'Checkbox', width: 362, x: 20, 	y: (j *40 + 20), listeners: {check: function(){createRequestURL(i)}}});
				Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MinCombo', triggerAction: 'all', store: operators, 		width: 50,	x: 545, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
				Ext.getCmp(variables[j].getTitle() + 'MinCombo').setValue(operators[0]);
				Ext.getCmp('variablesAttributesPanel').add(
					new Ext.slider.MultiSlider({
						decimalPrecision: 3,
						id: variables[j].getTitle() + 'Slider',
						minValue: variables[j].getMin(),
						maxValue: variables[j].getMax(),
						values  : [variables[j].getMin(), variables[j].getMax()],
						plugins : new Ext.slider.Tip(),
						width: 200,
						x: 605,
						y: (j *40 + 20),
						listeners: {change: function(){createRequestURL(i)}}
					})
				);
				Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MaxCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 810, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
				Ext.getCmp(variables[j].getTitle() + 'MaxCombo').setValue(operators[7]);
			}
			else if (variables[j].isDouble()) {
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'label', width: 280, text: variableTitle, style: 'font: normal 12px arial, helvetica, sans-serif;', x: 40, y: (j *40 + 24)});
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'checkbox', id: variables[j].getTitle() + 'Checkbox', width: 362, x: 20, y: (j *40 + 20), listeners: {check: function(){createRequestURL(i)}}});
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MinCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 545, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(combo, record, index){createRequestURL(i)}}});
					Ext.getCmp(variables[j].getTitle() + 'MinCombo').setValue(operators[0]);
					Ext.getCmp('variablesAttributesPanel').add(
						new Ext.slider.MultiSlider({
							decimalPrecision: 3,
							id: variables[j].getTitle() + 'Slider',
							minValue: variables[j].getMin(),
							maxValue: variables[j].getMax(),
							values  : [variables[j].getMin(), variables[j].getMax()],
							plugins : new Ext.slider.Tip(),
							width: 200,
							x: 605,
							y: (j *40 + 20),
							listeners: {change: function(){createRequestURL(i)}}
						})
					);
					Ext.getCmp('variablesAttributesPanel').add({xtype: 'combo', 	id: variables[j].getTitle() + 'MaxCombo', triggerAction: 'all', store: operators, 	width: 50,	x: 810, y: (j *40 + 19), editable: false, allowBlank: false, listeners: {select: function(){createRequestURL(i)}}});
					Ext.getCmp(variables[j].getTitle() + 'MaxCombo').setValue(operators[7]);
			}
		}
	}
	
	var zoomLevel = 2;
	if ((E - W) < 10) {
		zoomLevel = 8;
	}
	else if((E - W) < 10){
		zoomLevel = 7;
	}
	else if((E - W) < 20){
		zoomLevel = 6;
	}
	else if((E - W) < 30){
		zoomLevel = 5;
	}
	else if((E - W) < 10){
		zoomLevel = 4;
	}
	else if((E - W) < 50){
		zoomLevel = 3;
	}
	
	map.setCenter(new OpenLayers.LonLat(merc_x((W + E) / 2), merc_y((N + S) / 2)), zoomLevel);

	var locations = datasets[i].getLocations();
	var features = new Array(locations.length);
	if (locations[0] == "error"){
		locationLayer.addFeatures(new OpenLayers.Feature.Vector(
			new OpenLayers.Geometry.Point(merc_x((W + E) / 2), merc_y((N + S) / 2)),
			{type: 3}, 
			{label: 'Error: Too many sources to display'}
		));
		locations = null;
	}
	else {
		for (var k = 0; k < locations.length; k++) {
			features[k] = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.Point(
					merc_x(locations[k][0]), 
					merc_y(locations[k][1])
				), 
				{
					type: 3
				}
			);
		}
		
		locationLayer.addFeatures(features);
	}
	
	map.addLayers([locationLayer]);
	Ext.getCmp('browsePanel').collapse(true);
	Ext.getCmp('datasetListingPanel').collapse(true);
	Ext.getCmp('datasetInformationPanel').hide();
	Ext.getCmp('submitPanel').show();
	Ext.getCmp('locationDatePanel').show();
	Ext.getCmp('variablesAttributesPanel').show();
	Ext.getCmp('datasetInfoPanel').setTitle('Dataset Information - ' + datasets[i].getTitle());
	Ext.getCmp('variablesAttributesPanel').doLayout();
	Ext.getCmp('datasetInfoPanel').doLayout();
	Ext.getCmp('mainViewport').doLayout();
	rendered = true;
	createRequestURL(i);
	Ext.MessageBox.hide();
}

function createRequestURL(i){
	if (rendered){
		Ext.getCmp('txtTabledapURL').setValue('');
		var requestURL = datasets[i].getTabledap();
		var variables = datasets[i].getVariables();		
		var selections = new Array();
		var constraints = new Array();

		for (j = 0 ; j < variables.length; j++) {
			//alert(variables[j].getTitle() + '\nhasNoRange: ' + variables[j].hasNoRange() + '\nvalues.length: ' + variables[j].values.length + '\nisZ: ' + variables[j].isZ() + '\nisDouble: ' + variables[j].isDouble());
			if (Ext.getCmp(variables[j].getTitle() + 'Checkbox').getValue() == true){
				selections.push(variables[j].getName());
			}
			if (variables[j].getMin() == variables[j].getMax()) {
				constraints.push(variables[j].getName() + "=" + variables[j].getMin());
			} 
			else {
				if (!variables[j].isTime() && !variables[j].isX() && !variables[j].isY() && !variables[j].isSingleValue() && !variables[j].hasNoRange()){
					if (variables[j].values.length > 0){
						if (variables[j].isDouble()){
							if (Ext.getCmp(variables[j].getTitle() + 'MinCombo').getValue() != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[0] != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[0] != variables[j].getMin()) {
								constraints.push(variables[j].getName() + Ext.getCmp(variables[j].getTitle() + 'MinCombo').getValue() + Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[0]);
							}
							if (Ext.getCmp(variables[j].getTitle() + 'MaxCombo').getValue() != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[1] != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[1] != variables[j].getMax()) {
								constraints.push(variables[j].getName() + Ext.getCmp(variables[j].getTitle() + 'MaxCombo').getValue() + Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[1]);
							}
						}
						else{
							if (Ext.getCmp(variables[j].getTitle() + 'MinCombo').getValue() != '' && Ext.getCmp(variables[j].getTitle() + 'MinValueText').getValue() != '') {
								constraints.push(variables[j].getName() + Ext.getCmp(variables[j].getTitle() + 'MinCombo').getValue() + '"' + Ext.getCmp(variables[j].getTitle() + 'MinValueText').getValue() + '"');
							}					
						}
					} 
					else if (variables[j].isZ() || variables[j].getTitle() + 'Slider'){
						if (Ext.getCmp(variables[j].getTitle() + 'MinCombo').getValue() != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[0] != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[0] != variables[j].getMin()) {
							constraints.push(variables[j].getName() + Ext.getCmp(variables[j].getTitle() + 'MinCombo').getValue() + Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[0]);
						}
						if (Ext.getCmp(variables[j].getTitle() + 'MaxCombo').getValue() != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[1] != '' && Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[1] != variables[j].getMax()) {
							constraints.push(variables[j].getName() + Ext.getCmp(variables[j].getTitle() + 'MaxCombo').getValue() + Ext.getCmp(variables[j].getTitle() + 'Slider').getValues()[1]);
						}
					}
				}
			}
		}

		// Add the Time values
		if (datasets[i].hasTime()) {
			if (Ext.getCmp('startDate').getValue() != ''){
				constraints.push(datasets[i].getTime().getName() + ">=" + formatDate(Ext.getCmp('startDate').getValue()));
			}
			if(Ext.getCmp('endDate').getValue() != ''){
				constraints.push(datasets[i].getTime().getName() + "<=" + formatDate(Ext.getCmp('endDate').getValue()));
			}
		}

		// Add the X values
		if (datasets[i].hasX()){
			constraints.push(datasets[i].getX().getName() + ">=" + Ext.getCmp('WestText').getValue());
			constraints.push(datasets[i].getX().getName() + "<=" + Ext.getCmp('EastText').getValue());
		}

		// Add the Y values
		if (datasets[i].hasY()){
			constraints.push(datasets[i].getY().getName() + ">=" + Ext.getCmp('SouthText').getValue());
			constraints.push(datasets[i].getY().getName() + "<=" + Ext.getCmp('NorthText').getValue());
		}
		
		var params = selections.toString().replace(" ","").replace("[","").replace("]","");
		
		if (params.charAt(params.length - 1) == "&") {
			params = params.substring(0, params.length - 1);
		}
		
		params += "&";
		for (j = 0; j < constraints.length; j++){
			params += constraints[j] + "&";
		}
		// Strip off final '&'
		if (params.charAt(params.length - 1) == "&") {
			params = params.substring(0, params.length - 1);
		}	
		
		Ext.getCmp('txtTabledapURL').setValue(requestURL + Ext.getCmp('downloadTypeCombo').getValue() + '?' + params);
	}
}

function dsVariableCheck(i){
	tempVarCount++;
	if (tempVarCount == datasets[i].variableCount){
		TabledapGUICallback(i);
	}
}

function populateMinWithValue(title, i){
	Ext.getCmp(title + 'MinValueText').setValue(Ext.getCmp(title + 'ValuesCombo').getValue());
	Ext.getCmp(title + 'MinCombo').setValue("=");
	createRequestURL(i);
}

function searchDatasets(criteria){
	if (Ext.getCmp('txtSearch').getValue() == ''){
		var url = dataserver.getURL();
		ErddapConnect(url);
	}
	else{
		Ext.MessageBox.show({
			msg: 'Connecting...',
			width:300,
			wait:true,
			waitConfig: {interval:200},
		});
		dataserver.processSearchDataSets(criteria, searchDatasetsCallback);
	}
}

function searchDatasetsCallback(){
	datasets = new Array();
	datasetsArray = new Array();
	datasets = dataserver.getDataSets();
	for (i = 0; i < datasets.length; i++){
		ds = new Array();
		ds[0] = datasets[i].getGriddap();
		ds[1] = datasets[i].getSubset();
		ds[2] = datasets[i].getTabledap();
		ds[3] = datasets[i].getGraph();
		ds[4] = datasets[i].getTitle();
		ds[5] = datasets[i].getTitle();
		ds[6] = datasets[i].getSummary();
		ds[7] = datasets[i].getInfo();
		ds[8] = datasets[i].getBackgroundInfo();
		ds[9] = datasets[i].getRSS();
		ds[10] = datasets[i].getEmail();
		ds[11] = datasets[i].getInstitution();
		ds[12] = datasets[i].getID();
		datasetsArray.push(ds);
	}
	datasetStore.loadData([], false);
	datasetStore.loadData(datasetsArray);
	Ext.MessageBox.hide();
}

function griddap(){
	Ext.MessageBox.alert('Griddap', 'Griddap is currently not functional');
}
