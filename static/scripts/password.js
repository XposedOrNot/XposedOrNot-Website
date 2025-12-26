function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

$("#edhu").on("change keyup paste", function () {
    $("#output").val(keccak_512($("#edhu").val()));
})
$('#alertMeModal').on('hidden.bs.modal', function (e) {
    document.getElementById("h2head").className = "modal-header-primary";
    $('#message-text').val("You are currently being added to the alert notification service of XposedOrNot. Please make sure to complete the below shown challenge and then click 'Alert Me'.");
    $("#alertMe").show();
    $("#alertMeClose").hide();
    $("#a_succ").hide();
    $("#b_succ").hide();
})
$('#alertMeModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget)
    var recipient = button.data('xonnie')
    var modal = $(this)
    $('#thedudalModal').modal('hide');
})

const isEmpty = (value) => value == null || (typeof value === "string" && value.trim().length === 0);

function _turnstileCb() {
    const turnstileStatus = turnstile.render('#turns', {
        sitekey: '0x4AAAAAAAA_T_0Qt4kJbXno',
        theme: 'light',
    });

    let timerId = setInterval(() => {
        $('#alertMe').prop('disabled', true);
        const turnstileResponse = turnstile.getResponse(turnstileStatus);
        if (!isEmpty(turnstileResponse)) {
            $('#alertMe').prop('disabled', false);
            clearInterval(timerId);
        }
    }, 1000);
}

$(document).ready(function () {
    $("#alertMe").click(function (func_alert) {
        var add_str = document.getElementById("recipient-name").value;
        if ((add_str.length == 0) || validateEmail(document.getElementById("recipient-name").value) == false) {
            $("#b_succ").show();
            $('#recipient-name').focus();
            return false;
        } else {
            $("#b_succ").hide();
        }
        $("#a_succ").hide();

        koodudal = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(add_str);
        var myjson;
        var j = $.ajax(koodudal)
            .done(function (n) {
                $('#message-text').html("Successfully added to the alert service. Please check your email and click on the verification link to confirm");
                document.getElementById("h2head").className = "modal-header-success";
                $("#alertMe").hide();
                $("#alertMeClose").show();
            })
            .fail(function (n) {
                $('#message-text').html("We thank you for your interest. However our records indicate you are already added to the AlertMe Service.");
                document.getElementById("h2head").className = "modal-header-danger";
                $("#alertMe").hide();
                $("#alertMeClose").show();
            })

    });

    $("#searchMe").click(function (event) {
        event.preventDefault();
        const email = $("#output").val().substring(0, 10);
        const domain = $("#edhu").val();

        $("#hhead").removeClass().addClass("modal-header-success");
        $("#dismiss").removeClass().addClass("btn-primary btn btn-success");
        $("#mbody").hide();
        $("#ssvisible").html('<h2>Searching ...</h2>');
        $("#warn").hide();
        $("#info").hide();
        $("#succ").show();
        $("#spins").show();
        $("#alert_").show();
        $('#data_email').text(email);
        $('#data_breach').html('No breaches found !');

        if (!email || !domain) {
            document.getElementById("hhead").className = "modal-header-danger";
            document.getElementById("dismiss").className = "btn btn-danger";
            $('#data_email').text(email);
            $('#data_breach').html('Not a valid email to check');
            $("#succ").hide();
            $("#spins").hide();
            $("#warn").hide();
            $("#alert_").hide();
            document.getElementById("info").className = "modal-header-danger";
            $("#info").show();
            $("#mbody").show();
        }

        const apiUrl = 'https://passwords.xposedornot.com/api/v1/pass/anon/';
        const encodedEmail = encodeURIComponent(email);

        let myjson;
        const jqXHR = $.ajax(apiUrl + encodedEmail)
            .done(function (response) {
                myjson = response;
                const breachCount = myjson.SearchPassAnon.count;
                const breachChars = myjson.SearchPassAnon.char;
                const breachWordList = myjson.SearchPassAnon.wordlist;
                if (breachChars.toString().length < 0) {
                    $('#data_breach').html('No breaches found !');
                } else {
                    document.getElementById("hhead").className = "modal-header-danger";
                    document.getElementById("dismiss").className = "btn-danger btn";
                    $("#mbody").show();
                    $("#ssvisible").html('<h2>Search results for you</h2>');
                    $("#warn").show();
                    $("#succ").hide();
                    $("#spins").hide();
                    $("#info").hide();
                    $("#alert_").show();

                    if (1 == 0) { } else {
                        nn1 = '<br>'
                    }

                    if (breachCount > 0) {
                        nn = '<b>Oops</b> ! This <b>password</b> has already been exposed in a previous data breach and it was seen  <b>' + breachCount + ' </b>time(s).  ' + nn1 + '<br>We would recommend you to change & avoid using this credential for any of your accounts/transactions. <br>  <br>Please read <a href="https://blog.xposedornot.com/password-security-guide/" target="_blank"> password best practices </a>and stay safe.<b>';
                    } else {
                        nn = '<b>Excellent</b> ! This <b>password</b> is safe for now.  <br>We would recommend you to change & avoid using this credential for any of your accounts/transactions. <br><b>';
                    }
                    $("#warn").html(nn);
                }
                if (response.status === 429) {
                    $("#mbody").show();
                    $("#spins").hide();
                    $("#succ").html("You are currently being throttled. Please slow down and try again !")
                    $('#data_email').text(email);
                }
            })
            .fail(function (response) {
                if (response.status === 429) {
                    $("#mbody").show();
                    $("#spins").hide();
                    $("#succ").html("You are currently being throttled. Please slow down and try again !")
                    $('#data_email').text(email);
                } else if (response.status === 502 || response.status === 504) {
                    document.getElementById("hhead").className = "modal-header-danger";
                    $("#mbody").show();
                    $("#info").show();
                    $("#dismiss").hide();
                    $("#spins").hide();
                    $("#succ").hide();
                    $("#info").html("Embarassing ! Looks like something is not right at server end. I have notified the right person to check on this.Please try again after some time.<br><br>Regret the inconvenience caused !")
                    $('#data_email').text(email);
                } else {
                    $("#mbody").show();
                    $("#spins").hide();
                    $("#warn").hide();
                    $('#data_email').text(email);
                    $('#data_breach').html('No breaches found !');
                    $("#ssvisible").html('<h2>Search results for you</h2>');
                }
            })
        $('#thedudalModal').modal()
    });
});

$(document).ready(function () {
    var videoModal = $('#vidModal');
    var videoElement = $('#video');
    var videoSrc;

    $('.video-btn').click(function () {
        videoSrc = $(this).data("src");
    });

    videoModal.on('shown.bs.modal', function (event) {
        videoElement.attr('src', videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
    });

    videoModal.on('hide.bs.modal', function (event) {
        videoElement.attr('src', videoSrc);
    });

    $("#detailedReport").click(function () {
        var url = "data-breaches-risks.html?e=" + document.getElementById("edhu").value.toLowerCase();
        window.open(url);
        window.opener = null;
    });
});
