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
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

by24 = by23 = by22 = by21 = by20 = by19 = by18 = by17 = by16 = by15 = by14 = by13 = by12 = by11 = by10 = by09 = by08 = by07 = 0;
py24 = py23 = py22 = py21 = py20 = py19 = py18 = py17 = py16 = py15 = py14 = py13 = py12 = py11 = py10 = py09 = py08 = py07 = 0;
i11 = i12 = i13 = i14 = i15 = i16 = i17 = i18 = i19 = i20 = i1 = i2 = i3 = i4 = i5 = i6 = i7 = i8 = i9 = i10 = i20 = i21 = i22 = i23 = i24 = i25 = i26 = 0;
plaintext = easy = hard = password_score = 0;

$.LoadingOverlaySetup({
    background: "rgba(0, 0, 0, 0.5)",
    image: "/static/images/shield-alt.svg",
    imageAnimation: "1s fadein",
    imageColor: "#6daae0"
});

$.LoadingOverlay("show");

$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results[1] || 0;

}

try {
    email = decodeURIComponent($.urlParam('email'));
    token = decodeURIComponent($.urlParam('token'));
} catch (e) {
    window.location.replace("https://xposedornot.com");
}

s = '<div align="center" class="alert alert-primary"><strong>Overall Data Breaches Summary For Email: ' + escapeHtml(email) + '</strong></div></p>'
$("#email").html(s)
s = '<div align="center" class="alert alert-danger"><strong>Sensitive Data Breaches Summary For Email: ' + escapeHtml(email) + '</strong></div></p>'
$("#email_sensitive").html(s)
s = '<div align="center" class="alert alert-primary"><strong>Exposed Pastes Summary For Email: ' + escapeHtml(email) + '</strong></div></p>'
$("#paste").html(s)
var emailVerificationUrl = 'https://api.xposedornot.com/v1/send_verification?email=' + encodeURIComponent(email) + "&token=" + encodeURIComponent(token);

var sitesJson;
var sensitiveBreaches;

var emailVerificationPromise = $.ajax(emailVerificationUrl)

    .done(function (response) {

        sitesJson = response;

        var status = sitesJson.status;
        var sensitiveBreaches = (sitesJson.sensitive_breach_details && sitesJson.sensitive_breach_details.breaches_details) ? sitesJson.sensitive_breach_details.breaches_details : [];

        var tableRowsHtml = "";

        if (status === "Fail") {

            window.location.replace("https://xposedornot.com");
        } else {
            const jsonData = response;
            const dataArr = [];
            for (let key in jsonData) {
                const value = jsonData[key];
                dataArr.push([key, value]);
            }


            const treeData = {
                children: dataArr[0][1].children,
                description: dataArr[0][1].description
            };
            console.log(treeData)
            $('#tree-container').hortree({
                data: [treeData],
                nodeRadius: 4,
                linkThickness: 1.5,
                nodeFontSize: '1rem',
                nodeLineHeight: '1.2',
                linkColor: '#999',
                linkHoverColor: '#000',
                nodeTextColor: '#333',
                responsive: true
            });

            if (sensitiveBreaches.length === 0) {
                $("#db-sensitive").show();
                document.getElementById("db-sensitive").className = "visible alert alert-success";
            } else {

                for (var i = 0; i < sensitiveBreaches.length; i++) {
                    tableRowsHtml += '<tr>' +
                        '<td>' + sensitiveBreaches[i].breach + '<br>' +
                        '<img src="' + sensitiveBreaches[i].logo + '" alt="Logo" style="width: 50px; height: 50px;">' +
                        '</td>' +
                        '<td>' + sensitiveBreaches[i].details + '</td>' +
                        '<td>' + sensitiveBreaches[i].xposed_records + '</td>' +
                        '</tr>';
                }

            }
        }

        $("#data_breach_sensitive").append(tableRowsHtml);
    });

const edutu = 'https://api.xposedornot.com/v1/breach-analytics?email=' + encodeURIComponent(email);

