setInterval(function () {
        var bar = $('.bar'),
            bw = bar.width(),
            percent = bar.find('.percent2'),
            circle = bar.find('.circle2'),
            ps =  percent.find('span'),
            cs = circle.find('span'),
            name = 'rotate';

        var t = $('#tem'), val = t.html();
        val = val.replace('°C', '');
        if (val >=0 && val <= 100){
            var w = 100-val, pw = (100-val) + 700,
                pa = {
                    width: w+'%'
                },
                cw = (bw-pw),
                ca = {
                    left: cw+'%'
                }
            ps.animate(pa);
            cs.text(val+'°C');
            circle.animate(ca, function() {
                // circle.removeClass(name) //не удалятб!!!11
            }).addClass(name);
        } else {
            alert('range: 0 - 100');
            alert(val);
        }
    }, 2000);