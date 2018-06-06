/**
Standortkarten Webapp. Stellt die Standortatlanten als Webapp dar
@author Merlin Becker
@date 21.03.2014
@version 1.0
**/

OpenLayers.Handler.prototype.startTouch = function(){}; 
OpenLayers.Handler.Click.prototype.startTouch = function(){}; 
OpenLayers.Handler.Drag.prototype.startTouch = function(){}; 
OpenLayers.Handler.Feature.prototype.startTouch = function(){}; 
OpenLayers.Handler.Point.prototype.startTouch = function(){}; 
OpenLayers.Handler.Path.prototype.startTouch = function(){}; 
OpenLayers.Handler.Polygon.prototype.startTouch = function(){}; 
OpenLayers.Handler.Box.prototype.startTouch = function(){}; 


var einftexte=new Array("Standortkarten Online, das heißt auf allen Ihren Geräten mit Internet immer und überall.","Über 7000 Standorte in ganz Deutschland, stufenlos vergrößerbar, sehr übersichtlich.","Viele nützliche Zusatzfunktionen, Datenbank vollständig durchsuchbar.","");

var url="service.php";
var ausgeklappt=true;
var ausgeklappt_rechts=true;
var pindata=null;
var listdata=null;
var pinsLayer;
var map;
var location_selectedElement=null;
var firststart=true;
var tourstep=1;
var resizeTimeout=null;
var testversion=false;
var myLocation=null;
var myLocation_txt="";

var destination=null;
var destination_txt="";
var dontZoom=false;
var isIpadOrPhone=false;
var PROJECTION_4326;
var PROJECTION_MERC;
var pinsControl=null;
var selectedFeature=null;
var selectedFeatureObj=null;
var lastZoom=0;

var geolocStyle = {
    fillColor: '#000',
    fillOpacity: 0.1,
    strokeWidth: 0
};

var umkreisSuchStyle = {
    fillColor: '#ff0000',
    fillOpacity: 0.2,
    strokeWidth: 0
};

var geolocate;
var locationLayer=null;
var firstGeolocation=true;
var selectedBranchen=new Array();
var selectedLaender=new Array();

var einfuehrung=false;

/* !Document Ready Funktion */
$(document).ready(function(){
	isIpadOrPhone=is_touch_device();
	//LoginFormular scharf schalten
	$("#testaccount").click(function(evt){
		$("#nutzername").val("test@test.de");
		$("#password").val("test");
		einfuehrung=true;
		$("#loginform").submit();
		evt.stopPropagation();
		return false;
	});
	
	$("#loginform").submit(function(evt){	
		$("#logineingabe").fadeOut();
		$("#ladebalken_login").css("display","block");
		
		var data="{ \"command\": \"login\",\"username\":\""+$('#nutzername').val()+"\",\"passwort\":\""+$('#password').val()+"\"}";
		data={"d":Base64.encode(data)};
		$.post(url, data ,loginChecked);
		return false;
	});
	
	//prüfe, ob eingeloggt und verfahre dann weiter
 			var data="{ \"command\": \"checkLogin\"}";
			data={"d":Base64.encode(data)};
			$.post(url, data ,loginChecked);
	
});	

/* !Sotierfunktionen */
function sortName1(a,b) {
  if (parseInt(a.attributes.ident) < parseInt(b.attributes.ident))
     return -1;
  if (parseInt(a.attributes.ident) > parseInt(b.attributes.ident))
    return 1;
  return 0;
}