var myjson;
var j = $.ajax(edutu)
    .done(function (n) {
        myjson = n;
        n2 = industry = risk_score = risk_label = '';
        password_score = 0;
        e = myjson.PastesSummary.cnt;
        f = myjson.BreachesSummary.site;
        passwords_cnts = [];

        risk_score = myjson.BreachMetrics.risk[0].risk_score
        risk_label = myjson.BreachMetrics.risk[0].risk_label
        if (risk_label == "Medium") {
            risk_score_html = '<div align="center" class="alert alert-warning">' + 'Your Risk Score : <strong>' + risk_label + '</strong></div>'
        } else if (risk_label == "High") {
            risk_score_html = '<div align="center" class="alert alert-danger">' + 'Your Risk Score : <strong>' + risk_label + '</strong></div>'
        } else if (risk_label == "Low") {
            risk_score_html = '<div align="center" class="alert alert-success">' + 'Your Risk Score : <strong>' + risk_label + '</strong></div>'
        } else {
            risk_score_html = '<div align="center" class="alert alert-warning">' + 'Your Risk Score : <strong>' + risk_label + '</strong></div>'
        }
        $('#risk').html(risk_score_html);

        if (f.toString().length > 0) {
            by23 = myjson.BreachMetrics.yearwise_details[0].y2023;
            by22 = myjson.BreachMetrics.yearwise_details[0].y2022;
            by21 = myjson.BreachMetrics.yearwise_details[0].y2021;
            by20 = myjson.BreachMetrics.yearwise_details[0].y2020;
            by19 = myjson.BreachMetrics.yearwise_details[0].y2019;
            by18 = myjson.BreachMetrics.yearwise_details[0].y2018;
            by17 = myjson.BreachMetrics.yearwise_details[0].y2017;
            by16 = myjson.BreachMetrics.yearwise_details[0].y2016;
            by15 = myjson.BreachMetrics.yearwise_details[0].y2015;
            by14 = myjson.BreachMetrics.yearwise_details[0].y2014;
            by13 = myjson.BreachMetrics.yearwise_details[0].y2013;
            by12 = myjson.BreachMetrics.yearwise_details[0].y2012;
            by11 = myjson.BreachMetrics.yearwise_details[0].y2011;
            by10 = myjson.BreachMetrics.yearwise_details[0].y2010;
            by09 = myjson.BreachMetrics.yearwise_details[0].y2009;
            by08 = myjson.BreachMetrics.yearwise_details[0].y2008;
            by07 = myjson.BreachMetrics.yearwise_details[0].y2007;
            plaintext = myjson.BreachMetrics.passwords_strength[0].PlainText;
            easy = myjson.BreachMetrics.passwords_strength[0].EasyToCrack;
            hard = myjson.BreachMetrics.passwords_strength[0].StrongHash;
            passwords_cnts.push({
                'easy': easy,
                'hard': hard,
                'plaintext': plaintext
            })
            password_score = (plaintext / (easy + hard + plaintext)) * 100

            industries = myjson.BreachMetrics.industry[0]
            for (var i = 0; i < 19; i++) {
                var ind_split = industries[i];
                var categoryName = ind_split[0];
                var categoryCount = ind_split[1];

                switch (categoryName) {
                    case "aero":
                        i1 = categoryCount;
                        break;
                    case "tran":
                        i2 = categoryCount;
                        break;
                    case "info":
                        i3 = categoryCount;
                        break;
                    case "tele":
                        i4 = categoryCount;
                        break;
                    case "agri":
                        i5 = categoryCount;
                        break;
                    case "cons":
                        i6 = categoryCount;
                        break;
                    case "educ":
                        i7 = categoryCount;
                        break;
                    case "phar":
                        i8 = categoryCount;
                        break;
                    case "food":
                        i9 = categoryCount;
                        break;
                    case "heal":
                        i10 = categoryCount;
                        break;
                    case "hosp":
                        i11 = categoryCount;
                        break;
                    case "ente":
                        i12 = categoryCount;
                        break;
                    case "news":
                        i13 = categoryCount;
                        break;
                    case "ener":
                        i14 = categoryCount;
                        break;
                    case "manu":
                        i15 = categoryCount;
                        break;
                    case "musi":
                        i16 = categoryCount;
                        break;
                    case "mini":
                        i17 = categoryCount;
                        break;
                    case "elec":
                        i18 = categoryCount;
                        break;
                    case "misc":
                        i19 = categoryCount;
                        break;
                    case "fina":
                        i20 = categoryCount;
                        break;
                    case "reta":
                        i21 = categoryCount;
                        break;
                    case "nonp":
                        i22 = categoryCount;
                        break;
                    case "govt":
                        i23 = categoryCount;
                        break;
                    case "spor":
                        i24 = categoryCount;
                        break;
                    case "envi":
                        i25 = categoryCount;
                        break;
                }
            }

        }


        var cnts = [{
            name: 'Aerospace',
            cnt: i1
        },
        {
            name: 'Transport',
            cnt: i2
        },
        {
            name: 'Information Technology',
            cnt: i3
        },
        {
            name: 'Telecommunication',
            cnt: i4
        },
        {
            name: 'Agriculture',
            cnt: i5
        },
        {
            name: 'Construction',
            cnt: i6
        },
        {
            name: 'Education',
            cnt: i7
        },
        {
            name: 'Pharmaceutical',
            cnt: i8
        },
        {
            name: 'Food',
            cnt: i9
        },
        {
            name: 'Health Care',
            cnt: i10
        },
        {
            name: 'Hospitality',
            cnt: i11
        },
        {
            name: 'Entertainment',
            cnt: i12
        },
        {
            name: 'News',
            cnt: i13
        },
        {
            name: 'Energy',
            cnt: i14
        },
        {
            name: 'Manufacturing',
            cnt: i15
        },
        {
            name: 'Music',
            cnt: i16
        },
        {
            name: 'Mining',
            cnt: i17
        },
        {
            name: 'Electronics',
            cnt: i18
        },
        {
            name: 'Miscellaneous',
            cnt: i19
        },
        {
            name: 'Finance',
            cnt: i20
        },
        {
            name: 'Retail',
            cnt: i21
        },
        {
            name: 'Non-Profit/Charities',
            cnt: i22
        },
        {
            name: 'Government',
            cnt: i23
        },
        {
            name: 'Sports',
            cnt: i24
        },
        {
            name: 'Environment',
            cnt: i25
        },
        ]
        cnts.sort((a, b) => b.cnt - a.cnt);

        industry += "<ul>"
        for (i = 0; i < cnts.length; i++) {
            if (cnts[i].cnt > 0) {
                industry += "<li><a href='#'><strong>" + cnts[i].name + " <span>" + cnts[i].cnt + "</span></a></strong></li>"
            } else {
                industry += "<li><a href='#'>" + cnts[i].name + " <span>" + cnts[i].cnt + "</span></a></li>"
            }
        }
        industry += "</ul>"
        $('#industry').html(industry);

        nn = ""


        if (e == 0) {
            $("#db-p").show();
            document.getElementById("db-p").className = "visible alert alert-success";

        } else {
            if (e.toString().length > 0) {
                py23 = myjson.PasteMetrics.yearwise_details[0].y2023;
                py22 = myjson.PasteMetrics.yearwise_details[0].y2022;
                py21 = myjson.PasteMetrics.yearwise_details[0].y2021;
                py20 = myjson.PasteMetrics.yearwise_details[0].y2020;
                py19 = myjson.PasteMetrics.yearwise_details[0].y2019;
                py18 = myjson.PasteMetrics.yearwise_details[0].y2018;
                py17 = myjson.PasteMetrics.yearwise_details[0].y2017;
                py16 = myjson.PasteMetrics.yearwise_details[0].y2016;
                py15 = myjson.PasteMetrics.yearwise_details[0].y2015;
                py14 = myjson.PasteMetrics.yearwise_details[0].y2014;
                py13 = myjson.PasteMetrics.yearwise_details[0].y2013;
                py12 = myjson.PasteMetrics.yearwise_details[0].y2012;
                py11 = myjson.PasteMetrics.yearwise_details[0].y2011;
                py10 = myjson.PasteMetrics.yearwise_details[0].y2010;
                py09 = myjson.PasteMetrics.yearwise_details[0].y2009;
                py08 = myjson.PasteMetrics.yearwise_details[0].y2008;
                py07 = myjson.PasteMetrics.yearwise_details[0].y2007;
            }
            r = myjson.ExposedPastes.pastes_details;
            {
                for (var i = 0; i < r.length; i++) {
                    nn += '<tr><td>' + r[i].pasteId + '</td><td>' + r[i].xposed_date + ' </td><td>' + r[i].xposed_records + ' </td></tr>'
                }
            }
        }
        $("#paste_breach").append(nn);
        nn = ""
        if (f.toString().length <= 0) {
            document.getElementById("db-s").className = "visible alert alert-success";
            $("#db-s").show();
        } else {
            breaches_cnts = []
            l = myjson.ExposedBreaches.breaches_details;
            if (l.length > 0) {
                for (var i = 0; i < l.length; i++) {
                    ia = i + 1;
                    breaches_id = l[i].breach;
                    breaches_cnt = l[i].xposed_records;
                    breaches_dt = l[i].details
                    breaches_domain = l[i].domain
                    breaches_industry = l[i].industry
                    breaches_logo = l[i].logo
                    breaches_xposed_data = l[i].xposed_data
                    breaches_password_risk = l[i].password_risk
                    breaches_searchable = l[i].searchable
                    breaches_verified = l[i].verified
                    breaches_xposed_date = l[i].xposed_date
                    breaches_references = l[i].references
                    nn += '<tr><td> ' + breaches_id + '</td><td>' + breaches_dt + '</td><td>' + breaches_cnt + '</td></tr>';
                    breaches_cnts.push({
                        'breach': breaches_id,
                        'cnt': breaches_cnt
                    })
                    n2 = n2 + "<div>   <b><span class='notser'>" + breaches_xposed_date + "</span></b><br><br>   <div class='row'>      <div class='col-sm-4'> <img height=75 width=150 src='"
                    n2 = n2 + breaches_logo + "'>    </div>      <div class='col-sm-4'>         <h3><strong><font>  <a  href='breach.html#" + breaches_id + "' target='_blank'>"
                    n2 = n2 + breaches_id + "</font></strong></h3>         </a>      </div>      <div class='col-sm-4'>         <img height=75 width=75 src='"
                    n2 = n2 + '/static/logos/industry/' + breaches_industry + ".png' title='"
                    n2 = n2 + breaches_industry + ' Industry'
                    n2 = n2 + "'>  <figcaption>Industry: "
                    n2 = n2 + breaches_industry + "</figcaption></div></div><br><p><div align='center'><table width=75% class='table-striped table-bordered table-hover' style='font-size:18px'><tr><td><b>Exposed records</b></td><td>"
                    n2 = n2 + breaches_cnt
                    n2 = n2 + "</td></tr><tr><td><b>Exposed data</b></td><td>"
                    n2 = n2 + breaches_xposed_data
                    n2 = n2 + " </td></tr><tr><td><b>Passwords Exposed</b></td><td>"
                    n2 = n2 + breaches_password_risk
                    n2 = n2 + "</td></tr><tr><td><b> Exposed Domain</b></td><td> "
                    n2 = n2 + breaches_domain
                    n2 = n2 + "</td></tr></table><br><p style='font-size:22px;'>"
                    n2 = n2 + breaches_dt
                    n2 = n2 + "</p></div><br><br><b><u>Reference link(s):</u></b><br><a target='_blank'  href=" + breaches_references + "> " + breaches_references + "<br></a></p>"
                    n2 = n2 + "<span class='ver'>Searchable</span>"
                    if (breaches_verified = "Yes") {
                        n2 = n2 + "<span class='ver'>Verified</span>"
                    } else {
                        n2 = n2 + "<span class='notver'>Untrusted</span>"
                    }
                    n2 = n2 + "<span class='notser'>Data Breach</span></div><hr>"
                }
            }
            breaches_cnts.sort(function (cnt1, cnt2) {
                if (cnt1.cnts > cnt2.cnts) return -1;
                if (cnt1.cnts < cnt2.cnts) return 1;
            });
            breaches_cnts.slice(0, 5)
            breaches_id = [];
            breaches_cnt = [];

            for (i = 0; i < breaches_cnts.length; i++) {
                breaches_id.push(breaches_cnts[i].breach);
                breaches_cnt.push(parseInt(breaches_cnts[i].cnt));
            }

            //console.log(breaches_id)
            //console.log(breaches_cnt)

            var top5 = document.getElementById('top5breaches');
            var top5chart = new Chart(top5, {
                type: 'doughnut',
                data: {
                    labels: breaches_id,
                    datasets: [{
                        data: breaches_cnt,
                        backgroundColor: [
                            'rgba(255, 0, 0, 0.7)',
                            'rgba(255, 165, 0, 0.7)',
                            'rgba(255, 125, 20, 0.7)',
                            'rgba(255, 15, 100, 0.7)',
                            'rgba(0,255,0, 0.7)'
                        ],
                    }]
                },
                options: {
                    legend: {
                        display: true
                    },
                    plugins: {
                        datalabels: {
                            display: true,
                            borderRadius: 1,
                            font: {
                                color: 'red',
                                weight: 'bold',
                            }
                        },
                        doughnutlabel: {
                            labels: [{
                                text: '550',
                                font: {
                                    size: 20,
                                    weight: 'bold'
                                }
                            }, {
                                text: 'total'
                            }]
                        }
                    }
                }
            })

            //breaches_top5d3

            //passwords d3
            var passwords = document.getElementById('passwords');
            var passwordschart = new Chart(passwords, {
                type: 'doughnut',
                data: {

                    labels: ['Plain Text Password', 'Easily Crackable', 'Strong Hashes', 'Unknown'],
                    datasets: [{
                        data: [plaintext, easy, hard, 0],
                        backgroundColor: [
                            'rgba(255, 0, 0, 0.7)',
                            'rgba(255, 165, 0, 0.7)',
                            'rgba(0,255,0, 0.7)'
                        ],
                    }]
                },
                options: {
                    legend: {
                        display: true
                    },
                    plugins: {
                        datalabels: {
                            display: true,
                            borderRadius: 1,
                            font: {
                                color: 'red',
                                weight: 'bold',
                            }
                        },
                        doughnutlabel: {
                            labels: [{
                                text: '550',
                                font: {
                                    size: 20,
                                    weight: 'bold'
                                }
                            }, {
                                text: 'total'
                            }]
                        }
                    }
                }
            })
            //passwords d3
            $("#data_breach").append(nn);

            $("#details").append(n2);
        }
        $.LoadingOverlay("hide");
        g1();
    })
    .fail(function (n) {
        if (n.status === 404) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-success";
            document.getElementById("db-p").className = "visible alert alert-success";
            $("#db-s").show();
            $("#db-p").show();
            g1()
        } else if (n.status === 429) {
            $.LoadingOverlay("hide");
            document.getElementById("db-s").className = "visible alert alert-danger";
            $("#db-s").html("<b>Please Slow down.</b><br>Looks like your going too fast, please try again after some time.");
            $("#db-s").show();
        }
    })

