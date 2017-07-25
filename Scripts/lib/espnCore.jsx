#include 'json2.js'

espnCore = {
    'date': "7/17/2017",
    'schema_versions': [1.0, 1.1]
};

/** Production master list */
GLOBAL_PRODUCTIONS = "Y:\\Workspace\\SCRIPTS\\.ESPNTools\\json\\productions.json";
/**
 * Constants for improved legibility of scene status / validation reports.
 */
STATUS = new Object();
STATUS.UNDEFINED         = 0; // no tag data found / miscellaneous bad news
STATUS.SYNCED_SAVED      = 1; // tag data synced to virtual object, scene has been saved
STATUS.SYNCED_READY      = 2; // tag data synced to virtual object, scene is ready to be saved
STATUS.SYNCED_NODEST     = 3; // tag data synced to virtual object, but the destination isn't writable / doesn't exist
STATUS.MISMATCH_INTERNAL = 4; // tag data desynced from virtual object
STATUS.MISMATCH_EXTERNAL = 5; // tag data desynced from platform file handling
STATUS.MISMATCH_VIRTUAL  = 6; // virtual object desynced from tag/platform file handling
STATUS.NOPLATFORM        =-1; // the validation function has not been properly extended to this endpoint

// TODO
// - Recursive version incrementer
// - Error handling (probably an Error Logging object of some kind?)
// - Documentation
// - Pre/post validation to ensure safe saving & backups

/*************************************************************************************************
 * DATABASE VIRTUAL OBJECTS
 * These objects assist in conveniently accessing data from static JSON databases
 ************************************************************************************************/
/**
 * ProductionData is an object to load and validate essential information about a Production.
 * Because
 * @constructor
 */
function ProductionData ( id ) {
    this.loadFolderData = function () {
        var folderDb = getJson(this.dbroot + "\\folders.json");
        this.folders = folderDb['lookup'];
    };
    this.loadTeamData = function () {
        var teamDb = getJson(this.dbroot + "\\teams.json");
        var teamList = new Array();
        for (t in teamDb){
            if ((t == "NULL") || (t == "ESPN_META")) continue;
            teamList.push(t);
        }
        this.teams = teamDb;
        this.teamlist = teamList;
    };
    this.loadPlatformData = function ( platform_id ) {
        var platDb = getJson(this.dbroot + "\\{0}.json".format(platform_id));
        this[platform_id] = platDb;
    };
    var prod_db = getJson (GLOBAL_PRODUCTIONS)[id];
    if (prod_db === undefined){
        //TODO -- ERROR -- PROD NOT FOUND IN DB
        return undefined;
    }
    this.name      = id;
    this.is_live   = prod_db['live'];
    this.dbversion = prod_db['vers'];
    this.root      = prod_db['root'];
    this.dbroot    = prod_db['json'];    
    this.pubroot   = prod_db['pub'];

    //if (this.is_live){
    //    this.loadFolderData();
        //this.loadTeamData();
        //this.loadPlatformData() is handled at the scene level
    //}
    //return this;
}

/**
 * TeamData is an object with built-in functions to load & validate team data from JSON
 * @constructor
 * @param {string} id - A team's JSON key. Varies by production -- typically tricode.
 */
function TeamData ( prodData, id ) {
    
    this.id        = '';
    this.name      = '';
    this.dispName  = '';
    this.nickname  = '';
    this.location  = '';
    this.tricode   = '';
    this.conference= '';
    this.imsName   = '';   
    this.primary   = this.pri = "0x000000";
    this.secondary = this.sec = "0x000000";
    this.tier      = 0;     
    
    this.loadTeam = function ( id ) {
        var teamDb      = getJson(this.prod['dbroot'] + '\\teams.json');
        this.id         = id;
        this.name       = id;
        this.dispName   = teamDb[id]['DISPLAY NAME'];
        this.nickname   = teamDb[id]['NICKNAME'];
        this.location   = teamDb[id]['LOCATION'];
        this.tricode    = teamDb[id]['TRI'];
        this.conference = teamDb[id]['CONFERENCE'];
        this.imsName    = teamDb[id]['IMS'];
        this.primary    = "0x{0}".format(teamDb[id]['PRIMARY']);
        this.secondary  = "0x{0}".format(teamDb[id]['SECONDARY']);
        this.tier       = teamDb[id]['TIER'];
    }
    if (id !== undefined && prodData instanceof ProductionData){
        this.prod = prodData;
        // TODO -- ERROR HANDLING OF MISSING TEAM / BAD ID
        this.loadTeam( id );
        return this;
    }
}

