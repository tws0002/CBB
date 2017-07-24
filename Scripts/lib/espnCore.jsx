#include 'json2.js'

GLOBAL_PRODUCTIONS = "Y:\\Workspace\\SCRIPTS\\.ESPNTools\\json\\productions.json";

espnCore = {
    'date': "7/17/2017",
    'schema_versions': [1.0, 1.1]
};

// TODO
// - Recursive version incrementer
// - Error handling (probably an Error Logging object of some kind?)
// - Documentation
// - Pre/post validation to ensure safe saving & backups

/*************************************************************************************************
 * JSON HANDLING
 * This function streamlines JSON parsing functionality for the ESPN pipeline script architecture.
 ************************************************************************************************/
/**
 * Parses a JSON file. Includes safe closing and error handling. Checks schema version against
 * script version to ensure failsafe in the event of non-backwards-compatibility.
 * @params {(string|File)} fileRef - A string or file path object represnting the location of a JSON file
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
 * DATABASE OBJECTS
 * These objects assist in conveniently accessing data from static JSON databases
 ************************************************************************************************/
illegalCharacters = /[.,`~!@#$%^&*()=+\[\]\s]/;
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

    if (this.is_live){
        this.loadFolderData();
        //this.loadTeamData();
        //this.loadPlatformData() is handled at the scene level
    }
    //return this;
}

/**
 * TeamData is an object with built-in functions to load & validate team data from JSON
 * @constructor
 * @params {string} id - A team's JSON key. Varies by production -- typically tricode.
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
    if (id !== undefined && prodData.instanceOf(ProductionData)){
        this.prod = prodData;
        // TODO -- ERROR HANDLING OF MISSING TEAM / BAD ID
        this.loadTeam( id );
        return this;
    }
}

/**
 * A scene object stores filesystem and production metadata for an Adobe CC project. It
 * primarily assists in validating backups, but could be extended in the future to integrate with
 * production tracking software and frameworks.
 * @constructor
 */
function SceneData ( prodData, plat_id ) {
    // Production global variables 
    if (prodData.instanceOf(ProductionData)){
        this.prod = prodData;
    } else {
        // TODO -- ERROR MESSAGE -- SCENEDATA MUST INCLUE VALID PRODDATA OBJECT
        return this;
    }
    this.prod.loadPlatformData(plat);
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
        var team = new TeamData( this.prod.name, teamid );
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
    this.setCustomA = function ( custom_data ) {};
    this.setCustomB = function ( custom_data ) {};
    this.setCustomC = function ( custom_data ) {};
    this.setCustomD = function ( custom_data ) {};
    
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
            ((this.production === "") ? 'NULL' : this.production),
            ((this.project === "") ? 'NULL' : this.project),
            ((this.name === "") ? 'NULL' : this.name),
            ((this.show === "") ? 'NULL' : this.showid),
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
