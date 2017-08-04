//$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');

var folders = [
    "Y:\\Workspace\\MASTER_PROJECTS\\CBB\\ASSETS\\FRENZY CLIPS 01",
    "Y:\\Workspace\\MASTER_PROJECTS\\CBB\\ASSETS\\FRENZY CLIPS 02"
    ];
    

for (f in folders){
    if (!folders.hasOwnProperty(f)) continue;
    var folder = new Folder(folders[f]);
    if (!folder.exists){
        $.writeln('Fail.');
        continue;
    }
    
    var num = folders[f].split(' ')[folders[f].split(' ').length-1];
    $.writeln(num);
    /*
    var teams = Tier2TeamList();
    
    for (t in teams){
        if (!teams.hasOwnProperty(t)) continue;
        var team = new Team(teams[t]);
        var file = "FRENZY_{0}_{1}.mov".format(num,team.tricode);
        file = new File(folders[f].toString() + '/'+ file);
        if (!file.exists){
            $.writeln('Fail ' + teams[t]);
            continue;
        }
        file.rename(teams[t] + ".mov");
    }
    
    /*
    var files = folder.getFiles();
    for (file in files){
        if (!files.hasOwnProperty(file)) continue;
        var name = files[file].toString();
        name = name.split('_');
        var tri = name[name.length-1];
        tri = tri.replace('.mov','');
        $.writeln(tri);
    }/**/
}