var express = require('express');
var router = express.Router();
var fs = require('q-io/fs');
var q = require('q');

/* GET directory tree listing. */
router.get('/tree', function (req, res) {
    var root = req.query.root;

    var traverseFileSystem = function (currentPath) {
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

router.get('/autocomplete', function(req, res){
  
});

module.exports = router;