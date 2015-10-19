var express = require('express');
var router = express.Router();
var fs = require('q-io/fs');
var q = require('q');

/* GET directory listing. */
router.get('/', function (req, res) {
    var root = req.query.root;

    //  fs.stat(root)
    //    .then(function (stats) {
    //      res.send('<pre><code>' + JSON.stringify(stats, null, '  ') + '</code></pre>');
    //    });


    var traverseFileSystem = function (currentPath) {
        //        console.log(currentPath);

        return fs.list(currentPath)
            .then(function (files) {
                var promises = [];
                files.forEach(function (file) {
                    var currentFile = currentPath + '/' + file;
                    var promise = fs.stat(currentFile)
                        .then(function (stat) {
                            if (stat.isFile()) {
                                return {
                                    name: file,
                                    size: stat.size
                                };
                            } else if (stat.isDirectory()) {
                                return traverseFileSystem(currentFile).then(function (children) {
                                    var totalSize = 0;
                                    children.forEach(function (child) {
                                        totalSize += child.size;
                                    });

                                    return {
                                        name: file,
                                        size: totalSize,
                                        children: children
                                    };
                                });
                            }
                        });
                    promises.push(promise);
                });
                return q.all(promises);
            });
    };
    traverseFileSystem(root).then(function (children) {
        var totalSize = 0;
        children.forEach(function (child) {
            totalSize += child.size;
        });
        
        var tree = {
            name: root,
            size: totalSize,
            children: children
        };
        res.send(tree);
        //        res.send('<pre><code>' + JSON.stringify(tree, null, '  ') + '</code></pre>');
    });

});

module.exports = router;