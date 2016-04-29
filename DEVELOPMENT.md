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
directory, should be named `.scrollid`. This file contains a UUID for the
Workspace.  The next file should be the Workspace's `manifest.cfg`. This file
contains meta-data about the Workspace, such as authorship information.

Now, if the `.scroll` file is git-based, the only other file or directory
within the top level `scroll-tar` directory must be a bare git repo named
`scroll.git`.

If the `.scroll` file is not git-based, then the remaining contents of the
`scroll-tar` directory constitute the entirety of the Scroll Workspace.

## Scroll Workspace

A Scroll Workspace might colloquially be thought of as a "Scroll Document". It
is analogous to the contents of an unzipped OpenXML (docx) document, or an
unzipped ePub document. The term Workspace is used to avoid confusion between
the `.scroll` file-format, and the standard case when Workspaces are untarred
into a user's home configuration directory for use.

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

### abstract static methods

- `abstract static load(workspace, path, callback)`

    - Loads the given ScrollObject into memory. In general, this is not used
      directly, since  you can just instantiate a ScrollWorkspace that will
      load for you


### static methods

- `static new_from_cfg(constructor, path, callback)`

    - Helper method that loads the given CFG file, parses it, and instantiates
      a constructor based on the given callback

- `static new_from_binary(constructor, path, callback)`

    - Similar to above, except it won't read the contents into
      memory. Good for binary media.

- `static reload(scrollobj, new_content)`

    - Constructs a new version of ScrollObj, filled with the given
      new content, assuming new_content is a string of conf data.


### public properties

- `typename` -- this is an all lowercase name of this type, e.g.
  'document' for Document, 'tag' for Tag

- `path` -- relative path for object, relative to workspace dir

- `fullpath` -- absolute path for object on file-system

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

- `constructor(base_path, objects, manifest = {})`

    - Creates a new workspace with given manifest info and objects

### public methods

- `read(path, callback)`
    - wraps around `fs.readFile`, given a subpath it will read its
      contents and call callback

- `write(path, contents, callback)`
    - wraps around `fs.writeFile`, given a subpath it will write
      the given contents and call callback on success

- `static reload(scrollobj, new_content)`

    - Swaps the given ScrollObj with a new version with the given
      new content.

- `new_atomic_change(object, new_content, change_description)` -- Returns
  atomic change object that can be used to save a change to disk

- `save_change(atomic_change, callback)` -- Actually "commits" atomic change to
  disk

### public properties

- `base_path` - location of the ScrollWorkspace

- `objects`

    - An Array-like object of loaded sub-objects

    - For specific types of objects, use, for example, `objects.document` or
      `objects.style`

## Filetype

```javascript
const Filetype = require('libscroll/mods/workspace/Filetype');
```

### static

- `constructor(object_constructor, [matcher])`

    - Constructs a new FileType object
    - Matcher can be a function or a regexp to be applied to the path. If not
      specified, defaults to guessing filetype based on directory and classname
      (e.g., 'Tag' goes in 'tags')

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

- `constructor(contents, parser, editor_parser, editor_renderer)`

    - Constructs a new Document object with the given the
      given TreeParser, the given ScrollMarkdownParser, and the given
      EditorRenderer, which should all be already fully loaded.

### public methods

- `new_renderer(target, style_name)`

    - Constructs a new EditorRenderer or StyleRenderer base on
      target. `style_name` should identify the style being used (in
      object matcher syntax)

- `new_parser(target, structure_name = null)`

    - Constructs a new ScrollMarkdownParser, TreeParser or
      UnstructuredTreeParser based on the `target` and
      `structure_name`. Logic follows.
    - If `target` is `'editor'`, then `ScrollMarkdownParser`
    - If `structure_name` is `null`, then it uses an
      UnstructuredTreeParser (e.g. one that mimicks input tag
      structure)
    - Otherwise, it assumes `structure_name` is an object matcher
      for a Structure that is then used to construct a `TreeParser`

