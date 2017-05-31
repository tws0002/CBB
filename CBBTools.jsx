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

    // Dashboard Text Layers
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
    UIMETA = new Object();
    // SETUP
    // text fields
    UIMETA.projectName = "";
    UIMETA.sceneName = "";
    // checkboxes
    UIMETA.useExisting = false;
    
    // VERSION
    // text fields
    UIMETA.teamName = "";
    UIMETA.nickname = "";
    UIMETA.location = "";
    UIMETA.tricode = "";
    UIMETA.showName = "";
    UIMETA.customA = "";
    UIMETA.customB = "";
    UIMETA.customC = "";
    UIMETA.customD = "";
    
    // checkboxes
    UIMETA.useTricode = "";
    UIMETA.useShowcode = "";
    UIMETA.useCustomA = "";
    UIMETA.useCustomB = "";
    UIMETA.useCustomC = "";
    UIMETA.useCustomD = "";
    // priority order in which the text fields are appended to filename
    UIMETA.namingOrder = [
        UIMETA.useShowcode,
        UIMETA.useTricode,
        UIMETA.useCustomA,
        UIMETA.useCustomB,
        UIMETA.useCustomC,
        UIMETA.useCustomD
    ];
    
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

        /*
         * Do the thing!
         */
        try {
            for (tl in TEAMTXTL){
                if (!(TEAMTXTL.hasOwnProperty(tl))) continue;
                var templayer = dashComp.layer(TEAMTXTL[tl]);
                if (templayer instanceof TextLayer){
                    tempLayer.property("Text").property("Source Text").setValue(UIMETA[tl]);
                }
            }
            logoSheet.replace(newLogoSheet);
        } catch (e) { return false; }
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
            var templayer = logoComp.layer(tl);
            if (templayer instanceof TextLayer)
                // NOTE THAT CUSTOMTXT is different from CUSTEXTL
                tempLayer.property("Text").property("Source Text").setValue(UIMETA[tl]);
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
    BUILDERS
    **
    */
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

        BuildProjectTemplate();
        var dashboard = getItem(STR.dashboardComp);
        
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

    function BuildToolkittedPrecomps () {
        var jsnDir = new File( $.filename ).parent.parent;
        var jsnFile= new File( jsnDir.fullName + '/json/logosheet.json' );

        jsnFile.open('r');
        var layout = jsnFile.read();
        layout = JSON.parse(layout);

        // get required scene objects
        // ADD PROPER ERROR HANDLING
        var logo_sheet = getItem("Team Logosheet Master Switch");
        if (logo_sheet === undefined){ return false; }
        var logo_sheet_bin = getItem("1. TOOLKIT COMPS - USE THESE", FolderItem);
        if (logo_sheet_bin === undefined)
            logo_sheet_bin = app.project.items.addFolder("1. TOOLKIT COMPS - USE THESE");

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

    /*
    **
    NULLS
    **
    */
    function NotHookedUpYet () {
        alert("This button isn't hooked up yet. Check back later.")
    }
    
    /*
    **
    UI META & SCENE INTEGRATION
    **
    */
    function UpdateUIMETA () {
        UIMETA.teamName = pal.grp.tabs.version.teamPick.selection.text;
        UIMETA.teamObj = Team(UIMETA.teamName);
        UIMETA.nickname = Team.nickname;
        UIMETA.location = Team.location;
        UIMETA.tricode = Team.tricode;
        
        UIMETA.showode = "";
        
        UIMETA.customA = pal.grp.tabs.version.cA.txt;
        UIMETA.customB = pal.grp.tabs.version.cB.txt;
        UIMETA.customC = pal.grp.tabs.version.cC.txt;
        UIMETA.customD = pal.grp.tabs.version.cD.txt;
    
        UIMETA.useTricode = pal.grp.tabs.version.chkTeam.value;
        UIMETA.useShowcode= pal.grp.tabs.version.chkShow.value;
        UIMETA.useCustomA = pal.grp.tabs.version.chkTxtA.value;
        UIMETA.useCustomB = pal.grp.tabs.version.chkTxtB.value;
        UIMETA.useCustomC = pal.grp.tabs.version.chkTxtC.value;
        UIMETA.useCustomD = pal.grp.tabs.version.chkTxtD.value;
    }
    
    function PushUIMETA () {
        return true;
    }
    
    function PushToProject () {
        //
        UpdateUIMETA();
        // set scene values
        // set deliverable tag fom UIMETA
        // set scene tag from UIMETA
        // set version from interpeted value
        // save backup
        return true;
    }
    
    function PullFromProject () {
        // pull deliverable tag to UIMETA
        // pull scene tag to UIMETA
        // pull version to UIMETA
        // set UI from UIMETA
        return true;
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
    function btn_AddExpression (){
        var exprGet = pal.grp.tabs.toolkit.expressionPick.selection.text;
        var expression = GetExpressionsFromSettings()[exprGet];
        AddExpressionToselectedProperties(expression);
    }
    
    function btn_SwitchTeam (){
        UpdateUIMETA();
        if (UIMETA.teamName !== '')
            SwitchTeam(UIMETA.teamName);
    }
    
    function btn_SwitchTeamRandom (){
        var max = TeamList().length;
        var sel = Math.floor(Math.random() * (max + 1)) +1;
        pal.grp.tabs.version.teamPick.selection = pal.grp.tabs.version.teamPick.items[sel];
        UpdateUIMETA();
        SwitchTeam(UIMETA.teamName);
    }
    
    function RefreshSetupTab(){
        var useExisting = dlg.grp.tabs.setup.useExisting.cb.value;
        if (useExisting){
            // swap 
            dlg.grp.tabs.setup.projectName.pick.visible = true;
            dlg.grp.tabs.setup.projectName.edit.visible = false;
            UIMETA.projectName = dlg.grp.tabs.setup.projectName.pick.dd.selection.text;
        } else {
            dlg.grp.tabs.setup.projectName.pick.visible = false;
            dlg.grp.tabs.setup.projectName.edit.visible = true;
            UIMETA.projectName = dlg.grp.tabs.setup.projectName.edit.e.text;
            dlg.grp.tabs.setup.projectName.edit.e.text = "";
        }
        UIMETA.sceneName = dlg.grp.tabs.setup.sceneName.e.text;
    }
    
    function RefreshToolkitTab(){
        var expressions = GetExpressionsFromSettings();
        dlg.grp.tabs.toolkit.expressionPick.add("item", "");
        for (var e in expressions){
            dlg.grp.tabs.toolkit.expressionPick.add("item", e);
        }
    }
    
    function RefreshVersionTab(){
        dlg.grp.tabs.version.teamPick.add("item", "");
        for (var t in teams){
            dlg.grp.tabs.version.teamPick.add("item", teams[t]);
        } 
    }
    
    function RefreshRenderTab(){
        return true;
    }
    
    function RefreshAll(){
        RefreshSetupTab();
        RefreshToolkitTab();
        RefreshVersionTab();
        RefreshRenderTab();
    }
    
	function CBBToolsUI(thisObj) {
		var onWindows = ($.os.indexOf("Windows") !== -1);
		var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", STR.widgetName, undefined, {resizeable:true});

		if (pal !== null)
        {
            var res = new File((new File($.fileName).parent.toString()) + '/res/CBBTools.res');
            res.open('r');
            pal.grp = pal.add(res.read());

            pal.layout.layout(true);
            pal.grp.minimumSize = pal.grp.size;
            pal.layout.resize();
            pal.onResizing = pal.onResize = function () { this.layout.resize(); }

            // BUTTON ASSIGNMENTS
            // SETUP tab
            pal.grp.tabs.setup.useExisting.cb.onClick = RefreshSetupTab;
            // TOOLKIT tab
            pal.grp.tabs.toolkit.addExpressionBtn.onClick = btn_AddExpression;
            pal.grp.tabs.toolkit.clrExpressionBtn.onClick = ClearExpressionFromSelectedProperties;
            
            // VERSION tab
            pal.grp.tabs.version.switchBtn.onClick = btn_SwitchTeam;
            pal.grp.tabs.version.switchTeamRnd.onClick = btn_SwitchTeamRandom;
            pal.grp.tabs.version.saveWithTeam.onClick = BuildProjectTemplate;

            pal.grp.tabs.render.addToQueueBtn.onClick = NotHookedUpYet;
            pal.grp.tabs.render.addToBatchRender.onClick = NotHookedUpYet;
            pal.grp.tabs.render.statusBatchRender.onClick = NotHookedUpYet;
            pal.grp.tabs.render.clearBatchRender.onClick = NotHookedUpYet;
            //pal.grp.tabs.render.b2sub1.runBatchRender.onClick = NotHookedUpYet;
        }
		return pal;
	}

    // UI INSTANCING
	var dlg = CBBToolsUI(thisObj);
    if (dlg !== null)
    {
        // SET ALL INITIAL UI VALUES
        var teams = TeamList();
        
        // SETUP tab
        dlg.grp.tabs.setup.useExisting.cb.value = true;
        dlg.grp.tabs.setup.projectName.pick.visible = true;
        dlg.grp.tabs.setup.projectName.edit.visible = false;
        // rest of em
        RefreshSetupTab();
        RefreshToolkitTab();
        RefreshVersionTab();
        RefreshRenderTab();
        // INSTANCE WINDOW
        if  (dlg instanceof Window){
            dlg.center();
            dlg.show();
        } 
        // INSTANCE PANEL
        else
            dlg.layout.layout(true);
    }

})(this);