function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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
    cat: 2023,
    name: 'LiveReload',
    value: 20,
    icon: 'Live;Reload',
    desc: `
        A propritery auto-reload solution for web developers, now deprecated in favor of live-server and
        hot module reload in Webpack.
    `
}];

function drawGraph(data) {
    var nodes = data.map(function(i) {
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

    var labels = [];
    var yearTypes = [];

    data.forEach(function(d) {
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

    d3.select("#chart")
        .style("width", "1600px")
        .style("height", "3000px");

    var svg = d3.select("#chart")
        .append('div')
        .classed('svg-container', true)
        .append('svg')
        .attr("viewBox", "0 0 900 3000")
        .classed('svg-content-responsive', true)

    function ticked() {
        var k = this.alpha() * 0.3;
        nodes.forEach(function(n, i) {
            n.y += (clusters(n.groups) - n.y) * k / 3.5 - 350;
            n.x += (0 - n.x) * k / 12 + 300;
        });
        node
            .attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });
        images
            .attr("x", function(d) {
                return d.x - d.radius * 0.7;
            })
            .attr("y", function(d) {
                return d.y - d.radius * 0.7;
            });

    }
    var div = d3.select("#chart").append("div")
        .attr("class", "tooltip")
        .style("opacity", 10);

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
        .text(function(d) {
            return labels[d]
        });

    var simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody())
        .force('collision', d3.forceCollide().radius(function(d) {
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
        .attr("r", function(d) {
            return d.radius;
        })
        .attr("fill", function(d) {
            return color(yearTypes.indexOf(d.year));
        })
        .on("mouseover", function(d) {
            d3.select(this)
            div.transition()
                .duration(0)
                .style("opacity", 190);
            div.html("<b>" + escapeHtml(d.name) + "</b><br><img width=50px src=\"" + escapeHtml(d.icon) + "\"><br><br>" + escapeHtml(d.desc) + "<br><br>").style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mousemove", function(d) {
            div.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseleave", function(d) {
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
        .on("mouseover", function(d) {
            d3.select(this)
            div.transition()
                .duration(0)
                .style("opacity", 190);
            div.html("<h3>" + escapeHtml(d.name) + "</h3><br><img width=50px src=\"" + escapeHtml(d.icon) + "\"><br><br>" + escapeHtml(d.desc) + "<br><br>").style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mousemove", function(d) {
            div.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseleave", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 0)
        })
        .on("click", function(d) {
            //alert(d.link)
            window.open(d.link);
        })

    node.append('text')
        .attr('font-size', '120px')
        .style('text-anchor', 'middle')
        .text(function(d) {
            return d.year;
        });

    simulation
        .nodes(nodes)
        .on("tick", ticked);
}
drawGraph(data);
