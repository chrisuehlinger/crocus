var width = window.innerWidth,
    height = window.innerHeight,
    radius = Math.min(width, height) / 2;

var sizeThreshold = 0.01;

var x = d3.scale.linear()
    .range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
    .range([0, radius]);

var color = d3.scale.category20c();

var canvas = d3.select("canvas")
    .attr("width", width)
    .attr("height", height);


var ctx = canvas.node().getContext('2d');
ctx.translate(width / 2, (height / 2 + 10));

var devicePixelRatio = window.devicePixelRatio || 1,
    backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1,
    ratio = devicePixelRatio / backingStoreRatio;

if (devicePixelRatio !== backingStoreRatio) {

    canvas.node().width = width * ratio;
    canvas.node().height = height * ratio;

    canvas
        .style("width", width + 'px')
        .style("height", height + 'px');

    // now scale the context to counter
    // the fact that we've manually scaled
    // our canvas element
    ctx.scale(ratio, ratio);

}
ctx.translate(width / 2, (height / 2 + 10));



var svg = d3.select("svg.svg-mask")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")")
    .attr('class', 'highlightable');

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

d3.select('#pathForm')
    .on('submit', function () {
        d3.event.preventDefault();
        update(d3.select('#rootPath')[0][0].value);
    });

update(d3.select('#rootPath')[0][0].value);

function update(rootPath) {
    d3.json("/directory/tree?root=" + rootPath, function (error, root) {
        $('.error-message').remove();
        if (error) return handleError(error);
        

        svg.selectAll("path").remove();
        var path = svg.selectAll("path")
            .data(partition.nodes(root));

        path.enter().append("path")
            .attr("d", arc)
            .style("stroke", "transparent")
            .on("click", click)
            .on("mouseover", mouseover)
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

        function highlightChain(d) {
            highlighted.push(d);
            d.highlighted = true;
            if (d.depth === 0) {
                path.attr("class", function (d) {
                    return d.highlighted && 'highlight';
                });
                highlighted.reverse();
                breadcrumbRender(highlighted);
                canvasRender(partition.nodes(root).filter(function (d) {
                    return x(d.dx) > sizeThreshold;
                }), highlighted);
            } else {
                highlightChain(d.parent);
            }

        }

        canvasRender(partition.nodes(root).filter(function (d) {
            return x(d.dx) > sizeThreshold;
        }), highlighted);

        function click(d) {
            svg.attr('class', '');
            d3.transition()
                .duration(750)
                .tween("swivel", function () {
                    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                        yd = d3.interpolate(y.domain(), [d.y, 1]),
                        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
                    return function (t) {
                        x.domain(xd(t));
                        y.domain(yd(t)).range(yr(t));
                        var nodes = partition.nodes(root)
                            .filter(function (d) {
                                return x(d.dx) > sizeThreshold;
                            });
                        canvasRender(nodes, highlighted);
                    };
                })
                .each('end', function () {
                    path.attr("d", arc);
                    svg.attr('class', 'highlightable');
                });
        }
    });
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
        ctx.fillStyle = color((d.children || true ? d : d.parent).name);

        var path = new Path2D(arc(d));
        ctx.stroke(path);
        ctx.fill(path);
    });
}

//d3.select(self.frameElement).style("height", height + "px");

// Interpolate the scales!
function arcTween(d) {
    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(y.domain(), [d.y, 1]),
        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
    return function (d, i) {
        return i ? function (t) {
            return arc(d);
        } : function (t) {
            x.domain(xd(t));
            y.domain(yd(t)).range(yr(t));
            return arc(d);
        };
    };
}

$('#rootPath').typeahead({
    highlight: true
}, {
    async: true,
    source: function (query, syncResults, asyncResults) {
        d3.json('/directory/autocomplete?root=' + query, function (error, response) {
            if (error) return handleError(error);

            asyncResults(response);
        });
    }
});

function handleError(error){
    svg.selectAll('path').remove();
    ctx.clearRect(-width, -height, 2 * width, 2 * height);
    var $errorMessage = $('<div class="error-message"></div>');
    console.log(error);
    $errorMessage.html('Sorry, crocus has encountered an error. Make sure crocus is still running in the command line and try refreshing the page. If this error persists, please leave a detailed bug report on <a href="https://github.com/chrisuehlinger/crocus/issues">Github Issues</a>.');
    
    $('main').append($errorMessage);
}