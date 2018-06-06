<?php
define("CMS_KLASSEN","../");
require_once("dbconfig.php");
require_once('klassen/DB_Verbindung.php');
$db=new DB_Verbindung("SELECT 1");

if($_POST['action']=="changePW"){
	if($_POST['pw']==$_POST['pw_repeat'])
	$anfrage="UPDATE _sk_nutzer SET passwort='".mysql_real_escape_string(password_hash($_POST['pw'], PASSWORD_DEFAULT))."', activation='' WHERE id=".$_POST['uid'];
	$db->neueAnfrage($anfrage);
	$output="Vielen Dank, ihr Passwort wurde gesetzt. Sie können nun die Standortkarten nutzen!";
}
else if(isset($_GET['a'])){
	$anfrage="SELECT id FROM _sk_nutzer WHERE activation='".mysql_real_escape_string($_GET['a'])."' AND passwort=''";
	$db->neueAnfrage($anfrage);
	if($db->antwort_anzahl>0){
		$output="<form name=\"changePW\" method=\"POST\">";
		$output.="<input type=\"hidden\" name=\"ac\" value=\"".$_GET['a']."\"/>";
		$output.="<input type=\"hidden\" name=\"action\" value=\"changePW\"/>";
		$output.="<input type=\"hidden\" name=\"uid\" value=\"".$db->antwort_reihe['id']."\"/>";
		$output.="<table border=1>";
		$output.="<tr><td colspan=2>Bitte wählen Sie ein Passwort. Notieren Sie sich dieses und bewahren Sie es an einem sicheren Ort auf</td></tr>";
		$output.="<tr><td>Passwort:</td><td><input name=\"pw\" type=\"password\" /></td>";
		$output.="<tr><td>Passwort<br>wiederholen:</td><td><input type=\"password\" name=\"pw_repeat\"/></td>";
		$output.="<tr><td colspan=\"2\"><input type=\"submit\" value=\"Passwort festlegen\"></td>";
		$output.="</table>";
		$output.="</form>";
	}else{
		$output="Sie haben keinen gültigen Aktivierungslink oder Sie haben Ihr Konto bereits aktiviert!";
	}
}
?>
<!doctype html>
<html>
<head>
<title>Aktivierungsportal der Standortkarten Baustoffe</title>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script type="text/javascript" src="../js/jq.js"></script>	
<script type="text/javascript"></script>
</head>

<body>
<p><?=$output;?></p>
<a href="/">Zu den Standortkarten</a>
</body>
</html>