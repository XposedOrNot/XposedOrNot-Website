/* ============================================================
   Core domain verification logic (restored from pre-v2)
   ============================================================ */

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function IsValidDomain() {
    var domainName = $('#eventName').val();
    if (domainName) {
        var pattern = new RegExp(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,6})+$/igm);
        return pattern.test(domainName);
    } else {
        return false;
    }
}

$('#div_t1').hide();
$('#div_t2').hide();
$('#div_t3').hide();
$('#div_t4').hide();
$('#div_email').hide();
$('#div_dns').hide();
$('#div_meta').hide();
$('#div_html').hide();
$('#dang').hide();
$("#s1").hide();

function val_e(input) {
    var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    if (reg.test(input)) {
        return true;
    } else {
        return false;
    }
}

function dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
}

function generateId(len) {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join('');
}

function choices() {
    $('#hid1').val(generateId());
}

$("#strat").focus(function () {
    $('#div_t1').show();
    $('#div_t3').hide();
    $('#div_t2').hide();
});

choices();

$("#strat").change(function () {
    $("#info").hide();
    $("#dang").hide();
    var id = $("#strat option:selected").text();
    if (id == "Email based validation") {
        $('#div_email').show();
        $('#div_dns').hide();
        $('#div_meta').hide();
        $('#div_html').hide();
        $('#div_t1').hide();
        $('#div_t3').hide();
        $('#div_t4').hide();
        $('#succ').hide();
        $('#div_t2').show();
        var options = $('#sel1');
        var edutu2 = 'https://api.xposedornot.com/v1/domain_verification?z=c&d=' + $('#eventName').val();

        var myjson2;
        var j = $.ajax(edutu2)
            .done(function (n2) {
                myjson2 = n2;
                var site1 = myjson2.domainVerification;
                $('#sel1').html('');
                if (site1 == null) {
                    $('#dang').show();
                    $('#dang').html('Selected domain did not return any valid email contacts. Please re-check the domain and try again !');
                    $('#div_email').hide();
                } else {
                    var options = $('#sel1');
                    for (var i = 0; i < site1.length; i++) {
                        options.append(new Option(site1[i], site1[i]));
                    }
                }
            });
    } else if (id == "DNS Text based validation") {
        $('#div_email').hide();
        $('#succ').hide();
        $('#div_dns').show();
        var h_val = "xon_verification=" + $('#hid1').val();
        $('#edhu_dns').val(h_val);
        $('#div_t1').hide();
        $('#div_t3').hide();
        $('#div_t4').hide();
        $('#div_t2').show();
        $('#div_meta').hide();
        $('#div_html').hide();
    } else {
        $('#div_html').show();
        $('#succ').hide();
        $('#div_t1').hide();
        $('#div_t4').hide();
        $('#div_t3').hide();
        $('#div_t2').show();
        $('#div_dns').hide();
        $('#div_email').hide();
        $('#edhu_html_filename').val($('#hid1').val() + '.html');
        var domainName = $('#eventName').val();
        var filename = $('#edhu_html_filename').val();
        var url = 'https://' + domainName + '/' + filename;
        $('#html_text').html("Verification file should be reachable at: " + escapeHtml(url) + "<br>");
        $('#edhu_html_filecontent').val('xon_verification=' + $('#hid1').val());
    }
});

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
                            regexp: /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i,
                            message: ' Please enter a valid domain address ...'
                        },
                        notEmpty: {
                            message: ' Please enter a valid domain address ...'
                        }
                    }
                },
            },
            onSuccess: function (e, data) {
                var domainName = $('#eventName').val();

                $("#alertMe_i1").removeClass("glyphicon glyphicon-ok");
                $("#alertMe_i1").addClass("fa fa-spinner fa-spin");
                $("#status").show();
                $("#div_s1").show();
                $("#s1").show();
                if (IsValidDomain() == false) {
                    $('#eventName').focus();
                    $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                    $("#alertMe_i1").addClass("glyphicon glyphicon-ok");
                    $("#s1").hide();
                } else {
                    $("#alertMe").hide();
                    $("#alertMe_i1").removeClass("fa fa-spinner fa-spin");
                    $("#alertMe_i1").addClass("glyphicon glyphicon-ok");
                    $("#eventName").hide();

                    $("#lbl_1").html('<div align="left" class="container alert alert-primary">' +
                        '<strong>Let us get your authorization sorted for ' +
                        '<span class="domain-label">' + escapeHtml($('#eventName').val()) + '</span>' +
                        ' 🌟</strong><br><br>' +
                        "We've got a few super easy methods for you to choose from, so you can pick the one that suits you best. You can:<br>" +
                        "1. Respond to an email sent to one of the standard email addresses we provide (it'll pop up in your inbox before you know it).<br>" +
                        "2. Add a nifty TXT entry to your domain's DNS settings (think of it as a secret code that confirms you're the real owner).<br>" +
                        "3. Upload a .html file to your site with the given info (kind of like attaching a digital name tag).<br><br>" +
                        "Remember, keep this page open until you're done, or you'll need to start from square one. Don't worry, though; we're here to help make this process a breeze! 🍃<br><br></div>");

                    $("#lbl_1").hide();
                    $("#div_input").hide();
                    $("#div_s1").show();
                    $("#s1").show();
                    $("#div_suc1").hide();
                    $("#div_suc2").show();
                    $("#div_t1").show();
                    $("#strat").focus();
                    $("#status").hide();

                    $('#domain-display').text(domainName);
                }
                e.preventDefault();
            }
        });
});

