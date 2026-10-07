var DOMAIN_API = 'https://api.xposedornot.com/v1/domain_verification';

var PROOF_CODE_TTL_MS = (72 * 60 * 60 * 1000) - (5 * 60 * 1000);

var proofChallenge = { domain: '', email: '', code: '', issuedAt: 0 };

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

function currentDomain() {
    return ($('#eventName').val() || '').trim().toLowerCase();
}

function normalizedEmail(inputId) {
    return ($('#' + inputId).val() || '').trim().toLowerCase();
}

function isBoundTo(email) {
    return !!proofChallenge.code && proofChallenge.domain === currentDomain() && proofChallenge.email === email;
}

function proofCodeExpired() {
    return !!proofChallenge.code && (Date.now() - proofChallenge.issuedAt) > PROOF_CODE_TTL_MS;
}

function hasBoundCode(email) {
    return isBoundTo(email) && !proofCodeExpired();
}

function renderProofFields(show) {
    var code = show ? proofChallenge.code : '';
    var record = code ? 'xon_verification=' + code : '';
    $('#hid1').val(code);
    $('#edhu_dns').val(record);
    $('#edhu_html_filename').val(code ? code + '.html' : '');
    $('#edhu_html_filecontent').val(record);
    if (code) {
        var url = 'https://' + currentDomain() + '/' + code + '.html';
        var hint = code.charAt(0) === '-' ? '<br>The file name starts with a hyphen, so quote it when creating the file.' : '';
        $('#html_text').html("Verification file should be reachable at: " + escapeHtml(url) + hint + "<br>");
    } else {
        $('#html_text').html('');
    }
}

function syncProofCard(inputId, verifyId) {
    var bound = hasBoundCode(normalizedEmail(inputId));
    renderProofFields(bound);
    $('#' + verifyId).prop('disabled', !bound);
}

