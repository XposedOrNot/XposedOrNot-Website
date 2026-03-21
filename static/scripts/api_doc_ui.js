document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth",
        });
    });
});

document.querySelectorAll("blockquote pre").forEach(function(codeBlock) {
    if (codeBlock.parentElement.classList.contains("code-block-wrapper")) {
        return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";
    codeBlock.parentNode.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    var button = document.createElement("button");
    button.className = "copy-button";
    button.innerHTML = '<i class="fas fa-copy"></i> Copy';
    wrapper.appendChild(button);

    button.addEventListener("click", function() {
        var code = codeBlock.textContent.trim();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(code)
                .then(function() {
                    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    button.classList.add("copied");
                    setTimeout(function() {
                        button.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        button.classList.remove("copied");
                    }, 2000);
                })
                .catch(function(err) {
                    console.error("Failed to copy:", err);
                    fallbackCopy(code, button);
                });
        } else {
            fallbackCopy(code, button);
        }
    });
});

function fallbackCopy(text, button) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand("copy");
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add("copied");
        setTimeout(function() {
            button.innerHTML = '<i class="fas fa-copy"></i> Copy';
            button.classList.remove("copied");
        }, 2000);
    } catch (err) {
        console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textArea);
}

var backToTopButton = document.getElementById("backToTop");

window.addEventListener("scroll", function() {
    if (window.pageYOffset > 500) {
        backToTopButton.style.display = "block";
    } else {
        backToTopButton.style.display = "none";
    }
});

backToTopButton.addEventListener("click", function() {
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
});

var tocLinks = document.querySelectorAll("#api-toc .toc-link");
var sections = document.querySelectorAll('[id^="endpoint-"], #sdk-section');

function updateActiveLink() {
    var currentSection = "";
    var scrollPosition = window.scrollY + 150;

    sections.forEach(function(section) {
        var sectionTop = section.offsetTop;
        if (scrollPosition >= sectionTop) {
            currentSection = section.getAttribute("id");
        }
    });

    tocLinks.forEach(function(link) {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + currentSection) {
            link.classList.add("active");
        }
    });
}

window.addEventListener("scroll", updateActiveLink);
window.addEventListener("load", updateActiveLink);

var apiToc = document.getElementById('api-toc');
var footerEl = document.querySelector('.footer');

function updateTocPosition() {
    if (!apiToc || !footerEl || window.innerWidth <= 992) return;

    var tocHeight = apiToc.offsetHeight;
    var scrollY = window.scrollY;
    var tocTop = 32;
    var footerTop = footerEl.offsetTop;
    var tocBottom = scrollY + tocTop + tocHeight;

    if (tocBottom >= footerTop - 20) {
        apiToc.style.position = 'absolute';
        apiToc.style.top = (footerTop - tocHeight - 40) + 'px';
    } else {
        apiToc.style.position = 'sticky';
        apiToc.style.top = '2rem';
    }
}

window.addEventListener('scroll', updateTocPosition);
window.addEventListener('resize', updateTocPosition);
window.addEventListener('load', updateTocPosition);

document.addEventListener('DOMContentLoaded', function() {
    var footerGroups = document.querySelectorAll('.footer-group h6');
    footerGroups.forEach(function(header) {
        header.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                var group = this.parentElement;
                group.classList.toggle('active');
            }
        });
    });
});
