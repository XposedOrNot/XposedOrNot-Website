window.onload = function () {
    setTimeout(function () {
        var t = performance.timing;
        t3 = t.loadEventEnd - t.responseEnd
        $('#succ').html('<br><br><br>[ * ] Page load time &nbsp: ' + t3 + ' milliseconds')
    }, 0);
}

function val_e(input) {
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (reg.test(input)) {
        return true;
    } else {
        return false;
    }
}

$(document).ready(function () {
    $("#searchMe").click(function (abacus) {
        abacus.preventDefault();
        var str = document.getElementById("edhu").value.toLowerCase().trim();
        f = 0;

        const newLocal = 'https://api.xposedornot.com/v1/check-email/';

        edutu = newLocal + encodeURIComponent(str);
        var time = new Date();
        tt = '<br>[ * ] Search started &nbsp &nbsp: <strong>' + time + "<strong>";
        nn = $('#succ').html()
        $('#succ').html(nn + tt)
        var myjson;
        var j = $.ajax(edutu).done(function (n) {
            myjson = n;
            var time1 = new Date();
            t2 = time1.getTime() - time.getTime()
            l = myjson.breaches;
            nn = ""
            if (l.toString().length < 0) {
                $('#succ').html('<b>Exposed Breaches </b> <span class="badge" style="float:right">No breaches found for this email</span>')
            } else {
                nn = $('#succ').html()
                $('#succ').html(nn + "<br>[ * ] Checking Initiated for email <strong>" + str + " </strong>")
                nn = $('#succ').html()
                $('#succ').html(nn + "<br>[ * ] Identified data breaches <strong>: " + l + " </strong>")
                nn = $('#succ').html()
                $('#succ').html(nn + "<br>[ * ] Search completed at <strong>: " + time1 + " </strong>")
                nn = $('#succ').html()
                $("#succ").html(nn + "<br>[ * ] Time taken to complete this search : <strong>" + t2 + "</strong> milliseconds");
            }
            if (n.status === 429) {
                nn = $('#succ').html()
                $("#succ").html(nn + "<br>You are currently being throttled. Please slow down and try again !")
            }
        }).fail(function (n) {
            if (n.status === 404) {
                nn = $('#succ').html()
                $("#succ").html(nn + "<br>No breaches found for this email.")
            } else if (n.status === 502) {
                $("#succ").html("<h2>Oops unexpected error...</h2>");
            } else {
                $('#data_email').html('<b>Searched Email </b> <span class="badge" style="float:right">' + str + '</span>')
            }
        })

    });
});
