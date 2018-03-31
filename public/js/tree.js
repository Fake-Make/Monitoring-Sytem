$(function(){

$("#jstree").jstree({
              'core' : {
                  'check_callback' : true,
                  'data': { "url" : "/areas",
                  "dataType":"json",
                  "data" : function(node){
                    return {"id" : node.id};
                  }
                  }
                },

"plugins" : [ "contextmenu","wholerow","types","state","sort","unique" ],

'sort' : function(a, b) {
  a1 = this.get_node(a);
  b1 = this.get_node(b);
  if (a1.icon == b1.icon){
      return (a1.text > b1.text) ? 1 : -1;
  } else {
      return (a1.icon > b1.icon) ? 1 : -1;
  }},

"types" : {

    "default" : {
      "valid_children" : ["root","variable","area","device","trigger"],
      "icon" : "src/img/root1.png"
    },

    "root" : {
      "valid_children" : ["default","variable","area","device","trigger"],
      "icon" : "src/img/root1.png"
    },

    "#" : {
      "valid_children" : ["root", "variable","folder","trigger"],
      "icon" : "src/img/root.png",
    },

    "area" : {
      "icon" : "src/img/folder.png",
      "valid_children" : ["variable","area","device","trigger"]
    },

    "variable" : {
      "icon" : "src/img/file.png",
      "valid_children" : []
    },

    "device" : {
      "icon" : "src/img/device.png",
      "valid_children" : ["pin"]
    },

    "pin" : {
      "icon" : "src/img/device.png",
      "valid_children" : []
    },

    "trigger" : {
      "icon" :  "src/img/trigger.png",
      "valid_children" : []
    }
  },

"contextmenu":{
    "items": function($node) {
      return{
        "createFolder" : {
          "separator_before"	: false,
          "separator_after"	: true,
          "_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
          "label"				: "Create Area",
          "action"			: function (data) {
            var inst = $.jstree.reference(data.reference),
                obj = inst.get_node(data.reference),
                text= prompt("area name: ");
            inst.create_node(obj, {"id" : obj.id+"/"+text,"text" :text, "type" :"area","state":{"opened":true}}, "last", function (new_node) {
              console.log("created area");
            });
          }
        },

        "createVariable" : {
        	"separator_before"	: false,
        	"separator_after"	: true,
        	"_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
        	"label"				: "Create Variable",
        	"action"			: function (data) {
        		var inst = $.jstree.reference(data.reference),
        				obj = inst.get_node(data.reference),
                text= prompt("Variable name: ");
            inst.create_node(obj, {"id" : obj.id+"/"+text,"text" :text, "type" :"variable"}, "last", function (new_node) {
              console.log("created variable");
            });
        	}
        },

        "createDevice" : {
          "separator_before"	: false,
          "separator_after"	: true,
          "_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
          "label"				: "Create Dev",
          "action"			: function (data) {
            var inst = $.jstree.reference(data.reference),
            obj = inst.get_node(data.reference),
            text= prompt("Device name: ");
            inst.create_node(obj, {"id" : obj.id+"/"+text,"text" :text, "type" :"device","state":{"opened":true}}, "last", function (new_node) {
              console.log("created device");
              });
          }
        },
        "createTrigger" : {
          "separator_before"	: false,
          "separator_after"	: true,
          "_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
          "label"				: "Create Trigger",
          "action"			: function (data) {
            var inst = $.jstree.reference(data.reference),
                obj = inst.get_node(data.reference),
                text= prompt("trigger name: ");
            inst.create_node(obj, {"id" : obj.id+"/"+text,"text" :text, "type" :"trigger","data":{"state":"just created"}}, "last", function (new_node) {
              console.log("created trigger");
            });
          }
        },

        "rename" : {
					"separator_before"	: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("rename_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Rename",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.edit(obj);
					}
				},

        "remove" : {
					"separator_before"	: false,
					"icon"				: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("delete_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Delete",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							  obj = inst.get_node(data.reference);
						if(inst.is_selected(obj)) {
							inst.delete_node(inst.get_selected());
						}
						else {
							inst.delete_node(obj);
						}
					}
				},
      }
      }}
})

.on('create_node.jstree', function(e, data) {
    console.log('saved');
    var jsonstring = JSON.stringify(data.node, null, '\t');
    console.log("это новый узел "+ jsonstring );
    $.ajax({
            url: "/createNode",
            type: "post",
            dataType: 'json',
            data:data.node, // jsonstring,
            success: function(resp) {
              if (resp.code === 'success') {
                console.log('created');
              } else {
                console.error('Ошибка получения данных с сервера: ', resp.message);
                }
              },
            error: function(error) {
            console.error('Ошибка: ', error);
            }
          });
})

.on('rename_node.jstree',function(e,data){
      console.log('renamed');
      var data ={
        "id": data.node.id,
        "text": data.node.text,
      };
      var jsonstring = JSON.stringify(data, null, '\t');
      console.log("rename "+ jsonstring );
      $.ajax({
              url: "/renameNode",
              type: "post",
              dataType: 'json',
              data:data,//jsonstring,
              success: function(resp) {
                if (resp.code === 'success') {
                console.log('renamed');
                } else {
                console.error('Ошибка получения данных с сервера: ', resp.message);
                }
              },
              error: function(error) {
                console.error('Ошибка: ', error);
              }
            });
})

.on('delete_node.jstree',function(e,data){
  var data = data.node.id;
  var jsonstring = JSON.stringify(data, null, '\t');
  console.log("delete "+ jsonstring );
  $.ajax({
          url: "/deleteNode",
          type: "post",
          dataType: 'json',
          data:{id:data},
          success: function(resp) {
            if (resp.code === 'success') {
            console.log('deleted');
            } else {
            console.error('Ошибка получения данных с сервера: ', resp.message);
            }
          },
          error: function(error) {
            console.error('Ошибка: ', error);
          }
        });

})

.on('changed.jstree', function(e, data) {


 })
 //optional
 .on('move_node.jstree', function(e, data) {
   //console.log('moved');
   //refresh_json ();
 })

 .on('select_node.jstree', function(e, data) {
   var dat = data.node.id;
   var jsonstring = JSON.stringify(dat, null, '\t');
   console.log("selected "+ jsonstring );
   $.ajax({
           url: "/selectNode",
           type: "get",
           dataType: 'json',
           data:{id:dat},
           success: function(value) {
             console.log("get data:" + value);
              var jsonstring = JSON.stringify(value, null, '\t');
             editor.setValue(jsonstring);
           },
           error: function(error) {
             console.error('Ошибка: ', error);
           }
         });

/*
   if(data.node.type=="root"){
     console.log("root");
     var v = $("#jstree").jstree(true).get_json('#', {}, false );
     var jsonstring = JSON.stringify(v, null, '\t');
     editor.setValue(jsonstring);
   }else if (data.node.type=="trigger") {
     var txt= data.node.data,
         jsonstring = JSON.stringify(txt, null, '\t');
     editor.setValue(jsonstring);
   }
   else{
     try {
       var v = $("#jstree").jstree(true).get_json(data.node, {},false );
       var txt= data.node.data.value,
           jsonstring = JSON.stringify(txt, null, '\t');
       editor.setValue(jsonstring);
    } catch (ex) {
       var jsonstring = JSON.stringify(data.node, null, '\t');
       editor.setValue(jsonstring);
   }
 }
 */
 })

 //optional
 $("#save").on("click",function(e,data) {
       var dat = $("#jstree").jstree(true).get_json(data);
       var node = $("#jstree").jstree(true).get_selected();//?
       var val=$("#jstree").jstree(true).get_json(node);//?
       var jsonstring= JSON.stringify(dat, null,'\t');
       console.log("это из узла "+ jsonstring );
       var edit= editor.getValue();
       console.log("это из эдитора"+ edit);
/*$.ajax({
            url: "/",
            type: "post",
            dataType: 'json',
            data:data
          });*/
 });

var editor = ace.edit("editor");
editor.setTheme("ace/theme/ambiance");
editor.getSession().setMode("ace/mode/json");

// Ctrl-S
editor.commands.addCommand({
    name: 'saveChanges',
    bindKey: {win: 'Ctrl-S'},
    exec: function(editor) {
        var edit = editor.getValue();
        var node = $("#jstree").jstree(true).get_selected();
        var data = [node, edit]
        console.log("Ctrl-S " + data);
        $.ajax({
                url: "/changed",
                type: "post",
                dataType: 'json',
                data:data,
                success: function(resp) {
                  if (resp.code === 'success') {
                  console.log('changed');
                  } else {
                  console.error('Ошибка получения данных с сервера: ', resp.message);
                  }
                },
                error: function(error) {
                  console.error('Ошибка: ', error);
                }
              });
    },
    readOnly: false // false, если мы не хотим чтобы в readOnly работало
})
//refresh_json ();





//extra

function refresh_json (){
  var v = $("#jstree").jstree(true).get_json('#', {}, false );
  //console.log(v);
  var jsonstring = JSON.stringify(v, null, '\t');
  //$("#jsonstring").html("<h1>JSON string</h1><code>" + jsonstring + "</code>");
  editor.setValue(jsonstring);
}

function _update(jsonstring){
  var data = $.extend(jsonstring, {
        action: 'update'
    });
    $.ajax({
       url: "/update",
       data: data,
       dataType: 'json',
       success: function(resp) {
           if (resp.code === 'success') {
               console.log('category moved');
           } else {
               console.error('Ошибка получения данных с сервера: ', resp.message);
           }
       },
       error: function(error) {
           console.error('Ошибка: ', error);
       }
   });
}



})
