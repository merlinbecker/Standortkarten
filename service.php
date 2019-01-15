<?php
/**
Der Webservice Standortkarten
@author Merlin Becker
@date 10.04.2014
@version 2.0
@since 0.2
@update 03.06.2018
@update 09.01.2019: Aenderung der Datenbankstruktur
@todo: Filtersettings wieder einf�hren und ggf. Anfragen speichern
**/
require_once("vendor/autoload.php");
error_reporting(1);
session_start();
define("VERSION","2.1.1");
require_once("dbconfig.php");

$db=\ParagonIE\EasyDB\Factory::create(
	'mysql:host='.$host.';dbname='.$datenbank,
	$nutzer,
	$passwort);

//f�r die Anfrage von Infos
echo "hallo3";
if(isset($_POST['d'])){
	$result=array();
	echo "hallo1";
	$data=json_decode(base64_decode($_POST['d']));
	echo "hallo2";
	switch($data->command){
		/* !getBranchen: @TODO ABFRAGE ob erlaubt */
		case "getBranchen":
			if(isLoggedIn()){
				$branchen=$db->run("SELECT * FROM _sk_branche WHERE _sk_branche.id IN (SELECT  DISTINCT branche FROM _sk_nutzer_bundesland_branche WHERE nutzerid=?)",
					$_SESSION['nutzer']['id']);				
				$output=array();
				foreach ($branchen as $branche){
					$branche['beschreibung']=utf8_encode($branche['beschreibung']);
					$branche['selected']=in_array($branche['id'], $_SESSION['nutzer']['filtersettings']['branchen'])?true:false;
					$output[]=$branche;
				}
				$result['status']="success";
				$result['data']=$output;
			}
		break;
		/* !getBundeslaender: @TODO ABFRAGE ob erlaubt */
		case "getBundeslaender":
			if(isLoggedIn()){
				$laender=$db->run("SELECT * FROM _sk_bundesland WHERE id<13 AND _sk_bundesland.id IN (SELECT DISTINCT bundesland FROM _sk_nutzer_bundesland_branche WHERE nutzerid=?)",
					$_SESSION['nutzer']['id']
				);
				$output=array();
				foreach($laender as $land){
					$land['beschreibung']=utf8_encode($land['beschreibung']);
					$land['selected']=in_array($land['id'], $_SESSION['nutzer']['filtersettings']['laender'])?true:false;
					$g=$l="";
					switch($land['id']){
						case 1:
							$g="BW";
							$l="lk-bw";
						break;
						case 2:
							$g="BY";
							$l="lk_by";
						break;
						case 3:
							$g="Brandenburg-Berlin";
							$l="lk_brandenburg-berlin";
						break;
						case 4:
							$g="Hessen";
							$l="lk_hessen";
						break;
						case 5:
							$g="Meck-Vorpommern";
							$l="lk_meck-vorpommern";
						break;
						case 6:
							$g="Niedersachsen-Bremen";
							$l="lk_niedersachsen-bremen";
						break;
						case 7:
							$g="Nordrhein-Westfalen";
							$l="lk_Nordrhein-Westfalen";
						break;
						case 8:
							$g="Rheinland-Pfalz";
							$l="lk_Rheinland-Pfalz";
						break;
						case 9:
							$g="Sachsen-Anhalt";
							$l="lk_Sachsen-Anhalt";
						break;
						case 10:
							$g="Sachsen";
							$l="lk_Sachsen";
						break;
						case 11:
							$g="Schleswig-Holstein-Hamburg";
							$l="lk_Schleswig-Holstein-Hamburg";
						break;
						case 12:
							$g="Thueringen";
							$l="lk_thueringen";
						break;
							
					}
					$grenzen="data/bundeslaender/".$g.".geojson";
					$lk="data/landkreise/".$l.".geojson";
					$land['grenzen']=json_decode(file_get_contents($grenzen));
					$land['landkreise']=json_decode(file_get_contents($lk));
					$output[]=$land;
				}	
				$result['status']="success";
				$result['data']=$output;
			}
		break;
		/* !get Infos: @TODO: Abfragen, ob Infos verfügbar, bzw. Paket gekauft */
		case "getInfos":
			if(isset($data->ident)&&isLoggedIn()){
				$data->ident=(int)$data->ident;
				$standort=$db->row("SELECT * FROM _sk_standorte".$_SESSION['testversion_suffix']." WHERE id=?",$data->ident);
				/**
				TODO ACHTUNG
				Remove beim nächsten mal
				***/
				foreach($standort as &$value){
					$value=utf8_encode($value);
                
				}
				$result['status']="success";
				$result['data']=$standort;
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
			$result=login($data,$db);
		break;
		case "checkLogin":
			echo "hallo!!";
			if(isLoggedIn()){
				$result=$_SESSION['nutzer'];
			}
			else{
				$result['status']="error";
				$result['version']=VERSION;
				print_r($result);
			}
		break;
		/* !Logout */
		case "logout":
			unset($_SESSION['nutzer']);
			output_error();

		break;
		/* !getPins */
		/*liefert die Pins nach Bundesland oder Branche*/
		case "getPins":
			if(isLoggedIn()&&isset($data->bundesland,$data->branche)){				
				//Bundesland und Branche vermischen
				$laender=explode(",",$data->bundesland);
				
				//mysql injection test
				foreach($laender as $land){
					if(!is_numeric($land))output_error();
				}
				$branchen=explode(",",$data->branche);

				foreach($branchen as $branche){
					if(!is_numeric($branche))output_error();
				}

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
				
				
				$anfrage="SELECT * FROM _sk_standorte".$_SESSION['testversion_suffix']." WHERE ".filternachBranchen()." ORDER by lat DESC";
				$pins=$db->run($anfrage);
				
				$result['data']['type']="FeatureCollection";
				$result['data']['features']=array();
				
				foreach($pins as $pin){
					/**
					ACHTUNG 
					TODO:
					beim nächsten mal muss das hier weg!!
					**/
					$temp['type']="Feature";
					$temp['id']=$pin['id'];
					
					$pin['type']="Feature";
					$temp['properties']=$pin;
					
					$geom['type']="Point";
					$geom['coordinates']=array();
					$geom['coordinates'][]=$pin['lng'];
					$geom['coordinates'][]=$pin['lat'];
					
					$temp['geometry']=$geom;
					
					$result['data']['features'][]=$temp;
				}

				$result['status']="success";
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

//echo an error
function output_error(){
	$result=array();
	$result['status']="error";
	$result['version']=VERSION;
	die(base64_encode(json_encode($result)));
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
		$kondition="branche IN (".implode(",",$_SESSION['nutzer']['filtersettings']['branchen']).")";
	}
	else if(count($_SESSION['nutzer']['filtersettings']['branchen'])==0){
		$kondition="bundesland IN (".implode(",",$_SESSION['nutzer']['filtersettings']['laender']).")";
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
function login($logindata,$db){
	$nutzer=$db->row("SELECT * FROM _sk_nutzer WHERE email=?",$logindata->username);	
	
	if(!isset($nutzer['passwort']))output_error();	
	
	if(!password_verify($logindata->passwort, $nutzer['passwort'])){
     		$result=array();
  		$result['status']="error";
  		$result['details']="username_wrong";
  		$result['version']=VERSION;
  		return $result;
    	}
	
	$result=$nutzer;
		
	$result['passwort']="";
	$result['status']="success";
	$result['version']=VERSION;
	
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
	return $result;
}
?>
