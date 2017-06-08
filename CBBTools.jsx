// Auto-trace tools for ESPN CBB'17
// Version 1.1 -- 5/23/2017
// mark.rohrer@espn.com
#target aftereffects
//#targetengine "ESPN"

(function CBBTools(thisObj)
{	
    $.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
    
    // META values container object
    var M = new Object();
    // Objects / arrays
    M.teamObj = undefined;
    M.settings = undefined;
    M.teamList = new Array();
    M.projList = new Array();
    M.namingOrder = new Array();
    M.renderComps = new Array();
    M.batFile = new File ('~/aeRenderList.bat');
    M.bottomline = new File ('Y:\\Workspace\\DESIGN_RESOURCES\\Bottomline\\keyable_BtmLn_reference_examples\\Bottomline.tga');
    // SETUP
    // text fields & dropdowns
    M.projectName = "";
    M.sceneName = "";
    // checkboxes
    M.useExisting = false; 
    // VERSION
    // text fields
    M.teamName = "NULL";
    M.nickname = "NULL";
    M.location = "NULL";
    M.tricode = "NULL";
    M.showName = "NULL";
    M.customA = "NULL";
    M.customB = "NULL";
    M.customC = "NULL";
    M.customD = "NULL";
    M.version = 1;
    // checkboxes
    M.useTricode = false;
    M.useShowcode= false;
    M.useCustomA = false;
    M.useCustomB = false;
    M.useCustomC = false;
    M.useCustomD = false;
    // DERIVED DATA
    M.projectRoot = "";
    M.projectDir = "";
    M.aepDir = "";
    M.aepBackupDir = "";
    M.aepName = "";
    M.aepBackupName = "";
    M.outputDir = "";
    M.namingOrder = [
        [M.useShowcode, M.showName],
        [M.useTricode,  M.tricode],
        [M.useCustomA,  M.customA],
        [M.useCustomB,  M.customB],
        [M.useCustomC,  M.customC],
        [M.useCustomD,  M.customD]
    ];

    // Global Strings
    var STR = new Object();
    // UI labels
    STR.widgetName = "ESPN Tools";
    // Comp template object names
    STR.dashboardComp     = "0. Dashboard";
    STR.logosheetComp     = "Team Logosheet Master Switch";
    STR.guidelayerComp    = "Guidelayers";
    STR.logosheetsBin     = "Team Logo Sheets";
    STR.toolkitsBin       = "1. TOOLKIT PRECOMPS";
    STR.renderCompBin     = "3. RENDER COMPS";
    STR.wipRenderCompBin  = "WIP Render Comps";
    STR.guidelayerBin     = "Guidelayers";
    
    // Global Errors
    var ERR = new Object();
    ERR.TL_BIN       = 'There is a problem with the \'Team Logo Sheets\' folder in your project.';
    ERR.TL_FOLDER    = 'Could not find team logo folder on the server: ';
    ERR.TL_SHEET     = 'Could not find team logo sheet on the server: ';
    ERR.TL_COMP      = 'Could not find \'{0}\' comp'.format(STR.logosheetComp);
    ERR.DASHBOARD    = 'There is a problem with the {0} comp in your project.'.format(STR.dashboardComp);
    ERR.MISS_LAYER   = 'There are one or more required layers missing: ';
    ERR.NOSEL_PROPS  = 'You must have one or more properties selected for this to work.';
    ERR.MISS_SETTING = 'The requested setting wasn\'t found in settings.json: ';
    ERR.ROOT_FOLDER  = 'The root animation project folder was not found.';
    ERR.PROJECT_NAME = 'Inavlid project name specified.';
    ERR.TEAM_NAME    = 'You have no team selected, but are using it in your file name.';
    ERR.NO_TEMPLATE  = 'WARNING: This project is missing some template pieces -- some features will not work. Run \'Build Template\' to repair it.';
    ERR.RC_BIN       = 'There is a problem with your render comps project bins.';
    ERR.BOTTOMLINE   = 'The Bottomline.tga file is missing. Cannot create guide layer.';
    ERR.NOTSETUP     = 'Project metadata missing from scene template. Run \'Create Project\' from the Setup tab and try again.';
    
    /*
    var TAG = new Object();
    TAG[0] = 'projectName';
    TAG[1] = 'sceneName';
    */
    
    // Dashboard Text Layer Names
    var SYSTXTL = new Object();
    SYSTXTL.projectName = "PROJECT NAME";
    SYSTXTL.sceneName   = "SCENE NAME";
    SYSTXTL.version     = "VERSION";
    var TEAMTXTL = new Object();
    TEAMTXTL.teamName = "TEAM NAME";
    TEAMTXTL.nickname = "NICKNAME";
    TEAMTXTL.location = "LOCATION";
    TEAMTXTL.tricode  = "TRICODE";
    var CUSTXTL = new Object();
    CUSTXTL.customA = "CUSTOM TEXT A";
    CUSTXTL.customB = "CUSTOM TEXT B";
    CUSTXTL.customC = "CUSTOM TEXT C";
    CUSTXTL.customD = "CUSTOM TEXT D";
    
    var helpText1 = """Instructions:\nNevermind.""";

    /*
    **
    OVERRIDES
    **
    */
    function getLocalJson (name) {
        var lclDir = new File( $.fileName ).parent;
        var jsn = getJson(lclDir.fullName + '/json/{0}.json'.format(name));
        return jsn;
    }
    
    /*
    **
    SCENE BUILDERS
    **
    */
    function CheckPaths (debug){
        if (!(new Folder(M.projectRoot).exists)){
            alert(ERR.ROOT_FOLDER);
            return false; 
        }

        if (M.projectDir == ('NULL' || '')){
            alert(ERR.PROJECT_NAME);
            return false;
        }
        
        if ((M.teamName == ('NULL' || '')) && (M.useTricode === true)){
            alert(ERR.TEAM_NAME);
            return false;
        }
        
        var projectDir = new Folder(M.projectDir);
        if (!(projectDir.exists)) return null;
        var aepDir = new Folder(M.aepDir);
        if (!(aepDir.exists)) return null;
        var aepBackupDir = new Folder(M.aepBackupDir);
        if (!(aepBackupDir.exists)) return null;
        
        if (debug === true){
            var output = "Paths checked -- ready to save!\n";
            output += "Root Project Dir: {0}\n".format(M.projectRoot.fullName);
            output += "Base Project Dir: {0}\n".format(M.projectDir);
            output += "AE Dir: {0}\n".format(M.aepDir);
            output += "AE Backup Dir: {0}\n".format(M.aepBackupDir);
            output += "AEP File Name: {0}\n".format(M.aepName);
            alert(output);
        }
        return true;
    }

    function CreateNewProject (debug) {
        (debug === undefined) ? debug = false : debug = true;
        
        var sanityCheck = CheckPaths(debug);

        if (sanityCheck === null){
            var folderMap = M.settings["folders"];
            createFolder(M.projectDir);
            createFolders(M.projectDir, folderMap)
        }
        else if (!sanityCheck){
            return false;
        }
    }
    
    function BuildProjectTemplate () {
        var template = getLocalJson('settings')['AE Template'];
        var item, itemLevel;
    
        function createItem (item) {
            if (item[0] === "CompItem")
                var item = app.project.items.addComp(item[1], 1920, 1080, 1.0, 60, 59.94);
            else if (item[0] === "FolderItem")
                var item = app.project.items.addFolder(item[1]);
            return item;
        }
        
        for (t in template){
            // store current folder depth
            itemLevel = template[t];
            for (i in itemLevel){
                // skip any item that already exists
                if (getItem(itemLevel[i][1], eval(itemLevel[i][0]))) continue;
                // create the item if it doesn't
                item = createItem(itemLevel[i]);
                // if the current depth is 1 or greater, nest it under its parent folder
                if (t > 0) 
                    item.parentFolder = getItem(itemLevel[i][2], FolderItem);
            }
        }
    }
    
    function BuildDashboard () {
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
            TXTL[i] = TEAMTXTL[i];
        }
        for (var i in CUSTXTL){
            TXTL[i] = CUSTXTL[i];
        }
        for (var L in TXTL){
            if (!(TXTL.hasOwnProperty(L))) continue;
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
            var tmp = BuildTextLayer('', dashboard, sysPos, font, sysFontSize, 0, SYSTXTL[i], true);
            if (i != 'projectName'){
                tmp.transform.position.expression = exp.format(prev, prev, y);
            }
            prev = SYSTXTL[i];
        }
    }
    
    function BuildGuidelayer () {
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
    
    function BuildToolkittedPrecomps () {
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

    function LoadTeamAssets () {
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
    
    function SaveWithBackup () {
        var aepFile = new File( M.aepDir + M.aepName );
        app.project.save(new File (M.aepDir + M.aepName));
        try {
            aepFile.copy( (M.aepBackupDir + M.aepBackupName) );            
        } catch (e) { alert('Warning: Backup was not saved.'); }
    }
    /*
    function BuildMasterControl (prod) {
        teams = getTeamList(prod);
        if (!teams){ return false; }

        //try{
            //var c_tag      = app.project.items.addComp("!PRODUCTION:{0}".format(prod), 1, 1, 1.0, 1, 59.94);
            var c_switcher = app.project.items.addComp("0. Toolkit Master Control", 1920, 1080, 1.0, 1, 59.94);
            c_switcher.hideShyLayers = true;
            // create switch layer
            var l_switcher = c_switcher.layers.addNull();
            l_switcher.name = "Switch Team Here";
            l_switcher.source.name = "Switch Team Here";
            // add layer control effects on switch layer	
            // home team switcher
            e_switcher_home = l_switcher.property("Effects").addProperty("Layer Control");
            e_switcher_home.name = "Home Team";
            // away team switcher			
            e_switcher_away = l_switcher.property("Effects").addProperty("Layer Control");
            e_switcher_away.name = "Away Team";

            for (i=0; i<teams.length; i++){
                l_team = c_switcher.layers.addNull();
                l_team.name = teams[i];
                l_team.source.name = teams[i];
                l_team.moveToEnd();
                l_team.shy = true;
            }

        //} catch(e) { return false; }

        return true;
    }    
    */

    function PickleLogoSheet () {
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
    
    /*
    **
    SWITCHERS
    **
    */
    function SwitchTeam () {
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
        for (tl in TEAMTXTL){
            dashComp.layer(TEAMTXTL[tl]).property("Text").property("Source Text").setValue(M[tl]);
        }
        logoSheet.replace(newLogoSheet);
        return true;
    }

    function SwitchCustomText () {
        var dashComp = getItem(STR.dashboardComp);
        if (dashComp === undefined){
            alert(ERR.TL_COMP);
            return false;
        }
        for (tl in CUSTXTL){
            dashComp.layer(CUSTXTL[tl]).property("Text").property("Source Text").setValue(M[tl]);
        } return true;
    }
    
    /*
    **
    EXPRESSIONS
    **
    */
    function AddExpressionToSelectedProperties (expression) {
        var props = app.project.activeItem.selectedProperties;
        if (props.length === 0) alert(error['PROPS_NOSEL']);
        for (var i=0; i<props.length; i++){
            if (props[i].canSetExpression){
                props[i].expression = expression;
                props[i].expressionEnabled = true;
            }
        }
    }

    function ClearExpressionFromSelectedProperties () {
        var props = app.project.activeItem.selectedProperties;
        if (props.length === 0) alert(error['PROPS_NOSEL']);
        for (var i=0; i<props.length; i++){
            if (props[i].canSetExpression){
                props[i].expression = '';
                props[i].expressionEnabled = false;
            }
        }
    }
    
    /*
    **
    RENDER QUEUE OPERATIONS
    **
    */
    // TODO: ADD BOTTOMLINE TEMPLATE COMP TO BUILD FUNCTIONS
    function GetRenderComps (wip) {
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
    
    function AddRenderCompsToQueue () {
        // deactivate all current items
        var RQitems = app.project.renderQueue.items;
        for (var i=1; i<=RQitems.length; i++){
            RQitems[i].render = false;
        }
        for (c in M.renderComps){
            var rqi = RQitems.add( M.renderComps[c] );
            if ((M.outputDir == '/qt_final/') || (M.outputDir == '/qt_wip/'))
                return;
            else {rqi.outputModules[1].file = new File (M.outputDir + M.renderComps[c].name); }
        }
    }

    
    function AddProjectToBatFile () {
        // opens the bat file, adds a new line with the scene, and closes it    
    }
    
    function EditBatFile () {
        // opens the bat file for editing in notepad
    }
    
    function RunBatFile () {
        // executes the bat file
    }
    
    /*
    **
    DEBUGGING
    **
    */
    function LogMeta () {
        var log = '';      
        for (v in M){
            log += '{0}: {1}\n'.format(v, M[v]);
        }
        alert (log);
    }
    
    function Timestamp () {
        var t = Date();
        var d = t.split(' ');
        d = (d[1] + d[2]);
        t = t.split(' ')[4].split(':');
        t = (t[0] + t[1]);
        return ('_{0}_{1}'.format(d, t));
    }
    
    /*
    **
    UI Metadata i/o
    **
    PULL: From scene/ui to metadata
    PUSH: From metadata to scene/ui
    (Pushes do not include switching operations.)
    */
    /* Pulls values from the UI to the META */
    function PullUI () {
        // Updates the entire UI container object with current user entries in the interface
        // Pull project name
        M.useExisting = dlg.grp.tabs.setup.useExisting.cb.value;
        if (M.useExisting){
            var tmp = dlg.grp.tabs.setup.projectName.pick.dd.selection;
            (tmp !== null) ? M.projectName = tmp.text : M.projectName = 'NULL';
        } else {
            M.projectName = dlg.grp.tabs.setup.projectName.edit.e.text;
        }
        // Pull scene name
        M.sceneName = dlg.grp.tabs.setup.sceneName.e.text;
        // Pull showcode / show name
        M.showcode = "";
        // Pull team name
        var team = dlg.grp.tabs.version.div.fields.team.dd.selection;
        //alert(team + ' ' + team.text);
        if ((team === null) || (team.text === '') || (team === undefined)){
            team = 'NULL';
        } else { team = team.text; }
        M.teamName = team;

        // Pull custom text fields
        M.customA = dlg.grp.tabs.version.div.fields.etA.text;
        M.customB = dlg.grp.tabs.version.div.fields.etB.text;
        M.customC = dlg.grp.tabs.version.div.fields.etC.text;
        M.customD = dlg.grp.tabs.version.div.fields.etD.text;    
        // Pull .AEP filename token setters
        M.useTricode = dlg.grp.tabs.version.div.checks.cbT.value;
        M.useShowcode= dlg.grp.tabs.version.div.checks.cbS.value;
        M.useCustomA = dlg.grp.tabs.version.div.checks.cbA.value;
        M.useCustomB = dlg.grp.tabs.version.div.checks.cbB.value;
        M.useCustomC = dlg.grp.tabs.version.div.checks.cbC.value;
        M.useCustomD = dlg.grp.tabs.version.div.checks.cbD.value;     
        // Set naming order for .AEP filename tokens
        RefreshNamingOrder();
        AssembleTeamData();
        AssembleProjectPaths();
        AssembleFilePaths();
    }
    
    function PushUI () {
        dlg.grp.tabs.setup.useExisting.cb.value = false;
        dlg.grp.tabs.setup.projectName.pick.visible = false;
        dlg.grp.tabs.setup.projectName.edit.visible = true;
        dlg.grp.tabs.setup.projectName.edit.e.text = M.projectName;
        dlg.grp.tabs.setup.sceneName.e.text = M.sceneName;
        // ADD SHOWCODE
        dlg.grp.tabs.version.div.fields.etA.text = M.customA;
        dlg.grp.tabs.version.div.fields.etB.text = M.customB;
        dlg.grp.tabs.version.div.fields.etC.text = M.customC;
        dlg.grp.tabs.version.div.fields.etD.text = M.customD;
        
        dlg.grp.tabs.version.div.checks.cbT.value = M.useTricode;
        dlg.grp.tabs.version.div.checks.cbS.value = M.useShowcode;
        dlg.grp.tabs.version.div.checks.cbA.value = M.useCustomA;
        dlg.grp.tabs.version.div.checks.cbB.value = M.useCustomB;
        dlg.grp.tabs.version.div.checks.cbC.value = M.useCustomC;
        dlg.grp.tabs.version.div.checks.cbD.value = M.useCustomD;
        
        RefreshNamingOrder();
    }
    
    /* Pulls values from the scene's text layers to the META */
    function PullScene () {
        function TextLayerToMeta (comp, layerList) {
            for (i in layerList){
                var tmpLayer = comp.layer(layerList[i]);
                if (tmpLayer === undefined) {
                    alert(ERR.MISS_LAYER);
                    return false;
                }
                M[i] = tmpLayer.property("Text").property("Source Text").value;
            }
        }
        var dashComp = getItem(STR.dashboardComp);
        if (dashComp === undefined){
            alert(ERR.DASHBOARD);
            return false;
        }
        M.projectName = 'NULL';
        TextLayerToMeta (dashComp, TEAMTXTL);
        TextLayerToMeta (dashComp, CUSTXTL);
        TextLayerToMeta (dashComp, SYSTXTL);
        
        if (M.projectName == 'NULL') return false;
        
        AssembleProjectPaths();
        AssembleFilePaths();
        AssembleTeamData();
        return true;
    }

    /* Sets the SYS text layers with essential project metadata */
    function PushScene () {
        var dashComp = getItem('0. Dashboard');
        if (dashComp === undefined){
            alert(ERR.NO_TEMPLATE);
            return false;
        }
        dashComp.layer(SYSTXTL.projectName).text.sourceText.setValue(M.projectName);
        dashComp.layer(SYSTXTL.sceneName).text.sourceText.setValue(M.sceneName);
        dashComp.layer(SYSTXTL.version).text.sourceText.setValue(M.version);
    }
    
    function AssembleProjectPaths () {
        // Generate project paths from project names
        M.projectDir  = '{0}{1}'.format(M.projectRoot, M.projectName);
        M.aepDir      = M.projectDir + '/ae/';
        M.aepBackupDir= M.aepDir + 'backup/';
    }

    function AssembleFilePaths () {
        // Generate filename for .AEP
        // ... base name
        M.aepName = M.projectName;
        // ... scene name token
        if ((M.sceneName != '')){
            M.aepName = "{0}_{1}".format(M.aepName, M.sceneName);
        }
        // ... team & custom text field tokens
        for (n in M.namingOrder){
            if (M.namingOrder[n][0] === true)
                M.aepName = "{0}_{1}".format(M.aepName, M.namingOrder[n][1].split(' ').join('_'));
        }
        // set backup increment
        var fileTmp;
        var incr = Number(M.version);
        while (true) {
            M.aepBackupName = "{0}.{1}.aep".format(M.aepName, incr);
            fileTmp = new File('{0}{1}'.format(M.aepBackupDir, M.aepBackupName));
            if (!fileTmp.exists){
                M.version = incr;
                break;
            }
            else { 
                incr += 1; 
            }
        }
        // ... file extension
        M.aepName = "{0}.aep".format(M.aepName);
    }
    
    function AssembleTeamData () {
        M.teamObj  = Team(M.teamName);
        M.teamName = M.teamName.toUpperCase();
        // .. & populate objects with team data
        M.nickname = M.teamObj.nickname.toUpperCase();
        M.location = M.teamObj.location.toUpperCase();
        M.tricode  = M.teamObj.tricode.toUpperCase();
    }
    /*
    **
    UI builders
    **
    */
    function InitializeSettings () {
        // attach settings object to Meta
        M.settings = getLocalJson('settings');
        if (!M.settings){
            alert(errors['SETTINGS']);
        }
        // check for root project folder
        M.projectRoot = M.settings["Animation Project Folder"];
            if (!new Folder(M.projectRoot).exists){
                alert(ERR.ROOT_FOLDER);
                return false;
            }
        }
    function InitializeLists () {
        // Slower operations that we only want to run when the window is instanced
        RefreshProjectFolders();
        RefreshTeamList();
        RefreshExpressions();
    }  
    function InitializeFields () {
        dlg.grp.tabs.setup.useExisting.cb.value = true;
        dlg.grp.tabs.setup.projectName.pick.visible = true;
        dlg.grp.tabs.setup.projectName.edit.visible = false;
    }
    function PopulateFromScene () {
        try {
            PullScene(); 
            RefreshProjectFolders();
            AssembleProjectPaths();
            AssembleFilePaths();
            PushUI();
        } catch(e) { return false; }
    }
    // Refreshers
    function RefreshProjectFolders () {
        function isFolder(fileObj){
            if (fileObj instanceof Folder) return true;                                  
        }
        M.projList = new Folder(M.projectRoot).getFiles(isFolder);
        for (i in M.projList){
            var tmp = M.projList[i].fullName.split('/');
            M.projList[i] = tmp[tmp.length-1];
        }
        dlg.grp.tabs.setup.projectName.pick.dd.removeAll();
        dlg.grp.tabs.setup.projectName.pick.dd.add("item", "");
        for (f in M.projList.sort()){
            dlg.grp.tabs.setup.projectName.pick.dd.add("item", M.projList[f]);
        }
    }
    function RefreshTeamList () {
        dlg.grp.tabs.version.div.fields.team.dd.removeAll();
        M.teamList = TeamList();
        dlg.grp.tabs.version.div.fields.team.dd.add("item", "");
        for (var t in M.teamList){
            dlg.grp.tabs.version.div.fields.team.dd.add("item", M.teamList[t]);
        } 
    }
    function RefreshExpressions () {
        dlg.grp.tabs.toolkit.expPick.removeAll();
        var expressions = M.settings['Expressions'];
        dlg.grp.tabs.toolkit.expPick.add("item", "");
        for (var e in expressions){
            dlg.grp.tabs.toolkit.expPick.add("item", e);
        }
    }
    function RefreshNamingOrder () {
        M.namingOrder = [
            [M.useShowcode, M.showName],
            [M.useTricode,  M.tricode],
            [M.useCustomA,  M.customA],
            [M.useCustomB,  M.customB],
            [M.useCustomC,  M.customC],
            [M.useCustomD,  M.customD]
        ];
    }
    
    /*
    **
    UI functionality
    **
    */
    // Setup tab
    function btn_UseExisting () {
        var useExisting = dlg.grp.tabs.setup.useExisting.cb.value;
        if (useExisting){
            RefreshProjectFolders();
            dlg.grp.tabs.setup.projectName.pick.visible = true;
            dlg.grp.tabs.setup.projectName.edit.visible = false;
        }
        else {
            dlg.grp.tabs.setup.projectName.pick.visible = false;
            dlg.grp.tabs.setup.projectName.edit.visible = true;
        }
    }
    function btn_CreateProject () {
        PullUI();
        AssembleProjectPaths();
        AssembleFilePaths();
        CreateNewProject();
        PushScene();
        SaveWithBackup();
    }
    function btn_BuildTemplate () {
        BuildProjectTemplate();
        BuildDashboard();
        BuildGuidelayer();
        LoadTeamAssets();
        BuildToolkittedPrecomps();
    }
    // Version tab
    /*function btn_SwitchTeamRandom (){
        var max = TeamList().length;
        var sel = Math.floor(Math.random() * (max + 1)) +1;
        dlg.grp.tabs.version.team.dd.selection = dlg.grp.tabs.version.team.dd.items[sel];
        PullUI();
        SwitchTeam(M.teamName);
    }*/
    function btn_SwitchCustomText () {
        PullUI();
        SwitchCustomText();
    }
    function btn_SaveProject () {
        PullUI();
        if (M.projectName == 'NULL') {
            var chk = PullScene();
            if (!chk) {
                alert(ERR.NOTSETUP);
                return;
            }
        }
        else { 
            PushScene();
        }
        SaveWithBackup();
        PushUI();
    }
    function btn_AddFinalToQueue (){
        GetRenderComps();
        AddRenderCompsToQueue();
    }
    function btn_AddWIPToQueue () {
        GetRenderComps(true);
        AddRenderCompsToQueue();
    }
    
    function onChange_TeamDropdown () {
        PullUI();
        SwitchTeam();
    }
    // Toolkit tab
    function btn_AddExpression () {
        var expression = M.settings['Expressions'][dlg.grp.tabs.toolkit.expPick.selection.text];
        AddExpressionToSelectedProperties(expression);
    }

    /*
    **
    UI functionality attachment
    **
    */
    function CBBToolsUI (thisObj) {
		var onWindows = ($.os.indexOf("Windows") !== -1);
		var dlg = (thisObj instanceof Panel) ? thisObj : new Window("palette", STR.widgetName, undefined, {resizeable:true});
        
        
		if (dlg !== null)
        {
            // Load resource
            var res = new File((new File($.fileName).parent.toString()) + '/res/CBBTools.res');
            res.open('r');
            dlg.grp = dlg.add(res.read());
            // Boilerplate
            dlg.layout.layout(true);
            //dlg.grp.minimumSize = dlg.grp.size;
            dlg.grp.minimumSize = [100,0];
            dlg.layout.resize();
            dlg.onResizing = dlg.onResize = function () { this.layout.resize(); } 
            // BUTTON ASSIGNMENTS
            // SETUP tab
            dlg.grp.tabs.setup.useExisting.cb.onClick = btn_UseExisting;
            dlg.grp.tabs.setup.createProject.onClick = btn_CreateProject;
            dlg.grp.tabs.setup.createTemplate.onClick = btn_BuildTemplate;
            dlg.grp.tabs.setup.updateUI.onClick = PopulateFromScene;
            
            // TOOLKIT tab
            dlg.grp.tabs.toolkit.expAdd.onClick = btn_AddExpression;
            dlg.grp.tabs.toolkit.expClr.onClick = ClearExpressionFromSelectedProperties;
            
            // VERSION tab
            dlg.grp.tabs.version.div.fields.team.dd.onChange = onChange_TeamDropdown;
            dlg.grp.tabs.version.div.fields.etA.onEnterKey = btn_SwitchCustomText;
            dlg.grp.tabs.version.div.fields.etB.onEnterKey = btn_SwitchCustomText;
            dlg.grp.tabs.version.div.fields.etC.onEnterKey = btn_SwitchCustomText;
            dlg.grp.tabs.version.div.fields.etD.onEnterKey = btn_SwitchCustomText;
            dlg.grp.tabs.version.queue.addFinal.onClick = btn_AddFinalToQueue;
            dlg.grp.tabs.version.queue.addWip.onClick = btn_AddWIPToQueue;
            dlg.grp.tabs.version.save.onClick = btn_SaveProject;
        }
		return dlg;
	}

    // UI INSTANCING
	var dlg = CBBToolsUI(thisObj);
    if (dlg !== null){
        // Pull in external JSON data
        InitializeSettings();
        InitializeLists();
        // Set initial UI states
        InitializeFields();
        
        // WINDOW instance
        if  (dlg instanceof Window){
            dlg.center();
            dlg.show();
        } 
        // PANEL instance
        else
            dlg.layout.layout(true);
    }

})(this);