<?php
/**
Der Webservice für die Stein Verlag Standortkarten
@author Merlin Becker
@date 10.04.2014
@version 2.0
@since 0.2
@update 03.06.2018
**/
error_reporting(1);


/**
legacy code, maybe delete
**/
if (!function_exists('json_decode')){
    function json_decode($content, $assoc=false) {
        require_once 'JSON.php';
        if ($assoc) {
            $json = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
        }
        else {
            $json = new Services_JSON;
        }
        return $json->decode($content);
    }
}

if (!function_exists('json_encode')){
    function json_encode($content) {
        require_once 'JSON.php';
        $json = new Services_JSON;
        return $json->encode($content);
    }
}

/*legacy code end*/

session_start();

define("VERSION","2.0");
define("CMS_KLASSEN","");

require_once("dbconfig.php");
require_once('DB_Verbindung.php');

$GLOBALS['db']=new DB_Verbindung("SELECT 1");


//für die Anfrage von Infos
if(isset($_POST['d'])){
	$result=array();
	$data=json_decode(base64_decode($_POST['d']));
	switch($data->command){
		/* !getBranchen: @TODO ABFRAGE ob erlaubt */
		case "getBranchen":
			if(isLoggedIn()){
				
				$GLOBALS['db']->neueAnfrage("SELECT * FROM _sk_branche WHERE _sk_branche.id IN (SELECT  DISTINCT branche FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_SESSION['nutzer']['id'].")");
				/*
				$anfrage="SELECT branche FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_SESSION['nutzer']['id']." GROUP BY branche;";
				$GLOBALS['db']->neueAnfrage($anfrage);
				$temp=array();
				do{
					$temp[]=$GLOBALS['db']->antwort_reihe['branche'];
				}while($GLOBALS['db']->neueReihe());
				
				
				//$GLOBALS['db']->neueAnfrage("SELECT * FROM _sk_branche ");
				$GLOBALS['db']->neueAnfrage("SELECT * FROM _sk_branche WHERE id IN (".implode(",",$temp).");");
				
				echo "SELECT * FROM _sk_branche WHERE id IN (".implode(",",$temp).");";
				*/
			//	$GLOBALS['db']->neueAnfrage("SELECT * FROM _sk_branche ");
				$laender=array();
				if($GLOBALS['db']->antwort_anzahl>0){
				do{
				$GLOBALS['db']->antwort_reihe['beschreibung']=utf8_encode($GLOBALS['db']->antwort_reihe['beschreibung']);
				$GLOBALS['db']->antwort_reihe['selected']=in_array($GLOBALS['db']->antwort_reihe['id'], $_SESSION['nutzer']['filtersettings']['branchen'])?true:false;
				
				$laender[]=$GLOBALS['db']->antwort_reihe;
				}while($GLOBALS['db']->neueReihe());	
				}
				$result['status']="success";
				$result['data']=$laender;
			}
		break;
		/* !sendMessage */
		case "sendMessage":
			if(isLoggedIn()){
				if(isset($data->betreff,$data->nachricht)){
					//versende die Mail
				$empfaenger  = "Iris.Merkel@stein-verlaggmbh.de";
				// Betreff
				$betreff = "Feedback zur Standortkarten Applikation: ".$data->betreff;
				// Nachricht
				$nachricht = "
				<html>
				<head>
					<title>".$betreff."</title>
				</head>
				<body>".$data->nachricht."</body></html>";
				
// für HTML-E-Mails muss der 'Content-type'-Header gesetzt werden
$header  = 'MIME-Version: 1.0' . "\r\n";
$header .= 'Content-type: text/html; charset=utf-8' . "\r\n";

// zusätzliche Header
$header .= "To: Standortkarten Administrator <".$empfaenger.">" . "\r\n";
$header .= "From: Standortkarten Nutzer <".$_SESSION['nutzer']['email'].">". "\r\n";

// verschicke die E-Mail
mail($empfaenger, $betreff, $nachricht, $header);
				$result['status']="success";
				}
				else $result['status']="error";
								
			}
		break;
		/* !getBundeslaender: @TODO ABFRAGE ob erlaubt */
		case "getBundeslaender":
			if(isLoggedIn()){
				$GLOBALS['db']->neueAnfrage("SELECT * FROM _sk_bundesland WHERE id<13 AND _sk_bundesland.id IN (SELECT DISTINCT bundesland FROM _sk_nutzer_bundesland_branche WHERE nutzerid=".$_SESSION['nutzer']['id'].")");
				
				//$GLOBALS['db']->neueAnfrage("SELECT * FROM _sk_bundesland WHERE id<13");
				$laender=array();
				if($GLOBALS['db']->antwort_anzahl>0){
				do{
				$GLOBALS['db']->antwort_reihe['beschreibung']=utf8_encode($GLOBALS['db']->antwort_reihe['beschreibung']);
					$GLOBALS['db']->antwort_reihe['selected']=in_array($GLOBALS['db']->antwort_reihe['id'], $_SESSION['nutzer']['filtersettings']['laender'])?true:false;
				
					
					$laender[]=$GLOBALS['db']->antwort_reihe;
				}while($GLOBALS['db']->neueReihe());	
				}
				$result['status']="success";
				$result['data']=$laender;
			}
		break;
		/* !updateLocation */
		case "updateLocation":
			if(isset($data->location)&&isLoggedIn()){
					
					$acc=$data->location->accuracy;
					$lon=$data->location->longitude;
					$lat=$data->location->latitude;
					
					$anfrage="UPDATE _sk_nutzer SET last_lon=".$lon.",last_lat=".$lat.",last_accuracy=".$acc." WHERE id=".$_SESSION['nutzer']['id'];
					$GLOBALS['db']->neueAnfrage($anfrage);
					
					$_SESSION['nutzer']['location']['accuracy']=$acc;
					$_SESSION['nutzer']['location']['longitude']=$lon;
					$_SESSION['nutzer']['location']['latitude']=$lat;
			
					$result['status']="success";
					$result['message']="Ihr Standort wurde gespeichert!";
			}
		break;
		
		/* !get Infos: @TODO: Abfragen, ob Infos verfügbar, bzw. Paket gekauft */
		case "getInfos":
			if(isset($data->ident)&&isLoggedIn()){
				$data->ident=(int)$data->ident;
				$anfrage="SELECT * FROM _sk_standorte".$_SESSION['testversion_suffix']." WHERE id=".$data->ident;
				$GLOBALS['db']->neueAnfrage($anfrage);
				if($GLOBALS['db']->antwort_anzahl>0){
				/**
				TODO ACHTUNG
				Remove beim nächsten mal
				***/
					//if($GLOBALS['db']->antwort_reihe['id']>5551){
						foreach($GLOBALS['db']->antwort_reihe as &$value){
							$value=utf8_encode($value);
                
						}
						
					//}
					
					$result['status']="success";
					$result['data']=$GLOBALS['db']->antwort_reihe;
				}
			}
			else{
				$result['status']="error";
			}
		break;
		
		case "getInitialData":
			$result['status']="success";
		break;
		/* !login */
		case "login":
			$result=login($data);
		break;
		case "checkLogin":
			if(isLoggedIn()){
				$result=$_SESSION['nutzer'];
			}
			else{
				$result['status']="error";
				$result['version']=VERSION;
			}
		break;
		/* !Logout */
		case "logout":
			unset($_SESSION['nutzer']);
			echo base64_encode("{\"status\":\"error\"}");

		break;
		/* !getPinsByUmkreis: @TODO: prüfen, ob die Daten abgefragt werden können */
		case "getPinsByUmkreis":
			if(isset($data->radius)){
				$lat=(float)$data->location->latitude;
				$lon=(float)$data->location->longitude;
			
				$entfernung=(int)$data->radius/1000;
			
			$anfrage="SELECT id,Name1,Name2,Name3,lat,lng,bundesland,branche, ( 6371 * acos( cos( radians(".$lat.") ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(".$lon.") ) + sin( radians(".$lat.") ) * sin( radians( lat ) ) ) ) AS distance FROM _sk_standorte".$_SESSION['testversion_suffix']." HAVING (distance <=".$entfernung.") AND (".filternachBranchen().") ORDER BY distance;";
			
			$GLOBALS['db']->neueAnfrage($anfrage);
					
					if($GLOBALS['db']->antwort_anzahl>0){
						do{
							$result['data'][]=$GLOBALS['db']->antwort_reihe;
						}while($GLOBALS['db']->neueReihe());}
						$result['status']="success";
		}else{
			$result['status']="error";
			$result['version']=VERSION;
		}
		break;
		/* !getPinsBySearch: @TODO:prüfen, ob die Daten abgefragt werden können */
		case "getPinsBySearch":
			if(isLoggedIn()&&isset($data->suche)){
					//1. die Query aufspalten in einzelne Worte
					$query=explode(" ",$data->suche);
					$reihen=array();
					$kriterium=array();
					
					$reihen[]="Vorname";
					$reihen[]="Name1";
					$reihen[]="Name2";
					$reihen[]="Name3";
					$reihen[]="Strasse";
					$reihen[]="PLZStrasse";
					$reihen[]="Ort";
					$reihen[]="Telefon";
					$reihen[]="Telefax";
					$reihen[]="Email";
					
					foreach ($query as $qstring) {
					$suchbegriffe=array();
					foreach($reihen as $spalte){
						$suchbegriffe[]="(".mysql_real_escape_string($spalte)." LIKE '%".mysql_real_escape_string($qstring)."%'".")";
					}
					$kriterium[]=implode("OR",$suchbegriffe);
					}
					
					$anfrage="SELECT id,Name1,Name2,Name3,lat,lng,branche FROM _sk_standorte".$_SESSION['testversion_suffix']." WHERE (".filternachBranchen().") AND (".implode("OR",$kriterium). ") ORDER by lat DESC";
					$GLOBALS['db']->neueAnfrage($anfrage);
					
					if($GLOBALS['db']->antwort_anzahl>0){
						do{
							$GLOBALS['db']->antwort_reihe['Name1']=$GLOBALS['db']->antwort_reihe['Name1'];	
							$GLOBALS['db']->antwort_reihe['Name2']=$GLOBALS['db']->antwort_reihe['Name2'];	
							$GLOBALS['db']->antwort_reihe['Name3']=$GLOBALS['db']->antwort_reihe['Name3'];
							$result['data'][]=$GLOBALS['db']->antwort_reihe;
						}while($GLOBALS['db']->neueReihe());
					$result['status']="success";
				}
				else{
					$result['status']="success";
					$result['data']=array();
				}
			}
			else $result['status']="error";
		break;
		
		
		/* !getPins */
		/*liefert die Pins nach Bundesland oder Branche*/
		case "getPins":
			if(isLoggedIn()&&isset($data->bundesland,$data->branche)){				
				//Bundesland und Branche vermischen
				$laender=explode(",",$data->bundesland);
				$branchen=explode(",",$data->branche);
				
				//Natursteinfix
				if(in_array(4,$branchen)){
					if(in_array(6,$laender)||in_array(11,$laender)){
					$laender[]=13;
					}
					if(in_array(9,$laender)||in_array(3,$laender)||in_array(5,$laender)){
					$laender[]=14;
					}
				}
				
				//die neue Filterung abspeichern
				$filtersettings=array();
				$filtersettings['laender']=$laender;
				$filtersettings['branchen']=$branchen;
				
				$_SESSION['nutzer']['filtersettings']=$filtersettings;
				
				$anfrage="UPDATE _sk_nutzer SET last_filter='".serialize($filtersettings)."' WHERE id=".$_SESSION['nutzer']['id'];
				$GLOBALS['db']->neueAnfrage($anfrage);				
				$anfrage="SELECT id,Name1,Name2,Name3,lat,lng,branche FROM _sk_standorte".$_SESSION['testversion_suffix']." WHERE ".filternachBranchen()." ORDER by lat DESC";
				$GLOBALS['db']->neueAnfrage($anfrage);
				
				
				if($GLOBALS['db']->antwort_anzahl>0){
				
					do{
					/*
          if($GLOBALS['db']->antwort_reihe['id']>5551){
					/**
					ACHTUNG 
					TODO:
					beim nächsten mal muss das hier weg!!
					**/
						$GLOBALS['db']->antwort_reihe['Name1']=utf8_encode($GLOBALS['db']->antwort_reihe['Name1']);	
						$GLOBALS['db']->antwort_reihe['Name2']=utf8_encode($GLOBALS['db']->antwort_reihe['Name2']);	
						$GLOBALS['db']->antwort_reihe['Name3']=utf8_encode($GLOBALS['db']->antwort_reihe['Name3']);	
					/*}
           */
						$result['data'][]=$GLOBALS['db']->antwort_reihe;	
					
					}while($GLOBALS['db']->neueReihe());
					$result['status']="success";
				}
				
			}
			else{
				$result['status']="error";
				$result['version']=VERSION;
			}
		break;
	}
	echo base64_encode(json_encode($result));
}
else{
	header("HTTP/1.0 404 Not Found");
}

