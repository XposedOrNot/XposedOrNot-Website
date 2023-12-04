$(document).ready(function () {
    $('#emailForm').bootstrapValidator({
        fields: {
            email: {
                validators: {
                    notEmpty: {
                        message: 'The email address is required and cannot be empty'
                    },
                    emailAddress: {
                        message: 'The input is not a valid email address'
                    }
                }
            }
        }
    }).on('success.form.bv', function (e) {
        e.preventDefault();

        var email = $('#email').val().toLowerCase();

        if (/[<>]/.test(email)) {
            $("#errorMessage").show().html('<i class="fas fa-times-circle"></i> The input is not a valid email address');
            return;
        }

        $('#submitSpinner').removeClass('d-none');
        $('#alertMe').prop('disabled', true);

        var url = 'https://api.xposedornot.com/v1/shield-on/' + encodeURIComponent(email);

        $.ajax({
            url: url,
            type: "GET",
            success: function (response) {
                $('#submitSpinner').addClass('d-none');
                $('#alertMe').prop('disabled', false);

                $("#successMessage").show().html('<i class="fas fa-check-circle"></i> Shield Added Successfully. Shortly you should receive an email with next steps to complete this process.');
                $("#errorMessage").hide();
            },
            error: function (error) {
                $('#submitSpinner').addClass('d-none');
                $('#alertMe').prop('disabled', false);
                $("#errorMessage").show().html('<i class="fas fa-times-circle"></i> There was an error processing your request. Please try again later.');
                $("#successMessage").hide();
            }
        });
    });
});
/*
$('#alertMe').prop('disabled', true);

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

$(document).ready(function () {
    $('#eventName').on('input', function () {
        var email = $(this).val();
        var isValid = validateEmail(email);
        if (isValid) {
            $(this).css("border", "1px solid green");
            $('#alertMe').prop('disabled', false);
            $("#alertMe").click(function (event) {
                event.preventDefault();
                $('#f1').hide()
                var add_str = document.getElementById("eventName").value.toLowerCase();
                koodudal = 'https://api.xposedornot.com/v1/shield-on/' + encodeURIComponent(add_str);
                var myjson;
                var j = $.ajax(koodudal)
                    .done(function (n) {
                        $("#d1").hide();
                        $("#alertMe").hide();
                        $("#eventName").hide();
                        myjson = n;
                        l = myjson.Success;
                        if (l == "ShieldAdded") {
                            $("#status_msg").collapse("show")
                        } else if (l == "AlreadyOn") {
                            $("#status_msg1").collapse("show")
                        }
                    })
                    .fail(function (n) {
                        $('#f1').show()
                        $('#f1').text('Oopsie something has gone wrong ... please try again after some time !')
                    })
            })
        } else {
            $(this).css("border", "1px solid red");
            $('#alertMe').prop('disabled', true);
        }
    });
});
*/