/**Die Webapp Funktionen**/
function enableWebapp(){
	window.setTimeout("resize()",250);
	initMap();
	
	$(window).resize(function(){
		window.clearTimeout(resizeTimeout);
		resizeTimeout=window.setTimeout("resize()",1000);
	});
	
	$("#reiter_export .anzeigenbutton").click(function(){
		$("#reiter_export .anzeigenbutton").fadeOut();
		exportMap();
	});
	
	$("#tf_my_standort").attr("value","");
	$("#route_source").attr("value","");
	$("#route_dest").attr("value","");
	
	
	$("#seite_anfasser").click(function(evt){
		if(ausgeklappt)klappeEin();
		else klappeAus();
	});
	
	$("#seite_anfasser_rechts").click(function(evt){
		if(ausgeklappt_rechts)klappeEin_rechts();
		else klappeAus_rechts();
	});
	
	$("#reiter_standort").find(".anzeigenbutton").click(function(evt){
		if(myLocation==null){
			alert("Bitte wählen Sie zuerst Ihren Standort!");
		}
		else{
		var location = "{\"latitude\":\""+myLocation.latitude+"\",\"longitude\":\""+myLocation.longitude+"\",\"accuracy\":\""+myLocation.accuracy+"\"}";
				
		
		var data="{\"command\":\"updateLocation\",\"location\":"+location+"}";
		data={"d":Base64.encode(data)};
		$.post(url,data,webservice_callback);
		}
	});
	
	
	/*
	$(".hinweis_umkreis").click(function(evt){
		$("#c_reiter_standort").click();
	});
	
	*/
	
	$("#reiter_umkreis").find(".anzeigenbutton").click(function(){
		if(myLocation==null){
		alert("Bitte wählen Sie zuerst Ihren gewünschten Standort");
		return false;
		/*var mapcenter=map.getCenter().transform(PROJECTION_MERC,PROJECTION_4326);
			myLocation={latitude:mapcenter.lat,longitude:mapcenter.lon,accuracy:100,boundingBox:null};
			*/
		}
		displayLoading("Eine Umkreissuche wird gestartet");
		geolocate.deactivate();
    geolocate.watch = false;
		var entfernung;
		locationLayer.removeAllFeatures();
		
		
		
		var point= new OpenLayers.Geometry.Point(myLocation.longitude,myLocation.latitude).transform(PROJECTION_4326, PROJECTION_MERC);
		
		var circle = new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.Polygon.createRegularPolygon(
           point,
           parseInt($("#umkreisselect").attr("value"))*1.6093,
            40,
            0
        ),
        {},
        umkreisSuchStyle
    );
    
		locationLayer.addFeatures([
        new OpenLayers.Feature.Vector(
            point,
            {},
            {
                graphicName: 'circle',
                strokeColor: '#f00',
                fillColor: '#f00',
                strokeWidth: 2,
                fillOpacity: 0.5,
                pointRadius: 10
            }
        ),
        circle
    ]);
	map.zoomToExtent(locationLayer.getDataExtent());
	var data="{ \"location\":"+JSON.stringify(myLocation)+",\"command\": \"getPinsByUmkreis\",\"radius\":\""+parseInt($("#umkreisselect").attr("value"))+"\"}";
			data={"d":Base64.encode(data)};
			$.post(url,data,function(data){
					pinsRecieved(data);
					$("#c_reiter_liste").click();
			});
	});
	
	$("#btn_erkennen,#route_mein_standort").click(function(evt){
    locationLayer.removeAllFeatures();
    geolocate.deactivate();
    geolocate.watch = false;
    firstGeolocation = true;
    geolocate.activate();
	});
	
	$("#reiter_route").find(".anzeigenbutton").click(function(evt){
		if($("#route_source").attr("value")==""){
			alert("Bitte wählen Sie Ihren Standort");
		}
		else if($("#route_dest").attr("value")==""){
			alert("Bitte wählen Sie ein Ziel");
		}
		else{
		//	var src=encodeURIComponent(myLocation_txt).replace(/%20/g,'+');
		var src=$("#route_source").attr("value");
			var dest=$("#route_dest").attr("value");
			
			if(isAppleDevice()){
				window.open('http://maps.apple.com/?daddr='+dest+'&saddr='+src,'_blank');
			}
			else window.open('http://maps.google.com/maps?daddr='+dest+'&saddr='+src,'_blank');
		}
	});
	
	$("#routenplanerform").submit(function(evt){
		$("#reiter_route").find(".anzeigenbutton").click();	
	});
	
	$("#standortform").submit(function(evt){
		$("#btn_waehlen").click();
		evt.stopPropagation();
		return false;
	});
	
	$("#btn_waehlen").click(function(evt){
			if($("#tf_my_standort").attr("value")!=""){
				$("#route_source").attr("value",$("#tf_my_standort").attr("value"));
				displayLoading("Standort wird ermittelt");
				geoCodeMe($("#tf_my_standort").attr("value"));
			}
			else alert("Bitte geben Sie eine Adresse in das Textfeld ein!");
	});
	
	$("#navigation li").click(function(evt){
	
		if($(this).attr("id")!="c_reiter_liste"){
			$("#navigation li").not("#c_reiter_liste").attr("class","");
			$(".reiter").not("#reiter_liste").css("display","none");
		}
		
		$(this).attr("class","selected");
		
		switch($(this).attr("id")){
			case "c_reiter_info":
				startTour();
			break;
			case "c_reiter_nachricht":
				reportBug("","");
			break;
			case "c_reiter_export":
				if(confirm("Möchten Sie den aktuellen Kartenausschnitt als Grafik exportieren?\nNach dem Export wird die Grafik angezeigt und die Seite neu geladen.")){
						displayLoading("Ausschnitt wird exportiert");
						
						window.setTimeout("exportMap()",500);
				};
				
				/*
					$("#reiter_export .anzeigenbutton").fadeIn();
					$("#reiter_export").css("display","block");
				*/
				
			break;
			case "c_reiter_uebersicht":
				locationLayer.removeAllFeatures();
				$("#reiter_branchen").css("display","block");
				if(!ausgeklappt){klappeAus();}
			break;
			case "c_reiter_liste":
				if(!ausgeklappt_rechts){klappeAus_rechts();}
				else klappeEin_rechts();
			break;
			case "c_reiter_umkreis":
				$("#reiter_umkreis").css("display","block");
				$("#reiter_umkreis").find(".auswahl_content").css("display","block");
				
				$("#reiter_umkreis").find(".anzeigenbutton").css("display","block");
				$(".hinweis_umkreis").css("display","block");				
				if(!ausgeklappt){klappeAus();}
			break;
			case "c_reiter_standort":
				$("#reiter_standort").css("display","block");
				$("#reiter_standort").find(".auswahl_content").css("display","block");
				if(!ausgeklappt){klappeAus();}
			break;
			case "c_reiter_route":
				$("#reiter_route").css("display","block");
				$("#reiter_route").find(".auswahl_content").css("display","block");
				if(!ausgeklappt){klappeAus();}
			break;
		}
	});
	
	$("#c_reiter_logout").click(function(evt){
		if(confirm("Möchten Sie sich ausloggen?")){
			var data="{ \"command\": \"logout\"}";
			data={"d":Base64.encode(data)};
			$.post(url,data,loggedOut);
			}
	});
	$(".standortselection option").attr("selected","");
	$(".standortselection option:first-child").attr("selected","selected");
	
	$(".standortselection").change(function(evt){
		var klassenname="";
		klassenname=$(this).find("option:selected").attr("class");
		if(klassenname=="standort_waehlen"){
			var suche=prompt("Bitte geben Sie eine gewünschte Adresse ein.");
			if(suche){
				if(suche=="")
				{	
				alert("Bitte geben Sie eine gewünschte Adresse in das Suchfeld ein.");
					$(this).find("option").attr("selected","");
					$(this).find("option:first-child").attr("selected","selected");
				}
				else{
					location_selectedElement=$(this);
					waehleOrt(suche);
				}
			}
			else{
				$(this).find("option").attr("selected","");
					$(this).find("option:first-child").attr("selected","selected");
			}
		}
		else if(klassenname=="standort_orten"){
			location_selectedElement=$(this);
			autoErkennung();
		}
		else if(klassenname=="myLocation"){
			dontZoom=true;
			displayLocation(myLocation);
		}
	});
	
	$("#btn_suchen").click(function(evt){
		$("#suchfeld").submit();
	});
	$("#suchfeld").submit(function(evt){
	var suchkate = $("input[name='standortort']:checked").val();
	
	if($("#suchbegriff").val()!=""){
	if(suchkate=="orte"){
		waehleOrt($("#suchbegriff").val());
	}
	else{
	var data="{ \"command\": \"getPinsBySearch\",\"suche\":\""+$("#suchbegriff").val()+"\"}";
			data={"d":Base64.encode(data)};
			$.post(url,data,function(data){
					pinsRecieved(data);
					$("#c_reiter_liste").click();
					$("#zoomToMaxBounds").click();
				}
			);
	}	
	}else alert("Bitte geben Sie einen Suchbegriff ein");
			
		evt.stopPropagation();
		return false;
	});
		
	
	
	$("#reiter_branchen .auswahl_header").click(function(evt){
		if($(this).parent().find(".auswahl_content").css("display")==("block")){
			$(this).parent().find(".auswahl_content").css("display","none");
			$(this).find(".anfasser").removeClass("open");
		}else{
			$(this).parent().find(".auswahl_content").css("display","block");
			$(this).find(".anfasser").addClass("open");
		}
	});
	
	$("#reiter_branchen .anzeigenbutton").click(function(evt){
	$("#popup").remove();
	var data="{\"command\":\"getPins\",\"branche\":\""+selectedBranchen.join()+"\",\"bundesland\":\""+selectedLaender.join()+"\"}";
	data={"d":Base64.encode(data)};
	
	displayLoading("Standorte werden geladen");
	$.post(url,data,pinsRecieved);

	});
	
	//Lade die Branchen
		var data="{ \"command\": \"getBranchen\"}";
		data={"d":Base64.encode(data)};
		$.post(url, data ,branchen_recieve);

	//wenn die Einführung angeschaltet ist, lade das Overlay
	if(einfuehrung){
		$("<div id=\"tut_overlay\"></div>").appendTo("body");
		$("#tut_overlay").fadeIn(function(evt){
			var output="<div id=\"einfuehrungscontainer\">";
			output+="<div id=\"tut_vor\"></div>";
			output+="<div id=\"tut_back\"></div>";
			output+="<img id=\"tut_progress\" src=\"daten/bilder/einf/progress_1.png\" border=\"0\"/>";
			output+="<div id=\"tut_text\">Hallo Dies ist ein Text</div>";
			//output+="<a id=\"tut_kaufen\">Jetzt kaufen!</a>";
			output+="<a id=\"tour_starten\">eingeschränkte Testversion starten!</a>";
			output+="<div id=\"tut_diashow\">";
				output+="<img src=\"daten/bilder/einf/dia1.jpg\" border=\"0\"/>";
				output+="<img src=\"daten/bilder/einf/dia2.jpg\" style=\"height:360px\" border=\"0\"/>";
				output+="<img src=\"daten/bilder/einf/dia3.jpg\" border=\"0\"/>";
				output+="<img src=\"daten/bilder/einf/dia4.jpg\" border=\"0\"/>";
			output+="</div>";
			output+="</div>";
			$(output).appendTo("#tut_overlay");
			
			$("#tut_text").html(einftexte[0]);
			
			$("#tour_starten").click(function(evt){
				$("#tut_overlay").click();
				startTour();
			});
			
			
			$("#einfuehrungscontainer").click(function(evt){
				evt.stopPropagation();
				return false;
			});
			
			$("#tut_overlay").click(function(evt){
				$(this).fadeOut(function(evt){
						$(this).remove();					
				});
			});
			
			
		var $cycler = $('#tut_diashow'),
    prev = function() { $cycler.cycle( prevIndex, "scrollRight" ); },
    next = function() { $cycler.cycle( nextIndex, "scrollLeft" ); };

    $cycler.cycle({
                     fx:     'scrollLeft',
                     after: function(currSlideElement, nextSlideElement, options) {
                             slideIndex = options.currSlide;
                             nextIndex = slideIndex + 1;
                             prevIndex = slideIndex -1;

                             if(slideIndex == options.slideCount-1) {
                                 nextIndex = 0;
                             }

                             if(slideIndex == 0) {
                                 prevIndex = options.slideCount-1;
                             }
                             $("#tut_text").html(einftexte[slideIndex]);
                             
                             if(slideIndex==3){
                             		$("#tour_starten").css("display","block");
                             		//$("#tut_kaufen").css("display","block");
                             }else{
                             		//$("#tut_kaufen").css("display","none");
                             		$("#tour_starten").css("display","none");
                             }
                             
                             var index=slideIndex+1;
                             $("#tut_progress").attr("src","daten/bilder/einf/progress_"+index+".png");   
                         },
                   	timeout:  8000, 
                   	easing:  'easeInOutBack' 
                 });

    $("#tut_back").bind( "click", prev );
    $("#tut_vor").bind( "click", next );
		});
	}	
}
/* !Ortswahl nach Eingabe */
function autoErkennung(){
	displayLoading("Ihr Standort wird geortet");
	locationLayer.removeAllFeatures();
    geolocate.deactivate();
    geolocate.watch = false;
    firstGeolocation = true;
    geolocate.activate();
}


