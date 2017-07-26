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
STATUS.UNDEFINED         = -1; // no tag data found / miscellaneous bad news
STATUS.NOSYNC            = 0; // set when operations are in the process of changing scene values
STATUS.NODEST            = 1; // set when the scene has no valid location to write to
STATUS.TAGGED            = 2; // set when change operations have completed successfully
STATUS.CHANGED           = 3; // set when change operations have core filename implications (project/name)
STATUS.READY             = 4; // ready to write to disk -- can only be set by prevalidate()
STATUS.READY_WARN        = 5; // ready to write to disk, but alert the user of an overwrite risk

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
    var prod_db = getJson (GLOBAL_PRODUCTIONS)[id];
    if (prod_db === undefined){
        //TODO -- ERROR -- PROD NOT FOUND IN DB
        return undefined;
    }
    this.name      = id;
    this.folderdata= false;
    this.teamdata  = false;
    this.platdata  = false;
    this.is_live   = prod_db['live'];
    this.dbversion = prod_db['vers'];
    this.root      = prod_db['root'];
    this.dbroot    = prod_db['json'];    
    this.pubroot   = prod_db['pub'];

    this.loadFolderData = function () {
        var folderDb = getJson(this.dbroot + "\\folders.json");
        this.folders = folderDb['lookup'];
        this.folderdata = true;
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
        this.teamdata = true;
    };
    this.loadPlatformData = function ( platform_id ) {
        var platDb = getJson(this.dbroot + "\\{0}.json".format(platform_id));
        this[platform_id] = platDb;
        this.platdata = true;
    };
    
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
    
    this.loadTeam = function ( prodData, id ) {
        (id === null) ? id = 'NULL' : null;
        if (!prodData instanceof ProductionData){
            prodData = new ProductionData(prodData);
        }
        var teamDb      = getJson(prodData['dbroot'] + '\\teams.json');
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
    };
    if (id !== undefined){
        // TODO -- ERROR HANDLING OF MISSING TEAM / BAD ID
        this.loadTeam( prodData, id );
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
    // Status flag controls whether the scene is safe to be written to disk
    this.status = STATUS.UNDEFINED;
    // Production global variables 
    if (prodData instanceof ProductionData){
        this.prod = prodData;
    } else {
        this.prod = new ProductionData( prodData );
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
    this.setProduction = function ( prod, plat ){
        if (this.prod.name !== prod){
            this.prod = new ProductionData( prod );
            this.prod.loadPlatformData(plat);
        }
        this.status = STATUS.CHANGED;
    };
    // Setters for scene name attributes
    this.setProject = function ( project_name ) {
        if ((!project_name) || (illegalCharacters.test(project_name))){
            // TODO - ERROR - INVALID NAME
        } else { 
            this.project = project_name;
            this.fullName = this.project + '_' + this.name;
        }
        this.status = STATUS.CHANGED;
    };
    this.setName = function ( name ) {
        if ((!name) || (illegalCharacters.test(name))){
            // TODO - ERROR - INVALID NAME
        } else { 
            this.name = name; 
            this.fullName = this.project + '_' + this.name;
        }
        this.status = STATUS.CHANGED;
    };
    this.setTeam = function ( loc, teamid ) {
        var team = new TeamData( this.prod, teamid );
        if (team !== undefined) this.teams[loc] = team;
        this.status = STATUS.CHANGED;
    };
    this.setShow = function ( showid ) {
        if (showid !== undefined) this.show = showid;
        this.status = STATUS.CHANGED;
    };
    this.setSponsor = function ( sponsorid ) {
        if (sponsorid !== undefined) this.show = sponsorid;
        this.status = STATUS.CHANGED;
    };
    this.setVersion = function () {
        //function incr(){
        //    var 
        //}
        this.version += 1;
    };
    this.setCustom = function ( id, custom_data ) {
        this['custom{0}'.format(id)] = custom_data;
        this.status = STATUS.CHANGED;
    };
    
    this.setFromTag = function ( tag_string ) {
        var data = JSON.parse(tag_string);
        this.setProduction(data['prod'], data['plat']);
        this.setProject(data['project']);
        this.setName(data['scene']);
        this.setVersion(data['version']);
        this.setShow(data['show'][0]);
        this.setSponsor(data['sponsor'][0]);
        this.setCustom('A', data['customA'][0]);
        this.setCustom('B', data['customB'][0]);
        this.setCustom('C', data['customC'][0]);
        this.setCustom('D', data['customD'][0]);
        this.setTeam(0, data['team0'][0]);
        this.setTeam(1, data['team1'][0]);
    };
    
    // Gets the full directory path for this scene (excluding file name)
    this.getPaths = function () {
        if (!this.prod.folderdata) this.prod.loadFolderData();
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
                if (namingOrder[i][1] === "NULL" || namingOrder[i][1] === "" || namingOrder[i][1] === null){
                    this.status = STATUS.UNDEFINED;
                    //TODO ERROR MESSAGE
                    return false;
                }
                inclusions += "_{0}".format(namingOrder[i][1]);        
        }
        (vers === undefined) ? vtag = "" : vtag = ".{0}".format(zeroFill(this.version, 4));
        (ext === undefined) ? ext = "aep" : ext;
        
        return ("{0}{1}{2}.{3}".format(fileName, inclusions, vtag, ext));
    };
    
    // Generates a single string with the attributes of this scene object
    this.getTag = function () {
        var tag = new Object();
        tag['plat']    = this.platform;
        tag['prod']    = this.prod.name;
        tag['project'] = this.project;
        tag['scene']   = this.name;
        tag['version'] = this.version;
        tag['show']    = [this.showid, this.use_showid];
        tag['sponsor'] = [this.sponsorid, this.use_sponsorid];
        tag['customA'] = [this.customA, this.use_customA];
        tag['customB'] = [this.customB, this.use_customB];
        tag['customC'] = [this.customC, this.use_customC];
        tag['customD'] = [this.customD, this.use_customD];
        tag['team0']   = [this.teams[0].id, this.use_team0id];
        tag['team1']   = [this.teams[1].id, this.use_team1id];
        return JSON.stringify(tag);
    };
    
    /** This function ensures that the virtual object is correctly populated and does not
      * contain NULL data in any of its filesystem critical attributes.
      * @param {String} tagString - A single-line metadata tag
      * @returns {Int} A status flag.
      */
    this.prevalidate = function (tagData) {
        if (this.status !== STATUS.TAGGED){
            // TODO -- ERROR -- THIS SCENE CANNOT BE VALIDATED
            return undefined;    
        }
        // Critical tag metadata does not match virtual metadata
        /*
        var thisTag = this.getTag();
        tagData = JSON.parse(tagData);
        for (k in tagData){
            if (!tagData.hasOwnProperty(k)) continue;
            alert(k);
            if (tagData[k] instanceof Array){
                if (tagData[k][0] !== thisTag[k][0] || tagData[k][1] !== thisTag[k][1]) 
                    this.status = STATUS.NOSYNC;
            } else {
                if (tagData[k] !== thisTag[k])
                    this.status = STATUS.NOSYNC;
            }
        }*/
        
        // Check all critical naming attributes for bad data
        if (this.plat === "NULL" || this.plat === "" || this.plat === undefined){
            this.status = STATUS.UNDEFINED;
        }
        if (this.prod === "NULL" || this.prod === "" || this.prod === undefined){
            this.status = STATUS.UNDEFINED;
        }
        if (this.project === "NULL" || this.project === "" || this.project === undefined){
            this.status = STATUS.UNDEFINED;
        }
        /*if (this.name === "NULL" || this.name === "" || this.name === undefined){
            this.status = STATUS.UNDEFINED;
        }*/
        
        // Check that destination folders exist
        if (!this.getPaths()[0].exists || !this.getPaths()[1].exists)
            // TODO -- ERROR -- DESTINATION FOLDER DOES NOT EXIST
            this.status = STATUS.NODEST;
        
        // Final check for strict overwrite warning
        if (this.status === STATUS.CHANGED) {
            if (new File(this.getPaths()[0] + this.getName()).exists){
                this.status = STATUS.READY_WARN;
            } else {
                this.status = STATUS.READY;
            }
        } else this.status = STATUS.READY;
        
        return this.status;
    };
    
    /** This is a placeholder for the eventuality that Adobe will realize file save verification
      * is a fairly important feature.
      */
    this.postvalidate = function () {};
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
 * FILESYSTEM
 ************************************************************************************************/
/**
 * Creates a folder at the requested location (if it doesn't already exist)
 * @param {String} path - A string representing the folder (as fs or URI) you want to create
 * @returns {Folder} A folder object
 */
// TODO -- INCLUDE SAFE CLOSING
function createFolder(path){
    var folderObj = new Folder(path);
    if (!folderObj.exists)
        folderObj.create();
    return folderObj;
}

/**
 * Recursively creates a folder structure based on a passed dictionary
 * @param {String} root - The starting directory in which the structure will be created
 * @param {Object} map - The dictionary represnting the structure
 */
function createFolders(root, map){
    for (var f in map){
        if (map.hasOwnProperty(f)) {
            var folderStr = root + '/' + f;
            var folderObj = new Folder(folderStr);
            if (!folderObj.exists)
                folderObj.create();
            createFolders(folderStr, map[f]);
        }
    }
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
        if (!subFolders.hasOwnProperty(i)) continue;
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
 * A helper function that constructs a scene object directly from tag data and performs
 * a postvalidation. It returns an array containing the result of the validation and a
 * valid scene object (or undefined)
 * @param {string} tag_string - A properly formatted one-line metadata tag
 * @returns {Array} [0] The postvalidation flag and [1] a valid scene object (or undefined)
 */
function tagToScene ( tag_string ) {
    var tagData = JSON.parse(tag_string);
    var scene = new SceneData (tagData['prod'], tagData['plat']);
    scene.setFromKeys(tagData);
    // because this is a tagged scene, it is presumed to be present on the server
    // therefore, it should be post validated to ensure that the AEP and the Scene
    // object metadata are synchronized.
    scene.status = STATUS.TAGGED;
    var v = scene.prevalidate();
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

Array.prototype.indexOf = function(searchElement, fromIndex) {
    var k;

    // 1. Let o be the result of calling ToObject passing
    //    the this value as the argument.
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }

    var o = Object(this);

    // 2. Let lenValue be the result of calling the Get
    //    internal method of o with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = o.length >>> 0;

    // 4. If len is 0, return -1.
    if (len === 0) {
      return -1;
    }

    // 5. If argument fromIndex was passed let n be
    //    ToInteger(fromIndex); else let n be 0.
    var n = fromIndex | 0;

    // 6. If n >= len, return -1.
    if (n >= len) {
      return -1;
    }

    // 7. If n >= 0, then Let k be n.
    // 8. Else, n<0, Let k be len - abs(n).
    //    If k is less than 0, then let k be 0.
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    // 9. Repeat, while k < len
    while (k < len) {
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the
      //    HasProperty internal method of o with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      //    i.  Let elementK be the result of calling the Get
      //        internal method of o with the argument ToString(k).
      //   ii.  Let same be the result of applying the
      //        Strict Equality Comparison Algorithm to
      //        searchElement and elementK.
      //  iii.  If same is true, return k.
      if (k in o && o[k] === searchElement) {
        return k;
      }
      k++;
    }
    return -1;
};

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

