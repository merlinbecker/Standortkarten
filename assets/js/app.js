var url="service.php";
var proxy="proxy.php";

var map, featureList, blSearch = [],lkSearch=[],transportBetonSearch=[],natursteinSearch=[],kiesundsandSearch=[],asphaltSearch=[],recyclingSearch=[],theaterSearch = [], museumSearch = [];
var isCollapsed;
var baseLayers;
var groupedOverlays;
var layerControl;

var testversion=false;


var selectedBranchen=new Array();
var selectedLaender=new Array();
var obj_layer_branchen={};
var obj_branchen={};
/**
backend communication functions
**/
function checkLogin(){
	var data="{ \"command\": \"checkLogin\"}";
	data={"d":Base64.encode(data)};
	$.post(url, data ,loginChecked);
}

/**prüft, ob der Nutzer gerade eingeloggt ist oder nicht**/
function isLoggedIn(data){
	if(data.status=="success") return true;
	else return false;
}

/* !Login Funktionen */ 
function loginChecked(data){
	eval("data="+Base64.decode(data));
	currentversion=data.version;
	
	if(isLoggedIn(data)){
		holeInitialData();	
		if(data.testversion=="Testversion")	{
			
		testversion=true;
			$("#hinweis_testversion").show();
			setDocumentTitle("Standortkarten "+currentversion+" EINGESCHRÄNKTE TESTVERSION");
		}
		else{
		testversion=false;
		$("#hinweis_testversion").hide();
			setDocumentTitle("Standortkarten "+currentversion);
		}
	}
	else if(data.details=="username_wrong"){
		$("#feedback_login").show();
		$("#loginform")[0].reset();
		$("#nutzername").focus();
		$("#ladebalken_login").hide();
	}
	else{
		displayLoginForm();
	}
}

function displayLoginForm(){
	$("#feedback_login").hide();
	$("#ladebalken_login").hide();
	$("#loginModal").modal({
		backdrop: 'static',
		keyboard: false
		});
}

function holeInitialData(){
 	var data="{ \"command\": \"getInitialData\"}";
	data={"d":Base64.encode(data)};
	$.post(url,data,initialDataReceived);
 }
 
 function initialDataReceived(data){
	eval("data="+Base64.decode(data));
	
	if(isLoggedIn(data)){
		$('#loginModal').modal('hide');
		$("#bso_navbar").show();
		enableWebApp();
	}
	else{
		displayLoginForm();
	}
}
function setDocumentTitle(text){
 	$(document).attr('title',text);
 }
 
function loggedOut(data){
	window.location.reload();
} 

function enableWebApp(){
	$("#loading").show();
	//hole die Bundeslaender
	var data="{ \"command\": \"getBundeslaender\"}";
		data={"d":Base64.encode(data)};
	$.post(url, data ,bundesland_recieve);
}

function bundesland_recieve(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
		$.each(data.data, function( index, value ) {
			selectedLaender.push(value.id);
			bundeslaender.addData(value.grenzen);
			landkreise.addData(value.landkreise);
	});
	
	//hole die Branchen
	var data="{ \"command\": \"getBranchen\"}";
		data={"d":Base64.encode(data)};
	$.post(url, data ,branchen_recieve);
	
	
	}
}
function branchen_recieve(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
		$.each(data.data, function( index, value ) {
			selectedBranchen.push(value.id);
			var newBranchLayer=L.geoJson(null);
			var obj={};
			obj[value.id]=newBranchLayer;
			$.extend(obj_layer_branchen, obj);
			//Object.assign(obj_layer_branchen,obj);
			var obj2={};
			obj2["<span class=\"icon_branche icon_"+value.id+"\"></span>"+value.beschreibung]=newBranchLayer;
			$.extend(obj_branchen,obj2);
			//Object.assign(obj_branchen,obj2);
		});
		
		//hole die Pins
		var data="{\"command\":\"getPins\",\"branche\":\""+selectedBranchen.join()+"\",\"bundesland\":\""+selectedLaender.join()+"\"}";
		data={"d":Base64.encode(data)};
		$.post(url,data,pinsRecieved);
	}	
}
function pinsRecieved(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
		$.each(data.data.features, function( index, value ) {
			switch(parseInt(value.properties.branche)){
				case 1:
				branche_asphalt.addData(value);
				break;
				case 2:
				branche_recycling.addData(value);
				break;
				case 3:
				branche_kiesundsand.addData(value);
				break;
				case 4:
				branche_naturstein.addData(value);
				break;
				case 5:
				branche_transportBeton.addData(value);
				break;
				default:
				theaters.addData(value);
			}
			
		});
		
		console.log(data.data);
		prepareResults();
	}
}

