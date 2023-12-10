   $(document).ready(function() {
         $('#emailForm').bootstrapValidator({
         }).on('success.form.bv', function(e) {
             e.preventDefault();
         
             var email = $('#email').val();
             var $submitButton = $('#submitButton');
             var $submitText = $('#submitText');
             var $submitSpinner = $('#submitSpinner');
         
             $submitText.hide();
             $submitSpinner.removeClass('d-none').addClass('d-inline-block');
             $submitButton.prop('disabled', true);
         
             $.ajax({
                 url: 'https://api.xposedornot.com/v1/domain-alert/' + email,
                 type: 'GET',
                 success: function(response) {
                     $('#successMessage').show();
                     $submitButton.prop('disabled', false);
                     $submitText.show();
                     $submitSpinner.removeClass('d-inline-block').addClass('d-none');
                 },
                 error: function(error) {
         if (error.status === 429) {
                         $('#rateLimitMessage').show();
                     } else {
                         $('#errorMessage').show();
                     }
         
                     $submitButton.prop('disabled', false);
                     $submitText.show();
                     $submitSpinner.removeClass('d-inline-block').addClass('d-none');
         
                 }
             });
         });
         });
