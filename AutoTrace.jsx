// Auto-trace tools for ESPN CBB'17
// Version 1.1 -- 5/23/2017
// mark.rohrer@espn.com
//#targetengine "CBBTools"
#target aftereffects

$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');

/* Execution
**
*/

(function AutoTrace(thisObj)
{	
	var helpText1 = """Instructions:\n\
This tool is intended to be used as a part of a nested\
precomp. In order to trace an asset, first create a\
template precomp for that asset. Then nest that\
precomp into a new comp, open it, and run the 'Setup\
Comp' command. This will prepare that comp for\
auto-tracing. (You may name this comp however\
you like.)\
\
'Setup Comp' will rename your asset layer to\
'@TRACETHIS', tagging it for the script to auto-trace.\
It will then move your auto-traceable comp to a\
tagged folder in the project window. \
\
It will also create a null called 'Trace Params',\
containing the commonly-used stroke parameters.\
Any keyframes should be placed on these null\
parameters, not the shape layer itself. When the\
'Auto-trace' script is run, these values or\
keyframes will be applied to the resulting Shape\
Layer via expression links.\
\
Once the shape layer is created, you should be able\
to modify the keyframes on the 'Trace Params' layer\
and see the results on screen. A few dropdown-based\
parameters cannot be modified via expression links,\
and so are only applied when the shape layer is\
created. (These params are set via checkboxes).\
\
Tracing the 'Auto-Trace Folder' will trace every\
prepared comp in the project. This is used when\
you globally swap out assets and want to update\
the strokes accordingly. 'Active Comp Only' is\
used primarily during look development.\
\
'Project Report' will print a list of all comps\
that are currently ready to be auto-traced.\
\
Do not rename the '@TRACETHIS' or 'Trace Params'\
layers, or move auto-traceable comps out of the\
'Auto-trace' project bin, or else the script\
will fail.""";

    function AutoTraceThis (comp){
        if (comp === undefined) var comp = app.project.activeItem;
        if (!IsTraceable(comp)) return alert('Comp is not set up for auto-trace.');
        var slayer = CreateShapeLayerFromAlpha(comp);
        SetShapeLayerParameters(slayer);
        return true;
    }

    function AutoTraceAll (){
        var strokeFolder = getItem('Auto-Trace', FolderItem);
        for (c=1; c<=strokeFolder.numItems; c++){
            AutoTrace(strokeFolder.item(c));
        }
        return true;
    }

    function SetupCompForAutoTrace (){
        var comp = app.project.activeItem;
        if (!comp){
            alert('There is no comp active in your viewer. Cancelling ...');
            return undefined;
        }

        var layer = comp.selectedLayers;
        if (layer.length !== 1) {
            alert('Select one layer (a precomp) to setup for tracing ...');
            return undefined;
        }

        var bin = getItem('Auto-Trace', FolderItem);
        var dlg = Window.confirm("""Preparing this comp for auto-tracing ...\
            This command will:\
            - Rename the selected layer\
            - Move the active comp to the 'Auto-trace'\
              folder in your project bin\
            - Create a 'Trace Params' null in this comp.\
            \
            Make sure you have a precomp selected!\
            Do you wish to proceed?""");
        if (!dlg) return undefined;

        layer = layer[0];
        if (!(layer.source instanceof CompItem)){
            alert('This command should only be run with a precomp selected ...');
            return undefined;
        }

        layer.name = '@TRACETHIS';
        if (!bin) bin = AddAutoTraceProjectBin();
        comp.parentFolder = bin;
        AddTraceParamsLayer ();
        return true;
    }

    function ProjectReport (){
        var res = "The following comps are ready for Auto-trace:\n";
        var comps = GetTraceableComps();
        for (c in comps){
            res += comps[c].name + "\n";
        }
        return (alert(res));
    }

    /* Validation & Preflight
    **
    */
    function IsTraceable (comp, silent){
        silent = silent || false;
        function sub(comp){
            if (!comp instanceof CompItem) return 1;
            if (!comp.layer("Trace Params")) return 2;
            if (!comp.layer("@TRACETHIS")) return 3;
            return -1;
        }
        var res = {
            1: 'Auto-trace is only setup to work on comps.',
            2: 'No \'Trace Parameters\' layer found.',
            3: 'No \'@TRACETHIS\' layer found.'
        };
        var idx = sub(comp);
        if (idx == -1)
            return true;
        else { 
            if (!silent) alert (res[idx]);
            return false;
        }
    }

    function GetTraceableComps (){
        var comps = new Array();
        var strokeFolder = getItem('Auto-Trace', FolderItem);
        if (strokeFolder){
            for (c=1; c<=strokeFolder.numItems; c++) {
                var tempComp = strokeFolder.item(c);
                if (!IsTraceable(tempComp, silent=true))
                    continue;
                comps.push(tempComp);
            }
        } return comps;
    }

    function ScrubAutomatedLayers (comp){
        var scrubLayers = new Array();
        for (i=1; i<=comp.layers.length; i++){
            if (comp.layer(i).name.indexOf('!Auto-traced') > -1){
                scrubLayers.push(comp.layer(i));
            }
        }
        if (scrubLayers.length) {
            for (L in scrubLayers){
                scrubLayers[L].remove();
            }
        }
        return comp;
    }

    function DeselectAllLayers (comp){
        var selLayers = comp.selectedLayers, n=selLayers.length;
        while (n--) selLayers[n].selected = false;
    }

    /* Core Operation
    **
    */
    // convert an alpha channel to an offset stroke with animation
    function CreateShapeLayerFromAlpha (comp) {
        var comp = ScrubAutomatedLayers(comp);
        var alphaLayer = comp.layer('@TRACETHIS');
        if (!alphaLayer) { alert('No traceable layer found! Cancelling...'); return false; }
        /* masksLayer (LayerItem)
        ** The layer generated by the Auto-trace command. This returns undefined, but does select the layer
        */
        var masksLayer = AutoTraceLayer(alphaLayer);
        //masksLayer.name = "!AUTO " + alphaLayer.name + " Mask Layer";
        //masksLayer.moveBefore(alphaLayer);
        var masksGroup = masksLayer.property("ADBE Mask Parade");

        /* shapeLayer (LayerItem)
        ** The code below is cribbed almost 100% from XXXXXXXXXX.
        */        
        var shapeLayer = comp.layers.addShape();
        var suffix = " Shapes";
        shapeLayer.name =  "!Auto-traced Shape Layer";
        shapeLayer.moveBefore(masksLayer);

        var shapeLayerContents = shapeLayer.property("ADBE Root Vectors Group");
        var shapeGroup = shapeLayerContents; //.addProperty("ADBE Vector Group");
        //shapeGroup.name = "Masks";
        shapePathGroup, shapePath, shapePathData;

        // Get the mask layer's pixel aspect; if layer has no source, use comp's pixel aspect
        var pixelAspect = (masksLayer.source !== null) ? masksLayer.source.pixelAspect : 1.0; //comp.pixelAspect;

        // Iterate over the masks layer's masks, converting their paths to shape paths
        var mask, maskPath, vertices;
        for (m=1; m<=masksGroup.numProperties; m++)
        {
            // Get mask info
            var mask = masksGroup.property(m);
            var maskPath = mask.property("ADBE Mask Shape");

            // Create new shape path using mask info
            var shapePathGroup = shapeGroup.addProperty("ADBE Vector Shape - Group");
            shapePathGroup.name = mask.name;
            var shapePath = shapePathGroup.property("ADBE Vector Shape");

            var shapePathData = new Shape();

            // ...adjust mask vertices (x axis) by pixel aspect
            var vertices = new Array();
            for (var v=0; v<maskPath.value.vertices.length; v++)
                vertices[vertices.length] = [maskPath.value.vertices[v][0] * pixelAspect, maskPath.value.vertices[v][1]];
            shapePathData.vertices = vertices;

            shapePathData.inTangents = maskPath.value.inTangents;
            shapePathData.outTangents = maskPath.value.outTangents;
            shapePathData.closed = maskPath.value.closed;
            shapePath.setValue(shapePathData);
        }

        // Match the mask layer's transforms
        shapeLayer.transform.anchorPoint.setValue(masksLayer.transform.anchorPoint.value);
        shapeLayer.transform.position.setValue(masksLayer.transform.position.value);
        shapeLayer.transform.scale.setValue(masksLayer.transform.scale.value);
        if (masksLayer.threeDLayer)
        {
            shapeLayer.threeDLayer = true;
            shapeLayer.transform.xRotation.setValue(masksLayer.transform.xRotation.value);
            shapeLayer.transform.yRotation.setValue(masksLayer.transform.yRotation.value);
            shapeLayer.transform.zRotation.setValue(masksLayer.transform.zRotation.value);
            shapeLayer.transform.orientation.setValue(masksLayer.transform.orientation.value);
        }
        else
        {
            shapeLayer.transform.rotation.setValue(masksLayer.transform.rotation.value);
        }
        shapeLayer.transform.opacity.setValue(masksLayer.transform.opacity.value);

        masksLayer.remove();
        return shapeLayer;
    }

    function AutoTraceLayer (alphaLayer){
        var thisComp = alphaLayer.containingComp;
        thisComp.openInViewer();
        app.executeCommand(2004); // Deselect all...
        alphaLayer.selected = true;
        app.executeCommand(3044); // Auto-trace ...
        var tracedLayer = thisComp.selectedLayers[0];
        tracedLayer.moveBefore(alphaLayer);
        tracedLayer.name = "!Auto-traced Layer";
        alphaLayer.enabled = false;
        return tracedLayer;
    }

    function SetShapeLayerParameters (shapeLayer){//, static_params, keyed_params) {
        // Add Shape layer effects
        var shapes = shapeLayer.property("Contents");
        var params = shapeLayer.containingComp.layer("Trace Params");
        if (!shapes || !params) return (alert('Could not find valid parameters for tracing.'));

        if (!shapes.property("Offset Paths 1")) shapes.addProperty("ADBE Vector Filter - Offset");
        if (!shapes.property("Merge Paths 1")) shapes.addProperty("ADBE Vector Filter - Merge");
        if (!shapes.property("Trim Paths 1")) shapes.addProperty("ADBE Vector Filter - Trim");
        if (!shapes.property("Stroke 1")) shapes.addProperty("ADBE Vector Graphic - Stroke");

        // Set user-defined parameters that can't be set by expression
        // 0: Target propertyGroup, 1: Target property, 2: source property
        var staticProperties = [
            ["Stroke 1", "Line Join", "Rounded Joints"],
            ["Offset Paths 1", "Line Join", "Rounded Joints"],
            ["Trim Paths 1", "Trim Multiple Shapes", "Individual Trace"],
            ["Merge Paths 1", "Mode", "Remove Holes"]
        ]  

        for (p in staticProperties){
            var props = staticProperties[p];
            var tarProp = shapes.property(props[0]).property(props[1]);
            var srcProp = params.property("Effects").property(props[2]);
            var value = srcProp.checkbox.value ? 2 : 1;
            tarProp.setValue(value);
        }

        // Set user-defined paramaters that are keyable, and set by expression links
        // 0: Target propertyGroup, 1: Target property, 2: source property
        var expressionLinkedProperties = [
            ["Stroke 1", "Stroke Width", "Stroke Width"],
            ["Offset Paths 1", "Amount", "Stroke Offset"],
            ["Offset Paths 1", "Miter Limit", "Miter Limit"],
            ["Trim Paths 1", "Start", "Trim Start"],
            ["Trim Paths 1", "End", "Trim End"],
            ["Trim Paths 1", "Offset", "Trim Offset"]
        ];

        for (p in expressionLinkedProperties){
            var props = expressionLinkedProperties[p];
            var tarProp = shapes.property(props[0]).property(props[1]);
            var exp = 'thisComp.layer("Trace Params").effect("' + props[2] + '")("Slider")';
            if (tarProp.canSetExpression){
                tarProp.expression = exp;
                tarProp.expressionEnabled = true;
            }
        }

    }

    // convert a vector asset into a high quality traced animation
    function AiToShapeLayerHelper () {
    }

    function AddAutoTraceProjectBin (){
        var bin = getItem('Auto-Trace', FolderItem);
        if (!bin) bin = app.project.items.addFolder("Auto-Trace")
        return bin;
    }

    function AddTraceParamsLayer (){
        var comp = app.project.activeItem;

        if (comp === undefined) {
            alert("No comp is active in the viewer. Can't add Trace Params layer ...");
            return false;
        }
        if (comp.layer("Trace Params")){
            return undefined;
        }

        var layer = comp.layers.addNull();
        layer.name = "Trace Params";

        var widthSlider = layer.property("Effects").addProperty("Slider Control");
        widthSlider.name = "Stroke Width";
        widthSlider.slider.setValue(1.0);
        var offsetSlider = layer.property("Effects").addProperty("Slider Control");
        offsetSlider.name = "Stroke Offset";
        offsetSlider.slider.setValue(0);
        var miterSlider = layer.property("Effects").addProperty("Slider Control");
        miterSlider.name = "Miter Limit";
        miterSlider.slider.setValue(1.0);
        var roundedToggle = layer.property("Effects").addProperty("Checkbox Control");
        roundedToggle.name = "Rounded Joints";
        var indivToggle = layer.property("Effects").addProperty("Checkbox Control");
        indivToggle.name = "Individual Trace";
        var addMergeToggle = layer.property("Effects").addProperty("Checkbox Control");
        addMergeToggle.name = "Remove Holes";

        var trimStartSlider = layer.property("Effects").addProperty("Slider Control");
        trimStartSlider.name = "Trim Start";
        trimStartSlider.slider.setValue(0);
        var trimEndSlider = layer.property("Effects").addProperty("Slider Control");
        trimEndSlider.name = "Trim End";
        trimEndSlider.slider.setValue(100);
        var trimOffsetSlider = layer.property("Effects").addProperty("Slider Control");
        trimOffsetSlider.name = "Trim Offset";

        return layer;
    }
    
	function AutoTraceUI(thisObj)
	{
		var onWindows = ($.os.indexOf("Windows") !== -1);
		var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Auto Trace", undefined, {resizeable:true});

		if (pal !== null)
			{
				var res =
				"""group { 
					orientation:'column', alignment:['fill','fill'],
					box1: Group {
						alignment:['fill', 'top'], orientation:'column', alignChildren:['fill','top'],
						heading: StaticText { text:'Trace Alpha', alignment:['fill','top'] },
						traceBtn: Button { text: 'Active Comp Only', preferredSize:[-1,20] },
						traceAllBtn: Button { text: 'Auto-trace Folder', preferredSize:[-1,20] },
					},
					box2: Group {
						alignment:['fill', 'top'], orientation:'column', alignChildren:['fill','top'],
						heading: StaticText { text:'Setup / Help', alignment:['fill','top'] },
						setupBtn: Button { text:'Setup Comp', preferredSize:[-1,20] },
						checkBtn: Button { text:'Check Project', preferredSize:[-1,20] },
						helpBtn: Button { text:'Help', preferredSize:[-1,20] }
					}
				}""";
				pal.grp = pal.add(res);
				
				pal.grp.box2.margins.top = 10;
				//pal.grp.compbox.lst.preferredSize.height = 100;
				
				pal.layout.layout(true);
				pal.grp.minimumSize = pal.grp.size;
				pal.layout.resize();
				pal.onResizing = pal.onResize = function () {this.layout.resize();}
				
				pal.grp.box1.traceBtn.onClick = AutoTraceThis;
				pal.grp.box1.traceAllBtn.onClick = AutoTraceAll;
				pal.grp.box2.checkBtn.onClick = ProjectReport;
				pal.grp.box2.setupBtn.onClick = SetupCompForAutoTrace;

				pal.grp.box2.helpBtn.onClick = function () { alert(helpText1); }
				
			}
		return pal;
	}

	var dlg = AutoTraceUI(thisObj);
	if ((dlg !== null) && (dlg instanceof Window))
	{
        dlg.center();
        dlg.show();
	} 
    else
        dlg.layout.layout(true);

})(this);