/*************************************************************************************************
 * PLATFORM INTEGRATION VIRTUAL OBJECTS
 * These are objects which assist in mapping database values and ops into destination platforms.
 * In many cases, these objects are meant to be extended by endpoint scripts and plugins.
 ************************************************************************************************/
illegalCharacters = /[.,`~!@#$%^&*()=+\[\]\s]/;
/**
 * A SceneData object stores filesystem and production metadata for an Adobe CC project file. It
 * primarily assists in validating status, synchronizing the active scene to the UI, and ensuring 
 * safe file handling, but could be extended in the future to integrate with other frameworks.
 * @constructor
 * @param {ProductionData} prodData - A ProductionData object with a valid (or null) production
 * @param {string} plat_id - The id of the platform to which the scene belongs
 */
function SceneData ( prodData, plat_id ) {
    // Production global variables 
    if (prodData instanceof ProductionData){
        this.prod = prodData;
    } else {
        // TODO -- ERROR MESSAGE -- SCENEDATA MUST INCLUE VALID PRODDATA OBJECT
        return this;
    }
    this.prod.loadPlatformData(plat_id);
    this.platform = plat_id;

    // Naming attributes
    // The project the scene belongs to
    this.project = "";
    // The description / specific name of the scene
    this.name = "";
    // The full name of the scene (project + name)
    this.fullName = "";
    // Current version of the scene
    this.version = 0;
    // Custom data attributes
    this.customA = "";
    this.customB = "";
    this.customC = "";
    this.customD = "";

    // Naming inclusion flags
    this.use_version = false;
    this.use_team0id = false;
    this.use_team1id = false;
    this.use_showid = false;
    this.use_sponsorid = false;
    this.use_customA = false;
    this.use_customB = false;
    this.use_customC = false;
    this.use_customD = false;
    
    // Versioning/production-context attributes
    // Current team(s)
    this.teams = new Array();
    // Current show id
    this.show = "";
    // Current sponsor id
    this.sponsor = "";

    // Setters for production context attributes
    this.setTeam = function ( loc, teamid ) {
        var team = new TeamData( this.prod, teamid );
        if (team !== undefined) this.teams[loc] = team;
    };
    this.setShow = function ( showid ) {
        if (showid !== undefined) this.show = showid;
    };
    this.setSponsor = function ( sponsorid ) {
        if (sponsorid !== undefined) this.show = sponsorid;
    };
    // Setters for scene name attributes
    this.setProject = function ( project_name ) {
        if ((!project_name) || (illegalCharacters.test(project_name))){
            // TODO - ERROR - INVALID NAME
        } else { 
            this.project = project_name;
            this.fullName = this.project + '_' + this.name;
        }
    };
    this.setName = function ( name ) {
        if ((!name) || (illegalCharacters.test(name))){
            // TODO - ERROR - INVALID NAME
        } else { 
            this.name = name; 
            this.fullName = this.project + '_' + this.name;
        }
    };
    this.setVersion = function () {
        //function incr(){
        //    var 
        //}
        this.version += 1;
    };
    this.setCustom = function ( id, custom_data ) {};
    
    this.setFromKeys = function ( data ) {
        this.setTeam(0, data['team0']);
        this.setTeam(1, data['team1']);
        this.setProject(data['project']);
        this.setName(data['name']);
        this.setVersion(data['version']);
        this.setShow(data['show']);
        this.setSponsor(data['sponsor']);
        this.setCustom('A', data['A']);
        this.setCustom('B', data['B']);
        this.setCustom('C', data['C']);
        this.setCustom('D', data['D']);
    }
    
    
    // Gets the full directory path for this scene (excluding file name)
    this.getPaths = function () {
        return ([this.prod.root + this.prod.folders['ae_project'].format(this.project),
                 this.prod.root + this.prod.folders['ae_backup'].format(this.project)])
    };
    
    // Gets the current name of this scene (optional: with inclusions)
    this.getName = function ( vers, ext ) {
        // The root of every scene name is the project it belongs to
        var fileName = this.project;
        // Parse optional tag and add it to the name 
        if (this.name !== "")
            fileName = "{0}_{1}".format(fileName, this.name);
        // Parse additional optional file name inclusions
        var vtag = "";
        var inclusions = "";
        var namingOrder = [
            [this.use_team0id, this.teams[0]],
            [this.use_team1id, this.teams[1]],
            [this.use_showid, this.show],
            [this.use_sponsorid, this.sponsor],
            [this.use_customA, this.customA],
            [this.use_customB, this.customB],
            [this.use_customC, this.customC],
            [this.use_customD, this.customD]
        ];
        for (i in namingOrder){
            if (namingOrder[i][0] === true)
                inclusions += "_{0}".format(namingOrder[i][1]);        
        }
        (vers === undefined) ? vtag = "" : vtag = ".{0}".format(zeroFill(this.version, 4));
        (ext === undefined) ? ext = "aep" : ext;
        
        return ("{0}{1}{2}.{3}".format(fileName, inclusions, vtag, ext));
    };
    
    // Generates a single string with the attributes of this scene object
    this.getTag = function () {
        var tag = "prod:{0},project:{1},scene:{2},version:{11},team0:{9},team1:{10},show:{3},sponsor:{4},A:{5},B:{6},C:{7},D:{8}";
        return ( tag.format(
            ((this.plat === "")    ? 'NULL' : this.platform),
            ((this.prod === "")    ? 'NULL' : this.prod.name),
            ((this.project === "") ? 'NULL' : this.project),
            ((this.name === "")    ? ''     : this.name),
            ((this.show === "")    ? 'NULL' : this.showid),
            ((this.sponsor === "") ? 'NULL' : this.sponsorid),
            ((this.customA === "") ? 'NULL' : this.customA),
            ((this.customB === "") ? 'NULL' : this.customB),
            ((this.customC === "") ? 'NULL' : this.customC),
            ((this.customD === "") ? 'NULL' : this.customD),
            ((this.teams[0] === undefined) ? 'NULL' : this.teams[0].name),
            ((this.teams[1] === undefined) ? 'NULL' : this.teams[1].name),
            this.version
        ));
    }
    
    /** This function ensures that the virtual object is correctly populated and does not
      * contain NULL data in any of its filesystem critical attributes.
      */
    this.prevalidate = function () {};
    
    /** This function is called when the script needs to check the state of synchronization
      * between the virtual object and the "actual" project file (both its tags and its 
      * save state.) Because it is highly platform-specific, this function must be extended
      * by the endpoint script or platform library.
      * @returns {integer}
      */
    this.postvalidate = function () {
        return STATUS.NOPLATFORM;
    };
}

/*************************************************************************************************
 * JSON HANDLING
 ************************************************************************************************/
/**
 * Parses a JSON file. Includes safe closing and error handling. Checks schema version against
 * script version to ensure failsafe in the event of non-backwards-compatibility.
 * @param {(string|File)} fileRef - A string or file object represnting the location of a JSON file
 * @returns {Object} A JSON object
 */
// TODO -- INCLUDE SAFE CLOSING
function getJson (fileRef) {
    fileRef = new File(fileRef);
    if (!fileRef.exists){
        // TODO -- ERROR -- COULD NOT FIND JSON FILE
        return undefined;
    }
	fileRef.open('r')
	var db = JSON.parse(fileRef.read());
    fileRef.close();
    if (db["ESPN_META"]["version"] >= espnCore['schema_versions'][0] && db["ESPN_META"]["version"] <= espnCore['schema_versions'][1]){
        // TODO - ERROR (?) -- HANDLE OLD VERSIONS OF DATABASE SCHEMA --
        // POSSIBLY JUST A CUSTOM ERROR TO OPEN A LEGACY VERSION OF ESPNTOOLS?f
    }
	return db;
}

/*************************************************************************************************
 * LIST-OF-GETTERS
 * These are shortcut functions to retrieve lists of major production elements (the productions
 * themselves, the projects in that production, teams, etc)
 ************************************************************************************************/
function isFolder (FileObj) {
    if (FileObj instanceof Folder) return true;
}

function getActiveProductions () {
    var prod_db = getJson (GLOBAL_PRODUCTIONS);
    var prodList = [];
    for (k in prod_db){
        if (prod_db[k] === "ESPN_META" || prod_db[k] === "TEMPLATE") continue;
        if (prod_db[k]["live"]) prodList.push(k);
    }
    return prodList.sort();
}

function getAllProjects( prod_id ) {
    var prodData = new ProductionData( prod_id );
    prodData.loadFolderData();
    // get the root animation directory of the production
    var projectFolder = new Folder(prodData['root'] + prodData.folders['animation']);
    // get all folders from that directory
    var subFolders = projectFolder.getFiles(isFolder);
    // return list
    var projList = [];
    for (i in subFolders){
        // isolate name of project folder
        var nameTokens = subFolders[i].fullName.split('/');
        // add it to the list
        projList.push(nameTokens[nameTokens.length-1]);
    }
    return projList.sort();
}

/*************************************************************************************************
 * TAGGING OPERATIONS
 * Project files are "tagged" with a single-line string containing relevant SceneData values.
 * These functions are used to help with inbound mapping of those tags. (Outbound operations are
 * handled by the SceneData.getTag() method and platform-specific functions at the endpoint.)
 ************************************************************************************************/
/**
 * Converts a one-line metadata tag to key-value pairs for easier parsing by validation
 * functions and other parsers.
 * @param {string} tag_string - A properly formatted one-line metadata tag
 * @returns {Object} Key/value pairs representing raw scene metadata (as strings)
 */
function tagToKeys ( tag_string ) {
    var tagArray = tag_string.split(',');
    var tagData = {};
    for (var i=0; i<tagArray.length; i++){
        var key = tagArray[i].split(':')[0];
        var value = tagArray[i].split(':')[1];
        tagData[key] = value;
    }
    return tagData;
}

/**
 * A helper function that constructs a scene object directly from tag data and performs
 * a postvalidation. It returns an array containing the result of the validation and a
 * valid scene object (or undefined)
 * @param {string} tag_string - A properly formatted one-line metadata tag
 * @returns {Array} [0] The postvalidation flag and [1] a valid scene object (or undefined)
 */
function tagToScene ( tag_string ) {
    var tagData = tagToKeys(tag_string);
    var scene = new Scene (tagData['prod'], tagData['plat']);
    scene.setFromKeys(tagData);
    // because this is a tagged scene, it is presumed to be present on the server
    // therefore, it should be post validated to ensure that the AEP and the Scene
    // object metadata are synchronized.
    var v = scene.postValidate();
    // return the postvalidation flag and the scene (or undefined if invalid)
    return [v, scene];
}

/*************************************************************************************************
 * MISCELLANEOUS STUFF
 ************************************************************************************************/
/**
  * Creates a timestamp for use in ESPN WIP renders and archiving.
  * @returns {string} A timestamp in the format "_<mmddyy>_<hhmmss>"
  */
function timestamp () {
    var t = Date();
    var d = t.split(' ');
    d = (d[1] + d[2]);
    t = t.split(' ')[4].split(':');
    t = (t[0] + t[1]);
    return ('_{0}_{1}'.format(d, t));
}

String.prototype.format = function() {
    // Adds a .format() method to the String prototype, similar to python
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function zeroFill( number, width ){
    width -= number.toString().length;
    if ( width > 0 ) {
        return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
    }
    var i = (number + "");
    return i; // always return a string
}