function waehleOrt(suchbegriff){
	displayLoading("Ort wird gesucht");
	geoCodeMe(suchbegriff);
}
/* !DisplayFunktionen */
function displayPopupInfos(data){
	destination=new OpenLayers.LonLat(data.lng,data.lat);
	destination_txt="";
	var output=new Array();
	var output="<h3>"+data.id+": ";
	destination_txt+=data.id+": ";
	if(data.Vorname!=""){output+=data.Vorname+" ";
	destination_txt+=data.Vorname+" ";
	}
	output+=data.Name1+"</h3>";
	destination_txt+=data.Name1+" ";
	if(data.Name2!=""){output+=data.Name2+"<br>";
	destination_txt+=data.Name2+" ";
	}
	if(data.Name3!=""){output+=data.Name3+"<br>";
	destination_txt+=data.Name3+" ";
	}
	if(data.Strasse!=""){
		output+=data.Strasse+"<br>";
		//destination_txt=data.Strasse+",";
	}
	if(data.PLZPostfach!="")output+="Postfach: "+data.PLZPostfach+" "+data.Postfach+"<br>";
	if(data.Land!="")output+=data.Land+" ";
	if(data.PLZStrasse!="")
	{
		output+=data.PLZStrasse+" ";
		//destination_txt+=data.PLZStrasse+" ";
	}
	if(data.Ort!=""){
		//destination_txt+=data.Ort;
		output+=data.Ort+"<br><br>";
	}
	
	if(data.Telefon!="")output+="Tel: "+data.Telefon+"<br>";
	if(data.Telefax!="")output+="Fax: "+data.Telefax+"<br>";
	if(data.Email!="")output+="Email: <a href=\"mailto:"+data.Email+"\">"+data.Email+"</a><br>";
	if(data.Internet!="")output+="Internet: <a target=\"_blank\" href=\"http://"+data.Internet+"\">"+data.Internet+"</a><br>";
	if(data.AnzahlMitarbeiter!="")output+=data.AnzahlMitarbeiter+"<br>";
	if(data.FabrikantderAnlage!="")output+=data.FabrikantderAnlage+"<br>";
	if(data.LeistungderAnlage!="")output+=data.LeistungderAnlage+"<br>";
	if(data.Zugabevorrichtung!="")output+=data.Zugabevorrichtung+"<br>";
	if(data.DurschnittlicheJahres!="")output+=data.DurschnittlicheJahres+"<br>";
	if(data.SonstigeAngaben!="")output+=data.SonstigeAngaben+"<br>";
	if(data.Mitgliedim!="")output+=data.Mitgliedim+"<br>";
	if(data.MitgliedimLandesverband!="")output+=data.MitgliedimLandesverband+"<br>";
	if(data.UeberwachtDurch!="")output+=data.UeberwachtDurch+"<br>";
	if(data.ZertifiziertNach!="")output+=data.ZertifiziertNach+"<br>";
	output+"<br>";
	//adde noch 2 Buttons, für das Scrolling
	output+="<div id=\"popup_scroll_top\">&gt;</div>";
	output+="<div id=\"popup_scroll_bottom\">&gt;</div>";
	
	$("#popupcontent").html(output);
	if($("#popupcontent").attr("scrollHeight")>$("#popupcontent").height()){

	$("#popup_scroll_bottom").css("display","block");	
	$("#popup_scroll_top").css("top",$("#popupcontent").attr("scrollHeight")-5+"px");
	$("#popup_scroll_top").click(function(evt){
	
		$("#popupcontent").animate({ scrollTop: 0}, 500);
		$("#popup_scroll_bottom").css("display","block");
		$(this).css("display","none");
	});
	$("#popup_scroll_bottom").click(function(evt){
			
		$("#popupcontent").animate({ scrollTop: $('#popupcontent').attr("scrollHeight")}, 500);
		$(this).css("display","none");
		$("#popup_scroll_top").css("display","block");
	});
	}
	if(map.getZoom()==11){
		$("#zoomout").css("display","inline");
		$("#zoomen").css("display","none");
	}
	
	$("#popupfooter").fadeIn();
	
	
	$('#popup_nachricht').click(function(evt){
		reportBug("Anmerkung zu Werk "+destination_txt,destination_txt);
	});
	$("#zoomout").click(function(evt){
			$(this).css("display","none");
			map.zoomTo(0);
			$("#zoomen").css("display","inline");	
		});
	
	$("#plane_route_src").click(function(evt){
		 $(".standortselection").not('#umkreis_standortselect').find(".source").remove();
    $("<option class=\"source\" value=\""+destination.lat+","+destination.lon+"\">"+destination_txt+"</option>").appendTo($(".standortselection").not('#umkreis_standortselect'));
    
    $("#route_source option").attr("selected","");
    $("#route_source").find(".source").attr("selected","selected");
    
		$("#c_reiter_route").click();
	});
	
	$("#plane_route_dest").click(function(evt){
		$(".standortselection").not('#umkreis_standortselect').find(".dest").remove();
    $("<option class=\"dest\" value=\""+destination.lat+","+destination.lon+"\">"+destination_txt+"</option>").appendTo($(".standortselection").not('#umkreis_standortselect'));
    
    $("#route_dest option").attr("selected","");
    $("#route_dest").find(".dest").attr("selected","selected");
    
		$("#c_reiter_route").click();
	});
	
	$("#plane_route").click(function(evt){
		$("#route_dest").attr("value",destination_txt);
		$("#c_reiter_route").click();
	});
		
	$("#zoomen").click(function(evt){
		$(this).css("display","none");
		$("#zoomout").css("display","inline");
		
		if(selectedFeatureObj!=null){
			map.zoomToExtent(selectedFeatureObj.geometry.getBounds(), closest=true);
		}
	});
	//popupFooter
}
/* !Webservice Callback Funktionen */
function bundesland_recieve(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
	var output="<ul>";
	
	$.each(data.data,function(index,branche){
		var classname="";
		if(branche.selected)classname="class=\"selected\"";
		
		output+="<li "+classname+" rel=\""+branche.id+"\">"+branche.beschreibung+"</li>";	
	});
	output+="</ul>";
	
	$("#reiter_standort .anfasser,#reiter_umkreis .anfasser,#reiter_route .anfasser").click(function(evt){
		$(this).parent().parent().parent().css("display","none");
		$("#reiter_branchen").css("display","block");
		$("#navigation li").not("#c_reiter_liste").attr("class","");
		$("#c_reiter_uebersicht").attr("class","selected");
	});
	
	$('#reiter_umkreis .anfasser').click(function(evt){
		locationLayer.removeAllFeatures();
	});
	
	$("#bundesland").find(".auswahl_content").html(output);
	$("#bundesland").find(".anfasser").click();
	}
	
	$("#bundesland").find("li").click(function(evt){
		if($(this).attr("class")=="selected"){
			$(this).attr("class","");
		}else{
			$(this).attr("class","selected");
		}
		
		
		selectedLaender=new Array();
		$.each($("#bundesland li.selected"),function(index,punkt){
			selectedLaender.push($(this).attr("rel"));
		});
		
		if(selectedBranchen.length>0&&selectedLaender.length>0){
			//neu hinzu
			//merlin becker 26.05.2014
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeIn();
		}
		else{
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeOut();
		}
		
		if(selectedLaender.length>0&&selectedBranchen.length>0){
			$("#reiter_branchen .anzeigenbutton").click();
		}
	});
	
	selectedLaender=new Array();
		$.each($("#bundesland li.selected"),function(index,punkt){
			selectedLaender.push($(this).attr("rel"));
		});
		
		if(selectedBranchen.length>0&&selectedLaender.length>0){
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeIn();
		}
		else{
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeOut();
		}
		
		
		if(selectedLaender.length>0&&selectedBranchen.length>0){
			$("#reiter_branchen .anzeigenbutton").click();
		}
}

