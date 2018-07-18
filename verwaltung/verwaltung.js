var abonnenten;
var standorte;
var currentbranche=0;
var currentbundesland=0;
var currentdatensatz="";
var abo_options = {
		  valueNames:['abo_name','abo_firma','abo_email','abo_anschrift']
};
var standort_options = {
    valueNames: [ 'standort_name', 'standort_ort' ]
};
var datensaetze=[{
			id:"_demo",
			beschreibung:"Demotour"
		},
		{
			id:"_v2",
			beschreibung:"Standorte (nach 2012)"
		},
		{
			id:"",
			beschreibung:"Standorte (vor 2012)"
		},
		];

$(document).ready(function(evt){
	$("#abo").show();
	$("#standort").hide();
	$("#printwerk").hide();
	
	$(".nav-link").click(function(evt){
		if($(this).hasClass("disabled")) return false;
		
		$(".nav-link").removeClass("active");
		$(this).addClass("active");
		$(".container").hide();
		var ident="#"+$(this).attr("data-ref");
		$(ident).show();
		evt.stopPropagation();
		return false;
	});
	$("#editStandortForm").submit(function(evt){
		$.post( "#","command=editStandort&"+$(this).serialize(),function(data){
			if(data=="success!"){
				$("#editStandortModal").modal('hide');
				holeStandorte(currentbranche,currentbundesland,currentdatensatz);
			}
			
		});
		evt.stopPropagation();
		return false;
	});
	$("#newAboModalForm").submit(function(evt){
		$.post( "#","command=createUser&"+$(this).serialize(),function(data){
			if(data=="success!"){
				$("#newAboModalForm")[0].reset();
				$("#newAboModal").modal('hide');
				holeAbonnenten();
			}
		});
		evt.stopPropagation();
		return false;
	});
	
	$("#aboSettingsModalForm").submit(function(evt){
		$.post( "#","command=changeSettings&"+$(this).serialize(),function(data){
			if(data=="success!"){
				$("#aboSettingsModalForm")[0].reset();
				$("#aboSettingsModal").modal('hide');
				holeAbonnenten();
			}
		});
		evt.stopPropagation();
		return false;
	});
	
	
	
	holeAbonnenten();
	holeStandorte(1,1,"_v2");
});



