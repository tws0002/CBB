#include 'json2.js'

GLOBAL_PRODUCTIONS = "V:\productions.json";

espnCore = {
    'version': 1.1,
    'date'   : "7/17/2017"
};

/*************************************************************************************************
 * JSON FUNCTIONS
 * These streamline JSON parsing functionality for the ESPN pipeline script architecture.
 ************************************************************************************************/
/**
 * Parses a JSON file. Includes safe closing and error handling.
 * @params {(string|File)} fileRef - A string or file path object represnting the location of a JSON file
 * @returns {Object} A JSON object
 */
function getJson (fileRef) {
    fileRef = new File(fileRef);
    if (!fileRef.exists){
        // TODO -- ERROR -- COULD NOT FIND JSON FILE
        return undefined;
    }
	fileRef.open('r')
	var db = JSON.parse(fileRef.read());
    fileRef.close();
    if (db["ESPN_META"]["version"] != version){
        // TODO - ERROR -- DATABASE VERSION MISMATCH
    }
	return db;
}

/**
 * Helper function that gets a local (relatively-pathed) JSON file (typically scriptRoot/json/*).
 * Because it refers to a relative location, his function *must be* overridden by scripts higher in 
 * the architecture.
 * @params {string} name - The name of a JSON file local to this scriptRoot
 * @returns {Object} a JSON object
 */
function getLocalJson (name) {
    var lclDir = new File( $.fileName ).parent.parent;
    var jsn = getJson(lclDir.fullName + '/json/{0}.json'.format(name));
    return jsn;
}

/*************************************************************************************************
 * DATABASE OBJECTS
 * These objects assist in conveniently accessing data from static JSON databases
 ************************************************************************************************/
/**
 * Team is an object with built-in functions to load & validate team data from JSON
 * @constructor
 * @params {string} id - A team's JSON key. Varies by production -- typically tricode.
 */
function Team ( id ) {
    this.init = function () {
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
    }
    
    this.get = function ( id ) {
        var teams = getLocalJson('teams');
        if (teams === undefined) return undefined;
        else if (teams[id] === undefined){
            //alert( errors['TEAM_ERR'] );
            id = 'NULL';
        }
        this.build( id, teams[id] );
    }
    
    this.build = function (name, object) {
        this.name       = name;
        this.dispName   = object['DISPLAY NAME'];
        this.nickname   = object['NICKNAME'];
        this.location   = object['LOCATION'];
        this.tricode    = object['TRI'];
        this.conference = object['CONFERENCE'];
        this.imsName    = object['IMS'];
        this.primary    = "0x{0}".format(object['PRIMARY']);
        this.secondary  = "0x{0}".format(object['SECONDARY']);
        this.tier       = object['TIER'];
    }
    
    this.init();
    if (id !== undefined){
        this.get( id );
        return this;
    }
}

/**
 * Production is an object with built-in functions to load & validate production data from JSON
 * @constructor
 */
function Production ( id ) {
    this.initMeta = function () {
        var prod_db = getJson (GLOBAL_PRODUCTIONS)[id];
        if (prod_db === undefined){
            //TODO -- ERROR -- PROD NOT FOUND IN DB
            return this;
        }
        this.name      = id;
        this.is_live   = obj['live'];
        this.dbversion = obj['vers'];
        this.prodroot  = obj['root'];
        this.dbroot    = obj['json'];    
        this.pubroot   = obj['pub'];
    };
    this.initFolders = function () {
        var folderDb = getJson(this.dbroot + "\\folders.json");
        this.folders = folderDb['lookup'];
    };
    this.initTeams = function () {
        var teamDb = getJson(this.dbroot + "\\teams.json");
        this.teams = teamDb;
        this.teamlist = getTeamList(teamDb);
    };
    this.initPlatform = function ( platform_id ) {
        var platDb = getJson(this.dbroot + "\\{0}.json".format(platform_id));
        this[platform_id] = platDb;
    };
    
    // Pull production from master json db
    this.initMeta();
    if (this.is_live){
        // TODO -- CHECK AGAINST DATABASE VERSIONS -- 
        // THIS SCRIPT MAY BE TOO NEW FOR SOME JSON STRUCTURES
        this.initFolders();
        this.initTeams();
    }
    
    return this;
}