function branchen_recieve(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
	var output="<ul>";
	
	$.each(data.data,function(index,branche){
		var classname="";
		if(branche.selected)classname="class=\"selected\"";
		
		output+="<li "+classname+" rel=\""+branche.id+"\"><span rel=\""+branche.id+"\">"+branche.beschreibung+"</span></li>";	
		
	});
	output+="</ul>";
	$("#branchen").find(".auswahl_content").html(output);
	$("#branchen").find(".anfasser").click();
	
	}
	
	$("#branchen").find("li").click(function(evt){
		if($(this).attr("class")=="selected"){
			$(this).attr("class","");
		}else{
		$(this).attr("class","selected");
		}
		
		selectedBranchen=new Array();
		$.each($("#branchen li.selected"),function(index,punkt){
			selectedBranchen.push($(this).attr("rel"));
		});
		if(selectedBranchen.length>0&&selectedLaender.length>0){
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeIn();
		}
		else{
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeOut();
		}
	
		if(selectedLaender.length>0&&selectedBranchen.length>0){
			$("#reiter_branchen .anzeigenbutton").click();
		}
	});
	
		selectedBranchen=new Array();
		$.each($("#branchen li.selected"),function(index,punkt){
			selectedBranchen.push($(this).attr("rel"));
		});
		if(selectedBranchen.length>0&&selectedLaender.length>0){
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeIn();
		}
		else{
			$("#reiter_branchen .anzeigenbutton").css("display","none");
			//$("#reiter_branchen .anzeigenbutton").fadeOut();
		}
		
		
			//Lade die Bundesländer
	var data="{ \"command\": \"getBundeslaender\"}";
		data={"d":Base64.encode(data)};
		$.post(url, data ,bundesland_recieve);
}

function webservice_callback(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
		alert(data.message);
	}else{
		displayLoginForm();
	};
}

/* !Feature Funktionen */
function zoomToFull(feature){
 feature.style.graphicWidth=76;
    feature.style.graphicHeight=88;
    
    feature.style.graphicXOffset=-23;
   	feature.style.graphicYOffset=-89;
    
    pinsLayer.drawFeature(feature);
}
function resetZoom(feature){
var size = new OpenLayers.Size(76*0.25+map.getZoom()*(76*0.75/11),88*0.25+map.getZoom()*(88*0.75/11));
var offset = new OpenLayers.Pixel(-23*0.25+map.getZoom()*(-23*0.75/11), -89*0.25+map.getZoom()*(-89*0.75/11));

feature.style.graphicWidth=size.w;
 feature.style.graphicHeight=size.h;
    
    feature.style.graphicXOffset=offset.x;
   	feature.style.graphicYOffset=offset.y;
   	
   	pinsLayer.drawFeature(feature);	
}



function popupInfosReceived(data){
	eval("data="+Base64.decode(data));
	if(isLoggedIn(data)){
		displayPopupInfos(data.data);
	}
}
/* !exportfunktionen */
function exportMap(){
/*	overflow:hidden;
	position: fixed;
	*/
	$("#zoomToMaxBounds").css("display","none");
	$(".olControlPanNorthItemInactive").css("display","none");
	$(".olControlPanSouthItemInactive").css("display","none");
	$(".olControlPanEastItemInactive").css("display","none");
	$(".olControlPanWestItemInactive").css("display","none");
	$(".olControlZoomBar").css("display","none");
	
	$("#legende").css("display","block");
	
	anchor = document.getElementById("export_link");
  anchor.href = "";
  anchor.innerHTML = "";
  
  var ident=locationLayer.id;
  
  map.removeLayer(locationLayer);
  
  locationLayer.renderer.destroy();
  locationLayer.renderers=["Canvas"];
  locationLayer.assignRenderer();
  locationLayer.setMap(map);
  
  map.addLayer(locationLayer);
  
  $("#"+ident).find("canvas").css("position","absolute");
	$("#"+ident).find("canvas").css("top","0px");
  
  map.removeLayer(pinsLayer);
  
  ident=pinsLayer.id;
  
	//pinsLayer.setVisibility(false);
	pinsLayer.renderer.destroy();
	pinsLayer.renderers=["Canvas"];
	pinsLayer.assignRenderer();
	pinsLayer.setMap(map);
	
	//pinsLayer.redraw();
	//pinsLayer.setVisibility(true);
	
	//den Canvas aufsetzen
	map.addLayer(pinsLayer);
	
	$("#"+ident).find("canvas").css("position","absolute");
	$("#"+ident).find("canvas").css("top","0px");

	html2canvas(document.getElementById("map"), {
    allowTaint:false,
    logging:true,
    useCORS:true,
    proxy:"html2canvasproxy.php",
    onrendered: function(canvas) {
        
  $(".olControlPanNorthItemInactive").css("display","block");
	$(".olControlPanSouthItemInactive").css("display","block");
	$(".olControlPanEastItemInactive").css("display","block");
	$(".olControlPanWestItemInactive").css("display","block");
	$("#zoomToMaxBounds").css("display","block");
	$(".olControlZoomBar").css("display","block");
	
	$("#legende").css("display","none");
		
		var img = canvas.toDataURL("image/png;base64;");
    anchor = document.getElementById("export_link");
            anchor.href = img;
            anchor.innerHTML = "Download";
    $("#export_link").get(0).click();
    window.location.reload();
    removeLoading();        
    }
});
}

function pinsRecieved(data){
		removeLoading();
		if(testversion){
			alert("Hinweis:\nSie verwenden die Standortkarten App als eingeschränkte Testversion.\nEs werden jeweils nur max. fünf Standorte pro Branche angezeigt.");
			testversion=false;
		}
		eval("data="+Base64.decode(data));

pindata=data.data;

if(pindata.length==0){
	alert("Es wurden keine Standorte gefunden. Bitte überprüfen Sie die Filtereinstellungen.");
}
else addMarkers();

}
function getIconByBranche(branch){
 var icon;
 branch=parseInt(branch);
 switch(branch){
 	case 1:
  case 7:
 		icon="pin_asphalt.png";
 	break;
 	case 2:
 		icon="pin_recycling.png";
 	break;
 	case 3:
 		icon="pin_suk.png";
 	break;
 	case 4:
  case 8:
 		icon="pin_naturstein.png";
 	break;
 	case 5:
 	case 6:
 		icon="pin_transportbeton.png";
 	break;
 }
 return "daten/bilder/"+icon;
}

