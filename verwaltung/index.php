<?php
define("CMS_KLASSEN","../");
require_once("../dbconfig.php");
require_once('../DB_Verbindung.php');
$db=new DB_Verbindung("SELECT 1");

/**POST Aktionen abfragen**/
if(isset($_POST['action'])){
	switch($_POST['action']){
		case "changeSettings":
			//zunächst alle Zuordnungen löschen
			$db->neueAnfrage("DELETE FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_POST['uid']);
			
			//dann wieder einfügen
			foreach($_POST['bubra'] as $bundesland => $branchen){
				foreach($branchen as $branche=>$val){
					$db->neueAnfrage("INSERT INTO _sk_nutzer_bundesland_branche (nutzerid,bundesland,branche) VALUES (".$_POST['uid'].",".$bundesland.",".$branche.")");
				}
			}
		break;
		case "delete":
			$db->neueAnfrage("DELETE FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_POST['uid']);
			$db->neueAnfrage("DELETE FROM _sk_nutzer WHERE id=".$_POST['uid']);
		break;
		case "createUser":
			if(isset($_POST['email'])){
				//generiere einen Aktivierungslink
				$activation=md5(time());
				$anfrage="INSERT INTO _sk_nutzer (email,anrede,name,firma,time,activation) VALUES ('".mysql_real_escape_string($_POST['email'])."','".mysql_real_escape_string($_POST['anrede'])."','".mysql_real_escape_string($_POST['name'])."','".mysql_real_escape_string($_POST['firma'])."',".time().",'".$activation."')";
				$db->neueAnfrage($anfrage);
				
				//versende die Mail
				$empfaenger  = $_POST['email'];
				// Betreff
				$betreff="Ihr persönlicher Aktivierungslink für die Standortkarten Baustoffe";
				$nachricht="<html>
				<head>
					<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />
					<title>Ihr persönlicher Aktivierungslink für die Standortkarten Baustoffe</title>
				</head>
				<body>";
				if($_POST['anrede']=="Herr")$nachricht.="<p>Sehr geehrter ".$_POST['anrede']." ".$_POST['name'].",</p>";
				else $nachricht.="<p>Sehr geehrte ".$_POST['anrede']." ".$_POST['name'].",</p>";
				
				$nachricht.="<p>vielen Dank für Ihre Bestellung der Standortkarte(n) in elektronischer Form.</p>";
				$nachricht.="Anbei erhalten Sie Ihren persönlichen Aktivierungslink.<br/>";
				$nachricht.="Klicken Sie auf den folgenden Link (oder kopieren ihn in einen Browser Ihrer Wahl).<br/>";
				$nachricht.="Sie werden dann aufgefordert, ein Passwort für das Login zu vergeben.<br/>";
				$nachricht.="<a href=\"http://standortkarten.geoplangmbh.de/activate.php?a=".$activation."\">http://standortkarten.geoplangmbh.de/activate.php?a=".$activation."</a>";
				$nachricht.="<p>Nachdem Sie Ihren Zugang aktiviert haben, können sie sich in die Standortkaten Baustoffe einloggen.</p>";
				$nachricht.="<p>Mit freundlichen Grüßen,<br>Ihr Stein-Verlag Baden-Baden</p>";
				$nachricht.="<p><img border=\"0\" src=\"http://standortkarten.geoplangmbh.de/daten/bilder/logo_stein.jpg\"></p>";
				$nachricht.="</body></html>";
				
// für HTML-E-Mails muss der 'Content-type'-Header gesetzt werden
$header  = 'MIME-Version: 1.0' . "\r\n";
$header .= 'Content-type: text/html; charset=utf-8' . "\r\n";

// zusätzliche Header
$header .= "To: ".$_POST['anrede']." ".$_POST['name']."<".$_POST['email'].">" . "\r\n";
$header .= 'From: Standortkarten Aktivierung <mail@stein-verlag.de>' . "\r\n";

// verschicke die E-Mail
mail($empfaenger, $betreff, $nachricht, $header);
				
			}
		break;
	}
}

/**Hilfsfunktionen**/
function getAboTabelle($uid=0){
$output="";
//Schleife durch alle Bundesländer laufen und durch alle Branchen
//Zeilen: Bundesländer
//Spalten: Branchen
$output.="<table class\"detailtabelle\">";
$tempdb=new DB_Verbindung("SELECT * FROM _sk_branche ORDER BY beschreibung ASC");
$tempdb2=new DB_Verbindung("SELECT 1");
$branchen=array();
	//Tabellenheader erzeugen
	$output.="<thead><tr>";
	//erste Spalte freilassen
	$output.="<th></th>";
	if($tempdb->antwort_anzahl>0){
		do{
			$branchen[]=$tempdb->antwort_reihe['id'];
			$output.="<th>".utf8_encode($tempdb->antwort_reihe['beschreibung'])."</th>";
		}while($tempdb->neueReihe());
	$output.="</tr></thead>";
	
		//jetzt die Bundesländer holen und anzeigen
		$output.="<tbody>";
			$tempdb->neueAnfrage("SELECT * FROM _sk_bundesland ORDER BY beschreibung ASC");
			if($tempdb->antwort_anzahl>0){
				do{
					$output.="<tr><td>".utf8_encode($tempdb->antwort_reihe['beschreibung'])."</td>";
					for($i=0;$i<count($branchen);$i++){
						//TODO: prüfen, ob schon gecheckt!!
						$tempdb2->neueAnfrage("SELECT nutzerid FROM _sk_nutzer_bundesland_branche WHERE bundesland=".$tempdb->antwort_reihe['id']." AND branche=".$branchen[$i]." AND nutzerid=".$uid);
						if($tempdb2->antwort_anzahl>0)$checked="checked=\"checked\"";
						else $checked="";
						$output.="<td align=\"center\"><input type=\"checkbox\" name=\"bubra[".$tempdb->antwort_reihe['id']."][".$branchen[$i]."]\" ".$checked."></td>";
					}
					$output.="</tr>";
				}while($tempdb->neueReihe());
			}
		$output.="</tbody>";
	
	}
$output.="</table>";
return $output;
}

?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script type="text/javascript" src="../js/jq.js"></script>	
<script type="text/javascript">
	$(document).ready(function(evt){
		$("form[name='delete']").submit(function(evt){
			if(confirm("Möchten Sie diesen Benutzer wirklich löschen?")){
				return true;
			}
			else return false;
		});
		$("form[name='createUser']").submit(function(evt){
			if(confirm("Möchten Sie diesen Benutzer anlegen? Er bekommt einen Aktivierungslink an die angegebene E-Mail Adresse gesendet")){
				return true;
			}
			else return false;
		});
	});
</script>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Standortkarten Verwaltungsbereich</title>
</head>
<body>
<table align="center" border=1>
	<tr>
		<td>
		<form name="filter" method="POST" action="">
		<input type="text" name="filtertext" id="filtertext" placeholder="Nach Namen suchen..." value="<?=$_POST['filtertext']?>">
		<?php
			if(isset($_POST['filtertext']))echo "<input form=\"filter\" type=\"reset\" onclick=\"document.getElementById('filtertext').value=''\" value=\"Suche zurücksetzen\">";
			echo "<input type=\"submit\" value=\"Suche starten\">";
		?>
		</form>
		</td>
	</tr>
</table><br/><br/>

<table align="center" border=1>
<thead><tr>
<th>#</th>
<th>Email</th>
<th>Name</th>
<th>Firma</th>
<th>Info</th>
<th><form name="newuser" method="POST" action=""><input type="hidden" name="action" value="formnewuser"/><input type="submit" value="neuer Benutzer"/></form></th>
<tr>
</thead>
<tbody>
<?php
if(isset($_POST['filtertext'])){
	$anfrage="SELECT * FROM _sk_nutzer WHERE name LIKE '%".mysql_real_escape_string($_POST['filtertext'])."%' ORDER BY name ASC";
}
else
$anfrage="SELECT * FROM _sk_nutzer ORDER BY name ASC";
$db->neueAnfrage($anfrage);
//wenn es sich um einen neuen Nutzer handelt
$output="";
if($_POST['action']=="formnewuser"){
	$output.="<form name=\"createUser\" method=\"POST\"><input type=\"hidden\" name=\"action\" value=\"createUser\"/>";
	$output.="<tr>";
	$output.="<td></td>";
	$output.="<td><input type=\"text\" name=\"email\" placeholder=\"E-Mail Adresse\" /></td>";
	$output.="<td><select name=\"anrede\"><option value=\"Herr\">Herr</option><option value=\"Frau\">Frau</option></select><input type=\"text\" name=\"name\" placeholder=\"Name\" /></td>";
	$output.="<td><input type=\"text\" name=\"firma\" placeholder=\"Firma\" /></td>";
	$output.="<td></td>";
	$output.="<td><input type=\"submit\" value=\"Nutzer anlegen\" /></td>";
	$output.="</tr>";
	$output.="</form>";
}

if($db->antwort_anzahl>0){

	do{
		$output.="<tr>";
		$output.="<td>".$db->antwort_reihe['id']."</td>";
		$output.="<td>".$db->antwort_reihe['email']."</td>";
		$output.="<td>".$db->antwort_reihe['vorname']." ".$db->antwort_reihe['name']."</td>";
		$output.="<td>".$db->antwort_reihe['firma']."</td>";
		$output.="<td><form name=\"details\" method=\"POST\"><input type=\"hidden\" name=\"uid\" value=\"".$db->antwort_reihe['id']."\"/><input type=\"hidden\" name=\"action\" value=\"showDetails\" /><input type=\"submit\" value=\"Abo anzeigen\"></form></td>";
		$output.="<td><form name=\"delete\" method=\"POST\" action=\"\"><input type=\"hidden\" name=\"action\" value=\"delete\"/><input type=\"hidden\" name=\"uid\" value=\"".$db->antwort_reihe['id']."\"/><input type=\"submit\" value=\"Nutzer löschen\"></form></td>";
		$output.="</tr>";
		//wenn für diesen Nutzer Details angezeigt werden sollen
		if($_POST['action']=='showDetails'&&$_POST['uid']==$db->antwort_reihe['id']){
			$output.="<tr class=\"details\">";
			$output.="<td colspan=\"6\"><h3>gebuchte Branchen des Nutzers ".$db->antwort_reihe['vorname']." ".$db->antwort_reihe['name'].":</h3>";
			$output.="<form name=\"changeSettings\" method=\"POST\">";
			$output.="<input type=\"hidden\" name=\"action\" value=\"changeSettings\"/>";
			$output.="<input type=\"hidden\" name=\"uid\" value=\"".$db->antwort_reihe['id']."\"/>";
			$output.=getAboTabelle($db->antwort_reihe['id']);
			$output.="<input type=\"submit\" value=\"Buchung speichern\" />";
			$output.="</form>";
			$output.="</td>";
			$output.="</tr>";
		}
	}while($db->neueReihe());

}	
echo $output;


unset($_POST);

?>
</tbody>
</table>
</body>
</html>