function prepareResults(){
	
	groupedOverlays = {
	  "Länder & Kreise": {
		"Bundesländer": bundeslaender,
		"Landkreise":landkreise
		},
	 "Branchen":obj_branchen
	};
	map.addLayer(bundeslaender);
	
	
	var layerControl = L.control.groupedLayers(baseLayers,groupedOverlays, {
	  collapsed: isCollapsed
	});
	
	
	sizeLayerControl();
	$(window).resize(function() {
	  sizeLayerControl();
	});

	$(document).on("click", ".feature-row", function(e) {
	  $(document).off("mouseout", ".feature-row", clearHighlight);
	  sidebarClick(parseInt($(this).attr("id"), 10));
	});

	if ( !("ontouchstart" in window) ) {
	  $(document).on("mouseover", ".feature-row", function(e) {
		highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
	  });
	}

	$(document).on("mouseout", ".feature-row", clearHighlight);
	
	/* Highlight search box text on click */
	$("#searchbox").click(function () {
	  $(this).select();
	});

	/* Prevent hitting enter from refreshing the page */
	$("#searchbox").keypress(function (e) {
	  if (e.which == 13) {
		e.preventDefault();
	  }
	});

	$("#featureModal").on("hidden.bs.modal", function (e) {
	  $(document).on("mouseout", ".feature-row", clearHighlight);
	});
	
	
	
	
	
	$("#sidebar-toggle-btn").click(function() {
	  animateSidebar();
	  return false;
	});
	
	L.control.mapCenterCoord({
		onMove:true
	}).addTo(map);
	
	L.control.scale({metric:true,imperial:false}).addTo(map);
	map.attributionControl.addAttribution("&copy; <a href='https://www.stein-verlaggmbh.de'>Stein-Verlag Baden-Baden</a>");

	/* Layer control listeners that allow for a single markerClusters layer */
	map.on("overlayadd", function(e) {
	  $.each(obj_layer_branchen, function( index, value ){
		  if(e.layer==value){
			 switch(parseInt(index)){
				 case 1:
				 markerClusters.addLayer(branche_asphalt);
				 break;
				 case 2:
				 markerClusters.addLayer(branche_recycling);
				 break;
				 case 3:
				 markerClusters.addLayer(branche_kiesundsand);
				 break;
				  case 4:
				 markerClusters.addLayer(branche_naturstein);
				 break;
				 case 5:
				 markerClusters.addLayer(branche_transportBeton);
				 break;
				 default:
				 markerClusters.addLayer(theaters);
				 break;
				 
			 } 
			  
			  
			
			syncSidebar();
		  }
	  });
	});

	map.on("overlayremove", function(e) {
		 $.each(obj_layer_branchen, function( index, value ){
		if(e.layer==value){
			 switch(parseInt(index)){
				 case 1:
				 markerClusters.removeLayer(branche_asphalt);
				 break;
				 case 2:
				 markerClusters.removeLayer(branche_recycling);
				 break;
				  case 3:
				 markerClusters.removeLayer(branche_kiesundsand);
				 break;
				  case 4:
				 markerClusters.removeLayer(branche_naturstein);
				 break;
				  case 5:
				 markerClusters.removeLayer(branche_transportBeton);
				 break;
				 default:
				 markerClusters.removeLayer(theaters);
				 break;
				 
			 }
		syncSidebar();
	  }
	});});

	/* Filter sidebar feature list to only show features in current map bounds */
	map.on("moveend", function (e) {
	  syncSidebar();
	});

	/* Clear feature highlight when map is clicked */
	map.on("click", function(e) {
	  highlight.clearLayers();
	});
	
	zoomControl.addTo(map);
	locateControl.addTo(map);
	layerControl.addTo(map);
	
	
	
	// Leaflet patch to make layer control scrollable on touch browsers
	var container = $(".leaflet-control-layers")[0];
	if (!L.Browser.touch) {
	  L.DomEvent
	  .disableClickPropagation(container)
	  .disableScrollPropagation(container);
	} else {
	  L.DomEvent.disableClickPropagation(container);
	}
	
	/* Typeahead search functionality */
	//$(document).one("ajaxStop", function () {
	  $("#loading").hide();
	  sizeLayerControl();
	  /* Fit map to boroughs bounds */
	  /*map.fitBounds(bundeslaender.getBounds());*/
	  featureList = new List("features", {valueNames: ["feature-name"]});
	  featureList.sort("feature-name", {order:"asc"});

	  var bundeslaenderBH = new Bloodhound({
		name: "Bundesl",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: blSearch,
		limit: 10
	  });
	  
	  var landkreiseBH = new Bloodhound({
		name: "Landk",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: lkSearch,
		limit: 10
	  });
	var asphaltBH=new Bloodhound({
		name: "Asphalt",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: asphaltSearch,
		limit: 10
	  });
	  var transportBetonBH=new Bloodhound({
		name: "TransportBeton",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: transportBetonSearch,
		limit: 10
	  });
	  var natursteinBH=new Bloodhound({
		name: "Naturstein",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: natursteinSearch,
		limit: 10
	  });
	  var recyclingBH=new Bloodhound({
		name: "Baustoff-Recycling",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: recyclingSearch,
		limit: 10
	  });
	  
	  var kiesundSandBH=new Bloodhound({
		name: "Kies und Sand",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: kiesundsandSearch,
		limit: 10
	  });
	
	
	  var theatersBH = new Bloodhound({
		name: "Theaters",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: theaterSearch,
		limit: 10
	  });

	  var museumsBH = new Bloodhound({
		name: "Museums",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: museumSearch,
		limit: 10
	  });

	  var geonamesBH = new Bloodhound({
		name: "GeoNames",
		datumTokenizer: function (d) {
		  return Bloodhound.tokenizers.whitespace(d.name);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		remote: {
		  //url: "http://api.geonames.org/postalCodeSearchJSON?maxRows=10&username=lordmerlo&country=DE",
		  url:proxy+"?maxRows=10&username=lordmerlo&country=DE",
		  transform: function (data) {
			  $("#searchicon").removeClass("fa-sync-alt fa-spin").addClass("fa-search");
			console.log(data);
			return $.map(data.postalCodes, function (result) {
			  return {
				name: result.postalCode+" "+result.placeName + ", " + result.adminCode1,
				lat: result.lat,
				lng: result.lng,
				source: "GeoNames"
			  };
			});
		  },
		  prepare: function (query, settings) {
			if(!isNaN(query.substring(0,4))){
				settings.url+="&postalcode_startsWith="+encodeURIComponent(query.substring(0,4));
			}
			else if(isNaN(query))
			  settings.url+="&placename_startsWith="+encodeURIComponent(query);
			else 
			  settings.url+="&postalcode_startsWith="+encodeURIComponent(query);
			$("#searchicon").removeClass("fa-search").addClass("fa-sync-alt fa-spin");
            return settings;
           },
		},
		limit: 10
	  });
	  landkreiseBH.initialize();
	  bundeslaenderBH.initialize();
	  asphaltBH.initialize();
	  transportBetonBH.initialize();
	  natursteinBH.initialize();
	  recyclingBH.initialize();
	  kiesundSandBH.initialize();
	  theatersBH.initialize();
	  museumsBH.initialize();
	  geonamesBH.initialize();
	  
	  /* instantiate the typeahead UI */
	  $("#searchbox").typeahead({
		minLength: 3,
		highlight: true,
		hint: false
	  }, {
		name: "Bundesl",
		displayKey: "name",
		source: bundeslaenderBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Bundesländer</h4>"
		}
	  }, 
	   {
		name: "Landkreise",
		displayKey: "name",
		source: landkreiseBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Landkreise</h4>"
		}
	  }, 
	  {
		name: "Asphalt",
		displayKey: "name",
		source: asphaltBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Asphalt</h4>"
		}
	  }, 
	  {
		name: "TransportBeton",
		displayKey: "name",
		source: transportBetonBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Transportbeton</h4>"
		}
	  }, 
	  {
		name: "Naturstein",
		displayKey: "name",
		source: natursteinBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Naturstein</h4>"
		}
	  }, 
	  {
		name: "BaustoffRecycling",
		displayKey: "name",
		source: recyclingBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Baustoff-Recycling</h4>"
		}
	  }, 
	  {
		name: "KiesundSand",
		displayKey: "name",
		source: kiesundSandBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'>Kies und Sand</h4>"
		}
	  }, 
	   {
		name: "GeoNames",
		displayKey: "name",
		source: geonamesBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;Orte</h4>"
		}
	  }).on("typeahead:selected", function (obj, datum) {
		if (datum.source === "Bundesl"||datum.source === "Landkreise") {
		  map.fitBounds(datum.bounds);
		}
		if (datum.source === "Asphalt") {
		  if (!map.hasLayer(obj_layer_branchen[1])) {
			map.addLayer(obj_layer_branchen[1]);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			map._layers[datum.id].fire("click");
		  }
		}
		if (datum.source === "Naturstein") {
		  if (!map.hasLayer(obj_layer_branchen[4])) {
			map.addLayer(obj_layer_branchen[4]);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			map._layers[datum.id].fire("click");
		  }
		}
		if (datum.source === "TransportBeton") {
		  if (!map.hasLayer(obj_layer_branchen[5])) {
			map.addLayer(obj_layer_branchen[5]);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			map._layers[datum.id].fire("click");
		  }
		}
		if (datum.source === "BaustoffRecycling") {
		  if (!map.hasLayer(obj_layer_branchen[2])) {
			map.addLayer(obj_layer_branchen[2]);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			map._layers[datum.id].fire("click");
		  }
		}
		if (datum.source === "KiesundSand") {
		  if (!map.hasLayer(obj_layer_branchen[3])) {
			map.addLayer(obj_layer_branchen[3]);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			map._layers[datum.id].fire("click");
		  }
		}
		
		if (datum.source === "Museums") {
		  if (!map.hasLayer(museumLayer)) {
			alert("add layer here!!");
			map.addLayer(museumLayer);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			  alert("add layer here!!");
			map._layers[datum.id].fire("click");
		  }
		}
		if (datum.source === "GeoNames") {
		  map.setView([datum.lat, datum.lng], 14);
		}
		if ($(".navbar-collapse").height() > 50) {
		  $(".navbar-collapse").collapse("hide");
		}
	  }).on("typeahead:opened", function () {
		$(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
		$(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
	  }).on("typeahead:closed", function () {
		$(".navbar-collapse.in").css("max-height", "");
		$(".navbar-collapse.in").css("height", "");
	  });
	  $(".twitter-typeahead").css("position", "static");
	  $(".twitter-typeahead").css("display", "block");
	//});
	$("#sidebar").show();
	syncSidebar();
}

$(document).ready(function(){
	$("#sidebar").hide();
	$("#loading").hide();
	$("#bso_navbar").hide();
	
	$("#loginform").submit(function(evt){	
		$("#ladebalken_login").show();
		var data="{ \"command\": \"login\",\"username\":\""+$('#nutzername').val()+"\",\"passwort\":\""+$('#password').val()+"\"}";
		data={"d":Base64.encode(data)};
		$.post(url, data ,loginChecked);
		evt.stopPropagation();
		return false;
	});
	
	
	$("#testaccount").click(function(evt){
		$("#nutzername").val("test@test.de");
		$("#password").val("test");
		einfuehrung=true;
		$("#loginform").submit();
		evt.stopPropagation();
		return false;
	});
	
	$("#nav_logout").click(function(evt){
		if(confirm("Möchten Sie sich ausloggen?")){
			var data="{ \"command\": \"logout\"}";
			data={"d":Base64.encode(data)};
			$.post(url,data,loggedOut);
			}
	});
	
	
	
	
	checkLogin();
	
	/* Larger screens get expanded layer control and visible sidebar */
	if (document.body.clientWidth <= 767) {
	  isCollapsed = true;
	} else {
	  isCollapsed = false;
	}
	
	baseLayers = {
	  "OpenStreetMaps.de": osmde
	};
	
	$("#nav_standorte").click(function() {
	  $("#features").show();
	  $("#umkreis").hide();
	  $("#route").hide();
	  if($("#sidebar").is(":hidden"))
		animateSidebar();
	return false;
	});
	
	$("#nav_umkreis").click(function(){
		$("#features").hide();
	  $("#umkreis").show();
	  $("#route").hide();
	  if($("#sidebar").is(":hidden"))
		animateSidebar();
	return false;
	});
	
	$("#nav_route").click(function(){
		$("#features").hide();
	  $("#umkreis").hide();
	  $("#route").show();
	  if($("#sidebar").is(":hidden"))
		animateSidebar();
	return false;
	});
	
	$("#umkreisRadio1").click(function(){
		$("#umkreis_select_km").show();
		$("#umkreis_select_min").hide();
	});
	$("#umkreisRadio2s").click(function(){
		$("#umkreis_select_km").hide();
		$("#umkreis_select_min").show();
	});
	
	$("#uk_mitte").click(function(evt){
		mitte=L.latLng(map.getCenter());
		console.log("Kartenmitte wurde geklickt");
		console.log(L.latLng(map.getCenter()));
	});
	
	$(".sidebar-hide-btn").click(function() {
	  animateSidebar();
	  return false;
	});
	
	
	var southWest = L.latLng(43.08506, 3.69489),
    northEast = L.latLng(59.46638,19.31867),
    bounds = L.latLngBounds(southWest, northEast);
	
	map = L.map("map", {
	  zoom: 7,
	  maxZoom:18,
	  minZoom:7,
	  maxBounds: bounds,
	  useCache: true,
	  crossOrigin: true,
	  center: [51,10],
	  layers: [osmde,markerClusters,highlight],//bundeslaender],// , ],*/
	  zoomControl: false,
	  attributionControl: true
	});
	
	return;
	
});

function animateSidebar() {
	  $("#sidebar").animate({
		width: "toggle"
	  }, 350, function() {
		map.invalidateSize();
	  });
}
	
function sizeLayerControl() {
	$("#map").css("height",$("body").height()-$(".navbar").outerHeight());	
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  highlight.clearLayers();
}

function sidebarClick(id) {
  var layer = markerClusters.getLayer(id);
  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  /* Empty sidebar features */
  $("#feature-list tbody").empty();
  /* Loop through theaters layer and add only features which are in the map bounds */
  branche_asphalt.eachLayer(function (layer) {
    if (map.hasLayer(obj_layer_branchen[1])) {
      if (map.getBounds().contains(layer.getLatLng())) {
		  var css_class="icon_1";
		  if(layer.feature.properties.Art!="HW")css_class="icon_zweitwerk";
		  
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;padding:0"><span class="icon_branche_tbl '+css_class+'"></span></td><td class="feature-name">' +layer.feature.properties.id+' '+layer.feature.properties.Name1 +' '+layer.feature.properties.Name2+' '+layer.feature.properties.Name3+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  branche_naturstein.eachLayer(function (layer) {
    if (map.hasLayer(obj_layer_branchen[4])) {
      if (map.getBounds().contains(layer.getLatLng())) {
		  var css_class="icon_4";
		  if(layer.feature.properties.Art!="HW")css_class="icon_zweitwerk";
		  
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;padding:0"><span class="icon_branche_tbl '+css_class+'"></span></td><td class="feature-name">' +layer.feature.properties.id+' '+layer.feature.properties.Name1 +' '+layer.feature.properties.Name2+' '+layer.feature.properties.Name3+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  branche_transportBeton.eachLayer(function (layer) {
    if (map.hasLayer(obj_layer_branchen[5])) {
      if (map.getBounds().contains(layer.getLatLng())) {
		  var css_class="icon_5";
		  if(layer.feature.properties.Art!="HW")css_class="icon_zweitwerk";
		  
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;padding:0"><span class="icon_branche_tbl '+css_class+'"></span></td><td class="feature-name">' +layer.feature.properties.id+' '+layer.feature.properties.Name1 +' '+layer.feature.properties.Name2+' '+layer.feature.properties.Name3+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  branche_recycling.eachLayer(function (layer) {
    if (map.hasLayer(obj_layer_branchen[2])) {
      if (map.getBounds().contains(layer.getLatLng())) {
		  var css_class="icon_2";
		  if(layer.feature.properties.Art!="HW")css_class="icon_zweitwerk";
		  
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;padding:0"><span class="icon_branche_tbl '+css_class+'"></span></td><td class="feature-name">' +layer.feature.properties.id+' '+layer.feature.properties.Name1 +' '+layer.feature.properties.Name2+' '+layer.feature.properties.Name3+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
   branche_kiesundsand.eachLayer(function (layer) {
    if (map.hasLayer(obj_layer_branchen[3])) {
      if (map.getBounds().contains(layer.getLatLng())) {
		  var css_class="icon_3";
		  if(layer.feature.properties.Art!="HW")css_class="icon_zweitwerk";
		  
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;padding:0"><span class="icon_branche_tbl '+css_class+'"></span></td><td class="feature-name">' +layer.feature.properties.id+' '+layer.feature.properties.Name1 +' '+layer.feature.properties.Name2+' '+layer.feature.properties.Name3+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  /* Update list.js featureList */
  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
 
  $("#features").css("max-height",$("body").height()-$(".navbar").outerHeight()); 
  }

/* Basemap Layers */

var osmde = L.tileLayer("https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Mitwirkende'
});

/* Overlay Layers */
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#000000",
  fillOpacity: 0.7,
  radius: 10
};




var bundeslaender = L.geoJson(null, {
  style: function (feature) {
    return {
      color: "black",
      fill: false,
      opacity: 1,
      clickable: false
    };
  },
  onEachFeature: function (feature, layer) {
    blSearch.push({
      name: layer.feature.properties.GEN,
      source: "Bundesl",
      id: L.stamp(layer),
      bounds: layer.getBounds()
    });
  }
}).bindTooltip(function (layer) {
    return layer.feature.properties.GEN;
 }
);

var landkreise = L.geoJson(null, {
  style: function (feature) {
    return {
      color: "gray",
      fill: false,
      opacity: 1,
      clickable: false
    };
  },
  onEachFeature: function (feature, layer) {
    lkSearch.push({
      name: layer.feature.properties.GEN,
      source: "Landkreise",
      id: L.stamp(layer),
      bounds: layer.getBounds()
    });
  }
}).bindTooltip(function (layer) {
    return layer.feature.properties.GEN;
 }
);

//Create a color dictionary based off of subway route_id
var subwayColors = {"1":"#ff3135", "2":"#ff3135", "3":"ff3135", "4":"#009b2e",
    "5":"#009b2e", "6":"#009b2e", "7":"#ce06cb", "A":"#fd9a00", "C":"#fd9a00",
    "E":"#fd9a00", "SI":"#fd9a00","H":"#fd9a00", "Air":"#ffff00", "B":"#ffff00",
    "D":"#ffff00", "F":"#ffff00", "M":"#ffff00", "G":"#9ace00", "FS":"#6e6e6e",
    "GS":"#6e6e6e", "J":"#976900", "Z":"#976900", "L":"#969696", "N":"#ffff00",
    "Q":"#ffff00", "R":"#ffff00" };

var subwayLines = L.geoJson(null, {
  style: function (feature) {
      return {
        color: subwayColors[feature.properties.route_id],
        weight: 3,
        opacity: 1
      };
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Division</th><td>" + feature.properties.Division + "</td></tr>" + "<tr><th>Line</th><td>" + feature.properties.Line + "</td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Line);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");

        }
      });
    }
    layer.on({
      mouseover: function (e) {
        var layer = e.target;
        layer.setStyle({
          weight: 3,
          color: "#00FFFF",
          opacity: 1
        });
        if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
        }
      },
      mouseout: function (e) {
        subwayLines.resetStyle(e.target);
      }
    });
  }
});


/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16
});

/* Empty layer placeholder to add to layer control for listening when to add/remove theaters to markerClusters layer */
//Asphalt
var zweitwerkIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var asphaltIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var recyclingIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
var kiesundSandIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
var natursteinIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var transportBetonIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var branche_asphalt = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
	var ic=asphaltIcon;
	if(feature.properties.Art!="HW")ic=zweitwerkIcon;
    return L.marker(latlng, {
      icon:ic,
      title: feature.properties.id+": "+feature.properties.Name1,
      riseOnHover: true
    }).bindTooltip(function (layer) {
    return layer.feature.properties.Name1;
 },{permanent: true, opacity: 0.9});
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 + "</td></tr>";
	  content+="<tr><th>Werk:</th><td>" ;
		if(feature.properties.Art=="HW")content+="Hauptwerk";
		else content+="Zweitwerk";
		content+="</td></tr>";
	  
		content+="<tr><th>Tel:</th><td>" + feature.properties.Telefon + "</td></tr>";
		content+="<tr><th>Fax:</th><td>" + feature.properties.Telefax + "</td></tr>";
		content+="<tr><th>Adresse:</th><td>" + feature.properties.Strasse + "<br/>";
		content+=feature.properties.PLZStrasse+" "+feature.properties.Ort+"</td></tr>";
		content+="<tr><th>Postfach:</th><td>" + feature.properties.Postfach + "<br/>";
		content+=feature.properties.PLZPostfach+"</td></tr>";
		content+="<tr><th>E-Mail:</th><td>" + feature.properties.Email + "</td></tr>";
		content+="<tr><th>Internet:</th><td><a class='url-break' href='http://"+ feature.properties.Internet +"' target='_blank'>"+ feature.properties.Internet+ "</td></tr>";
		content+="</table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name1);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      asphaltSearch.push({
        name: layer.feature.properties.Name1+" "+layer.feature.properties.Name2+" "+layer.feature.properties.Name3,
        address: layer.feature.properties.Strasse+" "+layer.feature.properties.PLZStrasse+" "+layer.feature.properties.Ort,
        source: "Asphalt",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});

var branche_transportBeton = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
	var ic=transportBetonIcon;
	if(feature.properties.Art!="HW")ic=zweitwerkIcon;
    return L.marker(latlng, {
      icon:ic,
      title: feature.properties.id+": "+feature.properties.Name1,
      riseOnHover: true
    }).bindTooltip(function (layer) {
    return layer.feature.properties.Name1;
 },{permanent: true, opacity: 0.9});
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 + "</td></tr>";
	  content+="<tr><th>Werk:</th><td>" ;
		if(feature.properties.Art=="HW")content+="Hauptwerk";
		else content+="Zweitwerk";
		content+="</td></tr>";
	  
		content+="<tr><th>Tel:</th><td>" + feature.properties.Telefon + "</td></tr>";
		content+="<tr><th>Fax:</th><td>" + feature.properties.Telefax + "</td></tr>";
		content+="<tr><th>Adresse:</th><td>" + feature.properties.Strasse + "<br/>";
		content+=feature.properties.PLZStrasse+" "+feature.properties.Ort+"</td></tr>";
		content+="<tr><th>Postfach:</th><td>" + feature.properties.Postfach + "<br/>";
		content+=feature.properties.PLZPostfach+"</td></tr>";
		content+="<tr><th>E-Mail:</th><td>" + feature.properties.Email + "</td></tr>";
		content+="<tr><th>Internet:</th><td><a class='url-break' href='"+ feature.properties.Internet +"' target='_blank'>"+ feature.properties.Internet+ "</td></tr>";
		content+="</table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name1);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      transportBetonSearch.push({
        name: layer.feature.properties.Name1+" "+layer.feature.properties.Name2+" "+layer.feature.properties.Name3,
        address: layer.feature.properties.Strasse+" "+layer.feature.properties.PLZStrasse+" "+layer.feature.properties.Ort,
        source: "TransportBeton",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});

var branche_naturstein = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
	var ic=natursteinIcon;
	if(feature.properties.Art!="HW")ic=zweitwerkIcon;
    return L.marker(latlng, {
      icon:ic,
      title: feature.properties.id+": "+feature.properties.Name1,
      riseOnHover: true
    }).bindTooltip(function (layer) {
    return layer.feature.properties.Name1;
 },{permanent: true, opacity: 0.9});
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 + "</td></tr>";
	  content+="<tr><th>Werk:</th><td>" ;
		if(feature.properties.Art=="HW")content+="Hauptwerk";
		else content+="Zweitwerk";
		content+="</td></tr>";
	  
		content+="<tr><th>Tel:</th><td>" + feature.properties.Telefon + "</td></tr>";
		content+="<tr><th>Fax:</th><td>" + feature.properties.Telefax + "</td></tr>";
		content+="<tr><th>Adresse:</th><td>" + feature.properties.Strasse + "<br/>";
		content+=feature.properties.PLZStrasse+" "+feature.properties.Ort+"</td></tr>";
		content+="<tr><th>Postfach:</th><td>" + feature.properties.Postfach + "<br/>";
		content+=feature.properties.PLZPostfach+"</td></tr>";
		content+="<tr><th>E-Mail:</th><td>" + feature.properties.Email + "</td></tr>";
		content+="<tr><th>Internet:</th><td><a class='url-break' href='"+ feature.properties.Internet +"' target='_blank'>"+ feature.properties.Internet+ "</td></tr>";
		content+="</table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name1);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      natursteinSearch.push({
        name: layer.feature.properties.Name1+" "+layer.feature.properties.Name2+" "+layer.feature.properties.Name3,
        address: layer.feature.properties.Strasse+" "+layer.feature.properties.PLZStrasse+" "+layer.feature.properties.Ort,
        source: "Naturstein",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});


