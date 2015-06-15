$(function () {
    $(".features li a").hover(function () {
        var thing = this.getAttribute("data-feature");
        $(".features-icons .feature").css("opacity", 0)
        if (thing != null) {
            $(".features-icons .feature-"+thing).css("opacity", 1);
        } else {
            $(".features-icons .feature-main").css("opacity", 1);
        }
    })
    $(".features").mouseleave(function () {
        $(".features-icons .feature").css("opacity", 0);
        $(".features-icons .feature-main").css("opacity", 1);
    });

    var hashScroll = false;
    $(document).scroll(function () {
        if (hashScroll) {
            hashScroll = false;
            return;
        }

        var headerOffset = parseInt($("header").css("height"));
        var sections = $("section");
        var hash = location.hash;
        var currScroll = { x: window.scrollX, y: window.scrollY };
        for (var i=0;i<sections.length;i++) {
            if ($(sections[i]).offset().top < window.scrollY + headerOffset)
                hash = "#" + sections[i].id;
        }

        if (hash != location.hash) {
            hashScroll = true;
            location.hash = hash;
            window.scrollTo(currScroll.x, currScroll.y);
            updateHash(location.hash);
        }
    });
    function updateHash(hash) {
        $("nav a.curr").toggleClass("curr", false);
        $("nav a[href='"+hash+"']").toggleClass("curr", true);
    }
    updateHash(location.hash);
});
