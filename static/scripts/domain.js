var clipboard = new ClipboardJS(".copy-btn");

clipboard.on("success", function (e) {
  e.trigger.textContent = "Copied!";
  setTimeout(function () {
    e.trigger.innerHTML = '<i class="fas fa-copy"></i> Copy';
  }, 10000);
  e.clearSelection();
});

clipboard.on("error", function (e) {
  e.trigger.textContent = "Failed!";
  setTimeout(function () {
    e.trigger.innerHTML = '<i class="fas fa-copy"></i> Copy';
  }, 10000);
});

function updateVerificationLink() {
  var verifyLink = document.getElementById("verify_link");
  var htmlText = document.getElementById("html_text").textContent;
  if (htmlText) {
    var url = htmlText.match(/https:\/\/[^\s]+/);
    if (url) {
      verifyLink.href = url[0];
      verifyLink.style.display = "inline-block";
    } else {
      verifyLink.style.display = "none";
    }
  } else {
    verifyLink.style.display = "none";
  }
}

var observer = new MutationObserver(updateVerificationLink);
observer.observe(document.getElementById("html_text"), {
  childList: true,
  characterData: true,
  subtree: true,
});

function updateDomainLabel() {
  var domain = document.getElementById("eventName").value;
  var domainDisplay = document.getElementById("domain-display");
  if (domain) {
    domainDisplay.textContent = domain;
    domainDisplay.parentElement.style.display = "block";
  } else {
    domainDisplay.textContent = "";
    domainDisplay.parentElement.style.display = "none";
  }
}

function updateMxToolboxLink() {
  var domain = document.getElementById("eventName").value;
  var mxLink = document.getElementById("mxtoolbox-link");
  if (mxLink && domain) {
    mxLink.href = "https://mxtoolbox.com/SuperTool.aspx?action=txt%3a" + encodeURIComponent(domain) + "&run=toolpage";
  }
}

document
  .getElementById("eventName")
  .addEventListener("input", updateDomainLabel);
document
  .getElementById("eventName")
  .addEventListener("change", updateDomainLabel);

var dnsDiv = document.getElementById("div_dns");
if (dnsDiv) {
  var dnsObserver = new MutationObserver(function () {
    if (dnsDiv.style.display !== "none") {
      updateMxToolboxLink();
    }
  });
  dnsObserver.observe(dnsDiv, { attributes: true, attributeFilter: ["style"] });
}

function validateEmail(email) {
  var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function setupEmailValidation(inputId, buttonId) {
  var input = document.getElementById(inputId);
  var button = document.getElementById(buttonId);
  if (!input || !button) return;

  var parent = input.closest(".v2-field-group") || input.closest(".input-group");
  var messageContainer = parent
    ? parent.querySelector(".validation-message")
    : null;

  input.addEventListener("input", function () {
    var isValid = validateEmail(this.value);

    this.classList.remove("is-valid", "is-invalid");
    this.classList.add(isValid ? "is-valid" : "is-invalid");

    if (messageContainer) {
      messageContainer.textContent = isValid
        ? ""
        : "Please enter a valid email address";
    }

    button.disabled = !isValid;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var eventInput = document.getElementById("eventName");
  if (eventInput) {
    eventInput.focus();
  }

  setupEmailValidation("txt_email_h", "searchMe_h");
  setupEmailValidation("txt_email_e", "searchMe_e");
  setupEmailValidation("txt_email_m", "searchMe_m");
  setupEmailValidation("txt_dns", "searchMe_d");

  ["email_form", "html_form", "meta_form", "dns_form"].forEach(function (
    formId
  ) {
    var form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var emailInput = this.querySelector('input[type="text"]');
        if (emailInput && validateEmail(emailInput.value)) {
        }
      });
    }
  });

  var footerGroups = document.querySelectorAll(".footer-group h3");
  footerGroups.forEach(function (header) {
    header.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        var group = this.parentElement;
        group.classList.toggle("active");
      }
    });
  });
});