var branche_kiesundsand = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
	var ic=kiesundSandIcon;
	if(feature.properties.Art!="HW")ic=zweitwerkIcon;
    return L.marker(latlng, {
      icon:ic,
      title: feature.properties.id+": "+feature.properties.Name1,
      riseOnHover: true
    }).bindTooltip(function (layer) {
    return layer.feature.properties.Name1;
 },{permanent: true, opacity: 0.9});
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 + "</td></tr>";
	  content+="<tr><th>Werk:</th><td>" ;
		if(feature.properties.Art=="HW")content+="Hauptwerk";
		else content+="Zweitwerk";
		content+="</td></tr>";
	  
		content+="<tr><th>Tel:</th><td>" + feature.properties.Telefon + "</td></tr>";
		content+="<tr><th>Fax:</th><td>" + feature.properties.Telefax + "</td></tr>";
		content+="<tr><th>Adresse:</th><td>" + feature.properties.Strasse + "<br/>";
		content+=feature.properties.PLZStrasse+" "+feature.properties.Ort+"</td></tr>";
		content+="<tr><th>Postfach:</th><td>" + feature.properties.Postfach + "<br/>";
		content+=feature.properties.PLZPostfach+"</td></tr>";
		content+="<tr><th>E-Mail:</th><td>" + feature.properties.Email + "</td></tr>";
		content+="<tr><th>Internet:</th><td><a class='url-break' href='"+ feature.properties.Internet +"' target='_blank'>"+ feature.properties.Internet+ "</td></tr>";
		content+="</table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name1);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      kiesundsandSearch.push({
        name: layer.feature.properties.Name1+" "+layer.feature.properties.Name2+" "+layer.feature.properties.Name3,
        address: layer.feature.properties.Strasse+" "+layer.feature.properties.PLZStrasse+" "+layer.feature.properties.Ort,
        source: "KiesundSand",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});