$("#searchMe_e").click(function (func_alert6) {
    func_alert6.preventDefault();
    var str = document.getElementById("txt_email_e").value.toLowerCase();
    if ($('#sel1 option:selected').text() === "No email found. Try DNS/HTML Verifications") {
        $('#dang').html('⛔ Domain verification through the email channel could not be completed as there are no public records for this domain. Please use alternate methods of verification: DNS or HTML.');
        $("#dang").show();
        $('#strat').focus();
        return false;
    }
    if ((str == '') || (val_e(str) == false)) {
        $("#txt_email_e").focus();
        return false;
    }
    $("#searchMe_e_i1").removeClass("glyphicon glyphicon-ok");
    $("#searchMe_e_i1").addClass("fa fa-spinner fa-spin");
    var edutu4 = 'https://api.xposedornot.com/v1/domain_verification?z=d&d=' + $('#eventName').val() + '&a=' + $('#txt_email_e').val() + '&ae=' + $('#sel1').val();

    var myjson4;
    var j4 = $.ajax(edutu4)
        .done(function (n4) {
            myjson4 = n4;
            var l4 = myjson4.domainVerification;
            if (l4 == "Failure") {
                $("#dang").show();
                $("#div_t3").show();
                $("#info").hide();
                $("#div_t2").hide();
                $('#div_email').hide();
                $('#strat').hide();
                $('#dang').html('⛔ Domain verification was not completed successfully. Please try again when you are ready with the verification requirements  !');
                $("#searchMe_e_i1").removeClass("fa fa-spinner fa-spin");
                $("#div_html").hide();
            } else {
                $("#searchMe_e_i1").removeClass("fa fa-spinner fa-spin");
                $("#succ").show();
                $("#div_t4").show();
                $("#div_t2").hide();
                $("#div_html").hide();
                $('#div_email').hide();
                $("#succ").html('🎉 <strong>Yay! Domain verification is almost complete.</strong> <BR><br> We are now actively retrieving breach records specifically for your domain from our extensive database of over 10 billion entries. Once this process is complete, you will be promptly notified. You will then have the ability to access and review these records directly from our CXO dashboard. <br><br><div align="center"> <button class="btn btn-primary btn-lg" onClick="window.location.href=\'dashboard.html\'">CXO Dashboard</button> <button class="btn btn-primary btn-lg" onClick="window.location.reload();">Verify Another Domain</button><br></div><br>');
            }
            if (n4.status === 429) {
                $("#info").html("You are currently being throttled. Please slow down and try again !");
                $('#data_email').html(str);
            }
        })
        .fail(function (n4) {
            if (n4.status === 429) {
                $("#info").show();
                $("#info").html("You are currently being throttled. Please slow down and try again !");
            } else if (n4.status === 502) {
                $("#info").show();
                $("#info").html("Looks like something is not right at server end. I have notified the right person to check on this.Please try again after some time.");
            } else {
                $("#dang").show();
                $("#div_t3").show();
                $("#div_t2").hide();
                $('#dang').html('Domain verification was not completed successfully. Please try again when you are ready with the verification requirements  !');
            }
        });
});