function addMarkers(){

if(selectedFeature!=null){
	unselectFeature(selectedFeature);	
	selectedFeature=null;
}

var features=new Array();
//pinsLayer.clearMarkers();
pinsLayer.removeAllFeatures();
listdata=new Array();

var size = new OpenLayers.Size(76*0.25+map.getZoom()*(76*0.75/11),88*0.25+map.getZoom()*(88*0.75/11));
var offset = new OpenLayers.Pixel(-23*0.25+map.getZoom()*(-23*0.75/11), -89*0.25+map.getZoom()*(-89*0.75/11));
if(pindata!=null){
//markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(0,0),icon));
$.each(pindata,function(index,punkt){
 var color="black";
 switch(parseInt(punkt.branche)){
 	case 1: color="black";break;
 	case 2: color="#1d8f48";break;
 	case 3: color="#d61d31";break;
 	case 4: case 8: color="#1d4fa5";break;
 	case 5: color="#9a292c";break;
 }
 
var img = {fontColor:color,label:"   "+punkt.id,fontSize:"15px",fontWeight:"bold",fontFamily:"DIN",labelOutlineColor: "white", labelAlign:"lb",labelXOffset:10,labelYOffset:10,labelOutlineWidth: 1 ,externalGraphic: getIconByBranche(punkt.branche), graphicHeight: size.h, graphicWidth: size.w, graphicYOffset:  offset.y, graphicXOffset:offset.x};	 

var point = new OpenLayers.Geometry.Point(punkt['lng'], punkt['lat']).transform(PROJECTION_4326, PROJECTION_MERC);
var attr = {ident:punkt.id,name:punkt.Name1,name2:punkt.Name2,name3:punkt.Name3,description: punkt.Name1};
var feature = new OpenLayers.Feature.Vector(point,attr,img);

features.push(feature);
});
pinsLayer.addFeatures(features);
}



if(selectedFeature!=null){
	selectFeature(selectedFeature);	
}

//nur beim allerersten Start
if(firststart) map.zoomToExtent(pinsLayer.getDataExtent());
firststart=false;
refreshList();

}
function redrawFeatures(){
 for(var i=0;i<pinsLayer.features.length;i++) {
          var poi = pinsLayer.features[i];
            if(poi!=selectedFeatureObj){
             resetZoom(poi);
            }
      }
}

function refreshList(){
  $("#liste .auswahl_content").html("");
 	$("#legende_liste").html("");
 	
 	var loutput=[];
  var output = [];
  	var listdata=new Array();
    
     for(var i=0;i<pinsLayer.features.length;i++) {
          var poi = pinsLayer.features[i];
          if (poi.onScreen()){
             listdata.push(poi);
          }
      }
      listdata.sort(sortName1);

		
		var output="<ul>";
		loutput="<ul>";
		if(listdata!=null){
	
	var scrollindex=0;
		$.each(listdata,function(index,punkt){
		var cssclass="";
		
		if(punkt.attributes.ident==selectedFeature){
			cssclass="class=\"selected\"";
			scrollindex=index;
		}
		
			output+="<li rel=\""+punkt.attributes.ident+"\""+cssclass+">"+punkt.attributes.ident+": "+punkt.attributes.name+"<br><span class=\"detail\">"+punkt.attributes.name2+" "+punkt.attributes.name3+"</span></li>";
			loutput+="<li>"+punkt.attributes.ident+": "+punkt.attributes.name+" "+punkt.attributes.name3+"</li>";
			
		});
		
		output+="</ul>";
		loutput+="</ul>";
		
		$("#legende_liste").html(output);
		$("#legende_icons").html("");
		
		var iconoutput="<ul>";
		for(var i=0;i<selectedBranchen.length;i++){
			var branche=selectedBranchen[i];
			var imgsrc="";
			var name="";
			switch(branche){
				case "1":
						name="Asphalt";
						imgsrc="daten/bilder/pin_asphalt.png";
				break;
				case "2":
						name="Baustoff-Recycling";
						imgsrc="daten/bilder/pin_recycling.png";
				break;
				case "3":
						name="Kies und Sand";
						imgsrc="daten/bilder/pin_suk.png";
				break;
				case "4":
        case "8":
						name="Naturstein";
						imgsrc="daten/bilder/pin_naturstein.png";
				break;
				case "5":
						name="Transportbeton";
						imgsrc="daten/bilder/pin_transportbeton.png";
				break;
			}
			iconoutput+="<li><img src=\""+imgsrc+"\" border=\"0\">"+name+"</li>";
			iconoutput+="</ul>";
		}
		
		$("#legende_icons").html(iconoutput);
		$("#liste .auswahl_content").html(output);
		$("#liste #listen_count").html(listdata.length);
		$("#liste .auswahl_content").css("display","block");
		
		scrollToListe(scrollindex);
		
		if(!isIpadOrPhone){
		$("#liste .auswahl_content li").hover(
		function(evt){
			$(this).attr("class","selected");
			zoomToFull(listdata[$(this).index()]);
		},
		function(evt){
			if(!(parseInt($(this).attr("rel"))==selectedFeature)){
				$(this).attr("class","");
				resetZoom(listdata[$(this).index()]);	
			}
		});
		}
		
		$("#liste .auswahl_content li").click(function(evt){
				$.each("#liste .auswahl_content li",function(index){
				$(this).attr("class","");
				//resetZoom(listdata[index]);
				});
				
			$(this).attr("class","selected");
			selectFeature($(this).attr("rel"));
		});
		}
}

function scrollToListe(scrollindex){
if($("#liste .auswahl_content li").eq(scrollindex).length>0){

if($("#liste").css("display")=="block"&&($("#liste .auswahl_content li").eq(scrollindex).offset().top!=null))
	$("#stok_navigation_seite .stok_navigation_content").animate({ scrollTop: $("#liste .auswahl_content li").eq(scrollindex).offset().top-57}, 0);
}
}

function resize(){
	var width=$(window).width();
	if(width<1025){$("#logo").css("display","none");
	$('#stein_logo').css("display","none");
	}
	else{
	$("#logo").css("display","block");
	$('#stein_logo').css("display","block");
	}
	
	var height=$(window).height();
	var kartenhoehe=height-entfernePixel($('#stok_navigation_header').css("height"));
	
	//die Breite errechnen
	var breite_rechts=entfernePixel($('.stok_navigation_content').css("width"))+entfernePixel($('#stok_navigation_rechts').css("right"));
	var breite_links=entfernePixel($('.stok_navigation_content').css("width"))+entfernePixel($('#stok_navigation_seite').css("left"));
	
	var kartenbreite=width-breite_rechts-breite_links;
	
	//abstand von links errechnen.
	$("#map").css("left",breite_links+"px");
	$("#map").css("height",kartenhoehe+"px");
	$("#map").css("width",kartenbreite+"px");
}


function klappeAus_rechts(){
	$("#stok_navigation_rechts").animate({right:0},{
  step: function( now, fx ) {
    resize();
  },
 	complete:function(ani,jumped){
 		ausgeklappt_rechts=true;
 		$("#seite_anfasser_rechts").attr("class","anfasser_eingeklappt");
 		$("#c_reiter_liste").attr("class","selected");
 	}
  });
}

function klappeEin_rechts(){
	$("#stok_navigation_rechts").animate({right:"-"+$('.stok_navigation_content').css('width')},
	{
  step: function( now, fx ) {
    resize();
  },
 	complete:function(ani,jumped){
 		ausgeklappt_rechts=false;
 		$("#c_reiter_liste").attr("class","");
 		$("#seite_anfasser_rechts").attr("class","anfasser_ausgeklappt");
 	} 
  });
}


function klappeAus(){
	$("#stok_navigation_seite").animate({left:0},{
  step: function( now, fx ) {
    resize();
  },
 	complete:function(ani,jumped){
 		ausgeklappt=true;
 		$("#seite_anfasser").attr("class","anfasser_ausgeklappt");
 	}
  });
}

function klappeEin(){
	$("#stok_navigation_seite").animate({left:"-"+$('.stok_navigation_content').css('width')},
	{
  step: function( now, fx ) {
    resize();
  },
 	complete:function(ani,jumped){
 		ausgeklappt=false;
 		$("#seite_anfasser").attr("class","anfasser_eingeklappt");
 	} 
  });
}