/**
Filter für die ausgewählten Branchen und Bundesländer

@version 1.0
@date 30.04.2014
@version 1.0

@return MySQL kondition für die Einschränkung nach Branchen und Bundesländern
**/
function filternachBranchen(){
	$kondition="";
	$kriterium=array();
	if(count($_SESSION['nutzer']['filtersettings']['laender'])==0){
		$kondition="branche IN (".mysql_real_escape_string(implode(",",$_SESSION['nutzer']['filtersettings']['branchen'])).")";
	}
	else if(count($_SESSION['nutzer']['filtersettings']['branchen'])==0){
		$kondition="bundesland IN (".mysql_real_escape_string(implode(",",$_SESSION['nutzer']['filtersettings']['laender'])).")";
	}
	else{
		foreach($_SESSION['nutzer']['filtersettings']['laender'] as $land){
			$landeskriterium=array();
					if(is_numeric($land)){
					foreach($_SESSION['nutzer']['filtersettings']['branchen'] as $branche){
						if(is_numeric($branche)){
						$landeskriterium[]="(bundesland=".$land." AND branche=".$branche.")";
						}
		}
		$kriterium[]=implode("OR",$landeskriterium);
	}
	}
	$kondition=implode("OR",$kriterium);
	}	
	
	return $kondition;
}