function createAboTable(branchen,bundeslaender,nutzermatrix){
	nutzermatrix=nutzermatrix.abo;
	var output="<table  class=\"table table-sm\">"
	output+="<thead><tr>";
	output+="<th scope=\"col\"></th>";
	
	$.each(branchen,function(index,value){
		output+="<th scope=\"col\">"+value.beschreibung+"</th>";
	});
	output+="</tr></thead>";
	output+="<tbody>";
	
	$.each(bundeslaender,function(index,value){
		output+="<tr><th scope=\"row\">"+value.beschreibung+"</th>";
		$.each(branchen,function(index2,value2){
			//todo: find out if checked!
			var checked="";
			$.each(nutzermatrix,function(index,value3){
				if(value3.bundesland==value.id&&value3.branche==value2.id){
					checked="checked=\"checked\"";
				}
			});
			output+="<td align=\"center\"><input type=\"checkbox\" name=\"bubra["+value.id+"]["+value2.id+"]\" "+checked+"></td>";
		});
		output+="</tr>";
	});
	output+="</tbody>";
	output+="</table>";

	return output;
}
function holeStandorte(branche,bundesland,datensatz){
	currentbranche=branche;
	currentbundesland=bundesland;
	currentdatensatz=datensatz;
	$.post( "#","command=fetchStandortData&branche="+branche+"&bundesland="+bundesland+"&suffix="+datensatz,function(data) {
		standorte=JSON.parse(data);
		console.log(standorte);
		$("#standort").empty();
		
		var branchen="";
		$.each(standorte.branchen,function(index,value){
			var selected="";
			if(value.id==branche)selected="selected=\"selected\"";
			branchen+="<option value=\""+value.id+"\" "+selected+">"+value.beschreibung+"</option>";
		});
		
		var bundeslaender="";
		$.each(standorte.bundeslaender,function(index,value){
			var selected="";
			if(value.id==bundesland)selected="selected=\"selected\"";
			bundeslaender+="<option value=\""+value.id+"\" "+selected+">"+value.beschreibung+"</option>";
		});
		
		var datenbank="";
		$.each(datensaetze,function(index,value){
			var selected="";
			if(value.id==datensatz)selected="selected=\"selected\"";
			datenbank+="<option value=\""+value.id+"\" "+selected+">"+value.beschreibung+"</option>";
		});
		
		//Formular für die Branchen-Bundesland-Datenbank Auswahl
		var html=`
		<div class="standorte_bbdb_auswahl">	
		<form class="form-inline">
			<select class="form-control" id="st_branche_select">
				<option selected disabled>Branche wählen:</option>
				${branchen}
			</select>
			<select class="form-control" id="st_bundesland_select">
				<option selected disabled>Bundesland wählen:</option>
				${bundeslaender}
			</select>
			<select class="form-control" id="st_datenbank_select">
				<option selected disabled>Datensatz wählen:</option>
				${datenbank}
			</select>
		</form></div>
		`
		
		html+=`<div>
		<form class="form-inline">
			<input type="search" class="form-control mb-2 mr-sm-2 mb-sm-0 search" id="inlineFormInput" placeholder="Suchen...">
			<button type="button" class="btn btn-primary sort" data-sort="standort_name"><i class="fa fa-sort"></i>&nbsp;Firma</button>
			&nbsp;&nbsp;<button type="button" class="btn btn-primary sort" data-sort="standort_ort"><i class="fa fa-sort"></i>&nbsp;Ort</button>
			<!--&nbsp;&nbsp;<button type="button" id="abo_new" class="btn btn-success"><i class="fa fa-plus-square"></i>&nbsp;neuer Standort</button>-->
		</form>
		</div>
		<ul class="list-group list" id="standorte_list"></ul>
		`
		$("#standort").append($(html));
		
		
		
		
		
		$.each(standorte.standorte,function(ind,value){
			let html=`<li class="list-group-item">
			#${value.id} (${getWerkArt(value.Art)})<h5 class="standort_name">${value.Name1} ${value.Name2} ${value.Name3}</h5>
			${value.Strasse} | ${value.PLZStrasse} <span class="standort_ort"> ${value.Ort}</span><br/>
			<span class="standort_tel">${value.Telefon} | ${value.Email} | ${value.Internet}</span>
			<div class="collapse" id="standortmenu_${value.id}">
			<br/><button type="button" class="standortedit btn btn-primary" data-ref="${value.id}"><i class="fa fa-edit"></i>&nbsp;Standort bearbeiten</button>&nbsp;
			<!--<button type="button" class="standortlocate btn btn-primary" data-ref="${value.id}"><i class="fa fa-map-pin"></i>&nbsp;Standort verschieben</button>&nbsp;-->
			<button type="button" class="standortdelete btn btn-danger" data-ref="${value.id}"><i class="fa fa-trash"></i>&nbsp;Entfernen</button>	
			</div>
			`;
			let el=$(html);
			el.click(function(evt){
				$("#standortmenu_"+value.id).collapse();
			});
			$("#standorte_list").append(el);
			$("#standortmenu_"+value.id).data("standort",value);
		});
		
		$("#st_branche_select,#st_bundesland_select,#st_datenbank_select").change(function(evt){
			holeStandorte($("#st_branche_select").val(),$("#st_bundesland_select").val(),$("#st_datenbank_select").val());
		});
		var hackerList = new List('standort', standort_options);
		hackerList.sort("standorte_name", {order:"asc"});
		
		
		$(".standortdelete").click(function(evt){
			if(confirm("Möchten Sie den Standort wirklich löschen?")){
				var sid=$(this).attr("data-ref");
				$.post( "#","command=deleteStandort&datensatz="+currentdatensatz+"&sid="+$(this).attr("data-ref"),function(data){
				if(data=="success!"){
					holeStandorte(currentbranche,currentbundesland,currentdatensatz);
				}
				});
			}
		});
		
		$(".standortedit").click(function(evt){
			$("#editStandortFormBody").empty();
			$("#standortedit_sid").val($(this).attr("data-ref"));
			$("#standortedit_datensatz").val(currentdatensatz);
			
			$("#editStandortModal").modal();
			var standort=$("#standortmenu_"+$(this).attr("data-ref")).data("standort");
			console.log(standort);
			$.each(standort,function(key,value){
				var formout="";
				if(key=="id"){
					formout=`<div class="form-group">Dieses Werk hat die Nummer ${value}</div>`;
				}
				else if(key=="branche"||key=="bundesland"){
					if(key=="branche"){
						formout+=`<div class="form-group">
						<label for="${key}">${key}</label>
						<select class="form-control" name="branche">`
						$.each(standorte.branchen,function(i,v){
							let selected=""
							if(v.id==value) selected="selected=\"selected\"";
							formout+=`<option ${selected} value="${v.id}">${v.beschreibung}</option>`;
						});
						formout+=`
						</select>
						`;
					}
					if(key=="bundesland"){
						formout+=`<div class="form-group">
						<label for="${key}">${key}</label>
						<select class="form-control" name="bundesland">`
						$.each(standorte.bundeslaender,function(i,v){
							let selected=""
							if(v.id==value) selected="selected=\"selected\"";
							formout+=`<option ${selected} value="${v.id}">${v.beschreibung}</option>`;
						});
						formout+=`
						</select>
						`;
					}
				}
				else{ formout=`
					<div class="form-group">
						<label for="${key}">${key}</label>
						<input type="text" class="form-control" id="${key}" name="${key}" value="${value}">
					</div>
				`;}
				$("#editStandortFormBody").append($(formout));
			});
		});
	});
	
	
}

