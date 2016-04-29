// TODO: Legacy pre-ES6 code

// TODO: lots of unused, untested code needs to be removed

var mkdirp = require('mkdirp');
var glob = require('glob');
var fs = require('fs');
var fse = require('fs-extra');
var os = require('os');
var path = require('path');
var lodash = require('lodash');
var uuid = require('node-uuid');
var tar = require('tar');

var consts = {};
consts.SCROLL_MAGIC = "scroll-tar";
module.exports.consts = consts;

var TMP_DIR = os.tmpdir();
var TMP_PREFIX = "scrolltmp_";

module.exports.rmdirtmp = function (dir_path, callback) {
    var result = path.join(TMP_DIR, TMP_PREFIX);
    if (dir_path.indexOf(result) !== 0) {
        throw new Error('Tried to remove non-tmp dir: ' + path);
    }
    fse.remove(dir_path, callback);
};

module.exports.get_free_tmp_dir = function (callback) {
    var number = (Math.random() + "").slice(2, 8);
    var dirname = TMP_PREFIX + number;
    var result = path.join(TMP_DIR, dirname);
    fs.exists(result, function (exists) {
        if (exists) {
            // requires 1 million incidents for a collision, very rare
            result += "_" + (Math.random() + "").slice(2, 11);
        }
        callback(result);
    });
};

module.exports.mkdirtmp = function (opts, callback) {
    if (!callback) { callback = opts; opts = {}; }
    get_free_tmp_dir(function (new_path) {
        if (opts.subdirname) {
            new_path = path.join(new_path, opts.subdirname);
        }

        // Get a free path to a temp directory
        mkdirp(new_path, function (err, made) {
            if (err) {
                throw "Making tmp dir1:" + err;
            }
            callback(new_path);
        });
    });
};


module.exports.basename = function (p) {
    return path.basename(p).split(".")[0];
};


module.exports.dedupe_extend = function (arr1, arr2, seen) {
    // Extends list 1 by list 2, being careful not to insert duplicates
    seen = seen || {};
    for (var i in arr2) {
        var path = arr2[i];
        if (!(path in seen)) {
            seen[path] = true;
            arr1.push(path);
        }
    }
};

module.exports.glob_list = function (working_dir, target_list, glob_list, callback) {
    if (!glob_list) {
        callback();
        return;
    }

    var done = lodash.after(glob_list.length, callback);
    var seen = {};
    for (var i in glob_list) {
        var glob_path = glob_list[i];
        glob(path.join(working_dir, glob_path), function (err, results) {
            // extend target_list with the glob operations results
            module.exports.dedupe_extend(target_list, results, seen);
            done();
        });
    }
};

module.exports.loader_from_globlist = function (Class, working_dir, list, callback) {
    /*
     * Inits a Resource Loader (e.g. TagLoader or StyleLoader) from a list of globs
     */
    var groups = [];
    var start = function () {
        // Resolve and concatenates all globs
        var done = lodash.after(list.length, do_load);
        for (var i in list) {
            var info = list[i];
            var paths = [];
            if (!info.paths) {
                console.error("WARNING: No paths specified", info);
                done();
                continue;
            }

            groups.push({ namespace: info.namespace, paths: paths });
            exports.glob_list(working_dir, paths, info.paths, done);
        }
    };

    var do_load = function () {
        var loader = new Class(groups);
        loader.load(function () {
            callback(loader);
        });
    };

    if (!list || list.length < 1) { do_load(); }
    else { start(); }
};

module.exports.autogen_globlist = function (root_dir, callback) {
    /*
    Generates a globlist to be fed to loader_from_globlist to then create a
    loader.  For example:
    "tags/" -> [{paths: ["tags/basic/**.cfg"], namespace: "basic"}, ...]
    */
    // NOTE: windows gotcha: need to make sure glob is using forward slashes
    glob(path.join(root_dir, "*/"), function (err, results) {
        if (err) { throw "glob: " + err; }
        var globlist = results.map(function (p) {
            return {
                namespace: path.basename(p),
                paths: [path.resolve(path.join(p, "**", "*.cfg"))],
            }
        });
        callback(globlist);
    });
};

module.exports.autoloader = function (Class, root_dir, callback) {
    /* Loads everything in the directory */
    module.exports.autogen_globlist(root_dir, function (globlist) {
        module.exports.loader_from_globlist(Class, "", globlist, callback);
    });
};

