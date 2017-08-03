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
        if (tempScene.status === (STATUS.OK || STATUS.OK_WARN)){
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
            setEmptyMenus();
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
        setNamingFlagsCheckbox(
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
        populateProductionsDropdown();
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
        dlg.grp.tabs.version.div.fields.etA.text = "";
        dlg.grp.tabs.version.div.fields.etB.text = "";
        dlg.grp.tabs.version.div.fields.etC.text = "";
        dlg.grp.tabs.version.div.fields.etD.text = "";
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
    function setAwayTeamMenu ( team ){}
    /*
     * Sets the custom text fields in the UI
     * @param {string} a,b,c,d - Strings for custom text fields A thru D (all 4 required in order)
     */    
    function setCustomTextMenu (a,b,c,d) {
        dlg.grp.tabs.version.div.fields.etA.text = a;
        dlg.grp.tabs.version.div.fields.etB.text = b;
        dlg.grp.tabs.version.div.fields.etC.text = c;
        dlg.grp.tabs.version.div.fields.etD.text = d;
    }
    /*
     * Sets the naming flag checkboxes (the ones in the versioning tab)
     * @param {(Array(bool) || bool), [idx]} values - The boolean values of the checkboxes in order
     */
    function setNamingFlagsCheckbox ( values, idx ) {
        var namingFlagsGrp = dlg.grp.tabs.version.div.checks;
        if (Array.isArray(values)){
            namingFlagsGrp.cbT.value = values[0];
            namingFlagsGrp.cbS.value = values[1];
            namingFlagsGrp.cbA.value = values[2];
            namingFlagsGrp.cbB.value = values[3];
            namingFlagsGrp.cbC.value = values[4];
            namingFlagsGrp.cbD.value = values[5];  
        } else if (typeof values === 'bool' && typeof idx === 'number') {
            try {
                var cbX = ['cbT','cbS','cbA','cbB','cbC','cbD'];
                namingFlagsGrp['{0}'.format(cbX[idx])].value = values[idx];               
            } catch(e) {
                alert(e.message);
            }
        } else {
            var m = 'Could not set naming flags checkboxes.\nvalue passed: {0}\nidx passed: {1}'.format(values, idx);
            alert (m);
        }
    };
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
    function populateTeamsDropdown () {
        var home = dlg.grp.tabs.version.div.fields.team.dd;
        home.removeAll();
        if (!liveScene.prod.teamdata) 
            liveScene.prod.loadTeamData();
        for (i in liveScene.prod.teamlist){
            if (!liveScene.prod.teamlist.hasOwnProperty(i)) continue;
            home.add("item", liveScene.prod.teamlist[i]);
        }
    }
    /*
     * Adds this production's shows to the dropdown menu
     */  
    function populateShows () {}
    /*
     * Adds this production's sponsors to the dropdown menu
     */ 
    function populateSponsors () {}
    
    /*********************************************************************************************
     * THINGS-HAVE-CHANGED (IN THE UI) FUNCTIONS
     * These functions are called whenever the user updates something in the UI. These modify the
     * tempScene object and it must be validated before pushing to the liveScene / project tag.
     ********************************************************************************************/
    /*
     * Changing the production is a big deal. The UI is cleared and this is the only time the 
     * project list loads from the tempScene instead of the liveScene. (The Teams list does
     * not reload -- it remains cleared until the user enters valid information.)
     */ 
    function changedProduction () {
        var prod_id = dlg.grp.tabs.setup.production.dd.selection;
        tempScene.setProduction(prod_id.toString());
        setEmptyMenus();
        populateProjectsDropdown(true);
        /*
        populateTeams();
        populateShows();
        populateSponsors();
        */    
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
        var textA = dlg.grp.tabs.version.div.fields.etA.text;
        var textB = dlg.grp.tabs.version.div.fields.etB.text;
        var textC = dlg.grp.tabs.version.div.fields.etC.text;
        var textD = dlg.grp.tabs.version.div.fields.etD.text;
        
        tempScene.setCustom('A', textA);
        tempScene.setCustom('B', textB);
        tempScene.setCustom('C', textC);
        tempScene.setCustom('D', textD);
    }
    /*
     * Updates the tempScene.teams[0] data when the dropdown is changed
     */      
    function changedHomeTeam () {}
    /*
     * Updates the tempScene.teams[0] data when the dropdown is changed
     */   
    function changedAwayTeam () {}
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
        
        tempScene.setNameFlags( useTricode,
                                useShowid,
                                useCustomA,
                                useCustomB,
                                useCustomC,
                                useCustomD  );
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
            createProject(tempScene);
            // override the status to force another check
            tempScene.status = STATUS.CHECK_DEST;
            // .. and confirm that the location now exists
            tempScene.prevalidate();
        } 
        
        var success;
        if ( tempScene.status === (STATUS.OK||STATUS.OK_WARN||STATUS.UNSAVED) ){
            try {
                liveScene = tempScene;
                pushDashboardTag();
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
     * Sets the liveScene metadata on the pipelined scene's dashboard tag
     */
    function pushDashboardTag () {
        var dashboard = getItem('0. Dashboard');
        dashboard.comment = liveScene.getTag().toString();
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
        if (liveScene.status === (STATUS.OK_WARN)){
            alert('Save overwrite warning goes here');
            // TODO -- CONFIRM DIALOG
        }
        // Final check for correct status flags -- 
        if (liveScene.status === (STATUS.OK || STATUS.OK_WARN)){
            // get a filename for the scene
            var aepFile = new File(liveScene.getPaths()[0].fullName +'\\'+ liveScene.getName());
            // save the file
            app.project.save(aepFile);
            // make a copy of the file as a backup
            try {
                aepFile.copy( liveScene.getPaths()[1].fullName +'\\'+ liveScene.getName(true));
            } catch (e) { 
                alert('Backup not saved!\n'+e.message);
            }/**/
            return true;
        } else return false;
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
    TEMPLATE BUILDERS
    *********************************************************************************************/    
    function buildProjectTemplate () {
        // Check for platform-specific JSON & load it if necessary
        if (!liveScene.prod.platdata)
            liveScene.prod.loadPlatformData('ae');
        // Build the bin/folder tree from JSON
        buildProjectFromJson( liveScene.prod.plat_db['Template'] );
    }
    
    function buildDashboard () {
        var font = "Tw Cen MT Condensed";
        var posBig = [65,150,0];
        var posSm = [65,80,0];
        var ypi = 120;
        var fontSizeBig = 90;
        var fontSizeSm = 33;
        
        var dashboard = getItem(liveScene.prod['Template']['dashboard'][0]);

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
    PUSH FUNCTIONS
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
            dlg.grp.tabs.setup.createProject.onClick = saveWithBackup;
            dlg.grp.tabs.setup.production.dd.onChange = function () { changedProduction() };
            dlg.grp.tabs.setup.projectName.edit.e.onChange = function () { changedProject() };
            dlg.grp.tabs.setup.projectName.pick.dd.onChange = function () { changedProject() };
            dlg.grp.tabs.setup.sceneName.e.onChange = function () { changedProjectName() };
            dlg.grp.tabs.setup.useExisting.cb.onClick = function () { changedProject() };
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