- `editor_render(fragment, refresh = false, emit_source = false)`
    - Renders a markdown fragment. Use `refresh` to force reload
      tags and rebuild parser, and `emit_source` to control the
      existence of the `data=''` attribute on blocks which contains
      the source.

## Tag

Tags represent a single Tag in a Document, e.g. a Markdown tag.

```javascript
const Tag = require('libscroll/mods/document/Tag');
```

### static

- `constructor(validated_conf)`
    - `validated_conf`, object: validated schema-conf

### public properties
- `namespace`
- `name`
- `info`
    - parsed schema conf
- `tag_class`
    - in the form of `namespace_name`
- `css`, object: like `render_target: sanitized CSS`
- `containment`, ContainmentSet: info on which tags it can contain
    - Note that this is purely for the editor, and the markdown parser. It
        has nothing to do with the Structure of the final document

### public methods

- `get(type, targets, dont_fallback=false)`
    - `type`: one of 'css', or 'html'
    - `targets`: list of targets to try
    - `dont_fallback`: do not fallback onto 'editor' or 'default'
    - Gets a particular built-in rendering for this tag

- `is_symbol()` - returns true if tag is a "symbol" tag, e.g. a self-closing
  tag that is rendered into a single image or glyph without any special
  properties

- `is_block()` - returns true if tag is a "block-level" tag (in terms of the
  editor)

- `get_oldstyle_info()` - deprecated

## Structure

Structure holds the document structure. It is necessary when
rendering with a Style, since it turns a flat object (a Document)
into something fully hierarchical according to rules. For example,
a book might have a structure of a document contains volumes,
which contain parts, which contain chapters, which contain
sections, which in turn contain everything else.

Structures also contain ordering info. For example, in a book
Chapters and Appendices might exist at the same hierarchical
level, but Appendices are considered "back-matter" and thus belong
in the end of the book when published, and chapters are considered
"body-matter" and thus belong before the Appendices. Likewise for
"Forwards", "Epilogues", etc.


```javascript
const Structure = require('libscroll/mods/style/Structure');
```

### static

- `constructor(validated_conf)`

### public properties
- `namespace`
- `name`

### public methods
- `order_cmp(tag_a, tag_b)`
    - based on order, comparison function for ordering two tags (same interface as cmp)
- `hiearchy_cmp(tag_a, tag_b)`
    - like above, but based on hierarchy
- `filter_ordering(tag_context, taglist)` - deprecated

### useful constants

```
const {TEXT, TAG, OPEN_TAG, CLOSE_TAG, NODE_ENTER, NODE_EXIT, NODE}
    = require('libscroll/lib/parser/constants');
```

Constants that are the values returned by `order_cmp` (simply named versions of
-1, 0, and 1):

- `EQUAL` - The two tags are equal in hierarchy or order
- `LEFT_HIGHER` and `RIGHT_HIGHER`
- `LEFT_EARLIER` and `RIGHT_EARLIER`

More public constants:

- `ROOT` - Tag-like object which is used as the imaginary ROOT element
- `UNRANKED` - Means the given Tag cannot be ranked

## Style

Style represents an export style. It contains a set of rules for over-riding
the built-in styles in Tag. It also can contain document-level rendering rules
for different targets. The way to think of it is that styling info contained in
Styles is "top-down", while styling info contained in Tags is "bottom-up".

Styles can take advantage of a full templating engine (TinyTinyTemplates, the
syntax is similar to jinja or django templating systems).


```javascript
const Style = require('libscroll/mods/style/Style');
```

### static

- `constructor(namespace, name, validated_conf)`

### public methods
- `get_root()` - returns root template
- `get_style(tag)` - returns template for given tag


## Export

```javascript
const Export = require('libscroll/mods/export/Export');
```

TODO

## Image

```javascript
const Image = require('libscroll/mods/media/Image');
```

TODO

# Actions

- Document
    - `render(render_target)` - renders document to string (return value)
    - `publish(path, render_target)` - renders document to a given path
- ExportProfile
    - `publish(basedir = './build')` - renders entire project to
      base directory
- Structure
    - `tree(document)` - returns the tree
- Style
    - (none)
- Tag
    - (none)
