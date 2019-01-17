<?php
require_once("../vendor/autoload.php");
require_once("../dbconfig.php");
$valid_passwords = array ($nutzer_verwaltung => $pw_verwaltung);
$valid_users = array_keys($valid_passwords);

$user = $_SERVER['PHP_AUTH_USER'];
$pass = $_SERVER['PHP_AUTH_PW'];

$validated = (in_array($user, $valid_users)) && ($pass == $valid_passwords[$user]);

if (!$validated) {
  header('WWW-Authenticate: Basic realm="Standortkarten Verwaltung"');
  header('HTTP/1.0 401 Unauthorized');
  die ("Sie haben die falschen Benutzerdaten eingegeben.");
}

session_start();
$_SESSION['is_admin']=true;

if(isset($_POST['command'])){
	
	$db=\ParagonIE\EasyDB\Factory::create(
		'mysql:host='.$host.';dbname='.$datenbank,
		$nutzer,
		$passwort);

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
			
			$ausgabe['bundeslaender']=$db->run("SELECT * FROM _sk_bundesland");
			$ausgabe['branchen']=$db->run("SELECT * FROM _sk_branche");
			$ausgabe['standorte']=$db->run("SELECT * FROM ".$tabelle.$condition);
			echo json_encode($ausgabe);
		break;
		case "fetchPrintingQueue":
			//first of all, check if the queue table exists
			try{
				$dbcheck = $db->run("SELECT 1 FROM _sk_map_render_queue");
			}catch(Exception $e){
				if($e->getCode()=="42S02"){
					$db->run("CREATE TABLE _sk_map_render_queue ( "
						."`dataset` VARCHAR(10) NOT NULL ,"
						."`branche` TINYINT NOT NULL ," 
						."`bundesland` TINYINT NOT NULL ,"
						."`queued` TINYINT(2) DEFAULT 0 , "
						."`updated` BIGINT DEFAULT 0 ) ENGINE = InnoDB");
				}else return $e->getMessage();
			}

			$ausgabe=array();
			$ausgabe['bundeslaender']=$db->run("SELECT * FROM _sk_bundesland");
			$ausgabe['branchen']=$db->run("SELECT * FROM _sk_branche");
			
			$suffix=$_POST['suffix'];
			$ausgabe['queue']=$db->row("SELECT queued,updated " 
					."FROM _sk_map_render_queue WHERE dataset=? " 
					."AND bundesland=? AND branche=?",
					$suffix,$_POST['bundesland'],$_POST['branche']);
			if(count($ausgabe['queue'])==0){
				$db->insert("_sk_map_render_queue",
					array("dataset"=>$suffix,
					"bundesland"=>$_POST['bundesland'],
					"branche"=>$_POST['branche']));
				$ausgabe['queue']['queued']=0;
				$ausgabe['queue']['updated']=0;
			}
			if(!is_dir("printdata")){
				if(!mkdir("printdata")){
					throw new \Exception("could not create printdata folder");
				}
			}
			$ausgabe['queue']['fn_din0']="printdata/din0".$suffix."_".$_POST['bundesland']."_".$_POST['branche'].".png";
			if(!is_file($ausgabe['queue']['fn_din0']))$ausgabe['queue']['fn_din0']="";

			$ausgabe['queue']['fn_preview']="printdata/preview".$suffix."_".$_POST['bundesland']."_".$_POST['branche'].".png";
			if(!is_file($ausgabe['queue']['fn_preview']))$ausgabe['queue']['fn_preview']="";

			$ausgabe['queue']['fn_text']="printdata/test".$suffix."_".$_POST['bundesland']."_".$_POST['branche'].".txt";
			if(!is_file($ausgabe['queue']['fn_text']))$ausgabe['queue']['fn_text']="";
			
			echo json_encode($ausgabe);
		break;
		case "setPrintingDone":
			if(isset($_POST['suffix'],$_POST['branche'],$_POST['bundesland'])){
				$db->update("_sk_map_render_queue",
				["queued"=>0,"updated"=>time()],
				["dataset"=>$_POST['suffix'],
				"branche"=>$_POST['branche'],
				"bundesland"=>$_POST['bundesland']]);
			}
		case "fetchAboData":
			$ausgabe=array();	
			$ausgabe['bundeslaender']=array();
			$ausgabe['branchen']=array();
			$ausgabe['bundeslaender']=$db->run("SELECT * FROM _sk_bundesland");
			$ausgabe['branchen']=$db->run("SELECT * FROM _sk_branche");	
	
			$ausgabe['abonnenten']=$db->run("SELECT id,email,anrede,name,firma,anschrift FROM _sk_nutzer ORDER BY firma ASC");
			foreach ($ausgabe['abonnenten'] as &$user){
				$user['buba_matrix']=$db->run("SELECT bundesland,branche FROM _sk_nutzer_bundesland_branche WHERE nutzerid=?",$user['id']);
			}
		echo json_encode($ausgabe);
		break;
		case "changeLocation":
			if(isset($_POST['id'],$_POST['suffix'])){
				$db->update("_sk_standorte".$_POST['suffix'],array("lat"=>$_POST['lat'],"lng"=>$_POST['lon']),array("id"=>$_POST['id']));
				echo "success!";
			}
		break;
		case "editStandort":
			if(isset($_POST['id'],$_POST['suffix'])){
				$ident=$_POST['id'];
				$suffix=$_POST['suffix'];
				unset($_POST['id'],$_POST['suffix'],$_POST['command']);

				$db->update("_sk_standorte".$suffix,$_POST,["id"=>$ident]);
				echo "success!";
			}
		break;
	case "createUser":
			if(isset($_POST['email'])){
				//generiere einen Aktivierungslink
				$activation=md5(time());
				$db->insert("_sk_nutzer",["email"=>$_POST['email'],"anrede"=>$_POST['anrede'],"name"=>$_POST['name'],"firma"=>$_POST['firma'],"time"=>time(),"activation"=>$activation]);
				
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
				$db->delete("_sk_standorte".$_POST['datensatz'],["id"=>$_POST['sid']]);
				echo "success!";
			}
		break;
		case "delete":
			$db->delete("_sk_nutzer_bundesland_branche",["nutzerid"=>$_POST['uid']]);
			$db->delete("_sk_nutzer",array("id"=>$_POST['uid']));
			echo "success!";
		break;
		case "changeSettings":
			//zunächst alle Zuordnungen löschen
			$db->delete("_sk_nutzer",["nutzerid"=>$_POST['uid']]);
			
			//dann wieder einfügen
			foreach($_POST['bubra'] as $bundesland => $branchen){
				foreach($branchen as $branche=>$val){
					$db->insert("_sk_nutzer_bundesland_branche",["nutzerid"=>$_POST['uid'],"bundesland"=>$bundesland,"branche"=>$branche]);
				}
			}
			echo "success!";
		break;
	}

}
else include("verwaltung.html");
unset($_POST);
exit();
