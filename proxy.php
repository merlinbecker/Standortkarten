<?php 
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
 

 session_start();
  if(!isLoggedIn()){
	  header("HTTP/1.0 404 Not Found");
	  die();
  }

  echo file_get_contents("http://api.geonames.org/postalCodeSearchJSON?".$_SERVER['QUERY_STRING']);