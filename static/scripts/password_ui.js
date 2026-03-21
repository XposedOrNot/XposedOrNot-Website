document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("edhu").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("searchMe").click();
        }
    });

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
