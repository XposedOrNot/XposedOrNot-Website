(function ($) {
  "use strict";

  function validateEmail(email) {
    var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return false;
    if (!regex.test(email)) return false;
    var parts = email.split("@");
    if (parts[1].length < 4) return false;
    return true;
  }

  function showAlert(id) {
    $(".dashboard-alert").hide().removeClass("show");
    $(id).show();
    $(id)[0].offsetHeight;
    $(id).addClass("show");
    $(id).attr("tabindex", "-1").trigger("focus");
  }

  $(function () {
    var $email = $("#email");
    var $submit = $("#submitButton");

    $email.on("input", function () {
      var val = $email.val().trim();
      var valid = validateEmail(val);
      $email.removeClass("is-valid is-invalid");
      if (val) {
        $email.addClass(valid ? "is-valid" : "is-invalid");
        $email.attr("aria-invalid", valid ? "false" : "true");
      } else {
        $email.removeAttr("aria-invalid");
      }
      $submit.prop("disabled", !valid);
    });

    $("#emailForm").on("submit", function (e) {
      e.preventDefault();
      var emailVal = $email.val().trim();

      if (!validateEmail(emailVal)) {
        showAlert("#errorMessage");
        return;
      }

      $submit.prop("disabled", true);
      $email.prop("disabled", true);
      $("#submitText").hide();
      $("#submitSpinner").removeClass("d-none").addClass("d-inline-block");

      $.ajax({
        url:
          "https://api.xposedornot.com/v1/domain-alert/" +
          encodeURIComponent(emailVal),
        type: "GET",
        success: function () {
          showAlert("#successMessage");
          $email.val("").removeClass("is-valid is-invalid");
          $email.removeAttr("aria-invalid");
        },
        error: function (xhr) {
          if (xhr.status === 429) {
            showAlert("#rateLimitMessage");
          } else {
            showAlert("#errorMessage");
          }
        },
        complete: function () {
          $submit.prop("disabled", false);
          $email.prop("disabled", false);
          $("#submitText").show();
          $("#submitSpinner")
            .removeClass("d-inline-block")
            .addClass("d-none");
        },
      });
    });

    var footerHeaders = document.querySelectorAll(".footer-group h3");
    footerHeaders.forEach(function (header) {
      header.setAttribute("tabindex", "0");
      header.setAttribute("role", "button");
      header.setAttribute("aria-expanded", "false");

      function toggleAccordion() {
        if (window.innerWidth <= 768) {
          var group = header.parentElement;
          var isActive = group.classList.toggle("active");
          header.setAttribute("aria-expanded", isActive ? "true" : "false");
        }
      }

      header.addEventListener("click", toggleAccordion);
      header.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleAccordion();
        }
      });
    });
  });
})(jQuery);