var branche_recycling = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
	var ic=recyclingIcon;
	if(feature.properties.Art!="HW")ic=zweitwerkIcon;
    return L.marker(latlng, {
      icon:ic,
      title: feature.properties.id+": "+feature.properties.Name1,
      riseOnHover: true
    }).bindTooltip(function (layer) {
    return layer.feature.properties.Name1;
 },{permanent: true, opacity: 0.9});
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 + "</td></tr>";
	  content+="<tr><th>Werk:</th><td>" ;
		if(feature.properties.Art=="HW")content+="Hauptwerk";
		else content+="Zweitwerk";
		content+="</td></tr>";
	  
		content+="<tr><th>Tel:</th><td>" + feature.properties.Telefon + "</td></tr>";
		content+="<tr><th>Fax:</th><td>" + feature.properties.Telefax + "</td></tr>";
		content+="<tr><th>Adresse:</th><td>" + feature.properties.Strasse + "<br/>";
		content+=feature.properties.PLZStrasse+" "+feature.properties.Ort+"</td></tr>";
		content+="<tr><th>Postfach:</th><td>" + feature.properties.Postfach + "<br/>";
		content+=feature.properties.PLZPostfach+"</td></tr>";
		content+="<tr><th>E-Mail:</th><td>" + feature.properties.Email + "</td></tr>";
		content+="<tr><th>Internet:</th><td><a class='url-break' href='"+ feature.properties.Internet +"' target='_blank'>"+ feature.properties.Internet+ "</td></tr>";
		content+="</table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Name1);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      recyclingSearch.push({
        name: layer.feature.properties.Name1+" "+layer.feature.properties.Name2+" "+layer.feature.properties.Name3,
        address: layer.feature.properties.Strasse+" "+layer.feature.properties.PLZStrasse+" "+layer.feature.properties.Ort,
        source: "BaustoffRecycling",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});




