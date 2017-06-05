// Auto-trace tools for ESPN CBB'17
// Version 1.1 -- 5/23/2017
// mark.rohrer@espn.com
#target aftereffects
//#targetengine "ESPN"

(function CBBTools(thisObj)
{	
    $.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
    
    // Global Strings
    var STR = new Object();
    // Comp template object names
    STR.logosheetsBin = "Team Logo Sheets";
    STR.dashboardComp = "0. Dashboard";
    STR.logosheetComp = "Team Logosheet Master Switch";
    STR.toolkitsBin   = "1. TOOLKIT PRECOMPS";

    var TAG = new Object();
    TAG[0] = 'projectName';
    TAG[1] = 'sceneName';
    
    // Dashboard Text Layer Names
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
    
    // META values container object
    var M = new Object();
    M.teamObj = undefined;
    // SETUP
    // text fields
    M.projectName = "";
    M.sceneName = "";
    // generated data
    M.projectRoot = "";
    M.projectDir = "";
    M.aepDir = "";
    M.aepBackupDir = "";
    M.aepName = "";
    M.aepBackupName = "";
    
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
    
    // checkboxes
    M.useTricode = false;
    M.useShowcode= false;
    M.useCustomA = false;
    M.useCustomB = false;
    M.useCustomC = false;
    M.useCustomD = false;
    M.namingOrder = new Array();
    
    // UI labels
    STR.widgetName = "ESPN Tools";
        
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
    ERR.NO_TEMPLATE  = 'WARNING: This project is missing some template pieces -- some features will not work. Run \'Build Template\' to repair it.'
    
    var helpText1 = """Instructions:\nNevermind.""";
    
    // CONFORM TO THE FOLLOWING CONCEPTS
    
    // META PUSH/PULL OPERATIONS
    // SCENE -> META -> UI
    // UI -> META -> SCENE
    // SELF CONTAINED
    
    // META OBJECT MOVES TO aeCore
    // aeCore objects MUST pull relevant data from a META object

    // REFERENCE CODE
    //
    /*
    function setOutputModule(module_name)
    {
        RQitems = app.project.renderQueue.items;
        for (i=1; i<=RQitems.length; i++)
        {
            RQitem = RQitems[i];
            RQitem.outputModules[1].applyTemplate(module_name);
            
            mov_name = RQitem.comp.name.split('.')[0] + "_rec709";
            path = RQitem.comp.layer(1).source.file.path.toString() + "//";
            RQitem.outputModules[1].file = new File(path + mov_name);
            
        }
    }
    
    function createOutputModule(om_source, module_name)
    {
        om_template = app.project.importFile(om_source);
        temp_RQitem = app.project.renderQueue.item(app.project.renderQueue.numItems);
        temp_RQitem.outputModules[1].saveAsTemplate(module_name);
        om_template.remove();
    }
    
    function checkOutputModule(RQitem, module_name)
    {
        var exists = false;
        
        for (i=1; i < RQitem.outputModules[1].templates.length; i++)
        {
            if (RQitem.outputModules[1].templates[i] == module_name)
            {
                exists = true;
            }
        }   
        return exists;
    }
    
    queue_item = app.project.renderQueue.items.add(output_comp);
    
    */    

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
        if (!(M.projectRoot.exists)){
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
            var folderMap = GetSetting("folders");
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
                var item = app.project.items.addComp(item[1], 1920, 1080, 1.0, 1.0, 59.94);
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
            comp = app.project.items.addComp(c, layout[c]["Size"][0], layout[c]["Size"][1], 1.0, 60, 30);
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
        var teamFolder = new Folder( GetSetting("Team Logo Sheets Folder") );
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
    function SwitchTeam (team) {
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
            alert( ERR.TL_BIN );
            return false;
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
        var teamLogoFolder = GetSetting('Team Logo Sheets Folder');
        teamLogoFolder = new File( teamLogoFolder );
        if (!teamLogoFolder.exists){
            alert( ERR.TL_FOLDER );
            return false;
        }
        // find the new team slick
        var newLogoSheet = new File( '{0}/{1}.ai'.format(teamLogoFolder.fullName, team) );
        if (!newLogoSheet.exists){
            alert(( ERR.TL_SHEET +'\n'+ team));
            return false;
        }

        /*
         * Get the Team() object ready
         */
        //M.teamObj = Team( team );
        //if ((M.teamObj === undefined) || (M.teamObj.name === 'NULL')) return false;    
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
    function GetExpressionsFromSettings () {
        var expressions = getLocalJson('settings')['Expressions'];
        if (!expressions) {
            alert((ERR.MISS_SETTING + 'Expressions'));
            return undefined;
        }
        else return expressions;
    }
    
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
        var useExisting = dlg.grp.tabs.setup.useExisting.cb.value;
        if (useExisting){
            var tmp = dlg.grp.tabs.setup.projectName.pick.dd.selection;
            (tmp !== null) ? M.projectName = tmp.text : M.projectName = 'NULL';
        } else {
            M.projectName = dlg.grp.tabs.setup.projectName.edit.e.text;
        }
        // Pull scene name
        M.sceneName = dlg.grp.tabs.setup.sceneName.e.text;
        // Pull showcode / show name
        M.showode = "";
        // Pull team name
        M.teamName = dlg.grp.tabs.version.div.fields.team.dd.selection;
        (M.teamName !== null) ? M.teamName = M.teamName.text : M.teamName = 'NULL';
        M.teamObj = Team(M.teamName);
        // .. & populate objects with team data
        M.nickname = M.teamObj.nickname;
        M.location = M.teamObj.location;
        M.tricode = M.teamObj.tricode;
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
        M.namingOrder = [
            [M.useShowcode, M.showName],
            [M.useTricode,  M.tricode],
            [M.useCustomA,  M.customA],
            [M.useCustomB,  M.customB],
            [M.useCustomC,  M.customC],
            [M.useCustomD,  M.customD]
        ];
    }
    
    /* Pulls values from the Scene Tag to the META */
    function PullSceneTag () {
        var dashComp = getItem(STR.dashboardComp);
        if (dashComp === undefined){
            alert(ERR.DASHBOARD);
            return false;
        }
        // DASHBOARD COMMENTS TO META
        var comment = dashComp.comment.split(':');
        for (c in comment){
            alert(TAG[c] + ':' + comment[c]);
            M[TAG[c]] = comment[c];
        }     
    }
    
    /* Pulls values from the scene's text layers to the META */
    function PullSceneText() {
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
        TextLayerToMeta(dashComp, TEAMTXTL);
        TextLayerToMeta(dashComp, CUSTXTL);        
    }

    /* Sets the PROJECT:SCENE comment on the Dashboard comp */
    function PushSceneTag () {
        var dashComp = getItem('0. Dashboard');
        if (dashComp === undefined){
            alert(ERR.NO_TEMPLATE);
            return false;
        }
        var commentTag = "";        
        commentTag = "{0}".format(M.projectName);
        (M.sceneName !== ('' || 'NULL')) ? commentTag += ":{0}".format(M.sceneName) : 0;
        dashComp.comment = commentTag;
    }
    
    function AssembleProjectPaths() {
        // Generate project paths from project names
        M.projectDir  = M.projectRoot.fullName + '/' + M.projectName;
        M.aepDir      = M.projectDir + '/ae/';
        M.aepBackupDir= M.aepDir + 'backup/';
    }
    
    function AssembleFilePaths () {
        // Generate filename for .AEP
        // ... base name
        M.aepName = M.projectName;
        // ... scene name token
        if (M.sceneName !== '')
            M.aepName += "_{0}".format(M.sceneName);
        // ... team & custom text field tokens
        for (n in M.namingOrder){
            if (M.namingOrder[n][0] === true)
                M.aepName += "_{0}".format(M.namingOrder[n][1].split(' ').join('_'));
        }
        // set backup increment
        var fileTmp;
        var incr = 0;
        while (true) {
            M.aepBackupName = "{0}.{1}.aep".format(M.aepName, zeroFill(incr, 4));
            fileTmp = new File((M.aepBackupDir + M.aepBackupName));
            if (!fileTmp.exists) 
                break;
            else { incr += 1; }
        }
        // ... file extension
        M.aepName += ".aep";
    }
    
    /*
    **
    UI builders
    **
    */
    function InitializeLists () {
        // Slower operations that we only want to run when the window is instanced
        M.projectRoot = new Folder(GetSetting("Animation Project Folder"));
        if (!(M.projectRoot.exists)){
            alert(ERR.ROOT_FOLDER);
            return false;
        }
        RefreshProjectFolders();
        RefreshTeamList();
        RefreshExpressions();
    }  
    // TODO: add scene tag pulls
    function InitializeFields () {
        dlg.grp.tabs.setup.useExisting.cb.value = true;
        dlg.grp.tabs.setup.projectName.pick.visible = true;
        dlg.grp.tabs.setup.projectName.edit.visible = false;
    }
    
    // Dropdown refreshers
    function RefreshProjectFolders(){
        function isFolder(fileObj){
            if (fileObj instanceof Folder) return true;                                  
        }
        var folders = M.projectRoot.getFiles(isFolder);
        for (i in folders){
            var tmp = folders[i].fullName.split('/');
            folders[i] = tmp[tmp.length-1];
        }
        dlg.grp.tabs.setup.projectName.pick.dd.removeAll();
        dlg.grp.tabs.setup.projectName.pick.dd.add("item", "");
        for (f in folders){
            dlg.grp.tabs.setup.projectName.pick.dd.add("item", folders[f]);
        }
    }
    function RefreshTeamList(){
        var teams = TeamList();
        dlg.grp.tabs.version.div.fields.team.dd.add("item", "");
        for (var t in teams){
            dlg.grp.tabs.version.div.fields.team.dd.add("item", teams[t]);
        } 
    }
    function RefreshExpressions() {
        var expressions = GetExpressionsFromSettings();
        dlg.grp.tabs.toolkit.expPick.add("item", "");
        for (var e in expressions){
            dlg.grp.tabs.toolkit.expPick.add("item", e);
        }
    }
    // Field refreshers
    function RefreshSetupTab() {
        return;
    }
    function RefreshVersionTab() {
        return;
    }
    function RefreshToolkitTab() {
        return;
    }
    function RefreshAllTabs() {
        RefreshSetupTab();
        RefreshVersionTab();
        RefreshToolkitTab();
    }
    
    /*
    **
    UI functionality
    **
    */
    // Setup tab
    function btn_UseExisting(){
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
    function btn_CreateProject(){
        PullUI();
        AssembleProjectPaths();
        AssembleFilePaths();
        CreateNewProject();
        PushSceneTag();
        SaveWithBackup();
    }
    function btn_BuildTemplate (){
        BuildProjectTemplate();
        BuildDashboard();
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
    function btn_SwitchCustomText (){
        PullUI();
        SwitchCustomText();
    }
    function btn_SaveProject() {
        PullUI();
        if ((M.projectName == ('' || 'NULL')) || (M.sceneName == ('' || 'NULL')))
            PullSceneTag();
        else PushSceneTag();
        AssembleProjectPaths();
        AssembleFilePaths();
        SaveWithBackup();
    }
    function onChange_TeamDropdown(){
        PullUI();
        SwitchTeam(M.teamName);
    }
    
    // Toolkit tab
    function btn_AddExpression (){
        var expression = GetExpressionsFromSettings()[dlg.grp.tabs.toolkit.expPick.selection.text];
        AddExpressionToSelectedProperties(expression);
    }

    /*
    **
    UI functionality attachment
    **
    */
    function CBBToolsUI(thisObj) {
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
            
            // TOOLKIT tab
            dlg.grp.tabs.toolkit.expAdd.onClick = btn_AddExpression;
            dlg.grp.tabs.toolkit.expClr.onClick = ClearExpressionFromSelectedProperties;
            
            // VERSION tab
            dlg.grp.tabs.version.div.fields.team.dd.onChange = onChange_TeamDropdown;
            dlg.grp.tabs.version.save.onClick = btn_SaveProject;
            dlg.grp.tabs.version.update.onClick = btn_SwitchCustomText;

        }
		return dlg;
	}

    // UI INSTANCING
	var dlg = CBBToolsUI(thisObj);
    if (dlg !== null)
    {
        // Pull in external JSON data
        InitializeLists();
        // Set initial UI states
        InitializeFields();
        // Refresh fields
        RefreshAllTabs();
        
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