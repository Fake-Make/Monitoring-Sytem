$(function(){
//tempGauge
var jsonT=(function(){
  var jsonT=null;
  $.ajax({
    'async': false,
    'glodal': false,
    'url': '/js/gauges.json',
    'dataType': 'json',
    'success': function(result){
      jsonT=result.tempGauge;
    }
  });
  return jsonT;
})();
console.log("getjson " + JSON.stringify(jsonT));
$("#tempGauge").dxCircularGauge($.extend(true,{},jsonT));
//cpuGauge
var jsonC=(function(){
  var jsonC=null;
  $.ajax({
    'async': false,
    'glodal': false,
    'url': '/js/gauges.json',
    'dataType': 'json',
    'success': function(result){
      jsonC=result.cpuGauge;
    }
  });
  return jsonC;
})();
$("#cpuGauge").dxCircularGauge($.extend(true,{},jsonC));
//fGauge
var jsonF=(function(){
  var jsonF=null;
  $.ajax({
    'async': false,
    'glodal': false,
    'url': '/js/gauges.json',
    'dataType': 'json',
    'success': function(result){
      jsonF=result.fGauge;
    }
  });
  return jsonF;
})();
$("#fGauge").dxCircularGauge($.extend(true,{},jsonF));
//linGauge
var jsonL=(function(){
  var jsonL=null;
  $.ajax({
    'async': false,
    'glodal': false,
    'url': '/js/gauges.json',
    'dataType': 'json',
    'success': function(result){
      jsonL=result.linGauge;
    }
  });
  return jsonL;
})();
$("#linGauge").dxLinearGauge($.extend(true,{},jsonL));

//anotherGauge
var jsonA=(function(){
  var jsonA=null;
  $.ajax({
    'async': false,
    'glodal': false,
    'url': '/js/gauges.json',
    'dataType': 'json',
    'success': function(result){
      jsonA=result.anotherGauge;
    }
  });
  return jsonA;
})();
$("#anotherGauge").dxPieChart($.extend(true,{},jsonA));
});
