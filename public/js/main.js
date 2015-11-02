d3.select('#pathForm')
    .on('submit', function () {
        d3.event.preventDefault();
        update(d3.select('#rootPath')[0][0].value);
    });

update(d3.select('#rootPath')[0][0].value);

function update(rootPath) {
    createLoadingIndicator();
    d3.json("/directory/lazy?root=" + rootPath + '&maxdepth=0', function (error, root) {
        removeLoadingIndicator();
        $('.error-message').remove();
        $(window).off('resize');
        if (error) return handleError(error);

        render(root);
    });
}

$('#rootPath').typeahead({
    highlight: true
}, {
    async: true,
    limit: Infinity,
    source: function (query, syncResults, asyncResults) {
        d3.json('/directory/autocomplete?root=' + query, function (error, response) {
            if (error) return handleError(error);

            asyncResults(response);
        });
    }
}).bind('typeahead:select', update);

function handleError(error) {
    svg.selectAll('path').remove();
    ctx.clearRect(-width, -height, 2 * width, 2 * height);
    var $errorMessage = $('<div class="error-message"></div>');
    console.log(error);
    $errorMessage.html('Sorry, crocus has encountered an error. Make sure crocus is still running in the command line and try refreshing the page. If this error persists, please leave a detailed bug report on <a href="https://github.com/chrisuehlinger/crocus/issues">Github Issues</a>.');

    $('main').append($errorMessage);
}

function createLoadingIndicator() {
    var $loadingIndicator = $('<div class="loading-indicator"><i class="fa fa-refresh fa-5x fa-spin"></i></div>');
    $loadingIndicator.hide();
    $('body').append($loadingIndicator);
    $loadingIndicator.fadeIn(1000);
}

function removeLoadingIndicator() {
    $('.loading-indicator').fadeOut(2000, function () {});
}