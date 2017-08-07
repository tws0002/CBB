$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/espnCore.jsx');

var report = "";

function renameComp(oldName){
    newName = "HOME " + oldName;
    try{
        var comp = getItem(oldName);
        comp.name = newName;
    } catch(e) {
        report += "{0} not renamed.".format(oldName);
    }
}

// rename color swatch
renameComp("COLOR SWATCH");
// rename mascot outline
renameComp("MASCOT");
renameComp("MASCOT OUTLINE");
// rename primary logo
renameComp("PRIMARY LOGO");
// rename primary logo knockout
renameComp("PRIMARY LOGO KNOCKOUT");
// rename primary logo outline
renameComp("PRIMARY LOGO OUTLINE");
// rename secondary logo
renameComp("SECONDARY LOGO");
// rename secondary logo knockout
renameComp("SECONDARY LOGO OUTLINE");
// rename secondary logo outline
renameComp("SECONDARY LOGO KNOCKOUT");

// rename wordmark 1
renameComp("WORDMARK 1");
// rename wordmark 2
renameComp("WORDMARK 2");

// move team logosheet master switch to 1. toolkit precomps
var logoSheet = getItem("Team Logosheet Master Switch");
logoSheet.parentFolder = getItem("1. TOOLKIT PRECOMPS", FolderItem);

// remove "guides" bin
var guidesBin = getItem("Guides", FolderItem);
guidesBin.remove();

// get info from "system" text layers and apply that info to dashboard
// .. with user confirmation


// save


