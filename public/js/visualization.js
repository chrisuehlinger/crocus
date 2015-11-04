var width = screen.width,
    height = screen.height,
    diameter = Math.min(width, height),
    radius = diameter / 2;

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt();

var color = d3.scale.category20b();

var canvas = d3.select("canvas");

var ctx = canvas.node().getContext('2d');

var devicePixelRatio = window.devicePixelRatio || 1,
    backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1,
    ratio = devicePixelRatio / backingStoreRatio;


var svg = d3.select("svg.svg-mask")
    .attr("width", radius)
    .attr("height", radius)
    .append("g")
    .attr("transform", "translate(" + radius / 2 + "," + (radius / 2 + 10) + ")")
    .attr('class', 'highlightable');

resize();

function resize() {
    width = screen.width;
    height = screen.height;
    diameter = Math.min(width, height);
    radius = diameter / 2;

    y.range([0, radius]);

    d3.select("svg.svg-mask")
        .attr("width", diameter)
        .attr("height", diameter)
        .select('g')
        .attr("transform", "translate(" + radius + "," + (radius + 10) + ")");

    canvas
        .attr("width", diameter)
        .attr("height", diameter);

    ctx.restore();
    if (devicePixelRatio !== backingStoreRatio) {

        canvas.node().width = diameter * ratio;
        canvas.node().height = diameter * ratio;

        canvas
            .style("width", diameter + 'px')
            .style("height", diameter + 'px');

        // now scale the context to counter
        // the fact that we've manually scaled
        // our canvas element
        ctx.scale(ratio, ratio);

    }
    ctx.translate(radius, (radius + 10));

}

var partition = d3.layout.partition()
    .value(function (d) {
        return d.size;
    });

var arc = d3.svg.arc()
    .startAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
    })
    .endAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
    })
    .innerRadius(function (d) {
        return Math.max(0, y(d.y));
    })
    .outerRadius(function (d) {
        return Math.max(0, y(d.y + d.dy));
    });

function render(root) {
    $(window).on('resize', function () {
        resize();
        path.attr('d', arc);
        canvasRender(partition.nodes(root), highlighted);
    });

    svg.selectAll("path").remove();
    var path = svg.selectAll("path")
        .data(partition.nodes(root));

    path.enter().append("path")
        .attr("d", arc)
        .style("stroke", "transparent")
        .on("click", click)
        .on("mouseover", mouseover)
        .on('mouseout', mouseout)
        .append('title')
        .text(function (d) {
            return d.name + ' ' + bytes(d.size);
        });

    var highlighted = [];

    function mouseover(d) {
        highlighted = [];
        partition.nodes(root).forEach(function (d) {
            d.highlighted = false;
        });
        highlightChain(d);
    }

    function mouseout() {

        highlighted = [];
        partition.nodes(root).forEach(function (d) {
            d.highlighted = false;
        });
        path.attr("class", function (d) {
            return d.highlighted && 'highlight';
        });
        breadcrumbRender(highlighted);
        canvasRender(partition.nodes(root), highlighted);
    }

    function highlightChain(d) {
        highlighted.push(d);
        d.highlighted = true;
        if (d.depth === 0) {
            path.attr("class", function (d) {
                return d.highlighted && 'highlight';
            });
            highlighted.reverse();
            breadcrumbRender(highlighted);
            canvasRender(partition.nodes(root), highlighted);
        } else {
            highlightChain(d.parent);
        }

    }

    canvasRender(partition.nodes(root), highlighted);

    function click(d) {
        svg.attr('class', '');
        d3.transition()
            .duration(750)
            .tween('', function () {
                var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                    yd = d3.interpolate(y.domain(), [d.y, 1]),
                    yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
                return function (t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                    var nodes = partition.nodes(root);
                    canvasRender(nodes, highlighted);
                };
            })
            .each('end', function () {
                path.attr("d", arc);
                svg.attr('class', 'highlightable');
            });
    }
}

function breadcrumbRender(highlighted) {
    console.log(highlighted);
    var crumbs = d3.select('.breadcrumbs')
        .selectAll('.crumb-wrapper')
        .data(highlighted);

    crumbs
        .enter()
        .append('div')
        .attr('class', 'crumb-wrapper')
        .append('div')
        .attr('class', 'crumb');

    crumbs.exit().remove();

    crumbs.selectAll('.crumb')
        .text(function (d) {
            return d.name;
        });

    var finalSize = bytes(highlighted[highlighted.length - 1].size);
    d3.select('.breadcrumbs .size-label').remove();
    d3.select('.breadcrumbs .crumb-wrapper:last-of-type')
        .append('div')
        .attr('class', 'size-label')
        .text(finalSize);
}

function canvasRender(nodes, highlighted) {
    ctx.clearRect(-width, -height, 2 * width, 2 * height);
    ctx.strokeStyle = '#fff';

    nodes.forEach(function (d) {
        var theArc = arc(d);
        //console.log(d.name, x(d.dx));
//        if(x(d.dx) > 0){
            ctx.fillStyle = color((d.children ? d : d.parent).name);

            var path = new Path2D(theArc);
            ctx.stroke(path);
            ctx.fill(path);
//        }
    });
}