Chart.defaults.global.defaultFontColor = 'white';
var color = Chart.helpers.color;
var barChartData1 = {
    labels: ['Plain Text Password', 'Easily Crackable', 'Strong Hashes'],
    datasets: [{
        label: 'Exposed Passwords Risk Profile',
        backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
        borderColor: window.chartColors.blue,
        borderWidth: 1,
        data: [
            plaintext,
            easy,
            hard
        ],
        backgroundColor: [
            'rgba(255, 0, 0, 0.7)',
            'rgba(255, 165, 0, 0.7)',
            'rgba(0,255,0, 0.7)'
        ],
        borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
        ],
    }]

};

function g1() {
    var config = {
        type: 'line',
        data: {
            labels: ['2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
            datasets: [{
                label: 'Breaches Count',
                fill: false,
                backgroundColor: window.chartColors.red,
                borderColor: window.chartColors.red,
                data: [by07, by08, by09, by10, by11, by12, by13, by14, by15, by16, by17, by18, by19, by20, by21, by22, by23],
            },
            {
                label: 'Pastes Count',
                fill: false,
                backgroundColor: window.chartColors.blue,
                borderColor: window.chartColors.blue,
                data: [py07, py08, py09, py10, py11, py12, py13, py14, py15, py16, py17, py18, py19, py20, py21, py22, py23],
            }
            ]
        },
        options: {
            responsive: true,
            legend: {
                position: 'bottom',
            },
            title: {
                display: false,
                text: 'Your Overall Breaches So Far'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0
                    },

                    display: true,
                    scaleLabel: {
                        display: true,
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0
                    },
                    gridLines: {
                        color: "#7CB9E8"
                    },
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Count of Data Breaches'
                    }
                }]
            }
        }
    };


    var ctx = document.getElementById('bc').getContext('2d');
    window.myLine = new Chart(ctx, config);

    Chart.defaults.global.defaultFontColor = '#417ff9';
    var config = {
        type: 'line',
        data: {
            labels: ['Aerospace', 'Transport', 'Information Technology', 'Telecommunication', 'Agriculture', 'Construction', 'Education', 'Pharmaceutical', 'Food', 'Health Care', 'Hospitality', 'Entertainment', 'News Media', 'Energy',
                'Manufacturing', 'Music', 'Mining', 'Electronics', 'Miscellaneous', 'Finance', 'Retail', 'Non-Profit/Charities', 'Government', 'Sports', 'Environment',
            ],
            datasets: [{
                label: 'Breaches Count',
                fill: false,
                backgroundColor: window.chartColors.red,
                borderColor: window.chartColors.red,
                data: [i1, i2, i3, i4, i5, i6, i7, i8, i9, i10, i11, i12, i13, i14, i15, i16, i17, i18, i19, i20, i21, i22, i23, i24, i25, i26],
            }]
        },
        options: {
            responsive: true,
            title: {
                display: false,
                text: 'Breaches by industry-verticals'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Industry'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        precision: 0
                    },
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Count'
                    }
                }]
            }
        }
    };

    var color = Chart.helpers.color;
    var barChartData1 = {
        labels: ['Plain Text Password', 'Easily Crackable', 'Strong Hashes'],
        datasets: [{
            label: 'Exposed Passwords Risk Profile',
            backgroundColor: color(window.chartColors.blue).alpha(0.5).rgbString(),
            borderColor: window.chartColors.blue,
            borderWidth: 1,
            data: [
                plaintext,
                easy,
                hard
            ],
            backgroundColor: [
                'rgba(255, 0, 0, 0.7)',
                'rgba(255, 165, 0, 0.7)',
                'rgba(0,255,0, 0.7)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)'
            ],
        }]

    };

}
window.onload = function () { };

