// Auto-trace tools for ESPN CBB'17
// Version 1.1 -- 5/23/2017
// mark.rohrer@espn.com
#target aftereffects
#targetengine "ESPN"

(function CBBTools(thisObj)
{	
    $.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
    
    // Global Strings
    var STR = new Object();
    // Comp template object names
    STR.logosheetsBin = "Team Logo Sheets";
    STR.dashboardComp = "0. Dashboard";

    // Dashboard Text Layers
    var TXTL = new Object();
    TXTL.teamNameLayer = "TEAM NAME";
    TXTL.nicknameLayer = "NICKNAME";
    TXTL.locationLayer = "LOCATION";
    TXTL.tricodeLayer  = "TRICODE";
    TXTL.customTextA = "CUSTOM TEXT A";
    TXTL.customTextB = "CUSTOM TEXT B";
    TXTL.customTextC = "CUSTOM TEXT C";
    TXTL.customTextD = "CUSTOM TEXT D";
    
    
    // UI labels
    STR.widgetName = "ESPN Tools";
        
    // Global Errors
    var ERR = new Object();
    ERR.TL_BIN       = 'There is a problem with the \'Team Logo Sheets\' folder in your project.';
    ERR.TL_FOLDER    = 'Could not find team logo folder on the server: ';
    ERR.TL_SHEET     = 'Could not find team logo sheet on the server: ';
    ERR.TL_COMP      = 'There is a problem with the {0} comp in your project.'.format(STR.dashboardComp);
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
    CORE OPERATIONS
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
        var logoComp = getItem( STR.dashboardComp );
        var textLayers = {};
        if (logoComp === undefined){
            alert( ERR.TL_COMP );
            return false;
        } else {
            textLayers[TXTL.teamNameLayer] = logoComp.layer(TXTL.teamNameLayer);
            textLayers[TXTL.nicknameLayer] = logoComp.layer(TXTL.nicknameLayer);
            textLayers[TXTL.locationLayer] = logoComp.layer(TXTL.locationLayer);
            textLayers[TXTL.tricodeLayer]  = logoComp.layer(TXTL.tricodeLayer);
            for (k in textLayers){
                var v = textLayers[k];
                if (!(v instanceof TextLayer)){
                    alert( ERR.MISS_LAYER + k );
                    return false;
                }
            }
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
            textLayers[TXTL.teamNameLayer].property("Text").property("Source Text").setValue(teamObj.name);
            textLayers[TXTL.nicknameLayer].property("Text").property("Source Text").setValue(teamObj.nickname);
            textLayers[TXTL.locationLayer].property("Text").property("Source Text").setValue(teamObj.location);
            textLayers[TXTL.tricodeLayer].property("Text").property("Source Text").setValue(teamObj.tricode);
            logoSheet.replace(newLogoSheet);
        } catch (e) { return false; }
        return true;
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
    UI DEFINITIONS
    **
    */
	function CBBToolsUI(thisObj) {
		var onWindows = ($.os.indexOf("Windows") !== -1);
		var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", STR.widgetName, undefined, {resizeable:true});

		if (pal !== null)
			{
				var res =
				"""group { 
					orientation:'column', alignment:['fill','fill'], alignChildren:['fill','top'],
					tabs: Panel { text:'', type:'tabbedpanel', alignment:['center', 'top'], orientation:'column', alignChildren:['fill','top'],
                        setup: Panel { type:'tab', text:'Setup', alignment:['fill', 'top'], alignChildren:['fill','top'],
                            addToBatchRender: Button { text:'Add Project to .BAT', preferredSize:[-1,20] },
                            statusBatchRender: Button { text: '?', preferredSize:[20,20] },
                            clearBatchRender: Button { text: 'X', preferredSize:[20,20] },
                            addToQueueBtn: Button { text:'Add Comp to R.Queue', preferredSize:[-1,20] },
                            runBatchRender: Button { text:'Close AE & Run Batch', preferredSize:[-1,20] }
                        },
                        toolkit: Panel { type:'tab', text:'Toolkit', alignment:['fill', 'top'], alignChildren:['fill','top'],
                            addToBatchRender: Button { text:'Add Project to .BAT', preferredSize:[-1,20] },
                            statusBatchRender: Button { text: '?', preferredSize:[20,20] },
                            clearBatchRender: Button { text: 'X', preferredSize:[20,20] },
                            addToQueueBtn: Button { text:'Add Comp to R.Queue', preferredSize:[-1,20] },
                            runBatchRender: Button { text:'Close AE & Run Batch', preferredSize:[-1,20] }
                        },
                        version: Panel { type: 'tab', text:'Version', alignChildren:['fill','top'],
                            heading: StaticText { text:'Team', alignment:['fill','top'] },
                            teamPick: DropDownList {},
                            switchTeamRnd: Button { text: 'Random Team', preferredSize:[-1,20] },
                            heading: StaticText { text:'Show', alignment:['fill','top'] },
                            showPick: DropDownList {},
                            heading: StaticText { text:'Custom Text', alignment:['fill','top'] },                                
                            cA: Group { orientation:'row', heading: StaticText { text:'A', preferredSize:[10,20] }, editTxtA: EditText { text: 'Custom Text A', alignment:['fill','center'] } }
                            cB: Group { orientation:'row', heading: StaticText { text:'B', preferredSize:[10,20] }, editTxtB: EditText { text: 'Custom Text B', alignment:['fill','center'] } }
                            cC: Group { orientation:'row', heading: StaticText { text:'C', preferredSize:[10,20] }, editTxtC: EditText { text: 'Custom Text C', alignment:['fill','center'] } }
                            cD: Group { orientation:'row', heading: StaticText { text:'D', preferredSize:[10,20] }, editTxtD: EditText { text: 'Custom Text D', alignment:['fill','center'] } }
                            switchBtn: Button { text: 'S W I T C H', preferredSize:[-1,20] },
                            heading: StaticText { text:'', alignment:['fill','top'] },
                            heading: StaticText { text:'Save Project / Include in Filename:', alignment:['fill','top'] },
                            chkTeam: Checkbox { text: 'Team Tricode' },
                            chkShow: Checkbox { text: 'Show Code' },
                            chkTxtA: Checkbox { text: 'Custom Text A' },
                            chkTxtB: Checkbox { text: 'Custom Text B' },
                            chkTxtC: Checkbox { text: 'Custom Text C' },
                            chkTxtD: Checkbox { text: 'Custom Text D' },
                            saveWithTeam: Button { text: 'S A V E   . A E P', preferredSize:[-1,20] }
                        },
                        render: Panel { type:'tab', text:'Render', alignment:['fill', 'top'], alignChildren:['fill','top'],
                            addToBatchRender: Button { text:'Add Project to .BAT', preferredSize:[-1,20] },
                            statusBatchRender: Button { text: '?', preferredSize:[20,20] },
                            clearBatchRender: Button { text: 'X', preferredSize:[20,20] },
                            addToQueueBtn: Button { text:'Add RENDER_COMP to Queue', preferredSize:[-1,20] },
                            addToQueueBtn: Button { text:'Add RENDER_COMP_WIP to Queue', preferredSize:[-1,20] },
                            runBatchRender: Button { text:'Close AE & Run Batch', preferredSize:[-1,20] }
                        }
					}
				}""";
				pal.grp = pal.add(res);
				
				pal.layout.layout(true);
				pal.grp.minimumSize = pal.grp.size;
				pal.layout.resize();
				pal.onResizing = pal.onResize = function () { this.layout.resize(); }

				pal.grp.tabs.version.switchBtn.onClick = function () { 
                    var sel = pal.grp.tabs.version.teamPick.selection.text;
                    SwitchTeam(sel);
                }
                pal.grp.tabs.version.switchTeamRnd.onClick = function () {
                    var max = TeamList().length;
                    var sel = Math.floor(Math.random() * (max + 1));
                    SwitchTeam(pal.grp.tabs.version.teamPick.items[sel].text);
                    pal.grp.tabs.version.teamPick.selection = pal.grp.tabs.version.teamPick.items[sel];
                }
				pal.grp.tabs.version.saveWithTeam.onClick = BuildProjectTemplate;
        
                pal.grp.tabs.render.addToQueueBtn.onClick = NotHookedUpYet;
                pal.grp.tabs.render.addToBatchRender.onClick = NotHookedUpYet;
                pal.grp.tabs.render.statusBatchRender.onClick = NotHookedUpYet;
                pal.grp.tabs.render.clearBatchRender.onClick = NotHookedUpYet;
                //pal.grp.tabs.render.b2sub1.runBatchRender.onClick = NotHookedUpYet;
			}
		return pal;
	}
    

	var dlg = CBBToolsUI(thisObj);
    var teams = TeamList();
    if (dlg !== null)
    {
        dlg.grp.tabs.version.teamPick.add("item", "");
        for (t in teams){
            dlg.grp.tabs.version.teamPick.add("item", teams[t]);
        }    
        if  (dlg instanceof Window){
            dlg.center();
            dlg.show();
        } 
        else
            dlg.layout.layout(true);
    }

})(this);