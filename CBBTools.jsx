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
    STR.toolkitsBin   = "1. TOOLKIT COMPS - USE THESE";

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
    
    // UI values container object
    UI = new Object();
    // SETUP
    // text fields
    UI.projectName = "";
    UI.sceneName = "";
    // generated data
    UI.projectRoot = "";
    UI.projectDir = "";
    UI.aepDir = "";
    UI.aepBackupDir = "";
    UI.aepName = "";
    
    // checkboxes
    UI.useExisting = false;
    // VERSION
    // text fields
    UI.teamName = "";
    UI.nickname = "";
    UI.location = "";
    UI.tricode = "";
    UI.showName = "";
    UI.customA = "";
    UI.customB = "";
    UI.customC = "";
    UI.customD = "";
    
    // checkboxes
    UI.useTricode = false;
    UI.useShowcode= false;
    UI.useCustomA = false;
    UI.useCustomB = false;
    UI.useCustomC = false;
    UI.useCustomD = false;
    UI.namingOrder = new Array();
    
    // UI labels
    STR.widgetName = "ESPN Tools";
        
    // Global Errors
    var ERR = new Object();
    ERR.TL_BIN       = 'There is a problem with the \'Team Logo Sheets\' folder in your project.';
    ERR.TL_FOLDER    = 'Could not find team logo folder on the server: ';
    ERR.TL_SHEET     = 'Could not find team logo sheet on the server: ';
    ERR.DASHBOARD    = 'There is a problem with the {0} comp in your project.'.format(STR.dashboardComp);
    ERR.MISS_LAYER   = 'There are one or more required layers missing: ';
    ERR.NOSEL_PROPS  = 'You must have one or more properties selected for this to work.';
    ERR.MISS_SETTING = 'The requested setting wasn\'t found in settings.json: ';
    ERR.ROOT_FOLDER  = 'The root animation project folder was not found.';
    ERR.PROJECT_NAME = 'Inavlid project name specified.';
    ERR.TEAM_NAME    = 'You have no team selected, but are using it in your file name.';
    
    var helpText1 = """Instructions:\nNevermind.""";
    
    // Standard operating sequence//
    
    // BLANK PROJECT
    // create project template
    // populate dashboard comp
    // push stored values to comments
    // save scene
    
    // EXISTING PROJECT
    // prompt user to move their current project structure to a temporary folder
    // create project template
    // populate dashboard comp
    // push stored values to comments
    // save scene
    
    // BACKUP AEP

    function NotHookedUpYet () {
        null;
    }
    function DEBUG () {
        //BuildProjectTemplate();
        BuildDashboard();
    }
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
        if (!(UI.projectRoot.exists)){
            alert(ERR.ROOT_FOLDER);
            return false;
        }

        if (UI.projectDir == ('NULL' || '')){
            alert(ERR.PROJECT_NAME);
            return false;
        }
        
        if ((UI.teamName == ('NULL' || '')) && (UI.useTricode === true)){
            alert(ERR.TEAM_NAME);
            return false;
        }
        
        var projectDir = new Folder(UI.projectDir);
        if (!(projectDir.exists)) return null;
        var aepDir = new Folder(UI.aepDir);
        if (!(aepDir.exists)) return null;
        var aepBackupDir = new Folder(UI.aepBackupDir);
        if (!(aepBackupDir.exists)) return null;
        
        if (debug === true){
            var output = "Paths checked -- ready to save!\n";
            output += "Root Project Dir: {0}\n".format(UI.projectRoot.fullName);
            output += "Base Project Dir: {0}\n".format(UI.projectDir);
            output += "AE Dir: {0}\n".format(UI.aepDir);
            output += "AE Backup Dir: {0}\n".format(UI.aepBackupDir);
            output += "AEP File Name: {0}\n".format(UI.aepName);
            alert(output);
        }
        return true;
    }

    function CreateNewProject (debug) {
        (debug === undefined) ? debug = false : debug = true;
        
        PullUIValues();        

        var sanityCheck = CheckPaths(debug);
        
        if (sanityCheck === true){
            PushUIValues();
        }
        else if (sanityCheck === null){
            var folderMap = GetSetting("folders");
            createFolder(UI.projectDir);
            createFolders(UI.projectDir, folderMap)
        }
        else if (!sanityCheck)
            return false;
            
        if (!debug)
            app.project.save((UI.aepDir + UI.aepFileName));
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
    
    /** TODO */
    // ADD BACKGROUND SOLID
    function BuildDashboard () {
        var font = "Tw Cen MT Condensed";
        var posBig = [65,150,0];
        var posSm = [65,80,0];
        var ypi = 120;
        var fontSizeBig = 90;
        var fontSizeSm = 33;

        var dashboard = getItem(STR.dashboardComp);
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
                BuildTextLayer(TXTL[L], dashboard, posSm, font, fontSizeSm, 0, (TXTL[L] + ' Label'))
            if (!(dashboard.layer(TXTL[L])))
                BuildTextLayer(TXTL[L], dashboard, posBig, font, fontSizeBig, 0, TXTL[L])
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
            var comp = getItem(c);
            if (comp !== undefined){
                skipped.push(comp);
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
        var teamObj = Team( team );
        if ((teamObj === undefined) || (teamObj.name === 'NULL')) return false;    
        alert('1');
        /*
         * Do the thing!
         */
        //try {
            for (tl in TEAMTXTL){
                //if (!(TEAMTXTL.hasOwnProperty(tl))) continue;
                var templayer = dashComp.layer(TEAMTXTL[tl]);
                tempLayer.property("Text").property("Source Text").setValue(UI[tl]);
            }
        logoSheet.replace(newLogoSheet);
       // } catch (e) { return false; }
        return true;
    }

    function SwitchCustomText (text) {
        var dashComp = getItem(STR.dashboardComp);
        if (dashComp === undefined){
            alert(ERR.TL_COMP);
            return false;
        }
        for (tl in CUSTXTL){
            if (!(CUSTXTL.hasOwnProperty(tl))) continue;
            var templayer = dashComp.layer(tl);
            if (templayer instanceof TextLayer)
                // NOTE THAT CUSTOMTXT is different from CUSTEXTL
                tempLayer.property("Text").property("Source Text").setValue(UI[tl]);
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
    UI META & SCENE INTEGRATION
    **
    */
    /* Pulls values from the UI to the UI.OBJECT */
    function TextLayerToMeta (layerList) {
        if (layerList.hasOwnProperty(i)){
            var tmpLayer = dashComp.layer(layerList[i]);
            if (tmpLayer === undefined) {
                alert(ERR.MISS_LAYER);
                return false;
            }
        } 
        UI[i] = tmpLayer.sourceText.text;
    }

    /* Pulls values from the UI to the UI.OBJECT */
    function PullUIValues () {
        // Updates the entire UI container object with current user entries in the interface
        // Pull project name
        var useExisting = dlg.grp.tabs.setup.useExisting.cb.value;
        if (useExisting){
            var tmp = dlg.grp.tabs.setup.projectName.pick.dd.selection;
            (tmp !== null) ? UI.projectName = tmp.text : UI.projectName = 'NULL';
        } else {
            UI.projectName = dlg.grp.tabs.setup.projectName.edit.e.text;
        }
        // Generate project paths from project names
        UI.projectDir  = UI.projectRoot.fullName + '/' + UI.projectName;
        UI.aepDir      = UI.projectDir + '/ae/';
        UI.aepBackupDir= UI.aepDir + 'backup/';
        // Pull scene name
        UI.sceneName = dlg.grp.tabs.setup.sceneName.e.text;
        // Pull showcode / show name
        UI.showode = "";
        // Pull team name
        UI.teamName = dlg.grp.tabs.version.teamPick.selection;
        (UI.teamName !== null) ? UI.teamName = UI.teamName.text : UI.teamName = 'NULL';
        UI.teamObj = Team(UI.teamName);
        // .. & populate objects with team data
        UI.nickname = UI.teamObj.nickname;
        UI.location = UI.teamObj.location;
        UI.tricode = UI.teamObj.tricode;
        // Pull custom text fields
        UI.customA = dlg.grp.tabs.version.cA.editTxtA.text;
        UI.customB = dlg.grp.tabs.version.cB.editTxtB.text;
        UI.customC = dlg.grp.tabs.version.cC.editTxtC.text;
        UI.customD = dlg.grp.tabs.version.cD.editTxtD.text;    
        // Pull .AEP filename token setters
        UI.useTricode = dlg.grp.tabs.version.chkTeam.value;
        UI.useShowcode= dlg.grp.tabs.version.chkShow.value;
        UI.useCustomA = dlg.grp.tabs.version.chkTxtA.value;
        UI.useCustomB = dlg.grp.tabs.version.chkTxtB.value;
        UI.useCustomC = dlg.grp.tabs.version.chkTxtC.value;
        UI.useCustomD = dlg.grp.tabs.version.chkTxtD.value;     
        // Set naming order for .AEP filename tokens
        UI.namingOrder = [
            [UI.useShowcode, UI.showName],
            [UI.useTricode,  UI.tricode],
            [UI.useCustomA,  UI.customA],
            [UI.useCustomB,  UI.customB],
            [UI.useCustomC,  UI.customC],
            [UI.useCustomD,  UI.customD]
        ];
        // Generate filename for .AEP
        // ... base name
        UI.aepName = UI.projectName;
        // ... scene name token
        if (UI.sceneName !== '')
            UI.aepName += "_{0}".format(UI.sceneName);
        // ... team & custom text field tokens
        for (n in UI.namingOrder){
            if (UI.namingOrder[n][0] === true)
                UI.aepName += "_{0}".format(UI.namingOrder[n][1].split(' ').join('_'));
        }
        // ... file extension
        UI.aepName += ".aep";
    }
    
    /* Pulls values from the Scene to the UI.OBJECT */
    function PullSceneValues () {
        var dashComp = getItem(STR.dashboardComp);
        if (dashComp === undefined){
            alert(ERR.DASHBOARD);
            return false;
        }
        TextLayerToMeta(TEAMTXTL);
        TextLayerToMeta(CUSTXTL);
    }
    
    /* Sets the PROJECT:SCENE comment on the Dashboard comp */
    function UpdateProjectTag () {
        var dashComp = getItem('0. Dashboard');
        var commentTag = "";        
        commentTag = "{0};".format(UI.projectName);
        (UI.sceneName !== ('' || 'NULL')) ? commentTag += ":{0}".format(UI.sceneName) : 0;
    }
    
    // how to handle render comps
    // make a RENDER_COMP_WIP bin 
        // this bin adds the bottom line & burn-in as well
    // make a RENDER_COMP bin
        // this bin adds nothing
    // 1: name the comp by itself if there's only one comp in there
    // 2: otherwise use the comp's "comment" tag as a suffix
    
    /*
    **
    UI BUILDERS
    **
    */
    function Initialize () {
        // Slower operations that we only want to run when the window is instanced
        UI.projectRoot = new Folder(GetSetting("Animation Project Folder"));
        if (!(UI.projectRoot.exists)){
            alert(ERR.ROOT_FOLDER);
            return false;
        }
        RefreshProjectFolders();
        RefreshTeamList();
    }
    
    function RefreshProjectFolders(){
        function isFolder(fileObj){
            if (fileObj instanceof Folder) return true;                                  
        }
        var folders = UI.projectRoot.getFiles(isFolder);
        for (i in folders){
            var tmp = folders[i].fullName.split('/');
            folders[i] = tmp[tmp.length-1];
        }
        dlg.grp.tabs.setup.projectName.pick.dd.removeAll();
        for (f in folders){
            dlg.grp.tabs.setup.projectName.pick.dd.add("item", folders[f]);
        }
    }
    function RefreshTeamList(){
        var teams = TeamList();
        dlg.grp.tabs.version.teamPick.add("item", "");
        for (var t in teams){
            dlg.grp.tabs.version.teamPick.add("item", teams[t]);
        } 
    }
    function RefreshSetupTab() {
        return;
    }
    function RefreshToolkitTab() {
        var expressions = GetExpressionsFromSettings();
        dlg.grp.tabs.toolkit.expressionPick.add("item", "");
        for (var e in expressions){
            dlg.grp.tabs.toolkit.expressionPick.add("item", e);
        }
    }
    function RefreshVersionTab() {
        return;
    }
    function RefreshRenderTab() {
        return true;
    }
    function RefreshAllTabs() {
        RefreshSetupTab();
        RefreshToolkitTab();
        RefreshVersionTab();
        RefreshRenderTab();
    }
    
    /*
    **
    UI "LAMBDAS"
    **
    */
    function btn_NotHookedUpYet () {
        alert("This button isn't hooked up yet. Check back later.")
    }
    function btn_CreateProject(){
        CreateNewProject();
    }
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
    function btn_AddExpression (){
        var exprGet = dlg.grp.tabs.toolkit.expressionPick.selection.text;
        var expression = GetExpressionsFromSettings()[exprGet];
        AddExpressionToSelectedProperties(expression);
    }
    function btn_SwitchTeam (){
        PullUIValues();
        if (UI.teamName !== '')
            SwitchTeam(UI.teamName);
    }
    function btn_SwitchTeamRandom (){
        var max = TeamList().length;
        var sel = Math.floor(Math.random() * (max + 1)) +1;
        dlg.grp.tabs.version.teamPick.selection = dlg.grp.tabs.version.teamPick.items[sel];
        PullUIValues();
        SwitchTeam(UI.teamName);
    }
    
    /*
    **
    UI FUNCTIONALITY
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
            dlg.grp.minimumSize = dlg.grp.size;
            dlg.layout.resize();
            dlg.onResizing = dlg.onResize = function () { this.layout.resize(); }

            // BUTTON ASSIGNMENTS
            // SETUP tab
            dlg.grp.tabs.setup.useExisting.cb.onClick = btn_UseExisting;
            dlg.grp.tabs.setup.projectName.pick.dd.onChange = RefreshSetupTab;
            dlg.grp.tabs.setup.projectName.edit.e.onChange = RefreshSetupTab;
            //dlg.grp.tabs.setup.createProject.onClick = btn_CreateProject;
            dlg.grp.tabs.setup.createProject.onClick = DEBUG;
            
            // TOOLKIT tab
            dlg.grp.tabs.toolkit.addExpressionBtn.onClick = btn_AddExpression;
            dlg.grp.tabs.toolkit.clrExpressionBtn.onClick = ClearExpressionFromSelectedProperties;
            
            // VERSION tab
            dlg.grp.tabs.version.switchBtn.onClick = btn_SwitchTeam;
            dlg.grp.tabs.version.switchTeamRnd.onClick = btn_SwitchTeamRandom;
            dlg.grp.tabs.version.saveWithTeam.onClick = BuildProjectTemplate;

            // RENDER tab
            dlg.grp.tabs.render.addToQueueBtn.onClick = NotHookedUpYet;
            dlg.grp.tabs.render.addToBatchRender.onClick = NotHookedUpYet;
            dlg.grp.tabs.render.statusBatchRender.onClick = NotHookedUpYet;
            dlg.grp.tabs.render.clearBatchRender.onClick = NotHookedUpYet;
            //dlg.grp.tabs.render.b2sub1.runBatchRender.onClick = NotHookedUpYet;
        }
		return dlg;
	}


    // UI INSTANCING
	var dlg = CBBToolsUI(thisObj);
    if (dlg !== null)
    {
        // Pull in external JSON data
        Initialize();
        
        // Initial values
        // SETUP
        dlg.grp.tabs.setup.useExisting.cb.value = true;
        dlg.grp.tabs.setup.projectName.pick.visible = true;
        dlg.grp.tabs.setup.projectName.edit.visible = false;

        // Refresh triggers
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