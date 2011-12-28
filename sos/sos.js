Ext.QuickTips.init();
var sosServerStore = new Array("http://sdf.ndbc.noaa.gov/sos/server.php", "http://opendap.co-ops.nos.noaa.gov/ioos-dif-sos/SOS", "http://habu.apl.washington.edu/pyws/sos.py");
var map;
var sosGetCap;
var sosGetObs;
var sosURL;
var polygonControl;
var selectFeature;
var vectors = new OpenLayers.Layer.Vector("Boundary Box");
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
var locationLayer = new OpenLayers.Layer.Vector('Locations', {
	styleMap: new OpenLayers.StyleMap({
			pointRadius: "${type}", // based on feature.attributes.type
			fillColor: "#666666"
	}),
	renderers: renderer
});
var dataTypeArray = new Array();
var dataTypesStore = new Ext.data.ArrayStore({fields: ['type', 'description', 'fileType']});
var sensorStore;
var variableStore;
var sosURL;
var responseFormats;
var downloadWin;
var reponseRadios = new Array();
var start_time;
var end_time;
var markers = new OpenLayers.Layer.Vector("Overlay");
var features = new Array();
var xg = Ext.grid;
var smSensors = new xg.CheckboxSelectionModel({
	listeners: {
		rowselect: function(selectionModel, rowIndex, record){
			sensorSelect(rowIndex);
		},
		rowdeselect: function(selectionModel, rowIndex, record){
			sensorDeselect(rowIndex);
		}
	}
});
var smVariables = new xg.CheckboxSelectionModel({
	listeners: {
		rowselect: function(selectionModel, rowIndex, record){
			observationStatus();
		},
		rowdeselect: function(selectionModel, rowIndex, record){
			observationStatus();
		}
	}
});
	
//LAYOUT PANELS
var sensorListPanel;
var mapPanel;
var variablesPanel;
var attributesPanel;
var buttonsPanel;
var coordinatesPanel;
var containerPanel;
var graphPanel;
var mainPanel;

