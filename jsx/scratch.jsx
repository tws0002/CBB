$.evalFile(((new File($.fileName)).parent).toString() + '/lib/aeCore.jsx');
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/espnCore.jsx');
$.evalFile(((new File($.fileName)).parent).toString() + '/lib/json2.js');


var t = new File(espnCore['nasRoot'] + espnCore['global_db']);
if (t.exists){
    t.open('r');
    alert(JSON.parse(t.read()));
}
else alert('nope');