//D3 closure

$('#alertMeModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget)
    var recipient = button.data('whatever')
    var modal = $(this)

    modal.find('.modal-body input').val(email)
    $('#thedudalModal').modal('hide');
})
$(document).ready(function () {

    $('#alertMeModal').on('keydown', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            $('#alertMe').click();
        }
    });
    $('#recipient-name').on('input', function () {
        var email = $(this).val();
        var isValid = validateEmail(email);
        if (isValid) {
            $(this).css("border", "1px solid green");
            $('#alertMe').prop('disabled', false);
        } else {
            $(this).css("border", "1px solid red");
            $('#alertMe').prop('disabled', true);
        }
    });
    $("#alertMe").click(function (event) {
        event.preventDefault();
        var inputValue = document.getElementById("recipient-name").value.toLowerCase();
        var apiUrl = 'https://api.xposedornot.com/v1/alertme/' + encodeURIComponent(inputValue);

        var successMessage = "Successfully added to the alert service. Please check your email and click on the verification link to confirm";
        var alreadySubscribedMessage = "We thank you for your interest. However our records indicate you are already added to the AlertMe Service.";

        $.ajax(apiUrl)
            .done(function () {
                alert(1)
                $('#message-text').val(successMessage);
                document.getElementById("h2head").className = "modal-header-success";
                $("#alertMe").hide();
                $("#alertMeClose").show();
            })
            .fail(function () {
                alert(2)
                $('#message-text').val(alreadySubscribedMessage);
                document.getElementById("h2head").className = "modal-header-success";
                $("#alertMe").hide();
                $("#alertMeClose").show();
            });
    });
});