function sosInit(){	
	sensorStore = new Ext.data.ArrayStore({
		// store configs
		autoDestroy: true,
		storeId: 'sensorStore',
		// reader configs
		idIndex: 0,  
		fields: 
		[
			'gml_id', 
			'name',
			'shortName',
			'description',
			'begin_time',
			'end_time',
			'llat',
			'llon',
			'ulat',
			'ulon',
			'variables',
			'i'
		]
	});
	variableStore = new Ext.data.ArrayStore({
		// store configs
		autoDestroy: true,
		storeId: 'variableStore',
		// reader configs
		idIndex: 0,  
		fields: 
		[
			'name',
			'property'
		]
	});
	
	map = new OpenLayers.Map('map');
	map.addLayers([new OpenLayers.Layer.OSM, vectors, markers]);
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());
	polygonControl = new OpenLayers.Control.DrawFeature(vectors, OpenLayers.Handler.RegularPolygon, {handlerOptions: {sides: 4}});
	selectFeature = new OpenLayers.Control.SelectFeature(markers);
	markers.events.on({'featureselected': function(feature){featureSelected(feature.feature.attributes.description, feature)}});
	vectors.events.on({'beforefeatureadded': function(){vectors.removeAllFeatures()}});
	vectors.events.on({'featureadded': function(){
		polygonControl.deactivate();
		var topleft = new OpenLayers.Geometry.Point(vectors.features[0].geometry.getVertices()[0].x, vectors.features[0].geometry.getVertices()[0].y);
		var bottomright = new OpenLayers.Geometry.Point(vectors.features[0].geometry.getVertices()[2].x, vectors.features[0].geometry.getVertices()[2].y);
		var topleftLatLonPoint = topleft.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
		var bottomrightLatLonPoint = bottomright.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
		Ext.getCmp('NorthText').setValue(Math.max(topleftLatLonPoint.y, bottomrightLatLonPoint.y));
		Ext.getCmp('SouthText').setValue(Math.min(topleftLatLonPoint.y, bottomrightLatLonPoint.y));
		Ext.getCmp('WestText').setValue(Math.min(topleftLatLonPoint.x, bottomrightLatLonPoint.x));
		Ext.getCmp('EastText').setValue(Math.max(topleftLatLonPoint.x, bottomrightLatLonPoint.x));
		highlightSensors();
	}});
	map.addControl(polygonControl);
	map.addControl(selectFeature);
	selectFeature.activate();
	polygonControl.handler.setOptions({sides: parseInt(4)});
	polygonControl.handler.setOptions({snapAngle: parseFloat(90)});
	polygonControl.handler.setOptions({irregular: true});
	variablesPanel = new xg.GridPanel({
		id: 'variablesPanel',
		title: 'Variables',
		flex: 4,
		width: 400,
		viewConfig:{forceFit:true},
		store: variableStore,
		cm: new xg.ColumnModel({
			defaults: {
				sortable: true
			},
			columns: [
				smVariables,
				{id:'Variable', header: "Variable", width: 95, dataIndex: 'name'},
				{id:'Property', header: "Property", dataIndex: 'property'}
				
			]
		}),
		sm: smVariables,
		columnLines: true,
		bbar:
		{
			items:
			[
				{xtype: 'button', id: 'getObservationsButton', text: 'Get Observations', icon: 'img/submit.png', height: 30, disabled: true, listeners: {click: function(){displayDownloadWindow()}}}
			]
		}
	});
	attributesPanel = new Ext.FormPanel({
		id: 'attributesPanel',
		title: 'Attributes',
		flex: 2,
		autoScroll: true,
		padding: 10,
		items:
		[
			{xtype: 'textfield', id: 'NorthText', fieldLabel: 'North', width: 100},
			{xtype: 'textfield', id: 'SouthText', fieldLabel: 'South', width: 100},
			{xtype: 'textfield', id: 'WestText',  fieldLabel: 'West',  width: 100},
			{xtype: 'textfield', id: 'EastText',  fieldLabel: 'East',  width: 100},
			{
				xtype: 'compositefield', 
				fieldLabel: 'Start Date',
				items:
				[
					{xtype: 'datefield', id: 'startDate', dateFormat: 'd-m-Y', selectOnFocus:true, width: 100},
					{xtype: 'timefield', id: 'startTime', width: 100}
				]
			},
			{
				xtype: 'compositefield', 
				fieldLabel: 'Start Date',
				items:
				[
					{xtype: 'datefield', id: 'endDate', dateFormat: 'd-m-Y', selectOnFocus:true, width: 100},
					{xtype: 'timefield', id: 'endTime', width: 100}
				]
			}
		]
		
	});
	containerPanel = new Ext.Panel({
		id: 'containerPanel',
		border: false,
		region: "east",
		layout: {
			type: 'vbox',
			pack: 'start',
			align: 'stretch'
		},
		width: 400,
		items: [variablesPanel, attributesPanel]
	});
	sensorListPanel = new xg.GridPanel({
		id: 'sensorListPanel',
		region: 'west',
		width: 415,
		viewConfig: {
			forceFit:true
		},
		store: sensorStore,
		cm: new xg.ColumnModel({
			defaults: {
				sortable: true
			},
			columns: [
				smSensors,
				{id:'Station',header: "Station", width: 30, dataIndex: 'gml_id', sortable: false},
				{id:'Description', header: "Description", dataIndex: 'description', sortable: false}
			]
		}),
		sm: smSensors,
		columnLines: true,
		title:'Sensors',
	});
	mapPanel = new GeoExt.MapPanel({
		id: 'mapPanel',
		title: 'Sensor Map',
		region: 'center',
		map: map,
		zoom: 2,
		bbar:
		{
			items:
			[
				{xtype: 'button', id: 'bbBoxButton', text: 'Select bounding box on map', icon: 'img/cross_cursor.gif', height: 30, listeners: {click: function(){polygonControl.activate()}}}
			]
		}
	});
	graphPanel = new Ext.Panel({
		id: 'graphPanel',
		title: 'Time-Series Observation Results',
		region: 'south',
		height: 220,
		collapsible: true,
		hidden: true,
		html: '<h2>Graph Goes Here</h2>'
	});
	mainPanel = new Ext.Panel({
		id: 'mainPanel',
		layout: 'border',
		border: false,
		items: [ sensorListPanel, containerPanel, mapPanel, graphPanel]
	});

	blankServerContainerPanel.removeAll();
	blankServerContainerPanel.add('mainPanel');
	blankServerContainerPanel.doLayout();
}

