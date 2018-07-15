$(document).ready(function(evt){
	$("#abo").hide();
	$("#standort").hide();
	$("#printwerk").hide();
	
	$(".nav-link").click(function(evt){
		$(".nav-link").removeClass("active");
		$(this).addClass("active");
		$(".container").hide();
		var ident="#"+$(this).attr("data-ref");
		$(ident).show();
		evt.stopPropagation();
		return false;
	});
	$.post( "#","command=fetchAboData",function( data ) {
	  $( ".result" ).html( data );
	});
});