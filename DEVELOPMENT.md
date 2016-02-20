## WIP

`libscroll` is incomplete. This document represents the goal of the interface,
e.g. I decided to document the libraries api before writing it. Much of the
work has already been done in the le2 package, its just a matter of massaging
it into a sane interface.

-------

# Definitions

## .scroll file format

Scroll files consist of a tarball containing a directory named `scroll-tar`.
Thus, due to the nature of tarballs, Scroll files must begin with the ASCII
bytes `scroll-tar`. The `scroll-tar` directory is the same directory, when
unzipped, that constitutes the Scroll Workspace.

The first file tarred into a `.scroll` file, within a that `scroll-tar`
directory, should be `.scrollid`. This file contains a UUID for the Workspace.
The next file should be the Workspace's `manifest.cfg`. This file contains
meta-data about the Workspace, such as authorship information.

Now, if the `.scroll` file is git-based, the only other file or directory
within the top level `scroll-tar` directory must be a bare git repo named
`scroll.git`. 

If the `.scroll` file is not git-based, then the remaining contents of the
`scroll-tar` directory constitute the entirety of the Scroll Workspace.

## Scroll Workspace

A Scroll Workspace might colloquially be thought of as a "Scroll Document". It
is analogous to the contents of an unzipped OpenXML document, or an unzipped
ePub document. The term Workspace is used to avoid confusion between the
`.scroll` file-format, and the standard case when Workspaces are untarred into
a user's home directory for use.

## Config system

A Scroll editor user, whether using the GUI or CLI version of Scroll will have
the following artifacts in their home directory:

* `.config/scroll/workspaces/` - this is where workspaces live, each living in
  a directory named with the scroll workspace's UUID

* `.config/scroll/stash/` - here we have saved Scroll objects

## Rational behind .scrollid

The scroll system lends itself to decentralized editing. This means that scroll
file names cannot be trusted to track the identity and history of the scroll
file. Thus, to merge two versions of a scroll file, whether using git or not,
we need to identify that `mydocument.scroll` and `janesdocument.scroll` refer
to two different versions of the same workspace.

# mods: Programmatic interface

The `mods` directory contains most of the `libscroll` functionality, exposed
through discrete classes that inherit from ScrollObject.

## ScrollObject Base Class

### static

- `static load(workspace, filehandle, callback)`

    - Loads the given ScrollObject into memory. In general, this  is not used
      directly, since  you can just instantiate a ScrollWorkspace that will
      load for you

## ScrollContainer

```javascript
const ScrollContainer = require('libscroll/mods/workspace/ScrollContainer');
```

### static

- `static load(path, callback)`

   - TODO


## ScrollWorkspace

```javascript
const ScrollWorkspace = require('libscroll/mods/workspace/ScrollWorkspace');
```

### static

- `static load(workspace, filehandle, callback)`

   - In the case of ScrollWorkspace, this loads the entire workspace into
     memory: filehandle must point to `manifest.cfg` file.  `workspace` should
     be null.

- `constructor(manifest, objects)`

    - Creates a new workspace with given manifest info and objects


### public properties

- `objects`

    - An Array-like object of loaded sub-objects

    - For specific types of objects, use, for example, `objects.document` or
      `objects.style`

## Filetype

```javascript
const Filetype = require('libscroll/mods/workspace/Filetype');
```

### static

- `constructor(object_constructor,  matcher)`

    - Constructs a new FileType object with the giv
      given TreeParser, the given ScrollMarkdownParser, and the given
      EditorRenderer, which should all be already fully loaded.

- `load_all(filetypes, paths, callback)`

    - Using a list of filetypes, load all the ScrollObjects associated the
      given list of paths, and call the callback with that list

### static properties

- `defaults` 

    - A list of pre-instantiated file types, used to bootstrap everything

## Document

```javascript
const Document = require('libscroll/mods/document/Document');
```

### static

- `constructor(contents, structure, parser, editor_parser, editor_renderer)`

    - Constructs a new Document object with the given StructureObject, the
      given TreeParser, the given ScrollMarkdownParser, and the given
      EditorRenderer, which should all be already fully loaded.

### public properties

- `structure`
- `parser` - the TreeParser
- `editor_parser` - a flat-parser (for editor reading)
- `editor_renderer` - a flat-renderer (for editor export)

## Tag

Tags represent a single Tag in a Document, e.g. a Markdown tag.

```javascript
const Tag = require('libscroll/mods/document/Tag');
```

### static

TODO