function sosConnect(url){
	Ext.MessageBox.show({
		msg: 'Connecting...',
		width:300,
		wait:true,
		buttons: Ext.MessageBox.CANCEL,
		waitConfig: {interval:200},
	});
	sosInit();
	if (url.indexOf("?") != -1){
		url = url.substring(0, url.indexOf("?"));
	}
	sosURL = url;
	
	var capRequest = sosURL + '?request=GetCapabilities&service=SOS&version=1.0.0';
	$.ajax({
		type: "GET",
		url:  'proxy.php?u=' + encodeURIComponent(capRequest),
		dataType: "xml",
		success: parseSOSGetCap,
		error: function () {alert("AJAX ERROR for " + capRequest );}
	});	
}

function parseSOSGetCap(xml){
	sosGetCap = new SOSCapabilities(xml);

	if(sosGetCap.namespace === 'EXCEPTION'){
		Ext.MessageBox.hide();
		alert('SOS Exception: ' + sosGetCap.exception_error);
		return;
	}
	else{
		var sensorArray = new Array();
		var variableArray = new Array();
		var startDate;
		var endDate;
		start_time = new Date(sosGetCap.offerings[0].begin_time);
		if (sosGetCap.offerings[0].end_time == "now"){
			end_time = new Date();
		}
		else{
			end_time = new Date(sosGetCap.offerings[0].end_time); 
		}
		
		for (i = 0; i < sosGetCap.offerings.length; i++){
			var temp = new Array();
			temp[0] = capitalizeFirstLetter(sosGetCap.offerings[i].gml_id);
			temp[1] = sosGetCap.offerings[i].name;
			temp[2] = sosGetCap.offerings[i].shortName;
			temp[3] = sosGetCap.offerings[i].description;
			startDate = new Date(sosGetCap.offerings[i].begin_time);
			temp[4] = startDate;
			if (sosGetCap.offerings[i].end_time == "now"){
				endDate = new Date();
			}
			else{
				endDate = new Date(sosGetCap.offerings[i].end_time);
			}
			temp[5] = endDate;
			temp[6] = new Number(sosGetCap.offerings[i].llat);
			temp[7] = new Number(sosGetCap.offerings[i].llon);
			temp[8] = new Number(sosGetCap.offerings[i].ulat);
			temp[9] = new Number(sosGetCap.offerings[i].ulon);
			temp[10] = sosGetCap.offerings[i].properties;
			temp[11] = i;
			features[i] = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.Point(((temp[7] + temp[9]) / 2), ((temp[6] + temp[8]) / 2)).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
				{description: i} ,
				{externalGraphic: 'img/sensor.png', graphicHeight: 20, graphicWidth: 20, graphicXOffset: -10, graphicYOffset: -10}
			);
		
			if (startDate < start_time){
				start_time = startDate;				
			}
			if (endDate > end_time){
				end_time = endDate;				
			}
			for (j = 0; j < sosGetCap.offerings[i].properties.length; j++){
				var name = sosGetCap.offerings[i].properties[j]
				var link = '';
				var divider = '';
				var tempVar = new Array();
				if (name.indexOf("http://") != -1){
					link = name;
					name = name.substring(name.lastIndexOf('/') + 1);
				}

				if (name.indexOf(":") != -1) {
					divider = ':';
				} 
				if (name.indexOf("#") != -1) {
					divider = '#';
				} 
				else {
					divider = ' ';
				}

				if (divider != ' ') {
					name = capitalizeFirstLetter(replaceAll(name, '_', ' '));
					tempVar[0] = name.substring(name.lastIndexOf(divider) + 1);
					tempVar[1] = name.substring(link);
					variableArray.push(tempVar);
				} 
				else {
					name = capitalizeFirstLetter(replaceAll(name, '_', ' '));
					tempVar[0] = name;
					tempVar[1] = link;
					variableArray.push(tempVar);
				}
			}
			sensorArray.push(temp);
		}
		responseFormats = sosGetCap.response_formats;
		markers.addFeatures(features);
		sensorStore.loadData(sensorArray);
		variableStore.loadData(variableArray);
		
		
		
		//Assign Attributes
		/*
		Ext.getCmp('startDate').setValue(formatDate(start_time));
		Ext.getCmp('startTime').setValue(formatTime(start_time));
		Ext.getCmp('endDate').setValue(formatDate(end_time));
		Ext.getCmp('endTime').setValue(formatTime(end_time));
		*/
		Ext.getCmp('startDate').setValue('12/01/2011');
		Ext.getCmp('startTime').setValue('12:00 AM');
		Ext.getCmp('endDate').setValue('12/08/2011');
		Ext.getCmp('endTime').setValue('12:00 AM');
		
		Ext.getCmp('NorthText').setValue("0.0");
		Ext.getCmp('SouthText').setValue("0.0");
		Ext.getCmp('EastText').setValue("0.0");
		Ext.getCmp('WestText').setValue("0.0");
		
		
		//AFTER EVERYTHING HAS BEEN TAKEN CARE OFF
		browsePanel.collapse();
		Ext.MessageBox.hide();
	}
}

