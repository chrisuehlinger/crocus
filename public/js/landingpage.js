d3.json("/public/data/sample-directory.json", function (error, root) {
    render(root);
});