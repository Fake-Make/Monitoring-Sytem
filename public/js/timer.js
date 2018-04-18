var stattimer = setInterval(() => {
$.ajax({
    type:'get',
    url:'/request',
    response:'text',
    success:function (data) {
        $("#tem").html(data.tem);
        $("#hum").html(data.hum);
    }
});
},
2000
);