function highlightSensors(){	
	features = [];
	var sensorIndex = new Array();
	var northBound = Ext.getCmp('NorthText').getValue();
	var southBound = Ext.getCmp('SouthText').getValue();
	var eastBound = Ext.getCmp('EastText').getValue();
	var westBound = Ext.getCmp('WestText').getValue();
	
	markers.removeAllFeatures();
	
	for (i = 0; i < sosGetCap.offerings.length; i++){
		var llat = new Number(sosGetCap.offerings[i].llat);
		var llon = new Number(sosGetCap.offerings[i].llon);
		var ulat = new Number(sosGetCap.offerings[i].ulat);
		var ulon = new Number(sosGetCap.offerings[i].ulon);
		var offeringLat = (ulat + llat) / 2;
		var offeringLon = (ulon + llon) / 2;
		if (((offeringLon >= westBound) && (offeringLon <= eastBound)) && ((offeringLat >= southBound) && (offeringLat <= northBound))){
			/*
			features[i] = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.Point(offeringLon, offeringLat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
				{description:'London Eye'} ,
				{externalGraphic: 'img/sensor_selected.png', graphicHeight: 20, graphicWidth: 20, graphicXOffset: -10, graphicYOffset: -10}
			);
			*/
			smSensors.selectRow(i, true);
		}
		else{
			/*
			features[i] = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.Point(offeringLon, offeringLat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
				{description:'London Eye'} ,
				{externalGraphic: 'img/sensor.png', graphicHeight: 20, graphicWidth: 20, graphicXOffset: -10, graphicYOffset: -10}
			);
			*/
			smSensors.deselectRow(i);
		}

	}
}