$("#searchMe_d").click(function (func_alert) {
    func_alert.preventDefault();
    var str = document.getElementById("txt_dns").value.toLowerCase();
    if ((str == '') || (val_e(str) == false)) {
        $("#txt_email").focus();
        return false;
    }
    $("#searchMe_d_i1").removeClass("glyphicon glyphicon-ok");
    $("#searchMe_d_i1").addClass("fa fa-spinner fa-spin");
    var edutu4 = 'https://api.xposedornot.com/v1/domain_verification?z=e&d=' + $('#eventName').val() + '&e=xon_verification' + '&v=' + $('#hid1').val() + '&a=' + $('#txt_dns').val();

    var myjson4;
    var j4 = $.ajax(edutu4)
        .done(function (n4) {
            myjson4 = n4;
            var l4 = myjson4.domainVerification;
            if (l4 == "Failure") {
                $("#dang").show();
                $("#div_t3").show();
                $("#info").hide();
                $("#div_t2").hide();
                $('#div_dns').hide();
                $("#s1").hide();
                $("#searchMe_d").removeClass("fa fa-spinner fa-spin");
                $('#dang').html('⛔ Domain verification was not completed successfully. Please try again when you are ready with the verification requirements  !');
                $('#strat').hide();
                $("#div_html").hide();
            } else {
                $("#succ").show();
                $("#div_t4").show();
                $("#div_t2").hide();
                $("#div_t1").hide();
                $("#div_html").hide();
                $('#div_dns').hide();
                $("#s1").hide();
                $("#searchMe_d").removeClass("fa fa-spinner fa-spin");
                $("#succ").html('🎉 <strong>Yay! Domain verification is almost complete.</strong> <BR><br> We are now actively retrieving breach records specifically for your domain from our extensive database of over 10 billion entries. Once this process is complete, you will be promptly notified. You will then have the ability to access and review these records directly from our CXO dashboard. <br><br><div align="center"> <button class="btn btn-primary btn-lg" onClick="window.location.href=\'dashboard.html\'">CXO Dashboard</button> <button class="btn btn-primary btn-lg" onClick="window.location.reload();">Verify Another Domain</button><br></div><br>');
            }
            if (n4.status === 429) {
                $("#info").html("You are currently being throttled. Please slow down and try again !");
                $('#data_email').html(str);
            }
        })
        .fail(function (n4) {
            if (n4.status === 429) {
                $("#info").show();
                $("#info").html("You are currently being throttled. Please slow down and try again !");
            } else if (n4.status === 502) {
                $("#info").show();
                $("#info").html("Looks like something is not right at server end. I have notified the right person to check on this.Please try again after some time.");
            } else {
                $("#dang").show();
                $("#div_t3").show();
                $("#div_t2").hide();
                $('#dang').html('Domain verification was not completed successfully. Please try again when you are ready with the verification requirements  !');
            }
        });
});

$("#searchMe_m").click(function (func_alert3) {
    func_alert3.preventDefault();
    var str = document.getElementById("txt_email_m").value.toLowerCase();
    if ((str == '') || (val_e(str) == false)) {
        $("#txt_email_m").focus();
        return false;
    }
    $("#searchMe_m_i1").removeClass("glyphicon glyphicon-ok");
    $("#searchMe_m_i1").addClass("fa fa-spinner fa-spin");
    var edutu3 = 'https://api.xposedornot.com/v1/domain_verification?z=v&d=' + $('#eventName').val() + '&e=xon_verification' + '&v=' + $('#hid1').val() + '&a=' + $('#txt_email_m').val();

    var myjson3;
    var j3 = $.ajax(edutu3)
        .done(function (n3) {
            myjson3 = n3;
            var l3 = myjson3.domainVerification;
            if (l3 == "Failure") {
                $("#dang").show();
                $("#info").hide();
                $("#div_t3").show();
                $("#div_t2").hide();
                $("#div_t4").hide();
                $('#div_meta').hide();
                $("#searchMe_m_i1").removeClass("glyphicon glyphicon-ok");
                $("#searchMe_m_i1").addClass("fa fa-spinner fa-spin");
                $('#strat').hide();
                $('#dang').html('⛔ Domain verification was not completed successfully. Please verify again when you are ready with the verification requirements  !');
            } else {
                $("#succ").show();
                $("#div_t4").show();
                $("#div_t2").hide();
                $("#div_t3").hide();
                $("#div_meta").hide();
                $("#succ").html('🎉 <strong>Yay! Domain verification is almost complete.</strong> <BR><br> We are now actively retrieving breach records specifically for your domain from our extensive database of over 10 billion entries. Once this process is complete, you will be promptly notified. You will then have the ability to access and review these records directly from our CXO dashboard. <br><br><div align="center"> <button class="btn btn-primary btn-lg" onClick="window.location.href=\'dashboard.html\'">CXO Dashboard</button> <button class="btn btn-primary btn-lg" onClick="window.location.reload();">Verify Another Domain</button><br></div><br>');
            }
            if (n3.status === 429) {
                $("#info").html("You are currently being throttled. Please slow down and try again !");
                $('#data_email').html(str);
            }
        })
        .fail(function (n3) {
            if (n3.status === 429) {
                $("#info").show();
                $("#info").html("You are currently being throttled. Please slow down and try again !");
            } else if (n3.status === 502) {
                $("#info").show();
                $("#info").html("Looks like something is not right at server end. I have notified the right person to check on this.Please try again after some time.");
            } else {
                $("#dang").show();
                $("#div_t3").show();
                $("#div_t2").hide();
                $("#div_t4").hide();
                $('#dang').html('Domain verification was not completed successfully. Please verify again when you are ready with the verification requirements  !');
            }
        });
});

