var express = require('express');
var router = express.Router();
var fs = require('q-io/fs');
var q = require('q');
var path = require('path');

/* GET directory tree listing. */
router.get('/tree', function (req, res) {
    var root = req.query.root;

    var traverseFileSystem = function (currentPath) {
        return fs.list(currentPath)
            .then(function (files) {
                var promises = [];
                files.forEach(function (file) {
                    var currentFile = currentPath + path.sep + file;
                    var promise = fs.stat(currentFile)
                        .then(function (stat) {
                            if (stat.isFile()) {
                                return {
                                    name: file,
                                    fullPath: currentFile,
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
                                        fullPath: currentFile,
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
            fullPath: root,
            size: totalSize,
            children: children
        };
        res.send(tree);
        //        res.send('<pre><code>' + JSON.stringify(tree, null, '  ') + '</code></pre>');
    });

});

router.get('/autocomplete', function (req, res) {
    var root = req.query.root;
    var basename = '';
    if (root[root.length - 1] !== path.sep) {
        basename = path.basename(root);
        root = path.dirname(root);
    } else {
        root = root.slice(0, -1);
    }
    console.log(root);
    fs.list(root)
        .then(function (files) {
            var promises = [];
            files.forEach(function (file) {
                console.log(file);
                var fullPath = root + path.sep + file
                var promise = fs.stat(fullPath)
                    .then(function (stat) {
                        //                        console.log(stat);
                        return {
                            name: fullPath,
                            isDirectory: stat.isDirectory()
                        };
                    });

                promises.push(promise);
            });

            return q.allSettled(promises)
                .then(function (results) {
                    var files = [];
                    results.forEach(function (result) {
                        if (result.state === "fulfilled") {
                            files.push(result.value);
                        }
                    });
                    return files
                        .filter(function (file) {
                            return file.isDirectory;
                        })
                        .map(function (file) {
                            return file.name;
                        });
                });
        })
        .then(function (routes) {
            routes = routes.filter(function (route) {
                return path.basename(route).indexOf(basename) === 0;
            });
            //            res.send('<pre><code>' + JSON.stringify(routes, null, '  ') + '</code></pre>');
            res.send(routes);
        })
        .catch(function (error) {
            console.log(error);
            res.send([]);
        });
});

module.exports = router;