function holeAbonnenten(){
	$.post( "#","command=fetchAboData",function(data) {
		abonnenten=JSON.parse(data);
		
		
		$("#abo").empty();
		$("#abo").append($("<form class=\"form-inline\"><input type=\"search\" class=\"form-control mb-2 mr-sm-2 mb-sm-0 search\" id=\"inlineFormInput\" placeholder=\"Suchen...\"><button type=\"button\" class=\"btn btn-primary sort\" data-sort=\"abo_firma\"><i class=\"fa fa-sort\"></i>&nbsp;Firma</button>&nbsp;&nbsp;<button type=\"button\" class=\"btn btn-primary sort\" data-sort=\"abo_name\"><i class=\"fa fa-sort\"></i>&nbsp;Ansprechpartner</button>&nbsp;&nbsp;<button type=\"button\" id=\"abo_new\" class=\"btn btn-success\"><i class=\"fa fa-plus-square\"></i>&nbsp;neuer Abonnent</button></form><ul class=\"list-group list\" id=\"abo_list\"></ul>"));
		
		$.each(abonnenten.abonnenten,function(ind,value){
			/*
			Todo: durch Handlebars.js ersetzen
			*/
			var output="";
			output+="<li class=\"list-group-item\">";
			output+="<h5 class=\"abo_firma\">"+value.firma+"</h5>";
			if(value.name!=""){
				output+=value.anrede+" "+"<span class=\"abo_name\">"+value.name+"</span> | ";
			}
			output+="<a class=\"abo_email\" href=\"mailto:"+value.email+"\" target=\"_blank\">"+value.email+"</a>";
			
			if(value.anschrift!=""){
				output+="<span class=\"abo_anschrift\">"+value.anschrift+"</span>";
			}
			output+="<div class=\"collapse\" id=\"abomenu_"+value.id+"\">";
			output+="<br/><button type=\"button\" class=\"abochange btn btn-primary\" data-ref=\""+value.id+"\"><i class=\"fa fa-th\"></i>&nbsp;Abos verwalten</button>&nbsp;";
			output+="<button type=\"button\" class=\"abodelete btn btn-danger\" data-ref=\""+value.id+"\"><i class=\"fa fa-trash\"></i>&nbsp;Entfernen</button>";	
			output+="</div>";
		
			output+="</li>";
			
			var el=$(output);
			el.click(function(evt){
				$("#abomenu_"+value.id).collapse();
			});
			$("#abo_list").append(el);
			$("#abomenu_"+value.id).data("abo",value.buba_matrix);
		});
	
		var hackerList = new List('abo', abo_options);
		hackerList.sort("abo_firma", {order:"asc"});
		
		$("#abo_new").click(function(evt){
			$("#newAboModal").modal();
		});
		
		$(".abodelete").click(function(evt){
			if(confirm("Möchten Sie den Abonnenten wirklich löschen?")){
				$.post( "#","command=delete&uid="+$(this).attr("data-ref"),function(data){
				if(data=="success!"){
					holeAbonnenten();
				}
				});
			}
		});
		
		$(".abochange").click(function(evt){
			$("#aboSettingsModalMatrix").empty();
			$("#abochange_uid").val($(this).attr("data-ref"));
			$("#aboSettingsModalMatrix").append(createAboTable(abonnenten.branchen,abonnenten.bundeslaender,$("#abomenu_"+$(this).attr("data-ref")).data()));
			$("#aboSettingsModal").modal();
		});
		
	});
}