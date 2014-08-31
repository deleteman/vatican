#Vatican

[![NPM](https://nodei.co/npm/vatican.png?downloads=true&stars=true)](https://nodei.co/npm/vatican/)

Vatican attemps to be a micro-framework for creating APIs as quickly as possible.
One of the key features of Vatican is the use of annotations on methods to define the endpoints of the API.

For a full code example of an app using Vatican, check out this repo: https://github.com/deleteman/vatican-example

##Installing Vatican

```
$ npm install vatican
```

#More info

+ Vatican.js main site: http://vaticanjs.info
+ Docs: http://vaticanjs.info/docs.html

#Changelog

##v 1.3.0

+ Added name attribute to @endpoint annotation
+ Added ability to set pre-processors on specific endpoints by name
+ Added model generator working with MongoDB
+ Auto generate handlers method's code based on their name
+ New generate syntax, allowing to specify attributes, types and http methods
+ Added index.js and package.json generator

##v 1.2.4

+ Fixed bug causing incorrect parsing of post/put body content

##v 1.2.3

+ Fixed bug preventing the handlers from loading installed modules using 'require'


##v 1.2.2

+ Fixed bug causing problems with the pre-processing chain and the handler methods.

##v 1.2.1

+ Fixed bug causing vatican to match incorrecly urls with similar templates
+ Changed preprocessing chain, so that now handler methods recieve the _next_ function and can trigger the generic error handler functions

##v 1.2.0

+ Fixed support for PUT requests
+ Added configuration overwrite on Vatican constructor and cli commands
+ Added callback function to _start_ method of _Vatican_ called after successful start of http server.
+ Updated cli help
+ Handlers are now stored in-memory after the first time they're loaded, so they're not loaded on every request.

##v 1.1.0

+ Added pre-processor to request
+ Added post-processor to response
+ Fixed bug causing incorrect request parsing on non-post requests.

##v 1.0.1

+ Changed default handler folder for create command
+ Minor readme fixes

##v 1.0.0

+ Added create new project command
+ Minor fixes on readme

##v 0.1.1

+ Added auto-stringify of objects passed to the send method on the response object.
+ Edited readme

##v 0.0.1

+ First version


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
	