$("#searchMe_h").click(function (func_alert4) {
    func_alert4.preventDefault();
    var str = document.getElementById("txt_email_h").value.toLowerCase();
    if ((str == '') || (val_e(str) == false)) {
        $("#txt_email_h").focus();
        return false;
    }
    $("#searchMe_h_i1").removeClass("glyphicon glyphicon-ok");
    $("#searchMe_h_i1").addClass("fa fa-spinner fa-spin");
    var edutu4 = 'https://api.xposedornot.com/v1/domain_verification?z=a&d=' + $('#eventName').val() + '&e=xon_verification' + '&v=' + $('#hid1').val() + '&a=' + $('#txt_email_h').val();

    var myjson4;
    var j4 = $.ajax(edutu4)
        .done(function (n4) {
            myjson4 = n4;
            var l4 = myjson4.domainVerification;
            if (l4 == "Failure") {
                $("#div_t3").show();
                $("#info").hide();
                $("#div_t2").hide();
                $('#strat').hide();
                $('#dang').html('⛔ Domain verification was not completed successfully. Please try again when you are ready with the verification requirements  !');
                $("#searchMe_h_i1").removeClass("fa fa-spinner fa-spin");
                $("#div_html").hide();
                $("#dang").show();
            } else {
                $("#div_t4").show();
                $("#succ").show();
                $("#div_t2").hide();
                $("#div_html").hide();
                $("#succ").html('🎉 <strong>Yay! Domain verification is almost complete.</strong> <BR><br> We are now actively retrieving breach records specifically for your domain from our extensive database of over 10 billion entries. Once this process is complete, you will be promptly notified. You will then have the ability to access and review these records directly from our CXO dashboard. <br><br><div align="center"> <button class="btn btn-primary btn-lg" onClick="window.location.href=\'dashboard.html\'">CXO Dashboard</button> <button class="btn btn-primary btn-lg" onClick="window.location.reload();">Verify Another Domain</button><br></div><br>');
            }
            if (n4.status === 429) {
                $("#info").html("You are currently being throttled. Please slow down and try again !");
                $('#data_email').html(str);
            }
        })
        .fail(function (n4) {
            if (n4.status === 429) {
                $("#info").show();
                $("#info").html("You are currently being throttled. Please slow down and try again !");
            } else if (n4.status === 502) {
                $("#info").show();
                $("#info").html("Looks like something is not right at server end. I have notified the right person to check on this.Please try again after some time.");
            } else {
                $("#dang").show();
                $("#div_t3").show();
                $("#div_t2").hide();
                $('#dang').html('Domain verification was not completed successfully. Please try again when you are ready with the verification requirements  !');
            }
        });
});

/* ============================================================
   v2 UI enhancements
   ============================================================ */

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

document.getElementById("eventName").addEventListener("input", updateDomainLabel);
document.getElementById("eventName").addEventListener("change", updateDomainLabel);

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
