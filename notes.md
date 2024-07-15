# Why use this in package.json scripts -> "start": "nodemon -r dotenv/config --experimental-json-modules src/index.js"

**-r dotenv/config:** This option tells nodemon to require (-r) the dotenv/config module before starting the application. dotenv is a module that loads environment variables from a .env file into process.env, making it easier to manage configuration settings. The /config part allows for easier use directly in the command line.

**--experimental-json-modules:** This flag enables the use of experimental JSON modules in Node.js. JSON modules allow you to import JSON files directly in your JavaScript code using the import statement.