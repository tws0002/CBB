// Auto-trace tools for ESPN CBB'17
// Version 1.1 -- 5/23/2017
// mark.rohrer@espn.com
#target aftereffects
//#targetengine "ESPN"
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/espnCore.jsx');

/*********************************************************************************************
 * ESPNTools
 * Self-executing ScriptUI panel
 ********************************************************************************************/ 
(function ESPNTools(thisObj)
{	
    /*********************************************************************************************
     * INITIALIZERS
     * These functions set the initial state of the UI under various conditions.
     ********************************************************************************************/  
    /*
     * This function is a "soft" init that checks the current scene and redirects to an appropriate
     * initializer for that scene's current state.
     */
    function initialize () {
        this.liveScene = new SceneData('NULL','ae');
        this.tempScene = this.liveScene;
        // Attempt to pull the scene tag and construct a scene object
        try {
            var tagString = getItem('0. Dashboard').comment;
            this.tempScene.setFromTag(tagString);
            // prevalidate sets more precise STATUS flags
            this.tempScene.prevalidate();
        } catch(e) {
            //this.tempScene = new SceneData ('NULL','ae');
            this.tempScene.status = STATUS.UNDEFINED;
        }
        // If the tagdata passes validation, load it as a live scene
        if (this.tempScene.status === (STATUS.OK || STATUS.OK_WARN)){
            // This scene has valid data and is ready to go. Update the UI with its info
            // Set the buffered scene to live
            this.liveScene = this.tempScene;
            // Populate the UI with the active data
            initializeFromLiveScene();
        // Otherwise load a blank template
        } else if (this.tempScene.status === STATUS.NO_DEST) {
            this.liveScene = this.tempScene;
            initializeFromLiveScene();
            // TODO -- WARNING -- THIS PROJECT'S ORIGINAL FILE LOCATION IS NO LONGER VALID. PLEASE RE-SAVE IMMEDIATELY
        }
        else { 
            initializeNewProject(); 
        }
    }
    
    function initializeFromLiveScene () {
        populateProductions();
        populateProjects();
        populateTeams();
        populateShows();
        populateSponsors();

        setProduction(this.liveScene.prod.name);
        setProject(this.liveScene.project);
        setName(this.liveScene.name); 
        setHomeTeam(this.liveScene.teams[0].id);
        setAwayTeam(this.liveScene.teams[1].id);
        //setShow(this.liveScene.show);
        //setSponsor(this.liveScene.sponsor);
        setCustomText(
            this.liveScene.customA,
            this.liveScene.customB,
            this.liveScene.customC,
            this.liveScene.customD
        );
        refresh();
    }
    
    function initializeNewProject () {
        populateProductions();
        refresh();
    }
    
    /*********************************************************************************************
     * SETTERS
     * These functions set the values of fields and dropdowns based on the parameters in the 
     * liveScene object
     ********************************************************************************************/         
    function setProduction ( prod ){
        var prodList = getActiveProductions();
        var i = prodList.indexOf(prod);
        if (i === -1){
            //TODO -- ERROR -- COULD NOT SET PRODUCTION DROPDOWN
            return false;
        } else {
            dlg.grp.tabs.setup.production.dd.selection = i;
            return true;
        }
    }
    
    function setProject ( proj ){
        var i = getAllProjects(this.liveScene.prod.name).indexOf(proj);
        if (i === -1){
            //TODO -- ERROR
            return false;
        } else {
            dlg.grp.tabs.setup.projectName.pick.dd.selection = i;
            return true;
        }
    }
    
    function setName ( name ) {
        if (name !== undefined);
        dlg.grp.tabs.setup.sceneName.e.text = name;
    }
    
    function setHomeTeam ( team ){
        var i = this.liveScene.prod.teamlist.indexOf(team);
        if ( i === -1){
            return false;
        } else {
            dlg.grp.tabs.version.div.fields.team.dd.selection = i;
            return true;
        }
    }
    
    function setAwayTeam ( team ){}
    
    function setCustomText (a,b,c,d) {
        dlg.grp.tabs.version.div.fields.etA.text = a;
        dlg.grp.tabs.version.div.fields.etB.text = b;
        dlg.grp.tabs.version.div.fields.etC.text = c;
        dlg.grp.tabs.version.div.fields.etD.text = d;
        return true;
    }
    
    /*********************************************************************************************
     * POPULATE FUNCTIONS
     * These functions are used to populate dropdowns and fields when called
     ********************************************************************************************/
    function populateProductions () {
        var element = dlg.grp.tabs.setup.production.dd;
        element.removeAll();
        var prodList = getActiveProductions();
        for (i in prodList){
            element.add("item", prodList[i]);
        } 
    }
    
    function populateProjects () {
        var element = dlg.grp.tabs.setup.projectName.pick.dd;
        element.removeAll();
        var projList = getAllProjects(this.liveScene.prod.name);
        for (i in projList){
            element.add("item", projList[i]);
        }
    }
    
    function populateTeams () {
        var home = dlg.grp.tabs.version.div.fields.team.dd;
        home.removeAll();
        if (!this.liveScene.prod.teamdata) 
            this.liveScene.prod.loadTeamData();
        for (i in this.liveScene.prod.teamlist){
            home.add("item", this.liveScene.prod.teamlist[i]);
        }
    }
    
    function populateShows () {}
    
    function populateSponsors () {}
    
    /*********************************************************************************************
     * CHANGED FUNCTIONS
     * These functions are called whenever the user updates something in the UI. Depending on the 
     * needs of the operation, these will either update the liveScene or tempScene object (or both)
     ********************************************************************************************/     
    function changedProduction () {
        populateProjects();
        populateTeams();
        populateShows();
        populateSponsors();
    }
    
    function changedProject () {}
    
    function changedProjectName () {}
    
    function changedNamingFlags () {}
    
    function changedCustomText () {}
    
    function changedTeam () {}
    
    function changedShow () {}
    
    function changedSponsor () {}
    
    /*********************************************************************************************
     * REFRESHERS
     * These functions refresh the UI with information from the currently loaded project, or one
     * of the Scene metadata objects (liveScene or tempScene)
     ********************************************************************************************/
    function refresh () {null;}
    
    function forceRefresh ( scene ) {}
    
    //////////////////
    // OLD STUFF /// HERE BE DRAGONS
    ///////////////////////

    function createScene () {}

    function saveWithBackup () {
        if (this.liveScene.status === (STATUS.OK_WARN)){
            alert('Save overwrite warning goes here');
        }
        if (this.liveScene.status === (STATUS.OK || STATUS.OK_WARN)){
            var aepFile = new File(this.liveScene.getPaths()[0] + this.liveScene.getName());
            app.project.save(aepFile);
            try {
                aepFile.copy( this.liveScene.getPaths()[1] + this.liveScene.getName(true));
            } catch (e) { 
                alert('Warning: Backup was not saved.');
            }
            return true;
        } else return false;
    }

    function pickleLogoSheet () {
        var output    = {};
        var selection = app.project.selection;

        for (i in selection)
        {
            siz = [selection[i].width, selection[i].height];
            pos = selection[i].layers[1].position.value;
            anx = selection[i].layers[1].anchorPoint.value;
            scl = selection[i].layers[1].scale.value;

            output[selection[i].name] = {
                "Size": siz,
                "Pos": pos,
                "Anx": anx,
                "Scl": scl
            }
        }
        output = JSON.stringify(output);
        var outDir = new File( $.filename ).parent.parent;
        var outJsn = new File( outDir.fullName + '/json/logosheet.json' );

        outJsn.open('w');
        outJsn.write(output);
    }

    /*********************************************************************************************
    TEMPLATE BUILDERS
    *********************************************************************************************/    
    function buildProjectTemplate () {
        // Check for platform-specific JSON & load it if necessary
        if (!this.liveScene.prod.platdata) 
            this.liveScene.prod.loadPlatformData('ae');
        // Build the bin/folder tree from JSON
        buildBinTree( this.liveScene.prod.plat_db['Bins'] );
        // Build template comps
        var comps = this.liveScene.prod.plat_db['Comps'];
        for (k in comps){
            if (!comps.hasOwnProperty(k)) continue;
            var c = app.project.items.addComp(comps[k][0], 1920,1080,1.0,60,59.94);
            // Move the comp to its assigned parent folder
            var parent = getItem(comps[k][1], FolderItem)
            if (parent) c.parentFolder = parent;
        }
    }
    
    function buildDashboard () {
        var font = "Tw Cen MT Condensed";
        var posBig = [65,150,0];
        var posSm = [65,80,0];
        var ypi = 120;
        var fontSizeBig = 90;
        var fontSizeSm = 33;
        
        var dashboard = getItem(STR.dashboardComp);

        if (!(dashboard.layer('BACKGROUND'))){
            var bgnd = dashboard.layers.addSolid([0.17,0.17,0.17], 'BACKGROUND', 1920, 1080, 1.0, 60);
            bgnd.locked = true;
        }
        var TXTL = new Object();
        for (var i in TEAMTXTL){
            if (TEAMTXTL.hasOwnProperty(i)){
                TXTL[i] = TEAMTXTL[i];
            }
        }
        for (var i in CUSTXTL){
            if (CUSTXTL.hasOwnProperty(i)) {
                TXTL[i] = CUSTXTL[i];
            }
        }
        for (var L in TXTL){
            if (!TXTL.hasOwnProperty(L)) continue;
            if (!(dashboard.layer((TXTL[L]) + ' Label')))
                BuildTextLayer(TXTL[L], dashboard, posSm, font, fontSizeSm, 0, (TXTL[L] + ' Label'), true)
            if (!(dashboard.layer(TXTL[L])))
                BuildTextLayer(TXTL[L], dashboard, posBig, font, fontSizeBig, 0, TXTL[L], true)
            posBig[1] += ypi;
            posSm[1] += ypi;
        }
        
        var y = 1072.7;        
        var sysFontSize = 27;
        var sysPos = [71,y,0];
        var exp = "[(thisComp.layer('{0}').sourceRectAtTime().width + thisComp.layer('{1}').position[0])+5, {2},0];";
        var prev = '';
        for (i in SYSTXTL){
            if (!SYSTXTL.hasOwnProperty(i)) continue;
            var tmp = BuildTextLayer('', dashboard, sysPos, font, sysFontSize, 0, SYSTXTL[i], true);
            if (i != 'projectName'){
                tmp.transform.position.expression = exp.format(prev, prev, y);
            }
            prev = SYSTXTL[i];
        }
    }
    
    function buildGuidelayer () {
        var font = "Tw Cen MT Condensed";
        var fontSize = 67;
        var tcPos = [1651, 1071];
        var nmPos = [93.7, 1071];
        
        var guidelayerComp = getItem(STR.guidelayerComp);
        var guidelayerBin  = getItem(STR.guidelayerBin, FolderItem);
        var botline        = getItem('Bottomline.tga', FootageItem);
            
        if (!botline) {
            if (!M.bottomline.exists){
                alert(ERR.BOTTOMLINE);
                return false;
            }
            var imOptions = new ImportOptions();
            imOptions.file = M.bottomline;
            imOptions.sequence = false;
            imOptions.importAs = ImportAsType.FOOTAGE;
            botline = app.project.importFile(imOptions);
            botline.parentFolder = guidelayerBin;
        }
        while (true) {
            try { 
                guidelayerComp.layer(1).locked = false;
                guidelayerComp.layer(1).remove();
            }
            catch(e) { break; }
        }
        var blLayer = guidelayerComp.layers.add(botline);
        blLayer.locked = true;
        var tcLayer = BuildTextLayer('', guidelayerComp, tcPos, font, fontSize, 0, 'Timecode', true);
        var nmLayer = BuildTextLayer('', guidelayerComp, nmPos, font, fontSize, 0, 'Project', true);
        tcLayer.text.sourceText.expression = "timeToTimecode();";
        nmLayer.text.sourceText.expression = "comp('{0}').layer('{1}').text.sourceText;".format(STR.dashboardComp, SYSTXTL.projectName);
    }
    
    function buildToolkittedPrecomps () {
        var layout = getLocalJson('logosheet');
        // get required scene objects
        // ADD PROPER ERROR HANDLING
        var logo_sheet = getItem(STR.logosheetComp);
        if (logo_sheet === undefined){ return false; }
        var logo_sheet_bin = getItem( STR.toolkitsBin, FolderItem );
        if (logo_sheet_bin === undefined)
            logo_sheet_bin = app.project.items.addFolder( STR.toolkitsBin );

        // Begin creating the comps
        // keep a running list of the skipped comps
        var skipped = [];
        for (c in layout){
            if (!layout.hasOwnProperty(c)) continue;
            if (c === "ESPN_META")
                continue;
            var comp = getItem(c);
            if (comp !== undefined){
                skipped.push(comp.name);
                continue;
            }
            comp = app.project.items.addComp(c, layout[c]["Size"][0], layout[c]["Size"][1], 1.0, 60, 59.94);
            comp.parentFolder = logo_sheet_bin;
            layer = comp.layers.add(logo_sheet);
            layer.position.setValue(layout[c]["Pos"]);
            layer.anchorPoint.setValue(layout[c]["Anx"]);
            layer.scale.setValue(layout[c]["Scl"]);
            layer.collapseTransformation = true;

        }
        if (skipped.length > 0)
            alert('These comps already existed in the project, and were not created: ' + skipped.join('\n'));
    }

    function loadTeamAssets () {
        function AIFile (fileObj) {
            if (fileObj.name.indexOf('.ai') > -1)
                return true;
        }
        
        var logosheetComp = getItem(STR.logosheetComp);
        var logosheetsBin = getItem(STR.logosheetsBin, FolderItem);
        
        if (logosheetComp === undefined){
            alert(ERR.TL_COMP);
            return false;
        }
        if (logosheetsBin === undefined){
            alert(ERR.TL_BIN);
            return false;
        }
        if (logosheetsBin.numItems >= 1){
            return false
        }
        
        // get first team in folder
        var teamFolder = new Folder( M.settings["Team Logo Sheets Folder"] );
        var firstFile = teamFolder.getFiles(AIFile)[0];
        // boilerplate
        var imOptions = new ImportOptions();
        imOptions.file = firstFile;
        imOptions.sequence = false;
        imOptions.importAs = ImportAsType.FOOTAGE;
        // import the file, parent it and add it to the comp
        var aiFile = app.project.importFile(imOptions);
        aiFile.parentFolder = logosheetsBin;
        var lyr = logosheetComp.layers.add(aiFile);
        lyr.collapseTransformation = true;
        
        return true;
    }
        
    /*********************************************************************************************
    ASSET SWITCHERS
    *********************************************************************************************/
    function switchTeam () {
        /*
         * Gather up and validate all the required AE objects
         */
        // find the "Team Logo Sheets" bin
        var logoBin = getItem(STR.logosheetsBin, FolderItem);
        // check for a single logo bin in the project window
        if (logoBin === undefined){
            alert( ERR.TL_BIN );
            return false;
        } // check how many items are in there
        if ((logoBin.numItems > 1) || (logoBin.numItems == 0)){
        } else {
            // get the first one
            var logoSheet = logoBin.item(1);
        }
        // find the team logo sheet master switching comp
        var dashComp = getItem( STR.dashboardComp );
        var textLayers = {};
        if (dashComp === undefined){
            alert( ERR.DASHBOARD );
            return false;
        }
        // find the team logos folder on the server
        var teamLogoFolder = M.settings['Team Logo Sheets Folder'];
        teamLogoFolder = new File( teamLogoFolder );
        if (!teamLogoFolder.exists){
            alert( ERR.TL_FOLDER );
            return false;
        }
        // find the new team slick
        var newLogoSheet = new File( '{0}/{1}.ai'.format(teamLogoFolder.fullName, M.teamName) );
        if (!newLogoSheet.exists){
            alert(( ERR.TL_SHEET +'\n'+ M.teamName));
            return false;
        }

        /*
         * Get the Team() object ready
         */
        /*
         * Do the thing!
         */
        // switch team text layers
        /*for (tl in TEAMTXTL){
            if (!TEAMTXTL.hasOwnProperty(tl)) continue;
            dashComp.layer(TEAMTXTL[tl]).property("Text").property("Source Text").setValue(M[tl]);
        }*/
        dashComp.layer('TEAM NAME').property('Text').property('Source Text').setValue(M.teamString);
        dashComp.layer('NICKNAME').property('Text').property('Source Text').setValue(M.nickname);
        dashComp.layer('LOCATION').property('Text').property('Source Text').setValue(M.location);
        dashComp.layer('TRICODE').property('Text').property('Source Text').setValue(M.tricode);
        
        // replace the logo slick
        logoSheet.replace(newLogoSheet);
        // run auto-trace if enabled
        if (M.traceOnSwitch) AutoTraceAll();
        
        return true;
    }
    
    function switchShow () {}
    
    function switchSponsor () {}

    function switchCustomText () {
        var dashComp = getItem(STR.dashboardComp);
        if (dashComp === undefined){
            alert(ERR.TL_COMP);
            return false;
        }
        for (tl in CUSTXTL){
            if (!CUSTXTL.hasOwnProperty(tl)) continue;
            dashComp.layer(CUSTXTL[tl]).property("Text").property("Source Text").setValue(M[tl]);
        } return true;
    }
    
    /*********************************************************************************************
    BATCHING OPERATIONS
    *********************************************************************************************/
    function batchAllTeams() {
        ClearBatFile();
        var tmp = M.traceOnSwitch;
        for (t in M.teamList){
            M.useTricode = true;
            //if (!M.teamList.hasOwnProperty(t)) continue;
            if (M.teamList[t] === 'NULL') continue;
            if (M.teamList[t] === 'Alabama') break;

            M.teamName = M.teamList[t];
            M.traceOnSwitch = true;
            AssembleTeamData();

            SwitchTeam();
            
            //PushUI();
            //PushScene();
            RefreshNamingOrder();
            AssembleProjectPaths();
            AssembleFilePaths();
            
            ClearRenderQueue();
            GetRenderComps();
            AddRenderCompsToQueue();
            SaveWithBackup();
            AddProjectToBatFile();
        }
        M.traceOnSwitch = tmp;
    }
    
    /*********************************************************************************************
    RENDER QUEUEING
    *********************************************************************************************/
    function getRenderComps (wip) {
        (wip === undefined) ? wip = false : wip = true;
        // prep objects 
        M.renderComps = [];
        var renderCompBin = getItem(STR.renderCompBin, FolderItem);
        M.outputDir  = M.projectDir + '/qt_final/';
        // check for the bin with the render comps
        if (!renderCompBin){
            alert(ERR.RC_BIN);
            return false;
        }
        // array all render comps
        for (var i=1; i<=renderCompBin.items.length; i++){
            M.renderComps.push(renderCompBin.items[i]);
        }               
        // extra steps to prepare "WIP" versions of render comps
        if (wip) {
            // check for the destination bin for WIP render comps
            var wipRenderCompBin = getItem(STR.wipRenderCompBin, FolderItem);
            if (!wipRenderCompBin){
                alert(ERR.RC_BIN);
                return false;
            }
            while(true){
                try { wipRenderCompBin.items[1].remove(); }
                catch(e) { break; }
            }            
            // find the WIP template comp
            var wipRenderTemplate = getItem(STR.guidelayerComp);
            // redirect render output to WIP folder
            M.outputDir  = M.projectDir + '/qt_wip/';
            for (var i in M.renderComps){
                // duplicate the WIP template
                var wipComp = wipRenderTemplate.duplicate();
                // add the render comp to the duped template
                var c = wipComp.layers.add(M.renderComps[i]);
                c.moveToEnd();
                wipComp.duration = M.renderComps[i].duration;
                exp = """project = comp('{0}').layer('{1}').text.sourceText;\
scene = comp('{0}').layer('{2}').text.sourceText;\
if (scene != '') (project + '_' + scene) else project;""".format(STR.dashboardComp, SYSTXTL.projectName, SYSTXTL.sceneName);
                wipComp.layer('Project').text.sourceText.expression = exp;
                // move it to the WIP bin
                wipComp.parentFolder = wipRenderCompBin;
                // add a timestamp to the comp name
                wipComp.name = M.renderComps[i].name + Timestamp();
                // replace the comp in the array with the wip version
                M.renderComps[i] = wipComp;
            }
        }
    }
    
    function addRenderCompsToQueue () {
        var movName;
        // deactivate all current items
        var RQitems = app.project.renderQueue.items;
        for (var i=1; i<=RQitems.length; i++){
            try {
                RQitems[i].render = false;
            } catch(e) { null; }
        }
        for (c in M.renderComps){
            var rqi = RQitems.add( M.renderComps[c] );
            rqi.outputModules[1].applyTemplate("QT RGBA STRAIGHT");
            if ((M.outputDir == '/qt_final/') || (M.outputDir == '/qt_wip/'))
                return;
            else {
                movName = M.renderComps[c].name;
                RefreshNamingOrder();
                for (n in M.namingOrder){
                    if (M.namingOrder[n][0] === true)
                        movName = "{0}_{1}".format(movName, M.namingOrder[n][1].split(' ').join('_'));
                }
                rqi.outputModules[1].file = new File (M.outputDir + movName); 
            }
        }
    }

    function addProjectToBatch () {
        // opens the bat file, adds a new line with the scene, and closes it
        var aepFile = app.project.file.fsName.toString();
        var execStr = "\"C:\\Program Files\\Adobe\\Adobe After Effects CC 2015\\Support Files\\aerender.exe\" -mp -project \"{0}\"".format(aepFile);
        M.batFile.open("a");
        try{
            M.batFile.writeln(execStr);            
        } catch(e) { 
            null;
        } finally {
            M.batFile.close();
        }  
    }
    
    function openBatchForEditing () {
        // opens the bat file for editing in notepad
        var execStr = "start \"\" notepad {0}".format(M.batFile.fsName.toString());
        M.editBat.open("w");
        M.editBat.write(execStr);
        M.editBat.execute();
        
    }
    
    function runBatch () {
        // executes the bat file
        M.batFile.execute();
    }
    
    function startNewBatch () {
        M.batFile.open("w");
        M.batFile.close();
    }
    
    /*********************************************************************************************
    AUTO-TRACE TOOL
    *********************************************************************************************/
    function autoTrace (comp){
        if (comp === undefined) var comp = app.project.activeItem;
        if (!IsTraceable(comp)) return alert('Comp is not set up for auto-trace.');
        var slayer = CreateShapeLayerFromAlpha(comp);
        SetShapeLayerParameters(slayer);
        return true;
    }

    function autoTraceAll (){
        // store active comp
        //dlg.active = false;
        var activeComp = app.project.activeItem;
        var traceComps = GetTraceableComps();
        for (c=0; c<traceComps.length; c++){
            AutoTraceThis(traceComps[c]);
        }
        // restore active comp
        activeComp.openInViewer();
        return true;
    }

    function setupCompForAutoTrace (){
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

    function projectReport (){
        var res = "The following comps are ready for Auto-trace:\n";
        var comps = GetTraceableComps();
        for (c in comps){
            res += comps[c].name + "\n";
        }
        return (alert(res));
    }
    
    function isTraceable (comp, silent){
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

    function getTraceableComps (){
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

    function scrubAutomatedLayers (comp){
        var scrubLayers = new Array();
        for (i=1; i<=comp.layers.length; i++){
            if (comp.layer(i).name.indexOf('!Auto-traced') > -1){
                scrubLayers.push(comp.layer(i));
            }
        }
        if (scrubLayers.length) {
            for (L in scrubLayers){
                if (!scrubLayers.hasOwnProperty(L)) continue;
                scrubLayers[L].remove();
            }
        }
        return comp;
    }

    function createShapeLayerFromAlpha (comp) {
        comp.openInViewer();
        app.executeCommand(2004); // Deselect all...
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
        //shapeLayer.moveBefore(masksLayer);

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

    function autoTraceLayer (alphaLayer){
        alphaLayer.enabled = true;
        var thisComp = alphaLayer.containingComp;
        var tracedLayer = alphaLayer.duplicate();
        tracedLayer.selected = true;
        M.enterHack.execute();
        app.executeCommand(3044); // Auto-trace ...
        //alert(tracedLayer.name);
        //tracedLayer.moveBefore(alphaLayer);
        tracedLayer.name = "!Auto-traced Layer";
        alphaLayer.enabled = false;
        return tracedLayer;
    }

    function setShapeLayerParameters (shapeLayer) {
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
            if (!staticProperties.hasOwnProperty(p)) continue;
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
            if (!expressionLinkedProperties.hasOwnProperty(p)) continue;
            var props = expressionLinkedProperties[p];
            var tarProp = shapes.property(props[0]).property(props[1]);
            var exp = 'thisComp.layer("Trace Params").effect("' + props[2] + '")("Slider")';
            if (tarProp.canSetExpression){
                tarProp.expression = exp;
                tarProp.expressionEnabled = true;
            }
        }

    }

    function addAutoTraceProjectBin (){
        var bin = getItem('Auto-Trace', FolderItem);
        if (!bin) bin = app.project.items.addFolder("Auto-Trace")
        return bin;
    }

    function addTraceParamsLayer (){
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
    
    /*********************************************************************************************
    UI LAYOUT
    *********************************************************************************************/    
    function ESPNToolsUI (thisObj) {
		var onWindows = ($.os.indexOf("Windows") !== -1);
		var dlg = (thisObj instanceof Panel) ? thisObj : new Window("palette", 'ESPNTools', undefined, {resizeable:true});
        
		if (dlg !== null) {
            // Load resource
            var res = new File((new File($.fileName).parent.toString()) + '/ESPNTools.res');
            res.open('r');
            dlg.grp = dlg.add(res.read());
            // Boilerplate
            dlg.layout.layout(true);
            //dlg.grp.minimumSize = dlg.grp.size;
            dlg.grp.minimumSize = [100,0];
            dlg.layout.resize();
            dlg.onResizing = dlg.onResize = function () { this.layout.resize(); } 
            
            dlg.grp.tabs.setup.createTemplate.onClick = buildProjectTemplate;
        }
		return dlg;
	}

    /*********************************************************************************************
    UI INSTANCING AND INITIALIZATION
    *********************************************************************************************/   
	var dlg = ESPNToolsUI(thisObj);
    if (dlg !== null){
        // WINDOW instance
        if  (dlg instanceof Window){
            dlg.center();
            dlg.show();
        } 
        // PANEL instance
        else
            dlg.layout.layout(true);
    }
    initialize();
    /// TEMPORARY SWITCHES
    dlg.grp.tabs.setup.useExisting.cb.value = true;
    dlg.grp.tabs.setup.projectName.pick.visible = true;
    dlg.grp.tabs.setup.projectName.edit.visible = false;

})(this);