/*************************************************************************************************
 * SCENE OBJECT
 ************************************************************************************************/
illegalCharacters = /[.,`~!@#$%^&*()=+\[\]\s]/;
/**
 * A scene object stores filesystem and production metadata for an AfterEffects project. It
 * primarily assists in validating backups, but could be extended in the future to integrate with
 * production tracking software and frameworks.
 * @constructor
 */
function Scene ( prod, plat ) {
    // Production global variables 
    this.production = prod;
    this.platform = plat;
    
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
        var team = Team(teamid);
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
        } else { this.project = project_name; }
    };
    
    this.setName = function ( name ) {
        if ((!name) || (illegalCharacters.test(name))){
            // TODO - ERROR - INVALID NAME
        } else { this.name = name; }
    };
    
    this.setVersion = function () {
        function incr(){
            var 
        }
        this.version += 1;
    };
    
    this.setCustomA = function ( custom_data ) {};
    this.setCustomB = function ( custom_data ) {};
    this.setCustomC = function ( custom_data ) {};
    this.setCustomD = function ( custom_data ) {};
    
    // Gets the full directory path for this scene (excluding file name)
    this.getPath = function () {
        return (new Folder(this.prod.prodtree["Root"] + this.prod.prodtree["Projects"]  + this.project))
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
        var tag = "prod:{0},project:{1},scene:{2},version:{11},team0:{3},team1:{4},show:{5},sponsor:{6},A:{7},B:{8},C:{9},D:{10}";
        return ( tag.format(
            ((this.production === "") ? 'NULL' : this.production),
            ((this.project === "") ? 'NULL' : this.project),
            ((this.scene === "") ? 'NULL' : this.scene),
            ((this.teams[0] === "") ? 'NULL' : this.teams[0]),
            ((this.teams[1] === "") ? 'NULL' : this.teams[1]),
            ((this.showid === "") ? 'NULL' : this.showid),
            ((this.sponsorid === "") ? 'NULL' : this.sponsorid),
            ((this.customA === "") ? 'NULL' : this.customA),
            ((this.customB === "") ? 'NULL' : this.customB),
            ((this.customC === "") ? 'NULL' : this.customC),
            ((this.customD === "") ? 'NULL' : this.customD),
            this.version
        ));
    }
    
    /** Validates all preflight attributes of this scene:
     *  - that destination folders exist and are writable
     *  - existing files
     *  - that all required attributes are filled with valid objects (possibly null)
     */
    this.prevalidate = function () {};
    /** Validates all post attributes of this scene:
     *  - that the scene exists on the server with a backup matching the current version
     *  - that all required attributes are filled with valid non-null data
     */
    this.postvalidate = function () {};
    
    /* TODO - MOVE TO CBBTOOLS
    // Pushes the scene data from this object into the AfterEffects scene tags
    this.setTag = function () {};
    //Pulls the scene data from the AfterEffects scene tag into this scene object
    this.getTag = function () {};

    // Checks for synchronization between active scene and current scene object
    this.getSync = function () {};
        
    // Versions the scene and saves it with a backup
    this.saveWithBackup = function () {};
    */
    return this;

}

/*
 * Gets a sorted unicode list of all keys used to access team entries in teams.json
 * @returns {Array}
 */
function getTeamList () {
    var teamList = new Array();
    var teams = getLocalJson('teams');
    for (t in teams){
        if ((t == "NULL") || (t == "ESPN_META")) continue;
        teamList.push(t);
    }
    return teamList.sort();
}

/*
 * Helper function for pulling from settings.json. This will pull the entire settings tree
 * unless a specific setting is requested.
 * @param {string} [s] - the specific setting requested
 */
function getSetting (s) {
    if ( s === undefined )
        return getLocalJson('settings');
    else {
        var value = getLocalJson('settings')[s];
        if (value !== undefined) 
            return value;
        else 
            // TODO -- ERROR -- COULD NOT FIND SPECIFIED SETTING
    }
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
