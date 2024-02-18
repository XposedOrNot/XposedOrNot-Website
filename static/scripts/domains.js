function val_e(input) {
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
    if (reg.test(input)) {
        return true;
    } else {
        return false;
    }
}

$(document).ready(function () {
    $('#defaultForm')
        .bootstrapValidator({
            feedbackIcons: {
                valid: 'glyphicon glyphicon-ok',
                invalid: 'glyphicon glyphicon-remove',
                validating: 'glyphicon glyphicon-refresh'
            },
            live: 'enabled',
            fields: {
                'name': {
                    validators: {
                        regexp: {
                            regexp: /^(?!:\/\/)([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/i,
                            message: ' Please enter a valid domain address ...'
                        },
                        notEmpty: {
                            message: ' Please enter a valid domain address ...'

                        }
                    }
                },
            },
            onSuccess: function (e, data) {
                $("#alertMe").html(`Loading ... <span class="fa fa-spinner fa-spin" role="status" aria-hidden="true"></span> `);
                $('#t').html('-');
                $('#b').html('-');
                $('#p').html('-');
                $("#succ").hide();
                edutuc1 = 'https://api.xposedornot.com/v1/domain-breach-summary?d=' + $('#eventName').val()
                dom = $('#eventName').val()
                var myjsonc1;
                var jc1 = $.ajax(edutuc1)
                    .done(function (nc1) {
                        e.preventDefault();
                        jd2 = nc1;
                        msg = jd2.SearchStatus;
                        e = p = t = 0
                        for (var i = 0; i < jd2.sendDomains.breaches_details.length; i++) {
                            id_cnt = i + 1;
                            e = jd2.sendDomains.breaches_details[i].breach_emails;
                            p = jd2.sendDomains.breaches_details[i].breach_pastes;
                            t = parseInt(e) + parseInt(p);
                            $('#t').html(t);
                            $('#b').html(e);
                            $('#p').html(p);
                            if (t == 0) {
                                $("#succ").show();
                                $("#dang").hide();
                            }
                            if (e >= 50) {
                                $("#bx").css("background-color", "indianred");
                                $('#b').html("50+")
                                $("#dang").show();
                                $("#succ").hide();
                            } else {
                                $('#b').html(e);
                            }
                            if (p >= 50) {
                                $('#p').html("50+")
                                $("#al").show();
                                $("#su").hide();
                            } else {
                                $('#p').html(p);
                            }
                            $("#getBreach").show();
                            logo_src = "//logo.clearbit.com/" + dom
                            $("#logo").attr("src", logo_src);
                            $("#logo").show();
                            $("#dom").show();
                        }
                        $("#alertMe").text("Get Me Breach Data");
                    })
                    .fail(function (nc1) {
                        if (nc1.status === 404) {
                            $("#alertMe").text("No breach data found for this domain.");
                            $("#dang").show();
                            $("#succ").hide();
                        } else {
                            $("#alertMe").text("An error occurred. Please try again later.");
                            $("#dang").show();
                            $("#succ").hide();
                        }
                        $('#t').html('-');
                        $('#b').html('-');
                        $('#p').html('-');
                        $("#getBreach").hide();
                        return false
                    })
                e.preventDefault();
            }
        });
});