/**prüft ob der Nutzer bereits eingeloggt ist
@version 1.0
@date 25.09.2012
@version 1.0
@return Boolean isLoggedIn
**/
function isLoggedIn(){
	if(isset($_SESSION['nutzer'])){
		return true;
	}
	return false;
}


/**
login. prüft Nutzerdaten und liefert ggf.den Namen des Nutzers zurück, setzt alle Session variablen etc.
@version 1.0
@date 10.04.2014
@author Merlin Becker
@param $logindata Nutzername und Kennwort
@return $nutzerdaten
***/
function login($logindata){
	$anfrage="SELECT * FROM _sk_nutzer WHERE email='".mysql_real_escape_string($logindata->username)."'";//."' AND passwort='".mysql_real_escape_string($logindata->passwort)."'";
	$GLOBALS['db']->neueAnfrage($anfrage);
	
	echo $GLOBALS['db']->fehlermeldung;
	if($GLOBALS['db']->antwort_anzahl>0){
		/**
		auf die Testversion abprüfen und ggf. ein Flag setzen
		**/

    if(!password_verify($logindata->passwort, $GLOBALS['db']->antwort_reihe['passwort'])){
     $result=array();
  		$result['status']="error";
  		$result['details']="username_wrong";
  		$result['version']=VERSION;
  		return $result;
    }
	
		$result=$GLOBALS['db']->antwort_reihe;
		
		$result['passwort']="";
		$result['status']="success";
		$result['version']=VERSION;
		
		
		$result['filtersettings']=unserialize($result['last_filter']);
		if(!is_array($result['filtersettings']['laender']))$result['filtersettings']['laender']=array();
		if(!is_array($result['filtersettings']['branchen']))$result['filtersettings']['branchen']=array();

		$result['location']['accuracy']=$result['last_accuracy'];
		$result['location']['longitude']=$result['last_lon'];
		$result['location']['latitude']=$result['last_lat'];
		
		$_SESSION['nutzer']=$result;
		
		if($logindata->username=="test@test.de"){
			$_SESSION['testversion_suffix']="_demo";
			$_SESSION['nutzer']['testversion']="Testversion";
			$result['testversion']="Testversion";
		}
			else{ 
			
			/**
			UPDATE 08.09.2015: Alle Nutzer nach dem 07.08 bekommen die Datenbank version 2
			
			**/
			if($result['time']>1438905600){
				$_SESSION['testversion_suffix']="_v2";
				$_SESSION['nutzer']['testversion']="Normalversion";
			$result['testversion']="Normalversion";	
			}
			else{
			$_SESSION['testversion_suffix']="";
			$_SESSION['nutzer']['testversion']="Normalversion";
			$result['testversion']="Normalversion";
			}
		}
		//setze noch das last login timestamp
		$anfrage="UPDATE _sk_nutzer set last_login=".time()." WHERE id=".$result['id'];
		$GLOBALS['db']->neueAnfrage($anfrage);
		
		return $result;
	}
	else{
		$result=array();
		$result['status']="error";
		$result['details']="username_wrong";
		$result['version']=VERSION;
		return $result;
	}
}
?>