function prefillProofEmail(inputId) {
    var input = $('#' + inputId);
    if (proofChallenge.code && proofChallenge.domain === currentDomain() && !input.val()) {
        input.val(proofChallenge.email);
        input[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function requestProofCode(inputId, buttonId, verifyId) {
    var email = normalizedEmail(inputId);
    var domain = currentDomain();
    if ((email == '') || (val_e(email) == false)) {
        $('#' + inputId).focus();
        return false;
    }
    $("#dang").hide();
    $("#info").hide();
    var expired = isBoundTo(email) && proofCodeExpired();
    if (hasBoundCode(email)) {
        if (!window.confirm('You already have a valid verification code for this email. Request a new one? You will need to update your published TXT record or file.')) {
            syncProofCard(inputId, verifyId);
            return true;
        }
    }
    var replacing = isBoundTo(email);
    var button = $('#' + buttonId);
    var icon = $('#' + buttonId + '_i1');
    button.prop('disabled', true);
    icon.removeClass('fa-key').addClass('fa-spinner fa-spin');
    var url = DOMAIN_API + '?z=b&d=' + encodeURIComponent(domain) + '&a=' + encodeURIComponent(email);

    $.ajax(url)
        .done(function (r) {
            var code = r && r.status === 'success' ? r.domainVerification : '';
            if (typeof code !== 'string' || code === '' || code === 'Failure') {
                $("#dang").show();
                $('#dang').html('⛔ We could not start the verification for this domain and email. Please check both and try again.');
                return;
            }
            proofChallenge = { domain: domain, email: email, code: code, issuedAt: Date.now() };
            syncProofCard(inputId, verifyId);
            if (replacing) {
                $("#info").show();
                $("#info").html(expired
                    ? 'Your previous code expired. Publish the new record or file shown below before you verify.'
                    : 'A new code was issued. Update your published TXT record or file before you verify.');
            }
        })
        .fail(function (r) {
            if (r.status === 429) {
                $("#info").show();
                $("#info").html("You are currently being throttled. Please slow down and try again !");
            } else if (r.status === 502) {
                $("#info").show();
                $("#info").html("Looks like something is not right at server end. I have notified the right person to check on this.Please try again after some time.");
            } else {
                $("#dang").show();
                $('#dang').html('⛔ We could not start the verification for this domain and email. Please check both and try again.');
            }
        })
        .always(function () {
            icon.removeClass('fa-spinner fa-spin').addClass('fa-key');
            button.prop('disabled', !val_e(normalizedEmail(inputId)));
        });
    return true;
}

$("#strat").focus(function () {
    $('#div_t1').show();
    $('#div_t3').hide();
    $('#div_t2').hide();
});

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
        var edutu2 = DOMAIN_API + '?z=c&d=' + encodeURIComponent($('#eventName').val());

        var myjson2;
        var j = $.ajax(edutu2)
            .done(function (n2) {
                myjson2 = n2;
                var site1 = myjson2.domainVerification;
                $('#sel1').html('');
                if (!site1 || site1.length === 0) {
                    $('#dang').show();
                    $('#dang').html('Please enter a valid domain and try again !');
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
        $('#div_t1').hide();
        $('#div_t3').hide();
        $('#div_t4').hide();
        $('#div_t2').show();
        $('#div_meta').hide();
        $('#div_html').hide();
        prefillProofEmail('txt_dns');
        syncProofCard('txt_dns', 'searchMe_d');
    } else {
        $('#div_html').show();
        $('#succ').hide();
        $('#div_t1').hide();
        $('#div_t4').hide();
        $('#div_t3').hide();
        $('#div_t2').show();
        $('#div_dns').hide();
        $('#div_email').hide();
        prefillProofEmail('txt_email_h');
        syncProofCard('txt_email_h', 'searchMe_h');
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
    var roleEmail = $('#sel1').val();
    var domainName = $('#eventName').val().toLowerCase();
    if (!roleEmail || roleEmail.indexOf('@') === -1) {
        $('#sel1').focus();
        return false;
    }
    if ((str == '') || (val_e(str) == false)) {
        $("#txt_email_e").focus();
        return false;
    }
    if (str.split('@').pop() !== domainName) {
        $("#dang").show();
        $('#dang').html('⛔ The monitoring email must be on the same domain (for example, soc@' + escapeHtml(domainName) + '). Please enter an address on this domain.');
        $("#txt_email_e").focus();
        return false;
    }
    $("#searchMe_e_i1").removeClass("glyphicon glyphicon-ok");
    $("#searchMe_e_i1").addClass("fa fa-spinner fa-spin");
    var edutu4 = DOMAIN_API + '?z=d&d=' + encodeURIComponent($('#eventName').val()) + '&a=' + encodeURIComponent(roleEmail) + '&r=' + encodeURIComponent(str);

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
                $("#succ").html('📩 <strong>Almost there! Check the inbox for ' + escapeHtml(roleEmail) + '.</strong><br><br> We\'ve emailed a one-time verification link to that address. Open it within 30 minutes to finish verifying <span class="domain-label">' + escapeHtml(domainName) + '</span>. Once confirmed, breach alerts and dashboard access will go to <strong>' + escapeHtml(str) + '</strong>.<br><br><div align="center"> <button class="btn btn-primary btn-lg" onClick="window.location.reload();">Verify Another Domain</button><br></div><br>');
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

function verifyProof(command, inputId, verifyId, retryHint) {
    var email = normalizedEmail(inputId);
    if ((email == '') || (val_e(email) == false)) {
        $('#' + inputId).focus();
        return false;
    }
    if (!hasBoundCode(email)) {
        $("#dang").show();
        if (isBoundTo(email) && proofCodeExpired()) {
            renderProofFields(false);
            $('#dang').html('⛔ Your verification code has expired. Click Get code for a replacement, then publish the new record or file.');
        } else {
            $('#dang').html('⛔ Please get your verification code for this email first.');
        }
        $('#' + verifyId).prop('disabled', true);
        return false;
    }
    var icon = $('#' + verifyId + '_i1');
    icon.removeClass("glyphicon glyphicon-ok");
    icon.addClass("fa fa-spinner fa-spin");
    var url = DOMAIN_API + '?z=' + command + '&d=' + encodeURIComponent(proofChallenge.domain) + '&e=xon_verification' + '&v=' + encodeURIComponent(proofChallenge.code) + '&a=' + encodeURIComponent(proofChallenge.email);

    $.ajax(url)
        .done(function (n4) {
            var ok = !!n4 && n4.status === 'success' && typeof n4.domainVerification === 'string' && n4.domainVerification !== 'Failure';
            if (!ok) {
                $("#dang").show();
                $("#div_t3").show();
                $("#info").hide();
                $("#div_t2").hide();
                $('#dang').html('⛔ Verification did not succeed yet. Your code is still valid, so ' + retryHint + ' and click Verify again.');
            } else {
                $("#succ").show();
                $("#div_t4").show();
                $("#div_t2").hide();
                $("#div_t1").hide();
                $("#div_t3").hide();
                $("#div_html").hide();
                $('#div_dns').hide();
                $("#s1").hide();
                $("#succ").html('🎉 <strong>Yay! Domain verification is almost complete.</strong> <BR><br> We are now actively retrieving breach records specifically for your domain from our extensive database of over 10 billion entries. Once this process is complete, you will be promptly notified. You will then have the ability to access and review these records directly from our CXO dashboard. <br><br><div align="center"> <button class="btn btn-primary btn-lg" onClick="window.location.href=\'dashboard.html\'">CXO Dashboard</button> <button class="btn btn-primary btn-lg" onClick="window.location.reload();">Verify Another Domain</button><br></div><br>');
            }
            if (n4 && n4.status === 429) {
                $("#info").html("You are currently being throttled. Please slow down and try again !");
                $('#data_email').html(email);
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
                $('#dang').html('Verification did not succeed yet. Your code is still valid, so ' + retryHint + ' and click Verify again.');
            }
        })
        .always(function () {
            icon.removeClass("fa fa-spinner fa-spin");
            icon.addClass("glyphicon glyphicon-ok");
        });
    return true;
}

$("#searchMe_d").click(function (func_alert) {
    func_alert.preventDefault();
    verifyProof('e', 'txt_dns', 'searchMe_d', 'make sure the TXT record is live (check it with MX Toolbox)');
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
    var edutu3 = DOMAIN_API + '?z=v&d=' + encodeURIComponent($('#eventName').val()) + '&e=xon_verification' + '&v=' + encodeURIComponent($('#hid1').val()) + '&a=' + encodeURIComponent($('#txt_email_m').val());

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
    verifyProof('a', 'txt_email_h', 'searchMe_h', 'make sure the file is live at the URL shown above');
});

$("#get_code_d").click(function (ev) {
    ev.preventDefault();
    requestProofCode('txt_dns', 'get_code_d', 'searchMe_d');
});

$("#get_code_h").click(function (ev) {
    ev.preventDefault();
    requestProofCode('txt_email_h', 'get_code_h', 'searchMe_h');
});

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

function getPresetDomain() {
    if (typeof URLSearchParams !== "function") return "";
    var raw = new URLSearchParams(window.location.search).get("d");
    if (!raw) return "";
    var domain = raw.trim().toLowerCase();
    if (domain.indexOf("@") > -1) domain = domain.split("@").pop();
    domain = domain
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/[\/?#].*$/, "")
        .replace(/:\d+$/, "");
    return /^([a-z0-9-]+\.)+[a-z]{2,24}$/.test(domain) ? domain : "";
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

function setupProofEmailSync(inputId, verifyId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", function () {
        syncProofCard(inputId, verifyId);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    var eventInput = document.getElementById("eventName");
    if (eventInput) {
        var presetDomain = getPresetDomain();
        if (presetDomain) {
            eventInput.value = presetDomain;
            updateDomainLabel();
        }
        eventInput.focus();
    }

    setupEmailValidation("txt_email_h", "get_code_h");
    setupEmailValidation("txt_email_e", "searchMe_e");
    setupEmailValidation("txt_email_m", "searchMe_m");
    setupEmailValidation("txt_dns", "get_code_d");
    setupProofEmailSync("txt_dns", "searchMe_d");
    setupProofEmailSync("txt_email_h", "searchMe_h");

    var recipientInput = document.getElementById("txt_email_e");
    if (recipientInput) {
        recipientInput.addEventListener("input", function () {
            $("#dang").hide().html('');
        });
    }

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
