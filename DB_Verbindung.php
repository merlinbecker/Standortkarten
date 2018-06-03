<?php
/**
Verbindung zu einer SQL Datenbank, auf der beliebige Anfragen ausgeführt werden.
Funktionen zur Verbindung mit einer SQL Datenbank und dem Ausführen von Anfragen

@author Merlin Becker
@version 1.0
		
letzte Änderung am 01.02.2010: Abfrage der letzten eingefügten ID
*/
class DB_Verbindung
{
   /** Kennung der Ressource ID **/
   var $kennung;			
   /** Anzahl der Antworten, die die DB ausgibt **/
   var $antwort_anzahl;		
   /** aktuelle Reihe der Antwort, als assozitives Array **/
   var $antwort_reihe;
   /** Nummer der aktuellen Reihe **/
   var $aktuelle_reihe;
   /** die Fehlermeldung, sollte eine Verbindung oder Anfrage misslingen **/		
   var $fehlermeldung;      
   /** Ressource zum DBLink**/
   var $dblink;
   
   /**
   Konstruktor.
   lädt die Konfiguration der Datenbank und erstellt eine Datenbankverbindung
  
   @param $anfrage SQL-formulierte Anfrage
   @param $pfad Pfad zur Konfigurationsdatei
   
   @return returnparam
   @author Merlin Becker
   @version 1.0
   		
   letzte Änderung am 02.11.2011
   **/
   function DB_Verbindung($anfrage,$pfad=CMS_KLASSEN)
   {
   $konfiguration="dbconfig.php";
   $bedingung=$this->verbinden($konfiguration);
   $this->neueAnfrage($anfrage);
   
   if (!$bedingung){}
   }
 	
   /**
   Stellt eine Verbindung zur Datenbank her.
   
   @param $filename Konfigurationsdatei
   
   @return boolean $success
   @author Merlin Becker
   @version 1.0
   		
   letzte Änderung am 02.11.2011
   **/
   function verbinden($filename){ 
	include($filename);
	
	$this->dblink = mysql_connect($host, $nutzer, $passwort);
	if (!$this->dblink) {
	$this->fehlermeldung.="Eine Verbindung zur Datenbank konnte nicht hergestellt werden!";
	echo $this->fehlermeldung;
	return false;}
   	else{
		$db_selected = mysql_select_db($datenbank, $this->dblink);
		if (!$db_selected) {
		$this->fehlermeldung.="Die Datenbank wurde nicht gefunden!";
		echo $this->fehlermeldung;
		 return false;}
		else{return true;}
		}
   }
   
   
   /**
   Stellt eine neue Anfrage an die Datenbank.
   
   @param $anfrage SQL-formulierte Anfrage
   
   @return boolean $success
   
   @author Merlin Becker
   @version 1.0
   		
   letzte Änderung am 02.11.2011
   **/
   function neueAnfrage($anfrage)
   { 
   $this->antwort_anzahl=0;
   $this->kennung=mysql_query($anfrage);
   if (!$this->kennung) { 
   	$this->fehlermeldung.="Fehlerhafte Anfrage an die Datenbank: $anfrage \n\n".mysql_error();
	return false;
	}
 	else{
	if (ucfirst(substr($anfrage,0,1)=='S')){
	$this->aktuelle_reihe=0;
	$this->antwort_anzahl=mysql_num_rows($this->kennung); //Anzahl der Reihen ausgeben
	$this->neueReihe(); //gibt die nächste Reihe aus
	}
	}
   }
   
   /**
   Holt eine neue Reihe einer gültigen Antwort.
   setzt die Membervariable $aktuelle_reihe
   
   @return boolean $success
   
   @author Merlin Becker
   @version 1.0
   		
   letzte Änderung am 02.11.2011
   **/
   function neueReihe()
   {
   $this->aktuelle_reihe++;
   if($this->aktuelle_reihe<$this->antwort_anzahl+1){
   $this->antwort_reihe=mysql_fetch_assoc($this->kennung);
   return true;
   }
   else return false;
   }
   
   /**
   liefert die zuletzt eingefügte ID.
   
   @return int $lastID
   
   @author Merlin Becker
   @version 1.0
   		
   letzte Änderung am 02.11.2011
   **/
   function	letzteId()
   {
   return mysql_insert_id($this->dblink);
   }
   
   /**
   trennt die Datebankverbindung.
   
   @return $success
   
   @author Merlin Becker
   @version 1.0
   		
   letzte Änderung am 02.11.2011
   **/
   function trennen()
   {
   mysql_close($this->dblink);
   return true;}

 }
?>