# crocus

An experiment in different ways of representing how your file system is being used.

Installation
------------

Crocus can be installed globally via npm:

    > npm install -g crocus
    > crocus
    
Now open your favorite browser and go to http://localhost:8642. Type in the path whose structure you want to visualize.

IMPORTANT: Visualizing your whole hard drive, or even just a large part of it is not recommended. In general, crocus tends to choke more often on complex file trees with many small files than on simple file trees with a few large ones. Getting the performance to be better is an ongoing concern.

Development
-----------

Right now crocus is an express app that can be fired up using `gulp`. To install it, follow the following instructions:

    git clone https://github.com/chrisuehlinger/crocus
    npm install
    bower install
    gulp
