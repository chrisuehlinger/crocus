d3.json("public/data/sample-directory.json", function (error, root) {
    if (error) throw error;
    render(root);
});