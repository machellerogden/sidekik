# Lisprima

> transpile a stream of lisp-like syntax to javascript

**WARNING: PRE-ALPHA WORK-IN-PROGRESS!**

## Requirements

* Node 10+
* The stomach for experimental ES features
* A love for toy languages

## Give it a try

```sh
cat ./example | ./lisprima
```

## Syntax

For the most part, just write JavaScript... except put your parenthesis on the outside and remember to use polish notation.

## Features

### Stream-based compilation

Lisprima has been load tested with a massive 20GB source file and memory never even breached 70MB. Each step in the compilation pipeline uses async iterators to process the source stream.

## License

MIT
