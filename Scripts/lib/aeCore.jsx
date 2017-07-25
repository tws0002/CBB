aeCore = {
    'version': 1.1,
    'date'   : "7/17/2017"
};

/**
 * Gets an AVItem from the project window by name, filtering by class.
 * @params {string} item_name - The name of the item
 * @params {type} class_ - The class of object being searched for (default CompItem)
 * @returns {AVItem} The requested AVItem (type is determined by the search)
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

/**
 * Gets a layer from a comp by name.
 * @params {CompItem} comp - The comp being searched
 * @params {string} layer_name - Name of the layer being searched for
 * @returns {AVLayer} The requested layer
 */
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

/**
 * Sets the comment value on a specified item in the project window
 * @params {AVItem} item - The AVItem to be commented
 * @params {string} comment - The comment to be added
 */
function setComment(item, comment){
    try {
        item.comment = comment;
        return true;
    } catch(e) {
        // TODO __ ERROR HANDLING -- COULD NOT SET TAG
        return false;
    }
}

/**
 * Sets an expression on a selected property. This performs no validation.
 * @params {String} expression - The AVItem to be commented
 */
function setExpressionOnSelected (expression) {
    var props = app.project.activeItem.selectedProperties;
    if (props.length === 0) alert(error['PROPS_NOSEL']);
    for (var i=0; i<props.length; i++){
        if (props[i].canSetExpression){
            props[i].expression = expression;
            props[i].expressionEnabled = true;
        }
    }
}

/**
 * Removes any expressions on a selected property (including disabled ones.)
 */
function removeExpressionOnSelected () {
    var props = app.project.activeItem.selectedProperties;
    if (props.length === 0) alert(error['PROPS_NOSEL']);
    for (var i=0; i<props.length; i++){
        if (props[i].canSetExpression){
            props[i].expression = '';
            props[i].expressionEnabled = false;
        }
    }
}

/**
 * Clears all items from the render queue.
 */
function clearRenderQueue () {
    var RQitems = app.project.renderQueue.items;
    while (true) {
        try {
            RQitems[1].remove();
        } 
        catch(e) { break; }
    }
}

/**
 * Deselects all layers in the passed comp.
 * @param {CompItem} comp - A comp with layers you wish to deselect :)
 */
function deselectAllLayers (comp){
    var selLayers = comp.selectedLayers, n=selLayers.length;
    while (n--) selLayers[n].selected = false;
}

/**
 * Builds a text layer with many commonly-used parameters
 * @params {string} text - The text content of the new layer
 * @params {CompItem} comp - The comp the layer should be added to
 * @params {Vector3} pos - The xyz position for the new layer
 * @params {string} font - The name of the font to be used
 * @params {int} fontSize - The size of the font
 * @params {int} tracking - The tracking value for the text layer
 * @params {string} name - The name of the layer
 * @params {bool} locked - Whether the new layer should be locked
 * @returns {TextLayer}
 */
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