function sensorSelect(i){
	markers.removeFeatures(features[i]);
	var llat = new Number(sosGetCap.offerings[i].llat);
	var llon = new Number(sosGetCap.offerings[i].llon);
	var ulat = new Number(sosGetCap.offerings[i].ulat);
	var ulon = new Number(sosGetCap.offerings[i].ulon);
	var offeringLat = (ulat + llat) / 2;
	var offeringLon = (ulon + llon) / 2;
	features[i] = new OpenLayers.Feature.Vector(
		new OpenLayers.Geometry.Point(offeringLon, offeringLat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		{description:'London Eye'} ,
		{externalGraphic: 'img/sensor_selected.png', graphicHeight: 20, graphicWidth: 20, graphicXOffset: -10, graphicYOffset: -10}
	);
	markers.addFeatures(features[i]);
	observationStatus();
}

function sensorDeselect(i){
	markers.removeFeatures(features[i]);
	var llat = new Number(sosGetCap.offerings[i].llat);
	var llon = new Number(sosGetCap.offerings[i].llon);
	var ulat = new Number(sosGetCap.offerings[i].ulat);
	var ulon = new Number(sosGetCap.offerings[i].ulon);
	var offeringLat = (ulat + llat) / 2;
	var offeringLon = (ulon + llon) / 2;
	features[i] = new OpenLayers.Feature.Vector(
		new OpenLayers.Geometry.Point(offeringLon, offeringLat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		{description:'London Eye'} ,
		{externalGraphic: 'img/sensor.png', graphicHeight: 20, graphicWidth: 20, graphicXOffset: -10, graphicYOffset: -10}
	);
	markers.addFeatures(features[i]);
	observationStatus();
}

function observationStatus(){
	if ((smSensors.getSelections().length > 0) && (smVariables.getSelections().length > 0))
	{
		Ext.getCmp('getObservationsButton').enable();
	}
	else{
		Ext.getCmp('getObservationsButton').disable();
	}
}

function downloadObservations(downloadWindow, response_format){
	var variablesArray = smVariables.getSelections();
	for (i = 0; i < sensorStore.data.length; i++){
		if (smSensors.isSelected(i)){
			var url = '';
			var sensorVariables = sensorStore.getAt(i).get('variables');
			for (j = 0; j < variablesArray.length; j++){
				var value = variablesArray[j].get('property');
				if (sensorVariables.indexOf(value) > -1){
					url += value + ',';
				}
			}
			if (url.length != 0){
				url = url.substring(0, url.length - 1);
			}	
			var obsURL = sosGetCap.offerings[i].getObsUrlFormat(response_format, sosGetCap.offerings[i].properties[0]);
			var subIndex = obsURL.indexOf("&observedproperty=");
			obsURL = obsURL.substring(0, subIndex);
			obsURL = obsURL + '&observedproperty=' + url;
			//obsURL = obsURL.substring(0, obsURL.length - 1);
			obsURL += '&eventTime=' + formatDateUTC(Ext.getCmp('startDate').getValue(), Ext.getCmp('startTime').getValue()) + '/' + formatDateUTC(Ext.getCmp('endDate').getValue(), Ext.getCmp('endTime').getValue());
			
			downloadWindow.close();
			//alert(obsURL);
			window.open(obsURL);
		}
	}
}

function featureSelected(i, feature){
	var record = sensorStore.getAt(i);
	var llat = new Number(record.get('llat'));
	var llon = new Number(record.get('llon'));
	var ulat = new Number(record.get('ulat'));
	var ulon = new Number(record.get('ulon'));
	var offeringLat = (ulat + llat) / 2;
	var offeringLon = (ulon + llon) / 2;
	var title = record.get('gml_id');
	var description = record.get('description');
	var begin_time = record.get('begin_time');
	var end_time = record.get('end_time');
	var variables = record.get('variables');
	var html = '<table cellpadding="10">';
	html += '<tr><td>' + 'Location: ' + '</td><td>' + '(' + offeringLon + ', ' + offeringLat + ')' + '</td></tr>';
	html += '<tr><td>' + 'Start Date: ' + '</td><td>' + formatDate(new Date(begin_time)) + '</td></tr>';
	html += '<tr><td>' + 'End Date: ' + '</td><td>' + formatDate(new Date(end_time)) + '</td></tr>';
	for (j = 0; j < variables.length; j++){
		var name = variables[j];
		var divider = '';
		if (name.indexOf("http://") != -1){
			name = name.substring(name.lastIndexOf('/') + 1);
		}
		if (name.indexOf(":") != -1) {
			divider = ':';
		} 
		if (name.indexOf("#") != -1) {
			divider = '#';
		} 
		else {
			divider = ' ';
		}
		if (divider != ' ') {
			name = capitalizeFirstLetter(replaceAll(name, '_', ' '));
		} 
		else {
			name = capitalizeFirstLetter(replaceAll(name, '_', ' '));
		}
		html += '<tr><td>' + name + ':</td><td>' + '<a onClick="alert(' + "'Analysis is currently not available'" + ')"><img src="img/graph.png" /></a>' + '</td></tr>';
	}
	html += '</table>';
	
	var popup = new GeoExt.Popup({
		title: title + ', ' + description,
		location: feature.feature,
		html: html,
		padding: 10
	});
	popup.on({
		close: function() {
				selectFeature.unselect(feature.feature);
		}
	});
	popup.show();
}

function displayDownloadWindow(){
	for (i = 0; i < responseFormats.length; i++){
		if (responseFormats[i].indexOf("0.6.1") != -1){
			reponseRadios.push({xtype: 'radio', id: 'IOOS DIF (0.6.1)RadioButton', boxLabel: 'IOOS DIF (0.6.1)', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		//YO LOOK HERE
		else if (responseFormats[i].indexOf("swe") != -1){
			reponseRadios.push({xtype: 'radio', id: 'SWE 1.0.0RadioButton', disabled: true, boxLabel: 'SWE 1.0.0', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		else if (responseFormats[i].indexOf("kml") != -1){
			reponseRadios.push({xtype: 'radio', id: 'KMLRadioButton', boxLabel: 'KML', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		else if (responseFormats[i].indexOf("csv") != -1){
			reponseRadios.push({xtype: 'radio', id: 'Comma SeperatedRadioButton', boxLabel: 'Comma Seperated', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		else if (responseFormats[i].indexOf("tab-separated-values") != -1){
			reponseRadios.push({xtype: 'radio', id: 'Tab SeperatedRadioButton', boxLabel: 'Tab Seperated', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		//YO LOOK HERE
		else if (responseFormats[i].indexOf("om/1.0.0") != -1){
			reponseRadios.push({xtype: 'radio', id: 'OM (1.0.0)RadioButton', disabled: true, boxLabel: 'OM (1.0.0)', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		else{
			reponseRadios.push({xtype: 'radio', id: responseFormats[i] + 'RadioButton', boxLabel: responseFormats[i], name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		}

		if (responseFormats[i].indexOf("0.6.1") != -1){
			reponseRadios.push({xtype: 'radio', id: 'ARC (post-process from DIF)RadioButton', disabled: true, boxLabel: 'ARC (post-process from DIF)', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
			reponseRadios.push({xtype: 'radio', id: 'NetCDF (post-process from DIF)RadioButton', disabled: true, boxLabel: 'NetCDF (post-process from DIF)', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
			reponseRadios.push({xtype: 'radio', id: 'CSV (post-process from DIF)RadioButton', disabled: true, boxLabel: 'CSV (post-process from DIF)', name: 'rb-col', inputValue: 'text/csv', listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		} 
		else if (responseFormats[i].indexOf("swe") != -1){
			reponseRadios.push({xtype: 'radio', id: 'ARC (post-process from SWE)RadioButton', disabled: true, boxLabel: 'ARC (post-process from SWE)', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
			reponseRadios.push({xtype: 'radio', id: 'NetCDF (post-process from SWE)RadioButton', disabled: true, boxLabel: 'NetCDF (post-process from SWE)', name: 'rb-col', inputValue: responseFormats[i], listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
			reponseRadios.push({xtype: 'radio', id: 'CSV (post-process from SWE)RadioButton', disabled: true, boxLabel: 'CSV (post-process from SWE)', name: 'rb-col', inputValue: 'text/csv', listeners: {check: function(){Ext.getCmp('downloadObservationButton').enable();}}});
		}
	}
	
	downloadWin = new Ext.Window({
		title: 'Get Observations',
		layout: 'hbox',
		layoutConfig: {
			align : 'stretch',
			pack  : 'start',
		},
		width: 350,
		height: 300,
		autoScroll: true,
		closeAction: 'close',
		modal: true,
		items: 
		[
			new Ext.FormPanel({
				id: 'radioGroupPanel',
				border: false,
				padding: 10,
				flex: 2,
				items: 
				[
					{
						xtype: 'radiogroup',
						id: 'responseRadioGroup',
						hideLabel: true,
						itemCls: 'x-check-group-alt',
						columns: 1,
						items: reponseRadios
					}
				]
			})
		],
		bbar: 	
		{
			items:
			[
				{xtype: 'button', id: 'downloadObservationButton', text: 'Download Data', icon: 'img/submit.png', height: 30, disabled: true, listeners: {click: function(){downloadObservations(downloadWin, Ext.getCmp('responseRadioGroup').getValue().getRawValue());}}},
			]
		}
	});
	
	if(smSensors.getSelections().length > 1){
		Ext.getCmp('radioGroupPanel').add({xtype: 'label', text: 'Downloading data from multiple sensors will cause multiple download prompts to appear.', style: {fontStyle: 'italic'}});
	}
	
	downloadWin.show(this);
}