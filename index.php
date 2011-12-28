<!DOCTYPE HTML>
<html lang="en-US">
<head>
	<title>Environmetal Data Connector</title>
	<link rel="shortcut icon" href="img/ASA_EDC.png" />	
	<!--FRAMEWORK INCLUDES-->
	<link rel="stylesheet" type="text/css" href="js/ExtJS/resources/css/ext-all.css" />
	<link rel="stylesheet" type="text/css" href="js/GeoExt/resources/css/geoext-all-debug.css" />
	<script type="text/javascript" src="js/ExtJS/adapter/ext/ext-base-debug.js"></script>
	<script type="text/javascript" src="js/ExtJS/ext-all-debug.js"></script>
	<script language="JavaScript" type="text/javascript" src="js/OpenLayers/OpenLayers.js"></script>
	<script language="JavaScript" type="text/javascript" src="js/jquery-1.6.js"></script>
	<script language="JavaScript" type="text/javascript" src="js/GeoExt/lib/GeoExt.js"></script>
	<script type="text/javascript" src="misc.js"></script>
	<!--ERRDAPP INCLUDES-->
	<script type="text/javascript" src="erddap/erddap.js"></script>
	<script type="text/javascript" src="erddap/erddapserver.js"></script>
	<script type="text/javascript" src="erddap/erddapdataset.js"></script>
	<script type="text/javascript" src="erddap/erddapvariable.js"></script>
	<!--SOS INCLUDES-->
	<script type="text/javascript" src="sos/sos.js"></script>
	<script type="text/javascript" src="sos/sensorcontainer.js"></script>
	<script type="text/javascript" src="sos/jquery.parseSOSGetCap.js"></script>
	<script type="text/javascript" src="sos/jquery.parseSOSGetObs.js"></script>
	
	<script type="text/javascript">
		var catalogServerStore = new Array();
		var directAccessServerStore = new Array();
		var sosServerStore = new Array("http://sdf.ndbc.noaa.gov/sos/server.php", "http://opendap.co-ops.nos.noaa.gov/ioos-dif-sos/SOS", "http://habu.apl.washington.edu/pyws/sos.py");
		var erddapServerStore = new Array("http://coastwatch.pfeg.noaa.gov/erddap/");
		var blankServerContainerPanel;
		var mainViewport;
		function init(){
			blankServerContainerPanel = new Ext.Panel({
				id: 'blankServerContainerPanel',
				region: 'center',
				layout: 'fit',
				border: false				
			});
			browsePanel = new Ext.FormPanel({
				id: 'browsePanel',
				title: "Browse",
				region: "north",
				layout: 'absolute',
				height: 160,
				collapsible: true,
				items: 
				[
					{xtype: 'label',
						text: 'Catalog URL:',
						x: 10,
						y: 12,
						disabled: true,
						style: {font: 'normal 12px tahoma, arial,verdana, sans-serif', color: '#333'}
					},	
					{xtype: 'label',
						text: 'Direct Access URL:',
						x: 10,
						y: 42,
						disabled: true,
						style: {font: 'normal 12px tahoma, arial,verdana, sans-serif', color: '#333'}
					},	
					{xtype: 'label',
						text: 'Sensor Obs Service:',
						x: 10,
						y: 72,
						style: {font: 'normal 12px tahoma, arial,verdana, sans-serif', color: '#333'}
					},	
					{xtype: 'label',
						text: 'ERDDAP Server:',
						x: 10,
						y: 102,
						style: {font: 'normal 12px tahoma, arial,verdana, sans-serif', color: '#333'}
					},	
					{xtype: 'combo',
						id: 'txtCatalogURL',
						width: 710,
						x: 140,
						y: 10,
						triggerAction: 'all',
						disabled: true,
						//store: sosServerStore
					},
					{xtype: 'combo',
						id: 'txtDirectAccessURL',
						width: 710,
						x: 140,
						y: 40,
						triggerAction: 'all',
						disabled: true,
						//store: sosServerStore
					},
					{xtype: 'combo',
						id: 'txtSOS',
						width: 710,
						x: 140,
						y: 70,
						triggerAction: 'all',
						store: sosServerStore
					},
					{xtype: 'combo',
						id: 'txtERDDAP',
						width: 710,
						x: 140,
						y: 100,
						store: erddapServerStore
					},
					{xtype: 'button',
						id: 'btnCatalogURL',
						text: 'Connect',
						x: 860,
						y: 10,
						disabled: true
					},
					{xtype: 'button',
						id: 'btnDirectAccessURL',
						text: 'Connect',
						x: 860,
						y: 40,
						disabled: true
					},
					{xtype: 'button',
						id: 'btnSOS',
						text: 'Connect',
						x: 860,
						y: 70,
						listeners: {
							click: function(){
								sosConnect(Ext.getCmp('txtSOS').getValue());
							}
						}
					},
					{xtype: 'button',
						id: 'btnERDDAP',
						text: 'Connect',
						x: 860,
						y: 100,
						listeners: {
							click: function(){
								ErddapConnect(Ext.getCmp('txtERDDAP').getValue());
							}
						}
					}
				]
			});
			mainViewport = new Ext.Viewport({
				id: 'mainViewport',
				forceFit: true,
				layout: "border",
				defaults: {autoScroll: true}, 
				items: [browsePanel, blankServerContainerPanel]
			});
			Ext.getCmp('txtSOS').setValue(sosServerStore[0]);
			Ext.getCmp('txtERDDAP').setValue(erddapServerStore[0]);
		}
	</script>
</head>
<body onload="Ext.onReady(function(){init()})">
</body>
</html>