/* !Mapfunktionen */
function initMap(){

OpenLayers.ImgPath = 'daten/bilder/';
//geographicProj
PROJECTION_4326 =new OpenLayers.Projection("EPSG:4326");
//sphericalMercatorProj
PROJECTION_MERC= new OpenLayers.Projection("EPSG:900913"); 

var newbounds = new OpenLayers.Bounds(3.69489,43.08506,19.31867,59.46638);
var extent = newbounds.transform( PROJECTION_4326,PROJECTION_MERC); 
map = new OpenLayers.Map({
    div:"map",
    layers: [
  new OpenLayers.Layer.OSM("OSM","",{isBaseLayer:true,displayInLayerSwitcher:true,zoomOffset:7,resolutions: [1222.9924523437504,611.4962261718752,305.7481130859376,152.8740565429688,76.4370282714844,38.2185141357422,19.1092570678711,9.55462853393555,4.77731426696777,2.38865713348389,1.19432856674194,0.59716428337097]})
    ],
    
   
    controls: [
        new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            },theme:null
        }),
       new OpenLayers.Control.ScaleLine({geodesic: true}),
       new OpenLayers.Control.PanPanel({div: null}),
      new OpenLayers.Control.ZoomBar(),
      
      	new OpenLayers.Control.Permalink({anchor: true}),
        new OpenLayers.Control.Attribution(),
    ],
  
    autoUpdateSize:true,
     theme:null,
     maxExtent: extent,
        restrictedExtent: extent,
        units : 'm',
   	 projection : PROJECTION_MERC,
     displayProjection : PROJECTION_4326
});

if (!map.getCenter()){	
	var center=new OpenLayers.LonLat(9.99413,51.44475).transform(PROJECTION_4326, PROJECTION_MERC);
	map.setCenter(center, 0);
}

locationLayer= new OpenLayers.Layer.Vector('aktuelle Position'/*,{renderers: ["Canvas", "SVG", "VML"]}*/);
pinsLayer=new OpenLayers.Layer.Vector("Standorte",{attribution:"2014 Stein-Verlag Baden Baden GmbH"/*,renderers: ["Canvas", "SVG", "VML"]*/});



fpControl = new OpenLayers.Control.FeaturePopups({
    boxSelectionOptions: {},
    layers: [
        [
        pinsLayer, {templates: {
            hover: '${.ident}: ${.name}'}
        }
        ]
    ]
});
pinsControl = new OpenLayers.Control.SelectFeature(pinsLayer);
map.addControl(fpControl);

pinsLayer.events.on({
      'featureselected':function(evt){
                        var feature = evt.feature;
                       
                       	zoomToFull(feature);
                       
                       $("#popup").remove();
                        selectedFeature=feature.attributes.ident;
                        selectedFeatureObj=feature;
                      var popup=new OpenLayers.Popup("popup",
                    feature.geometry.getBounds().getCenterLonLat(),
                   new OpenLayers.Size(388,342),
                   "<div id=\"popupcontent\"><h3>"+feature.attributes.name+"</h3><br><center><img src=\"daten/bilder/ladebalken.gif\" border=\"0\"></center></div><div id=\"popupfooter\"><span id=\"plane_route_src\">Routenstart</span><span id=\"plane_route_dest\">Routenziel</span><span id=\"zoomen\">Zoom</span><span id=\"zoomout\">zurück</span><span id=\"popup_nachricht\">Nachricht</span></div>",
                   true,onPopupClose);
                   
                   
                   var data="{ \"command\": \"getInfos\",\"ident\":"+feature.attributes.ident+"}";
										data={"d":Base64.encode(data)};
										$.post(url,data,popupInfosReceived);
												
                        feature.popup = popup;
                        map.addPopup(popup);
                        
                        $("#popup_close").html("X");
                        var pixel=map.getPixelFromLonLat(feature.geometry.getBounds().getCenterLonLat());
                        if(ausgeklappt){
                        	pixel.x+=parseInt(entfernePixel($('.stok_navigation_content').css('width')));
                        }
                        pixel.y-=105;
                        pixel=map.getLonLatFromPixel(pixel);
                        
                        map.panTo(pixel);
                        
                    },
                    'featureunselected':function(evt){
                        var feature = evt.feature;
                        resetZoom(feature);
                        map.removePopup(feature.popup);
                        feature.popup.destroy();
                        feature.popup = null;
                        selectedFeature=null;
                        selectedFeatureObj=null;
                    }
        }
    	);
map.addLayer(locationLayer);
map.addLayer(pinsLayer);


//die Geolokation API adden!

geolocate = new OpenLayers.Control.Geolocate({
    bind: false,
    geolocationOptions: {
        enableHighAccuracy: true
        ,
        maximumAge: 0,
        timeout: 7000
    }
});
map.addControl(geolocate);
firstGeolocation = true;

geolocate.events.register("locationupdated",geolocate,function(e) {
	var loc=e.position.coords;
	reverseCodeMe(loc.longitude,loc.latitude);
});
geolocate.events.register("locationfailed",this,function() {
    OpenLayers.Console.log('Ihre Position konnte nicht ermittelt werden');
    removeLoading();
});
geolocate.events.register("locationuncapable",this,function() {
    alert("Ihr Browser unterstützt keine GPS-Ortung oder die GPS Ortung ist nicht eingeschaltet.");
    removeLoading();
});


map.events.register('zoomend', this, redrawFeatures);
map.events.register('moveend',this,refreshList);

$(".olControlPanNorthItemInactive").appendTo($(".olMapViewport"));
$(".olControlPanSouthItemInactive").appendTo($(".olMapViewport"));
$(".olControlPanEastItemInactive").appendTo($(".olMapViewport"));
$(".olControlPanWestItemInactive").appendTo($(".olMapViewport"));
//$(".olControlPanPanel").children();

//map.addControl(new OpenLayers.Control.LayerSwitcher());
//noch einen Button für das Rauszoomen integrieren
$("<div id=\"zoomToMaxBounds\" class=\"olControlNoSelect\"></div>").appendTo("#map");
$("#zoomToMaxBounds").click(function(evt){
	map.zoomToExtent(pinsLayer.getDataExtent());
	// map.zoomToMaxExtent();
});
}
function onPopupClose(evt) {
    // 'this' is the popup.
    if(selectedFeature!=null)
    unselectFeature(selectedFeature);
    selectedFeature=null;
}

/* !Feature Steuerung */
function selectFeature(ident){
 if(selectedFeature!=null) unselectFeature(selectedFeature);


for(var f=0;f<pinsLayer.features.length;f++) {
  if(pinsLayer.features[f].attributes.ident == ident) {
   if(pinsLayer.features[f].popup!=null){
   	map.removePopup(pinsLayer.features[f].popup);
   }
 
    selectedFeatureObj=pinsLayer.features[f];
    pinsControl.select(pinsLayer.features[f]);
    
    var pixel=map.getPixelFromLonLat(pinsLayer.features[f].geometry.getBounds().getCenterLonLat());
                        if(ausgeklappt){
                        	pixel.x+=parseInt(entfernePixel($('.stok_navigation_content').css('width')));
                        }
                        pixel.y-=105;
                        pixel=map.getLonLatFromPixel(pixel);
                        
                        //map.moveTo(pixel);
    break;
  }

}
  //pinsLayer.redraw();
}

