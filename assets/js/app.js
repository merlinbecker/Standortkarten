var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};

var url="service.php";

var map, featureList, blSearch = [],lkSearch=[],theaterSearch = [], museumSearch = [];
var isCollapsed;
var baseLayers;
var groupedOverlays;
var layerControl;

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
	$(".versionr").html("Standortkarten "+data.version);
	
	if(isLoggedIn(data)){
		displayLoginForm();
		holeInitialData();	
		if(data.testversion=="Testversion")	{
		testversion=true;
			$(".testversion_hinweis").css("display","block");
			setDocumentTitle("Standortkarten "+currentversion+" EINGESCHRÄNKTE TESTVERSION");
		}
		else{
		testversion=false;
		$(".testversion_hinweis").css("display","none");
		setDocumentTitle("Standortkarten "+currentversion);
		}
	}
	else if(data.details=="username_wrong"){
		$("#login_overlay").effect("shake",function(){$("#loginform")[0].reset();
			$("#logineingabe").stop().css("display","block");
			$("#nutzername").focus();
		});	
	}
	else{
			displayLoginForm();
	}
}

function displayLoginForm(){
	$("#sidebar").hide();
	$("#loading").hide();
	$("#bso_navbar").hide();
	
	$("#loginModal").modal({
		backdrop: 'static',
		keyboard: false
		});
}

$(document).ready(function(){
	
	
	checkLogin();
	return;
	/* some tests */
	//
	//$("#nav_logout").hide();
	
	/* Larger screens get expanded layer control and visible sidebar */
	if (document.body.clientWidth <= 767) {
	  isCollapsed = true;
	} else {
	  isCollapsed = false;
	}

	baseLayers = {
	  "OpenStreetMaps.de": osmde
	};

	groupedOverlays = {
	  "Länder & Kreise": {
		"Bundesländer": bundeslaender,
		"Landkreise":landkreise
		}
	};

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
	
	
	
	$("#nav_standorte").click(function() {
	  animateSidebar();
	  return false;
	});
	
	$("#sidebar-toggle-btn").click(function() {
	  animateSidebar();
	  return false;
	});
	
	$("#sidebar-hide-btn").click(function() {
	  animateSidebar();
	  return false;
	});
	
	//load data
	
	$.getJSON("data/bundeslaender/BW.geojson", function (data) {
	  bundeslaender.addData(data);
	});
	
	$.getJSON("data/landkreise/lk-bw.geojson", function (data) {
	  landkreise.addData(data);
	});
	
	/*
	$.getJSON("data/subways.geojson", function (data) {
	  subwayLines.addData(data);
	});
	
	$.getJSON("data/DOITT_THEATER_01_13SEPT2010.geojson", function (data) {
	  theaters.addData(data);
	  map.addLayer(theaterLayer);
	});
	
	$.getJSON("data/DOITT_MUSEUM_01_13SEPT2010.geojson", function (data) {
	  museums.addData(data);
	});
	*/
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
	  layers: [osmde, bundeslaender],// markerClusters, highlight],*/
	  zoomControl: false,
	  attributionControl: true
	});
	
	L.control.mapCenterCoord({
		onMove:true
	}).addTo(map);
	
	L.control.scale({metric:true,imperial:false}).addTo(map);
	map.attributionControl.addAttribution("&copy; <a href='https://www.stein-verlaggmbh.de'>Stein-Verlag Baden-Baden</a>");

	/* Layer control listeners that allow for a single markerClusters layer */
	map.on("overlayadd", function(e) {
	  if (e.layer === theaterLayer) {
		alert("THEATERLAYER");
		markerClusters.addLayer(theaters);
		syncSidebar();
	  }
	  if (e.layer === museumLayer) {
		alert("MUSEUMSLAYER");
		markerClusters.addLayer(museums);
		syncSidebar();
	  }
	});

	map.on("overlayremove", function(e) {
	  if (e.layer === theaterLayer) {
		markerClusters.removeLayer(theaters);
		syncSidebar();
	  }
	  if (e.layer === museumLayer) {
		markerClusters.removeLayer(museums);
		syncSidebar();
	  }
	});

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
	$(document).one("ajaxStop", function () {
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
		  url: "http://api.geonames.org/postalCodeSearchJSON?maxRows=10&username=lordmerlo&country=DE",
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
	  
	  /*{
		name: "Theaters",
		displayKey: "name",
		source: theatersBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'><img src='assets/img/theater.png' width='24' height='28'>&nbsp;Theaters</h4>",
		  suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
		}
	  }, {
		name: "Museums",
		displayKey: "name",
		source: museumsBH.ttAdapter(),
		templates: {
		  header: "<h4 class='typeahead-header'><img src='assets/img/museum.png' width='24' height='28'>&nbsp;Museums</h4>",
		  suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
		}
	  },*/ {
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
		if (datum.source === "Theaters") {
		  if (!map.hasLayer(theaterLayer)) {
			alert("add layer here!!");
			map.addLayer(theaterLayer);
		  }
		  map.setView([datum.lat, datum.lng], 17);
		  if (map._layers[datum.id]) {
			alert("add layer here!!");
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
	});
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
  theaters.eachLayer(function (layer) {
    if (map.hasLayer(theaterLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/theater.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  /* Loop through museums layer and add only features which are in the map bounds */
  museums.eachLayer(function (layer) {
    if (map.hasLayer(museumLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/museum.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
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
  fillColor: "#00FFFF",
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