function initTheme() {
    var e = null !== localStorage.getItem("darkSwitch") && "dark" === localStorage.getItem("darkSwitch");
    darkSwitch.checked = e, e ? document.body.setAttribute("data-theme", "dark") : document.body.removeAttribute("data-theme")
}

function resetTheme() {
    darkSwitch.checked ? (document.body.setAttribute("data-theme", "dark"), localStorage.setItem("darkSwitch", "dark")) : (document.body.removeAttribute("data-theme"), localStorage.removeItem("darkSwitch"))
}
var darkSwitch = document.getElementById("darkSwitch");
window.addEventListener("load", function () {
    darkSwitch && (initTheme(), darkSwitch.addEventListener("change", function () {
        resetTheme()
    }))
});

google.charts.load('current', {
    'packages': ['gauge']
});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Risk Score', 0]

    ]);

    var options = {
        width: 500,
        height: 300,
        greenFrom: 0,
        greenTo: 20,
        yellowFrom: 21,
        yellowTo: 50,
        redFrom: 51,
        redTo: 100,
        minorTicks: 5,
        max: 100
    };

    var chart = new google.visualization.Gauge(document.getElementById('chart_div'));

    chart.draw(data, options);
    setInterval(function () {
        data.setValue(0, 1, Math.round(risk_score))
        chart.draw(data, options);
    }, 1000);

}

