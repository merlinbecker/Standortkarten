function createMarkerOptions(markercolor,textcolor,art){
	if(art=="")art="HW";
	var options={};
	options["circleText"]="HW";
	options["className"]="svg-icon";
	options["popupAnchor"]=[1, -34];
	options["circleAnchor"]=null;
	options["circleColor"]="#cccccc";
	options["circleOpacity"]=null;
	options["circleFillOpacity"]=1.0;
    options["circleRatio"]=0.6;
    options["circleWeight"]=1.0;
	
	options["fillOpacity"]=1.0;
	options["fontColor"]=textcolor;
	options["fontOpacity"]="1";
	options["fontSize"]=null;
	options["iconAnchor"]=null;
	options["iconSize"]=L.point(32,48);
	options["opacity"]=1;
	
	switch(art){
		case "HW":
			options["circleFillColor"]="#ffffff";
			options["fontColor"]="black";
			options["color"]="#000000";
			options["fillColor"]=markercolor;
			options["weight"]=2;
		break;
		case "ZW":
			options["circleFillColor"]=markercolor;
			options["color"]="#000000";
			options["fillColor"]="#cccccc";
			options["weight"]=2;
		break;
		case "HZW":
			options["circleFillColor"]="#cccccc";
			options["fontColor"]="black";
			options["color"]="#000000";
			options["fillColor"]=markercolor;
			options["weight"]=2;
		break;
		case "GH":
			options["circleFillColor"]="#ffffff";
			options["fontColor"]="black";
			options["color"]=markercolor;
			options["fillColor"]="#cccccc";
			options["weight"]=3;
		break;
	}
	return options;
}

function getWerkTabelle(feature){
	var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 + "</td></tr>";
	  content+="<tr><th>Werk:</th><td>" ;
		content+=getWerkArt(feature.properties.Art);
		content+="</td></tr>";
		content+="<tr><th>Tel:</th><td>" + feature.properties.Telefon + "</td></tr>";
		content+="<tr><th>Fax:</th><td>" + feature.properties.Telefax + "</td></tr>";
		content+="<tr><th>Adresse:</th><td>" + feature.properties.Strasse + "<br/>";
		content+=feature.properties.PLZStrasse+" "+feature.properties.Ort+"</td></tr>";
		content+="<tr><th>Postfach:</th><td>" + feature.properties.Postfach + "<br/>";
		content+=feature.properties.PLZPostfach+"</td></tr>";
		content+="<tr><th>E-Mail:</th><td><a href='mailto:" + feature.properties.Email + "'>" + feature.properties.Email + "</a></td></tr>";
		content+="<tr><th>Internet:</th><td><a class='url-break' href='http://"+ feature.properties.Internet +"' target='_blank'>"+ feature.properties.Internet+ "</td></tr>";
		content+="</table>";
		content+="<br>";
		content+="<button type='button' class='btn btn-secondary' id='btn_detail_route_start' data-lat='"+feature.properties.lat+"' data-lng='"+feature.properties.lng+"' data-txt='"+ feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 +"'>Route von hier</button>&nbsp;";
		content+="<button type='button' class='btn btn-secondary' id='btn_detail_route_ziel' data-lat='"+feature.properties.lat+"' data-lng='"+feature.properties.lng+"' data-txt='"+ feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 +"'>Route hier hin</button>&nbsp;";
		content+="<button type='button' class='btn btn-secondary' id='btn_detail_umkreis' data-lat='"+feature.properties.lat+"' data-lng='"+feature.properties.lng+"' data-txt='"+ feature.properties.Name1+" "+feature.properties.Name2+" "+feature.properties.Name3 +"'>Umkreissuche</button>";
	return content;
}
function getWerkArt(w){
	switch(w){
		case "":
		case "HW":
			return "Hauptwerk";
		case "ZW":
			return "Zweigwerk";
		case "HZW":
			return "Haupt-/Zweigwerk";
		case "GH":
			return "Gebietshauptwerk";
			
	}
}

function createMarker(markercolor,textcolor,feature,latlng){
	var options=createMarkerOptions(markercolor,textcolor,feature.properties.Art);
	options['circleText']=feature.properties.id;
	
	var marker=new L.Marker.SVGMarker(latlng,{iconOptions: options,riseOnHover:true}).bindTooltip(function (layer) {return '<b>'+getWerkArt(feature.properties.Art)+'</b>:<br/>'+feature.properties.Name1+' '+feature.properties.Name2+' '+feature.properties.Name3;},{permanent: false, opacity: 0.9});
	return marker;	
}

function standortInfos(layer,css_class){
	$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;padding:0"><span class="icon_branche_tbl '+css_class+'"></span></td><td class="feature-name">' +layer.feature.properties.id+' '+layer.feature.properties.Name1 +' '+layer.feature.properties.Name2+' '+layer.feature.properties.Name3+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
	
	var output="<li class='list-group-item'><span class='icon_branche_tbl "+css_class+"'></span>&nbsp;<b>"+layer.feature.properties.id+" ("+getWerkArt(layer.feature.properties.Art)+")</b>:&nbsp;"
	+layer.feature.properties.Name1+" "+layer.feature.properties.Name2+" "+layer.feature.properties.Name3;
	output+="<br/>Adresse: " + layer.feature.properties.Strasse + ", ";
	output+=layer.feature.properties.PLZStrasse+" "+layer.feature.properties.Ort;
	output+="</li>";
	
	$("#export-detail").append($(output));
}