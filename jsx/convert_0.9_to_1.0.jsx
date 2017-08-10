$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/espnCore.jsx');

var report = "";

function renameComp(oldName){
    newName = "HOME " + oldName;
    try{
        var comp = getItem(oldName);
        comp.name = newName;
    } catch(e) {
        report += "· {0} not renamed.\n".format(oldName);
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
try {
    var logoSheet = getItem("Team Logosheet Master Switch");
    logoSheet.parentFolder = getItem("1. TOOLKIT PRECOMPS", FolderItem);
} catch (e) {
     report += "· Could not move Team Logosheet Master Switch comp to 1. TOOLKIT PRECOMPS bin\n";
}

try {
    // remove "guides" bin
    var guidesBin = getItem("Guides", FolderItem);
    guidesBin.remove();
} catch (e) {
    report += "· Could not remove obsolete 'Guides' bin\n";
}

// get info from "system" text layers and apply that info to dashboard
// .. with user confirmation
try {
    var dash = getItem("0. Dashboard");

    if (dash) {
        var project = dash.layer("PROJECT");
        var scene = dash.layer("SCENE");
    }

    var scene = new SceneData("CBB", "ae");
    scene.setProject(project.text.sourceText.toString());
    scene.setName(scene.text.sourceText.toString());

    dash.comment = scene.getTag();
} catch (e) {
    report += "· Could not convert metadata tag to new pipeline. You will have to set this project up in the UI\n";
}

alert(report);
// save