google.charts.load("current", {
    packages: ["corechart"]
});
google.charts.setOnLoadCallback(drawChart_top);

function drawChart_top() {
    var data = google.visualization.arrayToDataTable([
        ["Element", "Density", {
            role: "style"
        }],
        ["Compromised credentials", 28, "#417FF9"],
        ["Phishing attacks", 20, "#417FF9"],
        ["System misconfigurations", 19, "#417FF9"],
        ["Cloud misconfiguration", 18, "#417FF9"],
        ["Vulnerability exploitation", 15, "#417FF9"],
        ["Business email compromise", 14, "#417FF9"],
        ["Social engineering", 14, "#417FF9"],
        ["Accidental lost device", 13, "#417FF9"],
        ["Physical security compromise", 13, "#417FF9"],
        ["Malicious insider", 13, "#417FF9"],
        ["Vulnerability in third-party software", 13, "#417FF9"],
        ["Cloud misconfigurations", 12, "color: #417FF9"]
    ]);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
        {
            calc: "stringify",
            sourceColumn: 1,
            type: "string",
            role: "annotation"
        },
        2
    ]);

    var options = {
        width: 450,
        height: 350,
        legend: {
            position: "none"
        },
    };
    var chart = new google.visualization.BarChart(document.getElementById("top_x_div"));
    chart.draw(view, options);
}
