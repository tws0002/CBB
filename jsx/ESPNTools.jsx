// Auto-trace tools for ESPN CBB'17
// Version 1.1 -- 5/23/2017
// mark.rohrer@espn.com
#target aftereffects

$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/espnCore.jsx');

/*********************************************************************************************
 * ESPNTools
 * Self-executing ScriptUI panel integrating espnCore.jsx metadata objects into AfterEffects
 ********************************************************************************************/ 
(function ESPNTools(thisObj)
{	
    // liveScene is a SceneData object that is always a writeable location on cagenas
    var liveScene;
    // tempScene is a SceneData object used as a buffer to test and verify user input
    var tempScene;
    // nullScene is always kept empty to speed up unloading
    var nullScene;
    
    // the number of custom assets to search for when switching
    var NUM_CUSTOM_ASSETS = 5;
    
    // Locations for render .bat files
    var RENDER_BAT_FILE = new File("~/aeRenderList.bat");
    var EDIT_BAT_FILE   = new File("~/editRenderList.bat");

    /*********************************************************************************************
     * INITIALIZERS
     * These functions set the initial state of the UI under various conditions.
     ********************************************************************************************/  
    /*
     * This function is a setup init that checks the current scene and redirects to an appropriate
     * initializer for that scene's current state.
     */
    function initialize () {
        liveScene = new SceneData('NULL','ae');
        tempScene = liveScene;
        nullScene = liveScene;
        // Attempt to pull the scene tag and construct a scene object
        try {
            var tagString = getItem('0. Dashboard').comment;
            tempScene.setFromTag(tagString);
            // prevalidate sets more precise STATUS flags
            tempScene.prevalidate();
        } catch(e) {
            //tempScene = new SceneData ('NULL','ae');
            tempScene.status = STATUS.UNDEFINED;
        }
        // If the tagdata passes validation, load it as a live scene
        if ( tempScene.status === STATUS.OK ||
             tempScene.status === STATUS.OK_WARN ){
            // This scene has valid data and is ready to go. Update the UI with its info
            // Set the buffered scene to live
            liveScene = tempScene;
            // Populate the UI with the active data
            initializeFromLiveScene();
        // Otherwise load a blank template
        } else if (tempScene.status === STATUS.NO_DEST) {
            liveScene = tempScene;
            initializeFromLiveScene();
            // TODO -- WARNING -- THIS PROJECT'S ORIGINAL FILE LOCATION IS NO LONGER VALID. PLEASE RE-SAVE IMMEDIATELY
        }
        else {
            initializeNewProject(); 
        }
    }
    /*
     * When the scene is already in the pipeline, this updates the UI with the livescene metadata.
     */
    function initializeFromLiveScene () {
        populateProductionsDropdown();
        setProductionMenu(liveScene.prod.name);
        
        populateProjectsDropdown();
        setProjectMenu(liveScene.project);
        setNameMenu(liveScene.name); 
        
        populateTeamsDropdown();
        setHomeTeamMenu(liveScene.teams[0].id);
        setAwayTeamMenu(liveScene.teams[1].id);
        
        populateExpressionsDropdown();
        
        //populateShows();
        //setShow(liveScene.show);
        
        //populateSponsors();
        //setSponsor(liveScene.sponsor);
        
        setCustomTextMenu(
            liveScene.customA,
            liveScene.customB,
            liveScene.customC,
            liveScene.customD
        );
        setNamingFlagsCheckboxes(
            [liveScene.use_tricode,
             liveScene.use_show,
             liveScene.use_customA,
             liveScene.use_customB,
             liveScene.use_customC,
             liveScene.use_customD]
        );
    }
    /*
     * When a scene is loaded that's not in the pipeline, the only thing populated is the 
     * production selection dropdown. The rest of the information is cleared.
     */    
    function initializeNewProject () {
        setEmptyMenus();
        populateProductionsDropdown();
    }

    /*********************************************************************************************
     * POPULATE FUNCTIONS FOR UI DROPDOWNS
     * These functions are used to populate dropdowns and fields when called
     ********************************************************************************************/
    /*
     * Adds productions to the dropdown menu
     */  
    function populateProductionsDropdown () {
        var element = dlg.grp.tabs.setup.production.dd;
        element.removeAll();
        element.add("item", undefined);
        var prodList = getActiveProductions();
        for (i in prodList){
            if (!prodList.hasOwnProperty(i)) continue;
            element.add("item", prodList[i]);
        } 
    }
    /*
     * Adds this production's projects to the dropdown menu
     * @param {boolean} useTempScene - Set this to true to load projects from the tempScene instead.
     * (This flag is only used when the user changes the production in the UI.)
     */  
    function populateProjectsDropdown (useTempScene) {
        var element = dlg.grp.tabs.setup.projectName.pick.dd;
        element.removeAll();
        if (!useTempScene || useTempScene === undefined) {
            var projList = getAllProjects(liveScene.prod.name);
        } else {
            var projList = getAllProjects(tempScene.prod.name);
        }
        for (i in projList){
            if (!projList.hasOwnProperty(i)) continue;
            element.add("item", projList[i]);
        }
    }
    /*
     * Adds this production's teams to the home team dropdown menu
     */  
    function populateTeamsDropdown (useTempScene) {
        var home = dlg.grp.tabs.version.div.fields.team.dd;
        var away = dlg.grp.tabs.version.div.fields.away.dd;
        
        home.removeAll();        
        away.removeAll();
        
        if (!useTempScene || useTempScene === undefined){
            liveScene.prod.loadTeamData();
            for (i in liveScene.prod.teamlist){
                if (!liveScene.prod.teamlist.hasOwnProperty(i)) continue;
                home.add("item", liveScene.prod.teamlist[i]);
                away.add("item", liveScene.prod.teamlist[i]);
            }
        } else {
            tempScene.prod.loadTeamData();
            for (i in tempScene.prod.teamlist){
                if (!tempScene.prod.teamlist.hasOwnProperty(i)) continue;
                home.add("item", tempScene.prod.teamlist[i]);
                away.add("item", tempScene.prod.teamlist[i]);
            }
        }
    }
    /*
     * Adds this production's shows to the dropdown menu
     */  
    function populateShowsDropdown () {}
    /*
     * Adds this production's sponsors to the dropdown menu
     */ 
    function populateSponsorsDropdown () {}
    /*
     * Adds this production's expressions presets to the dropdown menu
     */
    function populateExpressionsDropdown () {
        var menu = dlg.grp.tabs.toolkit.expPick;
        var exps = liveScene.prod.getPlatformData()["Expressions"];
        var list = [];
        menu.removeAll();
        for (k in exps){
            if (!exps.hasOwnProperty(k)) continue;
            list.push(k);
        }
        list = list.sort();
        for (i in list){
            if (!list.hasOwnProperty(i)) continue;
            menu.add("item", list[i]);
        }
    }
    
    /*********************************************************************************************
     * SETTERS FOR UI FIELDS
     * These functions set the values of fields and dropdowns based on whatever is in the
     * liveScene object
     ********************************************************************************************/
    /*
     * Clears all the menus (dropdowns, text fields, and checkboxes) *except* for the production
     * dropdown list -- since that doesn't change very often.
     */
    function setEmptyMenus () {
        // dropdowns
        //dlg.grp.tabs.setup.production.dd.removeAll();
        dlg.grp.tabs.setup.projectName.pick.dd.removeAll();
        dlg.grp.tabs.version.div.fields.team.dd.removeAll();
        //dlg.grp.tabs.version.div.fields.away.dd.removeAll();
        // +sponsors
        // +shows       
        // text fields
        dlg.grp.tabs.setup.sceneName.e.text = "";
        dlg.grp.tabs.version.div.fields.customA.et.text = "";
        dlg.grp.tabs.version.div.fields.customB.et.text = "";
        dlg.grp.tabs.version.div.fields.customC.et.text = "";
        dlg.grp.tabs.version.div.fields.customD.et.text = "";
        // set useExisting initial state
        dlg.grp.tabs.setup.useExisting.cb.value = true;
        dlg.grp.tabs.setup.projectName.pick.visible = true;
        dlg.grp.tabs.setup.projectName.edit.visible = false;
        // turn off naming inclusion checkboxes
        dlg.grp.tabs.version.div.checks.cbT.value = false;
        dlg.grp.tabs.version.div.checks.cbS.value = false;
        dlg.grp.tabs.version.div.checks.cbA.value = false;
        dlg.grp.tabs.version.div.checks.cbB.value = false;
        dlg.grp.tabs.version.div.checks.cbC.value = false;
        dlg.grp.tabs.version.div.checks.cbD.value = false;        
    }
    /*
     * Sets the production dropdown to the passed production id
     * @param {string} prod - The production's id key
     */
    function setProductionMenu ( prod ){
        var prodList = getActiveProductions();
        var i = prodList.indexOf(prod);
        if (i === -1){
            //TODO -- ERROR -- COULD NOT SET PRODUCTION DROPDOWN
            dlg.grp.tabs.setup.production.dd.selection = 0;
        } else {
            // +1 because i added an empty spot at 0
            dlg.grp.tabs.setup.production.dd.selection = i+1;
        }
    }
    /*
     * Sets the project dropdown to the passed project name
     * @param {string} proj - The project name
     */    
    function setProjectMenu ( proj ){
        var i = getAllProjects(liveScene.prod.name).indexOf(proj);
        if (i === -1){
            //TODO -- ERROR
        } else {
            dlg.grp.tabs.setup.projectName.pick.dd.selection = i;
        }
    }
    /*
     * Sets the scene name text field to the passed name
     * @param {string} name - The scene name
     */      
    function setNameMenu ( name ) {
        if (name !== undefined);
        dlg.grp.tabs.setup.sceneName.e.text = name;
    }
    /*
     * Sets the home team dropdown field to the passed team key id
     * @param {string} team - The team id requested
     */    
    function setHomeTeamMenu ( team ){
        var i = liveScene.prod.teamlist.indexOf(team);
        if ( i === -1){
        } else {
            dlg.grp.tabs.version.div.fields.team.dd.selection = i;
        }
    }
    /*
     * Sets the away team dropdown field to the passed team key id
     * @param {string} team - The team id requested
     */    
    function setAwayTeamMenu ( team ){
        var i = liveScene.prod.teamlist.indexOf(team);
        if ( i === -1){
        } else {
            dlg.grp.tabs.version.div.fields.away.dd.selection = i;
        }
    }
    /*
     * Sets the custom text fields in the UI
     * @param {string} a,b,c,d - Strings for custom text fields A thru D (all 4 required in order)
     */    
    function setCustomTextMenu (a,b,c,d) {
        dlg.grp.tabs.version.div.fields.customA.et.text = a;
        dlg.grp.tabs.version.div.fields.customB.et.text = b;
        dlg.grp.tabs.version.div.fields.customC.et.text = c;
        dlg.grp.tabs.version.div.fields.customD.et.text = d;
    }
    /*
     * Sets the naming flag checkboxes (the ones in the versioning tab)
     * @param {(Array(bool) || bool), [idx]} values - The boolean values of the checkboxes in order
     */
    function setNamingFlagsCheckboxes ( values ) {
        var namingFlagsGrp = dlg.grp.tabs.version.div.checks;
        try {
            namingFlagsGrp.cbT.value = values[0];
            namingFlagsGrp.cbS.value = values[1];
            namingFlagsGrp.cbA.value = values[2];
            namingFlagsGrp.cbB.value = values[3];
            namingFlagsGrp.cbC.value = values[4];
            namingFlagsGrp.cbD.value = values[5];  
        } catch (e) {
            var m = 'Could not set naming flags checkboxes.\nvalue passed: {0}\nidx passed: {1}'.format(values, idx);
            alert (m);
        }
    };
    
    /*********************************************************************************************
     * THINGS-HAVE-CHANGED (IN THE UI) FUNCTIONS
     * These functions are called whenever the user updates something in the UI. In the case of
     * changedProduction and changedProject (which have major disk implications) the tempScene
     * object is changed, and must be validated before passing to the liveScene. In the case of
     * teams, custom text, etc -- the liveScene object is directly modified.
     ********************************************************************************************/
    /*
     * Changing the production is a big deal. The UI is cleared and this is the only time the 
     * project list loads from the tempScene instead of the liveScene.
     */ 
    function changedProduction () {
        var prod_id = dlg.grp.tabs.setup.production.dd.selection;
        tempScene.setProduction(prod_id.toString());
        setEmptyMenus();
        populateProjectsDropdown(true);
        populateTeamsDropdown(true);
        populateShowsDropdown();
        populateSponsorsDropdown();
        populateExpressionsDropdown();
    }
    /*
     * This function both updates the tempScene when the project name is changed AND changes the 
     * visibility of the project selection fields (swaps the dropdown and the text box) when the 
     * "Use Existing" checkbox is clicked.
     */
    function changedProject () {
        var useExisting = dlg.grp.tabs.setup.useExisting.cb.value;
        
        var projectDropdown = dlg.grp.tabs.setup.projectName.pick;
        var projectEditText = dlg.grp.tabs.setup.projectName.edit;
        
        if (useExisting){
            projectDropdown.visible = true;
            projectEditText.visible = false;
            
            tempScene.setProject(projectDropdown.dd.selection.toString());
            
        } else {
            projectDropdown.visible = false;
            projectEditText.visible = true;
            
            tempScene.setProject(projectEditText.e.text);
        }
    }
    /*
     * Updates the tempScene.name data when the text field is changed
     */    
    function changedProjectName () {
        var nameText = dlg.grp.tabs.setup.sceneName.e.text;

        tempScene.setName(nameText);
    }
    /*
     * Updates the all tempScene custom text data when the text fields are changed
     */     
    function changedCustomText () {
        var textA = dlg.grp.tabs.version.div.fields.customA.et.text;
        var textB = dlg.grp.tabs.version.div.fields.customB.et.text;
        var textC = dlg.grp.tabs.version.div.fields.customC.et.text;
        var textD = dlg.grp.tabs.version.div.fields.customD.et.text;
        
        tempScene.setCustom('A', textA);
        tempScene.setCustom('B', textB);
        tempScene.setCustom('C', textC);
        tempScene.setCustom('D', textD);
        
        switchDashboardTag();
    }
    /*
     * Updates the tempScene.teams[0] data when the dropdown is changed
     */      
    function changedHomeTeam () {
        var teamid = dlg.grp.tabs.version.div.fields.team.dd.selection;
        liveScene.setTeam(0, teamid.toString());
        switchTeam(0);
        switchCustomAssets('team');
        switchDashboardTag();
    }
    /*
     * Updates the tempScene.teams[0] data when the dropdown is changed
     */   
    function changedAwayTeam () {
        var teamid = dlg.grp.tabs.version.div.fields.away.dd.selection;
        liveScene.setTeam(1, teamid.toString());
        switchTeam(1);
        switchCustomAssets('away');
        switchDashboardTag();
    }
    /*
     * Updates the tempScene.show data when the dropdown is changed
     */      
    function changedShow () {}
    /*
     * Updates the tempScene.sponsor data when the dropdown is changed
     */        
    function changedSponsor () {}
    /*
     * Updates the tempScene file naming inclusion data when the checkboxes are changed
     */  
    function changedNamingFlags () {
        var namingFlagsGrp = dlg.grp.tabs.version.div.checks;
        
        var useTricode = namingFlagsGrp.cbT.value;
        var useShowid  = namingFlagsGrp.cbS.value;
        var useCustomA = namingFlagsGrp.cbA.value;
        var useCustomB = namingFlagsGrp.cbB.value;
        var useCustomC = namingFlagsGrp.cbC.value;
        var useCustomD = namingFlagsGrp.cbD.value;
        
        liveScene.setNameFlags( useTricode,
                                useShowid,
                                useCustomA,
                                useCustomB,
                                useCustomC,
                                useCustomD  );
        switchDashboardTag();
    }
    
    /*********************************************************************************************
     * VALIDATION / FOLDER CREATION / FILE SAVING
     * These functions will validate the tempScene object, allow the tempScene to be pushed live,
     * set the scene tag on the project file, create project folders (if necessary) and save the 
     * project file.
     ********************************************************************************************/
    /*
     * This function is called to test the user's input and attempt to push the tempScene into
     * the liveScene. If this is successful, the scene is tagged and ready to be written to the
     * server (or run switching and automation commands.)
     * @returns {bool}
     */
    function pushTempToLive () {
        tempScene.prevalidate();
        if ( tempScene.status === (STATUS.NO_DEST) ){
            // create a destination folder for the scene
            alert('Temp alert -- create new project folder? (You can\'t say no! Sorry!)');
            createProject(tempScene);
            // override the status to force another check
            tempScene.status = STATUS.CHECK_DEST;
            // .. and confirm that the location now exists
            tempScene.prevalidate();
        } 
        var success;
        if ( tempScene.status === STATUS.OK ||
             tempScene.status === STATUS.OK_WARN ||
             tempScene.status === STATUS.UNSAVED ) {
            try {
                liveScene = tempScene;
                switchDashboardTag();
                success = true;
            } catch(e) { alert(e.message); }
        } else {
            alert('nah.');
            //TODO -- ERROR
            success = false;
        }
        return success;
    }
    /*
     * When the liveScene is ready to be synchronized to AfterEffects and saved to the network,
     * this function pushes the tempScene to the liveScene, verifies that the handoff was successful,
     * prompts the user for overwrite confirmation (if necessary). Once that's done, it saves the
     * file (and its backup) to the network. 
     */
    function saveWithBackup () {
        var sync = pushTempToLive();
        if (!sync || liveScene.status === (STATUS.NO_DEST || STATUS.CHECK_DEST || STATUS.UNDEFINED)) {
            alert('Couldn\'t save -- error goes here');
            // TODO -- ERROR
            return false;
        }
        // STATUS.OK_WARN means that the save location is valid, but there's an existing file there.
        // Therefore the user must confirm that this is what they want to do.
        if ( liveScene.status === STATUS.OK_WARN ){
            alert('Save overwrite warning goes here');
            // TODO -- CONFIRM DIALOG
        }
        // Final check for correct status flags -- 
        if ( liveScene.status === STATUS.OK || 
             liveScene.status === STATUS.OK_WARN ){
            // get a filename for the scene
            var aepFile = new File(liveScene.getFullPath()['primary']);
            // save the file
            app.project.save(aepFile);
            // make a copy of the file as a backup
            try {
                aepFile.copy( liveScene.getFullPath()['backup'] );
            } catch (e) { 
                alert('Backup not saved!\n'+e.message);
            }/**/
            return true;
        } else return false;
    }

    /*********************************************************************************************
    TEMPLATE BUILDERS
    *********************************************************************************************/    
    function buildProjectTemplate () {
        // Check for platform-specific JSON & load it if necessary
        var templateData = liveScene.prod.getPlatformData()['Template'];
        // Build the bin/folder tree from JSON
        buildProjectFromJson( templateData );
        buildDashboard();
        buildGuidelayer();
        loadTeamAssets();
        loadCustomAssets();
        buildToolkittedPrecomps();
    }
    
    function buildDashboard () {
        var font = "Tw Cen MT Condensed";
        var posBig = [65,150,0];
        var posSm = [65,80,0];
        var ypi = 80;
        var fontSizeBig = 50;
        var fontSizeSm = 20;

        try {
            var dashboard = getItem( liveScene.templateLookup('dashboard') );
            var textLayers = [
                "TEST 1",
                "TEST 2",
                "TEST 3"
            ];
            // background solid
            if (!(dashboard.layer('BACKGROUND'))){
                var bgnd = dashboard.layers.addSolid([0.17,0.17,0.17], 'BACKGROUND', 1920, 1080, 1.0, 60);
                bgnd.locked = true;
            }
            // text layers
            for (var tl in textLayers){
                if (!textLayers.hasOwnProperty(tl)) continue;
                if (!(dashboard.layer((textLayers[tl]) + ' Label')))
                    buildTextLayer(textLayers[tl], dashboard, posSm, font, fontSizeSm, 0, (textLayers[tl] + ' Label'), true)
                if (!(dashboard.layer(textLayers[tl])))
                    buildTextLayer(textLayers[tl], dashboard, posBig, font, fontSizeBig, 0, textLayers[tl], true)
                posBig[1] += ypi;
                posSm[1] += ypi;
            }
        } catch (e) {
            alert (e.message);
        }        
    }
    
    function buildGuidelayer () {
        var font = "Tw Cen MT Condensed";
        var fontSize = 67;
        var tcPos = [1651, 1071];
        var nmPos = [93.7, 1071];
        
        var guidelayerComp = getItem( liveScene.templateLookup('bottomline') );
        var guidelayerBin  = getItem( liveScene.templateLookup('guides_bin'), FolderItem );
        var botline        = getItem('Bottomline.tga', FootageItem);
        if (!botline) {
            try {
                var imOptions = new ImportOptions();
                imOptions.file = new File( getGlobalAssets()['bottomline'] );
                imOptions.sequence = false;
                imOptions.importAs = ImportAsType.FOOTAGE;
                botline = app.project.importFile(imOptions);
                botline.parentFolder = guidelayerBin;                
            } catch (e) {
                alert(e.message);
            }
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
        var tcLayer = buildTextLayer('', guidelayerComp, tcPos, font, fontSize, 0, 'Timecode', true);
        var nmLayer = buildTextLayer('', guidelayerComp, nmPos, font, fontSize, 0, 'Project', true);
        //tcLayer.text.sourceText.expression = "timeToTimecode();";
        //nmLayer.text.sourceText.expression = "comp('{0}').layer('{1}').text.sourceText;".format("0. Dashboard", "PROJECT NAME");
    }
    
    function buildToolkittedPrecomps () {
        // get required scene objects
        // ADD PROPER ERROR HANDLING
        var homeLogosheetComp = getItem( liveScene.templateLookup('teamsheet') );
        var awayLogosheetComp = getItem( liveScene.templateLookup('awaysheet') );
        if (( homeLogosheetComp || awayLogosheetComp ) === undefined) { return false; }
        
        var precompsBin = getItem( liveScene.templateLookup('precomps_bin'), FolderItem );
        if (precompsBin === undefined) { return false; }
        
        var layout = liveScene.prod.getPlatformData()['Team Logosheet'];
        
        function buildComps(layout, sheet, bin, tag) {
            //(tag === undefined) ? tag = '' : tag = null;
            
            for (c in layout){
                if (!layout.hasOwnProperty(c)) continue;
                
                var name = "{0} {1}".format(tag, c);
                
                var comp = getItem(name);
                if (comp !== undefined){
                    continue;
                }
                comp = app.project.items.addComp(name, layout[c]["Size"][0], layout[c]["Size"][1], 1.0, 60, 59.94);
                comp.parentFolder = bin;
                layer = comp.layers.add(sheet);
                layer.position.setValue(layout[c]["Pos"]);
                layer.anchorPoint.setValue(layout[c]["Anx"]);
                layer.scale.setValue(layout[c]["Scl"]);
                layer.collapseTransformation = true;
            }
        }
            
        // Begin creating the comps
        buildComps( layout, homeLogosheetComp, precompsBin, 'HOME' );
        buildComps( layout, awayLogosheetComp, precompsBin, 'AWAY' );
        
        if (skipped.length > 0)
            alert('These comps already existed in the project, and were not created: ' + skipped.join('\n'));
    }

    function loadTeamAssets () {
        function AIFile (fileObj) {
            if (fileObj.name.indexOf('.ai') > -1)
                return true;
        }
        
        if (liveScene.prod.name === "NULL") return false;
        
        var homeLogosheetComp = getItem( liveScene.templateLookup('teamsheet') );
        var awayLogosheetComp = getItem( liveScene.templateLookup('awaysheet') );
        
        var homeLogosheetBin = getItem( liveScene.templateLookup('teams0_bin'), FolderItem );
        var awayLogosheetBin = getItem( liveScene.templateLookup('teams1_bin'), FolderItem );
        
        if (!homeLogosheetComp || !awayLogosheetComp){
            return false;
        }
        if (!homeLogosheetBin || !awayLogosheetBin){
            return false;
        }
        if (homeLogosheetBin.numItems >= 1 || awayLogosheetBin.numItems >= 1){
            return false
        }
        
        // get first team in folder
        var teamFolder = new Folder( liveScene.getFolder("teamlogos2d") );
        var firstFile = teamFolder.getFiles(AIFile)[0];
        // boilerplate
        var imOptions = new ImportOptions();
        imOptions.file = firstFile;
        imOptions.sequence = false;
        imOptions.importAs = ImportAsType.FOOTAGE;
        
        // import the file, parent it and add it to the comp
        var aiFile = app.project.importFile(imOptions);
        aiFile.parentFolder = homeLogosheetBin;
        var lyr = homeLogosheetComp.layers.add(aiFile);
        lyr.collapseTransformation = true;
        
        var aiFile = app.project.importFile(imOptions);
        aiFile.parentFolder = awayLogosheetBin;
        lyr = awayLogosheetComp.layers.add(aiFile);
        lyr.collapseTransformation = true;
  
        return true;
    }
     
    function loadCustomAssets () {
        if (liveScene.prod.name === "NULL") return false;
        
        for (var i=1; i<=NUM_CUSTOM_ASSETS; i++) {
            try {
                var customAssetBin = getItem( liveScene.templateLookup('asset{0}_bin'.format(i)), FolderItem );
                if (!customAssetBin) continue;
                alert(liveScene.getFolder("customasset0{0}".format(i)));
                var customAssetFolder = new Folder( liveScene.getFolder("customasset0{0}".format(i)) );
                var firstFile = customAssetFolder.getFiles()[0];
                var imOptions = new ImportOptions();
                imOptions.file = firstFile;
                imOptions.sequence = false;
                imOptions.importAs = ImportAsType.FOOTAGE;

                var avitem = app.project.importFile(imOptions);
                avitem.parentFolder = customAssetBin;                
            } catch(e) { alert(e.message); }

        }
    }
    
    /*********************************************************************************************
     * SWITCH FUNCTIONS
     * These functions directly alter the loaded After Effects project, sourcing information from
     * the liveScene object *only*.
     ********************************************************************************************/
    /*
     * Sets the liveScene metadata on the pipelined scene's dashboard tag
     */
    function switchDashboardTag () {
        try {
            var dashboard = getItem('0. Dashboard');
            dashboard.comment = liveScene.getTag().toString();            
        } catch (e) {
            alert (e.message);
        }
    }
    
    function switchTeam (idx) {
        /*
         * Gather up and validate all the required AE objects
         */
        // find the "Team Logo Sheets" bin
        var logoBin = getItem( liveScene.templateLookup('teams{0}_bin'.format(idx)), FolderItem);
        // check for a single logo bin in the project window
        if (logoBin === undefined){
            return false;
        } // check how many items are in there
        if ((logoBin.numItems > 1) || (logoBin.numItems == 0)){
        } else {
            // get the first one
            var logoSheet = logoBin.item(1);
        }
        // find the team logo sheet master switching comp
        var dashComp = getItem( liveScene.templateLookup('dashboard') );
        var textLayers = {};
        if (dashComp === undefined){
            return false;
        }
        // find the team logos folder on the server
        var teamLogoFolder = new File(liveScene.getFolder( 'teamlogos2d' ));
        if (!teamLogoFolder.exists){
            return false;
        }
        // find the new team slick
        var newLogoSheet = new File( '{0}/{1}.ai'.format(teamLogoFolder.fullName, liveScene.teams[idx].name) );
        if (!newLogoSheet.exists){
             return false;
        }

        // replace the logo slick
        logoSheet.replace(newLogoSheet);

        // switch appropriate text layers
        var tag = "";
        if (idx === 0)
            tag = "";
        else if (idx === 1)
            tag = "AWAY ";
        else return true;

        dashComp.layer('{0}TEAM NAME'.format(tag)).property('Text').property('Source Text').setValue(liveScene.teams[idx].dispName);
        dashComp.layer('{0}NICKNAME'.format(tag)).property('Text').property('Source Text').setValue(liveScene.teams[idx].nickname);
        dashComp.layer('{0}LOCATION'.format(tag)).property('Text').property('Source Text').setValue(liveScene.teams[idx].location);
        dashComp.layer('{0}TRICODE'.format(tag)).property('Text').property('Source Text').setValue(liveScene.teams[idx].tricode);

        // run auto-trace if enabled
        //if (traceOnSwitch) AutoTraceAll();
        return true;
    }
    
    function switchShow () {}
    
    function switchSponsor () {}

    function switchCustomText () {
        var dashComp = getItem( liveScene.templateLookup('dashboard') );
        if (dashComp === undefined){
            return false;
        }
        var cust = ['A','B','C','D'];
        for (s in cust){
            if (!cust.hasOwnProperty(s)) continue;
            dashComp.layer('CUSTOM TEXT {0}'.format(cust[s])).property("Text").property("Source Text").setValue(liveScene["custom{0}".format(cust[s])]);
        }
        return true;
    }
    
    function switchCustomAssets (which) {
        for (var i=1; i<=NUM_CUSTOM_ASSETS; i++){
            var assetTag = liveScene.templateLookup('asset{0}_bin'.format(i));
            if (assetTag.toLowerCase().indexOf(which) === 0){
                try {
                    var customAssetBin = getItem( liveScene.templateLookup('asset{0}_bin'.format(i)), FolderItem ); 
                    if (!customAssetBin || customAssetBin.numItems > 1 || customAssetBin.numItems == 0) {
                        continue;
                    } else {
                        var avitem = customAssetBin.item(1);
                        var ext = avitem.name.split('.')
                        ext = ext[ext.length-1];
                    }
                    // ADD NEW TYPES HERE (currently only TEAM and AWAY)
                    var id = "";
                    if (which === "team") {
                        id = liveScene.teams[0].id;     
                    } else if (which === "away") {
                        id = liveScene.teams[1].id;
                    }
                } catch(e) { alert(e.message); }
                try {
                    var newAsset = new File ("{0}/{1}.{2}".format( liveScene.getFolder("customasset0{0}".format(i)), id, ext));
                    avitem.replace(newAsset);
                } catch(e) {}
            }
        }
    }
    
    /*********************************************************************************************
    AUTOMATION TOOLS
    *********************************************************************************************/
    function batchAllTeams() {
        liveScene.use_team0id = true;
        for (team in liveScene.prod.teamlist) {
            if (!liveScene.prod.teamlist.hasOwnProperty(team)) continue;
            var team = liveScene.prod.teamlist[team];
            liveScene.setTeam(0, team);
            switchTeam(0);
            addRenderCompsToQueue();
            saveWithBackup();
            addProjectToBatch();
        }
    }
    
    function pickleLogoSheet () {
        var output    = {};
        var selection = app.project.selection;

        for (i in selection)
        {
            var siz = [selection[i].width, selection[i].height];
            var pos = selection[i].layers[1].position.value;
            var anx = selection[i].layers[1].anchorPoint.value;
            var scl = selection[i].layers[1].scale.value;

            output[selection[i].name] = {
                "Size": siz,
                "Pos": pos,
                "Anx": anx,
                "Scl": scl
            }
        }
        output = JSON.stringify(output);
        
        var txt = prompt('A new .json will be created on your desktop.', 'new_logosheet.json', 'Enter a file name');
        if (txt !== null) {
            try {
                var outJsn = new File( '~/Desktop/{0}' );
                outJsn.open('w');
                outJsn.write(output);
            } catch (e) {
                alert ('Error writing file: \n' + e.message);
            } finally {
                outJsn.close();
            }
        }
    }

    /*********************************************************************************************
    RENDER QUEUEING
    *********************************************************************************************/
    function getRenderComps (wip) {
        (wip === undefined) ? wip = false : wip = true;
        // prep objects 
        var renderComps = [];
        
        var renderCompBin = getItem(liveScene.templateLookup("render_bin"), FolderItem);
        var outputDir = liveScene.getFolder("qt_final");
        // check for the bin with the render comps
        if (!renderCompBin){
            return false;
        }
        // array all render comps
        for (var i=1; i<=renderCompBin.items.length; i++){
            renderComps.push(renderCompBin.items[i]);
        }               
        // extra steps to prepare "WIP" versions of render comps
        if (wip) {
            try {
                // check for the destination bin for WIP render comps
                var wipBin = liveScene.templateLookup('wiprenderbin', FolderItem);
                wipBin = getItem(wipBin, FolderItem);
                
                while(true){
                    try { wipBin.items[1].remove(); }
                    catch(e) { break; }
                }            
                // find the WIP template comp
                var wipRenderGuides = getItem(liveScene.templateLookup("bottomline"));
                // redirect render output to WIP folder
                outputDir = liveScene.getFolder("qt_wip");
                for (var i in renderComps){
                    if (!renderComps.hasOwnProperty(i)) continue;
                    // duplicate the WIP template
                    var wipComp = wipRenderGuides.duplicate();
                    // add the render comp to the duped template
                    var c = wipComp.layers.add(renderComps[i]);
                    c.moveToEnd();
                    wipComp.duration = renderComps[i].duration;

                    var dash = getItem( liveScene.templateLookup("dashboard") );

                    var exp = """project = comp('{0}').layer('{1}').text.sourceText;\
    scene = comp('{0}').layer('{2}').text.sourceText;\
    if (scene != '') (project + '_' + scene) else project;""".format(dash, "PROJECT NAME", "SCENE NAME");
                    wipComp.layer('Project').text.sourceText.expression = exp;
                    // move it to the WIP bin
                    wipComp.parentFolder = wipBin;
                    // add a timestamp to the comp name
                    wipComp.name = renderComps[i].name + timestamp();
                    // replace the comp in the array with the wip version
                    renderComps[i] = wipComp;
                }
            } catch(e) { alert(e.message); }
        }
        return renderComps;
    }
    
    function addRenderCompsToQueue ( wip ) {
        var movName;
        var outputDir;
        var renderComps = getRenderComps( wip );
                
        // deactivate all current items
        var RQitems = app.project.renderQueue.items;
        for (var i=1; i<=RQitems.length; i++){
            try {
                RQitems[i].render = false;
            } catch(e) { null; }
        }
        for (c in renderComps){
            if (!renderComps.hasOwnProperty(c)) continue;
            var rqi = RQitems.add( renderComps[c] );
            rqi.outputModules[1].applyTemplate("QT RGBA STRAIGHT")
            movName = liveScene.getRenderName(renderComps[c].name, "mov");
            if (wip === undefined){
                outputDir = liveScene.getFolder("qt_final");    
            } else {
                outputDir = liveScene.getFolder("qt_wip"); 
            }
            rqi.outputModules[1].file = new File (outputDir +'/'+ movName); 
        }
    }

    function addProjectToBatch () {
        // opens the bat file, adds a new line with the scene, and closes it
        var aepFile = app.project.file.fsName.toString();
        var execStr = "\"C:\\Program Files\\Adobe\\Adobe After Effects CC 2015\\Support Files\\aerender.exe\" -mp -project \"{0}\"".format(aepFile);
        RENDER_BAT_FILE.open("a");
        try{
            RENDER_BAT_FILE.writeln(execStr);            
        } catch(e) { 
            null;
        } finally {
            RENDER_BAT_FILE.close();
        }  
    }
    
    function openBatchForEditing () {
        // opens the bat file for editing in notepad
        var execStr = "start \"\" notepad {0}".format(RENDER_BAT_FILE.fsName.toString());
        EDIT_BAT_FILE.open("w");
        EDIT_BAT_FILE.write(execStr);
        EDIT_BAT_FILE.execute();
    }
    
    function runBatch () {
        // executes the bat file
        RENDER_BAT_FILE.execute();
    }
    
    function startNewBatch () {
        RENDER_BAT_FILE.open("w");
        RENDER_BAT_FILE.close();
    }
    
    /*********************************************************************************************
    AUTO-TRACE TOOL
    *********************************************************************************************/

    /*********************************************************************************************
    UI LAYOUT
    *********************************************************************************************/    
    function ESPNToolsUI (thisObj) {
		var dlg = (thisObj instanceof Panel) ? thisObj : new Window("palette", 'ESPNTools', undefined, {resizeable:true});
        
		if (dlg !== null) {
            // Load resource
            var res = new File((new File($.fileName).parent.toString()) + '/res/ESPNTools.res');
            res.open('r');
            dlg.grp = dlg.add(res.read());
            // Boilerplate
            dlg.layout.layout(true);
            dlg.grp.minimumSize = [100,0];
            dlg.layout.resize();
            dlg.onResizing = dlg.onResize = function () { this.layout.resize(); } 
            
            // Setup Tab
            dlg.grp.tabs.setup.createTemplate.onClick       = buildProjectTemplate;
            dlg.grp.tabs.setup.createProject.onClick        = saveWithBackup;
            dlg.grp.tabs.setup.production.dd.onChange       = function () { changedProduction() };
            dlg.grp.tabs.setup.projectName.edit.e.onChange  = function () { changedProject() };
            dlg.grp.tabs.setup.projectName.pick.dd.onChange = function () { changedProject() };
            dlg.grp.tabs.setup.sceneName.e.onChange         = function () { changedProjectName() };
            dlg.grp.tabs.setup.useExisting.cb.onClick       = function () { changedProject() };
            dlg.grp.tabs.setup.updateUI.onClick             = initialize;
            
            // Toolkit Tab
            dlg.grp.tabs.toolkit.expClr.onClick = function () { removeExpressionOnSelected() };
            dlg.grp.tabs.toolkit.expAdd.onClick = function () {
                var sel = dlg.grp.tabs.toolkit.expPick.selection.toString();
                var exp = liveScene.prod.getPlatformData()['Expressions'][sel];
                setExpressionOnSelected(exp);
            };
            
            // Versioning Tab
            dlg.grp.tabs.version.div.fields.team.dd.onChange = changedHomeTeam;
            dlg.grp.tabs.version.div.fields.away.dd.onChange = changedAwayTeam;
            dlg.grp.tabs.version.div.checks.cbT.onClick      = changedNamingFlags;
            dlg.grp.tabs.version.div.checks.cbS.onClick      = changedNamingFlags;
            dlg.grp.tabs.version.div.checks.cbA.onClick      = changedNamingFlags;
            dlg.grp.tabs.version.div.checks.cbB.onClick      = changedNamingFlags;
            dlg.grp.tabs.version.div.checks.cbC.onClick      = changedNamingFlags;
            dlg.grp.tabs.version.div.checks.cbD.onClick      = changedNamingFlags;
            dlg.grp.tabs.version.save.onClick            = saveWithBackup;
            dlg.grp.tabs.version.bat.addToBat.onClick    = addProjectToBatch;
            dlg.grp.tabs.version.bat.checkBat.onClick    = openBatchForEditing;
            dlg.grp.tabs.version.bat.clearBat.onClick    = startNewBatch;
            dlg.grp.tabs.version.bat.runBat.onClick      = runBatch;
            dlg.grp.tabs.version.queue.addFinal.onClick  = function () { addRenderCompsToQueue() };
            dlg.grp.tabs.version.queue.addWip.onClick    = function () { addRenderCompsToQueue(true) };
        
            // Batching Tab
            dlg.grp.tabs.tdtools.batchAll.onClick = function () { 
                try{ batchAllTeams(); }
                catch(e) {alert(e.line); }
            };
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
    
    /// Initial visibility switches
    dlg.grp.tabs.setup.useExisting.cb.value = true;
    dlg.grp.tabs.setup.projectName.pick.visible = true;
    dlg.grp.tabs.setup.projectName.edit.visible = false;
    dlg.grp.tabs.version.div.checks.cbX.visible = false;

})(this);