'use strict';

// Needs to 
const child_process = require('child_process');
const sys = require('sys');
const lodash = require('lodash');

function default_error(args, dependency) {
    throw new Error(`'${dependency.name}' is not installed`);
}

class CLIDependency {
    constructor(name, on_missing = default_error, binary_path = null) {
        this.name = name;
        this.on_missing = on_missing;
        this.binary_path = binary_path;
    }

    get_full_path(callback) {
        if (this.binary_path) {
            callback(this.binary_path);
            return;
        }

        // Guesses where things are
        // (would need to be changed for full win support)
        child_process.exec(`which ${this.name}`, (error, stdout, stderr) => {
            if (error !== null) {
                this.on_missing(this); // Does not exist
                return;
            } else {
                this.binary_path = lodash.trim(stdout);
                callback(this.binary_path); // success case
            }
        });
    }

    run(...all_args) {
        const args = Array.from(all_args);
        const callback = args.pop();
        this.get_full_path(binary_path => {
            this.spawn({args}, callback);
        });
    }

    run_output(...all_args) {
        // shortcut for "spawn", with output collected as a string
        const args = Array.from(all_args);
        const callback = args.pop();
        const result = [];
        const push_data = data => result.push(data + '');
        const opts = {
            args,
            on_stdout_data: push_data,
            _result: result,
        };
        this.get_full_path(binary_path => {
            this.spawn(opts, () => callback(result.join('')));
        });
    }

    spawn(options, callback) {
        if (this.process) {
            throw new Error('Already running!');
        }

        const opts = Object.assign({
            passthrough: true,
            progress: false,
            on_stdout_data: null,
            on_stderr_data: null,
            on_error: null,
            ignore_error: false,
            silent: false,
            collect_output: false,
            env: null,
            args: [],
        }, this.baked_opts, options);
        var _this = this;

        var process_opts = {};

        // cwd and env are just passed on
        if (opts.cwd) { process_opts.cwd = opts.cwd}
        if (opts.env) { process_opts.env = opts.env}

        // shortcut to add in output collecting system
        if (opts.collect_output) {
            var result = [];
            var push_data = function (data) { result.push(data + ''); };
            opts.on_stdout_data = push_data;
            opts._result = result;
            var old_callback = callback;
            callback = function () {
                old_callback(result.join(''));
            };
        }

        // various shortcut interfaces for a nicer data handling
        if (opts.on_stdout_data || opts.on_stderr_data) { /* pass */ }
        else if (opts.stdio) { process_opts.stdio = opts.stdio; }
        else if (opts.silent) { process_opts.stdio = "ignore";  }
        else if (opts.passthrough) { process_opts.stdio = "inherit"; }

        this.process = child_process
            .spawn(this.binary_path, opts.args, process_opts);

        if (opts.on_stdout_data) {
            this.process.stdout.on('data', function (data) {
                opts.on_stdout_data(data);
            });
        }

        if (opts.on_stderr_data) {
            this.process.stderr.on('data', function (data) {
                opts.on_stderr_data(data);
            });
        }
        this.process.on('close', function (code) {
            _this.process = null;
            if (code !== 0) {
                if (opts.on_error) {
                    opts.on_error(code);
                } else if (opts.ignore_error) {
                    // pass
                } else {
                    var output = (opts._result || []).join("");
                    if (output.length > 0) {
                        output = "\nOUT: " + output + "\n";
                    }
                    throw [opts.args.join(" "), "- errorcode:", code, output].join(" ");
                }
            }
            callback(code);
        });
    }
};

module.exports = CLIDependency;
