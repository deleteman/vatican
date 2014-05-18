#Vatican

Vatican attemps to be a micro-framework for creating APIs as quickly as possible.
One of the key features of Vatican is the use of annotations on methods to define the endpoints of the API.

For a full code example of an app using Vatican, check out this repo: https://github.com/deleteman/vatican-example

##Using Vatican

To install Vatican just run:

```
$ npm install vatican
```

Setting up the vatican server is quite easy:

```javascript
var vatican = require("vatican");

var app = new vatican();

app.start();
```
The configuration for the server will be loaded from a json file on your project's root called "vatica-conf.json".
The configuration options are the following:

+ *port*: The port where the server will be listening to.
+ *handlers*: The folder where all the handlers are stored.
+ *cors* _(optional)_: CORS header options.
+ *requestParser* _(optional)_ : The path to the custom request parser file.

###CORS options
By default, Cross Origin Resource Sharing is disabled on Vatican, but can be enabled by setting this option to *true* (which sets Access-Allow-Origin to "*" and Access-Control-Allow-Methods to "*") or by setting specific options:

+ *access_allow_origin*: Access-Allow-Origin
+ *acess_control_allow_methods*:  Access-Control-Allow-Methods
+ *access_control_expose_headers*: Access-Control-Expose-Headers
+ *access_control_max_age*: Access-Control-Max-Age
+ *access_control_allow_credentials*: Access-Control-Allow-Credentials
+ *access_control_allow_headers*: Access-Control-Allow-Headers


##Handlers

Each endpoint will be tied to one piece of code, in Vatican, that piece of code will be a method inside a handler. You can think of handlers like controllers, if you like MVC, they will 
hold the methods that will be called on each request, what you do inside them, is up to you.

Here is an example of a regular handler:

```javascript
module.exports = Hndlr;

function Hndlr(){
    
};

@endpoint (url: /books/ method: get)
Hndlr.prototype.list = function(req, res) {
    res.send("List of books!");
}

//The annotation can be commented out, so your text editor won't complain
//@endpoint (url: /books/:id method: get)
Hndlr.prototype.getData = function(req, res) {
    res.setHeader(["Content-type", "text/html"]);
    res.send("<h1>Book info goes here</h1>");
}

@endpoint (url: /books/ method: post)
Hndlr.prototype.newBook = function(req, res) {
    res.statusCode = 401;
    res.send("New book not implemented!");
}
```

##Annotations

So far, Vatican only supports the _@endpoint_ annotation, which will tell it that a given method is responsible for handling all requests for a given endpoint.
The parameters supported by this annotation are:

+ url: The url that represents the endpoint, can have url parameters, in the form of :name (i.e: /books/:id). These parameters will be available inside the request attribute received by the associated method.
+ method: The HTTP Access method used.

##Response & Request

Each method associated to an endpoint, will receive 2 parameters on each request: the request and the response objects.
The request object is the request object sent by node.js and will have the following fields of interest:

+ url: The url used to access the endpont
+ method: The HTTP Access method used
+ params: Will contain all parameters received on the request, grouped by how they were sent: _query_ for all query params, _url_ for all url params and _body_ for all post params.

###Custom request parser

By default, Vatican comes with a simple request parser, to gather things like the parameters, but there is an option to overwrite that parser by a custom one. The custom parser needs to have a _parse_ method, that will receive the follow attributes:

+ An object with two attributes: url and method.
+ The url template, as specified on the annotation
+ The request from node.js
+ And a callback function, that needs to be called passing it the final request parsed.

###Respone methods

The response object is the original response passed by Node.js, with a few extra methods:

+ send: Will write all headers, text and will also end the response.
+ setHeaders: Sets a header to be later sent by _send_. The format of the header is: ```[ 'header-name', 'header-value' ]```
+ statusCode: This is not a method, but a property, and will be used by _send_ to set the status code of the response, by default its value is 200.

##Command line tool

Vatican comes with a command line tool to help with tasks like listing the routes of your api, and creating new handlers.

###Listing all routes 

The command to list all routes is:

```
your-project-folder$ vatican list
```

###Adding new handlers

To add a new handler to the project, you just pass it's name and it's actions, like so:

```
your-project-folder$ vatican g books "list, get, delete, newBook"
```
And a new handler file, called _books.js_ will be saved inside your handlers folder, and will look like this:


```javascript
function Books() {}
@endpoint (url: /books method: ???) 
Books.prototype.list = function(req, res) {}

@endpoint (url: /books method: ???)
Books.prototype.get = function(req, res) {}

@endpoint (url: /books method: ???)
Books.prototype.delete = function(req, res) {}

@endpoint (url: /books method: ???)
Books.prototype.newBook = function(req, res) {}
```

The method on each endpoint will have to be manually set and the urls will have to be manually fixed by the developer.


#Contributing

If you feel like helping out by bug-fixing, or contributing with a new feature or whatever, just follow these simple steps:

1. Create an issue for it.
2. Fork the repo.
3. Make your changes.
4. Commit and create a pull request.
5. Be happy :)

# Contact me

If you have questions, or just want to send your love/hate, drop me an e-mail at: deleteman@gmail.com

#License

The MIT License (MIT)

Copyright (c) 2013 Fernando Doglio

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	