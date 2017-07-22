#include 'json2.js'

version = 1.1;

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

function buildTextLayer(text, comp, pos, font, fontSize, tracking, name, locked){
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






