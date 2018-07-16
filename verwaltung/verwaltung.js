var abonnenten;
var options = {
    valueNames: [ 'name', 'city' ]
};

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


function holeAbonnenten(){
	$.post( "#","command=fetchAboData",function(data) {
		abonnenten=JSON.parse(data);
		
		
		$("#abo").empty();
		$("#abo").append($("<form class=\"form-inline\"><input type=\"search\" class=\"form-control mb-2 mr-sm-2 mb-sm-0 search\" id=\"inlineFormInput\" placeholder=\"Suchen...\"><button type=\"button\" class=\"btn btn-primary sort\" data-sort=\"abo_firma\"><i class=\"fa fa-sort\"></i>&nbsp;Firma</button>&nbsp;&nbsp;<button type=\"button\" class=\"btn btn-primary sort\" data-sort=\"abo_name\"><i class=\"fa fa-sort\"></i>&nbsp;Ansprechpartner</button>&nbsp;&nbsp;<button type=\"button\" id=\"abo_new\" class=\"btn btn-success\"><i class=\"fa fa-plus-square\"></i>&nbsp;neuer Abonnent</button></form><ul class=\"list-group list\" id=\"abo_list\">"));
		
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
	
		var options = {
		  valueNames:['abo_name','abo_firma','abo_email','abo_anschrift']
		};
		var hackerList = new List('abo', options);
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