function unselectFeature(ident){
for(var f=0;f<pinsLayer.features.length;f++) {
  if(pinsLayer.features[f].attributes.ident == ident) {
   if(pinsLayer.features[f].popup!=null)map.removePopup(pinsLayer.features[f].popup);
    pinsControl.unselect(pinsLayer.features[f]);
    break;
  }
}
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
		$("#greetings_username").html("Angemeldet als "+data.klarname+" |");
		
		
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

/**prüft, ob der Nutzer gerade eingeloggt ist oder nicht**/
function isLoggedIn(data){
	if(data.status=="success") return true;
	else return false;
}

function loggedOut(data){	
	$(".versionr").html("STOK Version "+currentversion);
	$("#logineingabe").css("display","block");
	displayLoginForm();
	$("#nutzername").focus();
	window.location.reload();
} 
 
function displayLoginForm(){
	if($("#login_formular_container").height()==0){
		$("#login_overlay").css("display","block");
		window.setTimeout("animateLoginForm()",1000);
	}
	else{
		$("#stok_webapp").css("display","none");
		$("#login_overlay").fadeIn();
	}
}
function animateLoginForm(){
$("#login_overlay").animate({"margin-top":-126},1000);
$("#login_formular_container").animate({height:77},1000,function(){
		$("#nutzername").focus();
});}
 

function holeInitialData(){
 	$("#logineingabe").css("display","none");
 	$("#ladebalken_login").css("display","block");
 	$("#login_meldung").html("wird geladen...");
 	
 	var data="{ \"command\": \"getInitialData\"}";
	data={"d":Base64.encode(data)};
	$.post(url,data,initialDataReceived);
	
	$("#loginform")[0].reset();
 }
 
 
 function initialDataReceived(data){
	eval("data="+Base64.decode(data));
	
	if(isLoggedIn(data)){
		//zum schluss einblenden
		if($("#stok_webapp").css("display")=="none"){
			$("#login_overlay").fadeOut();
			$("#stok_webapp").fadeIn();
			enableWebapp();
			
			//hier jetzt ggf. die gespeicherten Einstellungen, wie Lokation usw. laden
		}
	}
	else{
		displayLoginForm();
	}}
 
 
  /**
 setzt den HTML Titel
 @version 1.0
 @since 3.0
 @date 15.01.2014
 @author Merlin Becker
 **/
 function setDocumentTitle(text){
 	$(document).attr('title',text);
 }
 
 /* !Ortungsfunktionen */
 var pulsate = function(feature) {
    var point = feature.geometry.getCentroid(),
        bounds = feature.geometry.getBounds(),
        radius = Math.abs((bounds.right - bounds.left)/2),
        count = 0,
        grow = 'up';

    var resize = function(){
        
        var interval = radius * 0.03;
        var ratio = interval/radius;
        switch(count) {
            case 4:
            case 12:
                grow = 'down'; break;
            case 8:
                grow = 'up'; break;
        }
        if (grow!=='up') {
            ratio = - Math.abs(ratio);
        }
        feature.geometry.resize(1+ratio, point);
        locationLayer.drawFeature(feature);
        if (count>20) {
            clearInterval(window.resizeInterval);
            locationLayer.removeFeatures([feature]);
        }
        count++;
         
    };
    window.resizeInterumkreisval = window.setInterval(resize, 125, point, radius);
};

function is_touch_device() {	
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		return true;
	}
	return false;
}

function geoCodeMe(string){
	myLocation_txt=string;
	string=encodeURIComponent(string).replace(/%20/g,'+');
	$.get("http://nominatim.openstreetmap.org/search?q="+string+"&format=json",function(txt){
		firstGeolocation=true;
		removeLoading();
		if( Object.prototype.toString.call(txt) === '[object Array]' ) {
			/* !TODO: Auswahl anbieten, wenn es mehr als einen Treffer gibt */
			if(txt.length==0)alert("Ihr Standort konnte nicht ermittelt werden.");
			else{
			txt=txt[0];
			myLocation={latitude:txt.lat,longitude:txt.lon,accuracy:100,boundingBox:txt.boundingbox,displayname:txt.display_name};
			 /*die daten der MyLocation auch in den SelectBoxen speichern*/
    $(".standortselection").find(".myLocation").remove();
    $("<option class=\"myLocation\" value=\""+myLocation.latitude+","+myLocation.longitude+"\">"+myLocation.displayname+"</option>").appendTo(".standortselection");
    
    	
    if(location_selectedElement!=null){
    		$(".standortselection option").attr("selected","");
    		location_selectedElement.find(".myLocation").attr("selected","selected");
			}
			
			displayLocation(myLocation);
			}

		}
		else {
		myLocation={latitude:txt.lat,longitude:txt.lon,accuracy:100,boundingBox:txt.boundingbox,displayname:txt.display_name};
		displayLocation(myLocation);
		
		 /*die daten der MyLocation auch in den SelectBoxen speichern*/
    $(".standortselection").remove(".myLocation");
    $("<option class=\"myLocation\" value=\""+myLocation.latitude+","+myLocation.longitude+"\">"+myLocation.displayname+"</option>").appendTo(".standortselection");
    if(location_selectedElement!=null){
    		$(".standortselection option").attr("selected","");
    		location_selectedElement.find(".myLocation").attr("selected","selected");
			}
			
			}
	});
}

function reverseCodeMe(lon,lat){
	$.get("http://nominatim.openstreetmap.org/reverse?format=json&lat="+lat+"&lon="+lon+"&zoom="+map.getZoom()+7,function(txt){
		removeLoading();
		
		myLocation={latitude:lat,longitude:lon,accuracy:100,boundingBox:null,displayname:txt.display_name};
		
		displayLocation(myLocation);
		
		 /*die daten der MyLocation auch in den SelectBoxen speichern*/
    $(".standortselection").remove(".myLocation");
    $("<option class=\"myLocation\" value=\""+myLocation.latitude+","+myLocation.longitude+"\">"+myLocation.displayname+"</option>").appendTo(".standortselection");
    
    if(location_selectedElement!=null){
    		$(".standortselection option").attr("selected","");
    		location_selectedElement.find(".myLocation").attr("selected","selected");
			}
	})
}



function displayLocation(location){
    locationLayer.removeAllFeatures();
    
    var point= new OpenLayers.Geometry.Point(location.longitude,location.latitude).transform(PROJECTION_4326, PROJECTION_MERC);
    
    var circle = new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.Polygon.createRegularPolygon(
           point,
            location.accuracy/2,
            40,
            0
        ),
        {},
        geolocStyle
    );
    locationLayer.addFeatures([
        new OpenLayers.Feature.Vector(
            point,
            {},
            {
                graphicName: 'circle',
                strokeColor: '#f00',
                fillColor: '#f00',
                strokeWidth: 2,
                fillOpacity: 0,
                pointRadius: 10
            }
        ),
        circle
    ]);
    if(location.boundingBox!=undefined){
    
    	var newbounds = new OpenLayers.Bounds(location.boundingBox[2],location.boundingBox[0],location.boundingBox[3],location.boundingBox[1]);
    	if(!dontZoom)
    	map.zoomToExtent(newbounds.transform(PROJECTION_4326,PROJECTION_MERC));	
    }
    else if (firstGeolocation) {
    	if(!dontZoom)
    		map.zoomToExtent(locationLayer.getDataExtent());
        pulsate(circle);
        firstGeolocation = false;
        this.bind = true;
    }
    dontZoom=false;
}