module.exports.defaultfile = function (p, data, callback) {
    /* Write a file to a path, if it does not exist */
    fs.exists(p, function (exists) {
        if (!exists) {
            mkdirp(path.dirname(p), function (err, made) {
                if (err) { throw "defaultfile mkdirp:" + err; }
                fs.writeFile(p, data, function (err) {
                    callback(err, true);
                });
            });
        } else {
            callback(null, false);
        }
    });
};

module.exports.defaultfilecopy = function (p, source_path, callback) {
    /* 
    Same as above, but from a source path, optionally transmogrifying the file
    in the process.
    */
    var modify = null, skipdirs=false;
    if (!source_path) {
        // single arg
        skipdirs = p.skipdirs;
        source_path = p.source;
        modify = p.modify;
        callback = p.callback;
        p = p.destination;
    }


    var do_it = function () {
        fs.readFile(source_path, function (err, data) {
            if (err) { throw "defaultfilecopy: " + err; };
            if (modify) { data = modify(data); }
            exports.defaultfile(p, data, callback);
        });
    };

    if (skipdirs) {
        fs.stat(source_path, function (err, stat) {
            if (err) { return  callback(err, false); }
            else if (stat.isFile()) { do_it(); }
            else { callback(null, false); }
        });
    } else {
        do_it();
    }
};


var tar_extract = function (from, to, callback) {
    var on_error = function (err) { throw "Tar extract error: " + err; }
    var on_end  = function() { callback(); }

    var extractor = tar.Extract({path: to})
        .on('error', on_error)
        .on('end', on_end);

    //fs.createReadStream(__dirname + from)
    fs.createReadStream(from)
        .on('error', on_error)
        .pipe(extractor);
};


var scrollfile_sorter = function (a, b) {
    // .scrollid < manifest.cfg < everything else
    if (a === '.scrollid')    { return -1; };
    if (b === '.scrollid')    { return  1; };
    if (a === 'manifest.cfg') { return -1; };
    if (b === 'manifest.cfg') { return  1; };
    return 0;
};

var fstream = require("fstream");
var tar_pack = function (from, to, callback) {
    /*
     * Packs a directory into a tar file, ensuring the following order:
     * .scrollid comes before manifest.cfg, and both of those files come before
     * everything else
     */
    var on_error = function (err) { throw "Tar pack error: " + err; }
    var on_end  = function() { callback(); }
    var dir_dest = fs.createWriteStream(to)

    var packer = tar.Pack({ noProprietary: true })
        .on('error', on_error)
        .on('end', on_end);

    fstream.Reader({ path: from, type: "Directory",
                     sort: scrollfile_sorter })
        .on('error', on_error)
        .pipe(packer)
        .pipe(dir_dest);
};



module.exports.tar = {
    extract: tar_extract,
    pack: tar_pack,
};


module.exports.copyfile = function (source, target, cb) {
    // thanks to SO #11293857
    var cb_called = false;
    var done = function (err) {
        if (!cb_called) {
            cb(err);
            cb_called = true;
        }
    };

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) { done(err); });

    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) { done(err); });
    wr.on("close", function (ex)  { done(); });
    rd.pipe(wr);
};

module.exports.copyfilelist = function (list, source, destination, callback) {
    // Copies a list of file names, assumed to be in "source" directory, to
    // "destination" directory, then calls callback on success
    var done = lodash.after(list.length, callback);
    list.forEach(function (filename) {
        var src_path = path.join(source, filename);
        var dst_path = path.join(destination, filename);
        module.exports.copyfile(src_path, dst_path, function (err) {
            if (err) { throw "Cannot copy file list: " + err; }
            done();
        });
    });
};


module.exports.check_scroll_file = function (path, callback) {
    fs.open(path, 'r', function (err, fd) {
        if (err) { throw err; }
        var buffer = new Buffer(consts.SCROLL_MAGIC.length);
        var start = 0, offset = 0, length = buffer.length;
        fs.read(fd, buffer, offset, length, start, function (err, num) {
            if (err) {
                // if the file is too small, etc, then throw error
                console.error(err);
                callback(false);
                return;
            }

            if (buffer.toString() === consts.SCROLL_MAGIC) {
                callback(true);
            } else {
                callback(false);
            }
        });
    });
};

