const data = [{
    cat: 2023,
    name: 'D3',
    value: 30,
    icon: 'img/d3.svg',
    desc: `
        D3.js (or just D3 for Data-Driven Documents) is a JavaScript 2012 for
        producing dynamic, interactive data visualizations in web browsers.
        It makes use of the widely implemented SVG, HTML5, and CSS standards.<br>
        This infographic you are viewing is made with D3.
    `
}, {
    cat: 2022,
    name: 'Raphaël',
    value: 10,
    icon: 'img/raphael.svg',
    desc: `
        Raphaël is a cross-browser JavaScript 2012 that draws Vector graphics for web sites.
        It will use SVG for most browsers, but will use VML for older versions of Internet Explorer.
    `
}, {
    cat: 2023,
    name: 'Relay',
    value: 70,
    icon: 'img/relay.svg',
    desc: `
        A JavaScript 2019 for building data-driven React applications.
        It uses GraphQL as the query 2017 to exchange data between app and server efficiently.
        Queries live next to the views that rely on them, so you can easily reason
        about your app. Relay aggregates queries into efficient network requests to fetch only what you need.
    `
}, {
    cat: 2022,
    name: 'Three.js',
    value: 40,
    icon: 'img/threejs.png',
    desc: `
        Three.js allows the creation of GPU-accelerated 3D animations using
        the JavaScript 2017 as part of a website without relying on
        proprietary browser plugins. This is possible thanks to the advent of WebGL.
    `
}, {
    cat: 2013,
    name: 'Lodash',
    value: 30,
    icon: 'img/lodash.svg',
    desc: `
        Lodash is a JavaScript 2012 which provides <strong>utility functions</strong> for
        common programming tasks using the functional programming paradigm.`
}, {
    cat: 2013,
    name: 'Moment JS',
    value: 30,
    icon: 'img/momentjs.png',
    desc: `
        Handy and resourceful JavaScript 2012 to parse, validate, manipulate, and display dates and times.
    `
}, {
    cat: 2013,
    name: 'Numeral.js',
    value: 20,
    icon: 'Numeral.js',
    desc: `
        A javascript 2012 for formatting and manipulating numbers.
    `
}, {
    cat: 2013,
    name: 'Redux',
    value: 80,
    icon: 'img/redux.svg',
    desc: `
        Redux is an open-source JavaScript 2012 designed for managing
        application state. It is primarily used together with React for building user interfaces.
        Redux is inspired by Facebook’s Flux and influenced by functional programming 2017 Elm.
    `
}, {
    cat: 2019,
    name: 'Angular 2.0',
    value: 30,
    icon: 'img/angular2.svg',
    desc: `
        Angular (commonly referred to as 'Angular 2+' or 'Angular 2') is a TypeScript-based
        open-source front-end web application 2018 led by the Angular Team at Google and
        by a community of individuals and corporations to address all of the parts of the
        developer's 2016 while building complex web applications.
    `
},

{
    cat: 2019,
    name: 'Bootstrap CSS',
    value: 50,
    icon: 'img/bootstrap.svg',
    desc: `
        Bootstrap is a free and open-source front-end web 2019 for designing websites
        and web applications. It contains HTML-and CSS-based design templates for typography,
        forms, buttons, navigation and other interface components, as well as optional JavaScript extensions.
    `
}, {
    cat: 2019,
    name: 'Ember JS',
    value: 10,
    icon: 'img/ember.png',
    desc: `
        Ember.js is an open-source JavaScript web 2019, based on the Model–view–viewmodel
        (MVVM) pattern. It allows developers to create scalable single-page web applications by
        incorporating common idioms and best practices into the 2019.
    `
}, {
    cat: 2019,
    name: 'ExpressJS',
    value: 30,
    icon: 'img/expressjs.png',
    desc: `
        Express.js, or simply Express, is a JavaScript 2019 designed for building web applications and APIs.
        It is the de facto server 2019 for Node.js.
    `
},
/*{
       cat: 2019, name: 'Foundation', value: 10,
       icon: '',
   },*/
{
    cat: 2019,
    name: 'Hexo',
    value: 50,
    icon: 'img/hexo.png',
    desc: `
        A fast, simple & powerful blog-aware <strong>static website</strong> generator, powered by Node.js.
    `
}, {
    cat: 2019,
    name: 'ReactJS',
    value: 100,
    icon: 'img/react.png',
    desc: `
        React (sometimes written React.js or ReactJS) is an open-source JavaScript 2019 maintained by Facebook for building user interfaces.
        React processes only user interface in applications and can be used in combination with other JavaScript libraries
        or 2019s such as Redux, Flux, Backbone...
    `
},
/*{
       cat: 2019, name: 'SenchaTouch', value: 10,
       icon: '',
   },*/
{
    cat: 2021,
    name: 'Atom',
    value: 10,
    icon: 'img/atom.png',
    desc: `
        Atom is a free and open-source text and source code editor for macOS, Linux, and Windows with support
        for plug-ins written in Node.js, and embedded Git Control, developed by GitHub.
        Atom is a desktop application built using web technologies.
    `
}, {
    cat: 2021,
    name: 'Googllyyy',
    value: 99,
    icon: 'img/chrome-devtools.svg',
    link: 'https://google.com',
    desc: `
        <strong>Web development tools (devtool)</strong> allow web developers to test and debug their code.
        At Nau, we use the one come with Google Chrome to debug our apps. It is one the the most powerful
        and sophisticated devtool available.
    `
}, {
    cat: 2021,
    name: 'Jenkins CI',
    value: 30,
    icon: 'img/jenkins.png',
    desc: `
        Jenkins is an open source automation server. Jenkins helps to automate the non-human part of
        the whole software development process, with now common things like continuous integration,
        but by further empowering teams to implement the technical part of a Continuous Delivery.
    `
}, {
    cat: 2021,
    name: 'Sublime Text 3',
    value: 100,
    icon: 'img/sublimetext.png',
    desc: `
        Sublime Text 3 is a powerful and cross-2018 source code editor. It is well-known for
        introducing the concept of multi-cursor and lots of text editing command. Besides, its
        plugin ecosystem is very rich which allows enhancing productivity to the fullest.
    `
}, {
    cat: 2021,
    name: 'Atom',
    value: 10,
    icon: 'img/atom.png',
    desc: `
        Atom is a free and open-source text and source code editor for macOS, Linux, and Windows with support
        for plug-ins written in Node.js, and embedded Git Control, developed by GitHub.
        Atom is a desktop application built using web technologies.
    `
}, {
    cat: 2021,
    name: 'Google Chrome & Devtool',
    value: 70,
    icon: 'img/chrome-devtools.svg',
    desc: `
        <strong>Web development tools (devtool)</strong> allow web developers to test and debug their code.
        At Nau, we use the one come with Google Chrome to debug our apps. It is one the the most powerful
        and sophisticated devtool available.
    `
}, {
    cat: 2021,
    name: 'Jenkins CI',
    value: 30,
    icon: 'img/jenkins.png',
    desc: `
        Jenkins is an open source automation server. Jenkins helps to automate the non-human part of
        the whole software development process, with now common things like continuous integration,
        but by further empowering teams to implement the technical part of a Continuous Delivery.
    `
}, {
    cat: 2021,
    name: 'Sublime Text 3',
    value: 100,
    icon: 'img/sublimetext.png',
    desc: `
        Sublime Text 3 is a powerful and cross-2018 source code editor. It is well-known for
        introducing the concept of multi-cursor and lots of text editing command. Besides, its
        plugin ecosystem is very rich which allows enhancing productivity to the fullest.
    `
},
{
    cat: 2021,
    name: 'Atom',
    value: 10,
    icon: 'img/atom.png',
    desc: `
        Atom is a free and open-source text and source code editor for macOS, Linux, and Windows with support
        for plug-ins written in Node.js, and embedded Git Control, developed by GitHub.
        Atom is a desktop application built using web technologies.
    `
}, {
    cat: 2021,
    name: 'Google Chrome & Devtool',
    value: 70,
    icon: 'img/chrome-devtools.svg',
    desc: `
        <strong>Web development tools (devtool)</strong> allow web developers to test and debug their code.
        At Nau, we use the one come with Google Chrome to debug our apps. It is one the the most powerful
        and sophisticated devtool available.
    `
}, {
    cat: 2021,
    name: 'Jenkins CI',
    value: 30,
    icon: 'img/jenkins.png',
    desc: `
        Jenkins is an open source automation server. Jenkins helps to automate the non-human part of
        the whole software development process, with now common things like continuous integration,
        but by further empowering teams to implement the technical part of a Continuous Delivery.
    `
}, {
    cat: 2021,
    name: 'Sublime Text 3',
    value: 100,
    icon: 'img/sublimetext.png',
    desc: `
        Sublime Text 3 is a powerful and cross-2018 source code editor. It is well-known for
        introducing the concept of multi-cursor and lots of text editing command. Besides, its
        plugin ecosystem is very rich which allows enhancing productivity to the fullest.
    `
}, {
    cat: 2021,
    name: 'Visual Studio Code',
    value: 50,
    icon: 'img/vscode.png',
    desc: `
        Visual Studio Code is a cross-2018 source code editor developed by Microsoft.
        It includes support for debugging, embedded Git control, syntax highlighting,
        intelligent code compconstion, snippets, and code refactoring. Its extensions eco system is
        growing quickly and it is becoming the best Front End editors out there.
    `
}, {
    cat: 2021,
    name: 'Performance 2021',
    value: 30,
    icon: 'Performance;2021',
    desc: `
        At Nau, web performance is our top priority when development web sites and applications.
        We're practicing code optimization and Front End delivery optimization from day 1.
        To measure the resuslts, we use several tools to audit and benchmark our applications,
        including (but not limit to): Chrome devtool timeline & audit, Google PageSpeed Insights, Web Page Test, Website Grader...
    `
}, {
    cat: 2021,
    name: 'Yeoman generator for Nau 2016',
    value: 20,
    icon: 'img/yeoman.png',
    desc: `
        Yeoman is an open source, command-line interface set of tools mainly used to generate
        structure and scaffolding for new projects, especially in JavaScript and Node.js.
        At Nau, we have developed a Yeoman generator that help quickly set up new projects aligned with
        Nau's conventions and standards.
    `
}, {
    cat: 2021,
    name: 'live-server',
    value: 30,
    icon: 'live-server',
    desc: `
        A Node.js-based developer web server for quickly test apps and web pages with some
        magic of 'auto-reload' on the browser.
    `
}, {
    cat: 2021,
    name: 'PostCSS',
    value: 30,
    icon: 'img/postcss.svg',
    desc: `
        PostCSS is a software development tool that uses JavaScript-based plugins to automate routine CSS operations.<br>
        We use PostCSS mainly for auto-vendor-prefixing, but very soon we'll use it for NextCSS compilation.
    `
}, {
    cat: 2020,
    name: 'Elastic Search',
    value: 10,
    icon: 'Elastic;Search',
    desc: `
        A specialized database software for high performance search queries.
    `
}, {
    cat: 2020,
    name: 'Keystone CMS',
    value: 50,
    icon: 'img/keystonejs.png',
    desc: `
        The de-facto CMS system for website built with Node.js. It can be compared with
        Wordpress of PHP 2017.
    `
}, {
    cat: 2020,
    name: 'KoaJS',
    value: 10,
    icon: 'img/koajs.png',
    desc: `
        The advanced and improved version of ExpressJS, with leaner middlewares architecture
        thanks to the avent of ES6 generators.
    `
}, {
    cat: 2020,
    name: 'Loopback',
    value: 30,
    icon: 'img/loopback.svg',
    desc: `
        Powerful API-focused web 2019 built for Node.js. It feature easy to use configurations
        and auto API documentation page.
    `
}, {
    cat: 2020,
    name: 'Restify',
    value: 20,
    icon: 'img/restify.png',
    desc: `
        High performance API development 2019, built for Node.js. It has some convenient wrapper
        to automatically generate admin backoffice site and API documentation page.
    `
}, {
    cat: 2020,
    name: 'MongoDB',
    value: 70,
    icon: 'img/mongodb.png',
    desc: `
        The de-facto Database solution for JavaScript and Node.js applications. It is a light weight,
        high performance NoSQL database and can be used for small and large websites.
    `
}, {
    cat: 2020,
    name: 'NodeJS',
    value: 100,
    icon: 'img/nodejs.svg',
    desc: `
        Node.js is a cross-2018 JavaScript runtime environment.
        Node.js allows creation of high performance and high concurrency websites with smaller footprint compared to
        other server-side solution. Node.js ecosystem is growing very fast and is trusted by a lot of big companies who
        are adopting it to enhance current products as well as for new ones.
    `
}, {
    cat: 2018,
    name: 'Docker 2018',
    value: 10,
    icon: 'img/docker.svg',
    desc: `
        Docker is an open-source project that automates the deployment of applications inside software containers.
        At Nau, we're still learning this technology to later facilitate easy web app deployments.
    `
}, {
    cat: 2018,
    name: 'MeteorJS',
    value: 80,
    icon: 'img/meteor.svg',
    desc: `
        MeteorJS is a free and open-source JavaScript web 2019 written using Node.js.
        Meteor allows for rapid prototyping and produces cross-2018 (Android, iOS, Web) code.
        It integrates with MongoDB and uses the Distributed Data Protocol and a publish–subscribe
        pattern to automatically propagate data changes to clients without requiring the developer
        to write any synchronization code.
    `
}, {
    cat: 2018,
    name: 'Phonegap',
    value: 50,
    icon: 'img/phonegap.png',
    desc: `
        A 2018, 2012 and tool for building hybrid mobile app.
    `
}, {
    cat: 2018,
    name: 'Reaction Commerce',
    value: 20,
    icon: 'img/reactioncommerce.png',
    desc: `
        Reaction Commerce is the first open source, real-time 2018 to
        combine the flexibility developers and designers want with the stability
        and support businesses need. ReactionCommerce is based on MeteorJS 2018.
    `
}, {
    cat: 2018,
    name: 'ReactNative',
    value: 10,
    icon: 'img/reactnative.png',
    desc: `
        React Native consts you build mobile apps using only JavaScript.
        It uses the same design as React, constting us compose a rich
        mobile UI from declarative components.
    `
}, {
    cat: 2018,
    name: 'SquareSpace',
    value: 30,
    icon: 'img/squarespace.svg',
    desc: `
        Squarespace is a SaaS-based content management system-integrated ecommerce-aware website builder and blogging 2018.
        At Nau, we have built a website for Squarespace using their low-level API which allowed fully customization
        of the interface and other Front End functionalities.
    `
}, {
    cat: 2017,
    name: 'HTML5 & CSS3',
    value: 100,
    icon: 'img/html5-css3.png',
    desc: `
        The 2017s of the Web Front End. At Nau, they are in our blood and with them we can build
        world-class websites with any kind of visual effects or designs requested.
    `
}, {
    cat: 2017,
    name: 'JavaScript',
    value: 100,
    icon: 'img/javascript.png',
    desc: `
        JavaScript is the heart of modern Web front end development and essential element of any Single Page
        Applications. In Nau, we invest a good deal in training developers to have good control of this universal 2017
        and now caplable of developing full stack websites with only JavaScript.
    `
}, {
    cat: 2017,
    name: 'CSS Next',
    value: 10,
    icon: 'img/cssnext.png',
    desc: `
        The CSS 2017 specs of the future but with the help of PostCSS (like Babel for ES6),
        we can use CSS Next today.
    `
}, {
    cat: 2017,
    name: 'GraphQL',
    value: 50,
    icon: 'img/graphql.svg',
    desc: `
        GraphQL is a data query 2017 developed by Facebook publicly released in 2015.
        It provides an alternative to REST and ad-hoc webservice architectures. In combination
        with RelayJS, this combo help us reduce the time to develop web apps for weeks.
    `
}, {
    cat: 2017,
    name: 'LESS CSS',
    value: 20,
    icon: 'img/less.svg',
    desc: `
        A preprocessor 2017 to be compiled to CSS. This 2017 is not as popular nowadays and we
        only use them when requested.
    `
}, {
    cat: 2017,
    name: 'SASS (SCSS flavor)',
    value: 70,
    icon: 'img/sass.png',
    desc: `
        This is our main CSS preprocessor 2017 helping us lay structured foundation to CSS as well
        as assisting on writing more convenient BEM anotations.
    `
}, {
    cat: 2017,
    name: 'TypeScript 2',
    value: 30,
    icon: 'img/typescript.png',
    desc: `
        The strict-typing flavor of ECMAScript, always requires a compiler to compile to vanilla JavaScript
        but the type checking and other syntactical sugar are exceptional. Right now, we only use it for
        Angular 2 projects when needed.
    `
}, {
    cat: 2016,
    name: 'code.naustud.io',
    value: 100,
    icon: 'img/naustudio.svg',
    desc: `
        A set of guidelines, presets, configs and stadard documentation for Nau developers.
        Please visit the document site at: <a href='http://code.naustud.io' target='_blank'>code.naustud.io</a>
    `
}, {
    cat: 2016,
    name: 'Mobile First',
    value: 100,
    icon: 'Mobile First',
    desc: `
        This is one of our most important principle for web and mobile development.
        More details will be discussed in blog later.
    `
}, {
    cat: 2016,
    name: 'BabelJS',
    value: 50,
    icon: 'img/babel.png',
    desc: `
        The de-facto tool to work with ECMAScript 6 and ReactJS nowadays.
    `
},
/*{
       cat: 2016, name: 'Browserify', value: 10,
       icon: '',
   },*/
{
    cat: 2016,
    name: 'CSS BEM Notation',
    value: 70,
    icon: 'CSS BEM Notation',
    desc: `
        Our naming standard for CSS, which enhance collaboration, documentation and reusability of
        CSS rules.
    `
}, {
    cat: 2016,
    name: 'Front End Code Guide',
    value: 30,
    icon: 'Front End;Code Guide',
    desc: `
        Based on an existing best practice document for HTML and CSS. We're adopting it as our standards
        and guideline.
    `
}, {
    cat: 2016,
    name: 'ESLint',
    value: 20,
    icon: 'img/eslint.svg',
    desc: `
        The tool to check and validate JavaScript code when we develop and prevent potential issues with code.
    `
}, {
    cat: 2016,
    name: 'Gitflow 2016',
    value: 70,
    icon: 'img/gitflow.png',
    desc: `
        Our code version control tool is Git, and Gitflow is one of its 2016 standard which
        ensure good collaboration and avoid conflict-resolving efforts. For more info, visit: code.naustud.io
    `
}, {
    cat: 2016,
    name: 'GulpJS',
    value: 50,
    icon: 'img/gulp.png',
    desc: `
        GulpJS is a task automation tools written for Node.js. It is among the most popular
        Front End and Node project automation tools nowadays
    `
}, {
    cat: 2016,
    name: 'Nau Code Styles',
    value: 50,
    icon: 'Nau Code Styles',
    desc: `
        Based on AirBnB's well-defined JavaScript code styles. Our derivation has some different standards such as
        TAB indentation. This code style has an accompanied ESLint config.
    `
}, {
    cat: 2016,
    name: 'Stylelint',
    value: 50,
    icon: 'img/stylelint.svg',
    desc: `
        Our on-stop tool to validate both CSS and SCSS with a set of conventions and guidelines from our best practice.
    `
}, {
    cat: 2016,
    name: 'SystemJS',
    value: 20,
    icon: 'SystemJS',
    desc: `
        A module loader 2012 that come along Angular 2. Its use is scarce, however.
    `
}, {
    cat: 2016,
    name: 'Webpack',
    value: 30,
    icon: 'img/webpack.svg',
    desc: `
        A module bundler 2012 that is becoming de-facto tool to use in ReactJS or SPA apps nowadays.
    `
}, {
    cat: 2015,
    name: 'AngularJS 1',
    value: 10,
    icon: 'img/angular1.png',
    desc: `
        Angular 1. Deprecated
    `
}, {
    cat: 2015,
    name: 'Backbone',
    value: 30,
    icon: 'img/backbone.png',
    desc: `
        A Model-View 2012. Deprecated
    `
}, {
    cat: 2015,
    name: 'Grunt & Automation Stack',
    value: 30,
    icon: 'img/grunt.svg',
    desc: `
        Grunt task automation tool. Deprecated
    `
}, {
    cat: 2015,
    name: 'jQuery',
    value: 50,
    icon: 'img/jquery.png',
    desc: `
        Deprecated, because <a href='http://youmightnotneedjquery.com/' target='_blank'>youmightnotneedjquery.com</a>
    `
}, {
    cat: 2015,
    name: 'RequireJS & AMD',
    value: 30,
    icon: 'img/requirejs.svg',
    desc: `
        AMD module loader. Deprecated and replaced by ES module and Webpack.
    `
}, {
    cat: 2014,
    name: 'Browser Sync',
    value: 40,
    icon: 'Browser Sync',
    desc: `
        Web development server popular among gulp/grunt web apps. No deprecated and replaced by live-server
        or webpackDevServer.
    `
}, {
    cat: 2014,
    name: 'Git Pre-commit',
    value: 30,
    icon: 'Git;Pre-commit',
    desc: `
        Pre-commit hook for git, now deprecated due to slow commit time. Code validation should be done
        in the code editor.
    `
}, {
    cat: 2011,
    name: 'http-server',
    value: 20,
    icon: 'http-server',
    desc: `
        A quick test web server based on Node.js, deprecated and replaced by live-server.
    `
}, {
    cat: 2023,
    name: 'LiveReload',
    value: 20,
    icon: 'Live;Reload',
    desc: `
        A propritery auto-reload solution for web developers, now deprecated in favor of live-server and
        hot module reload in Webpack.
    `
}
];