var theaterLayer = L.geoJson(null);
var theaters = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/theater.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NAME,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Phone</th><td>" + feature.properties.TEL + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADDRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.NAME);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/theater.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      theaterSearch.push({
        name: layer.feature.properties.NAME,
        address: layer.feature.properties.ADDRESS1,
        source: "Theaters",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});

/* Empty layer placeholder to add to layer control for listening when to add/remove museums to markerClusters layer */
var museumLayer = L.geoJson(null);
var museums = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/museum.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NAME,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.NAME + "</td></tr>" + "<tr><th>Phone</th><td>" + feature.properties.TEL + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.ADRESS1 + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.URL + "' target='_blank'>" + feature.properties.URL + "</a></td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.NAME);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/museum.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      museumSearch.push({
        name: layer.feature.properties.NAME,
        address: layer.feature.properties.ADRESS1,
        source: "Museums",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});



var zoomControl = L.control.zoom({
  position: "bottomright"
});

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "fa fa-location-arrow",
  metric: true,
  strings: {
    title: "Meine Position",
    popup: "Sie befinden sich innerhalb von {distance} {unit} von diesem Punkt",
    outsideMapBoundsMsg: "Ihre Position befindet sich außerhalb der Karte"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
});



/*var groupedOverlays = {
  "Points of Interest": {
    "<img src='assets/img/theater.png' width='24' height='28'>&nbsp;Theaters": theaterLayer,
    "<img src='assets/img/museum.png' width='24' height='28'>&nbsp;Museums": museumLayer
  },
  "Reference": {
    "Bundesländer": bundeslaender,
    "Subway Lines": subwayLines
  }
};*/