/* !Helperfunktionen */
String.prototype.escapeSpecialChars = function() {
    return this.replace(/[\\]/g, '\\\\')
    .replace(/[\"]/g, '\\\"')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t');
};


function isAppleDevice(){
    return (
        (navigator.userAgent.toLowerCase().indexOf("ipad") > -1) ||
        (navigator.userAgent.toLowerCase().indexOf("iphone") > -1) ||
        (navigator.userAgent.toLowerCase().indexOf("ipod") > -1) /*||
        (navigator.userAgent.toLowerCase().indexOf("macintosh") > -1)*/
    );
}

function entfernePixel(text){
	text=text.substr(0,text.length-2);
	return parseInt(text);
}

function removeLoading(){
	$("#loadingoverlay").remove();
}
/*Das Nachricht senden Formular*/
function reportBug(initialbetreff,initialmessage){
	var output="<div id=\"nachrichtenbody\"><div class=\"btn_close\">X</div>";
	output+="<div class=\"inner\">";
	output+="<h3>Ihre Nachricht an uns:</h3>";
	output+="<input type=\"text\" id=\"bug_betreff\" placeholder=\"Betreff\" value=\""+initialbetreff+"\"/>";
	output+="<textarea id=\"bug_nachricht\">"+initialmessage+"</textarea>";
	output+="<div class=\"anzeigenbutton\" style=\"display: block;text-align:center\">Nachricht senden</div>";
	output+="</div>";
	
	
	$("<div id=\"nachrichtenoverlay\">"+output+"</div>").appendTo("body");
	$("#bug_betreff").focus();
	
	$("#nachrichtenbody .anzeigenbutton").click(function(evt){
		var data="{ \"command\": \"sendMessage\",\"betreff\":\""+$("#bug_betreff").val()+"\",\"nachricht\":\""+$("#bug_nachricht").val()+"\"}";
		data={"d":Base64.encode(data)};
		$.post(url, data ,function(data){
			eval("data="+Base64.decode(data));
			if(isLoggedIn(data)){
				alert("Vielen Dank! Ihre Nachricht wurde an uns gesendet und Sie erhalten schnellstens eine Rückmeldung.");
				$("#nachrichtenbody .btn_close").click();
			}
		});
	});
	
	$("#nachrichtenbody .btn_close").click(function(evt){
		$("#nachrichtenoverlay").remove();
		$("#c_reiter_uebersicht").click();
	});
}

/* !Die Tour */
function startTour(){
	for(var i=1;i<=14;i++){
		var img=new Image();
		img.src="daten/bilder/tour/schritt"+i+"_bg.gif";
	}
	
	$("<div id=\"touroverlay\"></div>").appendTo("body");
	tourstep=1;
	stepTour();
}
function stepTour(){
$("#touroverlay").empty();
	if(tourstep==1){
		$("<div class=\"tourbubble\" id=\"tour_1\"><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_uebersicht").click();	
	}
	else if(tourstep==2){
		$("<div class=\"tourbubble\" id=\"tour_2\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_uebersicht").click();	
	}
	
	else if(tourstep==3){
		$("<div class=\"tourbubble\" id=\"tour_3\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		if(!ausgeklappt_rechts)
		$("#c_reiter_liste").click();	
	}
	
	else if(tourstep==4){
		$("<div class=\"tourbubble\" id=\"tour_4\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_umkreis").click();
		
		var hoehe=$("#c_reiter_umkreis").offset().top+45;
		var breite=$("#c_reiter_umkreis").offset().left-128;
		$("#tour_4").css("top",hoehe+"px");
		$("#tour_4").css("left",breite+"px");
			
	}
	
	else if(tourstep==5){
		$("<div class=\"tourbubble\" id=\"tour_5\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_umkreis").click();
		
		var hoehe=$("#umkreisselect").offset().top-45;
		var breite=$("#umkreisselect").offset().left+180;
		$("#tour_5").css("top",hoehe+"px");
		$("#tour_5").css("left",breite+"px");
			
	}
	else if(tourstep==6){
		$("<div class=\"tourbubble\" id=\"tour_6\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_umkreis").click();
		
		var hoehe=$("#umkreis_standortselect").offset().top-45;
		var breite=$("#umkreis_standortselect").offset().left+180;
		$("#tour_6").css("top",hoehe+"px");
		$("#tour_6").css("left",breite+"px");
			
	}
	else if(tourstep==7){
		$("<div class=\"tourbubble\" id=\"tour_7\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_umkreis").click();
		
		var hoehe=$("#reiter_umkreis .anzeigenbutton").offset().top-45;
		var breite=$("#reiter_umkreis .anzeigenbutton").offset().left+180;
		$("#tour_7").css("top",hoehe+"px");
		$("#tour_7").css("left",breite+"px");
			
	}
	
	else if(tourstep==8){
		$("<div class=\"tourbubble\" id=\"tour_8\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_route").click();
		
		var hoehe=$("#c_reiter_route").offset().top+45;
		var breite=$("#c_reiter_route").offset().left-200;
		$("#tour_8").css("top",hoehe+"px");
		$("#tour_8").css("left",breite+"px");
			
	}
	
	else if(tourstep==9){
		$("<div class=\"tourbubble\" id=\"tour_9\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		
		var hoehe=$("#c_reiter_export").offset().top+45;
		var breite=$("#c_reiter_export").offset().left-270;
		$("#tour_9").css("top",hoehe+"px");
		$("#tour_9").css("left",breite+"px");
			
	}
	
	else if(tourstep==10){
		$("<div class=\"tourbubble\" id=\"tour_10\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		
		var hoehe=$("#suchbegriff").offset().top+45;
		var breite=$("#suchbegriff").offset().left-25;
		$("#tour_10").css("top",hoehe+"px");
		$("#tour_10").css("left",breite+"px");
			
	}

else if(tourstep==11){
		$("<div class=\"tourbubble\" id=\"tour_11\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		
		var hoehe=$("#zoomToMaxBounds").offset().top-43;
		var breite=$("#zoomToMaxBounds").offset().left+25;
		$("#tour_11").css("top",hoehe+"px");
		$("#tour_11").css("left",breite+"px");
			
	}
	
	else if(tourstep==12){
		$("<div class=\"tourbubble\" id=\"tour_12\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		
		var hoehe=$("#OpenLayers_Control_ZoomBar_11_zoomin").offset().top-43;
		var breite=$("#OpenLayers_Control_ZoomBar_11_zoomin").offset().left+25;
		$("#tour_12").css("top",hoehe+"px");
		$("#tour_12").css("left",breite+"px");
			
	}
	else if(tourstep==13){
		$("<div class=\"tourbubble\" id=\"tour_13\"><div id=\"zurueck\"></div><div id=\"weiter\"></div><div id=\"abbrechen\"></div></div>").appendTo("#touroverlay");
		
		var hoehe=$("#OpenLayers_Control_ZoomBar_11_zoomout").offset().top-43;
		var breite=$("#OpenLayers_Control_ZoomBar_11_zoomout").offset().left+25;
		$("#tour_13").css("top",hoehe+"px");
		$("#tour_13").css("left",breite+"px");
			
	}
	else if(tourstep==14){
		$("<div class=\"tourbubble\" id=\"tour_14\"><div id=\"zurueck\"></div><div id=\"beenden\"></div></div>").appendTo("#touroverlay");
		$("#c_reiter_route").click();
		
		var hoehe=$("#c_reiter_nachricht").offset().top+45;
		var breite=$("#c_reiter_nachricht").offset().left-260;
		$("#tour_14").css("top",hoehe+"px");
		$("#tour_14").css("left",breite+"px");
	}
	
	
	
	$("#abbrechen,#beenden").click(function(evt){
		cancelTour();
		$('#c_reiter_uebersicht').click();
	});
	$("#weiter").click(function(evt){
		tourstep++;
		stepTour();
	});
	$("#zurueck").click(function(evt){
		tourstep--;
		stepTour();
	});
}

function cancelTour(){
	$("#touroverlay").remove();
}

function displayLoading(text){
	$("<div id=\"loadingoverlay\"></div>").appendTo("body");
	insertLoadingBar("#loadingoverlay");
	$("<div id=\"loadingtext\"></div>").appendTo("#loadingoverlay");
	$("#loadingtext").html(text);
}

function insertLoadingBar(element){
	$("<div id=\"floatingCirclesG\"><div class=\"f_circleG\" id=\"frotateG_01\"></div><div class=\"f_circleG\" id=\"frotateG_02\"></div><div class=\"f_circleG\" id=\"frotateG_03\"></div><div class=\"f_circleG\" id=\"frotateG_04\"></div><div class=\"f_circleG\" id=\"frotateG_05\"></div><div class=\"f_circleG\" id=\"frotateG_06\"></div><div class=\"f_circleG\" id=\"frotateG_07\"></div><div class=\"f_circleG\" id=\"frotateG_08\"></div></div>").appendTo(element);
}