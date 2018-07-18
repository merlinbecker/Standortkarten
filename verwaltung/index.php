<?php
$valid_passwords = array ("admin" => "steinadmin");
$valid_users = array_keys($valid_passwords);

$user = $_SERVER['PHP_AUTH_USER'];
$pass = $_SERVER['PHP_AUTH_PW'];

$validated = (in_array($user, $valid_users)) && ($pass == $valid_passwords[$user]);

if (!$validated) {
  header('WWW-Authenticate: Basic realm="My Realm"');
  header('HTTP/1.0 401 Unauthorized');
  die ("Sie haben die falschen Benutzerdaten eingegeben.");
}

session_start();
$_SESSION['is_admin']=true;

if(isset($_POST['command'])){
	define("CMS_KLASSEN","../");
	require_once("../dbconfig.php");
	require_once('../DB_Verbindung.php');
	$db=new DB_Verbindung("SELECT 1");
	
	switch($_POST['command']){
		case "fetchStandortData":
			$suffix=$_POST['suffix'];
			$tabelle="_sk_standorte".$suffix;
			$condition="";
			if(is_numeric($_POST['branche'])&&$_POST['branche']>0){
				$condition=" WHERE branche=".$_POST['branche'];
			}
			if(is_numeric($_POST['bundesland'])&&$_POST['bundesland']>0){
				if($condition=="")$condition=" WHERE ";
				else $condition.=" AND ";
				$condition.="bundesland=".$_POST['bundesland'];
			}
			
			$ausgabe=array();
		
			$ausgabe['bundeslaender']=array();
			$ausgabe['branchen']=array();
			$ausgabe['standorte']=array();
			$anfrage="SELECT * FROM _sk_bundesland";
			$db->neueAnfrage($anfrage);
			if($db->antwort_anzahl>0){
				do{
					$ausgabe['bundeslaender'][]=$db->antwort_reihe;
				}while($db->neueReihe());
			}
			
			$anfrage="SELECT * FROM _sk_branche";
			$db->neueAnfrage($anfrage);
			if($db->antwort_anzahl>0){
				do{
					$ausgabe['branchen'][]=$db->antwort_reihe;
				}while($db->neueReihe());
			}
			
			$anfrage="SELECT * FROM ".$tabelle.$condition;
			$db->neueAnfrage($anfrage);
			if($db->antwort_anzahl>0){
				do{
					$ausgabe['standorte'][]=$db->antwort_reihe;
				}while($db->neueReihe());
			}
			echo json_encode($ausgabe);
		break;
		
		case "fetchAboData":
		$ausgabe=array();
		
		$ausgabe['bundeslaender']=array();
		$ausgabe['branchen']=array();
		
		$anfrage="SELECT * FROM _sk_bundesland";
		$db->neueAnfrage($anfrage);
		if($db->antwort_anzahl>0){
			do{
				$ausgabe['bundeslaender'][]=$db->antwort_reihe;
			}while($db->neueReihe());
		}
		
		$anfrage="SELECT * FROM _sk_branche";
		$db->neueAnfrage($anfrage);
		if($db->antwort_anzahl>0){
			do{
				$ausgabe['branchen'][]=$db->antwort_reihe;
			}while($db->neueReihe());
		}
		$anfrage="SELECT id,email,anrede,name,firma,anschrift FROM _sk_nutzer ORDER BY firma ASC";
		$db->neueAnfrage($anfrage);
		if($db->antwort_anzahl>0){
		$abonnenten=array();
			do{				
				$tempdb=new DB_Verbindung("SELECT bundesland,branche FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$db->antwort_reihe['id']);
				
				if($tempdb->antwort_anzahl>0){
					do{
						$db->antwort_reihe['buba_matrix'][]=$tempdb->antwort_reihe;
					}while($tempdb->neueReihe());
				}
				$ausgabe['abonnenten'][]=$db->antwort_reihe;
			}while($db->neueReihe());
		}
		echo json_encode($ausgabe);
		break;
		case "editStandort":
			if(isset($_POST['id'],$_POST['suffix'])){
				$ident=$_POST['id'];
				$suffix=$_POST['suffix'];
				unset($_POST['id'],$_POST['suffix'],$_POST['command']);
				$anfrage="UPDATE _sk_standorte".$suffix." SET ";
				$vars=array();
				foreach($_POST as $key=>$value){
					if(!is_numeric($value)){
						$vars[]=$key."='".mysql_real_escape_string($value)."'";
					}
					else $vars[]=$key."=".$value;
				}
				$anfrage.=implode(",",$vars);
				$anfrage.=" WHERE id=".$ident;
				
				$db->neueAnfrage($anfrage);
				
				echo $db->fehlermeldung."success!";
			}
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
			echo "success!";
			}
		break;
		case "deleteStandort":
			if(isset($_POST['datensatz'],$_POST['sid'])){
				$db->neueAnfrage("DELETE FROM _sk_standorte".$_POST['datensatz']." WHERE id=".$_POST['sid']);
				echo "success!";
			}
		break;
		case "delete":
			$db->neueAnfrage("DELETE FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_POST['uid']);
			$db->neueAnfrage("DELETE FROM _sk_nutzer WHERE id=".$_POST['uid']);
			echo "success!";
		break;
		case "changeSettings":
			//zunächst alle Zuordnungen löschen
			$db->neueAnfrage("DELETE FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_POST['uid']);
			
			//dann wieder einfügen
			foreach($_POST['bubra'] as $bundesland => $branchen){
				foreach($branchen as $branche=>$val){
					$db->neueAnfrage("INSERT INTO _sk_nutzer_bundesland_branche (nutzerid,bundesland,branche) VALUES (".$_POST['uid'].",".$bundesland.",".$branche.")");
				}
			}
			
			echo "success!";
		break;
	}

}
else include("verwaltung.html");
unset($_POST);
exit();