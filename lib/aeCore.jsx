#include 'json2.js'

version = 1.1;

errors = {
    'META_MISMATCH': 'WARNING!! Metadata mismatch in the database you are accessing. This is probably bad news.',
    'DB_ERR': 'Requested JSON not in expected location.\ Check settings.ini',
    'TEAM_ERR': 'Team not found in database.',
    'SETTINGS': 'Setting not found in settings.ini: ',
    'TAG_ERR': 'Could not set comment on: ',
};
/* 
    AE helpers
*/
function getItem(item_name, class_){
    /* Gets an item from the project window by name.  Looks for CompItem by default,
       but can be passed other objects (from the project window) to search for as well. */
    var comp;
    // Handling custom object parameter
    class_ = typeof class_ !== 'undefined' ? class_ : CompItem;
    // Search for the item by name
    for (var i=1; i<=app.project.numItems; i++){ 
        var item = app.project.item(i);
        // Check object type and name
        if ((item instanceof class_) && (item.name === item_name)){
            if (comp){
                alert('More than one item found with name ' + item_name + '.');
            }
            comp = item;
            break;
        }
    }
    return comp;
}

function getLayer(comp, layer_name){
    // Searches a comp for a given layer (by name)
    var layer;
    for (var i=1; i<=comp.numLayers; i++){
        lay = comp.layer(i);
        if (lay.name === layer_name){
            if (layer){
                alert('More than one layer found with name ' + layer_name + '.');
            }
            layer = lay;
            break;
        }
    }
    return layer;
}

function setComment(item, comment){
    try {
        item.comment = comment;
        return true;
    } catch(e) {
        alert((errors.TAG_ERR + item.name ));
        return false;
    }
}

/*function applyTemplate () {
    var rqi = app.project.renderQueue.items[1];
    var sel = rqi.outputModules[1].templates[9];

    try {
        rqi.outputModules[1].applyTemplate(sel);
        $.writeln('success!');
    } catch (e) {};
}

/*
    Filesystem helpers
*/
function createFolder(path){
    var folderObj = new Folder(path);
    if (!folderObj.exists)
        folderObj.create();
    return folderObj;
}

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

/*
    JSON Helpers
*/
function getJson (fileObj) {
    fileObj = new File(fileObj);
    if (!fileObj.exists){
        alert( errors['DB_ERR'] );
        return undefined;
    }
	fileObj.open('r')
	db = JSON.parse(fileObj.read());
    fileObj.close();
    if (db["ESPN_META"]["version"] != version){
        alert( errors['META_MISMATCH'] );
    }
	return db;
}

function getLocalJson (name) {
    var lclDir = new File( $.fileName ).parent.parent;
    var jsn = getJson(lclDir.fullName + '/json/{0}.json'.format(name));
    return jsn;
}

function BuildTextLayer(text, comp, pos, font, fontSize, tracking, name, locked){
    (pos === undefined) ? pos = [0,0,0] : null;
    (font === undefined) ? font = 'Arial' : null;
    (fontSize === undefined) ? fontSize = 12 : null;
    (tracking === undefined) ? tracking = 0 : null;
    (locked === undefined) ? locked = false : null;
    
    // Create text layer
    var text_layer = comp.layers.addText(text);
    if (name !== undefined) text_layer.name = name;
    // Create text document (AE's "formatting" object)      
    var text_properties = text_layer.property("ADBE Text Properties").property("ADBE Text Document");
    var text_document = text_properties.value;

    text_document.fontSize = fontSize;
    text_document.font     = font;
    text_document.tracking = tracking;

    // Assign the formatting to the layer
    text_properties.setValue(text_document);

    // set the position for the text
    text_layer.position.setValue(pos)
    // assign it to a parent for scaling
    //text_layer.parent = parent;
    text_layer.locked = locked;

    return text_layer;
}

/*
    Team ()
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

/*
    TeamList ()
*/
function TeamList () {
    var teamList = new Array();
    var teams = getLocalJson('teams');
    for (t in teams){
        if ((t == "NULL") || (t == "ESPN_META")) continue;
        teamList.push(t);
    }
    return teamList.sort();
}

/*
    Settings ()
*/
function GetSetting (s) {
    var value = getLocalJson('settings')[s];
    if (value === undefined){
        alert(errors['SETTINGS']);
    } else return value;
}

/**
 * Production is a helper object storing static database information on a given production.
 * @param {String} prod_id
 */
function Production () {
    this.init = function () {
        this.valid     = false;
        this.name      = undefined;
        this.location  = undefined;
        this.has_teams = undefined;
        this.teams     = undefined;
        this.proj_map  = undefined;		
    };
    this.init();
}

Production.prototype.load = function (prod_id) {
    var prod = get_prod(prod_id);
    if (prod !== undefined){
        
        this.name     = prod_id
        this.location = prod['location'];
        this.proj_map = get_proj_map();
        
        if (prod['teams']) {
            this.has_teams = true;
            this.teams     = get_teams(prod_id)
        } else { 
            this.has_teams = false;
            this.teams     = null;
        }
    }
    this.validate();
}
""
Production.prototype.validate = function () {
    for (var property in this) {
        if (this.hasOwnProperty(property)) {
            if (property === undefined) {
                this.valid = false;
                return false;
            }
        }
    } 
    this.valid = true;
    return true;
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

/** EOF **/






