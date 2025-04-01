$(document).ready(function() {
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
    }).on('success.form.bv', function(e) {
        e.preventDefault();

        var email = $('#email').val().toLowerCase();

        if (/[<>]/.test(email)) {
            $("#errorMessage").show().html('<i class="fas fa-times-circle"></i> The input is not a valid email address');
            return;
        }

        $('#submitSpinner').removeClass('d-none');
        $('#alertMe').prop('disabled', true);

        //var url = 'https://api.xposedornot.com/v1/shield-on/' + encodeURIComponent(email);
        var url = 'https://xon-api-test.xposedornot.com/v1/shield-on/' + encodeURIComponent(email);

        $.ajax({
            url: url,
            type: "GET",
            success: function(response) {
                $('#submitSpinner').addClass('d-none');
                $('#alertMe').prop('disabled', false);

                $("#successMessage").show().html('<i class="fas fa-check-circle"></i> Shield Added Successfully. Shortly you should receive an email with next steps to complete this process.');
                $("#errorMessage").hide();
            },
            error: function(error) {
                $('#submitSpinner').addClass('d-none');
                $('#alertMe').prop('disabled', false);
                $("#errorMessage").show().html('<i class="fas fa-times-circle"></i> There was an error processing your request. Please try again later.');
                $("#successMessage").hide();
            }
        });
    });
});