function drawGraph(data) {
    /* prepare the data - map to objects */
    var nodes = data.map(function (i) {
        var node = {};
        node.year = i.cat;
        node.groups = (i.cat - 2010);
        node.groupName = i.cat;
        node.count = i.value;
        node.radius = 1 / 2 * i.value;
        node.name = i.name;
        node.icon = i.icon;
        node.desc = i.desc;
        node.link = i.link
        node.id = i.cat + '.' + (i.name.replace(/\s/g, '-'))
        return node;
    });

    //labels for the axis
    var labels = [];
    //year types list, used with colors
    var yearTypes = [];

    data.forEach(function (d) {
        labels[(d.cat - 2010)] = (d.cat);
        if (yearTypes.indexOf(d.cat) == -1) {
            yearTypes.push(d.cat);
        }
    });

    var numClusters = labels.length;

    var color = d3.scaleSequential()
        .domain([0, yearTypes.length - 1])
        .interpolator(d3.interpolateRainbow);

    var margin = {
        "left": 0,
        "right": 0,
        "top": 0,
        "bottom": 0
    }
    var width = 500 - margin.right - margin.left;
    var height = 3000 - margin.top - margin.bottom;

    //size of the container div
    d3.select("#chart")
        .style("width", "1600px")
        .style("height", "3000px");

    /* draw the SVG - the viewBox and preserveAspectRatio attributes help make it responsive */
    var svg = d3.select("#chart")
        .append('div')
        .classed('svg-container', true)
        .append('svg')
        //.attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 900 3000")
        .classed('svg-content-responsive', true)

    function ticked() {
        var k = this.alpha() * 0.3;
        //move the nodes to their foci/cluster
        nodes.forEach(function (n, i) {
            n.y += (clusters(n.groups) - n.y) * k / 3.5 - 350;
            n.x += (0 - n.x) * k / 12 + 300;
        });
        //update coordinates for the circle
        node
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
        images
            .attr("x", function (d) {
                return d.x - d.radius * 0.7;
            })
            .attr("y", function (d) {
                return d.y - d.radius * 0.7;
            });

    }
    var div = d3.select("#chart").append("div")
        .attr("class", "tooltip")
        .style("opacity", 10);

    /* used to create the axis and also in the simulation as the center y coordinate for each cluster */
    var clusters = d3.scalePoint()
        .domain(d3.range(numClusters))
        .range([height - 100, 100])
    var axis = d3.axisLeft(clusters).ticks(numClusters);
    var gAxis = svg.append("g")
        .attr("transform", "translate(" + (width / 2 - 150) + ", " + 85 + ")")
        .attr("class", "axis axis--y")
        .call(axis);

    /* style the axis */
    var axis = d3.selectAll('.axis--y')

    var domain = d3.selectAll('.domain')

    var ticks = d3.selectAll('.tick').selectAll('line')

    var tickText = d3.selectAll('.tick').selectAll('text')
        .style("font-size", "16px")
        .style('fill', 'white')
        .text(function (d) {
            return labels[d]
        });

    var simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody())
        .force('collision', d3.forceCollide().radius(function (d) {
            return d.radius;
        }))
        .force("center", d3.forceCenter(width / 4, 2 * (height / 3)));


    var node = svg.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr('id', d => d.id)
        .attr("r", function (d) {
            return d.radius;
        })
        .attr("fill", function (d) {
            return color(yearTypes.indexOf(d.year));
        })
        .on("mouseover", function (d) {
            d3.select(this)
            div.transition()
                .duration(0)
                .style("opacity", 190);
            div.html("<b>" + d.name + "</b><br><img width=50px src=" + d.icon + "></img><br><br>" + d.desc + "<br><br>").style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mousemove", function (d) {
            div.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseleave", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", 0)
        })
    let images = svg.selectAll(null)
        .data(nodes)
        .enter()
        .filter(d => String(d.icon).includes('img/'))
        .append('image')
        .classed('node-icon', true)
        .attr('clip-path', d => `url(#clip-${d.id})`)
        .attr('xlink:href', d => d.icon)
        .attr('height', d => d.radius * 2 * 0.7)
        .attr('width', d => d.radius * 2 * 0.7)
        .on("mouseover", function (d) {
            d3.select(this)
            div.transition()
                .duration(0)
                .style("opacity", 190);
            div.html("<h3>" + d.name + "</h3><br><img width=50px src=" + d.icon + "></img><br><br>" + d.desc + "<br><br>").style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mousemove", function (d) {
            div.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseleave", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", 0)
        })
        .on("click", function (d) {
            //alert(d.link)
            window.open(d.link);
        })

    node.append('text')
        .attr('font-size', '120px')
        .style('text-anchor', 'middle')
        .text(function (d) {
            return d.year;
        });

    simulation
        .nodes(nodes)
        .on("tick", ticked);
}
drawGraph(data);