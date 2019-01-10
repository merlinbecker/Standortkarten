<?php
require_once("dbconfig.php");
require_once("vendor/autoload.php");

$db=\ParagonIE\EasyDB\Factory::create(
	'mysql:host='.$host.';dbname='.$datenbank,
	$nutzer,
	$passwort);

$output="Sie haben keinen g&uuml;ltigen Aktivierungslink oder Sie haben Ihr Konto bereits aktiviert!";
if(!isset($_POST['action']))$_POST['action']="";
if($_POST['action']=="changePW"){
	if(!isset($_POST['pw']))return;
	if($_POST['pw']==$_POST['pw_repeat'])
	{	
		$db->update("_sk_nutzer",["passwort"=>password_hash($_POST['pw'], PASSWORD_DEFAULT),"activation"=>''],["id"=>$_POST['uid']]);
		$output="Vielen Dank, ihr Passwort wurde gesetzt. Sie k&ouml;nnen nun die Standortkarten nutzen!";
	}
}
else if(isset($_GET['a'])){
	$ident=$db->single("SELECT id FROM _sk_nutzer WHERE activation=?",array($_GET['a']));
	if($ident>0){
		$output="<form name=\"changePW\" method=\"POST\">";
		$output.="<input type=\"hidden\" name=\"ac\" value=\"".$_GET['a']."\"/>";
		$output.="<input type=\"hidden\" name=\"action\" value=\"changePW\"/>";
		$output.="<input type=\"hidden\" name=\"uid\" value=\"".$ident."\"/>";
		$output.="<table border=1>";
		$output.="<tr><td colspan=2>Bitte wählen Sie ein Passwort. Notieren Sie sich dieses und bewahren Sie es an einem sicheren Ort auf</td></tr>";
		$output.="<tr><td>Passwort:</td><td><input name=\"pw\" type=\"password\" /></td>";
		$output.="<tr><td>Passwort<br>wiederholen:</td><td><input type=\"password\" name=\"pw_repeat\"/></td>";
		$output.="<tr><td colspan=\"2\"><input type=\"submit\" value=\"Passwort festlegen\"></td>";
		$output.="</table>";
		$output.="</form>";
	}else{
		$output="Sie haben keinen g&uuml;ltigen Aktivierungslink oder Sie haben Ihr Konto bereits aktiviert!";
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
