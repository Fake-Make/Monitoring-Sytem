$(function(){

  var json=(function(){
    var json=null;
    $.ajax({
      'async': false,
      'glodal': false,
      'url': '/js/gauges.json',
      'dataType': 'json',
      'success': function(result){
        json=result.gauges;
      }
    });
    return json;
  })();
  console.log("data " + JSON.stringify(json,null,'\t'));
$("#gaugestree").jstree({
              'core' : {
                  'data': json},


"plugins" : ["wholerow","state","sort","unique" ]


})



.on('select_node.jstree', function(e, data) {
  var dat = data.node.text;
  console.log("selected "+ dat );

  var value=(function(){
    var value=null;
  $.ajax({
    'async': false,
    'glodal': false,
    'url': '/js/gauges.json',
    'dataType': 'json',
    'success': function(result){
      console.log(dat);
      switch(dat){
        case "cpuGauge":
          value=result.cpuGauge;
          console.log("value "+ JSON.stringify(value,null,'\t'));
          editorG.setValue(JSON.stringify(value,null,'\t'));
         $("#gauge").empty();
          $("#gauge:empty").dxCircularGauge($.extend(true,{},value));
        break;
        case "tempGauge":
          value=result.tempGauge;
          console.log("value "+ JSON.stringify(value,null,'\t'));
          editorG.setValue(JSON.stringify(value,null,'\t'));
       $("#gauge").empty();
          $("#gauge").dxCircularGauge($.extend(true,{},value));
        break;
        case "linGauge":
          value=result.linGauge;
          console.log("value "+ JSON.stringify(value,null,'\t'));
          editorG.setValue(JSON.stringify(value,null,'\t'));
          $("#gauge").empty();
          $("#gauge").dxLinearGauge($.extend(true,{},value));
        break;
        case "fGauge":
          value=result.fGauge;
          console.log("value "+ JSON.stringify(value,null,'\t'));
          editorG.setValue(JSON.stringify(value,null,'\t'));
          $("#gauge").empty();
          $("#gauge").dxCircularGauge($.extend(true,{},value));
        break;
        case "anotherGauge":
          value=result.anotherGauge;
          console.log("value "+ JSON.stringify(value,null,'\t'));
          editorG.setValue(JSON.stringify(value,null,'\t'));
         $("#gauge").empty();
          $("#gauge").dxPieChart($.extend(true,{},value));
        break;
      }

    }
  });
  return value;})();

  //console.log("gauge " );
      })
      var editorG = ace.edit("editorG");
      editorG.setTheme("ace/theme/textmate");
      editorG.getSession().setMode("ace/mode/json");
})
