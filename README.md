This is an experiment in trying to create a set of nested apps that can only
communicate through the top level frame which acts as a mediator.

Note: This _requires_ the server to respond with CSP rules that forbid loading
any subframe that isn't on the same origin.
